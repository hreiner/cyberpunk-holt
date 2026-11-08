const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sample, render, letteringPath } = require('../layers.js');
const { assertManifest, buildTimeline, assetPaths, rebaseAssets } = require('../core.js');

function layer() {
  return { id: 'coup-john', panelId: 'action', mode: 'frames', rect: [0.1, 0.1, 0.8, 0.8], startSeconds: 2, endSeconds: 5,
    frames: [{ atSeconds: 0, image: 'ready.png' }, { atSeconds: 1, image: 'contact.png' }, { atSeconds: 2, image: 'down.png' }] };
}
function manifest() {
  return { schemaVersion: 1, version: 1, title: 'Action dessinée', image: 'master.png', motionBaseImage: 'raw.png', letteringImage: 'letters.svg',
    overviewSeconds: 1, transitionSeconds: 0.2, gapSeconds: 0.1, outroSeconds: 0.2,
    panels: [{ id: 'action', rect: [0, 0, 1, 1], holdSeconds: 10, cues: [{ audio: 'voice.mp3', duration: 1 }] }], motionLayers: [layer()] };
}

test('les poses dessinées changent au contact puis gardent le barman assommé sans boucle ni mélange de mains', () => {
  const data = layer(), original = JSON.stringify(data);
  assert.deepEqual([0, 2, 2.99, 3, 3.99, 4, 5, 900].map(t => sample(data, t).frameIndex), [0, 0, 0, 1, 1, 2, 2, 2]);
  assert.deepEqual(sample(data, 3.5), sample(data, 3.5));
  assert.equal(JSON.stringify(data), original);
});

test('un vrai sprite se déplace sur son fond reconstruit et un impact bref reste borné à huit pixels', () => {
  const data = { ...layer(), mode: 'sprite', background: 'clean.png', frames: [{ atSeconds: 0, image: 'car.png' }],
    keyframes: [{ atSeconds: 0, translate: [0, 0], scale: 1 }, { atSeconds: 2, translate: [0.5, -0.25], scale: 0.5 }],
    impact: { atSeconds: 1, durationSeconds: 0.2, amplitudePx: 8 } };
  assert.deepEqual(sample(data, 3).transform, { translate: [0.25, -0.125], scale: 0.75, rotationDegrees: 0, opacity: 1 });
  assert.deepEqual(sample(data, 900).transform.translate, [0.5, -0.25]);
  assert.deepEqual(sample(data, 1).impact, [0, 0]);
  assert(sample(data, 3.05).impact.some(v => Math.abs(v) > 1));
  for (let time = 0; time <= 8; time += 0.013) assert(sample(data, time).impact.every(v => Math.abs(v) <= 8));
  assert.deepEqual(sample(data, 3.21).impact, [0, 0]);
});

test('les calques refusent médias distants, poses inversées, fonds absents et mouvements hors limites', () => {
  assert.doesNotThrow(() => buildTimeline(manifest()));
  const mutations = [
    d => { delete d.motionBaseImage; }, d => { delete d.letteringImage; },
    d => { d.motionLayers[0].mode = 'warp'; }, d => { d.motionLayers[0].mode = 'sprite'; },
    d => { d.motionLayers[0].frames[0].image = 'https://example.org/pose.png'; },
    d => { d.motionLayers[0].frames[0].atSeconds = 1; },
    d => { d.motionLayers[0].frames[2].atSeconds = 0.5; },
    d => { d.motionLayers[0].frames[1].sourceRect = [0.9, 0, 0.2, 1]; },
    d => { d.motionLayers[0].rect = [0.9, 0, 0.2, 1]; },
    d => { d.motionLayers[0].endSeconds = 99; },
    d => { d.motionLayers[0].startSeconds = 0; },
    d => { d.motionLayers[0].keyframes = [{ atSeconds: 0, translate: [0.1, 0] }]; },
    d => { Object.assign(d.motionLayers[0], { mode: 'sprite', background: 'clean.png', keyframes: [{ atSeconds: 0, scale: 0 }] }); },
    d => { Object.assign(d.motionLayers[0], { mode: 'sprite', background: 'clean.png', keyframes: [{ atSeconds: 0, translate: [3, 0] }] }); },
    d => { d.motionLayers[0].impact = { atSeconds: 1, durationSeconds: 0.26, amplitudePx: 8 }; },
    d => { d.motionLayers[0].impact = { atSeconds: 1, durationSeconds: 0.1, amplitudePx: 9 }; },
  ];
  for (const change of mutations) { const bad = manifest(); change(bad); assert.throws(() => buildTimeline(bad)); }
  const outside = manifest(); outside.panels[0].rect = [0.2, 0.2, 0.6, 0.6];
  assert.throws(() => assertManifest(outside), /dans sa case/);
});

