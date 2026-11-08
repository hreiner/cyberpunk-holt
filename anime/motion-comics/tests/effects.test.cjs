const { test } = require('node:test');
const assert = require('node:assert/strict');
const { render, sample } = require('../effects.js');

function recorder() {
  const calls = [], gradient = { addColorStop(...args) { calls.push(['colorStop', ...args]); } };
  const ctx = new Proxy({}, {
    get(target, name) {
      if (Object.hasOwn(target, name)) return target[name];
      if (name === 'createLinearGradient' || name === 'createRadialGradient') return (...args) => { calls.push([name, ...args]); return gradient; };
      return (...args) => { calls.push([name, ...args.map(arg => typeof arg === 'object' ? '<image>' : arg)]); };
    },
    set(target, name, value) { target[name] = value; calls.push(['set', name, typeof value === 'object' ? '<gradient>' : value]); return true; },
  });
  const canvas = { width: 1024, height: 1536, getContext: () => ctx };
  return { calls, canvas };
}

test('le temps ambiant ne révèle pas les coordonnées quand le récit reste en pause', () => {
  const fx = { startSeconds: 12, revealSeconds: 1, count: 12 };
  assert.equal(sample(fx, 900, 11).active, false);
  assert.equal(sample(fx, 900, 12.9).reveal, 0);
  assert.equal(sample(fx, 1, 13.25).reveal, 0.5);
  assert.equal(sample(fx, 900, 13.25).reveal, 0.5);
  assert.equal(sample(fx, 5, 14).reveal, 1);
  assert.notDeepEqual(sample(fx, 1, 13.25).particles, sample(fx, 2, 13.25).particles);
});

test('les nouveaux effets restent déterministes et cessent complètement sur arrêt', () => {
  const image = { width: 1024, height: 1536 };
  const effects = ['particles', 'lightSweep', 'sparks', 'digitalVision'].map(type => ({
    type, rect: [0.1, 0.2, 0.6, 0.5], count: 12, startSeconds: 1,
    revealSeconds: 1, mapRect: [0.2, 0.3, 0.3, 0.2], protect: [[0.2, 0.2, 0.1, 0.1]],
  }));
  const draw = (time, enabled = true) => {
    const recording = recorder(); render.canvas = recording.canvas;
    render(image, effects, time, enabled, [{ id: 'visage', rect: [0.25, 0.3, 0.1, 0.1] }], 4);
    return recording.calls;
  };
  const original = JSON.stringify(effects);
  const first = draw(3), later = draw(4);
  assert.deepEqual(first, draw(3));
  assert.notDeepEqual(first, later);
  assert.equal(JSON.stringify(effects), original);
  const stopped = draw(3, false);
  assert.deepEqual(stopped, draw(900, false));
  assert.equal(stopped.filter(call => call[0] === 'drawImage').length, 1);
  assert(first.some(call => call[0] === 'clip' && call[1] === 'evenodd'), 'Les protections locales doivent découper les nouveaux effets.');
  assert.deepEqual(first.at(-2), ['drawImage', '<image>', 0, 0], 'La protection finale restaure les pixels originaux après les overlays.');
});

