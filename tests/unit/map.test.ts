import { describe, expect, it } from 'vitest';
import { YARD_MAP_ASCII } from '@/data/yard-map';
import { TacticalMap, posKey } from '@/tactical/grid';

describe('carte du container yard', () => {
  const map = new TacticalMap(YARD_MAP_ASCII);

  it('est rectangulaire', () => {
    const widths = new Set(YARD_MAP_ASCII.map((row) => row.length));
    expect(widths.size).toBe(1);
    expect(map.width).toBe(30);
    expect(map.height).toBe(20);
  });

  it('offre trois zones de deploiement par equipe', () => {
    expect(map.blueSpawns).toHaveLength(3);
    expect(map.redSpawns).toHaveLength(3);
  });

  it('place exactement une mine au depart', () => {
    expect(map.mineSpots).toHaveLength(1);
  });

  it('separe les deux camps : les bleus au sud, les rouges au nord', () => {
    const blueY = Math.min(...map.blueSpawns.map((s) => s.y));
    const redY = Math.max(...map.redSpawns.map((s) => s.y));
    expect(blueY).toBeGreaterThan(redY);
  });

  it('relie toutes les zones de deploiement (terrain connexe)', () => {
    const start = map.blueSpawns[0];
    expect(start).toBeDefined();
    const seen = new Set<string>([posKey(start!)]);
    const queue = [start!];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const n of map.neighbors(cur)) {
        if (!map.isWalkable(n)) continue;
        const key = posKey(n);
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push(n);
      }
    }
    for (const spawn of [...map.blueSpawns, ...map.redSpawns, ...map.mineSpots]) {
      expect(seen.has(posKey(spawn))).toBe(true);
    }
  });

  it('refuse une carte non rectangulaire', () => {
    expect(() => new TacticalMap(['...', '..'])).toThrow();
  });

  it('refuse un caractere inconnu', () => {
    expect(() => new TacticalMap(['..Z'])).toThrow();
  });
});
