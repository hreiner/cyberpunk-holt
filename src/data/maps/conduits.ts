/**
 * Les conduits de l'académie et la cantine des petits (chapitre 2, scènes 5 et 6, lot 5.9) --
 * GAME-DESIGN §4 scènes 5-6, TECH-DESIGN §4.4 (`conduits` / étapes `conduits` puis `cantine`,
 * déclencheurs `petits.enfant` -> `ch2.enfant` et `cantine.vide-ordures` -> `ch2.egouts`).
 *
 * Même idiome que `campement.ts` (lui-même calqué sur `centre-examen.ts`, le modèle de carte à
 * étapes) : une grille assemblée par code, largeur vérifiée au chargement, entités conditionnées
 * au drapeau d'étape du chapitre (`ch2.etape`). DEUX étapes se jouent ici, sur la MÊME instance
 * de carte (Franklyn reste là où le dialogue de l'enfant l'a laissé, contrat du lot 3.6b) :
 *
 *   - `conduits` (scène 5) : la bouche du conduit, la bifurcation, le détour facultatif par
 *     l'annexe jusqu'au labo de Smith, le ventilateur, le dortoir des petits et l'enfant ;
 *   - `cantine` (scène 6) : la cantine des petits en feu, jusqu'au vide-ordures.
 *
 * Plan (nord en haut, 34 x 26). Des conduits d'UNE case de large (on avance à la file, les murs
 * frôlent les épaules), trois pièces qui se découvrent en y entrant :
 *
 *    1   ############    ###############
 *    2   #.......TT.#    #.TT.TT.TT.TT.#   labo de Smith (x3-12, y2-7) ; dortoir des petits (x19-31, y2-8)
 *    3   #..TT......#    #.TT.TT.TT.TT.#   machine de la simulation (x5-6, y3-4) ; Smith en (7,4)
 *    4   #..TT......#    #.TT.TT.TT.TT.#   lits superposés au nord ; l'enfant en (27,5)
 *    5   #.......TTT#    #............T#   établi (x10-12, y5-6) ; casiers (x31, y5-8)
 *    6   #.......TTT#    #............T#
 *    7   #..........#    #............T#
 *    8   ######.#####    #............T#   l'annexe remonte au labo (x8, y8-12)
 *    9        #.#        ######.####+####  (29,9) : porte de la cantine, brûlante
 *   10        #.#             #.#.......#
 *   11        #.#    #####    #+#......T#  (24,11) : le ventilateur ; boîtier au mur en (23,12)
 *   12        #.######...######.#.TT.TTT#  la bifurcation (x15-17, y12-14)
 *   13        #.................#.TT.TTT#  à l'ouest l'annexe, à l'est le conduit des petits
 *   14        ########...########......T#  la cantine (x26-32, y10-21) : tables, comptoir (x32)
 *   15               ##.##      #......T#
 *   16                #.#       #.TT.TTT#
 *   17                #.#       #.TT.TTT#
 *   18                #.#       #.......#
 *   19                #.#       #TT...TT#  deux brasiers au fond (y19-20)
 *   20                #.#       #TT...TT#  la bouche du conduit (x16, y15-24), apparition en (16,20)
 *   21                #.#       #.......#  (25,21) : le vide-ordures, au pied du mur ouest
 *   22                #.#       #########
 *   23                #.#
 *   24                #.#
 *   25                ###
 *
 * (`#` : mur ; espace : vide, rien n'existe entre les conduits -- voir `carveVoid`.)
 *
 * Toute case bloquante est habillée par un modèle (`src/data/exploreVisuals/conduits.ts`, vérifié
 * par `tests/unit/exploreVisualPlacements.test.ts`) : aucune collision invisible. Les deux portes
 * sont posées sur des murs horizontaux (passage nord-sud) : le panneau de porte du rendu n'a
 * qu'une orientation.
 *
 * Deux obstacles, tous deux levés par un DIALOGUE (jamais par un jet qui pourrait les laisser
 * fermés -- aucun cul-de-sac) :
 *   - `conduits.ventilateur-pales` (porte verrouillée) : ouverte par `conduits.ventilateur` (le
 *     boîtier, `opensDoorAfterDialogue`) à la fin de `ch2.conduits.json`, quelle qu'en soit l'issue
 *     (pirater, démonter, ou bloquer les pales à la main) ;
 *   - `petits.porte-cantine` (porte verrouillée, brûlante) : ouverte par `petits.enfant` au début de
 *     l'étape `cantine` -- `ChapterApp.enterExploreScene` rouvre toute porte dont l'ouvreur a son
 *     drapeau `<dialogueId>.fait` posé ; `ch2.enfant.json` (une scène dialogue, pas une conversation
 *     annexe) le pose lui-même sur son dernier nœud. Pendant la scène 5, la porte dit pourquoi on
 *     n'y va pas encore ; à la scène 6, elle est ouverte.
 */

