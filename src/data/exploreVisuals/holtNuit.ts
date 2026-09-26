/**
 * Habillage de la variante de nuit (`holt-nuit`, lot 5.8/5.8b) : reprend le mobilier de
 * `holt.ts` (mêmes salles, presque tout le même mobilier -- l'invariant du lot : « holt-nuit
 * est une variante, pas une modification de holt »), sous la clé `mapId: 'holt-nuit'` qu'attend
 * `EXPLORE_VISUALS` (`ExploreView` choisit son habillage par `def.id`, ADR 0024).
 *
 * **Lot 5.8b (l'habillage de la nuit)** : la seule pièce qui change de mobilier est la salle
 * d'entraînement (le bal, puis la fuite) -- GAME-DESIGN scène 2 : « la salle de l'examen
 * redécorée (ballons, gâteaux, piste libre au centre, figurants) ». Ses pupitres et son cercle
 * de combat (`entrainement.pupitre-*`, `entrainement.cercle`) sont retirés de la copie de
 * `HOLT_VISUALS.placements` (`NIGHT_REMOVED_IDS`) et remplacés par DEUX jeux de placements
 * conditionnés par `etape` (ADR 0026) sur les MÊMES cases (l'ancienne grille de pupitres,
 * `EXAM_DESK_CELLS`/`DRESSABLE_DESK_CELLS`, `src/data/maps/holt-nuit.ts`) : quelques tables de
 * buffet et des guirlandes pour `etape('bal')` (le reste de la grille reste nu -- "la piste
 * dégagée"), les mêmes cases en pupitres renversés (« John et Grover renversent les tables »,
 * `ch2.slow.json`) pour `etape('fuite')` -- avec, en plus, une lueur de feu et un peu de fumée
 * près des deux portes bloquées par l'incendie (`fuite.porte-cour-ouest/est`, `holt-nuit.ts`).
 * Le reste du bâtiment (dortoirs, cour, administration...) garde EXACTEMENT le mobilier de
 * jour : le joueur ne s'y attarde pas pendant le bal/la fuite, mais rien n'empêche d'y marcher.
 *
 * **Revue du lot 5.8b (2026-09-26), trois correctifs** :
 * 1. Le plan de `holt-nuit` est désormais DÉRIVÉ de celui de `holt` (`deriveNightAscii`,
 *    `src/data/maps/holt-nuit.ts`), pas réutilisé tel quel : les cases de l'ancienne grille de
 *    pupitres deviennent du sol, sauf les 8 (`BUFFET_CELLS`) qui portent un buffet au bal et
 *    restent bloquantes aux deux étapes. La piste dégagée est donc réellement praticable, plus
 *    seulement dessinée comme telle -- voir ADR 0026 et `10-MAPS-CHAPTER-2.md`.
 * 2. Les placements hérités de `HOLT_VISUALS` dont l'`entityId` ne correspond à AUCUNE entité
 *    de `holt-nuit` (`interface.terminal`, `local-technique.transformateurs`, `dortoir.casier`,
 *    `entrainement.sac-de-frappe`, `garage.fourgon` -- latent depuis le lot 5.8) perdent cet
 *    `entityId` orphelin (`withoutOrphanEntity`, filtre générique plutôt qu'une liste à la
 *    main -- `NIGHT_ENTITY_IDS` compare directement à `HOLT_NUIT_MAP.entities`) : ils restent
 *    posés, toujours visibles, décor inerte plutôt qu'une case bloquante sans aucun modèle.
 *    Exception : `cantine.place-franklyn` et le pupitre de Franklyn (`entrainement.pupitre-
 *    franklyn`) sont des meubles pleins sur une case FRANCHISSABLE, valides seulement parce
 *    qu'un personnage l'occupe dans `holt.ts` -- sans équivalent ici, ils sont retirés
 *    entièrement (`NIGHT_SEATED_ORPHAN_IDS`), pas seulement dépouillés de leur `entityId`.
 * 3. Le bal est plus lumineux et plus lisible comme "piste de danse" : climat `setNightMood`
 *    relevé (`atmosphere.ts`), deux guirlandes de plus directement au-dessus de la piste.
 *
 * Uniquement des primitives procédurales (`src/render/exploration/props.ts`) et les matières
 * existantes (`materials.ts`) : aucun asset externe, aucune dépendance npm nouvelle.
 */
import type { Cell } from '@/explore';
import type { ExploreVisualMapDef, ExploreVisualPlacement } from '../exploreVisualTypes';
import { BUFFET_CELLS, DRESSABLE_DESK_CELLS, HOLT_NUIT_MAP } from '../maps/holt-nuit';
import { HOLT_VISUALS } from './holt';

const key = ({ x, y }: Cell): string => `${x},${y}`;
const BUFFET_KEYS = new Set(BUFFET_CELLS.map(key));

