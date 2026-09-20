/**
 * État d'exploration : position du groupe, portes, déclencheurs tirés une
 * fois, objectif courant. Toute la logique décrite dans
 * docs/design/08-EXPLORATION.md vit ici, sans `three` ni DOM (ADR 0013 §5).
 *
 * Déterminisme : `tick(dtMs)` ne lit jamais l'horloge, seulement le `dtMs`
 * reçu (ADR 0013 §3 -- "le temps réel ne touche pas l'état de jeu"). Rejouer
 * la même séquence de `dtMs` produit toujours les mêmes positions.
 */

import type { NarrativeContext } from '@/narrative';
import { evaluateCondition } from '@/narrative';
import { ExploreMap, nearestAdjacentWalkableCell, nearestWalkableCell, posKey, roomAt } from './exploreMap';
import { computeReach, findPath, pathTo } from './pathing';
import type {
  Cell,
  DoorEntity,
  EntityDef,
  EntityType,
  MapDef,
  ObjectiveDef,
  ObjectiveTask,
} from './types';

/** Cases parcourues par seconde. Leader : 08-EXPLORATION.md "Contrôles". */
export const LEADER_SPEED = 4;
/** Distance de filature des coéquipiers, en cases (08-EXPLORATION.md "Le groupe"). */
export const FOLLOW_GAP = 1.5;

export type FloatCell = { x: number; y: number };

export interface ExploreStateOptions {
  /** Nom du spawn de départ (clé de `MapDef.spawns`). Par défaut le premier déclaré. */
  spawn?: string;
  /**
   * Identifiants des coéquipiers qui suivent Franklyn, dans l'ordre du
   * tirage. Vide avant le tirage : "Franklyn est seul" (08-EXPLORATION.md
   * "Le groupe").
   */
  followerIds?: string[];
  /**
   * Identifiants de pièces (`RoomDef.id`, PAS de clé composite carte) déjà découvertes pour
   * CETTE carte, à réappliquer sur une entrée à froid (`RunState.discoveredRooms`, voir
   * `discoveredRoomIdsForMap` dans `src/narrative/runState.ts`) -- 08-EXPLORATION.md "La
   * découverte des lieux" : "recharger une partie ne re-cache pas des pièces déjà visitées".
   * La pièce d'apparition est de toute façon découverte d'emblée, avec ou sans cette liste.
   */
  discoveredRooms?: string[];
}

export type InteractOutcome =
  | { kind: 'dialogue'; entityId: string; dialogueId: string; startNode?: string }
  | { kind: 'brief-line'; entityId: string; text: string }
  | { kind: 'door-toggled'; entityId: string; open: boolean }
  | { kind: 'door-locked'; entityId: string; line?: string }
  | { kind: 'change-map'; entityId: string; targetMapId: string; targetSpawn: string }
  | { kind: 'zone-trigger'; entityId: string }
  | { kind: 'none'; entityId: string; reason?: string };

export interface InteractableInfo {
  id: string;
  type: EntityType;
  cell: Cell;
  interactionCell: Cell;
  /** Verbe + cible, casse normale : "Parler à John" (08-EXPLORATION.md "Contrôles"). */
  label: string;
  /** Un chemin existe depuis la position courante du meneur jusqu'à `interactionCell`. */
  reachable: boolean;
}

export interface ObjectiveTaskStatus {
  id: string;
  label: string;
  count: number;
  target: number;
  done: boolean;
}

export interface ObjectiveStatus {
  id: string;
  title: string;
  context: string;
  tasks: ObjectiveTaskStatus[];
  complete: boolean;
}

export type ExploreEvent =
  | { kind: 'zone-triggered'; entityId: string }
  | { kind: 'interaction-fired'; entityId: string; outcome: InteractOutcome }
  | { kind: 'objective-task-progress'; taskId: string; count: number; target: number }
  | { kind: 'objective-complete'; objectiveId: string }
  | { kind: 'room-discovered'; roomId: string }
  | { kind: 'arrived' };

/** Instantané renvoyé par l'API de debug `explore()` (08-EXPLORATION.md "L'API de debug"). */
export interface ExploreDebugSnapshot {
  mapId: string;
  leader: Cell;
  followers: Cell[];
  objective: ObjectiveStatus | null;
  interactables: InteractableInfo[];
  /** Pièces découvertes cette partie sur CETTE carte (`RoomDef.id`, voir `discoveredRoomIds()`). */
  discoveredRooms: string[];
}

