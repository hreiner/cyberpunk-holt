/**
 * Petite carte d'exploration de test : deux pièces reliées par deux portes,
 * un npc, un objet, un siège, une sortie et une zone. Utilisée par
 * tests/unit/explore*.test.ts. Pas un fichier de test lui-même (pas de
 * suffixe .test.ts), donc ignoré par vitest.
 */

import type { MapDef } from '@/explore';

const SMALL_ASCII = [
  '###########',
  '#.....#...#',
  '#.....+...#',
  '#.....#...#',
  '#.....+...#',
  '#.....#...#',
  '###########',
];

export const SMALL_MAP: MapDef = {
  id: 'test-small',
  title: 'Carte de test',
  ascii: SMALL_ASCII,
  rooms: [
    { id: 'roomA', title: 'Salle A', rect: { origin: { x: 1, y: 1 }, width: 5, height: 5 } },
    { id: 'roomB', title: 'Salle B', rect: { origin: { x: 7, y: 1 }, width: 3, height: 5 } },
  ],
  entities: [
    {
      id: 'guard',
      type: 'npc',
      cell: { x: 2, y: 2 },
      dialogueId: 'test.npc',
      startNode: 'start',
      label: 'Parler à la sentinelle',
    },
    { id: 'locker', type: 'object', cell: { x: 3, y: 4 }, line: 'Un vieux casier.', label: 'Examiner le casier' },
    { id: 'chair', type: 'seat', cell: { x: 8, y: 2 }, dialogueId: 'test.seat', startNode: 'start', label: 'S’asseoir' },
    { id: 'doorAB', type: 'door', cell: { x: 6, y: 2 } },
    { id: 'secretDoor', type: 'door', cell: { x: 6, y: 4 }, locked: true, lockedLine: 'Verrouillée.' },
    { id: 'gate', type: 'exit', cell: { x: 9, y: 4 }, targetMapId: 'other', targetSpawn: 'arrivee', label: 'Sortir' },
    {
      id: 'trapzone',
      type: 'zone',
      cell: { x: 8, y: 3 },
      area: { origin: { x: 7, y: 1 }, width: 3, height: 5 },
    },
  ],
  spawns: {
    start: { x: 2, y: 4 },
  },
};

export const CONDITIONED_MAP: MapDef = {
  ...SMALL_MAP,
  id: 'test-conditioned',
  entities: [
    ...SMALL_MAP.entities.filter((e) => e.id !== 'guard'),
    {
      id: 'guard',
      type: 'npc',
      cell: { x: 2, y: 2 },
      dialogueId: 'test.npc',
      startNode: 'start',
      condition: { flag: 'discours-fini' },
    },
  ],
};

/**
 * Couloir rectiligne : un meneur qui marche du bout à l'autre en un seul grand pas (`tick(1000)`)
 * doit traverser `midzone` (une case, x=3) sans la sauter -- sert au test de sous-échantillonnage
 * de `ExploreState.tick()` (voir tests/unit/exploreState.test.ts, "un grand pas ne saute pas une
 * zone").
 */
export const CORRIDOR_MAP: MapDef = {
  id: 'test-corridor',
  title: 'Couloir de test',
  ascii: ['##########', '#........#', '##########'],
  rooms: [],
  entities: [
    {
      id: 'midzone',
      type: 'zone',
      cell: { x: 3, y: 1 },
      area: { origin: { x: 3, y: 1 }, width: 1, height: 1 },
    },
  ],
  spawns: {
    start: { x: 1, y: 1 },
  },
};

export const YARD_ONLY_MAP: MapDef = {
  id: 'test-yard',
  title: 'Cour seule',
  ascii: Array.from({ length: 20 }, () => '.'.repeat(30)),
  rooms: [],
  entities: [],
  spawns: { start: { x: 0, y: 0 } },
  tacticalArea: { origin: { x: 0, y: 0 }, mapId: 'yard' },
};

export const BROKEN_MAPS: Record<string, MapDef> = {
  nonRectangular: {
    ...SMALL_MAP,
    id: 'broken-rect',
    ascii: ['####', '#..#', '#...#', '####'],
  },
  doorNotOnWall: {
    ...SMALL_MAP,
    id: 'broken-door',
    entities: [{ id: 'badDoor', type: 'door', cell: { x: 2, y: 2 } }],
  },
  duplicateIds: {
    ...SMALL_MAP,
    id: 'broken-dup',
    entities: [...SMALL_MAP.entities, { id: 'guard', type: 'object', cell: { x: 3, y: 3 }, line: 'doublon' }],
  },
  unreachable: {
    ...SMALL_MAP,
    id: 'broken-unreachable',
    ascii: [
      '###########',
      '#.....#...#',
      '#.....#...#',
      '#.....#...#',
      '#.....#...#',
      '#.....#...#',
      '###########',
    ],
  },
  tacticalAreaOutOfBounds: {
    ...SMALL_MAP,
    id: 'broken-tactical',
    tacticalArea: { origin: { x: 5, y: 5 }, mapId: 'yard' },
  },
};
