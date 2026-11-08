/* Delivery helpers confined to this production; the historical helpers stay intact. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
let ROOT = __dirname;
while (!fs.existsSync(path.join(ROOT, 'AGENTS.md'))) {
  const parent = path.dirname(ROOT); if (parent === ROOT) throw Error('Racine HOLT introuvable.'); ROOT = parent;
}
const old = require(path.join(ROOT, 'anime/motion-comics/production/pages-05-08/revision-03/reuse-common.cjs'));
const { localFile, inside, newDirectory } = require(path.join(ROOT, 'anime/motion-comics/project.cjs'));
const { readDocument } = require(path.join(ROOT, 'anime/motion-comics/sequence.cjs'));
const core = require(path.join(ROOT, 'anime/motion-comics/core.js'));
const sequence = require(path.join(ROOT, 'anime/motion-comics/sequence.js'));
const { stereoFilter } = require(path.join(ROOT, 'anime/motion-comics/audio.cjs'));
const engine = () => [...old.engine(), {file:'anime/motion-comics/audio.cjs',sha256:old.hash(path.join(ROOT,'anime/motion-comics/audio.cjs'))}];
const python = process.env.HOLT_PYTHON_EXE ?? 'C:/Users/hadri/AppData/Local/Programs/Python/Python312/python.exe';
function run(executable, args) {
  const result = spawnSync(executable, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  if (result.error || result.status !== 0) throw Error(result.error?.message ?? result.stderr ?? result.stdout);
  return result;
}
function encode(project, output, fps) {
  const duration = project.timeline.duration, tracks = project.timeline.tracks;
  const args = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-framerate', String(fps), '-i', path.join(output, 'frames/frame_%05d.png')];
  for (const track of tracks) args.push('-i', localFile(track.audioFile ?? path.resolve(path.dirname(project.manifestFile), track.audio), ROOT));
  if (project.musicFile) { if (!project.data.music.preMixed) args.push('-stream_loop', '-1'); args.push('-i', project.musicFile); }
  const filters = tracks.map((track, index) => `[${index + 1}:a]atrim=duration=${track.end - track.start},asetpts=PTS-STARTPTS,${stereoFilter(track.audioFile ?? path.resolve(path.dirname(project.manifestFile),track.audio),old.ffmpeg)},adelay=${Math.round(track.start * 1000)}:all=1[a${index}]`);
  const labels = tracks.map((_, index) => `[a${index}]`);
  if (project.musicFile) {
    filters.push(`[${tracks.length + 1}:a]atrim=duration=${duration},asetpts=PTS-STARTPTS,${stereoFilter(project.musicFile,old.ffmpeg)},volume='${sequence.musicVolumeExpression(duration, project.data.music, tracks)}':eval=frame[bed]`); labels.push('[bed]');
  }
  if (labels.length) { filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0,apad,atrim=duration=${duration}[audio]`); args.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[audio]', '-c:a', 'aac', '-ac', '2', '-b:a', '192k'); }
  args.push('-t', String(duration), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(output, 'motion-comic.mp4'));
  run(old.ffmpeg, args);
  const metadata = spawnSync(old.ffmpeg, ['-hide_banner', '-i', path.join(output, 'motion-comic.mp4')], { encoding: 'utf8', windowsHide: true });
  fs.writeFileSync(path.join(output, 'metadata.txt'), metadata.stderr ?? '');
  run(old.ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', path.join(output, 'motion-comic.mp4'), '-f', 'null', '-']);
  return args;
}
module.exports = { ...old, ROOT, localFile, inside, newDirectory, readDocument, core, sequence, python, run, encode, engine };