/**
 * Deux placements de `HOLT_VISUALS` sont des meubles PLEINS posés sur une case FRANCHISSABLE
 * de `holt.ts` -- valides seulement parce qu'un personnage l'occupe (Franklyn, au pupitre ou à
 * table, règle "meuble occupé par un personnage" du catalogue). Aucun équivalent sur
 * `holt-nuit` : impossible de simplement leur retirer leur `entityId` (le meuble redeviendrait
 * un obstacle plein sur une case franchissable, sans personne pour l'occuper -- une collision
 * invisible). Retirés entièrement, comme le reste de la grille de pupitres.
 */
const NIGHT_SEATED_ORPHAN_IDS = new Set<string>(['entrainement.pupitre-38-39', 'cantine.chaise-franklyn']);

/** Identifiants retirés de la copie de `HOLT_VISUALS.placements` : la grille de pupitres (`DRESSABLE_DESK_CELLS` + le pupitre de Franklyn), le cercle de combat de jour, et les deux sièges orphelins ci-dessus. */
const NIGHT_REMOVED_IDS = new Set<string>([
  'entrainement.cercle',
  ...DRESSABLE_DESK_CELLS.map(({ x, y }) => `entrainement.pupitre-${x}-${y}`),
  ...NIGHT_SEATED_ORPHAN_IDS,
]);

/**
 * Entités réellement posées sur `holt-nuit` (voir `HOLT_NUIT_MAP.entities`) : un placement dont
 * l'`entityId` n'y figure pas est un fantôme hérité de `holt.ts` (latent depuis le lot 5.8,
 * repéré en revue -- `interface.terminal`, `local-technique.transformateurs`, `dortoir.casier`,
 * `entrainement.sac-de-frappe`, `garage.fourgon`). Filtre générique plutôt qu'une liste
 * d'identifiants à la main : il reste correct si `HOLT_VISUALS`/`holt-nuit.ts` changent.
 */
const NIGHT_ENTITY_IDS = new Set(HOLT_NUIT_MAP.entities.map((e) => e.id));

/**
 * Les cinq placements ci-dessus restent des meubles pleins sur des cases DÉJÀ bloquantes dans
 * `holt.ts` (un terminal, une grille de sol, un casier, un sac de frappe, un fourgon) : leur
 * `entityId` orphelin (voir `NIGHT_ENTITY_IDS`) ne les rend pas invalides, seulement muets --
 * on leur retire donc SEULEMENT `entityId` (ils redeviennent toujours visibles, décor inerte)
 * plutôt que de les retirer et de laisser leur case bloquante sans aucun modèle (le "bloc
 * générique" que ce test guette, règle 4).
 */
function withoutOrphanEntity(p: ExploreVisualPlacement): ExploreVisualPlacement {
  if (!p.entityId || NIGHT_ENTITY_IDS.has(p.entityId)) return p;
  const { entityId: _entityId, ...rest } = p;
  return rest;
}

const NIGHT_BASE_PLACEMENTS: readonly ExploreVisualPlacement[] = HOLT_VISUALS.placements
  .filter((p) => !NIGHT_REMOVED_IDS.has(p.id))
  .map(withoutOrphanEntity);

/** Table de buffet : une case de l'ancienne grille (`replaces` retire le placeholder générique, ADR 0017), visible seulement au bal. Reste bloquante à la fuite aussi (voir `deriveNightAscii`) -- `deskOverturnedOn` y pose la version `solid`. */
function buffetTable(cell: Cell, rotation: ExploreVisualPlacement['rotation']): ExploreVisualPlacement {
  return {
    id: `bal.buffet-${cell.x}-${cell.y}`,
    model: 'buffet-table',
    cell,
    footprint: [cell],
    replaces: [cell],
    rotation,
    roomId: 'salles-entrainement',
    etape: 'bal',
  };
}

/**
 * Guirlande de lampions, suspendue au-dessus de la piste (`overhead`, aucune case bloquée --
 * posée sur une rangée ENTIÈREMENT franchissable de l'ancienne grille, jamais les rangées de
 * pupitres elles-mêmes qui alternaient case bloquante/franchissable avant `deriveNightAscii`).
 */
function stringLights(id: string, x: number, y: number, rotation: ExploreVisualPlacement['rotation']): ExploreVisualPlacement {
  return {
    id,
    model: 'party-string-lights',
    cell: { x: x + 1, y },
    footprint: [{ x, y }, { x: x + 1, y }, { x: x + 2, y }],
    rotation,
    roomId: 'salles-entrainement',
    etape: 'bal',
  };
}

/**
 * Pupitre renversé (fuite) : POSÉ sur une case de l'ancienne grille (`DRESSABLE_DESK_CELLS`).
 * `replaces` retire le même placeholder générique que `buffetTable` sur les cases restées
 * bloquantes (`BUFFET_CELLS`, `solid`) ; sur les autres, redevenues du sol par
 * `deriveNightAscii`, le pupitre couché ne bloque plus rien (`desk-overturned-loose`, `flat`,
 * jamais `replaces` -- la case n'a jamais été un obstacle générique à retirer). Dans les deux
 * cas, la même géométrie (`props.ts`) : seule l'occupancy déclarée change. La rotation alterne
 * par position (jamais `Math.random()`, règle n°1 d'AGENTS.md) pour ne pas aligner les
 * pupitres à l'identique.
 */
