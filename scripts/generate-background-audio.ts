/** Génération OAuth ; masters hors dépôt, fichiers existants conservés. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface AudioBrief {
  id: string;
  kind: 'music' | 'ambience';
  seconds: number;
  prompt: string;
}
const brief = JSON.parse(readFileSync(resolve('docs/art/audio-generation/background.json'), 'utf8')) as {
  musicModel: string;
  ambienceModel: string;
  assets: AudioBrief[];
};
const selected = process.argv.find((arg) => arg.startsWith('--asset='))?.slice('--asset='.length);
const force = process.argv.includes('--force');
const musicOnly = process.argv.includes('--music-only');
if (force && !selected) throw new Error('La régénération exige --asset=<identifiant>.');
if (selected && !brief.assets.some(({ id }) => id === selected)) throw new Error(`Son inconnu : ${selected}`);
const outputDir = resolve('art-masters/audio/background');
mkdirSync(outputDir, { recursive: true });
const cliScript =
  process.platform === 'win32'
    ? resolve(process.env.APPDATA ?? '', 'npm/node_modules/@elevenlabs/cli/bin/cli.js')
    : null;

for (const asset of brief.assets) {
  if (musicOnly && asset.kind !== 'music') continue;
  if (selected && asset.id !== selected) continue;
  const output = resolve(outputDir, `${asset.id}.mp3`);
  // Une réponse interrompue peut laisser un fichier vide : elle reste régénérable.
  if (!force && existsSync(output) && readFileSync(output).length > 0) continue;
  const request =
    asset.kind === 'music'
      ? ['music', 'compose', '--output-format', 'mp3_48000_192']
      : ['text-to-sound-effects', 'convert', '--output-format', 'mp3_44100_128'];
  // Le corps JSON évite la validation erronée des champs music_prompt dépréciés
  // par certaines versions de la CLI lorsque --prompt est transmis seul.
  const body =
    asset.kind === 'music'
      ? {
          model_id: brief.musicModel,
          prompt: asset.prompt,
          music_length_ms: asset.seconds * 1000,
          force_instrumental: true,
        }
      : {
          model_id: brief.ambienceModel,
          text: asset.prompt,
          duration_seconds: asset.seconds,
          loop: true,
          prompt_influence: 0.5,
        };
  process.stdout.write(`Génération : ${asset.id} (${asset.seconds} s)\n`);
  const result = spawnSync(
    cliScript ? process.execPath : 'elevenlabs',
    [
      ...(cliScript ? [cliScript] : []),
      ...request,
      '--json',
      '-',
      '--output',
      output,
      '--quiet',
      '--no-retry',
    ],
    { input: JSON.stringify(body), stdio: ['pipe', 'inherit', 'inherit'] },
  );
  if (result.error || result.status !== 0) {
    throw new Error(`Génération impossible pour ${asset.id} : ${result.error?.message ?? result.status}`);
  }
}
