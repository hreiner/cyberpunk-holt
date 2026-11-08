/* Bake only the authored transform-zero layer composition into a new off/master image. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const core = require('../../../core.js');
const { ROOT, localFile } = require('../../../project.cjs');
const source = localFile(path.resolve(process.argv[2] ?? ''), ROOT), planFile = localFile(path.resolve(process.argv[3] ?? ''), ROOT);
const url = process.argv[4];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rootRelative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const original = read(source), plan = read(planFile);
const rootData = core.rebaseAssets(original, value => rootRelative(path.resolve(path.dirname(source), value)));
rootData.motionLayers = structuredClone(plan.motionLayers);
const data = core.rebaseAssets(rootData, value => path.relative(path.dirname(source), path.resolve(ROOT, value)).replaceAll('\\', '/'));
core.buildTimeline(data);
const directory = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-08');
const outputs = ['page-raw-v3.png', 'page-v3.png', 'lettering-v3.svg', 'lettering-v3.json', 'page-source-v3.svg', 'assembly-report-v3.json'];
for (const file of outputs) if (fs.existsSync(path.join(directory, file))) throw Error(`Refus d'écraser : ${file}`);
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  let result;
  try {
    const page = await browser.newPage(); await page.goto(url);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
    const manifestUrl = new URL('/' + rootRelative(source), url).href;
    result = await page.evaluate(async ({ data, manifestUrl }) => {
      const reader = window.motionComic; await reader.load(data, manifestUrl); reader.setRenderMode(true); reader.setEffects(true);
      reader.seek(data.motionLayers.find(layer => layer.mode === 'sprite').startSeconds);
      const art = reader.artCanvas, letters = reader.activeLetteringImage;
      if (!art || !letters) throw Error('Art animé ou lettres absents.');
      const final = document.createElement('canvas'); final.width = art.width; final.height = art.height;
      const context = final.getContext('2d'); context.drawImage(art, 0, 0); context.drawImage(letters, 0, 0, final.width, final.height);
      return { width: art.width, height: art.height, raw: art.toDataURL('image/png').split(',')[1], final: final.toDataURL('image/png').split(',')[1] };
    }, { data, manifestUrl });
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(directory, outputs[0]), Buffer.from(result.raw, 'base64'), { flag: 'wx' });
  fs.writeFileSync(path.join(directory, outputs[1]), Buffer.from(result.final, 'base64'), { flag: 'wx' });
  fs.copyFileSync(path.resolve(ROOT, rootData.letteringImage), path.join(directory, outputs[2]), fs.constants.COPYFILE_EXCL);
  const letters = read(path.join(directory, 'lettering-v2.json')); letters.version = 3;
  fs.writeFileSync(path.join(directory, outputs[3]), JSON.stringify(letters, null, 2), { flag: 'wx' });
  const letterNodes = fs.readFileSync(path.join(directory, outputs[2]), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${result.width}" height="${result.height}" viewBox="0 0 ${result.width} ${result.height}"><image width="${result.width}" height="${result.height}" href="data:image/png;base64,${result.raw}"/>${letterNodes}</svg>`;
  fs.writeFileSync(path.join(directory, outputs[4]), svg, { flag: 'wx' });
  const report = { status: 'completed', compositor: 'motionLayers transform0 before FX, then unchanged lettering', source: rootRelative(source), sourceSha256: hash(source), plan: rootRelative(planFile), planSha256: hash(planFile),
    engine: ['core.js', 'layers.js', 'reader.html'].map(name => ({ file: `anime/motion-comics/${name}`, sha256: hash(path.join(ROOT, 'anime/motion-comics', name)) })),
    inputs: core.assetPaths(rootData).map(file => ({ file, sha256: hash(path.resolve(ROOT, file)) })), outputs: outputs.slice(0, -1).map(file => ({ file, sha256: hash(path.join(directory, file)) })) };
  fs.writeFileSync(path.join(directory, outputs[5]), JSON.stringify(report, null, 2), { flag: 'wx' });
  const specFile = path.join(directory, 'assembly-spec-v1.json');
  fs.copyFileSync(specFile, path.join(directory, 'assembly-spec-before-contact-shadow-v2.json'), fs.constants.COPYFILE_EXCL);
  const spec = read(specFile); spec.version = 3; spec.status = 'contact-shadow-master-awaiting-final-qa'; spec.staticMasterCompositor = { script: rootRelative(path.resolve(process.argv[1])), source: rootRelative(source), plan: rootRelative(planFile), transform: 0 };
  fs.writeFileSync(specFile, JSON.stringify(spec, null, 2));
  console.info(JSON.stringify({ directory, width: result.width, height: result.height, image: outputs[1], sha256: hash(path.join(directory, outputs[1])) }));
})().catch(error => { console.error(error); process.exitCode = 1; });