function deskOverturned(cell: Cell, index: number): ExploreVisualPlacement {
  const rotations = [0, 90, 180, 270] as const;
  const blocking = BUFFET_KEYS.has(key(cell));
  return {
    id: `fuite.pupitre-renverse-${cell.x}-${cell.y}`,
    model: blocking ? 'desk-overturned' : 'desk-overturned-loose',
    cell,
    footprint: [cell],
    ...(blocking ? { replaces: [cell] } : {}),
    rotation: rotations[index % rotations.length],
    roomId: 'salles-entrainement',
    etape: 'fuite',
  };
}

/** Lueur de feu au sol, côté salle, juste sous une porte bloquée (`fuite.porte-cour-ouest/est`). */
function fireGlow(id: string, cell: Cell, roomId = 'salles-entrainement'): ExploreVisualPlacement {
  return { id, model: 'fire-glow', cell, footprint: [cell], roomId, etape: 'fuite' };
}

/** Filet de fumée, à côté de la lueur (voir `fireGlow`) : jamais sur la même case, pour rester deux silhouettes lisibles. */
function smokeWisp(id: string, cell: Cell, roomId = 'salles-entrainement'): ExploreVisualPlacement {
  return { id, model: 'smoke-wisp', cell, footprint: [cell], roomId, etape: 'fuite' };
}

/** Rangée entièrement franchissable au centre de l'ancienne grille (voir `stringLights`) : y = 38, x = 30..42. */
const DANCE_FLOOR_ROW = 38;

const BAL_PLACEMENTS: ExploreVisualPlacement[] = [
  // Piste dégagée au centre (GAME-DESIGN scène 2) : marquage au sol sur la rangée du milieu,
  // réellement franchissable (`deriveNightAscii`) -- les rangées de pupitres elles-mêmes
  // restent, sans meuble dessus pendant le bal, une lecture "cleared" par simple absence de
  // mobilier, ET réellement praticable là où le plan dérivé les a rendues au sol.
  {
    id: 'bal.piste',
    model: 'dance-floor-tile',
    cell: { x: 36, y: DANCE_FLOOR_ROW },
    footprint: Array.from({ length: 13 }, (_, i) => ({ x: 30 + i, y: DANCE_FLOOR_ROW })),
    roomId: 'salles-entrainement',
    etape: 'bal',
  },
  ...BUFFET_CELLS.map((cell) => buffetTable(cell, cell.x === 30 ? 90 : 270)),
  // Guirlandes de lampions : deux au-dessus des rangées voisines (36/40), deux de plus
  // directement au-dessus de la piste (38, rangée du milieu) -- "plus de guirlandes visibles"
  // et un repère lumineux net sur la piste elle-même (revue du 2026-09-26).
  stringLights('bal.guirlande-nord', 33, 36, 0),
  stringLights('bal.guirlande-sud', 33, 40, 0),
  stringLights('bal.guirlande-piste-ouest', 31, DANCE_FLOOR_ROW, 0),
  stringLights('bal.guirlande-piste-est', 38, DANCE_FLOOR_ROW, 0),
];

const FUITE_PLACEMENTS: ExploreVisualPlacement[] = [
  ...DRESSABLE_DESK_CELLS.map((cell, index) => deskOverturned(cell, index)),
  // Lueur + fumée côté salle des deux portes bloquées par le feu (cases franchissables juste
  // au sud du seuil, voir `holt-nuit.ts` -- `fuite.porte-cour-ouest/est` sont eux-mêmes sur le
  // mur, aux cases {31,32}/{44,32}).
  fireGlow('fuite.lueur-porte-ouest', { x: 31, y: 33 }),
  fireGlow('fuite.lueur-porte-est', { x: 44, y: 33 }),
  smokeWisp('fuite.fumee-porte-ouest', { x: 32, y: 33 }),
  smokeWisp('fuite.fumee-porte-est', { x: 43, y: 33 }),
  // Idem sous les deux portes du dortoir (`fuite.porte-dortoir-cour/cantine`, cases {31,16}/{44,16}).
  fireGlow('fuite.lueur-porte-dortoir-cour', { x: 31, y: 17 }, 'cour-interieure'),
  fireGlow('fuite.lueur-porte-dortoir-cantine', { x: 44, y: 17 }, 'cantine'),
  smokeWisp('fuite.fumee-porte-dortoir-cour', { x: 32, y: 17 }, 'cour-interieure'),
  smokeWisp('fuite.fumee-porte-dortoir-cantine', { x: 43, y: 17 }, 'cantine'),
];

export const HOLT_NUIT_VISUALS: ExploreVisualMapDef = {
  mapId: 'holt-nuit',
  placements: [...NIGHT_BASE_PLACEMENTS, ...BAL_PLACEMENTS, ...FUITE_PLACEMENTS],
};
