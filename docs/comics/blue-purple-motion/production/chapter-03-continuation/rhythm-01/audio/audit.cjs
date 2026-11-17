/* Check played mixes and action anchors independently from the sound builder. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ROOT, FFMPEG, RATE } = require('../../motion-03/sound/mix-engine.cjs');
const { readDocument } = require(path.join(ROOT, 'anime/motion-comics/sequence.cjs'));
const load = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const timingFile = path.resolve(__dirname, '../TIMING.json'), timing = load(timingFile);
const folder = path.join(ROOT, path.dirname(timing.backing)), reportFile = path.join(folder, 'REPORT.json'), report = load(reportFile);
const source = readDocument(path.join(ROOT, timing.sourceManifest)), target = readDocument(path.join(ROOT, timing.targetManifest));
const checks = [];
function check(id, ok, details) { checks.push({ id, passed: Boolean(ok), ...details }); if (!ok) throw Error('Audit échoué : ' + id); }
check('timing-lock', report.timingSha256 === hash(timingFile) && Math.abs(target.timeline.duration - 491.9) < 1e-8, { duration: target.timeline.duration });
check('ninety-nine-native-voices', source.timeline.tracks.length === 99 && target.timeline.tracks.length === 99 && source.timeline.tracks.every((old, index) => {
  const next = target.timeline.tracks[index];
  return old.audioFile === next.audioFile && Math.abs((old.end - old.start) - (next.end - next.start)) < 1e-8;
}), { count: target.timeline.tracks.length });
const event = id => { const row = report.events.find(item => item.id === id); if (!row) throw Error('Accent absent : ' + id); return row; };
const page = number => target.pages[number];
const layer = (number, id) => page(number).data.motionLayers.find(item => item.id === id);
const effect = (number, id) => page(number).data.effects.find(item => item.id === id);
function anchor(id, number, local) {
  const actual = event(id).start, visual = target.timeline.pages[number].start + local;
  check(id + ':visual-onset', Math.abs(actual - visual) < 1 / RATE, { soundSeconds: actual, visualSeconds: visual, differenceSamples: Math.round((actual - visual) * RATE) });
}
let item = layer(5, 'john-punch-four-poses');
anchor('p05-08:body-impact', 5, item.startSeconds + item.impact.atSeconds);
item = layer(5, 'window-intact-to-broken'); anchor('p05-08:gun-attack', 5, item.startSeconds + item.frames[1].atSeconds);
item = layer(9, 'p09-screen-acquire');
anchor('p09-21:terminal-calculation', 9, item.startSeconds);
anchor('p09-21:terminal-map-ready', 9, item.startSeconds + item.frames.at(-1).atSeconds);
anchor('p09-21:repair-contact', 15, effect(15, '15-2-witness-contact').startSeconds);
anchor('p09-21:capsule-latch', 15, effect(15, '15-3-latch-witness').startSeconds);
item = layer(16, 'elf-world-to-night-city'); anchor('p09-21:neural-map-resolution', 16, item.startSeconds + item.frames[1].atSeconds);
item = layer(16, 'map-marker-green'); anchor('p09-21:neural-green-point', 16, item.startSeconds + item.frames[1].atSeconds);
item = layer(17, 'three-bands-one-shot'); anchor('p09-21:single-shot-metal', 17, item.startSeconds + item.frames[2].atSeconds);
check('one-shot-metal-eighty-ms', report.events.filter(row => row.soundId === 'single-shot-metal').length === 1 && Math.abs(item.frames[3].atSeconds - item.frames[2].atSeconds - .08) < 1e-8, { impactDelaySeconds: item.frames[3].atSeconds - item.frames[2].atSeconds });
item = layer(18, 'bolt-slides-fingers-fixed');
anchor('p09-21:apartment-bolt-slide', 18, item.startSeconds + item.frames[1].atSeconds);
anchor('p09-21:apartment-bolt-click', 18, item.startSeconds + item.frames.at(-1).atSeconds);
item = layer(20, 'released-man-gravity-water-occlusion');
anchor('p09-21:water-throw-cloth', 20, item.startSeconds);
anchor('p09-21:body-water-splash', 20, item.startSeconds + item.frames[6].atSeconds);
item = layer(21, 'double-leaf-door-original-foreground');
anchor('p09-21:refuge-opening', 21, item.startSeconds + item.frames[1].atSeconds);
const byHash = new Map();
const candidates = [{ id: 'full-backing', audio: report.backingM4a }, ...report.previews];
const levels = [];
for (const candidate of candidates) {
  const file = path.join(ROOT, candidate.audio), sha256 = hash(file);
  let measures = byHash.get(sha256);
  if (!measures) {
    const result = spawnSync(FFMPEG, ['-nostdin', '-hide_banner', '-nostats', '-xerror', '-err_detect', 'explode', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 180000, windowsHide: true });
    if (result.status !== 0) throw Error(result.error?.message ?? result.stderr);
    const summary = result.stderr.slice(result.stderr.lastIndexOf('Summary:'));
    const value = pattern => Number(pattern.exec(summary)?.[1]);
    measures = { integratedLufs: value(/Integrated loudness:[\s\S]*?I:\s+([\d.-]+)/), truePeakDb: value(/True peak:[\s\S]*?Peak:\s+([\d.-]+)/) };
    byHash.set(sha256, measures);
  }
  check(candidate.id + ':aac-true-peak', Number.isFinite(measures.truePeakDb) && measures.truePeakDb < 0, { ...measures });
  levels.push({ id: candidate.id, audio: candidate.audio, sha256, ...measures, fullyDecoded: true });
}
const sourceLocks = timing.sourceLocks.map(lock => ({ ...lock, actualSha256: hash(path.join(ROOT, lock.file)) }));
check('historical-sources-intact', sourceLocks.every(lock => lock.actualSha256 === lock.sha256), { files: sourceLocks.length });
const audit = { schemaVersion: 1, version: 11, date: '2026-11-17', status: 'passed', timingSha256: hash(timingFile), reportSha256: hash(reportFile),
  checks, levels, nativeSpeed: true, humanListening: 'not-performed', newProviderCalls: 0, scriptSha256: hash(__filename) };
const targetFile = path.join(folder, 'AUDIT.json');
fs.writeFileSync(targetFile, JSON.stringify(audit, null, 2) + '\n', { flag: 'wx' });
console.info(JSON.stringify({ audit: path.relative(ROOT, targetFile).replaceAll('\\', '/'), checks: checks.length, failed: checks.filter(item => !item.passed).length, levels }));
