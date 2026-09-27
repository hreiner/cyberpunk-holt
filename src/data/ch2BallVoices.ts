/** Prises anglaises du bal. Les sous-titres français restent dans les dialogues. */
export const CH2_BALL_VOICES = {
  franklyn: { id: 'SOYHLrjzK2X1ezoPC6cr', stability: 0.42, style: 0.23, speed: 1 },
  john: { id: 'PoqlHoqJoAfdQ0g8bLK3', stability: 0.64, style: 0.1, speed: 0.98 },
  zachary: { id: 'wSqOdjeNqDrHcoK0zorF', stability: 0.39, style: 0.31, speed: 1.02 },
  abigail: { id: 'WtA85syCrJwasGeHGH2p', stability: 0.45, style: 0.24, speed: 1 },
  letitia: { id: 'FGY2WhTYpPnrIDTdsKH5', stability: 0.41, style: 0.29, speed: 1.01 },
  narrator: { id: 'JBFqnCBsd6RMkjVDRZzb', stability: 0.67, style: 0.09, speed: 0.96 },
} as const;

type Voice = keyof typeof CH2_BALL_VOICES;

export interface Ch2BallVoiceCue {
  id: string;
  file: string;
  voice: Voice;
  prompt: string;
}

export const CH2_BALL_VOICE_CUES: readonly Ch2BallVoiceCue[] = [
  {
    id: 'ch2.bal#salle',
    file: 'bal-salle',
    voice: 'narrator',
    prompt:
      '[warmly] For one night, the training hall belongs to the cadets. The desks are tables now, and Letitia waits beside the dance floor.',
  },
  {
    id: 'ch2.bal#conduits',
    file: 'bal-letitia-conduits',
    voice: 'letitia',
    prompt:
      "[curious] The vents? Since when are you interested in plumbing, Franklyn? [mischievously] Take a lap around the room. I'll be right here.",
  },
  { id: 'ch2.bal#plus-tard', file: 'bal-letitia-later', voice: 'letitia', prompt: '[softly] Later, then.' },
  {
    id: 'ch2.bal#accepte',
    file: 'bal-letitia-accepts',
    voice: 'narrator',
    prompt: '[softly] She smiles, then follows him to the middle of the floor.',
  },
  {
    id: 'ch2.bal#refus',
    file: 'bal-letitia-refuses',
    voice: 'letitia',
    prompt: '[gently] A drink, not a dance.',
  },
  {
    id: 'ch2.bal.john#debut',
    file: 'bal-john-meeting',
    voice: 'john',
    prompt: '[quietly] Smith pulled me aside earlier. Something strange about a meeting.',
  },
  {
    id: 'ch2.bal.john#ou',
    file: 'bal-john-blue-purple',
    voice: 'john',
    prompt:
      "[matter-of-factly] A bar called the Blue Purple. She said it would matter later. I didn't press her.",
  },
  {
    id: 'ch2.bal.john#filer',
    file: 'bal-john-later',
    voice: 'john',
    prompt: "[dryly] You're right. We'll deal with it later... if there is a later.",
  },
  {
    id: 'ch2.bal.zachary#debut',
    file: 'bal-zachary-vial',
    voice: 'zachary',
    prompt: "[uneasy] She's been avoiding me since the exercise. You think it's because of the vial?",
  },
  {
    id: 'ch2.bal.zachary#conseil',
    file: 'bal-zachary-go-now',
    voice: 'zachary',
    prompt: "[surprised] Right now? ... Yeah. You're right. Thanks, Franklyn.",
  },
  {
    id: 'ch2.bal.zachary#temps',
    file: 'bal-zachary-wait',
    voice: 'zachary',
    prompt: "[sighs] You're probably right. I'll... give her a little more time tonight.",
  },
  {
    id: 'ch2.bal.zachary#loyal',
    file: 'bal-zachary-loyal',
    voice: 'zachary',
    prompt: "[earnestly] Seriously, Franklyn. You're one of us. Whatever happens after tonight.",
  },
  {
    id: 'ch2.bal.abigail#debut',
    file: 'bal-abigail-tool',
    voice: 'abigail',
    prompt: '[directly] Do you still have my multitool? The one from the armory.',
  },
  {
    id: 'ch2.bal.abigail#rendu',
    file: 'bal-abigail-returned',
    voice: 'abigail',
    prompt: "[relieved] Thanks. I'd rather have it on me, with everything people are saying tonight.",
  },
  {
    id: 'ch2.bal.abigail#garde',
    file: 'bal-abigail-kept',
    voice: 'abigail',
    prompt: "[softly] Don't worry. I'll get it back. It's safe with you for now.",
  },
  {
    id: 'ch2.bal.abigail#egratignure',
    file: 'bal-abigail-scratch',
    voice: 'narrator',
    prompt: '[quietly] She sees the scratch on his arm. She frowns, but says nothing.',
  },
  {
    id: 'slow.open.dancer',
    file: 'slow-open-dancer',
    voice: 'narrator',
    prompt: '[softly] Letitia rests her head on his shoulder. For a moment, there is only the song.',
  },
  {
    id: 'slow.open.edge',
    file: 'slow-open-edge',
    voice: 'narrator',
    prompt: '[softly] Franklyn watches from the edge. Abigail and Zachary turn beneath the mirror ball.',
  },
  {
    id: 'slow.close.dancer',
    file: 'slow-close-dancer',
    voice: 'narrator',
    prompt: '[quietly] She closes her eyes. He searches for the words.',
  },
  {
    id: 'slow.close.edge',
    file: 'slow-close-edge',
    voice: 'narrator',
    prompt: '[quietly] Abigail lets Zachary finish what he has to say.',
  },
  {
    id: 'slow.whisper.tender.franklyn',
    file: 'slow-tender-franklyn',
    voice: 'franklyn',
    prompt: "[whispers] I'm glad it's you.",
  },
  {
    id: 'slow.whisper.tender.letitia',
    file: 'slow-tender-letitia',
    voice: 'letitia',
    prompt: "[whispers] Me too. Don't say another word. You'll ruin it.",
  },
  {
    id: 'slow.whisper.clumsy.franklyn',
    file: 'slow-clumsy-franklyn',
    voice: 'franklyn',
    prompt: '[nervous] I had something ready to say. I practiced three times. [exhales] I forgot it.',
  },
  {
    id: 'slow.whisper.clumsy.letitia',
    file: 'slow-clumsy-letitia',
    voice: 'letitia',
    prompt:
      "[laughs softly] That's the best thing you've ever said to me, Franklyn. And you're stepping on my foot.",
  },
  {
    id: 'slow.whisper.silence',
    file: 'slow-whisper-silence',
    voice: 'narrator',
    prompt: '[softly] He says nothing. She waits a moment, then rests her head against his shoulder again.',
  },
  {
    id: 'slow.other',
    file: 'slow-other-couple',
    voice: 'narrator',
    prompt: '[softly] Across the floor, Abigail and Zachary are still dancing.',
  },
  {
    id: 'ch2.slow#zachary-se-releve',
    file: 'slow-zachary-stay-down',
    voice: 'zachary',
    prompt: "[breathless] I'm okay. I'm okay. Stay down.",
  },
];

export const CH2_BALL_VOICE_FILES: Readonly<Record<string, string>> = Object.fromEntries(
  CH2_BALL_VOICE_CUES.map(({ id, file }) => [id, `audio/voices/ch2-bal/${file}.mp3`]),
);
