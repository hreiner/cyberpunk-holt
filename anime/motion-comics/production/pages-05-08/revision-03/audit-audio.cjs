/* Full float AAC measurements and retained/new audio packet hashes, without human-listening claims. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT, read, hash, relative, ffmpeg } = require('./reuse-common.cjs');
const base = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-03');
const target = path.join(base, 'mix-check-v1.json');
if (fs.existsSync(target)) throw Error('Rapport existant, choisir une nouvelle version.');
function audioHash(file) {
  const result = spawnSync(ffmpeg, ['-nostdin', '-v', 'error', '-i', file, '-map', '0:a:0', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], { encoding: 'utf8' });
  const sha256 = result.stdout?.match(/SHA256=([a-f\d]{64})/i)?.[1];
  if (result.status !== 0 || !sha256) throw Error('Hash des paquets AAC échoué.');
  return sha256;
}
const mixes = [];
for (const name of ['pages-01-08', 'pages-05-08', 'page-05']) {
  const directory = path.join(base, 'exports', name, 'render-v1'), report = read(path.join(directory, 'report.json'));
  if (report.status !== 'completed' || !report.decoded) throw Error('Export incomplet.');
  const file = path.join(directory, 'motion-comic.mp4'), proof = read(path.resolve(ROOT, report.cacheProof.file)), old = path.resolve(ROOT, proof.sourceExport, 'motion-comic.mp4');
  const command = ['-nostdin', '-v', 'error', '-i', file, '-vn', '-sn', '-dn', '-ac', '1', '-ar', '44100', '-f', 'f32le', '-'];
  const result = spawnSync(ffmpeg, command, { maxBuffer: 200 * 1024 * 1024 });
  if (result.status !== 0 || !result.stdout.length || result.stdout.length % 4) throw Error('Décodage AAC float échoué.');
  let peak = 0, squares = 0, clippedSamples = 0;
  const samples = result.stdout.length / 4;
  for (let index = 0; index < result.stdout.length; index += 4) {
    const value = result.stdout.readFloatLE(index), absolute = Math.abs(value);
    if (!Number.isFinite(value)) throw Error('Échantillon non fini.');
    peak = Math.max(peak, absolute); squares += value * value; if (absolute >= 1) clippedSamples++;
  }
  const aacSha256 = audioHash(file), retainedAacSha256 = audioHash(old);
  mixes.push({ file: relative(file), sha256: hash(file), meanDb: 10 * Math.log10(squares / samples), peakDb: 20 * Math.log10(peak),
    samples, clippedSamples, decodeExit: result.status, aacSha256, retainedAacSha256, retainedAacIdentical: aacSha256 === retainedAacSha256,
    retainedFile: relative(old), command: [ffmpeg, ...command] });
}
const report = { status: mixes.every(mix => mix.clippedSamples === 0 && mix.retainedAacIdentical) ? 'completed' : 'failed',
  selectionVersion: 5, checkedAt: new Date().toISOString(), method: 'Décodage intégral mono44100Hzfloat32, pics réels et paquets AAC bit-identiques à v4. Aucune écoute humaine.', mixes };
fs.writeFileSync(target, JSON.stringify(report, null, 2), { flag: 'wx' });
console.info(JSON.stringify({ target, status: report.status, mixes: mixes.map(({ file, peakDb, clippedSamples, retainedAacIdentical }) => ({ file, peakDb, clippedSamples, retainedAacIdentical })) }));
if (report.status !== 'completed') process.exitCode = 1;
