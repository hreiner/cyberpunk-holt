import { afterEach, describe, expect, it, vi } from 'vitest';
import { Group, Vector3 } from 'three';
import { Sfx } from '@/audio/sfx';
import { DiceRoller } from '@/render/dice3d';
import { createDicePlayer } from '@/render/diceAdapter';
import type { PresentedRoll } from '@/narrative';

const parameter = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
class FakeContext {
  static instances: FakeContext[] = [];
  currentTime = 0;
  state = 'running';
  sampleRate = 8000;
  destination = {};
  gains: ReturnType<typeof parameter>[] = [];
  oscillators: Array<{ type: string; frequency: ReturnType<typeof parameter> }> = [];
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  resume = vi.fn(async () => undefined);
  constructor() {
    FakeContext.instances.push(this);
  }
  createGain() {
    const gain = parameter();
    this.gains.push(gain);
    return { gain, connect: (node: unknown) => node };
  }
  createOscillator() {
    const oscillator = {
      type: '',
      frequency: parameter(),
      connect: (node: unknown) => node,
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.oscillators.push(oscillator);
    return oscillator;
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    return { buffer: null, connect: (node: unknown) => node, start: vi.fn(), stop: vi.fn() };
  }
}

class RefusedSample {
  volume = 1;
  addEventListener = vi.fn();
  play = vi.fn(async () => {
    throw new Error('Lecture refusée');
  });
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('sons des commandes et du dé', () => {
  it('garde un clic discret en repli, coupe aussi les oscillateurs en cours au muet puis ferme le contexte', async () => {
    FakeContext.instances = [];
    vi.stubGlobal('window', { AudioContext: FakeContext });
    vi.stubGlobal('Audio', RefusedSample);
    const sfx = new Sfx(true);
    sfx.unlock();
    sfx.play('click');
    await Promise.resolve();
    await Promise.resolve();
    const context = FakeContext.instances[0]!;
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.type).toBe('sine');
    expect(context.gains[1]?.setValueAtTime).toHaveBeenCalledWith(0.1, 0);
    expect(context.gains[0]?.value).toBe(0.35);
    sfx.setMuted(true);
    sfx.setDucked(false);
    expect(context.gains[0]?.value).toBe(0);
    sfx.play('dice-roll');
    expect(context.oscillators).toHaveLength(1);
    sfx.setMuted(false);
    sfx.play('dice-roll');
    await Promise.resolve();
    await Promise.resolve();
    expect(context.oscillators.length).toBeGreaterThan(1);
    sfx.dispose();
    expect(context.close).toHaveBeenCalledTimes(1);
    sfx.unlock();
    sfx.play('click');
    expect(FakeContext.instances).toHaveLength(1);
  });

  it('émet le cue au premier lancer réel, une seule fois dans une chaîne critique, et jamais sans le dé visuel', async () => {
    vi.useFakeTimers();
    const onThrowStart = vi.fn();
    const roller = Object.create(DiceRoller.prototype) as object;
    Object.assign(roller, {
      faces: [
        { value: 10, normal: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0), right: new Vector3(1, 0, 0) },
      ],
      dieGroup: new Group(),
      canvas: { classList: { add: vi.fn(), remove: vi.fn() }, offsetWidth: 1 },
      startRenderLoop: vi.fn(),
      stopRenderLoop: vi.fn(),
      onThrowStart,
    });
    const throwDie = Reflect.get(DiceRoller.prototype, 'throwDie') as (
      value: number,
      index: number,
      reduced: boolean,
    ) => Promise<void>;
    const first = throwDie.call(roller, 10, 0, true);
    expect(onThrowStart).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    await first;
    const reroll = throwDie.call(roller, 10, 1, true);
    await vi.runAllTimersAsync();
    await reroll;
    expect(onThrowStart).toHaveBeenCalledTimes(1);
    const silent = createDicePlayer({} as HTMLElement, false, onThrowStart);
    await silent.playRoll({} as PresentedRoll, 'Jet');
    expect(onThrowStart).toHaveBeenCalledTimes(1);
  });
});
