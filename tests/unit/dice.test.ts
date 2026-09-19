import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { check, formatCheck, rollD10 } from '@/rules/dice';
import type { Rng } from '@/core/rng';

/** Petit generateur scripte pour tester les cas limites du d10. */
function scriptedRng(values: number[]): Rng {
  let i = 0;
  const next = () => {
    const v = values[i % values.length] as number;
    i++;
    return v;
  };
  return {
    seed: 'scripte',
    get draws() {
      return i;
    },
    next: () => next() / 10,
    int: () => next(),
    die: () => next(),
    pick: (items) => items[0] as never,
    shuffle: (items) => [...items],
    fork: () => scriptedRng(values),
  };
}

describe('d10 CPRED-lite', () => {
  it('explose sur 10 et cumule', () => {
    const r = rollD10(scriptedRng([10, 10, 4]));
    expect(r.exploded).toBe(true);
    expect(r.faces).toEqual([10, 10, 4]);
    expect(r.value).toBe(24);
  });

  it('implose sur 1 et soustrait', () => {
    const r = rollD10(scriptedRng([1, 6]));
    expect(r.imploded).toBe(true);
    expect(r.value).toBe(-5);
  });

  it('ne boucle pas indefiniment sur une serie de 10', () => {
    const r = rollD10(scriptedRng([10]));
    expect(r.faces.length).toBeLessThanOrEqual(12);
    expect(Number.isFinite(r.value)).toBe(true);
  });

  it('renvoie la face brute entre 2 et 9', () => {
    const r = rollD10(scriptedRng([7]));
    expect(r.value).toBe(7);
    expect(r.exploded).toBe(false);
    expect(r.imploded).toBe(false);
  });
});

describe('check()', () => {
  it('additionne attribut, competence, de et modificateurs', () => {
    const result = check(scriptedRng([5]), {
      label: 'Test',
      attribute: 6,
      skill: 3,
      dv: 13,
      modifiers: [
        { label: 'couvert', value: -2 },
        { label: 'repere', value: 2 },
      ],
    });
    expect(result.total).toBe(6 + 3 + 5 + 0);
    expect(result.success).toBe(true);
    expect(result.margin).toBe(1);
  });

  it('ignore les modificateurs nuls', () => {
    const result = check(scriptedRng([5]), {
      label: 'Test',
      attribute: 1,
      skill: 1,
      dv: 5,
      modifiers: [{ label: 'rien', value: 0 }],
    });
    expect(result.modifiers).toHaveLength(0);
  });

  it('marque la reussite critique quand le de explose', () => {
    const result = check(scriptedRng([10, 3]), { label: 'Test', attribute: 1, skill: 1, dv: 30 });
    expect(result.critical).toBe(true);
    expect(result.success).toBe(false);
  });

  it('formatCheck produit une ligne lisible', () => {
    const rng = createRng('format');
    const result = check(rng, { label: 'Tir', attribute: 5, skill: 4, dv: 13 });
    const line = formatCheck(result);
    expect(line).toContain('Tir');
    expect(line).toMatch(/RÉUSSITE|ÉCHEC/);
  });
});
