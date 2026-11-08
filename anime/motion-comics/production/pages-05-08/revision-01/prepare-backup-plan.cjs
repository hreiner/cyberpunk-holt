/* Explicit standalone production backup: final selections, dependency media and exact paid-call inputs. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT, localFile, inside } = require('../../../project.cjs');
const { readDocument } = require('../../../sequence.cjs');
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01');
const docs = path.join(ROOT, 'docs/comics/blue-purple-motion/production/pages-05-08/revision-01');
const revision = Number(process.argv[2] ?? 1);
if (!Number.isInteger(revision) || revision < 1) throw Error('Révision positive requise.');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(base, file).replaceAll('\\', '/');
const rootRelative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const included = new Map(), directories = new Map();
const addFile = (input, category, expected) => {
  const file = localFile(path.resolve(ROOT, input), ROOT);
  if (/\.zip$/i.test(file) || file.split(path.sep).some(part => ['frames', 'node_modules', '__pycache__'].includes(part))) throw Error('Fichier interdit dans la sauvegarde.');
  const sha256 = hash(file); if (expected && expected !== sha256) throw Error(`Empreinte source différente : ${file}`);
  if (!included.has(file)) included.set(file, { file: rootRelative(file), sha256, category });
  return file;
};
const walk = folder => fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
  if (entry.isSymbolicLink() || ['frames', 'node_modules', '__pycache__'].includes(entry.name)) return [];
  const file = path.join(folder, entry.name);
  return entry.isDirectory() ? walk(file) : /\.zip$/i.test(entry.name) ? [] : [file];
});
const addTree = (folder, category) => { for (const file of walk(folder)) addFile(file, category); };
const addDirectory = (folder, category) => { const target = path.resolve(folder); if (!inside(ROOT, target)) throw Error('Dossier hors dépôt.'); directories.set(target, category); };

const projects = path.join(ROOT, 'anime/motion-comics/projects');
const selections = ['blue-purple-pages01-08-v3.json', 'blue-purple-pages05-08-v3.json', ...[5, 6, 7, 8].flatMap(number => [`blue-purple-page0${number}-v3.json`, `blue-purple-page0${number}-with-music-v3.json`])];
for (const name of selections) {
  const source = path.join(projects, name), document = readDocument(source);
  addFile(source, 'selected-v3-manifest'); for (const file of document.files) addFile(file, 'selected-runtime-dependency');
  for (const page of document.pages) for (const cue of page.data.panels.flatMap(panel => panel.cues ?? [])) if (cue.takeJournal) addFile(path.resolve(path.dirname(page.manifestFile), cue.takeJournal), 'selected-voice-journal');
}
const baselineFile = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-01-08/baseline-pages01-04.json');
const baseline = read(baselineFile); addFile(baselineFile, 'historical-baseline');
for (const item of baseline.files) addFile(item.file, 'historical-original', item.sha256);

for (const number of [5, 6, 7, 8]) {
  const directory = path.join(base, `page-0${number}`), specFile = path.join(directory, 'assembly-spec-v1.json'), spec = read(specFile);
  addFile(specFile, 'final-assembly-spec');
  for (const image of spec.images) addFile(path.resolve(directory, image.file), 'assembly-source-image');
  for (const name of [`page-v${spec.version}.png`, `page-raw-v${spec.version}.png`, `page-source-v${spec.version}.svg`, `lettering-v${spec.version}.svg`, `lettering-v${spec.version}.json`, `assembly-report-v${spec.version}.json`]) addFile(path.join(directory, name), 'final-page-source');
}
for (const name of ['lettering-seuil-v1.svg', 'lettering-franchissement-v1.svg', 'lettering-variants-v1.json', 'lettering-variants-spec-v1.json']) addFile(path.join(base, 'page-06', name), 'pose-lettering-source');
// The shadow master was produced from these exact earlier sources, not from a new paid image.
const shadowReport = read(path.join(base, 'page-08/assembly-report-v3.json'));
addFile(shadowReport.source, 'shadow-master-input', shadowReport.sourceSha256); addFile(shadowReport.plan, 'shadow-master-input', shadowReport.planSha256);
for (const item of shadowReport.inputs) addFile(item.file, 'shadow-master-input', item.sha256);
for (const name of ['assembly-spec-before-contact-shadow-v2.json', 'page-source-v2.svg', 'lettering-v2.json', 'assembly-report-v2.json']) addFile(path.join(base, 'page-08', name), 'shadow-master-input');

const art = path.join(base, 'art'), journals = walk(art).filter(file => path.basename(file) === 'journal.json');
if (journals.length !== 11) throw Error('Les onze journaux ImageGen de cette révision sont requis.');
addTree(art, 'imagegen-assets-journals-references');
const referenceAudit = [];
for (const file of journals) {
  const journal = read(file); addFile(journal.prompt.path, 'imagegen-exact-prompt', journal.prompt.sha256); addFile(journal.referencesFile.path, 'imagegen-exact-reference-list', journal.referencesFile.sha256);
  const references = journal.references.map(reference => ({ file: rootRelative(addFile(reference.path, 'imagegen-exact-reference', reference.sha256)), sha256: reference.sha256 }));
  addFile(journal.output.path, 'imagegen-native-output', journal.output.sha256);
  if (journal.output.sourceSha256 !== journal.output.sha256) throw Error('Copie native ImageGen différente de sa source.');
  referenceAudit.push({ journal: rootRelative(file), references, nativeOutput: journal.output.relativePath, nativeSha256: journal.output.sha256,
    externalProviderOutput: journal.output.sourcePath, archivedNativeCopyPreservesExternalSha256: true });
}
const voice = read(path.join(base, 'audio-v1/prepared-measurements.json'));
for (const cue of voice.cues) { addFile(cue.audio, 'selected-voice', cue.sha256); addFile(cue.takeJournal, 'voice-provider-journal', cue.journalSha256); }
for (const name of ['takes', 'sfx-takes', 'sfx-prepared-v3', 'foley-local-v1']) addTree(path.join(base, 'audio-v1', name), 'audio-source-or-selected-foley');
for (const name of ['raw-measurements.json', 'prepared-measurements.json', 'sfx-measurements-v3.json']) addFile(path.join(base, 'audio-v1', name), 'selected-audio-measurements');
const soundtrack = read(path.join(base, 'soundtrack-v3/report.json'));
for (const input of soundtrack.inputs) addFile(input.file ?? input.audio ?? input.path, 'soundtrack-source', input.sha256);
addTree(path.join(base, 'soundtrack-v3'), 'final-soundtrack-and-provenance');
for (const name of ['timing-r1-v4.json', 'timing-r1-v5.json', 'export-plan-v2.json']) addFile(path.join(base, name), 'selected-timing-export-plan');
for (const name of ['code-checks-v1.json', 'delivery-audit-v2.json', 'snapshot-audit-v1.json', 'export-check-v1.json', 'mix-check-v1.json', 'reader-health-v1.json']) addFile(path.join(base, name), 'final-independent-audit');
addTree(path.join(base, 'candidates-stage2-v1'), 'final-selection-candidate-source');

const engine = ['reader.html', 'core.js', 'effects.js', 'layers.js', 'sequence.js', 'render.cjs', 'project.cjs', 'sequence.cjs', 'package.json'];
for (const name of engine) addFile(path.join(ROOT, 'anime/motion-comics', name), 'frozen-engine');
for (const name of ['cli.cjs', 'README.md', 'check-effects.cjs', 'check-live-effects.cjs', 'check-sequence.cjs', 'check-panel-animation.cjs', 'check-motion-layers.cjs', 'check-event-effects.cjs']) addFile(path.join(ROOT, 'anime/motion-comics', name), 'runtime-or-validation-tool');
for (const folder of ['production', 'tests', 'templates']) addTree(path.join(ROOT, 'anime/motion-comics', folder), 'reproduction-tools');
for (const name of ['package.json', 'package-lock.json', 'AGENTS.md', 'docs/INDEX.md', 'docs/WORKFLOWS.md', 'docs/anime/MOTION-COMICS-TECHNICAL.md', 'docs/anime/MOTION-COMICS-WORKFLOW.md', 'docs/anime/MOTION-COMICS-EFFECTS.md', 'docs/anime/MOTION-COMICS-VOICE-DIRECTION.md', 'docs/anime/SCREENPLAY.md', 'docs/chapters/ch3/SCENARIO.md']) addFile(name, 'dependencies-or-project-context');
addFile('art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe', 'replay-ffmpeg-binary');
// Future final reports/docs are included at ZIP time, after all six exports and root's documentation freeze.
addDirectory(docs, 'final-production-documents');
for (const name of ['pages-01-08', 'pages-05-08', 'page-05', 'page-06', 'page-07', 'page-08']) addDirectory(path.join(base, 'exports', name, 'render-v2'), 'one-of-six-final-snapshots-and-mp4');
for (const entry of fs.readdirSync(path.join(base, 'qa'), { withFileTypes: true })) if (entry.isDirectory() && /^(?:selected-v3-|p08-shadow-1280-v1$|encoded-stills-v2$|sequence-final-v2$)/.test(entry.name)) addTree(path.join(base, 'qa', entry.name), 'final-validation-evidence');
addTree(path.join(base, 'legacy-render-qa-v3'), 'final-legacy-regression-evidence');
addFile(path.join(base, 'editor-smoke-v1/reader-qa-v5/report.json'), 'http-range-and-reader-integration-evidence');
for (const name of ['pages-01-08', 'pages-05-08']) addFile(path.join(base, 'exports', name, 'render-v1/report.json'), 'aborted-attempt-journal-only');
const plan = { schemaVersion: 1, selectedVersion: 3, output: 'delivery-backup-v1.zip', excludes: ['frames', 'node_modules', '__pycache__', 'all ZIP files', 'all exports except the six render-v2 snapshots'],
  include: [...included.keys(), ...directories.keys()].map(relative),
  frozenFiles: [...included.values()], imagegenAttemptCount: journals.length, exactImagegenReferences: referenceAudit,
  dynamicDirectories: [...directories].map(([file, category]) => ({ file: rootRelative(file), category })),
  runtime: 'Node/npm + npm ci from root package/lock; Edge installed or HOLT_BROWSER; exact FFmpeg binary included. MP4 files play without this runtime.',
  note: 'Run backup.py only after all exports, audits and final documentation freeze. It omits frames and verifies every archived SHA-256 plus CRC.' };
const target = path.join(base, `backup-plan-v${revision}.json`);
plan.include.push(relative(target)); fs.writeFileSync(target, JSON.stringify(plan, null, 2), { flag: 'wx' });
console.info(JSON.stringify({ target, explicitFiles: included.size, finalDynamicDirectories: directories.size, imagegenJournals: journals.length, engineFiles: engine.length }));
