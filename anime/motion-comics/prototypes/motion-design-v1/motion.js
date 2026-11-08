/* Experimental timing only: no change to the production schema or renderer. */
/* global module, window */
(() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const easeOutCubic = value => 1 - (1 - clamp(value)) ** 3;
  function flow(anchors, time) {
    const ramp = anchors.cruise - anchors.flowStart;
    const elapsed = Math.max(0, time - anchors.flowStart);
    const u = clamp(elapsed / ramp);
    // Integral of 1 - (1-u)^3: changing speed never teleports a particle.
    const distance = ramp * (u - 0.25 + (1 - u) ** 4 / 4) + Math.max(0, elapsed - ramp);
    const velocity = easeOutCubic(u);
    const fade = 1 - clamp((time - anchors.fadeStart) / (anchors.flowEnd - anchors.fadeStart));
    return { distance, velocity, gain: velocity * fade * fade * (3 - 2 * fade) };
  }
  function sample(plan, time) {
    const duration = plan.scenes.reduce((sum, scene) => sum + scene.duration, 0);
    const position = Math.max(0, Math.min(duration, time));
    let start = 0;
    for (let index = 0; index < plan.scenes.length; index++) {
      const scene = plan.scenes[index];
      if (position < start + scene.duration || index === plan.scenes.length - 1) {
        const local = position - start;
        return { index, scene, start, local, position, duration,
          flow: scene.id === 'wind' ? flow(scene.anchors, local) : null };
      }
      start += scene.duration;
    }
  }
  const api = { sample, flow, easeOutCubic };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.holtMotionStudy = api;
})();
