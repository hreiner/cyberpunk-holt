import { describe, expect, it } from 'vitest';
import { playToEnd } from '@/tactical/ai';
import { DEFAULT_BLUE, DEFAULT_RED, TacticalCombat, assignLoadout, defaultSetup } from '@/tactical/combat';
import type { CharacterId } from '@/rules/character';

function freshCombat(seed = 'test-combat'): TacticalCombat {
  return new TacticalCombat(defaultSetup(seed));
}

describe('mise en place', () => {
  it('place six cadets, trois par equipe', () => {
    const combat = freshCombat();
    expect(Object.keys(combat.state.units)).toHaveLength(6);
    expect(combat.unitsOf('blue')).toHaveLength(3);
    expect(combat.unitsOf('red')).toHaveLength(3);
  });

  it('donne le taser au meilleur tireur de chaque equipe', () => {
    const blue = assignLoadout(DEFAULT_BLUE, false);
    const red = assignLoadout(DEFAULT_RED, false);
    expect(blue['john']).toContain('taser');
    expect(red['grover']).toContain('taser');
  });

  it('ne donne jamais l outil de piratage a un organique', () => {
    const loadout = assignLoadout(['john', 'franklyn', 'abigail'] as CharacterId[], false);
    expect(loadout['john']).not.toContain('hackingTool');
    expect(loadout['franklyn']).toContain('hackingTool');
  });

  it('ajoute un second taser quand l armoire a ete forcee', () => {
    const withExtra = assignLoadout(DEFAULT_BLUE, true);
    const tasers = Object.values(withExtra).flat().filter((i) => i === 'taser');
    expect(tasers).toHaveLength(2);
  });

  it('classe les unites par initiative decroissante', () => {
    const combat = freshCombat();
    const inits = combat.state.order.map((id) => combat.unit(id).initiative);
    const sorted = [...inits].sort((a, b) => b - a);
    expect(inits).toEqual(sorted);
  });

  it('donne des points de mouvement a la premiere unite', () => {
    const combat = freshCombat();
    expect(combat.currentUnit().mp).toBeGreaterThan(0);
  });
});

describe('determinisme', () => {
  it('rejoue exactement la meme partie avec la meme graine', () => {
    const a = freshCombat('rejeu');
    const b = freshCombat('rejeu');
    playToEnd(a);
    playToEnd(b);
    expect(a.state.winner).toBe(b.state.winner);
    expect(a.state.round).toBe(b.state.round);
    expect(a.state.log.map((l) => l.text)).toEqual(b.state.log.map((l) => l.text));
  });

  it('produit des parties differentes avec des graines differentes', () => {
    const a = freshCombat('graine-a');
    const b = freshCombat('graine-b');
    playToEnd(a);
    playToEnd(b);
    expect(a.state.log.map((l) => l.text)).not.toEqual(b.state.log.map((l) => l.text));
  });
});

describe('actions', () => {
  it('refuse une action illegale sans lever d exception', () => {
    const combat = freshCombat();
    const outcome = combat.perform({ type: 'move', to: { x: 0, y: 0 } });
    expect(outcome.ok).toBe(false);
    expect(typeof outcome.reason).toBe('string');
  });

  it('refuse de tirer sur un coequipier', () => {
    const combat = freshCombat();
    const actor = combat.currentUnit();
    const ally = combat.unitsOf(actor.team).find((u) => u.id !== actor.id);
    const outcome = combat.perform({ type: 'shoot', target: ally!.id });
    expect(outcome.ok).toBe(false);
  });

  it('consomme des points de mouvement en se deplacant', () => {
    const combat = freshCombat();
    const actor = combat.currentUnit();
    const before = actor.mp;
    const target = { x: actor.pos.x, y: actor.pos.y - 1 };
    const outcome = combat.perform({ type: 'move', to: target });
    expect(outcome.ok).toBe(true);
    expect(combat.currentUnit().mp).toBe(before - 1);
  });

  it('marque l unite a decouvert quand elle court', () => {
    const combat = freshCombat();
    const actor = combat.currentUnit();
    const target = { x: actor.pos.x, y: actor.pos.y - 2 };
    const outcome = combat.perform({ type: 'run', to: target });
    expect(outcome.ok).toBe(true);
    expect(combat.unit(actor.id).exposed).toBe(true);
    expect(combat.unit(actor.id).actionUsed).toBe(true);
  });

  it('passe au combattant suivant en fin de tour', () => {
    const combat = freshCombat();
    const first = combat.currentUnitId();
    combat.endTurn();
    expect(combat.currentUnitId()).not.toBe(first);
  });

  it('ne laisse jamais une unite neutralisee jouer', () => {
    const combat = freshCombat('neutral');
    const victim = combat.unitsOf('red')[0]!;
    victim.status = 'neutralized';
    for (let i = 0; i < 12; i++) {
      combat.endTurn();
      if (combat.state.phase !== 'playing') break;
      expect(combat.currentUnit().status).toBe('active');
    }
  });
});

describe('fin de partie', () => {
  it('se termine toujours, et avant la limite de rounds', () => {
    for (let i = 0; i < 25; i++) {
      const combat = freshCombat(`fin-${i}`);
      playToEnd(combat);
      expect(combat.state.phase).toBe('finished');
      expect(combat.state.round).toBeLessThanOrEqual(combat.state.roundLimit + 1);
      expect(['blue', 'red', 'draw']).toContain(combat.state.winner);
    }
  });

  it('declare vainqueur l equipe qui a encore des unites actives', () => {
    const combat = freshCombat('victoire');
    playToEnd(combat);
    if (combat.state.winner === 'blue') {
      expect(combat.activeUnitsOf('blue').length).toBeGreaterThan(0);
    } else if (combat.state.winner === 'red') {
      expect(combat.activeUnitsOf('red').length).toBeGreaterThan(0);
    }
  });

  it('fait tomber le taser d une unite neutralisee', () => {
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      const combat = freshCombat(`drop-${i}`);
      playToEnd(combat);
      found = combat.state.ground.some((g) => g.item === 'taser');
    }
    expect(found).toBe(true);
  });
});
