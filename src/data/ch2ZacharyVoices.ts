/** Prises anglaises de la mort de Zachary ; le dialogue français reste la source des sous-titres. */
import type { Ch2BallVoiceCue } from './ch2BallVoices';

export const CH2_ZACHARY_VOICE_CUES: readonly Ch2BallVoiceCue[] = [
  {
    id: 'zachary.open',
    file: 'egouts-opening',
    voice: 'narrator',
    prompt:
      '[hushed] Black water rises to their waists. Zachary does not get up. He is still breathing... but they all know.',
  },
  {
    id: 'ch2.egouts#soins',
    file: 'egouts-abigail-aid',
    voice: 'narrator',
    prompt: '[quietly] Abigail holds him against her, pressing a jacket to his side. She will not let go.',
  },
  {
    id: 'ch2.egouts#a-abigail',
    file: 'egouts-zachary-abi',
    voice: 'zachary',
    prompt: '[breathless] Abi... Stop. Just stay with me. [softly] That was a good dance.',
  },
  {
    id: 'ch2.egouts#franklyn-loyal-proche',
    file: 'egouts-zachary-loyal-close',
    voice: 'zachary',
    prompt: '[weakly] Partner... You are one of us, whatever happens. Get them out. All of them.',
  },
  {
    id: 'ch2.egouts#franklyn-loyal',
    file: 'egouts-zachary-loyal',
    voice: 'zachary',
    prompt: '[weakly] You are one of us, Franklyn... Whatever happens. Get them out.',
  },
  {
    id: 'ch2.egouts#franklyn-proche',
    file: 'egouts-zachary-close',
    voice: 'zachary',
    prompt: '[breathless] My partner... Look after her. Promise me.',
  },
  {
    id: 'ch2.egouts#franklyn-froid',
    file: 'egouts-zachary-cold',
    voice: 'zachary',
    prompt: '[strained] We never really liked each other, you and me... Get them out anyway.',
  },
  {
    id: 'ch2.egouts#franklyn-neutre',
    file: 'egouts-zachary-neutral',
    voice: 'zachary',
    prompt: '[weakly] Franklyn... Get them out of here. Okay?',
  },
  {
    id: 'ch2.egouts#mort',
    file: 'egouts-abigail-zach',
    voice: 'abigail',
    prompt: '[voice breaking] Zach?',
  },
  {
    id: 'ch2.egouts#refus',
    file: 'egouts-abigail-refuses',
    voice: 'abigail',
    prompt: '[crying] No... Leave me. Let me stay with him.',
  },
];

export const CH2_ZACHARY_VOICE_FILES: Readonly<Record<string, string>> = Object.fromEntries(
  CH2_ZACHARY_VOICE_CUES.map(({ id, file }) => [id, `audio/voices/ch2-egouts/${file}.mp3`]),
);
