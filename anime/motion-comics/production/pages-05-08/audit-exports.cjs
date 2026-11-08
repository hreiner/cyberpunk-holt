/* Verify completed exports, copied manifests/media, codecs and full decoding. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ROOT, inside } = require('../../project.cjs');
const { readDocument } = require('../../sequence.cjs');
const directories = process.argv.slice(2).map(value => {
  const directory = path.resolve(value);
  if (!inside(ROOT, directory) || !fs.statSync(directory).isDirectory() || !inside(fs.realpathSync(ROOT), fs.realpathSync(directory))) throw Error('Dossier export inaccessible.');
  return directory;
});
if (!directories.length) throw Error('Usage : node audit-exports.cjs DOSSIER_EXPORT [...]');
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for (const directory of directories) {
  const report = JSON.parse(fs.readFileSync(path.join(directory, 'report.json'), 'utf8'));
  if (report.status !== 'completed' || report.decoded !== true || report.fps !== 24) throw Error(`Export incomplet : ${directory}`);
  readDocument(path.join(directory, 'manifest.json'));
  const differences = [...report.media, ...report.engine].filter(item => hash(path.resolve(ROOT, item.file)) !== item.sha256).map(item => item.file);
  if (report.sourceHash !== hash(report.source)) differences.push(report.source);
  const file = path.join(directory, 'motion-comic.mp4');
  const metadata = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr ?? '';
  const decode = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const codecs = /Video: h264/.test(metadata) && /1280x720/.test(metadata) && /24 fps/.test(metadata) && /Audio: aac/.test(metadata);
  const result = { checkedAt: new Date().toISOString(), export: directory, status: differences.length || decode.status !== 0 || !codecs ? 'failed' : 'completed', sha256: hash(file), bytes: fs.statSync(file).size, sourceAndEngineDifferences: differences, fullDecodeExit: decode.status, codecsVerified: codecs, snapshotValidated: true, metadata };
  const auditFile = path.join(directory, 'independent-audit.json');
  fs.writeFileSync(auditFile, JSON.stringify(result, null, 2), { flag: 'wx' });
  console.info(JSON.stringify({ export: directory, status: result.status, bytes: result.bytes, differences }));
  if (result.status !== 'completed') process.exitCode = 1;
}
