/* Selective production render: one reviewed pose path changes, all other PNGs are verified copies. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const core = require('../../../core.js');
const layers = require('../../../layers.js');
const sequence = require('../../../sequence.js');
const { readDocument } = require('../../../sequence.cjs');
const { localFile, newDirectory } = require('../../../project.cjs');
const { ROOT, read, hash, relative, engine, frameName, browserPath, ffmpeg, preview, snapshot, encode } = require('./reuse-common.cjs');
const [manifest, proofFile, destination] = process.argv.slice(2);
if (!manifest || !proofFile || !destination) throw Error('Usage : reuse-export.cjs MANIFEST_REVU PREUVE_CACHE DOSSIER_NEUF');
const manifestFile = localFile(path.resolve(manifest), ROOT), cacheProofFile = localFile(path.resolve(proofFile), ROOT), proof = read(cacheProofFile);
assert.equal(proof.status, 'completed'); assert.equal(proof.fps, 24); assert(proof.witnesses.length > 0);
assert.deepEqual(engine(), proof.engine, 'Moteur changé depuis témoins : nouveau contrôle requis.');
const sourceExport = path.resolve(ROOT, proof.sourceExport), oldReport = read(path.join(sourceExport, 'report.json'));
assert.equal(hash(path.join(sourceExport, 'report.json')), proof.oldReportSha256);
assert.equal(hash(path.join(sourceExport, 'motion-comic.mp4')), proof.oldMp4Sha256);
assert.equal(hash(path.resolve(ROOT, proof.sourceManifest)), proof.sourceHash);
for (const media of oldReport.media) assert.equal(hash(path.resolve(ROOT, media.file)), media.sha256, `Média ancien modifié : ${media.file}`);
const project = readDocument(manifestFile), old = readDocument(path.resolve(ROOT, proof.sourceManifest));
assert.equal(project.kind, old.kind); assert.equal(project.pages.length, old.pages.length);
assert.equal(project.musicFile, old.musicFile, 'Backing remplacé hors périmètre.');
const music = data => { const value = structuredClone(data.music ?? null); if (value) delete value.audio; return value; };
assert.deepEqual(music(project.data), music(old.data));
assert.deepEqual(project.timeline, old.timeline, 'Chronologie ou audio modifiés.');
function normalize(page) {
  const data = core.rebaseAssets(page.data, file => relative(path.resolve(path.dirname(page.manifestFile), file)));
  for (const field of ['version', 'title', 'provenance', 'source', 'review']) delete data[field];
  return data;
}
function differences(a, b, key = []) {
  if (a === b) return [];
  if (a && b && typeof a === 'object' && typeof b === 'object') return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(name => differences(a[name], b[name], [...key, name]));
  return [{ key, before: a, after: b }];
}
const changes = project.pages.flatMap((page, index) => differences(normalize(old.pages[index]), normalize(page)).map(change => ({ ...change, page: index })));
assert.equal(changes.length, 1, 'Seul un chemin de pose peut changer.');
const change = changes[0], key = change.key;
assert(key.length === 5 && key[0] === 'motionLayers' && key[2] === 'frames' && key[4] === 'image', 'Changement hors pose image.');
assert.equal(typeof change.after, 'string'); localFile(path.resolve(ROOT, change.after), ROOT);
const layer = project.pages[change.page].data.motionLayers[Number(key[1])], poseIndex = Number(key[3]);
assert.equal(layer.mode, 'frames');
const fps = proof.fps, count = Math.ceil(project.timeline.duration * fps); assert.equal(count, proof.frames); assert.equal(proof.inventory.length, count);
const affected = new Set();
for (let index = 0; index < count; index++) {
  const time = index / fps, page = sequence.pageAt(project.timeline, time);
  if (page.index === change.page && layers.sample(layer, time - page.start).frameIndex === poseIndex) affected.add(index);
}
assert(affected.size > 0, 'Pose corrigée jamais utilisée.');
const render = new Set(affected);
for (const index of affected) for (const neighbor of [index - 1, index + 1]) if (neighbor >= 0 && neighbor < count) render.add(neighbor);
if (process.argv.includes('--plan-only')) {
  console.info(JSON.stringify({ manifest: relative(manifestFile), sourceExport: proof.sourceExport, duration: project.timeline.duration,
    totalFrames: count, affectedFrames: [...affected], renderWithBoundaryGuards: [...render].sort((a, b) => a - b),
    retainedCopies: count - render.size, changedImage: relative(change.after), engineFiles: proof.engine.length }));
  process.exit(0);
}
const output = newDirectory(path.resolve(destination));
const report = { status: 'running', startedAt: new Date().toISOString(), kind: project.kind, source: manifestFile,
  sourceHash: hash(manifestFile), engineVersion: require('../../../package.json').version, engine: engine(),
  media: project.files.map(file => ({ file: relative(file), sha256: hash(file) })), fps,
  cacheProof: { file: relative(cacheProofFile), sha256: hash(cacheProofFile) }, changedPose: { ...change, layerId: layer.id, poseIndex },
  potentiallyAffectedFrames: [...affected], renderedFramesWithBoundaryGuards: [...render].sort((a, b) => a - b),
  productionTools: ['reuse-common.cjs', 'reuse-export.cjs'].map(file => ({ file: relative(path.join(__dirname, file)), sha256: hash(path.join(__dirname, file)) })),
  ffmpegSha256: hash(ffmpeg) };
const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); write();
(async () => {
  let server, browser;
  try {
    snapshot(project, output);
    server = await preview(manifestFile); report.reader = server.url;
    browser = await chromium.launch({ headless: true, executablePath: browserPath });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } }); await page.goto(server.url);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && document.querySelector('#play')?.disabled === false);
    await page.evaluate(() => { window.motionComic.setRenderMode(true); window.motionComic.setEffects(true); });
    const state = await page.evaluate(() => ({ duration: window.motionComic.duration, tracks: window.motionComic.tracks, segments: window.motionComic.segments, pages: window.motionComic.pages }));
    assert(Math.abs(state.duration - project.timeline.duration) < 0.000001);
    const frames = path.join(output, 'frames'); fs.mkdirSync(frames);
    const origins = [];
    for (let index = 0; index < count; index++) {
      const target = path.join(frames, frameName(index));
      if (render.has(index)) {
        const png = await page.evaluate(time => { window.motionComic.seek(time); return document.querySelector('#screen').toDataURL('image/png').split(',')[1]; }, index / fps);
        fs.writeFileSync(target, Buffer.from(png, 'base64'), { flag: 'wx' });
        const sha256 = hash(target), previousSha256 = proof.inventory[index].sha256;
        if (!affected.has(index)) assert.equal(sha256, previousSha256, `Borne inchangée différente : ${index}`);
        origins.push({ index, time: index / fps, origin: affected.has(index) ? 'corrected-pose-render' : 'boundary-guard-render', sha256, previousSha256, changedFromRetained: sha256 !== previousSha256 });
      } else {
        const source = path.join(sourceExport, 'frames', frameName(index)), expected = proof.inventory[index];
        assert.equal(expected.index, index); assert.equal(hash(source), expected.sha256, `Cache modifié : ${index}`);
        fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
        const sha256 = hash(target); assert.equal(sha256, expected.sha256, `Copie différente : ${index}`);
        origins.push({ index, time: index / fps, origin: 'verified-retained-copy', source: relative(source), sourceSha256: expected.sha256, sha256 });
      }
      if (index % 1000 === 0) console.info(`PNG vérifiés : ${index + 1}/${count}`);
    }
    assert(origins.some(frame => frame.origin === 'corrected-pose-render' && frame.changedFromRetained), 'Correction absente du rendu.');
    fs.writeFileSync(path.join(output, 'frame-origins.json'), JSON.stringify({ cacheProof: report.cacheProof, frames: origins }, null, 2), { flag: 'wx' });
    await page.evaluate(() => window.motionComic.seek(0)); await page.locator('#screen').screenshot({ path: path.join(output, 'overview.png') });
    report.encodeArguments = encode(project, output, fps);
    assert.deepEqual(engine(), report.engine, 'Moteur changé pendant export.');
    for (const media of report.media) assert.equal(hash(path.resolve(ROOT, media.file)), media.sha256, 'Média changé pendant export.');
    assert.equal(hash(manifestFile), report.sourceHash);
    Object.assign(report, { status: 'completed', finishedAt: new Date().toISOString(), duration: state.duration, frames: count,
      tracks: state.tracks, segments: state.segments, pages: state.pages, music: project.data.music ?? null, decoded: true,
      copiedFrames: count - render.size, renderedFrames: render.size, frameOriginsSha256: hash(path.join(output, 'frame-origins.json')),
      output: path.join(output, 'motion-comic.mp4'), outputSha256: hash(path.join(output, 'motion-comic.mp4')) }); write();
    console.info(JSON.stringify({ output, duration: state.duration, frames: count, copied: report.copiedFrames, rendered: render.size, sha256: report.outputSha256 }));
  } catch (error) { Object.assign(report, { status: 'failed', finishedAt: new Date().toISOString(), error: error.message }); write(); throw error; }
  finally { if (browser) await browser.close(); if (server) server.child.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
