/* Independent, read-only review. Run only after the integrator's explicit GO. */
/* global innerHeight */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
let root = __dirname;
while (!fs.existsSync(path.join(root, 'AGENTS.md'))) {
  const parent = path.dirname(root);
  if (parent === root) throw Error('Racine HOLT introuvable.');
  root = parent;
}
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const { newDirectory } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const { rebaseAssets, assetPaths } = require(path.join(root, 'anime/motion-comics/core.js'));
const [url, destination] = process.argv.slice(2);
if (!url || !destination) throw Error('Usage : review.cjs URL_VALIDEE DOSSIER_NEUF');
const output = newDirectory(path.resolve(destination));
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const manifestPath = new URL(url).searchParams.get('manifest');
assert(manifestPath, 'URL de manifeste explicite requise.');
const project = readDocument(path.resolve(root, '.' + decodeURIComponent(manifestPath)));
const previous = readDocument(path.join(root, 'anime/motion-comics/projects/blue-purple-pages01-21-v8.json'));
const baseline = read(path.join(root, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/qa-independent/BASELINE-V8.json'));
const report = {
  status: 'running', startedAt: new Date().toISOString(), reader: url,
  source: relative(project.manifestFile), sourceSha256: sha(project.manifestFile),
  humanListening: false, humanOwnerApproval: false, failures: [], pageErrors: [],
  captures: [], samples: [], unchangedPages: [],
};
const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const check = (condition, label, facts) => { if (!condition) report.failures.push({ label, facts }); };
const close = (a, b) => Math.abs(a - b) < 1e-8;
const files = [...new Set([project.manifestFile, ...project.files])];
const engineNames = ['reader.html', 'reader.css', 'reader.js', 'core.js', 'effects.js', 'layers.js', 'sequence.js',
  'assets/holt-display.woff2', 'assets/holt-text.woff2', 'render.cjs', 'project.cjs', 'sequence.cjs', 'audio.cjs', 'package.json'];
report.engine = engineNames.map(name => ({ file: 'anime/motion-comics/' + name, sha256: sha(path.join(root, 'anime/motion-comics', name)) }));
report.media = files.map(file => ({ file: relative(file), sha256: sha(file) }));
write();
function verifyPreservation() {
  assert.equal(sha(path.join(root, baseline.source)), baseline.sourceSha256);
  for (const entry of baseline.files) assert.equal(sha(path.join(root, entry.file)), entry.sha256, 'Source v8 modifiée : ' + entry.file);
}
function staticChecks() {
  verifyPreservation();
  assert.equal(project.pages.length, 22);
  assert.equal(project.pages[0].id, 'cover');
  assert.equal(project.timeline.pages[0].duration, 12);
  const coverReview = read(path.join(root, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/qa-independent/COVER-REVIEW.json'));
  const coverFile = path.resolve(path.dirname(project.pages[0].manifestFile), project.pages[0].data.image);
  assert.equal(sha(coverFile), coverReview.sha256, 'La couverture sélectionnée diffère de celle ouverte.');
  report.coverReview = { source: relative(coverFile), sha256: coverReview.sha256, openedDirectly: true, humanOwnerApproval: false };
  assert(close(project.timeline.duration, previous.timeline.duration + 12));
  assert.equal(project.timeline.tracks.length, 99);
  const deltas = [];
  for (let i = 0; i < previous.timeline.tracks.length; i++) {
    const old = previous.timeline.tracks[i], next = project.timeline.tracks[i];
    const delay = old.page === 16 && old.panel === 1 ? .7 : 0;
    assert.equal(sha(old.audioFile), sha(next.audioFile));
    assert.equal(next.page, old.page + 1);
    assert.equal(next.panel, old.panel);
    assert.equal(next.speaker, old.speaker);
    assert(close(next.start - old.start, 12 + delay));
    assert(close(next.end - old.end, 12 + delay));
    deltas.push({ index: i, page: next.page, panel: next.panel, speaker: next.speaker, shift: next.start - old.start, sha256: sha(next.audioFile) });
  }
  for (let i = 0; i < previous.pages.length; i++) {
    const old = previous.pages[i], next = project.pages[i + 1];
    assert.equal(old.id, next.id);
    assert(close(project.timeline.pages[i + 1].duration, previous.timeline.pages[i].duration));
    assert(close(project.timeline.pages[i + 1].start - previous.timeline.pages[i].start, 12));
    if (![15, 16].includes(i)) {
      assert.equal(sha(next.manifestFile), sha(old.manifestFile));
      assert.deepEqual(next.files.map(sha), old.files.map(sha));
      report.unchangedPages.push(i + 1);
    }
  }
  // Asset collection and path rebasing must include every new frame and SVG variant.
  report.rebase = [16, 17].map(number => {
    const source = project.pages[number], original = assetPaths(source.data);
    const mapping = new Map(original.map((file, i) => [file, `assets/${i}${path.extname(file)}`]));
    const rebased = rebaseAssets(source.data, file => mapping.get(file));
    assert.deepEqual(assetPaths(rebased), original.map(file => mapping.get(file)));
    return { page: number, collectedAssets: original.length, rebasedAssets: assetPaths(rebased).length, everySourceExists: original.every(file => fs.existsSync(path.resolve(path.dirname(source.manifestFile), file))) };
  });
  report.baseline = { files: baseline.files.length, sourceSha256: baseline.sourceSha256, preservedBefore: true };
  report.timing = { duration: project.timeline.duration, cover: 12, pages: 22, voices: deltas, unchangedNarrativeDurations: true };
}
async function ready(page) {
  await page.goto(url);
  await page.waitForFunction(() => window.motionComic?.pages.length === 22 && !document.querySelector('#play').disabled, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { window.motionComic.pause(); window.__qa = { saved: {} }; });
}
async function capture(page, name) {
  const file = path.join(output, name + '.png');
  await page.screenshot({ path: file });
  report.captures.push({ file: relative(file), sha256: sha(file) });
}
async function saveCanvas(page, selector, name) {
  const data = await page.evaluate(which => {
    const image = which === 'page' ? window.motionComic.pageCanvas : document.querySelector(which);
    if (image.toDataURL) return image.toDataURL();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0); return canvas.toDataURL();
  }, selector);
  const file = path.join(output, name + '.png');
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'), { flag: 'wx' });
  report.captures.push({ file: relative(file), sha256: sha(file) });
}
async function state(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#screen'), box = canvas.getBoundingClientRect(), ratio = canvas.width / box.width;
    const player = window.motionComic, frame = player.frameState;
    return { viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      page: player.pageIndex, label: document.querySelector('#page-label').textContent, panelLabel: document.querySelector('#panel-label').textContent,
      position: player.position, playing: player.playing, muted: player.muted, audio: player.audioState, frame,
      artworkTop: box.y + frame.screenRect[1] / ratio, artworkBottom: box.y + (frame.screenRect[1] + frame.screenRect[3]) / ratio,
      headerBottom: document.querySelector('.masthead').getBoundingClientRect().bottom, dockTop: document.querySelector('.transport').getBoundingClientRect().top };
  });
}
function bounds(s, label) {
  check(s.scroll[0] <= s.viewport[0] && s.scroll[1] <= s.viewport[1], label + ' : défilement', s);
  check(s.artworkTop >= s.headerBottom - 1 && s.artworkBottom <= s.dockTop + 1, label + ' : chrome sur le dessin', s);
}
async function sample(page, number, local, name, screen = false) {
  const global = project.timeline.pages[number].start + local;
  const facts = await page.evaluate(async ({ global, name }) => {
    const player = window.motionComic; player.seek(global);
    // Settle the same Canvas readback path before comparisons of exact pixels.
    for (let warm = 0; warm < 3; warm++) {
      player.draw(global, global);
      player.pageCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, player.pageCanvas.width, player.pageCanvas.height);
    }
    const image = player.pageCanvas, canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
    const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hex = buffer => [...new Uint8Array(buffer)].map(v => v.toString(16).padStart(2, '0')).join('');
    const art = player.artCanvas, raw = art ? art.getContext('2d').getImageData(0, 0, art.width, art.height).data : null;
    const timelinePage = player.pages[player.pageIndex], local = global - timelinePage.start;
    const layer = player.manifest.motionLayers?.find(item => item.id === 'elf-world-to-night-city' || item.id === 'three-bands-one-shot');
    const layerState = layer ? window.motionLayers.sample(layer, local) : null;
    window.__qa.saved[name] = { rgba: new Uint8ClampedArray(rgba), art: raw ? new Uint8ClampedArray(raw) : null, width: canvas.width, height: canvas.height };
    let protectedLetterPixels = 0, letterMismatch = 0;
    if (player.activeLetteringImage) {
      const letters = document.createElement('canvas'); letters.width = canvas.width; letters.height = canvas.height;
      const lc = letters.getContext('2d', { willReadFrequently: true }); lc.drawImage(player.activeLetteringImage, 0, 0, canvas.width, canvas.height);
      const mask = lc.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < mask.length; i += 4) if (mask[i + 3] === 255) {
        protectedLetterPixels++; if (mask[i] !== rgba[i] || mask[i + 1] !== rgba[i + 1] || mask[i + 2] !== rgba[i + 2]) letterMismatch++;
      }
    }
    return { global, local, pageIndex: player.pageIndex, layerState, lettering: player.activeLetteringPath,
      rgbaSha256: hex(await crypto.subtle.digest('SHA-256', rgba)), artSha256: raw ? hex(await crypto.subtle.digest('SHA-256', raw)) : null,
      protectedLetterPixels, letterMismatch, frame: player.frameState };
  }, { global, name });
  facts.name = name; report.samples.push(facts); check(facts.letterMismatch === 0, name + ' : lettres opaques modifiées', facts.letterMismatch);
  await saveCanvas(page, 'page', name); if (screen) await capture(page, name + '-reader'); return facts;
}
async function compareSaved(page, first, second, rect, kind = 'art') {
  return page.evaluate(({ first, second, rect, kind }) => {
    const a = window.__qa.saved[first], b = window.__qa.saved[second];
    const [x, y, w, h] = rect ?? [0, 0, a.width, a.height]; let changed = 0, tested = 0;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const i = (yy * a.width + xx) * 4; tested++;
      if ([0, 1, 2, 3].some(channel => a[kind][i + channel] !== b[kind][i + channel])) changed++;
    }
    return { first, second, rect, kind, changed, tested };
  }, { first, second, rect, kind });
}
async function offCheck(page, number) {
  const selected = project.pages[number], file = path.resolve(path.dirname(selected.manifestFile), selected.data.image);
  const original = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  await page.evaluate(t => { window.motionComic.setEffects(false); window.motionComic.seek(t); }, project.timeline.pages[number].start + 1);
  const pixels = await page.evaluate(async src => {
    const image = new Image(); image.src = src; await image.decode(); const rendered = window.motionComic.pageCanvas;
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
    const a = context.getImageData(0, 0, canvas.width, canvas.height).data;
    context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(rendered, 0, 0);
    const b = context.getImageData(0, 0, canvas.width, canvas.height).data; let changed = 0;
    for (let i = 0; i < a.length; i += 4) if ([0, 1, 2, 3].some(c => a[i + c] !== b[i + c])) changed++;
    return { pixels: canvas.width * canvas.height, changed };
  }, original);
  await saveCanvas(page, 'page', `page-${number}-off`); check(pixels.changed === 0, 'OFF différent du master page ' + number, pixels);
  await page.evaluate(() => window.motionComic.setEffects(true)); return { page: number, masterSha256: sha(file), ...pixels };
}
async function checkProtectedArtwork(page) {
  const old16 = previous.pages[15], old17 = previous.pages[16];
  const uri = file => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  const maskFile = path.join(root, 'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-02/art/p17-clean-mask-v2.json');
  const protectedFacts = await page.evaluate(async ({ old16, old17, mask }) => {
    const load = async src => { const image = new Image(); image.src = src; await image.decode(); return image; };
    const [image16, image17] = await Promise.all([load(old16), load(old17)]);
    const read = image => {
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const source16 = read(image16), source17 = read(image17), state16 = window.__qa.saved['p16-elf-held'], state17 = window.__qa.saved['p17-held'];
    let initialChanged = 0;
    for (let y = 12; y < 508; y++) for (let x = 12; x < 1012; x++) {
      const i = (y * 1024 + x) * 4; if ([0, 1, 2, 3].some(channel => source16[i + channel] !== state16.art[i + channel])) initialChanged++;
    }
    const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 496;
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.fillStyle = 'white'; context.strokeStyle = 'white'; context.lineWidth = 3;
    const scale = Math.max(1000 / mask.width, 496 / mask.height), offset = [(1000 - mask.width * scale) / 2, (496 - mask.height * scale) / 2];
    for (const polygon of [...mask.actors, mask.originalRail, mask.originalHole]) {
      const points = polygon.map(point => [point[0] * scale + offset[0], point[1] * scale + offset[1]]);
      context.beginPath(); context.moveTo(...points[0]); for (const point of points.slice(1)) context.lineTo(...point); context.closePath(); context.fill(); context.stroke();
    }
    const pixels = context.getImageData(0, 0, 1000, 496).data; let tested = 0, changed = 0;
    for (let y = 0; y < 496; y++) for (let x = 0; x < 1000; x++) if (pixels[(y * 1000 + x) * 4 + 3]) {
      tested++; const i = ((y + 520) * 1024 + x + 12) * 4;
      if ([0, 1, 2, 3].some(channel => source17[i + channel] !== state17.art[i + channel])) changed++;
    }
    return { initial16: { tested: 496000, changed: initialChanged }, actorsRailHole17: { tested, changed } };
  }, {
    old16: uri(path.resolve(path.dirname(old16.manifestFile), old16.data.motionBaseImage)),
    old17: uri(path.resolve(path.dirname(old17.manifestFile), old17.data.motionBaseImage)), mask: read(maskFile),
  });
  check(protectedFacts.initial16.changed === 0, 'Paysage initial différent de la source v8', protectedFacts.initial16);
  check(protectedFacts.actorsRailHole17.changed === 0, 'Acteurs, garde-corps ou trou modifiés en 17', protectedFacts.actorsRailHole17);
  return { ...protectedFacts, mask: relative(maskFile), maskSha256: sha(maskFile) };
}
async function review(browser) {
  const desktop = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await desktop.newPage(); page.on('pageerror', error => report.pageErrors.push(error.message)); await ready(page);
  const poster = await state(page); check(poster.page === 0 && poster.label === 'Couverture' && !poster.playing && !poster.audio.musicPlaying, 'Poster initial', poster);
  bounds(poster, 'Couverture desktop'); report.poster = poster; await capture(page, 'desktop-cover-poster');
  await page.click('#pages-toggle');
  const labels = await page.locator('.page-choice').evaluateAll(items => items.map(item => ({ text: item.textContent, aria: item.getAttribute('aria-label') })));
  check(labels.length === 22 && labels[0].text === 'Couverture' && labels[1].text === 'Page 1' && labels[21].text === 'Page 21', 'Numérotation du tiroir', labels);
  report.drawer = labels; await capture(page, 'desktop-drawer-cover');
  for (const number of [16, 17]) await saveCanvas(page, `.page-choice[data-page="${number}"] canvas`, `drawer-initial-${number}`);
  await page.keyboard.press('Escape'); check(await page.locator('#pages-toggle').evaluate(element => element === document.activeElement), 'Retour du focus après Escape');
  await page.click('#next-page'); const first = await state(page); check(first.page === 1 && first.label === 'Page 1 / 21' && close(first.position, 12), 'Couverture vers page 1', first); await capture(page, 'desktop-page-01');
  await page.keyboard.press('Shift+ArrowLeft'); check(await page.evaluate(() => window.motionComic.pageIndex) === 0, 'Clavier vers la couverture');
  await page.keyboard.press('Shift+ArrowRight'); check(await page.evaluate(() => window.motionComic.pageIndex) === 1, 'Clavier vers la page 1');
  await page.click('#next'); check((await state(page)).frame.panelIndex >= 0, 'Navigation vers une case');
  await page.click('#overview'); check(close((await state(page)).position, 12), 'Retour en vue page 1');
  await page.evaluate(() => window.motionComic.seek(window.motionComic.pages[21].start)); const last = await state(page); check(last.page === 21 && last.label === 'Page 21 / 21', 'Dernière page', last); await capture(page, 'desktop-page-21');
  await page.evaluate(() => window.motionComic.setEffects(true));
  const p16 = [['elf-held', .93], ['elf-before-reveal', 1.38 - 1 / 24], ['reveal-start', 1.38], ['reveal-25', 1.38 + 1.05 * .25], ['reveal-50', 1.38 + 1.05 * .5], ['reveal-75', 1.38 + 1.05 * .75], ['map-settled', 2.43], ['map-held', 3.0]];
  for (const [name, time] of p16) await sample(page, 16, time, 'p16-' + name, ['elf-held', 'reveal-50', 'map-held'].includes(name));
  report.elfHeld = await compareSaved(page, 'p16-elf-held', 'p16-elf-before-reveal', [12, 12, 1000, 496]); check(report.elfHeld.changed === 0, 'Paysage bouge avant la transition', report.elfHeld);
  report.mapHeld = await compareSaved(page, 'p16-map-settled', 'p16-map-held', [12, 12, 1000, 496]); check(report.mapHeld.changed === 0, 'Carte ne reste pas tenue', report.mapHeld);
  report.unchangedBodies16 = await compareSaved(page, 'p16-elf-held', 'p16-map-held', [0, 508, 1024, 1028]); check(report.unchangedBodies16.changed === 0, 'Dessins des autres cases changés en 16', report.unchangedBodies16);
  const p17 = [['overview', 0], ['before-top', 4.07 - 1 / 24], ['top', 4.07], ['before-shot', 4.67 - 1 / 24], ['shot', 4.67], ['shot-after', 4.71], ['impact', 4.75], ['impact-after', 4.79], ['middle-clean', 4.95], ['before-bottom', 5.10 - 1 / 24], ['bottom', 5.10], ['bottom-after', 5.15], ['held', 6.0]];
  for (const [name, time] of p17) await sample(page, 17, time, 'p17-' + name, ['before-shot', 'shot-after', 'impact-after', 'bottom-after'].includes(name));
  report.protectedArtwork = await checkProtectedArtwork(page);
  report.hiddenBands = await page.evaluate(() => {
    const checks = [['p17-overview', [12, 520, 1000, 496]], ['p17-before-shot', [12, 740, 1000, 276]], ['p17-before-bottom', [12, 860, 1000, 156]]];
    return checks.map(([name, rect]) => {
      const saved = window.__qa.saved[name], [x, y, w, h] = rect; let tested = 0, nonBlack = 0;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        tested++; const i = (yy * saved.width + xx) * 4; if (saved.art[i] || saved.art[i + 1] || saved.art[i + 2]) nonBlack++;
      }
      return { name, interiorRect: rect, tested, nonBlack };
    });
  });
  for (const hidden of report.hiddenBands) check(hidden.nonBlack === 0, 'Bande future déjà présente : ' + hidden.name, hidden);
  const indices = { 'p17-overview': 0, 'p17-before-top': 0, 'p17-top': 1, 'p17-before-shot': 1, 'p17-shot': 2, 'p17-shot-after': 2, 'p17-impact': 3, 'p17-impact-after': 3, 'p17-middle-clean': 4, 'p17-before-bottom': 4, 'p17-bottom': 5, 'p17-bottom-after': 5, 'p17-held': 5 };
  for (const fact of report.samples.filter(item => item.pageIndex === 17)) check(fact.layerState.frameIndex === indices[fact.name], fact.name + ' : mauvais état', { expected: indices[fact.name], actual: fact.layerState });
  report.pauseAndSeek = [];
  for (const [number, time, rect] of [[16, 1.905, [12, 12, 1000, 496]], [17, 4.71, [12, 520, 1000, 496]]]) {
    await sample(page, number, time, `clock-${number}-a`);
    const global = project.timeline.pages[number].start + time;
    await page.evaluate(t => window.motionComic.draw(t, t + 50), global);
    const artStable = await page.evaluate(name => {
      const image = window.motionComic.artCanvas, now = image.getContext('2d').getImageData(0, 0, image.width, image.height).data;
      const old = window.__qa.saved[name].art; let changed = 0; for (let i = 0; i < now.length; i++) if (now[i] !== old[i]) changed++; return changed;
    }, `clock-${number}-a`);
    check(artStable === 0, 'Horloge ambiante avance les calques page ' + number, artStable);
    await page.evaluate(() => window.motionComic.seek(1)); await sample(page, number, time, `clock-${number}-b`);
    const replay = await compareSaved(page, `clock-${number}-a`, `clock-${number}-b`, rect); check(replay.changed === 0, 'Seek non déterministe page ' + number, replay);
    report.pauseAndSeek.push({ page: number, changedBytesWithAmbientClock: artStable, replay });
  }
  report.off = [await offCheck(page, 16), await offCheck(page, 17)];
  // The export thumbnail must follow the same story state as the enlarged case.
  await page.evaluate(() => window.motionComic.setRenderMode(true));
  await sample(page, 17, 4.71, 'export-shot', true); await sample(page, 16, 1.905, 'export-reveal', true);
  await page.evaluate(() => window.motionComic.setRenderMode(false));
  await page.evaluate(() => window.motionComic.seek(.5)); await page.click('#play'); await page.waitForTimeout(200);
  const intro = await state(page); check(intro.playing && intro.audio.musicPlaying && intro.audio.voices.length === 0, 'Musique couverture', intro);
  await page.click('#play'); const paused = await state(page); check(!paused.playing && !paused.audio.musicPlaying && paused.audio.voices.length === 0, 'Pause audio couverture', paused);
  await page.click('#mute'); const mute = await state(page); check(mute.muted, 'Mute activé', mute); await page.click('#mute');
  const firstCue = project.timeline.tracks[0]; await page.evaluate(t => window.motionComic.seek(t), firstCue.start + .05); await page.click('#play'); await page.waitForTimeout(200);
  const spoken = await state(page); check(spoken.audio.voices.length > 0 && spoken.audio.musicPlaying, 'Voix et backing après la couverture', spoken); await page.click('#play');
  await page.evaluate(() => window.motionComic.seek(430)); await page.click('#play'); await page.waitForTimeout(200);
  const seeked = await state(page); check(seeked.audio.musicPlaying && Math.abs(seeked.audio.musicTime - seeked.position) < .4, 'Seek backing', seeked); await page.click('#play');
  await page.evaluate(() => window.motionComic.seek(11.93)); await page.click('#play'); await page.waitForTimeout(250); const crossing = await state(page); check(crossing.page === 1 && crossing.audio.musicPlaying, 'Raccord couverture/récit', crossing); await page.click('#play');
  report.audio = { intro, paused, mute, spoken, seeked, crossing, humanListening: false };
  await page.click('#fullscreen'); await page.waitForTimeout(100); const full = await page.evaluate(() => Boolean(document.fullscreenElement)); check(full, 'Plein écran réel'); if (full) await page.evaluate(() => document.exitFullscreen()); report.fullscreen = full;
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const phone = await mobile.newPage(); phone.on('pageerror', error => report.pageErrors.push(error.message)); await ready(phone);
  check(await phone.evaluate(() => !window.motionComic.effectsEnabled), 'Mouvements réduits');
  report.mobile = []; report.mobile.push(await state(phone)); bounds(report.mobile.at(-1), 'Couverture mobile'); await capture(phone, 'mobile-cover-poster');
  for (const number of [1, 16, 17, 21]) {
    await phone.click('#pages-toggle'); await phone.click(`.page-choice[data-page="${number}"]`); check(await phone.evaluate(() => window.motionComic.pageIndex) === number, 'Navigation mobile page ' + number);
  }
  await phone.evaluate(t => window.motionComic.seek(t), project.timeline.pages[17].start + 5.15); await phone.evaluate(() => window.motionComic.setEffects(true));
  const mobileCase = await state(phone); bounds(mobileCase, 'Case mobile 17'); report.mobile.push(mobileCase); await capture(phone, 'mobile-case-17');
  await phone.setViewportSize({ width: 844, height: 390 }); await phone.waitForTimeout(150); const landscape = await state(phone); bounds(landscape, 'Case paysage mobile 17'); report.mobile.push(landscape); await capture(phone, 'mobile-landscape-17');
  await phone.evaluate(t => window.motionComic.seek(t), project.timeline.pages[16].start + 2.6); const mobileMap = await state(phone); bounds(mobileMap, 'Carte paysage mobile'); report.mobile.push(mobileMap); await capture(phone, 'mobile-landscape-map');
  await mobile.close(); await desktop.close();
}
(async () => {
  let browser;
  try {
    staticChecks(); write();
    browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    await review(browser);
    verifyPreservation(); report.baseline.preservedAfter = true;
    for (const item of [...report.media, ...report.engine]) assert.equal(sha(path.join(root, item.file)), item.sha256, 'Source modifiée pendant la revue : ' + item.file);
    assert.equal(sha(path.join(root, report.protectedArtwork.mask)), report.protectedArtwork.maskSha256, 'Masque de protection modifié pendant la revue.');
    check(report.pageErrors.length === 0, 'Erreurs JavaScript', report.pageErrors);
    report.status = report.failures.length ? 'failed' : 'completed';
    report.finishedAt = new Date().toISOString(); write();
    console.info(JSON.stringify({ status: report.status, captures: report.captures.length, samples: report.samples.length, failures: report.failures, sourceSha256: report.sourceSha256 }));
    if (report.failures.length) process.exitCode = 1;
  } catch (error) {
    report.status = 'failed'; report.error = error.message; write(); console.error(error); process.exitCode = 1;
  } finally { if (browser) await browser.close(); }
})();
