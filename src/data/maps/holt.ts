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
 * chapitre, `src/narrative/sceneRouter.ts` — hors du périmètre de ce
 * fichier). Valeurs exactes (`Condition` de src/narrative/types.ts) :
 * 'reveil' | 'discours' | 'examen' | 'tirage' | 'temps-libre' | 'depart'.
 * Ce fichier ne fait que LIRE ce drapeau via `condition` sur les entités qui
 * n'ont de sens qu'à une étape donnée.
 *
 * L'aile ouest (seconde génération, 6-12 ans) est hors carte : une porte
 * verrouillée dans le mur ouest du couloir ouest (`corridor-ouest.acces-
 * seconde-generation`) porte la réplique de refus, sans rien au-delà.
 *
 * Pas de `tacticalArea` : l'académie n'a pas de combat (voir 08-EXPLORATION.md).
 */

import type { Condition } from '@/narrative';
import type { EntityDef, MapDef, RoomDef } from '@/explore';

type Ch1Etape = 'reveil' | 'discours' | 'examen' | 'tirage' | 'temps-libre' | 'depart';

/** Condition d'apparition sur le drapeau d'étape du chapitre 1 (voir en-tête). */
function etape(value: Ch1Etape): Condition {
  return { flag: 'ch1.etape', equals: value };
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

// Décor discret des salles de la colonne (mobilier bas/haut, pas d'entité).
setChar(7, 3, 'o'); // Administration, réception : banc
setChar(14, 3, 'o'); // Administration, bureau : bureau
setChar(7, 10, 'o'); // Interface : table
setChar(7, 13, 'o'); // Interface : table
setChar(7, 17, 'o'); // Infirmerie : lit
setChar(7, 21, 'o'); // Infirmerie : lit
setChar(14, 18, 'T'); // Infirmerie : armoire à pharmacie
setChar(7, 26, 'o'); // Armurerie : caisse
setChar(14, 25, 'T'); // Armurerie : râtelier
setChar(14, 29, 'T'); // Armurerie : râtelier
setChar(7, 34, 'o'); // Archives : étagère basse
setChar(14, 33, 'T'); // Archives : rayonnage serveurs
setChar(14, 37, 'T'); // Archives : rayonnage serveurs
setChar(7, 42, 'o'); // Local technique : caisse à outils
setChar(14, 41, 'T'); // Local technique : transformateur
setChar(14, 45, 'T'); // Local technique : transformateur

/* ------------------------------------------------------------------ */
/* Couloir de ceinture (aile est) + les deux liaisons vers le bloc ouest */
/* ------------------------------------------------------------------ */

carveRoom(22, 1, 3, 48); // couloir de ceinture, le long du flanc ouest de l'aile est

punchDoor(21, 6); // liaison nord, près de l'Administration : corridor_est <-> couloir de ceinture
punchDoor(21, 20); // liaison milieu, au niveau de la cour intérieure : idem

/* ------------------------------------------------------------------ */
/* Aile est : Dortoirs, Cour intérieure / Cantine, Salles d'entraînement, Garage */
/* ------------------------------------------------------------------ */

carveRoom(26, 1, 25, 12); // Dortoirs 13-17 ans, toute la largeur
carveRoom(26, 14, 12, 15); // Cour intérieure (ouest)
carveRoom(39, 14, 12, 15); // Cantine 13-17 ans (est)
carveRoom(26, 30, 25, 19); // Salles d'entraînement, toute la largeur
carveRoom(30, 50, 17, 13); // Garage véhicules

// Couloir de ceinture <-> Dortoirs / Cour intérieure / Salles d'entraînement.
punchDoor(25, 6); // -> Dortoirs (prolonge la liaison nord jusque dans la pièce)
punchDoor(25, 20); // -> Cour intérieure (prolonge la liaison milieu)
punchDoor(25, 39); // -> Salles d'entraînement

// Dortoirs -> Cour intérieure / Cantine.
punchDoor(31, 13);
punchDoor(44, 13);
// Cour intérieure <-> Cantine (lien direct, comme sur le plan du MJ).
punchDoor(38, 21);
// Cour intérieure / Cantine -> Salles d'entraînement.
punchDoor(31, 29);
punchDoor(44, 29);
// Salles d'entraînement -> Garage (seule sortie vers l'extérieur).
punchDoor(38, 49);

// Dortoirs : lits en rangées ouest et est, pièce commune dégagée au centre.
for (const y of [2, 4, 6, 8, 10]) {
  setChar(27, y, 'o');
  setChar(49, y, 'o');
}

// Cour intérieure : jardin (végétation), arbre, bassin carré.
setChar(31, 17, 'T'); // arbre
fillBlock(30, 23, 3, 3, '='); // bassin carré
for (const [x, y] of [
  [27, 15],
  [36, 15],
  [27, 27],
  [36, 27],
  [28, 26],
  [35, 16],
] as const) {
  setChar(x, y, '~');
}

// Cantine : une vingtaine de places (grille de tables), comptoir à l'est.
placeGrid([40, 42, 44, 46, 48], [17, 20, 23, 26], 'o');
setChar(49, 15, 'o'); // comptoir
setChar(49, 16, 'o'); // comptoir

// Salles d'entraînement : trentaine de pupitres en rangées régulières (la case de Franklyn reste du sol nu),
// agrès au sud-ouest, cercle de combat dégagé au centre, bancs au sud-est.
placeGrid([30, 34, 38, 42, 46], [32, 34, 36, 38, 40, 42], 'o', [[38, 36]]);
fillBlock(27, 44, 3, 3, 'T'); // agrès, sud-ouest
fillBlock(46, 44, 4, 3, 'o'); // bancs, sud-est
// (le centre, x36-41 / y43-46, reste dégagé : c'est le cercle de combat)

// Garage : deux véhicules, allée centrale dégagée jusqu'à la sortie.
fillBlock(33, 53, 2, 4, 'T');
fillBlock(41, 53, 2, 4, 'T');

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
  { id: 'dortoirs', title: 'Dortoirs', rect: { origin: { x: 26, y: 1 }, width: 25, height: 12 } },
  {
    id: 'cour-interieure',
    title: 'Cour intérieure',
    rect: { origin: { x: 26, y: 14 }, width: 12, height: 15 },
  },
  { id: 'cantine', title: 'Cantine', rect: { origin: { x: 39, y: 14 }, width: 12, height: 15 } },
  {
    id: 'salles-entrainement',
    title: "Salles d'entraînement",
    rect: { origin: { x: 26, y: 30 }, width: 25, height: 19 },
  },
  { id: 'garage', title: 'Garage véhicules', rect: { origin: { x: 30, y: 50 }, width: 17, height: 13 } },
];

