import { describe, expect, it } from 'vitest';
import { ExploreMap, nearestWalkableCell } from '@/explore';
import { HOLT_MAP } from '@/data/maps/holt';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';
import { SMALL_MAP } from './fixtures/exploreFixtures';

describe('ExploreMap', () => {
  it('lit la légende exploration (sol, mur, porte)', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.kindAt({ x: 2, y: 2 })).toBe('floor');
    expect(map.kindAt({ x: 0, y: 0 })).toBe('wall');
    expect(map.kindAt({ x: 6, y: 2 })).toBe('door');
  });

  it('une case hors carte est "void" et jamais franchissable', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.kindAt({ x: -1, y: 0 })).toBe('void');
    expect(map.isWalkable({ x: -1, y: 0 })).toBe(false);
  });

  it('une porte est franchissable selon le prédicat fourni', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.isWalkable({ x: 6, y: 2 }, () => true)).toBe(true);
    expect(map.isWalkable({ x: 6, y: 2 }, () => false)).toBe(false);
    // Sans prédicat : ouverte par défaut.
    expect(map.isWalkable({ x: 6, y: 2 })).toBe(true);
  });

  it('un mur bloque la vue, une case franchissable non', () => {
    const map = new ExploreMap(SMALL_MAP);
    expect(map.blocksSight({ x: 0, y: 0 })).toBe(true);
    expect(map.blocksSight({ x: 2, y: 2 })).toBe(false);
  });

  it('les voisins ne coupent jamais un coin entre deux cases bloquées', () => {
    const map = new ExploreMap(SMALL_MAP);
    const isWalkable = (c: { x: number; y: number }) => map.isWalkable(c, () => true);
    // Depuis (5,3), les deux portes (6,2) et (6,4) sont franchissables (ouvertes), mais
    // le passage "en coin" vers elles est coupé par le mur (6,3) : elles ne doivent pas
    // apparaître dans les voisins malgré leur franchissabilité propre.
    const neighbors = map.neighbors({ x: 5, y: 3 }, isWalkable);
    expect(neighbors.some((n) => n.x === 6 && n.y === 2)).toBe(false);
    expect(neighbors.some((n) => n.x === 6 && n.y === 4)).toBe(false);
    // Le voisin orthogonal direct (au nord) reste, lui, accessible.
    expect(neighbors.some((n) => n.x === 5 && n.y === 2)).toBe(true);
  });

  it('nearestWalkableCell renvoie la case elle-même si elle est franchissable, sinon un voisin', () => {
    const map = new ExploreMap(SMALL_MAP);
    const isWalkable = (c: { x: number; y: number }) => map.isWalkable(c, () => true);
    expect(nearestWalkableCell(map, { x: 2, y: 2 }, isWalkable)).toEqual({ x: 2, y: 2 });
    // Un mur (0,0) doit retomber sur un voisin franchissable... ici tous les voisins sont des murs aussi,
    // donc on prend un vrai mur avec un voisin de sol : (0,1) est un mur, voisin (1,1) est du sol.
    expect(nearestWalkableCell(map, { x: 0, y: 1 }, isWalkable)).toEqual({ x: 1, y: 1 });
  });

  it('rejette une carte non rectangulaire', () => {
    expect(
      () =>
        new ExploreMap({
          ...SMALL_MAP,
          ascii: ['####', '#..#', '#...#', '####'],
        }),
    ).toThrow(/rectangulaire/);
  });

  it('rejette un caractère de légende inconnu', () => {
    expect(
      () =>
        new ExploreMap({
          ...SMALL_MAP,
          ascii: ['####', '#?.#', '#..#', '####'],
        }),
    ).toThrow(/inconnu/);
  });
});

/**
 * Viser une entité au doigt, c'est viser un disque de `INTERACT_GRAB_RADIUS_M` (0,7 m) autour
 * du centre de sa case -- voir `pick` dans src/render/exploreView.ts et 08-EXPLORATION.md.
 * Deux entités à moins de deux cases se partagent donc leur zone, et la plus proche gagne :
 * au doigt, on en attrape une pour l'autre. Constaté en jeu à la cantine, où Betty se tenait
 * en diagonale de la place de Franklyn -- la place qui lance le discours du directeur, donc
 * celle qu'il ne faut surtout pas manquer. Le sac de frappe et Zachary, eux, étaient carrément
 * sur deux cases voisines.
 *
 * Propriété globale plutôt que deux corrections ponctuelles : c'est ce qui attrape le prochain
 * cas, que personne n'ira chercher à la main.
 */
describe('les cartes livrées : des entités qu on peut viser séparément', () => {
  const CLICKABLE = new Set(['npc', 'object', 'seat']);
  /** Deux cases d'écart : chaque entité garde un disque de saisie entier. */
  const MIN_CELLS_APART = 2;

  it.each([
    ['holt', HOLT_MAP],
    ['centre-examen', CENTRE_EXAMEN_MAP],
  ])('%s : aucune paire d entités cliquables à moins de deux cases', (_name, map) => {
    const entities = map.entities.filter((e) => CLICKABLE.has(e.type));
    const tooClose: string[] = [];
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i] as { id: string; cell: { x: number; y: number } };
        const b = entities[j] as { id: string; cell: { x: number; y: number } };
        const distance = Math.hypot(a.cell.x - b.cell.x, a.cell.y - b.cell.y);
        if (distance < MIN_CELLS_APART) {
          tooClose.push(`${a.id} (${a.cell.x},${a.cell.y}) et ${b.id} (${b.cell.x},${b.cell.y}) : ${distance.toFixed(2)} case(s)`);
        }
      }
    }
    expect(tooClose, `entités trop proches pour être visées séparément :\n${tooClose.join('\n')}`).toEqual([]);
  });
});
