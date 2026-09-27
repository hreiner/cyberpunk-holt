import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioVolumeFade } from '@/ui/audioVolumeFade';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fondu du mix sous les voix', () => {
  it('descend et remonte en une demi-seconde depuis le volume courant, puis s’annule proprement', () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { setInterval, clearInterval });
    const audio = { volume: 0.58 } as HTMLAudioElement;
    const fade = new AudioVolumeFade();

    fade.to([{ audio, volume: 0.28 }]);
    expect(audio.volume).toBe(0.58);
    vi.advanceTimersByTime(250);
    expect(audio.volume).toBeCloseTo(0.43);

    fade.to([{ audio, volume: 0.58 }]);
    vi.advanceTimersByTime(250);
    expect(audio.volume).toBeCloseTo(0.505);
    vi.advanceTimersByTime(250);
    expect(audio.volume).toBeCloseTo(0.58);

    fade.to([{ audio, volume: 0.28 }]);
    vi.advanceTimersByTime(100);
    const interruptedVolume = audio.volume;
    fade.cancel();
    vi.advanceTimersByTime(500);
    expect(audio.volume).toBe(interruptedVolume);
  });
});
