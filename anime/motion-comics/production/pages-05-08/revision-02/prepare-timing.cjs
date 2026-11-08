/* Targeted revision: retain every voice and page duration; delay the glass reaction only. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../../../core.js');
const sequence = require('../../../sequence.js');
const { ROOT } = require('../../../project.cjs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const previous = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01');
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-02');
const contractFile = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/revision-02/CONTRACTS.json');
const old = read(path.join(previous, 'timing-r1-v5.json'));
const pages = structuredClone(old.pageData);
pages[0].panels.find(panel => panel.id === 'p05-c04').leadInSeconds = 0.7;
if (Math.abs(core.buildTimeline(pages[0]).tracks.at(-2).start - 16.6) > 1e-8) throw Error('Moteur leadInSeconds .70 requis avant ce calcul.');
const descriptor = { kind: sequence.KIND, schemaVersion: 1, version: 1, title: old.title ?? 'HOLT — reprise ciblée',
  pages: old.pages.map(page => ({ id: page.id, manifest: `${page.id}.json` })) };
const timeline = sequence.buildSequence(descriptor, pages);
timeline.tracks = timeline.tracks.map((track, index) => {
  const previousTrack = old.tracks[index];
  if (track.audio !== previousTrack.audio || Math.abs(track.end - track.start - (previousTrack.end - previousTrack.start)) > 1e-8) throw Error('Voix modifiée.');
  return { ...track, id: previousTrack.id, globalLine: previousTrack.globalLine, audioFile: previousTrack.audioFile };
});
for (const page of timeline.pages) {
  page.panels = pages[page.index].panels.map(panel => panel.id);
  page.segments = page.segments.map(segment => ({ ...segment, panelId: segment.panel >= 0 ? page.panels[segment.panel] : null,
    holdStart: segment.panel >= 0 ? segment.start + pages[page.index].transitionSeconds : null }));
  if (Math.abs(page.duration - old.pages[page.index].duration) > 1e-8) throw Error('Durée de page changée.');
}
const events = structuredClone(old.events);
const shot = events.find(event => event.id === 'shot'); shot.time = shot.pageTime = 16.4;
if (Math.abs(timeline.duration - 82) > 1e-8) throw Error('Lot attendu de 82 secondes.');
const result = { schemaVersion: 1, revision: 1, contractSha256: hash(contractFile), source: relative(contractFile),
  previousTiming: relative(path.join(previous, 'timing-r1-v5.json')), previousTimingSha256: hash(path.join(previous, 'timing-r1-v5.json')),
  ...timeline, pageData: pages, events, historicalDuration: old.historicalDuration, fullDuration: old.historicalDuration + timeline.duration,
  note: 'Temps lot 5–8 : vitre intacte pendant transition et tenue 15.90–16.40 ; bris16.40, réaction27=16.60. Voix inchangées, leadInSeconds .70, lot82s.' };
fs.mkdirSync(base, { recursive: true });
const target = path.join(base, 'timing-r2-v1.json'); fs.writeFileSync(target, JSON.stringify(result, null, 2), { flag: 'wx' });
console.info(JSON.stringify({ target, duration: result.duration, fullDuration: result.fullDuration, shot, reactions: timeline.tracks.filter(track => ['bp-l027', 'bp-l017'].includes(track.id)) }, null, 2));
