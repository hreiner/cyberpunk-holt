import type { BackgroundCue } from '@/audio/background';

const ROOT = 'audio/background/';
const cue = (music: string, ambience: string | null): BackgroundCue => ({
  music: `${ROOT}music-${music}.mp3`,
  ambience: ambience ? `${ROOT}ambience-${ambience}.mp3` : null,
});
export const ACADEMY_BACKGROUND = cue('academy', 'academy');
export const MENU_BACKGROUND = cue('title', 'academy');
export const REPORT_BACKGROUND = cue('afterglow', null);

/** Toute scène publiée choisit explicitement ses deux couches. */
export const SCENE_BACKGROUNDS: Readonly<Record<string, BackgroundCue>> = {
  'ch1.intro': ACADEMY_BACKGROUND,
  'ch1.vers-cantine': ACADEMY_BACKGROUND,
  'ch1.discours': ACADEMY_BACKGROUND,
  'ch1.vers-examen': ACADEMY_BACKGROUND,
  'ch1.exam': ACADEMY_BACKGROUND,
  'ch1.tirage': ACADEMY_BACKGROUND,
  'ch1.hub': ACADEMY_BACKGROUND,
  'ch1.fourgon': cue('academy', 'badlands'),
  'ch1.centre-hall': cue('pressure', 'industrial'),
  'ch1.salle1': cue('pressure', 'industrial'),
  'ch1.salle2': cue('pressure', 'industrial'),
  'ch1.salle3': cue('pressure', 'industrial'),
  'ch1.cour': cue('pressure', 'badlands'),
  'ch1.affrontement': cue('pressure', 'badlands'),
  'ch1.bal': cue('neon', 'academy'),
  'ch2.photo': cue('neon', 'academy'),
  'ch2.bal': cue('neon', 'academy'),
  'ch2.slow': cue('neon', 'academy'),
  'ch2.fuite': cue('pressure', 'industrial'),
  'ch2.grille': cue('pressure', 'industrial'),
  'ch2.conduits': cue('pressure', 'vents'),
  'ch2.enfant': cue('pressure', 'vents'),
  'ch2.cantine': cue('pressure', 'fire'),
  'ch2.egouts': { music: `${ROOT}music-afterglow.mp3`, ambience: 'audio/sewer-drips.wav' },
  'ch2.adieu': cue('afterglow', 'badlands'),
  'ch2.campement': cue('afterglow', 'badlands'),
  'ch2.murano': cue('afterglow', 'badlands'),
  'ch2.decharges': cue('neon', 'night-city'),
  'ch2.charcudoc': cue('neon', 'night-city'),
  'ch2.bluepurple': cue('neon', 'night-city'),
};

/** Seule l'ambiance change avec la pièce : la composition demeure continue. */
export const ROOM_AMBIENCES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  holt: {
    interface: 'industrial',
    archives: 'industrial',
    'local-technique': 'industrial',
    armurerie: 'industrial',
    garage: 'industrial',
    'cour-interieure': 'badlands',
  },
  'centre-examen': { parking: 'badlands', cour: 'badlands' },
  'holt-nuit': { 'cour-interieure': 'badlands', 'local-technique': 'industrial' },
  conduits: { labo: 'industrial', cantine: 'fire' },
};

export const SCENE_ROOM_AMBIENCES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'ch2.fuite': { cantine: 'fire' },
};

export function backgroundFor(sceneId: string, mapId?: string, roomId?: string): BackgroundCue {
  const base = SCENE_BACKGROUNDS[sceneId] ?? REPORT_BACKGROUND;
  const sceneAmbience = roomId ? SCENE_ROOM_AMBIENCES[sceneId]?.[roomId] : undefined;
  const ambience = sceneAmbience ?? (mapId && roomId ? ROOM_AMBIENCES[mapId]?.[roomId] : undefined);
  return ambience ? { ...base, ambience: `${ROOT}ambience-${ambience}.mp3` } : base;
}
