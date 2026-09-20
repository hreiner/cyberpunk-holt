/**
 * Tirage des equipes (scene 4, ADR 0014 -- BINDING). Trois familles de test :
 * le moteur pur (ordre des tours, preferences d'Abigail, dernier cadet forcé,
 * les compositions atteignables), les consequences relationnelles (§6), et le
 * fait que le roster resultant devient la SEULE source de verite pour le
 * combat/le parcours hors champ/la notation (§5) -- pas DEFAULT_BLUE/DEFAULT_RED.
 */

import { describe, it, expect } from 'vitest';
import { createDossier, adjustAffinity } from '@/core/dossier';
import type { Dossier } from '@/core/dossier';
import type { CharacterId } from '@/rules/character';
import { createRunState } from '@/narrative/runState';
import {
  ABIGAIL_PREFERENCE_ORDER,
  DRAFT_POOL,
  applyDraftResult,
  createDraftState,
  draftConsequences,
  pick,
  rosterFromDraft,
} from '@/narrative/draft';
import type { DraftState } from '@/narrative/draft';
import { DEFAULT_BLUE, DEFAULT_RED, TacticalCombat, defaultTeamState } from '@/tactical/combat';
import { resolveOffscreenRun } from '@/narrative/offscreen';
import { createRng } from '@/core/rng';

/** Joue les deux choix de Franklyn ; renvoie l'etat final (turn === 'done'). */
function playDraft(franklynPicks: [CharacterId, CharacterId]): DraftState {
  let state = createDraftState();
  for (const cadetId of franklynPicks) {
    const outcome = pick(state, cadetId);
    expect(outcome.ok, `pick(${cadetId}) a echoue`).toBe(true);
    if (outcome.ok) state = outcome.step.state;
  }
  return state;
}

/**
 * Les CINQ compositions reellement atteignables pour l'equipe de Franklyn
 * (pas six -- voir ADR 0014, "Correctif lot 3.2") : `C(4,2)` donnerait six
 * paires, mais le tour d'Abigail s'intercale ENTRE les deux choix de Franklyn
 * (§3, "parmi quatre, puis parmi deux") et son ordre de preference commence
 * par Zachary puis Letitia (§4) -- quel que soit celui des deux que Franklyn
 * ne prend pas en premier, Abigail le prend aussitot. "Zachary et Letitia"
 * pour l'equipe de Franklyn est donc structurellement impossible.
 */
const REACHABLE_PAIRS: Array<[CharacterId, CharacterId]> = [
  ['zachary', 'john'],
  ['zachary', 'grover'],
  ['letitia', 'john'],
  ['letitia', 'grover'],
  ['john', 'grover'],
];

