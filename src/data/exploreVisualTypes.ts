/**
 * Contrats de l'habillage visuel des cartes d'exploration.
 *
 * Ils decrivent seulement l'apparence. `MapDef` reste l'unique source de
 * collision, de navigation, d'entites et de progression narrative.
 */

import type { Cell } from '@/explore';

/** Quart de tour autour de l'axe vertical, orientation +Z a zero degre. */
export type ExploreVisualRotation = 0 | 90 | 180 | 270;

/** Identifiant stable resolu par la fabrique de meshes, pas un chemin d'asset. */
export type ExploreVisualModelId = string;

/**
 * Visibilite d'un placement : une piece suit sa decouverte ; l'exterieur est
 * visible en permanence. Une piece et l'exterieur ne peuvent pas etre meles.
 */
export type ExploreVisualVisibility = { roomId: string } | { visibility: 'exterior' };

/**
 * Un objet explicite du plan. `footprint` et `replaces` sont des cases de la
 * carte, jamais une seconde collision calculee par le renderer.
 */
export type ExploreVisualPlacement = ExploreVisualVisibility & {
  /** Stable entre les revisions de plan afin de deriver l'alea decoratif. */
  id: string;
  model: ExploreVisualModelId;
  /** Ancrage en cases, au sol, au centre de l'objet. */
  cell: Cell;
  rotation?: ExploreVisualRotation;
  /** Ajustement purement visuel en mètres, sans incidence sur la case d'interaction. */
  offset?: { x: number; y: number; z: number };
  scale?: number;
  /** Cases couvertes visuellement par le mesh, pour la revue des emprises. */
  footprint?: readonly Cell[];
  /** Entite existante dont ce placement porte l'apparence, sans creer de declencheur. */
  entityId?: string;
  /** Cases `o`/`T` dont le placeholder generique est retire du rendu seulement. */
  replaces?: readonly Cell[];
};

/** Habillage declaratif d'une carte, independant des etapes narratives. */
export interface ExploreVisualMapDef {
  mapId: string;
  placements: readonly ExploreVisualPlacement[];
}
