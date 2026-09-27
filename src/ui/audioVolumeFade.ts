/** Fondu court des pistes d'ambiance lorsqu'une voix prend ou rend la place. */
export const VOICE_MIX_FADE_MS = 500;
const FADE_TICK_MS = 25;

interface VolumeTarget {
  audio: HTMLAudioElement;
  volume: number;
}

export class AudioVolumeFade {
  private timer: number | undefined;

  to(targets: readonly VolumeTarget[]): void {
    this.cancel();
    const starts = targets.map(({ audio, volume }) => ({ audio, from: audio.volume, to: volume }));
    if (starts.every(({ from, to }) => from === to)) return;
    const startedAt = performance.now();
    this.timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / VOICE_MIX_FADE_MS);
      for (const { audio, from, to } of starts) audio.volume = from + (to - from) * progress;
      if (progress >= 1) this.cancel();
    }, FADE_TICK_MS);
  }

  cancel(): void {
    if (this.timer === undefined) return;
    window.clearInterval(this.timer);
    this.timer = undefined;
  }
}
