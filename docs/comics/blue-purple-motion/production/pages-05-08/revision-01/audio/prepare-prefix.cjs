// Préserver le backing des quatre premières pages selon le complet v1 réellement livré.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const engine = require('./mix-engine.cjs');
const { readDocument } = require(path.join(engine.ROOT, 'anime/motion-comics/sequence.cjs'));
const { musicVolumeExpression } = require(path.join(engine.ROOT, 'anime/motion-comics/sequence.js'));
const source = path.join(engine.ROOT, 'anime/motion-comics/projects/blue-purple-pages01-08-v1.json');
const project = readDocument(source);
const boundary = project.timeline.pages.find(page => page.id === 'page-05').start;
if (Math.abs(boundary - 144.6) > 1e-8) throw Error('Frontière historique modifiée.');
const folder = path.join(engine.ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/soundtrack-v1');
const target = path.join(folder, 'legacy-prefix.wav'), reportPath = path.join(folder, 'legacy-prefix-report.json');
if (fs.existsSync(target) || fs.existsSync(reportPath)) throw Error('Préfixe existant conservé.');
fs.mkdirSync(folder, { recursive: true });
const expression = musicVolumeExpression(project.timeline.duration, project.data.music, project.timeline.tracks);
const args = ['-hide_banner', '-loglevel', 'error', '-xerror', '-stream_loop', '-1', '-t', String(boundary + .1), '-i', project.musicFile,
  '-af', `atrim=duration=${project.timeline.duration},asetpts=PTS-STARTPTS,volume='${expression}':eval=frame`, '-ac', '2', '-ar', String(engine.RATE), '-f', 's16le', 'pipe:1'];
const result = spawnSync(engine.FFMPEG, args, { maxBuffer: 64 * 1024 * 1024 });
if (result.status !== 0 || result.stdout?.length < engine.frameAt(boundary) * 4) throw Error(`Préfixe audio impossible : status${result.status}, bytes${result.stdout?.length}, expected${engine.frameAt(boundary) * 4}, error${result.error?.message}, ${result.stderr}`);
const pcm = result.stdout.subarray(0, engine.frameAt(boundary) * 4), float = new Float32Array(pcm.length / 2);
for (let index = 0; index < float.length; index++) float[index] = pcm.readInt16LE(index * 2) / 32767;
const measures = engine.writeWave(target, float);
const written = fs.readFileSync(target).subarray(44);
if (!pcm.equals(written)) throw Error('La copie PCM du préfixe historique a changé.');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const relative = file => path.relative(engine.ROOT, file).replaceAll('\\', '/');
const report = { schemaVersion: 1, date: '2026-11-05', sourceManifest: relative(source), sourceManifestSha256: hash(fs.readFileSync(source)),
  sourceMusic: relative(project.musicFile), sourceMusicSha256: hash(fs.readFileSync(project.musicFile)), sourceMusicSettings: project.data.music,
  originalFullDuration: project.timeline.duration, preservedPrefixDuration: boundary, output: relative(target), outputSha256: hash(fs.readFileSync(target)),
  expectedPcmSha256: hash(pcm), actualPcmSha256: hash(written), exactPcmCopy: true,
  method: 'Même source, phase0, musique/duck/fondu calculés par musicVolumeExpression du completv1 et même filtre FFmpeg volume eval=frame. Pas de fondu ajouté à144.6s. Sortie PCM conservée octet pour octet.',
  expression, commandArguments: args, humanListening: 'not-performed', ...measures };
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output: relative(target), preservedSeconds: boundary, exactPcmCopy: true, pcmSha256: hash(pcm) }));