/**
 * Direction "arrière" par défaut à l'apparition (aucune direction de regard connue à cet
 * instant) : sud, cohérent avec la lecture haut→bas des plans ASCII (09-MAPS-CHAPTER-1.md).
 */
const SPAWN_BEHIND: FloatCell = { x: 0, y: 1 };

/**
 * Amorce l'historique de filature avec un segment synthétique "avant le spawn", pour que
 * `followerPosition` donne aux coéquipiers une position en formation dès l'apparition — sans
 * ce segment, `Math.max(0, totalDist - lag)` les ferait tous coïncider avec le meneur tant
 * qu'il n'a pas parcouru au moins `lag` cases (voir la revue de lot 3.5).
 */
function seedTrail(spawn: FloatCell, followerCount: number): { dist: number; pos: FloatCell }[] {
  const reach = followerCount * FOLLOW_GAP + FOLLOW_GAP;
  return [
    { dist: -reach, pos: { x: spawn.x + SPAWN_BEHIND.x * reach, y: spawn.y + SPAWN_BEHIND.y * reach } },
    { dist: 0, pos: { ...spawn } },
  ];
}

export class ExploreState {
  readonly map: ExploreMap;

  /**
   * Contexte narratif courant (drapeaux, dont `ch1.etape` -- voir `condition`
   * des entités). PAS `readonly` : deux étapes d'exploration qui se suivent
   * sur la MÊME carte réutilisent la même instance (`chapter.ts`, contrat du
   * lot 3.6b, "le spawn ne sert qu'à une entrée à froid") -- `updateContext`
   * permet à l'appelant de tenir cette référence à jour au fil des scènes,
   * plutôt que de reconstruire `ExploreState` (et perdre la position de
   * Franklyn) à chaque changement de drapeau.
   */
  private ctx: NarrativeContext;
  private readonly doorEntities = new Map<string, DoorEntity>();
  private readonly doorsOpen = new Map<string, boolean>();
  private readonly entitiesById = new Map<string, EntityDef>();

  private followerIds: string[];
  private leaderPos: FloatCell;
  private leaderPath: Cell[] = [];
  private pendingInteraction: { entityId: string; targetCell: Cell } | null = null;

  /** Historique {distance parcourue -> position}, pour la filature (voir `followerPosition`). */
  private trail: { dist: number; pos: FloatCell }[];
  private totalDist = 0;

  private readonly firedZones = new Set<string>();
  private objective: ObjectiveDef | null = null;
  private objectiveDone = false;
  private readonly taskCounted = new Map<string, Set<string>>();

  /**
   * Pièces découvertes cette partie, sur CETTE carte (08-EXPLORATION.md "La découverte des
   * lieux") : `RoomDef.id`, jamais de clé composite -- une `ExploreState` ne connaît qu'une
   * seule carte. Alimenté par `options.discoveredRooms` (reprise d'une sauvegarde) et par la
   * pièce d'apparition (toujours découverte d'emblée), puis par `checkRoomDiscovery()` au fil
   * de la partie.
   */
  private readonly discoveredRooms = new Set<string>();

  private events: ExploreEvent[] = [];

  constructor(def: MapDef, ctx: NarrativeContext, options: ExploreStateOptions = {}) {
    this.map = new ExploreMap(def);
    this.ctx = ctx;
    this.followerIds = options.followerIds ? [...options.followerIds] : [];

    for (const e of def.entities) {
      this.entitiesById.set(e.id, e);
      if (e.type === 'door') {
        this.doorEntities.set(posKey(e.cell), e);
        this.doorsOpen.set(e.id, !e.locked);
      }
    }

    const spawnName = options.spawn ?? Object.keys(def.spawns)[0];
    const spawn = spawnName ? def.spawns[spawnName] : undefined;
    if (!spawn) throw new Error(`Carte "${def.id}" : point d'apparition "${spawnName ?? ''}" introuvable`);
    this.leaderPos = { x: spawn.x, y: spawn.y };
    this.trail = seedTrail(this.leaderPos, this.followerIds.length);

    const validRoomIds = new Set(def.rooms.map((r) => r.id));
    for (const id of options.discoveredRooms ?? []) {
      if (validRoomIds.has(id)) this.discoveredRooms.add(id);
    }
    // La pièce d'apparition est découverte d'emblée, avec ou sans sauvegarde (08-EXPLORATION.md
    // "Attention au cas d'apparition : la pièce où il apparaît est découverte d'emblée").
    const spawnRoom = roomAt(def, this.leaderCell());
    if (spawnRoom) this.discoveredRooms.add(spawnRoom.id);
  }

