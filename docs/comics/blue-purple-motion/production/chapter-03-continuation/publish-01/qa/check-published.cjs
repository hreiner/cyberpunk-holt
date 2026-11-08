/* Independent HTTP/Playwright journeys. Run only after bundle owner GO. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ROOT, EXPECTED, relative, sha256, outputDirectory, saveReport, anchors } = require('./common.cjs');
const core = require(path.join(ROOT, 'anime/motion-comics/core.js'));
const sequence = require(path.join(ROOT, 'anime/motion-comics/sequence.js'));

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const annotation = new Map(anchors().map(anchor => [anchor.id, anchor]));
const at = id => { assert(annotation.has(id), `Ancre inconnue : ${id}`); return annotation.get(id).globalSeconds; };

async function remoteGraph(base) {
  const responses = [];
  async function json(url) {
    assert(url.origin === base.origin && url.pathname.startsWith(base.pathname));
    const response = await fetch(url);
    assert(response.ok, `HTTP ${response.status} : ${url}`);
    assert(response.url.startsWith(base.href), `Redirection hors paquet : ${response.url}`);
    const text = await response.text();
    if (url.pathname.endsWith('/PUBLICATION.json')) assert.equal(sha256(text), EXPECTED.publicationSha256);
    if (url.pathname.endsWith('/chapter.json')) assert.equal(sha256(text), EXPECTED.chapterSha256);
    responses.push({ url: url.href, sha256: sha256(text), bytes: Buffer.byteLength(text) });
    return JSON.parse(text);
  }
  const publication = await json(new URL('PUBLICATION.json', base));
  assert.equal(publication.source.sequenceSha256, EXPECTED.sha256);
  const source = new URL(publication.chapter, base), data = await json(source);
  sequence.assertSequence(data);
  const pages = await Promise.all(data.pages.map(async entry => {
    const url = new URL(entry.manifest, source), page = await json(url);
    core.assertManifest(page);
    const assets = core.assetPaths(page).map(asset => new URL(asset, url).href);
    assets.forEach(asset => {
      const resolved = new URL(asset);
      assert(resolved.origin === base.origin && resolved.pathname.startsWith(base.pathname), `Média hors paquet : ${asset}`);
    });
    return { ...entry, url: url.href, data: page, assets };
  }));
  const timeline = sequence.buildSequence(data, pages.map(page => page.data));
  assert.equal(pages.length, EXPECTED.entries);
  assert.equal(pages[0].id, 'cover');
  assert.equal(pages.at(-1).id, 'page-21');
  assert.equal(timeline.tracks.length, EXPECTED.voices);
  assert(Math.abs(timeline.duration - EXPECTED.duration) < 1e-8);
  const markers = pages[16].data.motionLayers.filter(layer => layer.id.startsWith('map-marker-')).map(layer => layer.id);
  assert.deepEqual(markers, ['map-marker-position', 'map-marker-unknown', 'map-marker-green']);
  return { data, pages, timeline, responses };
}

function networkMonitor(page, base, declaredFailures = new Set()) {
  const started = Date.now(), network = { requests: [], errors: [], pageErrors: [] };
  page.on('request', request => {
    const value = request.url();
    network.requests.push({ url: value, type: request.resourceType(), atMs: Date.now() - started });
    if (!/^(?:data:|blob:)/.test(value)) {
      const target = new URL(value);
      if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) network.errors.push({ kind: 'outside-bundle', url: value });
    }
  });
  page.on('response', response => {
    if (response.status() >= 400 && !declaredFailures.has(response.url())) network.errors.push({ kind: 'http', status: response.status(), url: response.url() });
  });
  page.on('requestfailed', request => {
    if (!declaredFailures.has(request.url()) && request.failure()?.errorText !== 'net::ERR_ABORTED') network.errors.push({ kind: 'requestfailed', url: request.url(), error: request.failure() });
  });
  page.on('pageerror', error => network.pageErrors.push(error.message));
  return network;
}

async function ready(page) {
  await page.waitForFunction(() => window.motionComic?.duration > 0 && document.querySelector('#reader').dataset.ready === 'true' && !document.querySelector('#play').disabled, null, { timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
}
async function seek(page, time, expectedIndex) {
  await page.evaluate(async ({ value, index }) => {
    const reader = window.motionComic;
    const result = reader.seek(value);
    if (typeof result !== 'number') throw Error('seek doit conserver son retour numérique.');
    await reader.whenPageReady(index);
  }, { value: time, index: expectedIndex });
  await page.waitForFunction(({ value, index }) => {
    const reader = window.motionComic;
    return reader && Math.abs(reader.position - value) < 1e-7 && reader.pageIndex === index && !reader.buffering && !document.querySelector('#play').disabled && document.querySelector('#reader').dataset.ready === 'true';
  }, { value: time, index: expectedIndex }, { timeout: 45000 });
}
async function state(page) {
  return page.evaluate(() => {
    const reader = window.motionComic;
    return { position: reader.position, page: reader.pageIndex, frame: reader.frameState, audio: reader.audioState, playing: reader.playing, effectTime: reader.effectTime, lettering: reader.activeLetteringPath, loading: reader.loadingState, ready: document.querySelector('#reader').dataset.ready, error: document.querySelector('#error').textContent };
  });
}
async function capture(page, out, label, viewport = false) {
  const filename = `${label}.png`, target = path.join(out, filename);
  if (viewport) await page.screenshot({ path: target });
  else {
    const data = await page.evaluate(() => {
      const source = window.motionComic.pageCanvas, canvas = document.createElement('canvas');
      canvas.width = source.width; canvas.height = source.height;
      canvas.getContext('2d').drawImage(source, 0, 0);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync(target, Buffer.from(data, 'base64'));
  }
  return { file: relative(target), sha256: sha256(fs.readFileSync(target)), state: await state(page) };
}
async function assertViewport(page) {
  const result = await page.evaluate(() => {
    const rect = document.querySelector('#screen').getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, canvas: { width: rect.width, height: rect.height }, fonts: document.fonts.check('700 24px "Holt Display"') && document.fonts.check('400 17px "Holt Text"') };
  });
  assert(result.scrollWidth <= result.width && result.scrollHeight <= result.height);
  assert(Math.abs(result.canvas.width - result.width) < 1 && Math.abs(result.canvas.height - result.height) < 1);
  assert(result.fonts);
  return result;
}
async function assertMaster(page, source) {
  return page.evaluate(async url => {
    window.motionComic.pause(); window.motionComic.setEffects(false);
    const image = new Image(); image.src = url; await image.decode();
    const expected = document.createElement('canvas'), actual = document.createElement('canvas');
    expected.width = actual.width = image.width; expected.height = actual.height = image.height;
    expected.getContext('2d').drawImage(image, 0, 0);
    actual.getContext('2d').drawImage(window.motionComic.pageCanvas, 0, 0);
    const a = actual.getContext('2d').getImageData(0, 0, image.width, image.height).data;
    const b = expected.getContext('2d').getImageData(0, 0, image.width, image.height).data;
    let changedPixels = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) changedPixels++;
    return { width: image.width, height: image.height, changedPixels };
  }, source);
}

(async () => {
  const base = new URL(process.argv[2]);
  assert(base.pathname === EXPECTED.route && !base.search && !base.hash, 'URL directe de publication requise, avec slash final et sans manifeste explicite.');
  const out = outputDirectory(process.argv[3]);
  const report = { status: 'running', startedAt: new Date().toISOString(), url: base.href, tests: [], captures: [], limitations: ['Aucune écoute humaine ne résulte des mesures de média.', 'Les captures doivent encore être ouvertes personnellement avant verdict graphique.'] };
  const save = () => saveReport(out, report);
  let browser;
  async function test(name, run) {
    const item = { name, status: 'running' }; report.tests.push(item); save();
    try { item.result = await run(); item.status = 'passed'; }
    catch (error) { item.status = 'failed'; item.error = error.stack; }
    save();
  }
  try {
    const graph = await remoteGraph(base);
    report.graph = { entries: graph.pages.length, voices: graph.timeline.tracks.length, duration: graph.timeline.duration, responses: graph.responses };
    const executablePath = process.env.HOLT_BROWSER ?? (fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined);
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    await test('cold-cover-before-last-page-media', async () => {
      const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block' });
      const page = await context.newPage(), network = networkMonitor(page, base);
      const last = graph.pages[21], blockedURL = new URL(last.data.motionBaseImage ?? last.data.image, last.url).href;
      let release, intercepted = false;
      const hold = new Promise(resolve => { release = resolve; });
      await context.route(blockedURL, async route => { intercepted = true; await hold; await route.continue(); });
      try {
        await page.goto(base.href); await ready(page);
        const initial = await state(page);
        assert.equal(initial.page, 0); assert.equal(initial.position, 0); assert.equal(initial.playing, false); assert.equal(initial.audio.musicPlaying, false);
        const requestedAtReady = [...new Set(network.requests.map(item => item.url))];
        const absent = [...new Set(graph.pages.flatMap(entry => entry.assets))].filter(url => !requestedAtReady.includes(url));
        assert(absent.length > 0, 'Le démarrage ne doit pas demander tous les médias.');
        report.captures.push(await capture(page, out, 'desktop-cover', true));
        const viewport = await assertViewport(page);
        release();
        await page.click('#play'); await page.waitForTimeout(350); await page.click('#play');
        const paused = await state(page);
        assert(paused.position > 0 && !paused.playing && !paused.audio.musicPlaying && paused.audio.voices.length === 0);
        assert.deepEqual(network.errors, []); assert.deepEqual(network.pageErrors, []);
        return { initial, viewport, requestedAtReady, notRequestedMediaCount: absent.length, heldLastPageImageRequested: intercepted, network };
      } finally { release(); await context.close(); }
    });
    await test('cold-scenes-and-visual-states', async () => {
      const samples = [
        { page: 16, phases: [['vision', at('vision')], ['transition', at('disassembly') + .2], ['three-poi', at('green') + .15]] },
        { page: 17, phases: [['before-shot', at('oneShot') - .03], ['shot', at('oneShot') + .01], ['impact', at('metalImpact') + .01], ['third-band', at('coverBand') + .01]] },
        { page: 20, phases: [['release', at('waterThrowRelease')], ['splash', at('waterSplash') + .02], ['submerged', at('waterSubmerged') + .02]] },
        { page: 21, phases: [['closed', at('refugeDoorOpeningStart') - .03], ['opening', at('refugeDoorOpeningStart') + .65], ['open', at('refugeDoorOpen') + .01]] },
      ];
      const results = [];
      for (const sample of samples) {
        const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block' });
        const page = await context.newPage(), network = networkMonitor(page, base);
        try {
          await page.goto(base.href); await ready(page);
          const states = [];
          for (const [label, time] of sample.phases) { await seek(page, time, sample.page); report.captures.push(await capture(page, out, `page-${sample.page}-${label}`)); states.push(await state(page)); }
          const off = await assertMaster(page, new URL(graph.pages[sample.page].data.image, graph.pages[sample.page].url).href);
          assert.equal(off.changedPixels, 0, 'OFF doit restituer le master.');
          await page.evaluate(() => { window.motionComic.setEffects(true); window.motionComic.setRenderMode(true); });
          const time = sample.phases.at(-1)[1]; await seek(page, time, sample.page);
          const manual = await page.evaluate(value => {
            const reader = window.motionComic; reader.seek(value);
            const first = document.querySelector('#screen').toDataURL(); reader.seek(value);
            return { width: document.querySelector('#screen').width, height: document.querySelector('#screen').height, same: first === document.querySelector('#screen').toDataURL() };
          }, time);
          assert.deepEqual(manual, { width: 1280, height: 720, same: true });
          assert.deepEqual(network.errors, []); assert.deepEqual(network.pageErrors, []);
          results.push({ page: sample.page, states, off, manual, network });
        } finally { await context.close(); }
      }
      return results;
    });
    await test('rapid-cold-seeks-latest-choice-wins', async () => {
      const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block' });
      const page = await context.newPage(), network = networkMonitor(page, base);
      try {
        const delayed = new Set([16, 21].map(index => new URL(graph.pages[index].data.motionBaseImage, graph.pages[index].url).href));
        await context.route('**/*', async route => { if (delayed.has(route.request().url())) await sleep(350); await route.continue(); });
        await page.goto(base.href); await ready(page);
        const finalTime = at('waterSplash') + .02;
        await page.evaluate(async values => {
          for (const time of values) window.motionComic.seek(time);
          await window.motionComic.whenPageReady();
        }, [at('green') + .1, at('refugeDoorOpen') + .1, finalTime]);
        await page.waitForTimeout(600);
        const final = await state(page);
        assert.equal(final.page, 20); assert(Math.abs(final.position - finalTime) < 1e-7); assert.equal(final.playing, false);
        assert.equal(final.audio.musicPlaying, false); assert.equal(final.audio.voices.length, 0);
        await seek(page, at('green') + .1, 16); await seek(page, finalTime, 20);
        const repeated = await state(page);
        assert.equal(repeated.lettering, final.lettering);
        assert.deepEqual(network.errors, []); assert.deepEqual(network.pageErrors, []);
        return { final, repeated, network };
      } finally { await context.close(); }
    });
    await test('recover-one-failed-cold-image', async () => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
      const page = await context.newPage();
      const source = graph.pages[20], failedURL = new URL(source.data.motionBaseImage, source.url).href;
      const network = networkMonitor(page, base, new Set([failedURL]));
      let failures = 0;
      try {
        await context.route(failedURL, async route => { if (failures++ === 0) await route.abort('failed'); else await route.continue(); });
        await page.goto(base.href); await ready(page);
        const time = at('waterSplash') + .02;
        await page.evaluate(value => { window.motionComic.seek(value); }, time);
        await page.waitForFunction(() => Boolean(document.querySelector('#error').textContent), null, { timeout: 45000 });
        assert.equal(failures, 1);
        const failed = await state(page); await page.waitForTimeout(200);
        assert.equal((await state(page)).position, failed.position);
        const navigationsBeforeRetry = network.requests.filter(request => request.type === 'document').length;
        const retry = page.locator('#retry-load, #retry, [data-retry]').first();
        if (await retry.count()) await retry.click();
        else if (await page.evaluate(() => typeof window.motionComic.retry === 'function')) await page.evaluate(async () => { await window.motionComic.retry(); });
        else await page.getByRole('button', { name: /réessayer|réessai/i }).click();
        await ready(page); await seek(page, time, 20);
        const recovered = await state(page);
        assert(failures >= 2); assert.equal(recovered.error, '');
        assert.equal(network.requests.filter(request => request.type === 'document').length, navigationsBeforeRetry, 'Le réessai média ne recharge pas le document.');
        assert.deepEqual(network.errors, []); assert.deepEqual(network.pageErrors, []);
        return { failedURL, failed, recovered, requestsToTarget: failures, network };
      } finally { await context.close(); }
    });
    await test('mobile-initial-thumbnails-audio-pause-and-end', async () => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await context.newPage(), network = networkMonitor(page, base);
      try {
        await page.goto(base.href); await ready(page);
        const viewport = await assertViewport(page);
        await page.click('#pages-toggle');
        assert.equal(await page.locator('.page-choice').count(), EXPECTED.entries);
        for (const index of [18, 21]) {
          const button = page.locator(`.page-choice[data-page="${index}"]`);
          await button.scrollIntoViewIfNeeded();
          const target = path.join(out, `initial-thumbnail-${index}.png`); await button.screenshot({ path: target });
          report.captures.push({ file: relative(target), sha256: sha256(fs.readFileSync(target)), requiresVisualInitialStateReview: true });
        }
        await page.click('#close-pages');
        await seek(page, at('refugeDoorOpeningStart') + .3, 21);
        report.captures.push(await capture(page, out, 'mobile-door', true));
        const paused = await state(page); await page.waitForTimeout(300); const later = await state(page);
        assert.equal(paused.position, later.position); assert.equal(paused.lettering, later.lettering);
        assert(later.effectTime > paused.effectTime, 'La phase ambiante peut avancer pendant la pause.');
        await page.click('#play'); await page.waitForTimeout(250); await page.click('#mute');
        assert.equal(await page.evaluate(() => window.motionComic.muted), true);
        await page.click('#play');
        const audioPaused = await state(page);
        assert.equal(audioPaused.audio.voices.length, 0); assert.equal(audioPaused.audio.musicPlaying, false);
        await seek(page, EXPECTED.duration - .12, 21); await page.click('#play'); await page.waitForTimeout(500);
        const end = await state(page);
        assert.equal(end.playing, false); assert.equal(end.audio.musicPlaying, false); assert.equal(end.audio.voices.length, 0);
        assert(Math.abs(end.position - EXPECTED.duration) < 1e-8);
        report.captures.push(await capture(page, out, 'mobile-end', true));
        assert.deepEqual(network.errors, []); assert.deepEqual(network.pageErrors, []);
        return { viewport, paused, later, audioPaused, end, network };
      } finally { await context.close(); }
    });
    report.status = report.tests.every(test => test.status === 'passed') ? 'passed-pending-visual-review' : 'failed';
    if (report.status === 'failed') process.exitCode = 1;
  } catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; }
  finally {
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString(); save();
    console.log(JSON.stringify({ status: report.status, tests: report.tests.map(test => ({ name: test.name, status: test.status })), captures: report.captures.length, report: relative(path.join(out, 'report.json')) }));
  }
})();
