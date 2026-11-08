/* New edition candidates from frozen timing, real art/poses and verified premixed backing. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../../../core.js');
const { ROOT } = require('../../../project.cjs');
const { readDocument } = require('../../../sequence.cjs');
const args = process.argv.slice(2), stage = args.shift();
if (!['stage0', 'stage1', 'stage2'].includes(stage)) throw Error('Usage : prepare-candidates.cjs stage0|stage1|stage2 [5 6 7 8] [--revision N]');
const option = args.indexOf('--revision'), revision = option < 0 ? 1 : Number(args[option + 1]);
if (!Number.isInteger(revision) || revision < 1) throw Error('Révision positive requise.');
if (option >= 0) args.splice(option, 2);
const requested = args.map(Number);
if (requested.some(number => ![5, 6, 7, 8].includes(number))) throw Error('Pages 5 à 8 attendues.');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01');
const docs = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/revision-01');
const contract = read(path.join(docs, 'CONTRACTS.json')), timing = read(path.join(base, 'timing-r1-v5.json'));
if (hash(path.join(docs, 'CONTRACTS.json')) !== timing.contractSha256) throw Error('Contrat changé depuis le gel temporel.');
const voices = read(path.join(base, 'audio-v1/prepared-measurements.json'));
const soundtrack = read(path.join(base, 'soundtrack-v3/report.json'));
const finalAudio = read(path.join(base, 'soundtrack-v3/final-provenance.json'));
if (finalAudio.finalContractSha256 !== timing.contractSha256 || !finalAudio.sameTiming || !finalAudio.backingUnchanged) throw Error('Prémix non raccordé au gel final.');
const directory = path.join(base, `candidates-${stage}${requested.length ? '-p' + requested.map(n => String(n).padStart(2, '0')).join('-') : ''}-v${revision}`);
if (fs.existsSync(directory)) throw Error('Dossier candidat déjà présent.');
fs.mkdirSync(directory);
const rootRelative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const relative = file => path.relative(directory, path.resolve(ROOT, file)).replaceAll('\\', '/');
const save = (name, data) => { const file = path.join(directory, name); fs.writeFileSync(file, JSON.stringify(data, null, 2), { flag: 'wx' }); readDocument(file); return file; };
const music = file => {
  const proof = soundtrack.files.find(item => item.audio === file);
  if (!proof || !proof.decoded || proof.sha256 !== hash(path.resolve(ROOT, file))) throw Error(`Prémix invalide : ${file}`);
  return { audio: relative(file), gain: 1, preMixed: true };
};
const titles = { 5: ['Le signe', 'Les fenêtres', 'John frappe', 'Le tir'], 6: ['Le poursuivant recule', 'Éviter les caméras', 'Tous les six'],
  7: ['Le parking', 'Le bluff', 'Le volant'], 8: ['La serrure', 'Démarrage hésitant', 'Monte', 'Les petites rues'] };
const selected = [];
for (const page of contract.pages.filter(item => !requested.length || requested.includes(item.page))) {
  const id = String(page.page).padStart(2, '0'), pageDirectory = path.join(base, `page-${id}`), spec = read(path.join(pageDirectory, 'assembly-spec-v1.json'));
  const image = path.join(pageDirectory, `page-v${spec.version}.png`);
  const data = structuredClone(timing.pageData[page.page - 5]);
  data.version = revision; data.title = `HOLT — Blue Purple · page ${page.page} · révision 1`;
  data.image = rootRelative(image);
  data.panels.forEach((panel, index) => {
    panel.label = `Case ${index + 1} — ${titles[page.page][index]}`;
    panel.cues = panel.cues.map(cue => {
      const take = voices.cues.find(item => item.id === cue.id);
      if (!take || take.sha256 !== hash(path.resolve(ROOT, take.audio)) || take.decodeExit !== 0 || take.ttsModel !== 'eleven_v4') throw Error(`Voix invalide : ${cue.id}`);
      return { ...cue, audio: take.audio, ttsText: take.ttsText, ttsModel: take.ttsModel, performance: take.performance, takeJournal: take.takeJournal };
    });
  });
  const localTimeline = core.buildTimeline(data);
  const holdStart = panelId => localTimeline.segments.find(segment => segment.panel >= 0 && data.panels[segment.panel].id === panelId).start + data.transitionSeconds;
  if (stage !== 'stage0') {
    const plan = read(path.join(docs, `effects-plans/page-${id}${stage === 'stage2' && page.page === 8 ? '-shadow-v3' : ''}.json`));
    if (plan.sourceSha256 !== hash(image)) throw Error(`Plan d'animation d'un autre dessin page ${id}.`);
    data.effects = structuredClone(plan.effects);
    data.protectedRegions = structuredClone(plan.protectedRegions);
    data.motionLayers = structuredClone(plan.motionLayers ?? []);
    if (data.motionLayers.length) {
      data.motionBaseImage = rootRelative(path.join(pageDirectory, `page-raw-v${spec.version}.png`));
      data.letteringImage = rootRelative(path.join(pageDirectory, `lettering-v${spec.version}.svg`));
    }
    for (const object of [...data.effects, ...data.motionLayers]) {
      if (object.startOffsetSeconds !== undefined) { object.startSeconds = holdStart(object.panelId) + object.startOffsetSeconds; delete object.startOffsetSeconds; }
      if (object.endOffsetSeconds !== undefined) { object.endSeconds = holdStart(object.panelId) + object.endOffsetSeconds; delete object.endOffsetSeconds; }
    }
    data.review = structuredClone(plan.review);
    for (const review of data.review?.perPanelReview ?? []) if (review.sampleOffsetSeconds !== undefined) review.sampleTime = holdStart(review.panelId) + review.sampleOffsetSeconds;
    if (data.review?.perPanelReview?.length) data.review.sampleTime = data.review.perPanelReview[0].sampleTime;
  }
  data.source = contract.source.join(' ; ');
  data.provenance = { revision: 1, previousDelivery: 'docs/comics/blue-purple-motion/production/pages-05-08/DELIVERY.md',
    contract: rootRelative(path.join(docs, 'CONTRACTS.json')), contractSha256: timing.contractSha256,
    timing: rootRelative(path.join(base, 'timing-r1-v5.json')), imageSha256: hash(image),
    soundtrack: rootRelative(path.join(base, 'soundtrack-v3/final-provenance.json')), humanApproval: false };
  const candidate = core.rebaseAssets(data, relative);
  for (const panel of candidate.panels) for (const cue of panel.cues) cue.takeJournal = relative(cue.takeJournal);
  if (Math.abs(core.buildTimeline(candidate).duration - timing.pages[page.page - 5].duration) > 1e-8) throw Error('Chronologie différente du gel audio.');
  save(`page-${id}.json`, candidate);
  selected.push({ id: `page-${id}`, manifest: `page-${id}.json` });
  const backing = soundtrack.pageBackings.find(item => item.name === `backing-page-${id}.wav`);
  save(`page-${id}-with-music.json`, { kind: 'motion-comic-sequence', schemaVersion: 1, version: revision,
    title: candidate.title, pages: [selected.at(-1)], music: music(backing.audio), provenance: candidate.provenance });
  console.info(JSON.stringify({ page: page.page, duration: core.buildTimeline(candidate).duration, image, layers: candidate.motionLayers?.length ?? 0 }));
}
if (selected.length === 4) {
  const sequence = (title, pages, backing) => ({ kind: 'motion-comic-sequence', schemaVersion: 1, version: revision, title, pages, music: music(backing),
    provenance: { contractSha256: timing.contractSha256, timing: rootRelative(path.join(base, 'timing-r1-v5.json')), soundtrack: rootRelative(path.join(base, 'soundtrack-v3/final-provenance.json')), humanApproval: false } });
  save('pages-05-08.json', sequence('HOLT — Blue Purple · pages 5 à 8 · révision 1', selected, soundtrack.newLot));
  const historical = readDocument(path.join(ROOT, 'anime/motion-comics/projects/blue-purple-pages01-04-v4.json'));
  const retained = historical.pages.map(page => ({ id: page.id, manifest: relative(rootRelative(page.manifestFile)) }));
  save('pages-01-08.json', sequence('HOLT — Blue Purple · pages 1 à 8 · révision 1', [...retained, ...selected], soundtrack.full));
}
