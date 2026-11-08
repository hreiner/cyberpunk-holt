const {test} = require('node:test');
const assert = require('node:assert/strict');
const {assertManifest, assetPaths, rebaseAssets} = require('../core.js');
const template = require('../templates/scene.json');

test('un dessin animé par matière conserve un lettrage séparé sans pose corporelle factice', () => {
  const page = {...structuredClone(template), motionBaseImage:'drawing.png', letteringImage:'letters.svg'};
  page.panels[0].cues = [{audio:'voice.mp3',duration:1}];
  assert.doesNotThrow(()=>assertManifest(page));
  assert(assetPaths(page).includes('drawing.png'));
  assert(assetPaths(page).includes('letters.svg'));
  const snapshot = rebaseAssets(page, p=>'media/'+p);
  assert.equal(snapshot.motionBaseImage,'media/drawing.png');
  assert.equal(snapshot.letteringImage,'media/letters.svg');
  delete page.letteringImage;
  assert.throws(()=>assertManifest(page), /letteringImage/);
  page.letteringImage='letters.svg'; delete page.motionBaseImage;
  assert.throws(()=>assertManifest(page), /dessin de base/);
});
