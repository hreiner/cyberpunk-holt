/* Read native sources; write only a fresh independent QA report. No export. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { ROOT, DOC, EXPECTED, read, hashFile, relative, outputDirectory, saveReport } = require('./common.cjs');

const out = outputDirectory(process.argv[2]);
const report = { status: 'running', startedAt: new Date().toISOString(), source: EXPECTED.source, files: [], failures: [] };
try {
  const selection = read(path.resolve(ROOT, DOC, 'motion-03/SELECTION.json'));
  assert.equal(selection.selectedSha256, EXPECTED.sha256);
  assert.equal(selection.files.length, EXPECTED.dependencies);
  const records = [{ file: EXPECTED.source, sha256: EXPECTED.sha256 }, ...selection.files];
  for (const item of records) {
    const file = path.resolve(ROOT, item.file);
    const sha256 = hashFile(file);
    report.files.push({ file: item.file, sha256, expected: item.sha256, bytes: fs.statSync(file).size });
    if (sha256 !== item.sha256) report.failures.push(item.file);
  }
  const baseline = read(path.resolve(ROOT, DOC, 'publish-01/runtime/BASELINE-1.3.0.json'));
  report.baseline = baseline.files.map(item => {
    const file = path.resolve(ROOT, item.copy);
    const sha256 = hashFile(file);
    if (sha256 !== item.sha256) report.failures.push(relative(file));
    return { file: relative(file), sha256, expected: item.sha256 };
  });
  assert.deepEqual(report.failures, [], 'Les sources gelées doivent rester exactes.');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = error.stack;
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  saveReport(out, report);
  console.log(JSON.stringify({ status: report.status, sourceAndDependencies: report.files.length, failures: report.failures, report: relative(path.join(out, 'report.json')) }));
}
