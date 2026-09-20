/**
 * Le tirage des equipes (scene 4, ADR 0014 -- BINDING).
 *
 * Moteur PUR : aucune dependance au DOM ni a `three` (regle 2 d'AGENTS.md),
 * aucun aleatoire hors `Rng` seede (regle 1) -- le tirage n'a rien
 * d'aleatoire, Abigail suit un ordre de preference fixe. Le seul aleatoire du
 * chapitre 1 reste les jets de des, hors sujet ici.
 *
 * Deroule (ADR 0014 §3-4) : choix alternes, Franklyn d'abord -- Franklyn,
 * Abigail, Franklyn, Abigail. Le dernier cadet revient d'office a Abigail.
 * Cote moteur, `pick()` ne prend QUE le choix de Franklyn : le choix
 * d'Abigail qui suit est deterministe, donc resolu automatiquement dans le
 * meme appel -- le joueur ne fait jamais qu'un choix a la fois, mais l'API ne
 * lui demande jamais de valider le tour d'Abigail. `pick()` renvoie les DEUX
 * picks du round pour que l'ecran affiche la reaction d'Abigail.
 */

import type { Dossier } from '@/core/dossier';
import { addEntry, addTags, adjustAffinity } from '@/core/dossier';
import type { CharacterId } from '@/rules/character';
import { getCharacter } from '@/rules/character';
import type { TeamId } from '@/tactical/types';
import type { TeamRoster } from './runState';
import type { NarrativeContext } from './dialogueRunner';
import { NARRATIVE_CHAPTER } from './effects';

/** Les quatre cadets disputes, dans l'ordre d'apparition a l'ecran (ADR 0014 §3). */
export const DRAFT_POOL: readonly CharacterId[] = ['zachary', 'letitia', 'john', 'grover'];

/**
 * Ordre de preference DETERMINISTE d'Abigail (ADR 0014 §4) : elle prend le
 * premier de cette liste encore disponible. Jamais de Rng -- c'est un trait
 * de personnage, pas un tirage.
 */
export const ABIGAIL_PREFERENCE_ORDER: readonly CharacterId[] = ['zachary', 'letitia', 'john', 'grover'];

/** Seuil d'affinite "il s'y attendait" (ADR 0014 §6). Regle 4 d'AGENTS.md : jamais un litteral dans une condition. */
export const DRAFT_EXPECTATION_AFFINITY = 2;
/** Bonus au tout premier choix de Franklyn. */
export const DRAFT_FIRST_PICK_BONUS = 1;
/** Malus a un cadet laisse a Abigail alors qu'il s'attendait a etre pris. */
export const DRAFT_LEFT_BEHIND_PENALTY = -1;

/** Etiquettes posees a l'issue du tirage (ADR 0014 §6) -- ajoutees au vocabulaire ferme de 06-SCORING-DOSSIER.md. */
export const TAG_EQUIPE_BANDE = 'equipe-bande';
export const TAG_EQUIPE_TACTIQUE = 'equipe-tactique';

/** Cle d'entree de dossier du resume du tirage (ADR 0014 §6). */
export const DRAFT_DOSSIER_ENTRY_KEY = 'ch1.tirage.choix';

export type DraftTurn = 'franklyn' | 'abigail' | 'done';

export interface DraftPick {
  cadet: CharacterId;
  team: TeamId;
}

export interface DraftState {
  /** Cadets encore disponibles, dans l'ordre de `DRAFT_POOL`. */
  pool: CharacterId[];
  /** Tous les picks effectues jusqu'ici, dans l'ordre chronologique (F, A, F, A). */
  picks: DraftPick[];
  turn: DraftTurn;
}

export function createDraftState(): DraftState {
  return { pool: [...DRAFT_POOL], picks: [], turn: 'franklyn' };
}

