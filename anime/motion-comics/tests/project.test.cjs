const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assertManifest, buildTimeline } = require('../core.js');
const { createScene, readProject, newDirectory } = require('../project.cjs');
const template = require('../templates/scene.json');
const bluePurple = require('../projects/blue-purple-page01.json');
const clone = value => structuredClone(value);

test('la référence Blue Purple conserve ses quatre prises et son rythme', () => {
  const before = JSON.stringify(bluePurple), result = buildTimeline(bluePurple);
  assert.equal(result.duration, 27.48);
  assert.deepEqual(result.tracks.map(t => Number(t.start.toFixed(2))), [2.85, 9.94, 13.27, 22.19]);
  assert.equal(result.segments.length, 6);
  assert.equal(JSON.stringify(bluePurple), before);
  assert.deepEqual(buildTimeline(bluePurple), result);
  const legacy = clone(bluePurple); delete legacy.schemaVersion;
  assert.deepEqual(buildTimeline(legacy), result);
});

test('une scène muette et les transitions instantanées ont une durée finie', () => {
  const silent = buildTimeline(clone(template));
  assert.equal(silent.duration, 7.85); assert.deepEqual(silent.tracks, []);
  const instant = { ...clone(template), overviewSeconds: 0, transitionSeconds: 0, outroSeconds: 0 };
  assert.equal(buildTimeline(instant).duration, 3);
  instant.panels[0].holdSeconds = 0;
  assert.throws(() => buildTimeline(instant), /durée positive/);
});

test('le temps de lecture minimum et les respirations ne coupent pas les voix', () => {
  const data = clone(template);
  data.panels[0].holdSeconds = 10;
  data.panels[0].cues = [{ audio: 'first.mp3', duration: 2 }, { audio: 'second.mp3', duration: 3 }];
  const result = buildTimeline(data);
  assert.equal(Number(result.tracks[1].start.toFixed(2)), 5.45);
  assert.equal(result.segments[1].end, 12.85);
  assert.equal(result.duration, 14.85);
});

test('les défauts de manifeste qui cassent le rendu sont refusés avant accès aux médias', () => {
  const invalid = [
    d => { d.schemaVersion = 9; }, d => { d.version = 0; },
    d => { d.panels.push(clone(d.panels[0])); },
    d => { d.panels[0].rect = [0.8, 0, 0.3, 1]; },
    d => { d.panels[0].holdSeconds = -2; }, d => { d.transitionSeconds = NaN; },
    d => { d.panels[0].cues = [{ audio: 'voice.mp3', duration: 0 }]; },
    d => { d.image = 'https://example.org/image.png'; }, d => { d.image = 'C:/secret.png'; },
    d => { d.effects = [{ type: 'unknown', rect: [0, 0, 1, 1] }]; },
    d => { d.effects = [{ type: 'hair', rect: [0, 0, 1, 1], amplitude: 13 }]; },
    d => { d.effects = [{ type: 'neon', rect: [0, 0, 1, 1], strength: 0.8 }]; },
    d => { d.protectedRegions = [{ id: 'eyes', rect: [0, 0, -1, 1] }]; },
  ];
  for (const change of invalid) { const data = clone(template); change(data); assert.throws(() => assertManifest(data)); }
});

test('les effets de matière acceptent les protections et refusent les valeurs qui satureraient le rendu', () => {
  for (const type of ['smoke', 'debris', 'ripple']) {
    const data = clone(template);
    data.effects = [{ type, rect: [0.1, 0.2, 0.3, 0.2], count: 6, speed: 0.8,
      strength: 0.5, startSeconds: 1, panelId: data.panels[0].id, protect: [[0.2, 0.2, 0.05, 0.1]] }];
    assert.doesNotThrow(() => buildTimeline(data));
    for (const invalid of [{ count: 81 }, { speed: 3 }, { strength: 0.8 }, { startSeconds: 900 },
      { endSeconds: 1 }, { endSeconds: 900 }, { clock: 'wall' }, { direction: 'down' }]) {
      const bad = clone(data); Object.assign(bad.effects[0], invalid);
      assert.throws(() => buildTimeline(bad));
    }
  }
});

test('le temps narratif et les directions de vapeur sont explicites et rétrocompatibles', () => {
  for (const direction of ['up', 'left', 'right']) {
    const data = clone(template);
    data.effects = [{ type: 'smoke', direction, clock: 'story', startSeconds: 1, endSeconds: 3, rect: [0.1, 0.2, 0.3, 0.2] }];
    assert.doesNotThrow(() => buildTimeline(data));
    data.effects[0].type = 'rain';
    assert.throws(() => buildTimeline(data), /réservé à smoke/);
  }
});

test('le vent directionnel est borné et ne détourne pas les paramètres des anciens effets', () => {
  const data = clone(template);
  data.effects = [{ type: 'wind', rect: [0.1, 0.2, 0.3, 0.3], directionDegrees: 24, count: 32, speed: 1.2, strength: 0.6 }];
  assert.doesNotThrow(() => buildTimeline(data));
  data.effects[0].directionDegrees = 181; assert.throws(() => buildTimeline(data));
  data.effects[0].directionDegrees = 24; data.effects[0].type = 'rain'; assert.throws(() => buildTimeline(data), /réservé/);
});

test('remplacer une case dans une révision laisse les autres cases et la révision précédente intactes', () => {
  const original = clone(bluePurple), before = JSON.stringify(original);
  const revision = clone(original); revision.version++;
  revision.panels[1].cues[0].audio = 'voice-john-v2.mp3';
  revision.panels[1].cues[0].duration += 1;
  const first = buildTimeline(original), second = buildTimeline(revision);
  assert.equal(JSON.stringify(original), before);
  assert.deepEqual(revision.panels.filter((_, i) => i !== 1), original.panels.filter((_, i) => i !== 1));
  assert.equal(second.tracks[0].start, first.tracks[0].start);
  assert.equal(Number((second.tracks[2].start - first.tracks[2].start).toFixed(4)), 1);
  assert.equal(Number((second.duration - first.duration).toFixed(4)), 1);
});

function sandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'holt-motion-test-'));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert(path.basename(root).startsWith('holt-motion-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return root;
}

test('initialiser puis relire une scène conserve les fichiers et refuse tout écrasement', t => {
  const root = sandbox(t), image = path.join(root, 'reference.png'), target = path.join(root, 'scene');
  fs.writeFileSync(image, 'image témoin pour contrôle de persistance');
  const { manifestFile } = createScene(target, image, root);
  const stored = fs.readFileSync(manifestFile, 'utf8');
  const project = readProject(manifestFile, root);
  assert.equal(project.timeline.duration, 7.85);
  assert.equal(fs.readFileSync(project.files[0], 'utf8'), fs.readFileSync(image, 'utf8'));
  assert.throws(() => createScene(target, image, root), /existe déjà/);
  assert.throws(() => newDirectory(target, root), /existe déjà/);
  assert.equal(fs.readFileSync(manifestFile, 'utf8'), stored);
  fs.unlinkSync(project.files[0]);
  assert.throws(() => readProject(manifestFile, root));
});

test('les chemins qui sortent du projet sont refusés', t => {
  const root = sandbox(t), image = path.join(root, 'page.png'); fs.writeFileSync(image, 'image');
  assert.throws(() => createScene(path.dirname(root), image, root), /dépôt/);
  const { manifestFile, data } = createScene(path.join(root, 'scene'), image, root);
  data.image = '../../outside.png'; fs.writeFileSync(manifestFile, JSON.stringify(data));
  assert.throws(() => readProject(manifestFile, root), /dépôt/);
});
