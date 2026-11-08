/* Preserve v3 QA selection, remove the single unsupported reflection for delivery. */
/* eslint @typescript-eslint/no-require-imports: "off" -- Standalone Node production tool. */
/* global require, __dirname, console, structuredClone */
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '../../../../../..');
const projects = path.join(root, 'anime/motion-comics/projects');
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (name, data) => {
  const file = path.join(projects, name);
  if (fs.existsSync(file)) {
    if (!isDeepStrictEqual(read(file), data)) throw Error(`Révision existante différente : ${name}`);
  } else fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
  readDocument(file);
};
const page = read(path.join(projects, 'blue-purple-page04-v3.json'));
const fix = read(path.join(__dirname, 'effects-plans/page-04-fix-v1.json'));
const removed = page.effects.filter(effect => !fix.effects.some(item => isDeepStrictEqual(item, effect)));
const added = fix.effects.filter(effect => !page.effects.some(item => isDeepStrictEqual(item, effect)));
if (removed.length !== 1 || removed[0].type !== 'lightSweep' || removed[0].panelId !== 'p04-c02' || added.length) throw Error('La correction doit retirer seulement le reflet sans support de p04-c02.');
if (!isDeepStrictEqual(page.protectedRegions, fix.protectedRegions)) throw Error('La correction ne doit pas changer les protections.');
const finalPage = structuredClone(page);
finalPage.version = 4;
finalPage.effects = fix.effects;
finalPage.provenance.previousManifest = 'blue-purple-page04-v3.json';
finalPage.provenance.visualCorrection = 'Retrait du reflet cyan rectangulaire sans support dans p04-c02 ; particules autour du vrai néon conservées.';
save('blue-purple-page04-v4.json', finalPage);
const sequence = read(path.join(projects, 'blue-purple-pages01-04-v3.json'));
sequence.version = 4;
sequence.pages[3].manifest = 'blue-purple-page04-v4.json';
sequence.provenance.previousManifest = 'blue-purple-pages01-04-v3.json';
sequence.provenance.finalCorrection = 'Une correction locale de reflet page 4 après contre-revue, sans changement de voix, dessin ou temps.';
save('blue-purple-pages01-04-v4.json', sequence);
const result = readDocument(path.join(projects, 'blue-purple-pages01-04-v4.json'));
console.info(JSON.stringify({ duration: result.timeline.duration, effects: result.pages.reduce((count, item) => count + item.data.effects.length, 0), voices: result.timeline.tracks.length }));
