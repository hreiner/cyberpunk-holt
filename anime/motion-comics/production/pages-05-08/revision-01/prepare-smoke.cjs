/* Minimal local composition fixture; these shapes are tests, not production art. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT, newDirectory } = require('../../../project.cjs');
const directory = newDirectory(path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/editor-smoke-v1'));
const head = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">';
const raw = '<rect width="1024" height="1536" fill="#102030"/>';
const lettering = '<rect x="180" y="40" width="660" height="100" rx="30" fill="white"/><text x="510" y="104" font-family="Arial" font-size="42" text-anchor="middle">Épreuve technique</text>';
const box = color => `<rect x="120" y="440" width="780" height="700" fill="${color}"/>`;
const files = { 'raw.svg': raw, 'master.svg': raw + box('#b00020') + lettering, 'letters.svg': lettering,
  'ready.svg': box('#b00020'), 'contact.svg': box('#00b040') };
for (const [file, body] of Object.entries(files)) fs.writeFileSync(path.join(directory, file), head + body + '</svg>', { flag: 'wx' });
const ffmpeg = path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const convert = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-i', path.join(ROOT, 'public/assets/audio/background/music-pressure.mp3'), '-t', '3', '-c:a', 'pcm_s16le', path.join(directory, 'backing.wav')], { encoding: 'utf8' });
if (convert.status !== 0) throw Error(convert.stderr);
const data = { schemaVersion: 1, version: 1, title: 'Épreuve technique des calques', image: 'master.svg', motionBaseImage: 'raw.svg', letteringImage: 'letters.svg', overviewSeconds: 0, transitionSeconds: 0, gapSeconds: 0, outroSeconds: 0,
  panels: [{ id: 'test', label: 'Épreuve technique', rect: [0, 0, 1, 1], holdSeconds: 3, cues: [] }], motionLayers: [{ id: 'pose', panelId: 'test', mode: 'frames', rect: [0, 0, 1, 1], startSeconds: 0, endSeconds: 2,
    frames: [{ atSeconds: 0, image: 'ready.svg' }, { atSeconds: 1, image: 'contact.svg' }] }], effects: [], protectedRegions: [] };
fs.writeFileSync(path.join(directory, 'page.json'), JSON.stringify(data, null, 2), { flag: 'wx' });
fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ kind: 'motion-comic-sequence', schemaVersion: 1, version: 1, title: data.title, pages: [{ id: 'test-page', manifest: 'page.json' }], music: { audio: 'backing.wav', preMixed: true, gain: 1 } }, null, 2), { flag: 'wx' });
console.info(directory);
