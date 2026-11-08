/* Real authored poses and isolated sprites, sampled only on the narrative clock. */
/* global module */
(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, weight) => a + (b - a) * weight;
  // Local narrative times can inherit cancellation error from a chapter-wide seek.
  // 100 picoseconds absorb that representation error without moving an event by a frame.
  const STORY_BOUNDARY_TOLERANCE_SECONDS = 1e-10;
  const atOrAfter = (time, boundary) => time >= boundary || boundary - time <= STORY_BOUNDARY_TOLERANCE_SECONDS;
  const identity = key => ({ translate: key?.translate ?? [0, 0], scale: key?.scale ?? 1,
    rotationDegrees: key?.rotationDegrees ?? 0, opacity: key?.opacity ?? 1 });
  function sample(layer, storyTime) {
    const elapsed = clamp(storyTime - layer.startSeconds, 0, layer.endSeconds - layer.startSeconds);
    let frameIndex = 0;
    // Compare authored absolute anchors: subtracting 4.05 from 5.10 can otherwise
    // produce 1.0499999999999998 and reveal the next drawing one frame late.
    for (let index = 1; index < layer.frames.length; index++) if (atOrAfter(storyTime, layer.startSeconds + layer.frames[index].atSeconds)) frameIndex = index;
    const keys = layer.keyframes ?? [{ atSeconds: 0 }];
    let index = 0;
    while (index + 1 < keys.length && keys[index + 1].atSeconds <= elapsed) index++;
    const first = keys[index], second = keys[Math.min(index + 1, keys.length - 1)];
    const span = second.atSeconds - first.atSeconds;
    let weight = span > 0 ? clamp((elapsed - first.atSeconds) / span, 0, 1) : 0;
    if ((second.easing ?? 'smoothstep') === 'smoothstep') weight = weight * weight * (3 - 2 * weight);
    const a = identity(first), b = identity(second);
    const transform = { translate: a.translate.map((v, i) => mix(v, b.translate[i], weight)),
      scale: mix(a.scale, b.scale, weight), rotationDegrees: mix(a.rotationDegrees, b.rotationDegrees, weight), opacity: mix(a.opacity, b.opacity, weight) };
    let impact = [0, 0];
    if (layer.impact && storyTime >= layer.startSeconds) {
      const event = layer.impact, progress = (elapsed - event.atSeconds) / event.durationSeconds;
      if (progress >= 0 && progress < 1) {
        const amplitude = Math.min(8, Math.max(0, event.amplitudePx)) * (1 - progress);
        impact = [Math.sin(progress * Math.PI * 6) * amplitude, Math.sin(progress * Math.PI * 4) * amplitude * 0.4];
      }
    }
    const revealEnd = layer.mode === 'digitalReveal' ? layer.startSeconds + layer.frames[1].atSeconds : null;
    const revealProgress = revealEnd === null ? null : atOrAfter(storyTime, revealEnd) ? 1 :
      clamp((storyTime - revealEnd + layer.reveal.durationSeconds) / layer.reveal.durationSeconds, 0, 1);
    return { elapsed, frameIndex, transform, impact, ...(revealProgress === null ? {} : { revealProgress }) };
  }
  function asset(assets, path) {
    const image = typeof assets?.get === 'function' ? assets.get(path) : assets?.[path];
    if (!image) throw Error(`Calque image non chargé : ${path}`);
    return image;
  }
  function letteringPath(layers, storyTime, defaultPath = null) {
    let path = defaultPath;
    for (const layer of layers ?? []) {
      const frame = layer.frames[sample(layer, storyTime).frameIndex];
      if (frame.letteringImage !== undefined) path = frame.letteringImage;
    }
    return path;
  }
  function concealPanels(image, panels, reveals, storyTime, enabled = true, target = null) {
    const hidden = enabled ? (reveals ?? []).filter(reveal => !atOrAfter(storyTime, reveal.atSeconds)) : [];
    if (!hidden.length) return image;
    const canvas = target ?? globalThis.document.createElement('canvas');
    if (canvas === image) throw Error('La révélation de case exige une sortie distincte de sa source.');
    if (canvas.width !== image.width || canvas.height !== image.height) { canvas.width = image.width; canvas.height = image.height; }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0); ctx.fillStyle = '#050509';
    for (const reveal of hidden) {
      const panel = panels.find(item => item.id === reveal.panelId);
      if (!panel) throw Error('Case masquée inconnue.');
      ctx.fillRect(...panel.rect.map((value, index) => value * (index % 2 ? image.height : image.width)));
    }
    return canvas;
  }
  function paintContactShadow(ctx, shadow, width, height, pivot) {
    for (const ellipse of shadow.ellipses) {
      ctx.save();
      ctx.translate((ellipse.center[0] - pivot[0]) * width, (ellipse.center[1] - pivot[1]) * height);
      ctx.rotate((ellipse.rotationDegrees ?? 0) * Math.PI / 180);
      ctx.scale(ellipse.size[0] * width * 0.5, ellipse.size[1] * height * 0.5);
      ctx.globalAlpha *= (shadow.opacity ?? 0.5) * (ellipse.opacity ?? 1);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      gradient.addColorStop(0, shadow.color ?? '#030815');
      gradient.addColorStop(0.35, shadow.color ?? '#030815');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    }
  }
  function paintDigitalReveal(ctx, layer, assets, progress, x, y, width, height) {
    const before = asset(assets, layer.frames[0].image), after = asset(assets, layer.frames[1].image);
    const sourceRect = (image, frame) => (frame.sourceRect ?? [0, 0, 1, 1]).map((v, i) => v * (i % 2 ? image.height : image.width));
    const a = sourceRect(before, layer.frames[0]), b = sourceRect(after, layer.frames[1]);
    if (progress === 0 || progress === 1) {
      ctx.drawImage(progress === 0 ? before : after, ...(progress === 0 ? a : b), x, y, width, height); return;
    }
    ctx.fillStyle = '#030c1a'; ctx.fillRect(x, y, width, height);
    const { columns, rows } = layer.reveal, amplitude = layer.reveal.amplitudePx ?? 14;
    const fract = value => value - Math.floor(value), envelope = Math.sin(progress * Math.PI);
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const index = row * columns + col, delay = fract(index * 0.61803398875) * 0.55;
      const phase = clamp((progress - delay) / 0.45, 0, 1), blend = phase * phase * (3 - 2 * phase);
      const left = Math.round(col * width / columns), top = Math.round(row * height / rows);
      const cellWidth = Math.round((col + 1) * width / columns) - left, cellHeight = Math.round((row + 1) * height / rows) - top;
      const dx = Math.sin(progress * 17 + index * 1.73) * amplitude * envelope * (1 - blend);
      const dy = Math.cos(progress * 13 + index * 2.19) * amplitude * envelope * (1 - blend) * 0.35;
      ctx.save(); ctx.beginPath(); ctx.rect(x + left, y + top, cellWidth, cellHeight); ctx.clip();
      ctx.globalAlpha = 1 - blend;
      ctx.drawImage(before, a[0] + a[2] * left / width, a[1] + a[3] * top / height,
        a[2] * cellWidth / width, a[3] * cellHeight / height, x + left + dx, y + top + dy, cellWidth, cellHeight);
      ctx.globalAlpha = blend;
      ctx.drawImage(after, b[0] + b[2] * left / width, b[1] + b[3] * top / height,
        b[2] * cellWidth / width, b[3] * cellHeight / height, x + left, y + top, cellWidth, cellHeight);
      ctx.globalAlpha = envelope * (1 - blend) * 0.45; ctx.strokeStyle = layer.reveal.color ?? '#55eafa'; ctx.lineWidth = 1;
      ctx.strokeRect(x + left + 0.5, y + top + 0.5, cellWidth - 1, cellHeight - 1); ctx.restore();
    }
  }
  function render(image, layers, assets, storyTime, enabled = true, letteringImage = null) {
    const canvas = render.canvas ?? (render.canvas = globalThis.document.createElement('canvas'));
    if (canvas.width !== image.width || canvas.height !== image.height) { canvas.width = image.width; canvas.height = image.height; }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0);
    if (!enabled) return canvas;
    for (const layer of layers ?? []) {
      const [x, y, w, h] = layer.rect.map((v, i) => v * (i % 2 ? image.height : image.width));
      const state = sample(layer, storyTime), frame = layer.frames[state.frameIndex];
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      if (layer.clipPolygon) {
        ctx.beginPath(); const points = layer.clipPolygon.map(p => [p[0] * image.width, p[1] * image.height]);
        ctx.moveTo(...points[0]); for (const point of points.slice(1)) ctx.lineTo(...point); ctx.closePath(); ctx.clip();
      }
      if (layer.mode === 'digitalReveal') {
        paintDigitalReveal(ctx, layer, assets, state.revealProgress, x, y, w, h); ctx.restore(); continue;
      }
      if (layer.background) ctx.drawImage(asset(assets, layer.background), x, y, w, h);
      const source = asset(assets, frame.image), [u, v, sw, sh] = frame.sourceRect ?? [0, 0, 1, 1];
      const pivot = layer.pivot ?? [0.5, 0.5], pose = state.transform;
      ctx.translate(x + pivot[0] * w + pose.translate[0] * w + state.impact[0], y + pivot[1] * h + pose.translate[1] * h + state.impact[1]);
      ctx.rotate(pose.rotationDegrees * Math.PI / 180); ctx.scale(pose.scale, pose.scale); ctx.globalAlpha = pose.opacity;
      if (layer.contactShadow) paintContactShadow(ctx, layer.contactShadow, w, h, pivot);
      // Draw a single authored pose, never a crossfade that duplicates fingers.
      ctx.drawImage(source, u * source.width, v * source.height, sw * source.width, sh * source.height, -pivot[0] * w, -pivot[1] * h, w, h);
      ctx.restore();
    }
    if (letteringImage) ctx.drawImage(letteringImage, 0, 0, image.width, image.height);
    return canvas;
  }
  const api = { sample, render, letteringPath, concealPanels };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.motionLayers = api;
})();
