/* Proof only: restore the exact local release into a disposable clone, without HTTP. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const archive = path.resolve(root, process.argv[2] ?? 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/package/release-v1/blue-purple-v10-web.tar.gz');
const output = path.resolve(root, process.argv[3] ?? 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/restore/local-v1');
const tar = process.argv[4] ?? (process.platform === 'win32' ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32/tar.exe') : '/usr/bin/tar');
const sourceTools = path.join(root, 'anime/motion-comics');
const configFile = path.join(sourceTools, 'web-release.json');
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const publicDirectory = path.resolve(root, config.directory);
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const hash = file => digest(fs.readFileSync(file));
const slash = value => value.replaceAll('\\', '/');
const inside = (base, target) => { const relative = path.relative(base, target); return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`)); };
const assert = (condition, message) => { if (!condition) throw Error(message); };
const report = { schemaVersion: 1, kind: 'holt-local-release-restore-proof', startedAt: new Date().toISOString(), status: 'running', environment: { node: process.version, platform: process.platform, arch: process.arch, tar, tarVersion: execFileSync(tar, ['--version'], { encoding: 'utf8', windowsHide: true }).trim() }, tools: {}, config, checks: [], scope: { httpRequests: 0, transport: 'Local archive stream injected into the production download function; no HTTP request.', exclusions: ['Public release availability and redirect transport are not tested here.', 'No browser playback or listening is claimed by this restore proof.'] } };
let createdOutput = false;

function snapshot(folder) {
  function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const file = path.join(directory, entry.name);
      assert(!entry.isSymbolicLink(), 'Lien inattendu dans la publication.');
      if (entry.isDirectory()) return walk(file);
      assert(entry.isFile(), 'Type de fichier inattendu.');
      const stat = fs.statSync(file);
      return [{ path: slash(path.relative(folder, file)), bytes: stat.size, sha256: hash(file), mtimeMs: stat.mtimeMs }];
    });
  }
  const files = walk(folder).sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const content = files.map(({ path: name, bytes, sha256 }) => ({ path: name, bytes, sha256 }));
  return { files: files.length, bytes: files.reduce((total, file) => total + file.bytes, 0), contentSha256: digest(JSON.stringify(content)), metadataSha256: digest(JSON.stringify(files)) };
}
function cli(name, tool, command, clone, guard) {
  const args = ['--require', guard, tool, command];
  const started = performance.now();
  const stdout = execFileSync(process.execPath, args, { cwd: clone, windowsHide: true, encoding: 'utf8', env: { ...process.env, PATH: '', HOLT_FFMPEG: path.join(clone, 'NO-FFMPEG-AVAILABLE.exe') }, maxBuffer: 4 * 1024 * 1024 });
  const result = JSON.parse(stdout.trim());
  report.checks.push({ name, command: [process.execPath, ...args], cwd: clone, status: 'passed', milliseconds: Math.round(performance.now() - started), result });
  return result;
}
function cleanupClone(clone, tempBase) {
  const target = path.resolve(clone), expectedParent = path.resolve(tempBase);
  assert(path.dirname(target) === expectedParent && path.basename(target).startsWith('holt-comics-real-restore-') && target !== expectedParent, 'Nettoyage hors du répertoire temporaire autorisé.');
  assert(!fs.lstatSync(target).isSymbolicLink() && inside(fs.realpathSync(expectedParent), fs.realpathSync(target)), 'Nettoyage refusé pour un lien ou une sortie du temporaire.');
  fs.rmSync(target, { recursive: true, force: true });
  assert(!fs.existsSync(target), 'Le clone temporaire subsiste.');
}
async function run() {
  assert(inside(path.join(root, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/restore'), output), 'Le dossier de preuve doit rester dans restore/.');
  assert(!fs.existsSync(output), 'Le dossier de preuve existe déjà : utiliser une nouvelle version.');
  fs.mkdirSync(output, { recursive: true });
  createdOutput = true;
  const snapshots = path.join(output, 'tools'); fs.mkdirSync(snapshots);
  for (const name of ['site.cjs', 'publish.cjs', 'web-release.json']) {
    const file = path.join(sourceTools, name);
    report.tools[name] = { bytes: fs.statSync(file).size, sha256: hash(file) };
    fs.copyFileSync(file, path.join(snapshots, name));
  }
  fs.copyFileSync(__filename, path.join(snapshots, 'verify-local.cjs'));
  report.tools['verify-local.cjs'] = { bytes: fs.statSync(__filename).size, sha256: hash(__filename) };
  report.archive = { path: slash(path.relative(root, archive)), bytes: fs.statSync(archive).size, sha256: hash(archive) };
  assert(report.archive.bytes === config.release.bytes && report.archive.sha256 === config.release.sha256, 'Archive locale différente du verrou de release.');
  report.publicBefore = snapshot(publicDirectory);
  const tempBase = os.tmpdir(), clone = fs.mkdtempSync(path.join(tempBase, 'holt-comics-real-restore-'));
  report.clone = { path: clone, mastersPresent: fs.existsSync(path.join(clone, 'art-masters')), nodeModulesPresent: fs.existsSync(path.join(clone, 'node_modules')), sourceManifestPresent: fs.existsSync(path.resolve(clone, config.sourceManifest)), ffmpegOverrideExists: false };
  try {
    const tools = path.join(clone, 'anime/motion-comics'); fs.mkdirSync(tools, { recursive: true });
    for (const name of ['site.cjs', 'publish.cjs', 'web-release.json']) fs.copyFileSync(path.join(sourceTools, name), path.join(tools, name));
    const guard = path.join(clone, 'block-network.cjs');
    fs.writeFileSync(guard, "globalThis.fetch = async () => { throw Error('HTTP interdit dans la preuve hors ligne.'); };\n");
    const site = require(path.join(tools, 'site.cjs'));
    let archiveReads = 0;
    const started = performance.now();
    const previousFfmpeg = process.env.HOLT_FFMPEG, previousPath = process.env.PATH;
    process.env.HOLT_FFMPEG = path.join(clone, 'NO-FFMPEG-AVAILABLE.exe'); process.env.PATH = '';
    let restored;
    try {
      restored = await site.prepare({ root: clone, tar, fetchImpl: async url => {
        assert(url === config.release.url, 'URL demandée différente de la release verrouillée.');
        archiveReads++; return { ok: true, status: 200, body: fs.createReadStream(archive) };
      } });
    } finally {
      if (previousFfmpeg === undefined) delete process.env.HOLT_FFMPEG; else process.env.HOLT_FFMPEG = previousFfmpeg;
      if (previousPath === undefined) delete process.env.PATH; else process.env.PATH = previousPath;
    }
    assert(restored.status === 'restored' && archiveReads === 1, 'La restauration réelle n’a pas été effectuée exactement une fois.');
    report.checks.push({ name: 'restore-real-local-archive', status: 'passed', milliseconds: Math.round(performance.now() - started), archiveReads, result: restored, checker: 'Unmodified cloned publish.cjs --check; PATH empty; nonexistent HOLT_FFMPEG; no masters or npm modules.' });
    report.clone.restored = snapshot(path.resolve(clone, config.directory));
    assert(report.clone.restored.contentSha256 === report.publicBefore.contentSha256, 'Les octets restaurés diffèrent du paquet public figé.');
    const clonedTool = path.join(tools, 'site.cjs');
    assert(cli('cloned-cli-check', clonedTool, 'check', clone, guard).status === 'checked', 'Le check du clone a échoué.');
    assert(cli('cloned-cli-offline-reuse', clonedTool, 'prepare', clone, guard).status === 'reused-offline', 'Le réemploi du clone a échoué.');
    const afterReuse = snapshot(path.resolve(clone, config.directory));
    assert(afterReuse.metadataSha256 === report.clone.restored.metadataSha256, 'Le réemploi a modifié le paquet restauré.');
    report.clone.unchangedByReuse = true;
    const actualTool = path.join(sourceTools, 'site.cjs');
    assert(cli('existing-public-cli-check', actualTool, 'check', root, guard).status === 'checked', 'Le check public a échoué.');
    assert(cli('existing-public-cli-offline-reuse', actualTool, 'prepare', root, guard).status === 'reused-offline', 'Le réemploi public a échoué.');
    assert(fs.readdirSync(path.join(clone, 'public/comics/blue-purple')).join(',') === 'v10', 'Un temporaire de restauration subsiste.');
    report.publicAfter = snapshot(publicDirectory);
    assert(report.publicBefore.metadataSha256 === report.publicAfter.metadataSha256, 'Le paquet public a été modifié.');
    report.publicUnchanged = true;
    report.status = 'passed';
  } finally {
    cleanupClone(clone, tempBase); report.clone.removed = true;
  }
}
run().catch(error => { report.status = 'failed'; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; }).finally(() => {
  report.finishedAt = new Date().toISOString();
  if (createdOutput) fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ status: report.status, checks: report.checks.length, report: path.join(output, 'report.json'), error: report.error?.message }) + '\n');
});
