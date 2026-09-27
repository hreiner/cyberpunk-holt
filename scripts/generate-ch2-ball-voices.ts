/** Regénère les prises VO du bal avec la CLI ElevenLabs déjà authentifiée. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CH2_BALL_VOICE_CUES, CH2_BALL_VOICES } from '../src/data/ch2BallVoices';

const outputDir = resolve('public/assets/audio/voices/ch2-bal');
const force = process.argv.includes('--force');
const selectedFile = process.argv.find((arg) => arg.startsWith('--file='))?.slice('--file='.length);
if (selectedFile && !CH2_BALL_VOICE_CUES.some((cue) => cue.file === selectedFile)) {
  throw new Error(`Prise inconnue : ${selectedFile}`);
}
// Sous Windows, le shim npm est un .cmd ; appeler son fichier JS évite le shell et ses échappements.
const cliScript =
  process.platform === 'win32'
    ? resolve(process.env.APPDATA ?? '', 'npm/node_modules/@elevenlabs/cli/bin/cli.js')
    : null;
mkdirSync(outputDir, { recursive: true });

for (const cue of CH2_BALL_VOICE_CUES) {
  if (selectedFile && cue.file !== selectedFile) continue;
  const output = resolve(outputDir, `${cue.file}.mp3`);
  if (!force && existsSync(output)) {
    process.stdout.write(`Déjà présent : ${cue.file}\n`);
    continue;
  }
  const voice = CH2_BALL_VOICES[cue.voice];
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
