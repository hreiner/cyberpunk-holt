/* Browser integration proof for authored layers, lettering and exact premixed seeking. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ROOT, newDirectory } = require('../../../project.cjs');
const output = newDirectory(path.resolve(process.argv[3] ?? ''));
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(process.argv[2]);
    await page.waitForFunction(() => window.motionComic?.audioState.musicReadyState > 0 && !document.querySelector('#play').disabled);
    const sourceUrl = new URL(new URL(page.url()).searchParams.get('manifest'), page.url());
    const backingUrl = new URL('backing.wav', sourceUrl).href;
    const source = fs.readFileSync(path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/editor-smoke-v1/backing.wav'));
    const partial = await page.request.get(backingUrl, { headers: { Range: 'bytes=44-99' } });
    assert.equal(partial.status(), 206); assert.equal(partial.headers()['content-range'], `bytes 44-99/${source.length}`);
    assert.deepEqual(await partial.body(), source.subarray(44, 100));
    const suffix = await page.request.get(backingUrl, { headers: { Range: 'bytes=-16' } });
    assert.equal(suffix.status(), 206); assert.deepEqual(await suffix.body(), source.subarray(-16));
    assert.equal((await page.request.get(backingUrl, { headers: { Range: 'bytes=999999999-' } })).status(), 416);
    assert.equal((await page.request.get(new URL('/.git/config', page.url()).href)).status(), 403);
    const frames = await page.evaluate(() => {
      const reader = window.motionComic; reader.setRenderMode(true); reader.setEffects(true);
      const sample = time => {
        reader.seek(time); const canvas = document.querySelector('#screen'), state = reader.frameState;
        const at = (x, y) => [...canvas.getContext('2d').getImageData(Math.round(state.screenRect[0] + x / 1024 * state.screenRect[2]), Math.round(state.screenRect[1] + y / 1536 * state.screenRect[3]), 1, 1).data];
        return { shape: at(512, 790), letters: at(512, 55), png: canvas.toDataURL('image/png') };
      };
      const ready = sample(0.5), contact = sample(1.5), repeat = sample(1.5);
      reader.setEffects(false); const off = sample(1.5), offLater = sample(2.5);
      reader.setRenderMode(false); reader.seek(2.25);
      return { ready, contact, repeat, off, offLater, audio: reader.audioState };
    });
    assert.deepEqual(frames.ready.shape, [176, 0, 32, 255]);
    assert.deepEqual(frames.contact.shape, [0, 176, 64, 255]);
    assert.deepEqual(frames.contact.letters, [255, 255, 255, 255]);
    assert.equal(frames.contact.png, frames.repeat.png);
    assert.equal(frames.off.png, frames.offLater.png);
    assert.deepEqual(frames.off.shape, frames.ready.shape);
    await page.waitForFunction(() => Math.abs(window.motionComic.audioState.musicTime - 2.25) < 0.02, null, { timeout: 5000 });
    const pausedSeek = await page.evaluate(() => window.motionComic.audioState);
    assert.equal(pausedSeek.musicPreMixed, true);
    assert.equal(pausedSeek.musicPlaying, false);
    fs.writeFileSync(path.join(output, 'audio-seek-state.json'), JSON.stringify(pausedSeek, null, 2));
    await page.click('#play'); await page.waitForTimeout(180); await page.click('#play');
    const pause = await page.evaluate(() => ({ position: window.motionComic.position, audio: window.motionComic.audioState, playing: window.motionComic.playing }));
    assert.equal(pause.playing, false); assert.equal(pause.audio.musicPlaying, false);
    assert(Math.abs(pause.audio.musicTime - pause.position) < 0.2);
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'contact.png'), Buffer.from(frames.contact.png.split(',')[1], 'base64'));
    const clean = value => Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'png'));
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ status: 'completed', frames: Object.fromEntries(['ready', 'contact', 'off'].map(key => [key, clean(frames[key])])), pausedSeek, pause, errors, deterministic: true, disabledStable: true, byteRangesVerified: true, unauthorizedFileDenied: true }, null, 2));
    console.info('Calques, lettres, déterminisme, arrêt, backing prémixé et seek en pause : réussis.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
