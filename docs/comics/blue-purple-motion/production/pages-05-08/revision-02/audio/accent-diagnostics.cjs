const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ROOT, RATE, FFMPEG, frameAt, decode, mixBacking } = require('./mix-engine.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const db = amplitude => amplitude > 0 ? 20 * Math.log10(amplitude) : null;

function stats(data, start, duration) {
  const first = Math.max(0, frameAt(start) * 2), last = Math.min(data.length, frameAt(start + duration) * 2);
  let sum = 0, peak = 0, peakSample = first;
  const blocks = [], blockSamples = 220 * 2;
  for (let offset = first; offset < last; offset += blockSamples) {
    let blockSum = 0, blockPeak = 0;
    const end = Math.min(last, offset + blockSamples);
    for (let index = offset; index < end; index++) {
      const value = data[index], absolute = Math.abs(value);
      blockSum += value * value;
      if (absolute > peak) { peak = absolute; peakSample = index; }
      blockPeak = Math.max(blockPeak, absolute);
    }
    sum += blockSum;
    blocks.push({ time: offset / (RATE * 2), peak: blockPeak, rms: Math.sqrt(blockSum / (end - offset)) });
  }
  const maxBlockRms = Math.max(...blocks.map(block => block.rms));
  const onset = blocks.find(block => block.peak >= Math.max(Math.pow(10, -30 / 20), peak * Math.pow(10, -18 / 20)) && block.rms >= maxBlockRms * .1);
  return { start, duration: (last - first) / (RATE * 2), peakDb: db(peak), rmsDb: db(Math.sqrt(sum / (last - first))),
    max5msRmsDb: db(maxBlockRms), peakTime: peakSample / (RATE * 2), peakOffset: peakSample / (RATE * 2) - start,
    strongOnset: onset?.time ?? null, strongOnsetOffset: onset ? onset.time - start : null };
}

function voices(timing) {
  const data = new Float32Array(frameAt(timing.duration) * 2);
  for (const track of timing.tracks) {
    const source = decode(track.audioFile), first = frameAt(track.start) * 2;
    const count = Math.min(source.length, frameAt(track.end - track.start) * 2);
    for (let index = 0; index < count; index++) data[first + index] += source[index];
  }
  return data;
}

function compareAccents({ timing, events, sections, silences, output, save }) {
  const oldFolder = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/soundtrack-v3');
  const oldReportFile = path.join(oldFolder, 'report.json');
  const old = JSON.parse(fs.readFileSync(oldReportFile));
  const oldTiming = JSON.parse(fs.readFileSync(path.join(oldFolder, 'timing.json')));
  const currentMusic = mixBacking({ duration: timing.duration, sections, tracks: timing.tracks, events: [], silences });
  const previousMusic = mixBacking({ duration: oldTiming.duration, sections: old.sections, tracks: oldTiming.tracks, events: [], silences: old.musicSilences });
  const currentVoices = voices(timing);
  const groups = [
    { id: 'body-impact', anchor: 'punchContact', duration: .5, now: ['body-impact'], before: ['body-impact', 'bat-drop'] },
    { id: 'shot-glass', anchor: 'shot', duration: 3, now: ['gun-attack', 'glass-tail'], before: ['gun-glass'] },
    { id: 'engine-start', anchor: 'starter', duration: 5, now: ['engine-start'], before: ['engine-start'] }
  ];
  const results = [];
  for (const group of groups) {
    const anchor = timing.events.find(row => row.id === group.anchor).time;
    const oldAnchor = oldTiming.events.find(row => row.id === group.anchor).time;
    const selected = events.filter(event => group.now.includes(event.id));
    const oldSelected = old.events.filter(event => group.before.includes(event.id));
    const current = mixBacking({ duration: timing.duration, sections: [], tracks: timing.tracks, events: selected });
    const prior = mixBacking({ duration: oldTiming.duration, sections: [], tracks: oldTiming.tracks, events: oldSelected });
    const after = stats(current, anchor, group.duration), before = stats(prior, oldAnchor, group.duration);
    const windows = [...new Set([.05, .22, .5, group.duration])].filter(seconds => seconds <= group.duration).map(seconds => {
      const signal = stats(current, anchor, seconds), oldSignal = stats(prior, oldAnchor, seconds);
      const music = stats(currentMusic, anchor, seconds), oldMusic = stats(previousMusic, oldAnchor, seconds);
      const speech = stats(currentVoices, anchor, seconds);
      return { seconds, newSfx: signal, oldSfx: oldSignal,
        sfxRmsChangeDb: signal.rmsDb === null || oldSignal.rmsDb === null ? null : signal.rmsDb - oldSignal.rmsDb,
        newMusic: music, oldMusic, voices: speech,
        sfxOverMusicRmsDb: signal.rmsDb === null || music.rmsDb === null ? null : signal.rmsDb - music.rmsDb,
        sfxOverVoicesRmsDb: signal.rmsDb === null || speech.rmsDb === null ? null : signal.rmsDb - speech.rmsDb };
    });
    if (after.strongOnsetOffset === null || Math.abs(after.strongOnsetOffset) > 1 / 24) throw Error(`Onset fort décalé : ${group.id}`);
    const stemStart = Math.max(0, anchor - .08), stemEnd = Math.min(timing.duration, anchor + group.duration + .12);
    const stem = save(`accent-${group.id}.wav`, current, stemStart, stemEnd);
    results.push({ id: group.id, anchor, previousAnchor: oldAnchor, selectedEvents: selected,
      before, after, onsetWithinOneFrame: true, windows, isolatedStem: stem.audio,
      isolatedStemStart: stemStart, previousEvents: oldSelected });
  }
  const report = { schemaVersion: 1, date: '2026-11-06', nativeSampleRate: RATE, nativeChannels: 2,
    previousMixReport: relative(oldReportFile), previousMixReportSha256: hash(fs.readFileSync(oldReportFile)),
    strongOnsetRule: 'Blocs220frames (~4.99ms) : peak>=max(-30dBFS,maxPeak-18dB) ET RMS>=maxBlockRMS-20dB. Mesure après trims/gains/duck réellement joués.',
    voiceGainChange: 0, newPaidCalls: 0, humanListening: 'not-performed', accents: results };
  const file = path.join(output, 'accent-metrics.json');
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return { file: relative(file), sha256: hash(fs.readFileSync(file)),
    accents: results.map(item => ({ id: item.id, onsetOffset: item.after.strongOnsetOffset,
      previousOnsetOffset: item.before.strongOnsetOffset, peakDb: item.after.peakDb, rmsDb: item.after.rmsDb, onsetWithinOneFrame: true })) };
}

function encodeRendererPreview(timing, backingFile, output) {
  const file = path.join(output, 'preview-renderer-aac.m4a');
  const args = ['-hide_banner', '-loglevel', 'error', '-n'];
  for (const track of timing.tracks) args.push('-i', track.audioFile);
  args.push('-i', backingFile);
  const filters = timing.tracks.map((track, index) => `[${index}:a]atrim=duration=${track.end - track.start},asetpts=PTS-STARTPTS,adelay=${Math.round(track.start * 1000)}:all=1[a${index}]`);
  filters.push(`[${timing.tracks.length}:a]atrim=duration=${timing.duration},asetpts=PTS-STARTPTS[bed]`);
  filters.push(`${timing.tracks.map((_, index) => `[a${index}]`).join('')}[bed]amix=inputs=${timing.tracks.length + 1}:normalize=0,apad,atrim=duration=${timing.duration}[audio]`);
  args.push('-filter_complex', filters.join(';'), '-map', '[audio]', '-c:a', 'aac', file);
  const encoded = spawnSync(FFMPEG, args, { maxBuffer: 8 * 1024 * 1024 });
  if (encoded.status !== 0) throw Error(`Échec préécoute AAC du vrai chemin de mix : ${encoded.stderr}`);
  const decoded = spawnSync(FFMPEG, ['-hide_banner', '-xerror', '-err_detect', 'explode', '-i', file, '-f', 'f32le', 'pipe:1'], { maxBuffer: 64 * 1024 * 1024 });
  if (decoded.status !== 0 || !decoded.stdout.length) throw Error(`AAC non décodable : ${decoded.stderr}`);
  const log = String(decoded.stderr), channels = /Audio: aac[^\r\n]*\bmono\b/.test(log) ? 1 : /Audio: aac[^\r\n]*\bstereo\b/.test(log) ? 2 : null;
  if (!channels) throw Error('Nombre de canaux AAC inconnu.');
  let peak = 0, sum = 0;
  for (let offset = 0; offset < decoded.stdout.length; offset += 4) {
    const value = decoded.stdout.readFloatLE(offset);
    peak = Math.max(peak, Math.abs(value)); sum += value * value;
  }
  if (peak >= 1) throw Error(`Écrêtage AAC détecté : ${db(peak)}dBFS ; corriger seulement le SFX concerné.`);
  return { audio: relative(file), sha256: hash(fs.readFileSync(file)), decoded: true, codec: 'aac', channels, sampleRate: RATE,
    duration: decoded.stdout.length / (4 * RATE * channels), peakDb: db(peak), rmsDb: db(Math.sqrt(sum / (decoded.stdout.length / 4))),
    clippedSamples: 0, method: 'Même ordre des22 voix, mêmes atrim/asetpts/adelay, amix normalize0 et codec AAC que render.cjs ; aucun gain global.',
    commandArguments: args, humanListening: 'not-performed' };
}

module.exports = { compareAccents, encodeRendererPreview };
