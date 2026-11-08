'use strict';

// Select reviewed candidates without rewriting any delivered page or existing revision.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '../../../../..');
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const candidateDirectory = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !inside(root, candidateDirectory)) throw Error('Dossier candidat local requis.');
const projects = path.join(root, 'anime/motion-comics/projects');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const baseline = read(path.join(root, 'art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json'));
for (const item of baseline.files) if (hash(path.resolve(root, item.file)) !== item.sha256) throw Error(`Réemploi modifié : ${item.file}`);

function save(name, data) {
  const file = path.join(projects, name);
  if (fs.existsSync(file)) {
    if (!isDeepStrictEqual(read(file), data)) throw Error(`Sélection existante différente : ${name}`);
  } else fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
  return readDocument(file);
}
const rebase = value => path.relative(projects, path.resolve(candidateDirectory, value)).replaceAll('\\', '/');
const pages = [];
const newLines = [];
const types = new Set();
for (const number of [5, 6, 7, 8]) {
  const id = String(number).padStart(2, '0');
  const source = path.join(candidateDirectory, `page-${id}.json`);
  const data = read(source);
  readDocument(source);
  for (const panel of data.panels) {
    if (!data.effects?.some(effect => effect.panelId === panel.id)) throw Error(`Case sans animation : ${panel.id}`);
    for (const cue of panel.cues ?? []) newLines.push(cue.id);
  }
  for (const effect of data.effects) types.add(effect.type);
  data.image = rebase(data.image);
  for (const panel of data.panels) for (const cue of panel.cues ?? []) {
    cue.audio = rebase(cue.audio);
    if (cue.takeJournal) cue.takeJournal = rebase(cue.takeJournal);
  }
  data.provenance.selectedFrom = path.relative(root, source).replaceAll('\\', '/');
  data.provenance.review = 'docs/comics/blue-purple-motion/production/pages-05-08/REVIEW.md';
  data.provenance.selection = 'Sélection de fabrication après revue indépendante ; ne prétend pas à une écoute ou approbation humaine.';
  const name = `blue-purple-page${id}-v1.json`;
  save(name, data);
  pages.push({ id: `page-${id}`, manifest: name });
}
const expected = Array.from({ length: 8 }, (_, index) => `bp-l${String(index + 16).padStart(3, '0')}`);
if (!isDeepStrictEqual(newLines, expected)) throw Error('Les huit nouvelles lignes doivent rester uniques et dans leur ordre global.');
if (types.size < 5) throw Error('Variété de mécanismes insuffisante pour cette sélection.');
const retained = read(path.join(projects, 'blue-purple-pages01-04-v4.json'));
const music = structuredClone(retained.music);
const sequence = (title, selected) => ({ kind: 'motion-comic-sequence', schemaVersion: 1, version: 1, title, pages: selected, music,
  source: 'docs/chapters/ch3/SCENARIO.md — Le piège au bar ; Le parking et la fuite',
  provenance: { production: 'docs/comics/blue-purple-motion/production/pages-05-08/',
    retainedSelection: 'blue-purple-pages01-04-v4.json', retainedMediaUnchanged: true,
    newVoices: 'Huit prises Eleven v4 ; cumul 2856/3200 caractères, sources et journaux conservés.',
    review: 'REVIEW.md décrit les contrôles réellement exécutés et leurs limites.' } });
for (const page of pages) save(`blue-purple-${page.id.replace('-', '')}-with-music-v1.json`, sequence(`HOLT — Blue Purple · ${page.id}`, [page]));
const additions = save('blue-purple-pages05-08-v1.json', sequence('HOLT — Blue Purple · pages 5 à 8', pages));
const complete = save('blue-purple-pages01-08-v1.json', sequence('HOLT — Blue Purple · pages 1 à 8', [...retained.pages, ...pages]));
console.info(JSON.stringify({ retainedMediaUnchanged: true, newDuration: additions.timeline.duration, completeDuration: complete.timeline.duration,
  pages: complete.pages.length, voices: complete.timeline.tracks.length, newEffectTypes: [...types] }, null, 2));
