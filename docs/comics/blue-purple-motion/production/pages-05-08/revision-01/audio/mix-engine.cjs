const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

let ROOT = __dirname;
while (!fs.existsSync(path.join(ROOT, 'AGENTS.md'))) {
  const parent = path.dirname(ROOT);
  if (parent === ROOT) throw Error('Racine HOLT introuvable.');
  ROOT = parent;
}
const RATE = 44100;
const FFMPEG = path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const cache = new Map();
const frameAt = seconds => Math.round(seconds * RATE);
const clamp = value => Math.max(0, Math.min(1, value));

function decode(file) {
  const full = path.resolve(ROOT, file);
  if (!cache.has(full)) {
    const result = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-xerror', '-err_detect', 'explode',
      '-i', full, '-ac', '2', '-ar', String(RATE), '-f', 'f32le', 'pipe:1'], { maxBuffer: 512 * 1024 * 1024 });
    if (result.status !== 0 || !result.stdout?.length) throw Error(`Décodage audio impossible : ${full}\n${result.stderr}`);
    const bytes = result.stdout;
    const data = new Float32Array(bytes.length / 4);
    for (let index = 0; index < data.length; index++) data[index] = bytes.readFloatLE(index * 4);
    cache.set(full, data);
  }
  return cache.get(full);
}

function speechEnvelope(duration, tracks, ramp = .15) {
  const envelope = new Float32Array(frameAt(duration));
  for (const track of tracks) {
    for (let frame = Math.max(0, frameAt(track.start - ramp)); frame < Math.min(envelope.length, frameAt(track.end + ramp)); frame++) {
      const time = frame / RATE;
      const value = ramp ? Math.min(clamp((time - track.start + ramp) / ramp), clamp((track.end + ramp - time) / ramp)) : +(time >= track.start && time <= track.end);
      envelope[frame] = Math.max(envelope[frame], value);
    }
  }
  return envelope;
}

function mixBacking({ duration, sections, tracks, events = [], silences = [] }) {
  const frames = frameAt(duration), result = new Float32Array(frames * 2);
  const speech = speechEnvelope(duration, tracks);
  for (const section of sections) {
    const source = decode(section.audio), sourceFrames = source.length / 2;
    const first = Math.max(0, frameAt(section.start));
    const last = Math.min(frames, frameAt(section.end));
    for (let frame = first; frame < last; frame++) {
      const time = frame / RATE;
      const fadeIn = section.fadeIn ?? 0, fadeOut = section.fadeOut ?? 0;
      let envelope = Math.min(fadeIn ? clamp((time - section.start) / fadeIn) : 1,
        fadeOut ? clamp((section.end - time) / fadeOut) : 1);
      if (section.gainRamp) envelope *= section.gainRamp.from + (section.gainRamp.to - section.gainRamp.from) * clamp((time - section.start) / section.gainRamp.seconds);
      for (const pause of silences) {
        const lead = pause.lead ?? .04, hold = pause.hold ?? .12, release = pause.release ?? .22;
        if (time >= pause.at - lead && time < pause.at) envelope *= clamp((pause.at - time) / lead);
        else if (time >= pause.at && time < pause.at + hold) envelope = 0;
        else if (time >= pause.at + hold && time < pause.at + hold + release) envelope *= clamp((time - pause.at - hold) / release);
      }
      const gain = section.gain * envelope * (1 - (1 - (section.speechMultiplier ?? .28)) * speech[frame]);
      const sourceFrame = ((frameAt(section.sourceOffset ?? 0) + frame - frameAt(section.start)) % sourceFrames + sourceFrames) % sourceFrames;
      result[frame * 2] += source[sourceFrame * 2] * gain;
      result[frame * 2 + 1] += source[sourceFrame * 2 + 1] * gain;
    }
  }
  for (const event of events) {
    const source = decode(event.audio), startFrame = frameAt(event.start), trimFrame = frameAt(event.trimStart ?? 0);
    const count = Math.min(source.length / 2 - trimFrame, event.duration === undefined ? Infinity : frameAt(event.duration));
    for (let index = 0; index < count; index++) {
      const frame = startFrame + index;
      if (frame < 0 || frame >= frames) continue;
      const edge = Math.min(clamp(index / (RATE * .004)), clamp((count - index) / (RATE * (event.fadeOut ?? .012))));
      const gain = (event.gain ?? 1) * edge * (1 - (1 - (event.speechMultiplier ?? .42)) * speech[frame]);
      result[frame * 2] += source[(trimFrame + index) * 2] * gain;
      result[frame * 2 + 1] += source[(trimFrame + index) * 2 + 1] * gain;
    }
  }
  return result;
}

function writeWave(file, data, start = 0, end = data.length / (RATE * 2)) {
  const first = frameAt(start) * 2, last = Math.min(data.length, frameAt(end) * 2);
  const count = last - first, buffer = Buffer.alloc(44 + count * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(RATE, 24); buffer.writeUInt32LE(RATE * 4, 28);
  buffer.writeUInt16LE(4, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36);
  buffer.writeUInt32LE(count * 2, 40);
  let peak = 0, squared = 0;
  for (let index = 0; index < count; index++) {
    const value = data[first + index];
    if (Math.abs(value) > 1) throw Error(`Surcharge audio avant écriture : ${file}`);
    peak = Math.max(peak, Math.abs(value)); squared += value * value;
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(value * 32767))), 44 + index * 2);
  }
  fs.writeFileSync(file, buffer, { flag: 'wx' });
  return { duration: count / (RATE * 2), pcmFrames: count / 2,
    peakDb: peak ? 20 * Math.log10(peak) : null,
    rmsDb: squared ? 10 * Math.log10(squared / count) : null };
}

module.exports = { ROOT, RATE, FFMPEG, decode, frameAt, speechEnvelope, mixBacking, writeWave };
