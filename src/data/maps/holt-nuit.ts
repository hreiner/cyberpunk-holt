/**
 * Variante de nuit de l'académie HOLT (chapitre 2, ADR 0024/0026, lot 5.8/5.8b) : le bal
 * (scène 2, `ch2.bal`) puis la fuite jusqu'au dortoir (scène 4, `ch2.fuite`), TECH-DESIGN
 * §4.4/§6 "Lot 5.8".
 *
 * Invariant du lot (rappelé par le propriétaire) : « la carte `holt` garde EXACTEMENT son
 * rendu, `holt-nuit` est une variante, pas une modification de `holt` ». Ce fichier ne
 * touche donc jamais `holt.ts` : il en RÉUTILISE les pièces telles quelles (`HOLT_MAP.rooms`,
 * mêmes murs, mêmes salles) et pose sa PROPRE liste d'entités et de points d'apparition —
 * aucune des entités de `holt.ts` (figurants du réveil, Grover au temps libre, etc.) n'existe
 * ici, et réciproquement. Son ASCII, en revanche, est DÉRIVÉ (`deriveNightAscii`, lot 5.8b) :
 * voir la section « Plan dérivé » plus bas pour la raison (pas de collision invisible sur la
 * piste dégagée du bal).
 *
 * Géographie (TECH-DESIGN §1, réponse 3) : le bal se joue dans les salles d'entraînement
 * (la même salle que l'examen du chapitre 1, redécorée pour une nuit — GAME-DESIGN §4 scène
 * 2 : « la salle de l'examen redécorée ») ; la fuite emprunte le couloir de ceinture jusqu'au
 * dortoir, où la grille (`dortoir.grille`, une porte verrouillée) déclenche `ch2.grille`.
 * Le mobilier d'examen de `holt.ts` (pupitres) sert de tables du bal — puis de tables
 * renversées, à la fin de `ch2.slow.json` : aucune entité ne le représente ici, la bascule
 * est purement narrative (ADR 0024 §5, variante 🟢 retenue pour "porter Letitia").
 */

import type { Condition } from '@/narrative';
import { CH2_ETAPE_FLAG } from '@/data/chapters/ch2';
import type { Ch2Etape } from '@/data/chapters/ch2';
import type { Cell, EntityDef, MapDef } from '@/explore';
import { HOLT_MAP } from './holt';

/** Condition d'apparition sur le drapeau d'étape du chapitre 2 (même principe que `holt.ts`). */
function etape(value: Ch2Etape): Condition {
  return { flag: CH2_ETAPE_FLAG, equals: value };
}

/* ------------------------------------------------------------------ */
/* Plan dérivé (ADR 0026, lot 5.8b) : la grille de pupitres de jour       */
/* ------------------------------------------------------------------ */

/**
 * Grille des 28 pupitres de jour (`holt.ts`, salle d'entraînement, cases `o` de l'ASCII de
 * `holt`). Réutilisée par `src/data/exploreVisuals/holtNuit.ts` pour poser buffet/pupitres
 * renversés exactement sur ces mêmes cases : une seule source pour la géométrie de la grille,
 * jamais deux listes de coordonnées à tenir synchronisées.
 */
export const EXAM_DESK_CELLS: Cell[] = [35, 37, 39, 41].flatMap((y) =>
  [30, 32, 34, 36, 38, 40, 42].map((x) => ({ x, y })),
);

/**
 * `(38, 39)` est le pupitre de Franklyn dans `holt.ts` (`entrainement.pupitre-franklyn`),
 * seule case de la grille déjà FRANCHISSABLE dans l'ASCII de `holt` (le personnage assis
 * dessus). Aucune entité équivalente n'existe sur `holt-nuit` : cette case n'a besoin d'aucune
 * transformation (déjà `.`) et ne porte ni buffet ni pupitre renversé.
 */
const FRANKLYN_DESK_CELL: Cell = { x: 38, y: 39 };

/**
 * `EXAM_DESK_CELLS` moins la case de Franklyn (voir ci-dessus) : les cases qui reçoivent
 * vraiment un buffet ou un pupitre renversé (`exploreVisuals/holtNuit.ts`). Exportée pour que
 * cette exclusion ne soit décidée qu'une fois, ici, à côté du plan qu'elle décrit.
 */
