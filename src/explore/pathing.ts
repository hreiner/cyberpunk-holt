/**
 * Chemin le plus court sur la grille d'exploration : BFS uniforme, sans
 * limite de budget (à la différence de `src/tactical/pathfinding.ts`, qui
 * plafonne aux points de mouvement d'un tour). Même principe que le module
 * tactique — voisins explorés dans l'ordre fixe de `DIRECTIONS`, donc
 * déterministe — et réutilise ses constantes/format de clé en lecture seule
 * (voir la note dans `exploreMap.ts`).
 */

import { posKey } from '@/tactical/grid';
import type { Cell } from './types';
import type { ExploreMap } from './exploreMap';

export interface ReachResult {
  /** clé "x,y" -> coût (en cases) depuis l'origine. */
  costs: Map<string, number>;
  /** clé "x,y" -> case précédente sur le chemin. */
  cameFrom: Map<string, Cell>;
}

/**
 * Toutes les cases atteignables depuis `from`, sans limite, en respectant
 * l'état courant des portes. `isWalkableAt` doit inclure `from` lui-même.
 */
export function computeReach(map: ExploreMap, from: Cell, isWalkableAt: (c: Cell) => boolean): ReachResult {
  const costs = new Map<string, number>([[posKey(from), 0]]);
  const cameFrom = new Map<string, Cell>();
  let frontier: Cell[] = [from];
  let step = 1;

  while (frontier.length > 0) {
    const next: Cell[] = [];
    for (const cur of frontier) {
      for (const n of map.neighbors(cur, isWalkableAt)) {
        const key = posKey(n);
        if (costs.has(key)) continue;
        costs.set(key, step);
        cameFrom.set(key, cur);
        next.push(n);
      }
    }
    frontier = next;
    step++;
  }

  return { costs, cameFrom };
}

/** Chemin reconstruit depuis l'origine (exclue) jusqu'à `to` (incluse), ou `null` si hors de portée. */
export function pathTo(reach: ReachResult, to: Cell): Cell[] | null {
  const key = posKey(to);
  if (!reach.costs.has(key)) return null;
  const path: Cell[] = [];
  let cur: Cell | undefined = to;
  while (cur && reach.costs.get(posKey(cur)) !== 0) {
    path.push(cur);
    cur = reach.cameFrom.get(posKey(cur));
  }
  return path.reverse();
}

/**
 * Plus court chemin de `from` à `to`. Si `to` est inaccessible, se rabat sur
 * la case accessible la plus proche de `to` (08-EXPLORATION.md : "Un clic sur
 * une case inaccessible déplace vers la case accessible la plus proche").
 * `null` si `from` lui-même n'a aucune case accessible (ne devrait pas arriver).
 */
export function findPath(map: ExploreMap, from: Cell, to: Cell, isWalkableAt: (c: Cell) => boolean): Cell[] | null {
  const reach = computeReach(map, from, isWalkableAt);
  const direct = pathTo(reach, to);
  if (direct) return direct;

  let best: Cell | null = null;
  let bestDist = Infinity;
  for (const key of reach.costs.keys()) {
    const [xs, ys] = key.split(',');
    const cell = { x: Number(xs), y: Number(ys) };
    const dist = Math.hypot(cell.x - to.x, cell.y - to.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = cell;
    }
  }
  if (!best) return null;
  return pathTo(reach, best);
}