/**
 * Replique d'Abigail pour chacun de ses quatre choix possibles (ADR 0014 §4,
 * consigne de la tache : "4-6 lignes, une par pick possible, dans sa voix --
 * seche, pratique"). Affichee par `src/ui/draftView.ts` juste apres son choix.
 */
export const ABIGAIL_PICK_LINES: Record<CharacterId, string> = {
  zachary: 'Zachary. Ma bande a besoin de lui, pas de discussion.',
  letitia: 'Letitia. Le repérage complète mes soins, point.',
  john: "John, alors. Solide, ça suffit, j'irai pas chercher plus loin.",
  grover: 'Grover. Il reste lui — je fais avec.',
  franklyn: '', // jamais choisie par Abigail -- present pour la completude du Record
  abigail: '',
};

export interface DraftStepResult {
  franklynPick: CharacterId;
  abigailPick: CharacterId;
  state: DraftState;
}

export type DraftOutcome = { ok: true; step: DraftStepResult } | { ok: false; reason: string };

function applyPick(state: DraftState, cadet: CharacterId, team: TeamId): DraftState {
  return {
    ...state,
    pool: state.pool.filter((id) => id !== cadet),
    picks: [...state.picks, { cadet, team }],
    turn: state.turn,
  };
}

/** Choix d'Abigail : le premier de son ordre de preference encore dans le pool. */
function abigailChoice(pool: CharacterId[]): CharacterId | undefined {
  return ABIGAIL_PREFERENCE_ORDER.find((id) => pool.includes(id));
}

/**
 * Choix de Franklyn (le seul que le joueur declenche). Valide le tour et la
 * disponibilite, applique le pick de Franklyn PUIS resout immediatement (et
 * deterministe) le pick d'Abigail qui suit -- voir l'entete du fichier.
 * Ne leve jamais d'exception (regle 3 d'AGENTS.md) : un choix impossible
 * renvoie `{ ok: false, reason }`.
 */
export function pick(state: DraftState, cadetId: CharacterId): DraftOutcome {
  if (state.turn === 'done') return { ok: false, reason: 'Le tirage est déjà terminé.' };
  if (state.turn === 'abigail') return { ok: false, reason: "C'est au tour d'Abigail de choisir." };
  if (!state.pool.includes(cadetId)) return { ok: false, reason: `${getCharacter(cadetId).name} n'est plus disponible.` };

  const afterFranklyn = applyPick(state, cadetId, 'blue');
  const abigailCadet = abigailChoice(afterFranklyn.pool);
  if (!abigailCadet) {
    // Ne devrait jamais arriver (le pool contient encore au moins un cadet
    // apres le pick de Franklyn tant que DRAFT_POOL a 4 elements) : filet de
    // securite plutot qu'un crash sur une donnee incoherente.
    return { ok: true, step: { franklynPick: cadetId, abigailPick: cadetId, state: { ...afterFranklyn, turn: 'done' } } };
  }
  const afterAbigail = applyPick(afterFranklyn, abigailCadet, 'red');
  const nextTurn: DraftTurn = afterAbigail.pool.length > 0 ? 'franklyn' : 'done';
  const finalState: DraftState = { ...afterAbigail, turn: nextTurn };

  return { ok: true, step: { franklynPick: cadetId, abigailPick: abigailCadet, state: finalState } };
}

/** Construit le roster final (ADR 0014 §5) : Franklyn et Abigail en tete de leur equipe. */
export function rosterFromDraft(state: DraftState): TeamRoster {
  const blue: CharacterId[] = ['franklyn', ...state.picks.filter((p) => p.team === 'blue').map((p) => p.cadet)];
  const red: CharacterId[] = ['abigail', ...state.picks.filter((p) => p.team === 'red').map((p) => p.cadet)];
  return { blue, red, redCaptain: 'abigail' };
}

