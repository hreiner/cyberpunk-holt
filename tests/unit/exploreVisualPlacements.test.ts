/**
 * Contrat global des plans d'habillage : les meshes restent une couche de rendu
 * et ne peuvent ni inventer une piece, ni masquer un placeholder qui n'existe
 * plus, ni recouvrir silencieusement un autre prop.
 */

import { describe, expect, it } from 'vitest';
import { validateMap } from '@/explore';
import type { Cell, MapDef } from '@/explore';
import { HOLT_MAP } from '@/data/maps/holt';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';
import { HOLT_VISUALS } from '@/data/exploreVisuals/holt';
import { CENTRE_EXAMEN_VISUALS } from '@/data/exploreVisuals/centreExamen';
import type { ExploreVisualMapDef } from '@/data/exploreVisualTypes';

const VISUAL_MAPS: Array<{ map: MapDef; visuals: ExploreVisualMapDef }> = [
  { map: HOLT_MAP, visuals: HOLT_VISUALS },
  { map: CENTRE_EXAMEN_MAP, visuals: CENTRE_EXAMEN_VISUALS },
];

const key = ({ x, y }: Cell): string => `${x},${y}`;

describe('plans d’habillage d’exploration', () => {
  it('restent raccords aux cartes : références, emprises, remplacements et accès', () => {
    const errors: string[] = [];
    for (const { map, visuals } of VISUAL_MAPS) {
      const validation = validateMap(map);
      errors.push(...validation.errors.map((error) => `${map.id} : ${error}`));
      if (visuals.mapId !== map.id) errors.push(`${map.id} : mauvais identifiant de carte visuelle`);

      const roomIds = new Set(map.rooms.map((room) => room.id));
      const entityIds = new Set(map.entities.map((entity) => entity.id));
      const occupied = new Map<string, string>();

      for (const placement of visuals.placements) {
        if (!('roomId' in placement && roomIds.has(placement.roomId))) {
          errors.push(`${map.id}/${placement.id} : pièce inconnue`);
        }
        if (placement.entityId) {
          if (!entityIds.has(placement.entityId)) errors.push(`${map.id}/${placement.id} : entité inconnue`);
        }

        const footprint = placement.footprint ?? [placement.cell];
        for (const cell of footprint) {
          const inMap = cell.x >= 0 && cell.x < (map.ascii[0]?.length ?? 0) && cell.y >= 0 && cell.y < map.ascii.length;
          if (!inMap) errors.push(`${map.id}/${placement.id} : emprise ${key(cell)} hors carte`);
          const previous = occupied.get(key(cell));
          if (previous) errors.push(`${map.id} : ${placement.id} chevauche ${previous} en ${key(cell)}`);
          occupied.set(key(cell), placement.id);
        }

        for (const cell of placement.replaces ?? []) {
          const tile = map.ascii[cell.y]?.[cell.x];
          if (tile !== 'o' && tile !== 'T') errors.push(`${map.id}/${placement.id} : replacement ${key(cell)} sur "${tile}"`);
        }
      }
    }
    expect(errors).toEqual([]);
  });
});
