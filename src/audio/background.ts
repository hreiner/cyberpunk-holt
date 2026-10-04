import { assetUrl } from '@/ui/assetUrl';

export interface BackgroundCue {
  music: string | null;
  ambience: string | null;
}

export interface BackgroundAudioSnapshot {
  muted: boolean;
  unlocked: boolean;
  speaking: boolean;
  exclusive: boolean;
  hidden: boolean;
  cue: BackgroundCue;
  music: Array<{ source: string; volume: number; paused: boolean; currentTime: number }>;
  ambience: Array<{ source: string; volume: number; paused: boolean; currentTime: number }>;
}

export const BACKGROUND_MUSIC_VOLUME = 0.12;
export const BACKGROUND_AMBIENCE_VOLUME = 0.16;
export const BACKGROUND_TRANSITION_MS = 1500;
const VOICE_FADE_MS = 500;
const FADE_TICK_MS = 25;
const MUSIC_VOICE_SCALE = 0.35;
const AMBIENCE_VOICE_SCALE = 0.5;

interface Track {
  source: string;
  audio: HTMLAudioElement;
  from: number;
  target: number;
  startedAt: number;
  duration: number;
  pending: boolean;
}

/** Deux couches continues ; aucune règle de jeu ni horloge narrative ici. */
export class BackgroundAudio {
  private cue: BackgroundCue = { music: null, ambience: null };
  private readonly music: Track[] = [];
  private readonly ambience: Track[] = [];
  private readonly unavailable = new Set<string>();
  private timer: number | undefined;
  private unlocked = false;
  private speaking = false;
  private exclusive = false;
  private disposed = false;

  constructor(private muted: boolean) {
    document.addEventListener('pointerdown', this.onGesture, true);
    document.addEventListener('keydown', this.onGesture, true);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  snapshot(): BackgroundAudioSnapshot {
    const layer = (tracks: Track[]) =>
      tracks.map(({ source, audio }) => ({
        source,
        volume: audio.volume,
        paused: audio.paused,
        currentTime: audio.currentTime,
      }));
    return {
      muted: this.muted,
      unlocked: this.unlocked,
      speaking: this.speaking,
      exclusive: this.exclusive,
      hidden: document.hidden,
      cue: { ...this.cue },
      music: layer(this.music),
      ambience: layer(this.ambience),
    };
  }

  setCue(cue: BackgroundCue): void {
    if (this.disposed) return;
    const changed = cue.music !== this.cue.music || cue.ambience !== this.cue.ambience;
    this.cue = cue;
    if (changed && !this.exclusive) this.reconcile(BACKGROUND_TRANSITION_MS);
  }

  setSpeaking(speaking: boolean): void {
    if (this.disposed || speaking === this.speaking) return;
    this.speaking = speaking;
    if (!this.exclusive) this.reconcile(VOICE_FADE_MS);
  }

  setMuted(muted: boolean): void {
    if (this.disposed) return;
    this.muted = muted;
    for (const track of this.tracks()) track.audio.muted = muted;
    this.syncPlayback();
  }

  /** Coupe immédiatement avant le lancement d'une chanson cinématique. */
  setExclusive(exclusive: boolean): void {
    if (this.disposed || this.exclusive === exclusive) return;
    this.exclusive = exclusive;
    if (exclusive) {
      this.clearTimer();
      for (const layer of [this.music, this.ambience]) {
        for (const track of layer) this.release(track);
        layer.length = 0;
      }
    } else this.reconcile(BACKGROUND_TRANSITION_MS);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearTimer();
    document.removeEventListener('pointerdown', this.onGesture, true);
    document.removeEventListener('keydown', this.onGesture, true);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    for (const track of this.tracks()) this.release(track);
    this.music.length = this.ambience.length = 0;
  }

  private tracks(): Track[] {
    return [...this.music, ...this.ambience];
  }

  private reconcile(duration: number): void {
    this.updateLayer(
      this.music,
      this.cue.music,
      BACKGROUND_MUSIC_VOLUME * (this.speaking ? MUSIC_VOICE_SCALE : 1),
      duration,
    );
    this.updateLayer(
      this.ambience,
      this.cue.ambience,
      BACKGROUND_AMBIENCE_VOLUME * (this.speaking ? AMBIENCE_VOICE_SCALE : 1),
      duration,
    );
    this.syncPlayback();
    if (this.tracks().some((track) => track.audio.volume !== track.target) && this.timer === undefined) {
      this.timer = window.setInterval(this.tick, FADE_TICK_MS);
    }
  }

  private updateLayer(layer: Track[], source: string | null, volume: number, duration: number): void {
    let selected = layer.find((track) => track.source === source);
    if (!selected && source && !this.unavailable.has(source)) {
      // Une troisième destination rapide remplace la sortie la plus ancienne.
      while (layer.length >= 2) this.release(layer.shift()!);
      const audio = new Audio(assetUrl(source));
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      audio.muted = this.muted;
      selected = { source, audio, from: 0, target: 0, startedAt: 0, duration, pending: false };
      const track = selected;
      audio.onerror = () => {
        this.unavailable.add(source);
        const index = layer.indexOf(track);
        if (index >= 0) layer.splice(index, 1);
        this.release(track);
      };
      layer.push(selected);
    }
    for (const track of layer) {
      const target = track === selected ? volume : 0;
      if (track.target === target) continue;
      track.from = track.audio.volume;
      track.target = target;
      track.startedAt = performance.now();
      track.duration = duration;
    }
  }

  private readonly tick = (): void => {
    let fading = false;
    for (const layer of [this.music, this.ambience]) {
      for (const track of [...layer]) {
        const progress = Math.min(1, (performance.now() - track.startedAt) / track.duration);
        track.audio.volume = track.from + (track.target - track.from) * progress;
        if (progress < 1) fading = true;
        else if (track.target === 0) {
          layer.splice(layer.indexOf(track), 1);
          this.release(track);
        }
      }
    }
    if (!fading) this.clearTimer();
  };

  private syncPlayback(): void {
    const playing = this.unlocked && !this.muted && !document.hidden && !this.exclusive && !this.disposed;
    for (const track of this.tracks()) {
      if (!playing) track.audio.pause();
      else if (track.audio.paused && !track.pending) {
        track.pending = true;
        void track.audio
          .play()
          .then(() => {
            track.pending = false;
            if (
              this.disposed ||
              this.muted ||
              document.hidden ||
              this.exclusive ||
              !this.tracks().includes(track)
            )
              track.audio.pause();
          })
          .catch(() => {
            track.pending = false;
          });
      }
    }
  }

  private release(track: Track): void {
    track.audio.onerror = null;
    track.audio.pause();
    track.audio.removeAttribute('src');
    track.audio.load();
  }

  private clearTimer(): void {
    if (this.timer === undefined) return;
    window.clearInterval(this.timer);
    this.timer = undefined;
  }

  private readonly onGesture = (event: Event): void => {
    if (!event.isTrusted || this.disposed) return;
    this.unlocked = true;
    this.syncPlayback();
  };

  private readonly onVisibilityChange = (): void => this.syncPlayback();
}
