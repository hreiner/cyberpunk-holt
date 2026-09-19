import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { check } from '@/rules/dice';
import type { CheckInput } from '@/rules/dice';
import { successChance } from '@/narrative/odds';

const SIMULATION_ROLLS = 50000;
const TOLERANCE_POINTS = 2;

function simulate(input: CheckInput, seed: string): number {
  const rng = createRng(seed);
  let successes = 0;
  for (let i = 0; i < SIMULATION_ROLLS; i++) {
    if (check(rng, input).success) successes++;
  }
  return (successes / SIMULATION_ROLLS) * 100;
}

describe('successChance', () => {
  const scenarios: Array<{ label: string; input: CheckInput }> = [
    { label: 'jet moyen', input: { label: 'test', attribute: 5, skill: 3, dv: 13 } },
    { label: 'jet facile', input: { label: 'test', attribute: 8, skill: 6, dv: 9 } },
    { label: 'jet tres difficile', input: { label: 'test', attribute: 3, skill: 1, dv: 21 } },
    { label: 'jet quasi garanti', input: { label: 'test', attribute: 8, skill: 8, dv: 9 } },
    { label: 'jet quasi impossible', input: { label: 'test', attribute: 1, skill: 0, dv: 30 } },
    {
      label: 'jet avec modificateurs',
      input: { label: 'test', attribute: 5, skill: 3, dv: 15, modifiers: [{ label: 'couvert', value: -3 }] },
    },
  ];

  for (const { label, input } of scenarios) {
    it(`correspond a une simulation de ${SIMULATION_ROLLS} jets (${label})`, () => {
      const analytic = successChance(input);
      const simulated = simulate(input, `odds-${label}`);
      expect(Math.abs(analytic - simulated)).toBeLessThanOrEqual(TOLERANCE_POINTS);
    });
  }
});
