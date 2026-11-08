'use strict';

// Inspect the encoded deliverable itself, at exact 24 fps frame numbers.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../../../../..');
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const input = path.resolve(process.argv[2] ?? '');
const output = path.resolve(process.argv[3] ?? '');
if (!process.argv[3] || !inside(root, input) || !inside(root, output) || fs.existsSync(output)) throw Error('MP4 local et nouveau dossier requis.');
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(root, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceHash = hash(input);
const samples = [['john-ready', 9.6], ['john-contact', 11.08], ['john-recoil', 11.2], ['barman-down', 11.52], ['rear-exit', 34.56], ['car-final', 81.2]];
fs.mkdirSync(output, { recursive: false });
const files = samples.map(([name, seconds]) => {
  const frame = Math.ceil(seconds * 24 - 1e-8), file = path.join(output, `${name}.png`);
  const result = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-i', input, '-vf', `select=eq(n\\,${frame})`, '-frames:v', '1', file], { encoding: 'utf8' });
  if (result.status !== 0 || !fs.existsSync(file)) throw Error(result.stderr || `Image absente : ${name}`);
  return { file: path.relative(root, file).replaceAll('\\', '/'), sourceFrame: frame, seconds: frame / 24, sha256: hash(file) };
});
if (hash(input) !== sourceHash) throw Error('MP4 modifié pendant extraction.');
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ status: 'completed', source: path.relative(root, input), sourceHash, files, limitation: 'Extraction technique des images encodées ; revue visuelle séparée.' }, null, 2) + '\n', { flag: 'wx' });
console.info(JSON.stringify({ status: 'completed', images: files.length, sourceHash }));
