/**
 * Couloirs d'une carte d'exploration, déduits du plan (ADR 0027) : tout espace de sol qui n'est
 * dans aucune `RoomDef`. Sert au rendu des murs en coupe (08-EXPLORATION.md "Murs en coupe") :
 * une pièce coupe les murs de son pourtour tournés vers la caméra ; un couloir fait de même,
 * mais seulement quand le meneur s'y trouve (la vue sur les pièces voisines ne change pas
 * tant qu'on n'est pas dans le couloir).
 *
 * Aucune annotation dans les données : un couloir est une composante connexe (quatre voisins)
 * de cases « d'espace » (sol, mobilier, végétation) situées hors de tout rectangle de pièce.
 * Ses murs sont les cases `wall`/`door` qui le bordent.
 */

import { inRect, posKey } from './exploreMap';
import type { ExploreMap } from './exploreMap';
import type { Cell, ExploreCellKind, MapDef } from './types';

/** Côté d'un espace où se trouve un mur (le mur `north` est au nord de l'espace qu'il borde). */
export type WallSide = 'north' | 'south' | 'east' | 'west';

export interface CorridorRegion {
  id: string;
  /** Cases de l'espace du couloir. */
  cells: Cell[];
  /** posKey(case de mur ou de porte) -> côtés du couloir qu'elle borde. */
  wallSides: Map<string, WallSide[]>;
}

export interface CorridorLayout {
  regions: CorridorRegion[];
  /** posKey(case) -> id du couloir qui la contient. */
  regionByCell: Map<string, string>;
}

const SPACE_KINDS: ReadonlySet<ExploreCellKind> = new Set<ExploreCellKind>([
  'floor',
  'furnitureLow',
  'furnitureHigh',
  'vegetation',
]);

const ORTHOGONAL: readonly [number, number, WallSide][] = [
  [0, -1, 'north'],
  [0, 1, 'south'],
  [1, 0, 'east'],
  [-1, 0, 'west'],
];

const DIAGONAL: readonly [number, number, WallSide, WallSide][] = [
  [-1, -1, 'north', 'west'],
  [1, -1, 'north', 'east'],
  [-1, 1, 'south', 'west'],
  [1, 1, 'south', 'east'],
];

function isWallLike(kind: ExploreCellKind): boolean {
  return kind === 'wall' || kind === 'door';
}

function addSide(target: Map<string, WallSide[]>, key: string, side: WallSide): void {
  const sides = target.get(key) ?? [];
  if (!sides.includes(side)) sides.push(side);
  target.set(key, sides);
}

/**
 * Couloirs de `def`, lus sur `map`. Un coin de couloir (case de mur qui ne touche le couloir
 * qu'en diagonale) reçoit les deux côtés, comme le coin d'un anneau de pièce ; une case de mur
 * qui le touche orthogonalement ne reçoit que ses côtés orthogonaux.
 */
export function computeCorridors(map: ExploreMap, def: MapDef): CorridorLayout {
  const isCorridorSpace = (cell: Cell): boolean =>
    SPACE_KINDS.has(map.kindAt(cell)) && !def.rooms.some((room) => inRect(cell, room.rect));

  const regionByCell = new Map<string, string>();
  const regions: CorridorRegion[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const start = { x, y };
      if (regionByCell.has(posKey(start)) || !isCorridorSpace(start)) continue;
      const id = `couloir-${regions.length + 1}`;
      const cells: Cell[] = [];
      const stack = [start];
      regionByCell.set(posKey(start), id);
      while (stack.length > 0) {
        const cell = stack.pop() as Cell;
        cells.push(cell);
        for (const [dx, dy] of ORTHOGONAL) {
          const next = { x: cell.x + dx, y: cell.y + dy };
          if (regionByCell.has(posKey(next)) || !isCorridorSpace(next)) continue;
          regionByCell.set(posKey(next), id);
          stack.push(next);
        }
      }
      regions.push({ id, cells, wallSides: wallSidesOf(map, cells) });
    }
  }
  return { regions, regionByCell };
}

function wallSidesOf(map: ExploreMap, cells: Cell[]): Map<string, WallSide[]> {
  const orthogonal = new Map<string, WallSide[]>();
  const diagonal = new Map<string, WallSide[]>();
  for (const cell of cells) {
    for (const [dx, dy, side] of ORTHOGONAL) {
      const wall = { x: cell.x + dx, y: cell.y + dy };
      if (isWallLike(map.kindAt(wall))) addSide(orthogonal, posKey(wall), side);
    }
    for (const [dx, dy, a, b] of DIAGONAL) {
      const wall = { x: cell.x + dx, y: cell.y + dy };
      if (!isWallLike(map.kindAt(wall))) continue;
      addSide(diagonal, posKey(wall), a);
      addSide(diagonal, posKey(wall), b);
    }
  }
  for (const [key, sides] of diagonal) {
    if (!orthogonal.has(key)) orthogonal.set(key, sides);
  }
  return orthogonal;
}
