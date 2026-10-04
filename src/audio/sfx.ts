/**
 * Bruitages de base synthetises avec Web Audio (ADR 0010).
 *
 * Volontairement sobre : un tir de taser, un impact, une chute, un clic d'interface.
 * Le chapitre 2 reemploie deux courts echantillons CC0 pour les tirs narratifs ;
 * les recettes synthetisees restent le repli si un fichier ne peut pas etre lu.
 *
 * Le navigateur interdit de produire du son avant un geste de l'utilisateur : le contexte est
 * donc cree a la demande et repris (`resume`) au premier clic ou a la premiere touche.
 * Tout echec (pas de Web Audio, contexte refuse) est silencieux : le jeu se joue sans son.
 */

import { createRng } from '@/core/rng';

export type SfxName =
  | 'click'
  | 'dice-roll'
  | 'shot'
  | 'miss'
  | 'hit'
  | 'fall'
  | 'melee'
  | 'mine'
  | 'revive'
  | 'burst'
  | 'distant-shot'
  | 'cut';

/**
 * Alias du meme type, nomme comme le contrat de `DialogueNode.sound.sfx`
 * (ADR 0023, docs/design/07-DIALOGUE-FORMAT.md). `src/narrative/types.ts`
 * n'importe que ce type (jamais la classe `Sfx` ni `TONES`) : un import de
 * type est efface a la compilation, il ne rend donc pas le moteur narratif
 * dependant du DOM/Web Audio (regle d'AGENTS.md n°2, testabilite Node).
 */
export type SfxId = SfxName;

const MASTER_VOLUME = 0.35;
const NOISE_SECONDS = 0.6;
const VOICE_DUCKING_SCALE = 0.15;
const SAMPLE_FILES: Partial<Record<SfxName, { file: string; volume: number }>> = {
  'distant-shot': { file: 'gunfire-distant.wav', volume: 0.42 },
  burst: { file: 'gunfire-close.wav', volume: 0.78 },
};

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
  click: [{ type: 'sine', from: 800, to: 650, seconds: 0.04, gain: 0.1 }],
  'dice-roll': [
    { type: 'triangle', from: 520, to: 160, seconds: 0.045, gain: 0.13 },
    { type: 'triangle', from: 430, to: 120, seconds: 0.045, gain: 0.11, delay: 0.09 },
    { type: 'triangle', from: 360, to: 100, seconds: 0.05, gain: 0.09, delay: 0.21 },
    { type: 'triangle', from: 280, to: 80, seconds: 0.06, gain: 0.065, delay: 0.36 },
    { type: 'triangle', from: 220, to: 70, seconds: 0.065, gain: 0.04, delay: 0.53 },
  ],
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
  // -- Bruitages narratifs (ADR 0023, chapitre 2) : joues par DialogueNode.sound.sfx. --
  // Rafale : trois departs rapproches, meme famille spectrale que "shot".
  burst: [
    { type: 'sawtooth', from: 1400, to: 200, seconds: 0.05, gain: 0.5 },
    { type: 'sawtooth', from: 1400, to: 200, seconds: 0.05, gain: 0.45, delay: 0.08 },
    { type: 'sawtooth', from: 1400, to: 200, seconds: 0.05, gain: 0.4, delay: 0.16 },
  ],
  // Tir lointain : un seul depart, grave et etouffe (gain faible, pas d'aigu).
  'distant-shot': [{ type: 'sine', from: 300, to: 80, seconds: 0.3, gain: 0.22 }],
  // Coupure : la musique s'arrete net (voir l'exemple de l'ADR 0023, noeud "rafale").
  cut: [{ type: 'square', from: 400, to: 40, seconds: 0.08, gain: 0.4 }],
};

/** Salves de bruit blanc (en secondes) ajoutees a certains sons. */
const NOISE: Partial<Record<SfxName, { seconds: number; gain: number; delay?: number }>> = {
  'dice-roll': { seconds: 0.58, gain: 0.015 },
  shot: { seconds: 0.12, gain: 0.35 },
  hit: { seconds: 0.2, gain: 0.4, delay: 0.1 },
  melee: { seconds: 0.1, gain: 0.5 },
  mine: { seconds: 0.45, gain: 0.7 },
  fall: { seconds: 0.08, gain: 0.25 },
  burst: { seconds: 0.3, gain: 0.4 },
  'distant-shot': { seconds: 0.15, gain: 0.15, delay: 0.05 },
  cut: { seconds: 0.06, gain: 0.3 },
};

export class Sfx {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted: boolean;
  private ducked = false;
  private disposed = false;
  private readonly activeSamples = new Map<HTMLAudioElement, number>();

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
    if (muted) this.stopSamples();
    if (this.master)
      this.master.gain.value = muted ? 0 : MASTER_VOLUME * (this.ducked ? VOICE_DUCKING_SCALE : 1);
  }

  /** Laisse les tirs en fond, sans masquer une réplique déjà en cours. */
  setDucked(ducked: boolean): void {
    this.ducked = ducked;
    const scale = ducked ? VOICE_DUCKING_SCALE : 1;
    for (const [sample, volume] of this.activeSamples) sample.volume = volume * scale;
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_VOLUME * scale;
  }

  stopSamples(): void {
    for (const sample of this.activeSamples.keys()) {
      sample.pause();
      sample.removeAttribute('src');
      sample.load();
    }
    this.activeSamples.clear();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopSamples();
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = null;
    this.master = null;
    this.noise = null;
  }

  /** A appeler depuis un geste utilisateur : leve le blocage de lecture automatique. */
  unlock(): void {
    const context = this.ensureContext();
    if (context && context.state === 'suspended') void context.resume().catch(() => undefined);
  }

  play(name: SfxName): void {
    if (this.muted || this.disposed) return;
    const sample = SAMPLE_FILES[name];
    if (sample && this.enabled) {
      const media = new Audio(`${import.meta.env.BASE_URL}assets/audio/${sample.file}`);
      media.volume = sample.volume * (this.ducked ? VOICE_DUCKING_SCALE : 1);
      this.activeSamples.set(media, sample.volume);
      media.addEventListener('ended', () => this.activeSamples.delete(media), { once: true });
      void media.play().catch(() => {
        if (!this.activeSamples.has(media)) return;
        this.activeSamples.delete(media);
        this.playSynth(name);
      });
      return;
    }
    this.playSynth(name);
  }

  private playSynth(name: SfxName): void {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context || !this.master || context.state !== 'running') return;

    const now = context.currentTime;
    for (const tone of TONES[name]) this.playTone(context, this.master, now, tone);
    const burst = NOISE[name];
    if (burst) this.playNoise(context, this.master, now, burst);
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || this.disposed) return null;
    if (this.context) return this.context;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME * (this.ducked ? VOICE_DUCKING_SCALE : 1);
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
