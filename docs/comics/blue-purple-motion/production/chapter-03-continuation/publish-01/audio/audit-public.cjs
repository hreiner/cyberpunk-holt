/* Independent checks of the final packaged audio. Run only after the packager GO. */
const fs = require('node:fs');
const path = require('node:path');
const metrics = require('./stream-metrics.cjs');
const { ROOT, FFMPEG, relative, hash, probe, measure, faststart, envelopeCorrelation, floatStats, stereoFilter, shortPcm, waveformLag } = metrics;
const { readDocument } = require(path.join(ROOT, 'anime/motion-comics/sequence.cjs'));
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const sourceFile = path.join(ROOT, 'anime/motion-comics/projects/blue-purple-pages01-21-v10.json');
const packageRoot = path.resolve(ROOT, option('--package', 'public/comics/blue-purple/v10'));
const output = path.resolve(ROOT, option('--output', 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/audio/audit-v1'));
const ownedRoot = path.resolve(ROOT, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/audio');
if (path.isAbsolute(path.relative(ownedRoot, output)) || path.relative(ownedRoot, output).startsWith('..') || output === ownedRoot) throw Error('Un nouveau sous-dossier audio de publication est requis.');
if (fs.existsSync(output)) throw Error('Audit existant conservé ; utiliser un nouveau dossier.');
if (!args.includes('--packager-go')) throw Error('Le GO du packager figé doit être confirmé avec --packager-go.');
const mappingOnly = args.includes('--mapping-only');
const publicationFile = mappingOnly ? path.join(__dirname, '../package/MEDIA-MAPPING.json') : path.join(packageRoot, 'PUBLICATION.json');
const publication = JSON.parse(fs.readFileSync(publicationFile));
const publicFile = path.join(packageRoot, publication.chapter ?? 'chapter.json');
const original = readDocument(sourceFile);
function mappedAudio(source) {
  const mapping = publication.mappings.find(item => item.sourceSha256 === hash(source));
  if (!mapping) throw Error(`Mapping audio absent : ${relative(source)}`);
  return path.resolve(packageRoot, mapping.path);
}
const published = mappingOnly ? { ...original, musicFile: mappedAudio(original.musicFile),
  timeline: { ...original.timeline, tracks: original.timeline.tracks.map(track => ({ ...track, audioFile: mappedAudio(track.audioFile) })) } } : readDocument(publicFile);
const errors = [], warnings = [];
const check = (condition, text) => { if (!condition) errors.push(text); return Boolean(condition); };
const close = (left, right) => Math.abs(left - right) < 1e-7;
const report = { schemaVersion: 1, startedAt: new Date().toISOString(), status: 'running',
  source: relative(sourceFile), sourceSha256: hash(sourceFile), publication: relative(publicationFile), publicationSha256: hash(publicationFile),
  chapter: relative(publicFile), chapterSha256: mappingOnly ? null : hash(publicFile), timelinePendingFinalChapter: mappingOnly,
  scripts: [__filename, path.join(__dirname, 'stream-metrics.cjs'), path.join(ROOT, 'anime/motion-comics/audio.cjs')].map(file => ({ file: relative(file), sha256: hash(file) })),
  method: 'Serial bounded-memory decoding at44.1kHz stereo float; mono unity-pan from shared audio.cjs. Public compressed media summed without automatic normalization or second ducking. No full-film/full-chapter mix export.',
  humanListening: 'not-performed', newProviderCalls: 0, timeline: {}, media: [], windows: [], transients: [], errors, warnings };
fs.mkdirSync(output, { recursive: true });
const write = (name, value) => fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n');
const heartbeat = message => { console.log(message); write('IN-PROGRESS.json', { time: new Date().toISOString(), message, media: report.media.length, windows: report.windows.length }); };
function compact(value) { const { envelope10ms: _envelope, ...rest } = value; return rest; }
function cueRows(document) {
  return document.pages.flatMap(page => page.data.panels.flatMap(panel => (panel.cues ?? []).map(cue => ({
    page: page.id, panel: panel.id, id: cue.id, speaker: cue.speaker ?? '', duration: cue.duration, textFr: cue.textFr, textEn: cue.textEn,
  }))));
}
const canonicalTracks = document => document.timeline.tracks.map(({ audio: _audio, audioFile: _audioFile, ...track }) => track);
report.timeline = { status: mappingOnly ? 'source-v10-used-for-measurement-final-chapter-pending' : 'final-public-chapter-checked',
  pages: published.pages.length, voices: published.timeline.tracks.length, duration: published.timeline.duration,
  samePages: check(JSON.stringify(original.timeline.pages) === JSON.stringify(published.timeline.pages), 'Chronologie des pages différente.'),
  sameSegments: check(JSON.stringify(original.timeline.segments) === JSON.stringify(published.timeline.segments), 'Chronologie des cases différente.'),
  sameTracks: check(JSON.stringify(canonicalTracks(original)) === JSON.stringify(canonicalTracks(published)), 'Temps des prises différents.'),
  sameCueTextsAndDurations: check(JSON.stringify(cueRows(original)) === JSON.stringify(cueRows(published)), 'Textes, identités ou durées des cues différents.'),
  premixedUnity: check(published.data.music?.preMixed === true && published.data.music?.gain === 1, 'Le fond prémixé doit rester à gain1.'),
  fixed584Point3: check(close(published.timeline.duration, 584.3), 'Durée finale différente de584,3s.'),
  fixed99Voices: check(published.timeline.tracks.length === 99, 'Nombre de prises différent de99.'),
  fixed22Pages: check(published.pages.length === 22, 'Nombre de pages différent de22avec couverture.') };
const mediaMap = new Map();
function addMedia(source, target, track = null) {
  const sourceSha256 = hash(source), targetSha256 = hash(target), publicPath = path.relative(packageRoot, target).replaceAll('\\', '/');
  const mapping = publication.mappings.find(item => item.sourceSha256 === sourceSha256 && item.path === publicPath && item.sha256 === targetSha256);
  check(Boolean(mapping), `Mapping absent ou incorrect : ${publicPath}`);
  const key = sourceSha256 + '\0' + targetSha256;
  if (!mediaMap.has(key)) mediaMap.set(key, { source, target, sourceSha256, targetSha256, mapping, publicPath, tracks: [], backing: false });
  const row = mediaMap.get(key);
  if (track) row.tracks.push(track); else row.backing = true;
}
original.timeline.tracks.forEach((track, index) => addMedia(track.audioFile, published.timeline.tracks[index].audioFile, published.timeline.tracks[index]));
addMedia(original.musicFile, published.musicFile);
async function auditMedia(row) {
  const sourceMetadata = probe(row.source), targetMetadata = probe(row.target), copied = row.sourceSha256 === row.targetSha256;
  const source = copied ? null : await measure(row.source, { envelope: true, loudness: row.backing });
  const target = await measure(row.target, { envelope: !copied, limitFrames: source?.frames, loudness: row.backing });
  const needed = row.backing ? published.timeline.duration : Math.max(...row.tracks.map(track => track.end - track.start));
  const result = { sourceFile: relative(row.source), target: row.publicPath, sourceSha256: row.sourceSha256, targetSha256: row.targetSha256,
    transform: row.mapping?.transform, copied, backing: row.backing, cueCount: row.tracks.length, neededSeconds: needed,
    sourceMetadata, targetMetadata, source: { file: relative(row.source), metadata: sourceMetadata, ...(source ? compact(source) : { byteIdenticalToTarget: true }) },
    targetMeasurement: compact(target),
    durationEnough: check(target.duration + .001 >= needed, `Audio tronqué pour la cue : ${row.publicPath}`),
    zeroClippedSamples: check(target.clippedSamples === 0, `Échantillons saturés dans le média public : ${row.publicPath}`) };
  if (path.extname(row.source).toLowerCase() === '.mp3') result.mp3Exact = check(copied, `MP3 non identique : ${row.publicPath}`);
  if (!copied) {
    result.aacStereo = check(targetMetadata.codec === 'aac' && targetMetadata.channels === 2, `Dérivé AAC stéréo attendu : ${row.publicPath}`);
    result.faststart = faststart(row.target); check(result.faststart.moovBeforeMdat, `AAC sans faststart : ${row.publicPath}`);
    result.durationDifference = target.duration - source.duration;
    result.rmsGainDb = target.commonRmsDb - source.rmsDb;
    result.envelopeCorrelation = envelopeCorrelation(source.envelope10ms, target.envelope10ms);
    result.durationPreserved = check(result.durationDifference >= -.001 && result.durationDifference <= .050, `Durée décodée dérivée inattendue : ${row.publicPath}`);
    result.unityGain = check(Math.abs(result.rmsGainDb) < .2, `Gain conversion inattendu : ${row.publicPath} (${result.rmsGainDb}dB)`);
    result.envelopeAligned = check(result.envelopeCorrelation > .98, `Enveloppe déplacée ou altérée : ${row.publicPath}`);
    if (sourceMetadata.channels === 1) result.monoUnityStereo = check(Math.abs(target.channelRmsDb[0] - target.channelRmsDb[1]) < .05 && result.unityGain, `Gain ou équilibre mono vers stéréo incorrect : ${row.publicPath}`);
  }
  row.measurement = result; report.media.push(result);
}
function nearbyTrackWindow(center, seconds = 8) {
  let start = Math.max(0, center - seconds / 2), end = Math.min(published.timeline.duration, center + seconds / 2);
  for (const track of published.timeline.tracks) {
    if (track.start < start && track.end > start) start = track.start - .05;
    if (track.start < end && track.end > end) end = track.end + .05;
  }
  return { start, duration: end - start };
}
async function mixedWindow(spec) {
  const start = Math.max(0, spec.start), end = Math.min(published.timeline.duration, start + spec.duration), duration = end - start;
  const tracks = published.timeline.tracks.filter(track => track.start < end && track.end > start);
  const argv = [], filters = [], labels = [];
  for (const [index, track] of tracks.entries()) {
    argv.push('-i', track.audioFile);
    const offset = Math.max(0, start - track.start), used = Math.min(track.end, end) - Math.max(start, track.start);
    filters.push(`[${index}:a]atrim=start=${offset}:duration=${used},asetpts=PTS-STARTPTS,${stereoFilter(track.audioFile, FFMPEG)},adelay=${Math.round(Math.max(0, track.start - start) * 1000)}:all=1[v${index}]`);
    labels.push(`[v${index}]`);
  }
  argv.push('-i', published.musicFile);
  filters.push(`[${tracks.length}:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,${stereoFilter(published.musicFile, FFMPEG)},volume=1[bed]`);
  labels.push('[bed]');
  filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0,apad=whole_dur=${duration},atrim=duration=${duration},ebur128=peak=true[mix]`);
  argv.push('-filter_complex_threads', '1', '-filter_complex', filters.join(';'), '-map', '[mix]', '-t', String(duration));
  const measurement = await floatStats(argv, { loudness: true });
  const result = { id: spec.id, purpose: spec.purpose, start, duration, voiceCount: tracks.length,
    tracks: tracks.map(track => ({ page: track.pageId, speaker: track.speaker, start: track.start, end: track.end, audio: path.relative(packageRoot, track.audioFile).replaceAll('\\', '/') })),
    filterGraph: filters.join(';'), ...measurement, globalPeakSeconds: start + measurement.peakSeconds,
    zeroClippedSamples: check(measurement.clippedSamples === 0, `Somme publique saturée : ${spec.id}`),
    truePeakBelowZero: check(measurement.truePeakDb !== null && measurement.truePeakDb < 0, `True peak public non négatif ou absent : ${spec.id}`) };
  report.windows.push(result); heartbeat(`Fenêtre ${spec.id} : ${measurement.peakDb.toFixed(3)}dBFS, ${measurement.truePeakDb}dBTP`);
}
async function run() {
  if (errors.length) throw Error(errors.join('\n'));
  heartbeat(`${mappingOnly ? 'Chronologie source, raccord final en attente' : 'Chronologie publique conforme'} :22pages,99prises,584,3s. Décodage de${mediaMap.size}médias.`);
  for (const [index, row] of [...mediaMap.values()].entries()) {
    await auditMedia(row);
    if (index % 10 === 0 || row.backing) heartbeat(`Médias décodés : ${index + 1}/${mediaMap.size}`);
  }
  write('MEDIA.json', report.media);
  const legacy = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/legacy-v2/report.json')));
  const acoustic = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/sound/ACOUSTIC-ANCHORS.json')));
  const anchor = id => acoustic.anchors.find(item => item.id === id).globalSeconds;
  const accents = [
    ...['body-impact', 'gun-attack', 'engine-start'].map(id => ({ id, time: 156.6 + legacy.events.find(event => event.id === id)?.start })),
    { id: 'oneShot', time: anchor('oneShot') }, { id: 'residentContact', time: anchor('residentContact') }, { id: 'waterSplash', time: anchor('waterSplash') },
  ];
  for (const accent of accents) {
    if (!Number.isFinite(accent.time)) throw Error(`Ancre de son absente : ${accent.id}`);
    const start = accent.time - .03, duration = .42;
    const correlation = waveformLag(shortPcm(original.musicFile, start, duration), shortPcm(published.musicFile, start, duration));
    report.transients.push({ ...accent, start, duration, ...correlation,
      aligned: check(correlation.correlation > .95 && Math.abs(correlation.lagMilliseconds) <= 1, `Transitoire web déplacé : ${accent.id}`),
      note: 'Native premixed backing versus decoded published backing, before voice sum; verifies derivative alignment without confusing an overlapping voice.' });
  }
  const nativeSelection = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/sound/SELECTION.json')));
  const nativeStrongest = await measure(path.join(ROOT, nativeSelection.aac.file));
  report.nativeStrongestReference = { file: nativeSelection.aac.file, sha256: hash(path.join(ROOT, nativeSelection.aac.file)), peakSeconds: nativeStrongest.peakSeconds, globalPeakSeconds: 238.6 + nativeStrongest.peakSeconds };
  const loudest = [...mediaMap.values()].filter(row => !row.backing).sort((left, right) => right.measurement.targetMeasurement.peakDb - left.measurement.targetMeasurement.peakDb);
  const windows = [
    { id: 'native-loudest', purpose: 'Crête la plus forte du lot natif approuvé, rejouée avec les dérivés publics.', ...nearbyTrackWindow(report.nativeStrongestReference.globalPeakSeconds, 7) },
    { id: 'john-punch-and-shot', purpose: 'Accents conservés pages5–8 : coup et tir.', start: 164, duration: 13 },
    { id: 'starter-page08', purpose: 'Démarreur expressif conservé dans le préfixe.', start: 218, duration: 8 },
    { id: 'ambush-page17', purpose: 'Tir unique467,853333 ; métal+80ms ; réponseWendy468,313333.', start: 466.3833333333333, duration: 11.658333333333303 },
    { id: 'water-and-door', purpose: 'Plouf550,828333 avec répliqueJohn, puis ferrure et deux battants du refuge.', start: 549.1083333333333, duration: 18.53333333333336 },
    ...loudest.slice(0, 3).map((row, index) => ({ id: `loudest-voice-${index + 1}`, purpose: 'Une des trois prises publiques à la crête la plus élevée, avec son fond réel.', ...nearbyTrackWindow(row.tracks[0].start + row.measurement.targetMeasurement.peakSeconds, 6) })),
  ];
  for (const window of windows) await mixedWindow(window);
  report.scope = { measuredMediaCount: report.media.length, measuredWindows: report.windows.length, measuredWindowSeconds: report.windows.reduce((sum, item) => sum + item.duration, 0),
    allPublishedVoicesDecoded: true, completePublishedBackingDecoded: true, fullChapterSumRendered: false,
    limitations: ['Pas d’écoute humaine.', 'La somme voix+fond est contrôlée sur les fenêtres décisives, pas sur toutes les584,3s.', 'Le navigateur et la fréquence du périphérique peuvent ajouter un rééchantillonnage ; la mesure float est faite à44,1kHz.', 'Les dérivés AAC ne sont pas identiques en PCM aux masters ; les durées, gains, enveloppes et provenance sont mesurés séparément.'] };
  report.status = errors.length ? 'failed' : mappingOnly ? 'audio-passed-awaiting-final-chapter' : 'passed'; report.finishedAt = new Date().toISOString();
  write('REPORT.json', report); heartbeat(`Audit ${report.status} ; ${errors.length}erreurs ; ${warnings.length}notes.`);
  if (errors.length) throw Error(errors.join('\n'));
}
run().catch(error => { report.status = 'failed'; report.finishedAt = new Date().toISOString(); report.failure = error.message; write('REPORT.json', report); console.error(error.message); process.exitCode = 1; });