import type { Condition } from '@/narrative';
import { CH2_ETAPE_FLAG } from '@/data/chapters/ch2';
import type { Ch2Etape } from '@/data/chapters/ch2';
import type { EntityDef, MapDef, RoomDef } from '@/explore';

function etape(value: Ch2Etape): Condition {
  return { flag: CH2_ETAPE_FLAG, equals: value };
}

const WIDTH = 34;
const HEIGHT = 26;

const grid: string[][] = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => '#'));

function setChar(x: number, y: number, ch: string): void {
  if (y < 0 || y >= HEIGHT || x < 0 || x >= WIDTH) {
    throw new Error(`conduits.ts : case (${x},${y}) hors de la grille ${WIDTH}x${HEIGHT}`);
  }
  (grid[y] as string[])[x] = ch;
}

function fillBlock(x0: number, y0: number, w: number, h: number, ch: string): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setChar(x, y, ch);
  }
}

/**
 * Pièces (et tronçons de conduit) : chaque rectangle est une zone de sol et une `RoomDef`, donc
 * la même géométrie décrit le sol, la découverte des contenus et les bords de l'enveloppe. Les murs
 * restent fixes, entiers et hauts de 2,45 m ; la découverte révèle les finitions et le contenu des
 * trois pièces, sans couper les parois. Les tronçons sont des `RoomDef` `alwaysDiscovered` (lot 5.9)
 * pour que le conduit et la file restent visibles tout au long du parcours.
 */
export const CONDUITS_RECTS = {
  bouche: { origin: { x: 16, y: 15 }, width: 1, height: 10 }, // la bouche, depuis le dortoir
  bifurcation: { origin: { x: 15, y: 12 }, width: 3, height: 3 },
  annexe: { origin: { x: 8, y: 13 }, width: 7, height: 1 }, // vers l'ouest : l'annexe
  annexeNord: { origin: { x: 8, y: 8 }, width: 1, height: 5 }, // remonte jusqu'au labo
  labo: { origin: { x: 3, y: 2 }, width: 10, height: 6 },
  conduitPetits: { origin: { x: 18, y: 13 }, width: 6, height: 1 }, // vers l'est : les pleurs
  ventilateur: { origin: { x: 24, y: 12 }, width: 1, height: 2 }, // sous le ventilateur
  pales: { origin: { x: 24, y: 9 }, width: 1, height: 2 }, // au-delà des pales
  petits: { origin: { x: 19, y: 2 }, width: 13, height: 7 },
  cantine: { origin: { x: 26, y: 10 }, width: 7, height: 12 },
} as const;

for (const { origin, width, height } of Object.values(CONDUITS_RECTS))
  fillBlock(origin.x, origin.y, width, height, '.');

