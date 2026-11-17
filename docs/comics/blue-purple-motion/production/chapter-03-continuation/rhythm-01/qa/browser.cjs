/* Targeted real-reader checks for page cuts, camera pace and the manual overview. */
/* global requestAnimationFrame */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../../../../../../..');
const MASTER = path.join(ROOT, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/rhythm-01/qa');
const sourceFile = 'anime/motion-comics/projects/blue-purple-pages01-21-v11.json';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
async function ready(page) {
  await page.waitForFunction(() => window.motionComic?.duration > 0 && document.querySelector('#reader').dataset.ready === 'true' && !document.querySelector('#play').disabled, null, { timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
}
async function seek(page, time, index) {
  await page.evaluate(async ({ time, index }) => { const api = window.motionComic; api.pause(); api.seek(time); await api.whenPageReady(index); }, { time, index });
  await page.waitForFunction(({ time, index }) => Math.abs(window.motionComic.position - time) < 1e-7 && window.motionComic.pageIndex === index && !window.motionComic.buffering, { time, index }, { timeout: 45000 });
}
const state = page => page.evaluate(() => ({ position: window.motionComic.position, playing: window.motionComic.playing, page: window.motionComic.pageIndex, frame: window.motionComic.frameState, audio: window.motionComic.audioState, loading: window.motionComic.loadingState, error: document.querySelector('#error').textContent }));
async function main(urlValue, output) {
  assert(urlValue && output, 'URL et nouveau dossier QA requis.');
  let url = new URL(urlValue);
  const destination = path.resolve(ROOT, output);
  assert(destination.startsWith(MASTER + path.sep) && !fs.existsSync(destination), 'Sortie QA neuve requise.');
  fs.mkdirSync(destination, { recursive: true });
  const report = { status: 'running', date: '2026-11-17', url: url.href, sourceSha256: hash(fs.readFileSync(path.join(ROOT, sourceFile))), tests: [], captures: [], errors: [], limitations: ['Aucune écoute humaine du mix.', 'Parcours ciblés ; pas de lecture continue de8min12.'] };
  const save = () => fs.writeFileSync(path.join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const test = async (name, run) => {
    const item = { name, status: 'running' }; report.tests.push(item); save();
    try { item.result = await run(); item.status = 'passed'; }
    catch (error) { item.status = 'failed'; item.error = error.stack; }
    save();
  };
  const capture = async (page, name) => {
    const file = path.join(destination, name + '.png'); await page.screenshot({ path: file });
    report.captures.push({ file: path.relative(ROOT, file).replaceAll('\\', '/'), sha256: hash(fs.readFileSync(file)), state: await state(page) });
  };
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) report.errors.push(`HTTP${response.status()} ${response.url()}`); });
    await page.goto(url.href); await ready(page);
    url = new URL(page.url()); report.resolvedURL = url.href;
    const initial = await state(page), pages = await page.evaluate(() => window.motionComic.pages);
    report.mode = initial.loading.mode;
    if (report.mode === 'progressive') {
      await test('identité du paquet et moteur1.4.1 réellement servis', async () => {
        const publicationResponse = await fetch(new URL('PUBLICATION.json', url)); assert(publicationResponse.ok);
        const publicationBytes = Buffer.from(await publicationResponse.arrayBuffer()), publication = JSON.parse(publicationBytes);
        assert.equal(publication.version, 11); assert.equal(publication.engineVersion, '1.4.1');
        assert.equal(publication.source.sequenceSha256, report.sourceSha256);
        assert(Math.abs(publication.duration - 491.9) < 1e-8);
        const chapterResponse = await fetch(new URL('chapter.json', url)); assert(chapterResponse.ok);
        const chapterBytes = Buffer.from(await chapterResponse.arrayBuffer());
        assert.equal(hash(chapterBytes), publication.files.find(file => file.path === 'chapter.json').sha256);
        assert.deepEqual(await page.evaluate(() => window.motionComic.document), JSON.parse(chapterBytes));
        const runtime = [];
        for (const file of ['core.js', 'reader.js']) {
          const response = await fetch(new URL(file, url)); assert(response.ok);
          const bytes = Buffer.from(await response.arrayBuffer());
          assert.equal(hash(bytes), publication.files.find(entry => entry.path === file).sha256);
          assert.equal(hash(bytes), hash(fs.readFileSync(path.join(ROOT, 'anime/motion-comics', file))));
          runtime.push({ file, sha256: hash(bytes) });
        }
        return { publicationSha256: hash(publicationBytes), chapterSha256: hash(chapterBytes), runtime };
      });
    }
    await test('22entrées,99voix et491.9s dans le navigateur', async () => {
      const data = await page.evaluate(() => ({ duration: window.motionComic.duration, pages: window.motionComic.pages.length, voices: window.motionComic.tracks.length, version: window.motionComic.document.version }));
      assert.equal(data.version, 11); assert.equal(data.pages, 22); assert.equal(data.voices, 99); assert(Math.abs(data.duration - 491.9) < 1e-8); return data;
    });
    await test('21raccords et premièrecase sans zoom depuis une pleinepage', async () => {
      const results = [];
      for (let index = 1; index < pages.length; index++) {
        const p = pages[index];
        await seek(page, p.start - 1e-5, index - 1);
        const before = await state(page);
        assert(before.frame.panelIndex >= 0, 'Dernière case requise avant raccord');
        const samples = [];
        for (const delta of [0, 0.02, 0.39]) {
          await seek(page, p.start + delta, index);
          const sample = await page.evaluate(() => {
            const api = window.motionComic, frame = api.frameState, rect = api.manifest.panels[0].rect;
            return { frame, expectedRatio: api.pageCanvas.width * rect[2] / (api.pageCanvas.height * rect[3]) };
          });
          assert.equal(sample.frame.panelIndex, 0);
          assert(Math.abs(sample.frame.screenRect[2] / sample.frame.screenRect[3] - sample.expectedRatio) < 1e-7, 'Caméra initiale en vue entière');
          samples.push(sample);
        }
        results.push({ page: index, before, samples });
      }
      return results;
    });
    await test('transition caméra terminée à0.4s et5–8conservées0.3s', async () => {
      const results = [];
      for (const index of [1, 8, 9, 17, 21]) {
        const segment = pages[index].segments.find(s => s.panel === 1), transition = index >= 5 && index <= 8 ? 0.3 : 0.4;
        await seek(page, pages[index].start + segment.start + transition / 2, index);
        const mid = await state(page); assert(Math.abs(mid.frame.transitionBlend - 0.5) < 1e-8);
        await seek(page, pages[index].start + segment.start + transition, index);
        const end = await state(page); assert(Math.abs(end.frame.transitionBlend - 1) < 1e-8);
        results.push({ page: index, transition, mid, end });
      }
      return results;
    });
    await test('enchaînement réel1→2,8→9,16→17,20→21 sans vuepage', async () => {
      const results = [];
      for (const index of [2, 9, 17, 21]) {
        await seek(page, pages[index].start - 0.16, index - 1);
        await page.evaluate(index => window.motionComic.whenPageReady(index), index);
        await page.click('#play');
        const samples = await page.evaluate(async target => {
          const records = [];
          await new Promise(resolve => {
            const sample = () => {
              const api = window.motionComic;
              records.push({ position: api.position, page: api.pageIndex, panel: api.frameState.panelIndex, playing: api.playing, buffering: api.buffering });
              if (api.position >= target || !api.playing && !api.buffering) resolve(); else requestAnimationFrame(sample);
            }; sample();
          });
          window.motionComic.pause(); return records;
        }, pages[index].start + 0.23);
        assert(samples.some(s => s.page === index - 1) && samples.some(s => s.page === index));
        assert(samples.every(s => s.panel >= 0), 'Retour automatique en pleinepage');
        assert(samples.at(-1).position >= pages[index].start + 0.23);
        results.push({ boundary: index, samples });
      }
      return results;
    });
    await test('vuepage manuelle garde la position, Lire restitue la case, pause fige le récit', async () => {
      const at = pages[9].start + 2;
      await seek(page, at, 9); await page.click('#overview');
      const overview = await state(page); assert.equal(overview.position, at); assert.equal(overview.frame.panelIndex, -1); assert.equal(overview.playing, false);
      await capture(page, 'desktop-manual-overview-page09');
      await page.click('#play'); await page.waitForTimeout(250); await page.click('#play');
      const paused = await state(page); assert(paused.position > at); assert(paused.frame.panelIndex >= 0); assert.equal(paused.playing, false); assert.equal(paused.audio.musicPlaying, false);
      await page.waitForTimeout(250); const still = await state(page); assert.equal(still.position, paused.position);
      await page.click('#overview'); await page.click('#next-page');
      await page.waitForFunction(() => window.motionComic.pageIndex === 10 && !window.motionComic.buffering);
      const navigation = await state(page); assert.equal(navigation.frame.panelIndex, 0);
      await page.click('#mute'); assert.equal(await page.evaluate(() => window.motionComic.muted), true);
      await page.click('#mute'); assert.equal(await page.evaluate(() => window.motionComic.muted), false);
      return { overview, paused, still, navigation };
    });
    await test('cadrage desktop/mobile et dernièrecase conservée en fin', async () => {
      await seek(page, pages[9].start + 0.02, 9); await capture(page, 'desktop-page09-first-case');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(150); await capture(page, 'mobile-page09-first-case');
      const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
      assert(viewport.scrollWidth <= viewport.width && viewport.scrollHeight <= viewport.height);
      await seek(page, 491.9, 21); const end = await state(page); assert.equal(end.frame.panelIndex, pages[21].segments.at(-1).panel); assert(end.frame.panelIndex >= 0);
      await capture(page, 'mobile-final-case'); return { viewport, end };
    });
    await context.close();
    if (report.mode === 'progressive') {
      await test('seek froid suspend le récit et repart sur premièrecase', async () => {
        const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block' });
        const page = await context.newPage(); let release, intercepted = false;
        const hold = new Promise(resolve => { release = resolve; });
        const response = await fetch(new URL('chapter.json', url)); assert(response.ok); const chapter = await response.json();
        const manifestURL = new URL(chapter.pages[21].manifest, url), manifestResponse = await fetch(manifestURL); assert(manifestResponse.ok); const manifest = await manifestResponse.json();
        const assetURL = new URL(manifest.motionBaseImage ?? manifest.image, manifestURL).href;
        await context.route(assetURL, async route => { intercepted = true; await hold; await route.continue(); });
        try {
          await page.goto(url.href); await ready(page);
          await page.click('#play'); await page.waitForTimeout(100); await page.click('#play');
          const start = await state(page);
          await page.evaluate(time => window.motionComic.seek(time), pages[21].start);
          await page.click('#play');
          await page.waitForFunction(() => window.motionComic.buffering);
          const buffering = await state(page); await page.waitForTimeout(250); const frozen = await state(page);
          assert(intercepted); assert.equal(frozen.position, start.position); assert.equal(frozen.position, buffering.position); assert.equal(frozen.audio.musicPlaying, false);
          release(); await page.waitForFunction(() => window.motionComic.pageIndex === 21 && !window.motionComic.buffering && window.motionComic.playing);
          await page.evaluate(() => window.motionComic.pause()); const readyState = await state(page); assert.equal(readyState.frame.panelIndex, 0);
          return { start, buffering, frozen, ready: readyState, heldAsset: assetURL };
        } finally { release(); await context.close(); }
      });
    }
    report.status = report.tests.every(item => item.status === 'passed') && report.errors.length === 0 ? 'passed' : 'failed';
  } catch (error) { report.status = 'failed'; report.error = error.stack; }
  finally { if (browser) await browser.close(); save(); }
  console.info(JSON.stringify({ status: report.status, tests: report.tests.map(t => ({ name: t.name, status: t.status })), errors: report.errors, output: path.relative(ROOT, destination).replaceAll('\\', '/') }));
  if (report.status !== 'passed') process.exitCode = 1;
}
if (require.main === module) main(process.argv[2], process.argv[3]).catch(error => { console.error(error.stack); process.exitCode = 1; });
