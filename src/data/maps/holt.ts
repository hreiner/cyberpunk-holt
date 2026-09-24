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
// Cour intérieure / Cantine -> Salles d'entraînement.
punchDoor(31, 32);
punchDoor(44, 32);
// Salles d'entraînement -> Garage (seule sortie vers l'extérieur).
punchDoor(38, 50);

// Dortoirs : quatre travées de vrais lits (2 x 3 m), casiers au mur et
// passage central dégagé. Le sas au sud-ouest cadre la sortie vers la cantine.
for (const [x, y] of [
  [27, 2], [27, 7], [31, 2], [31, 7], [45, 2], [45, 7], [48, 2], [48, 7],
] as const) {
  fillBlock(x, y, 2, 3, 'o');
}
fillBlock(35, 2, 1, 4, 'T');
fillBlock(43, 2, 1, 4, 'T');
fillBlock(27, 13, 4, 1, 'T'); // sas et console de présence

// Cour intérieure : jardin (végétation), arbre, bassin carré.
setChar(31, 20, 'T'); // arbre
// `o` (mobilier bas -- bloque le passage, pas la vue), pas `=` (vitre/grille) : `=` rend une
// vitre VERTICALE de 3 m (voir `ExploreView`, "structurelle... jamais cachée par la
// découverte, comme les murs"), ce qui donne un panneau de verre plat qui semble flotter au
// milieu de la cour sans mur pour le porter -- défaut réel constaté en jeu. Le rendu du bassin
// vient de l'habillage déclaratif (`cour.bassin`, src/data/exploreVisuals/holt.ts), posé au
// niveau du sol ; `o` ne sert plus ici qu'à la collision, la géométrie générique est retirée du
// rendu par `replaces` sur ce placement.
fillBlock(30, 25, 3, 3, 'o'); // bassin carré (voir cour.bassin dans exploreVisuals/holt.ts)
for (const [x, y] of [
  [27, 18],
  [36, 18],
  [27, 29],
  [36, 29],
  [28, 28],
  [35, 19],
] as const) {
  setChar(x, y, '~');
}

// Cantine : trois îlots de tables de 2 x 2 m, allées de deux cases, estrade
// à l'ouest et comptoir de service continu à l'est.
fillBlock(40, 18, 2, 2, 'o');
fillBlock(44, 21, 2, 2, 'o');
fillBlock(47, 26, 2, 2, 'o');
fillBlock(40, 28, 3, 1, 'T'); // estrade du directeur
fillBlock(49, 19, 1, 9, 'o'); // comptoir

// Salles d'entraînement : trentaine de pupitres en rangées régulières (la case de Franklyn reste du sol nu),
// agrès au sud-ouest, cercle de combat dégagé au centre, bancs au sud-est.
placeGrid([30, 34, 38, 42, 46], [35, 37, 39, 41, 43, 45], 'o', [[38, 39]]);
fillBlock(27, 46, 3, 3, 'T'); // agrès, sud-ouest
fillBlock(46, 46, 4, 3, 'o'); // bancs, sud-est
// (le centre, x36-41 / y43-46, reste dégagé : c'est le cercle de combat)

// Garage : deux véhicules, allée centrale dégagée jusqu'à la sortie.
fillBlock(32, 54, 3, 5, 'T');
fillBlock(42, 54, 3, 5, 'T');

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
    cell: { x: 35, y: 3 },
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
    // Devant l'estrade (x40-42, y28), jamais à l'intérieur de son volume.
    cell: { x: 41, y: 27 },
    line: 'Asseyez-vous, cadet. Je ne commence pas deux fois.',
    label: 'Parler au directeur',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.place-franklyn',
    type: 'seat',
    // Chaise côté allée de la table 2 (la table occupe x44-45, y21-22).
    cell: { x: 43, y: 21 },
    dialogueId: 'ch1.discours',
    label: "S'asseoir à la table de la promotion",
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-abraham',
    type: 'npc',
    cell: { x: 41, y: 21 },
    line: 'Vingt-huit. On était trente à l’entrée, en première année.',
    label: 'Parler à Abraham',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-betty',
    type: 'npc',
    cell: { x: 46, y: 23 },
    line: 'J’ai recopié les questions de l’an dernier sur ma manche. Ça vaut ce que ça vaut.',
    label: 'Parler à Betty',
    condition: etape('reveil'),
  },
  {
    id: 'cantine.figurant-calvin',
    type: 'npc',
    cell: { x: 46, y: 27 },
    line: 'Debout à cinq heures pour écouter un discours. Superbe journée.',
    label: 'Parler à Calvin',
    condition: etape('reveil'),
  },

  // -- Cour intérieure (temps libre : Grover) ----------------------------
  {
    id: 'cour.grover',
    type: 'npc',
    cell: { x: 29, y: 22 },
    dialogueId: 'ch1.hub.grover',
    label: 'Parler à Grover',
    condition: etape('temps-libre'),
  },
  {
    id: 'cour.theodore',
    type: 'npc',
    cell: { x: 34, y: 26 },
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
    cell: { x: 31, y: 47 },
    line: 'Un sac de frappe éventré à un endroit, rafistolé au chatterton.',
    label: 'Examiner le sac de frappe',
  },
  {
    id: 'entrainement.zachary',
    type: 'npc',
    cell: { x: 32, y: 46 },
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

  // -- Garage (étape 5 · Temps libre -- déclenche le départ, scène ch1.fourgon) --
  {
    id: 'garage.fourgon',
    type: 'object',
    cell: { x: 38, y: 59 },
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
  'lit-franklyn': { x: 29, y: 6 }, // étape 1 · Réveil
  cantine: { x: 41, y: 20 }, // étape 2 · Discours
  pupitre: { x: 37, y: 37 }, // étapes 3/4 · Examen, Tirage
  'temps-libre': { x: 23, y: 20 }, // étape 5, dans le couloir de ceinture
  garage: { x: 37, y: 60 }, // étape 6 · Départ
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
