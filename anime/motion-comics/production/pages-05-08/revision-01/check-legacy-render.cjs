/* Exact pixel regression for the retained four pages after optional renderer extensions. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const { ROOT, newDirectory } = require('../../../project.cjs');
const output = newDirectory(path.resolve(process.argv[3] ?? ''));
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage(); await page.goto(process.argv[2]);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
    await page.evaluate(() => { window.motionComic.setRenderMode(true); window.motionComic.setEffects(true); });
    const results = [];
    for (const index of [0, 1125, 2350, 3400]) {
      const expectedFile = path.join(ROOT, `art-masters/motion-comics/blue-purple/pages-01-08/render-v1/frames/frame_${String(index).padStart(5, '0')}.png`);
      const expected = fs.readFileSync(expectedFile);
      const result = await page.evaluate(time => {
        window.motionComic.seek(time);
        return { time, png: document.querySelector('#screen').toDataURL('image/png').split(',')[1], pageIndex: window.motionComic.pageIndex };
      }, index / 24);
      const actual = Buffer.from(result.png, 'base64');
      assert(actual.equals(expected), `PNG historique modifié au temps ${result.time}`);
      results.push({ frame: index, time: result.time, pageIndex: result.pageIndex, byteIdentical: true, sha256: crypto.createHash('sha256').update(actual).digest('hex') });
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ status: 'completed', method: 'Chemin toDataURL identique à l’export : PNG byte-identiques aux frames originales v1, avant page5.', results }, null, 2));
    console.info(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
