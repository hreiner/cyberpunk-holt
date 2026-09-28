/** Adaptation anglaise des répliques françaises du briefing. */
import { CH2_BALL_VOICES } from './ch2BallVoices';

export const CH1_HALL_VOICES = {
  franklyn: CH2_BALL_VOICES.franklyn,
  abigail: CH2_BALL_VOICES.abigail,
  zachary: CH2_BALL_VOICES.zachary,
  john: CH2_BALL_VOICES.john,
  letitia: CH2_BALL_VOICES.letitia,
  grover: { id: '6IwYbsNENZgAB1dtBZDp', stability: 0.48, style: 0.22, speed: 1 },
  instructor: { id: 'GLSWsaquVBsIPLPPRi2s', stability: 0.64, style: 0.12, speed: 0.98 },
} as const;
export interface Ch1HallVoiceCue {
  node: string;
  file: string;
  voice: keyof typeof CH1_HALL_VOICES;
  prompt: string;
}

export const CH1_HALL_VOICE_CUES: readonly Ch1HallVoiceCue[] = [
  {
    node: 'arrivee',
    file: 'arrival-franklyn',
    voice: 'franklyn',
    prompt: '[lightly] Bigger than it looked on the plans. Did everybody study the right building?',
  },
  {
    node: 'abigail',
    file: 'arrival-abigail',
    voice: 'abigail',
    prompt: "[warmly] We're opponents today. Tonight, I'm still saving you all a seat in the van.",
  },
  {
    node: 'briefing',
    file: 'briefing-instructor',
    voice: 'instructor',
    prompt: '[firmly] Six cadets. Two teams of three. Your exercise is a confined-space hostage rescue.',
  },
  {
    node: 'regles',
    file: 'rules-instructor',
    voice: 'instructor',
    prompt:
      "[dryly] Room by room. Every decision goes into your grade, just like this morning's written test. And yes, I'll see what you do when you think no one's watching.",
  },
  {
    node: 'zachary',
    file: 'tease-zachary',
    voice: 'zachary',
    prompt: '[grinning] Good luck coming in second, Franklyn.',
  },
  {
    node: 'franklyn',
    file: 'tease-franklyn',
    voice: 'franklyn',
    prompt: '[grinning back] Save your breath for the yard. You might need it.',
  },
  {
    node: 'grover',
    file: 'tease-grover',
    voice: 'grover',
    prompt: '[wryly] Zachary, for once, try listening to the instructions before you charge in.',
  },
  {
    node: 'john',
    file: 'tease-john',
    voice: 'john',
    prompt: '[dryly] He knows them. He just prefers telling us afterwards.',
  },
  {
    node: 'letitia',
    file: 'tease-letitia',
    voice: 'letitia',
    prompt: "[amused] Nobody's betting on silence. At least that's a sensible call.",
  },
  {
    node: 'materiel',
    file: 'equipment-instructor',
    voice: 'instructor',
    prompt:
      '[clear and measured] Each team gets a training taser, a shared first-aid kit, and a hacking tool. Captain, you decide who carries the taser.',
  },
  {
    node: 'choix-fait',
    file: 'choice-instructor',
    voice: 'instructor',
    prompt:
      '[firmly] The kit belongs to the team. The hacking tool goes to whoever knows how to use it. Think together in there before you all run off alone.',
  },
  {
    node: 'bonne-chance',
    file: 'good-luck-franklyn',
    voice: 'franklyn',
    prompt: '[sincerely] Good luck, everyone.',
  },
  {
    node: 'abigail-retour',
    file: 'good-luck-abigail',
    voice: 'abigail',
    prompt: '[softly] See you tonight. And nobody gets on that van without the others.',
  },
  {
    node: 'depart',
    file: 'departure-instructor',
    voice: 'instructor',
    prompt: '[briskly] First room. The smoke is planned. The rest is your exam. Move out.',
  },
];

export const CH1_HALL_VOICE_FILES: Readonly<Record<string, string>> = Object.fromEntries(
  CH1_HALL_VOICE_CUES.map(({ node, file }) => [
    `ch1.centre-hall#${node}`,
    `audio/voices/ch1-hall/${file}.mp3`,
  ]),
);
