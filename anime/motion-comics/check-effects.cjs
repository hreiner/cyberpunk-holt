const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { newDirectory } = require('./project.cjs');
(async () => {
  if (!process.argv[2] || !process.argv[3]) throw Error('Usage : node check-effects.cjs URL NOUVEAU_DOSSIER');
  const out = newDirectory(process.argv[3]);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage(); await page.goto(process.argv[2]);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
    const result = await page.evaluate(async () => {
      const api = window.motionComic, data = api.manifest, review = data.review ?? {};
      if (data.motionLayers?.length) {
        const time = review.sampleTime ?? api.duration / 2, delta = review.deltaSeconds ?? 0.5;
        api.setRenderMode(true); api.setEffects(true); api.seek(time); api.draw(time, time);
        const painted = window.motionEffects.render.canvas;
        const bytes = canvas => canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
        if (!api.artCanvas || !api.pageCanvas) throw Error('Les canvases art courant et composition finale sont requis pour contrôler les calques.');
        // Warm the readback path before comparing exact browser pixels.
        for (let warm = 0; warm < 3; warm++) { api.draw(time, time); bytes(painted); }
        const first = bytes(painted), artwork = bytes(api.artCanvas), final = bytes(api.pageCanvas);
        const changed = (a, b, rect = [0, 0, 1, 1]) => {
          let count = 0;
          for (let y = Math.floor(rect[1] * painted.height); y < Math.floor((rect[1] + rect[3]) * painted.height); y++)
            for (let x = Math.floor(rect[0] * painted.width); x < Math.floor((rect[0] + rect[2]) * painted.width); x++) {
              const offset = (y * painted.width + x) * 4;
              if ([0, 1, 2, 3].some(c => a[offset + c] !== b[offset + c])) count++;
            }
          return count;
        };
        api.draw(time, time + delta);
        const second = bytes(painted), laterArt = bytes(api.artCanvas), laterFinal = bytes(api.pageCanvas);
        const regions = (data.protectedRegions ?? []).map(region => ({ id: region.id,
          changed: changed(first, second, region.rect), alteredFromSource: changed(first, artwork, region.rect) }));
        api.draw(time, time + delta); const deterministic = changed(second, bytes(painted)) === 0;
        const root = new URL(new window.URLSearchParams(window.location.search).get('manifest'), window.location.href);
        const descriptor = api.document;
        const manifestUrl = descriptor.kind === 'motion-comic-sequence' ? new URL(descriptor.pages[api.pageIndex].manifest, root) : root;
        const decode = async relative => {
          const image = new Image(); image.src = new URL(relative, manifestUrl).href; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = painted.width; canvas.height = painted.height;
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); return bytes(canvas);
        };
        let lettering = null;
        const activeLetteringPath = api.activeLetteringPath ?? window.motionLayers.letteringPath(data.motionLayers, api.frameState.storyTime, data.letteringImage);
        if (activeLetteringPath) {
          const letters = await decode(activeLetteringPath);
          let opaquePixels = 0, alteredOpaquePixels = 0, unstableOpaquePixels = 0;
          for (let offset = 0; offset < letters.length; offset += 4) if (letters[offset + 3] === 255) {
            opaquePixels++;
            if ([0, 1, 2, 3].some(c => final[offset + c] !== letters[offset + c])) alteredOpaquePixels++;
            if ([0, 1, 2, 3].some(c => final[offset + c] !== laterFinal[offset + c])) unstableOpaquePixels++;
          }
          lettering = { asset: activeLetteringPath, opaquePixels, alteredOpaquePixels, unstableOpaquePixels };
        }
        const master = await decode(data.image);
        api.setEffects(false); api.draw(time, time);
        const original = bytes(api.pageCanvas), disabledExactMaster = changed(master, original) === 0;
        api.draw(time, time + delta); const disabledStable = changed(original, bytes(api.pageCanvas)) === 0;
        api.setEffects(true); api.seek(time);
        return { layered: true, protectedSource: 'current animated artwork, before effects and lettering',
          changed: changed(first, second), minimumChangedPixels: review.minimumChangedPixels ?? (data.effects?.length ? 1 : 0),
          protectedRegions: regions, deterministic, disabledStable, disabledExactMaster,
          pausedArtworkStable: changed(artwork, laterArt) === 0, lettering, duration: api.duration, sampleTime: time };
      }
      const time = review.sampleTime ?? api.duration / 2, delta = review.deltaSeconds ?? 0.5;
      api.setRenderMode(true); api.setEffects(true); api.seek(time);
      const source = window.motionEffects.render.canvas, ctx = source.getContext('2d');
      const pixels = () => ctx.getImageData(0, 0, source.width, source.height).data;
      const first = pixels(); api.draw(time, time + delta); const second = pixels();
      function changed(a, b, r = [0, 0, 1, 1]) {
        let count = 0;
        for (let y = Math.floor(r[1] * source.height); y < Math.floor((r[1] + r[3]) * source.height); y++)
          for (let x = Math.floor(r[0] * source.width); x < Math.floor((r[0] + r[2]) * source.width); x++) {
            const i = (y * source.width + x) * 4;
            if ([0, 1, 2, 3].some(k => a[i + k] !== b[i + k])) count++;
          }
        return count;
      }
      const count = changed(first, second);
      api.seek(time); const deterministic = changed(first, pixels()) === 0;
      api.setEffects(false); const original = pixels();
      api.draw(time, time + delta); const disabledStable = changed(original, pixels()) === 0;
      const regions = (data.protectedRegions ?? []).map(r => ({ id: r.id, changed: changed(first, second, r.rect), alteredFromSource: changed(first, original, r.rect) }));
      api.setEffects(true); api.seek(time);
      return { changed: count, minimumChangedPixels: review.minimumChangedPixels ?? (data.effects?.length ? 1 : 0),
        protectedRegions: regions, deterministic, disabledStable, duration: api.duration, sampleTime: time };
    });
    fs.writeFileSync(path.join(out, 'effects-report.json'), JSON.stringify(result, null, 2));
    if (result.changed < result.minimumChangedPixels || result.protectedRegions.some(r => r.changed || r.alteredFromSource) || !result.deterministic || !result.disabledStable ||
      result.layered && (!result.disabledExactMaster || !result.pausedArtworkStable || result.lettering &&
        (!result.lettering.opaquePixels || result.lettering.alteredOpaquePixels || result.lettering.unstableOpaquePixels))) throw Error(JSON.stringify(result));
    await page.locator('#screen').screenshot({ path: path.join(out, 'case-effects.png') });
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