describe('le moteur du tirage (ADR 0014)', () => {
  it("commence avec le pool complet et c'est le tour de Franklyn", () => {
    const state = createDraftState();
    expect(state.pool).toEqual([...DRAFT_POOL]);
    expect(state.picks).toEqual([]);
    expect(state.turn).toBe('franklyn');
  });

  it("l'ordre des picks est F, A, F, A -- Franklyn d'abord (ADR 0014 §3)", () => {
    const outcome1 = pick(createDraftState(), 'john');
    expect(outcome1.ok).toBe(true);
    if (!outcome1.ok) return;
    expect(outcome1.step.franklynPick).toBe('john');
    // Abigail choisit dans la FOULEE (meme appel) : premier disponible de son
    // ordre de preference, John etant deja pris par Franklyn.
    expect(outcome1.step.abigailPick).toBe('zachary');
    expect(outcome1.step.state.picks.map((p) => p.cadet)).toEqual(['john', 'zachary']);
    expect(outcome1.step.state.picks.map((p) => p.team)).toEqual(['blue', 'red']);
    expect(outcome1.step.state.turn).toBe('franklyn');

    const outcome2 = pick(outcome1.step.state, 'letitia');
    expect(outcome2.ok).toBe(true);
    if (!outcome2.ok) return;
    expect(outcome2.step.franklynPick).toBe('letitia');
    // Il ne reste que Grover : Abigail le prend d'office (ADR 0014 §3).
    expect(outcome2.step.abigailPick).toBe('grover');
    expect(outcome2.step.state.pool).toEqual([]);
    expect(outcome2.step.state.turn).toBe('done');
  });

  it('Abigail suit toujours son ordre de preference : Zachary, Letitia, John, Grover', () => {
    // Franklyn prend John et Grover : il reste Zachary et Letitia, tous deux
    // devances par la preference d'Abigail -- elle prend Zachary (avant Letitia).
    const state = playDraft(['john', 'grover']);
    const abigailPicks = state.picks.filter((p) => p.team === 'red').map((p) => p.cadet);
    expect(abigailPicks).toEqual(['zachary', 'letitia']);
  });

  it('le second choix d’Abigail (le dernier cadet) est TOUJOURS force, meme hors de sa preference', () => {
    // Franklyn prend Zachary puis Grover : Abigail prend Letitia des le premier
    // tour (son 2e choix de preference, Zachary etant deja pris), puis herite
    // de John au tour force -- alors que Grover (deja pris par Franklyn) aurait
    // ete son 4e choix de toute facon : la preference n'entre en jeu qu'au
    // premier des deux tours d'Abigail, jamais au second.
    const state = playDraft(['zachary', 'grover']);
    const abigailPicks = state.picks.filter((p) => p.team === 'red').map((p) => p.cadet);
    expect(abigailPicks).toEqual(['letitia', 'john']);
  });

  it('un cadet deja pris ne peut pas etre repris', () => {
    const outcome1 = pick(createDraftState(), 'zachary');
    expect(outcome1.ok).toBe(true);
    if (!outcome1.ok) return;
    // Zachary (pris par Franklyn) et Letitia (prise dans la foulee par
    // Abigail, son 2e choix) sont tous deux indisponibles.
    const outcome2 = pick(outcome1.step.state, 'zachary');
    expect(outcome2.ok).toBe(false);
    const outcome3 = pick(outcome1.step.state, 'letitia');
    expect(outcome3.ok).toBe(false);
  });

  it('pick() refuse un tirage deja termine', () => {
    const done = playDraft(['zachary', 'john']);
    const outcome = pick(done, 'grover');
    expect(outcome.ok).toBe(false);
  });

  it('rosterFromDraft place toujours le capitaine en tete de son equipe', () => {
    const state = playDraft(['zachary', 'john']);
    const roster = rosterFromDraft(state);
    expect(roster.blue[0]).toBe('franklyn');
    expect(roster.red[0]).toBe('abigail');
    expect(roster.redCaptain).toBe('abigail');
    expect(roster.blue).toHaveLength(3);
    expect(roster.red).toHaveLength(3);
  });

  it(
    '"Zachary et Letitia" est structurellement impossible pour l’equipe de Franklyn ' +
      '(ADR 0014, Correctif lot 3.2) : Abigail prend systematiquement celui des deux que Franklyn laisse',
    () => {
      const afterZachary = pick(createDraftState(), 'zachary');
      expect(afterZachary.ok).toBe(true);
      if (afterZachary.ok) expect(afterZachary.step.abigailPick).toBe('letitia');

      const afterLetitia = pick(createDraftState(), 'letitia');
      expect(afterLetitia.ok).toBe(true);
      if (afterLetitia.ok) expect(afterLetitia.step.abigailPick).toBe('zachary');
    },
  );

  it.each(REACHABLE_PAIRS)(
    'composition atteignable Franklyn + %s + %s : chaque cadet atterrit exactement une fois',
    (a, b) => {
      const state = playDraft([a, b]);
      const roster = rosterFromDraft(state);
      expect(new Set(roster.blue)).toEqual(new Set(['franklyn', a, b]));
      const expectedRed = DRAFT_POOL.filter((id) => id !== a && id !== b);
      expect(new Set(roster.red)).toEqual(new Set(['abigail', ...expectedRed]));
      // Aucun doublon, aucun cadet perdu.
      expect([...roster.blue, ...roster.red].sort()).toEqual(['franklyn', 'abigail', ...DRAFT_POOL].sort());
    },
  );

  it('l’ordre des deux choix de Franklyn ne change pas la composition finale des equipes', () => {
    const orderA = rosterFromDraft(playDraft(['john', 'grover']));
    const orderB = rosterFromDraft(playDraft(['grover', 'john']));
    expect(new Set(orderA.blue)).toEqual(new Set(orderB.blue));
    expect(new Set(orderA.red)).toEqual(new Set(orderB.red));
  });
});

