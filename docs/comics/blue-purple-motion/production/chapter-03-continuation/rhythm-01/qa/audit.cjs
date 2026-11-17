/* Independent semantic audit: derive the edit from v10 rather than the retimer. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '../../../../../../..');
const core = require(path.join(ROOT, 'anime/motion-comics/core.js'));
const sequence = require(path.join(ROOT, 'anime/motion-comics/sequence.js'));
const DOC = 'docs/comics/blue-purple-motion/production/chapter-03-continuation/rhythm-01';
const MASTER = 'art-masters/motion-comics/blue-purple/chapter-03-continuation/rhythm-01/qa';
const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
const approx = (a, b, label) => assert(Math.abs(a - b) < 1e-8, `${label}: ${a} != ${b}`);
function independentMap(oldData, newData, time) {
  const before = core.buildTimeline(oldData), after = core.buildTimeline(newData);
  const overview = oldData.overviewSeconds ?? core.DEFAULTS.overviewSeconds;
  const oldTransition = oldData.transitionSeconds ?? core.DEFAULTS.transitionSeconds;
  const newTransition = newData.transitionSeconds ?? core.DEFAULTS.transitionSeconds;
  if (time <= overview) return 0;
  for (let index = 0; index < oldData.panels.length; index++) {
    const a = before.segments.find(s => s.panel === index), b = after.segments.find(s => s.panel === index);
    if (time <= a.start + oldTransition) return b.start + (time - a.start) * newTransition / oldTransition;
    if (time <= a.end) return b.start + newTransition + time - a.start - oldTransition;
  }
  return after.duration;
}
function normalize(data) {
  data = structuredClone(data);
  delete data.overviewSeconds; delete data.outroSeconds; delete data.transitionSeconds; delete data.provenance;
  for (const fx of data.effects ?? []) {
    delete fx.startSeconds; delete fx.endSeconds; delete fx.envelope;
  }
  for (const layer of data.motionLayers ?? []) {
    delete layer.startSeconds; delete layer.endSeconds;
    for (const item of [...layer.frames, ...(layer.keyframes ?? []), ...(layer.impact ? [layer.impact] : [])]) delete item.atSeconds;
    if (layer.reveal) delete layer.reveal.durationSeconds;
  }
  for (const reveal of data.panelReveals ?? []) delete reveal.atSeconds;
  if (data.review) delete data.review.sampleTime;
  return data;
}
function main(output = `${MASTER}/static-v1`) {
  const destination = path.resolve(ROOT, output), allowed = path.resolve(ROOT, MASTER);
  assert(destination.startsWith(allowed + path.sep) && !fs.existsSync(destination), 'Nouveau dossier de preuves QA requis.');
  fs.mkdirSync(destination, { recursive: true });
  const report = { status: 'running', date: '2026-11-17', source: '', target: '', checks: [], alteredNonActionWindows: [] };
  const check = (label, run, evidence) => { run(); report.checks.push({ label, status: 'passed', ...evidence }); };
  try {
    const contract = read(`${DOC}/TIMING.json`), source = read(contract.sourceManifest), target = read(contract.targetManifest);
    report.source = { path: contract.sourceManifest, sha256: hash(contract.sourceManifest) };
    report.target = { path: contract.targetManifest, sha256: hash(contract.targetManifest) };
    check('Sélections et sources v10 intactes', () => {
      assert.equal(hash(contract.sourceManifest), 'd180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce');
      assert.equal(hash(contract.targetManifest), contract.targetSha256);
      for (const item of contract.sourceLocks) assert.equal(hash(item.file), item.sha256, item.file);
    }, { dependencies: contract.sourceLocks.length });
    const from = path.posix.dirname(contract.sourceManifest), to = path.posix.dirname(contract.targetManifest);
    const oldPages = source.pages.map(p => read(path.posix.join(from, p.manifest)));
    const newPages = target.pages.map(p => read(path.posix.join(to, p.manifest)));
    const before = sequence.buildSequence(source, oldPages), after = sequence.buildSequence(target, newPages);
    report.duration = after.duration; report.savedSeconds = before.duration - after.duration;
    check('Couverture12s,21pages,99prises,491.9s', () => {
      assert.equal(target.version, 11); assert.equal(after.pages.length, 22); assert.equal(after.tracks.length, 99);
      approx(before.duration, 584.3, 'Ancienne durée'); approx(after.duration, 491.9, 'Nouvelle durée');
      approx(before.duration - after.duration, 92.4, 'Temps retiré');
      assert.deepEqual(newPages[0], oldPages[0]); approx(after.pages[0].duration, 12, 'Couverture');
    });
    newPages.forEach((next, pageIndex) => {
      const old = oldPages[pageIndex], a = before.pages[pageIndex], b = after.pages[pageIndex];
      const map = time => pageIndex ? independentMap(old, next, time) : time;
      check(`${b.id}: seuls les temps autorisés changent`, () => {
        assert.deepEqual(normalize(next), normalize(old));
        assert.deepEqual(core.assetPaths(next), core.assetPaths(old));
        assert.deepEqual(next.panels, old.panels);
        if (pageIndex) {
          assert.equal(next.overviewSeconds, 0); assert.equal(next.outroSeconds, 0);
          approx(next.transitionSeconds, pageIndex >= 5 && pageIndex <= 8 ? 0.3 : 0.4, 'Transition');
          assert(b.segments.every(s => s.panel >= 0));
          assert.equal(b.segments[0].panel, 0); assert.equal(b.segments[0].start, 0);
          assert.equal(b.segments.at(-1).panel, next.panels.length - 1);
          approx(b.segments.at(-1).end, b.duration, 'Dernière case');
        }
        approx(b.start, contract.pages[pageIndex].newStart, 'Début global');
        approx(b.duration, contract.pages[pageIndex].newDuration, 'Durée');
      }, { panels: next.panels.length, transitionSeconds: next.transitionSeconds });
      check(`${b.id}: voix natives et temps de lecture préservés`, () => {
        for (let panel = 0; panel < next.panels.length; panel++) {
          const oldSegment = a.segments.find(s => s.panel === panel), newSegment = b.segments.find(s => s.panel === panel);
          const oldTransition = old.transitionSeconds ?? core.DEFAULTS.transitionSeconds;
          const newTransition = next.transitionSeconds ?? core.DEFAULTS.transitionSeconds;
          approx(oldSegment.end - oldSegment.start - oldTransition, newSegment.end - newSegment.start - newTransition, 'Tenue');
          const oldTracks = before.tracks.filter(t => t.page === pageIndex && t.panel === panel), newTracks = after.tracks.filter(t => t.page === pageIndex && t.panel === panel);
          assert.equal(oldTracks.length, newTracks.length);
          oldTracks.forEach((track, index) => {
            const newTrack = newTracks[index];
            assert.equal(newTrack.audio, track.audio); assert.equal(newTrack.speaker, track.speaker);
            approx(newTrack.end - newTrack.start, track.end - track.start, 'Durée vocale');
            approx(newTrack.start, b.start + map(track.start - a.start), 'Ancre vocale');
            assert(newTrack.end <= b.start + newSegment.end + 1e-8, 'Prise coupée');
          });
        }
      });
      check(`${b.id}: gestes, effets et révélations recalés`, () => {
        (old.effects ?? []).forEach((fx, i) => {
          const actual = next.effects[i];
          if (fx.startSeconds !== undefined) approx(actual.startSeconds, map(fx.startSeconds), 'Début effet');
          if (fx.endSeconds !== undefined) {
            approx(actual.endSeconds, map(fx.endSeconds), 'Fin effet');
            const delta = actual.endSeconds - (actual.startSeconds ?? 0) - fx.endSeconds + (fx.startSeconds ?? 0);
            if (Math.abs(delta) > 1e-8) report.alteredNonActionWindows.push({ page: b.id, type: fx.type, old: [fx.startSeconds ?? 0, fx.endSeconds], new: [actual.startSeconds ?? 0, actual.endSeconds], deltaSeconds: delta, frequencyUnchanged: actual.frequency === fx.frequency });
          }
          if (fx.envelope) {
            approx(actual.envelope.attackSeconds, map(fx.startSeconds + fx.envelope.attackSeconds) - map(fx.startSeconds), 'Attaque');
            approx(actual.envelope.releaseSeconds, map(fx.endSeconds) - map(fx.endSeconds - fx.envelope.releaseSeconds), 'Sortie');
          }
        });
        (old.motionLayers ?? []).forEach((layer, i) => {
          const actual = next.motionLayers[i];
          approx(actual.startSeconds, map(layer.startSeconds), 'Début action');
          approx(actual.endSeconds, map(layer.endSeconds), 'Fin action');
          approx(actual.endSeconds - actual.startSeconds, layer.endSeconds - layer.startSeconds, 'Durée du geste');
          for (const collection of ['frames', 'keyframes']) (layer[collection] ?? []).forEach((key, index) => approx(actual[collection][index].atSeconds, key.atSeconds, 'Vitesse du dessin/clé'));
          if (layer.impact) approx(actual.impact.atSeconds, layer.impact.atSeconds, 'Impact relatif');
          if (layer.reveal) approx(actual.reveal.durationSeconds, layer.reveal.durationSeconds, 'Durée de révélation');
        });
        (old.panelReveals ?? []).forEach((reveal, i) => approx(next.panelReveals[i].atSeconds, map(reveal.atSeconds), 'Révélation de case'));
        if (old.review?.sampleTime !== undefined) approx(next.review.sampleTime, map(old.review.sampleTime), 'Échantillon de revue');
      });
    });
    check('21raccords sans trou ni pleinepage automatique', () => {
      for (let i = 1; i < after.pages.length; i++) {
        const previous = after.pages[i - 1], next = after.pages[i];
        approx(previous.end, next.start, 'Raccord');
        assert.equal(sequence.pageAt(after, next.start - 1e-6).index, i - 1);
        assert.equal(sequence.pageAt(after, next.start).index, i);
        assert.equal(next.segments[0].panel, 0);
      }
    }, { boundaries: 21 });
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.error = error.stack;
  }
  fs.writeFileSync(path.join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.info(JSON.stringify({ status: report.status, checks: report.checks.length, duration: report.duration, output: path.relative(ROOT, destination).replaceAll('\\', '/') }));
  if (report.status !== 'passed') { console.error(report.error); process.exitCode = 1; }
  return report;
}
if (require.main === module) main(process.argv[2]);
module.exports = { independentMap, main };
