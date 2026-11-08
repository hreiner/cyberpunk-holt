/* Production-only helpers. The shipped reader and renderer remain unchanged. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { setTimeout, clearTimeout } = require('node:timers');
const { ROOT, localFile } = require('../../../project.cjs');
const core = require('../../../core.js');
const runtime = ['reader.html', 'reader.css', 'reader.js', 'core.js', 'effects.js', 'layers.js', 'sequence.js',
  'assets/holt-display.woff2', 'assets/holt-text.woff2', 'render.cjs', 'project.cjs', 'sequence.cjs', 'package.json'];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const engine = () => runtime.map(file => ({ file: `anime/motion-comics/${file}`, sha256: hash(path.join(ROOT, 'anime/motion-comics', file)) }));
const frameName = index => `frame_${String(index).padStart(5, '0')}.png`;
const browserPath = process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ffmpeg = process.env.HOLT_FFMPEG ?? path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
function run(args) {
  const result = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw Error(result.error?.message ?? result.stderr);
  return result;
}
function preview(manifest) {
  const child = spawn(process.execPath, [path.join(ROOT, 'anime/motion-comics/render.cjs'), '--serve', manifest, '--port', '0'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  return new Promise((resolve, reject) => {
    let output = '', errors = '';
    const timer = setTimeout(() => { child.kill(); reject(Error('Délai serveur aperçu dépassé.')); }, 30000);
    child.stderr.on('data', chunk => { errors += chunk; });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); if (!output.includes('http://')) reject(Error(errors || `Aperçu arrêté code${code}`)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/[^\r\n]+/);
      if (match) { clearTimeout(timer); resolve({ child, url: match[0] }); }
    });
  });
}
function snapshot(project, output) {
  const media = [...new Set([...project.pages.flatMap(page => page.files), ...(project.musicFile ? [project.musicFile] : [])])];
  fs.mkdirSync(path.join(output, 'media'));
  const copied = new Map(media.map((file, index) => [file, `media/${String(index).padStart(3, '0')}${path.extname(file)}`]));
  for (const [file, target] of copied) fs.copyFileSync(file, path.join(output, target), fs.constants.COPYFILE_EXCL);
  const pages = project.pages.map(page => core.rebaseAssets(page.data, file => copied.get(path.resolve(path.dirname(page.manifestFile), file))));
  let data = pages[0];
  if (project.kind === 'sequence') {
    data = structuredClone(project.data);
    data.pages = data.pages.map((page, index) => { const manifest = `page-${String(index + 1).padStart(2, '0')}.json`; fs.writeFileSync(path.join(output, manifest), JSON.stringify(pages[index], null, 2), { flag: 'wx' }); return { ...page, manifest }; });
    if (data.music) data.music.audio = copied.get(project.musicFile);
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(data, null, 2), { flag: 'wx' });
}
function encode(project, output, fps) {
  const duration = project.timeline.duration, tracks = project.timeline.tracks;
  const args = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-framerate', String(fps), '-i', path.join(output, 'frames/frame_%05d.png')];
  for (const track of tracks) args.push('-i', localFile(track.audioFile ?? path.resolve(path.dirname(project.manifestFile), track.audio), ROOT));
  if (project.musicFile) { if (!project.data.music.preMixed) args.push('-stream_loop', '-1'); args.push('-i', project.musicFile); }
  const filters = tracks.map((track, index) => `[${index + 1}:a]atrim=duration=${track.end - track.start},asetpts=PTS-STARTPTS,adelay=${Math.round(track.start * 1000)}:all=1[a${index}]`);
  const labels = tracks.map((_, index) => `[a${index}]`);
  if (project.musicFile) {
    const { musicVolumeExpression } = require('../../../sequence.js');
    filters.push(`[${tracks.length + 1}:a]atrim=duration=${duration},asetpts=PTS-STARTPTS,volume='${musicVolumeExpression(duration, project.data.music, tracks)}':eval=frame[bed]`); labels.push('[bed]');
  }
  if (labels.length) { filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0,apad,atrim=duration=${duration}[audio]`); args.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[audio]', '-c:a', 'aac'); }
  args.push('-t', String(duration), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(output, 'motion-comic.mp4'));
  run(args);
  const metadata = spawnSync(ffmpeg, ['-hide_banner', '-i', path.join(output, 'motion-comic.mp4')], { encoding: 'utf8' });
  fs.writeFileSync(path.join(output, 'metadata.txt'), metadata.stderr ?? '');
  run(['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', path.join(output, 'motion-comic.mp4'), '-f', 'null', '-']);
  return args;
}
module.exports = { ROOT, read, hash, relative, engine, frameName, browserPath, ffmpeg, preview, snapshot, encode };
