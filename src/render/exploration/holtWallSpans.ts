import type { Cell } from '@/explore';
import type { HoltArchitectureLayout, HoltWallCell } from './holtArchitectureLayout';
import type { HoltWallShape } from './holtWallGeometry';

export interface HoltWallSpan {
  center: Cell;
  length: number;
}

/** Clips a wall-cell span into the perpendicular wall at uncontinued ends. */
export function wallSpanAt(
  layout: HoltArchitectureLayout,
  geometry: ReadonlyMap<string, HoltWallShape>,
  cell: HoltWallCell,
  length: number,
  depth: number,
): HoltWallSpan {
  return createWallSpanResolver(layout, geometry)(cell, length, depth);
}

/** Indexes the small HOLT wall plan once for repeated accessory placement. */
export function createWallSpanResolver(
  layout: HoltArchitectureLayout,
  geometry: ReadonlyMap<string, HoltWallShape>,
): (cell: HoltWallCell, length: number, depth: number) => HoltWallSpan {
  const byId = new Map(layout.cells.map((cell) => [cell.id, cell]));
  return (cell, length, depth) => {
    const center = { ...(geometry.get(cell.id)?.center ?? { x: cell.x, y: cell.y }) };
    const along = cell.axis === 'horizontal' ? 'x' : 'y';
    let min = center[along] - length / 2;
    let max = center[along] + length / 2;
    const step = cell.axis === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 };
    const negative = byId.get(`${cell.axis}:${cell.x - step.x},${cell.y - step.y}`);
    const positive = byId.get(`${cell.axis}:${cell.x + step.x},${cell.y + step.y}`);
    const oppositeAxis = cell.axis === 'horizontal' ? 'vertical' : 'horizontal';
    const perpendicular = byId.get(`${oppositeAxis}:${cell.x},${cell.y}`);
    if (perpendicular?.kind === 'wall') {
      const crossing =
        geometry.get(perpendicular.id)?.center[along] ?? (along === 'x' ? perpendicular.x : perpendicular.y);
      if (!negative) min = Math.max(min, crossing - depth / 2);
      if (!positive) max = Math.min(max, crossing + depth / 2);
    }
    const clippedLength = Math.max(0.001, max - min);
    center[along] = (min + max) / 2;
    return { center, length: clippedLength };
  };
}