/** Resume lisible du tirage, dans l'ordre chronologique des quatre picks (ADR 0014 §6). */
export function draftSummary(state: DraftState): string {
  const name = (id: CharacterId) => getCharacter(id).name;
  const franklynPicks = state.picks.filter((p) => p.team === 'blue').map((p) => p.cadet);
  const abigailPicks = state.picks.filter((p) => p.team === 'red').map((p) => p.cadet);
  const franklynPart =
    franklynPicks.length > 0 ? `Franklyn a choisi ${franklynPicks.map(name).join(' puis ')}.` : '';
  const abigailPart = abigailPicks.length > 0 ? `Abigail a pris ${abigailPicks.map(name).join(' puis ')}.` : '';
  return [franklynPart, abigailPart].filter(Boolean).join(' ');
}

export interface DraftConsequences {
  roster: TeamRoster;
  affinityDeltas: Array<{ who: CharacterId; delta: number }>;
  tag: typeof TAG_EQUIPE_BANDE | typeof TAG_EQUIPE_TACTIQUE;
  summary: string;
}

/**
 * Consequences relationnelles du tirage (ADR 0014 §6), calculees contre les
 * affinites AVANT ce tirage (le dossier transmis ne doit pas deja porter les
 * deltas qu'on est en train de calculer) :
 *  - +1 pour le tout premier pick de Franklyn ;
 *  - -1 pour chaque cadet laisse a Abigail dont l'affinite etait deja >= +2 ;
 *  - `equipe-bande` si les DEUX picks de Franklyn avaient une affinite >= +2
 *    au moment du choix, `equipe-tactique` sinon.
 */
export function draftConsequences(state: DraftState, dossier: Dossier): DraftConsequences {
  const roster = rosterFromDraft(state);
  const franklynPicks = state.picks.filter((p) => p.team === 'blue').map((p) => p.cadet);
  const abigailPicks = state.picks.filter((p) => p.team === 'red').map((p) => p.cadet);
  const affinityAtDraft = (id: CharacterId) => dossier.affinities[id] ?? 0;

  const affinityDeltas: Array<{ who: CharacterId; delta: number }> = [];
  const firstPick = franklynPicks[0];
  if (firstPick) affinityDeltas.push({ who: firstPick, delta: DRAFT_FIRST_PICK_BONUS });
  for (const id of abigailPicks) {
    if (affinityAtDraft(id) >= DRAFT_EXPECTATION_AFFINITY) {
      affinityDeltas.push({ who: id, delta: DRAFT_LEFT_BEHIND_PENALTY });
    }
  }

  const bothExpectedByBande =
    franklynPicks.length === 2 && franklynPicks.every((id) => affinityAtDraft(id) >= DRAFT_EXPECTATION_AFFINITY);

  return {
    roster,
    affinityDeltas,
    tag: bothExpectedByBande ? TAG_EQUIPE_BANDE : TAG_EQUIPE_TACTIQUE,
    summary: draftSummary(state),
  };
}

/**
 * Verse les consequences du tirage termine dans le contexte narratif : roster
 * du `RunState`, deltas d'affinite, entree de dossier et etiquette
 * `equipe-bande`/`equipe-tactique`. Pure (renvoie un nouveau contexte, ADR
 * 0011) -- a n'appeler qu'une fois `state.turn === 'done'`.
 */
export function applyDraftResult(ctx: NarrativeContext, state: DraftState): NarrativeContext {
  const consequences = draftConsequences(state, ctx.dossier);
  let dossier = ctx.dossier;
  for (const { who, delta } of consequences.affinityDeltas) dossier = adjustAffinity(dossier, who, delta);
  dossier = addEntry(dossier, {
    key: DRAFT_DOSSIER_ENTRY_KEY,
    label: 'Tirage des équipes',
    value: consequences.summary,
    chapter: NARRATIVE_CHAPTER,
  });
  dossier = addTags(dossier, [consequences.tag]);

  return { dossier, run: { ...ctx.run, roster: consequences.roster } };
}
