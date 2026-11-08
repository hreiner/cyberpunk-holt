/* Connect previously measured, frozen media to the final publication graph. */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, relative, hash } = require('./stream-metrics.cjs');
const { readDocument } = require(path.join(ROOT, 'anime/motion-comics/sequence.cjs'));
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
if (!args.includes('--packager-go')) throw Error('Le GO du paquet complet est requis.');
const folder = path.resolve(ROOT, option('--audit', 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/audio/audit-v1'));
const allowed = path.relative(path.join(ROOT, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/audio'), folder);
if (path.isAbsolute(allowed) || allowed === '' || allowed.startsWith('..')) throw Error('Dossier d’audit hors du domaine audio de publication.');
const output = path.join(folder, 'FINAL.json');
if (fs.existsSync(output)) throw Error('Audit final existant conservé.');
const evidenceFile = path.join(folder, 'REPORT.json');
const evidence = JSON.parse(fs.readFileSync(evidenceFile));
const assessmentFile = path.join(folder, 'ASSESSMENT.json');
const assessment = fs.existsSync(assessmentFile) ? JSON.parse(fs.readFileSync(assessmentFile)) : null;
if (assessment && assessment.auditSha256 !== hash(evidenceFile)) throw Error('Évaluation liée à un autre rapport.');
if (!['passed', 'audio-passed-awaiting-final-chapter'].includes(assessment?.status ?? evidence.status)) throw Error('Mesures audio absentes ou en échec.');
const packageRoot = path.resolve(ROOT, option('--package', 'public/comics/blue-purple/v10'));
const publicationFile = path.join(packageRoot, 'PUBLICATION.json'), publication = JSON.parse(fs.readFileSync(publicationFile));
const sourceFile = path.join(ROOT, evidence.source), chapterFile = path.join(packageRoot, publication.chapter);
if (hash(sourceFile) !== evidence.sourceSha256) throw Error('Source native changée depuis la mesure.');
const original = readDocument(sourceFile), published = readDocument(chapterFile);
const checks = {}, failures = [];
function check(id, condition) { checks[id] = Boolean(condition); if (!condition) failures.push(id); }
const tracks = document => document.timeline.tracks.map(({ audio: _audio, audioFile: _file, ...track }) => track);
const cues = document => document.pages.flatMap(page => page.data.panels.flatMap(panel => (panel.cues ?? []).map(cue => ({
  page: page.id, panel: panel.id, id: cue.id, speaker: cue.speaker ?? '', duration: cue.duration, textFr: cue.textFr, textEn: cue.textEn,
}))));
check('samePages', JSON.stringify(original.timeline.pages) === JSON.stringify(published.timeline.pages));
check('sameSegments', JSON.stringify(original.timeline.segments) === JSON.stringify(published.timeline.segments));
check('same99VoiceTimes', JSON.stringify(tracks(original)) === JSON.stringify(tracks(published)) && published.timeline.tracks.length === 99);
check('sameCueTextsAndDurations', JSON.stringify(cues(original)) === JSON.stringify(cues(published)));
check('duration584Point3', Math.abs(published.timeline.duration - 584.3) < 1e-7);
check('samePremixedUnity', published.data.music.preMixed === true && published.data.music.gain === 1);
const mediaByTarget = new Map(evidence.media.map(row => [row.target, row]));
const connections = [];
function connect(source, target, kind, cueIndex) {
  const publicPath = path.relative(packageRoot, target).replaceAll('\\', '/'), measurement = mediaByTarget.get(publicPath);
  const sourceSha256 = hash(source), targetSha256 = hash(target);
  const mapping = publication.mappings.find(row => row.path === publicPath && row.sourceSha256 === sourceSha256 && row.sha256 === targetSha256);
  const valid = measurement && mapping && measurement.sourceSha256 === sourceSha256 && measurement.targetSha256 === targetSha256;
  check(`${kind}-${cueIndex ?? 'full'}-same-measured-media`, valid);
  connections.push({ kind, cueIndex, path: publicPath, sourceSha256, targetSha256, valid: Boolean(valid) });
}
original.timeline.tracks.forEach((track, index) => connect(track.audioFile, published.timeline.tracks[index].audioFile, 'voice', index));
connect(original.musicFile, published.musicFile, 'backing');
const result = { schemaVersion: 1, date: new Date().toISOString(), status: failures.length ? 'failed' : 'passed',
  audit: relative(evidenceFile), auditSha256: hash(evidenceFile), chapter: relative(chapterFile), chapterSha256: hash(chapterFile),
  assessment: assessment ? relative(assessmentFile) : null, assessmentSha256: assessment ? hash(assessmentFile) : null,
  publication: relative(publicationFile), publicationSha256: hash(publicationFile), script: relative(__filename), scriptSha256: hash(__filename),
  duration: published.timeline.duration, voices: published.timeline.tracks.length, pages: published.pages.length,
  checks, connections, failures, mediaMeasurementsInheritedByExactSha: true,
  limitations: evidence.scope.limitations, humanListening: 'not-performed', newProviderCalls: 0 };
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, checks: Object.keys(checks).length, failures, output: relative(output) }));
if (failures.length) process.exitCode = 1;
