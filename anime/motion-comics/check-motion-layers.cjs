/* Actual Canvas evidence for authored pose changes and transparent sprite movement. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { newDirectory } = require('./project.cjs');

(async () => {
  const [input, target] = process.argv.slice(2);
  if (!input || !target) throw Error('Usage : node check-motion-layers.cjs URL|--synthetic DOSSIER_NEUF [--panel IDENTIFIANT]');
  const filterIndex = process.argv.indexOf('--panel'), panelFilter = filterIndex < 0 ? null : process.argv[filterIndex + 1];
  if (filterIndex >= 0 && (!panelFilter || panelFilter.startsWith('--'))) throw Error('Identifiant de case requis après --panel.');
  const synthetic = input === '--synthetic', output = newDirectory(target);
  const engineHashes = Object.fromEntries(['layers.js', 'core.js'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, file))).digest('hex')]));
  const report = { status: 'running', startedAt: new Date().toISOString(), input, synthetic, panelFilter, engineHashes, layers: [] };
  const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); write();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    if (synthetic) {
      await page.setContent('<!doctype html><html lang="fr"><title>Contrôle technique Canvas</title></html>');
      await page.addScriptTag({ path: path.join(__dirname, 'layers.js') });
      report.fixture = await page.evaluate(() => {
        const canvas = (color = '#233044') => {
          const c = document.createElement('canvas'); c.width = 200; c.height = 100;
          const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 200, 100); return c;
        };
        const clean = canvas(), master = canvas(), sprite = canvas();
        sprite.getContext('2d').clearRect(0, 0, 200, 100);
        sprite.getContext('2d').fillStyle = '#ee3311'; sprite.getContext('2d').fillRect(20, 55, 20, 20);
        master.getContext('2d').drawImage(sprite, 0, 0);
        const pose = color => { const c = canvas(); c.getContext('2d').fillStyle = color; c.getContext('2d').fillRect(30, 25, 50, 50); return c; };
        const assets = { clean, sprite, ready: pose('#1477ff'), contact: pose('#fa1717'), down: pose('#e3ad11') };
        const raw = c => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, 200, 100).data;
        const original = raw(master), equal = (a, b) => a.every((v, i) => v === b[i]);
        const layer = { id: 'test', panelId: 'test', rect: [0.1, 0.1, 0.8, 0.8], mode: 'sprite', background: 'clean', startSeconds: 1, endSeconds: 3,
          frames: [{ atSeconds: 0, image: 'sprite' }], keyframes: [{ atSeconds: 0 }, { atSeconds: 2, translate: [0.5, -0.25], scale: 1 }],
          contactShadow: { color: '#020611', opacity: 0.6, ellipses: [{ center: [0.15, 0.77], size: [0.15, 0.08] }] } };
        const starting = raw(window.motionLayers.render(master, [layer], assets, 1, true));
        const duringCanvas = window.motionLayers.render(master, [layer], assets, 3, true), during = raw(duringCanvas);
        const pixel = (bytes, x, y) => Array.from(bytes.slice((y * 200 + x) * 4, (y * 200 + x) * 4 + 4));
        const oldCarErased = equal(pixel(during, 25, 60), pixel(raw(clean), 25, 60));
        const movedCarVisible = equal(pixel(during, 125, 35), [238, 51, 17, 255]);
        const shadowAtStart = pixel(starting, 44, 73).slice(0, 3).every((v, i) => v < pixel(raw(clean), 44, 73)[i]);
        const oldShadowErased = equal(pixel(during, 44, 73), pixel(raw(clean), 44, 73));
        const shadowFollowsCar = pixel(during, 124, 53).slice(0, 3).every((v, i) => v < pixel(raw(clean), 124, 53)[i]);
        let outsideCaseChanged = 0;
        for (let y = 0; y < 100; y++) for (let x = 0; x < 200; x++)
          if ((x < 20 || x >= 180 || y < 10 || y >= 90) && !equal(pixel(during, x, y), pixel(original, x, y))) outsideCaseChanged++;
        const stopped = raw(window.motionLayers.render(master, [layer], assets, 3, false));
        const disabledExactMaster = equal(original, stopped);
        const first = raw(window.motionLayers.render(master, [layer], assets, 2, true));
        const second = raw(window.motionLayers.render(master, [layer], assets, 2, true));
        const pauseExact = equal(first, second), inputUnchanged = equal(original, raw(master));
        const poses = { ...layer, mode: 'frames', background: undefined, keyframes: undefined, contactShadow: undefined,
          frames: [{ atSeconds: 0, image: 'ready' }, { atSeconds: 0.5, image: 'contact' }, { atSeconds: 1, image: 'down' }] };
        const colors = [1, 1.5, 2].map(t => pixel(raw(window.motionLayers.render(master, [poses], assets, t, true)), 50, 50));
        return { oldCarErased, movedCarVisible, shadowAtStart, oldShadowErased, shadowFollowsCar, outsideCaseUnchanged: outsideCaseChanged === 0, disabledExactMaster, pauseExact, inputUnchanged,
          authoredPoseColors: colors, distinctAuthoredPoses: new Set(colors.map(c => c.join(','))).size === 3 };
      });
      assert(Object.values(report.fixture).filter(value => typeof value === 'boolean').every(Boolean));
    } else {
      await page.goto(input);
      await page.waitForFunction(() => window.motionLayers && window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
      const layers = await page.evaluate(async panelFilter => {
        const api = window.motionComic; api.pause(); api.setRenderMode(true);
        const root = new URL(new window.URLSearchParams(window.location.search).get('manifest'), window.location.href);
        const descriptor = api.document;
        const urls = descriptor.kind === 'motion-comic-sequence' ? descriptor.pages.map(p => new URL(p.manifest, root).href) : [root.href];
        const results = [];
        const pixels = canvas => canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
        const equal = (a, b) => a.every((value, i) => value === b[i]);
        for (const manifestUrl of urls) {
          const data = await (await window.fetch(manifestUrl)).json();
          const selected = (data.motionLayers ?? []).filter(layer => !panelFilter || layer.panelId === panelFilter);
          if (!selected.length) continue;
          const paths = [...new Set([data.image, data.motionBaseImage, data.letteringImage,
            ...selected.flatMap(layer => [layer.background, ...layer.frames.flatMap(frame => [frame.image, frame.letteringImage])])].filter(Boolean))];
          const assets = {};
          await Promise.all(paths.map(async path => { const image = new Image(); image.src = new URL(path, manifestUrl).href; await image.decode(); assets[path] = image; }));
          const assetDigests = Object.fromEntries(await Promise.all(paths.map(async path => {
            const response = await window.fetch(new URL(path, manifestUrl));
            if (!response.ok) throw Error('Média du calque inaccessible pour empreinte.');
            const digest = await window.crypto.subtle.digest('SHA-256', await response.arrayBuffer());
            return [path, Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')];
          })));
          const raw = assets[data.motionBaseImage], master = assets[data.image], letters = assets[data.letteringImage];
          const originalCanvas = document.createElement('canvas'); originalCanvas.width = raw.width; originalCanvas.height = raw.height;
          originalCanvas.getContext('2d').drawImage(raw, 0, 0); const original = pixels(originalCanvas);
          const masterCanvas = document.createElement('canvas'); masterCanvas.width = master.width; masterCanvas.height = master.height;
          masterCanvas.getContext('2d').drawImage(master, 0, 0); const originalMaster = pixels(masterCanvas);
          for (const layer of selected) {
            const sampleTimes = [layer.startSeconds, ...layer.frames.slice(1).map(frame => layer.startSeconds + frame.atSeconds + 0.0001),
              ...layer.keyframes?.slice(1).map(key => layer.startSeconds + key.atSeconds) ?? []];
            if (sampleTimes.length < 2) sampleTimes.push(layer.endSeconds);
            const times = [...new Set(sampleTimes)].sort((a, b) => a - b);
            const [x, y, w, h] = layer.rect.map((v, i) => v * (i % 2 ? raw.height : raw.width));
            const cellWidth = Math.min(500, Math.round(w)), cellHeight = Math.round(cellWidth * h / w);
            const sheet = document.createElement('canvas'); sheet.width = cellWidth * times.length; sheet.height = cellHeight + 48;
            const ctx = sheet.getContext('2d'); ctx.fillStyle = '#080b18'; ctx.fillRect(0, 0, sheet.width, sheet.height);
            const framePixels = [];
            for (const [index, time] of times.entries()) {
              const frame = window.motionLayers.render(raw, [layer], assets, time, true);
              framePixels.push(pixels(frame));
              // Lettering is applied after artwork for the visible key-pose proof.
              const currentLetters = window.motionLayers.letteringPath([layer], time, data.letteringImage);
              const visible = window.motionLayers.render(raw, [layer], assets, time, true, assets[currentLetters]);
              ctx.fillStyle = '#edf7ff'; ctx.font = '15px sans-serif'; ctx.fillText(`${layer.panelId} · ${time.toFixed(3)} s`, index * cellWidth + 7, 23);
              ctx.drawImage(visible, x, y, w, h, index * cellWidth, 42, cellWidth, cellHeight);
            }
            const first = framePixels[0], last = framePixels.at(-1);
            let changed = 0, outsideChanged = 0;
            for (let py = 0; py < raw.height; py++) for (let px = 0; px < raw.width; px++) {
              const offset = (py * raw.width + px) * 4;
              if ([0, 1, 2, 3].some(c => first[offset + c] !== last[offset + c])) changed++;
              if ((px < Math.floor(x) || px >= Math.ceil(x + w) || py < Math.floor(y) || py >= Math.ceil(y + h)) &&
                [0, 1, 2, 3].some(c => last[offset + c] !== original[offset + c])) outsideChanged++;
            }
            const distinctAdjacent = framePixels.slice(1).map((bytes, index) => !equal(bytes, framePixels[index]));
            const chosenTime = times[Math.floor(times.length / 2)];
            const paused = pixels(window.motionLayers.render(raw, [layer], assets, chosenTime, true));
            const pausedLater = pixels(window.motionLayers.render(raw, [layer], assets, chosenTime, true));
            const held = pixels(window.motionLayers.render(raw, [layer], assets, layer.endSeconds, true));
            const heldLater = pixels(window.motionLayers.render(raw, [layer], assets, layer.endSeconds + 50, true));
            const stopped = pixels(window.motionLayers.render(master, [layer], assets, chosenTime, false, letters));
            const sourceCheck = document.createElement('canvas'); sourceCheck.width = raw.width; sourceCheck.height = raw.height;
            sourceCheck.getContext('2d').drawImage(raw, 0, 0);
            const result = { id: layer.id, panelId: layer.panelId, mode: layer.mode, layerDefinition: layer,
              sourceImage: data.image, motionBaseImage: data.motionBaseImage, assetDigests, sampleTimes: times,
              activeLetteringPaths: times.map(time => window.motionLayers.letteringPath([layer], time, data.letteringImage)), changedFirstLastPixels: changed,
              distinctAdjacentPoses: distinctAdjacent, outsideCaseChangedPixels: outsideChanged, pauseExact: equal(paused, pausedLater),
              finalStateHeld: equal(held, heldLater), disabledExactMaster: equal(stopped, originalMaster), sourceUnchanged: equal(original, pixels(sourceCheck)),
              proof: sheet.toDataURL('image/png').split(',')[1] };
            result.authoredPoseSequence = layer.mode !== 'frames' || layer.frames.length >= 2 && layer.frames.every((frame, index) => index === 0 ||
              frame.image !== layer.frames[index - 1].image || JSON.stringify(frame.sourceRect ?? [0, 0, 1, 1]) !== JSON.stringify(layer.frames[index - 1].sourceRect ?? [0, 0, 1, 1]));
            if (layer.mode === 'sprite') {
              const sprite = assets[layer.frames[0].image], c = document.createElement('canvas'); c.width = sprite.width; c.height = sprite.height;
              c.getContext('2d').drawImage(sprite, 0, 0); const rgba = pixels(c); let transparent = 0, visible = 0;
              for (let i = 3; i < rgba.length; i += 4) { if (rgba[i] === 0) transparent++; if (rgba[i] > 0) visible++; }
              result.spriteAlpha = { transparent, visible }; result.realTransparency = transparent > 0 && visible > 0;
            }
            results.push(result);
          }
        }
        return results;
      }, panelFilter);
      for (const layer of layers) {
        layer.configSignature = crypto.createHash('sha256').update(JSON.stringify(layer.layerDefinition)).digest('hex');
        const file = `${layer.panelId}-${layer.id}-key-poses.png`.replace(/[^a-zA-Z0-9_.-]/g, '_');
        fs.writeFileSync(path.join(output, file), Buffer.from(layer.proof, 'base64'), { flag: 'wx' }); delete layer.proof;
        layer.proofFile = file;
        layer.passed = layer.authoredPoseSequence && layer.changedFirstLastPixels > 0 && layer.distinctAdjacentPoses.every(Boolean) && layer.outsideCaseChangedPixels === 0 &&
          layer.pauseExact && layer.finalStateHeld && layer.disabledExactMaster && layer.sourceUnchanged && layer.realTransparency !== false;
        report.layers.push(layer); write();
      }
      assert(layers.length > 0, 'Aucun calque réel ne correspond à ce document.');
      assert(layers.every(layer => layer.passed), 'Un mouvement ou une protection de calque a échoué.');
    }
    assert.deepEqual(errors, []);
    Object.assign(report, { status: 'completed', finishedAt: new Date().toISOString(), pageErrors: errors }); write();
    console.log(JSON.stringify({ status: report.status, synthetic, layerCount: report.layers.length, fixture: report.fixture }));
  } catch (error) { Object.assign(report, { status: 'failed', finishedAt: new Date().toISOString(), error: error.message }); write(); throw error; }
  finally { if (browser) await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