test('les snapshots emportent tous les vrais médias et les rebasent sans modifier la sélection', () => {
  const data = manifest(), original = JSON.stringify(data);
  data.motionLayers[0].background = 'ready.png';
  assert.deepEqual(assetPaths(data), ['master.png', 'raw.png', 'letters.svg', 'voice.mp3', 'ready.png', 'contact.png', 'down.png']);
  delete data.motionLayers[0].background;
  const copy = rebaseAssets(data, file => `snapshot/${file}`);
  assert(assetPaths(copy).every(file => file.startsWith('snapshot/')));
  assert.equal(JSON.stringify(data), original);
});

test('les queues suivent le dessin courant avant le coup, au contact puis au KO et partent dans le snapshot', () => {
  const data = manifest(), track = data.motionLayers[0];
  track.frames[0].letteringImage = 'ready-letters.svg';
  track.frames[1].letteringImage = 'contact-letters.svg';
  track.frames[2].letteringImage = 'down-letters.svg';
  assert.deepEqual([0, 2.9, 3, 4, 900].map(time => letteringPath([track], time, data.letteringImage)),
    ['ready-letters.svg', 'ready-letters.svg', 'contact-letters.svg', 'down-letters.svg', 'down-letters.svg']);
  assert.equal(letteringPath([], 9, 'default.svg'), 'default.svg');
  assert(assetPaths(data).includes('contact-letters.svg'));
  const snapshot = rebaseAssets(data, value => `snapshot/${value}`);
  assert.equal(snapshot.motionLayers[0].frames[2].letteringImage, 'snapshot/down-letters.svg');
  assert.equal(track.frames[2].letteringImage, 'down-letters.svg');
  track.frames[0].letteringImage = 'https://example.org/letters.svg';
  assert.throws(() => assertManifest(data));
  track.frames[0].letteringImage = 'ready-letters.svg';
  data.motionLayers.push({ ...structuredClone(track), id: 'second-letter-track' });
  assert.throws(() => assertManifest(data), /Un seul calque/);
});

function recording() {
  const calls = [];
  const ctx = new Proxy({}, { get: (target, name) => target[name] ?? ((...args) => calls.push([name, ...args.map(v => v?.id ?? v)])),
    set: (target, name, value) => { target[name] = value; calls.push(['set', name, value]); return true; } });
  return { calls, canvas: { width: 1000, height: 500, getContext: () => ctx } };
}
test('le rendu place fond, pose unique puis lettres et l’arrêt restitue strictement le master', () => {
  const sprite = { ...layer(), mode: 'sprite', background: 'clean.png' };
  const images = Object.fromEntries(['clean.png', 'ready.png', 'contact.png', 'down.png'].map(id => [id, { id, width: 400, height: 200 }]));
  const master = { id: 'master', width: 1000, height: 500 }, letters = { id: 'letters', width: 1000, height: 500 };
  const draw = (time, enabled) => {
    const result = recording(); render.canvas = result.canvas;
    render(master, [sprite], images, time, enabled, letters); return result.calls;
  };
  assert.deepEqual(draw(3, true).filter(c => c[0] === 'drawImage').map(c => c[1]), ['master', 'clean.png', 'contact.png', 'letters']);
  assert.deepEqual(draw(3, false), draw(900, false));
  assert.deepEqual(draw(3, false).filter(c => c[0] === 'drawImage').map(c => c[1]), ['master']);
  assert(draw(3, true).some(c => c[0] === 'rect' && c[1] === 100 && c[2] === 50 && c[3] === 800 && c[4] === 400));
});

