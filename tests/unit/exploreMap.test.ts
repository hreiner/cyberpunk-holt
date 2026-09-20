import { describe, expect, it } from 'vitest';
import { ExploreMap, nearestWalkableCell } from '@/explore';
import { SMALL_MAP } from './fixtures/exploreFixtures';

describe('ExploreMap', () => {
  it('lit la légende exploration (sol, mur, porte)', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.kindAt({ x: 2, y: 2 })).toBe('floor');
    expect(map.kindAt({ x: 0, y: 0 })).toBe('wall');
    expect(map.kindAt({ x: 6, y: 2 })).toBe('door');
  });

  it('une case hors carte est "void" et jamais franchissable', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.kindAt({ x: -1, y: 0 })).toBe('void');
    expect(map.isWalkable({ x: -1, y: 0 })).toBe(false);
  });

  it('une porte est franchissable selon le prédicat fourni', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.isWalkable({ x: 6, y: 2 }, () => true)).toBe(true);
    expect(map.isWalkable({ x: 6, y: 2 }, () => false)).toBe(false);
    // Sans prédicat : ouverte par défaut.
    expect(map.isWalkable({ x: 6, y: 2 })).toBe(true);
  });

  it('un mur bloque la vue, une case franchissable non', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.blocksSight({ x: 0, y: 0 })).toBe(true);
    expect(map.blocksSight({ x: 2, y: 2 })).toBe(false);
  });

  it('les voisins ne coupent jamais un coin entre deux cases bloquées', () => {
    const map = new ExploreMap(SMALL_MAP);
    const isWalkable = (c: { x: number; y: number }) => map.isWalkable(c, () => true);
    // Depuis (5,3), les deux portes (6,2) et (6,4) sont franchissables (ouvertes), mais
    // le passage "en coin" vers elles est coupé par le mur (6,3) : elles ne doivent pas
    // apparaître dans les voisins malgré leur franchissabilité propre.
    const neighbors = map.neighbors({ x: 5, y: 3 }, isWalkable);
    expect(neighbors.some((n) => n.x === 6 && n.y === 2)).toBe(false);
    expect(neighbors.some((n) => n.x === 6 && n.y === 4)).toBe(false);
    // Le voisin orthogonal direct (au nord) reste, lui, accessible.
    expect(neighbors.some((n) => n.x === 5 && n.y === 2)).toBe(true);
  });

  it('nearestWalkableCell renvoie la case elle-même si elle est franchissable, sinon un voisin', () => {
    const map = new ExploreMap(SMALL_MAP);
    const isWalkable = (c: { x: number; y: number }) => map.isWalkable(c, () => true);
    expect(nearestWalkableCell(map, { x: 2, y: 2 }, isWalkable)).toEqual({ x: 2, y: 2 });
    // Un mur (0,0) doit retomber sur un voisin franchissable... ici tous les voisins sont des murs aussi,
    // donc on prend un vrai mur avec un voisin de sol : (0,1) est un mur, voisin (1,1) est du sol.
    expect(nearestWalkableCell(map, { x: 0, y: 1 }, isWalkable)).toEqual({ x: 1, y: 1 });
  });

  it('rejette une carte non rectangulaire', () => {
    expect(
      () =>
        new ExploreMap({
          ...SMALL_MAP,
          ascii: ['####', '#..#', '#...#', '####'],
        }),
    ).toThrow(/rectangulaire/);
  });

  it('rejette un caractère de légende inconnu', () => {
    expect(
      () =>
        new ExploreMap({
          ...SMALL_MAP,
          ascii: ['####', '#?.#', '#..#', '####'],
        }),
    ).toThrow(/inconnu/);
  });
});
