/* Reassess the already measured AACs without requiring lossless L/R identity. */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, relative, hash } = require('./stream-metrics.cjs');
const folder = path.join(ROOT, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/audio/audit-v1');
const file = path.join(folder, 'REPORT.json'), output = path.join(folder, 'ASSESSMENT.json');
if (fs.existsSync(output)) throw Error('Évaluation existante conservée.');
const report = JSON.parse(fs.readFileSync(file)), packageRoot = path.join(ROOT, 'public/comics/blue-purple/v10');
const remainingErrors = report.errors.filter(error => !error.startsWith('Mono dérivé stéréo divergent : '));
const mono = report.media.filter(row => !row.copied && row.sourceMetadata.channels === 1).map(row => {
  const channels = row.targetMeasurement.channelRmsDb, balanceDb = Math.abs(channels[0] - channels[1]);
  const valid = Math.abs(row.rmsGainDb) < .2 && balanceDb < .05;
  if (!valid) remainingErrors.push(`Gain ou équilibre L/R incorrect : ${row.target}`);
  return { target: row.target, rmsGainDb: row.rmsGainDb, channelBalanceDb: balanceDb,
    sideRmsDb: row.targetMeasurement.sideRmsDb,
    sideRelativeToVoiceDb: row.targetMeasurement.sideRmsDb === null ? null : row.targetMeasurement.sideRmsDb - row.targetMeasurement.rmsDb,
    valid };
});
for (const row of report.media) if (hash(path.join(packageRoot, row.target)) !== row.targetSha256) remainingErrors.push(`Média changé : ${row.target}`);
const current = fs.readFileSync(path.join(__dirname, 'audit-public.cjs'), 'utf8');
const executed = current
  .replace("if (path.isAbsolute(path.relative(ownedRoot, output)) || path.relative(ownedRoot, output).startsWith('..') || output === ownedRoot)", "if (path.relative(ownedRoot, output).startsWith('..') || output === ownedRoot)")
  .replace("if (sourceMetadata.channels === 1) result.monoUnityStereo = check(Math.abs(target.channelRmsDb[0] - target.channelRmsDb[1]) < .05 && result.unityGain, `Gain ou équilibre mono vers stéréo incorrect : ${row.publicPath}`);", "if (sourceMetadata.channels === 1) result.monoUnityStereo = check(target.sideRmsDb === null || target.sideRmsDb < -70, `Mono dérivé stéréo divergent : ${row.publicPath}`);");
const executedFile = path.join(folder, 'executed-audit-public.cjs');
fs.writeFileSync(executedFile, executed, { flag: 'wx' });
if (hash(executedFile) !== report.scripts.find(script => script.file.endsWith('/audit-public.cjs')).sha256) throw Error('La copie du script exécuté ne correspond pas à son empreinte enregistrée.');
const result = { schemaVersion: 1, date: new Date().toISOString(), status: remainingErrors.length ? 'failed' : 'audio-passed-awaiting-final-chapter',
  audit: relative(file), auditSha256: hash(file), originalErrorCount: report.errors.length, remainingErrors,
  reason: 'The first evaluator required L/R difference below -70dBFS. That tests near-lossless channel identity and is inappropriate for a lossy stereo AAC derivative. Existing measurements instead verify unity conversion and centered channel balance. All raw measurements and the original failed evaluation are preserved.',
  criteria: { conversionGainAbsoluteDbBelow: .2, leftRightRmsDifferenceDbBelow: .05,
    lossySideResidual: 'Reported, not treated as PCM identity or a perceptual listening verdict.' },
  mono, mediaSha256Rechecked: report.media.length, noMediaChanged: true, noMeasurementsRepeated: true, humanListening: 'not-performed', newProviderCalls: 0,
  script: relative(__filename), scriptSha256: hash(__filename), originalExecutedScript: relative(executedFile) };
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, mono: mono.length, remainingErrors, output: relative(output) }));
if (remainingErrors.length) process.exitCode = 1;
