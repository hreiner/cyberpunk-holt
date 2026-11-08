/* Select measured v4 takes, revised art and per-case motion without overwriting history. */
/* eslint @typescript-eslint/no-require-imports: "off" -- Standalone Node production tool. */
/* global require, __dirname, console, structuredClone */
const fs = require('node:fs');
const path = require('node:path');
const digestModule = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '../../../../../..');
const projects = path.join(root, 'anime/motion-comics/projects');
const { buildTimeline } = require(path.join(root, 'anime/motion-comics/core.js'));
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => digestModule.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(projects, path.resolve(root, file)).split(path.sep).join('/');
const measurements = read(path.join(root, 'art-masters/motion-comics/blue-purple/pages-01-04/audio-v3/measurements.json'));
if (measurements.model !== 'eleven_v4' || measurements.submittedCharacters > measurements.globalCharacterCap) throw Error('Modèle ou plafond vocal invalide.');
const titles = [
  ['Wendy', 'La fuite', "L'urgence", 'Letitia'],
  ['Le danger du retour', 'La colère de Franklyn', 'La voix de Grover', 'Céder sans renoncer'],
  ['Le document', 'La décharge', 'La vision', 'Le contrecoup'],
  ['Des coordonnées anciennes', 'Trouver une borne', 'Partir', 'Le bar désert']
];
const save = (file, data) => {
  if (fs.existsSync(file)) {
    if (!isDeepStrictEqual(read(file), data)) throw Error(`Révision existante différente : ${file}`);
  } else fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
};
const selected = [];
for (const page of [1, 2, 3, 4]) {
  const id = String(page).padStart(2, '0');
  const previousName = page === 1 ? 'blue-purple-page01-v4-v1.json' : `blue-purple-page${id}-v2.json`;
  const contract = read(path.join(__dirname, `contracts/page-${id}.json`));
  const plan = read(path.join(__dirname, `effects-plans/page-${id}.json`));
  if (plan.status.startsWith('provisional') || !plan.sourceImage.endsWith('/page-v2.png')) throw Error(`Plan/image page ${page} pas encore stabilisés.`);
  if (hash(path.join(root, plan.sourceImage)) !== plan.sourceSha256) throw Error(`Image page ${page} différente du plan d'effets.`);
  if (plan.lettering && plan.letteringSha256 && hash(path.join(root, plan.lettering)) !== plan.letteringSha256) throw Error(`Lettrage page ${page} différent du plan d'effets.`);
  const data = read(path.join(projects, previousName));
  data.version = page === 1 ? 8 : 3;
  data.title = `HOLT — Blue Purple · page ${page} · reprise 3`;
  data.image = relative(plan.sourceImage);
  data.panels = contract.panels.map((panel, index) => ({
    id: panel.id, label: `Case ${index + 1} — ${titles[page - 1][index]}`, rect: panel.rect,
    holdSeconds: Math.max(panel.minimumReadSeconds ?? 0, page === 1 ? [8, 4, 10, 5][index] : 0),
    cues: panel.cues.map(cue => {
      const take = measurements.cues.find(item => item.id === cue.id);
      if (!take || take.textFr !== cue.textFr || take.textEn !== cue.textEn || take.speaker !== cue.speaker || take.decodeExit !== 0 || take.ttsModel !== 'eleven_v4') throw Error(`Prise incohérente : ${cue.id}`);
      if (hash(path.join(root, take.audio)) !== take.sha256) throw Error(`Prise modifiée : ${cue.id}`);
      return { id: cue.id, globalLine: cue.globalLine, speaker: cue.speaker, audio: relative(take.audio), duration: take.duration,
        textFr: cue.textFr, textEn: cue.textEn, ttsText: take.ttsText, performance: take.performance,
        ttsModel: take.ttsModel, takeJournal: relative(take.takeJournal) };
    })
  }));
  data.effects = structuredClone(plan.effects);
  data.protectedRegions = structuredClone(plan.protectedRegions);
  delete data.review;
  const timing = buildTimeline(data);
  const panelStart = panelId => {
    const segment = timing.segments.find(item => item.panel >= 0 && data.panels[item.panel].id === panelId);
    if (!segment) throw Error(`Case d’effet inconnue : ${panelId}`);
    return segment.start + data.transitionSeconds;
  };
  for (const fx of data.effects) {
    if (fx.type === 'sparks' || fx.type === 'digitalVision') fx.startSeconds = panelStart(fx.panelId);
    if (fx.type === 'digitalVision') fx.revealSeconds = 2.5;
  }
  data.review = structuredClone(plan.review);
  data.review.perPanelReview = contract.panels.map(panel => {
    const source = plan.review.perPanelReview.find(item => item.panelId === panel.id);
    if (!source) throw Error(`Contrôle d’animation absent : ${panel.id}`);
    const offset = panel.id === 'p03-c03' ? 3.3 : source.sampleOffsetSeconds;
    return { ...source, sampleOffsetSeconds: offset, sampleTime: panelStart(panel.id) + offset };
  });
  data.review.sampleTime = data.review.perPanelReview[0].sampleTime;
  data.source = contract.source;
  data.provenance = {
    previousManifest: previousName,
    contract: `docs/comics/blue-purple-motion/production/pages-01-04/revision-03/contracts/page-${id}.json`,
    image: page === 1 ? 'Master page 1 conservé ; audit PAGE01-V4-AUDIT.json.' : 'Quatre éditions ciblées ImageGen au total, assemblages/lettrages v2 ; journaux et prompts de la reprise.',
    audio: 'Quinze nouvelles prises Eleven v4 sans tags respiratoires automatiques, mesurées PCM ; cumul 2416/3000 caractères incluant 1044 historiques.',
    effects: `docs/comics/blue-purple-motion/production/pages-01-04/revision-03/effects-plans/page-${id}.json ; temps recalés sur les nouvelles prises.`,
    revision: 'Colère et ralliement douloureux, choc après vision, petite animation dans chaque case, éclairs et minimap subjective fragmentée.',
    humanApproval: false
  };
  data.voiceModel = 'eleven_v4';
  data.voiceSelection = { status: 'agent-selected-after-owner-feedback', date: '2026-11-05', humanApproval: false,
    note: 'V4 était déjà utilisé page 1 ; nouvelles prises pour réduire les respirations et reprendre le jeu de Franklyn.' };
  const name = page === 1 ? 'blue-purple-page01-v4-r3.json' : `blue-purple-page${id}-v3.json`;
  const file = path.join(projects, name);
  buildTimeline(data); save(file, data); readDocument(file);
  selected.push({ id: `page-${id}`, manifest: name });
  console.info(JSON.stringify({ page, duration: buildTimeline(data).duration, effects: data.effects.length }));
}
const sequence = read(path.join(projects, 'blue-purple-pages01-04-v2.json'));
sequence.version = 3;
sequence.title = 'HOLT — Blue Purple · pages 1 à 4';
sequence.pages = selected;
sequence.provenance.previousManifest = 'blue-purple-pages01-04-v2.json';
sequence.provenance.revision = 'Reprise 03 selon retour du propriétaire : colère, respiration parcimonieuse, animation 16 cases et vision numérique.';
const target = path.join(projects, 'blue-purple-pages01-04-v3.json');
save(target, sequence);
const result = readDocument(target);
console.info(JSON.stringify({ sequence: target, duration: result.timeline.duration, voices: result.timeline.tracks.length }));
