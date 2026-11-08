/* Static graph validation: no art-masters input, FFmpeg, server or network. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { ROOT, EXPECTED, read, hashFile, relative, inside, outputDirectory, saveReport } = require('./common.cjs');
const core = require(path.join(ROOT, 'anime/motion-comics/core.js'));
const sequence = require(path.join(ROOT, 'anime/motion-comics/sequence.js'));

function auditPackage(bundle) {
  const directory = path.resolve(ROOT, bundle);
  const files = new Map();
  function local(reference, from = path.join(directory, 'index.html')) {
    assert.equal(typeof reference, 'string');
    assert(!/^(?:[a-z]+:|\/|\\)/i.test(reference), `Chemin relatif requis : ${reference}`);
    const file = path.resolve(path.dirname(from), reference);
    assert(inside(directory, file), `Dépendance hors paquet : ${reference}`);
    assert(fs.existsSync(file) && fs.statSync(file).isFile(), `Dépendance absente : ${file}`);
    assert(inside(fs.realpathSync(directory), fs.realpathSync(file)), 'Un lien sort du paquet.');
    if (!files.has(file)) files.set(file, { file: path.relative(directory, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: hashFile(file) });
    return file;
  }
  const publicationFile = local('PUBLICATION.json'), publication = read(publicationFile);
  assert.equal(hashFile(publicationFile), EXPECTED.publicationSha256);
  assert.equal(publication.source.sequenceSha256, EXPECTED.sha256);
  assert.equal(publication.files.length, 344);
  for (const item of publication.files) {
    const file = local(item.path);
    assert.equal(hashFile(file), item.sha256, `Hash de publication différent : ${item.path}`);
    assert.equal(fs.statSync(file).size, item.bytes);
  }
  const manifestFile = local(publication.chapter), descriptor = read(manifestFile);
  assert.equal(hashFile(manifestFile), EXPECTED.chapterSha256);
  sequence.assertSequence(descriptor);
  assert.equal(descriptor.pages.length, EXPECTED.entries);
  assert.equal(descriptor.pages[0].id, 'cover');
  assert.deepEqual(descriptor.pages.slice(1).map(page => page.id), Array.from({ length: 21 }, (_, i) => `page-${String(i + 1).padStart(2, '0')}`));
  const pages = descriptor.pages.map(page => {
    const file = local(page.manifest, manifestFile), data = read(file);
    core.assertManifest(data);
    core.assetPaths(data).forEach(reference => local(reference, file));
    for (const field of ['poster', 'posterImage', 'thumbnail', 'thumbnailImage']) {
      if (typeof page[field] === 'string') local(page[field], manifestFile);
      if (typeof data[field] === 'string') local(data[field], file);
    }
    return { id: page.id, file, data };
  });
  if (descriptor.music) local(descriptor.music.audio, manifestFile);
  const timeline = sequence.buildSequence(descriptor, pages.map(page => page.data));
  assert(Math.abs(timeline.duration - EXPECTED.duration) < 1e-8);
  assert.equal(timeline.tracks.length, EXPECTED.voices);
  const htmlFile = local('index.html'), html = fs.readFileSync(htmlFile, 'utf8');
  for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    if (!match[1].startsWith('#') && !match[1].startsWith('data:')) local(match[1], htmlFile);
  }
  const cssFile = local('reader.css');
  for (const match of fs.readFileSync(cssFile, 'utf8').matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) if (!match[1].startsWith('data:')) local(match[1], cssFile);
  for (const license of ['assets/ATTRIBUTION.md', 'assets/barlow-LICENSE.txt', 'assets/big-shoulders-LICENSE.txt']) local(license);
  for (const [file] of files) if (file.endsWith('.svg')) {
    const svg = fs.readFileSync(file, 'utf8');
    for (const match of svg.matchAll(/(?:href|xlink:href)\s*=\s*["']([^"']+)["']/g)) if (!match[1].startsWith('#') && !match[1].startsWith('data:')) local(match[1], file);
  }
  return { bundle: relative(directory), publicationSha256: hashFile(publicationFile), entries: pages.length, voices: timeline.tracks.length, duration: timeline.duration, files: [...files.values()], consumedBytes: [...files.values()].reduce((sum, file) => sum + file.bytes, 0), sourceInputs: 'public bundle + pure core/sequence only; no native media or FFmpeg' };
}
if (require.main === module) {
  const out = outputDirectory(process.argv[3]);
  const report = { status: 'running', startedAt: new Date().toISOString() };
  try { Object.assign(report, auditPackage(process.argv[2])); report.status = 'passed'; }
  catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; }
  finally { report.finishedAt = new Date().toISOString(); saveReport(out, report); console.log(JSON.stringify({ status: report.status, entries: report.entries, voices: report.voices, duration: report.duration, files: report.files?.length, report: relative(path.join(out, 'report.json')) })); }
}
module.exports = { auditPackage };
