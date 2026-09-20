/**
 * Carte du centre d'examen désaffecté (chapitre 1, epic 3 lot 3.7a).
 *
 * Source : docs/design/09-MAPS-CHAPTER-1.md ("Le centre d'examen désaffecté") — le
 * schéma du document est une TOPOLOGIE (cinq zones enchaînées du sud au nord, puis la
 * cour), pas un tracé recopié case par case : dimensions et emplacements exacts sont
 * une décision de ce fichier, tant que l'enchaînement PARKING -> HALL -> SALLE 1 ->
 * SALLE 2 -> SALLE 3 -> COUR tient (même principe que src/data/maps/holt.ts, "l'idiome
 * à suivre"). Référence visuelle : docs/art/REFERENCES.md ("Les lieux de l'examen
 * pratique" — `zoneexercicetactique.png`, `vueexercicetactique.png`,
 * `mapexercicetactique.png`) : béton taggé, néons morts, tôle, un ancien centre de
 * formation de la police repris par l'académie.
 *
 * Construction : assemblage programmatique sur une grille (`carveRoom`/`punchDoor`/
 * `setChar`/`fillBlock`, mêmes fonctions que holt.ts), largeur vérifiée au chargement.
 *
 * LA COUR (`src/data/yard-map.ts`, 30 x 20) est embarquée TELLE QUELLE à `TACTICAL_ORIGIN`
 * via `pasteYard()` plus bas : chaque caractère de `YARD_MAP_ASCII` est traduit dans la
 * légende commune d'exploration (`yardCharToExplore`) et posé décalé de l'origine — la
 * correspondance case pour case avec `yard-map.ts` (une fois traduite) est LA propriété
 * la plus importante de ce fichier (voir tests/unit/centreExamenMap.test.ts), sans quoi
 * le joueur verrait un décor et le moteur de combat en calculerait un autre. La
 * traduction ne change que l'ALPHABET (`m`/`B`/`R`, propres à la légende tactique et
 * absents de la légende d'exploration, valent tous "sol libre" hors combat — déploiement
 * et mine ne sont des concepts pertinents qu'une fois le moteur de combat aux commandes,
 * voir docs/design/09-MAPS-CHAPTER-1.md "Format des cartes"), jamais la GÉOMÉTRIE.
 *
 * Drapeau `ch1.etape` (voir `Ch1Etape`, `src/narrative/sceneRouter.ts`) : ce fichier
 * n'écrit rien, il ne fait que LIRE les six valeurs propres à ce lieu via `condition`
 * sur les entités qui n'ont de sens qu'à une étape donnée — 'arrivee' | 'hall' |
 * 'salle1' | 'salle2' | 'salle3' | 'cour'. Aucune scène ne pose encore ces valeurs
 * (lot 3.7b, hors périmètre de ce fichier, même remarque que holt.ts pour 'discours'/
 * 'tirage'/'depart') : 'arrivee' elle-même n'est lue par AUCUNE entité ici (le parking
 * n'a qu'un point d'apparition, pas d'entité qui déclenche sur cette étape précise —
 * le briefing de l'instructeur, première interaction du lieu, attend 'hall').
 *
 * PORTÉE DE CE FICHIER (lot 3.7a, voir la tâche du lot) : la carte et les entités
 * (identifiant, type, case, libellé) — PAS les dialogues. `dialogueId`/`startNode`
 * restent VOLONTAIREMENT VIDES : c'est le lot 3.7b qui découpe `ch1.salle1.json` /
 * `ch1.salle2.json` / `ch1.salle3.json` (déjà écrits, dialogues de scène complets) en
 * points d'entrée et les branche sur ces entités. Point d'entrée attendu par entité,
 * pour que 3.7b n'ait qu'à remplir `dialogueId`/`startNode` (noms de nœuds exacts des
 * fichiers existants, à la date de ce lot) :
 *
 *   hall.instructeur       -> un dialogue de briefing (répartition taser/kit/outil) —
 *                              n'existe pas encore dans src/data/dialogues, à écrire.
 *   salle1.panneau-porte   -> ch1.salle1, nœud "arrivee" (piratage du panneau, jet).
 *   salle1.chien           -> ch1.salle1, nœud "chien-identifie" (Perception, tirer ou non).
 *   salle1.otage           -> même scène que le chien, côté otage (kit de soin) — le
 *                              document ("l'otage, puis le chien") en fait un seul
 *                              enchaînement ; deux entités ici pour que le joueur
 *                              puisse cibler l'un ou l'autre du regard, même dialogue.
 *   salle2.armoire          -> ch1.salle2, nœud "choix-armoire" (forcer l'armoire, tempo).
 *   salle2.porte-nord       -> ch1.salle2, nœud "porte" (continuer sans l'armoire).
 *   salle3.ordinateur       -> ch1.salle3, nœud "choix-rester" (jets de Résistance, vidéo).
 *   salle3.porte-nord       -> ch1.salle3, nœud "sortie-rapide" (sortir vite).
 *   salle1.entree (zone)    -> narration courte (fumée, bruit de course) — le nœud
 *                              "arrivee" de ch1.salle1 porte déjà ce texte, à extraire.
 *   salle3.entree (zone)    -> narration courte (porte qui se verrouille, gaz) — nœud
 *                              "arrivee" de ch1.salle3.
 *   cour.portail (zone)     -> pas un dialogue : tampon "CONTACT" + passage au mode
 *                              tactique (08-EXPLORATION.md "Passer au combat"), câblage
 *                              hors de ce fichier (lot 3.7b également).
 *
 * `tacticalArea` : la cour (voir ci-dessus). Le reste du lieu n'a pas de combat propre.
 */

