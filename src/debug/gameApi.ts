/**
 * API de debug exposee sur `window.__game`.
 *
 * C'est le point d'entree des tests Playwright : plutot que de cliquer dans un
 * canvas (fragile), les tests scriptent des parties deterministes et lisent
 * l'etat. Elle sert aussi a rejouer un bug a partir d'une graine.
 *
 * Contrat documente dans docs/process/DEBUG_API.md. Toute evolution de cette
 * API doit y etre repercutee : c'est elle que lisent les autres agents.
 *
 * Depuis l'epic 2 (ADR 0011), `window.__game` pilote le chapitre entier via
 * `ChapterApp`, pas seulement la phase tactique : les methodes tactiques
 * historiques (`newGame`, `perform`, ...) continuent d'agir sur l'instance
 * `GameApp` courante, creee des qu'on atteint ou force la scene tactique.
 */

import type { ChapterApp, HubEntry, NarrativeSceneSnapshot } from '@/chapter';
import type { GameApp } from '@/app';
import { combatOutcome } from '@/app';
import { playAiTurn, playToEnd } from '@/tactical/ai';
import { scoreExercise } from '@/rules/scoring';
import type { ExerciseScore } from '@/rules/scoring';
import type { Action, CombatState, TeamId } from '@/tactical/types';
import type { CharacterId } from '@/rules/character';
import type { Dossier } from '@/core/dossier';
import type { DraftState, NarrativeOutcome, PresentedNode, RadioCue, RunState } from '@/narrative';

export const DEBUG_API_VERSION = 1;

export interface GameStateSnapshot {
  phase: CombatState['phase'];
  round: number;
  roundLimit: number;
  seed: string;
  winner: CombatState['winner'];
  current: string;
  order: string[];
  units: Array<{
    id: string;
    team: TeamId;
    status: string;
    x: number;
    y: number;
    mp: number;
    actionUsed: boolean;
    exposed: boolean;
    items: string[];
    initiative: number;
  }>;
  ground: Array<{ x: number; y: number; item: string; armed: boolean }>;
  healkits: Record<TeamId, number>;
  logLength: number;
}

export interface GameDebugApi {
  readonly version: number;

  /* --- tactique (historique, voir docs/process/DEBUG_API.md) --- */
  newGame(options?: {
    seed?: string;
    blue?: CharacterId[];
    red?: CharacterId[];
    roundLimit?: number;
  }): GameStateSnapshot;
  state(): GameStateSnapshot;
  perform(action: Action): { ok: boolean; reason?: string };
  endTurn(): GameStateSnapshot;
  aiTurn(): GameStateSnapshot;
  flushAi(): GameStateSnapshot;
  runToEnd(maxTurns?: number): GameStateSnapshot;
  log(): string[];
  score(): ExerciseScore;
  setAiDelay(ms: number): void;

  /* --- narratif (ADR 0011) --- */
  scene(): NarrativeSceneSnapshot;
  goToScene(id: string): NarrativeSceneSnapshot;
  runState(): RunState;
  dossier(): Dossier;
  node(): PresentedNode | null;
  /**
   * `index` est l'index D'ORIGINE dans `node().choices` (voir
   * `PresentedChoice.index`) : toujours passer `node().choices[i].index`,
   * jamais une position recalculee. Renvoie `{ ok, reason? }`, exactement
   * dans l'esprit de `perform()` -- un choix indisponible ne fait jamais rien
   * en silence. Appeler `node()` ensuite pour lire le noeud a jour.
   */
  choose(index: number): NarrativeOutcome;
  /**
   * Resout le jet de reflexion du noeud courant (`node().insight`, ADR 0012) --
   * seul moment ou le Rng du dialogue est consomme pour ce jet, exactement
   * comme `perform()`/`choose()` pour le reste du moteur : deterministe,
   * synchrone, aucune animation cote debug. Refuse explicitement (`ok: false`)
   * si le noeud n'a pas d'`insight` ou si le jet a deja ete resolu. Appeler
   * `node()` ensuite pour lire `insight.status`/`insight.roll` a jour, et les
   * choix `best` fraichement reveles.
   */
  rollInsight(): NarrativeOutcome;
  /**
   * Depense `n` points de Chance sur le jet en attente (`node().pendingRoll`,
   * ADR 0015 §2) : `n` doit couvrir au moins `pendingRoll.missingBy` sans
   * depasser `pendingRoll.luckAvailable`. Resout l'issue differee en reussite,
   * deduit la Chance de `runState().luck`, et pose une entree de dossier
   * (`ch1.chance`). Refuse explicitement si rien n'est en attente. Appeler
   * `node()` ensuite pour lire le noeud a jour.
   */
  spendLuck(n: number): NarrativeOutcome;
  /**
   * Accepte l'echec du jet en attente (`node().pendingRoll`, ADR 0015 §2) sans
   * depenser de Chance. Refuse explicitement si rien n'est en attente.
   */
  acceptRoll(): NarrativeOutcome;
  advance(): PresentedNode | null;
  hub(): HubEntry[] | null;
  pickHub(dialogueId: string): PresentedNode | null;
  leaveHub(): NarrativeSceneSnapshot;
  radio(): RadioCue[];
  /**
   * Etat courant du tirage (ADR 0014), `null` hors de l'ecran de tirage :
   * pool de cadets encore disponibles, picks deja effectues (dans l'ordre
   * F/A/F/A), et de qui c'est le tour (`'franklyn' | 'abigail' | 'done'` --
   * en pratique jamais observable a `'abigail'`, son choix est resolu dans le
   * meme appel que celui de Franklyn, voir `pickTeammate`).
   */
  draft(): DraftState | null;
  /**
   * Choix de Franklyn pour le tirage (`node().choices` ne s'applique pas ici,
   * ce n'est pas un dialogue) : resout aussi, dans le meme appel, le choix
   * deterministe d'Abigail qui suit (`src/narrative/draft.ts`). Renvoie
   * `{ ok, reason? }`, meme esprit que `choose()`. Appeler `draft()` ensuite
   * pour lire l'etat a jour ; une fois `turn === 'done'`, `runState().roster`
   * reflete deja les nouvelles equipes -- un dernier `advance()` rend la main
   * a la scene suivante (meme idiome qu'un noeud de dialogue terminal).
   */
  pickTeammate(cadetId: CharacterId): NarrativeOutcome;
}

