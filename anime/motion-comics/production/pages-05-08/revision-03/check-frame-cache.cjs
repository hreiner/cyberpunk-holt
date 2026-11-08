/* Confirm retained PNG caches match the current export-mode reader before selective reuse. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { readDocument } = require('../../../sequence.cjs');
const { newDirectory, localFile } = require('../../../project.cjs');
const { ROOT, read, hash, relative, engine, frameName, browserPath, preview } = require('./reuse-common.cjs');
const [input, target] = process.argv.slice(2);
if (!input || !target) throw Error('Usage : check-frame-cache.cjs ANCIEN_EXPORT DOSSIER_PREUVE_NEUF');
const sourceExport = path.resolve(input), old = read(localFile(path.join(sourceExport, 'report.json'), ROOT));
const audit = read(localFile(path.join(sourceExport, 'independent-audit.json'), ROOT));
assert.equal(old.status, 'completed'); assert.equal(old.decoded, true); assert.equal(old.fps, 24);
assert.equal(audit.status, 'completed'); assert.equal(hash(path.join(sourceExport, 'motion-comic.mp4')), audit.sha256);
const project = readDocument(old.source); assert.equal(hash(old.source), old.sourceHash);
for (const media of old.media) assert.equal(hash(path.resolve(ROOT, media.file)), media.sha256, `Ancien média modifié : ${media.file}`);
const output = newDirectory(path.resolve(target)), currentEngine = engine(), count = Math.ceil(project.timeline.duration * old.fps);
assert.equal(count, old.frames);
const files = fs.readdirSync(path.join(sourceExport, 'frames')).filter(name => /^frame_\d{5}\.png$/.test(name)); assert.equal(files.length, count);
const indices = new Set([0, count - 1]);
const add = time => { const index = Math.round(time * old.fps); if (index >= 0 && index < count) indices.add(index); };
for (const page of project.timeline.pages) {
  const data = project.pages[page.index].data;
  add(page.start + 0.1);
  for (const segment of page.segments.filter(segment => segment.panel >= 0)) {
    const held = segment.start + (data.transitionSeconds ?? 0.8);
    add(page.start + held + Math.min(0.8, Math.max(0, segment.end - held) / 2));
  }
  for (const layer of data.motionLayers ?? []) for (const frame of layer.frames) {
    const time = page.start + layer.startSeconds + frame.atSeconds;
    add(time - 1 / old.fps); add(time); add(time + 1 / old.fps);
  }
}
const report = { status: 'running', sourceExport: relative(sourceExport), sourceManifest: relative(old.source),
  sourceHash: old.sourceHash, oldReportSha256: hash(path.join(sourceExport, 'report.json')), oldMp4Sha256: audit.sha256,
  engine: currentEngine, fps: old.fps, duration: project.timeline.duration, frames: count, witnesses: [], inventory: [] };
const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); write();
(async () => {
  let server, browser;
  try {
    server = await preview(old.source);
    browser = await chromium.launch({ headless: true, executablePath: browserPath });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } }); await page.goto(server.url);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && document.querySelector('#play')?.disabled === false);
    await page.evaluate(() => { window.motionComic.setRenderMode(true); window.motionComic.setEffects(true); });
    for (const index of [...indices].sort((a, b) => a - b)) {
      const actual = Buffer.from(await page.evaluate(time => { window.motionComic.seek(time); return document.querySelector('#screen').toDataURL('image/png').split(',')[1]; }, index / old.fps), 'base64');
      const file = path.join(sourceExport, 'frames', frameName(index)), expected = fs.readFileSync(file);
      if (!actual.equals(expected)) { fs.writeFileSync(path.join(output, `mismatch-${index}.png`), actual); throw Error(`PNG témoin différent : ${index}`); }
      report.witnesses.push({ index, time: index / old.fps, byteIdentical: true, sha256: hash(file) });
    }
    for (let index = 0; index < count; index++) report.inventory.push({ index, sha256: hash(path.join(sourceExport, 'frames', frameName(index))) });
    assert.deepEqual(engine(), currentEngine, 'Moteur modifié pendant contrôle.');
    Object.assign(report, { status: 'completed', finishedAt: new Date().toISOString(), method: 'Témoins export-mode identiques par PNG ; chaque frame retenue inventoriée SHA avant copie. Aucun export long.' }); write();
    console.info(JSON.stringify({ output, frames: count, byteIdenticalWitnesses: report.witnesses.length, engineFiles: currentEngine.length }));
  } catch (error) { Object.assign(report, { status: 'failed', error: error.message }); write(); throw error; }
  finally { if (browser) await browser.close(); if (server) server.child.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