export const DRESSABLE_DESK_CELLS: Cell[] = EXAM_DESK_CELLS.filter(
  (c) => !(c.x === FRANKLYN_DESK_CELL.x && c.y === FRANKLYN_DESK_CELL.y),
);

/**
 * Cases de buffet (bal) : les deux colonnes les plus proches des murs ouest/est de la grille
 * (x = 30 ou 42) -- "les pupitres repoussés contre les murs, en tables de buffet" du constat
 * de lot. Ce sont les SEULES cases de l'ancienne grille qui restent bloquantes dans le plan
 * dérivé (voir `deriveNightAscii`) : un meuble plein (buffet, puis pupitre renversé au même
 * endroit) y reste posé aux deux étapes, donc la case doit rester une case d'obstacle aux
 * deux étapes -- « aucune case ne doit bloquer à une étape sans rien montrer ».
 */
export const BUFFET_CELLS: Cell[] = EXAM_DESK_CELLS.filter((c) => c.x === 30 || c.x === 42);

const buffetKeys = new Set(BUFFET_CELLS.map(({ x, y }) => `${x},${y}`));

/**
 * Dérive l'ASCII de `holt-nuit` à partir de celui de `holt` (jamais l'inverse : `holt.ts`
 * n'est pas touché, invariant du lot 5.8). Transformation déclarée, une seule règle :
 *
 * - Les 28 cases de l'ancienne grille de pupitres (`EXAM_DESK_CELLS`) deviennent du sol
 *   (`.`), SAUF les 8 qui portent un buffet au bal (`BUFFET_CELLS`), qui restent bloquantes
 *   (`o`) -- exactement ce qu'elles étaient déjà dans `holt.ts`.
 *
 * Résultat : la piste dégagée au centre (GAME-DESIGN scène 2) est réellement praticable, pas
 * seulement dessinée comme telle -- le défaut relevé en revue ("le joueur ne doit pas buter
 * contre les anciens pupitres"). Les tables de buffet et, à la fuite, les pupitres renversés
 * posés sur ces mêmes 8 cases blocantes RESTENT des obstacles réels aux deux étapes (le plan
 * ne change pas selon l'étape, seul l'habillage dessiné dessus change, ADR 0026) : jamais une
 * case qui bloque sans qu'un placement d'une étape ou l'autre y réponde.
 */
function deriveNightAscii(base: readonly string[]): string[] {
  const toFloor = new Set(
    EXAM_DESK_CELLS.filter((c) => !buffetKeys.has(`${c.x},${c.y}`)).map(({ x, y }) => `${x},${y}`),
  );
  return base.map((row, y) => {
    let out = row;
    for (let x = 0; x < row.length; x++) {
      if (toFloor.has(`${x},${y}`)) out = `${out.slice(0, x)}.${out.slice(x + 1)}`;
    }
    return out;
  });
}

const NIGHT_ASCII = deriveNightAscii(HOLT_MAP.ascii);

