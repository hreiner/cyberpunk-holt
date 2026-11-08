const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertManifest, buildTimeline } = require('../core.js');
const template = require('../templates/scene.json');

test('les effets narratifs acceptent une minimap interne et refusent les paramètres qui cassent le dessin ou le temps', () => {
  const data = structuredClone(template);
  const vision = { type: 'digitalVision', rect: [0.1, 0.1, 0.8, 0.8], mapRect: [0.3, 0.3, 0.4, 0.4],
    panelId: data.panels[0].id, startSeconds: 1, revealSeconds: 1, count: 24, speed: 0.5, amplitude: 28 };
  data.effects = [vision, { type: 'sparks', rect: [0, 0, 0.3, 0.3], amplitude: 32 }];
  assert.doesNotThrow(() => buildTimeline(data));
  for (const change of [
    effect => { effect.count = 2.5; }, effect => { effect.count = 81; },
    effect => { effect.speed = -1; }, effect => { effect.speed = 3; },
    effect => { effect.amplitude = 41; }, effect => { effect.startSeconds = -1; },
    effect => { effect.revealSeconds = 11; }, effect => { effect.mapRect = [0, 0, 0.2, 0.2]; },
    effect => { effect.panelId = 'case-absente'; }, effect => { effect.type = 'particles'; },
  ]) {
    const invalid = structuredClone(data); change(invalid.effects[0]);
    assert.throws(() => assertManifest(invalid));
  }
  const late = structuredClone(data); late.effects[0].startSeconds = buildTimeline(data).duration;
  assert.throws(() => buildTimeline(late), /chronologie/);
  const hair = structuredClone(data); hair.effects = [{ type: 'hair', rect: [0, 0, 0.3, 0.3], amplitude: 13 }];
  assert.throws(() => assertManifest(hair), /12/);
});
