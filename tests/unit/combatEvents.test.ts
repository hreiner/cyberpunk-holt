import { describe, expect, it } from 'vitest';
import { playToEnd } from '@/tactical/ai';
import { TacticalCombat, defaultSetup } from '@/tactical/combat';
import type { CombatEvent } from '@/tactical/types';

function playedGame(seed: string): CombatEvent[] {
  const combat = new TacticalCombat(defaultSetup(seed));
  playToEnd(combat);
  return combat.state.events;
}

const SEEDS = ['evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5', 'evt-6'];

describe('evenements de combat', () => {
  it('commence sans aucun evenement', () => {
    const combat = new TacticalCombat(defaultSetup('evt-vide'));
    expect(combat.state.events).toEqual([]);
  });

  it('enregistre les tirs, avec leur resultat', () => {
    const shots = SEEDS.flatMap(playedGame).filter((e) => e.type === 'shot');
    expect(shots.length).toBeGreaterThan(0);
    for (const shot of shots) {
      expect(typeof shot.hit).toBe('boolean');
      expect(shot.shooter).not.toBe(shot.target);
    }
  });

  it('fait suivre chaque tir au but de la neutralisation de la cible', () => {
    for (const seed of SEEDS) {
      const events = playedGame(seed);
      events.forEach((event, i) => {
        if (event.type !== 'shot' || !event.hit) return;
        expect(events[i + 1]).toEqual({ type: 'neutralized', unit: event.target });
      });
    }
  });

  it('est identique pour la meme graine', () => {
    expect(playedGame('evt-rejeu')).toEqual(playedGame('evt-rejeu'));
  });
});