import type { Condition, Ch1Etape } from '@/narrative';
import { CH1_ETAPE_FLAG } from '@/narrative';
import type { EntityDef, MapDef, RoomDef } from '@/explore';
import { YARD_MAP_ASCII } from '@/data/yard-map';

/** Condition d'apparition sur le drapeau d'étape du chapitre 1 (voir en-tête). */
function etape(value: Ch1Etape): Condition {
  return { flag: CH1_ETAPE_FLAG, equals: value };
}

const WIDTH = 40;
const HEIGHT = 70;

/* ------------------------------------------------------------------ */
/* Assemblage de la grille                                             */
/* ------------------------------------------------------------------ */

const VOID = ' ';
const grid: string[][] = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => VOID));

/** Case de la grille, sans exception : erreur explicite si hors bornes (erreur de construction, pas d'utilisateur). */
function setChar(x: number, y: number, ch: string): void {
  if (y < 0 || y >= HEIGHT || x < 0 || x >= WIDTH) {
    throw new Error(`centre-examen.ts : case (${x},${y}) hors de la grille ${WIDTH}x${HEIGHT}`);
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

/** Perce une porte (case '+') dans un mur — connexion structurelle, toujours franchissable de principe. */
function punchDoor(x: number, y: number): void {
  setChar(x, y, '+');
}

/** Bloc de mobilier plein (fourgon, bancs...). */
function fillBlock(x0: number, y0: number, w: number, h: number, ch: string): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setChar(x, y, ch);
  }
}

/* ------------------------------------------------------------------ */
/* La cour de containers (`yard-map.ts`), embarquée telle quelle        */
/* ------------------------------------------------------------------ */

/** Coin nord-ouest de la cour dans la grille du centre d'examen. */
const TACTICAL_ORIGIN = { x: 5, y: 1 };

/**
 * Traduit un caractère de la légende TACTIQUE (`src/tactical/grid.ts`) dans la légende
 * commune d'exploration (09-MAPS-CHAPTER-1.md "Format des cartes") : `#`/`o` gardent le
 * même sens dans les deux légendes (mur/couvert haut, mobilier bas/couvert bas) ; `m`
 * (mine), `B`/`R` (déploiement) sont tous les trois "sol libre" tant que le moteur de
 * combat n'est pas aux commandes — voir `src/tactical/grid.ts` (`isWalkable` : les trois
 * comptent comme franchissables) et l'en-tête de ce fichier.
 */
function yardCharToExplore(ch: string): string {
  switch (ch) {
    case '#':
      return '#';
    case 'o':
      return 'o';
    case '.':
    case 'm':
    case 'B':
    case 'R':
      return '.';
    default:
      throw new Error(`centre-examen.ts : caractère yard inconnu "${ch}"`);
  }
}

function pasteYard(): void {
  for (let y = 0; y < YARD_MAP_ASCII.length; y++) {
    const row = YARD_MAP_ASCII[y] as string;
    for (let x = 0; x < row.length; x++) {
      setChar(TACTICAL_ORIGIN.x + x, TACTICAL_ORIGIN.y + y, yardCharToExplore(row[x] as string));
    }
  }
}

