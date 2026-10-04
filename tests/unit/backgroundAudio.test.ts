import { existsSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundAudio, BACKGROUND_TRANSITION_MS } from '@/audio/background';
import { CHAPTERS } from '@/data/chapters';
import { MAPS } from '@/data/maps';
import {
  backgroundFor,
  ACADEMY_BACKGROUND,
  MENU_BACKGROUND,
  ROOM_AMBIENCES,
  SCENE_BACKGROUNDS,
  SCENE_ROOM_AMBIENCES,
} from '@/data/backgroundAudio';
import { assetUrl } from '@/ui/assetUrl';

class FakeAudio {
  static created: FakeAudio[] = [];
  loop = false;
  preload = '';
  volume = 1;
  muted = false;
  paused = true;
  currentTime = 17;
  onerror: (() => void) | null = null;
  play = vi.fn(async () => {
    this.paused = false;
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
  removeAttribute = vi.fn();
  constructor(readonly src: string) {
    FakeAudio.created.push(this);
  }
}

let listeners: Map<string, EventListener>;
let page: {
  hidden: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};
const gesture = async (trusted = true): Promise<void> => {
  listeners.get('pointerdown')?.({ isTrusted: trusted } as Event);
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('performance', { now: () => Date.now() });
  listeners = new Map();
  page = {
    hidden: false,
    addEventListener: vi.fn((name: string, callback: EventListener) => listeners.set(name, callback)),
    removeEventListener: vi.fn((name: string) => listeners.delete(name)),
  };
  vi.stubGlobal('document', page);
  vi.stubGlobal('window', { setInterval, clearInterval });
  FakeAudio.created = [];
  vi.stubGlobal('Audio', FakeAudio);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('fond musical et ambiances', () => {
  it('couvre les scènes publiées et ne référence que des pièces existantes, avec des URL servies sous assets/audio', () => {
    expect(MENU_BACKGROUND.music).toContain('music-title.mp3');
    expect(backgroundFor('ch1.intro').music).toContain('music-academy.mp3');
    expect(existsSync('public/assets/' + MENU_BACKGROUND.music)).toBe(true);
    for (const chapter of Object.values(CHAPTERS)) {
      for (const scene of chapter.scenes) {
        expect(SCENE_BACKGROUNDS[scene.id], scene.id).toBeDefined();
        for (const file of Object.values(backgroundFor(scene.id))) {
          if (file) {
            expect(assetUrl(file)).toMatch(/^\/assets\/audio\//);
            expect(existsSync('public/assets/' + file), file).toBe(true);
          }
        }
        if (scene.mapId) {
          for (const room of MAPS[scene.mapId]!.rooms) {
            const selected = backgroundFor(scene.id, scene.mapId, room.id);
            expect(selected.music).toBe(backgroundFor(scene.id).music);
            expect(selected.ambience).toBeTruthy();
            expect(existsSync('public/assets/' + selected.ambience), selected.ambience ?? '').toBe(true);
          }
        }
      }
    }
    for (const [mapId, rooms] of Object.entries(ROOM_AMBIENCES)) {
      for (const roomId of Object.keys(rooms))
        expect(MAPS[mapId]?.rooms.some((room) => room.id === roomId)).toBe(true);
    }
    for (const [sceneId, rooms] of Object.entries(SCENE_ROOM_AMBIENCES)) {
      const scene = Object.values(CHAPTERS)
        .flatMap((chapter) => chapter.scenes)
        .find((scene) => scene.id === sceneId)!;
      for (const roomId of Object.keys(rooms))
        expect(MAPS[scene.mapId!]?.rooms.some((room) => room.id === roomId)).toBe(true);
    }
  });

  it('attend un geste réel, conserve les sources inchangées et borne chaque raccord à deux pistes', async () => {
    const bed = new BackgroundAudio(false);
    bed.setCue(ACADEMY_BACKGROUND);
    expect(FakeAudio.created.every((audio) => audio.play.mock.calls.length === 0)).toBe(true);
    await gesture(false);
    expect(bed.snapshot().unlocked).toBe(false);
    await gesture();
    vi.advanceTimersByTime(BACKGROUND_TRANSITION_MS);
    const originalMusic = FakeAudio.created[0]!;
    expect(bed.snapshot().music[0]?.volume).toBeCloseTo(0.12);
    expect(bed.snapshot().ambience[0]?.volume).toBeCloseTo(0.16);
    bed.setCue(backgroundFor('ch1.hub', 'holt', 'local-technique'));
    bed.setCue(backgroundFor('ch1.hub', 'holt', 'local-technique'));
    expect(FakeAudio.created).toHaveLength(3);
    expect(bed.snapshot().music[0]?.currentTime).toBe(17);
    expect(originalMusic.play).toHaveBeenCalledTimes(1);
    bed.setCue(backgroundFor('ch1.hub', 'holt', 'cour-interieure'));
    expect(bed.snapshot().ambience).toHaveLength(2);
    expect(FakeAudio.created[1]!.removeAttribute).toHaveBeenCalledWith('src');
    vi.advanceTimersByTime(BACKGROUND_TRANSITION_MS);
    expect(bed.snapshot().ambience).toHaveLength(1);
    expect(bed.snapshot().music).toHaveLength(1);
    bed.dispose();
  });

  it('baisse sous les voix, synchronise le muet et la visibilité, cède entièrement aux cinématiques et nettoie tout', async () => {
    const bed = new BackgroundAudio(false);
    bed.setCue(MENU_BACKGROUND);
    await gesture();
    vi.advanceTimersByTime(BACKGROUND_TRANSITION_MS);
    bed.setSpeaking(true);
    vi.advanceTimersByTime(250);
    expect(bed.snapshot().music[0]?.volume).toBeCloseTo((0.12 + 0.12 * 0.35) / 2);
    vi.advanceTimersByTime(250);
    expect(bed.snapshot().ambience[0]?.volume).toBeCloseTo(0.08);
    bed.setMuted(true);
    expect(FakeAudio.created.every((audio) => audio.muted && audio.paused)).toBe(true);
    bed.setMuted(false);
    await Promise.resolve();
    page.hidden = true;
    listeners.get('visibilitychange')?.({} as Event);
    expect(FakeAudio.created.every((audio) => audio.paused)).toBe(true);
    page.hidden = false;
    listeners.get('visibilitychange')?.({} as Event);
    await Promise.resolve();
    bed.setExclusive(true);
    expect(bed.snapshot().music).toEqual([]);
    expect(bed.snapshot().ambience).toEqual([]);
    expect(FakeAudio.created.every((audio) => audio.paused)).toBe(true);
    bed.setCue(backgroundFor('ch2.adieu'));
    expect(FakeAudio.created).toHaveLength(2);
    bed.setSpeaking(false);
    bed.setExclusive(false);
    vi.advanceTimersByTime(BACKGROUND_TRANSITION_MS);
    expect(bed.snapshot().music[0]?.source).toContain('afterglow');
    bed.dispose();
    expect(listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(FakeAudio.created.every((audio) => audio.paused && audio.onerror === null)).toBe(true);
    expect(FakeAudio.created.every((audio) => audio.removeAttribute.mock.calls.length === 1)).toBe(true);
    bed.setCue(MENU_BACKGROUND);
    expect(bed.snapshot().music).toEqual([]);
  });

  it('retente une lecture refusée au geste suivant et abandonne un fichier absent sans bloquer les autres couches', async () => {
    const bed = new BackgroundAudio(false);
    bed.setCue(MENU_BACKGROUND);
    const music = FakeAudio.created[0]!;
    music.play.mockRejectedValueOnce(new Error('Lecture refusée'));
    await gesture();
    expect(music.paused).toBe(true);
    await gesture();
    expect(music.play).toHaveBeenCalledTimes(2);
    expect(music.paused).toBe(false);
    music.onerror?.();
    expect(bed.snapshot().music).toEqual([]);
    expect(bed.snapshot().ambience).toHaveLength(1);
    bed.setSpeaking(true);
    expect(FakeAudio.created).toHaveLength(2);
    bed.dispose();
  });
});
