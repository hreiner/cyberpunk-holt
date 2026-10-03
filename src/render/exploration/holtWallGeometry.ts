import type { Cell } from '@/explore';
import type { HoltArchitectureLayout, HoltWallCell, HoltWallSide } from './holtArchitectureLayout';

export const HOLT_EXTERIOR_WALL_HEIGHT = 4.9;
export const HOLT_INTERIOR_WALL_HEIGHT = 2.45;

export interface HoltWallShape {
  center: Cell;
  height: number;
}

export interface ExplorationWallHeights {
  exterior: number;
  interior: number;
}

const DEFAULT_HEIGHTS: ExplorationWallHeights = {
  exterior: HOLT_EXTERIOR_WALL_HEIGHT,
  interior: HOLT_INTERIOR_WALL_HEIGHT,
};

const OPEN_COURTYARD_ROOM_IDS = new Set(['cour-interieure', 'cour']);
const HOLT_DOUBLE_ROW_MAP_IDS = new Set(['holt', 'holt-nuit']);

function bordersOpenCourtyard(face: HoltWallCell['faces'][number]): boolean {
  return [face.roomId, ...face.neighborIds].some((roomId) => OPEN_COURTYARD_ROOM_IDS.has(roomId));
}

type WallRun = HoltWallCell[];

/** Resolve one canonical plan for each contiguous physical wall run. */
export function buildHoltWallGeometry(
  layout: HoltArchitectureLayout,
  heights: ExplorationWallHeights = DEFAULT_HEIGHTS,
): ReadonlyMap<string, HoltWallShape> {
  const courtyardSegments = new Set<string>();
  for (const window of layout.windows) {
    if (window.exterior !== 'courtyard') continue;
    const cell = layout.cells.find(
      (candidate) => candidate.x === window.cell.x && candidate.y === window.cell.y,
    );
    for (const face of cell?.faces ?? [])
      if (face.roomId === window.roomId && face.side === window.side) courtyardSegments.add(face.segmentId);
  }

  const byLine = new Map<string, HoltWallCell[]>();
  for (const cell of layout.cells) {
    const fixed = cell.axis === 'vertical' ? cell.x : cell.y;
    const key = `${cell.axis}:${fixed}`;
    const line = byLine.get(key) ?? [];
    line.push(cell);
    byLine.set(key, line);
  }

  const geometry = new Map<string, HoltWallShape>();
  for (const line of byLine.values()) {
    line.sort((a, b) => (a.axis === 'vertical' ? a.y - b.y : a.x - b.x));
    for (const run of contiguousRuns(line)) {
      const shared = run.some((cell) => cell.faces.some((face) => face.sharedWall));
      const side = run.find((cell) => cell.faces.length)?.faces[0]?.side;
      const knownHeights = run.map((cell) => knownHeight(cell, layout, courtyardSegments, heights));
      const fallback =
        knownHeights.find((height): height is number => height !== undefined) ??
        (shared ? heights.interior : heights.exterior);
      for (let index = 0; index < run.length; index++) {
        const cell = run[index]!;
        const height = knownHeights[index] ?? nearestHeight(knownHeights, index) ?? fallback;
        const center = { x: cell.x, y: cell.y };
        if (!shared && side) offsetBoundary(center, side);
        geometry.set(cell.id, { center, height });
      }
    }
  }
  // Some HOLT joins have one ASCII wall row owned by each adjoining room. They
  // remain separate map cells (and keep their doors), but describe one visual
  // partition centered between the rows.
  canonicalizePairedBoundaries(layout, geometry, heights);
  return geometry;
}

