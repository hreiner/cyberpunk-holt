import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { DEFAULT_RED } from '@/tactical/combat';
import { offscreenFlags, resolveOffscreenRun } from '@/narrative/offscreen';

describe('parcours hors champ de l equipe adverse (lot 2.8)', () => {
  it('est deterministe a graine egale', () => {
    const a = resolveOffscreenRun(createRng('holt-offscreen-test'), DEFAULT_RED);
    const b = resolveOffscreenRun(createRng('holt-offscreen-test'), DEFAULT_RED);

    expect(a).toEqual(b);
  });

  it('produit un TeamState toujours coherent', () => {
    for (const seed of ['seed-un', 'seed-deux', 'seed-trois', 'holt-demo']) {
      const outcome = resolveOffscreenRun(createRng(seed), DEFAULT_RED);

      expect(outcome.teamState.healkits).toBeGreaterThanOrEqual(0);
      // Sans doublon, et uniquement des cadets de l'equipe (defaut 3, plusieurs
      // cadets peuvent etre gazes).
      expect(new Set(outcome.teamState.gassedMembers).size).toBe(outcome.teamState.gassedMembers.length);
      expect(outcome.teamState.gassedMembers.every((id) => DEFAULT_RED.includes(id))).toBe(true);
      expect(outcome.tempo).toBeGreaterThanOrEqual(0);
      expect(outcome.log.length).toBeGreaterThan(0);
    }
  });

  it('offscreenFlags reprend exactement les noms de drapeaux de ch1.salle3.json', () => {
    const outcome = resolveOffscreenRun(createRng('holt-offscreen-flags'), DEFAULT_RED);
    const flags = offscreenFlags(outcome);

    expect(flags['ch1.adverse.taser-supplementaire']).toBe(outcome.teamState.extraTaser);
    expect(flags['ch1.adverse.membre-gaze']).toBe(outcome.teamState.gassedMembers.length > 0);
  });
});
