/**
 * Plan pur de l'enveloppe HOLT. Une case ASCII de mur n'appartient qu'à une
 * seule séparation physique, même si deux pièces la rencontrent.
 */
import type { MapDef, Rect } from '@/explore';

export type HoltWallSide = 'north' | 'south' | 'east' | 'west';
export type HoltWallAxis = 'horizontal' | 'vertical';

export interface HoltWallFace {
  roomId: string;
  side: HoltWallSide;
  alwaysVisible?: boolean;
  /** Stable topology partition, including the room/corridor on each side. */
  segmentId: string;
  neighborIds: readonly [string, string];
  sharedWall: boolean;
}

export interface HoltWallCell {
  /** Stable across builds: orientation plus the map cell coordinate. */
  id: string;
  x: number;
  y: number;
  axis: HoltWallAxis;
  /** '#' is a solid panel; '+' is a real opening in that panel. */
  kind: 'wall' | 'opening';
  faces: readonly HoltWallFace[];
  doorId?: string;
}

export interface HoltArchitectureLayout {
  mapId: string;
  profileId: string;
  cells: readonly HoltWallCell[];
  /** Map cells whose generic wall cubes the caller must omit. */
  replacedWallCells: ReadonlySet<string>;
  /** Same coordinates as MapDef ASCII cells, for renderer-level wall replacement. */
  replacedCellKeys: ReadonlySet<string>;
  /** True apertures cut into owned exterior wall cells. */
  windows: readonly HoltArchitectureWindow[];
}

export interface HoltArchitectureWindow {
  id: string;
  roomId: string;
  cell: { x: number; y: number };
  side: HoltWallSide;
  width: number;
  height: number;
  sillHeight: number;
  exterior: 'badlands' | 'courtyard';
  /** The neighboring interior must be discovered before this opening reveals its view. */
  viewRoomId?: string;
  /** Corridors are discovered as circulation, rather than RoomDefs. */
  alwaysVisible?: boolean;
}

export interface HoltArchitectureProfile {
  id: string;
  roomIds: readonly string[];
  sides: readonly HoltWallSide[];
  /** Per-room side selection for staged conversion while the profile contains several rooms. */
  sidesByRoom?: Readonly<Record<string, readonly HoltWallSide[]>>;
  /** Optional corridor/annex rectangles not represented as RoomDefs on the map. */
  regions?: readonly {
    id: string;
    rect: Rect;
    sides: readonly HoltWallSide[];
    alwaysVisible?: boolean;
  }[];
  windows?: readonly Omit<HoltArchitectureWindow, 'roomId'>[];
}

const CELL_KEY = (x: number, y: number) => `${x},${y}`;
const WALL_CELL_KEY = (axis: HoltWallAxis, x: number, y: number) => `${axis}:${x},${y}`;

function charAt(def: MapDef, x: number, y: number): string | undefined {
  if (y < 0 || y >= def.ascii.length) return undefined;
  return (def.ascii[y] as string)[x];
}

function edgeCells(rect: Rect, side: HoltWallSide): Array<{ x: number; y: number; axis: HoltWallAxis }> {
  const { x: ox, y: oy } = rect.origin;
  const { width, height } = rect;
  switch (side) {
    case 'west':
      return Array.from({ length: height + 2 }, (_, i) => ({ x: ox - 1, y: oy - 1 + i, axis: 'vertical' }));
    case 'east':
      return Array.from({ length: height + 2 }, (_, i) => ({
        x: ox + width,
        y: oy - 1 + i,
        axis: 'vertical',
      }));
    case 'north':
      return Array.from({ length: width + 2 }, (_, i) => ({ x: ox - 1 + i, y: oy - 1, axis: 'horizontal' }));
    case 'south':
      return Array.from({ length: width + 2 }, (_, i) => ({
        x: ox - 1 + i,
        y: oy + height,
        axis: 'horizontal',
      }));
  }
}

function contains(rect: Rect, x: number, y: number): boolean {
  return (
    x >= rect.origin.x &&
    y >= rect.origin.y &&
    x < rect.origin.x + rect.width &&
    y < rect.origin.y + rect.height
  );
}

function adjacentRegion(
  def: MapDef,
  regions: ReadonlyMap<string, { rect: Rect }>,
  x: number,
  y: number,
): string {
  for (const [id, region] of regions) if (contains(region.rect, x, y)) return id;
  const char = charAt(def, x, y);
  if (char === '.' || char === '+') return 'corridor';
  return char === undefined || char === ' ' ? 'exterior' : 'structure';
}

function neighborCells(
  cell: { x: number; y: number },
  side: HoltWallSide,
): readonly [number, number, number, number] {
  switch (side) {
    case 'west':
      return [cell.x + 1, cell.y, cell.x - 1, cell.y];
    case 'east':
      return [cell.x - 1, cell.y, cell.x + 1, cell.y];
    case 'north':
      return [cell.x, cell.y + 1, cell.x, cell.y - 1];
    case 'south':
      return [cell.x, cell.y - 1, cell.x, cell.y + 1];
  }
}