function canonicalizePairedBoundaries(
  layout: HoltArchitectureLayout,
  geometry: Map<string, HoltWallShape>,
  heights: ExplorationWallHeights,
): void {
  if (!HOLT_DOUBLE_ROW_MAP_IDS.has(layout.mapId)) return;
  const byPosition = new Map(layout.cells.map((cell) => [`${cell.axis}:${cell.x},${cell.y}`, cell]));
  const paired = new Set<string>();
  const oppositeSides: Record<HoltWallSide, HoltWallSide> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
  };
  for (const cell of layout.cells) {
    if (paired.has(cell.id) || cell.faces.length === 0) continue;
    const face = cell.faces[0]!;
    // A cell that already carries both sides is one existing physical boundary, not
    // one half of a doubled ASCII seam (for example the fan wall in the narrow conduits).
    if (cell.faces.some((owner) => cell.faces.some((other) => other.side === oppositeSides[owner.side])))
      continue;
    const neighbor =
      face.side === 'north' || face.side === 'south'
        ? byPosition.get(`${cell.axis}:${cell.x},${cell.y + (face.side === 'south' ? 1 : -1)}`)
        : byPosition.get(`${cell.axis}:${cell.x + (face.side === 'east' ? 1 : -1)},${cell.y}`);
    if (!neighbor || neighbor.faces.length === 0 || paired.has(neighbor.id)) continue;
    const opposingFaces = cell.faces.flatMap((owner) =>
      neighbor.faces
        .filter((other) => other.side === oppositeSides[owner.side] && other.roomId !== owner.roomId)
        .map((other) => [owner, other] as const),
    );
    if (opposingFaces.length === 0) continue;
    const courtyardBoundary = [...cell.faces, ...neighbor.faces].some(bordersOpenCourtyard);
    const current = geometry.get(cell.id);
    const counterpart = geometry.get(neighbor.id);
    if (!current || !counterpart) continue;
    const along = cell.axis === 'horizontal' ? 'x' : 'y';
    const across = along === 'x' ? 'y' : 'x';
    const middle = ((along === 'x' ? cell.y : cell.x) + (along === 'x' ? neighbor.y : neighbor.x)) / 2;
    current.center[across] = middle;
    counterpart.center[across] = middle;
    current.height = courtyardBoundary ? heights.exterior : heights.interior;
    counterpart.height = courtyardBoundary ? heights.exterior : heights.interior;
    paired.add(cell.id);
    paired.add(neighbor.id);
  }
}

function contiguousRuns(line: HoltWallCell[]): WallRun[] {
  const runs: WallRun[] = [];
  for (const cell of line) {
    const last = runs[runs.length - 1];
    const previous = last?.[last.length - 1];
    const coordinate = cell.axis === 'vertical' ? cell.y : cell.x;
    const priorCoordinate = previous && (previous.axis === 'vertical' ? previous.y : previous.x);
    if (!last || coordinate !== priorCoordinate! + 1) runs.push([cell]);
    else last.push(cell);
  }
  return runs;
}

function knownHeight(
  cell: HoltWallCell,
  layout: HoltArchitectureLayout,
  courtyardSegments: ReadonlySet<string>,
  heights: ExplorationWallHeights,
): number | undefined {
  if (cell.faces.some((face) => bordersOpenCourtyard(face) || courtyardSegments.has(face.segmentId)))
    return heights.exterior;
  if (cell.faces.some((face) => face.sharedWall)) return heights.interior;
  if (
    cell.faces.some(
      (face) =>
        face.neighborIds.includes('exterior') ||
        (face.roomId === 'cour-interieure' && face.neighborIds.includes('structure')),
    )
  )
    return heights.exterior;
  if (layout.windows.some((window) => window.cell.x === cell.x && window.cell.y === cell.y))
    return heights.exterior;
  return undefined;
}

function nearestHeight(heights: Array<number | undefined>, index: number): number | undefined {
  for (let distance = 1; distance < heights.length; distance++) {
    const before = heights[index - distance];
    const after = heights[index + distance];
    if (before !== undefined) return before;
    if (after !== undefined) return after;
  }
  return undefined;
}

function offsetBoundary(center: Cell, side: HoltWallSide): void {
  if (side === 'west' || side === 'north') {
    if (side === 'west') center.x += 0.5;
    else center.y += 0.5;
  } else if (side === 'east') center.x -= 0.5;
  else center.y -= 0.5;
}
