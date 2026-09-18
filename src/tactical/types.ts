/**
 * Types du module tactique (phase finale du chapitre 1 : opposition entre
 * containers). Ce module est volontairement SANS DEPENDANCE au rendu :
 * il ne doit jamais importer `three`. Voir docs/process/ARCHITECTURE.md.
 */

import type { CharacterId } from '@/rules/character';
import type { CheckResult } from '@/rules/dice';

export interface Vec2 {
  x: number;
  y: number;
}

export type TeamId = 'blue' | 'red';

/** Nature d'une case. Voir `src/data/yard-map.ts` pour la carte ASCII. */
export type CellKind =
  | 'floor' // sol libre
  | 'container' // container : bloque le passage ET la vue, couvert haut
  | 'crate' // caisses/barils : bloquent le passage, pas la vue, couvert bas
  | 'spawnBlue'
  | 'spawnRed';

export type ItemId = 'taser' | 'healkit' | 'hackingTool' | 'mine';

export type UnitStatus = 'active' | 'neutralized';

export interface Unit {
  id: CharacterId;
  team: TeamId;
  pos: Vec2;
  status: UnitStatus;
  /** Points de mouvement restants pour le tour en cours. */
  mp: number;
  /** L'action du tour a-t-elle deja ete depensee. */
  actionUsed: boolean;
  /** A couru a son dernier tour : plus facile a toucher jusqu'a son prochain tour. */
  exposed: boolean;
  /** Gaze en salle 3 (etat importe du parcours interieur) : -2 aux jets, -1 MOUV. */
  gassed: boolean;
  items: ItemId[];
  /** Initiative calculee au debut du combat (REF + d10, +1 si Fonceur). */
  initiative: number;
  /** Traits a usage limite deja consommes. */
  symbioseUsed: boolean;
  firstShotDone: boolean;
  cohesionUsedRound: number;
}

/** Bonus temporaire accorde par un reperage ou un encouragement. */
export interface PendingBonus {
  /** Beneficiaire. */
  unit: CharacterId;
  /** Si defini, le bonus ne s'applique qu'aux jets visant cette cible. */
  target?: CharacterId;
  value: number;
  label: string;
  /** Round au-dela duquel le bonus est perime. */
  expiresAfterRound: number;
}

export interface GroundItem {
  pos: Vec2;
  item: ItemId;
  /** Une mine posee est armee : elle declenche quand une unite entre sur la case. */
  armed: boolean;
}

export type CombatPhase = 'setup' | 'playing' | 'finished';

export type LogKind = 'system' | 'move' | 'check' | 'status' | 'ai' | 'result';

export interface LogEntry {
  round: number;
  kind: LogKind;
  /** Texte francais destine au journal affiche au joueur. */
  text: string;
  unit?: CharacterId;
  check?: CheckResult;
}

export interface TeamState {
  /** Kits de soin encore disponibles pour l'equipe. */
  healkits: number;
  /** Taser supplementaire obtenu en forcant l'armoire securisee (salle 2). */
  extraTaser: boolean;
  /** Membre gaze en salle 3, le cas echeant. */
  gassedMember: CharacterId | null;
}

export interface TacticalSetup {
  seed: string;
  blue: CharacterId[];
  red: CharacterId[];
  blueState: TeamState;
  redState: TeamState;
  /** Limite de rounds avant fin d'exercice. */
  roundLimit: number;
}

export type ActionType =
  | 'move'
  | 'run'
  | 'shoot'
  | 'melee'
  | 'heal'
  | 'spot'
  | 'encourage'
  | 'pickup'
  | 'placeMine'
  | 'endTurn';

export type Action =
  | { type: 'move'; to: Vec2 }
  | { type: 'run'; to: Vec2 }
  | { type: 'shoot'; target: CharacterId }
  | { type: 'melee'; target: CharacterId }
  | { type: 'heal'; target: CharacterId }
  | { type: 'spot'; target: CharacterId }
  | { type: 'encourage'; target: CharacterId }
  | { type: 'pickup' }
  | { type: 'placeMine'; at: Vec2 }
  | { type: 'endTurn' };

export interface ActionOutcome {
  ok: boolean;
  /** Raison de refus, en francais, affichable telle quelle. */
  reason?: string;
  check?: CheckResult;
}

export type Winner = TeamId | 'draw' | null;

export interface CombatState {
  phase: CombatPhase;
  round: number;
  /** Ordre d'initiative, identifiants d'unites. */
  order: CharacterId[];
  /** Index dans `order` de l'unite qui joue. */
  turnIndex: number;
  units: Record<CharacterId, Unit>;
  teams: Record<TeamId, TeamState>;
  ground: GroundItem[];
  bonuses: PendingBonus[];
  log: LogEntry[];
  winner: Winner;
  roundLimit: number;
  seed: string;
}
