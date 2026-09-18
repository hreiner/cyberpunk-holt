/**
 * Deplacement sur la grille : BFS uniforme (toute case voisine coute 1 point de
 * mouvement, diagonales comprises, cf. docs/design/05-TACTICAL-COMBAT.md).
 *
 * Le BFS est deterministe : les voisins sont explores dans l'ordre fixe de
 * `DIRECTIONS`, ce qui garantit le meme chemin pour les memes entrees.
 */

import type { TacticalMap } from './grid';
import { posKey } from './grid';
import type { Vec2 } from './types';

export interface ReachableCell {
  pos: Vec2;
  cost: number;
}

export interface ReachResult {
  /** cle "x,y" -> cout depuis l'origine. */
  costs: Map<string, number>;
  /** cle "x,y" -> case precedente sur le chemin. */
  cameFrom: Map<string, Vec2>;
}

/**
 * Cases atteignables depuis `from` avec au plus `budget` points de mouvement.
 * `blocked` contient les cases occupees par d'autres unites.
 */
export function computeReach(
  map: TacticalMap,
  from: Vec2,
  budget: number,
  blocked: ReadonlySet<string>,
): ReachResult {
  const costs = new Map<string, number>([[posKey(from), 0]]);
  const cameFrom = new Map<string, Vec2>();
  let frontier: Vec2[] = [from];

  for (let step = 1; step <= budget; step++) {
    const next: Vec2[] = [];
    for (const cur of frontier) {
      for (const n of map.neighbors(cur)) {
        const key = posKey(n);
        if (costs.has(key)) continue;
        if (!map.isWalkable(n)) continue;
        if (blocked.has(key)) continue;
        costs.set(key, step);
        cameFrom.set(key, cur);
        next.push(n);
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }

  return { costs, cameFrom };
}

export function reachableList(reach: ReachResult): ReachableCell[] {
  const out: ReachableCell[] = [];
  for (const [key, cost] of reach.costs) {
    if (cost === 0) continue;
    const [xs, ys] = key.split(',');
    out.push({ pos: { x: Number(xs), y: Number(ys) }, cost });
  }
  return out.sort((a, b) => a.cost - b.cost || a.pos.y - b.pos.y || a.pos.x - b.pos.x);
}

/** Chemin reconstruit depuis l'origine (exclue) jusqu'a `to` (incluse), ou null. */
export function pathTo(reach: ReachResult, to: Vec2): Vec2[] | null {
  const key = posKey(to);
  if (!reach.costs.has(key)) return null;
  const path: Vec2[] = [];
  let cur: Vec2 | undefined = to;
  while (cur && reach.costs.get(posKey(cur)) !== 0) {
    path.push(cur);
    cur = reach.cameFrom.get(posKey(cur));
  }
  return path.reverse();
}
