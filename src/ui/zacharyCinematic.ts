/** Montage de la mort de Zachary. Les choix et effets restent dans DialogueRunner. */
import type { PresentedChoice, PresentedNode } from '@/narrative';
import { assetUrl } from '@/ui/assetUrl';
import './slowCinematic.css';
import './zacharyCinematic.css';

export const ZACHARY_CINEMATIC_TIMES = {
  firstAid: 12,
  lastWords: 25,
  franklyn: 42,
  death: 56,
  abigail: 68,
  returnToDialogue: 78,
} as const;

interface Callbacks {
  current(): PresentedNode | null;
  advance(): PresentedNode | null;
  choose(index: number): PresentedNode | null;
  onMuteChange(muted: boolean): void;
  onStartVoice(): void;
  onSkip(): void;
}

const OPENING = assetUrl('backdrops/egouts-zachary.webp');
const FIRST_AID = assetUrl('backdrops/egouts-first-aid.webp');
const LAST_WORDS = assetUrl('backdrops/egouts-last-words.webp');
const DEATH = assetUrl('backdrops/egouts-abigail-grief.webp');
const PULL_AWAY = assetUrl('backdrops/egouts-arrachee.webp');
const MUSIC = assetUrl('audio/47.%20Let%20You%20Down.mp3');
const SEWER = assetUrl('audio/sewer-drips.wav');
const SOBBING = assetUrl('audio/abigail-sobbing.wav');
const MUSIC_VOLUME = 0.56;
const MUSIC_DUCKED_VOLUME = 0.22;
const SEWER_VOLUME = 0.28;
const SEWER_DUCKED_VOLUME = 0.13;
const SOBBING_VOLUME = 0.08;
const SOBBING_DUCKED_VOLUME = 0.03;
const FADE_MS = 3000;

export class ZacharyCinematic {
  private readonly root: HTMLElement;
  private readonly images: [HTMLImageElement, HTMLImageElement];
  private readonly caption: HTMLElement;
  private readonly choices: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly music = new Audio(MUSIC);
  private readonly sewer = new Audio(SEWER);
  private readonly sobbing = new Audio(SOBBING);
  private readonly preloadedImages: HTMLImageElement[] = [];
  private shownImage = 0;
  private started = false;
  private awaitingChoice = false;
  private elapsedMs = 0;
  private lastTick = 0;
  private stage = 0;
  private ticker: number | undefined;
  private fadeTimer: number | undefined;
  private visualDismissed = false;
  private fading = false;
  private disposed = false;

