/* Candidate lettering on the retained strips; authored action images are added after review. */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('../../../project.cjs');
const contractFile = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/revision-01/CONTRACTS.json');
const contract = JSON.parse(fs.readFileSync(contractFile, 'utf8'));
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01');
const old = (number, version = 1) => JSON.parse(fs.readFileSync(path.join(ROOT, `art-masters/motion-comics/blue-purple/page-${String(number).padStart(2, '0')}/lettering-v${version}.json`), 'utf8')).balloons;
const retained = [...old(5), ...old(7), ...old(8, 2)];
const placements = {
  'bp-l024': { rect: [485, 24, 300, 84], font: 27, tail: [[499, 39], [472, 12], [526, 36]] },
  'bp-l025': { rect: [532, 536, 184, 76], font: 25 },
  'bp-l026': { rect: [736, 536, 256, 76], font: 25, tail: [[978, 554], [1010, 550], [979, 579]] },
  'bp-l027': { rect: [30, 1045, 300, 78], font: 27, tail: [[127, 1110], [140, 1135], [154, 1111]] },
  'bp-l017': { rect: [360, 1048, 230, 78], font: 30, tail: [[410, 1114], [426, 1168], [438, 1114]] },
  'bp-l028': { rect: [36, 30, 240, 78], font: 28, tail: [[46, 58], [12, 73], [46, 84]] },
  'bp-l029': { rect: [52, 542, 330, 94], font: 28, tail: [[368, 580], [452, 589], [370, 607]] },
  'bp-l018': { rect: [430, 542, 530, 116], font: 27, tail: [[608, 646], [628, 704], [636, 646]] },
  'bp-l032': { rect: [36, 26, 464, 102], font: 28, tail: [[120, 116], [132, 171], [148, 116]] },
  'bp-l033': { rect: [524, 38, 464, 102], font: 28, tail: [[541, 57], [519, 12], [565, 53]] },
  'bp-l034': { rect: [30, 1044, 360, 88], font: 28, tail: [[135, 1120], [156, 1165], [163, 1120]] },
  'bp-l035': { rect: [470, 1048, 500, 88], font: 28, tail: [[530, 1124], [273, 1167], [560, 1124]] },
  'bp-l036': { rect: [730, 20, 270, 60], font: 24, tail: [[850, 68], [868, 140], [878, 68]] },
  'bp-l021': { rect: [540, 84, 300, 54], font: 24, tail: [[594, 126], [610, 146], [621, 126]] },
  'bp-l037': { rect: [36, 1046, 430, 88], font: 28 },
};
for (const page of contract.pages) {
  const id = String(page.page).padStart(2, '0'), directory = path.join(base, `page-${id}`);
  fs.mkdirSync(directory, { recursive: true });
  const balloons = page.panels.flatMap(panel => panel.bubbles.map(balloon => {
    const cue = panel.cues.find(item => item.id === balloon.cue);
    const fromOld = retained.find(item => item.cue === cue.id);
    if (fromOld && !placements[cue.id]) return { ...fromOld, speaker: cue.speaker };
    const box = placements[cue.id] ?? { rect: balloon.rectPx, font: balloon.fontPx };
    const max = Math.floor((box.rect[2] - 32) / (box.font * 0.53)), lines = [];
    let line = '';
    for (const word of cue.textFr.split(' ')) {
      if (line.length && line.length + word.length + 1 > max) { lines.push(line); line = word; }
      else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    return { cue: cue.id, speaker: cue.speaker, ...box, lines };
  }));
  const spec = { version: 1, status: page.page === 7 ? 'lettering-candidate-on-retained-strips' : 'awaiting-reviewed-action-overlays', page: page.page,
    width: 1024, height: 1536, contract: path.relative(directory, contractFile).replaceAll('\\', '/'), outputDirectory: '.',
    images: contract.pageGeometry.bandRectsPx.map((rect, index) => ({ file: path.relative(directory, path.join(ROOT, `art-masters/motion-comics/blue-purple/page-${id}/band-${String(index + 1).padStart(2, '0')}-v1.png`)).replaceAll('\\', '/'), rect })),
    gutters: page.panels.length === 4 ? [[506, page.page === 5 ? 520 : 12, 12, 496]] : [], balloons };
  const target = path.join(directory, 'assembly-spec-v1.json');
  fs.writeFileSync(target, JSON.stringify(spec, null, 2), { flag: 'wx' });
  console.info(target);
}
