/**
 * Carte de l'académie HOLT (chapitre 1, epic 3 lot 3.6a).
 *
 * Source : docs/design/09-MAPS-CHAPTER-1.md ("L'académie HOLT"), topologie
 * reprise du plan du MJ (docs/art/REFERENCES.md#lacadémie--holtacademypng).
 * Le schéma du document est une TOPOLOGIE, pas un tracé recopié case par
 * case : dimensions et emplacements exacts sont une décision de ce fichier,
 * tant que les rapports du document tiennent (colonne ouest de cinq salles
 * empilées bordée de deux couloirs, aile est avec dortoirs/cour/cantine/
 * salles d'entraînement/garage, couloir de ceinture, deux liaisons).
 *
 * Construction : la carte est assemblée programmatiquement sur une grille
 * (fonctions `carveRoom`/`punchDoor`/`setChar`/`fillBlock`/`placeGrid` plus
 * bas), plutôt qu'un gros littéral de chaînes recopié à la main — même
 * esprit que `src/dev/exploreLabMap.ts` ("l'idiome à suivre"), adapté à une
 * carte de cette taille. La largeur de chaque ligne est vérifiée au chargement.
 *
 * Drapeau de partie `ch1.etape` : posé par le lot 3.6b (intégration au
 * chapitre, `SceneDef.etape` + `withEtape()` dans
 * `src/narrative/sceneRouter.ts` — hors du périmètre de ce fichier). Valeurs
 * exactes (`Ch1Etape`, `src/narrative/sceneRouter.ts`) : 'reveil' | 'discours'
 * | 'examen' | 'tirage' | 'temps-libre' | 'depart'. Ce fichier ne fait que
 * LIRE ce drapeau via `condition` sur les entités qui n'ont de sens qu'à une
 * étape donnée. Seules trois étapes sont aujourd'hui posées par une scène
 * `explore` (`reveil`, `examen`, `temps-libre` -- voir CHAPTER_1_SCENES) :
 * 'discours', 'tirage' et 'depart' restent réservées (scènes `dialogue` sur
 * place, ou le centre d'examen -- `src/data/maps/centre-examen.ts`, lot 3.7),
 * sans entité qui les lise ici.
 *
 * L'aile ouest (seconde génération, 6-12 ans) est hors carte : une porte
 * verrouillée dans le mur ouest du couloir ouest (`corridor-ouest.acces-
 * seconde-generation`) porte la réplique de refus, sans rien au-delà.
 *
 * Pas de `tacticalArea` : l'académie n'a pas de combat (voir 08-EXPLORATION.md).
 */

import type { Condition, Ch1Etape } from '@/narrative';
import { CH1_ETAPE_FLAG } from '@/narrative';
import type { EntityDef, MapDef, RoomDef } from '@/explore';

/** Condition d'apparition sur le drapeau d'étape du chapitre 1 (voir en-tête). */
function etape(value: Ch1Etape): Condition {
  return { flag: CH1_ETAPE_FLAG, equals: value };
}

const WIDTH = 52;
const HEIGHT = 64;

/* ------------------------------------------------------------------ */
/* Assemblage de la grille                                             */
/* ------------------------------------------------------------------ */

const VOID = ' ';
const grid: string[][] = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => VOID));

/** Case de la grille, sans exception : erreur explicite si hors bornes (erreur de construction, pas d'utilisateur). */
function setChar(x: number, y: number, ch: string): void {
  if (y < 0 || y >= HEIGHT || x < 0 || x >= WIDTH) {
    throw new Error(`holt.ts : case (${x},${y}) hors de la grille ${WIDTH}x${HEIGHT}`);
  }
  const row = grid[y] as string[];
  row[x] = ch;
}

