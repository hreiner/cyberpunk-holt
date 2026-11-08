/* Compare finite physical events at explicit story times, without mutating manifests. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { newDirectory } = require('./project.cjs');

(async () => {
  const [url, target] = process.argv.slice(2);
  if (!url || !target) throw Error('Usage : node check-event-effects.cjs URL DOSSIER_NEUF [--panel IDENTIFIANT]');
  const filterIndex = process.argv.indexOf('--panel');
  const panelFilter = filterIndex < 0 ? null : process.argv[filterIndex + 1];
  if (filterIndex >= 0 && (!panelFilter || panelFilter.startsWith('--'))) throw Error('Identifiant de case requis après --panel.');
  const output = newDirectory(target);
  const report = { status: 'running', startedAt: new Date().toISOString(), reader: url, panelFilter, events: [] };
  const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  write();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
    const results = await page.evaluate(async panelFilter => {
      const api = window.motionComic;
      api.setRenderMode(true); api.pause();
      const root = new URL(new window.URLSearchParams(window.location.search).get('manifest'), window.location.href);
      const descriptor = api.document;
      const urls = descriptor.kind === 'motion-comic-sequence' ? descriptor.pages.map(p => new URL(p.manifest, root).href) : [root.href];
      const results = [];
      const changed = (a, b, region, width, height) => {
        let count = 0;
        const [x, y, w, h] = region ?? [0, 0, 1, 1];
        for (let py = Math.floor(y * height); py < Math.ceil((y + h) * height); py++)
          for (let px = Math.floor(x * width); px < Math.ceil((x + w) * width); px++) {
            const offset = (py * width + px) * 4;
            if ([0, 1, 2, 3].some(c => a[offset + c] !== b[offset + c])) count++;
          }
        return count;
      };
      for (const manifestUrl of urls) {
        const data = await (await window.fetch(manifestUrl)).json();
        const image = new Image(); image.src = new URL(data.image, manifestUrl).href; await image.decode();
        const pixels = effects => {
          const canvas = effects();
          return canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, image.width, image.height).data;
        };
        const source = pixels(() => window.motionEffects.render(image, [], 0, false));
        for (const [index, effect] of (data.effects ?? []).entries()) {
          if (effect.clock !== 'story' || effect.endSeconds === undefined) continue;
          if (panelFilter && effect.panelId !== panelFilter) continue;
          const start = effect.startSeconds ?? 0, end = effect.endSeconds;
          const times = [start - 0.01, start + (end - start) * 0.5, end + 0.01];
          const draw = (story, ambient = 1) => pixels(() => window.motionEffects.render(image, [effect], ambient, true, data.protectedRegions, story));
          // Warm the real readback path before exact pixel comparisons.
          draw(times[1]); draw(times[1]);
          const before = draw(times[0]), during = draw(times[1]), after = draw(times[2]);
          const repeated = draw(times[1]), pausedLater = draw(times[1], 901);
          const protections = (data.protectedRegions ?? []).map(region => ({ id: region.id,
            changedFromSource: changed(source, during, region.rect, image.width, image.height) }));
          const panel = data.panels.find(panel => panel.id === effect.panelId);
          if (!panel) throw Error('Événement sans case explicite.');
          const [x, y, w, h] = panel.rect.map((v, i) => v * (i % 2 ? image.height : image.width));
          const cellWidth = 480, cellHeight = Math.round(cellWidth * h / w);
          const proof = document.createElement('canvas'); proof.width = cellWidth * 3; proof.height = cellHeight + 52;
          const ctx = proof.getContext('2d'); ctx.fillStyle = '#080b18'; ctx.fillRect(0, 0, proof.width, proof.height);
          for (const [column, story] of times.entries()) {
            ctx.fillStyle = '#edf7ff'; ctx.font = '16px sans-serif';
            ctx.fillText(`${panel.id} · ${['avant', 'pendant', 'après'][column]} · ${story.toFixed(2)} s`, column * cellWidth + 8, 24);
            // Same ambient phase in all views: only the finite event progresses.
            const frame = window.motionEffects.render(image, data.effects, 1, true, data.protectedRegions, story);
            ctx.drawImage(frame, x, y, w, h, column * cellWidth, 44, cellWidth, cellHeight);
          }
          const disabled = pixels(() => window.motionEffects.render(image, [effect], 99, false, data.protectedRegions, times[1]));
          results.push({ panelId: panel.id, type: effect.type, effectIndex: index, startSeconds: start, endSeconds: end,
            sampleTimes: times, beforeChanged: changed(source, before, null, image.width, image.height),
            duringChanged: changed(source, during, null, image.width, image.height),
            afterChanged: changed(source, after, null, image.width, image.height),
            deterministic: changed(during, repeated, null, image.width, image.height) === 0,
            pausedStoryStable: changed(during, pausedLater, null, image.width, image.height) === 0,
            disabledSourceStable: changed(source, disabled, null, image.width, image.height) === 0,
            protectedRegions: protections, proof: proof.toDataURL('image/png').split(',')[1] });
        }
      }
      return results;
    }, panelFilter);
    for (const result of results) {
      const file = `${result.panelId}-${result.type}-${result.effectIndex}-before-during-after.png`;
      fs.writeFileSync(path.join(output, file), Buffer.from(result.proof, 'base64'), { flag: 'wx' }); delete result.proof;
      result.proofFile = file;
      result.passed = result.beforeChanged === 0 && result.duringChanged > 0 && result.afterChanged === 0 &&
        result.deterministic && result.pausedStoryStable && result.disabledSourceStable && result.protectedRegions.every(r => r.changedFromSource === 0);
      report.events.push(result); write();
    }
    assert.deepEqual(errors, []);
    assert(results.length > 0, 'Aucun événement physique borné dans ce document.');
    Object.assign(report, { status: results.every(r => r.passed) ? 'completed' : 'failed', finishedAt: new Date().toISOString(), pageErrors: errors });
    write(); assert.equal(report.status, 'completed');
    console.log(JSON.stringify({ status: report.status, eventCount: results.length }));
  } catch (error) {
    Object.assign(report, { status: 'failed', finishedAt: new Date().toISOString(), error: error.message }); write(); throw error;
  } finally { if (browser) await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
