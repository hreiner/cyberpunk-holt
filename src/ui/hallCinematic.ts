/** Briefing au centre d'entraînement : montage visuel sur le dialogue d'exploration. */
import type { PresentedChoice, PresentedNode } from '@/narrative';
import { SPEAKER_LABELS } from '@/narrative/types';
import { assetUrl } from './assetUrl';
import { AudioVolumeFade } from './audioVolumeFade';
import './slowCinematic.css';
import './hallCinematic.css';

const ARRIVAL = assetUrl('backdrops/centre-arrival-cinematic.webp');
const BRIEFING = assetUrl('backdrops/centre-briefing-cinematic.webp');
const EQUIPMENT = assetUrl('backdrops/centre-equipment-cinematic.webp');
const GOOD_LUCK = assetUrl('backdrops/centre-good-luck-cinematic.webp');
const MUSIC = assetUrl('audio/13.%20Me%20Machine.mp3');
const MUSIC_VOLUME = 0.48;
const MUSIC_DUCKED_VOLUME = 0.22;
const FADE_MS = 3000;

/** Temps visuel depuis le clic ; arrêté seulement sur le choix. */
export const HALL_CINEMATIC_CUES = [
  { at: 0, node: 'arrivee', image: ARRIVAL },
  { at: 5, node: 'abigail', image: ARRIVAL },
  { at: 13, node: 'briefing', image: BRIEFING },
  { at: 21, node: 'regles', image: BRIEFING },
  { at: 33, node: 'zachary', image: BRIEFING },
  { at: 37, node: 'franklyn', image: BRIEFING },
  { at: 42, node: 'grover', image: BRIEFING },
  { at: 48, node: 'john', image: BRIEFING },
  { at: 53, node: 'letitia', image: BRIEFING },
  { at: 59, node: 'materiel', image: EQUIPMENT },
  { at: 70, node: 'choix-taser', image: EQUIPMENT },
  { at: 82, node: 'bonne-chance', image: GOOD_LUCK },
  { at: 86, node: 'abigail-retour', image: GOOD_LUCK },
  { at: 92, node: 'depart', image: BRIEFING },
] as const;

interface Callbacks {
  current(): PresentedNode | null;
  advance(): PresentedNode | null;
  choose(index: number): PresentedNode | null;
  onStart(): void;
  onComplete(): void;
  onSkip(): void;
  onMuteChange(muted: boolean): void;
}

export class HallCinematic {
  private onFadeComplete: (() => void) | undefined;
  private readonly root: HTMLElement;
  private readonly images: [HTMLImageElement, HTMLImageElement];
  private readonly caption: HTMLElement;
  private readonly choices: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly underlyingView: HTMLElement | null;
  private readonly music = new Audio(MUSIC);
  private readonly voiceMixFade = new AudioVolumeFade();
  private readonly preloadedImages: HTMLImageElement[] = [];
  private shownImage = 0;
  private started = false;
  private awaitingChoice = false;
  private elapsedMs = 0;
  private lastTick = 0;
  private nextCue = 1;
  private ticker: number | undefined;
  private fadeTimer: number | undefined;
  private visualDismissed = false;
  private fading = false;
  private disposed = false;

  constructor(
    host: HTMLElement,
    private readonly callbacks: Callbacks,
    muted: boolean,
  ) {
    this.underlyingView = host.querySelector<HTMLElement>('.narrative');
    if (this.underlyingView) this.underlyingView.inert = true;
    this.music.preload = 'metadata';
    this.music.loop = true;
    this.music.volume = MUSIC_VOLUME;
    this.music.muted = muted;
    this.root = document.createElement('section');
    this.root.className = 'slow-cinematic hall-cinematic';
    this.root.setAttribute('aria-label', "Le briefing au centre d'entraînement");
    this.root.innerHTML = `
      <img class="slow-cinematic__image is-visible" alt="" aria-hidden="true" />
      <img class="slow-cinematic__image" alt="" aria-hidden="true" />
      <div class="slow-cinematic__shade"></div>
      <div class="slow-cinematic__controls">
        <button type="button" class="slow-cinematic__small" data-action="mute"></button>
        <button type="button" class="slow-cinematic__small" data-action="skip">Passer</button>
      </div>
      <div class="slow-cinematic__story">
        <p class="slow-cinematic__caption" aria-live="polite"></p>
        <div class="slow-cinematic__choices" hidden></div>
      </div>
      <div class="slow-cinematic__start">
        <p>Le dernier exercice commence. Pour l'instant, ils sont encore tous ensemble.</p>
        <button type="button" class="btn btn--primary" data-action="start">Lancer la cinématique</button>
      </div>
    `;
    this.images = Array.from(this.root.querySelectorAll<HTMLImageElement>('.slow-cinematic__image')) as [
      HTMLImageElement,
      HTMLImageElement,
    ];
    this.caption = this.query('.slow-cinematic__caption');
    this.choices = this.query('.slow-cinematic__choices');
    this.muteButton = this.query('[data-action="mute"]') as HTMLButtonElement;
    this.images[0].src = ARRIVAL;
    for (const src of [ARRIVAL, BRIEFING, EQUIPMENT, GOOD_LUCK]) {
      const image = new Image();
      image.src = src;
      this.preloadedImages.push(image);
    }
    this.query('[data-action="start"]').addEventListener('click', this.start);
    this.query('[data-action="skip"]').addEventListener('click', this.skip);
    this.muteButton.addEventListener('click', this.toggleMute);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.updateMuteButton();
    host.appendChild(this.root);
  }

