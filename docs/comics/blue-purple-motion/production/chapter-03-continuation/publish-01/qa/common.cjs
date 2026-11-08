const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '../../../../../../..');
const DOC = 'docs/comics/blue-purple-motion/production/chapter-03-continuation';
const MASTER = 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa';
const EXPECTED = Object.freeze({
  source: 'anime/motion-comics/projects/blue-purple-pages01-21-v10.json',
  sha256: 'd180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce',
  publicationSha256: 'd842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a',
  chapterSha256: '18c3fa01f9072d51aa3af368d407836943ba3649de33cd2f6e2e482faa6533e5',
  dependencies: 317, entries: 22, voices: 99, duration: 584.3,
  route: '/cyberpunk-holt/comics/blue-purple/v10/',
});
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const hashFile = file => sha256(fs.readFileSync(file));
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
function inside(parent, file) {
  const rel = path.relative(parent, file);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}
function outputDirectory(value) {
  assert(value, 'Un nouveau dossier de preuves est requis.');
  const out = path.resolve(ROOT, value);
  assert([path.resolve(ROOT, MASTER), __dirname].some(parent => inside(parent, out) && out !== parent), 'Sorties limitées aux dossiers QA attribués.');
  assert(!fs.existsSync(out), 'Le dossier de preuves existe déjà.');
  fs.mkdirSync(out, { recursive: true });
  return out;
}
function saveReport(out, report) {
  fs.writeFileSync(path.join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
}
function anchors() {
  return ['c', 'd'].flatMap(lot => read(path.resolve(ROOT, DOC, `motion-03/lot-${lot}/ANCHORS.json`)).anchors);
}
module.exports = { ROOT, DOC, MASTER, EXPECTED, read, sha256, hashFile, relative, inside, outputDirectory, saveReport, anchors };