test('les ombres de contact restent sous le sprite dans son même mouvement, et disparaissent avec les animations', () => {
  const data = manifest(), track = data.motionLayers[0];
  track.mode = 'sprite'; track.background = 'clean.png';
  track.keyframes = [{ atSeconds: 0 }, { atSeconds: 2, translate: [0.5, -0.25], scale: 0.5 }];
  track.contactShadow = { color: '#030815', opacity: 0.65, ellipses: [{ center: [0.6, 0.8], size: [0.5, 0.08], rotationDegrees: 8, opacity: 0.5 }] };
  assert.doesNotThrow(() => buildTimeline(data));
  for (const change of [
    s => { s.opacity = 0.9; }, s => { s.ellipses[0].center = [2, 0.5]; },
    s => { s.ellipses[0].size = [0.5, 0]; }, s => { s.ellipses = Array(5).fill(s.ellipses[0]); },
  ]) { const bad = structuredClone(data); change(bad.motionLayers[0].contactShadow); assert.throws(() => buildTimeline(bad)); }
  const badMode = structuredClone(data); badMode.motionLayers[0].mode = 'frames'; delete badMode.motionLayers[0].keyframes;
  assert.throws(() => buildTimeline(badMode), /sprite isolé/);
  const images = Object.fromEntries(['clean.png', 'ready.png', 'contact.png', 'down.png'].map(id => [id, { id, width: 400, height: 200 }]));
  const calls = [], gradient = { addColorStop: (...args) => calls.push(['stop', ...args]) };
  const ctx = new Proxy({ createRadialGradient: () => gradient }, { get: (target, name) => target[name] ?? ((...args) => calls.push([name, ...args.map(v => v?.id ?? v)])),
    set: (target, name, value) => { target[name] = value; calls.push(['set', name, value]); return true; } });
  render.canvas = { width: 1000, height: 500, getContext: () => ctx };
  render({ id: 'master', width: 1000, height: 500 }, [track], images, 3, true);
  const shadowIndex = calls.findIndex(call => call[0] === 'fillRect');
  const spriteIndex = calls.findIndex(call => call[0] === 'drawImage' && call[1] === 'contact.png');
  assert(shadowIndex > 0 && spriteIndex > shadowIndex);
  assert(calls.some(call => call[0] === 'stop' && call[1] === 1 && call[2] === 'transparent'));
  assert(calls.slice(0, shadowIndex).some(call => call[0] === 'scale' && call[1] === 0.75), 'L’ombre hérite de l’échelle du véhicule.');
  calls.length = 0;
  render({ id: 'master', width: 1000, height: 500 }, [track], images, 3, false);
  assert(!calls.some(call => call[0] === 'fillRect'));
});

test('un silence ciblé garde le temps du coup après la sommation sans allonger les autres répliques', () => {
  const data = manifest(); delete data.motionLayers; delete data.motionBaseImage; delete data.letteringImage;
  data.panels[0].cues = [{ audio: 'warning.mp3', duration: 1, gapSeconds: 0.75 }, { audio: 'reaction.mp3', duration: 1 }];
  const timeline = buildTimeline(data);
  assert.equal(timeline.tracks[0].start, 1.2);
  assert.equal(timeline.tracks[1].start, 2.95);
  data.panels[0].cues[0].gapSeconds = -0.1;
  assert.throws(() => buildTimeline(data));
});

test('une fenêtre intacte précède les réactions sans étirer les voix ni les autres cases', () => {
  const data = manifest(); delete data.motionLayers; delete data.motionBaseImage; delete data.letteringImage;
  data.panels[0].holdSeconds = 4.5;
  data.panels[0].cues = [{ audio: 'warning.mp3', duration: 1.68 }, { audio: 'down.mp3', duration: 0.96 }];
  const before = buildTimeline(data);
  data.panels[0].leadInSeconds = 0.7; data.storyThumbnail = true;
  const after = buildTimeline(data);
  assert.equal(after.duration, before.duration);
  assert.equal(after.tracks[0].start - before.tracks[0].start, 0.7);
  assert.equal(Number((after.tracks[0].end - after.tracks[0].start).toFixed(8)), 1.68);
  assert.equal(Number((after.tracks[1].start - before.tracks[1].start).toFixed(8)), 0.7);
  delete data.panels[0].leadInSeconds; delete data.storyThumbnail;
  assert.deepEqual(buildTimeline(data), before);
  data.panels[0].leadInSeconds = -0.01; assert.throws(() => buildTimeline(data));
  delete data.panels[0].leadInSeconds; data.storyThumbnail = 'true'; assert.throws(() => buildTimeline(data));
});
