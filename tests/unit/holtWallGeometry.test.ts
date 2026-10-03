import { describe, expect, it } from 'vitest';
import { HOLT_MAP } from '@/data/maps/holt';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';
import { buildHoltArchitectureLayout } from '@/render/exploration/holtArchitectureLayout';
import {
  buildHoltWallGeometry,
  HOLT_EXTERIOR_WALL_HEIGHT,
  HOLT_INTERIOR_WALL_HEIGHT,
} from '@/render/exploration/holtWallGeometry';
import { HOLT_STAGED_ARCHITECTURE_PROFILES } from '@/render/exploration/holtRoomProfiles';

const centreArchitectureProfiles = [
  {
    id: 'centre-examen-room-envelopes',
    roomIds: CENTRE_EXAMEN_MAP.rooms.map((room) => room.id),
    sides: ['north', 'south', 'east', 'west'] as const,
  },
];

const layout = buildHoltArchitectureLayout(HOLT_MAP, HOLT_STAGED_ARCHITECTURE_PROFILES);
const geometry = buildHoltWallGeometry(layout);

describe('plan canonique des murs HOLT', () => {
  it('garde chaque run contigu sur un même plan, y compris les raccords de seuils', () => {
    expect(geometry.size).toBe(layout.cells.length);
    // Every neighbouring segment must meet on the same physical plane.
    for (const cell of layout.cells) {
      const nextId =
        cell.axis === 'vertical' ? `vertical:${cell.x},${cell.y + 1}` : `horizontal:${cell.x + 1},${cell.y}`;
      const next = geometry.get(nextId);
      if (!next) continue;
      const current = geometry.get(cell.id)!;
      if (cell.axis === 'vertical') {
        expect(next.center.x, `${cell.id} → ${nextId}`).toBe(current.center.x);
        expect(next.center.y - current.center.y).toBe(1);
      } else {
        expect(next.center.y, `${cell.id} → ${nextId}`).toBe(current.center.y);
        expect(next.center.x - current.center.x).toBe(1);
      }
    }
    for (const cell of layout.cells.filter((candidate) => candidate.axis === 'vertical')) {
      const perpendicular = geometry.get(`horizontal:${cell.x},${cell.y}`);
      if (!perpendicular) continue;
      const current = geometry.get(cell.id)!;
      // Half of the long body (1.02) plus half of its depth (.34).
      expect(Math.abs(current.center.x - perpendicular.center.x), cell.id).toBeLessThanOrEqual(0.68);
      expect(Math.abs(current.center.y - perpendicular.center.y), cell.id).toBeLessThanOrEqual(0.68);
    }
    const corridorRun = [7, 8, 9].map((y) => geometry.get(`vertical:17,${y}`)!);
    expect(corridorRun.map((wall) => wall.center.x)).toEqual([17, 17, 17]);
    expect(corridorRun.map((wall) => wall.center.y)).toEqual([7, 8, 9]);

    const westHallCorner = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((y) => geometry.get(`vertical:4,${y}`)!);
    expect(westHallCorner.every((wall) => wall.center.x === 4)).toBe(true);
    expect(
      westHallCorner.slice(1).map((wall, index) => wall.center.y - westHallCorner[index]!.center.y),
    ).toEqual(Array(8).fill(1));
  });

  it('abaisse les séparations intérieures et garde hautes les façades ouvertes sur la cour et les Badlands', () => {
    expect(geometry.get('horizontal:5,23')?.height).toBe(HOLT_INTERIOR_WALL_HEIGHT);

    const courtyardSegments = new Set(
      layout.windows
        .filter((window) => window.exterior === 'courtyard')
        .flatMap(
          (window) =>
            layout.cells
              .find((cell) => cell.x === window.cell.x && cell.y === window.cell.y)
              ?.faces.filter((face) => face.roomId === window.roomId && face.side === window.side)
              .map((face) => face.segmentId) ?? [],
        ),
    );
    const courtyardFaces = layout.cells.filter((cell) =>
      cell.faces.some((face) => courtyardSegments.has(face.segmentId)),
    );
    expect(courtyardFaces.length).toBeGreaterThan(0);
    expect(courtyardFaces.every((cell) => geometry.get(cell.id)?.height === HOLT_EXTERIOR_WALL_HEIGHT)).toBe(
      true,
    );
    expect(geometry.get('horizontal:30,31')?.height).toBe(HOLT_EXTERIOR_WALL_HEIGHT);

    const badlandsBay = layout.windows.find((window) => window.exterior === 'badlands')!;
    expect(geometry.get(`vertical:${badlandsBay.cell.x},${badlandsBay.cell.y}`)?.height).toBe(
      HOLT_EXTERIOR_WALL_HEIGHT,
    );
  });

  it('réunit les deux rangées cantine-entraînement sur une cloison intérieure unique', () => {
    const south = geometry.get('horizontal:44,31');
    const north = geometry.get('horizontal:44,32');
    expect(south?.center.y).toBe(31.5);
    expect(north?.center.y).toBe(31.5);
    expect(south?.height).toBe(HOLT_INTERIOR_WALL_HEIGHT);
    expect(north?.height).toBe(HOLT_INTERIOR_WALL_HEIGHT);
  });

  it('garde haute la façade de la cour de containers face à la salle 3', () => {
    const centreLayout = buildHoltArchitectureLayout(CENTRE_EXAMEN_MAP, centreArchitectureProfiles);
    const centreGeometry = buildHoltWallGeometry(centreLayout);
    const courtyardWall = centreLayout.cells.find(
      (cell) =>
        cell.id === 'horizontal:20,21' &&
        cell.faces.some((face) => face.roomId === 'cour') &&
        cell.faces.some((face) => face.roomId === 'salle3'),
    );
    expect(courtyardWall?.faces.some((face) => face.sharedWall)).toBe(true);
    expect(courtyardWall && centreGeometry.get(courtyardWall.id)?.height).toBe(HOLT_EXTERIOR_WALL_HEIGHT);
  });
});
