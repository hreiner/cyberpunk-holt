/* global document */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import { chromium } from 'playwright';

const directory = path.join(process.cwd(), 'art-masters/motion-comics/blue-purple/page-02');
const output = path.join(directory, 'band-02-v2.png');
try { await fs.access(output); throw new Error('La bande composite existe déjà.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const original = await fs.readFile(path.join(directory, 'band-02-v1.png'));
const edited = await fs.readFile(path.join(directory, 'band-02-v2-generated.png'));
const oldImage = 'data:image/png;base64,' + original.toString('base64');
const newImage = 'data:image/png;base64,' + edited.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1774" height="887"><defs><clipPath id="grover"><rect x="887" y="0" width="887" height="887"/></clipPath></defs><image width="1774" height="887" href="${newImage}"/><image width="1774" height="887" href="${oldImage}" clip-path="url(#grover)"/></svg>`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
try {
  const page = await browser.newPage({ viewport: { width: 1774, height: 887 }, deviceScaleFactor: 1 });
  await page.setContent('<!doctype html><html><body style="margin:0">' + svg + '</body></html>');
  await page.screenshot({ path: output });
  const combined = 'data:image/png;base64,' + (await fs.readFile(output)).toString('base64');
  await page.setContent(`<img id="old" src="${oldImage}"><img id="combined" src="${combined}">`);
  const report = await page.evaluate(async () => {
    const read = async id => {
      const img = document.getElementById(id);
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 1774; canvas.height = 887;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, 1774, 887).data;
    };
    const a = await read('old'), b = await read('combined');
    let changedRightPixels = 0, changedLeftPixels = 0;
    for (let y = 0; y < 887; y++) for (let x = 0; x < 1774; x++) {
      const i = (y * 1774 + x) * 4;
      if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || a[i+3] !== b[i+3]) {
        if (x >= 887) changedRightPixels++; else changedLeftPixels++;
      }
    }
    return { width: 1774, height: 887, changedRightPixels, changedLeftPixels };
  });
  if (report.changedRightPixels !== 0 || report.changedLeftPixels === 0) throw new Error('Contrôle du compositing non conforme : ' + JSON.stringify(report));
  await fs.writeFile(path.join(directory, 'grover-composite-v2.json'), JSON.stringify({ version: 2, source: 'band-02-v1.png', edited: 'band-02-v2-generated.png', output: 'band-02-v2.png', ...report }, null, 2));
  console.info(JSON.stringify(report));
} finally { await browser.close(); }
