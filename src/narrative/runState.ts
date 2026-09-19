/**
 * RunState : memoire mecanique de la traversee en cours (par opposition au
 * Dossier, qui traverse les chapitres). Voir ADR 0011.
 *
 * `flags` remplace les variables locales au dialogue : un dialogue qui doit
 * se souvenir de quelque chose pose un drapeau nomme plutot que d'inventer un
 * etat prive. Si l'information doit survivre au chapitre, elle devient en
 * plus une etiquette de dossier (voir src/narrative/effects.ts).
 */

import type { TeamId, TeamState } from '@/tactical/types';
import { defaultTeamState } from '@/tactical/combat';
import type { TeamEffect } from './types';

/** Scene de depart du chapitre 1, cf. CHAPTER_1_SCENES dans sceneRouter.ts. */
const INITIAL_SCENE_ID = 'ch1.intro';

/** Le tempo est un compteur invisible, jamais negatif (cf. ADR 0011). */
const MIN_TEMPO = 0;

export interface RunState {
  sceneId: string;
  flags: Record<string, string | number | boolean>;
  tempo: number;
  teams: { blue: TeamState; red: TeamState };
  /** Identifiants des repliques radio deja entendues. */
  heardRadio: string[];
  seed: string;
}

export function createRunState(seed: string): RunState {
  return {
    sceneId: INITIAL_SCENE_ID,
    flags: {},
    tempo: 0,
    teams: { blue: defaultTeamState(), red: defaultTeamState() },
    heardRadio: [],
    seed,
  };
}

/** Migration tolerante : un RunState illisible ne doit jamais empecher de jouer. */
export function migrateRunState(raw: unknown, seed: string): RunState {
  const base = createRunState(seed);
  if (!raw || typeof raw !== 'object') return base;
  const candidate = raw as Partial<RunState>;

  return {
    ...base,
    sceneId: typeof candidate.sceneId === 'string' ? candidate.sceneId : base.sceneId,
    flags: isRecord(candidate.flags) ? { ...candidate.flags } : base.flags,
    tempo: typeof candidate.tempo === 'number' ? candidate.tempo : base.tempo,
    teams: {
      blue: mergeTeamState(candidate.teams?.blue),
      red: mergeTeamState(candidate.teams?.red),
    },
    heardRadio: Array.isArray(candidate.heardRadio)
      ? candidate.heardRadio.filter((id): id is string => typeof id === 'string')
      : base.heardRadio,
    seed,
  };
}

function mergeTeamState(raw: unknown): TeamState {
  const base = defaultTeamState();
  if (!raw || typeof raw !== 'object') return base;
  return { ...base, ...(raw as Partial<TeamState>) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function setFlag(run: RunState, key: string, value: string | number | boolean): RunState {
  return { ...run, flags: { ...run.flags, [key]: value } };
}

export function getFlag(run: RunState, key: string): string | number | boolean | undefined {
  return run.flags[key];
}

/** Incremente un drapeau numerique ; part de 0 s'il n'existe pas encore. */
export function bumpCounter(run: RunState, key: string, delta: number): RunState {
  const current = run.flags[key];
  const base = typeof current === 'number' ? current : 0;
  return setFlag(run, key, base + delta);
}

export function addTempo(run: RunState, delta: number): RunState {
  return { ...run, tempo: Math.max(MIN_TEMPO, run.tempo + delta) };
}

/** Applique un effet de materiel d'equipe. `team` designe l'equipe visee (celle du joueur en pratique). */
export function applyTeamEffect(run: RunState, team: TeamId, effect: TeamEffect): RunState {
  const current = run.teams[team];
  let next: TeamState = current;

  if ('healkits' in effect) {
    next = { ...current, healkits: Math.max(0, current.healkits + effect.healkits) };
  } else if ('extraTaser' in effect) {
    next = { ...current, extraTaser: true };
  } else if ('gassed' in effect) {
    // Accumule plutot qu'ecrase (defaut 3 du rapport de cloture epic 2) :
    // plusieurs cadets peuvent etre gazes salle par salle, chacun via son
    // propre effet `{ team: { gassed: <id> } }`. Sans doublon.
    next = current.gassedMembers.includes(effect.gassed)
      ? current
      : { ...current, gassedMembers: [...current.gassedMembers, effect.gassed] };
  }

  return { ...run, teams: { ...run.teams, [team]: next } };
}
