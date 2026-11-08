/* New isolated candidates; root alone publishes selected manifests. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../../../core.js');
const { ROOT } = require('../../../project.cjs');
const { readDocument } = require('../../../sequence.cjs');
const args = process.argv.slice(2), revision = Number(args.shift() ?? 1), requested = args.map(Number);
if (!Number.isInteger(revision) || revision < 1 || requested.some(number => ![5, 6, 7, 8].includes(number))) throw Error('Usage : prepare-candidates.cjs REVISION [5 6 7 8]');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rootRelative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-02');
const docs = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/revision-02');
const contractFile = path.join(docs, 'CONTRACTS.json'), timingFile = path.join(base, 'timing-r2-v1.json');
const timing = read(timingFile), soundtrackFile = path.join(base, 'soundtrack-v1/report.json'), soundtrack = read(soundtrackFile);
if (timing.contractSha256 !== hash(contractFile)) throw Error('Contrat changé depuis le gel temporel.');
if (soundtrack.timingSha256 !== hash(timingFile)) throw Error('Prémix calculé sur une autre chronologie.');
const directory = path.join(base, `candidates${requested.length ? '-p' + requested.map(number => String(number).padStart(2, '0')).join('-') : ''}-v${revision}`);
if (fs.existsSync(directory)) throw Error('Refus de réutiliser un dossier candidat.');
fs.mkdirSync(directory);
const relative = file => path.relative(directory, path.resolve(ROOT, file)).replaceAll('\\', '/');
const save = (name, data) => { const file = path.join(directory, name); fs.writeFileSync(file, JSON.stringify(data, null, 2), { flag: 'wx' }); readDocument(file); };
const music = file => {
  const proof = soundtrack.files.find(item => item.audio === file);
  if (!proof?.decoded || proof.sha256 !== hash(path.resolve(ROOT, file))) throw Error(`Prémix invalide : ${file}`);
  return { audio: relative(file), gain: 1, preMixed: true };
};
const selected = [];
for (const number of [5, 6, 7, 8].filter(number => !requested.length || requested.includes(number))) {
  const id = String(number).padStart(2, '0');
  const previousFile = path.join(ROOT, `anime/motion-comics/projects/blue-purple-page${id}-v3.json`);
  const previous = read(previousFile);
  const data = core.rebaseAssets(previous, file => rootRelative(path.resolve(path.dirname(previousFile), file)));
  for (const panel of data.panels) for (const cue of panel.cues) cue.takeJournal = rootRelative(path.resolve(path.dirname(previousFile), cue.takeJournal));
  data.version = revision; data.title = `HOLT — Blue Purple · page ${number} · révision 2`;
  data.panels.forEach((panel, index) => { const value = timing.pageData[number - 5].panels[index].leadInSeconds; if (value !== undefined) panel.leadInSeconds = value; });
  if (number !== 7) {
    const plan = read(path.join(docs, `effects-plans/page-${id}.json`));
    if (plan.sourceSha256 !== hash(path.resolve(ROOT, plan.sourceImage))) throw Error(`Source animée différente page ${id}.`);
    data.image = plan.sourceImage; data.effects = structuredClone(plan.effects); data.protectedRegions = structuredClone(plan.protectedRegions);
    data.motionLayers = structuredClone(plan.motionLayers ?? []); data.review = structuredClone(plan.review);
    for (const field of ['motionBaseImage', 'letteringImage']) { if (data.motionLayers.length) data[field] = plan[field] ?? data[field]; else delete data[field]; }
  }
  if (number === 5) data.storyThumbnail = true;
  const timeline = core.buildTimeline(data);
  const holdStart = panelId => timeline.segments.find(segment => segment.panel >= 0 && data.panels[segment.panel].id === panelId).start + data.transitionSeconds;
  for (const item of [...data.effects, ...data.motionLayers ?? []]) {
    if (item.startOffsetSeconds !== undefined) { item.startSeconds = holdStart(item.panelId) + item.startOffsetSeconds; delete item.startOffsetSeconds; }
    if (item.endOffsetSeconds !== undefined) { item.endSeconds = holdStart(item.panelId) + item.endOffsetSeconds; delete item.endOffsetSeconds; }
  }
  for (const review of data.review?.perPanelReview ?? []) if (review.sampleOffsetSeconds !== undefined) review.sampleTime = holdStart(review.panelId) + review.sampleOffsetSeconds;
  if (data.review?.perPanelReview?.length) data.review.sampleTime = data.review.perPanelReview[0].sampleTime;
  if (Math.abs(core.buildTimeline(data).duration - timing.pages[number - 5].duration) > 1e-8) throw Error('Durée différente du gel.');
  data.provenance = { revision: 2, previousManifest: rootRelative(previousFile), previousManifestSha256: hash(previousFile),
    contract: rootRelative(contractFile), contractSha256: timing.contractSha256, timing: rootRelative(timingFile),
    imageSha256: hash(path.resolve(ROOT, data.image)), soundtrack: rootRelative(soundtrackFile), humanListeningApproval: false };
  const candidate = core.rebaseAssets(data, relative);
  for (const panel of candidate.panels) for (const cue of panel.cues) cue.takeJournal = relative(cue.takeJournal);
  save(`page-${id}.json`, candidate); selected.push({ id: `page-${id}`, manifest: `page-${id}.json` });
  const backing = soundtrack.pageBackings.find(item => item.name === `backing-page-${id}.wav`);
  save(`page-${id}-with-music.json`, { kind: 'motion-comic-sequence', schemaVersion: 1, version: revision, title: candidate.title,
    pages: [selected.at(-1)], music: music(backing.audio), provenance: candidate.provenance });
  console.info(JSON.stringify({ page: number, duration: timeline.duration, layers: data.motionLayers?.length ?? 0, image: data.image }));
}
if (selected.length === 4) {
  const sequence = (title, pages, backing) => ({ kind: 'motion-comic-sequence', schemaVersion: 1, version: revision, title, pages,
    music: music(backing), provenance: { revision: 2, timing: rootRelative(timingFile), contractSha256: timing.contractSha256, humanListeningApproval: false } });
  save('pages-05-08.json', sequence('HOLT — Blue Purple · pages 5 à 8 · révision 2', selected, soundtrack.newLot));
  const historical = readDocument(path.join(ROOT, 'anime/motion-comics/projects/blue-purple-pages01-04-v4.json'));
  const retained = historical.pages.map(page => ({ id: page.id, manifest: relative(rootRelative(page.manifestFile)) }));
  save('pages-01-08.json', sequence('HOLT — Blue Purple · pages 1 à 8 · révision 2', [...retained, ...selected], soundtrack.full));
}
