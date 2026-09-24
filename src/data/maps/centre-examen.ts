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
 * 'salle1' | 'salle2' | 'salle3' | 'cour'. Posées par `CHAPTER_1_SCENES`
 * (`src/narrative/sceneRouter.ts`, lot 3.7b) : `ch1.centre-hall` pose 'hall',
 * `ch1.salle1`/`ch1.salle2`/`ch1.salle3` (désormais des scènes `explore`, mêmes
 * identifiants que les anciennes scènes `dialogue` qu'elles remplacent) posent
 * respectivement 'salle1'/'salle2'/'salle3', `ch1.cour` pose 'cour'. 'arrivee' reste
 * non lue (le parking n'a qu'un point d'apparition, pas d'entité qui déclenche dessus).
 *
 * PORTÉE DE CE FICHIER (lot 3.7a) : la carte et les entités. Le lot 3.7b (voir
 * `src/chapter.ts`, `src/narrative/sceneRouter.ts`) a branché `dialogueId`/`startNode`
 * sur `ch1.salle1.json` / `ch1.salle2.json` / `ch1.salle3.json` (texte et jets inchangés,
 * seule la mise en scène change) :
 *
 *   hall.instructeur       -> pas de dialogue : complète l'objectif de `ch1.centre-hall`
 *                              (briefing non écrit, hors périmètre décidé par l'orchestrateur
 *                              pour ce lot) et fait directement avancer vers `ch1.salle1`.
 *   salle1.panneau-porte   -> ch1.salle1, nœud "arrivee" (piratage du panneau, jet) ;
 *                              complète l'objectif de la salle (l'entité qui termine
 *                              l'objectif porte le dialogue, lot 3.6b).
 *   salle1.chien           -> ch1.salle1, nœud "chien-identifie" (Perception, tirer ou non) ;
 *                              conversation annexe (n'avance pas le routeur).
 *   salle1.otage           -> même scène que le chien, côté otage (kit de soin) — le
 *                              document ("l'otage, puis le chien") en fait un seul
 *                              enchaînement ; deux entités ici pour que le joueur
 *                              puisse cibler l'un ou l'autre du regard, même dialogue.
 *   salle2.armoire          -> ch1.salle2, nœud "choix-armoire" (forcer l'armoire, tempo) ;
 *                              conversation annexe.
 *   salle2.porte-nord       -> ch1.salle2, nœud "porte" (continuer sans l'armoire) ;
 *                              verrouillée (`locked: true`) pour que l'interaction ouvre le
 *                              dialogue au lieu d'un simple battant ; complète l'objectif.
 *   salle3.ordinateur       -> ch1.salle3, nœud "choix-rester" (jets de Résistance, vidéo) ;
 *                              conversation annexe.
 *   salle3.porte-nord       -> ch1.salle3, nœud "sortie-rapide" (sortir vite) ; verrouillée,
 *                              complète l'objectif.
 *   salle1.entree/salle3.entree (zone) -> `ZoneEntity` ne porte pas de texte (pas de
 *                              `BriefLine`/`DialogueEntry` dans `src/explore/types.ts`) :
 *                              la narration d'entrée ("de la fumée s'infiltre...", "le gaz
 *                              commence à envahir...") reste celle déjà portée par le nœud
 *                              "arrivee" de chaque dialogue, jouée dès qu'on aborde le
 *                              panneau/l'ordinateur. Les deux zones restent posées (calcul
 *                              de la découverte de pièce, cohérence avec 09-MAPS) mais ne
 *                              déclenchent rien de plus par elles-mêmes — décision du lot
 *                              3.7b, pas une refonte du type `ZoneEntity`.
 *   cour.portail (zone)     -> pas un dialogue : tampon "CONTACT" + passage au mode
 *                              tactique (08-EXPLORATION.md "Passer au combat"), câblage
 *                              dans `ChapterApp.completeExploreScene` (src/chapter.ts).
 *                              Type et id inchangés à dessein (voir 09-MAPS-CHAPTER-1.md et
 *                              tests/unit/sceneRouterExplore.test.ts, "la cour mène au combat
 *                              tactique") : la zone reste le déclencheur officiel, "un filet".
 *   cour.portail-porte (object) -> aucun dialogue, aucun effet propre : une affordance VISIBLE
 *                              (survol + clic) posée à l'intérieur de la cour, au-delà du seuil,
 *                              pour qu'il y ait quelque chose à viser au lieu de marcher au
 *                              hasard jusqu'à franchir une zone invisible (correctif, voir
 *                              l'orchestrateur). Sa case d'interaction la plus proche retombe
 *                              TOUJOURS dans l'aire de `cour.portail` (vérifié par construction :
 *                              la case posée est au-delà de la zone, ses voisines franchissables
 *                              aussi) : cliquer dessus fait marcher le meneur À TRAVERS la zone,
 *                              qui se déclenche donc normalement au passage -- aucun second
 *                              chemin de complétion d'objectif à maintenir.
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

const WIDTH = 44;
const HEIGHT = 72;

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
const TACTICAL_ORIGIN = { x: 7, y: 1 };

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

// Des sas légèrement plus larges et des seuils décalés donnent des vues obliques
// sur les décisions à venir sans transformer les salles en labyrinthe. Le mur nord
// de salle 3 reste au contact exact de la cour (y = 21).
carveRoom(13, 22, 18, 9); // Salle 3 — le gaz et la vidéo
carveRoom(13, 32, 18, 9); // Salle 2 — le choix coûteux
carveRoom(13, 42, 18, 9); // Salle 1 — la porte et le chien
carveRoom(13, 52, 18, 9); // Hall d'entrée

// Parking : l'approche garde la façade dans le cadre, avec une vraie zone de fourgon.
carveRoom(8, 62, 28, 8);

// Portail et portes entre les salles. Les seuils alternés font lire les masses de
// mobilier avant la pièce suivante. Aucune n'est verrouillée par défaut : la carte reste
// structurellement franchissable de bout en bout (le verrouillage narratif, s'il y en a
// un, est une décision du lot 3.7b sur l'entité `door`, pas sur le tracé).
punchDoor(21, 21); // cour <-> salle 3 (entité salle3.porte-nord)
punchDoor(26, 31); // salle 3 <-> salle 2 (entité salle2.porte-nord)
punchDoor(17, 41); // salle 2 <-> salle 1
punchDoor(26, 51); // salle 1 <-> hall (entité salle1.panneau-porte)
punchDoor(21, 61); // hall <-> parking

/* ------------------------------------------------------------------ */
/* Décor discret (mobilier, pas d'entité)                              */
/* ------------------------------------------------------------------ */

fillBlock(18, 65, 6, 3, 'T'); // parking : fourgon en une pièce, moteur coupé
fillBlock(15, 54, 4, 1, 'o'); // hall : banc d'attente
fillBlock(26, 57, 3, 1, 'o'); // hall : banc d'attente
fillBlock(15, 35, 2, 3, 'T'); // salle 2 : armoire sécurisée
fillBlock(24, 25, 2, 2, 'o'); // salle 3 : console de l'ordinateur
fillBlock(15, 45, 3, 1, 'o'); // salle 1 : mobilier qui cadre l'otage
fillBlock(27, 47, 2, 2, 'T'); // salle 1 : ancien poste de sécurité

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
  { id: 'salle3', title: 'Salle 3 — le gaz et la vidéo', rect: { origin: { x: 13, y: 22 }, width: 18, height: 9 } },
  { id: 'salle2', title: 'Salle 2 — le choix coûteux', rect: { origin: { x: 13, y: 32 }, width: 18, height: 9 } },
  { id: 'salle1', title: 'Salle 1 — la porte et le chien', rect: { origin: { x: 13, y: 42 }, width: 18, height: 9 } },
  { id: 'hall', title: "Hall d'entrée", rect: { origin: { x: 13, y: 52 }, width: 18, height: 9 } },
  { id: 'parking', title: 'Parking', rect: { origin: { x: 8, y: 62 }, width: 28, height: 8 } },
];

/* ------------------------------------------------------------------ */
/* Entités (voir l'en-tête : dialogueId/startNode vides, lot 3.7b)      */
/* ------------------------------------------------------------------ */

const ENTITIES: EntityDef[] = [
  // -- Hall d'entrée (étape 'hall') --------------------------------------
  {
    id: 'hall.instructeur',
    type: 'npc',
    cell: { x: 21, y: 57 },
    label: "Parler à l'instructeur",
    condition: etape('hall'),
  },

  // -- Salle 1 — la porte et le chien (étape 'salle1') -------------------
  {
    id: 'salle1.entree',
    type: 'zone',
    cell: { x: 26, y: 51 },
    area: { origin: { x: 13, y: 50 }, width: 18, height: 2 },
    condition: etape('salle1'),
  },
  {
    id: 'salle1.panneau-porte',
    type: 'object',
    cell: { x: 26, y: 51 }, // sur la case de la porte hall <-> salle 1
    // Posée sur le seuil : `roomAt` n'y trouve aucune pièce (mur/porte), donc sans ce champ
    // l'entité serait traitée comme un couloir, "toujours visible" -- fuite réelle constatée en
    // arrivant à l'étape 'salle1' encore côté hall (voir EntityBase.thresholdRoomId).
    thresholdRoomId: 'salle1',
    label: 'Pirater le panneau de la porte',
    condition: etape('salle1'),
    // Complète l'objectif de la salle (lot 3.7b, voir CHAPTER_1_SCENES "ch1.salle1") : joue
    // ch1.salle1 depuis son tout début (arrivée, piratage, chien) si rien d'autre n'a encore
    // été déclenché dans la pièce -- sinon (chien/otage abordés en premier) une réplique brève
    // de repli suffit, la scène a déjà tout dit (voir `openExploreConversation`, chapter.ts).
    dialogueId: 'ch1.salle1',
    startNode: 'arrivee',
  },
  {
    id: 'salle1.chien',
    type: 'npc',
    cell: { x: 19, y: 46 },
    label: 'Regarder le chien',
    condition: etape('salle1'),
    // Même dialogue que le panneau, entrée plus tardive (voir en-tête : deux entités, une seule
    // scène) -- conversation annexe, n'avance PAS le routeur (ce n'est pas le completionTrigger).
    dialogueId: 'ch1.salle1',
    startNode: 'chien-identifie',
  },
  {
    id: 'salle1.otage',
    type: 'npc',
    cell: { x: 23, y: 47 },
    label: "Parler à l'otage",
    condition: etape('salle1'),
    dialogueId: 'ch1.salle1',
    startNode: 'chien-identifie',
  },

  // -- Salle 2 — le choix coûteux (étape 'salle2') -----------------------
  {
    id: 'salle2.armoire',
    type: 'object',
    cell: { x: 15, y: 35 },
    label: "Forcer l'armoire sécurisée",
    condition: etape('salle2'),
    // Détour facultatif ("le choix coûteux") : conversation annexe, n'avance pas le routeur.
    dialogueId: 'ch1.salle2',
    startNode: 'choix-armoire',
    // Ce dialogue comprend aussi le piratage de la porte : elle doit être réellement ouverte
    // avant que le joueur la franchisse, même si l'armoire n'est pas le déclencheur d'objectif.
    opensDoorAfterDialogue: 'salle2.porte-nord',
  },
  {
    id: 'salle2.porte-nord',
    type: 'door',
    cell: { x: 26, y: 31 },
    label: 'Franchir la porte nord',
    condition: etape('salle2'),
    // Verrouillée par défaut (boîtier électronique, voir ch1.salle2.json "porte") : c'est ce qui
    // fait apparaître le dialogue au lieu d'un simple battant qui s'ouvre (ExploreState.computeOutcome,
    // cas 'door'). Complète l'objectif de la salle -- `chapter.ts` déverrouille la porte pour de
    // bon une fois la conversation terminée (`forceDoorOpen`, sans quoi le passage vers la salle 3
    // resterait physiquement bloqué malgré la scène déjà jouée).
    locked: true,
    dialogueId: 'ch1.salle2',
    startNode: 'porte',
  },

  // -- Salle 3 — le gaz et la vidéo (étape 'salle3') ----------------------
  {
    id: 'salle3.entree',
    type: 'zone',
    cell: { x: 26, y: 31 },
    area: { origin: { x: 13, y: 30 }, width: 18, height: 2 },
    condition: etape('salle3'),
  },
  {
    id: 'salle3.ordinateur',
    type: 'object',
    cell: { x: 24, y: 25 },
    label: "Utiliser l'ordinateur",
    condition: etape('salle3'),
    // Détour facultatif ("rester malgré le gaz") : conversation annexe, n'avance pas le routeur.
    dialogueId: 'ch1.salle3',
    startNode: 'choix-rester',
  },
  {
    id: 'salle3.porte-nord',
    type: 'door',
    cell: { x: 21, y: 21 },
    label: 'Franchir la porte nord',
    condition: etape('salle3'),
    // Même mécanique que salle2.porte-nord ci-dessus (verrouillée -> dialogue -> déverrouillée
    // pour de bon par `chapter.ts`). Complète l'objectif de la salle.
    locked: true,
    dialogueId: 'ch1.salle3',
    startNode: 'sortie-rapide',
  },

  // -- Cour de containers (étape 'cour') ----------------------------------
  {
    id: 'cour.portail',
    type: 'zone',
    cell: { x: 21, y: 20 },
    area: { origin: { x: 13, y: 19 }, width: 18, height: 2 },
    condition: etape('cour'),
  },
  {
    // Affordance visible du seuil (voir l'en-tête) : au-delà de la zone (y = 19-20), donc
    // toute case d'interaction adjacente reste DANS la zone ou juste avant elle en venant du
    // sud -- cliquer dessus fait traverser `cour.portail` au meneur, qui se déclenche alors
    // normalement. Pas de dialogue, pas de `label` de porte : un point à viser, rien de plus.
    id: 'cour.portail-porte',
    type: 'object',
    cell: { x: 21, y: 19 },
    label: 'Franchir le portail',
    condition: etape('cour'),
  },
];

/* ------------------------------------------------------------------ */
/* Points d'apparition                                                  */
/* ------------------------------------------------------------------ */

const SPAWNS: Record<string, { x: number; y: number }> = {
  parking: { x: 21, y: 68 }, // arrivée du fourgon (minimum requis par le design)
  hall: { x: 21, y: 57 },
  salle1: { x: 22, y: 47 },
  salle2: { x: 22, y: 37 },
  salle3: { x: 22, y: 27 },
  // Au SUD du portail (`cour.portail`, aire y = 19-20), côté salle 3 : un joueur qui recharge
  // pendant cette étape réapparaît avant le déclencheur, jamais déjà au-delà (défaut réel
  // constaté par l'orchestrateur -- l'ancien spawn {21,10} était au nord de la zone, donc déjà
  // "franchi" à froid, avec l'objectif "Franchir le portail" derrière soi).
  cour: { x: 21, y: 24 },
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
