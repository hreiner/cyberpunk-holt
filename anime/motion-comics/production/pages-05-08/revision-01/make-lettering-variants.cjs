/* Keep balloon bodies and text immutable; only authored tails follow the drawn poses. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT, localFile } = require('../../../project.cjs');
const file = localFile(path.resolve(process.argv[2] ?? ''), ROOT);
const spec = JSON.parse(fs.readFileSync(file, 'utf8')), directory = path.dirname(file);
const sourceFile = localFile(path.resolve(directory, spec.source), ROOT);
const source = fs.readFileSync(sourceFile, 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const result = [];
for (const variant of spec.variants) {
  let svg = source;
  for (const [cue, points] of Object.entries(variant.tails)) {
    const marker = `data-cue="${cue}">`, start = svg.indexOf(marker);
    if (start < 0) throw Error(`Bulle introuvable : ${cue}`);
    const from = start + marker.length, end = svg.indexOf('</g>', from), body = svg.slice(from, end);
    if (!body.startsWith('<polygon ')) throw Error(`Queue absente : ${cue}`);
    const modified = body.replace(/points="[^"]*"/, `points="${points.map(point => point.join(',')).join(' ')}"`);
    svg = svg.slice(0, from) + modified + svg.slice(end);
  }
  const destination = path.resolve(directory, variant.file);
  if (path.dirname(destination) !== directory) throw Error('Une variante doit rester dans le dossier du lettrage.');
  fs.writeFileSync(destination, svg, { flag: 'wx' });
  result.push({ file: variant.file, sha256: hash(svg), tails: variant.tails });
}
fs.writeFileSync(path.join(directory, spec.report), JSON.stringify({ source: spec.source, sourceSha256: hash(source), geometryAndTextsUnchanged: true, variants: result }, null, 2), { flag: 'wx' });
console.info(JSON.stringify(result));
