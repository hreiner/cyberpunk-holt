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
import { ExploreMap, nearestWalkableCell, posKey } from './exploreMap';
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
  | { kind: 'arrived' };

/** Instantané renvoyé par l'API de debug `explore()` (08-EXPLORATION.md "L'API de debug"). */
export interface ExploreDebugSnapshot {
  mapId: string;
  leader: Cell;
  followers: Cell[];
  objective: ObjectiveStatus | null;
  interactables: InteractableInfo[];
}

export class ExploreState {
  readonly map: ExploreMap;

  private readonly ctx: NarrativeContext;
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
    this.trail = [{ dist: 0, pos: { ...this.leaderPos } }];
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

  /** Point sur l'historique du meneur, à `lag` cases derrière lui (interpolation linéaire). */
  private followerPosition(lag: number): FloatCell {
    const targetDist = Math.max(0, this.totalDist - lag);
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
    const path = findPath(this.map, this.leaderCell(), cell, this.isWalkableAt);
    if (!path) return { ok: false, reason: 'Hors d’atteinte' };
    this.leaderPath = path;
    return { ok: true };
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
    const interactionCell = nearestWalkableCell(this.map, entity.cell, this.isWalkableAt);
    if (!interactionCell) return { ok: false, reason: 'Hors d’atteinte' };

    const from = this.leaderCell();
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

  listInteractables(): InteractableInfo[] {
    const leader = this.leaderCell();
    const reach = computeReach(this.map, leader, this.isWalkableAt);
    const out: InteractableInfo[] = [];
    for (const e of this.map.def.entities) {
      if (e.type === 'zone') continue;
      if (!this.isEntityActive(e)) continue;
      const interactionCell = nearestWalkableCell(this.map, e.cell, this.isWalkableAt);
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
    };
  }

  /** Téléporte le meneur (et le groupe) sans animation. */
  walkTo(x: number, y: number): void {
    const target = nearestWalkableCell(this.map, { x, y }, this.isWalkableAt) ?? this.leaderCell();
    this.leaderPos = { x: target.x, y: target.y };
    this.leaderPath = [];
    this.pendingInteraction = null;
    this.trail = [{ dist: this.totalDist, pos: { ...this.leaderPos } }];
  }

  /** Passe l'objectif courant, sans attendre le déclencheur réel (réservé au développement). */
  completeStep(): void {
    if (!this.objective || this.objectiveDone) return;
    this.objectiveDone = true;
    this.events.push({ kind: 'objective-complete', objectiveId: this.objective.id });
  }
}
