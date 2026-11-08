/* Deterministic image placement and editable French lettering for the approved strips. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const { ROOT, localFile, inside } = require('../../project.cjs');

const specFile = localFile(path.resolve(process.argv[2] ?? ''), ROOT);
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const base = path.dirname(specFile);
const destination = path.resolve(base, spec.outputDirectory);
if (!inside(ROOT, destination)) throw Error('Dossier de sortie hors dépôt.');
const width = spec.width ?? 1024, height = spec.height ?? 1536;
const version = spec.version ?? 1;
const names = ['page-raw', 'page', 'page-source', 'lettering', 'assembly-report'].map(name => `${name}-v${version}`);
const outputs = [names[0] + '.png', names[1] + '.png', names[2] + '.svg', names[3] + '.svg', names[3] + '.json', names[4] + '.json'];
for (const file of outputs) if (fs.existsSync(path.join(destination, file))) throw Error(`Refus d’écraser : ${file}`);
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = [];
let images = '';
for (const placement of spec.images) {
  const file = localFile(path.resolve(base, placement.file), ROOT);
  const [x, y, w, h] = placement.rect;
  if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > width || y + h > height) throw Error('Placement d’image invalide.');
  const mime = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }[path.extname(file).toLowerCase()];
  if (!mime) throw Error('Format image non pris en charge.');
  sources.push({ file: path.relative(ROOT, file).replaceAll('\\', '/'), sha256: hash(file), rect: placement.rect });
  images += `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${placement.preserveAspectRatio ?? 'none'}" href="data:${mime};base64,${fs.readFileSync(file).toString('base64')}"/>`;
}
for (const gutter of spec.gutters ?? []) {
  const [x, y, w, h] = gutter;
  images += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${esc(spec.background ?? '#050509')}"/>`;
}
if (spec.contract) {
  const contractFile = localFile(path.resolve(base, spec.contract), ROOT);
  const document = JSON.parse(fs.readFileSync(contractFile, 'utf8'));
  const page = document.pages?.find(item => item.page === spec.page || (spec.pageId !== undefined && item.id === spec.pageId)) ?? document;
  const cues = page.panels.flatMap(panel => panel.cues ?? []);
  for (const cue of cues) {
    const actual = spec.balloons.filter(balloon => balloon.cue === cue.id).flatMap(balloon => balloon.lines).join(' ');
    if (actual !== cue.textFr) throw Error(`Texte différent du contrat : ${cue.id} : ${actual}`);
  }
  for (const balloon of spec.balloons) if (!cues.some(cue => cue.id === balloon.cue)) throw Error(`Bulle sans réplique : ${balloon.cue}`);
}
const letterNodes = spec.balloons.map((balloon, index) => {
  const [x, y, w, h] = balloon.rect;
  const font = balloon.font ?? 27;
  const lineHeight = balloon.lineHeight ?? font + 4;
  const first = y + h / 2 - (balloon.lines.length - 1) * lineHeight / 2 + font * 0.35;
  const tail = balloon.tail ? `<polygon points="${balloon.tail.map(point => point.join(',')).join(' ')}" fill="#fffdf6" stroke="#080910" stroke-width="3" stroke-linejoin="round"/>` : '';
  return `<g id="balloon-${index + 1}" data-cue="${esc(balloon.cue)}">${tail}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(36, h / 2)}" fill="#fffdf6" stroke="#080910" stroke-width="3"/><text text-anchor="middle" font-family="Arial, sans-serif" font-size="${font}" font-weight="700" fill="#080910">${balloon.lines.map((line, row) => `<tspan x="${x + w / 2}" y="${first + row * lineHeight}">${esc(line)}</tspan>`).join('')}</text></g>`;
}).join('');
const start = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
const raw = start + `<rect width="${width}" height="${height}" fill="${esc(spec.background ?? '#050509')}"/>` + images + '</svg>';
const final = raw.slice(0, -6) + letterNodes + '</svg>';
fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(path.join(destination, outputs[2]), final, { flag: 'wx' });
fs.writeFileSync(path.join(destination, outputs[3]), start + letterNodes + '</svg>', { flag: 'wx' });
fs.writeFileSync(path.join(destination, outputs[4]), JSON.stringify({ version, width, height, balloons: spec.balloons }, null, 2), { flag: 'wx' });
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    for (const [svg, file] of [[raw, outputs[0]], [final, outputs[1]]]) {
      await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`);
      await page.evaluate(async () => {
        await Promise.all([...document.querySelectorAll('svg image')].map(node => {
          const image = new Image(); image.src = node.href.baseVal; return image.decode();
        }));
        await document.fonts.ready;
      });
      if (file === outputs[1]) {
        const overflow = await page.evaluate(() => [...document.querySelectorAll('g[data-cue]')].flatMap(group => {
          const text = group.querySelector('text').getBBox();
          const rect = group.querySelector('rect').getBBox();
          return text.x < rect.x + 8 || text.y < rect.y + 5 || text.x + text.width > rect.x + rect.width - 8 || text.y + text.height > rect.y + rect.height - 5 ? [group.getAttribute('data-cue')] : [];
        }));
        if (overflow.length) throw Error(`Texte débordant : ${overflow.join(', ')}`);
      }
      await page.screenshot({ path: path.join(destination, file) });
    }
  } finally { await browser.close(); }
  const report = { status: 'completed', spec: path.relative(ROOT, specFile), specSha256: hash(specFile), width, height, version, sources, outputs: outputs.slice(0, -1).map(file => ({ file, sha256: hash(path.join(destination, file)) })) };
  fs.writeFileSync(path.join(destination, outputs[5]), JSON.stringify(report, null, 2), { flag: 'wx' });
  console.info(JSON.stringify({ destination, width, height, balloons: spec.balloons.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
