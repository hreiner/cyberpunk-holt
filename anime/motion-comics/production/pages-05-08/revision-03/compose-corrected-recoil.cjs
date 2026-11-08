/* Preserve the original drawing outside the ImageGen arm repair, using editable SVG. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ROOT } = require('../../../project.cjs');
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-03/art');
const source = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art/p05-c03-pose-03-recoil.png');
const generated = path.join(base, 'p05-c03-recoil-generated-v1.png');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pngUrl = file => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
const patch = 'M170 388 H470 V755 H170 Z';
const fist = [362, 559, 90, 74];
const width = 1254, height = 1254;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><clipPath id="repair"><path d="${patch}"/></clipPath><clipPath id="original-fist"><rect x="${fist[0]}" y="${fist[1]}" width="${fist[2]}" height="${fist[3]}"/></clipPath></defs><image href="${pngUrl(source)}" width="${width}" height="${height}"/><image href="${pngUrl(generated)}" width="${width}" height="${height}" clip-path="url(#repair)"/><image href="${pngUrl(source)}" width="${width}" height="${height}" clip-path="url(#original-fist)"/></svg>`;
(async () => {
  const svgFile = path.join(base, 'p05-c03-recoil-composite-v2.svg');
  fs.writeFileSync(svgFile, svg, { flag: 'wx' });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(async ({ svg, original, width, height, patch, fist }) => {
      const load = async url => { const image = new Image(); image.src = url; await image.decode(); return image; };
      const originalImage = await load(original), repaired = await load('data:image/svg+xml;base64,' + window.btoa(svg));
      const c = document.createElement('canvas'); c.width = width; c.height = height;
      const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(originalImage, 0, 0);
      const before = ctx.getImageData(0, 0, width, height).data;
      ctx.clearRect(0, 0, width, height); ctx.drawImage(repaired, 0, 0);
      const after = ctx.getImageData(0, 0, width, height).data;
      const mask = new window.Path2D(patch);
      let outsideChanged = 0, fistChanged = 0, changed = 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        if ([0, 1, 2, 3].some(channel => before[offset + channel] !== after[offset + channel])) {
          changed++;
          if (!ctx.isPointInPath(mask, x + 0.5, y + 0.5)) outsideChanged++;
          if (x >= fist[0] && x < fist[0] + fist[2] && y >= fist[1] && y < fist[1] + fist[3]) fistChanged++;
        }
      }
      return { png: c.toDataURL().split(',')[1], changed, outsideChanged, fistChanged };
    }, { svg, original: pngUrl(source), width, height, patch, fist });
    assert(result.changed > 0); assert.equal(result.outsideChanged, 0); assert.equal(result.fistChanged, 0);
    const output = path.join(base, 'p05-c03-recoil-corrected-v1.png');
    fs.writeFileSync(output, Buffer.from(result.png, 'base64'), { flag: 'wx' });
    const report = { status: 'completed', source, sourceSha256: hash(source), generated, generatedSha256: hash(generated), output, sha256: hash(output), svg: svgFile, svgSha256: hash(svgFile), patch, originalFistPreserved: fist, changedPixels: result.changed, outsideMaskChanged: result.outsideChanged, fistChanged: result.fistChanged, method: 'SVG composition of actual generated arm repair; all other source pixels preserved after Canvas normalization.' };
    fs.writeFileSync(path.join(base, 'composite-v1-report.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
    console.info(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