  constructor(host: HTMLElement, private readonly callbacks: Callbacks, muted: boolean) {
    this.music.preload = 'metadata';
    this.music.loop = true;
    this.music.volume = MUSIC_VOLUME;
    this.sewer.preload = 'auto';
    this.sewer.loop = true;
    this.sewer.volume = SEWER_VOLUME;
    this.sobbing.preload = 'auto';
    this.sobbing.volume = SOBBING_VOLUME;
    for (const audio of [this.music, this.sewer, this.sobbing]) audio.muted = muted;

    this.root = document.createElement('section');
    this.root.className = 'slow-cinematic zachary-cinematic';
    this.root.setAttribute('aria-label', 'Zachary dans les égouts');
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
        <p>Dans les égouts, Zachary respire encore.</p>
        <button type="button" class="btn btn--primary" data-action="start">Lancer la cinématique</button>
      </div>
    `;
    this.images = Array.from(this.root.querySelectorAll<HTMLImageElement>('.slow-cinematic__image')) as [
      HTMLImageElement, HTMLImageElement,
    ];
    this.caption = this.query('.slow-cinematic__caption');
    this.choices = this.query('.slow-cinematic__choices');
    this.muteButton = this.query('[data-action="mute"]') as HTMLButtonElement;
    this.images[0].src = OPENING;
    for (const src of [OPENING, FIRST_AID, LAST_WORDS, DEATH, PULL_AWAY]) {
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
    if (!element) throw new Error(`Élément de la cinématique introuvable : ${selector}`);
    return element as HTMLElement;
  }

  private readonly start = (): void => {
    if (this.started || this.disposed) return;
    this.started = true;
    this.root.classList.add('is-playing');
    this.showNode(this.callbacks.current());
    void this.music.play().catch(() => undefined);
    void this.sewer.play().catch(() => undefined);
    this.callbacks.onStartVoice();
    this.lastTick = performance.now();
    this.ticker = window.setInterval(this.tick, 80);
  };

  private readonly tick = (): void => {
    if (this.disposed || document.hidden) return;
    const now = performance.now();
    if (!this.awaitingChoice) this.elapsedMs += now - this.lastTick;
    this.lastTick = now;
    const seconds = this.elapsedMs / 1000;
    if (this.stage === 0 && seconds >= ZACHARY_CINEMATIC_TIMES.firstAid) {
      this.stage++;
      this.showChoice(this.callbacks.advance());
      return;
    }
    if (this.stage === 1 && seconds >= ZACHARY_CINEMATIC_TIMES.lastWords) {
      this.stage++;
      this.showImage(LAST_WORDS);
      this.showNode(this.callbacks.advance());
    }
    if (this.stage === 2 && seconds >= ZACHARY_CINEMATIC_TIMES.franklyn) {
      this.stage++;
      const route = this.callbacks.advance();
      const choice = route?.choices[0];
      this.showNode(choice ? this.callbacks.choose(choice.index) : route);
    }
    if (this.stage === 3 && seconds >= ZACHARY_CINEMATIC_TIMES.death) {
      this.stage++;
      this.showImage(DEATH);
      this.showNode(this.callbacks.advance());
      if (!this.sobbing.muted) void this.sobbing.play().catch(() => undefined);
    }
    if (this.stage === 4 && seconds >= ZACHARY_CINEMATIC_TIMES.abigail) {
      this.stage++;
      this.showImage(PULL_AWAY);
      this.showChoice(this.callbacks.advance());
      return;
    }
    if (this.stage === 5 && seconds >= ZACHARY_CINEMATIC_TIMES.returnToDialogue) {
      this.stage++;
      this.callbacks.advance();
      this.dismissVisual();
    }
  };

  private showChoice(node: PresentedNode | null): void {
    this.showNode(node);
    if (!node?.choices.length) return;
    this.awaitingChoice = true;
    this.choices.replaceChildren();
    for (const choice of node.choices) this.addChoice(choice);
    this.choices.hidden = false;
    (this.choices.firstElementChild as HTMLElement | null)?.focus();
  }

  private addChoice(choice: PresentedChoice): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slow-cinematic__choice';
    button.textContent = choice.text;
    button.addEventListener('click', () => {
      const node = this.callbacks.choose(choice.index);
      if (!node) return;
      if (this.stage === 1 && node.nodeId === 'geste-comprimer') this.showImage(FIRST_AID);
      this.choices.hidden = true;
      this.showNode(node);
      this.awaitingChoice = false;
      this.lastTick = performance.now();
    });
    this.choices.appendChild(button);
  }

  private showNode(node: PresentedNode | null): void {
    if (!node) return;
    const parts = [node.text, ...node.lines.map(line => `${line.who === 'zachary' ? 'Zachary' : 'Abigail'} : ${line.text}`)];
    this.caption.textContent = parts.filter(Boolean).join('\n');
  }

  private showImage(src: string): void {
    const next = 1 - this.shownImage;
    this.images[next]!.src = src;
    this.images[next]!.style.zIndex = '1';
    this.images[this.shownImage]!.style.zIndex = '0';
    this.images[next]!.classList.add('is-visible');
    this.images[this.shownImage]!.classList.remove('is-visible');
    this.shownImage = next;
  }

  private readonly skip = (): void => {
    if (this.disposed) return;
    if (!this.started) {
      this.started = true;
      void this.music.play().catch(() => undefined);
      void this.sewer.play().catch(() => undefined);
    }
    this.dismissVisual();
    this.callbacks.onSkip();
  };

  /** Garde l'eau et la chanson présentes sans couvrir les derniers mots. */
  setVoiceSpeaking(speaking: boolean): void {
    if (this.disposed || this.fading) return;
    this.music.volume = speaking ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME;
    this.sewer.volume = speaking ? SEWER_DUCKED_VOLUME : SEWER_VOLUME;
    this.sobbing.volume = speaking ? SOBBING_DUCKED_VOLUME : SOBBING_VOLUME;
  }

  private readonly toggleMute = (): void => {
    const muted = !this.music.muted;
    for (const audio of [this.music, this.sewer, this.sobbing]) audio.muted = muted;
    this.callbacks.onMuteChange(muted);
    this.updateMuteButton();
    if (!muted && this.started && !document.hidden) {
      void this.music.play().catch(() => undefined);
      void this.sewer.play().catch(() => undefined);
    }
  };

  private updateMuteButton(): void {
    this.muteButton.textContent = this.music.muted ? 'Activer le son' : 'Couper le son';
    this.muteButton.setAttribute('aria-pressed', String(this.music.muted));
  }

  private readonly onVisibilityChange = (): void => {
    this.lastTick = performance.now();
    if (document.hidden) {
      for (const audio of [this.music, this.sewer, this.sobbing]) audio.pause();
    } else if (this.started && !this.disposed) {
      void this.music.play().catch(() => undefined);
      void this.sewer.play().catch(() => undefined);
      if (this.stage >= 4 && this.sobbing.currentTime > 0 && !this.sobbing.ended) {
        void this.sobbing.play().catch(() => undefined);
      }
    }
  };

  /** Le plan disparaît ; musique et ambiance continuent sous le reste du dialogue. */
  dismissVisual(): void {
    if (this.visualDismissed) return;
    this.visualDismissed = true;
    window.clearInterval(this.ticker);
    this.preloadedImages.length = 0;
    this.root.remove();
  }

  /** Fondu seulement quand le routeur quitte effectivement les égouts. */
  fadeOut(): void {
    if (this.disposed || this.fading) return;
    this.dismissVisual();
    this.fading = true;
    const startedAt = performance.now();
    const musicVolume = this.music.volume;
    const sewerVolume = this.sewer.volume;
    this.fadeTimer = window.setInterval(() => {
      const remaining = 1 - Math.min(1, (performance.now() - startedAt) / FADE_MS);
      this.music.volume = musicVolume * remaining;
      this.sewer.volume = sewerVolume * remaining;
      this.sobbing.volume = SOBBING_VOLUME * remaining;
      if (remaining <= 0) this.dispose();
    }, 40);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dismissVisual();
    window.clearInterval(this.fadeTimer);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    for (const audio of [this.music, this.sewer, this.sobbing]) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }
}
