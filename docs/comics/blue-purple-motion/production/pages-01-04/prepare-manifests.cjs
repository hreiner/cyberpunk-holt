/* Rebuild new page manifests from reviewed contracts, measured takes and authored FX. */
/* eslint @typescript-eslint/no-require-imports: "off" -- Standalone Node CommonJS production tool. */
/* global require, __dirname, process, console */
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '../../../../..');
const projects = path.join(root, 'anime/motion-comics/projects');
const { readProject } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const relative = file => path.relative(projects, path.resolve(root, file)).split(path.sep).join('/');
const measured = read(path.join(root, 'art-masters/motion-comics/blue-purple/pages-01-04/voices-v4-v1-measurements.json'));
const selectedPages = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [2, 3, 4];
if (selectedPages.some(page => ![2, 3, 4].includes(page))) throw Error('Pages autorisées : 2, 3, 4.');
for (const page of selectedPages) {
  const id = String(page).padStart(2, '0');
  const contract = read(path.join(__dirname, `contracts/page-${id}.json`));
  const fx = read(path.join(__dirname, `effects-plans/page-${id}.json`));
  const data = {
    schemaVersion: 1, version: 1, title: `HOLT — Blue Purple · page ${page} · ${contract.title}`,
    image: relative(`art-masters/motion-comics/blue-purple/page-${id}/page-v1.png`),
    overviewSeconds: 2, transitionSeconds: 0.85, gapSeconds: 0.6, outroSeconds: 2,
    panels: contract.panels.map(panel => ({
      id: panel.id, label: `Case ${panel.readingOrder} — ${panel.intention}`,
      rect: panel.rect, holdSeconds: panel.minimumReadSeconds,
      cues: panel.cues.map(cue => {
        const take = measured.cues.find(item => item.id === cue.id);
        if (!take || take.textFr !== cue.textFr || take.textEn !== cue.textEn || take.speaker !== cue.speaker || take.decodeExit !== 0) throw Error(`Prise incohérente : ${cue.id}`);
        return { id: cue.id, globalLine: cue.globalLine, speaker: cue.speaker,
          audio: relative(take.audio), duration: take.duration, textFr: cue.textFr,
          textEn: cue.textEn, ttsText: take.ttsText, performance: take.performance,
          ttsModel: take.ttsModel, takeJournal: relative(take.takeJournal) };
      })
    })),
    effects: fx.effects, protectedRegions: fx.protectedRegions, review: fx.review,
    source: contract.source,
    provenance: {
      contract: `docs/comics/blue-purple-motion/production/pages-01-04/contracts/page-${id}.json, v1`,
      image: `ImageGen, bandes sans lettres ; prompts et journaux du lot. Master page-${id}/page-raw-v1.png, calque lettering-v1.svg.`,
      audio: 'ElevenLabs OAuth eleven_v4, prises mesurées PCM ; plafond global 1800 caractères, 1044 soumis.',
      effects: `docs/comics/blue-purple-motion/production/pages-01-04/effects-plans/page-${id}.json`,
      review: 'Contre-revue agent distincte de l’approbation humaine ; voir REVIEW.md du lot.'
    },
    voiceModel: 'eleven_v4'
  };
  if (!Array.isArray(data.effects) || !Array.isArray(data.protectedRegions) || !data.review) throw Error(`Plan effets incomplet : page ${page}`);
  const target = path.join(projects, `blue-purple-page${id}-v1.json`);
  if (fs.existsSync(target)) {
    if (!isDeepStrictEqual(read(target), data)) throw Error(`Manifeste existant différent : ${target} ; conserver puis créer une révision.`);
  } else fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
  const result = readProject(target);
  console.info(JSON.stringify({ page, duration: result.timeline.duration, takes: result.timeline.tracks.length }));
}
