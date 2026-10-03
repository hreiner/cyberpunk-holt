import { describe, expect, it } from 'vitest';
import { CAMPEMENT_MAP } from '@/data/maps/campement';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';
import { CONDUITS_MAP } from '@/data/maps/conduits';
import { buildHoltArchitectureLayout } from '@/render/exploration/holtArchitectureLayout';
import { buildHoltWallGeometry } from '@/render/exploration/holtWallGeometry';
import { remainingExplorationProfile } from '@/render/exploration/remainingExplorationProfiles';

const MAPS = [CENTRE_EXAMEN_MAP, CONDUITS_MAP, CAMPEMENT_MAP] as const;
const WALL_SIDES = ['north', 'south', 'east', 'west'] as const;

describe('profils des cartes d’exploration restantes', () => {
  it('couvre chaque pièce par une enveloppe quatre côtés sans inventer de baie', () => {
    for (const map of MAPS) {
      const profile = remainingExplorationProfile(map.id);
      expect(profile).not.toBeNull();
      if (!profile) continue;

      const roomIds = map.rooms.map((room) => room.id).sort();
      expect(profile.rooms.map((room) => room.roomId).sort()).toEqual(roomIds);
      expect(
        profile.rooms
          .filter((room) => room.visibility === 'always')
          .map((room) => room.roomId)
          .sort(),
      ).toEqual(
        map.rooms
          .filter((room) => room.alwaysDiscovered)
          .map((room) => room.id)
          .sort(),
      );
      expect(profile.architecture.flatMap((architecture) => architecture.roomIds).sort()).toEqual(roomIds);
      expect(
        profile.architecture.every((architecture) =>
          WALL_SIDES.every((side) => architecture.sides.includes(side)),
        ),
      ).toBe(true);
      expect(profile.architecture.every((architecture) => (architecture.windows?.length ?? 0) === 0)).toBe(
        true,
      );

      const layout = buildHoltArchitectureLayout(map, profile.architecture);
      expect(layout.windows).toEqual([]);
      expect(layout.cells.every((cell) => ['#', '+'].includes(map.ascii[cell.y]?.[cell.x] ?? ''))).toBe(true);
    }
  });

  it.each(MAPS.map((map) => [map.id, map] as const))(
    'raccords et hauteurs canoniques sur %s',
    (_mapId, map) => {
      const profile = remainingExplorationProfile(map.id)!;
      const layout = buildHoltArchitectureLayout(map, profile.architecture);
      const geometry = buildHoltWallGeometry(layout, profile.wallHeights);
      expect(geometry.size).toBe(layout.cells.length);

      for (const cell of layout.cells) {
        const nextId =
          cell.axis === 'vertical'
            ? `vertical:${cell.x},${cell.y + 1}`
            : `horizontal:${cell.x + 1},${cell.y}`;
        const next = geometry.get(nextId);
        if (!next) continue;
        const current = geometry.get(cell.id)!;
        if (cell.axis === 'vertical') {
          expect(next.center.x, `${map.id}/${cell.id} → ${nextId}`).toBe(current.center.x);
          expect(next.center.y - current.center.y).toBe(1);
        } else {
          expect(next.center.y, `${map.id}/${cell.id} → ${nextId}`).toBe(current.center.y);
          expect(next.center.x - current.center.x).toBe(1);
        }
      }
      for (const cell of layout.cells.filter((candidate) => candidate.axis === 'vertical')) {
        const perpendicular = geometry.get(`horizontal:${cell.x},${cell.y}`);
        if (!perpendicular) continue;
        const current = geometry.get(cell.id)!;
        expect(
          Math.abs(current.center.x - perpendicular.center.x),
          `${map.id}/${cell.id} angle x`,
        ).toBeLessThanOrEqual(0.68);
        expect(
          Math.abs(current.center.y - perpendicular.center.y),
          `${map.id}/${cell.id} angle y`,
        ).toBeLessThanOrEqual(0.68);
      }

      if (map.id === 'centre-examen') {
        for (const cell of layout.cells.filter((cell) => cell.faces.some((face) => face.sharedWall))) {
          const opensOntoCour = cell.faces.some(
            (face) => face.roomId === 'cour' || face.neighborIds.includes('cour'),
          );
          expect(geometry.get(cell.id)?.height).toBe(
            opensOntoCour ? profile.wallHeights?.exterior : profile.wallHeights?.interior,
          );
        }
      } else {
        for (const shape of geometry.values()) expect(shape.height).toBe(2.45);
      }
    },
  );

  it('garde les sept tronçons de conduit toujours découverts et les reflets dans leur pièce', () => {
    const profile = remainingExplorationProfile(CONDUITS_MAP.id)!;
    const alwaysDiscovered = CONDUITS_MAP.rooms
      .filter((room) => room.alwaysDiscovered)
      .map((room) => room.id)
      .sort();
    expect(alwaysDiscovered).toEqual([
      'annexe',
      'annexe-nord',
      'bifurcation',
      'conduit-bouche',
      'conduit-pales',
      'conduit-petits',
      'conduit-ventilateur',
    ]);
    expect(
      profile.rooms
        .filter((room) => room.visibility === 'always')
        .map((room) => room.roomId)
        .sort(),
    ).toEqual(alwaysDiscovered);

    for (const roomProfile of profile.rooms) {
      const surface = roomProfile.reflectionSurface;
      if (!surface) continue;
      const room = CONDUITS_MAP.rooms.find((candidate) => candidate.id === roomProfile.roomId);
      expect(room).toBeDefined();
      if (!room) continue;
      const minX = room.rect.origin.x - 0.5;
      const minY = room.rect.origin.y - 0.5;
      const maxX = room.rect.origin.x + room.rect.width - 0.5;
      const maxY = room.rect.origin.y + room.rect.height - 0.5;
      expect(surface.center.x - surface.width / 2).toBeGreaterThanOrEqual(minX);
      expect(surface.center.x + surface.width / 2).toBeLessThanOrEqual(maxX);
      expect(surface.center.y - surface.height / 2).toBeGreaterThanOrEqual(minY);
      expect(surface.center.y + surface.height / 2).toBeLessThanOrEqual(maxY);
    }
  });

  it('ancre chaque plaque française à une cellule de mur de sa pièce et ne réfléchit pas la cour', () => {
    for (const map of MAPS) {
      const profile = remainingExplorationProfile(map.id)!;
      const layout = buildHoltArchitectureLayout(map, profile.architecture);
      for (const roomProfile of profile.rooms) {
        const room = map.rooms.find((candidate) => candidate.id === roomProfile.roomId);
        for (const sign of roomProfile.finish.signText ?? []) {
          expect(room).toBeDefined();
          if (!room) continue;
          const onEdge =
            sign.side === 'north'
              ? sign.at.y === room.rect.origin.y - 1
              : sign.side === 'south'
                ? sign.at.y === room.rect.origin.y + room.rect.height
                : sign.side === 'west'
                  ? sign.at.x === room.rect.origin.x - 1
                  : sign.at.x === room.rect.origin.x + room.rect.width;
          expect(onEdge).toBe(true);
          expect(['#', '+']).toContain(map.ascii[sign.at.y]?.[sign.at.x]);
          expect(
            layout.cells.some(
              (cell) =>
                cell.x === sign.at.x &&
                cell.y === sign.at.y &&
                cell.faces.some((face) => face.roomId === roomProfile.roomId && face.side === sign.side),
            ),
          ).toBe(true);
        }
      }
    }

    const centre = remainingExplorationProfile(CENTRE_EXAMEN_MAP.id)!;
    expect(centre.rooms).toHaveLength(6);
    expect(centre.rooms.filter((room) => room.visibility === 'always').map((room) => room.roomId)).toEqual([
      'cour',
    ]);
    expect(centre.rooms.filter((room) => room.visibility === 'discovered')).toHaveLength(5);
    expect(centre.rooms.find((room) => room.roomId === 'cour')?.floor.reflectionGain).toBe(0);
    expect(centre.rooms.find((room) => room.roomId === 'cour')?.reflectionSurface).toBeUndefined();
  });

  it('renvoie null pour les cartes qui ont leur propre profil', () => {
    expect(remainingExplorationProfile('holt')).toBeNull();
    expect(remainingExplorationProfile('holt-nuit')).toBeNull();
    expect(remainingExplorationProfile('inconnue')).toBeNull();
  });
});
