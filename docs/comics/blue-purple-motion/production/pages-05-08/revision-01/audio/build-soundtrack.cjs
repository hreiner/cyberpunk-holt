/* global __filename */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const engine = require('./mix-engine.cjs');
const { ROOT, RATE, frameAt, decode, mixBacking, writeWave, FFMPEG } = engine;
const MASTER = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01');
const args = process.argv.slice(2);
const argument = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const version = Number(argument('--version', '2'));
const sfxVersion = Number(argument('--sfx-version', '3'));
if (!Number.isInteger(version) || version < 1 || !Number.isInteger(sfxVersion) || sfxVersion < 1) throw Error('Versions positives requises.');
const output = path.join(MASTER, `soundtrack-v${version}`);
const timingFile = path.join(MASTER, argument('--timing', 'timing-r1-v3.json'));
const timing = JSON.parse(fs.readFileSync(timingFile, 'utf8'));
const sfxFile = path.join(MASTER, `audio-v1/sfx-measurements-v${sfxVersion}.json`);
const foleyFile = path.join(MASTER, 'audio-v1/foley-local-v1/report.json');
const sounds = new Map([...JSON.parse(fs.readFileSync(sfxFile)).sounds, ...JSON.parse(fs.readFileSync(foleyFile)).sounds].map(sound => [sound.id, sound]));
const prefixFolder = path.join(MASTER, 'soundtrack-v1');
const prefixFile = path.join(prefixFolder, 'legacy-prefix.wav');
const prefixReport = JSON.parse(fs.readFileSync(path.join(prefixFolder, 'legacy-prefix-report.json')));
const reportPath = path.join(output, 'report.json');
if (fs.existsSync(reportPath) || fs.existsSync(path.join(output, 'backing-full.wav'))) throw Error('Mix existant conservé.');
if (Math.abs(timing.duration - Number(argument('--expected-duration', '96'))) > 1e-8 || Math.abs(timing.historicalDuration - 144.6) > 1e-8) throw Error('Chronologie différente : revoir le mix.');
fs.mkdirSync(output, { recursive: true });
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const eventTime = id => { const row = timing.events.find(event => event.id === id); if (!row) throw Error(`Ancre inconnue : ${id}`); return row.time; };
const pageStart = id => timing.pages.find(page => page.id === id).start;
const crossfade = .65;
const sections = [
  { id: 'pressure-action', start: 0, end: pageStart('page-07') + crossfade, audio: 'public/assets/audio/background/music-pressure.mp3', gain: .30,
    sourceOffset: 144.6, fadeOut: crossfade, speechMultiplier: .28, gainRamp: { from: .08 / .30, to: 1, seconds: .8 } },
  { id: 'neon-bluff', start: pageStart('page-07'), end: pageStart('page-08') + crossfade, audio: 'public/assets/audio/background/music-neon.mp3', gain: .26,
    fadeIn: crossfade, fadeOut: crossfade, speechMultiplier: .28 },
  { id: 'afterglow-escape', start: pageStart('page-08'), end: timing.duration, audio: 'public/assets/audio/background/music-afterglow.mp3', gain: .32,
    fadeIn: crossfade, fadeOut: .7, speechMultiplier: .28 },
  { id: 'city-ambience', start: eventTime('rearExit'), end: timing.duration, audio: 'public/assets/audio/background/ambience-night-city.mp3', gain: .12,
    fadeIn: .6, fadeOut: .7, speechMultiplier: .5 }
];
function event(id, anchor, extras = {}) {
  const sound = sounds.get(id);
  if (!sound) throw Error(`Son inconnu : ${id}`);
  return { id, audio: sound.audio, start: typeof anchor === 'number' ? anchor : eventTime(anchor),
    gain: 1, speechMultiplier: .42, sourceSha256: sound.sha256, provider: sound.provider, ...extras };
}
// Le second bruit du composé punch-wood est déplacé séparément pour suivre la chute de la batte.
const wood = decode(sounds.get('punch-wood').audio);
let woodPeak = 0;
for (let index = frameAt(1.1) * 2; index < Math.min(wood.length, frameAt(1.8) * 2); index++) woodPeak = Math.max(woodPeak, Math.abs(wood[index]));
const woodGain = woodPeak ? Math.min(4, Math.pow(10, -20 / 20) / woodPeak) : 1;
const events = [
  event('punch-wood', 'punchContact', { id: 'body-impact', trimStart: 0, duration: .22 }),
  event('punch-wood', 'punchRecoil', { id: 'bat-drop', trimStart: 1.1, duration: .7, gain: woodGain }),
  event('gun-glass', 'shot'), event('rear-door', 'rearExit'),
  event('footsteps', eventTime('rearExit') + .18),
  event('gate-latch', 'parkingLatch'), event('lock-click', 'lockClick'),
  event('engine-start', 'starter'), event('car-door-close', 'doorClose'),
  event('tire-departure', 'departure', { fadeOut: .4 })
];
for (const item of events) {
  if (item.start < 0 || item.start >= timing.duration) throw Error(`Événement hors chronologie : ${item.id}`);
  const available = decode(item.audio).length / (RATE * 2) - (item.trimStart ?? 0);
  item.duration = Math.min(item.duration ?? available, available, timing.duration - item.start - .025);
  if (item.duration <= 0) throw Error(`Événement tronqué entièrement : ${item.id}`);
}
const silences = [{ at: eventTime('punchContact'), lead: .04, hold: .12, release: .22 },
  { at: eventTime('shot'), lead: .025, hold: .055, release: .14 }];
