/* Add selected-v5 manifests without touching prior pages, voices or timing. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { ROOT } = require('../../../project.cjs');
const { readDocument } = require('../../../sequence.cjs');
const core = require('../../../core.js');
const projects = path.join(ROOT, 'anime/motion-comics/projects');
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-03');
const repaired = path.join(base, 'art/p05-c03-recoil-corrected-v1.png');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const page = read(path.join(projects, 'blue-purple-page05-v4.json'));
const oldTimeline = core.buildTimeline(page);
const oldFile = page.motionLayers[0].frames[2].image;
page.version = 5; page.title = 'HOLT — Blue Purple · page 5 · révision 3';
page.motionLayers.find(layer => layer.id === 'john-punch-four-poses').frames[2].image = path.relative(projects, repaired).replaceAll('\\', '/');
page.provenance = { ...page.provenance, revision: 3, correction: 'John recoil: stray same-shoulder hanging arm removed; original clenched fist preserved.',
  correctedImageSha256: hash(repaired), production: 'docs/comics/blue-purple-motion/production/pages-05-08/revision-03/' };
assert.deepEqual(core.buildTimeline(page), oldTimeline);
const save = (name, data) => { const file = path.join(projects, name); fs.writeFileSync(file, JSON.stringify(data, null, 2), { flag: 'wx' }); readDocument(file); return relative(file); };
const files = [save('blue-purple-page05-v5.json', page)];
for (const stem of ['blue-purple-pages01-08', 'blue-purple-pages05-08', 'blue-purple-page05-with-music']) {
  const source = path.join(projects, `${stem}-v4.json`), data = read(source);
  const previous = readDocument(source);
  data.version = 5; data.title = data.title.replace('révision 2', 'révision 3');
  data.pages = data.pages.map(item => item.manifest === 'blue-purple-page05-v4.json' ? { ...item, manifest: 'blue-purple-page05-v5.json' } : item);
  data.provenance = { ...data.provenance, revision: 3, correction: 'Only the John recoil drawing changes; previous voices, music, SFX, panels and timings retained.', production: 'docs/comics/blue-purple-motion/production/pages-05-08/revision-03/' };
  const file = save(`${stem}-v5.json`, data); files.push(file);
  const current = readDocument(path.join(ROOT, file));
  assert.deepEqual(current.timeline, previous.timeline);
}
const report = { status: 'completed', createdAt: new Date().toISOString(), files, replacedSource: oldFile, repairedSource: relative(repaired), correctedSha256: hash(repaired), timingUnchanged: true, newVoiceRequests: 0 };
fs.writeFileSync(path.join(base, 'selection-v1.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
console.info(JSON.stringify(report));
