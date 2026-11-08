/* Reproducible proof frames and silent MP4 for this isolated study only. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const { ROOT, newDirectory } = require('../../project.cjs');
const { readDocument } = require('../../sequence.cjs');
const plan = require('./plan.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const source = path.join(ROOT, 'anime/motion-comics/projects/blue-purple-pages01-08-v4.json');
const documentData = readDocument(source);
const files = [...new Set([source, ...documentData.files,
  ...['plan.json', 'motion.js', 'study.js', 'index.html', 'serve.cjs', 'review.cjs'].map(file => path.join(__dirname, file)),
  path.resolve(__dirname, '../../layers.js'), path.resolve(__dirname, '../../effects.js')])];
const sourceHashes = files.map(file => ({ file: path.relative(ROOT, file), sha256: hash(file) }));
const output = newDirectory(process.argv[2]);
const report = { status: 'running', startedAt: new Date().toISOString(), sourceHashes, frames: [], checks: {}, pageErrors: [] };
const save = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
function encode(args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0) throw Error(result.error?.message ?? result.stderr);
  return result;
}
async function contactSheet(page, proofs) {
  return page.evaluate(async proofs => {
    const tileWidth = 426, tileHeight = 270, c = document.createElement('canvas');
    c.width = tileWidth * 3; c.height = tileHeight * Math.ceil(proofs.length / 3);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#101723'; ctx.fillRect(0, 0, c.width, c.height);
    for (let index = 0; index < proofs.length; index++) {
      const proof = proofs[index], image = new Image(); image.src = proof.png; await image.decode();
      const x = index % 3 * tileWidth, y = Math.floor(index / 3) * tileHeight;
      ctx.drawImage(image, x, y, tileWidth, 240); ctx.fillStyle = '#f3f0e9'; ctx.font = '16px sans-serif';
      ctx.fillText(`${proof.scene} · ${proof.time.toFixed(3)} s · local ${proof.local.toFixed(3)}`, x + 10, y + 261);
    }
    return c.toDataURL().split(',')[1];
  }, proofs);
}
(async () => {
  save();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    await page.goto('http://127.0.0.1:50920/anime/motion-comics/prototypes/motion-design-v1/index.html');
    await page.waitForFunction(() => window.holtStudy || document.querySelector('#error').textContent, null, { timeout: 45000 });
    assert.equal(await page.locator('#error').innerText(), '');
    await page.click('[data-scene="2"]'); assert.equal(await page.evaluate(() => window.holtStudy.state.scene.id), 'wind');
    await page.click('#play'); await page.waitForFunction(() => window.holtStudy.state.local > 0.15);
    await page.click('#play'); const pausedAt = await page.evaluate(() => window.holtStudy.state.position);
    await page.waitForTimeout(120); assert.equal(await page.evaluate(() => window.holtStudy.state.position), pausedAt);
    await page.evaluate(() => window.holtStudy.setManual(true));
    report.checks.controlsAndPause = true;
    report.checks.pixels = await page.evaluate(() => {
      const api = window.holtStudy;
      const bytes = image => {
        const c = document.createElement('canvas'); c.width = image.width; c.height = image.height;
        const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      const differences = (a, b, rect, w, h) => {
        let count = 0;
        for (let y = Math.ceil(rect[1] * h); y < Math.floor((rect[1] + rect[3]) * h); y++)
          for (let x = Math.ceil(rect[0] * w); x < Math.floor((rect[0] + rect[2]) * w); x++) {
            const k = (y * w + x) * 4;
            if ([0, 1, 2, 3].some(channel => a[k + channel] !== b[k + channel])) count++;
          }
        return count;
      };
      const png = () => document.querySelector('#study').toDataURL();
      api.setEffects(true); api.seek(1.5); const contact = png(); api.seek(13); api.seek(1.5);
      const deterministic = contact === png();
      const glassPoses = [6.749, 6.75, 7].map(time => api.seek(time).pose);
      api.setEffects(false); api.seek(10.5);
      const original = bytes(api.pageCanvas), image = api.pageCanvas;
      const region = api.pages[8].data.protectedRegions.find(region => region.id === 'c4-entire-fixed-car-wheels-and-contact-shadow').rect;
      api.setEffects(true);
      const car = [10.5, 11.3, 12, 13.1, 15.1, 16.25].map(time => {
        api.seek(time); return { time, changed: differences(original, bytes(api.pageCanvas), region, image.width, image.height) };
      });
      const actorRegions = api.pages[5].data.protectedRegions.filter(region => /^c4-/.test(region.id));
      api.seek(7.5); const beforeEffects = bytes(api.artCanvas), withLetters = bytes(api.pageCanvas);
      const actors = actorRegions.map(region => ({ id: region.id, changed: differences(beforeEffects, withLetters, region.rect, api.pageCanvas.width, api.pageCanvas.height) }));
      api.setEffects(false); api.seek(5.5); const off = png(); api.seek(9.5); const offStable = off === png();
      api.setEffects(true);
      return { deterministic, glassPoses, car, actors, offStable };
    });
    assert(report.checks.pixels.deterministic && report.checks.pixels.offStable);
    assert.deepEqual(report.checks.pixels.glassPoses, [0, 1, 1]);
    assert(report.checks.pixels.car.every(item => item.changed === 0));
    assert(report.checks.pixels.actors.every(item => item.changed === 0));
    await page.evaluate(() => window.holtStudy.seek(0));
    await page.screenshot({ path: path.join(output, 'prototype-desktop.png') });
    const proofs = []; let start = 0;
    for (const scene of plan.scenes) {
      for (const local of scene.proofTimes) {
        const time = start + local;
        const shot = await page.evaluate(time => {
          const state = window.holtStudy.seek(time);
          return { png: document.querySelector('#study').toDataURL(), scene: state.scene.id, time: state.position, local: state.local, pose: state.pose ?? null };
        }, time);
        const file = `proof-${String(proofs.length).padStart(2, '0')}-${scene.id}.png`;
        fs.writeFileSync(path.join(output, file), Buffer.from(shot.png.split(',')[1], 'base64'));
        proofs.push(shot); report.frames.push({ file, scene: shot.scene, time: shot.time, local: shot.local, pose: shot.pose, sha256: hash(path.join(output, file)) });
      }
      start += scene.duration;
    }
    const sheet = await contactSheet(page, proofs);
    fs.writeFileSync(path.join(output, 'contact-sheet.png'), Buffer.from(sheet, 'base64'));
    const frames = path.join(output, 'frames'); fs.mkdirSync(frames);
    const count = Math.ceil(start * plan.fps);
    for (let index = 0; index < count; index++) {
      const png = await page.evaluate(time => { window.holtStudy.seek(time); return document.querySelector('#study').toDataURL().split(',')[1]; }, index / plan.fps);
      fs.writeFileSync(path.join(frames, `frame_${String(index).padStart(5, '0')}.png`), Buffer.from(png, 'base64'));
    }
    encode(['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-framerate', String(plan.fps), '-i', path.join(frames, 'frame_%05d.png'), '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(output, 'motion-study.mp4')]);
    encode(['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', path.join(output, 'motion-study.mp4'), '-f', 'null', '-']);
    // The encoded sheet is separate evidence: temporal sampling survives real H264.
    const encodedDirectory = path.join(output, 'encoded'); fs.mkdirSync(encodedDirectory);
    const indices = report.frames.map(frame => Math.round(frame.time * plan.fps));
    const selection = `select='${indices.map(index => `eq(n,${index})`).join('+')}'`;
    encode(['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-i', path.join(output, 'motion-study.mp4'), '-vf', selection, '-vsync', '0', '-start_number', '0', path.join(encodedDirectory, 'frame_%02d.png')]);
    report.encodedFrames = report.frames.map((proof, index) => ({ scene: proof.scene, frame: indices[index], time: indices[index] / plan.fps,
      local: proof.local + indices[index] / plan.fps - proof.time, file: `encoded/frame_${String(index).padStart(2, '0')}.png` }));
    const encodedProofs = report.encodedFrames.map(proof => ({ ...proof, png: 'data:image/png;base64,' + fs.readFileSync(path.join(output, proof.file)).toString('base64') }));
    fs.writeFileSync(path.join(output, 'encoded-sheet.png'), Buffer.from(await contactSheet(page, encodedProofs), 'base64'));
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const phone = await mobile.newPage(); await phone.goto(page.url()); await phone.waitForFunction(() => window.holtStudy);
    assert.equal(await phone.locator('#effects').isChecked(), false);
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await phone.screenshot({ path: path.join(output, 'prototype-mobile.png'), fullPage: true }); await mobile.close();
    report.checks.mobileAndReducedMotion = true;
    report.sourceDifferences = sourceHashes.filter(item => hash(path.resolve(ROOT, item.file)) !== item.sha256);
    assert.deepEqual(report.sourceDifferences, []); assert.deepEqual(report.pageErrors, []);
    report.video = { file: 'motion-study.mp4', duration: start, frames: count, fps: plan.fps, width: 1280, height: 720, silent: true, decoded: true, sha256: hash(path.join(output, 'motion-study.mp4')), bytes: fs.statSync(path.join(output, 'motion-study.mp4')).size };
    report.status = 'completed'; report.finishedAt = new Date().toISOString(); save();
    console.info(JSON.stringify({ status: report.status, checks: report.checks, video: report.video }));
  } catch (error) { report.status = 'failed'; report.error = error.message; save(); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