  /* ------------------------------------------------------------------ */
  /* Franchissabilité (tient compte de l'état courant des portes)        */
  /* ------------------------------------------------------------------ */

  private isWalkableAt = (c: Cell): boolean => {
    return this.map.isWalkable(c, (cell) => this.isDoorOpenAtCell(cell));
  };

  private isDoorOpenAtCell(cell: Cell): boolean {
    const door = this.doorEntities.get(posKey(cell));
    if (!door) return true;
    return this.doorsOpen.get(door.id) ?? true;
  }

  isDoorOpen(entityId: string): boolean {
    return this.doorsOpen.get(entityId) ?? true;
  }

  /**
   * Force `entityId` à l'état ouvert, sans passer par `interact()` (lot 3.7b : une porte
   * verrouillée dont le dialogue vient de se résoudre -- `chapter.ts`, `unlockDoorIfNeeded`).
   * `computeOutcome()` ne déverrouille JAMAIS une porte `locked` elle-même (elle renvoie le
   * dialogue/`door-locked` tant que `entity.locked` reste vrai, voir plus bas) : sans cet appel
   * explicite après la conversation, la case resterait bloquée pour de bon malgré une scène
   * déjà jouée en entier -- un vrai blocage de progression, pas un détail cosmétique.
   */
  forceDoorOpen(entityId: string): void {
    const entity = this.entitiesById.get(entityId);
    if (!entity || entity.type !== 'door') return;
    this.doorsOpen.set(entityId, true);
  }

  /* ------------------------------------------------------------------ */
  /* Position, simulation                                                */
  /* ------------------------------------------------------------------ */

  leaderCell(): Cell {
    return { x: Math.round(this.leaderPos.x), y: Math.round(this.leaderPos.y) };
  }

  leaderPosition(): FloatCell {
    return { ...this.leaderPos };
  }

  isMoving(): boolean {
    return this.leaderPath.length > 0;
  }

  /** Positions continues des coéquipiers, dans l'ordre du tirage. */
  followerPositions(): FloatCell[] {
    return this.followerIds.map((_, i) => this.followerPosition((i + 1) * FOLLOW_GAP));
  }

  followerCells(): Cell[] {
    return this.followerPositions().map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  }

  setFollowers(ids: string[]): void {
    this.followerIds = [...ids];
  }

  /**
   * Remplace le contexte narratif lu par `isEntityActive` (drapeaux, dont
   * `ch1.etape`) -- voir la note sur `ctx` plus haut. `chapter.ts` l'appelle
   * chaque fois que son propre contexte change pendant que cette instance
   * reste active (nouvelle étape sur la même carte, conversation annexe
   * terminée, ...).
   */
  updateContext(ctx: NarrativeContext): void {
    this.ctx = ctx;
  }

  /** Point sur l'historique du meneur, à `lag` cases derrière lui (interpolation linéaire). */
  private followerPosition(lag: number): FloatCell {
    // Pas de bornage à 0 : le segment synthétique posé par `seedTrail` couvre les distances
    // négatives, ce qui donne aux coéquipiers une position "en formation" dès l'apparition
    // au lieu de les faire coïncider avec le meneur tant qu'il n'a pas assez marché.
    const targetDist = this.totalDist - lag;
    let prev = this.trail[0] as { dist: number; pos: FloatCell };
    for (const point of this.trail) {
      if (point.dist >= targetDist) {
        const span = point.dist - prev.dist;
        const t = span > 0 ? (targetDist - prev.dist) / span : 0;
        return {
          x: prev.pos.x + (point.pos.x - prev.pos.x) * t,
          y: prev.pos.y + (point.pos.y - prev.pos.y) * t,
        };
      }
      prev = point;
    }
    return { ...prev.pos };
  }

