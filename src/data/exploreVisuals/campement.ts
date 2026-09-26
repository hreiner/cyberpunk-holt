/**
 * Habillage du campement des Scorpions (`campement`, chapitre 2 scène 9, lot 5.10).
 *
 * Quatre modèles procéduraux propres à ce lot (`src/render/exploration/props.ts`) -- le feu de
 * camp (avec sa `PointLight` qui vacille, seule lumière chaude de la carte), deux tentes de
 * fortune, le camion de Murano, le brassard au scorpion au sol -- et deux modèles déjà au
 * catalogue du centre d'examen (caisses et fûts). Chaque placement pose son modèle sur les
 * cases EXACTES de `CAMPEMENT_BLOCKS` (`src/data/maps/campement.ts`) : une seule source de
 * géométrie, aucune case bloquante sans modèle (vérifié par
 * `tests/unit/exploreVisualPlacements.test.ts`).
 *
 * Tous les placements sont `exterior` (toujours visibles) : le campement est un extérieur, rien
 * n'y est caché par la découverte des pièces. Le brassard est lié à `campement.insignes`
 * (`entityId`) : il porte l'apparence de l'entité, sans créer de second déclencheur. Il est plat
 * (`flat`) : sa case reste franchissable, comme l'entité l'exige.
 *
 * Climat lumineux : `ExploreView.setNightMood('campement')` (lune froide et basse), posé par
 * `ExploreSession` pour cette carte -- c'est le feu qui porte la lecture.
 */
import type { Cell } from '@/explore';
import type { ExploreVisualMapDef, ExploreVisualModelId, ExploreVisualPlacement } from '../exploreVisualTypes';
import { CAMPEMENT_BLOCKS } from '../maps/campement';

type Block = (typeof CAMPEMENT_BLOCKS)[keyof typeof CAMPEMENT_BLOCKS];

function blockCells({ x, y, w, h }: Block): Cell[] {
  const cells: Cell[] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.push({ x: x + dx, y: y + dy });
  return cells;
}

/**
 * Meuble plein posé sur un bloc de la carte : la fabrique centre le maillage sur l'emprise
 * (`footprint`) ; `cell` n'est que l'ancrage nord-ouest du bloc. `replaces` retire le bloc
 * générique de ces mêmes cases.
 */
function solidOn(id: string, model: ExploreVisualModelId, block: Block): ExploreVisualPlacement {
  const cells = blockCells(block);
  return { id, model, cell: { x: block.x, y: block.y }, footprint: cells, replaces: cells, visibility: 'exterior' };
}

export const CAMPEMENT_VISUALS: ExploreVisualMapDef = {
  mapId: 'campement',
  placements: [
    solidOn('campement.tente-ouest', 'canvas-tent', CAMPEMENT_BLOCKS.tentWest),
    solidOn('campement.tente-nord', 'canvas-tent', CAMPEMENT_BLOCKS.tentNorth),
    solidOn('campement.camion', 'wreck-vehicle', CAMPEMENT_BLOCKS.truck),
    solidOn('campement.feu', 'campfire', CAMPEMENT_BLOCKS.campfire),
    solidOn('campement.caisses', 'crate-stack', CAMPEMENT_BLOCKS.crates),
    solidOn('campement.futs', 'barrel-stack', CAMPEMENT_BLOCKS.barrels),
    {
      id: 'campement.brassard',
      model: 'gang-emblem',
      cell: { x: 5, y: 6 },
      footprint: [{ x: 5, y: 6 }],
      entityId: 'campement.insignes',
      visibility: 'exterior',
    },
  ],
};