  private query(selector: string): HTMLElement {
    const element = this.root.querySelector(selector);
    if (!element) throw new Error(`Élément du briefing introuvable : ${selector}`);
    return element as HTMLElement;
  }

  private readonly start = (): void => {
    if (this.started || this.disposed) return;
    this.started = true;
    this.root.classList.add('is-playing');
    void this.music.play().catch(() => undefined);
    this.callbacks.onStart();
    this.showNode(this.callbacks.current());
    this.lastTick = performance.now();
    this.ticker = window.setInterval(this.tick, 80);
  };

  private readonly tick = (): void => {
    if (this.disposed || document.hidden) return;
    const now = performance.now();
    if (!this.awaitingChoice) this.elapsedMs += now - this.lastTick;
    this.lastTick = now;
    if (this.awaitingChoice) return;
    const cue = HALL_CINEMATIC_CUES[this.nextCue];
    if (cue && this.elapsedMs >= cue.at * 1000) {
      this.nextCue++;
      this.showImage(cue.image);
      const node = this.callbacks.advance();
      this.showNode(node);
      if (node?.choices.length) this.showChoices(node.choices);
    }
    if (!cue && this.elapsedMs >= 100_000) {
      this.dismissVisual();
      this.callbacks.onComplete();
    }
  };

  private showNode(node: PresentedNode | null): void {
    if (!node) return;
    const parts = [node.text, ...node.lines.map((line) => `${SPEAKER_LABELS[line.who]} : ${line.text}`)];
    this.caption.textContent = parts.filter(Boolean).join('\n');
  }

  private showChoices(choices: PresentedChoice[]): void {
    this.awaitingChoice = true;
    this.choices.replaceChildren();
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slow-cinematic__choice';
      button.textContent = choice.text;
      button.addEventListener('click', () => {
        const node = this.callbacks.choose(choice.index);
        if (!node) return;
        this.choices.hidden = true;
        this.showNode(node);
        this.awaitingChoice = false;
        this.lastTick = performance.now();
      });
      this.choices.appendChild(button);
    }
    this.choices.hidden = false;
    (this.choices.firstElementChild as HTMLElement | null)?.focus();
  }

  private showImage(src: string): void {
    if (this.images[this.shownImage]?.src === src) return;
    const next = 1 - this.shownImage;
    this.images[next]!.src = src;
    this.images[next]!.classList.add('is-visible');
    this.images[this.shownImage]!.classList.remove('is-visible');
    this.shownImage = next;
  }

  private readonly skip = (): void => {
    if (this.disposed) return;
    if (!this.started) {
      this.started = true;
      void this.music.play().catch(() => undefined);
    }
    this.dismissVisual();
    this.callbacks.onSkip();
  };

  setVoiceSpeaking(speaking: boolean): void {
    if (this.disposed || this.fading) return;
    this.voiceMixFade.to([{ audio: this.music, volume: speaking ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME }]);
  }

  private readonly toggleMute = (): void => {
    this.music.muted = !this.music.muted;
    this.callbacks.onMuteChange(this.music.muted);
    this.updateMuteButton();
    if (!this.music.muted && this.started && !document.hidden) void this.music.play().catch(() => undefined);
  };

  private updateMuteButton(): void {
    this.muteButton.textContent = this.music.muted ? 'Activer le son' : 'Couper le son';
    this.muteButton.setAttribute('aria-pressed', String(this.music.muted));
  }

  private readonly onVisibilityChange = (): void => {
    this.lastTick = performance.now();
    if (document.hidden) this.music.pause();
    else if (this.started && !this.disposed) void this.music.play().catch(() => undefined);
  };

  dismissVisual(): void {
    if (this.visualDismissed) return;
    this.visualDismissed = true;
    window.clearInterval(this.ticker);
    this.preloadedImages.length = 0;
    this.root.remove();
    if (this.underlyingView) this.underlyingView.inert = false;
  }

  fadeOut(onComplete?: () => void): void {
    if (this.disposed || this.fading) return;
    this.onFadeComplete = onComplete;
    this.dismissVisual();
    this.fading = true;
    this.voiceMixFade.cancel();
    const startedAt = performance.now();
    const startVolume = this.music.volume;
    this.fadeTimer = window.setInterval(() => {
      const remaining = 1 - Math.min(1, (performance.now() - startedAt) / FADE_MS);
      this.music.volume = startVolume * remaining;
      if (remaining <= 0) this.dispose();
    }, 40);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dismissVisual();
    this.voiceMixFade.cancel();
    window.clearInterval(this.fadeTimer);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.music.pause();
    this.music.removeAttribute('src');
    this.music.load();
    this.onFadeComplete?.();
    this.onFadeComplete = undefined;
  }
  setSoundMuted(muted: boolean): void {
    this.music.muted = muted;
    this.updateMuteButton();
    if (!muted && this.started && !document.hidden && !this.disposed) {
      void this.music.play().catch(() => undefined);
    }
  }
}