describe('consequences relationnelles du tirage (ADR 0014 §6)', () => {
  it('le tout premier pick de Franklyn gagne +1 affinite', () => {
    const dossier = createDossier();
    const state = playDraft(['john', 'grover']);
    const cons = draftConsequences(state, dossier);
    expect(cons.affinityDeltas).toContainEqual({ who: 'john', delta: 1 });
  });

  it("un cadet laisse a Abigail alors que son affinite etait >= +2 perd 1 point (il s'y attendait)", () => {
    let dossier = createDossier();
    dossier = adjustAffinity(dossier, 'zachary', 3); // zachary s'attend a etre pris
    const state = playDraft(['john', 'grover']); // zachary laisse a Abigail
    const cons = draftConsequences(state, dossier);
    expect(cons.affinityDeltas).toContainEqual({ who: 'zachary', delta: -1 });
  });

  it('seul un cadet proche (affinite >= +2) laisse a Abigail subit un malus', () => {
    // Affinites de depart des fiches : zachary +2 (proche), letitia +1 (pas assez).
    const dossier = createDossier();
    const state = playDraft(['john', 'grover']);
    const cons = draftConsequences(state, dossier);
    expect(cons.affinityDeltas.find((d) => d.who === 'zachary')?.delta).toBe(-1);
    expect(cons.affinityDeltas.some((d) => d.who === 'letitia')).toBe(false);
  });

  it('etiquette equipe-bande si les DEUX picks de Franklyn avaient une affinite >= +2 au moment du choix', () => {
    // Affinites posees explicitement : les fiches donnent zachary +2 et grover -1.
    const dossier = { ...createDossier(), affinities: { zachary: 2, grover: 2 } };
    const state = playDraft(['zachary', 'grover']);
    const cons = draftConsequences(state, dossier);
    expect(cons.tag).toBe('equipe-bande');
  });

  it('etiquette equipe-tactique des qu’un seul des deux picks avait une affinite < +2', () => {
    // grover reste sous +2 : affinite insuffisante.
    const dossier = { ...createDossier(), affinities: { zachary: 2, grover: 0 } };
    const state = playDraft(['zachary', 'grover']);
    const cons = draftConsequences(state, dossier);
    expect(cons.tag).toBe('equipe-tactique');
  });

  it('applyDraftResult verse le roster, les affinites, une entree de dossier et une etiquette', () => {
    const dossier = createDossier();
    const run = createRunState('seed-tirage');
    const state = playDraft(['zachary', 'grover']);
    const ctx = applyDraftResult({ dossier, run }, state);

    expect(ctx.run.roster.blue).toEqual(['franklyn', 'zachary', 'grover']);
    expect(ctx.run.roster.red).toEqual(['abigail', 'letitia', 'john']);
    expect(ctx.dossier.entries.some((e) => e.key === 'ch1.tirage.choix')).toBe(true);
    expect(ctx.dossier.tags.includes('equipe-bande') || ctx.dossier.tags.includes('equipe-tactique')).toBe(true);
    // Le premier pick de Franklyn (zachary) est bien recompense : +2 de depart, +1 ici.
    expect(ctx.dossier.affinities.zachary).toBe(3);
  });
});

describe('le roster du tirage devient la source de verite (ADR 0014 §5)', () => {
  const state = playDraft(['zachary', 'grover']); // blue = franklyn/zachary/grover, red = abigail/letitia/john
  const dossier: Dossier = createDossier();
  const roster = applyDraftResult({ dossier, run: createRunState('seed-wiring') }, state).run.roster;

  it('le roster differe du repli DEFAULT_BLUE/DEFAULT_RED (preuve que ce n’est pas le defaut recopie)', () => {
    expect(roster.blue).not.toEqual(DEFAULT_BLUE);
    expect(roster.red).not.toEqual(DEFAULT_RED);
  });

  it('alimente un combat tactique avec les BONS cadets de chaque cote', () => {
    const combat = new TacticalCombat({
      seed: 'seed-wiring',
      blue: roster.blue,
      red: roster.red,
      blueState: defaultTeamState(),
      redState: defaultTeamState(),
      roundLimit: 12,
    });
    expect(new Set(combat.unitsOf('blue').map((u) => u.id))).toEqual(new Set(roster.blue));
    expect(new Set(combat.unitsOf('red').map((u) => u.id))).toEqual(new Set(roster.red));
  });

  it('alimente le parcours hors champ de l’equipe adverse avec les BONS cadets (roster.red, pas DEFAULT_RED)', () => {
    const outcome = resolveOffscreenRun(createRng('seed-wiring::offscreen'), roster.red);
    // Le parcours hors champ tourne sur les fiches reelles des cadets du roster :
    // aucune exception, un TeamState complet en sort (voir offscreen.test.ts pour le detail).
    expect(outcome.teamState).toBeDefined();
    expect(outcome.log.length).toBeGreaterThan(0);
  });
});

describe('ABIGAIL_PREFERENCE_ORDER (donnee, ADR 0014 §4)', () => {
  it('commence par Zachary puis Letitia -- source de "Zachary et Letitia" impossible pour Franklyn', () => {
    expect(ABIGAIL_PREFERENCE_ORDER.slice(0, 2)).toEqual(['zachary', 'letitia']);
  });
});

describe('affinites de depart du dossier', () => {
  it('amorce le dossier avec les valeurs des fiches, sans le candidat', () => {
    // docs/design/04-CHARACTERS.md : John +3, Abigail +2, Zachary +2, Letitia +1, Grover -1.
    // Sans cet amorcage, le malus "laisse a Abigail" et les reactions du bal
    // conditionnees a une affinite forte ne se declencheraient jamais.
    const d = createDossier();
    expect(d.affinities).toEqual({ john: 3, abigail: 2, zachary: 2, letitia: 1, grover: -1 });
    expect(d.affinities.franklyn).toBeUndefined();
  });
});
