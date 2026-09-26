/**
 * Le campement des Scorpions (chapitre 2, scène 9, lot 5.10) : une halte de gangers dans les
 * Badlands, adossée aux murs d'une station-service éventrée -- GAME-DESIGN §4 scène 9 (« une
 * petite carte : feu, tentes, véhicule »), TECH-DESIGN §4.4 (`campement` / étape `campement`,
 * déclencheur `campement.murano` -> `ch2.murano`).
 *
 * Même idiome que `centre-examen.ts` (le modèle de carte à étapes) : une grille assemblée par
 * code, largeur vérifiée au chargement, entités conditionnées au drapeau d'étape du chapitre
 * (`ch2.etape`, `Ch2Etape`). Une seule étape se joue ici (`campement`) : la condition reste
 * posée sur chaque entité, par cohérence avec `holt-nuit.ts` et pour qu'une étape future sur
 * cette carte n'hérite jamais d'une entité par oubli.
 *
 * Plan (nord en haut, 24 x 16, murs de béton en ruine tout autour, une brèche au sud). Petit à
 * dessein : depuis la brèche, le cadrage de la caméra embrasse tout le camp d'un coup (le feu,
 * les tentes, le camion et Murano) -- une première carte plus grande laissait le camion hors
 * champ à l'arrivée (manche de captures du lot).
 *
 *   - la brèche sud (x = 10..12) : on entre par là, point d'apparition juste derrière ;
 *   - le feu au centre (`o`, bas -- il ne cache rien) ;
 *   - deux tentes au nord-ouest (`T`, 2 x 2 chacune), les insignes au sol devant la première ;
 *   - le camion au nord-est (`T`, 3 x 4), Murano debout juste au sud, face au feu ;
 *   - des caisses contre le mur est et des fûts dans l'angle sud-ouest (`T`, 2 x 2).
 *
 * Toute case bloquante est habillée par un modèle (`src/data/exploreVisuals/campement.ts`,
 * vérifié par `tests/unit/exploreVisualPlacements.test.ts`) : aucune collision invisible.
 *
 * Entités (toutes à l'étape `campement`) :
 *
 *   campement.entree (zone)    -> ligne courte au franchissement : le feu, les traces sombres qui
 *                                 mènent aux tentes (le sang est DIT, jamais montré -- chapitre
 *                                 sans sang à l'écran), la silhouette près du camion.
 *   campement.insignes (object) -> `ch2.campement.json` (Perception : le brassard au scorpion,
 *                                 entrée `ch2.campement.insignes`) ; facultatif, n'avance pas le
 *                                 routeur. Son apparence est le modèle `gang-emblem`.
 *   campement.murano (npc)      -> déclencheur de l'objectif. Son `dialogueId` est celui de la
 *                                 scène SUIVANTE (`ch2.murano`, contrat du lot 3.6b) : il ne joue
 *                                 rien lui-même, `ch2.murano.json` prend le relais.
 */

import type { Condition } from '@/narrative';
import { CH2_ETAPE_FLAG } from '@/data/chapters/ch2';
import type { Ch2Etape } from '@/data/chapters/ch2';
import type { EntityDef, MapDef, RoomDef } from '@/explore';

function etape(value: Ch2Etape): Condition {
  return { flag: CH2_ETAPE_FLAG, equals: value };
}

const WIDTH = 24;
const HEIGHT = 16;

const grid: string[][] = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => '#'));

function setChar(x: number, y: number, ch: string): void {
  if (y < 0 || y >= HEIGHT || x < 0 || x >= WIDTH) {
    throw new Error(`campement.ts : case (${x},${y}) hors de la grille ${WIDTH}x${HEIGHT}`);
  }
  (grid[y] as string[])[x] = ch;
}

function fillBlock(x0: number, y0: number, w: number, h: number, ch: string): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setChar(x, y, ch);
  }
}

