/* Rebuild v11 from existing stems; no time-stretching or provider generation. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const engine = require('../../motion-03/sound/mix-engine.cjs');
const { mapTime } = require('../retime.cjs');
const { ROOT, RATE, FFMPEG, frameAt, decode, mixBacking, writeWave } = engine;
const rel = file => path.relative(ROOT, file).replaceAll('\\', '/');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const contractFile = path.resolve(__dirname, '../TIMING.json');
const contract = load(contractFile), tracks = contract.pages.flatMap(page => page.tracks);
const output = path.join(ROOT, path.dirname(contract.backing));
const reportFile = path.join(output, 'REPORT.json');
if (contract.version !== 11 || tracks.length !== 99 || Math.abs(contract.duration - 491.9) > 1e-6) throw Error('Contrat v11 différent.');
if (fs.existsSync(reportFile) || fs.existsSync(path.join(ROOT, contract.backing))) throw Error('Production existante conservée.');
for (const lock of contract.sourceLocks) if (hash(path.join(ROOT, lock.file)) !== lock.sha256) throw Error('Source gelée différente : ' + lock.file);
const page = id => contract.pages.find(item => item.id === id);
const map = time => {
  const selected = contract.pages.find(item => time < item.oldStart + item.oldDuration - 1e-8) ?? contract.pages.at(-1);
  return selected.newStart + mapTime(selected.points, time - selected.oldStart);
};
const legacyFile = path.join(ROOT, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/legacy-v2/report.json');
const lotFile = path.join(ROOT, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/sound/soundtrack-v1/report.json');
const legacy = load(legacyFile), lot = load(lotFile);
const sections = [], events = [], silences = [];
const stableTime = (time, field, section, offset) => {
  // Crossfades authored inside a removed overview must keep their physical tails.
  const duration = field === 'end' ? section.fadeOut ?? 0 : 0;
  for (const boundary of contract.pages) {
    if (duration && Math.abs(time - boundary.oldStart - duration) < 1e-6) return boundary.newStart + duration;
  }
  return map(offset + section[field]);
};
function importReport(report, offset, group) {
  for (const original of report.sections) {
    const next = { ...original, id: group + ':' + original.id,
      start: stableTime(offset + original.start, 'start', original, offset),
      end: stableTime(offset + original.end, 'end', original, offset) };
    next.end = Math.min(contract.duration, next.end);
    if (!(next.end > next.start)) throw Error('Section supprimée entièrement : ' + next.id);
    sections.push(next);
  }
  for (const original of report.events) {
    const next = { ...original, id: group + ':' + original.id, oldGlobalStart: offset + original.start, start: map(offset + original.start) };
    if (hash(path.join(ROOT, next.audio)) !== next.sourceSha256) throw Error('Matière SFX différente : ' + next.id);
    if (!(next.start >= 0 && next.start + next.duration <= contract.duration + 1e-6)) throw Error('Accent hors temps : ' + next.id);
    events.push(next);
  }
  for (const original of report.musicSilences) silences.push({ ...original, id: group + ':' + (original.id ?? 'silence'), at: map(offset + original.at) });
}
importReport(legacy, page('page-05').oldStart, 'p05-08');
importReport(lot, page('page-09').oldStart, 'p09-21');
// Prefix music was the original .08 pressure stem, phase zero and .45 speech gain.
sections.unshift({ id: 'p01-04:pressure', start: page('page-01').newStart, end: page('page-05').newStart,
  audio: 'public/assets/audio/background/music-pressure.mp3', gain: .08, sourceOffset: 0, fadeIn: .5,
  speechMultiplier: .45, speechRampSeconds: .15 });
const section = id => { const row = sections.find(item => item.id === id); if (!row) throw Error('Section absente : ' + id); return row; };
section('p05-08:pressure-action').sourceOffset = page('page-05').newStart - page('page-01').newStart;
section('p09-21:neon-shop').sourceOffset = 30 + section('p09-21:neon-shop').start - section('p09-21:neon-access').start;
for (const suffix of ['ambush', 'hide', 'return', 'quay']) {
  const row = section('p09-21:pressure-' + suffix);
  row.sourceOffset = 18 + row.start - section('p09-21:pressure-neural').start;
}
section('p09-21:refuge-water-distant').sourceOffset = section('p09-21:refuge-water-distant').start - section('p09-21:outfall-water').start;
const at = id => { const row = events.find(item => item.id === id); if (!row) throw Error('Accent absent : ' + id); return row.start; };
const oldVoices = load(path.join(ROOT, contract.sourceManifest));
const oldFiles = oldVoices.pages.flatMap(entry => {
  const file = path.resolve(ROOT, path.dirname(contract.sourceManifest), entry.manifest), data = load(file);
  return data.panels.flatMap(panel => (panel.cues ?? []).map(cue => path.resolve(path.dirname(file), cue.audio)));
});
if (oldFiles.length !== 99 || tracks.some((track, index) => path.resolve(ROOT, track.audioFile) !== oldFiles[index])) throw Error('Association des99prises différente.');
fs.mkdirSync(output, { recursive: true });
const backing = mixBacking({ duration: contract.duration, sections, tracks, events, silences });
const oldBacking = path.resolve(ROOT, path.dirname(contract.sourceManifest), oldVoices.music.audio), oldBytes = fs.readFileSync(oldBacking);
if (oldBytes.toString('ascii', 36, 40) !== 'data' || oldBytes.readUInt32LE(24) !== RATE || oldBytes.readUInt16LE(22) !== 2 || oldBytes.readUInt16LE(34) !== 16) throw Error('PCM couverture inattendu.');
const coverPcm = oldBytes.subarray(44, 44 + frameAt(12) * 4);
for (let index = 0; index < coverPcm.length / 2; index++) backing[index] = coverPcm.readInt16LE(index * 2) / 32767;
const measurements = writeWave(path.join(ROOT, contract.backing), backing);
const actualCover = fs.readFileSync(path.join(ROOT, contract.backing)).subarray(44, 44 + coverPcm.length);
if (!actualCover.equals(coverPcm)) throw Error('Couverture PCM différente.');
engine.clearDecodeCache();
if (global.gc) global.gc();
const run = args => {
  const result = spawnSync(FFMPEG, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 180000, windowsHide: true });
  if (result.status !== 0) throw Error(result.error?.message ?? String(result.stderr));
  return result;
};
const stats = pcm => {
  let peak = 0, sum = 0, clipped = 0;
  for (const sample of pcm) { peak = Math.max(peak, Math.abs(sample)); sum += sample * sample; clipped += +(Math.abs(sample) >= 1); }
  return { samples: pcm.length, peakDb: peak ? 20 * Math.log10(peak) : null, meanDb: sum ? 10 * Math.log10(sum / pcm.length) : null, clippedSamples: clipped };
};
const backingM4a = path.join(output, 'backing-cover-and-pages01-21.m4a');
run(['-i', path.join(ROOT, contract.backing), '-t', String(contract.duration), '-c:a', 'aac', '-ac', '2', '-b:a', '192k', '-movflags', '+faststart', backingM4a]);
const compressedPcm = decode(backingM4a), compressed = stats(compressedPcm), source = stats(backing);
if (compressed.clippedSamples || Math.abs(compressed.meanDb - source.meanDb) > .25 || Math.abs(compressedPcm.length / (RATE * 2) - contract.duration) > .06) throw Error('Backing AAC non conforme.');
engine.clearDecodeCache();
const reviewIds = ['p05-08:body-impact', 'p05-08:gun-attack', 'p05-08:engine-start', 'p09-21:terminal-map-ready', 'p09-21:capsule-latch', 'p09-21:single-shot-metal', 'p09-21:body-water-splash', 'p09-21:refuge-opening'];
const previews = [];
for (const id of reviewIds) {
  const event = events.find(item => item.id === id), containing = contract.pages.find(item => event.start >= item.newStart && event.start < item.newStart + item.newDuration);
  // Entire containing page keeps each nearby voice intact and makes the visual anchor replayable.
  const start = containing.newStart, end = containing.newStart + containing.newDuration;
  const mixed = new Float32Array(backing.subarray(frameAt(start) * 2, frameAt(end) * 2));
  const selected = tracks.filter(track => track.start >= start - 1e-7 && track.start < end);
  for (const track of selected) {
    const pcm = decode(path.join(ROOT, track.audioFile)), first = frameAt(track.start - start) * 2;
    const count = Math.min(pcm.length, frameAt(track.end - track.start) * 2, mixed.length - first);
    for (let index = 0; index < count; index++) mixed[first + index] += pcm[index];
  }
  const before = stats(mixed); if (before.clippedSamples) throw Error('Surcharge mix réel : ' + id);
  const basename = id.replaceAll(':', '-'), wave = path.join(output, basename + '-mixed.wav');
  writeWave(wave, mixed);
  const aac = path.join(output, basename + '-mixed.m4a');
  run(['-i', wave, '-t', String(end - start), '-c:a', 'aac', '-ac', '2', '-b:a', '192k', '-movflags', '+faststart', aac]);
  const encoded = stats(decode(aac)); if (encoded.clippedSamples) throw Error('AAC mix écrêté : ' + id);
  previews.push({ id, start, end, at: event.start, pageId: containing.id, trackCount: selected.length, audio: rel(aac), sha256: hash(aac), native: before, compressed: encoded, decoded: true });
  engine.clearDecodeCache();
}
for (const lock of contract.sourceLocks) if (hash(path.join(ROOT, lock.file)) !== lock.sha256) throw Error('Source gelée modifiée : ' + lock.file);
const report = { schemaVersion: 1, version: 11, date: '2026-11-17', status: 'produced-and-measured',
  timing: rel(contractFile), timingSha256: hash(contractFile), duration: contract.duration,
  backing: contract.backing, backingSha256: hash(path.join(ROOT, contract.backing)), backingMeasurements: measurements,
  backingM4a: rel(backingM4a), backingM4aSha256: hash(backingM4a), source, compressed,
  audioConversion: { sourceDuration: contract.duration, targetDuration: compressedPcm.length / (RATE * 2), sourceMeanDb: source.meanDb, targetMeanDb: compressed.meanDb, sourcePeakDb: source.peakDb, targetPeakDb: compressed.peakDb, sourceChannels: 2, channels: 2, sampleRate: RATE },
  cover: { seconds: 12, pcmExact: true, pcmSha256: crypto.createHash('sha256').update(coverPcm).digest('hex') },
  sourceReports: [legacyFile, lotFile].map(file => ({ file: rel(file), sha256: hash(file) })),
  voices: tracks.map((track, index) => ({ audioFile: track.audioFile, sha256: hash(oldFiles[index]), start: track.start, end: track.end, duration: track.end - track.start, nativeSpeed: true, gain: 1 })),
  sections, events, silences, previews,
  causalAnchors: { singleShot: at('p09-21:single-shot-metal'), metalImpact: at('p09-21:single-shot-metal') + .08, oneShotOnly: events.filter(item => item.soundId === 'single-shot-metal').length === 1 },
  sourceLocksUnchanged: contract.sourceLocks.length, newProviderCalls: 0, humanListening: 'not-performed',
  method: 'Existing source stems replayed at native rate; remapped action starts, unchanged native SFX segments/gains, new speech duck and preserved physical crossfades. Cover PCM exact.',
  scriptSha256: hash(__filename), engineSha256: hash(require.resolve('../../motion-03/sound/mix-engine.cjs')) };
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.info(JSON.stringify({ report: rel(reportFile), duration: report.duration, backing: report.backing, backingM4a: report.backingM4a, voices: report.voices.length, events: events.length, previews: previews.length, source, compressed, newProviderCalls: 0 }));
