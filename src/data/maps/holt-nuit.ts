/**
 * Variante de nuit de l'académie HOLT (chapitre 2, ADR 0024, lot 5.8) : le bal (scène 2,
 * `ch2.bal`) puis la fuite jusqu'au dortoir (scène 4, `ch2.fuite`), TECH-DESIGN §4.4/§6
 * "Lot 5.8".
 *
 * Invariant du lot (rappelé par le propriétaire) : « la carte `holt` garde EXACTEMENT son
 * rendu, `holt-nuit` est une variante, pas une modification de `holt` ». Ce fichier ne
 * touche donc jamais `holt.ts` : il en RÉUTILISE le plan ASCII et les pièces tels quels
 * (`HOLT_MAP.ascii`/`HOLT_MAP.rooms`, mêmes murs, mêmes salles, même mobilier) et pose sa
 * PROPRE liste d'entités et de points d'apparition — aucune des entités de `holt.ts`
 * (figurants du réveil, Grover au temps libre, etc.) n'existe ici, et réciproquement.
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
import type { EntityDef, MapDef } from '@/explore';
import { HOLT_MAP } from './holt';

/** Condition d'apparition sur le drapeau d'étape du chapitre 2 (même principe que `holt.ts`). */
function etape(value: Ch2Etape): Condition {
  return { flag: CH2_ETAPE_FLAG, equals: value };
}

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
  {
    id: 'fuite.zone-1',
    type: 'zone',
    cell: { x: 23, y: 40 },
    area: { origin: { x: 22, y: 38 }, width: 3, height: 5 },
    effects: [{ tempo: 1 }],
    condition: etape('fuite'),
  },
  {
    id: 'fuite.zone-2',
    type: 'zone',
    cell: { x: 23, y: 22 },
    area: { origin: { x: 22, y: 20 }, width: 3, height: 6 },
    effects: [{ tempo: 1 }],
    condition: etape('fuite'),
  },
  {
    id: 'fuite.zone-3',
    type: 'zone',
    cell: { x: 23, y: 10 },
    area: { origin: { x: 22, y: 9 }, width: 3, height: 4 },
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
  ascii: HOLT_MAP.ascii,
  rooms: HOLT_MAP.rooms,
  entities: ENTITIES,
  spawns: SPAWNS,
};
