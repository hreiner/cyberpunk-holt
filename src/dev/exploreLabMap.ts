/**
 * Petite carte de démonstration pour `explore-lab.html` : deux pièces
 * reliées par un couloir et une porte, une cour "tactique" embarquée
 * (rectangle `tacticalArea`, taille de la cour de combat existante), un
 * npc, un objet, un siège, une sortie et une zone. Sert à vérifier
 * visuellement `src/render/exploreView.ts` et `src/ui/objectiveHud.ts` —
 * ce n'est ni l'académie ni le centre d'examen réels (docs/design/09-MAPS-CHAPTER-1.md),
 * juste un banc d'essai technique.
 */

import type { MapDef } from '@/explore';

const WIDTH = 32;

/** Assemble une ligne et vérifie sa largeur au chargement (erreur explicite plutôt qu'un décalage silencieux). */
function row(s: string): string {
  if (s.length !== WIDTH) throw new Error(`explore-lab: ligne de largeur ${s.length}, attendu ${WIDTH} ("${s}")`);
  return s;
}

const WALL_ROW = row('#'.repeat(WIDTH));
/** Rangée de pièces : mur, salle A (14), mur/porte au centre, salle B (15), mur. */
function roomRow(centerChar: '#' | '+'): string {
  return row('#' + '.'.repeat(14) + centerChar + '.'.repeat(15) + '#');
}
/** Rangée de fermeture des pièces, avec une brèche de couloir en colonne 7. */
const CLOSE_ROW = row('#'.repeat(7) + '.' + '#'.repeat(WIDTH - 8));
/** Rangée de cour : mur, 30 cases de sol, mur. */
const YARD_ROW = row('#' + '.'.repeat(30) + '#');

const ASCII: string[] = [
  WALL_ROW, // 0
  roomRow('#'), // 1
  roomRow('#'), // 2
  roomRow('#'), // 3
  roomRow('+'), // 4 — porte entre les deux salles
  roomRow('#'), // 5
  roomRow('#'), // 6
  roomRow('#'), // 7
  roomRow('#'), // 8
  CLOSE_ROW, // 9 — brèche de couloir (col. 7)
  CLOSE_ROW, // 10 — idem : le couloir descend vers la cour
  ...Array.from({ length: 20 }, () => YARD_ROW), // 11..30 — la cour (30 x 20, cf. tacticalArea)
  WALL_ROW, // 31
];

export const EXPLORE_LAB_MAP: MapDef = {
  id: 'lab',
  title: 'Banc d’essai — exploration',
  ascii: ASCII,
  rooms: [
    { id: 'roomA', title: 'Salle A', rect: { origin: { x: 1, y: 1 }, width: 14, height: 8 } },
    { id: 'roomB', title: 'Salle B', rect: { origin: { x: 16, y: 1 }, width: 15, height: 8 } },
  ],
  entities: [
    {
      id: 'concierge',
      type: 'npc',
      cell: { x: 4, y: 3 },
      dialogueId: 'lab.npc',
      startNode: 'start',
      label: 'Parler au concierge',
    },
    {
      id: 'panel',
      type: 'object',
      cell: { x: 10, y: 6 },
      line: 'Un panneau de contrôle muet.',
      label: 'Examiner le panneau',
    },
    {
      id: 'doorAB',
      type: 'door',
      cell: { x: 15, y: 4 },
      label: 'Ouvrir la porte',
    },
    {
      id: 'bench',
      type: 'seat',
      cell: { x: 22, y: 4 },
      dialogueId: 'lab.seat',
      startNode: 'start',
      label: 'S’asseoir sur le banc',
    },
    {
      id: 'fourgon',
      type: 'exit',
      cell: { x: 15, y: 29 },
      targetMapId: 'centre-examen',
      targetSpawn: 'arrivee',
      label: 'Rejoindre le fourgon',
    },
    {
      id: 'contact',
      type: 'zone',
      cell: { x: 15, y: 28 },
      area: { origin: { x: 1, y: 27 }, width: 30, height: 4 },
    },
  ],
  spawns: {
    start: { x: 4, y: 4 },
  },
  tacticalArea: { origin: { x: 1, y: 11 }, mapId: 'yard' },
};
