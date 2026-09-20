/**
 * Registre des cartes d'exploration (epic 3). Ajouter une carte = ajouter un
 * fichier `src/data/maps/<id>.ts` et une entrée ci-dessous — même principe
 * que `src/data/dialogues/registry.ts`.
 *
 * L'académie HOLT (lot 3.6a) et le centre d'examen désaffecté (lot 3.7a,
 * docs/design/09-MAPS-CHAPTER-1.md — entités posées, dialogues branchés au
 * lot 3.7b).
 */

import type { MapDef } from '@/explore';
import { HOLT_MAP } from './holt';
import { CENTRE_EXAMEN_MAP } from './centre-examen';

export const MAPS: Record<string, MapDef> = {
  holt: HOLT_MAP,
  'centre-examen': CENTRE_EXAMEN_MAP,
};

/** Carte par identifiant, ou erreur explicite en français si l'identifiant est inconnu. */
export function getMap(id: string): MapDef {
  const map = MAPS[id];
  if (!map) throw new Error(`Carte inconnue : "${id}"`);
  return map;
}
