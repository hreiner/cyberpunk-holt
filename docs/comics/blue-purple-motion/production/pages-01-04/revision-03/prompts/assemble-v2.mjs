// Deterministic strip assembly and editable French lettering, not generated drawing.
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import { chromium } from 'playwright';

const root = process.cwd();
const number = Number(process.argv[2]);
if (![2, 3, 4].includes(number)) throw new Error('Usage : node assemble-v2.mjs 2|3|4');
const name = `page-${String(number).padStart(2, '0')}`;
const directory = path.join(root, 'art-masters/motion-comics/blue-purple', name);
const source = path.join(root, 'docs/comics/blue-purple-motion/production/pages-01-04/revision-03/contracts', `${name}.json`);
const contract = JSON.parse(await fs.readFile(source, 'utf8'));
const specs = {
  2: [
    { cue: 'bp-l005', part: 1, rect: [458, 26, 524, 94], font: 26, lines: ['Si vous y retournez maintenant,', 'vous les mènerez tout droit à elle.'], tail: [[473, 100], [364, 204], [501, 109]] },
    { cue: 'bp-l005', part: 2, rect: [580, 112, 240, 50], font: 26, lines: ['Et à vous tous.'] },
    { cue: 'bp-l006', part: 1, rect: [28, 524, 462, 62], font: 24, lines: ['Demain soir, il veut', 'deux mille crédits !'] },
    { cue: 'bp-l006', part: 2, rect: [40, 588, 450, 62], font: 24, lines: ['On va la laisser crever', 'là-bas ?'], tail: [[430, 639], [440, 690], [455, 643]] },
    { cue: 'bp-l007', rect: [534, 532, 462, 110], font: 25, lines: ['Elle nous dirait de nous mettre', "à l'abri d'abord. On ne l'aidera", 'pas si on se fait prendre.'], tail: [[550, 632], [600, 691], [578, 636]] },
    { cue: 'bp-l008', part: 1, rect: [30, 1040, 440, 52], font: 27, lines: ['D’accord… Je vous aide.'] },
    { cue: 'bp-l008', part: 2, rect: [40, 1098, 450, 52], font: 26, lines: ['Mais on revient pour elle.'], tail: [[160, 1139], [190, 1174], [193, 1144]] },
    { cue: 'bp-l009', rect: [720, 1040, 260, 64], font: 28, lines: ['On reviendra.'], tail: [[805, 1092], [795, 1132], [835, 1098]] },
  ],
  3: [
    { cue: 'bp-l010', rect: [550, 22, 426, 96], font: 25, lines: ["C'est tout ce que j'ai.", "Je crois que c'est notre", 'point de départ.'], tail: [[554, 65], [381, 112], [560, 91]] },
    { cue: 'bp-l011', rect: [30, 1042, 440, 96], font: 28, lines: ['Franklyn ?', "Qu'est-ce qu'il y a ?"], tail: [[182, 1125], [202, 1164], [213, 1130]] },
  ],
  4: [
    { cue: 'bp-l012', part: 1, rect: [545, 32, 435, 98], font: 27, lines: ['Je connais ces chiffres.', 'Latitude et longitude.'], tail: [[550, 104], [430, 216], [575, 118]] },
    { cue: 'bp-l012', part: 2, rect: [610, 122, 370, 94], font: 27, lines: ['Je les ai vus dans', 'la simulation.'] },
    { cue: 'bp-l013', rect: [110, 538, 382, 118], font: 25, lines: ["Ce sont d'anciennes", 'coordonnées. Il faut une', 'borne pour les convertir.'], tail: [[150, 643], [180, 690], [180, 649]] },
    { cue: 'bp-l014', rect: [795, 540, 205, 88], font: 27, lines: ['Alors,', 'on y va.'], tail: [[802, 595], [752, 666], [819, 616]] },
    { cue: 'bp-l015', rect: [30, 1042, 300, 86], font: 27, lines: ['Ils sont tous', 'passés où ?'], tail: [[100, 1117], [116, 1152], [130, 1121]] },
  ],
};
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const cues = contract.panels.flatMap(panel => panel.cues);
const balloons = specs[number];
for (const cue of cues) {
  const text = balloons.filter(b => b.cue === cue.id).flatMap(b => b.lines).join(' ');
  if (text !== cue.textFr) throw new Error(`Texte différent du contrat : ${cue.id} : ${text}`);
}
const w = 1024, h = 1536;
let images = '';
for (let band = 1; band <= 3; band++) {
  const selected = { 2: [1, 2, 2], 3: [1, 1, 2], 4: [2, 1, 1] };
  const file = path.join(directory, `band-${String(band).padStart(2, '0')}-v${selected[number][band-1]}.png`);
  const data = await fs.readFile(file);
  const y = [12, 520, 1028][band - 1];
  images += `<image x="12" y="${y}" width="1000" height="496" preserveAspectRatio="none" href="data:image/png;base64,${data.toString('base64')}"/>`;
}
// Exact center gutter from the approved contract, independent of generated gutter width.
images += '<rect x="506" y="520" width="12" height="496" fill="#050509"/>';
const svgStart = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
const rawSvg = svgStart + '<rect width="1024" height="1536" fill="#050509"/>' + images + '</svg>';
const letterNodes = balloons.map((b, i) => {
  const [x, y, width, height] = b.rect;
  const lineHeight = b.font + 4;
  const first = y + height / 2 - (b.lines.length - 1) * lineHeight / 2 + b.font * 0.35;
  const tail = b.tail ? `<polygon points="${b.tail.map(p => p.join(',')).join(' ')}" fill="#fffdf6" stroke="#080910" stroke-width="3" stroke-linejoin="round"/>` : '';
  return `<g id="balloon-${i + 1}" data-cue="${b.cue}">${tail}<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(36, height / 2)}" fill="#fffdf6" stroke="#080910" stroke-width="3"/><text text-anchor="middle" font-family="Arial, sans-serif" font-size="${b.font}" font-weight="700" fill="#080910">${b.lines.map((line, j) => `<tspan x="${x + width / 2}" y="${first + j * lineHeight}">${esc(line)}</tspan>`).join('')}</text></g>`;
}).join('');
const letteringSvg = svgStart + `<metadata>${esc(JSON.stringify({ source: path.relative(root, source).replaceAll('\\', '/'), version: 2, balloons }))}</metadata>` + letterNodes + '</svg>';
const finalSvg = rawSvg.slice(0, -6) + letterNodes + '</svg>';
for (const file of ['page-raw-v2.png', 'page-v2.png']) {
  try { await fs.access(path.join(directory, file)); throw new Error(`Refus d'écraser ${file}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
async function writeSource(filename, content) {
  const file = path.join(directory, filename);
  try { if (await fs.readFile(file, 'utf8') !== content) throw new Error(`Source différente déjà présente : ${filename}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.writeFile(file, content);
}
await writeSource('lettering-v2.svg', letteringSvg);
await writeSource('page-source-v2.svg', finalSvg);
await writeSource('lettering-v2.json', JSON.stringify({ version: 2, width: w, height: h, balloons, texts: cues.map(c => ({ id: c.id, textFr: c.textFr })) }, null, 2));
const browser = await chromium.launch({ headless: true, executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
try {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  for (const [svg, filename] of [[rawSvg, 'page-raw-v2.png'], [finalSvg, 'page-v2.png']]) {
    await page.setContent('<!doctype html><html><body style="margin:0">' + svg + '</body></html>');
    await page.screenshot({ path: path.join(directory, filename) });
  }
} finally { await browser.close(); }
console.info(JSON.stringify({ page: number, directory, width: w, height: h, balloons: balloons.length, texts: 'Tous identiques aux contrats.' }));
