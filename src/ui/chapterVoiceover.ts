/** Lecture des prises anglaises du chapitre, sous le texte français du dialogue. */
import { CH2_BALL_VOICE_FILES } from '@/data/ch2BallVoices';
import { CH2_ZACHARY_VOICE_FILES } from '@/data/ch2ZacharyVoices';
import { assetUrl } from './assetUrl';

const VOICE_VOLUME = 0.9;
const VOICE_FILES: Readonly<Record<string, string>> = {
  ...CH2_BALL_VOICE_FILES,
  ...CH2_ZACHARY_VOICE_FILES,
};

export class ChapterVoiceover {
  private current: HTMLAudioElement | null = null;
  private finishCurrent: (() => void) | null = null;
  private lastNode: string | null = null;
  private generation = 0;
  private disposed = false;

  constructor(
    private readonly onSpeakingChange: (speaking: boolean) => void,
    private muted: boolean,
  ) {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  observeNode(dialogueId: string, nodeId: string): void {
    const key = `${dialogueId}#${nodeId}`;
    if (key === this.lastNode) return;
    this.lastNode = key;
    if (VOICE_FILES[key]) this.play(key);
    else this.stop();
  }

  play(id: string): void {
    void this.playSequence([id]);
  }

  async playSequence(ids: readonly string[]): Promise<void> {
    this.stop();
    if (this.muted || this.disposed) return;
    const generation = this.generation;
    for (const id of ids) {
      const file = VOICE_FILES[id];
      if (!file || generation !== this.generation) break;
      await this.playFile(file);
    }
    if (generation === this.generation) this.onSpeakingChange(false);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.stop();
  }

  stop(): void {
    this.generation++;
    const audio = this.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
    }
    this.current = null;
    this.finishCurrent?.();
    this.finishCurrent = null;
    this.onSpeakingChange(false);
  }

  reset(): void {
    this.stop();
    this.lastNode = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private playFile(file: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(assetUrl(file));
      this.current = audio;
      audio.volume = VOICE_VOLUME;
      audio.muted = this.muted;
      const finish = (): void => {
        if (this.current === audio) this.current = null;
        if (this.finishCurrent === finish) this.finishCurrent = null;
        audio.onended = null;
        audio.onerror = null;
        resolve();
      };
      this.finishCurrent = finish;
      audio.onended = finish;
      audio.onerror = finish;
      this.onSpeakingChange(true);
      void audio.play().catch(finish);
    });
  }

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.current?.pause();
    else if (this.current && !this.disposed) void this.current.play().catch(() => this.stop());
  };
}