/** Pièce rectangulaire : anneau de murs '#' autour de l'intérieur `(x0,y0,w,h)`, puis sol '.' à l'intérieur. */
function carveRoom(x0: number, y0: number, w: number, h: number): void {
  for (let y = y0 - 1; y <= y0 + h; y++) {
    for (let x = x0 - 1; x <= x0 + w; x++) setChar(x, y, '#');
  }
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setChar(x, y, '.');
  }
}

/** Perce une porte (case '+') dans un mur — connexion structurelle sans entité, toujours ouverte par défaut. */
function punchDoor(x: number, y: number): void {
  setChar(x, y, '+');
}

/** Bloc de mobilier plein (agrès, véhicules, bassin…). */
function fillBlock(x0: number, y0: number, w: number, h: number, ch: string): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setChar(x, y, ch);
  }
}

/** Grille régulière de mobilier (pupitres, tables) aux intersections de `cols` x `rows`, sauf les cases de `skip`. */
function placeGrid(cols: number[], rows: number[], ch: string, skip: Array<[number, number]> = []): void {
  for (const y of rows) {
    for (const x of cols) {
      if (skip.some(([sx, sy]) => sx === x && sy === y)) continue;
      setChar(x, y, ch);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Colonne ouest : Administration + cinq salles empilées + 2 couloirs  */
/* ------------------------------------------------------------------ */

carveRoom(1, 1, 3, 46); // corridor_ouest
carveRoom(5, 1, 12, 7); // Administration
carveRoom(5, 9, 12, 6); // Interface
carveRoom(5, 16, 12, 7); // Infirmerie & labo
carveRoom(5, 24, 12, 7); // Armurerie
carveRoom(5, 32, 12, 7); // Archives & serveurs
carveRoom(5, 40, 12, 7); // Local technique & énergie
carveRoom(18, 1, 3, 46); // corridor_est (côté colonne ouest)

// Administration <-> corridors (Administration accessible des deux côtés, comme sur le plan du MJ).
punchDoor(4, 4);
punchDoor(17, 4);
// Chaque salle de la colonne <-> corridor_est.
punchDoor(17, 11); // Interface
punchDoor(17, 19); // Infirmerie & labo
punchDoor(17, 27); // Armurerie
punchDoor(17, 35); // Archives & serveurs
punchDoor(17, 43); // Local technique

// Bureau du directeur : une porte verrouillée dans le mur nord de l'Administration, sans rien au-delà (même
// principe que la porte condamnée ci-dessous) — l'Administration elle-même reste une seule pièce ouverte,
// c'est elle qui relie corridor_ouest (porte 4,4) et corridor_est (porte 17,4).
punchDoor(11, 0);

// Porte condamnée vers l'aile seconde génération, dans le mur ouest du couloir ouest — rien au-delà (hors carte).
punchDoor(0, 25);

// Décor des salles de la colonne. Passe de cohérence (docs/art/ROOM-COMPOSITION.md) :
// le mobilier est ADOSSÉ aux murs et GROUPÉ par usage, le centre de chaque salle reste
// libre — c'est là que se tiennent les cadets au temps libre, et c'est ce qui rend la
// pièce lisible d'un coup d'œil depuis son seuil. Les emprises correspondent désormais à
// la taille réelle des modèles (src/data/exploreVisualModels.ts) : un guichet de 2,9 m ne
// tient pas dans une case d'un mètre (ADR 0017).

// Administration — guichet au nord-est, bancs d'attente au sud, dossiers au mur ouest.
// La bande y=3..5 reste libre : c'est le passage entre les deux couloirs.
fillBlock(13, 2, 3, 1, 'o'); // guichet d'accueil, face au sud
fillBlock(6, 7, 3, 1, 'o'); // bancs d'attente, adossés au mur sud
fillBlock(5, 6, 1, 2, 'T'); // armoire à dossiers, contre le mur ouest

// Interface — trois postes de netrun EN RANGÉE contre le mur nord, tous face à la salle ;
// le terminal resté allumé est isolé contre le mur ouest, c'est lui qu'on remarque.
fillBlock(6, 9, 2, 1, 'o');
fillBlock(9, 9, 2, 1, 'o');
fillBlock(12, 9, 2, 1, 'o');
setChar(5, 12, 'o'); // terminal ouvert (entité interface.terminal)

// Infirmerie & labo — deux lits alignés contre le mur ouest, tête au mur ; paillasse et
// armoire à pharmacie contre le mur nord ; l'allée de la porte est jusqu'aux lits est libre.
fillBlock(5, 17, 2, 1, 'o');
fillBlock(5, 21, 2, 1, 'o');
fillBlock(12, 16, 3, 2, 'o'); // paillasse du labo
setChar(16, 16, 'T'); // armoire à pharmacie

// Armurerie — râteliers en rangée contre le mur nord, caisses contre le mur sud.
// Le centre reste vide : c'est là qu'on forme les rangs, et là que John attend.
fillBlock(6, 24, 2, 1, 'T');
fillBlock(9, 24, 2, 1, 'T');
fillBlock(12, 24, 2, 1, 'T');
fillBlock(6, 30, 2, 1, 'o');
fillBlock(9, 30, 2, 1, 'o');
fillBlock(15, 29, 2, 2, 'T'); // armoire blindée des tasers d'exercice, angle sud-est

// Archives & serveurs — baies de serveurs au nord, rayonnages d'archives au sud,
// allée centrale y=35 dans l'axe de la porte est.
fillBlock(6, 32, 2, 1, 'T');
fillBlock(9, 32, 2, 1, 'T');
fillBlock(12, 32, 2, 1, 'T');
fillBlock(6, 38, 2, 1, 'T');
fillBlock(9, 38, 2, 1, 'T');
fillBlock(12, 38, 2, 1, 'T');

// Local technique & énergie — les deux transformateurs côte à côte contre le mur ouest
// (le bourdonnement vient d'un seul endroit), l'établi de maintenance contre le mur sud.
fillBlock(5, 40, 2, 2, 'T');
fillBlock(5, 44, 2, 2, 'T');
fillBlock(12, 45, 3, 2, 'o');

/* ------------------------------------------------------------------ */
/* Couloir de ceinture (aile est) + les deux liaisons vers le bloc ouest */
/* ------------------------------------------------------------------ */

carveRoom(22, 1, 3, 48); // couloir de ceinture, le long du flanc ouest de l'aile est

punchDoor(21, 6); // liaison nord, près de l'Administration : corridor_est <-> couloir de ceinture
punchDoor(21, 20); // liaison milieu, au niveau de la cour intérieure : idem

/* ------------------------------------------------------------------ */
/* Aile est : Dortoirs, Cour intérieure / Cantine, Salles d'entraînement, Garage */
/* ------------------------------------------------------------------ */

// Le dortoir n'est plus une salle vide bordée de cubes : ses travées acceptent
// des lits de 2 x 3 m et laissent une allée centrale de quatre cases vers le sas.
carveRoom(26, 1, 25, 15); // Dortoirs 13-17 ans, toute la largeur
carveRoom(26, 17, 12, 14); // Cour intérieure (ouest)
carveRoom(39, 17, 12, 14); // Cantine 13-17 ans (est)
carveRoom(26, 33, 25, 17); // Salles d'entraînement, toute la largeur
carveRoom(30, 51, 17, 11); // Garage véhicules

// Couloir de ceinture <-> Dortoirs / Cour intérieure / Salles d'entraînement.
punchDoor(25, 7); // -> Dortoirs (prolonge la liaison nord jusque dans la pièce)
punchDoor(25, 21); // -> Cour intérieure (prolonge la liaison milieu)
punchDoor(25, 40); // -> Salles d'entraînement

// Dortoirs -> Cour intérieure / Cantine.
punchDoor(31, 16);
punchDoor(44, 16);
// Cour intérieure <-> Cantine (lien direct, comme sur le plan du MJ).
punchDoor(38, 23);
// Cour intérieure / Cantine -> Salles d'entraînement. DEUX rangées de mur à percer, et
// non une : la cour et la cantine se terminent à y=31 tandis que les salles d'entraînement
// commencent leur anneau à y=32 (contrairement aux autres jonctions de la carte, qui
// partagent un seul mur). Ne percer que y=32 laissait ces deux portes ouvertes sur du
// béton plein -- défaut réel : le joueur voyait une porte et se cognait, et tout le trafic
// cour <-> entraînement passait par le couloir de ceinture.
punchDoor(31, 31);
punchDoor(31, 32);
punchDoor(44, 31);
punchDoor(44, 32);
// Salles d'entraînement -> Garage (seule sortie vers l'extérieur).
punchDoor(38, 50);

// Dortoirs — « lits en rangées ouest et est, pièce commune au centre » (09-MAPS).
// Huit lits de 2 x 3 m, TÊTE AU MUR, quatre contre le mur ouest et quatre contre le mur
// est : c'est ce qui distingue un dortoir d'un entrepôt. Les deux bancs de casiers sont
// adossés au mur nord, au-dessus de la pièce commune. Le centre (x33-43) reste vide :
// on s'y habille, on s'y croise, et l'allée vers le sas de sortie est lisible.
for (const [x, y] of [
  [26, 1], [26, 4], [26, 9], [26, 12], // travée ouest, tête au mur x=25
  [48, 1], [48, 4], [48, 9], [48, 12], // travée est, tête au mur x=51
] as const) {
  fillBlock(x, y, 3, 2, 'o');
}
fillBlock(34, 1, 4, 1, 'T'); // casiers nord-ouest (celui de Franklyn)
fillBlock(40, 1, 4, 1, 'T'); // casiers nord-est
fillBlock(34, 15, 3, 1, 'o'); // banc de la pièce commune, adossé au mur sud
fillBlock(41, 15, 3, 1, 'o'); // banc de la pièce commune, adossé au mur sud
fillBlock(27, 15, 4, 1, 'T'); // sas et console de présence, adossé au mur sud
// Table de chevet entre deux lits de chaque travée : posée dans le renfoncement d'une
// case entre deux lits, jamais dans le grand vide central ni dans le passage de la porte
// de ceinture (25,7), qui tombe dans le renfoncement du milieu — laissé libre exprès.
setChar(27, 3, 'o'); // chevet, travée ouest, entre lit-1 et lit-2
setChar(27, 11, 'o'); // chevet, travée ouest, entre lit-3 et lit-4
setChar(49, 3, 'o'); // chevet, travée est, entre lit-1 et lit-2
setChar(49, 11, 'o'); // chevet, travée est, entre lit-3 et lit-4

// Cour intérieure — le bassin carré occupe le centre parce que c'est SA fonction : c'est
// le point d'orientation de toute l'aile est. L'arbre le flanque au nord, les bancs sont
// sur les bords et REGARDENT le bassin, les massifs tiennent les quatre coins. Les axes
// nord-sud (x=31, entre les deux portes) et est-ouest (y=21..23) restent traversables.
fillBlock(30, 22, 3, 3, 'o'); // bassin carré (habillage : cour.bassin)
setChar(34, 19, 'T'); // arbre
// `o` (mobilier bas -- bloque le passage, pas la vue), pas `=` (vitre/grille) : `=` rend une
// vitre VERTICALE de 3 m (voir `ExploreView`, "structurelle... jamais cachée par la
// découverte, comme les murs"), ce qui donne un panneau de verre plat qui semble flotter au
// milieu de la cour sans mur pour le porter -- défaut réel constaté en jeu.
setChar(28, 20, 'o'); // banc ouest, face au bassin
setChar(28, 21, 'o');
setChar(28, 22, 'o');
fillBlock(33, 27, 3, 1, 'o'); // banc sud-est, dans l'alcôve de conversation
for (const [x, y] of [
  [26, 17], [27, 17], [26, 18], // massif nord-ouest
  [36, 17], [37, 17], [37, 18], // massif nord-est
  [26, 29], [26, 30], [27, 30], // massif sud-ouest
  [37, 29], [36, 30], [37, 30], // massif sud-est
] as const) {
  setChar(x, y, '~');
}

// Cantine — DEUX RANGÉES de tables parallèles avec une allée franche entre elles (x42-43),
// l'estrade du directeur adossée au mur sud (on l'écoute assis, face à lui), le comptoir
// de service continu le long du mur est. Plus de tables semées en diagonale.
for (const y of [19, 22, 25]) {
  fillBlock(40, y, 2, 2, 'o'); // rangée ouest
  fillBlock(44, y, 2, 2, 'o'); // rangée est
}
setChar(39, 22, 'o'); // chaise d'Abraham, face à l'est
setChar(43, 23, 'o'); // chaise de Betty
setChar(46, 26, 'o'); // chaise de Calvin
// Les trois autres tables n'avaient encore aucun siège (on y mangeait debout) : deux
// chaises inoccupées chacune, sur les côtés encore libres, jamais dans l'allée x=42-43.
setChar(39, 19, 'o'); // chaise, table ouest-nord, côté allée ouest
setChar(40, 18, 'o'); // chaise, table ouest-nord, côté nord
setChar(39, 25, 'o'); // chaise, table ouest-sud, côté allée ouest
setChar(40, 27, 'o'); // chaise, table ouest-sud, côté sud
setChar(46, 19, 'o'); // chaise, table est-nord, côté comptoir
setChar(45, 18, 'o'); // chaise, table est-nord, côté nord
fillBlock(41, 30, 3, 1, 'T'); // estrade du directeur, adossée au mur sud
fillBlock(50, 18, 1, 7, 'o'); // comptoir de service, le long du mur est

// Salles d'entraînement — deux usages dans une seule salle, séparés en deux moitiés :
// au NORD les rangs de pupitres, tous tournés vers le bureau de l'examinateur adossé au
// mur nord ; au SUD le cercle de combat, dégagé, les agrès contre le mur ouest, le sac de
// frappe à côté d'eux et les bancs contre le mur est, qui regardent le cercle.
fillBlock(37, 33, 3, 1, 'o'); // bureau de l'examinateur, face aux rangs
placeGrid([30, 32, 34, 36, 38, 40, 42], [35, 37, 39, 41], 'o', [[38, 39]]);
fillBlock(26, 44, 3, 3, 'T'); // cage d'agrès, contre le mur ouest
setChar(30, 46, 'o'); // sac de frappe
fillBlock(50, 43, 1, 3, 'o'); // bancs, contre le mur est
fillBlock(50, 47, 1, 3, 'o');
// (le cercle de combat, x34-42 / y44-48, reste dégagé : c'est son marquage au sol qui le dit)

// Garage — les deux fourgons garés LE LONG des murs ouest et est, nez au sud, allée
// centrale libre du seuil nord jusqu'aux portières. Établi et fûts au fond nord-est.
fillBlock(31, 53, 3, 5, 'T');
fillBlock(42, 53, 3, 5, 'T');
fillBlock(34, 51, 3, 2, 'o'); // établi de maintenance
fillBlock(45, 51, 2, 2, 'T'); // fûts empilés

/* ------------------------------------------------------------------ */
/* Conversion en ASCII, avec vérification de largeur au chargement     */
/* ------------------------------------------------------------------ */

const ASCII: string[] = grid.map((row, y) => {
  const line = row.join('');
  if (line.length !== WIDTH) {
    throw new Error(`holt.ts : ligne ${y} de largeur ${line.length}, attendu ${WIDTH}`);
  }
  return line;
});

/* ------------------------------------------------------------------ */
/* Pièces nommées                                                       */
/* ------------------------------------------------------------------ */

const ROOMS: RoomDef[] = [
  { id: 'administration', title: 'Administration', rect: { origin: { x: 5, y: 1 }, width: 12, height: 7 } },
  { id: 'interface', title: 'Interface', rect: { origin: { x: 5, y: 9 }, width: 12, height: 6 } },
  { id: 'infirmerie', title: 'Infirmerie & labo', rect: { origin: { x: 5, y: 16 }, width: 12, height: 7 } },
  { id: 'armurerie', title: 'Armurerie', rect: { origin: { x: 5, y: 24 }, width: 12, height: 7 } },
  { id: 'archives', title: 'Archives & serveurs', rect: { origin: { x: 5, y: 32 }, width: 12, height: 7 } },
  {
    id: 'local-technique',
    title: 'Local technique & énergie',
    rect: { origin: { x: 5, y: 40 }, width: 12, height: 7 },
  },
  { id: 'dortoirs', title: 'Dortoirs', rect: { origin: { x: 26, y: 1 }, width: 25, height: 15 } },
  {
    id: 'cour-interieure',
    title: 'Cour intérieure',
    rect: { origin: { x: 26, y: 17 }, width: 12, height: 14 },
  },
  { id: 'cantine', title: 'Cantine', rect: { origin: { x: 39, y: 17 }, width: 12, height: 14 } },
  {
    id: 'salles-entrainement',
    title: "Salles d'entraînement",
    rect: { origin: { x: 26, y: 33 }, width: 25, height: 17 },
  },
  { id: 'garage', title: 'Garage véhicules', rect: { origin: { x: 30, y: 51 }, width: 17, height: 11 } },
];

/* ------------------------------------------------------------------ */
/* Entités                                                              */
/* ------------------------------------------------------------------ */

const ENTITIES: EntityDef[] = [
  // -- Dortoirs (étape 1 · Réveil) --------------------------------------
  {
    id: 'dortoir.casier',
    type: 'object',
    // Devant le banc de casiers du mur nord (x34-37, y1) : c'est le sien, et on le voit
    // depuis le lit de Franklyn sans traverser la pièce commune.
    cell: { x: 35, y: 2 },
    line: 'Un casier métallique cabossé, initiales gravées au couteau.',
    label: 'Ouvrir le casier',
    condition: etape('reveil'),
  },
  {
    id: 'dortoir.figurant-1',
    type: 'npc',
    cell: { x: 39, y: 8 },
    line: 'Deux minutes. Laisse-moi deux minutes.',
    label: 'Parler au cadet',
    condition: etape('reveil'),
  },
  {
    id: 'dortoir.figurant-2',
    type: 'npc',
    cell: { x: 41, y: 11 },
    line: 'Lit au carré, casier fermé. Ils notent tout, aujourd’hui.',
    label: 'Parler à la cadette',
    condition: etape('reveil'),
  },

  // -- Couloirs (1 -> 2 : le flux vers la cantine) -----------------------
  {
    id: 'couloir.figurant-1',
    type: 'npc',
    cell: { x: 33, y: 13 },
    line: 'Avance. Ils ferment les portes quand le directeur monte.',
    label: 'Parler au cadet',
    condition: etape('reveil'),
  },
  {
    id: 'couloir.figurant-2',
    type: 'npc',
    cell: { x: 36, y: 13 },
    line: 'Si tu cherches une place, il n’en reste plus au fond.',
    label: 'Parler aux cadettes',
    condition: etape('reveil'),
  },

  // -- Cantine (étape 2 · Discours) --------------------------------------
  {
    id: 'cantine.directeur',
    type: 'npc',
    // Devant l'estrade (x41-43, y30), jamais à l'intérieur de son volume : les deux
    // rangées de tables lui font face, c'est lui qu'on voit en entrant par le nord.
    cell: { x: 42, y: 29 },
    line: 'Asseyez-vous, cadet. Je ne commence pas deux fois.',
    label: 'Parler au directeur',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.place-franklyn',
    type: 'seat',
    // Chaise côté allée centrale de la table du milieu (rangée ouest, x40-41 / y22-23).
    // Sa case reste FRANCHISSABLE : un `seat` s'occupe, on s'assoit dessus (08-EXPLORATION).
    cell: { x: 42, y: 22 },
    dialogueId: 'ch1.discours',
    label: "S'asseoir à la table de la promotion",
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-abraham',
    type: 'npc',
    cell: { x: 39, y: 22 }, // chaise ouest de la table du milieu, face a l est
    line: 'Vingt-huit. On était trente à l’entrée, en première année.',
    label: 'Parler à Abraham',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-betty',
    type: 'npc',
    cell: { x: 43, y: 23 }, // chaise cote allee de la rangee est
    line: 'J’ai recopié les questions de l’an dernier sur ma manche. Ça vaut ce que ça vaut.',
    label: 'Parler à Betty',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-calvin',
    type: 'npc',
    cell: { x: 46, y: 26 }, // chaise est de la table sud
    line: 'Debout à cinq heures pour écouter un discours. Superbe journée.',
    label: 'Parler à Calvin',
    condition: etape('reveil'),
  },

  // -- Cour intérieure (temps libre : Grover) ----------------------------
  {
    id: 'cour.grover',
    type: 'npc',
    cell: { x: 29, y: 22 }, // entre le banc ouest et le bassin : son alcove
    dialogueId: 'ch1.hub.grover',
    label: 'Parler à Grover',
    condition: etape('temps-libre'),
  },
  {
    id: 'cour.theodore',
    type: 'npc',
    cell: { x: 34, y: 26 }, // debout pres du banc sud-est
    line: 'Grover dit qu’on part à six. Grover se trompe rarement.',
    label: 'Parler à Theodore',
    condition: etape('temps-libre'),
  },

  // -- Salles d'entraînement (étapes 3 · Examen, 5 · Temps libre) --------
  {
    id: 'entrainement.pupitre-franklyn',
    type: 'seat',
    cell: { x: 38, y: 39 },
    dialogueId: 'ch1.exam',
    label: "S'asseoir à son pupitre",
    condition: etape('examen'),
  },
  {
    id: 'entrainement.figurant-woodrow',
    type: 'npc',
    cell: { x: 32, y: 36 },
    line: 'Ne me parle pas. Je relis.',
    label: 'Parler à Woodrow',
    condition: etape('examen'),
  },
  {
    id: 'entrainement.figurant-nancy',
    type: 'npc',
    cell: { x: 44, y: 42 },
    line: 'Fini. Il reste quarante minutes et j’ai fini.',
    label: 'Parler à Nancy',
    condition: etape('examen'),
  },
  {
    id: 'entrainement.sac-de-frappe',
    type: 'object',
    cell: { x: 30, y: 46 }, // le sac lui-meme, accroche a cote des agres
    line: 'Un sac de frappe éventré à un endroit, rafistolé au chatterton.',
    label: 'Examiner le sac de frappe',
  },
  {
    id: 'entrainement.zachary',
    type: 'npc',
    cell: { x: 31, y: 46 }, // juste a cote du sac
    dialogueId: 'ch1.hub.zachary',
    label: 'Parler à Zachary',
    condition: etape('temps-libre'),
  },

  // -- Infirmerie & labo (temps libre : Abigail) -------------------------
  {
    id: 'infirmerie.abigail',
    type: 'npc',
    cell: { x: 10, y: 19 },
    dialogueId: 'ch1.hub.abigail',
    label: 'Parler à Abigail',
    condition: etape('temps-libre'),
  },

  // -- Armurerie (temps libre : John) -------------------------------------
  {
    id: 'armurerie.john',
    type: 'npc',
    cell: { x: 10, y: 27 },
    dialogueId: 'ch1.hub.john',
    label: 'Parler à John',
    condition: etape('temps-libre'),
  },

  // -- Archives & serveurs (temps libre : Letitia) -------------------------
  {
    id: 'archives.letitia',
    type: 'npc',
    cell: { x: 10, y: 35 },
    dialogueId: 'ch1.hub.letitia',
    label: 'Parler à Letitia',
    condition: etape('temps-libre'),
  },

  // -- Lieux de lore, sans étape --------------------------------------------
  {
    id: 'interface.terminal',
    type: 'object',
    cell: { x: 5, y: 12 }, // le terminal reste allume, contre le mur ouest
    line: "Un terminal ouvert sur un réseau qu'il n'a pas le droit de consulter.",
    label: 'Examiner le terminal',
  },
  {
    id: 'local-technique.transformateurs',
    type: 'object',
    cell: { x: 7, y: 41 }, // au pied des transformateurs du mur ouest
    line: 'Le bourdonnement sourd des transformateurs couvre presque toute autre pensée.',
    label: 'Écouter le local technique',
  },
  {
    id: 'administration.bureau',
    type: 'door',
    cell: { x: 11, y: 0 },
    locked: true,
    lockedLine: 'Bureau du directeur. Fermé.',
    label: 'Frapper à la porte',
  },
  {
    id: 'corridor-ouest.acces-seconde-generation',
    type: 'door',
    cell: { x: 0, y: 25 },
    locked: true,
    lockedLine: 'Secteur de la seconde génération. Accès réservé.',
    label: 'Essayer la porte',
  },

  // -- Garage (étape 5 · Temps libre -- déclenche le départ, scène ch1.fourgon) --
  {
    id: 'garage.fourgon',
    type: 'object',
    cell: { x: 42, y: 57 }, // la portiere arriere du fourgon gare a l est
    dialogueId: 'ch1.fourgon',
    line: 'Le fourgon de police, moteur déjà tournant.',
    label: 'Monter dans le fourgon',
    // Trigger de fin d'objectif de la scène `ch1.hub` (CHAPTER_1_SCENES,
    // etape 'temps-libre') : doit être actif pendant CETTE étape, pas
    // 'depart' (qui n'est posée par aucune scène : le passage à l'académie ->
    // centre d'examen se fait à la frontière de scène, pas par une entité
    // `exit` -- voir 08-EXPLORATION.md et la note de `chapter.ts` sur
    // `handleExploreInteraction`, cas `change-map`. Câblage de la scène
    // suivante, lot 3.7b).
    condition: etape('temps-libre'),
  },
];

/* ------------------------------------------------------------------ */
/* Points d'apparition                                                  */
/* ------------------------------------------------------------------ */

const SPAWNS: Record<string, { x: number; y: number }> = {
  // Au pied de son lit (travée ouest, x26-28 / y4-5) : le premier regard tombe sur le lit,
  // puis sur l'allée centrale et le banc de casiers du mur nord.
  'lit-franklyn': { x: 29, y: 5 }, // étape 1 · Réveil
  cantine: { x: 42, y: 19 }, // étape 2 · Discours — dans l'allée centrale, l'estrade en face
  pupitre: { x: 37, y: 37 }, // étapes 3/4 · Examen, Tirage — allée entre deux rangs
  'temps-libre': { x: 23, y: 20 }, // étape 5, dans le couloir de ceinture
  garage: { x: 37, y: 60 }, // étape 6 · Départ — allée centrale, entre les deux fourgons
};

/* ------------------------------------------------------------------ */
/* Carte                                                                */
/* ------------------------------------------------------------------ */

export const HOLT_MAP: MapDef = {
  id: 'holt',
  title: 'Académie HOLT',
  ascii: ASCII,
  rooms: ROOMS,
  entities: ENTITIES,
  spawns: SPAWNS,
};
