'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../../../../..');
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const destination = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !inside(root, destination) || fs.existsSync(destination)) throw Error('Rapport local neuf requis.');
const version = Number(process.argv[3] ?? 2);
if (!Number.isInteger(version) || version < 2) throw Error('Version de sélection >=2 requise.');
const file = path.join(root, `anime/motion-comics/projects/blue-purple-pages01-08-v${version}.json`);
const selected = readDocument(file);
if (selected.pages.length !== 8 || selected.timeline.tracks.length !== 37 || Math.abs(selected.timeline.duration - 226.6) > 1e-8) throw Error('La sélection ne correspond pas à la révision gelée.');
const baseline = read(path.join(root, 'art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json'));
const retained = baseline.files.map(item => ({ ...item, unchanged: hash(path.join(root, item.file)) === item.sha256 }));
if (retained.some(item => !item.unchanged)) throw Error('Les sources historiques ont changé.');
const previous = readDocument(path.join(root, 'anime/motion-comics/projects/blue-purple-pages01-04-v4.json'));
previous.timeline.tracks.forEach((track, index) => {
  const actual = selected.timeline.tracks[index];
  if (actual.start !== track.start || actual.end !== track.end || actual.audioFile !== track.audioFile) throw Error('Le préfixe vocal a changé.');
});
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(root, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const sources = [...new Set([...selected.timeline.tracks.map(track => track.audioFile), selected.musicFile])];
const decoded = sources.map(source => {
  if (!source || !inside(root, source)) throw Error('Source audio invalide.');
  const result = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', source, '-f', 'null', '-'], { encoding: 'utf8' });
  if (result.status !== 0) throw Error(`Décodage échoué : ${source}`);
  return { file: path.relative(root, source).replaceAll('\\', '/'), sha256: hash(source), fullDecodeExit: result.status };
});
for (const [index, track] of selected.timeline.tracks.entries()) if (index && track.start < selected.timeline.tracks[index - 1].end - 1e-8) throw Error('Chevauchement vocal.');
const revised = selected.pages.slice(4);
const layers = revised.flatMap(page => (page.data.motionLayers ?? []).map(layer => ({ page: page.id, id: layer.id, mode: layer.mode, frames: layer.frames.length, start: layer.startSeconds, end: layer.endSeconds })));
if (layers.filter(layer => layer.mode === 'frames' && layer.frames >= 2).length < 2 || !layers.some(layer => layer.mode === 'sprite')) throw Error('Les trois actions physiques attendues sont absentes.');
if (!selected.data.music.preMixed) throw Error('Backing de production absent.');
const report = { status: 'completed', checkedAt: new Date().toISOString(), manifest: path.relative(root, file), sha256: hash(file),
  duration: selected.timeline.duration, pages: 8, voices: 37, revisedVoices: revised.reduce((count, page) => count + page.data.panels.reduce((n, panel) => n + (panel.cues?.length ?? 0), 0), 0),
  retained, originalVoiceTimesUnchanged: true, decoded, voiceOverlaps: 0, layers,
  limits: 'Contrôle technique et présence des sources ; aucune écoute humaine ou appréciation artistique déduite.' };
fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.info(JSON.stringify({ status: 'completed', pages: 8, duration: selected.timeline.duration, voices: 37, revisedVoices: report.revisedVoices, decodedFiles: decoded.length, retainedSources: retained.length, physicalActions: layers.length }, null, 2));