  /**
   * Fait avancer la simulation de `dtMs` millisecondes : déplacement du
   * meneur (et donc, indirectement, des coéquipiers), résolution d'une
   * interaction en attente à l'arrivée, déclenchement des zones. Renvoie les
   * événements survenus pendant cet appel (voir `drainEvents` pour les
   * événements posés hors de `tick`, ex. par `interact()`).
   */
  tick(dtMs: number): ExploreEvent[] {
    const dt = Math.max(0, dtMs) / 1000;
    if (dt > 0 && this.leaderPath.length > 0) this.advanceLeader(dt);
    this.checkRoomDiscovery();
    this.checkZones();
    return this.drainEvents();
  }

  drainEvents(): ExploreEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  private advanceLeader(dt: number): void {
    let budget = LEADER_SPEED * dt;
    while (budget > 0 && this.leaderPath.length > 0) {
      const next = this.leaderPath[0] as Cell;
      const dx = next.x - this.leaderPos.x;
      const dy = next.y - this.leaderPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= budget || dist === 0) {
        this.leaderPos = { x: next.x, y: next.y };
        this.leaderPath.shift();
        this.totalDist += dist;
        budget -= dist;
      } else {
        const t = budget / dist;
        this.leaderPos = { x: this.leaderPos.x + dx * t, y: this.leaderPos.y + dy * t };
        this.totalDist += budget;
        budget = 0;
      }
    }
    this.pushTrail();