const ENTITIES: EntityDef[] = [
  /* -- Scène 2 (ch2.bal) : la dernière soirée, dans les salles d'entraînement -------------- */
  // Toutes conditionnées à `etape('bal')` : sans elle, ces cinq silhouettes restaient plantées
  // dans la salle pendant la fuite (défaut réel constaté à la première manche de captures --
  // même pièce, mêmes entités si rien ne les distingue par étape).
  {
    id: 'bal.letitia',
    type: 'npc',
    // Au centre de la salle, près du bureau de l'examinateur (holt.ts) : la première
    // silhouette qu'on cherche en entrant.
    cell: { x: 38, y: 34 },
    dialogueId: 'ch2.bal',
    label: 'Parler à Letitia',
    // Déclencheur de l'objectif (TECH-DESIGN §4.4) : son dialogueId N'EST PAS celui de la
    // scène suivante (`ch2.slow`) -- elle joue donc son PROPRE dialogue en entier
    // (l'invitation, ADR 0013 §4 étendu au lot 3.7b) avant de faire avancer le routeur.
    condition: etape('bal'),
  },
  {
    id: 'bal.zachary',
    type: 'npc',
    cell: { x: 32, y: 46 },
    dialogueId: 'ch2.bal.zachary',
    label: 'Parler à Zachary',
    condition: etape('bal'),
  },
  {
    id: 'bal.abigail',
    type: 'npc',
    cell: { x: 44, y: 42 },
    // Sur la piste : son dialogue la renvoie danser (« Elle retourne vers la piste »).
    pose: 'dance',
    dialogueId: 'ch2.bal.abigail',
    label: 'Parler à Abigail',
    condition: etape('bal'),
  },
  {
    id: 'bal.john',
    type: 'npc',
    cell: { x: 32, y: 36 },
    dialogueId: 'ch2.bal.john',
    label: 'Parler à John',
    condition: etape('bal'),
  },
  {
    id: 'bal.grover',
    type: 'npc',
    cell: { x: 42, y: 36 },
    dialogueId: 'ch2.bal.grover',
    label: 'Parler à Grover',
    condition: etape('bal'),
  },

  /* -- Scène 4 (ch2.fuite) : du hall des salles d'entraînement au dortoir ------------------ */
  // Toutes conditionnées à `etape('fuite')`, par symétrie : rien de la fuite (zones, portes
  // bloquées, gangers) n'a de sens tant qu'on est encore au bal.
  // Zones à effets (ADR 0024 §1) : trois seuils de tempo le long du couloir de ceinture,
  // du plus proche des salles d'entraînement au plus proche du dortoir -- "une réplique et
  // un tir lointain à chaque seuil" (TECH-DESIGN §4.6) vivent en radio (`ch2Radio.ts`,
  // `RadioCue.channel: 'pression'`), pas ici : une zone ne fait qu'avancer le minuteur.
  //
  // Décision du propriétaire (2026-09-26) : les trois zones sont INCONTOURNABLES -- le tempo pèse
  // par les choix (porteur, `solitaire`/`loyal-bande`, la grille), jamais par le chemin. Chacune
  // barre toute la largeur du passage qu'elle garde, couloir parallèle compris (x = 18-20, relié au
  // couloir de ceinture par les portes (21,20) et (21,6)) ; la dernière garde les deux abords de la
  // grille, y compris par le dortoir (joignable par la salle au sud, portes (31,16)/(44,16)).
  // Vérifié sur le plan par `tests/unit/ch2ExploreScenes.test.ts`.
  {
    id: 'fuite.zone-1',
    type: 'zone',
    // La sortie des salles d'entraînement (porte (25,40)), seule issue : tout le couloir devant elle.
    cell: { x: 23, y: 40 },
    area: { origin: { x: 22, y: 38 }, width: 3, height: 5 },
    effects: [{ tempo: 1 }],
    condition: etape('fuite'),
  },
  {
    id: 'fuite.zone-2',
    type: 'zone',
    // Les deux couloirs parallèles (x = 18-20 et 22-24), à la hauteur de la porte (21,20).
    cell: { x: 23, y: 22 },
    area: { origin: { x: 18, y: 20 }, width: 7, height: 6 },
    effects: [{ tempo: 1 }],
    condition: etape('fuite'),
  },
  {
    id: 'fuite.zone-3',
    type: 'zone',
    // Les abords de la grille, des deux côtés (couloir x = 18-24 et dortoir x = 26-28), y = 5-9.
    cell: { x: 23, y: 8 },
    area: { origin: { x: 18, y: 5 }, width: 11, height: 5 },
    effects: [{ tempo: 1 }],
    condition: etape('fuite'),
  },
  // Portes fermées par la narration (B11) : deux liaisons secondaires cour <-> salles
  // d'entraînement, bloquées par le feu -- jamais sur le chemin obligatoire (couloir de
  // ceinture), pour ne jamais coincer le joueur derrière une porte qu'aucun jet n'ouvre.
  {
    id: 'fuite.porte-cour-ouest',
    type: 'door',
    cell: { x: 31, y: 32 },
    locked: true,
    lockedLine: "Bloquée. Ça sent le brûlé, de l'autre côté.",
    label: 'Essayer la porte',
    condition: etape('fuite'),
  },
  {
    id: 'fuite.porte-cour-est',
    type: 'door',
    cell: { x: 44, y: 32 },
    locked: true,
    lockedLine: 'Condamnée par les flammes.',
    label: 'Essayer la porte',
    condition: etape('fuite'),
  },
  // Les deux portes nord de la cour intérieure et de la cantine, qui donnent dans le dortoir :
  // fermées par le feu, comme les deux précédentes (correctif du lot 5.9) -- sans elles, on
  // entrait au dortoir par le sud sans passer la grille. Le dortoir ne s'atteint que par la grille
  // (vérifié par `tests/unit/ch2ExploreScenes.test.ts`). Verrouillées aussi pendant le bal (l'état
  // d'une porte ne dépend pas de l'étape) : le bal n'a rien au dortoir, et le panneau fermé se voit.
  {
    id: 'fuite.porte-dortoir-cour',
    type: 'door',
    cell: { x: 31, y: 16 },
    locked: true,
    lockedLine: 'Bloquée. De la fumée passe sous la porte.',
    label: 'Essayer la porte',
    condition: etape('fuite'),
  },
  {
    id: 'fuite.porte-dortoir-cantine',
    type: 'door',
    cell: { x: 44, y: 16 },
    locked: true,
    lockedLine: 'Condamnée par les flammes.',
    label: 'Essayer la porte',
    condition: etape('fuite'),
  },
  // Silhouettes statiques de gangers armés (B12) : figurants immobiles dans le couloir de
  // ceinture, jamais de combat réel (GAME-DESIGN §5.6, "poursuite réelle écartée").
  {
    id: 'ganger.1',
    type: 'npc',
    cell: { x: 23, y: 34 },
    line: 'Une silhouette armée, immobile, au bout du couloir.',
    label: 'Regarder',
    condition: etape('fuite'),
  },
  {
    id: 'ganger.2',
    type: 'npc',
    cell: { x: 23, y: 16 },
    line: "Un ganger monte la garde devant une porte qu'il n'a pas franchie.",
    label: 'Regarder',
    condition: etape('fuite'),
  },
  // Flavor facultatif : Letitia dans la file, sans avancer le routeur (voir ch2.fuite.json --
  // le fichier garde son identifiant, réutilisé ici comme conversation annexe plutôt que
  // comme dialogue de scène, depuis que `ch2.fuite` (SceneDef) est une scène `explore`).
  {
    id: 'fuite.souffle',
    type: 'object',
    cell: { x: 23, y: 30 },
    dialogueId: 'ch2.fuite',
    line: 'Une seconde pour respirer, épaule contre le mur.',
    label: 'Souffler un instant',
    condition: etape('fuite'),
  },
  // Déclencheur de fin d'étape (TECH-DESIGN §4.4) : la grille du dortoir, une porte
  // verrouillée -- son dialogueId est celui de la scène SUIVANTE (`ch2.grille`, contrat du
  // lot 3.6b) : elle ne joue rien elle-même, c'est `ch2.grille.json` qui prend le relais.
  {
    id: 'dortoir.grille',
    type: 'door',
    cell: { x: 25, y: 7 },
    locked: true,
    dialogueId: 'ch2.grille',
    label: 'Forcer la grille',
    condition: etape('fuite'),
  },
];

const SPAWNS: Record<string, { x: number; y: number }> = {
  // Scène 2 : au centre du cercle de combat de `holt.ts`, débarrassé pour la nuit -- la
  // première chose vue en entrant est Letitia, près du bureau au nord.
  bal: { x: 37, y: 43 },
  // Scène 4 : entrée à froid (la scène 3, `ch2.slow`, est un dialogue -- pas de position à
  // reprendre) sur la piste, juste après la rafale.
  fuite: { x: 37, y: 45 },
};

export const HOLT_NUIT_MAP: MapDef = {
  id: 'holt-nuit',
  title: 'Académie HOLT — la nuit du bal',
  ascii: NIGHT_ASCII,
  rooms: HOLT_MAP.rooms,
  entities: ENTITIES,
  spawns: SPAWNS,
};
