/* Integrate only real measured takes and selected page images into new candidates. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT } = require('../../project.cjs');
const { buildTimeline } = require('../../core.js');
const { readDocument } = require('../../sequence.cjs');
const stage = process.argv[2];
if (!['stage0', 'stage1'].includes(stage)) throw Error('Usage : prepare-candidates.cjs stage0|stage1');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const contractFile = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/CONTRACTS.json');
const contract = read(contractFile);
const argumentsAfterStage = process.argv.slice(3);
const revisionOption = argumentsAfterStage.indexOf('--revision');
const revision = revisionOption < 0 ? 1 : Number(argumentsAfterStage[revisionOption + 1]);
if (!Number.isInteger(revision) || revision < 1) throw Error('--revision : entier positif attendu.');
if (revisionOption >= 0) argumentsAfterStage.splice(revisionOption, 2);
const requestedPages = argumentsAfterStage.map(Number);
if (requestedPages.some(page => ![5, 6, 7, 8].includes(page))) throw Error('Pages attendues : 5 à 8.');
const pages = requestedPages.length ? contract.pages.filter(page => requestedPages.includes(page.page)) : contract.pages;
const measurements = read(path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/prepared-measurements.json'));
const partial = requestedPages.length ? `-p${requestedPages.map(page => String(page).padStart(2, '0')).join('-')}` : '';
const directory = path.join(ROOT, `art-masters/motion-comics/blue-purple/pages-01-08/candidates-${stage}${partial}-v${revision}`);
if (fs.existsSync(directory)) throw Error('Les candidats de cette étape existent déjà.');
fs.mkdirSync(directory);
const relative = file => path.relative(directory, file).replaceAll('\\', '/');
const save = (name, data) => {
  const file = path.join(directory, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), { flag: 'wx' });
  readDocument(file);
  return file;
};
const selected = [];
const labels = { 5: ['Le signe', 'L’homme dehors', 'Le passage dégagé', 'La vitre brisée'],
  6: ['Le poursuivant recule', 'Éviter les caméras', 'Par la ruelle'],
  7: ['Le parking', 'Le bluff', 'Entre les voitures'],
  8: ['La serrure', 'Au volant', 'Tout le monde monte', 'Les petites rues'] };
for (const page of pages) {
  const id = String(page.page).padStart(2, '0');
  const pageDirectory = path.join(ROOT, `art-masters/motion-comics/blue-purple/page-${id}`);
  const assembly = read(path.join(pageDirectory, 'assembly-spec-v1.json'));
  const image = path.join(pageDirectory, `page-v${assembly.version}.png`);
  const data = { schemaVersion: 1, version: revision, title: `HOLT — Blue Purple · page ${page.page} · ${page.title}`,
    image: relative(image), overviewSeconds: 2, transitionSeconds: 0.85, gapSeconds: 0.6, outroSeconds: 2,
    panels: page.panels.map((panel, index) => ({ id: panel.id, label: `Case ${index + 1} — ${labels[page.page][index]}`, rect: panel.rect,
      holdSeconds: panel.minimumReadSeconds, cues: panel.cues.map(cue => {
        const take = measurements.cues.find(item => item.id === cue.id);
        if (!take || take.textFr !== cue.textFr || take.textEn !== cue.textEn || take.speaker !== cue.speaker || take.decodeExit !== 0 || take.ttsModel !== 'eleven_v4') throw Error(`Prise incohérente : ${cue.id}`);
        const audio = path.resolve(ROOT, take.audio);
        if (hash(audio) !== take.sha256) throw Error(`Prise modifiée : ${cue.id}`);
        return { id: cue.id, globalLine: cue.globalLine, speaker: cue.speaker, audio: relative(audio), duration: take.duration,
          textFr: cue.textFr, textEn: cue.textEn, ttsText: take.ttsText, ttsModel: 'eleven_v4', takeJournal: relative(path.resolve(ROOT, take.takeJournal)) };
      }) })),
    source: contract.source.join(' ; '), provenance: { contract: path.relative(ROOT, contractFile), imageSha256: hash(image), candidateStage: stage,
      audio: 'Prises Eleven v4 réellement mesurées et décodées ; voir AUDIO.md et journaux.', humanApproval: false } };
  const timing = buildTimeline(data);
  const heldStart = panelId => timing.segments.find(segment => segment.panel >= 0 && data.panels[segment.panel].id === panelId).start + data.transitionSeconds;
  if (stage === 'stage1') {
    const planFile = path.join(ROOT, `docs/comics/blue-purple-motion/production/pages-05-08/effects-plans/page-${id}.json`);
    const plan = read(planFile);
    if (plan.sourceSha256 !== hash(image)) throw Error(`Image différente du plan d’effets page ${id}.`);
    data.effects = structuredClone(plan.effects).map(effect => {
      if (effect.startOffsetSeconds !== undefined) { effect.startSeconds = heldStart(effect.panelId) + effect.startOffsetSeconds; delete effect.startOffsetSeconds; }
      if (effect.endOffsetSeconds !== undefined) { effect.endSeconds = heldStart(effect.panelId) + effect.endOffsetSeconds; delete effect.endOffsetSeconds; }
      return effect;
    });
    data.protectedRegions = plan.protectedRegions;
    data.review = structuredClone(plan.review);
    for (const review of data.review.perPanelReview ?? []) if (review.sampleOffsetSeconds !== undefined) review.sampleTime = heldStart(review.panelId) + review.sampleOffsetSeconds;
    if (data.review.perPanelReview?.length) data.review.sampleTime = data.review.perPanelReview[0].sampleTime;
    data.provenance.effects = path.relative(ROOT, planFile);
  }
  const name = `page-${id}.json`;
  save(name, data);
  selected.push({ id: `page-${id}`, manifest: name });
  console.info(JSON.stringify({ page: page.page, duration: buildTimeline(data).duration, image, effects: data.effects?.length ?? 0 }));
}
const music = { audio: relative(path.join(ROOT, 'public/assets/audio/background/music-pressure.mp3')), gain: 0.08, fadeSeconds: 0.5 };
const sequence = (title, pages) => ({ kind: 'motion-comic-sequence', schemaVersion: 1, version: revision, title, pages, music, source: contract.source.join(' ; '), provenance: { candidateStage: stage, humanApproval: false } });
if (selected.length === 4) save('pages-05-08.json', sequence('HOLT — Blue Purple · pages 5 à 8', selected));
for (const page of selected) save(`${page.id}-with-music.json`, sequence(`HOLT — Blue Purple · ${page.id}`, [page]));
if (selected.length === 4) {
  const previous = readDocument(path.join(ROOT, 'anime/motion-comics/projects/blue-purple-pages01-04-v4.json'));
  const retained = previous.pages.map(page => ({ id: page.id, manifest: relative(page.manifestFile) }));
  save('pages-01-08.json', sequence('HOLT — Blue Purple · pages 1 à 8', [...retained, ...selected]));
}
