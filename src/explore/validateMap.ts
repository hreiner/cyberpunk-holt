/**
 * Validation statique d'une `MapDef` — voir docs/design/09-MAPS-CHAPTER-1.md
 * "Format des cartes" pour la liste exacte des règles. Ne modifie rien, ne
 * lève jamais : toujours un `ValidationResult` avec la liste des erreurs en
 * français (même esprit que `src/narrative/validate.ts`).
 */

import { ExploreMap, nearestWalkableCell } from './exploreMap';
import { computeReach } from './pathing';
import type { Cell, MapDef, ValidationResult } from './types';

/** Taille de la cour tactique embarquée (`src/data/yard-map.ts`, 09-MAPS §"centre d'examen"). */
export const YARD_SIZE = { width: 30, height: 20 } as const;

/** Franchissable pour les besoins de la validation : une porte fermée reste une case franchissable de principe (elle peut s'ouvrir). */
function structurallyWalkable(map: ExploreMap, cell: Cell): boolean {
  const kind = map.kindAt(cell);
  return kind === 'floor' || kind === 'door';
}

export function validateMap(def: MapDef): ValidationResult {
  const errors: string[] = [];

  // Rectangularité + légende : la construction de la carte le vérifie déjà.
  let map: ExploreMap;
  try {
    map = new ExploreMap(def);
  } catch (err) {
    return { ok: false, errors: [err instanceof Error ? err.message : String(err)] };
  }

  // Identifiants uniques (entités, pièces, points d'apparition).
  const seenIds = new Set<string>();
  for (const e of def.entities) {
    if (seenIds.has(e.id)) errors.push(`Identifiant d'entité dupliqué : "${e.id}"`);
    seenIds.add(e.id);
  }
  const seenRoomIds = new Set<string>();
  for (const r of def.rooms) {
    if (seenRoomIds.has(r.id)) errors.push(`Identifiant de pièce dupliqué : "${r.id}"`);
    seenRoomIds.add(r.id);
  }

  if (Object.keys(def.spawns).length === 0) {
    errors.push("Aucun point d'apparition déclaré");
  }

  // Portes : l'entité doit être posée sur un caractère de porte ('+').
  for (const e of def.entities) {
    if (e.type !== 'door') continue;
    if (!map.inBounds(e.cell)) {
      errors.push(`Porte "${e.id}" hors carte en (${e.cell.x},${e.cell.y})`);
      continue;
    }
    if (map.kindAt(e.cell) !== 'door') {
      errors.push(`Porte "${e.id}" en (${e.cell.x},${e.cell.y}) n'est pas sur un caractère "+" de la carte`);
    }
  }

  // Chaque entité est sur une case accessible, ou adjacente à une case accessible.
  const interactionCells: { id: string; cell: Cell }[] = [];
  for (const e of def.entities) {
    if (!map.inBounds(e.cell)) {
      errors.push(`Entité "${e.id}" hors carte en (${e.cell.x},${e.cell.y})`);
      continue;
    }
    const cell = nearestWalkableCell(map, e.cell, (c) => structurallyWalkable(map, c));
    if (!cell) {
      errors.push(`Entité "${e.id}" en (${e.cell.x},${e.cell.y}) n'est ni sur, ni à côté d'une case franchissable`);
      continue;
    }
    if (e.type !== 'zone') interactionCells.push({ id: e.id, cell });
  }

  // Toute case d'interaction atteignable depuis chaque point d'apparition.
  for (const [spawnName, spawnCell] of Object.entries(def.spawns)) {
    if (!map.inBounds(spawnCell)) {
      errors.push(`Point d'apparition "${spawnName}" hors carte en (${spawnCell.x},${spawnCell.y})`);
      continue;
    }
    if (!structurallyWalkable(map, spawnCell)) {
      errors.push(`Point d'apparition "${spawnName}" en (${spawnCell.x},${spawnCell.y}) n'est pas franchissable`);
      continue;
    }
    const reach = computeReach(map, spawnCell, (c) => structurallyWalkable(map, c));
    for (const { id, cell } of interactionCells) {
      if (!reach.costs.has(`${cell.x},${cell.y}`)) {
        errors.push(`Entité "${id}" inatteignable depuis le point d'apparition "${spawnName}"`);
      }
    }
  }

  // tacticalArea dans les bornes de la carte.
  if (def.tacticalArea) {
    const { origin } = def.tacticalArea;
    const maxX = origin.x + YARD_SIZE.width;
    const maxY = origin.y + YARD_SIZE.height;
    if (origin.x < 0 || origin.y < 0 || maxX > map.width || maxY > map.height) {
      errors.push(
        `tacticalArea hors des bornes de la carte (origine ${origin.x},${origin.y}, cour ${YARD_SIZE.width}x${YARD_SIZE.height}, carte ${map.width}x${map.height})`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
