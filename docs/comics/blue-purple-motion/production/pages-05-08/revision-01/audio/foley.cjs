/* global __filename */
// Trois petits compléments locaux ; les six bruitages principaux restent ElevenLabs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT, RATE, frameAt, writeWave } = require('./mix-engine.cjs');
const folder = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/foley-local-v1');
if (fs.existsSync(folder)) throw Error('Foley existant conservé.');
fs.mkdirSync(folder);
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
let state = 742901;
function noise() { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2147483648 - 1; }
function impulse(time, start, decay, frequency, amplitude) {
  const t = time - start;
  return t < 0 ? 0 : Math.exp(-t / decay) * Math.sin(2 * Math.PI * frequency * t) * amplitude;
}
const sounds = [];
for (const spec of [{ id: 'lock-click', duration: .32, peakDb: -20 },
  { id: 'gate-latch', duration: .72, peakDb: -21 }, { id: 'car-door-close', duration: .65, peakDb: -18 }]) {
  const frames = frameAt(spec.duration), data = new Float32Array(frames * 2);
  let peak = 0;
  for (let frame = 0; frame < frames; frame++) {
    const t = frame / RATE, n = noise();
    let value;
    if (spec.id === 'lock-click') value = impulse(t, .006, .017, 1870, .55) + impulse(t, .032, .026, 3200, .23) + n * Math.exp(-t / .014) * .3;
    else if (spec.id === 'gate-latch') value = impulse(t, .006, .023, 670, .45) + impulse(t, .06, .05, 1320, .23) + Math.sin(2 * Math.PI * (880 * t + 105 * t * t)) * Math.exp(-t / .19) * .08 + n * Math.exp(-t / .025) * .22;
    else value = impulse(t, .006, .048, 119, .46) + impulse(t, .009, .027, 260, .3) + impulse(t, .014, .012, 1750, .22) + n * Math.exp(-t / .028) * .35;
    const edge = Math.min(1, frame / 110, (frames - frame) / 300);
    data[frame * 2] = data[frame * 2 + 1] = value * edge;
    peak = Math.max(peak, Math.abs(value * edge));
  }
  const gain = Math.pow(10, spec.peakDb / 20) / peak;
  for (let index = 0; index < data.length; index++) data[index] *= gain;
  const target = path.join(folder, `${spec.id}.wav`), measures = writeWave(target, data);
  sounds.push({ id: spec.id, audio: path.relative(ROOT, target).replaceAll('\\', '/'), sha256: hash(fs.readFileSync(target)),
    provider: 'local-procedural', source: 'audio/foley.cjs : résonances amorties et bruit déterministe seed742901, aucun échantillon externe.',
    requestCount: 0, actualCost: 0, model: null, humanListening: 'not-performed', ...measures });
}
const report = { schemaVersion: 1, date: '2026-11-05', provenance: 'Compléments locaux explicitement distincts des six SFX ElevenLabs.',
  engineSha256: hash(fs.readFileSync(__filename)), seed: 742901, humanListening: 'not-performed', sounds };
fs.writeFileSync(path.join(folder, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ folder: path.relative(ROOT, folder), sounds: sounds.length, paidCalls: 0 }));
