/** Montage chronometre du slow. Le dialogue garde les choix et leurs effets. */
import { Sfx } from '@/audio/sfx';
import type { PresentedChoice } from '@/narrative';
import { assetUrl } from '@/ui/assetUrl';
import './slowCinematic.css';

export const SLOW_CINEMATIC_TIMES = {
  close: 8,
  whisper: 19,
  otherCouple: 27,
  distantShots: 34,
  doors: 40,
  lastLook: 47,
  attack: 58,
} as const;

interface Callbacks {
  onStart(): void;
  onEnterWhisper(): PresentedChoice[];
  onWhisper(index: number): string | null;
  onOtherCouple(): void;
  onImpact(): void;
  onSkip(): void;
  onMuteChange(muted: boolean): void;
}

const FRANKLYN_WIDE = assetUrl('backdrops/slow-franklyn-letitia.webp');
const FRANKLYN_CLOSE = assetUrl('backdrops/slow-franklyn-letitia-close.webp');
const ABIGAIL_WIDE = assetUrl('backdrops/slow-abigail-zachary.webp');
const ABIGAIL_CLOSE = assetUrl('backdrops/slow-abigail-zachary-close.webp');
const DOORS = assetUrl('backdrops/slow-doors.webp');
const ATTACK = assetUrl('backdrops/attaque.webp');
const MUSIC = assetUrl('audio/I_Really_Want_to_Stay_at_Your_House_-_Rosa_Walton_Hallie_Coggins.mp3');
const MUSIC_VOLUME = 0.58;
const MUSIC_FADE_MS = 1800;

export class SlowCinematic {
  private readonly root: HTMLElement;
  private readonly images: [HTMLImageElement, HTMLImageElement];
  private readonly caption: HTMLElement;
  private readonly choices: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly music = new Audio(MUSIC);
  private readonly sfx: Sfx;
  private readonly preloadedImages: HTMLImageElement[] = [];
  private shownImage = 0;
  private started = false;
  private awaitingWhisper = false;
  private elapsedMs = 0;
  private lastTick = 0;
  private stage = 0;
  private ticker: number | undefined;
  private impactTimer: number | undefined;
  private fadeTimer: number | undefined;
  private visualDismissed = false;
  private fading = false;
  private disposed = false;

