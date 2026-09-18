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

export interface E2EGameApi {
  version: number;
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
}

declare global {
  interface Window {
    __game: E2EGameApi;
  }
}
