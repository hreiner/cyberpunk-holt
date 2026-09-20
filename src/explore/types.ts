/**
 * Types du socle d'exploration (epic 3, lot 3.5). Contrat exact de
 * `MapDef` recopié de docs/design/09-MAPS-CHAPTER-1.md ("Format des
 * cartes") : ne pas dévier sans mettre à jour le document en même temps
 * (voir AGENTS.md, règle 7).
 *
 * Module volontairement SANS DÉPENDANCE à `three` ni au DOM (ADR 0013 §5) :
 * testable dans Node, comme `src/tactical` et `src/narrative`.
 */

import type { Condition } from '@/narrative';

/** Case de la grille d'exploration (1 case = 1 m, cf. 08-EXPLORATION.md). */
export interface Cell {
  x: number;
  y: number;
}

/** Rectangle de cases, coin nord-ouest + dimensions. */
export interface Rect {
  origin: Cell;
  width: number;
  height: number;
}

/**
 * Pièce nommée : sert au calcul des murs en coupe (quel côté est "entre la
 * caméra et l'intérieur") et, plus tard, au titre affiché à l'entrée.
 */
export interface RoomDef {
  id: string;
  title: string;
  rect: Rect;
}

export type EntityType = 'npc' | 'object' | 'seat' | 'door' | 'exit' | 'zone';

interface EntityBase {
  id: string;
  type: EntityType;
  /** Case occupée par l'entité (voir `validateMap` : sur une case accessible, ou adjacente). */
  cell: Cell;
  /** Condition d'apparition/activation (format des dialogues, réutilisé tel quel). */
  condition?: Condition;
}

/** Verbe + cible affichés au survol, ex. "Parler à John". Absent : un libellé par défaut est dérivé du type. */
interface Labeled {
  label?: string;
}

/** Réplique brève affichée en bulle (3 s), sans panneau ni effet — voir 08-EXPLORATION.md. */
interface BriefLine {
  line?: string;
}

/** Point d'entrée d'un dialogue (`DialogueFile.id` + noeud de `entries`). */
interface DialogueEntry {
  dialogueId?: string;
  startNode?: string;
}

export interface NpcEntity extends EntityBase, Labeled, BriefLine, DialogueEntry {
  type: 'npc';
}

export interface ObjectEntity extends EntityBase, Labeled, BriefLine, DialogueEntry {
  type: 'object';
}

export interface SeatEntity extends EntityBase, Labeled, DialogueEntry {
  type: 'seat';
}

export interface DoorEntity extends EntityBase, Labeled, DialogueEntry {
  type: 'door';
  /** Fermée au départ ? Par défaut `false` (ouverte). */
  locked?: boolean;
  /** Réplique brève jouée si on interagit alors que la porte est verrouillée sans dialogue. */
  lockedLine?: string;
}

export interface ExitEntity extends EntityBase, Labeled {
  type: 'exit';
  targetMapId: string;
  targetSpawn: string;
}

/** Invisible, se déclenche une fois en y entrant (ADR 0013 §4) : pas de label, pas de clic. */
export interface ZoneEntity extends EntityBase {
  type: 'zone';
  area: Rect;
}

export type EntityDef = NpcEntity | ObjectEntity | SeatEntity | DoorEntity | ExitEntity | ZoneEntity;

/** La cour de combat (`src/data/yard-map.ts`) embarquée dans une carte d'exploration. */
export interface TacticalAreaDef {
  origin: Cell;
  mapId: 'yard';
}

export interface MapDef {
  id: string;
  title: string;
  /** Une ligne par rangée, un caractère = une case de 1 m. Légende : 08-EXPLORATION / 09-MAPS. */
  ascii: string[];
  rooms: RoomDef[];
  entities: EntityDef[];
  spawns: Record<string, Cell>;
  tacticalArea?: TacticalAreaDef;
}

/** Caractère de carte -> nature de case (légende commune, 09-MAPS-CHAPTER-1.md). */
export type ExploreCellKind =
  | 'floor' // '.'
  | 'wall' // '#'
  | 'door' // '+' (l'état ouvert/fermé vient de l'entité `door` sur la même case)
  | 'glass' // '=' bloque le passage, pas la vue
  | 'furnitureLow' // 'o' bloque le passage, pas la vue
  | 'furnitureHigh' // 'T' bloque le passage ET la vue
  | 'vegetation' // '~' bloque le passage, pas la vue
  | 'void'; // ' ' hors carte

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Facultatif d'une étape (08-EXPLORATION.md "Les objectifs") : un compteur
 * progresse d'un cran la première fois que chaque entité de `entityIds` est
 * déclenchée (interaction ou zone).
 */
export interface ObjectiveTask {
  id: string;
  label: string;
  entityIds: string[];
}

/**
 * Objectif courant d'une étape d'exploration. `completionTrigger` est
 * l'identifiant de l'entité (ou zone) dont le déclenchement termine
 * l'objectif — voir ADR 0013 §4 ("la condition qui le termine").
 */
export interface ObjectiveDef {
  id: string;
  title: string;
  context: string;
  completionTrigger: string;
  tasks?: ObjectiveTask[];
}

