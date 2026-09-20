/**
 * Typage de `window.__game` cote tests end-to-end.
 *
 * Il est volontairement duplique (et non importe depuis `src/`) : les tests e2e
 * doivent valider le CONTRAT publie de l'API debug, pas les types internes.
 * Si ce fichier et `src/debug/gameApi.ts` divergent, c'est un vrai signal.
 */

export interface E2EUnit {
  id: string;
  team: 'blue' | 'red';
  status: 'active' | 'neutralized';
  x: number;
  y: number;
  mp: number;
  actionUsed: boolean;
  exposed: boolean;
  items: string[];
  initiative: number;
}

export interface E2EState {
  phase: 'setup' | 'playing' | 'finished';
  round: number;
  roundLimit: number;
  seed: string;
  winner: 'blue' | 'red' | 'draw' | null;
  current: string;
  order: string[];
  units: E2EUnit[];
  ground: Array<{ x: number; y: number; item: string; armed: boolean }>;
  healkits: { blue: number; red: number };
  logLength: number;
}

export interface E2EScore {
  total: number;
  max: number;
  mention: string;
  tags: string[];
}

/* --------------------------- narratif (ADR 0011) --------------------------- */

export type E2ESceneKind = 'dialogue' | 'tactical' | 'explore' | 'debrief';

export interface E2ESceneSnapshot {
  id: string;
  kind: E2ESceneKind;
  title: string;
  finished: boolean;
}

export interface E2EPresentedCheck {
  skillLabel: string;
  dvLabel: string;
  chancePercent: number;
}

export interface E2EPresentedChoice {
  index: number;
  text: string;
  check?: E2EPresentedCheck;
  /** Voir `PresentedChoice.best` dans src/narrative/dialogueRunner.ts (ADR 0012). */
  best?: boolean;
}

export interface E2EDialogueLine {
  who: string;
  text: string;
}

export interface E2EPresentedRollModifier {
  label: string;
  value: number;
}

/** Detail structure du dernier jet resolu (voir `PresentedRoll` dans src/narrative/dialogueRunner.ts). */
export interface E2EPresentedRoll {
  skillLabel: string;
  skillValue: number;
  attribute: string;
  attributeValue: number;
  who: string;
  dv: number;
  dvLabel: string;
  dieFaces: number[];
  dieValue: number;
  exploded: boolean;
  imploded: boolean;
  modifiers: E2EPresentedRollModifier[];
  total: number;
  success: boolean;
  margin: number;
  /** Points de Chance depenses sur ce jet (ADR 0015 §2). Absent hors Chance. */
  luckSpent?: number;
}

/** Jet de "reflexion" du noeud courant (examen ecrit, ADR 0012 ; facultatif avec cout, ADR 0015 §1). Voir `PresentedInsight`. */
export interface E2EPresentedInsight {
  skillLabel: string;
  dvLabel: string;
  chancePercent: number;
  status: 'pending' | 'available' | 'success' | 'failure';
  /** Vrai si ce jet est facultatif (ADR 0015 §1). */
  optional?: boolean;
  cost?: { counter: string; amount: number };
  /** Vrai si le compteur de `cost` suffit actuellement. */
  affordable?: boolean;
  roll?: E2EPresentedRoll;
  successText?: string;
  failureText?: string;
}

export interface E2EPresentedNode {
  nodeId: string;
  speaker?: string;
  speakerLabel?: string;
  text?: string;
  lines: E2EDialogueLine[];
  choices: E2EPresentedChoice[];
  lastRoll: string | null;
  /** Meme jet que `lastRoll`, sous forme structuree -- ajoute par la refonte UI dialogue (lot 2.11). */
  lastCheck: E2EPresentedRoll | null;
  /** Absent si le noeud courant n'a pas de `insight` (ADR 0012). */
  insight?: E2EPresentedInsight;
  /** Jet de Franklyn rate de peu et rattrapable a la Chance (ADR 0015 §2) : voir `spendLuck`/`acceptRoll`. */
  pendingRoll?: { roll: E2EPresentedRoll; missingBy: number; luckAvailable: number };
  finished: boolean;
}

export interface E2ETeamState {
  healkits: number;
  extraTaser: boolean;
  gassedMembers: string[];
}

export interface E2ETeamRoster {
  blue: string[];
  red: string[];
  redCaptain: string;
}

export interface E2ERunState {
  sceneId: string;
  flags: Record<string, string | number | boolean>;
  tempo: number;
  teams: { blue: E2ETeamState; red: E2ETeamState };
  /** Composition des equipes (ADR 0014 §7) -- distinct de `teams` (materiel). */
  roster: E2ETeamRoster;
  /** Chance restante de Franklyn pour le chapitre (ADR 0015 §2). */
  luck: number;
  heardRadio: string[];
  /** Pieces d'exploration decouvertes, cle composite "mapId:roomId" (08-EXPLORATION.md "La decouverte des lieux"). */
  discoveredRooms: string[];
  seed: string;
}

export interface E2EDossierEntry {
  key: string;
  label: string;
  value: string;
  chapter: number;
}

export interface E2EWrittenScore {
  correct: number;
  total: number;
}

