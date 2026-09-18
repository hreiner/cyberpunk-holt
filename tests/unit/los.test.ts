import { describe, expect, it } from 'vitest';
import { COVER_HIGH, COVER_LOW, TacticalMap } from '@/tactical/grid';
import { coverAgainst, hasLineOfSight } from '@/tactical/los';

//  0123456
const ASCII = [
  '.......', // 0
  '.......', // 1
  '..###..', // 2
  '.......', // 3
  '...o...', // 4
  '.......', // 5
];

describe('ligne de vue', () => {
  const map = new TacticalMap(ASCII);

  it('passe en terrain degage', () => {
    expect(hasLineOfSight(map, { x: 0, y: 0 }, { x: 6, y: 0 })).toBe(true);
  });

  it('est coupee par un container', () => {
    expect(hasLineOfSight(map, { x: 3, y: 0 }, { x: 3, y: 5 })).toBe(false);
  });

  it("n'est pas coupee par des caisses", () => {
    expect(hasLineOfSight(map, { x: 3, y: 3 }, { x: 3, y: 5 })).toBe(true);
  });

  it('est toujours vraie sur soi-meme', () => {
    expect(hasLineOfSight(map, { x: 2, y: 2 }, { x: 2, y: 2 })).toBe(true);
  });
});

describe('couvert', () => {
  const map = new TacticalMap(ASCII);

  it('donne un couvert haut quand un container est entre la cible et le tireur', () => {
    // Cible en (2,3), juste au sud du container (2,2), tireur au nord.
    const cover = coverAgainst(map, { x: 2, y: 0 }, { x: 2, y: 3 });
    expect(cover.value).toBe(COVER_HIGH);
    expect(cover.label).toBe('haut');
  });

  it('donne un couvert bas derriere des caisses', () => {
    const cover = coverAgainst(map, { x: 3, y: 5 }, { x: 3, y: 3 });
    expect(cover.value).toBe(COVER_LOW);
  });

  it('ne donne aucun couvert si l obstacle est du mauvais cote', () => {
    // Tireur au sud : le container (4,2) est derriere la cible (5,3), pas devant,
    // et aucune caisse ne se trouve du cote du tireur.
    const cover = coverAgainst(map, { x: 5, y: 5 }, { x: 5, y: 3 });
    expect(cover.value).toBe(0);
    expect(cover.label).toBe('aucun');
  });

  it('compte une caisse diagonale placee du cote du tireur', () => {
    // La caisse (3,4) est entre le tireur (2,5) et la cible (2,3).
    const cover = coverAgainst(map, { x: 2, y: 5 }, { x: 2, y: 3 });
    expect(cover.value).toBe(COVER_LOW);
  });
});
