/* Timing from measured voices and the approved reading/action contract, independent of new art. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT } = require('../../../project.cjs');
const { buildTimeline } = require('../../../core.js');
const { buildSequence } = require('../../../sequence.js');
const { readDocument } = require('../../../sequence.cjs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const contractFile = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/revision-01/CONTRACTS.json');
const contract = read(contractFile);
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01');
const measures = read(path.join(base, 'audio-v1/prepared-measurements.json'));
const pacing = contract.pacing;
const revision = Number(process.argv[2] ?? 1);
if (!Number.isInteger(revision) || revision < 1) throw Error('Révision positive requise.');
const pages = contract.pages.map(page => ({ schemaVersion: 1, version: 1, title: page.title,
  image: `page-${page.page}.png`, overviewSeconds: pacing.overviewSeconds, transitionSeconds: pacing.transitionSeconds,
  gapSeconds: pacing.gapSeconds, outroSeconds: pacing.outroSeconds,
  panels: page.panels.map(panel => ({ id: panel.id, label: panel.id, rect: panel.rect, holdSeconds: panel.minimumReadSeconds,
    cues: panel.cues.map(cue => {
      const take = measures.cues.find(item => item.id === cue.id);
      if (!take || take.speaker !== cue.speaker || take.textEn !== cue.textEn || take.textFr !== cue.textFr || take.decodeExit !== 0 || hash(path.resolve(ROOT, take.audio)) !== take.sha256) throw Error(`Voix incohérente : ${cue.id}`);
      return { id: cue.id, globalLine: cue.globalLine, speaker: cue.speaker, textFr: cue.textFr, textEn: cue.textEn,
        audio: take.audio, duration: take.duration, ...(cue.gapSeconds !== undefined ? { gapSeconds: cue.gapSeconds } : {}) };
    }) })) }));
const descriptor = { kind: 'motion-comic-sequence', schemaVersion: 1, version: 1, title: contract.title,
  pages: contract.pages.map(page => ({ id: `page-${String(page.page).padStart(2, '0')}`, manifest: `page-${page.page}.json` })) };
const timeline = buildSequence(descriptor, pages);
timeline.tracks = timeline.tracks.map(track => {
  const page = pages[track.page], panel = page.panels[track.panel];
  const local = buildTimeline(page), localIndex = local.tracks.findIndex(item => item.panel === track.panel && Math.abs(item.start + timeline.pages[track.page].start - track.start) < 1e-6);
  const flat = page.panels.flatMap(p => p.cues), cue = flat[localIndex];
  if (!cue || !panel.cues.some(item => item.id === cue.id)) throw Error('Index de voix incohérent.');
  return { ...track, id: cue.id, globalLine: cue.globalLine, audioFile: path.resolve(ROOT, cue.audio) };
});
for (const page of timeline.pages) {
  page.panels = pages[page.index].panels.map(panel => panel.id);
  page.segments = page.segments.map(segment => ({ ...segment, panelId: segment.panel >= 0 ? page.panels[segment.panel] : null,
    holdStart: segment.panel >= 0 ? segment.start + pacing.transitionSeconds : null }));
}
const segment = id => {
  const page = timeline.pages.find(item => item.panels.includes(id));
  const local = page.segments.find(item => item.panelId === id);
  return { pageId: page.id, panelId: id, pageStart: page.start, cut: page.start + local.start, hold: page.start + local.holdStart, end: page.start + local.end };
};
const event = (id, panelId, time) => { const region = segment(panelId); return { id, panelId, pageId: region.pageId, time, pageTime: time - region.pageStart }; };
const warning = timeline.tracks.find(track => track.id === 'bp-l025');
const contact = warning.end + 0.12;
const bluff = timeline.tracks.find(track => track.id === 'bp-l020');
const events = [event('punchContact', 'p05-c03', contact), event('punchRecoil', 'p05-c03', warning.end + 0.24), event('punchDown', 'p05-c03', warning.end + 0.56),
  event('shot', 'p05-c04', segment('p05-c04').cut + 0.15), event('retreatSteps', 'p06-c01', segment('p06-c01').hold + 0.1),
  event('rearExit', 'p06-c03', segment('p06-c03').hold + 1), event('parkingLatch', 'p07-c02', bluff.end + 0.15),
  event('lockClick', 'p08-c01', segment('p08-c01').hold + 0.25), event('starter', 'p08-c02', segment('p08-c02').hold + 0.1),
  event('doorClose', 'p08-c04', segment('p08-c04').cut), event('departure', 'p08-c04', segment('p08-c04').hold + 0.2)];
const historical = readDocument(path.join(ROOT, 'anime/motion-comics/projects/blue-purple-pages01-04-v4.json'));
const result = { schemaVersion: 1, revision, contractSha256: hash(contractFile), source: path.relative(ROOT, contractFile).replaceAll('\\', '/'),
  ...timeline, pageData: pages, events, historicalDuration: historical.timeline.duration,
  fullDuration: historical.timeline.duration + timeline.duration, note: 'Temps du lot 5–8 ; page.segments sont locaux, tracks et events sont globaux au lot. Ajouter historicalDuration pour le complet.' };
const target = path.join(base, `timing-r1-v${revision}.json`); fs.writeFileSync(target, JSON.stringify(result, null, 2), { flag: 'wx' });
console.info(JSON.stringify({ target, duration: timeline.duration, fullDuration: result.fullDuration, speech: measures.speechSeconds, events }, null, 2));
