/* Reproducible static publication. No native master is ever modified. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../..');
const PRIVATE = 'art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/package';
const REPORT = 'docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/package';
const DEFAULT_SOURCE = 'anime/motion-comics/projects/blue-purple-pages01-21-v10.json';
const SELECTION = 'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/SELECTION.json';
const RUNTIME = ['reader.css', 'reader.js', 'core.js', 'effects.js', 'layers.js', 'sequence.js', 'assets/holt-display.woff2', 'assets/holt-text.woff2', 'assets/barlow-LICENSE.txt', 'assets/big-shoulders-LICENSE.txt', 'assets/ATTRIBUTION.md'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const json = data => Buffer.from(`${JSON.stringify(data, null, 2)}\n`);
const slash = value => value.replaceAll('\\', '/');
function inside(root, file) { const rel = path.relative(root, file); return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`)); }
function exact(file, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (fs.existsSync(file)) { if (!fs.readFileSync(file).equals(bytes)) throw Error(`Refus de remplacer un fichier différent : ${file}`); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes, { flag: 'wx' });
}
function local(root, rel) {
  if (typeof rel !== 'string' || !rel || /[\\?#\x00-\x1f]/.test(rel) || path.isAbsolute(rel) || /^[a-z]+:/i.test(rel)) throw Error(`Chemin local invalide : ${rel}`);
  const target = path.resolve(root, rel);
  if (!inside(root, target) || !fs.statSync(target).isFile() || !inside(fs.realpathSync(root), fs.realpathSync(target))) throw Error(`Chemin inaccessible : ${rel}`);
  return target;
}
function walk(folder, prefix = '') {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const rel = prefix + entry.name;
    if (entry.isSymbolicLink()) throw Error(`Lien interdit : ${rel}`);
    return entry.isDirectory() ? walk(path.join(folder, entry.name), `${rel}/`) : [rel];
  }).sort();
}
function webpDimensions(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw Error('WebP attendu.');
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4), size = bytes.readUInt32LE(offset + 4);
    if (type === 'VP8L' && size >= 5 && bytes[offset + 8] === 0x2f) { const bits = bytes.readUInt32LE(offset + 9); return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) }; }
    offset += 8 + size + (size % 2);
  }
  throw Error('Image WebP sans perte requise.');
}
function publicAPIs(folder) {
  const context = { module: { exports: {} } }; vm.runInNewContext(fs.readFileSync(local(folder, 'core.js'), 'utf8'), context); const core = context.module.exports;
  context.module = { exports: {} }; context.require = name => { if (name !== './core.js') throw Error('Dépendance moteur inattendue.'); return core; }; vm.runInNewContext(fs.readFileSync(local(folder, 'sequence.js'), 'utf8'), context);
  return { core, sequence: context.module.exports };
}
function timelineSignature(timeline) { return hash(json({ duration: timeline.duration, pages: timeline.pages, tracks: timeline.tracks })); }
function narrativeSignature(chapter, pages, core) {
  const normalized = cleanMetadata(structuredClone(chapter)); delete normalized.loadingMode;
  normalized.pages = normalized.pages.map(page => ({ id: page.id }));
  if (normalized.music) normalized.music.audio = 'asset';
  return hash(json({ chapter: normalized, pages: pages.map(page => cleanMetadata(core.rebaseAssets(page, () => 'asset'))) }));
}
function verify(folder) {
  folder = path.resolve(folder); const inventory = read(local(folder, 'PUBLICATION.json'));
  if (inventory.schemaVersion !== 1 || inventory.kind !== 'holt-static-comic-publication' || inventory.version !== 10 || !Array.isArray(inventory.files)) throw Error('Inventaire de publication invalide.');
  const listed = new Map();
  for (const item of inventory.files) {
    if (listed.has(item.path) || item.path === 'PUBLICATION.json' || !/^[a-f0-9]{64}$/.test(item.sha256)) throw Error('Entrée inventaire invalide.');
    const data = fs.readFileSync(local(folder, item.path));
    if (data.length !== item.bytes || hash(data) !== item.sha256) throw Error(`Empreinte différente : ${item.path}`);
    if (item.path.startsWith('media/') && !new RegExp(`^media/${item.sha256}\\.(?:webp|svg|mp3|m4a)$`).test(item.path)) throw Error('Nom de média non lié à son contenu.');
    listed.set(item.path, item);
  }
  if (JSON.stringify(walk(folder)) !== JSON.stringify([...listed.keys(), 'PUBLICATION.json'].sort())) throw Error('Fichiers manquants ou non inventoriés.');
  const { core, sequence } = publicAPIs(folder), chapter = read(local(folder, inventory.chapter)); sequence.assertSequence(chapter);
  if (chapter.loadingMode !== 'progressive' || chapter.version !== 10 || chapter.pages.length !== 22) throw Error('Chapitre progressif v10 complet requis.');
  const referenced = new Set(['index.html', 'chapter.json', ...RUNTIME]);
  const asset = (base, rel) => { const target = local(folder, slash(path.relative(folder, path.resolve(base, rel)))), name = slash(path.relative(folder, target)); if (!listed.has(name)) throw Error('Média absent de l’inventaire.'); referenced.add(name); return target; };
  const pages = chapter.pages.map(page => {
    const file = asset(folder, page.manifest); const data = read(file); core.assertManifest(data);
    for (const rel of core.assetPaths(data)) asset(path.dirname(file), rel);
    asset(folder, page.thumbnail); return data;
  });
  if (chapter.music) asset(folder, chapter.music.audio);
  const timeline = sequence.buildSequence(chapter, pages);
  if (Math.abs(timeline.duration - 584.3) > 1e-6 || timeline.tracks.length !== 99 || timelineSignature(timeline) !== inventory.timelineSha256 || inventory.duration !== timeline.duration || inventory.voices !== 99 || inventory.pages !== 22) throw Error('Chronologie ou voix différentes.');
  if (narrativeSignature(chapter, pages, core) !== inventory.narrativeSha256) throw Error('Contenu narratif différent.');
  if (!Array.isArray(inventory.thumbnails) || inventory.thumbnails.length !== 22 || inventory.thumbnails.some((item, index) => item.id !== chapter.pages[index].id || item.path !== chapter.pages[index].thumbnail || item.sha256 !== listed.get(item.path)?.sha256 || !/^[a-f0-9]{64}$/.test(item.sourceSha256) || item.width !== 240 || item.height !== 360 || item.ambientSeconds !== 0 || Math.abs(item.atSeconds - timeline.pages[index].start - 0.001) > 1e-7)) throw Error('Miniatures initiales ou provenance invalides.');
  const html = fs.readFileSync(local(folder, 'index.html'), 'utf8');
  if (!/data-manifest=["']chapter\.json["']/.test(html)) throw Error('Point d’entrée chapter.json absent.');
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) if (!match[1].startsWith('#')) asset(folder, match[1]);
  if (JSON.stringify([...listed.keys()].sort()) !== JSON.stringify([...referenced].sort())) throw Error('Fichier public orphelin ou composant lecteur manquant.');
  for (const file of listed.keys()) {
    if (file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.css')) {
      const text = fs.readFileSync(local(folder, file), 'utf8');
      if (/art-masters[\\/]|localhost|127\.0\.0\.1|[A-Z]:\\|https?:\/\/(?!www\.w3\.org)/i.test(text)) throw Error(`Dépendance privée ou distante : ${file}`);
    }
    if (file.endsWith('.svg')) for (const m of fs.readFileSync(local(folder, file), 'utf8').matchAll(/(?:href=["']|url\(["']?)([^"')]+)/g)) if (!m[1].startsWith('data:') && !m[1].startsWith('#')) throw Error(`SVG externe : ${file}`);
  }
  for (const mapping of inventory.mappings) {
    if (!listed.has(mapping.path) || listed.get(mapping.path).sha256 !== mapping.sha256 || !/^[a-f0-9]{64}$/.test(mapping.sourceSha256)) throw Error('Correspondance source/public invalide.');
    if (mapping.image) { const size = webpDimensions(fs.readFileSync(local(folder, mapping.path))); if (size.width !== mapping.image.width || size.height !== mapping.image.height || mapping.image.exact !== true || !/^[a-f0-9]{64}$/.test(mapping.image.rgbaSha256)) throw Error('Dimensions ou preuve RGBA invalides.'); }
    if (mapping.audio && (mapping.audio.channels !== 2 || Math.abs(mapping.audio.targetDuration - mapping.audio.sourceDuration) > 0.06 || Math.abs(mapping.audio.targetMeanDb - mapping.audio.sourceMeanDb) > 0.25)) throw Error('Transformation audio invalide.');
  }
  return { status: 'verified', files: listed.size + 1, pages: 22, voices: 99, duration: timeline.duration, publicationSha256: hash(fs.readFileSync(path.join(folder, 'PUBLICATION.json'))) };
}
function options(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) { const key = args[i]; if (['--prepare', '--prepare-thumbnails', '--runtime-ready'].includes(key)) result[key.slice(2)] = true; else if (['--source', '--out', '--check', '--ffmpeg', '--native-url'].includes(key) && args[i + 1]) result[key.slice(2)] = args[++i]; else throw Error(`Option inconnue : ${key}`); }
  return result;
}
function safeOutput(value) {
  const allowed = path.join(ROOT, 'public/comics/blue-purple'), target = path.resolve(ROOT, value);
  if (path.dirname(target) !== allowed || !/^v\d+$/.test(path.basename(target))) throw Error('Sortie autorisée : public/comics/blue-purple/vN uniquement.');
  let parent = target; while (!fs.existsSync(parent)) parent = path.dirname(parent);
  if (!inside(fs.realpathSync(ROOT), fs.realpathSync(parent))) throw Error('Sortie hors dépôt.');
  const expectedParent = path.resolve(fs.realpathSync(ROOT), path.relative(ROOT, parent));
  if (fs.realpathSync(parent).toLowerCase() !== expectedParent.toLowerCase()) throw Error('La sortie de publication ne peut pas traverser une jonction.');
  if (fs.existsSync(target) && walk(target).some(file => !/^(?:media\/[a-f0-9]{64}\.(?:webp|svg|mp3|m4a)|pages\/[a-z0-9-]+\.json|assets\/[a-zA-Z0-9.-]+|(?:index\.html|chapter\.json|PUBLICATION\.json|reader\.css|reader\.js|core\.js|effects\.js|layers\.js|sequence\.js))$/.test(file))) throw Error('La sortie contient des fichiers étrangers.');
  fs.mkdirSync(target, { recursive: true }); return target;
}
function cleanMetadata(value) {
  if (Array.isArray(value)) return value.map(cleanMetadata);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key, item]) => !['provenance', 'source', 'review', 'sourceAudio', 'takeJournal', 'rawMeasurement'].includes(key) && !(typeof item === 'string' && /art-masters[\\/]|docs[\\/]|[A-Z]:[\\/]/i.test(item))).map(([key, item]) => [key, cleanMetadata(item)]));
  return value;
}
async function build(opts) {
  const { readDocument } = require('./sequence.cjs'), core = require('./core.js'), sequence = require('./sequence.js');
  const project = readDocument(path.resolve(ROOT, opts.source ?? DEFAULT_SOURCE));
  const selection = read(path.join(ROOT, SELECTION));
  if (hash(fs.readFileSync(project.manifestFile)) !== selection.selectedSha256 || selection.files.length !== 317) throw Error('La source ne correspond pas à la sélection v10 figée.');
  for (const item of selection.files) if (hash(fs.readFileSync(path.join(ROOT, item.file))) !== item.sha256) throw Error(`Master modifié : ${item.file}`);
  const output = safeOutput(opts.out ?? 'public/comics/blue-purple/v10');
  const privateDir = path.join(ROOT, PRIVATE), reportDir = path.join(ROOT, REPORT), cache = path.join(privateDir, 'cache'); fs.mkdirSync(cache, { recursive: true }); fs.mkdirSync(reportDir, { recursive: true });
  const ffmpeg = opts.ffmpeg ?? process.env.HOLT_FFMPEG ?? path.join(ROOT, 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
  function ff(args, binary = false) { const r = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', ...args], { encoding: binary ? undefined : 'utf8', windowsHide: true, maxBuffer: 512 * 1024 * 1024 }); if (r.error || r.status !== 0) throw Error(r.error?.message ?? String(r.stderr)); return r.stdout; }
  function rgba(file) { return ff(['-i', file, '-map', '0:v:0', '-pix_fmt', 'rgba', '-f', 'hash', '-hash', 'sha256', '-']).trim().split('=').pop(); }
  function pcm(file, mono = false) {
    const args = ['-i', file, '-vn']; if (mono) args.push('-af', 'pan=stereo|c0=c0|c1=c0');
    const bytes = ff([...args, '-ac', '2', '-c:a', 'pcm_f32le', '-f', 'f32le', '-'], true); let sum = 0, peak = 0;
    for (let i = 0; i < bytes.length; i += 4) { const n = bytes.readFloatLE(i); sum += n * n; peak = Math.max(peak, Math.abs(n)); }
    return { samplesPerChannel: bytes.length / 8, meanDb: 10 * Math.log10(sum / (bytes.length / 4)), peakDb: 20 * Math.log10(peak) };
  }
  const media = [...new Set([...project.pages.flatMap(page => page.files), ...(project.musicFile ? [project.musicFile] : [])])]; const mapped = new Map(), mappings = [];
  for (let index = 0; index < media.length; index++) {
    const file = media[index], source = fs.readFileSync(file), sourceSha256 = hash(source), ext = path.extname(file).toLowerCase();
    const profile = ext === '.png' ? 'webp-lossless-v1' : ext === '.wav' ? 'aac192-stereo-unit-v1' : 'byte-exact';
    const targetExt = ext === '.png' ? '.webp' : ext === '.wav' ? '.m4a' : ext;
    const cached = path.join(cache, `${sourceSha256}-${profile}${targetExt}`), metadataFile = `${cached}.json`; let details = {};
    if (!fs.existsSync(metadataFile)) {
      if (ext === '.png') {
        if (!fs.existsSync(cached)) ff(['-n', '-i', file, '-c:v', 'libwebp', '-lossless', '1', '-compression_level', '6', '-pix_fmt', 'bgra', cached]);
        const nativeRgba = rgba(file), webRgba = rgba(cached); if (nativeRgba !== webRgba) throw Error(`RGBA différents : ${file}`);
        details.image = { width: source.readUInt32BE(16), height: source.readUInt32BE(20), rgbaSha256: nativeRgba, exact: true };
      } else if (ext === '.wav') {
        let fmt = 12, channels, sampleRate;
        while (fmt + 8 < source.length) { const length = source.readUInt32LE(fmt + 4); if (source.toString('ascii', fmt, fmt + 4) === 'fmt ') { channels = source.readUInt16LE(fmt + 10); sampleRate = source.readUInt32LE(fmt + 12); break; } fmt += 8 + length + (length % 2); }
        if (![1, 2].includes(channels) || !sampleRate) throw Error('Format WAV non pris en charge.');
        const first = path.join(cache, 'backing-first.m4a');
        if (!fs.existsSync(cached)) {
          if (file === project.musicFile && fs.existsSync(first)) fs.copyFileSync(first, cached, fs.constants.COPYFILE_EXCL);
          else ff(['-n', '-i', file, '-map_metadata', '-1', '-vn', ...(channels === 1 ? ['-af', 'pan=stereo|c0=c0|c1=c0'] : []), '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-ar', String(sampleRate), '-movflags', '+faststart', cached]);
        }
        const before = pcm(file, channels === 1), after = pcm(cached);
        details.audio = { sourceDuration: before.samplesPerChannel / sampleRate, targetDuration: after.samplesPerChannel / sampleRate, sourceMeanDb: before.meanDb, targetMeanDb: after.meanDb, sourcePeakDb: before.peakDb, targetPeakDb: after.peakDb, sourceChannels: channels, channels: 2, sampleRate };
        if (Math.abs(details.audio.targetDuration - details.audio.sourceDuration) > 0.06 || Math.abs(before.meanDb - after.meanDb) > 0.25) throw Error(`Durée ou niveau audio différent : ${file}`);
        const bytes = fs.readFileSync(cached); if (bytes.indexOf(Buffer.from('moov')) > bytes.indexOf(Buffer.from('mdat'))) throw Error('AAC faststart absent.');
      } else exact(cached, source);
      exact(metadataFile, json(details));
    } else details = read(metadataFile);
    const bytes = fs.readFileSync(cached), sha256 = hash(bytes), published = `media/${sha256}${targetExt}`; exact(path.join(output, published), bytes);
    mapped.set(file, published); mappings.push({ sourceSha256, path: published, sha256, sourceBytes: source.length, bytes: bytes.length, transform: profile, ...details });
    process.stdout.write(`media ${index + 1}/${media.length} ${ext} ${bytes.length}\n`);
  }
  exact(path.join(reportDir, 'MEDIA-MAPPING.json'), json({ schemaVersion: 1, sourceSha256: selection.selectedSha256, mappings }));
  if (opts.prepare) return { status: 'media-prepared', assets: mappings.length, out: slash(path.relative(ROOT, output)) };
  if (!opts['runtime-ready'] && !opts['prepare-thumbnails']) throw Error('Médias préparés. Attendre le GO moteur puis relancer avec --runtime-ready.');
  if (opts['runtime-ready']) {
    const frozen = read(path.join(ROOT, 'docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/runtime/SELECTION-1.4.0.json'));
    if (frozen.status !== 'frozen-ready-for-public-package' || frozen.engineVersion !== '1.4.0') throw Error('GO moteur figé requis.');
    for (const item of frozen.engine) if (hash(fs.readFileSync(path.join(ROOT, item.file))) !== item.sha256) throw Error(`Moteur différent du GO : ${item.file}`);
  }
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const thumbnails = [], thumbnailProof = [];
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    await page.goto(opts['native-url'] ?? 'http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v10.json');
    await page.waitForFunction(() => window.motionComic?.duration > 0, null, { timeout: 120000 });
    await page.waitForSelector('#reader[data-ready="true"]', { timeout: 120000 });
    await page.evaluate(async () => { await window.motionComic.ensureAllPagesReady(); window.motionComic.pause(); window.motionComic.setRenderMode(true); window.motionComic.setEffects(true); });
    for (let index = 0; index < project.pages.length; index++) {
      const encoded = await page.evaluate(async i => { const api = window.motionComic, t = api.pages[i].start + 0.001; api.seek(t); await api.whenPageReady(i); for (let n = 0; n < 3; n++) api.draw(t, 0); const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 360; canvas.getContext('2d').drawImage(api.pageCanvas, 0, 0, 240, 360); return canvas.toDataURL('image/png').split(',')[1]; }, index);
      const png = path.join(cache, `thumbnail-${selection.selectedSha256}-${index}.png`); exact(png, Buffer.from(encoded, 'base64'));
      const webp = `${png}.webp`; if (!fs.existsSync(webp)) ff(['-n', '-i', png, '-c:v', 'libwebp', '-lossless', '1', '-compression_level', '6', webp]);
      const bytes = fs.readFileSync(webp), dest = `media/${hash(bytes)}.webp`; exact(path.join(output, dest), bytes); thumbnails.push(dest);
      thumbnailProof.push({ id: project.pages[index].id, atSeconds: project.timeline.pages[index].start + 0.001, ambientSeconds: 0, width: 240, height: 360, source: 'reader.pageCanvas initial narrative state, effects enabled', path: dest, sha256: hash(bytes) });
    }
  } finally { await browser.close(); }
  exact(path.join(reportDir, 'THUMBNAILS.json'), json({ schemaVersion: 1, thumbnails: thumbnailProof }));
  if (opts['prepare-thumbnails']) return { status: 'thumbnails-prepared', thumbnails: thumbnails.length };
  const chapter = cleanMetadata(structuredClone(project.data)); chapter.loadingMode = 'progressive';
  chapter.pages = chapter.pages.map((descriptor, index) => {
    const original = project.pages[index], data = cleanMetadata(core.rebaseAssets(original.data, rel => `../${mapped.get(path.resolve(path.dirname(original.manifestFile), rel))}`));
    const manifest = `pages/${descriptor.id}.json`; exact(path.join(output, manifest), json(data)); return { ...descriptor, manifest, thumbnail: thumbnails[index] };
  });
  if (chapter.music) chapter.music.audio = mapped.get(project.musicFile);
  exact(path.join(output, 'chapter.json'), json(chapter));
  for (const rel of RUNTIME) exact(path.join(output, rel), fs.readFileSync(path.join(__dirname, rel)));
  const html = fs.readFileSync(path.join(__dirname, 'reader.html'), 'utf8').replace('<html lang="fr">', '<html lang="fr" data-manifest="chapter.json">'); exact(path.join(output, 'index.html'), html);
  exact(path.join(path.dirname(output), 'index.html'), '<!doctype html>\n<html lang="fr"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./v10/"><title>HOLT — Blue Purple</title><a href="./v10/">Lire Blue Purple</a></html>\n');
  const publicPages = chapter.pages.map(p => read(path.join(output, p.manifest))), timeline = sequence.buildSequence(chapter, publicPages);
  if (Math.abs(timeline.duration - project.timeline.duration) > 1e-8 || timeline.tracks.length !== project.timeline.tracks.length) throw Error('Chronologie de publication différente.');
  const expectedTracks = project.timeline.tracks.map(({ audioFile, ...track }) => ({ ...track, audio: `../${mapped.get(audioFile)}` }));
  if (JSON.stringify(expectedTracks) !== JSON.stringify(timeline.tracks)) throw Error('Raccord des 99 voix différent de la sélection native.');
  const narrativeSha256 = narrativeSignature(chapter, publicPages, core);
  if (narrativeSha256 !== narrativeSignature(project.data, project.pages.map(page => page.data), core)) throw Error('Contenu narratif modifié pendant le packaging.');
  const files = walk(output).filter(file => file !== 'PUBLICATION.json').map(file => { const data = fs.readFileSync(path.join(output, file)); return { path: file, sha256: hash(data), bytes: data.length, kind: file.startsWith('media/') ? 'media' : file.startsWith('pages/') ? 'page' : 'reader' }; });
  const initialFrames = thumbnailProof.map((thumb, index) => ({ ...thumb, sourceSha256: hash(fs.readFileSync(path.join(cache, `thumbnail-${selection.selectedSha256}-${index}.png`))) }));
  const inventory = { schemaVersion: 1, kind: 'holt-static-comic-publication', version: 10, chapter: 'chapter.json', duration: timeline.duration, pages: 22, voices: 99, source: { sequenceSha256: selection.selectedSha256, selectionSha256: hash(fs.readFileSync(path.join(ROOT, SELECTION))) }, engineVersion: read(path.join(__dirname, 'package.json')).version, timelineSha256: timelineSignature(timeline), narrativeSha256, thumbnails: initialFrames, files, mappings };
  exact(path.join(output, 'PUBLICATION.json'), json(inventory));
  const result = verify(output); exact(path.join(reportDir, 'PACKAGE-REPORT.json'), json(result)); return result;
}
async function main() {
  if (process.argv.length === 2) { console.log('Usage: node anime/motion-comics/publish.cjs --source <v10.json> --out public/comics/blue-purple/v10 [--prepare | --prepare-thumbnails | --runtime-ready]\n       node anime/motion-comics/publish.cjs --check <directory>\nBuild requires native masters + FFmpeg; --check is offline and requires only the public directory.'); return; }
  const opts = options(process.argv.slice(2)); const result = opts.check ? verify(opts.check) : await build(opts); console.log(JSON.stringify(result));
}
if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 1; });
module.exports = { verify };
