/* global __filename */
// Relier le mix effectivement calculé au gel documentaire final sans modifier les WAV ni leur rapport d'origine.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT } = require('./mix-engine.cjs');
const master = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01');
const folder = path.join(master, 'soundtrack-v3');
const before = path.join(master, 'timing-r1-v4.json'), final = path.join(master, 'timing-r1-v5.json');
const original = JSON.parse(fs.readFileSync(before)), current = JSON.parse(fs.readFileSync(final));
const originalContract = original.contractSha256, finalContract = current.contractSha256;
for (const key of ['revision', 'contractSha256']) { delete original[key]; delete current[key]; }
assert.deepEqual(original, current, 'Temps ou médias modifiés : un nouveau mix serait nécessaire.');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const rel = file => path.relative(ROOT, file).replaceAll('\\', '/');
const reportFile = path.join(folder, 'report.json');
const report = JSON.parse(fs.readFileSync(reportFile));
for (const row of report.files) assert.equal(hash(fs.readFileSync(path.join(ROOT, row.audio))), row.sha256);
const record = { schemaVersion: 1, date: '2026-11-05', status: 'final-provenance-confirmed',
  originalMixReport: rel(reportFile), originalMixReportSha256: hash(fs.readFileSync(reportFile)),
  calculatedWithTiming: rel(before), calculatedTimingSha256: hash(fs.readFileSync(before)), calculatedContractSha256: originalContract,
  finalTiming: rel(final), finalTimingSha256: hash(fs.readFileSync(final)), finalContractSha256: finalContract,
  comparison: 'Tous champs identiques après exclusion de revision et contractSha256 : pages, segments, tracks, events, pageData, durées, audioFile et médias inclus.',
  sameTiming: true, sameVoiceFiles: true, sameSfxAnchors: true, backingUnchanged: true,
  regeneratedAudio: false, duration: current.duration, fullDuration: current.fullDuration,
  auditScriptSha256: hash(fs.readFileSync(__filename)), humanListening: 'not-performed' };
fs.copyFileSync(final, path.join(folder, 'timing-final-v5.json'), fs.constants.COPYFILE_EXCL);
fs.copyFileSync(__filename, path.join(folder, 'final-provenance.cjs'), fs.constants.COPYFILE_EXCL);
fs.writeFileSync(path.join(folder, 'final-provenance.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(record));
