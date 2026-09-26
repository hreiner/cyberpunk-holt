/**
 * Habillage des conduits et de la cantine des petits (`conduits`, chapitre 2 scènes 5 et 6,
 * lot 5.9).
 *
 * Deux climats sur une même carte, portés d'abord par la LUMIÈRE (TECH-DESIGN §7 : « lumière et
 * narration avant le mobilier ») :
 *   - les conduits : presque noirs (`setNightMood('conduits')`), des ampoules grillagées rares et
 *     faibles (`duct-lamp`, qui grésillent), des conduites au plafond, et au bout de l'annexe la
 *     lueur cyan de la machine de la simulation, seule lumière du labo de Smith ;
 *   - la cantine : chaude et rouge (`setNightMood('cantine')`), deux brasiers (`blaze`, lumière
 *     rouge forte qui vacille), des lueurs au sol et de la fumée.
 *
 * Aucun placement n'est propre à une étape : la cantine brûle déjà pendant la scène 5 (sa porte
 * est brûlante), elle n'est simplement pas atteignable avant la scène 6 -- et une pièce non
 * découverte ne montre rien. Chaque meuble plein pose son modèle sur les cases EXACTES de
 * `CONDUITS_BLOCKS` (`src/data/maps/conduits.ts`) : une seule source de géométrie, aucune case
 * bloquante sans modèle (`tests/unit/exploreVisualPlacements.test.ts`).
 *
 * Les conduits sont des pièces `alwaysDiscovered` : leur habillage est `exterior` (toujours
 * visible), comme au campement. Le labo, le dortoir des petits et la cantine se découvrent :
 * leur habillage suit leur pièce.
 */
import type { Cell } from '@/explore';
import type {
  ExploreVisualMapDef,
  ExploreVisualModelId,
  ExploreVisualPlacement,
  ExploreVisualRotation,
} from '../exploreVisualTypes';
import { COMMANDE_CELL, CONDUITS_BLOCKS, VENTILATEUR_CELL, VIDE_ORDURES_CELL } from '../maps/conduits';

type Block = (typeof CONDUITS_BLOCKS)[keyof typeof CONDUITS_BLOCKS];

function blockCells({ x, y, w, h }: Block): Cell[] {
  const cells: Cell[] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.push({ x: x + dx, y: y + dy });
  return cells;
}

/** Meuble plein posé sur un bloc de la carte, dans une pièce qui se découvre (voir `campement.ts`). */
function solidOn(id: string, model: ExploreVisualModelId, block: Block, roomId: string): ExploreVisualPlacement {
  const cells = blockCells(block);
  return { id, model, cell: { x: block.x, y: block.y }, footprint: cells, replaces: cells, roomId };
}

/** Objet d'une case (au sol, suspendu ou au mur), dans le conduit (toujours visible). */
function inDuct(id: string, model: ExploreVisualModelId, cell: Cell, rotation?: ExploreVisualRotation): ExploreVisualPlacement {
  return { id, model, cell, footprint: [cell], visibility: 'exterior', ...(rotation ? { rotation } : {}) };
}

/** Objet d'une case dans une pièce qui se découvre. */
function inRoom(id: string, model: ExploreVisualModelId, cell: Cell, roomId: string): ExploreVisualPlacement {
  return { id, model, cell, footprint: [cell], roomId };
}

/** Conduite au plafond sur quatre cases, est-ouest (rotation 0) ou nord-sud (90). */
function pipe(id: string, from: Cell, rotation: 0 | 90): ExploreVisualPlacement {
  const footprint = Array.from({ length: 4 }, (_, i) =>
    rotation === 0 ? { x: from.x + i, y: from.y } : { x: from.x, y: from.y + i },
  );
  return { id, model: 'pipe-run', cell: from, footprint, rotation, visibility: 'exterior' };
}