  constructor(
    host: HTMLElement,
    private readonly dancer: boolean,
    private readonly callbacks: Callbacks,
    muted: boolean,
  ) {
    this.sfx = new Sfx(true, muted);
    this.music.preload = 'metadata';
    this.music.volume = MUSIC_VOLUME;
    this.music.loop = true;
    this.music.muted = muted;
    this.root = document.createElement('section');
    this.root.className = 'slow-cinematic';
    this.root.setAttribute('aria-label', 'Le slow');
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
        <p>La musique couvre les voix. Une dernière danse.</p>
        <button type="button" class="btn btn--primary" data-action="start">Lancer le slow</button>
      </div>
    `;
    this.images = Array.from(this.root.querySelectorAll<HTMLImageElement>('.slow-cinematic__image')) as [
      HTMLImageElement,
      HTMLImageElement,
    ];
    this.caption = this.query('.slow-cinematic__caption');
    this.choices = this.query('.slow-cinematic__choices');
    this.startButton = this.query('[data-action="start"]') as HTMLButtonElement;
    this.muteButton = this.query('[data-action="mute"]') as HTMLButtonElement;
    this.images[0].src = dancer ? FRANKLYN_WIDE : ABIGAIL_WIDE;
    for (const src of [FRANKLYN_WIDE, FRANKLYN_CLOSE, ABIGAIL_WIDE, ABIGAIL_CLOSE, DOORS, ATTACK]) {
      const image = new Image();
      image.src = src;
      this.preloadedImages.push(image);
    }
    this.startButton.addEventListener('click', this.start);
    this.muteButton.addEventListener('click', this.toggleMute);
    this.query('[data-action="skip"]').addEventListener('click', this.skip);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.updateMuteButton();
    host.appendChild(this.root);
  }

  private query(selector: string): HTMLElement {
    const element = this.root.querySelector(selector);
    if (!element) throw new Error(`Élément du slow introuvable : ${selector}`);
    return element as HTMLElement;
  }

  private readonly start = (): void => {
    if (this.started || this.disposed) return;
    this.started = true;
    this.root.classList.add('is-playing');
    this.callbacks.onStart();
    this.sfx.unlock();
    void this.music.play().catch(() => undefined);
    this.setCaption(
      this.dancer
        ? 'Letitia pose la tête contre son épaule. Pour un instant, il n’y a plus que la chanson.'
        : 'Franklyn regarde la piste. Abigail et Zachary tournent lentement sous la boule à facettes.',
    );
    this.lastTick = performance.now();
    this.ticker = window.setInterval(this.tick, 80);
  };

  private readonly tick = (): void => {
    if (this.disposed || document.hidden) return;
    const now = performance.now();
    if (!this.awaitingWhisper) this.elapsedMs += now - this.lastTick;
    this.lastTick = now;
    const seconds = this.elapsedMs / 1000;
    if (this.stage === 0 && seconds >= SLOW_CINEMATIC_TIMES.close) {
      this.stage++;
      this.showImage(this.dancer ? FRANKLYN_CLOSE : ABIGAIL_CLOSE);
      this.setCaption(this.dancer ? 'Elle ferme les yeux. Il cherche les mots.' : 'Abigail laisse Zachary finir sa phrase.');
    }
    if (this.stage === 1 && seconds >= SLOW_CINEMATIC_TIMES.whisper) {
      this.stage++;
      if (this.dancer) {
        this.awaitingWhisper = true;
        this.showWhisper(this.callbacks.onEnterWhisper());
        return;
      }
    }
    if (this.stage === 2 && seconds >= SLOW_CINEMATIC_TIMES.otherCouple) {
      this.stage++;
      if (this.dancer) this.callbacks.onOtherCouple();
      this.showImage(ABIGAIL_WIDE);
      this.setCaption('De l’autre côté de la piste, Abigail et Zachary dansent encore.');
    }
    if (this.stage === 3 && seconds >= SLOW_CINEMATIC_TIMES.distantShots) {
      this.stage++;
      this.sfx.play('distant-shot');
      this.setCaption('Un bruit sourd, loin derrière les murs. La danse continue.');
    }
    if (this.stage === 4 && seconds >= SLOW_CINEMATIC_TIMES.doors) {
      this.stage++;
      this.showImage(DOORS);
      this.setCaption('Au fond de la salle, les portes restent closes.');
    }
    if (this.stage === 5 && seconds >= SLOW_CINEMATIC_TIMES.lastLook) {
      this.stage++;
      this.showImage(ABIGAIL_CLOSE);
      this.setCaption('La chanson couvre presque tout.');
    }
    if (this.stage === 6 && seconds >= SLOW_CINEMATIC_TIMES.attack) {
      this.stage++;
      this.impact();
    }
  };

  private showWhisper(choices: PresentedChoice[]): void {
    this.setCaption('Elle a fermé les yeux. Il peut lui dire quelque chose, tout bas.');
    this.choices.replaceChildren();
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slow-cinematic__choice';
      button.textContent = choice.text;
      button.addEventListener('click', () => {
        const response = this.callbacks.onWhisper(choice.index);
        if (response === null) return;
        this.choices.hidden = true;
        this.setCaption(response);
        this.awaitingWhisper = false;
        this.lastTick = performance.now();
      });
      this.choices.appendChild(button);
    }
    this.choices.hidden = false;
    (this.choices.firstElementChild as HTMLElement | null)?.focus();
  }

  private setCaption(text: string): void {
    this.caption.textContent = text;
  }

  private showImage(src: string, cut = false): void {
    const next = 1 - this.shownImage;
    const incoming = this.images[next]!;
    const outgoing = this.images[this.shownImage]!;
    incoming.src = src;
    incoming.style.zIndex = '1';
    outgoing.style.zIndex = '0';
    incoming.classList.toggle('is-cut', cut);
    outgoing.classList.toggle('is-cut', cut);
    incoming.classList.add('is-visible');
    outgoing.classList.remove('is-visible');
    this.shownImage = next;
  }

  private impact(): void {
    window.clearInterval(this.ticker);
    this.sfx.stopSamples();
    this.showImage(ATTACK, true);
    this.root.classList.add('is-impact');
    this.callbacks.onImpact();
    this.impactTimer = window.setTimeout(() => this.dismissVisual(), 180);
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

  private readonly toggleMute = (): void => {
    const muted = !this.music.muted;
    this.music.muted = muted;
    this.sfx.setMuted(muted);
    this.callbacks.onMuteChange(muted);
    this.updateMuteButton();
    if (!muted && this.started && !document.hidden) {
      void this.music.play().catch(() => undefined);
    }
  };

  private updateMuteButton(): void {
    this.muteButton.textContent = this.music.muted ? 'Activer le son' : 'Couper le son';
    this.muteButton.setAttribute('aria-pressed', String(this.music.muted));
  }

  private readonly onVisibilityChange = (): void => {
    this.lastTick = performance.now();
    if (document.hidden) this.music.pause();
    else if (this.started && !this.disposed) {
      void this.music.play().catch(() => undefined);
    }
  };

  /** Enleve le montage ; la chanson continue sous le dialogue de la fusillade. */
  dismissVisual(): void {
    if (this.visualDismissed) return;
    this.visualDismissed = true;
    window.clearInterval(this.ticker);
    window.clearTimeout(this.impactTimer);
    this.sfx.stopSamples();
    this.preloadedImages.length = 0;
    this.root.remove();
  }

  /** La chanson finit avec la scene, par un fondu apres sa derniere replique. */
  fadeOut(): void {
    if (this.disposed || this.fading) return;
    this.dismissVisual();
    this.fading = true;
    const startedAt = performance.now();
    const initialVolume = this.music.volume;
    this.fadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / MUSIC_FADE_MS);
      this.music.volume = initialVolume * (1 - progress);
      if (progress >= 1) this.dispose();
    }, 40);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dismissVisual();
    window.clearInterval(this.fadeTimer);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.music.pause();
    this.music.removeAttribute('src');
    this.music.load();
  }
}
