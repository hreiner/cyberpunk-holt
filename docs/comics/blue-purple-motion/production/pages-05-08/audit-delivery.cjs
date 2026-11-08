'use strict';

// Decode every selected take and verify the retained media against the initial baseline.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../../../..');
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const manifest = path.join(root, 'anime/motion-comics/projects/blue-purple-pages01-08-v1.json');
const output = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !inside(root, output) || fs.existsSync(output)) throw Error('Rapport local neuf requis.');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json'), 'utf8'));
const project = readDocument(manifest);
const retained = baseline.files.map(item => ({ ...item, unchanged: hash(path.resolve(root, item.file)) === item.sha256 }));
if (retained.some(item => !item.unchanged)) throw Error('Un média retenu des pages 1–4 a changé.');
if (project.pages.length !== 8 || project.timeline.tracks.length !== 23) throw Error('Huit pages et 23 prises sélectionnées attendues.');
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(root, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const tracks = project.timeline.tracks.map((track, index, all) => {
  if (index > 0 && track.start < all[index - 1].end - 1e-8) throw Error('Chevauchement des voix.');
  const file = track.audioFile;
  if (!file || !inside(root, file)) throw Error('Source audio résolue requise.');
  const result = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  if (result.status !== 0) throw Error(`Décodage audio échoué : ${file} : ${result.stderr}`);
  return { file: path.relative(root, file).replaceAll('\\', '/'), sha256: hash(file), start: track.start, end: track.end, fullDecodeExit: result.status };
});
const types = [...new Set(project.pages.slice(4).flatMap(page => page.data.effects.map(effect => effect.type)))];
const report = { status: 'completed', checkedAt: new Date().toISOString(), manifest: path.relative(root, manifest), manifestSha256: hash(manifest),
  duration: project.timeline.duration, pages: project.pages.length, voices: tracks.length, retained, tracks, newEffectTypes: types,
  allSelectedTakesFullyDecoded: true, voiceOverlaps: 0,
  limits: 'Décodage et chronologie techniques ; aucune écoute ou approbation humaine déduite.' };
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.info(JSON.stringify({ status: report.status, pages: report.pages, duration: report.duration, decodedTakes: tracks.length, retainedFiles: retained.length, newEffectTypes: types }, null, 2));
