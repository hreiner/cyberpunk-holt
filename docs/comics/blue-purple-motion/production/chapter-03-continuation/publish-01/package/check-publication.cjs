/* Negative checks against an existing publication; never changes that publication. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const { verify } = require(path.join(root, 'anime/motion-comics/publish.cjs'));
const source = path.join(root, 'public/comics/blue-purple/v10');
const base = path.join(root, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/package/check-fixtures-v2');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name), dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(src, dst);
    else fs.linkSync(src, dst);
  }
}
function replace(file, bytes) { fs.unlinkSync(file); fs.writeFileSync(file, bytes, { flag: 'wx' }); }
const cases = {
  'changed-payload': folder => replace(path.join(folder, 'reader.css'), Buffer.from('changed')),
  'missing-file': folder => fs.unlinkSync(path.join(folder, 'assets/holt-text.woff2')),
  'unsafe-path': folder => {
    const file = path.join(folder, 'PUBLICATION.json'), data = JSON.parse(fs.readFileSync(file));
    data.files[0].path = '../escape'; replace(file, JSON.stringify(data));
  },
  'altered-timeline-with-updated-file-hash': folder => {
    const file = path.join(folder, 'pages/page-15.json'), page = JSON.parse(fs.readFileSync(file));
    page.overviewSeconds += 1; const bytes = Buffer.from(JSON.stringify(page)); replace(file, bytes);
    const invFile = path.join(folder, 'PUBLICATION.json'), inv = JSON.parse(fs.readFileSync(invFile));
    Object.assign(inv.files.find(item => item.path === 'pages/page-15.json'), { bytes: bytes.length, sha256: hash(bytes) });
    replace(invFile, JSON.stringify(inv));
  },
  'orphan-file': folder => fs.writeFileSync(path.join(folder, 'orphan.txt'), 'orphan', { flag: 'wx' }),
};
const report = { validBundle: verify(source), cases: [] };
for (const [name, mutate] of Object.entries(cases)) {
  const folder = path.join(base, name);
  if (fs.existsSync(folder)) throw Error(`Fixture exists; choose a new proof revision: ${folder}`);
  copyTree(source, folder); mutate(folder);
  let error;
  try { verify(folder); } catch (caught) { error = caught.message; }
  if (!error) throw Error(`Corruption accepted: ${name}`);
  report.cases.push({ name, rejected: true, error });
}
const output = path.join(root, 'docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/package/CHECK-TESTS.json');
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(report));