pasteYard();

/* ------------------------------------------------------------------ */
/* Le bâtiment : quatre salles empilées + le hall, du nord au sud        */
/* ------------------------------------------------------------------ */

// Chaque salle fait 12 cases de large (x14-25), centrée sous la cour (x5-34, centre 19,5).
// `next.y0 = prev.y0 + prev.h + 1` (même règle que holt.ts) pour que chaque paire de
// salles partage une seule rangée de mur — et pour que le mur nord de la salle 3
// commence exactement là où s'arrête le sol de la cour (y = TACTICAL_ORIGIN.y +
// YARD_SIZE_HEIGHT = 1 + 20 = 21).
carveRoom(14, 22, 12, 8); // Salle 3 — le gaz et la vidéo (interieur y22-29)
carveRoom(14, 31, 12, 8); // Salle 2 — le choix coûteux (interieur y31-38)
carveRoom(14, 40, 12, 8); // Salle 1 — la porte et le chien (interieur y40-47)
carveRoom(14, 49, 12, 8); // Hall d'entrée (interieur y49-56)

// Parking : aire extérieure plus large que le bâtiment (x8-31), au sud, arrivée du fourgon.
carveRoom(8, 58, 24, 11); // interieur y58-68

// Portail (sud de la cour -> salle 3) et portes entre les salles, toutes sur l'axe x=19
// (centre des salles 14-25). Aucune n'est verrouillée par défaut : la carte reste
// structurellement franchissable de bout en bout (le verrouillage narratif, s'il y en a
// un, est une décision du lot 3.7b sur l'entité `door`, pas sur le tracé).
punchDoor(19, 21); // cour <-> salle 3 (entité salle3.porte-nord)
punchDoor(19, 30); // salle 3 <-> salle 2 (entité salle2.porte-nord)
punchDoor(19, 39); // salle 2 <-> salle 1 (connexion structurelle, pas d'entité dans le tableau du design)
punchDoor(19, 48); // salle 1 <-> hall (entité salle1.panneau-porte posée sur cette case)
punchDoor(19, 57); // hall <-> parking (entrée du bâtiment, pas d'entité dans le tableau du design)

/* ------------------------------------------------------------------ */
/* Décor discret (mobilier, pas d'entité)                              */
/* ------------------------------------------------------------------ */

fillBlock(17, 61, 5, 3, 'T'); // parking : le fourgon, moteur coupé
setChar(16, 50, 'o'); // hall : banc d'attente
setChar(23, 50, 'o'); // hall : banc d'attente
setChar(15, 34, 'T'); // salle 2 : l'armoire sécurisée (mobilier haut, coïncide avec l'entité)
setChar(17, 25, 'o'); // salle 3 : la console de l'ordinateur (mobilier bas, coïncide avec l'entité)

/* ------------------------------------------------------------------ */
/* Conversion en ASCII, avec vérification de largeur au chargement     */
/* ------------------------------------------------------------------ */

const ASCII: string[] = grid.map((row, y) => {
  const line = row.join('');
  if (line.length !== WIDTH) {
    throw new Error(`centre-examen.ts : ligne ${y} de largeur ${line.length}, attendu ${WIDTH}`);
  }
  return line;
});

/* ------------------------------------------------------------------ */
/* Pièces nommées                                                       */
/* ------------------------------------------------------------------ */

const ROOMS: RoomDef[] = [
  {
    id: 'cour',
    title: 'Cour de containers',
    rect: { origin: TACTICAL_ORIGIN, width: 30, height: 20 },
    // 08-EXPLORATION.md "La découverte des lieux" : "la cour de containers non plus [ne se
    // découvre pas] — le portail est un seuil, pas une porte, et l'affrontement doit se voir
    // venir". `RoomDef` sert ici aux murs en coupe/au titre, pas à la découverte pièce par pièce.
    alwaysDiscovered: true,
  },
  { id: 'salle3', title: 'Salle 3 — le gaz et la vidéo', rect: { origin: { x: 14, y: 22 }, width: 12, height: 8 } },
  { id: 'salle2', title: 'Salle 2 — le choix coûteux', rect: { origin: { x: 14, y: 31 }, width: 12, height: 8 } },
  { id: 'salle1', title: 'Salle 1 — la porte et le chien', rect: { origin: { x: 14, y: 40 }, width: 12, height: 8 } },
  { id: 'hall', title: "Hall d'entrée", rect: { origin: { x: 14, y: 49 }, width: 12, height: 8 } },
  { id: 'parking', title: 'Parking', rect: { origin: { x: 8, y: 58 }, width: 24, height: 11 } },
];