/** Pure ASCII/room-derived layout. No DOM, Three.js, or runtime state is read. */
export function buildHoltArchitectureLayout(
  def: MapDef,
  profileInput: HoltArchitectureProfile | readonly HoltArchitectureProfile[],
): HoltArchitectureLayout {
  const profiles: readonly HoltArchitectureProfile[] = Array.isArray(profileInput)
    ? profileInput
    : [profileInput as HoltArchitectureProfile];
  const regions = new Map<
    string,
    { id: string; rect: Rect; sides: readonly HoltWallSide[]; alwaysVisible?: boolean }
  >();
  const adjacencyRegions = new Map<string, { rect: Rect }>(
    def.rooms.map((room) => [room.id, { rect: room.rect }]),
  );
  for (const profile of profiles) {
    for (const roomId of profile.roomIds) {
      const room = def.rooms.find((candidate) => candidate.id === roomId);
      if (room)
        regions.set(roomId, {
          id: room.id,
          rect: room.rect,
          sides: profile.sidesByRoom?.[roomId] ?? profile.sides,
        });
    }
    for (const region of profile.regions ?? []) {
      regions.set(region.id, region);
      adjacencyRegions.set(region.id, { rect: region.rect });
    }
  }
  const cells = new Map<
    string,
    { x: number; y: number; axis: HoltWallAxis; kind: 'wall' | 'opening'; faces: HoltWallFace[] }
  >();
  const windows: HoltArchitectureWindow[] = [];
  for (const region of regions.values()) {
    for (const side of region.sides) {
      for (const cell of edgeCells(region.rect, side)) {
        const mark = charAt(def, cell.x, cell.y);
        if (mark !== '#' && mark !== '+') continue;
        const key = WALL_CELL_KEY(cell.axis, cell.x, cell.y);
        const [insideX, insideY, outsideX, outsideY] = neighborCells(cell, side);
        const neighborIds = [
          adjacentRegion(def, adjacencyRegions, insideX, insideY),
          adjacentRegion(def, adjacencyRegions, outsideX, outsideY),
        ] as const;
        const segmentId = `${region.id}:${side}:${neighborIds[0]}|${neighborIds[1]}`;
        const sharedWall =
          neighborIds[0] !== neighborIds[1] &&
          adjacencyRegions.has(neighborIds[0]) &&
          adjacencyRegions.has(neighborIds[1]);
        const plan = cells.get(key) ?? {
          ...cell,
          kind: mark === '+' ? ('opening' as const) : ('wall' as const),
          faces: [],
        };
        if (mark === '+') plan.kind = 'opening';
        if (!plan.faces.some((face) => face.roomId === region.id && face.side === side)) {
          plan.faces.push({
            roomId: region.id,
            side,
            segmentId,
            neighborIds,
            sharedWall,
            ...(region.alwaysVisible ? { alwaysVisible: true } : {}),
          });
        }
        cells.set(key, plan);
      }
    }
  }
  for (const profile of profiles) {
    for (const roomId of [...profile.roomIds, ...(profile.regions ?? []).map((region) => region.id)]) {
      const configured = profile.windows ?? [];
      for (const window of configured) {
        if (!regions.get(roomId)?.sides.includes(window.side)) continue;
        if (charAt(def, window.cell.x, window.cell.y) !== '#') continue;
        const wall = [...cells.values()].find((cell) => cell.x === window.cell.x && cell.y === window.cell.y &&
          cell.faces.some((face) => face.roomId === roomId && face.side === window.side));
        if (!wall) continue;
        windows.push({ ...window, roomId, alwaysVisible: regions.get(roomId)?.alwaysVisible });
      }
    }
  }

  const doors = new Map(
    def.entities
      .filter((entity) => entity.type === 'door')
      .map((entity) => [CELL_KEY(entity.cell.x, entity.cell.y), entity.id]),
  );
  const ordered = [...cells.values()].sort((a, b) => a.y - b.y || a.x - b.x || a.axis.localeCompare(b.axis));
  const layoutCells: HoltWallCell[] = ordered.map((cell) => ({
    id: WALL_CELL_KEY(cell.axis, cell.x, cell.y),
    x: cell.x,
    y: cell.y,
    axis: cell.axis,
    kind: cell.kind,
    faces: cell.faces,
    ...(doors.has(CELL_KEY(cell.x, cell.y)) ? { doorId: doors.get(CELL_KEY(cell.x, cell.y)) } : {}),
  }));
  return {
    mapId: def.id,
    profileId: profiles.map((profile) => profile.id).join('+'),
    cells: layoutCells,
    replacedWallCells: new Set(layoutCells.map((cell) => CELL_KEY(cell.x, cell.y))),
    replacedCellKeys: new Set(layoutCells.map((cell) => CELL_KEY(cell.x, cell.y))),
    windows,
  };
}
