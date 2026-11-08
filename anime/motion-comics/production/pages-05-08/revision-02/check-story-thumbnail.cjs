/* Verify the real reader thumbnail follows the same lettered narrative composite. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { newDirectory } = require('../../../project.cjs');
const [url, destination] = process.argv.slice(2);
if (!url || !destination) throw Error('Usage : check-story-thumbnail.cjs URL DOSSIER_NEUF');
const output = newDirectory(path.resolve(destination));
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage(); await page.goto(url);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
    await page.evaluate(() => { window.motionComic.setRenderMode(true); window.motionComic.setEffects(true); });
    const samples = [];
    for (const time of [0, 16.1, 16.4, 16.45]) {
      const result = await page.evaluate(time => {
        const api = window.motionComic; api.seek(time);
        const source = api.pageCanvas, expected = document.createElement('canvas'); expected.width = 1280; expected.height = 720;
        const scale = Math.min(186 / source.width, 572 / source.height), x = 22 + 186 / 2 - source.width * scale / 2,
          y = 62 + 572 / 2 - source.height * scale / 2;
        expected.getContext('2d').drawImage(source, x, y, source.width * scale, source.height * scale);
        // Interior of the window, clear of the cyan panel outline.
        const roi = [170, 418, 30, 50], a = expected.getContext('2d').getImageData(...roi).data,
          b = document.querySelector('#screen').getContext('2d').getImageData(...roi).data;
        let maximumDifference = 0, changedChannels = 0;
        for (let i = 0; i < a.length; i++) { const delta = Math.abs(a[i] - b[i]); maximumDifference = Math.max(maximumDifference, delta); if (delta) changedChannels++; }
        const layer = api.manifest.motionLayers.find(item => item.panelId === 'p05-c04');
        return { time, storyThumbnail: api.manifest.storyThumbnail, frameIndex: window.motionLayers.sample(layer, time).frameIndex,
          maximumDifference, changedChannels, miniatureRect: roi, png: document.querySelector('#screen').toDataURL('image/png').split(',')[1] };
      }, time);
      assert.equal(result.storyThumbnail, true); assert.equal(result.frameIndex, time < 16.4 ? 0 : 1);
      assert(result.maximumDifference <= 2, `Miniature différente du composite narratif à ${time}s`);
      const file = `reader-${String(time).replace('.', '-')}.png`; fs.writeFileSync(path.join(output, file), Buffer.from(result.png, 'base64'));
      delete result.png; samples.push({ ...result, file });
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ status: 'completed', url, samples,
      scope: 'Miniature réelle comparée au composite lettré, états intact/bris et PNG1280 ; dessin/mains revus séparément par qualité.' }, null, 2));
    console.info(JSON.stringify(samples));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
