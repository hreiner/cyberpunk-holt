/* Standalone selected-v4 backup, exact reused sources plus targeted revision inputs. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT, localFile, inside } = require('../../../project.cjs');
const { readDocument } = require('../../../sequence.cjs');
const revision = Number(process.argv[2] ?? 1), final = process.argv.includes('--final');
if (!Number.isInteger(revision) || revision < 1) throw Error('Révision positive requise.');
const master = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08');
const previous = path.join(master, 'revision-01'), base = path.join(master, 'revision-02');
const docs = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rootRelative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const relative = file => path.relative(base, file).replaceAll('\\', '/');
const files = new Map(), dynamic = new Map();
const forbidden = file => /\.zip$/i.test(file) || file.split(path.sep).some(part => ['frames', 'node_modules', '__pycache__'].includes(part));
function addFile(input, category, expected) {
  const file = localFile(path.resolve(ROOT, input), ROOT);
  if (forbidden(file)) throw Error(`Fichier exclu : ${file}`);
  const sha256 = hash(file); if (expected && expected !== sha256) throw Error(`Source archivée modifiée : ${file}`);
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
  if (directory && fs.existsSync(file)) {
    const zipFiles = fs.readdirSync(file, { recursive: true }).filter(name => /\.zip$/i.test(name));
    if (zipFiles.length) throw Error(`ZIP présent dans dossier dynamique : ${file}`);
  }
  dynamic.set(file, { file: rootRelative(file), category, directory });
}

// Retain only immutable source material from the previous archive, never its MP4 exports.
const inherited = read(path.join(previous, 'backup-plan-v2.json'));
const inheritedCategories = new Set(['assembly-source-image', 'audio-source-or-selected-foley', 'final-assembly-spec', 'final-page-source',
  'final-selection-candidate-source', 'final-soundtrack-and-provenance', 'historical-baseline', 'historical-original',
  'imagegen-assets-journals-references', 'imagegen-exact-prompt', 'imagegen-exact-reference', 'imagegen-exact-reference-list',
  'pose-lettering-source', 'selected-audio-measurements', 'selected-runtime-dependency', 'selected-timing-export-plan',
  'selected-v3-manifest', 'selected-voice-journal', 'shadow-master-input', 'soundtrack-source', 'replay-ffmpeg-binary']);
for (const entry of inherited.frozenFiles) if (inheritedCategories.has(entry.category)) addFile(entry.file, `retained-${entry.category}`, entry.sha256);
const references = structuredClone(inherited.exactImagegenReferences);

const projects = path.join(ROOT, 'anime/motion-comics/projects');
const names = ['blue-purple-pages01-08-v4.json', 'blue-purple-pages05-08-v4.json', ...[5, 6, 7, 8].flatMap(number => [`blue-purple-page0${number}-v4.json`, `blue-purple-page0${number}-with-music-v4.json`])];
for (const name of names) {
  const file = path.join(projects, name), document = readDocument(file);
  addFile(file, 'selected-v4-manifest');
  for (const dependency of document.files) addFile(dependency, 'selected-v4-dependency');
  for (const page of document.pages) for (const cue of page.data.panels.flatMap(panel => panel.cues ?? [])) if (cue.takeJournal) addFile(path.resolve(path.dirname(page.manifestFile), cue.takeJournal), 'selected-voice-journal');
}
for (const baselineFile of [path.join(base, 'baseline-v3.json'), path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json')]) {
  addFile(baselineFile, 'preservation-baseline');
  for (const entry of read(baselineFile).files) addFile(entry.file, 'preserved-source', entry.sha256);
}
addTree(path.join(base, 'art'), 'revision02-art-and-composite-provenance');
const journals = walk(path.join(base, 'art')).filter(file => path.basename(file) === 'journal.json');
if (journals.length !== 1) throw Error('Une seule requête ImageGen révision02 attendue.');
for (const file of journals) {
  const journal = read(file);
  addFile(journal.prompt.path, 'imagegen-exact-prompt', journal.prompt.sha256);
  addFile(journal.referencesFile.path, 'imagegen-exact-reference-list', journal.referencesFile.sha256);
  const exact = journal.references.map(reference => ({ file: rootRelative(addFile(reference.path, 'imagegen-exact-reference', reference.sha256)), sha256: reference.sha256 }));
  addFile(journal.output.path, 'imagegen-native-output', journal.output.sha256);
  if (journal.output.sha256 !== journal.output.sourceSha256) throw Error('Natif fournisseur altéré.');
  references.push({ journal: rootRelative(file), references: exact, nativeOutput: journal.output.relativePath, nativeSha256: journal.output.sha256,
    externalProviderOutput: journal.output.sourcePath, archivedNativeCopyPreservesExternalSha256: true });
}
addTree(path.join(base, 'candidates-v2'), 'final-candidate-source');
addTree(path.join(base, 'soundtrack-v1'), 'final-soundtrack-stems-and-accent-metrics');
for (const input of read(path.join(base, 'soundtrack-v1/report.json')).inputs) addFile(input.file ?? input.audio ?? input.path, 'soundtrack-exact-input', input.sha256);
addFile(path.join(base, 'timing-r2-v1.json'), 'final-timing');
addFile(path.join(base, 'export-plan-v1.json'), 'approved-export-plan');

const engine = ['reader.html', 'core.js', 'effects.js', 'layers.js', 'sequence.js', 'render.cjs', 'project.cjs', 'sequence.cjs', 'package.json'];
for (const name of engine) addFile(path.join(ROOT, 'anime/motion-comics', name), 'frozen-engine');
for (const entry of fs.readdirSync(path.join(ROOT, 'anime/motion-comics'))) if (/^(?:check-.*\.cjs|cli\.cjs|README\.md)$/.test(entry)) addFile(path.join(ROOT, 'anime/motion-comics', entry), 'validation-or-runtime-tool');
for (const folder of ['production', 'tests', 'templates']) addTree(path.join(ROOT, 'anime/motion-comics', folder), 'reproduction-tools');
for (const file of ['package.json', 'package-lock.json', 'AGENTS.md', 'docs/WORKFLOWS.md', 'docs/anime/MOTION-COMICS-WORKFLOW.md', 'docs/anime/MOTION-COMICS-EFFECTS.md', 'docs/anime/MOTION-COMICS-VOICE-DIRECTION.md', 'docs/anime/SCREENPLAY.md', 'docs/chapters/ch3/SCENARIO.md']) addFile(file, 'runtime-dependencies-and-context');
for (const file of ['docs/INDEX.md', 'docs/anime/MOTION-COMICS-TECHNICAL.md']) addDynamic(file, 'final-global-documents');
for (const file of ['code-checks-v1.json', 'delivery-audit-v1.json', 'snapshot-audit-v1.json', 'export-check-v1.json', 'mix-check-v1.json', 'reader-health-v1.json']) addDynamic(path.join(base, file), 'final-report');
addDynamic(path.join(docs, 'revision-01'), 'retained-production-documents', true);
addDynamic(path.join(docs, 'revision-02'), 'final-production-documents', true);
addDynamic(path.join(base, 'qa'), 'all-final-and-superseded-targeted-proofs', true);
addDynamic(path.join(base, 'legacy-render-qa-v1'), 'legacy-four-png-byte-proof', true);
for (const name of ['pages-01-08', 'pages-05-08', 'page-05', 'page-06', 'page-07', 'page-08']) addDynamic(path.join(base, 'exports', name, 'render-v1'), 'one-of-six-final-snapshots-and-mp4', true);

const target = path.join(base, `backup-plan-v${revision}.json`);
const plan = { schemaVersion: 1, selectedVersion: 4, stage: final ? 'final-docs-and-exports-required' : 'proposed-during-exports',
  output: 'delivery-backup-v1.zip', excludes: ['frames', 'node_modules', '__pycache__', 'all ZIP files', 'all exports except revision02 six render-v1'],
  include: [...files.keys(), ...dynamic.keys(), target].map(relative), frozenFiles: [...files.values()],
  imagegenAttemptCount: references.length, exactImagegenReferences: references, dynamicEntries: [...dynamic.values()],
  runtime: 'npm ci from root package/lock; Node and installed Edge or HOLT_BROWSER; exact FFmpeg binary included. Six MP4 files play directly.',
  note: 'Run only after root documentation freeze and six completed exports/audits. Source files are fixed by SHA; final docs/reports remain dynamic until ZIP. backup.py verifies archive CRC and every BACKUP-MANIFEST SHA.' };
fs.writeFileSync(target, JSON.stringify(plan, null, 2), { flag: 'wx' });
console.info(JSON.stringify({ target, explicitFiles: files.size, dynamicEntries: dynamic.size, imagegenJournals: references.length, engineFiles: engine.length, stage: plan.stage }));