/** Le ventilateur : une porte verrouillée dans le conduit nord-sud (mur horizontal de part et d'autre). */
export const VENTILATEUR_CELL = { x: 24, y: 11 } as const;
/** Porte du dortoir des petits vers la cantine. */
export const PORTE_CANTINE_CELL = { x: 29, y: 9 } as const;
/**
 * Boîtier de commande du ventilateur, au mur OUEST du conduit, juste sous les pales : la caméra
 * isométrique regarde depuis le sud-est, un boîtier au mur est ne montrerait que son dos.
 */
export const COMMANDE_CELL = { x: 23, y: 12 } as const;
/**
 * Trappe du vide-ordures, au pied du mur OUEST de la cantine, derrière le brasier ouest (même
 * raison : une trappe dans le mur sud tournerait le dos à la caméra).
 */
export const VIDE_ORDURES_CELL = { x: 25, y: 21 } as const;

setChar(VENTILATEUR_CELL.x, VENTILATEUR_CELL.y, '+');
setChar(PORTE_CANTINE_CELL.x, PORTE_CANTINE_CELL.y, '+');

/*
 * Mobilier : chaque bloc est exporté pour que l'habillage pose son modèle EXACTEMENT sur les
 * mêmes cases -- une seule source de géométrie, comme `CAMPEMENT_BLOCKS`.
 */
export const CONDUITS_BLOCKS = {
  // Le labo de Smith.
  machine: { x: 5, y: 3, w: 2, h: 2, ch: 'T' }, // la machine de la simulation
  laboServeurs: { x: 10, y: 2, w: 2, h: 1, ch: 'T' },
  laboEtabli: { x: 10, y: 5, w: 3, h: 2, ch: 'T' },
  // Le dortoir des petits : quatre lits superposés contre le mur nord, des casiers à l'est.
  lit1: { x: 20, y: 2, w: 2, h: 3, ch: 'T' },
  lit2: { x: 23, y: 2, w: 2, h: 3, ch: 'T' },
  lit3: { x: 26, y: 2, w: 2, h: 3, ch: 'T' },
  lit4: { x: 29, y: 2, w: 2, h: 3, ch: 'T' },
  casiers: { x: 31, y: 5, w: 1, h: 4, ch: 'T' },
  // La cantine : quatre tables, le comptoir contre le mur est, deux brasiers au fond.
  table1: { x: 27, y: 12, w: 2, h: 2, ch: 'T' },
  table2: { x: 30, y: 12, w: 2, h: 2, ch: 'T' },
  table3: { x: 27, y: 16, w: 2, h: 2, ch: 'T' },
  table4: { x: 30, y: 16, w: 2, h: 2, ch: 'T' },
  comptoir: { x: 32, y: 11, w: 1, h: 7, ch: 'T' },
  brasierOuest: { x: 26, y: 19, w: 2, h: 2, ch: 'T' },
  brasierEst: { x: 31, y: 19, w: 2, h: 2, ch: 'T' },
} as const;

for (const { x, y, w, h, ch } of Object.values(CONDUITS_BLOCKS)) fillBlock(x, y, w, h, ch);

/**
 * La roche entre les conduits n'est pas un mur : seules les cases de mur qui BORDENT un sol ou une
 * porte (huit voisins) restent `#`, le reste devient du vide (` `, non rendu). Sans cela, la
 * l'ancien volume de murs pleins entre deux conduits d'une case cachait Franklyn et sa file à la
 * caméra isométrique (première manche de captures du lot) ; les cellules conservées forment
 * maintenant les parois fixes qui bordent réellement un espace accessible.
 */
function carveVoid(): void {
  const open = (x: number, y: number) => {
    const ch = grid[y]?.[x];
    return ch !== undefined && ch !== '#' && ch !== ' ';
  };
  const keep = new Set<string>();
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (grid[y]?.[x] !== '#') continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (open(x + dx, y + dy)) keep.add(`${x},${y}`);
    }
  }
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) if (grid[y]?.[x] === '#' && !keep.has(`${x},${y}`)) setChar(x, y, ' ');
  }
}
carveVoid();

