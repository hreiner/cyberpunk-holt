/**
 * Bruitages minimaux, synthetises avec Web Audio (aucun fichier son, voir ADR 0010).
 *
 * Volontairement sobre : un tir de taser, un impact, une chute, un clic d'interface.
 * L'audio narratif et la musique (epic 2, lot 2.11) reposeront sur Howler.js et de vrais
 * fichiers ; ce module reste alors le bruitage d'interface et de combat.
 *
 * Le navigateur interdit de produire du son avant un geste de l'utilisateur : le contexte est
 * donc cree a la demande et repris (`resume`) au premier clic ou a la premiere touche.
 * Tout echec (pas de Web Audio, contexte refuse) est silencieux : le jeu se joue sans son.
 */

import { createRng } from '@/core/rng';

export type SfxName = 'click' | 'shot' | 'miss' | 'hit' | 'fall' | 'melee' | 'mine' | 'revive';

const MASTER_VOLUME = 0.35;
const NOISE_SECONDS = 0.6;

interface Tone {
  type: OscillatorType;
  from: number;
  to: number;
  seconds: number;
  gain: number;
  delay?: number;
}

/** Recette de chaque son : des sons de synthese, faciles a ajuster. */
const TONES: Record<SfxName, Tone[]> = {
  click: [{ type: 'square', from: 900, to: 700, seconds: 0.04, gain: 0.25 }],
  shot: [
    { type: 'sawtooth', from: 1500, to: 160, seconds: 0.2, gain: 0.5 },
    { type: 'square', from: 90, to: 60, seconds: 0.12, gain: 0.3 },
  ],
  miss: [{ type: 'triangle', from: 700, to: 260, seconds: 0.16, gain: 0.25, delay: 0.05 }],
  hit: [{ type: 'square', from: 320, to: 80, seconds: 0.14, gain: 0.45, delay: 0.1 }],
  fall: [{ type: 'sine', from: 150, to: 40, seconds: 0.35, gain: 0.7 }],
  melee: [{ type: 'sine', from: 200, to: 60, seconds: 0.12, gain: 0.6 }],
  mine: [{ type: 'sawtooth', from: 220, to: 30, seconds: 0.5, gain: 0.6 }],
  revive: [
    { type: 'triangle', from: 440, to: 440, seconds: 0.12, gain: 0.3 },
    { type: 'triangle', from: 660, to: 660, seconds: 0.18, gain: 0.3, delay: 0.12 },
  ],
};

/** Salves de bruit blanc (en secondes) ajoutees a certains sons. */
const NOISE: Partial<Record<SfxName, { seconds: number; gain: number; delay?: number }>> = {
  shot: { seconds: 0.12, gain: 0.35 },
  hit: { seconds: 0.2, gain: 0.4, delay: 0.1 },
  melee: { seconds: 0.1, gain: 0.5 },
  mine: { seconds: 0.45, gain: 0.7 },
  fall: { seconds: 0.08, gain: 0.25 },
};

export class Sfx {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted: boolean;

  constructor(
    private readonly enabled: boolean,
    muted = false,
  ) {
    this.muted = muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** A appeler depuis un geste utilisateur : leve le blocage de lecture automatique. */
  unlock(): void {
    const context = this.ensureContext();
    if (context && context.state === 'suspended') void context.resume().catch(() => undefined);
  }

  play(name: SfxName): void {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context || !this.master || context.state !== 'running') return;

    const now = context.currentTime;
    for (const tone of TONES[name]) this.playTone(context, this.master, now, tone);
    const burst = NOISE[name];
    if (burst) this.playNoise(context, this.master, now, burst);
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (this.context) return this.context;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = MASTER_VOLUME;
      this.master.connect(this.context.destination);
      return this.context;
    } catch {
      return null;
    }
  }

  private playTone(context: AudioContext, out: AudioNode, now: number, tone: Tone): void {
    const start = now + (tone.delay ?? 0);
    const end = start + tone.seconds;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, tone.to), end);
    gain.gain.setValueAtTime(tone.gain, start);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.connect(gain).connect(out);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  private playNoise(
    context: AudioContext,
    out: AudioNode,
    now: number,
    burst: { seconds: number; gain: number; delay?: number },
  ): void {
    const start = now + (burst.delay ?? 0);
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer(context);
    const gain = context.createGain();
    gain.gain.setValueAtTime(burst.gain, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + burst.seconds);
    source.connect(gain).connect(out);
    source.start(start);
    source.stop(start + burst.seconds + 0.02);
  }

  /** Bruit blanc fabrique une fois, avec le RNG seede (jamais `Math.random`). */
  private noiseBuffer(context: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const length = Math.floor(context.sampleRate * NOISE_SECONDS);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    const rng = createRng('sfx::noise');
    for (let i = 0; i < length; i++) data[i] = rng.next() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }
}
