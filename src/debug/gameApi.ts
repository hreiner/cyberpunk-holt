/**
 * API de debug exposee sur `window.__game`.
 *
 * C'est le point d'entree des tests Playwright : plutot que de cliquer dans un
 * canvas (fragile), les tests scriptent des parties deterministes et lisent
 * l'etat. Elle sert aussi a rejouer un bug a partir d'une graine.
 *
 * Contrat documente dans docs/process/DEBUG_API.md. Toute evolution de cette
 * API doit y etre repercutee : c'est elle que lisent les autres agents.
 */

import type { GameApp } from '@/app';
import { playAiTurn, playToEnd } from '@/tactical/ai';
import { defaultSetup } from '@/tactical/combat';
import { scoreExercise } from '@/rules/scoring';
import type { ExerciseScore } from '@/rules/scoring';
import type { Action, CombatState, TeamId } from '@/tactical/types';
import type { CharacterId } from '@/rules/character';

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
  newGame(options?: { seed?: string; blue?: CharacterId[]; red?: CharacterId[]; roundLimit?: number }): GameStateSnapshot;
  state(): GameStateSnapshot;
  perform(action: Action): { ok: boolean; reason?: string };
  endTurn(): GameStateSnapshot;
  aiTurn(): GameStateSnapshot;
  flushAi(): GameStateSnapshot;
  runToEnd(maxTurns?: number): GameStateSnapshot;
  log(): string[];
  score(): ExerciseScore;
  setAiDelay(ms: number): void;
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

export function installDebugApi(app: GameApp): GameDebugApi {
  const api: GameDebugApi = {
    version: DEBUG_API_VERSION,

    newGame(options = {}) {
      const setup = defaultSetup(options.seed ?? 'test');
      if (options.blue) setup.blue = options.blue;
      if (options.red) setup.red = options.red;
      if (options.roundLimit) setup.roundLimit = options.roundLimit;
      app.startWith(setup);
      return snapshot(app);
    },

    state: () => snapshot(app),

    perform(action: Action) {
      const outcome = app.combat.perform(action);
      app.refreshFromDebug();
      return outcome.ok ? { ok: true } : { ok: false, reason: outcome.reason ?? 'refusee' };
    },

    endTurn() {
      app.combat.endTurn();
      app.refreshFromDebug();
      return snapshot(app);
    },

    aiTurn() {
      playAiTurn(app.combat);
      app.refreshFromDebug();
      return snapshot(app);
    },

    flushAi() {
      app.flushAi();
      return snapshot(app);
    },

    runToEnd(maxTurns = 200) {
      playToEnd(app.combat, maxTurns);
      app.refreshFromDebug();
      return snapshot(app);
    },

    log: () => app.combat.state.log.map((l) => l.text),

    score() {
      const s = app.combat.state;
      const player = app.playerTeam;
      const opponent: TeamId = player === 'blue' ? 'red' : 'blue';
      return scoreExercise({
        winner: s.winner,
        playerTeam: player,
        rounds: Math.min(s.round, s.roundLimit),
        roundLimit: s.roundLimit,
        alliesStanding: app.combat.activeUnitsOf(player).length,
        alliesTotal: app.combat.unitsOf(player).length,
        enemiesDown: app.combat.unitsOf(opponent).length - app.combat.activeUnitsOf(opponent).length,
        enemiesTotal: app.combat.unitsOf(opponent).length,
      });
    },

    setAiDelay: (ms: number) => app.setAiDelay(ms),
  };

  (window as unknown as { __game: GameDebugApi }).__game = api;
  return api;
}