const backing = mixBacking({ duration: timing.duration, sections, tracks: timing.tracks, events, silences });
const files = [];
function save(name, data, start = 0, end = data.length / (RATE * 2)) {
  const file = path.join(output, name), measures = writeWave(file, data, start, end);
  const record = { name, audio: relative(file), sha256: hash(fs.readFileSync(file)), ...measures };
  files.push(record); return record;
}
const lot = save('backing-pages05-08.wav', backing);
for (const page of timing.pages) save(`backing-${page.id}.wav`, backing, page.start, page.end);
const prefixBytes = fs.readFileSync(prefixFile).subarray(44);
if (hash(prefixBytes) !== prefixReport.expectedPcmSha256) throw Error('Préfixe historique modifié.');
const full = new Float32Array(frameAt(timing.fullDuration) * 2);
for (let index = 0; index < prefixBytes.length / 2; index++) full[index] = prefixBytes.readInt16LE(index * 2) / 32767;
full.set(backing, prefixBytes.length / 2);
const complete = save('backing-full.wav', full);
const prefixCopied = fs.readFileSync(path.join(output, 'backing-full.wav')).subarray(44, 44 + prefixBytes.length);
if (!prefixCopied.equals(prefixBytes)) throw Error('Le préfixe PCM du complet n’est pas identique.');
const preview = new Float32Array(backing);
for (const track of timing.tracks) {
  const source = decode(track.audioFile), start = frameAt(track.start) * 2;
  const count = Math.min(source.length, frameAt(track.end - track.start) * 2);
  for (let index = 0; index < count; index++) preview[start + index] += source[index];
}
const previewRecord = save('preview-pages05-08.wav', preview);
const mp3 = path.join(output, 'preview-pages05-08.mp3');
const encoded = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-n', '-i', path.join(output, previewRecord.name),
  '-codec:a', 'libmp3lame', '-b:a', '192k', mp3]);
if (encoded.status !== 0) throw Error(`Préécoute MP3 impossible : ${encoded.stderr}`);
for (const file of files) {
  const decoded = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-xerror', '-err_detect', 'explode',
    '-i', path.join(ROOT, file.audio), '-f', 'null', '-']);
  if (decoded.status !== 0) throw Error(`Fichier mix non décodable : ${file.audio}`);
  file.decoded = true;
}
const inputs = [...new Set([...sections.map(section => section.audio), ...events.map(item => item.audio), ...timing.tracks.map(track => relative(track.audioFile))])]
  .map(file => ({ file, sha256: hash(fs.readFileSync(path.join(ROOT, file))) }));
const report = { schemaVersion: 1, date: '2026-11-05', duration: timing.duration, fullDuration: timing.fullDuration,
  timing: relative(timingFile), timingSha256: hash(fs.readFileSync(timingFile)), contractSha256: timing.contractSha256,
  sfxSelection: relative(sfxFile), sfxSelectionSha256: hash(fs.readFileSync(sfxFile)),
  mixScriptSha256: hash(fs.readFileSync(__filename)), mixEngineSha256: hash(fs.readFileSync(path.join(__dirname, 'mix-engine.cjs'))),
  sections, events, musicSilences: silences, speechDuck: { rampSeconds: .15, musicMultiplier: .28, sfxMultiplier: .42 },
  backingContainsVoices: false, readerContract: { gain: 1, preMixed: true },
  prefix: { report: relative(path.join(prefixFolder, 'legacy-prefix-report.json')), duration: timing.historicalDuration,
    originalPcmSha256: prefixReport.expectedPcmSha256, fullPcmPrefixSha256: hash(prefixCopied), exactPcmCopy: true },
  newLot: lot.audio, full: complete.audio, pageBackings: files.filter(file => /^backing-page-/.test(file.name)),
  preview: relative(mp3), previewContainsVoices: true, previewSha256: hash(fs.readFileSync(mp3)), files, inputs,
  actualNetworkMusicCalls: 0, humanListening: 'not-performed', note: 'Seule la préécoute contient les voix. Les backings musique+SFX sont partagés par lecteur et MP4, sans gain/duck additionnel.' };
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
for (const name of ['build-soundtrack.cjs', 'mix-engine.cjs', 'prepare-prefix.cjs']) fs.copyFileSync(path.join(__dirname, name), path.join(output, name), fs.constants.COPYFILE_EXCL);
fs.copyFileSync(timingFile, path.join(output, 'timing.json'), fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({ report: relative(reportPath), newLot: lot.audio, full: complete.audio,
  duration: timing.duration, fullDuration: timing.fullDuration, prefixExact: true, previewPeakDb: previewRecord.peakDb }));
