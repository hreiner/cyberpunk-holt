const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../../../../../..');
const { readDocument } = require(path.join(ROOT, 'anime/motion-comics/sequence.cjs'));
const rel = file => path.relative(ROOT, file).replaceAll('\\', '/');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function save(file, data) {
  const bytes = JSON.stringify(data, null, 2) + '\n';
  if (fs.existsSync(file)) {
    if (fs.readFileSync(file, 'utf8') !== bytes) throw Error('Gel existant différent : ' + file);
  } else fs.writeFileSync(file, bytes, { flag: 'wx' });
}
const timingFile = path.join(__dirname, 'TIMING.json'), timing = JSON.parse(fs.readFileSync(timingFile));
for (const lock of timing.sourceLocks) if (sha(path.join(ROOT, lock.file)) !== lock.sha256) throw Error('Source v10 différente : ' + lock.file);
const project = readDocument(path.join(ROOT, timing.targetManifest));
if (project.files.length !== 317 || project.timeline.tracks.length !== 99 || Math.abs(project.timeline.duration - timing.duration) > 1e-9) throw Error('Sélection différente du contrat.');
save(path.join(__dirname, 'SELECTION.json'), {
  status: 'frozen-rhythm-correction', selected: timing.targetManifest, selectedSha256: sha(project.manifestFile), engineVersion: '1.4.1',
  timing: rel(timingFile), timingSha256: sha(timingFile), duration: project.timeline.duration, voices: 99, entries: 22,
  previousSelection: timing.sourceManifest, previousSourceSha256: timing.sourceSha256,
  voicesNotAccelerated: true, unchangedDrawingsAndText: true,
  files: project.files.map(file => ({ file: rel(file), sha256: sha(file) })),
});
if (process.argv.includes('--runtime')) {
  const previous = JSON.parse(fs.readFileSync(path.join(__dirname, '../publish-01/runtime/SELECTION-1.4.0.json')));
  save(path.join(__dirname, 'ENGINE-1.4.1.json'), {
    status: 'frozen-ready-for-public-package', engineVersion: '1.4.1',
    engine: previous.engine.map(item => ({ file: item.file, sha256: sha(path.join(ROOT, item.file)) })),
    changes: ['Omit zero-duration overview camera segments', 'Manual page overview independent from playback timing'],
  });
}
console.info(JSON.stringify({ status: 'frozen', runtime: process.argv.includes('--runtime'), duration: project.timeline.duration, files: project.files.length }));
