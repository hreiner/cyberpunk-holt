import { describe, expect, it } from 'vitest';
import { validateMap } from '@/explore';
import { BROKEN_MAPS, SMALL_MAP, YARD_ONLY_MAP } from './fixtures/exploreFixtures';

describe('validateMap', () => {
  it('accepte une carte correcte', () => {
    const result = validateMap(SMALL_MAP);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('accepte une tacticalArea dans les bornes de la carte', () => {
    expect(validateMap(YARD_ONLY_MAP).ok).toBe(true);
  });

  it('détecte une carte non rectangulaire', () => {
    const result = validateMap(BROKEN_MAPS.nonRectangular as never);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('rectangulaire'))).toBe(true);
  });

  it('détecte une porte qui ne repose pas sur un caractère "+"', () => {
    const result = validateMap(BROKEN_MAPS.doorNotOnWall as never);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('badDoor') && e.includes('+'))).toBe(true);
  });

  it('détecte des identifiants dupliqués', () => {
    const result = validateMap(BROKEN_MAPS.duplicateIds as never);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('dupliqué'))).toBe(true);
  });

  it("détecte une entité inatteignable depuis un point d'apparition", () => {
    const result = validateMap(BROKEN_MAPS.unreachable as never);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('inatteignable'))).toBe(true);
  });

  it('détecte une tacticalArea hors des bornes de la carte', () => {
    const result = validateMap(BROKEN_MAPS.tacticalAreaOutOfBounds as never);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('tacticalArea'))).toBe(true);
  });
});
