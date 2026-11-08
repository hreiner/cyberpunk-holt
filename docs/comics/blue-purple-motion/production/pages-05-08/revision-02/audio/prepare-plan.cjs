/* global __filename */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const engine = require('../../revision-01/audio/mix-engine.cjs');
const { ROOT, RATE, decode, frameAt } = engine;
const source = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/sfx-measurements-v3.json');
const selection = JSON.parse(fs.readFileSync(source));
const sounds = new Map(selection.sounds.map(sound => [sound.id, sound]));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function measure(id, start, duration) {
  const sound = sounds.get(id), data = decode(sound.audio);
  const first = frameAt(start) * 2, last = Math.min(data.length, frameAt(start + duration) * 2);
  let sum = 0, peak = 0, peakAt = first;
  const blocks = [], blockSamples = 220 * 2;
  for (let index = first; index < last; index += blockSamples) {
    let blockSum = 0, blockPeak = 0;
    const end = Math.min(last, index + blockSamples);
    for (let sample = index; sample < end; sample++) {
      const value = data[sample], absolute = Math.abs(value);
      blockSum += value * value;
      if (absolute > peak) { peak = absolute; peakAt = sample; }
      blockPeak = Math.max(blockPeak, absolute);
    }
    sum += blockSum;
    blocks.push({ time: index / (RATE * 2), peak: blockPeak, rms: Math.sqrt(blockSum / (end - index)) });
  }
  const maxBlockRms = Math.max(...blocks.map(block => block.rms));
  const strong = blocks.find(block => block.peak >= Math.max(Math.pow(10, -30 / 20), peak * Math.pow(10, -18 / 20)) && block.rms >= maxBlockRms * .1);
  return { source: sound.audio, sourceSha256: sound.sha256, trimStart: start, duration: (last - first) / (RATE * 2),
    peakDb: 20 * Math.log10(peak), rmsDb: 10 * Math.log10(sum / (last - first)),
    peakSourceTime: peakAt / (RATE * 2), strongOnsetSourceTime: strong?.time,
    strongOnsetAfterTrim: strong ? strong.time - start : null, strongRule: 'Blocs de220frames (~4.99ms) : peak>=max(-30dBFS,maxPeak-18dB) ET RMS>=maxBlockRMS-20dB.' };
}
const plan = { schemaVersion: 1, version: 2, date: '2026-11-06', status: 'levels-prepared-before-final-mix',
  sourceSelection: path.relative(ROOT, source).replaceAll('\\', '/'), sourceSelectionSha256: hash(fs.readFileSync(source)),
  networkCalls: 0, newVoices: 0, newSfx: 0, cumulativeVoiceCharacters: 3394,
  cumulativeSfxRequests: 6, cumulativeSfxRequestedSeconds: 20, voicesPolicy: '37 prises sources conservées, aucune baisse globale de voix ni modification de mots/tags.',
  prefixPolicy: '144.6s PCM historiques inchangées, copie de legacy-prefix.wav vérifiée par hash.',
  oldPunch: measure('punch-wood', 0, .22),
  accents: [
    { id: 'body-impact', sound: 'punch-wood', anchor: 'punchContact', trimStart: 1.132, duration: .34, gainDb: 6, speechMultiplier: 1,
      sourceAudit: measure('punch-wood', 1.132, .34), rationale: 'Replacer le seul transitoire fort sur le contact ; retirer ancien faux impact quasi muet et ne pas rejouer le même transitoire comme batte.',
      musicWindow: { lead: .07, hold: .20, release: .28, floor: 0 } },
    { id: 'gun-attack', sound: 'gun-glass', anchor: 'shot', trimStart: 0, duration: .45, gainDb: 3, speechMultiplier: .30, speechRampSeconds: .025,
      sourceAudit: measure('gun-glass', 0, .45), rationale: 'Attaque audible au bris16.40, puis protection rapide de la réaction16.60. Un seul tir.',
      musicWindow: { lead: .05, hold: .18, release: .45, floor: 0 } },
    { id: 'glass-tail', sound: 'gun-glass', anchor: 'shot', offsetSeconds: .45, trimStart: .45, duration: 2.55, gainDb: 3, speechMultiplier: .62, speechRampSeconds: .04,
      sourceAudit: measure('gun-glass', .45, 2.55), rationale: 'Queue disjointe du même fichier : verre plus lisible, aucun second départ.' },
    { id: 'engine-start', sound: 'engine-start', anchor: 'starter', trimStart: 0, duration: 5, gainDb: 7, speechMultiplier: .60, speechRampSeconds: .08,
      sourceAudit: measure('engine-start', 0, 5), rationale: 'Crantage perceptible dès ancre ; le pic naturel arrive ensuite avec le cycle du démarreur, sans silence ajouté.',
      musicWindow: { lead: .10, hold: 3.60, release: .55, floor: .12 } }
  ],
  remainingSounds: 'Les autres SFX, trois foleys locaux et trois musiques HOLT sont réemployés, sans nouvelle génération.',
  humanListening: 'not-performed', scriptSha256: hash(fs.readFileSync(__filename)) };
fs.writeFileSync(path.join(__dirname, 'ACCENT-PLAN-v2.json'), JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ oldPunch: plan.oldPunch, accents: plan.accents.map(item => ({ id: item.id, trimStart: item.trimStart,
  duration: item.duration, gainDb: item.gainDb, strongOnsetAfterTrim: item.sourceAudit.strongOnsetAfterTrim })) }));