/* ------------------------------------------------------------------ */
/* Entités (voir l'en-tête : dialogueId/startNode vides, lot 3.7b)      */
/* ------------------------------------------------------------------ */

const ENTITIES: EntityDef[] = [
  // -- Hall d'entrée (étape 'hall') --------------------------------------
  {
    id: 'hall.instructeur',
    type: 'npc',
    cell: { x: 19, y: 52 },
    label: "Parler à l'instructeur",
    condition: etape('hall'),
  },

  // -- Salle 1 — la porte et le chien (étape 'salle1') -------------------
  {
    id: 'salle1.entree',
    type: 'zone',
    cell: { x: 19, y: 47 },
    area: { origin: { x: 14, y: 46 }, width: 12, height: 2 },
    condition: etape('salle1'),
  },
  {
    id: 'salle1.panneau-porte',
    type: 'object',
    cell: { x: 19, y: 48 }, // sur la case de la porte hall <-> salle 1
    label: 'Pirater le panneau de la porte',
    condition: etape('salle1'),
  },
  {
    id: 'salle1.chien',
    type: 'npc',
    cell: { x: 17, y: 43 },
    label: 'Regarder le chien',
    condition: etape('salle1'),
  },
  {
    id: 'salle1.otage',
    type: 'npc',
    cell: { x: 22, y: 43 },
    label: "Parler à l'otage",
    condition: etape('salle1'),
  },

  // -- Salle 2 — le choix coûteux (étape 'salle2') -----------------------
  {
    id: 'salle2.armoire',
    type: 'object',
    cell: { x: 15, y: 34 },
    label: "Forcer l'armoire sécurisée",
    condition: etape('salle2'),
  },
  {
    id: 'salle2.porte-nord',
    type: 'door',
    cell: { x: 19, y: 30 },
    label: 'Franchir la porte nord',
    condition: etape('salle2'),
  },

  // -- Salle 3 — le gaz et la vidéo (étape 'salle3') ----------------------
  {
    id: 'salle3.entree',
    type: 'zone',
    cell: { x: 19, y: 29 },
    area: { origin: { x: 14, y: 28 }, width: 12, height: 2 },
    condition: etape('salle3'),
  },
  {
    id: 'salle3.ordinateur',
    type: 'object',
    cell: { x: 17, y: 25 },
    label: "Utiliser l'ordinateur",
    condition: etape('salle3'),
  },
  {
    id: 'salle3.porte-nord',
    type: 'door',
    cell: { x: 19, y: 21 },
    label: 'Franchir la porte nord',
    condition: etape('salle3'),
  },

  // -- Cour de containers (étape 'cour') ----------------------------------
  {
    id: 'cour.portail',
    type: 'zone',
    cell: { x: 19, y: 20 },
    area: { origin: { x: 14, y: 19 }, width: 12, height: 2 },
    condition: etape('cour'),
  },
];

/* ------------------------------------------------------------------ */
/* Points d'apparition                                                  */
/* ------------------------------------------------------------------ */

const SPAWNS: Record<string, { x: number; y: number }> = {
  parking: { x: 19, y: 65 }, // arrivée du fourgon (minimum requis par le design)
  hall: { x: 19, y: 53 },
  salle1: { x: 19, y: 44 },
  salle2: { x: 19, y: 35 },
  salle3: { x: 19, y: 25 },
  cour: { x: 19, y: 10 },
};

/* ------------------------------------------------------------------ */
/* Carte                                                                */
/* ------------------------------------------------------------------ */

export const CENTRE_EXAMEN_MAP: MapDef = {
  id: 'centre-examen',
  title: "Centre d'examen désaffecté",
  ascii: ASCII,
  rooms: ROOMS,
  entities: ENTITIES,
  spawns: SPAWNS,
  tacticalArea: { origin: TACTICAL_ORIGIN, mapId: 'yard' },
};
