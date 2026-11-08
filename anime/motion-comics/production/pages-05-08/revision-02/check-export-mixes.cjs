/* Measure the six fully decoded AAC mixes without claiming human listening. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ROOT, localFile, inside } = require('../../../project.cjs');
const planFile = localFile(path.resolve(process.argv[2] ?? ''), ROOT);
const target = path.resolve(process.argv[3] ?? '');
if (!process.argv[3] || !inside(ROOT, target) || fs.existsSync(target)) throw Error('Rapport neuf sous dépôt requis.');
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const mixes = [];
for (const job of plan.jobs) {
  const directory = path.resolve(path.dirname(planFile), job.output), file = localFile(path.join(directory, 'motion-comic.mp4'), ROOT);
  const report = JSON.parse(fs.readFileSync(path.join(directory, 'report.json'), 'utf8'));
  if (report.status !== 'completed' || !report.decoded) throw Error(`Export incomplet : ${directory}`);
  const command = ['-nostdin', '-hide_banner', '-i', file, '-vn', '-sn', '-dn', '-af', 'volumedetect', '-f', 'null', '-'];
  const result = spawnSync(ffmpeg, command, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
  const meanDb = Number(result.stderr?.match(/mean_volume:\s*([\d.-]+) dB/)?.[1]), peakDb = Number(result.stderr?.match(/max_volume:\s*([\d.-]+) dB/)?.[1]);
  if (result.status !== 0 || !Number.isFinite(meanDb) || !Number.isFinite(peakDb)) throw Error(`Mesure mix échouée : ${file}`);
  mixes.push({ file: path.relative(ROOT, file).replaceAll('\\', '/'), meanDb, peakDb, decodeExit: result.status, sha256: hash(file), command: [ffmpeg, ...command] });
}
const data = { selectionVersion: 4, status: mixes.every(mix => mix.peakDb < 0) ? 'completed' : 'failed',
  method: 'FFmpeg volumedetect sur décodage intégral de chaque AAC ; aucune écoute humaine.', checkedAt: new Date().toISOString(), mixes };
fs.writeFileSync(target, JSON.stringify(data, null, 2), { flag: 'wx' });
console.info(JSON.stringify({ target, status: data.status, mixes: mixes.map(({ file, meanDb, peakDb }) => ({ file, meanDb, peakDb })) }));
if (data.status !== 'completed') process.exitCode = 1;