    if (this.leaderPath.length === 0) {
      this.events.push({ kind: 'arrived' });
      this.resolvePendingInteraction();
    }
  }

  private pushTrail(): void {
    this.trail.push({ dist: this.totalDist, pos: { ...this.leaderPos } });
    // Purge ce qui est plus vieux que le plus long décalage encore utile.
    const maxLag = this.followerIds.length * FOLLOW_GAP + FOLLOW_GAP;
    const cutoff = this.totalDist - maxLag - 2;
    while (this.trail.length > 2 && (this.trail[1] as { dist: number }).dist < cutoff) this.trail.shift();
  }

  private resolvePendingInteraction(): void {
    if (!this.pendingInteraction) return;
    const { entityId } = this.pendingInteraction;
    this.pendingInteraction = null;
    const outcome = this.interact(entityId);
    this.events.push({ kind: 'interaction-fired', entityId, outcome });
  }

  /**
   * Découvre la pièce sous le meneur, si ce n'est pas déjà fait (08-EXPLORATION.md "La
   * découverte des lieux" : "une pièce est découverte quand Franklyn y entre, et le reste pour
   * la partie"). Sans effet dans un couloir/extérieur (`roomAt` renvoie `undefined`) ou dans une
   * pièce déjà découverte -- jamais d'événement en double.
   */
  private checkRoomDiscovery(): void {
    const room = roomAt(this.map.def, this.leaderCell());
    if (!room || this.discoveredRooms.has(room.id)) return;
    this.discoveredRooms.add(room.id);
    this.events.push({ kind: 'room-discovered', roomId: room.id });
  }

  /** Pièces découvertes cette partie (`RoomDef.id`) -- à persister dans `RunState.discoveredRooms` (voir `discoverRoom`). */
  discoveredRoomIds(): string[] {
    return [...this.discoveredRooms];
  }

  /**
   * Vrai si `roomId` est découverte, ou n'a pas besoin de l'être : une pièce inconnue de cette
   * carte (défensif), une pièce `alwaysDiscovered` (la cour de containers), ou une pièce déjà
   * visitée. 08-EXPLORATION.md "La découverte des lieux".
   */
  isRoomDiscovered(roomId: string): boolean {
    const room = this.map.def.rooms.find((r) => r.id === roomId);
    if (!room) return true;
    return room.alwaysDiscovered === true || this.discoveredRooms.has(roomId);
  }

  /**
   * Une entité est visible (survolable, cliquable, listée -- 08-EXPLORATION.md "La découverte
   * des lieux" : "rien ne fuite par un autre canal") si elle est active (`condition`) et, pour
   * un `npc`/`object`/`seat`, si la pièce qui la porte est découverte. Les couloirs/extérieurs
   * (`roomAt` renvoie `undefined`) sont toujours visibles. Portes et sorties restent
   * structurelles ("garde sa forme -- murs, porte, dimensions") : cette règle ne les concerne
   * pas, seul `isEntityActive` s'applique à elles.
   */
  private isEntityVisible(e: EntityDef): boolean {
    if (!this.isEntityActive(e)) return false;
    if (e.type !== 'npc' && e.type !== 'object' && e.type !== 'seat') return true;
    const room = roomAt(this.map.def, e.cell);
    if (!room) return true;
    return this.isRoomDiscovered(room.id);
  }

  private checkZones(): void {
    for (const e of this.map.def.entities) {
      if (e.type !== 'zone') continue;
      if (this.firedZones.has(e.id)) continue;
      if (!this.isEntityActive(e)) continue;
      const leader = this.leaderCell();
      if (
        leader.x >= e.area.origin.x &&
        leader.y >= e.area.origin.y &&
        leader.x < e.area.origin.x + e.area.width &&
        leader.y < e.area.origin.y + e.area.height
      ) {
        this.firedZones.add(e.id);
        this.events.push({ kind: 'zone-triggered', entityId: e.id });
        this.handleTriggered(e.id);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Déplacement demandé par le joueur (clic)                            */
  /* ------------------------------------------------------------------ */

  /**
   * Déplace le meneur jusqu'à `cell` (chemin A*, marche continue via `tick`).
   * Une case inaccessible retombe sur la plus proche accessible
   * (08-EXPLORATION.md "Contrôles"). Annule toute interaction en attente.
   */
  walkLeaderTo(cell: Cell): { ok: boolean; reason?: string } {
    this.pendingInteraction = null;
    const target = this.resolveWalkTarget(cell);
    const path = findPath(this.map, this.leaderCell(), target, this.isWalkableAt);
    if (!path) return { ok: false, reason: 'Hors d’atteinte' };
    this.leaderPath = path;
    return { ok: true };
  }

  /**
   * Ramène `cell` à la case d'interaction de l'entité `npc`/`object` qui l'occupe, s'il y en a
   * une (08-EXPLORATION.md "Contrôles" : "on ne marche jamais sur une entité... Seul un `seat`
   * s'occupe : on s'assoit dessus, c'est le geste") -- une porte/sortie/siège n'est jamais
   * redirigée (sa case EST la destination normale). N'agit que sur une entité `isEntityVisible`
   * : une entité d'une pièce non découverte ne doit jamais dévier un ordre de déplacement, sous
   * peine de trahir sa présence par un arrêt inexpliqué ("rien ne fuite par un autre canal").
   */
  private resolveWalkTarget(cell: Cell): Cell {
    const entity = this.map.def.entities.find(
      (e) =>
        (e.type === 'npc' || e.type === 'object') &&
        e.cell.x === cell.x &&
        e.cell.y === cell.y &&
        this.isEntityVisible(e),
    );
    if (!entity) return cell;
    return this.interactionCellFor(entity, this.leaderCell()) ?? cell;
  }

  /**
   * Flux normal d'interaction (08-EXPLORATION.md "Contrôles" : "le
   * personnage marche jusqu'à la case d'interaction, [...] puis l'action se
   * déclenche"). Le déclenchement effectif arrive dans un `tick()` ultérieur,
   * sous forme d'événement `interaction-fired`.
   */
  requestInteract(entityId: string): { ok: boolean; reason?: string } {
    const entity = this.entitiesById.get(entityId);
    if (!entity || entity.type === 'zone') return { ok: false, reason: 'Hors d’atteinte' };
    const from = this.leaderCell();
    const interactionCell = this.interactionCellFor(entity, from);
    if (!interactionCell) return { ok: false, reason: 'Hors d’atteinte' };

    if (from.x === interactionCell.x && from.y === interactionCell.y) {
      this.pendingInteraction = null;
      const outcome = this.interact(entityId);
      this.events.push({ kind: 'interaction-fired', entityId, outcome });
      return { ok: true };
    }

    const reach = computeReach(this.map, from, this.isWalkableAt);
    const path = pathTo(reach, interactionCell);
    if (!path) return { ok: false, reason: 'Hors d’atteinte' };
    this.leaderPath = path;
    this.pendingInteraction = { entityId, targetCell: interactionCell };
    return { ok: true };
  }

  /* ------------------------------------------------------------------ */
  /* Interactables                                                       */
  /* ------------------------------------------------------------------ */

  private isEntityActive(e: EntityDef): boolean {
    return !e.condition || evaluateCondition(e.condition, this.ctx);
  }

  /**
   * Case où se placer pour interagir avec `entity`, la plus proche de
   * `fromCell` (08-EXPLORATION.md "Interaction"). Deux exceptions à "toujours
   * une case adjacente, jamais la case de l'entité elle-même" : `seat` (on
   * s'assoit DESSUS) et `exit` (on la FRANCHIT, `nearestWalkableCell` peut
   * donc renvoyer sa propre case si elle est déjà franchissable). `zone` n'a
   * pas de case d'interaction (invisible, se déclenche en marchant dedans) --
   * jamais appelée pour ce type, voir les deux appelants.
   */
  private interactionCellFor(entity: EntityDef, fromCell: Cell): Cell | null {
    if (entity.type === 'seat' || entity.type === 'exit') {
      return nearestWalkableCell(this.map, entity.cell, this.isWalkableAt);
    }
    return nearestAdjacentWalkableCell(this.map, entity.cell, this.isWalkableAt, fromCell);
  }

  /**
   * Ce que le JOUEUR peut survoler/cliquer/atteindre au clavier (Tab) -- et donc aussi ce que
   * `explore()` (API de debug) rapporte : actif ET découvert (08-EXPLORATION.md "La découverte
   * des lieux" -- "rien ne fuite par un autre canal"). L'instantané de debug est un miroir de
   * l'état du jeu, pas une vue "développeur" à part : une entité qu'un vrai joueur ne peut pas
   * viser n'y figure pas non plus, sous peine qu'un test de bout en bout reste vert en pilotant
   * ce qui n'est pas atteignable en jouant. `interact(entityId)`, lui, reste volontairement
   * permissif (voir sa docstring) : c'est l'outil de développement assumé, pas cette liste.
   */
  listInteractables(): InteractableInfo[] {
    const leader = this.leaderCell();
    const reach = computeReach(this.map, leader, this.isWalkableAt);
    const out: InteractableInfo[] = [];
    for (const e of this.map.def.entities) {
      if (e.type === 'zone') continue;
      if (!this.isEntityVisible(e)) continue;
      const interactionCell = this.interactionCellFor(e, leader);
      if (!interactionCell) continue;
      out.push({
        id: e.id,
        type: e.type,
        cell: e.cell,
        interactionCell,
        label: this.labelFor(e),
        reachable: reach.costs.has(posKey(interactionCell)),
      });
    }
    return out;
  }

  /** Sous-ensemble de `listInteractables()` dont la case est à `radius` cases (Chebyshev) de `cell`. */
  interactablesNear(cell: Cell, radius = 1): InteractableInfo[] {
    return this.listInteractables().filter(
      (i) => Math.max(Math.abs(i.cell.x - cell.x), Math.abs(i.cell.y - cell.y)) <= radius,
    );
  }

  private labelFor(e: EntityDef): string {
    if ('label' in e && e.label) return e.label;
    switch (e.type) {
      case 'npc':
        return `Parler à ${e.id}`;
      case 'object':
        return `Examiner ${e.id}`;
      case 'seat':
        return `S’asseoir`;
      case 'door':
        return this.isDoorOpen(e.id) ? 'Fermer la porte' : 'Ouvrir la porte';
      case 'exit':
        return 'Sortir';
      default:
        return e.id;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Déclenchement d'une entité                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Déclenche `entityId` immédiatement, sans marcher — API de debug
   * `interact(entityId)` (08-EXPLORATION.md "L'API de debug"), et point
   * commun avec la résolution différée de `requestInteract`.
   */
  interact(entityId: string): InteractOutcome {
    const entity = this.entitiesById.get(entityId);
    if (!entity) return { kind: 'none', entityId, reason: 'Entité introuvable' };
    if (!this.isEntityActive(entity)) return { kind: 'none', entityId, reason: 'Indisponible' };

    const outcome = this.computeOutcome(entity);
    this.handleTriggered(entityId);
    return outcome;
  }

  private computeOutcome(entity: EntityDef): InteractOutcome {
    switch (entity.type) {
      case 'npc':
      case 'object':
        if (entity.dialogueId) {
          return { kind: 'dialogue', entityId: entity.id, dialogueId: entity.dialogueId, startNode: entity.startNode };
        }
        if (entity.line) return { kind: 'brief-line', entityId: entity.id, text: entity.line };
        return { kind: 'none', entityId: entity.id };

      case 'seat':
        if (entity.dialogueId) {
          return { kind: 'dialogue', entityId: entity.id, dialogueId: entity.dialogueId, startNode: entity.startNode };
        }
        return { kind: 'none', entityId: entity.id };

      case 'door': {
        const open = this.isDoorOpen(entity.id);
        if (entity.locked && !open) {
          if (entity.dialogueId) {
            return {
              kind: 'dialogue',
              entityId: entity.id,
              dialogueId: entity.dialogueId,
              startNode: entity.startNode,
            };
          }
          return { kind: 'door-locked', entityId: entity.id, line: entity.lockedLine };
        }
        const next = !open;
        this.doorsOpen.set(entity.id, next);
        return { kind: 'door-toggled', entityId: entity.id, open: next };
      }

      case 'exit':
        return {
          kind: 'change-map',
          entityId: entity.id,
          targetMapId: entity.targetMapId,
          targetSpawn: entity.targetSpawn,
        };

      case 'zone':
        return { kind: 'zone-trigger', entityId: entity.id };
    }
  }

  private handleTriggered(entityId: string): void {
    if (this.objective && !this.objectiveDone && this.objective.completionTrigger === entityId) {
      this.objectiveDone = true;
      this.events.push({ kind: 'objective-complete', objectiveId: this.objective.id });
    }
    if (!this.objective?.tasks) return;
    for (const task of this.objective.tasks) {
      if (!task.entityIds.includes(entityId)) continue;
      const set = this.taskCounted.get(task.id) ?? new Set<string>();
      if (set.has(entityId)) continue;
      set.add(entityId);
      this.taskCounted.set(task.id, set);
      this.events.push({
        kind: 'objective-task-progress',
        taskId: task.id,
        count: set.size,
        target: task.entityIds.length,
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Objectif courant                                                    */
  /* ------------------------------------------------------------------ */

  setObjective(objective: ObjectiveDef | null): void {
    this.objective = objective;
    this.objectiveDone = false;
    this.taskCounted.clear();
  }

  objectiveStatus(): ObjectiveStatus | null {
    if (!this.objective) return null;
    const tasks: ObjectiveTaskStatus[] = (this.objective.tasks ?? []).map((t: ObjectiveTask) => {
      const count = this.taskCounted.get(t.id)?.size ?? 0;
      return { id: t.id, label: t.label, count, target: t.entityIds.length, done: count >= t.entityIds.length };
    });
    return {
      id: this.objective.id,
      title: this.objective.title,
      context: this.objective.context,
      tasks,
      complete: this.objectiveDone,
    };
  }

  /* ------------------------------------------------------------------ */
  /* API de debug (08-EXPLORATION.md "L'API de debug") -- noms exacts,   */
  /* exposés sur l'API globale de debug par le lot 3.6.                  */
  /* ------------------------------------------------------------------ */

  explore(): ExploreDebugSnapshot {
    return {
      mapId: this.map.id,
      leader: this.leaderCell(),
      followers: this.followerCells(),
      objective: this.objectiveStatus(),
      interactables: this.listInteractables(),
      discoveredRooms: this.discoveredRoomIds(),
    };
  }

  /** Téléporte le meneur (et le groupe, en formation) sans animation. */
  walkTo(x: number, y: number): void {
    const target = nearestWalkableCell(this.map, { x, y }, this.isWalkableAt) ?? this.leaderCell();
    this.leaderPos = { x: target.x, y: target.y };
    this.leaderPath = [];
    this.pendingInteraction = null;
    this.totalDist = 0;
    this.trail = seedTrail(this.leaderPos, this.followerIds.length);
    // Une téléportation de debug entre aussi dans une pièce (08-EXPLORATION.md "L'API de
    // debug" : les appels de debug se comportent comme un clic, ici sans marcher).
    this.checkRoomDiscovery();
  }

  /** Passe l'objectif courant, sans attendre le déclencheur réel (réservé au développement). */
  completeStep(): void {
    if (!this.objective || this.objectiveDone) return;
    this.objectiveDone = true;
    this.events.push({ kind: 'objective-complete', objectiveId: this.objective.id });
  }
}
