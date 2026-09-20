import { describe, expect, it } from 'vitest';
import { ExploreMap, computeReach, pathTo, findPath } from '@/explore';
import { SMALL_MAP } from './fixtures/exploreFixtures';

const isWalkable = (map: ExploreMap) => (c: { x: number; y: number }) => map.isWalkable(c, () => true);

describe('computeReach / pathTo', () => {
  it('atteint toute case franchissable, sans limite de budget', () => {
    const map = new ExploreMap(SMALL_MAP);
    const reach = computeReach(map, { x: 2, y: 4 }, isWalkable(map));
    // (8,2) est dans l'autre pièce, franchissable seulement via la porte (6,2).
    expect(reach.costs.has('8,2')).toBe(true);
  });

  it('reconstruit un chemin cohérent, en passant par la porte', () => {
    const map = new ExploreMap(SMALL_MAP);
    const reach = computeReach(map, { x: 2, y: 4 }, isWalkable(map));
    const path = pathTo(reach, { x: 8, y: 2 });
    expect(path).not.toBeNull();
    expect(path?.some((c) => c.x === 6 && c.y === 2)).toBe(true);
    expect(path?.[path.length - 1]).toEqual({ x: 8, y: 2 });
  });

  it('renvoie null pour une case franchissable mais hors du domaine exploré (portes fermées)', () => {
    const map = new ExploreMap(SMALL_MAP);
    // Portes toutes fermées : la pièce B devient inaccessible.
    const closed = (c: { x: number; y: number }) => map.isWalkable(c, () => false);
    const reach = computeReach(map, { x: 2, y: 4 }, closed);
    expect(pathTo(reach, { x: 8, y: 2 })).toBeNull();
  });

  it('est déterministe : même origine, même carte -> même chemin', () => {
    const map = new ExploreMap(SMALL_MAP);
    const a = pathTo(computeReach(map, { x: 2, y: 4 }, isWalkable(map)), { x: 9, y: 4 });
    const b = pathTo(computeReach(map, { x: 2, y: 4 }, isWalkable(map)), { x: 9, y: 4 });
    expect(a).toEqual(b);
  });
});

describe('findPath', () => {
  it('retombe sur la case franchissable la plus proche si la cible est bloquée', () => {
    const map = new ExploreMap(SMALL_MAP);
    // (0,0) est un mur : findPath doit se rabattre sur une case franchissable proche.
    const path = findPath(map, { x: 2, y: 4 }, { x: 0, y: 0 }, isWalkable(map));
    expect(path).not.toBeNull();
    expect(path && path.length).toBeGreaterThan(0);
    const dest = path?.[path.length - 1] as { x: number; y: number };
    expect(map.isWalkable(dest, () => true)).toBe(true);
  });
});
