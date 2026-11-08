const { test } = require('node:test');
const assert = require('node:assert/strict');
const { flow, sample } = require('../prototypes/motion-design-v2/motion.js');
const plan = require('../prototypes/motion-design-v2/plan.json');

test('le flux expérimental intègre sa vitesse sans saut et reste borné aux phases prévues', () => {
  const anchors = plan.scenes.find(scene => scene.id === 'wind').anchors;
  assert.deepEqual(flow(anchors, 0), { distance: 0, velocity: 0, gain: 0 });
  let previous = -1;
  for (let time = 0; time <= 6; time += 0.05) {
    const state = flow(anchors, time);
    assert(state.distance >= previous); previous = state.distance;
    assert(state.velocity >= 0 && state.velocity <= 1 && state.gain >= 0 && state.gain <= 1);
    const epsilon = 0.00001;
    const derivative = (flow(anchors, time + epsilon).distance - flow(anchors, time - epsilon).distance) / (2 * epsilon);
    assert(Math.abs(derivative - state.velocity) < 0.0001, `Vitesse incohérente à ${time}`);
  }
  for (const boundary of [anchors.flowStart, anchors.cruise, anchors.fadeStart, anchors.flowEnd]) {
    assert(Math.abs(flow(anchors, boundary - 1e-8).distance - flow(anchors, boundary + 1e-8).distance) < 1e-6);
  }
  assert.equal(flow(anchors, anchors.flowEnd).gain, 0);
});

test('les études se recherchent directement aux raccords sans changer le plan source', () => {
  const before = JSON.stringify(plan);
  const times = [0, 5.49, 5.5, 10.49, 10.5, 16.5, 0, 1.5];
  assert.deepEqual(times.map(time => sample(plan, time).scene.id), ['punch', 'punch', 'glass', 'glass', 'wind', 'wind', 'punch', 'punch']);
  assert.equal(sample(plan, 5.5).local, 0);
  assert.equal(sample(plan, 10.5).local, 0);
  assert.deepEqual(sample(plan, 13), sample(plan, 13));
  assert.equal(JSON.stringify(plan), before);
});
