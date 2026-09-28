/** Génère les prises anglaises du briefing avec la CLI ElevenLabs connectée en OAuth. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CH1_HALL_VOICE_CUES, CH1_HALL_VOICES } from '../src/data/ch1HallVoices';

const outputDir = resolve('public/assets/audio/voices/ch1-hall');
const selectedFile = process.argv.find((arg) => arg.startsWith('--file='))?.slice('--file='.length);
const force = process.argv.includes('--force');
if (selectedFile && !CH1_HALL_VOICE_CUES.some((cue) => cue.file === selectedFile)) {
  throw new Error(`Prise inconnue : ${selectedFile}`);
}
const cliScript =
  process.platform === 'win32'
    ? resolve(process.env.APPDATA ?? '', 'npm/node_modules/@elevenlabs/cli/bin/cli.js')
    : null;
mkdirSync(outputDir, { recursive: true });

for (const cue of CH1_HALL_VOICE_CUES) {
  if (selectedFile && cue.file !== selectedFile) continue;
  const output = resolve(outputDir, `${cue.file}.mp3`);
  if (!force && existsSync(output)) continue;
  const voice = CH1_HALL_VOICES[cue.voice];
  const settings = JSON.stringify({
    stability: voice.stability,
    similarity_boost: 0.8,
    style: voice.style,
    speed: voice.speed,
    use_speaker_boost: true,
  });
  process.stdout.write(`Génération : ${cue.file} (${cue.voice})\n`);
  const result = spawnSync(
    cliScript ? process.execPath : 'elevenlabs',
    [
      ...(cliScript ? [cliScript] : []),
      'text-to-speech',
      'convert',
      '--voice-id',
      voice.id,
      '--text',
      cue.prompt,
      '--model-id',
      'eleven_v3',
      '--language-code',
      'en',
      '--output-format',
      'mp3_44100_128',
      '--voice-settings',
      settings,
      '--output',
      output,
      '--quiet',
    ],
    { stdio: 'inherit' },
  );
  if (result.error || result.status !== 0) {
    throw new Error(`Génération impossible pour ${cue.file} : ${result.error?.message ?? result.status}`);
  }
}

const ready = CH1_HALL_VOICE_CUES.every((cue) => existsSync(resolve(outputDir, `${cue.file}.mp3`)));
writeFileSync(resolve(outputDir, 'manifest.json'), JSON.stringify({ ready }));
