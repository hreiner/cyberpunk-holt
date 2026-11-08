/* Bounded local exports. The exact manifests must be approved before this command. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { ROOT, localFile, inside } = require('../../project.cjs');
const { readDocument } = require('../../sequence.cjs');
const planFile = localFile(path.resolve(process.argv[2] ?? ''), ROOT);
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
if (plan.approvedForExport !== true) throw Error('Plan non approuvé pour les exports longs.');
const base = path.dirname(planFile);
const jobs = plan.jobs.map(job => ({ manifest: localFile(path.resolve(base, job.manifest), ROOT), output: path.resolve(base, job.output) }));
for (const job of jobs) {
  if (!inside(ROOT, job.output) || fs.existsSync(job.output)) throw Error(`Sortie déjà présente ou hors dépôt : ${job.output}`);
  readDocument(job.manifest);
}
const concurrency = Math.max(1, Math.min(2, Number(plan.concurrency ?? 1)));
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    console.info(`Export : ${path.relative(ROOT, job.output)}`);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.resolve(__dirname, '../../render.cjs'), job.manifest, job.output, '--fps', '24'], { cwd: ROOT, stdio: 'inherit' });
      child.once('error', reject);
      child.once('exit', code => code === 0 ? resolve() : reject(Error(`Export terminé avec le code ${code} : ${job.output}`)));
    });
  }
}
Promise.all(Array.from({ length: concurrency }, () => worker())).catch(error => { console.error(error); process.exitCode = 1; });
