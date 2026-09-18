import { describe, expect, it } from 'vitest';
import { TacticalMap, posKey } from '@/tactical/grid';
import { computeReach, pathTo, reachableList } from '@/tactical/pathfinding';

const OPEN = ['.....', '.....', '.....', '.....', '.....'];
const WALLED = ['.....', '.###.', '.....', '.###.', '.....'];

describe('computeReach', () => {
  it('atteint toutes les cases dans le budget, diagonales comprises', () => {
    const map = new TacticalMap(OPEN);
    const reach = computeReach(map, { x: 2, y: 2 }, 1, new Set());
    // 8 voisins accessibles depuis le centre d'une zone degagee.
    expect(reachableList(reach)).toHaveLength(8);
  });

  it('respecte le budget de points de mouvement', () => {
    const map = new TacticalMap(OPEN);
    const reach = computeReach(map, { x: 0, y: 0 }, 2, new Set());
    const cells = reachableList(reach);
    expect(cells.every((c) => c.cost <= 2)).toBe(true);
    expect(cells.some((c) => c.pos.x === 2 && c.pos.y === 2)).toBe(true);
    expect(cells.some((c) => c.pos.x === 3 && c.pos.y === 3)).toBe(false);
  });

  it('contourne les obstacles', () => {
    const map = new TacticalMap(WALLED);
    // (2,2) est a 2 cases a vol d'oiseau mais derriere un mur plein : il faut
    // faire tout le tour, et les diagonales "en coin" sont interdites.
    const tooShort = computeReach(map, { x: 2, y: 0 }, 3, new Set());
    expect(tooShort.costs.get(posKey({ x: 2, y: 2 }))).toBe(undefined);

    const enough = computeReach(map, { x: 2, y: 0 }, 8, new Set());
    expect(enough.costs.get(posKey({ x: 2, y: 2 }))).toBe(6);
  });

  it('ne traverse pas les cases occupees', () => {
    const map = new TacticalMap(OPEN);
    const blocked = new Set([posKey({ x: 1, y: 0 })]);
    const reach = computeReach(map, { x: 0, y: 0 }, 1, blocked);
    expect(reach.costs.has(posKey({ x: 1, y: 0 }))).toBe(false);
  });

  it('reconstruit un chemin coherent', () => {
    const map = new TacticalMap(OPEN);
    const reach = computeReach(map, { x: 0, y: 0 }, 4, new Set());
    const path = pathTo(reach, { x: 3, y: 3 });
    expect(path).not.toBeNull();
    expect(path).toHaveLength(3);
    expect(path?.[path.length - 1]).toEqual({ x: 3, y: 3 });
  });

  it('renvoie null pour une case hors de portee', () => {
    const map = new TacticalMap(OPEN);
    const reach = computeReach(map, { x: 0, y: 0 }, 1, new Set());
    expect(pathTo(reach, { x: 4, y: 4 })).toBeNull();
  });

  it('est deterministe', () => {
    const map = new TacticalMap(WALLED);
    const a = pathTo(computeReach(map, { x: 0, y: 0 }, 6, new Set()), { x: 4, y: 4 });
    const b = pathTo(computeReach(map, { x: 0, y: 0 }, 6, new Set()), { x: 4, y: 4 });
    expect(a).toEqual(b);
  });
});
