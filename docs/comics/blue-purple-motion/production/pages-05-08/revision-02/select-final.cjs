'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../../../..');
const core = require(path.join(root, 'anime/motion-comics/core.js'));
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const directory = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !inside(root, directory)) throw Error('Dossier candidat local requis.');
const projects = path.join(root, 'anime/motion-comics/projects');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rebase = relative => path.relative(projects, path.resolve(directory, relative)).replaceAll('\\', '/');
for (const baselineFile of ['art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json', 'art-masters/motion-comics/blue-purple/pages-05-08/revision-02/baseline-v3.json']) {
  for (const entry of read(path.join(root, baselineFile)).files) assert.equal(hash(path.join(root, entry.file)), entry.sha256, `Source conservée modifiée : ${entry.file}`);
}
const contractSha256 = hash(path.join(__dirname, 'CONTRACTS.json'));
const outputs = [], revised = [];
const cueIdentity = (cue, base) => ({ id: cue.id, speaker: cue.speaker, textFr: cue.textFr, textEn: cue.textEn,
  ttsText: cue.ttsText, duration: cue.duration, gapSeconds: cue.gapSeconds, audioHash: hash(path.resolve(base, cue.audio)) });
for (const [index, number] of [5, 6, 7, 8].entries()) {
  const id = String(number).padStart(2, '0'), source = path.join(directory, `page-${id}.json`);
  const oldFile = path.join(projects, `blue-purple-page${id}-v3.json`), old = read(oldFile);
  const candidate = read(source), data = core.rebaseAssets(candidate, rebase);
  assert.equal(data.provenance.contractSha256, contractSha256, 'Contrat candidat périmé.');
  assert.equal(data.panels.length, old.panels.length);
  for (const [panelIndex, panel] of data.panels.entries()) {
    const previous = old.panels[panelIndex];
    assert.equal(panel.id, previous.id); assert.deepEqual(panel.rect, previous.rect);
    assert.equal(panel.holdSeconds, previous.holdSeconds);
    assert.deepEqual(panel.cues.map(cue => cueIdentity(cue, projects)), previous.cues.map(cue => cueIdentity(cue, projects)), `Voix ou texte changé : ${panel.id}`);
    if (number !== 5 || panelIndex !== 3) assert.equal(panel.leadInSeconds, previous.leadInSeconds);
    for (const cue of panel.cues) if (cue.takeJournal) cue.takeJournal = rebase(cue.takeJournal);
  }
  assert.equal(hash(path.resolve(projects, data.image)), hash(path.resolve(projects, old.image)), 'Master canonique retouché hors périmètre.');
  const timeline = core.buildTimeline(data);
  assert(Math.abs(timeline.duration - [20.9, 18.6, 20.1, 22.4][index]) < 1e-8);
  if (number === 5) {
    assert.equal(data.storyThumbnail, true);
    assert.equal(data.panels[3].leadInSeconds, 0.7);
    const glass = data.motionLayers.find(layer => layer.panelId === 'p05-c04');
    assert(glass && glass.mode === 'frames' && glass.frames.length >= 2);
    assert(Math.abs(glass.startSeconds + glass.frames[1].atSeconds - 16.4) < 1e-8);
    assert(Math.abs(timeline.tracks[4].start - 16.6) < 1e-8);
  }
  if (number === 7) { assert.deepEqual(data.effects, old.effects); assert.deepEqual(data.protectedRegions, old.protectedRegions); }
  if (number === 8) assert.equal((data.motionLayers ?? []).length, 0, 'La voiture doit rester fixe.');
  data.version = 4;
  data.provenance = { ...data.provenance, selectedFrom: path.relative(root, source).replaceAll('\\', '/'),
    review: 'docs/comics/blue-purple-motion/production/pages-05-08/revision-02/REVIEW.md', previousManifest: `blue-purple-page${id}-v3.json`, humanListeningApproval: false };
  const name = `blue-purple-page${id}-v4.json`;
  outputs.push([name, data]); revised.push({ id: `page-${id}`, manifest: name });
}
const retained = read(path.join(projects, 'blue-purple-pages01-04-v4.json')).pages;
function sequence(source, name, pages) {
  const data = read(path.join(directory, source));
  assert.equal(data.music.preMixed, true); assert.equal(data.music.gain, 1);
  data.version = 4; data.pages = pages; data.music.audio = rebase(data.music.audio);
  data.provenance = { ...data.provenance, production: 'docs/comics/blue-purple-motion/production/pages-05-08/revision-02/', contractSha256, humanListeningApproval: false };
  outputs.push([name, data]);
}
sequence('pages-05-08.json', 'blue-purple-pages05-08-v4.json', revised);
sequence('pages-01-08.json', 'blue-purple-pages01-08-v4.json', [...retained, ...revised]);
for (const page of revised) sequence(`${page.id}-with-music.json`, `blue-purple-${page.id.replace('-', '')}-with-music-v4.json`, [page]);
for (const [name] of outputs) if (fs.existsSync(path.join(projects, name))) throw Error(`Sélection déjà présente : ${name}`);
for (const [name, data] of outputs) fs.writeFileSync(path.join(projects, name), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
const complete = readDocument(path.join(projects, 'blue-purple-pages01-08-v4.json'));
assert.equal(complete.pages.length, 8); assert.equal(complete.timeline.tracks.length, 37);
assert(Math.abs(complete.timeline.duration - 226.6) < 1e-8);
console.info(JSON.stringify({ pages: 8, voices: 37, duration: complete.timeline.duration, selectedVersion: 4, oldSourcesUnchanged: true }));
