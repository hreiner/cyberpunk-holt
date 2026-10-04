/** Regénère les prises VO des égouts avec la CLI ElevenLabs déjà authentifiée. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { CH2_BALL_VOICES } from '../src/data/ch2BallVoices';
import { CH2_ZACHARY_VOICE_CUES } from '../src/data/ch2ZacharyVoices';
import { generationOptions } from './audio-generation-options';

const outputDir = resolve('public/assets/audio/voices/ch2-egouts');
const { selected: selectedFile, force, dryRun } = generationOptions(process.argv.slice(2), 'file');
if (selectedFile && !CH2_ZACHARY_VOICE_CUES.some((cue) => cue.file === selectedFile)) {
  throw new Error(`Prise inconnue : ${selectedFile}`);
}
// Le shim npm Windows est un .cmd ; son JS évite le shell et ses échappements.
const cliScript =
  process.env.HOLT_ELEVENLABS_CLI ??
  (process.platform === 'win32'
    ? resolve(process.env.APPDATA ?? '', 'npm/node_modules/@elevenlabs/cli/bin/cli.js')
    : null);
if (!dryRun) mkdirSync(outputDir, { recursive: true });

for (const cue of CH2_ZACHARY_VOICE_CUES) {
  if (selectedFile && cue.file !== selectedFile) continue;
  const output = resolve(outputDir, `${cue.file}.mp3`);
  if (!force && existsSync(output) && statSync(output).size > 0) {
    process.stdout.write(`Déjà présent : ${cue.file}\n`);
    continue;
  }
  const voice = CH2_BALL_VOICES[cue.voice];
  const settings = JSON.stringify({
    stability: cue.voice === 'zachary' ? 0.35 : voice.stability,
    similarity_boost: 0.8,
    style: cue.voice === 'zachary' ? 0.24 : voice.style,
    speed: cue.voice === 'zachary' ? 0.94 : voice.speed,
    use_speaker_boost: true,
  });
  process.stdout.write(`${dryRun ? 'Prévu' : 'Génération'} : ${cue.file} (${cue.voice})\n`);
  if (dryRun) continue;
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
