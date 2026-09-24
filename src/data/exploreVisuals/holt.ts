/**
 * Habillage explicite de l'académie HOLT.
 *
 * Passe de cohérence du décor — le plan de lecture est dans
 * `docs/art/ROOM-COMPOSITION.md`, pièce par pièce. Trois règles y président et
 * se relisent ici à l'œil nu :
 *
 * 1. **Le mobilier vit contre les murs**, sauf quand sa fonction exige le
 *    centre (bassin de la cour, cercle de combat, rangs d'examen).
 * 2. **Ce qui sert ensemble est ensemble** : les postes de netrun en rangée
 *    face au même mur, les casiers alignés, les fûts près de l'établi.
 * 3. **L'ancre narrative se détache** : autour d'elle, du vide, une réglette
 *    ou un marquage au sol — jamais trois meubles.
 *
 * Les rotations sont des quarts de tour : 0 = l'avant du modèle regarde le SUD
 * (+y sur la carte), 90 = l'EST, 180 = le NORD, 270 = l'OUEST. Un meuble adossé
 * à un mur regarde donc l'intérieur de sa pièce.
 *
 * `src/data/exploreVisualModels.ts` dit ce que chaque modèle occupe réellement,
 * et `tests/unit/exploreVisualPlacements.test.ts` vérifie que chaque emprise
 * posée ici correspond à ce que l'ASCII de `holt.ts` dit de ces cases.
 */
import type { Cell } from '@/explore';
import type { ExploreVisualMapDef, ExploreVisualPlacement } from '../exploreVisualTypes';

const rect = (x: number, y: number, width: number, height: number): Cell[] =>
  Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({ x: x + col, y: y + row })),
  ).flat();
const anchor = (x: number, y: number, width: number, height: number): Cell => ({
  x: x + (width - 1) / 2,
  y: y + (height - 1) / 2,
});

/** Meuble plein : son emprise est reprise telle quelle à la carte, placeholder générique retiré. */
const solid = (
  id: string,
  model: ExploreVisualPlacement['model'],
  roomId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: ExploreVisualPlacement['rotation'] = 0,
  extra: Partial<ExploreVisualPlacement> = {},
): ExploreVisualPlacement => ({
  id,
  model,
  cell: anchor(x, y, width, height),
  footprint: rect(x, y, width, height),
  replaces: rect(x, y, width, height),
  rotation,
  roomId,
  ...extra,
});

/** Marquage au sol ou objet suspendu : ne bloque rien, ne remplace rien. */
const light = (
  id: string,
  model: ExploreVisualPlacement['model'],
  roomId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: ExploreVisualPlacement['rotation'] = 0,
): ExploreVisualPlacement => ({
  id,
  model,
  cell: anchor(x, y, width, height),
  footprint: rect(x, y, width, height),
  rotation,
  roomId,
});

/** Lit de cadet : tête au mur, donc orienté par la travée à laquelle il appartient. */
const bed = (id: string, x: number, y: number, rotation: 90 | 270): ExploreVisualPlacement =>
  solid(id, 'bed-cadet', 'dortoirs', x, y, 3, 2, rotation);

const examDesk = (x: number, y: number, entityId?: string): ExploreVisualPlacement =>
  entityId
    ? {
        id: `entrainement.pupitre-${x}-${y}`,
        model: 'exam-desk',
        cell: { x, y },
        footprint: [{ x, y }],
        roomId: 'salles-entrainement',
        entityId,
      }
    : solid(`entrainement.pupitre-${x}-${y}`, 'exam-desk', 'salles-entrainement', x, y, 1, 1);

