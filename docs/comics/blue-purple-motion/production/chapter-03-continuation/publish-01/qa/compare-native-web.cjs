/* Same browser, engine, viewport and explicit story/ambient clocks. No export. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ROOT, DOC, EXPECTED, read, sha256, relative, outputDirectory, saveReport, anchors } = require('./common.cjs');

(async () => {
  const webURL = new URL(process.argv[2]), nativeURL = new URL(process.argv[3]);
  const out = outputDirectory(process.argv[4]);
  const report = { status: 'running', startedAt: new Date().toISOString(), webURL: webURL.href, nativeURL: nativeURL.href, samples: [], scope: 'Same current 1.4.0 browser engine and viewport; native PNG vs published lossless WebP; explicit story and ambient clocks, effects enabled.' };
  let browser;
  try {
    const executablePath = process.env.HOLT_BROWSER ?? (fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined);
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block' });
    const native = await context.newPage(), web = await context.newPage();
    const errors = [];
    for (const page of [native, web]) page.on('pageerror', error => errors.push(error.message));
    await Promise.all([native.goto(nativeURL.href), web.goto(webURL.href)]);
    for (const page of [native, web]) {
      await page.waitForFunction(() => window.motionComic?.duration > 0 && document.querySelector('#reader').dataset.ready === 'true', null, { timeout: 60000 });
      await page.evaluate(async () => { await document.fonts.ready; window.motionComic.pause(); window.motionComic.setRenderMode(true); window.motionComic.setEffects(true); });
    }
    const timeline = await native.evaluate(() => window.motionComic.pages);
    assert.equal(timeline.length, EXPECTED.entries);
    const anchor = new Map(anchors().map(item => [item.id, item.globalSeconds]));
    const samples = [
      { id: 'cover', page: 0, time: .001 },
      { id: 'page08', page: 8, time: timeline[8].start + 12 },
      { id: 'page16-three-poi', page: 16, time: anchor.get('green') + .15 },
      { id: 'page17-third-band', page: 17, time: anchor.get('coverBand') + .15 },
      { id: 'page20-water', page: 20, time: anchor.get('waterSplash') + .02 },
      { id: 'page21-opening', page: 21, time: anchor.get('refugeDoorOpeningStart') + .65 },
    ];
    const engine = read(path.join(ROOT, DOC, 'publish-01/runtime/SELECTION-1.4.0.json'));
    report.runtime = [];
    for (const item of engine.engine.filter(item => /\.(?:js|css|woff2)$/.test(item.file))) {
      const name = item.file.replace('anime/motion-comics/', '');
      const records = [];
      for (const [label, target] of [['native', new URL(`/anime/motion-comics/${name}`, nativeURL)], ['web', new URL(name, webURL)]]) {
        const response = await context.request.get(target.href); assert(response.ok());
        const hash = sha256(await response.body()); assert.equal(hash, item.sha256);
        records.push({ label, sha256: hash });
      }
      report.runtime.push({ file: name, expected: item.sha256, records });
    }
    async function snapshot(page, sample) {
      return page.evaluate(async value => {
        const reader = window.motionComic;
        reader.seek(value.time); await reader.whenPageReady(value.page);
        for (let pass = 0; pass < 3; pass++) {
          reader.draw(value.time, value.ambient);
          reader.pageCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, reader.pageCanvas.width, reader.pageCanvas.height);
        }
        const canvas = reader.pageCanvas, bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        return { width: canvas.width, height: canvas.height, rgbaSha256: Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, '0')).join(''), png: canvas.toDataURL('image/png').split(',')[1], frame: reader.frameState };
      }, { ...sample, ambient: 23.456 });
    }
    for (const sample of samples) {
      const a = await snapshot(native, sample), b = await snapshot(web, sample);
      for (const [label, value] of [['native', a], ['web', b]]) {
        const file = path.join(out, `${sample.id}-${label}.png`); fs.writeFileSync(file, Buffer.from(value.png, 'base64'));
        value.file = relative(file); delete value.png;
      }
      const result = { ...sample, ambient: 23.456, native: a, web: b, equal: a.width === b.width && a.height === b.height && a.rgbaSha256 === b.rgbaSha256 };
      report.samples.push(result); saveReport(out, report);
    }
    assert.deepEqual(errors, []); report.pageErrors = errors;
    assert(report.samples.every(sample => sample.equal), 'Une composition native/web diffère au même contexte et aux mêmes horloges.');
    report.status = 'passed';
  } catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; }
  finally {
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString(); saveReport(out, report);
    console.log(JSON.stringify({ status: report.status, samples: report.samples.map(sample => ({ id: sample.id, equal: sample.equal })), report: relative(path.join(out, 'report.json')) }));
  }
})();