const ASCII: string[] = grid.map((row, y) => {
  const line = row.join('');
  if (line.length !== WIDTH)
    throw new Error(`conduits.ts : ligne ${y} de largeur ${line.length}, attendu ${WIDTH}`);
  return line;
});

const ROOMS: RoomDef[] = [
  // Les conduits eux-mêmes : toujours affichés (on sait où l'on est, c'est le territoire de
  // Franklyn) -- ce qui se découvre, ce sont les trois pièces au bout.
  { id: 'conduit-bouche', title: 'Le conduit', rect: CONDUITS_RECTS.bouche, alwaysDiscovered: true },
  { id: 'bifurcation', title: 'La bifurcation', rect: CONDUITS_RECTS.bifurcation, alwaysDiscovered: true },
  { id: 'annexe', title: "L'annexe", rect: CONDUITS_RECTS.annexe, alwaysDiscovered: true },
  { id: 'annexe-nord', title: "L'annexe", rect: CONDUITS_RECTS.annexeNord, alwaysDiscovered: true },
  {
    id: 'conduit-petits',
    title: 'Le conduit des petits',
    rect: CONDUITS_RECTS.conduitPetits,
    alwaysDiscovered: true,
  },
  {
    id: 'conduit-ventilateur',
    title: 'Le ventilateur',
    rect: CONDUITS_RECTS.ventilateur,
    alwaysDiscovered: true,
  },
  { id: 'conduit-pales', title: 'Le conduit des petits', rect: CONDUITS_RECTS.pales, alwaysDiscovered: true },
  { id: 'labo', title: 'Le labo de Smith', rect: CONDUITS_RECTS.labo },
  { id: 'petits', title: 'Le dortoir des petits', rect: CONDUITS_RECTS.petits },
  { id: 'cantine', title: 'La cantine des petits', rect: CONDUITS_RECTS.cantine },
];

