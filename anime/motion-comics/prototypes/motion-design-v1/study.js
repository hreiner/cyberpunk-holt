/* Isolated, silent study using existing HOLT images and production compositors. */
/* global document, window, Image, structuredClone, performance, fetch */
const canvas = document.querySelector('#study'), ctx = canvas.getContext('2d');
const pageCanvas = document.createElement('canvas'), pageContext = pageCanvas.getContext('2d');
let plan, pages, current = 0, playing = false, origin = 0, manual = false;
let enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastState, currentArt;
const images = new Map();
function imageFile(url) {
  if (!images.has(url)) images.set(url, new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(Error('Dessin inaccessible.')); image.src = url;
  }));
  return images.get(url);
}
function repaint(time) {
  const state = window.holtMotionStudy.sample(plan, time), scene = state.scene, page = pages[scene.page];
  const data = page.data, assets = page.assets;
  let art = assets[data.image];
  if (enabled && scene.id !== 'wind') {
    const source = data.motionLayers.find(layer => layer.panelId === scene.panelId);
    const layer = structuredClone(source);
    layer.startSeconds = 0; layer.endSeconds = scene.duration; delete layer.impact;
    const times = scene.id === 'punch' ? [0, scene.anchors.contact, scene.anchors.recoil, scene.anchors.down] : [0, scene.anchors.shatter];
    layer.frames.forEach((frame, index) => { frame.atSeconds = times[index]; });
    art = window.motionLayers.render(assets[data.motionBaseImage], [layer], assets, state.local, true);
    state.pose = window.motionLayers.sample(layer, state.local).frameIndex;
  }
  currentArt = art;
  let effects = [];
  let ambientTime = state.local;
  if (enabled && scene.id === 'glass') {
    effects = data.effects.filter(fx => fx.panelId === scene.panelId && fx.type === 'debris').map(fx => ({ ...fx,
      startSeconds: scene.anchors.shatter, endSeconds: scene.anchors.debrisEnd }));
  } else if (enabled && scene.id === 'wind') {
    ambientTime = state.flow.distance;
    effects = data.effects.filter(fx => fx.panelId === scene.panelId && fx.type === 'wind').map(fx => ({ ...fx,
      startSeconds: 0, strength: fx.strength * state.flow.gain, amplitude: fx.amplitude * (0.45 + 0.55 * state.flow.velocity) }));
  }
  const painted = window.motionEffects.render(art, effects, ambientTime, enabled, data.protectedRegions ?? [], state.local);
  if (pageCanvas.width !== art.width || pageCanvas.height !== art.height) { pageCanvas.width = art.width; pageCanvas.height = art.height; }
  pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height); pageContext.drawImage(painted, 0, 0);
  if (enabled && scene.id !== 'wind' && data.letteringImage) pageContext.drawImage(assets[data.letteringImage], 0, 0);
  const panel = data.panels.find(panel => panel.id === scene.panelId), [x, y, w, h] = panel.rect.map((v, i) => v * (i % 2 ? pageCanvas.height : pageCanvas.width));
  const scale = Math.min(canvas.width / w, canvas.height / h), width = w * scale, height = h * scale;
  ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(pageCanvas, x, y, w, h, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  current = state.position; lastState = state;
  document.querySelector('#intent').textContent = scene.intent;
  document.querySelector('#progress').value = current;
  document.querySelector('#clock').textContent = `${current.toFixed(2)} / ${state.duration.toFixed(2)} s`;
  document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.scene) === state.index)));
  return state;
}
function pause() { playing = false; document.querySelector('#play').textContent = 'Lire'; }
function seek(time) { pause(); return repaint(time); }
function play() {
  if (current >= window.holtMotionStudy.sample(plan, 0).duration) current = 0;
  playing = true; origin = performance.now() - current * 1000; document.querySelector('#play').textContent = 'Pause';
}
function tick(now) {
  if (playing && !manual) {
    const state = repaint((now - origin) / 1000);
    if (current >= state.duration) pause();
  }
  window.requestAnimationFrame(tick);
}
(async () => {
  const response = await fetch('/motion-study.json'); if (!response.ok) throw Error('Étude inaccessible.');
  const descriptor = await response.json(); plan = descriptor.plan; pages = descriptor.pages;
  for (const page of Object.values(pages)) {
    page.assets = {};
    const paths = [page.data.image, page.data.motionBaseImage, page.data.letteringImage,
      ...(page.data.motionLayers ?? []).flatMap(layer => [layer.background, ...layer.frames.flatMap(frame => [frame.image, frame.letteringImage])])].filter(Boolean);
    await Promise.all([...new Set(paths)].map(async file => { page.assets[file] = await imageFile(file); }));
  }
  await window.document.fonts.ready;
  let offset = 0;
  plan.scenes.forEach((scene, index) => {
    const button = window.document.createElement('button'), start = offset;
    button.textContent = `${index + 1}. ${scene.label}`; button.dataset.scene = index; button.onclick = () => seek(start);
    window.document.querySelector('#scenes').append(button); offset += scene.duration;
  });
  window.document.querySelector('#effects').checked = enabled;
  window.document.querySelector('#effects').onchange = event => { enabled = event.target.checked; repaint(current); };
  window.document.querySelector('#play').disabled = false;
  window.document.querySelector('#restart').disabled = false;
  window.document.querySelector('#play').onclick = () => playing ? pause() : play();
  window.document.querySelector('#restart').onclick = () => seek(0);
  window.document.querySelector('#progress').max = offset;
  window.document.querySelector('#progress').oninput = event => seek(Number(event.target.value));
  window.holtStudy = { seek, render: repaint, play, pause, setManual: value => { manual = Boolean(value); pause(); },
    setEffects: value => { enabled = Boolean(value); window.document.querySelector('#effects').checked = enabled; repaint(current); },
    get state() { return lastState; }, get plan() { return structuredClone(plan); }, get pages() { return pages; },
    get artCanvas() { return currentArt; }, get pageCanvas() { return pageCanvas; }, get playing() { return playing; } };
  repaint(0); window.requestAnimationFrame(tick);
})().catch(error => { document.querySelector('#error').textContent = error.message; });