export const HOLT_VISUALS: ExploreVisualMapDef = {
  mapId: 'holt',
  placements: [
    /* -- Administration : un guichet, une attente, un passage ------------- */
    // On entre par l'ouest ou par l'est, on traverse ; ce qu'on doit voir, c'est
    // la porte fermée du directeur au nord, et le guichet qui la garde.
    solid('administration.bureau-accueil', 'admin-desk', 'administration', 13, 2, 3, 1, 0),
    solid('administration.banc-reception', 'waiting-bench', 'administration', 6, 7, 3, 1, 0),
    solid('administration.armoire-dossiers', 'archive-shelves', 'administration', 5, 6, 1, 2, 270),
    light('administration.reglette-guichet', 'strip-light', 'administration', 13, 4, 2, 1, 0),

    /* -- Interface : trois postes en rangée, un terminal à part ----------- */
    solid('interface.poste-ouest', 'netrun-station', 'interface', 6, 9, 2, 1, 180),
    solid('interface.poste-centre', 'netrun-station', 'interface', 9, 9, 2, 1, 180),
    solid('interface.poste-est', 'netrun-station', 'interface', 12, 9, 2, 1, 180),
    // Le seul allumé, isolé contre le mur ouest : il se détache des trois autres.
    {
      id: 'interface.terminal',
      model: 'netrun-terminal',
      cell: { x: 5, y: 12 },
      footprint: [{ x: 5, y: 12 }],
      replaces: [{ x: 5, y: 12 }],
      rotation: 270,
      entityId: 'interface.terminal',
      roomId: 'interface',
    },

    /* -- Infirmerie & labo : deux lits au mur, la paillasse au nord ------- */
    solid('infirmerie.lit-nord', 'medical-bed', 'infirmerie', 5, 17, 2, 1, 270),
    solid('infirmerie.lit-sud', 'medical-bed', 'infirmerie', 5, 21, 2, 1, 270),
    solid('infirmerie.paillasse', 'workbench', 'infirmerie', 12, 16, 3, 2, 0),
    solid('infirmerie.armoire-pharmacie', 'medical-cabinet', 'infirmerie', 16, 16, 1, 1, 90),
    light('infirmerie.reglette-lits', 'strip-light', 'infirmerie', 6, 19, 2, 1, 0),

    /* -- Armurerie : les râteliers alignés, les caisses en face ----------- */
    solid('armurerie.ratelier-ouest', 'weapon-rack', 'armurerie', 6, 24, 2, 1, 180),
    solid('armurerie.ratelier-centre', 'weapon-rack', 'armurerie', 9, 24, 2, 1, 180),
    solid('armurerie.ratelier-est', 'weapon-rack', 'armurerie', 12, 24, 2, 1, 180),
    solid('armurerie.caisse-tasers', 'weapon-case', 'armurerie', 6, 30, 2, 1, 180),
    solid('armurerie.caisse-munitions', 'weapon-case', 'armurerie', 9, 30, 2, 1, 180),
    solid('armurerie.armoire-blindee', 'secure-locker', 'armurerie', 15, 29, 2, 2, 270),
    light('armurerie.marque-rassemblement', 'hazard-floor-zone', 'armurerie', 9, 26, 3, 2, 0),

    /* -- Archives & serveurs : serveurs au nord, papier au sud ------------ */
    solid('archives.baie-serveur-ouest', 'server-shelves', 'archives', 6, 32, 2, 1, 180),
    solid('archives.baie-serveur-centre', 'server-shelves', 'archives', 9, 32, 2, 1, 180),
    solid('archives.baie-serveur-est', 'server-shelves', 'archives', 12, 32, 2, 1, 180),
    solid('archives.etagere-ouest', 'archive-shelves', 'archives', 6, 38, 2, 1, 0),
    solid('archives.etagere-centre', 'archive-shelves', 'archives', 9, 38, 2, 1, 0),
    solid('archives.etagere-est', 'archive-shelves', 'archives', 12, 38, 2, 1, 0),

    /* -- Local technique : les deux transformateurs ensemble -------------- */
    solid('local-technique.transformateur-nord', 'transformer', 'local-technique', 5, 40, 2, 2, 270),
    solid('local-technique.transformateur-sud', 'transformer', 'local-technique', 5, 44, 2, 2, 270),
    // L'établi est près de la gaine qu'il sert : le matériel de maintenance ne
    // se range pas à l'autre bout de la salle.
    solid('local-technique.etabli', 'workbench', 'local-technique', 12, 45, 3, 2, 180),
    light('local-technique.gaine', 'vent-duct', 'local-technique', 12, 43, 3, 1, 0),
    light('local-technique.conduite', 'pipe-run', 'local-technique', 8, 42, 4, 1, 0),
    light('local-technique.balise', 'warning-beacon', 'local-technique', 8, 40, 1, 1, 180),
    // Point d'écoute du bourdonnement (entité "Écouter le local technique") : sans ce
    // placement l'entité retombait sur le cube générique flottant (fantôme signalé en revue).
    {
      id: 'local-technique.grille-sol',
      model: 'floor-grate',
      cell: { x: 7, y: 41 },
      footprint: [{ x: 7, y: 41 }],
      entityId: 'local-technique.transformateurs',
      roomId: 'local-technique',
      offset: { x: -0.16, y: 0, z: 0 },
    },

    /* -- Dortoirs : deux travées au mur, pièce commune au centre ---------- */
    bed('dortoir.lit-ouest-1', 26, 1, 90),
    bed('dortoir.lit-ouest-2', 26, 4, 90),
    bed('dortoir.lit-ouest-3', 26, 9, 90),
    bed('dortoir.lit-ouest-4', 26, 12, 90),
    bed('dortoir.lit-est-1', 48, 1, 270),
    bed('dortoir.lit-est-2', 48, 4, 270),
    bed('dortoir.lit-est-3', 48, 9, 270),
    bed('dortoir.lit-est-4', 48, 12, 270),
    // Casiers adossés au mur nord, portes vers la pièce commune. Le casier de
    // Franklyn (entité `dortoir.casier`) est celui de gauche.
    solid('dortoir.casiers-ouest', 'locker-bank', 'dortoirs', 34, 1, 4, 1, 270),
    solid('dortoir.casiers-est', 'locker-bank', 'dortoirs', 40, 1, 4, 1, 270),
    solid('dortoir.banc-commun-ouest', 'waiting-bench', 'dortoirs', 34, 15, 3, 1, 0),
    solid('dortoir.banc-commun-est', 'waiting-bench', 'dortoirs', 41, 15, 3, 1, 0),
    solid('dortoir.sas-controle', 'access-console-bank', 'dortoirs', 27, 15, 4, 1, 0),
    // Chevets entre les lits : sans eux, un lit fait chambrée nue plutôt que dortoir vécu.
    solid('dortoir.chevet-ouest-1', 'bedside-table', 'dortoirs', 27, 3, 1, 1, 0),
    solid('dortoir.chevet-ouest-2', 'bedside-table', 'dortoirs', 27, 11, 1, 1, 0),
    solid('dortoir.chevet-est-1', 'bedside-table', 'dortoirs', 49, 3, 1, 1, 0),
    solid('dortoir.chevet-est-2', 'bedside-table', 'dortoirs', 49, 11, 1, 1, 0),
    light('dortoir.reglette-allee', 'strip-light', 'dortoirs', 37, 7, 2, 1, 0),
    light('dortoir.gaine-commune', 'vent-duct', 'dortoirs', 38, 11, 3, 1, 0),
    // Affaires personnelles devant le casier de Franklyn (entité `dortoir.casier`) : sans ce
    // placement, l'entité retombait sur le cube jaune générique flottant au milieu de la pièce
    // commune (fantôme signalé en revue visuelle) au lieu de son casier réel, juste au nord.
    {
      id: 'dortoir.casier-affaires',
      model: 'locker-open',
      cell: { x: 35, y: 2 },
      footprint: [{ x: 35, y: 2 }],
      entityId: 'dortoir.casier',
      roomId: 'dortoirs',
      offset: { x: 0, y: 0, z: -0.32 },
    },

    /* -- Cour intérieure : le bassin est le point d'orientation ----------- */
    solid('cour.bassin', 'square-basin', 'cour-interieure', 30, 22, 3, 3, 0),
    solid('cour.arbre', 'courtyard-tree', 'cour-interieure', 34, 19, 1, 1, 0),
    // Les deux bancs REGARDENT le bassin : l'un depuis l'ouest, l'autre depuis
    // le sud-est, où Grover et son trio se tiennent au temps libre.
    solid('cour.banc-ouest', 'waiting-bench', 'cour-interieure', 28, 20, 1, 3, 270),
    solid('cour.banc-sud-est', 'waiting-bench', 'cour-interieure', 33, 27, 3, 1, 0),

    /* -- Cantine : deux rangées, une allée, une estrade ------------------- */
    solid('cantine.table-ouest-nord', 'canteen-table', 'cantine', 40, 19, 2, 2, 0),
    solid('cantine.table-ouest-centre', 'canteen-table', 'cantine', 40, 22, 2, 2, 0),
    solid('cantine.table-ouest-sud', 'canteen-table', 'cantine', 40, 25, 2, 2, 0),
    solid('cantine.table-est-nord', 'canteen-table', 'cantine', 44, 19, 2, 2, 0),
    solid('cantine.table-est-centre', 'canteen-table', 'cantine', 44, 22, 2, 2, 0),
    solid('cantine.table-est-sud', 'canteen-table', 'cantine', 44, 25, 2, 2, 0),
    // Chaque chaise REGARDE sa table. Celles des figurants occupent leur case
    // (un cadet y est assis) ; celle de Franklyn reste franchissable, on s'y assoit.
    solid('cantine.chaise-abraham', 'canteen-chair', 'cantine', 39, 22, 1, 1, 270, {
      entityId: 'cantine.figurant-abraham',
    }),
    solid('cantine.chaise-betty', 'canteen-chair', 'cantine', 43, 23, 1, 1, 270, {
      entityId: 'cantine.figurant-betty',
    }),
    solid('cantine.chaise-calvin', 'canteen-chair', 'cantine', 46, 26, 1, 1, 90, {
      entityId: 'cantine.figurant-calvin',
    }),
    {
      id: 'cantine.chaise-franklyn',
      model: 'canteen-chair',
      cell: { x: 42, y: 22 },
      footprint: [{ x: 42, y: 22 }],
      rotation: 90,
      entityId: 'cantine.place-franklyn',
      roomId: 'cantine',
    },
    // Les trois autres tables restaient sans un seul siège — on y mangeait debout, le
    // genre de manque qui saute aux yeux avant même la qualité des modèles. Deux chaises
    // inoccupées par table, sur les côtés encore libres ; jamais dans l'allée x=42-43.
    solid('cantine.chaise-nord-ouest-1', 'canteen-chair', 'cantine', 39, 19, 1, 1, 270),
    solid('cantine.chaise-nord-ouest-2', 'canteen-chair', 'cantine', 40, 18, 1, 1, 180),
    solid('cantine.chaise-sud-ouest-1', 'canteen-chair', 'cantine', 39, 25, 1, 1, 270),
    solid('cantine.chaise-sud-ouest-2', 'canteen-chair', 'cantine', 40, 27, 1, 1, 0),
    solid('cantine.chaise-nord-est-1', 'canteen-chair', 'cantine', 46, 19, 1, 1, 90),
    solid('cantine.chaise-nord-est-2', 'canteen-chair', 'cantine', 45, 18, 1, 1, 180),
    solid('cantine.estrade', 'canteen-podium', 'cantine', 41, 30, 3, 1, 180),
    solid('cantine.comptoir', 'service-counter', 'cantine', 50, 18, 1, 7, 0),
    // La seule lumière franche de la salle tombe sur l'estrade : c'est l'ancre.
    light('cantine.reglette-estrade', 'strip-light', 'cantine', 41, 28, 2, 1, 0),
    light('cantine.reglette-allee', 'strip-light', 'cantine', 42, 20, 2, 1, 0),

    /* -- Salles d'entraînement : les rangs au nord, le cercle au sud ------ */
    solid('entrainement.bureau-examinateur', 'admin-desk', 'salles-entrainement', 37, 33, 3, 1, 0),
    examDesk(38, 39, 'entrainement.pupitre-franklyn'),
    ...[35, 37, 39, 41].flatMap((y) =>
      [30, 32, 34, 36, 38, 40, 42].filter((x) => x !== 38 || y !== 39).map((x) => examDesk(x, y)),
    ),
    solid('entrainement.agres', 'training-rig', 'salles-entrainement', 26, 44, 3, 3, 0),
    solid('entrainement.sac-de-frappe', 'punching-bag', 'salles-entrainement', 30, 46, 1, 1, 0, {
      entityId: 'entrainement.sac-de-frappe',
    }),
    solid('entrainement.banc-nord', 'waiting-bench', 'salles-entrainement', 50, 43, 1, 3, 90),
    solid('entrainement.banc-sud', 'waiting-bench', 'salles-entrainement', 50, 47, 1, 3, 90),
    // Le centre de la moitié sud reste vide parce qu'il porte un marquage : le
    // cercle de combat justifie son propre vide.
    light('entrainement.cercle', 'combat-circle', 'salles-entrainement', 35, 44, 5, 5, 0),
    light('entrainement.reglette-rangs', 'strip-light', 'salles-entrainement', 37, 36, 2, 1, 0),

    /* -- Garage : deux fourgons le long des murs, l'allée au milieu ------- */
    solid('garage.fourgon-ouest', 'police-van', 'garage', 31, 53, 3, 5, 0),
    solid('garage.fourgon-est', 'police-van', 'garage', 42, 53, 3, 5, 0, {
      entityId: 'garage.fourgon',
    }),
    solid('garage.etabli', 'workbench', 'garage', 34, 51, 3, 2, 0),
    solid('garage.futs', 'barrel-stack', 'garage', 45, 51, 2, 2, 0),
    // Chevrons vers la porte nord : la seule sortie du bâtiment se voit depuis
    // les deux portières.
    light('garage.chevrons-sortie', 'exit-chevrons', 'garage', 37, 54, 4, 2, 0),
    light('garage.reglette-allee', 'strip-light', 'garage', 37, 56, 2, 1, 0),
    light('garage.conduite', 'pipe-run', 'garage', 37, 59, 4, 1, 0),
  ],
};
