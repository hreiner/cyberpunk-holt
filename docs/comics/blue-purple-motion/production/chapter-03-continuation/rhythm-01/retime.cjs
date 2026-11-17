/* Remove automatic page overviews; shift held actions and speech without stretching. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../../../../../..');
const core = require(path.join(ROOT, 'anime/motion-comics/core.js'));
const sequence = require(path.join(ROOT, 'anime/motion-comics/sequence.js'));
const { readDocument } = require(path.join(ROOT, 'anime/motion-comics/sequence.cjs'));
const SOURCE = 'anime/motion-comics/projects/blue-purple-pages01-21-v10.json';
const TARGET = 'anime/motion-comics/projects/blue-purple-pages01-21-v11.json';
const BACKING = 'art-masters/motion-comics/blue-purple/chapter-03-continuation/rhythm-01/audio/backing-cover-and-pages01-21.wav';
const rel = file => path.relative(ROOT, file).replaceAll('\\', '/');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function write(file, value) {
  const text = JSON.stringify(value, null, 2) + '\n';
  if (fs.existsSync(file)) {
    if (fs.readFileSync(file, 'utf8') !== text) throw Error('Sortie existante différente : ' + file);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, { flag: 'wx' });
}
function mapTime(points, time) {
  if (!Number.isFinite(time)) throw Error('Temps fini requis.');
  if (time <= points[0].old) return points[0].new;
  for (let i = 1; i < points.length; i++) {
    if (time <= points[i].old + 1e-9) {
      const a = points[i - 1], b = points[i];
      return b.old === a.old ? b.new : a.new + (time - a.old) * (b.new - a.new) / (b.old - a.old);
    }
  }
  return points.at(-1).new;
}
function retime(source) {
  const old = core.buildTimeline(source), data = structuredClone(source);
  data.overviewSeconds = 0; data.outroSeconds = 0;
  data.transitionSeconds = Math.min(source.transitionSeconds ?? core.DEFAULTS.transitionSeconds, 0.4);
  // Action clocks must be rebased before validating against the shorter page.
  const skeleton = structuredClone(data);
  delete skeleton.effects; delete skeleton.motionLayers; delete skeleton.panelReveals; delete skeleton.review;
  const next = core.buildTimeline(skeleton), points = [{ old: 0, new: 0, label: 'page-start' }];
  const point = (a, b, label) => {
    const previous = points.at(-1);
    if (Math.abs(previous.old - a) < 1e-9) {
      if (Math.abs(previous.new - b) > 1e-8) throw Error('Correspondance ambiguë : ' + label);
    } else points.push({ old: a, new: b, label });
  };
  point(source.overviewSeconds ?? core.DEFAULTS.overviewSeconds, 0, 'overview-removed');
  source.panels.forEach((panel, index) => {
    const a = old.segments.find(s => s.panel === index), b = next.segments.find(s => s.panel === index);
    point(a.start, b.start, panel.id + ':camera-start');
    point(a.start + (source.transitionSeconds ?? core.DEFAULTS.transitionSeconds), b.start + data.transitionSeconds, panel.id + ':ready');
    point(a.end, b.end, panel.id + ':end');
  });
  point(old.duration, next.duration, 'outro-removed');
  const map = time => mapTime(points, time);
  for (const fx of data.effects ?? []) {
    const start = fx.startSeconds ?? 0, end = fx.endSeconds;
    if (fx.startSeconds !== undefined) fx.startSeconds = map(start);
    if (end !== undefined) fx.endSeconds = map(end);
    if (fx.envelope) {
      fx.envelope.attackSeconds = map(start + fx.envelope.attackSeconds) - map(start);
      fx.envelope.releaseSeconds = map(end) - map(end - fx.envelope.releaseSeconds);
    }
  }
  for (const layer of data.motionLayers ?? []) {
    const start = layer.startSeconds;
    layer.startSeconds = map(start); layer.endSeconds = map(layer.endSeconds);
    for (const item of [...layer.frames, ...(layer.keyframes ?? []), ...(layer.impact ? [layer.impact] : [])]) {
      item.atSeconds = map(start + item.atSeconds) - layer.startSeconds;
    }
    if (layer.reveal) layer.reveal.durationSeconds = map(start + layer.reveal.durationSeconds) - layer.startSeconds;
  }
  for (const reveal of data.panelReveals ?? []) reveal.atSeconds = map(reveal.atSeconds);
  if (data.review?.sampleTime !== undefined) data.review.sampleTime = map(data.review.sampleTime);
  core.buildTimeline(data);
  return { data, points, oldTimeline: old, newTimeline: core.buildTimeline(data) };
}
function build() {
  const source = readDocument(path.join(ROOT, SOURCE));
  const data = structuredClone(source.data); data.version = 11;
  data.music.audio = rel(path.join(ROOT, BACKING)).replace(/^/, '../../../');
  data.provenance = { ...data.provenance, previousSelection: path.basename(SOURCE), revision: rel(__dirname), engine: '1.4.1', timing: rel(path.join(__dirname, 'TIMING.json')) };
  const converted = source.pages.map((page, index) => {
    if (index === 0) return { data: page.data, points: [{ old: 0, new: 0 }, { old: page.timeline.duration, new: page.timeline.duration }], oldTimeline: page.timeline, newTimeline: page.timeline };
    return retime(page.data);
  });
  const timeline = sequence.buildSequence(data, converted.map(page => page.data));
  const pages = source.pages.map((page, index) => {
    const entry = converted[index], old = source.timeline.pages[index], next = timeline.pages[index];
    const manifest = index === 0 ? page.manifestFile : path.join(path.dirname(page.manifestFile), `blue-purple-page${String(index).padStart(2, '0')}-rhythm01.json`);
    if (index !== 0) {
      entry.data.provenance = { ...entry.data.provenance, rhythmSource: rel(page.manifestFile), rhythm: rel(__dirname) };
      write(manifest, entry.data);
      data.pages[index].manifest = path.basename(manifest);
    }
    return { id: page.id, sourceManifest: rel(page.manifestFile), manifest: rel(manifest), oldStart: old.start, newStart: next.start, oldDuration: old.duration, newDuration: next.duration, points: entry.points,
      tracks: timeline.tracks.filter(track => track.page === index).map(track => ({ ...track, audioFile: rel(path.resolve(path.dirname(manifest), track.audio)) })) };
  });
  write(path.join(ROOT, TARGET), data);
  const contract = { schemaVersion: 1, version: 11, date: '2026-11-17', sourceManifest: SOURCE, sourceSha256: hash(path.join(ROOT, SOURCE)), targetManifest: TARGET, targetSha256: hash(path.join(ROOT, TARGET)), oldDuration: source.timeline.duration, duration: timeline.duration, savedSeconds: source.timeline.duration - timeline.duration,
    settings: { transitionSeconds: 0.4, fasterExistingTransitionsPreserved: true, overviewSeconds: 0, outroSeconds: 0, nativeVoices: true, unchangedHoldsAndGaps: true }, backing: BACKING, pages,
    sourceLocks: [{ file: SOURCE, sha256: hash(path.join(ROOT, SOURCE)) }, ...source.files.map(file => ({ file: rel(file), sha256: hash(file) }))] };
  write(path.join(__dirname, 'TIMING.json'), contract);
  return { duration: contract.duration, savedSeconds: contract.savedSeconds, voices: timeline.tracks.length, pages: pages.length };
}
if (require.main === module) console.info(JSON.stringify(build()));
module.exports = { retime, mapTime, build };