export const CONDUITS_VISUALS: ExploreVisualMapDef = {
  mapId: 'conduits',
  placements: [
    /* -- Les conduits : du noir, et de loin en loin une ampoule ---------------------------- */
    pipe('conduits.conduite-bouche', { x: 16, y: 19 }, 90),
    inDuct('conduits.lampe-bouche', 'duct-lamp', { x: 16, y: 17 }),
    inDuct('conduits.lampe-bifurcation', 'duct-lamp', { x: 16, y: 12 }),
    pipe('conduits.conduite-annexe', { x: 9, y: 13 }, 0),
    inDuct('conduits.poussiere-annexe', 'blue-dust', { x: 12, y: 13 }),
    inDuct('conduits.poussiere-nord', 'blue-dust', { x: 8, y: 10 }),
    pipe('conduits.conduite-petits', { x: 18, y: 13 }, 0),
    inDuct('conduits.grille-vue', 'floor-grate', { x: 20, y: 13 }),
    inDuct('conduits.lampe-petits', 'duct-lamp', { x: 23, y: 13 }),
    // Le ventilateur, sur la case de sa porte (face au sud, d'où l'on arrive), et son boîtier au
    // mur ouest (face tournée vers l'est, vers le conduit et la caméra). Le boîtier porte
    // l'apparence de l'entité qui ouvre la porte.
    inDuct('conduits.ventilateur', 'duct-fan', VENTILATEUR_CELL),
    {
      ...inDuct('conduits.boitier', 'fan-control', COMMANDE_CELL, 270),
      entityId: 'conduits.ventilateur',
    },
    inDuct('conduits.lampe-ventilateur', 'duct-lamp', { x: 24, y: 12 }),

    /* -- Le labo de Smith : la machine, seule lumière -------------------------------------- */
    // Écran tourné vers le sud (l'entrée du labo, et la caméra).
    { ...solidOn('labo.machine', 'sim-machine', CONDUITS_BLOCKS.machine, 'labo'), rotation: 180 },
    solidOn('labo.serveurs', 'server-shelves', CONDUITS_BLOCKS.laboServeurs, 'labo'),
    solidOn('labo.etabli', 'workbench', CONDUITS_BLOCKS.laboEtabli, 'labo'),

    /* -- Le dortoir des petits ------------------------------------------------------------- */
    solidOn('petits.lit-1', 'bed-cadet', CONDUITS_BLOCKS.lit1, 'petits'),
    solidOn('petits.lit-2', 'bed-cadet', CONDUITS_BLOCKS.lit2, 'petits'),
    solidOn('petits.lit-3', 'bed-cadet', CONDUITS_BLOCKS.lit3, 'petits'),
    solidOn('petits.lit-4', 'bed-cadet', CONDUITS_BLOCKS.lit4, 'petits'),
    solidOn('petits.casiers', 'locker-bank', CONDUITS_BLOCKS.casiers, 'petits'),
    inRoom('petits.affaires', 'locker-open', { x: 21, y: 6 }, 'petits'),
    inRoom('petits.veilleuse', 'duct-lamp', { x: 25, y: 6 }, 'petits'),

    /* -- La cantine en feu : rouge, chaude ------------------------------------------------- */
    solidOn('cantine.table-1', 'canteen-table', CONDUITS_BLOCKS.table1, 'cantine'),
    solidOn('cantine.table-2', 'canteen-table', CONDUITS_BLOCKS.table2, 'cantine'),
    solidOn('cantine.table-3', 'canteen-table', CONDUITS_BLOCKS.table3, 'cantine'),
    solidOn('cantine.table-4', 'canteen-table', CONDUITS_BLOCKS.table4, 'cantine'),
    solidOn('cantine.comptoir', 'service-counter', CONDUITS_BLOCKS.comptoir, 'cantine'),
    solidOn('cantine.brasier-ouest', 'blaze', CONDUITS_BLOCKS.brasierOuest, 'cantine'),
    solidOn('cantine.brasier-est', 'blaze', CONDUITS_BLOCKS.brasierEst, 'cantine'),
    inRoom('cantine.lueur-porte', 'fire-glow', { x: 32, y: 10 }, 'cantine'),
    inRoom('cantine.lueur-ouest', 'fire-glow', { x: 26, y: 17 }, 'cantine'),
    inRoom('cantine.fumee-1', 'smoke-wisp', { x: 29, y: 15 }, 'cantine'),
    inRoom('cantine.fumee-2', 'smoke-wisp', { x: 28, y: 18 }, 'cantine'),
    inRoom('cantine.fumee-3', 'smoke-wisp', { x: 30, y: 20 }, 'cantine'),
    // La trappe, dans le mur ouest (face tournée vers l'est, vers la salle) : l'apparence de
    // l'entité qui termine l'objectif.
    {
      ...inRoom('cantine.trappe', 'garbage-chute', VIDE_ORDURES_CELL, 'cantine'),
      rotation: 270,
      entityId: 'cantine.vide-ordures',
    },
  ],
};
