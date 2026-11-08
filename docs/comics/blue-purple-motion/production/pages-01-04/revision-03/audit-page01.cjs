/* Verify the actual selected page-1 inputs and copied export audio, not their names. */
/* eslint @typescript-eslint/no-require-imports: "off" -- Standalone Node production audit. */
/* global require, __dirname, console */
const fs = require('node:fs');
const path = require('node:path');
const digestModule = require('node:crypto');
const root = path.resolve(__dirname, '../../../../../..');
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const originalFile = path.join(root, 'anime/motion-comics/projects/blue-purple-page01-v4-v1.json');
const original = read(originalFile);
const snapshot = readDocument(path.join(root, 'art-masters/motion-comics/blue-purple/pages-01-04/render-v2/manifest.json'));
const page = snapshot.pages[0];
const hash = file => digestModule.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lines = original.panels.flatMap(panel => panel.cues).map((cue, index) => {
  const journal = read(path.resolve(path.dirname(originalFile), cue.takeJournal));
  const copy = page.data.panels.flatMap(panel => panel.cues)[index];
  const sourceFile = path.resolve(path.dirname(originalFile), cue.audio);
  const copiedFile = path.resolve(path.dirname(page.manifestFile), copy.audio);
  const result = { line: index + 1, model: journal.model, cueModel: cue.ttsModel,
    source: path.relative(root, sourceFile).split(path.sep).join('/'),
    exportedCopy: path.relative(root, copiedFile).split(path.sep).join('/'),
    sourceSha256: hash(sourceFile), exportedSha256: hash(copiedFile) };
  if (result.model !== 'eleven_v4' || result.cueModel !== 'eleven_v4' || result.sourceSha256 !== result.exportedSha256) throw Error('Prise page 1 différente ou modèle incorrect.');
  return result;
});
const result = { date: '2026-11-05', status: 'verified', selectedSequence: 'blue-purple-pages01-04-v2.json',
  conclusion: 'Les quatre prises de page 1 dans la livraison précédente sont bien les prises Eleven v4 retenues.', lines };
const out = path.join(__dirname, 'PAGE01-V4-AUDIT.json');
if (fs.existsSync(out)) {
  if (JSON.stringify(read(out)) !== JSON.stringify(result)) throw Error('Audit existant différent ; conserver une nouvelle version.');
} else fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.info(JSON.stringify({ status: result.status, models: lines.map(line => line.model), exportedHashesMatch: true }));
