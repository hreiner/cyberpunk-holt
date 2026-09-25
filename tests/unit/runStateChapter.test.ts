/**
 * `RunState.chapter` (ADR 0021, lot 5.1) : une vieille sauvegarde sans ce
 * champ migre vers le chapitre 1, et la Chance depensee au chapitre 2 s'ecrit
 * sous une cle DIFFERENTE de celle du chapitre 1 (`ch2.chance`/`ch1.chance`)
 * -- sans quoi le meme dossier (memoire inter-chapitres) verrait le chapitre 2
 * ecraser l'entree du chapitre 1.
 */

import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { createDossier } from '@/core/dossier';
import { createRunState, migrateRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import type { DialogueFile } from '@/narrative/types';

describe('RunState.chapter (ADR 0021)', () => {
  it("un RunState sans 'chapter' (vieille sauvegarde) migre vers le chapitre 1", () => {
    const fresh = createRunState('graine-migration');
    expect(fresh.chapter).toBe(1);

    const raw = { ...fresh } as Record<string, unknown>;
    delete raw.chapter;
    const migrated = migrateRunState(raw, 'graine-migration');
    expect(migrated.chapter).toBe(1);
  });

  it("createRunState(seed, { chapter: 2, ... }) part bien du chapitre 2", () => {
    const run = createRunState('graine-ch2', { chapter: 2, sceneId: 'ch2.photo', luck: 3 });
    expect(run.chapter).toBe(2);
    expect(run.sceneId).toBe('ch2.photo');
    expect(run.luck).toBe(3);
  });

  /** Meme graphe a jet que tests/unit/narrativeRunner.test.ts ("luck-exact-12" : echec de marge -2). */
  const graphAvecJetChance: DialogueFile = {
    id: 'test.chance-chapitre',
    start: 'depart',
    nodes: {
      depart: {
        text: 'Ouverture.',
        choices: [
          {
            text: '[Perception] Regarder autour.',
            check: { skill: 'perception', attribute: 'REF', dv: 'NORMALE' },
            onSuccess: 'succes',
            onFailure: 'echec',
          },
        ],
      },
      succes: { text: 'Bien vu.' },
      echec: { text: 'Rien remarque.' },
    },
  };

  it("la Chance depensee au chapitre 2 s'ecrit sous 'ch2.chance', sans toucher 'ch1.chance'", () => {
    const run = { ...createRunState('luck-exact-12', { chapter: 2, sceneId: 'ch2.slow', luck: 3 }) };
    const ctx: NarrativeContext = { dossier: createDossier(), run };
    const runner = new DialogueRunner(graphAvecJetChance, ctx, createRng('luck-exact-12'));

    runner.choose(0);
    const missingBy = runner.current().pendingRoll?.missingBy;
    expect(missingBy, 'graine attendue en echec rattrapable').toBeDefined();
    if (missingBy === undefined) return;

    const outcome = runner.spendLuck(missingBy);
    expect(outcome.ok).toBe(true);

    const ch2Entry = runner.context.dossier.entries.find((e) => e.key === 'ch2.chance');
    expect(ch2Entry?.value).toBe(String(missingBy));
    expect(ch2Entry?.chapter).toBe(2);
    expect(runner.context.dossier.entries.some((e) => e.key === 'ch1.chance')).toBe(false);
    expect(runner.context.run.flags['ch2.chance.total']).toBe(missingBy);
    expect(runner.context.run.flags['ch1.chance.total']).toBeUndefined();
  });
});
