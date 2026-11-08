/* Integrated browser check for the immersive reader; no media generation. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { newDirectory } = require('./project.cjs');

async function ready(page, url) {
  await page.goto(url);
  await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled, null, { timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
}
async function viewportState(page) {
  return page.evaluate(() => {
    const rect = document.querySelector('#screen').getBoundingClientRect();
    const header = document.querySelector('.masthead').getBoundingClientRect();
    const dock = document.querySelector('.transport').getBoundingClientRect();
    const ratio = document.querySelector('#screen').width / rect.width;
    const frame = window.motionComic.frameState;
    return { width: window.innerWidth, height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
      canvas: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      artworkTop: frame.screenRect[1] / ratio, artworkBottom: (frame.screenRect[1] + frame.screenRect[3]) / ratio,
      headerBottom: header.bottom, dockTop: dock.top,
      fontsReady: document.fonts.check('700 24px "Holt Display"') && document.fonts.check('400 17px "Holt Text"') };
  });
}
function assertViewport(state) {
  assert(state.scrollWidth <= state.width && state.scrollHeight <= state.height, 'Le lecteur ne doit pas défiler.');
  assert(Math.abs(state.canvas.x) < 1 && Math.abs(state.canvas.y) < 1);
  assert(Math.abs(state.canvas.width - state.width) < 1 && Math.abs(state.canvas.height - state.height) < 1, 'Le canvas couvre le viewport.');
  assert(state.artworkTop >= state.headerBottom - 1 && state.artworkBottom <= state.dockTop + 1, 'Les commandes ne couvrent pas les bulles.');
  assert.equal(state.fontsReady, true);
}

(async () => {
  if (!process.argv[2] || !process.argv[3]) throw Error('Usage : node check-reader-ui.cjs URL NOUVEAU_DOSSIER [PAGES=8] [VOIX=37]');
  const expectedPages=Number(process.argv[4]??8),expectedVoices=Number(process.argv[5]??37);
  assert(Number.isInteger(expectedPages)&&expectedPages>=5&&Number.isInteger(expectedVoices)&&expectedVoices>0);
  const output = newDirectory(process.argv[3]);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const report = { status: 'running', source: process.argv[2], startedAt: new Date().toISOString(), screenshots: [], errors: [] };
  const save = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addInitScript(() => {
      window.__qaMedia = [];
      window.Audio = new Proxy(window.Audio, { construct(Target, args) { const audio = Reflect.construct(Target, args); window.__qaMedia.push(audio); return audio; } });
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await ready(page, process.argv[2]);
    assert.equal(await page.evaluate(() => window.motionComic.pages.length), expectedPages);
    assert.equal(await page.evaluate(() => window.motionComic.tracks.length), expectedVoices);
    assert.equal(await page.evaluate(() => window.motionComic.playing), false);
    assert.match(await page.locator('#title').innerText(), /^Blue Purple(?: · .+)?$/);
    await page.click('#pages-toggle');
    assert.equal(await page.evaluate(() => document.querySelector('#pages-drawer').open), true);
    assert.equal(await page.locator('.page-choice').count(), expectedPages);
    await page.screenshot({ path: path.join(output, 'desktop-pages.png') });
    report.screenshots.push('desktop-pages.png');
    await page.click(`.page-choice[data-page="${expectedPages-1}"]`);
    assert.equal(await page.evaluate(() => window.motionComic.pageIndex),expectedPages-1);
    await page.click('#pages-toggle');
    await page.click('.page-choice[data-page="4"]');
    assert.equal(await page.evaluate(() => window.motionComic.pageIndex), 4);
    assert.equal(await page.evaluate(() => document.querySelector('#pages-drawer').open), false);
    await page.evaluate(() => window.motionComic.seek(window.motionComic.pages[4].start + 16.1));
    report.desktop = await viewportState(page); assertViewport(report.desktop);
    await page.screenshot({ path: path.join(output, 'desktop-reading.png') });
    report.screenshots.push('desktop-reading.png');
    await page.click('#mute');
    assert(await page.evaluate(count => window.motionComic.muted && window.__qaMedia.length === count+1 && window.__qaMedia.every(audio => audio.muted),expectedVoices), 'Toutes les sources sonores sont muettes.');
    await page.click('#mute');
    assert(await page.evaluate(() => !window.motionComic.muted && window.__qaMedia.every(audio => !audio.muted)));
    await page.click('#play');
    assert.equal(await page.evaluate(() => window.motionComic.playing), true);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.motionComic.playing), false, 'Espace sur le bouton ne provoque pas un double basculement.');
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press('m');
    assert.equal(await page.evaluate(() => window.motionComic.muted), true);
    await page.keyboard.press('m');
    await page.keyboard.press('f');
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    report.nativeFullscreen = true;
    await page.click('#fullscreen');
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.locator('#progress').focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
    assert(Math.abs(await page.evaluate(() => window.motionComic.position) - 0.01) < 1e-8, 'Les flèches du curseur ne sautent pas de case.');
    await page.evaluate(() => { document.activeElement.blur(); window.motionComic.seek(window.motionComic.pages[4].start + 9.7); });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('#reader').classList.contains('chrome-hidden'), null, { timeout: 6000 });
    const expanded = await page.evaluate(() => ({ view: window.motionComic.frameState.view, width: document.querySelector('#screen').width, height: document.querySelector('#screen').height }));
    assert.equal(expanded.view.y, 0); assert.equal(expanded.view.h, expanded.height);
    await page.waitForFunction(() => window.getComputedStyle(document.querySelector('.masthead')).visibility === 'hidden');
    await page.screenshot({ path: path.join(output, 'desktop-immersive.png') });
    report.screenshots.push('desktop-immersive.png');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('#reader').classList.contains('chrome-hidden')), false);
    await page.evaluate(() => window.motionComic.pause());
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForFunction(() => document.querySelector('#screen').width === 2560);
    report.largeDesktop = await viewportState(page); assertViewport(report.largeDesktop);
    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const phone = await mobile.newPage(); phone.on('pageerror', error => report.errors.push(error.message));
    await ready(phone, process.argv[2]);
    assert.equal(await phone.evaluate(() => window.motionComic.effectsEnabled), false);
    report.mobile = await viewportState(phone); assertViewport(report.mobile);
    await phone.screenshot({ path: path.join(output, 'mobile-reading.png') }); report.screenshots.push('mobile-reading.png');
    await phone.click('#pages-toggle'); await phone.click('.page-choice[data-page="4"]');
    assert.equal(await phone.evaluate(() => window.motionComic.pageIndex), 4);
    await phone.click('#pages-toggle');await phone.click(`.page-choice[data-page="${expectedPages-1}"]`);
    assert.equal(await phone.evaluate(() => window.motionComic.pageIndex),expectedPages-1);
    for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
      await phone.setViewportSize(size);
      await phone.waitForFunction(size => {
        const canvas = document.querySelector('#screen'), ratio = Math.min(window.devicePixelRatio || 1, 2);
        return canvas.width === Math.round(size.width * ratio) && canvas.height === Math.round(size.height * ratio);
      }, size);
      await phone.evaluate(() => window.motionComic.seek(window.motionComic.pages[4].start + 16.1));
      const state = await viewportState(phone); assertViewport(state);
      report[`mobile${size.width}`] = state;
    }
    await phone.screenshot({ path: path.join(output, 'mobile-landscape.png') }); report.screenshots.push('mobile-landscape.png');
    await mobile.close();
    assert.deepEqual(report.errors, []);
    report.status = 'completed'; report.pages=expectedPages;report.voices=expectedVoices;report.lastPageReachable=true;report.finishedAt = new Date().toISOString(); save();
    console.info(JSON.stringify({ status: report.status, sizes: 5, nativeFullscreen: report.nativeFullscreen, screenshots: report.screenshots.length, pageErrors: report.errors }));
  } catch (error) { report.status = 'failed'; report.error = error.message; save(); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
