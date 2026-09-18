import { describe, expect, it } from 'vitest';
import { createRng, hashSeed } from '@/core/rng';

describe('Rng', () => {
  it('produit la meme sequence pour la meme graine', () => {
    const a = createRng('holt');
    const b = createRng('holt');
    const seqA = Array.from({ length: 20 }, () => a.die(10));
    const seqB = Array.from({ length: 20 }, () => b.die(10));
    expect(seqA).toEqual(seqB);
  });

  it('produit des sequences differentes pour des graines differentes', () => {
    const a = Array.from({ length: 20 }, (_, i) => createRng('graine-a').int(0, 99) + i * 0);
    const b = Array.from({ length: 20 }, (_, i) => createRng('graine-b').int(0, 99) + i * 0);
    expect(a).not.toEqual(b);
  });

  it('isole les sous-generateurs nommes', () => {
    const base = createRng('holt');
    const combat = base.fork('combat');
    const ai = base.fork('ai');
    const combatFirst = combat.die(10);
    ai.die(10);
    ai.die(10);
    const combatAgain = createRng('holt').fork('combat').die(10);
    expect(combatAgain).toBe(combatFirst);
  });

  it('respecte les bornes de int()', () => {
    const rng = createRng('bornes');
    for (let i = 0; i < 500; i++) {
      const v = rng.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('melange sans perdre ni dupliquer d element', () => {
    const rng = createRng('melange');
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = rng.shuffle(source);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
    expect(source).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('compte les tirages consommes', () => {
    const rng = createRng('compteur');
    expect(rng.draws).toBe(0);
    rng.die(10);
    rng.die(10);
    expect(rng.draws).toBe(2);
  });

  it('hashSeed est stable et non nul', () => {
    expect(hashSeed('holt')).toBe(hashSeed('holt'));
    expect(hashSeed('holt')).not.toBe(hashSeed('holu'));
  });
});
