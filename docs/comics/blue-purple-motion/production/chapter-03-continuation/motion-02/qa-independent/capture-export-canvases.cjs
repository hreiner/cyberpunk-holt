/* Capture only the historical 1280x720 Canvas, without the browser UI. No MP4. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
let root = __dirname;
while (!fs.existsSync(path.join(root, 'AGENTS.md'))) root = path.dirname(root);
const [url, destination, previousReport] = process.argv.slice(2);
if (!url || !destination || !previousReport) throw Error('Usage : capture-export-canvases.cjs URL DOSSIER_NEUF RAPPORT_QA');
const { newDirectory } = require(path.join(root, 'anime/motion-comics/project.cjs'));
const output = newDirectory(path.resolve(destination));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const previous = JSON.parse(fs.readFileSync(previousReport, 'utf8'));
const frozen = [...previous.media, ...previous.engine];
function preserved() { for (const item of frozen) assert.equal(sha(path.join(root, item.file)), item.sha256, 'Source QA modifiée : ' + item.file); }
const report = { status: 'running', sourceSha256: previous.sourceSha256, sourceReport: relative(path.resolve(previousReport)), width: 1280, height: 720, samples: [], humanListening: false };
const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
(async () => { let browser; try {
  preserved(); write();
  browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(url); await page.waitForFunction(() => window.motionComic?.pages.length === 22 && !document.querySelector('#play').disabled, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { window.motionComic.pause(); window.motionComic.setRenderMode(true); window.motionComic.setEffects(true); });
  for (const [name, number, local] of [['cover', 0, .5], ['page-01', 1, 1.0], ['page-21', 21, 1.0], ['reveal-16', 16, 1.905], ['shot-17', 17, 4.71]]) {
    const facts = await page.evaluate(({ number, local }) => {
      const player = window.motionComic, time = player.pages[number].start + local;
      player.seek(time); player.draw(time, time);
      const canvas = document.querySelector('#screen');
      return { time, local: player.frameState.storyTime, frame: player.frameState, label: document.querySelector('#page-label').textContent, width: canvas.width, height: canvas.height, png: canvas.toDataURL() };
    }, { number, local });
    assert.equal(facts.width, 1280); assert.equal(facts.height, 720);
    const file = path.join(output, name + '.png'); fs.writeFileSync(file, Buffer.from(facts.png.split(',')[1], 'base64'), { flag: 'wx' }); delete facts.png;
    report.samples.push({ name, file: relative(file), sha256: sha(file), ...facts }); write();
  }
  preserved(); report.status = 'completed'; report.sourcesAndEnginePreserved = true; write();
  console.info(JSON.stringify({ status: report.status, canvases: report.samples.length, sourceSha256: report.sourceSha256 }));
} catch (error) { report.status = 'failed'; report.error = error.message; write(); throw error; }
finally { if (browser) await browser.close(); } })().catch(error => { console.error(error); process.exitCode = 1; });
