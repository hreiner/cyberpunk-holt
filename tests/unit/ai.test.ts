import { describe, expect, it } from 'vitest';
import {
  AUTOMATIC_RESOLUTION_MAX_TURNS,
  decideAction,
  playAiTurn,
  playToEnd,
  resolveCombatAutomatically,
} from '@/tactical/ai';
import { TacticalCombat, defaultSetup } from '@/tactical/combat';
import { d10AtLeast, estimateShot } from '@/tactical/queries';

describe('IA tactique', () => {
  it('termine toujours le tour de l unite courante', () => {
    const combat = new TacticalCombat(defaultSetup('ia-tour'));
    const before = combat.currentUnitId();
    playAiTurn(combat);
    expect(combat.currentUnitId()).not.toBe(before);
  });

  it('propose toujours une action valide ou la fin du tour', () => {
    const combat = new TacticalCombat(defaultSetup('ia-valide'));
    for (let i = 0; i < 30 && combat.state.phase === 'playing'; i++) {
      const decision = decideAction(combat, combat.currentUnit());
      expect(decision.rationale.length).toBeGreaterThan(0);
      if (decision.action.type !== 'endTurn') {
        const outcome = combat.perform(decision.action);
        expect(outcome.ok).toBe(true);
      } else {
        combat.endTurn();
      }
    }
  });

  it('ne boucle pas a l infini', () => {
    const combat = new TacticalCombat(defaultSetup('ia-boucle'));
    playToEnd(combat, 300);
    expect(combat.state.phase).toBe('finished');
  });

  it('reste deterministe', () => {
    const a = new TacticalCombat(defaultSetup('ia-determinisme'));
    const b = new TacticalCombat(defaultSetup('ia-determinisme'));
    playToEnd(a);
    playToEnd(b);
    expect(a.state.units).toEqual(b.state.units);
  });

  it('résout les deux équipes depuis l’état courant, de façon seedée et bornée', () => {
    const resolve = () => {
      const combat = new TacticalCombat(defaultSetup('ia-resultat-auto'));
      const firstUnit = combat.currentUnitId();
      combat.endTurn();
      expect(combat.currentUnitId()).not.toBe(firstUnit);

      const beforeBoundedAttempt = JSON.stringify(combat.state);
      expect(resolveCombatAutomatically(combat, 0)).toEqual({ finished: false, turns: 0 });
      expect(JSON.stringify(combat.state)).toBe(beforeBoundedAttempt);

      const existingLogLength = combat.state.log.length;
      const result = resolveCombatAutomatically(combat);
      expect(result.finished).toBe(true);
      expect(result.turns).toBeLessThanOrEqual(AUTOMATIC_RESOLUTION_MAX_TURNS);
      expect(combat.state.phase).toBe('finished');
      expect(combat.state.log.length).toBeGreaterThan(existingLogLength);
      expect(combat.state.log[0]?.text).toContain('ia-resultat-auto');
      for (const team of ['blue', 'red'] as const) {
        expect(
          combat.state.log.some((entry) => entry.unit && combat.unit(entry.unit).team === team),
        ).toBe(true);
      }
      return {
        winner: combat.state.winner,
        round: combat.state.round,
        units: combat.state.units,
        log: combat.state.log,
      };
    };

    expect(resolve()).toEqual(resolve());
  });
});

describe('estimation de tir', () => {
  it('donne une probabilite entre 0 et 100', () => {
    const combat = new TacticalCombat(defaultSetup('estimation'));
    for (const shooter of combat.unitsOf('blue')) {
      for (const target of combat.unitsOf('red')) {
        const est = estimateShot(combat, shooter, target);
        expect(est.chance).toBeGreaterThanOrEqual(0);
        expect(est.chance).toBeLessThanOrEqual(100);
      }
    }
  });

  it('refuse un tir sans taser', () => {
    const combat = new TacticalCombat(defaultSetup('sans-taser'));
    const unarmed = combat.unitsOf('blue').find((u) => !u.items.includes('taser'));
    const target = combat.unitsOf('red')[0]!;
    const est = estimateShot(combat, unarmed!, target);
    expect(est.possible).toBe(false);
    expect(est.reason).toBe('pas de taser');
  });

  it('d10AtLeast est monotone decroissante', () => {
    let previous = 1;
    for (let need = -2; need <= 25; need++) {
      const p = d10AtLeast(need);
      expect(p).toBeLessThanOrEqual(previous + 1e-9);
      expect(p).toBeGreaterThanOrEqual(0);
      previous = p;
    }
  });
});