const ENTITIES: EntityDef[] = [
  /* -- Scène 5 (ch2.conduits) : le territoire de Franklyn ---------------------------------- */
  {
    id: 'conduits.bouche',
    type: 'zone',
    cell: { x: 16, y: 17 },
    area: { origin: { x: 16, y: 16 }, width: 1, height: 2 },
    line: 'Derrière, une rafale fait sonner la tôle de la bouche du conduit. Personne ne se retourne.',
    condition: etape('conduits'),
  },
  {
    id: 'conduits.bifurcation',
    type: 'zone',
    cell: { x: 16, y: 13 },
    area: { origin: { x: 15, y: 12 }, width: 3, height: 3 },
    line: "La bifurcation. À gauche, une lueur bleue pulse du côté de l'annexe. À droite, tout au bout, quelqu'un pleure.",
    condition: etape('conduits'),
  },
  {
    id: 'conduits.annexe',
    type: 'zone',
    cell: { x: 10, y: 13 },
    area: { origin: { x: 10, y: 13 }, width: 2, height: 1 },
    line: "L'annexe. Il avait promis à Abigail de ne jamais aller plus loin. De la poussière bleue sur la tôle — elle l'a vue aussi.",
    condition: etape('conduits'),
  },
  // Le détour facultatif (B14) : Smith, blessée, dans son labo. Une conversation annexe qui
  // n'avance pas le routeur (`ch2.smith.json`) ; déjà jouée, la réplique brève prend le relais.
  {
    id: 'labo.smith',
    type: 'npc',
    cell: { x: 7, y: 4 },
    dialogueId: 'ch2.smith',
    label: 'Parler à Smith',
    line: 'Smith ne relève plus la tête. Il faut partir.',
    condition: etape('conduits'),
  },
  {
    id: 'conduits.grille-vue',
    type: 'zone',
    cell: { x: 20, y: 13 },
    area: { origin: { x: 19, y: 13 }, width: 3, height: 1 },
    line: 'Par une grille, en contrebas : deux gangers retournent le dortoir des grands. Ils ne lèvent pas les yeux.',
    condition: etape('conduits'),
  },
  // Le ventilateur : la porte est l'obstacle (jamais franchissable tant que les pales tournent),
  // le boîtier au mur porte le dialogue qui l'ouvre, quelle qu'en soit l'issue.
  {
    id: 'conduits.ventilateur-pales',
    type: 'door',
    cell: VENTILATEUR_CELL,
    locked: true,
    lockedLine: 'Les pales tournent à pleine vitesse, à hauteur de visage. Pas moyen de passer.',
    label: 'Le ventilateur',
    condition: etape('conduits'),
  },
  {
    id: 'conduits.ventilateur',
    type: 'object',
    cell: COMMANDE_CELL,
    dialogueId: 'ch2.conduits',
    label: 'Couper le ventilateur',
    line: 'Les pales sont immobiles.',
    opensDoorAfterDialogue: 'conduits.ventilateur-pales',
    condition: etape('conduits'),
  },
  {
    id: 'petits.pleurs',
    type: 'zone',
    cell: { x: 24, y: 9 },
    area: { origin: { x: 24, y: 9 }, width: 1, height: 2 },
    line: 'Le dortoir des petits. Des lits défaits, des peluches par terre. Et les pleurs, sous le dernier lit.',
    condition: etape('conduits'),
  },
  {
    id: 'petits.porte-cantine',
    type: 'door',
    cell: PORTE_CANTINE_CELL,
    locked: true,
    lockedLine: "La porte de la cantine est brûlante. De l'autre côté, ça crépite. Pas sans l'enfant.",
    label: 'La porte de la cantine',
    condition: etape('conduits'),
  },
  // Déclencheur de l'objectif (TECH-DESIGN §4.4) : son dialogueId est celui de la scène SUIVANTE
  // (`ch2.enfant`, contrat du lot 3.6b) -- il ne joue rien lui-même. Il ouvre la porte de la
  // cantine à l'étape suivante (voir l'en-tête).
  {
    id: 'petits.enfant',
    type: 'npc',
    cell: { x: 27, y: 5 },
    dialogueId: 'ch2.enfant',
    label: "S'approcher de l'enfant",
    opensDoorAfterDialogue: 'petits.porte-cantine',
    condition: etape('conduits'),
  },

  /* -- Scène 6 (ch2.cantine) : la cantine en feu ------------------------------------------- */
  {
    id: 'cantine.fumee',
    type: 'zone',
    cell: { x: 29, y: 14 },
    // Toute la largeur libre de la cantine, entre les tables : on ne l'évite pas.
    area: { origin: { x: 26, y: 14 }, width: 6, height: 2 },
    line: 'Des silhouettes sous les tables, et personne ne bouge. La fumée descend, noire, vers le fond.',
    condition: etape('cantine'),
  },
  // Déclencheur : joue SON PROPRE dialogue (`ch2.cantine`, la traversée de la fumée) avant
  // d'avancer le routeur vers `ch2.egouts` (règle du lot 3.7b, comme `bal.letitia`).
  {
    id: 'cantine.vide-ordures',
    type: 'object',
    cell: VIDE_ORDURES_CELL,
    dialogueId: 'ch2.cantine',
    label: 'Le vide-ordures',
    condition: etape('cantine'),
  },
];

const SPAWNS: Record<string, { x: number; y: number }> = {
  // Scène 5 : à la bouche du conduit, en montant depuis le dortoir -- cinq cases de conduit droit
  // au sud pour que la file des suiveurs, amorcée vers le sud (`seedTrail`), reste dans le conduit.
  conduits: { x: 16, y: 20 },
  // Scène 6 : entrée à froid seulement (`?scene=ch2.cantine`, reprise) -- juste passé la porte.
  cantine: { x: 29, y: 11 },
};

export const CONDUITS_MAP: MapDef = {
  id: 'conduits',
  title: "Les conduits de l'académie",
  ascii: ASCII,
  rooms: ROOMS,
  entities: ENTITIES,
  spawns: SPAWNS,
};
