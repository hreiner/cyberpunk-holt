'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../../../../..');
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const destination = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !inside(root, destination) || fs.existsSync(destination)) throw Error('Rapport local neuf requis.');
const manifest = path.join(root, 'anime/motion-comics/projects/blue-purple-pages01-08-v4.json');
const selected = readDocument(manifest), previous = readDocument(path.join(root, 'anime/motion-comics/projects/blue-purple-pages01-08-v3.json'));
assert.equal(selected.pages.length, 8); assert.equal(selected.timeline.tracks.length, 37);
assert(Math.abs(selected.timeline.duration - 226.6) < 1e-8);
const retained = [];
for (const name of ['art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json', 'art-masters/motion-comics/blue-purple/pages-05-08/revision-02/baseline-v3.json']) {
  for (const item of read(path.join(root, name)).files) {
    assert.equal(hash(path.join(root, item.file)), item.sha256, `Ancien média modifié : ${item.file}`);
    retained.push(item);
  }
}
const voiceTimes = selected.timeline.tracks.map((track, index) => {
  const old = previous.timeline.tracks[index], delta = [19, 20].includes(index) ? 0.7 : 0;
  assert.equal(hash(track.audioFile), hash(old.audioFile), 'Voix réemployée différente.');
  assert(Math.abs(track.start - old.start - delta) < 1e-8 && Math.abs(track.end - old.end - delta) < 1e-8, `Décalage vocal inattendu : ${index}`);
  if (index) assert(track.start >= selected.timeline.tracks[index - 1].end - 1e-8, 'Chevauchement vocal.');
  return { index, start: track.start, end: track.end, delta, audioSha256: hash(track.audioFile) };
});
const layers = selected.pages.slice(4).flatMap(page => (page.data.motionLayers ?? []).map(layer => ({ page: page.id, panel: layer.panelId, mode: layer.mode, frames: layer.frames.length })));
assert.deepEqual(layers.map(layer => layer.panel).sort(), ['p05-c03', 'p05-c04', 'p06-c03']);
assert(layers.every(layer => layer.mode === 'frames' && layer.frames >= 2));
assert.equal(selected.pages[4].data.storyThumbnail, true);
assert.equal(selected.pages[4].data.panels[3].leadInSeconds, 0.7);
assert.equal((selected.pages[7].data.motionLayers ?? []).length, 0);
assert.equal(selected.data.music.preMixed, true);
for (const index of [4, 5, 6, 7]) assert.equal(hash(path.resolve(path.dirname(selected.pages[index].manifestFile), selected.pages[index].data.image)), hash(path.resolve(path.dirname(previous.pages[index].manifestFile), previous.pages[index].data.image)));
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(root, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const decoded = [...new Set([...selected.timeline.tracks.map(track => track.audioFile), selected.musicFile])].map(file => {
  if (!inside(root, file)) throw Error('Audio hors dépôt.');
  const result = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `Décodage échoué : ${file}`);
  return { file: path.relative(root, file).replaceAll('\\', '/'), sha256: hash(file), fullDecodeExit: 0 };
});
fs.writeFileSync(destination, JSON.stringify({ status: 'completed', checkedAt: new Date().toISOString(), manifest: path.relative(root, manifest), sha256: hash(manifest),
  pages: 8, voices: 37, duration: selected.timeline.duration, retained, voiceTimes, voiceOverlaps: 0, layers, carMotionLayers: 0, canonicalImagesUnchanged: true, decoded,
  limits: 'Contrôle de sources et chronologie ; les preuves visuelles et les mesures des segments SFX sont distinctes. Aucune écoute humaine déduite.' }, null, 2) + '\n', { flag: 'wx' });
console.info(JSON.stringify({ status: 'completed', pages: 8, voices: 37, duration: selected.timeline.duration, decoded: decoded.length, carFixed: true }));
