/* Prepare candidate placements; inspect the selected drawings before assembling. */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('../../project.cjs');
const contractFile = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/CONTRACTS.json');
const contract = JSON.parse(fs.readFileSync(contractFile, 'utf8'));
for (const page of contract.pages) {
  const id = String(page.page).padStart(2, '0');
  const directory = path.join(ROOT, `art-masters/motion-comics/blue-purple/page-${id}`);
  fs.mkdirSync(directory, { recursive: true });
  const balloons = page.panels.flatMap(panel => panel.bubbles.map(balloon => {
    const cue = panel.cues.find(item => item.id === balloon.cue);
    if (!cue) throw Error(`Bulle sans réplique : ${balloon.cue}`);
    const [x, y, w, h] = balloon.rectPx;
    const max = Math.floor((w - 40) / (balloon.fontPx * 0.56));
    const lines = [];
    let line = '';
    for (const word of cue.textFr.split(' ')) {
      if (line.length && line.length + word.length + 1 > max) { lines.push(line); line = word; }
      else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    const [targetX, targetY] = balloon.tailTargetPx;
    const baseX = Math.max(x + 24, Math.min(x + w - 24, targetX));
    return { cue: cue.id, speaker: cue.speaker, rect: balloon.rectPx, font: balloon.fontPx, lines,
      tail: [[baseX - 14, y + h - 12], [targetX, targetY], [baseX + 14, y + h - 12]] };
  }));
  const spec = { version: 1, status: 'candidate-adjust-on-selected-drawing', page: page.page, width: contract.pageGeometry.width, height: contract.pageGeometry.height,
    contract: path.relative(directory, contractFile).replaceAll('\\', '/'), outputDirectory: '.', background: '#050509',
    images: contract.pageGeometry.bandRectsPx.map((rect, index) => ({ file: `band-${String(index + 1).padStart(2, '0')}-v1.png`, rect })),
    gutters: page.panels.length === 4 ? [[506, page.page === 5 ? 520 : 12, 12, 496]] : [], balloons };
  const destination = path.join(directory, 'assembly-spec-v1.json');
  fs.writeFileSync(destination, JSON.stringify(spec, null, 2), { flag: 'wx' });
  console.info(JSON.stringify({ page: page.page, destination, balloons: balloons.length }));
}
