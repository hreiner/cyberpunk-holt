/* Streaming float measurements: never retain a long decoded backing in RAM. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../../../../../../..');
const FFMPEG = path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const { stereoFilter } = require(path.join(ROOT, 'anime/motion-comics/audio.cjs'));
const RATE = 44100;
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
function hash(file) {
  const fd = fs.openSync(file, 'r'), block = Buffer.alloc(1024 * 1024), digest = crypto.createHash('sha256');
  try { let count; while ((count = fs.readSync(fd, block, 0, block.length, null))) digest.update(block.subarray(0, count)); }
  finally { fs.closeSync(fd); }
  return digest.digest('hex');
}
function probe(file) {
  const result = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  if (result.error) throw result.error;
  const line = result.stderr.split(/\r?\n/).find(row => row.includes('Audio:'));
  if (!line) throw Error(`Piste audio absente : ${relative(file)}`);
  const channels = /\bmono\b/.test(line) ? 1 : /\bstereo\b/.test(line) ? 2 : null;
  return { stream: line.trim(), channels, codec: /Audio:\s*([^,\s]+)/.exec(line)?.[1] ?? null,
    nativeSampleRate: Number(/(\d+) Hz/.exec(line)?.[1]) || null,
    bitRateKbps: Number(/(\d+) kb\/s/.exec(line)?.[1]) || null };
}
const db = amplitude => amplitude > 0 ? 20 * Math.log10(amplitude) : null;
function loudness(stderr) {
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  const number = expression => { const found = expression.exec(summary); return found ? Number(found[1]) : null; };
  return { integratedLufs: number(/Integrated loudness:[\s\S]*?I:\s+([\d.-]+)/),
    loudnessRangeLu: number(/Loudness range:[\s\S]*?LRA:\s+([\d.-]+)/),
    truePeakDb: number(/True peak:[\s\S]*?Peak:\s+([\d.-]+)/) };
}
function floatStats(argv, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, ['-nostdin', '-hide_banner', '-nostats', '-threads', '1', '-filter_threads', '1', ...argv,
      '-map_metadata', '-1', '-vn', '-ac', '2', '-ar', String(RATE), '-c:a', 'pcm_f32le', '-f', 'f32le', 'pipe:1'], { windowsHide: true });
    let count = 0, sum = 0, peak = 0, peakSample = 0, clipped = 0, invalid = 0, stereoDifference = 0;
    let boundedCount = 0, boundedSum = 0, carry = Buffer.alloc(0), stderr = '';
    const channelSum = [0, 0], channelPeak = [0, 0], blockFrames = 441, blocks = [];
    let blockSum = 0, blockCount = 0, previousLeft = 0;
    const limitSamples = (options.limitFrames ?? Number.POSITIVE_INFINITY) * 2;
    child.stdout.on('data', chunk => {
      const data = carry.length ? Buffer.concat([carry, chunk]) : chunk;
      const size = data.length - data.length % 4;
      for (let i = 0; i < size; i += 4) {
        const value = data.readFloatLE(i), magnitude = Math.abs(value), channel = count % 2;
        if (!Number.isFinite(value)) { invalid++; count++; continue; }
        const square = value * value;
        sum += square; channelSum[channel] += square; channelPeak[channel] = Math.max(channelPeak[channel], magnitude);
        if (magnitude > peak) { peak = magnitude; peakSample = count; }
        if (magnitude >= 1) clipped++;
        if (count < limitSamples) { boundedCount++; boundedSum += square; }
        if (channel === 0) previousLeft = value; else stereoDifference += (previousLeft - value) ** 2;
        if (options.envelope) {
          blockSum += square; blockCount++;
          if (blockCount === blockFrames * 2) { blocks.push(Math.sqrt(blockSum / blockCount)); blockSum = 0; blockCount = 0; }
        }
        count++;
      }
      carry = Buffer.from(data.subarray(size));
    });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-96 * 1024); });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0 || carry.length || invalid || count % 2) return reject(Error(`Décodage float invalide (${code}) : ${stderr.slice(-5000)}`));
      if (blockCount && options.envelope) blocks.push(Math.sqrt(blockSum / blockCount));
      resolve({ decoded: true, sampleRate: RATE, measurementChannels: 2, frames: count / 2, duration: count / (2 * RATE),
        peakDb: db(peak), peakSeconds: Math.floor(peakSample / 2) / RATE, rmsDb: db(Math.sqrt(sum / count)), clippedSamples: clipped,
        channelPeakDb: channelPeak.map(db), channelRmsDb: channelSum.map(value => db(Math.sqrt(value / (count / 2)))),
        sideRmsDb: db(Math.sqrt(stereoDifference / (count / 2))),
        commonFrames: boundedCount / 2, commonRmsDb: db(Math.sqrt(boundedSum / boundedCount)),
        ...(options.envelope ? { envelope10ms: blocks } : {}), ...(options.loudness ? loudness(stderr) : {}) });
    });
  });
}
function measure(file, options = {}) {
  const filter = `${stereoFilter(file, FFMPEG)}${options.loudness ? ',ebur128=peak=true' : ''}`;
  return floatStats(['-xerror', '-err_detect', 'explode', '-i', file, '-af', filter], options);
}
function faststart(file) {
  const fd = fs.openSync(file, 'r'), size = fs.statSync(file).size, header = Buffer.alloc(16), atoms = [];
  try {
    for (let offset = 0; offset + 8 <= size;) {
      if (fs.readSync(fd, header, 0, Math.min(16, size - offset), offset) < 8) break;
      const type = header.toString('ascii', 4, 8), short = header.readUInt32BE(0);
      const length = short === 1 ? Number(header.readBigUInt64BE(8)) : short === 0 ? size - offset : short;
      if (length < 8 || offset + length > size) throw Error(`Atome MP4 invalide : ${relative(file)}`);
      atoms.push({ type, offset, bytes: length }); offset += length;
    }
  } finally { fs.closeSync(fd); }
  const moov = atoms.find(atom => atom.type === 'moov'), mdat = atoms.find(atom => atom.type === 'mdat');
  return { moovBeforeMdat: Boolean(moov && mdat && moov.offset < mdat.offset), atoms };
}
function envelopeCorrelation(left, right) {
  const count = Math.min(left.length, right.length) - 1;
  let l = 0, r = 0, ll = 0, rr = 0, lr = 0;
  for (let index = 0; index < count; index++) { const a = left[index], b = right[index]; l += a; r += b; ll += a * a; rr += b * b; lr += a * b; }
  return (lr - l * r / count) / Math.sqrt((ll - l * l / count) * (rr - r * r / count));
}
function shortPcm(file, start, duration) {
  if (!(duration > 0 && duration <= 2)) throw Error('Une fenêtre PCM de deux secondes au maximum est requise.');
  const result = spawnSync(FFMPEG, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-ss', String(start), '-i', file,
    '-t', String(duration), '-af', stereoFilter(file, FFMPEG), '-ar', String(RATE), '-ac', '2', '-c:a', 'pcm_f32le', '-f', 'f32le', 'pipe:1'],
  { maxBuffer: 2 * 1024 * 1024, windowsHide: true });
  if (result.error || result.status !== 0) throw result.error ?? Error(result.stderr.toString());
  const pcm = new Float32Array(result.stdout.length / 4);
  for (let index = 0; index < pcm.length; index++) pcm[index] = result.stdout.readFloatLE(index * 4);
  return pcm;
}
function waveformLag(left, right, maximumLag = 88) {
  let best = { correlation: -1, lagSamples: null };
  const frames = Math.min(left.length, right.length) / 2;
  for (let lag = -maximumLag; lag <= maximumLag; lag++) {
    let dot = 0, ll = 0, rr = 0;
    for (let index = maximumLag; index < frames - maximumLag; index += 2) {
      const a = left[index * 2], b = right[(index + lag) * 2];
      dot += a * b; ll += a * a; rr += b * b;
    }
    const correlation = dot / Math.sqrt(ll * rr);
    if (correlation > best.correlation) best = { correlation, lagSamples: lag };
  }
  return { ...best, lagMilliseconds: best.lagSamples / RATE * 1000 };
}
module.exports = { ROOT, FFMPEG, RATE, relative, hash, probe, db, floatStats, measure, faststart, envelopeCorrelation, stereoFilter, shortPcm, waveformLag };
