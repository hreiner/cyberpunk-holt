import { describe, expect, it } from 'vitest';
import { CAMPEMENT_MAP } from '@/data/maps/campement';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';
import { CONDUITS_MAP } from '@/data/maps/conduits';
import { HOLT_MAP } from '@/data/maps/holt';
import {
  buildHoltArchitectureLayout,
  type HoltArchitectureProfile,
} from '@/render/exploration/holtArchitectureLayout';
import { HOLT_STAGED_ARCHITECTURE_PROFILES } from '@/render/exploration/holtRoomProfiles';
import { buildHoltWallGeometry } from '@/render/exploration/holtWallGeometry';
import { createWallSpanResolver } from '@/render/exploration/holtWallSpans';
import { HOLT_INTERIOR_WALL_HEIGHT } from '@/render/exploration/holtWallGeometry';

const allRoomEnvelope = (mapId: string, rooms: readonly { id: string }[]): HoltArchitectureProfile => ({
  id: `${mapId}-wall-span-coverage`,
  roomIds: rooms.map((room) => room.id),
  sides: ['north', 'south', 'east', 'west'],
});

const maps = [
  { def: HOLT_MAP, profiles: HOLT_STAGED_ARCHITECTURE_PROFILES },
  { def: CENTRE_EXAMEN_MAP, profiles: [allRoomEnvelope(CENTRE_EXAMEN_MAP.id, CENTRE_EXAMEN_MAP.rooms)] },
  { def: CAMPEMENT_MAP, profiles: [allRoomEnvelope(CAMPEMENT_MAP.id, CAMPEMENT_MAP.rooms)] },
  { def: CONDUITS_MAP, profiles: [allRoomEnvelope(CONDUITS_MAP.id, CONDUITS_MAP.rooms)] },
];

describe('finitions des extrémités de murs HOLT', () => {
  it('place les deux faces de la jonction doublée sur le même axe intérieur', () => {
    const layout = buildHoltArchitectureLayout(HOLT_MAP, HOLT_STAGED_ARCHITECTURE_PROFILES);
    const geometry = buildHoltWallGeometry(layout);
    const spanAt = createWallSpanResolver(layout, geometry);
    const first = layout.cells.find((cell) => cell.id === 'horizontal:44,31')!;
    const second = layout.cells.find((cell) => cell.id === 'horizontal:44,32')!;
    expect(geometry.get(first.id)?.center.y).toBe(31.5);
    expect(geometry.get(second.id)?.center.y).toBe(31.5);
    expect(geometry.get(first.id)?.height).toBe(HOLT_INTERIOR_WALL_HEIGHT);
    expect(geometry.get(second.id)?.height).toBe(HOLT_INTERIOR_WALL_HEIGHT);
    expect(spanAt(first, 1.02, 0.34).center.y).toBe(spanAt(second, 1.02, 0.34).center.y);
  });

  it('fait se recouvrir les panneaux rognés aux vrais raccords en L et en T des cartes', () => {
    let checkedL = 0;
    let checkedT = 0;
    for (const { def, profiles } of maps) {
      const layout = buildHoltArchitectureLayout(def, profiles);
      const geometry = buildHoltWallGeometry(layout);
      const spanAt = createWallSpanResolver(layout, geometry);
      for (const horizontal of layout.cells.filter(
        (cell) => cell.axis === 'horizontal' && cell.kind === 'wall',
      )) {
        const vertical = layout.cells.find(
          (cell) =>
            cell.x === horizontal.x &&
            cell.y === horizontal.y &&
            cell.axis === 'vertical' &&
            cell.kind === 'wall',
        );
        if (!vertical) continue;
        const h = spanAt(horizontal, 1.02, 0.34);
        const v = spanAt(vertical, 1.02, 0.34);
        const horizontalCenter = geometry.get(horizontal.id)!.center;
        const verticalCenter = geometry.get(vertical.id)!.center;
        const hMin = h.center.x - h.length / 2;
        const hMax = h.center.x + h.length / 2;
        const vMin = v.center.y - v.length / 2;
        const vMax = v.center.y + v.length / 2;
        const xOverlap = Math.min(hMax, verticalCenter.x + 0.17) - Math.max(hMin, verticalCenter.x - 0.17);
        const zOverlap =
          Math.min(vMax, horizontalCenter.y + 0.17) - Math.max(vMin, horizontalCenter.y - 0.17);
        expect(xOverlap, `${def.id} ${horizontal.id}/${vertical.id} X`).toBeGreaterThan(0);
        expect(zOverlap, `${def.id} ${horizontal.id}/${vertical.id} Z`).toBeGreaterThan(0);
        const horizontalNeighbors = layout.cells.filter(
          (cell) =>
            cell.axis === 'horizontal' && cell.y === horizontal.y && Math.abs(cell.x - horizontal.x) === 1,
        ).length;
        const verticalNeighbors = layout.cells.filter(
          (cell) => cell.axis === 'vertical' && cell.x === vertical.x && Math.abs(cell.y - vertical.y) === 1,
        ).length;
        if (horizontalNeighbors === 1 && verticalNeighbors === 1) checkedL++;
        if (
          (horizontalNeighbors === 2 && verticalNeighbors === 1) ||
          (horizontalNeighbors === 1 && verticalNeighbors === 2)
        )
          checkedT++;
      }
    }
    expect(checkedL).toBeGreaterThan(0);
    expect(checkedT).toBeGreaterThan(0);
  });
});