export function snapshot(app: GameApp): GameStateSnapshot {
  const s = app.combat.state;
  return {
    phase: s.phase,
    round: s.round,
    roundLimit: s.roundLimit,
    seed: s.seed,
    winner: s.winner,
    current: app.combat.currentUnitId(),
    order: [...s.order],
    units: Object.values(s.units).map((u) => ({
      id: u.id,
      team: u.team,
      status: u.status,
      x: u.pos.x,
      y: u.pos.y,
      mp: u.mp,
      actionUsed: u.actionUsed,
      exposed: u.exposed,
      items: [...u.items],
      initiative: u.initiative,
    })),
    ground: s.ground.map((g) => ({ x: g.pos.x, y: g.pos.y, item: g.item, armed: g.armed })),
    healkits: { blue: s.teams.blue.healkits, red: s.teams.red.healkits },
    logLength: s.log.length,
  };
}

/** La plupart des methodes tactiques exigent qu'une scene tactique ait deja ete atteinte (ou forcee via `newGame`). */
function requireTactical(chapter: ChapterApp): GameApp {
  const app = chapter.tactical;
  if (!app) {
    throw new Error(
      "La scene tactique n'est pas active : appelez __game.newGame() ou __game.goToScene('ch1.affrontement') d'abord.",
    );
  }
  return app;
}

export function installDebugApi(chapter: ChapterApp): GameDebugApi {
  const api: GameDebugApi = {
    version: DEBUG_API_VERSION,

    newGame(options = {}) {
      chapter.debugStartTactical(options);
      return snapshot(requireTactical(chapter));
    },

    state: () => snapshot(requireTactical(chapter)),

    perform(action: Action) {
      const app = requireTactical(chapter);
      const outcome = app.combat.perform(action);
      app.refreshFromDebug();
      return outcome.ok ? { ok: true } : { ok: false, reason: outcome.reason ?? 'refusee' };
    },

    endTurn() {
      const app = requireTactical(chapter);
      app.combat.endTurn();
      app.refreshFromDebug();
      return snapshot(app);
    },

    aiTurn() {
      const app = requireTactical(chapter);
      playAiTurn(app.combat);
      app.refreshFromDebug();
      return snapshot(app);
    },

    flushAi() {
      const app = requireTactical(chapter);
      app.flushAi();
      return snapshot(app);
    },

    runToEnd(maxTurns = 200) {
      const app = requireTactical(chapter);
      playToEnd(app.combat, maxTurns);
      app.refreshFromDebug();
      return snapshot(app);
    },

    log: () => requireTactical(chapter).combat.state.log.map((l) => l.text),

    score: () =>
      scoreExercise(combatOutcome(requireTactical(chapter).combat, requireTactical(chapter).playerTeam)),

    setAiDelay: (ms: number) => requireTactical(chapter).setAiDelay(ms),

    scene: () => chapter.sceneSnapshot(),

    goToScene(id: string) {
      chapter.goToScene(id);
      return chapter.sceneSnapshot();
    },

    runState: () => chapter.run,

    dossier: () => chapter.dossier,

    node: () => chapter.node,

    choose: (index: number) => chapter.chooseOption(index),

    rollInsight: () => chapter.rollInsight(),

    spendLuck: (n: number) => chapter.spendLuck(n),

    acceptRoll: () => chapter.acceptRoll(),

    advance() {
      chapter.advance();
      return chapter.node;
    },

    hub: () => chapter.hub,

    pickHub(dialogueId: string) {
      chapter.pickHub(dialogueId);
      return chapter.node;
    },

    leaveHub() {
      chapter.leaveHub();
      return chapter.sceneSnapshot();
    },

    radio: () => chapter.peekRadio(),

    draft: () => chapter.draft,

    pickTeammate: (cadetId: CharacterId) => chapter.pickTeammate(cadetId),
  };

  (window as unknown as { __game: GameDebugApi }).__game = api;
  return api;
}
