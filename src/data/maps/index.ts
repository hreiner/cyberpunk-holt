/**
 * Registre des cartes d'exploration (epic 3). Ajouter une carte = ajouter un
 * fichier `src/data/maps/<id>.ts` et une entrée ci-dessous — même principe
 * que `src/data/dialogues/registry.ts`.
 *
 * Aujourd'hui : seulement l'académie HOLT (lot 3.6a). Le centre d'examen
 * arrive au lot 3.7 (docs/design/09-MAPS-CHAPTER-1.md).
 */

import type { MapDef } from '@/explore';
import { HOLT_MAP } from './holt';

export const MAPS: Record<string, MapDef> = {
  holt: HOLT_MAP,
};

/** Carte par identifiant, ou erreur explicite en français si l'identifiant est inconnu. */
export function getMap(id: string): MapDef {
  const map = MAPS[id];
  if (!map) throw new Error(`Carte inconnue : "${id}"`);
  return map;
}
