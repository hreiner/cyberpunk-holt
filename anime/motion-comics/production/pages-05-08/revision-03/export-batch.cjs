/* Three approved fresh encodes, bounded to two simultaneous selective export jobs. */
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { ROOT, localFile, inside } = require('../../../project.cjs');
const { read, hash } = require('./reuse-common.cjs');
const planFile = localFile(path.resolve(process.argv[2] ?? ''), ROOT), plan = read(planFile);
if (plan.approvedForExport !== true) throw Error('Gel des sources et revue favorables requis avant exports.');
for (const entry of plan.frozenFiles ?? []) if (hash(localFile(path.resolve(ROOT, entry.file), ROOT)) !== entry.sha256) throw Error(`Source gelée modifiée : ${entry.file}`);
const base = path.dirname(planFile);
const jobs = plan.jobs.map(job => ({ ...job, manifest: localFile(path.resolve(base, job.manifest), ROOT),
  proof: localFile(path.resolve(base, job.proof), ROOT), output: path.resolve(base, job.output) }));
for (const job of jobs) {
  if (!inside(ROOT, job.output) || fs.existsSync(job.output)) throw Error('Nouveau dossier export requis.');
  if (hash(job.manifest) !== job.manifestSha256 || hash(job.proof) !== job.proofSha256) throw Error('Manifest ou preuve modifié depuis gel.');
}
const concurrency = Math.max(1, Math.min(2, Number(plan.concurrency ?? 2)));
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++]; console.info(`Export ciblé : ${path.relative(ROOT, job.output)}`);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(__dirname, 'reuse-export.cjs'), job.manifest, job.proof, job.output], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
      child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(Error(`Export interrompu code${code} : ${job.output}`)));
    });
  }
}
Promise.all(Array.from({ length: concurrency }, () => worker())).catch(error => { console.error(error); process.exitCode = 1; });
