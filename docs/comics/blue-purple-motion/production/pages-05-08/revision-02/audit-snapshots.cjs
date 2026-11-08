'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../../../..');
const core = require(path.join(root, 'anime/motion-comics/core.js'));
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { inside } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const destination = path.resolve(process.argv[2] ?? '');
if (!process.argv[3] || !inside(root, destination) || fs.existsSync(destination)) throw Error('Rapport neuf et exports locaux requis.');
const checked = process.argv.slice(3).map(value => {
  const directory = path.resolve(value);
  if (!inside(root, directory)) throw Error('Export hors dépôt.');
  const report = read(path.join(directory, 'report.json'));
  if (report.status !== 'completed') throw Error('Export incomplet.');
  const source = readDocument(report.source), snapshot = readDocument(path.join(directory, 'manifest.json'));
  assert.equal(source.kind, snapshot.kind);
  assert.equal(source.timeline.duration, snapshot.timeline.duration);
  assert.equal(source.pages.length, snapshot.pages.length);
  const identity = page => core.rebaseAssets(page.data, relative => `sha256/${hash(path.resolve(path.dirname(page.manifestFile), relative))}`);
  const pages = source.pages.map((page, index) => {
    assert.deepEqual(identity(page), identity(snapshot.pages[index]), `Copie différente : ${page.id}`);
    return { id: page.id, assetsVerified: core.assetPaths(page.data).length, contentAndAssetHashesIdentical: true };
  });
  const normalizeSequence = project => {
    const value = structuredClone(project.data);
    value.pages = value.pages.map((page, index) => ({ ...page, manifest: `page-${index}` }));
    if (value.music) value.music.audio = `sha256:${hash(project.musicFile)}`;
    return value;
  };
  if (source.kind === 'sequence') assert.deepEqual(normalizeSequence(source), normalizeSequence(snapshot));
  return { export: path.relative(root, directory).replaceAll('\\', '/'), source: path.relative(root, report.source).replaceAll('\\', '/'), duration: source.timeline.duration, pages, musicHash: source.musicFile ? hash(source.musicFile) : null };
});
fs.writeFileSync(destination, JSON.stringify({ status: 'completed', checkedAt: new Date().toISOString(), exports: checked }, null, 2) + '\n', { flag: 'wx' });
console.info(JSON.stringify({ status: 'completed', exports: checked.length, pages: checked.reduce((sum, item) => sum + item.pages.length, 0) }));
