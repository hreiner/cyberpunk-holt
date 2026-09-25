/** A playable copy of the dormitory and its three thresholds. No chapter state is used. */
import type { MapDef } from '@/explore';
import { HOLT_MAP } from '@/data/maps/holt';
import { HOLT_VISUALS } from '@/data/exploreVisuals/holt';
import type { ExploreVisualMapDef, ExploreVisualPlacement } from '@/data/exploreVisualTypes';

const OFFSET_X = 21;
const WIDTH = 31;
const HEIGHT = 21;
const grid = Array.from({ length: HEIGHT }, (_, y) =>
  y <= 16
    ? HOLT_MAP.ascii[y]!.slice(OFFSET_X, OFFSET_X + WIDTH).split('')
    : Array.from({ length: WIDTH }, () => ' '),
);

// The original west corridor connects to the rest of the academy. Close the cut edge.
for (let y = 0; y <= 16; y++) grid[y]![0] = '#';
// The two south doors open onto short, playable pieces of the next corridors.
for (const [left, right] of [
  [7, 13],
  [20, 26],
] as const) {
  for (let y = 17; y <= 20; y++) {
    for (let x: number = left; x <= right; x++) {
      grid[y]![x] = y === 20 || x === left || x === right ? '#' : '.';
    }
  }
}

export const DORMITORY_PILOT_MAP: MapDef = {
  id: 'dormitory-pilot',
  title: 'Dortoir HOLT — pilote',
  ascii: grid.map((row) => row.join('')),
  rooms: [
    { id: 'dortoirs', title: 'Dortoirs', rect: { origin: { x: 5, y: 1 }, width: 25, height: 15 } },
    { id: 'couloir', title: 'Couloir de ceinture', rect: { origin: { x: 1, y: 1 }, width: 3, height: 15 } },
    { id: 'seuil-cour', title: 'Seuil de la cour', rect: { origin: { x: 8, y: 17 }, width: 5, height: 3 } },
    {
      id: 'seuil-cantine',
      title: 'Seuil de la cantine',
      rect: { origin: { x: 21, y: 17 }, width: 5, height: 3 },
    },
  ],
  entities: [
    {
      id: 'dortoir.casier',
      type: 'object',
      cell: { x: 14, y: 2 },
      label: 'Examiner le casier de Franklyn',
      line: 'Ses affaires sont rangées. Le lecteur de contrôle veille encore.',
    },
  ],
  spawns: { franklyn: { x: 8, y: 5 } },
};

function translate(placement: ExploreVisualPlacement): ExploreVisualPlacement {
  const move = (cell: { x: number; y: number }) => ({ x: cell.x - OFFSET_X, y: cell.y });
  return {
    ...placement,
    cell: move(placement.cell),
    footprint: placement.footprint?.map(move),
    replaces: placement.replaces?.map(move),
  };
}

const source = HOLT_VISUALS.placements
  .filter((placement) => placement.id.startsWith('dortoir.'))
  .map(translate);

export const DORMITORY_PILOT_VISUALS: ExploreVisualMapDef = {
  mapId: DORMITORY_PILOT_MAP.id,
  placements: [
    ...source,
    {
      id: 'dortoir.pilote-allee',
      model: 'pilot-aisle',
      cell: { x: 17, y: 8 },
      footprint: Array.from({ length: 9 }, (_, i) => ({ x: 17, y: i + 4 })),
      roomId: 'dortoirs',
    },
  ],
};

/** The same collision map with the old kit makes a like-for-like image and cost comparison. */
export const DORMITORY_BASELINE_VISUALS: ExploreVisualMapDef = {
  mapId: DORMITORY_PILOT_MAP.id,
  placements: source,
};
