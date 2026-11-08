/* Autonomous v5 source bundle: three new films, three unchanged page videos, no raw frame caches. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT, localFile, inside } = require('../../../project.cjs');
const { readDocument } = require('../../../sequence.cjs');
const { read, hash, relative: rootRelative, engine } = require('./reuse-common.cjs');
const revision = Number(process.argv[2] ?? 1), final = process.argv.includes('--final');
if (!Number.isInteger(revision) || revision < 1) throw Error('Révision positive requise.');
const production = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08');
const previous = path.join(production, 'revision-02'), base = path.join(production, 'revision-03');
const docs = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08');
const relative = file => path.relative(base, file).replaceAll('\\', '/');
const files = new Map(), dynamic = new Map();
const forbidden = file => /\.zip$/i.test(file) || file.split(path.sep).some(part => ['frames', 'node_modules', '__pycache__'].includes(part));
function addFile(input, category, expected) {
  const file = localFile(path.resolve(ROOT, input), ROOT);
  if (forbidden(file)) throw Error(`Inclusion interdite : ${file}`);
  const sha256 = hash(file); if (expected && sha256 !== expected) throw Error(`Source réemployée modifiée : ${file}`);
  if (!files.has(file)) files.set(file, { file: rootRelative(file), sha256, category });
  return file;
}
function walk(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink() || ['frames', 'node_modules', '__pycache__'].includes(entry.name)) return [];
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? walk(file) : /\.zip$/i.test(file) ? [] : [file];
  });
}
function addTree(folder, category) { for (const file of walk(folder)) addFile(file, category); }
function addDynamic(input, category, directory = false) {
  const file = path.resolve(ROOT, input);
  if (!inside(ROOT, file) || forbidden(file)) throw Error('Chemin dynamique invalide.');
  if (final && !fs.existsSync(file)) throw Error(`Preuve finale absente : ${file}`);
  if (directory && fs.existsSync(file) && fs.readdirSync(file, { recursive: true }).some(name => /\.zip$/i.test(name))) throw Error(`ZIP dans dossier dynamique : ${file}`);
  dynamic.set(file, { file: rootRelative(file), category, directory });
}

const inherited = read(path.join(previous, 'backup-plan-v2.json'));
for (const entry of inherited.frozenFiles) {
  if (entry.category === 'frozen-engine') continue;
  // Historical art/voices/selections/prompts stay exact; current code and global context are rehashed.
  const immutable = entry.file.startsWith('art-masters/') || entry.file.startsWith('anime/motion-comics/projects/') || entry.file.includes('/prompts/');
  addFile(entry.file, `inherited-${entry.category}`, immutable ? entry.sha256 : undefined);
}
const references = structuredClone(inherited.exactImagegenReferences);
for (const entry of references) for (const reference of entry.references) addFile(reference.file, 'exact-inherited-imagegen-reference', reference.sha256);
const journalFile = path.join(base, 'art/imagegen-request-v1.json'), journal = read(journalFile);
addTree(path.join(base, 'art'), 'corrected-recoil-native-source-svg-and-journal');
const exact = journal.references.map(reference => ({ file: rootRelative(addFile(reference.file, 'new-imagegen-exact-reference', reference.sha256)), sha256: reference.sha256 }));
addFile(journal.output, 'new-imagegen-native-output', journal.outputSha256);
references.push({ journal: rootRelative(journalFile), references: exact, promptEmbedded: true,
  promptSha256: crypto.createHash('sha256').update(journal.prompt).digest('hex'), nativeOutput: journal.output,
  nativeSha256: journal.outputSha256, externalProviderOutput: journal.nativeOutput, archivedNativeCopyPreservesExternalSha256: true });
const composite = read(path.join(base, 'art/composite-v1-report.json'));
addFile(composite.source, 'exact-recoil-source', composite.sourceSha256);
addFile(composite.generated, 'exact-generated-repair', composite.generatedSha256);
addFile(composite.output, 'selected-corrected-recoil', composite.sha256);
addFile(composite.svg, 'selected-composite-svg', composite.svgSha256);

const projects = path.join(ROOT, 'anime/motion-comics/projects');
for (const name of ['blue-purple-page05-v5.json', 'blue-purple-page05-with-music-v5.json', 'blue-purple-pages05-08-v5.json', 'blue-purple-pages01-08-v5.json']) {
  const file = path.join(projects, name), document = readDocument(file); addFile(file, 'selected-v5-manifest');
  for (const dependency of document.files) addFile(dependency, 'selected-v5-dependency');
  for (const page of document.pages) for (const cue of page.data.panels.flatMap(panel => panel.cues ?? [])) if (cue.takeJournal) addFile(path.resolve(path.dirname(page.manifestFile), cue.takeJournal), 'selected-voice-journal');
}
for (const entry of engine()) addFile(entry.file, 'frozen-engine', entry.sha256);
const motionRoot = path.join(ROOT, 'anime/motion-comics');
for (const entry of fs.readdirSync(motionRoot)) if (/^(?:.*\.cjs|README\.md)$/.test(entry)) addFile(path.join(motionRoot, entry), 'runtime-and-validation-tool');
for (const folder of ['production', 'tests', 'templates', 'assets', 'prototypes']) addTree(path.join(motionRoot, folder), 'all-production-test-prototype-and-font-sources');
for (const entry of fs.readdirSync(path.join(ROOT, '.agents/skills'), { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name.startsWith('holt-')) addTree(path.join(ROOT, '.agents/skills', entry.name), 'canonical-holt-skills-including-agent-metadata');
}
for (const file of ['package.json', 'package-lock.json', 'AGENTS.md']) addFile(file, 'root-runtime-dependencies');
addFile(path.join(base, 'selection-v1.json'), 'selected-source-provenance');
for (const name of ['export-plan-v1.json', 'export-plan-phase1-v1.json', 'export-plan-phase2-v1.json', 'plan-attempts-v1.json']) addFile(path.join(base, name), 'export-plan-and-initial-config-attempt');
addDynamic(path.join(base, 'export-check-v1.json'), 'final-export-summary');
addDynamic(path.join(base, 'mix-check-v1.json'), 'final-float-mix-and-identical-aac-proof');
addDynamic(path.join(base, 'snapshot-audit-v1.json'), 'semantic-snapshot-audit');
addDynamic(path.join(base, 'qa'), 'all-r03-canvas-h264-preservation-and-independent-art-proofs', true);
addDynamic(path.join(base, 'prototype-review-v1'), 'corrected-prototype-proof-and-mp4', true);
for (const name of ['pages-01-08', 'pages-05-08', 'page-05']) addDynamic(path.join(base, 'exports', name, 'render-v1'), 'one-of-three-new-mp4-snapshots-and-frame-origin-journals', true);
for (const name of ['page-06', 'page-07', 'page-08']) addDynamic(path.join(previous, 'exports', name, 'render-v1'), 'one-of-three-unchanged-page-mp4-snapshots', true);
for (const name of ['revision-01', 'revision-02', 'revision-03']) addDynamic(path.join(docs, name), 'production-documents-and-exact-prompts', true);
addDynamic(path.join(ROOT, 'docs/anime/motion-comics'), 'current-motion-comic-recipes-and-session-handoff', true);
for (const file of ['docs/INDEX.md', 'docs/WORKFLOWS.md', 'docs/anime/MOTION-COMICS-TECHNICAL.md', 'docs/anime/MOTION-COMICS-EFFECTS.md',
  'docs/design/MOTION-COMICS-READER.md', 'docs/process/adr/0050-immersive-reader-and-stable-export.md', 'docs/process/reviews/2026-11-07-reader-ui.md']) addDynamic(file, 'final-global-document');
for (const file of ['docs/design/FRONTEND-DESIGN.md', 'docs/process/reviews/2026-11-07-motion-design-skills.md']) addDynamic(file, 'retained-design-and-animation-reference');

const target = path.join(base, `backup-plan-v${revision}.json`);
const plan = { schemaVersion: 1, selectedVersion: 5, stage: final ? 'final-docs-and-audits-required' : 'proposed-before-doc-freeze', output: 'delivery-backup-v1.zip',
  include: [...files.keys(), ...dynamic.keys(), target].map(relative), frozenFiles: [...files.values()], dynamicEntries: [...dynamic.values()],
  exactImagegenReferences: references, imagegenAttemptCount: references.length, retainedIndividualPages: [6, 7, 8], newIndividualPages: [5],
  excludes: ['all frames directories', 'node_modules', '__pycache__', 'all ZIP files', 'all old exports except unchanged pages6–8'],
  runtime: 'npm ci from included root package/lock, Node and Edge or HOLT_BROWSER; exact FFmpeg is inherited. Normal render.cjs can rebuild selected snapshots without historical PNG caches. Selective-copy optimization requires original caches, intentionally excluded.',
  note: 'Root launches backup.py only after final documentation freeze and inclusion audit. Each archived member must pass CRC and BACKUP-MANIFEST SHA verification. The new three films, three retained individual films and corrected prototype are the only MP4 output directories.' };
fs.writeFileSync(target, JSON.stringify(plan, null, 2), { flag: 'wx' });
console.info(JSON.stringify({ target, fixedFiles: files.size, dynamicEntries: dynamic.size, imagegenJournals: references.length, engineFiles: engine().length, stage: plan.stage }));
