import { describe, expect, it } from 'vitest';
import { EffectQueue, actorsOf } from '@/render/effectQueue';
import type { EffectHost } from '@/render/effectQueue';
import type { CharacterId } from '@/rules/character';
import type { CombatEvent } from '@/tactical/types';

const shot = (hit = true): CombatEvent => ({ type: 'shot', shooter: 'john', target: 'grover', hit });
const fall: CombatEvent = { type: 'neutralized', unit: 'grover' };

interface FakeHost extends EffectHost {
  moving: Set<CharacterId>;
  started: CombatEvent[];
}

function fakeHost(duration = 0.4): FakeHost {
  const moving = new Set<CharacterId>();
  const started: CombatEvent[] = [];
  return {
    moving,
    started,
    isMoving: (id) => moving.has(id),
    start(event) {
      started.push(event);
      return duration;
    },
  };
}

describe('EffectQueue', () => {
  it('est libre tant qu on ne lui donne rien', () => {
    const queue = new EffectQueue(fakeHost());
    expect(queue.isBusy).toBe(false);
  });

  it('joue les effets dans l ordre, un par un', () => {
    const host = fakeHost(0.4);
    const queue = new EffectQueue(host);
    queue.push([shot(), fall]);

    queue.update(0.05);
    expect(host.started).toEqual([shot()]);
    expect(queue.isBusy).toBe(true);

    queue.update(0.2);
    expect(host.started).toHaveLength(1);

    queue.update(0.3);
    expect(host.started).toEqual([shot(), fall]);
  });

  it('attend que le tireur ait fini de marcher avant de tirer', () => {
    const host = fakeHost();
    host.moving.add('john');
    const queue = new EffectQueue(host);
    queue.push([shot()]);

    queue.update(0.5);
    expect(host.started).toHaveLength(0);
    expect(queue.isBusy).toBe(true);

    host.moving.delete('john');
    queue.update(0.05);
    expect(host.started).toHaveLength(1);
  });

  it('attend aussi que la cible ait fini de marcher', () => {
    const host = fakeHost();
    host.moving.add('grover');
    const queue = new EffectQueue(host);
    queue.push([shot()]);
    queue.update(1);
    expect(host.started).toHaveLength(0);
  });

  it('se libere quand tout est joue', () => {
    const host = fakeHost(0.2);
    const queue = new EffectQueue(host);
    queue.push([shot()]);
    queue.update(0.01);
    queue.update(0.3);
    expect(queue.isBusy).toBe(false);
  });

  it('enchaine sans attendre les effets de duree nulle', () => {
    const host = fakeHost(0);
    const queue = new EffectQueue(host);
    queue.push([shot(), fall]);
    queue.update(0);
    expect(host.started).toHaveLength(2);
    expect(queue.isBusy).toBe(false);
  });

  it('oublie tout apres clear()', () => {
    const host = fakeHost();
    const queue = new EffectQueue(host);
    queue.push([shot(), fall]);
    queue.update(0.01);
    queue.clear();
    expect(queue.isBusy).toBe(false);
    queue.update(1);
    expect(host.started).toHaveLength(1);
  });
});

describe('actorsOf', () => {
  it('designe les personnages qui doivent etre a l arret', () => {
    expect(actorsOf(shot())).toEqual(['john', 'grover']);
    expect(actorsOf({ type: 'melee', attacker: 'zachary', target: 'grover' })).toEqual(['zachary', 'grover']);
    expect(actorsOf(fall)).toEqual(['grover']);
    expect(actorsOf({ type: 'revived', unit: 'abigail' })).toEqual(['abigail']);
    expect(actorsOf({ type: 'mine', unit: 'john', dodged: false })).toEqual(['john']);
  });
});