export interface E2EDossier {
  version: number;
  candidate: string;
  tags: string[];
  affinities: Record<string, number>;
  entries: E2EDossierEntry[];
  practicalScore: E2EScore | null;
  /** Note de l'examen ecrit (scene 3, ADR 0012). */
  writtenScore: E2EWrittenScore | null;
  updatedAt: string;
}

/* --------------------------- exploration (ADR 0013, lot 3.6b) --------------------------- */

export interface E2ECell {
  x: number;
  y: number;
}

export type E2EEntityType = 'npc' | 'object' | 'seat' | 'door' | 'exit';

export interface E2EInteractable {
  id: string;
  type: E2EEntityType;
  cell: E2ECell;
  interactionCell: E2ECell;
  label: string;
  reachable: boolean;
}

export interface E2EObjectiveTask {
  id: string;
  label: string;
  count: number;
  target: number;
  done: boolean;
}

export interface E2EObjectiveStatus {
  id: string;
  title: string;
  context: string;
  tasks: E2EObjectiveTask[];
  complete: boolean;
}

export interface E2EExploreSnapshot {
  mapId: string;
  leader: E2ECell;
  followers: E2ECell[];
  objective: E2EObjectiveStatus | null;
  interactables: E2EInteractable[];
  /** RoomDef.id des pieces deja visitees cette partie sur cette carte (08-EXPLORATION.md "La decouverte des lieux"). */
  discoveredRooms: string[];
}

export type E2EInteractOutcome =
  | { kind: 'dialogue'; entityId: string; dialogueId: string; startNode?: string }
  | { kind: 'brief-line'; entityId: string; text: string }
  | { kind: 'door-toggled'; entityId: string; open: boolean }
  | { kind: 'door-locked'; entityId: string; line?: string }
  | { kind: 'change-map'; entityId: string; targetMapId: string; targetSpawn: string }
  | { kind: 'zone-trigger'; entityId: string }
  | { kind: 'none'; entityId: string; reason?: string };

/* --------------------------- tirage (ADR 0014) --------------------------- */

export type E2EDraftTurn = 'franklyn' | 'abigail' | 'done';

export interface E2EDraftPick {
  cadet: string;
  team: 'blue' | 'red';
}

export interface E2EDraftState {
  pool: string[];
  picks: E2EDraftPick[];
  turn: E2EDraftTurn;
}

export interface E2ERadioCue {
  id: string;
  atTempo: number;
  text: string;
}

export interface E2EGameApi {
  version: number;

  /* --- tactique (historique) --- */
  newGame(options?: { seed?: string; roundLimit?: number }): E2EState;
  state(): E2EState;
  perform(action: unknown): { ok: boolean; reason?: string };
  endTurn(): E2EState;
  aiTurn(): E2EState;
  flushAi(): E2EState;
  runToEnd(maxTurns?: number): E2EState;
  log(): string[];
  score(): E2EScore;
  setAiDelay(ms: number): void;

  /* --- narratif (ADR 0011) --- */
  scene(): E2ESceneSnapshot;
  goToScene(id: string): E2ESceneSnapshot;
  runState(): E2ERunState;
  dossier(): E2EDossier;
  node(): E2EPresentedNode | null;
  /**
   * `index` est l'index D'ORIGINE dans `node().choices` (le champ `index` de
   * chaque choix), pas sa position dans cette liste : passer toujours
   * `node().choices[i].index`. Renvoie `{ ok, reason? }` -- un choix
   * indisponible ne fait jamais rien en silence. Lire `node()` ensuite pour
   * le noeud a jour.
   */
  choose(index: number): { ok: boolean; reason?: string };
  /** Voir `GameDebugApi.rollInsight` dans src/debug/gameApi.ts (ADR 0012). */
  rollInsight(): { ok: boolean; reason?: string };
  /** Voir `GameDebugApi.spendLuck` dans src/debug/gameApi.ts (ADR 0015 §2). */
  spendLuck(n: number): { ok: boolean; reason?: string };
  /** Voir `GameDebugApi.acceptRoll` dans src/debug/gameApi.ts (ADR 0015 §2). */
  acceptRoll(): { ok: boolean; reason?: string };
  advance(): E2EPresentedNode | null;
  radio(): E2ERadioCue[];
  /** Voir `GameDebugApi.draft` dans src/debug/gameApi.ts (ADR 0014). */
  draft(): E2EDraftState | null;
  /** Voir `GameDebugApi.pickTeammate` dans src/debug/gameApi.ts (ADR 0014). */
  pickTeammate(cadetId: string): { ok: boolean; reason?: string };

  /* --- exploration (ADR 0013, lot 3.6b) --- */
  /** Voir `GameDebugApi.explore` dans src/debug/gameApi.ts. `null` hors d'une scène `explore`. */
  explore(): E2EExploreSnapshot | null;
  /** Voir `GameDebugApi.walkTo` dans src/debug/gameApi.ts : déplacement instantané, sans animation. */
  walkTo(x: number, y: number): void;
  /** Voir `GameDebugApi.interact` dans src/debug/gameApi.ts : déclenche l'entité sans marcher jusqu'à elle. */
  interact(entityId: string): E2EInteractOutcome | null;
  /** Voir `GameDebugApi.completeStep` dans src/debug/gameApi.ts : outil de développement, saute l'étape courante. */
  completeStep(): void;
}

declare global {
  interface Window {
    __game: E2EGameApi;
  }
}