test('vapeur, éclats et ondes restent locaux, lisibles en pause et ne devancent pas le récit', () => {
  const image = { width: 1024, height: 1536 };
  for (const type of ['smoke', 'debris', 'ripple', 'wind']) {
    const fx = { type, rect: [0.2, 0.3, 0.4, 0.2], count: 6, speed: 0.8,
      startSeconds: 8, protect: [[0.3, 0.3, 0.08, 0.06]] };
    const draw = (ambient, story = 9, enabled = true) => {
      const recording = recorder(); render.canvas = recording.canvas;
      render(image, [fx], ambient, enabled, [{ id: 'bulle', rect: [0.1, 0.1, 0.3, 0.1] }], story);
      return recording.calls;
    };
    const first = draw(2);
    assert.deepEqual(first, draw(2), `${type} doit être reproductible.`);
    assert.notDeepEqual(first, draw(3), `${type} doit bouger lorsque le récit est en pause.`);
    assert(first.some(call => call[0] === 'clip' && call[1] === 'evenodd'), `${type} doit respecter les protections locales.`);
    assert.deepEqual(first.at(-2), ['drawImage', '<image>', 0, 0], `${type} doit laisser restaurer la bulle après son dessin.`);
    assert(!first.some(call => call.slice(1).some(value => typeof value === 'number' && !Number.isFinite(value))), `${type} ne doit pas produire de géométrie invalide.`);
    const before = draw(900, 7);
    assert(!before.some(call => ['fill', 'fillRect', 'ellipse'].includes(call[0])), `${type} ne doit pas apparaître avant l'événement narratif.`);
    const stopped = draw(2, 9, false);
    assert.deepEqual(stopped, draw(900, 99, false));
    assert.equal(stopped.filter(call => call[0] === 'drawImage').length, 1);
    assert.equal(first.filter(call => call[0] === 'drawImage').length, 2, `${type} superpose un dessin, sans déformation du raster.`);
  }
});

test('un événement physique borné se fige en pause et ne recommence pas après sa fin', () => {
  const image = { width: 1024, height: 1536 };
  for (const type of ['debris', 'ripple', 'reflection', 'rain', 'hair']) {
    const fx = { type, rect: [0.2, 0.3, 0.4, 0.2], count: 5, speed: 0.8,
      clock: 'story', startSeconds: 8, endSeconds: 10 };
    const draw = (ambient, story) => {
      const recording = recorder(); render.canvas = recording.canvas;
      render(image, [fx], ambient, true, [], story);
      return recording.calls;
    };
    assert.deepEqual(draw(2, 9), draw(900, 9), `${type} doit rester figé à récit constant.`);
    assert.notDeepEqual(draw(2, 8.5), draw(2, 9.5), `${type} doit suivre la progression du récit.`);
    const idle = draw(2, 7);
    assert.deepEqual(idle, draw(900, 10), `${type} s'arrête à la borne de fin.`);
    assert.deepEqual(idle, draw(900, 99), `${type} ne redémarre jamais après sa fin.`);
    assert.equal(idle.filter(call => call[0] === 'drawImage').length, 1);
  }
  const glass = { type: 'debris', clock: 'story', startSeconds: 8, endSeconds: 10 };
  assert.equal(sample(glass, 900, 7).active, false);
  assert.equal(sample(glass, 900, 8).progress, 0);
  assert.equal(sample(glass, 900, 9).progress, 0.5);
  assert.equal(sample(glass, 900, 10).active, false);
  assert.equal(sample(glass, 900, 11).progress, 1);
});

test('le halo doux des nouvelles pages atteint zéro au bord sans changer le chemin historique', () => {
  const image = { width: 1024, height: 1536 };
  for (const type of ['neon', 'reflection']) {
    const fx = { type, rect: [0.2, 0.3, 0.4, 0.2], strength: 0.5 };
    const draw = effect => {
      const recording = recorder(); render.canvas = recording.canvas;
      render(image, [effect], 1); return recording.calls;
    };
    const legacy = draw(fx);
    assert.deepEqual(legacy, draw({ ...fx, softEdge: false }));
    const soft = draw({ ...fx, softEdge: true });
    assert(soft.some(call => call[0] === 'scale' && call[1] === 204.8 && call[2] === 153.60000000000002));
    assert(soft.some(call => call[0] === 'createRadialGradient' && call.at(-1) === 1));
    assert(soft.some(call => call[0] === 'colorStop' && call[1] === 1 && call[2] === 'transparent'));
    assert(!soft.some(call => call[0] === 'fillRect' && call[1] > 1), 'Le halo utilise le domaine elliptique normalisé, pas une plage rectangle étendue.');
  }
});
