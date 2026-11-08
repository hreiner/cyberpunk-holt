/* global __filename */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ROOT, RATE, FFMPEG } = require('./mix-engine.cjs');
const folder = path.resolve(ROOT, process.argv[2] ?? 'art-masters/motion-comics/blue-purple/pages-05-08/revision-02/soundtrack-v1');
const report = JSON.parse(fs.readFileSync(path.join(folder, 'report.json')));
const timing = JSON.parse(fs.readFileSync(path.join(folder, 'timing.json')));
if (fs.existsSync(path.join(folder, 'audio-output-check.json'))) throw Error('Contrôle existant conservé.');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function wav(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  let data, format;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32LE(offset + 4), id = bytes.toString('ascii', offset, offset + 4);
    if (id === 'fmt ') format = { codec: bytes.readUInt16LE(offset + 8), channels: bytes.readUInt16LE(offset + 10),
      rate: bytes.readUInt32LE(offset + 12), bits: bytes.readUInt16LE(offset + 22) };
    if (id === 'data') data = bytes.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + size % 2;
  }
  assert.deepEqual(format, { codec: 1, channels: 2, rate: RATE, bits: 16 });
  assert.ok(data?.length > 0);
  return { bytes, data, frames: data.length / 4, duration: data.length / (RATE * 4) };
}
const whole = wav(path.join(ROOT, report.full)), lot = wav(path.join(ROOT, report.newLot));
const prefixBytes = Math.round(timing.historicalDuration * RATE) * 4;
assert.equal(hash(whole.data.subarray(0, prefixBytes)), report.prefix.originalPcmSha256);
assert.ok(whole.data.subarray(prefixBytes).equals(lot.data), 'Le lot doit être identique à la fin du complet.');
const pageChecks = [];
for (const page of timing.pages) {
  const selected = report.pageBackings.find(row => row.name === `backing-${page.id}.wav`);
  assert.ok(selected, `Backing absent : ${page.id}`);
  const pcm = wav(path.join(ROOT, selected.audio));
  const first = Math.round(page.start * RATE) * 4, last = Math.round(page.end * RATE) * 4;
  assert.ok(pcm.data.equals(lot.data.subarray(first, last)), `Découpe de page incohérente : ${page.id}`);
  pageChecks.push({ page: page.id, duration: pcm.duration, exactLotSlice: true });
}
for (const row of report.inputs) assert.equal(hash(fs.readFileSync(path.join(ROOT, row.file))), row.sha256);
for (const row of report.files) {
  const file = path.join(ROOT, row.audio), pcm = wav(file);
  assert.equal(hash(pcm.bytes), row.sha256);
  assert.equal(pcm.frames, row.pcmFrames);
  const result = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-xerror', '-err_detect', 'explode', '-i', file, '-f', 'null', '-']);
  assert.equal(result.status, 0, String(result.stderr));
}
assert.equal(hash(fs.readFileSync(path.join(folder, 'mix-engine.cjs'))), report.mixEngineSha256);
assert.equal(hash(fs.readFileSync(path.join(folder, 'build-soundtrack.cjs'))), report.mixScriptSha256);
assert.equal(hash(fs.readFileSync(path.join(folder, 'timing.json'))), report.timingSha256);
for (let index = 1; index < timing.tracks.length; index++) assert.ok(timing.tracks[index].start >= timing.tracks[index - 1].end, 'Chevauchement vocal.');
const warning = timing.tracks.find(track => track.id === 'bp-l025'), reaction = timing.tracks.find(track => track.id === 'bp-l026');
const contact = timing.events.find(row => row.id === 'punchContact').time;
assert.ok(warning.end < contact && contact < reaction.start, 'Le coup doit séparer sommation et réaction.');
for (const event of report.events) assert.ok(event.start >= 0 && event.start + event.duration <= timing.duration, `SFX hors durée : ${event.id}`);
const result = { schemaVersion: 1, date: '2026-11-06', status: 'passed', backingDuration: lot.duration,
  fullDuration: whole.duration, preservedPrefixSeconds: timing.historicalDuration, exactPrefix: true,
  exactFullLotSuffix: true, pageChecks, decodedFiles: report.files.length,
  inputHashes: report.inputs.length, voiceOverlap: false, punchBetweenVoices: true,
  soundtrackSnapshotHashes: true, auditScriptSha256: hash(fs.readFileSync(__filename)), humanListening: 'not-performed' };
fs.writeFileSync(path.join(folder, 'audio-output-check.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
fs.copyFileSync(__filename, path.join(folder, 'check-soundtrack.cjs'), fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify(result));
