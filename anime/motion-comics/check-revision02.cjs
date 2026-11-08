/* Pixel evidence for the three explicitly requested revision02 corrections. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { newDirectory } = require('./project.cjs');
(async () => {
  const [url, target, mode] = process.argv.slice(2);
  if (!url || !target || !['hair', 'glass', 'car'].includes(mode)) throw Error('Usage : node check-revision02.cjs URL DOSSIER_NEUF hair|glass|car');
  const output = newDirectory(target);
  const report = { status: 'running', reader: url, mode, startedAt: new Date().toISOString(), engineHashes: Object.fromEntries(['core.js', 'effects.js', 'layers.js', 'check-revision02.cjs'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, file))).digest('hex')])) };
  const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); write();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(url); await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
    const result = await page.evaluate(async mode => {
      const api = window.motionComic; api.pause(); api.setRenderMode(true); api.setEffects(true);
      const data = api.manifest, canvas = () => api.pageCanvas;
      const bytes = c => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
      const draw = (story, ambient = story) => { api.seek(story); api.draw(story, ambient); return new Uint8ClampedArray(bytes(canvas())); };
      const delta = (a, b, rect) => {
        let count = 0;
        for (let y = rect[1]; y < rect[1] + rect[3]; y++) for (let x = rect[0]; x < rect[0] + rect[2]; x++) {
          const k = (y * canvas().width + x) * 4;
          if ([0, 1, 2, 3].some(c => a[k + c] !== b[k + c])) count++;
        }
        return count;
      };
      const still = (name, time, ambient = time) => { draw(time, ambient); return { name, storyTime: time, ambientTime: ambient, png: document.querySelector('#screen').toDataURL('image/png') }; };
      const root = new URL(new window.URLSearchParams(window.location.search).get('manifest'), window.location.href);
      const decode = async relative => { const im = new Image(); im.src = new URL(relative, root).href; await im.decode(); const c = document.createElement('canvas'); c.width = canvas().width; c.height = canvas().height; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return bytes(c); };
      const whole = [0, 0, 1024, 1536], result = { image: data.image, proofs: [] };
      // Warm the real canvas readback before zero-delta assertions.
      draw(1); draw(1); draw(1);
      if (mode === 'hair') {
        const time = 7.2, a = draw(time, 7.2), b = draw(time, 7.85);
        result.tipChanged = delta(a, b, [700, 811, 38, 54]);
        result.skullAndTopChanged = delta(a, b, [558, 690, 190, 122]);
        result.faceChanged = delta(a, b, [615, 774, 97, 113]);
        result.collarChanged = delta(a, b, [694, 860, 55, 35]);
        const raw = new Uint8ClampedArray(bytes(api.artCanvas));
        const fx = new Uint8ClampedArray(bytes(window.motionEffects.render.canvas));
        result.skullAlteredFromArtwork = delta(raw, fx, [558, 690, 190, 122]);
        result.faceAlteredFromArtwork = delta(raw, fx, [615, 774, 97, 113]);
        result.proofs = [still('tips-a', time, 7.2), still('tips-b', time, 7.85)];
      } else if (mode === 'car') {
        const car = [345, 1115, 615, 385], c4 = [12, 1028, 1000, 496];
        const a = draw(17.1, 17.1), b = draw(19.4, 19.4), c = draw(21.6, 21.6), pause = draw(19.4, 20.05);
        result.carChangedStartMiddle = delta(a, b, car); result.carChangedMiddleFinal = delta(b, c, car);
        result.carChangedDuringPause = delta(b, pause, car); result.windChangedDuringPause = delta(b, pause, c4);
        result.motionLayerCount = (data.motionLayers ?? []).filter(l => l.panelId === 'p08-c04').length;
        const master = await decode(data.image); result.carAlteredFromMaster = delta(b, master, car);
        const source = await decode(data.image), winds = data.effects.filter(f => f.type === 'wind');
        const im = new Image(); im.src = new URL(data.image, root).href; await im.decode();
        const hidden = window.motionEffects.render(im, winds, 99, true, data.protectedRegions, 17.09);
        result.windBeforeGate = delta(source, bytes(hidden), whole);
        result.proofs = [still('fixed-car-start', 17.1), still('fixed-car-middle', 19.4), still('fixed-car-final', 21.6)];
      } else {
        const layer = data.motionLayers.find(l => l.panelId === 'p05-c04'), c4 = [12, 1028, 1000, 496];
        result.layer = layer; result.states = [];
        for (const t of [0, 15.9, 16.399, 16.4, 17.2, 20.39]) {
          draw(t); const selected = window.motionLayers.sample(layer, t);
          const art = new Uint8ClampedArray(bytes(api.artCanvas)), frame = new Image();
          frame.src = new URL(layer.frames[selected.frameIndex].image, root).href; await frame.decode();
          const reference = document.createElement('canvas'); reference.width = 1024; reference.height = 1536;
          // Use the same Canvas sampling path as delivered: source crop then
          // translated destination. Direct five-argument resampling differs
          // in Chromium on most antialiased pixels despite identical geometry.
          const ctx = reference.getContext('2d', { willReadFrequently: true }); ctx.translate(512, 1276);
          ctx.drawImage(frame, 0, 0, frame.width, frame.height, -500, -248, 1000, 496);
          result.states.push({ storyTime: t, frameIndex: selected.frameIndex, incorrectArtworkPixels: delta(art, bytes(reference), c4) });
        }
        const a = draw(17.2, 17.2), b = draw(17.2, 900);
        result.glassEventFrozenInPause = delta(a, b, [789, 1300, 210, 194]) === 0;
        result.proofs = [still('intact-before-shot', 16.399), still('broken-at-shot', 16.4), still('falling-shards', 17.2), still('broken-after-event', 19.9)];
      }
      const time = mode === 'hair' ? 7.2 : mode === 'car' ? 19.4 : 17.2;
      const master = await decode(data.image); api.setEffects(false); api.seek(time); api.draw(time, time);
      result.disabledExactMaster = delta(master, bytes(canvas()), whole) === 0;
      return result;
    }, mode);
    for (const proof of result.proofs) { const name = `${proof.name}.png`; fs.writeFileSync(path.join(output, name), Buffer.from(proof.png.split(',')[1], 'base64')); delete proof.png; proof.file = name; }
    Object.assign(report, result); write();
    assert.equal(result.disabledExactMaster, true, 'OFF doit conserver le master exact.');
    if (mode === 'hair') { assert(result.tipChanged > 0, 'Les pointes doivent bouger réellement.'); for (const key of ['skullAndTopChanged', 'faceChanged', 'collarChanged', 'skullAlteredFromArtwork', 'faceAlteredFromArtwork']) assert.equal(result[key], 0, key); }
    if (mode === 'car') { for (const key of ['carChangedStartMiddle', 'carChangedMiddleFinal', 'carChangedDuringPause', 'motionLayerCount', 'carAlteredFromMaster', 'windBeforeGate']) assert.equal(result[key], 0, key); assert(result.windChangedDuringPause > 180, 'Le vent doit rester perceptible, seuil180.'); }
    if (mode === 'glass') { for (const state of result.states) { assert.equal(state.frameIndex, state.storyTime < 16.4 ? 0 : 1); assert.equal(state.incorrectArtworkPixels, 0); } assert.equal(result.glassEventFrozenInPause, true); }
    report.status = 'completed'; report.completedAt = new Date().toISOString(); write(); console.log(JSON.stringify(report));
  } catch (error) { report.status = 'failed'; report.error = error.message; write(); throw error; }
  finally { if (browser) await browser.close(); }
})();
