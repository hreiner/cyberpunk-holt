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
import { DEFAULT_BLUE, DEFAULT_RED, defaultTeamState } from '@/tactical/combat';
import type { CharacterId } from '@/rules/character';

/**
 * `TeamEffect` (types.ts) avec `gassed` DEJA RESOLU (alias d'equipe converti
 * en `CharacterId`, ADR 0014 §7) : `applyTeamEffect` ne connait jamais les
 * alias, seul `src/narrative/effects.ts` fait cette resolution avant d'appeler
 * cette fonction (voir `resolveTeamEffectAliases`).
 */
export type ResolvedTeamEffect = { healkits: number } | { extraTaser: true } | { gassed: CharacterId };

/** Scene de depart du chapitre 1, cf. CHAPTER_1_SCENES dans sceneRouter.ts. */
const INITIAL_SCENE_ID = 'ch1.intro';

/** Le tempo est un compteur invisible, jamais negatif (cf. ADR 0011). */
const MIN_TEMPO = 0;

/** Chance de Franklyn pour tout le chapitre (ADR 0015 §2), jamais negative. */
export const INITIAL_LUCK = 3;
const MIN_LUCK = 0;

/**
 * Composition des deux equipes du tirage (ADR 0014), distincte de
 * `RunState.teams` (qui porte l'etat MATERIEL -- kits de soin, taser
 * supplementaire, gazes -- pas la liste des cadets). Nom different
 * deliberement pour ne rien casser : voir le rapport de la tache pour la
 * justification. Tant que le lot 3.2 (le vrai tirage) n'est pas fait, cette
 * composition vaut l'equivalent de `DEFAULT_BLUE`/`DEFAULT_RED` -- tout
 * contenu existant qui n'utilise aucun alias d'equipe continue de fonctionner
 * a l'identique.
 */
export interface TeamRoster {
  blue: CharacterId[];
  red: CharacterId[];
  /** Capitaine adverse -- alias `rivale` (ADR 0014 : toujours Abigail au chapitre 1). */
  redCaptain: CharacterId;
}

function defaultRoster(): TeamRoster {
  return { blue: [...DEFAULT_BLUE], red: [...DEFAULT_RED], redCaptain: 'abigail' };
}

export interface RunState {
  sceneId: string;
  flags: Record<string, string | number | boolean>;
  tempo: number;
  teams: { blue: TeamState; red: TeamState };
  /** Composition des equipes (ADR 0014 §7) -- voir `TeamRoster`. */
  roster: TeamRoster;
  /** Chance restante de Franklyn pour le chapitre (ADR 0015 §2). */
  luck: number;
  /** Identifiants des repliques radio deja entendues. */
  heardRadio: string[];
  /**
   * Pieces d'exploration decouvertes, tous lieux confondus (08-EXPLORATION.md "La decouverte
   * des lieux"). Cle composite "mapId:roomId" (`roomKey`) -- un identifiant de piece n'est
   * unique qu'au sein d'une carte, deux cartes peuvent reutiliser le meme `RoomDef.id`. Survit
   * au rechargement : voir `discoverRoom`/`discoveredRoomIdsForMap`.
   */
  discoveredRooms: string[];
  seed: string;
}

export function createRunState(seed: string): RunState {
  return {
    sceneId: INITIAL_SCENE_ID,
    flags: {},
    tempo: 0,
    teams: { blue: defaultTeamState(), red: defaultTeamState() },
    roster: defaultRoster(),
    luck: INITIAL_LUCK,
    heardRadio: [],
    discoveredRooms: [],
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
    roster: mergeRoster(candidate.roster),
    luck: typeof candidate.luck === 'number' ? Math.max(MIN_LUCK, candidate.luck) : base.luck,
    heardRadio: Array.isArray(candidate.heardRadio)
      ? candidate.heardRadio.filter((id): id is string => typeof id === 'string')
      : base.heardRadio,
    discoveredRooms: Array.isArray(candidate.discoveredRooms)
      ? candidate.discoveredRooms.filter((id): id is string => typeof id === 'string')
      : base.discoveredRooms,
    seed,
  };
}

function mergeTeamState(raw: unknown): TeamState {
  const base = defaultTeamState();
  if (!raw || typeof raw !== 'object') return base;
  return { ...base, ...(raw as Partial<TeamState>) };
}

/** Migration tolerante du roster : une liste absente ou vide retombe sur le defaut, jamais un roster vide. */
function mergeRoster(raw: unknown): TeamRoster {
  const base = defaultRoster();
  if (!raw || typeof raw !== 'object') return base;
  const candidate = raw as Partial<TeamRoster>;
  return {
    blue: isNonEmptyIdArray(candidate.blue) ? candidate.blue : base.blue,
    red: isNonEmptyIdArray(candidate.red) ? candidate.red : base.red,
    redCaptain: typeof candidate.redCaptain === 'string' ? (candidate.redCaptain as CharacterId) : base.redCaptain,
  };
}

function isNonEmptyIdArray(value: unknown): value is CharacterId[] {
  return Array.isArray(value) && value.length > 0 && value.every((id) => typeof id === 'string');
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
export function applyTeamEffect(run: RunState, team: TeamId, effect: ResolvedTeamEffect): RunState {
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

/** Cle composite d'une piece decouverte : un `RoomDef.id` n'est unique qu'au sein d'une carte. */
function roomKey(mapId: string, roomId: string): string {
  return `${mapId}:${roomId}`;
}

/**
 * Marque une piece decouverte (08-EXPLORATION.md "La decouverte des lieux") ; sans effet si
 * elle l'est deja (jamais de doublon). Appele quand `ExploreState` signale un evenement
 * `room-discovered` (`src/chapter.ts`), a persister immediatement (pas seulement a la fin de
 * l'etape) : "recharger une partie ne re-cache pas des pieces deja visitees".
 */
export function discoverRoom(run: RunState, mapId: string, roomId: string): RunState {
  const key = roomKey(mapId, roomId);
  if (run.discoveredRooms.includes(key)) return run;
  return { ...run, discoveredRooms: [...run.discoveredRooms, key] };
}

export function isRoomDiscovered(run: RunState, mapId: string, roomId: string): boolean {
  return run.discoveredRooms.includes(roomKey(mapId, roomId));
}

/**
 * Identifiants de pieces (`RoomDef.id`, sans le prefixe de carte) deja decouvertes pour
 * `mapId` -- exactement ce qu'attend `ExploreStateOptions.discoveredRooms` a la construction
 * d'un `ExploreState` (entree a froid : nouvelle partie, reprise de sauvegarde, `?scene=`).
 */
export function discoveredRoomIdsForMap(run: RunState, mapId: string): string[] {
  const prefix = `${mapId}:`;
  return run.discoveredRooms.filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length));
}