/** Cour intérieure : tout l'intérieur des murs, sol nu. */
export const CAMPEMENT_YARD = { origin: { x: 1, y: 1 }, width: WIDTH - 2, height: HEIGHT - 2 };
fillBlock(CAMPEMENT_YARD.origin.x, CAMPEMENT_YARD.origin.y, CAMPEMENT_YARD.width, CAMPEMENT_YARD.height, '.');

/** Brèche dans le mur sud : par là qu'arrive la bande (rien ne la ferme, rien ne la montre fermée). */
fillBlock(10, HEIGHT - 1, 3, 1, '.');

/*
 * Mobilier : chaque bloc est exporté pour que l'habillage pose son modèle EXACTEMENT sur les
 * mêmes cases -- une seule source de géométrie, comme `EXAM_DESK_CELLS` pour `holt-nuit`.
 */
export const CAMPEMENT_BLOCKS = {
  tentWest: { x: 3, y: 3, w: 2, h: 2, ch: 'T' }, // tente ouest
  tentNorth: { x: 7, y: 2, w: 2, h: 2, ch: 'T' }, // tente nord
  truck: { x: 16, y: 2, w: 3, h: 4, ch: 'T' }, // le camion de Murano
  campfire: { x: 11, y: 7, w: 1, h: 1, ch: 'o' }, // le feu : bas, il ne cache rien
  crates: { x: 20, y: 9, w: 2, h: 2, ch: 'T' }, // caisses de ravitaillement, mur est
  barrels: { x: 2, y: 11, w: 2, h: 2, ch: 'T' }, // fûts, angle sud-ouest
} as const;

for (const { x, y, w, h, ch } of Object.values(CAMPEMENT_BLOCKS)) fillBlock(x, y, w, h, ch);

const ASCII: string[] = grid.map((row, y) => {
  const line = row.join('');
  if (line.length !== WIDTH) throw new Error(`campement.ts : ligne ${y} de largeur ${line.length}, attendu ${WIDTH}`);
  return line;
});

const ROOMS: RoomDef[] = [
  {
    id: 'campement',
    title: 'Le campement',
    rect: CAMPEMENT_YARD,
    // Un extérieur : on voit le feu, les tentes et le camion dès la brèche -- rien à découvrir
    // pièce par pièce (même règle que la cour de containers du centre d'examen).
    alwaysDiscovered: true,
  },
];

const ENTITIES: EntityDef[] = [
  {
    id: 'campement.entree',
    type: 'zone',
    // Deux rangées franchies en montant de la brèche vers le feu (x = 4..19 : ni les fûts ni
    // les caisses dans l'aire).
    cell: { x: 11, y: 9 },
    area: { origin: { x: 4, y: 9 }, width: 16, height: 2 },
    line: "Un feu, au milieu de nulle part. Des traces sombres dans la poussière mènent aux tentes : on a ramené des blessés ici, cette nuit. Près du camion, quelqu'un veille.",
    condition: etape('campement'),
  },
  {
    id: 'campement.insignes',
    type: 'object',
    cell: { x: 5, y: 6 },
    dialogueId: 'ch2.campement',
    label: 'Fouiller près des tentes',
    line: 'Le tissu est toujours là, dans la poussière.',
    condition: etape('campement'),
  },
  {
    id: 'campement.murano',
    type: 'npc',
    cell: { x: 17, y: 6 },
    dialogueId: 'ch2.murano',
    label: "Approcher l'homme au fusil",
    condition: etape('campement'),
  },
];

const SPAWNS: Record<string, { x: number; y: number }> = {
  // Juste derrière la brèche sud : le feu dans l'axe, le camion et sa silhouette en haut à droite.
  // Assez au nord de la brèche pour que la file des suiveurs, amorcée vers le sud, reste dans la cour.
  campement: { x: 11, y: 12 },
};

export const CAMPEMENT_MAP: MapDef = {
  id: 'campement',
  title: 'Le campement — Badlands',
  ascii: ASCII,
  rooms: ROOMS,
  entities: ENTITIES,
  spawns: SPAWNS,
};
