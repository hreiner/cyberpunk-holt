/* Restore the pinned public comic bundle; no masters, media encoders or credentials. */
/* global AbortSignal */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_CONFIG = path.join(__dirname, 'web-release.json');
const RELEASE_PREFIX = '/hreiner/cyberpunk-holt/releases/download/';
const HASH = /^[a-f\d]{64}$/i;
const fail = message => { throw new Error(message); };
const hashFile = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inside = (root, file) => {
  const relative = path.relative(root, file);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};
function relativeName(value, label) {
  if (typeof value !== 'string' || !value || /[\\:]/.test(value) || [...value].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127) || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) fail(`${label} : chemin relatif simple requis.`);
  const parts = value.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) fail(`${label} : composant de chemin interdit.`);
  return value;
}
function validateConfig(input) {
  if (!input || input.schemaVersion !== 1 || !Number.isSafeInteger(input.version) || input.version < 1) fail('Configuration de publication : schemaVersion1 et version positive requis.');
  const directory = `public/comics/blue-purple/v${input.version}`;
  if (relativeName(input.directory, 'directory') !== directory) fail('directory doit désigner exactement la version Blue Purple sous public/comics.');
  relativeName(input.sourceManifest, 'sourceManifest');
  if (!HASH.test(input.sourceSha256 ?? '') || !HASH.test(input.publicationSha256 ?? '')) fail('Empreintes SHA-256 source/publication requises.');
  const release = input.release;
  if (!release || typeof release.tag !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(release.tag) || release.tag.includes('..')) fail('Tag de release invalide.');
  if (!HASH.test(release.sha256 ?? '') || !Number.isSafeInteger(release.bytes) || release.bytes <= 0) fail('Taille et SHA-256 de release requis.');
  let url;
  try { url = new URL(release.url); } catch { fail('URL de release invalide.'); }
  const expected = `${RELEASE_PREFIX}${encodeURIComponent(release.tag)}/`;
  const asset = url.pathname.slice(expected.length);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash ||
      !url.pathname.startsWith(expected) || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.tar\.gz$/.test(asset)) fail('La release doit venir de github.com/hreiner/cyberpunk-holt/releases/download/TAG/ARCHIVE.tar.gz.');
  return { schemaVersion: 1, version: input.version, directory, sourceManifest: input.sourceManifest,
    sourceSha256: input.sourceSha256.toLowerCase(), publicationSha256: input.publicationSha256.toLowerCase(),
    release: { tag: release.tag, url: url.href, sha256: release.sha256.toLowerCase(), bytes: release.bytes } };
}
function noLinks(root, target) {
  const base = path.resolve(root), file = path.resolve(target);
  if (!inside(base, file)) fail('Le chemin calculé sort de la copie de travail.');
  const realRoot = fs.realpathSync(base);
  let current = base;
  for (const component of path.relative(base, file).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    if (!fs.existsSync(current)) {
      // existsSync is false for a dangling symlink; lstat must still reject it.
      try { if (fs.lstatSync(current).isSymbolicLink()) fail('Un lien dans le chemin de publication est interdit.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      continue;
    }
    if (fs.lstatSync(current).isSymbolicLink() || !inside(realRoot, fs.realpathSync(current))) fail('Un lien ou une sortie du dépôt dans le chemin de publication est interdit.');
  }
  return file;
}
function paths(config, root) {
  const base = path.resolve(root), directory = noLinks(base, path.resolve(base, config.directory));
  return { root: base, directory, parent: path.dirname(directory), folder: `v${config.version}` };
}
function runPublicationCheck(directory) {
  return execFileSync(process.execPath, [path.join(__dirname, 'publish.cjs'), '--check', directory], {
    encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
}
async function verifyPublication(directory, config, checker = runPublicationCheck) {
  const publication = path.join(directory, 'PUBLICATION.json');
  if (!fs.existsSync(publication) || !fs.lstatSync(publication).isFile() || fs.lstatSync(publication).isSymbolicLink()) fail('PUBLICATION.json absent ou non régulier.');
  if (hashFile(publication) !== config.publicationSha256) fail('PUBLICATION.json diverge de la publication épinglée.');
  const data = JSON.parse(fs.readFileSync(publication, 'utf8'));
  if (data.schemaVersion !== 1 || data.kind !== 'holt-static-comic-publication' || data.version !== config.version || data.source?.sequenceSha256 !== config.sourceSha256) fail('Identité de PUBLICATION.json incohérente avec la configuration.');
  await checker(directory, config);
}
function archiveName(value, version, directory = false) {
  if (directory && value.endsWith('/')) value = value.slice(0, -1);
  relativeName(value, 'Archive');
  const folder = `v${version}`;
  if (value !== folder && !value.startsWith(folder + '/')) fail(`Archive : chaque entrée doit être sous ${folder}/.`);
  if (value === folder && !directory) fail('La racine de version doit être un répertoire.');
  return value;
}
function octal(buffer, label) {
  if (buffer.some(value => value > 127)) fail(`Archive : champ ${label} binaire ou non ASCII interdit.`);
  const value = buffer.toString('ascii').replace(/\0.*$/, '').trim();
  if (!/^[0-7]+$/.test(value)) fail(`Archive : champ ${label} octal invalide.`);
  const parsed = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(parsed) || parsed < 0) fail(`Archive : champ ${label} trop grand.`);
  return parsed;
}
function tarString(buffer, label) {
  const zero = buffer.indexOf(0), bytes = zero < 0 ? buffer : buffer.subarray(0, zero);
  const value = bytes.toString('utf8');
  if (!Buffer.from(value, 'utf8').equals(bytes)) fail(`Archive : ${label} UTF-8 invalide.`);
  return value;
}
async function inspectArchive(file, version) {
  const input = fs.createReadStream(file), stream = input.pipe(zlib.createGunzip());
  input.on('error', error => stream.destroy(error));
  const header = Buffer.alloc(512), entries = [], seen = new Map();
  let offset = 0, body = 0, padding = 0, zeroBlocks = 0;
  try {
    for await (const raw of stream) {
      const chunk = Buffer.from(raw); let cursor = 0;
      while (cursor < chunk.length) {
        if (zeroBlocks >= 2) { if (chunk.subarray(cursor).some(value => value !== 0)) fail('Archive : données après le marqueur de fin.'); break; }
        if (body) { const length = Math.min(body, chunk.length - cursor); body -= length; cursor += length; continue; }
        if (padding) { const length = Math.min(padding, chunk.length - cursor); if (chunk.subarray(cursor, cursor + length).some(value => value !== 0)) fail('Archive : bourrage non nul.'); padding -= length; cursor += length; continue; }
        const length = Math.min(512 - offset, chunk.length - cursor); chunk.copy(header, offset, cursor, cursor + length); offset += length; cursor += length;
        if (offset < 512) continue;
        offset = 0;
        if (header.every(value => value === 0)) { zeroBlocks++; continue; }
        if (zeroBlocks) fail('Archive : marqueur de fin incomplet.');
        const checksum = octal(header.subarray(148, 156), 'checksum');
        const actual = header.reduce((sum, value, index) => sum + (index >= 148 && index < 156 ? 32 : value), 0);
        if (checksum !== actual) fail('Archive : checksum TAR invalide.');
        if (!header.subarray(257, 262).equals(Buffer.from('ustar'))) fail('Archive : format USTAR requis.');
        const type = header[156], isDirectory = type === 53;
        if (type !== 0 && type !== 48 && !isDirectory) fail('Archive : seuls fichiers réguliers et répertoires sont autorisés ; liens et extensions refusés.');
        if (tarString(header.subarray(157, 257), 'lien')) fail('Archive : cible de lien interdite.');
        const name = tarString(header.subarray(0, 100), 'nom'), prefix = tarString(header.subarray(345, 500), 'préfixe');
        const member = archiveName(prefix ? prefix + '/' + name : name, version, isDirectory);
        const canonical = member.toLowerCase();
        if (seen.has(canonical)) fail('Archive : entrée dupliquée ou collision de casse.');
        const size = octal(header.subarray(124, 136), 'taille'), mode = octal(header.subarray(100, 108), 'mode');
        if (mode > 0o7777 || mode & 0o7000) fail('Archive : permissions spéciales interdites.');
        if (isDirectory && size !== 0) fail('Archive : répertoire contenant des données.');
        seen.set(canonical, isDirectory ? 'directory' : 'file'); entries.push({ name: member, directory: isDirectory, size });
        body = size; padding = (512 - size % 512) % 512;
      }
    }
    if (offset || body || padding || zeroBlocks < 2 || !entries.length) fail('Archive TAR tronquée ou vide.');
    for (const entry of entries) { const parts = entry.name.toLowerCase().split('/'); for (let i = 1; i < parts.length; i++) if (seen.get(parts.slice(0, i).join('/')) === 'file') fail('Archive : un fichier est utilisé comme répertoire.'); }
    return entries;
  } finally { input.destroy(); stream.destroy(); }
}
function verifyTarListing(file, entries, version, tar = 'tar') {
  const listed = execFileSync(tar, ['-tzf', file], { encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 }).split(/\r?\n/).filter(Boolean);
  const normalized = listed.map(name => archiveName(name, version, name.endsWith('/'))).sort();
  const expected = entries.map(entry => entry.name).sort();
  if (JSON.stringify(normalized) !== JSON.stringify(expected)) fail('Le listing du tar système diverge des en-têtes contrôlés.');
}
function verifyExtracted(root, entries, version) {
  const actual = new Map();
  function walk(directory) {
    for (const name of fs.readdirSync(directory)) {
      const file = path.join(directory, name), stat = fs.lstatSync(file);
      if (stat.isSymbolicLink() || !inside(fs.realpathSync(root), fs.realpathSync(file)) || (!stat.isFile() && !stat.isDirectory())) fail('Extraction : lien, type ou chemin interdit.');
      const relative = path.relative(root, file).replaceAll('\\', '/'); archiveName(relative, version, stat.isDirectory());
      actual.set(relative, stat); if (stat.isDirectory()) walk(file);
    }
  }
  walk(root);
  for (const entry of entries) { const stat = actual.get(entry.name); if (!stat || stat.isDirectory() !== entry.directory || !entry.directory && stat.size !== entry.size) fail('Extraction : fichier manquant ou taille/type divergent.'); }
  const expected = new Set(entries.map(entry => entry.name));
  for (const entry of entries) { const parts = entry.name.split('/'); for (let i = 1; i < parts.length; i++) expected.add(parts.slice(0, i).join('/')); }
  if ([...actual.keys()].some(name => !expected.has(name))) fail('Extraction : entrée supplémentaire.');
}
async function downloadArchive(config, file, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(config.release.url, { redirect: 'follow', headers: { Accept: 'application/octet-stream' }, signal: AbortSignal.timeout(300000) });
  if (!response.ok || !response.body) fail(`Téléchargement de release refusé (HTTP ${response.status}).`);
  const handle = await fs.promises.open(file, 'wx'), digest = crypto.createHash('sha256'); let bytes = 0;
  try {
    for await (const raw of response.body) {
      const chunk = Buffer.from(raw); bytes += chunk.length;
      if (bytes > config.release.bytes) fail('La taille de release dépasse la valeur épinglée.');
      digest.update(chunk); let written = 0;
      while (written < chunk.length) { const result = await handle.write(chunk, written, chunk.length - written); if (!result.bytesWritten) fail('Écriture de release interrompue.'); written += result.bytesWritten; }
    }
    await handle.sync();
  } finally { await handle.close(); }
  if (bytes !== config.release.bytes || digest.digest('hex') !== config.release.sha256) fail('La taille ou le SHA-256 de release diverge.');
  return { bytes, sha256: config.release.sha256 };
}
function cleanupTemporary(root, temporary, parent, folder) {
  const target = path.resolve(temporary), expectedParent = path.resolve(parent);
  if (!inside(path.resolve(root), target) || target === path.resolve(root) || path.dirname(target) !== expectedParent || !path.basename(target).startsWith(`.${folder}-restore-`)) fail('Nettoyage refusé : cible temporaire hors périmètre.');
  noLinks(root, target);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}
function optionsConfig(options) {
  return validateConfig(options.config ?? JSON.parse(fs.readFileSync(options.configFile ?? DEFAULT_CONFIG, 'utf8')));
}
async function check(options = {}) {
  const config = optionsConfig(options), place = paths(config, options.root ?? ROOT);
  if (!fs.existsSync(place.directory) || !fs.lstatSync(place.directory).isDirectory()) fail('Publication absente ; exécuter comics:prepare.');
  await verifyPublication(place.directory, config, options.checkPublication);
  return { status: 'checked', directory: config.directory, publicationSha256: config.publicationSha256 };
}
async function prepare(options = {}) {
  const config = optionsConfig(options), place = paths(config, options.root ?? ROOT);
  if (fs.existsSync(place.directory)) {
    if (!fs.lstatSync(place.directory).isDirectory()) fail('La destination existe et diverge ; aucun écrasement autorisé.');
    try { await verifyPublication(place.directory, config, options.checkPublication); }
    catch (error) { throw new Error('La destination existante diverge ; aucun écrasement autorisé.', { cause: error }); }
    return { status: 'reused-offline', directory: config.directory, publicationSha256: config.publicationSha256 };
  }
  noLinks(place.root, place.parent); fs.mkdirSync(place.parent, { recursive: true }); noLinks(place.root, place.parent);
  const temporary = fs.mkdtempSync(path.join(place.parent, `.${place.folder}-restore-`));
  try {
    const archive = path.join(temporary, 'release.tar.gz'), extracted = path.join(temporary, 'extracted');
    await downloadArchive(config, archive, options.fetchImpl);
    const entries = await inspectArchive(archive, config.version); verifyTarListing(archive, entries, config.version, options.tar);
    fs.mkdirSync(extracted); noLinks(place.root, extracted);
    execFileSync(options.tar ?? 'tar', ['-xzf', archive, '-C', extracted, '--no-same-owner', '--no-same-permissions'], { encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
    verifyExtracted(extracted, entries, config.version);
    const restored = path.join(extracted, place.folder); noLinks(place.root, restored);
    await verifyPublication(restored, config, options.checkPublication);
    noLinks(place.root, place.directory);
    if (fs.existsSync(place.directory)) fail('La destination est apparue pendant la préparation ; aucun écrasement autorisé.');
    fs.renameSync(restored, place.directory);
    return { status: 'restored', directory: config.directory, publicationSha256: config.publicationSha256 };
  } finally { cleanupTemporary(place.root, temporary, place.parent, place.folder); }
}
async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv; let configFile;
  if (!['prepare', 'check'].includes(command)) fail('Usage : node site.cjs prepare|check [--config CHEMIN].');
  if (args.length) { if (args.length !== 2 || args[0] !== '--config' || !args[1]) fail('Usage : node site.cjs prepare|check [--config CHEMIN].'); configFile = path.resolve(args[1]); }
  const result = await (command === 'prepare' ? prepare({ configFile }) : check({ configFile }));
  process.stdout.write(JSON.stringify(result) + '\n'); return result;
}
module.exports = { validateConfig, archiveName, inspectArchive, verifyTarListing, verifyExtracted, downloadArchive, verifyPublication, cleanupTemporary, prepare, check, main };
if (require.main === module) main().catch(error => { process.stderr.write(error.message + (error.cause ? ` ${error.cause.message}` : '') + '\n'); process.exitCode = 1; });