/* ------------------------------------------------------------------ */
/* Entités                                                              */
/* ------------------------------------------------------------------ */

const ENTITIES: EntityDef[] = [
  // -- Dortoirs (étape 1 · Réveil) --------------------------------------
  {
    id: 'dortoir.casier',
    type: 'object',
    cell: { x: 32, y: 3 },
    line: 'Un casier métallique cabossé, initiales gravées au couteau.',
    label: 'Ouvrir le casier',
    condition: etape('reveil'),
  },
  {
    id: 'dortoir.figurant-1',
    type: 'npc',
    cell: { x: 40, y: 4 },
    line: 'Deux minutes. Laisse-moi deux minutes.',
    label: 'Parler au cadet',
    condition: etape('reveil'),
  },
  {
    id: 'dortoir.figurant-2',
    type: 'npc',
    cell: { x: 45, y: 8 },
    line: 'Lit au carré, casier fermé. Ils notent tout, aujourd’hui.',
    label: 'Parler à la cadette',
    condition: etape('reveil'),
  },

  // -- Couloirs (1 -> 2 : le flux vers la cantine) -----------------------
  {
    id: 'couloir.figurant-1',
    type: 'npc',
    cell: { x: 23, y: 9 },
    line: 'Avance. Ils ferment les portes quand le directeur monte.',
    label: 'Parler au cadet',
    condition: etape('reveil'),
  },
  {
    id: 'couloir.figurant-2',
    type: 'npc',
    cell: { x: 23, y: 11 },
    line: 'Si tu cherches une place, il n’en reste plus au fond.',
    label: 'Parler aux cadettes',
    condition: etape('reveil'),
  },

  // -- Cantine (étape 2 · Discours) --------------------------------------
  {
    id: 'cantine.directeur',
    type: 'npc',
    cell: { x: 43, y: 15 },
    line: 'Asseyez-vous, cadet. Je ne commence pas deux fois.',
    label: 'Parler au directeur',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.place-franklyn',
    type: 'seat',
    cell: { x: 43, y: 20 },
    dialogueId: 'ch1.discours',
    label: "S'asseoir à la table de la promotion",
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-abraham',
    type: 'npc',
    cell: { x: 41, y: 18 },
    line: 'Vingt-huit. On était trente à l’entrée, en première année.',
    label: 'Parler à Abraham',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-betty',
    type: 'npc',
    cell: { x: 45, y: 22 },
    line: 'J’ai recopié les questions de l’an dernier sur ma manche. Ça vaut ce que ça vaut.',
    label: 'Parler à Betty',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-calvin',
    type: 'npc',
    cell: { x: 47, y: 26 },
    line: 'Debout à cinq heures pour écouter un discours. Superbe journée.',
    label: 'Parler à Calvin',
    condition: etape('reveil'),
  },

  // -- Cour intérieure (temps libre : Grover) ----------------------------
  {
    id: 'cour.grover',
    type: 'npc',
    cell: { x: 29, y: 19 },
    dialogueId: 'ch1.hub.grover',
    label: 'Parler à Grover',
    condition: etape('temps-libre'),
  },
  {
    id: 'cour.theodore',
    type: 'npc',
    cell: { x: 34, y: 24 },
    line: 'Grover dit qu’on part à six. Grover se trompe rarement.',
    label: 'Parler à Theodore',
    condition: etape('temps-libre'),
  },

  // -- Salles d'entraînement (étapes 3 · Examen, 5 · Temps libre) --------
  {
    id: 'entrainement.pupitre-franklyn',
    type: 'seat',
    cell: { x: 38, y: 36 },
    dialogueId: 'ch1.exam',
    label: "S'asseoir à son pupitre",
    condition: etape('examen'),
  },
  {
    id: 'entrainement.figurant-woodrow',
    type: 'npc',
    cell: { x: 32, y: 33 },
    line: 'Ne me parle pas. Je relis.',
    label: 'Parler à Woodrow',
    condition: etape('examen'),
  },
  {
    id: 'entrainement.figurant-nancy',
    type: 'npc',
    cell: { x: 44, y: 39 },
    line: 'Fini. Il reste quarante minutes et j’ai fini.',
    label: 'Parler à Nancy',
    condition: etape('examen'),
  },
  {
    id: 'entrainement.sac-de-frappe',
    type: 'object',
    cell: { x: 31, y: 45 },
    line: 'Un sac de frappe éventré à un endroit, rafistolé au chatterton.',
    label: 'Examiner le sac de frappe',
  },
  {
    id: 'entrainement.zachary',
    type: 'npc',
    cell: { x: 32, y: 44 },
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
    cell: { x: 10, y: 11 },
    line: "Un terminal ouvert sur un réseau qu'il n'a pas le droit de consulter.",
    label: 'Examiner le terminal',
  },
  {
    id: 'local-technique.transformateurs',
    type: 'object',
    cell: { x: 10, y: 43 },
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

  // -- Garage (étape 6 · Départ) --------------------------------------------
  {
    id: 'garage.fourgon',
    type: 'object',
    cell: { x: 38, y: 58 },
    dialogueId: 'ch1.fourgon',
    line: 'Le fourgon de police, moteur déjà tournant.',
    label: 'Monter dans le fourgon',
    condition: etape('depart'),
  },
  {
    id: 'garage.sortie',
    type: 'exit',
    cell: { x: 38, y: 60 },
    targetMapId: 'centre-examen',
    targetSpawn: 'arrivee',
    label: "Rejoindre le centre d'examen",
    condition: etape('depart'),
  },
];

/* ------------------------------------------------------------------ */
/* Points d'apparition                                                  */
/* ------------------------------------------------------------------ */

const SPAWNS: Record<string, { x: number; y: number }> = {
  'lit-franklyn': { x: 29, y: 6 }, // étape 1 · Réveil
  cantine: { x: 41, y: 15 }, // étape 2 · Discours
  pupitre: { x: 37, y: 34 }, // étapes 3/4 · Examen, Tirage
  'temps-libre': { x: 23, y: 20 }, // étape 5, dans le couloir de ceinture
  garage: { x: 37, y: 57 }, // étape 6 · Départ
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
