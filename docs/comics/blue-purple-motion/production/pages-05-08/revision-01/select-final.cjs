'use strict';

// Publish a new reviewed revision; retain every previous manifest and selected medium.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '../../../../../..');
const core = require(path.join(root, 'anime/motion-comics/core.js'));
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const directory = path.resolve(process.argv[2] ?? '');
const version = Number(process.argv[3] ?? 2);
if (!Number.isInteger(version) || version < 2) throw Error('Version de sélection >=2 requise.');
if (!process.argv[2] || !inside(root, directory)) throw Error('Dossier candidat local requis.');
const projects = path.join(root, 'anime/motion-comics/projects');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rebase = value => path.relative(projects, path.resolve(directory, value)).replaceAll('\\', '/');
const baseline = read(path.join(root, 'art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json'));
for (const file of baseline.files) if (hash(path.join(root, file.file)) !== file.sha256) throw Error(`Média initial modifié : ${file.file}`);
const contract = read(path.join(__dirname, 'CONTRACTS.json'));
const outputs = [];
const revisedPages = [];
for (const number of [5, 6, 7, 8]) {
  const id = String(number).padStart(2, '0'), name = `blue-purple-page${id}-v${version}.json`;
  const source = path.join(directory, `page-${id}.json`), data = core.rebaseAssets(read(source), rebase);
  const expected = contract.pages.find(page => page.page === number);
  if (data.panels.length !== expected.panels.length) throw Error(`Découpage différent : page ${number}`);
  for (const [index, panel] of data.panels.entries()) {
    const target = expected.panels[index];
    if (panel.id !== target.id || panel.holdSeconds !== target.minimumReadSeconds) throw Error(`Cadence différente : ${panel.id}`);
    const actual = (panel.cues ?? []).map(cue => [cue.id, cue.speaker, cue.textFr, cue.textEn]);
    const wanted = target.cues.map(cue => [cue.id, cue.speaker, cue.textFr, cue.textEn]);
    if (!isDeepStrictEqual(actual, wanted)) throw Error(`Dialogues différents : ${panel.id}`);
    for (const cue of panel.cues ?? []) if (cue.takeJournal) cue.takeJournal = rebase(cue.takeJournal);
  }
  if ([5, 6, 8].includes(number) && !data.motionLayers?.length) throw Error(`Action dessinée absente : page ${number}`);
  data.version = version;
  data.provenance = { ...data.provenance, selectedFrom: path.relative(root, source).replaceAll('\\', '/'),
    review: 'docs/comics/blue-purple-motion/production/pages-05-08/revision-01/REVIEW.md',
    previousManifest: `blue-purple-page${id}-v1.json`, humanListeningApproval: false };
  outputs.push([name, data]); revisedPages.push({ id: `page-${id}`, manifest: name });
}
const retained = read(path.join(projects, 'blue-purple-pages01-04-v4.json')).pages;
function sequence(sourceName, name, selectedPages) {
  const data = read(path.join(directory, sourceName));
  if (!data.music?.preMixed) throw Error(`Backing prémixé requis : ${sourceName}`);
  data.version = version; data.pages = selectedPages; data.music.audio = rebase(data.music.audio);
  data.provenance = { ...data.provenance, production: 'docs/comics/blue-purple-motion/production/pages-05-08/revision-01/',
    retainedSelection: 'blue-purple-pages01-04-v4.json', revision: 'John frappe, 22 voix, bruitages et trois actions dessinées.', humanListeningApproval: false };
  outputs.push([name, data]);
}
sequence('pages-05-08.json', `blue-purple-pages05-08-v${version}.json`, revisedPages);
sequence('pages-01-08.json', `blue-purple-pages01-08-v${version}.json`, [...retained, ...revisedPages]);
for (const page of revisedPages) sequence(`${page.id}-with-music.json`, `blue-purple-${page.id.replace('-', '')}-with-music-v${version}.json`, [page]);
for (const [name, data] of outputs) {
  const file = path.join(projects, name);
  if (fs.existsSync(file) && !isDeepStrictEqual(read(file), data)) throw Error(`Sélection existante différente : ${name}`);
}
for (const [name, data] of outputs) {
  const file = path.join(projects, name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
  readDocument(file);
}
const complete = readDocument(path.join(projects, `blue-purple-pages01-08-v${version}.json`));
if (complete.pages.length !== 8 || complete.timeline.tracks.length !== 37 || Math.abs(complete.timeline.duration - 226.6) > 1e-8) throw Error('Chronologie finale inattendue.');
console.info(JSON.stringify({ pages: 8, voices: 37, duration: complete.timeline.duration, previousMediaUnchanged: true }, null, 2));
