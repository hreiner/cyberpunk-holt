/* global Response */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { validateConfig, archiveName, inspectArchive, prepare, check, cleanupTemporary } = require('../site.cjs');

const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function tar(entries) {
  const records = [];
  for (const entry of entries) {
    const header = Buffer.alloc(512), content = Buffer.from(entry.content ?? '');
    const octal = (value, offset, length) => header.write(value.toString(8).padStart(length - 1, '0') + '\0', offset, length, 'ascii');
    header.write(entry.name, 0, 100, 'utf8'); octal(entry.mode ?? 0o755, 100, 8); octal(0, 108, 8); octal(0, 116, 8);
    octal(content.length, 124, 12); octal(0, 136, 12); header.fill(32, 148, 156); header[156] = (entry.type ?? '0').charCodeAt(0);
    if (entry.link) header.write(entry.link, 157, 100, 'utf8');
    header.write('ustar\0', 257, 6, 'ascii'); header.write('00', 263, 2, 'ascii');
    header.write(header.reduce((n, value) => n + value, 0).toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
    records.push(header, content, Buffer.alloc((512 - content.length % 512) % 512));
  }
  return zlib.gzipSync(Buffer.concat([...records, Buffer.alloc(1024)]));
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'holt-comics-site-'));
  t.after(() => {
    const target = path.resolve(root), parent = fs.realpathSync(os.tmpdir());
    assert.equal(path.dirname(fs.realpathSync(target)), parent);
    assert(path.basename(target).startsWith('holt-comics-site-'));
    fs.rmSync(target, { recursive: true, force: true });
  });
  const index = Buffer.from('<!doctype html><title>Comics témoin</title>');
  const publication = Buffer.from(JSON.stringify({ schemaVersion: 1, kind: 'holt-static-comic-publication', version: 10,
    source: { sequenceSha256: 'a'.repeat(64), selectionSha256: 'b'.repeat(64) },
    files: [{ path: 'index.html', bytes: index.length, sha256: hash(index), kind: 'reader' }] }) + '\n');
  const entries = [{ name: 'v10/', type: '5' }, { name: 'v10/index.html', content: index }, { name: 'v10/PUBLICATION.json', content: publication }];
  const archive = tar(entries);
  const config = { schemaVersion: 1, version: 10, directory: 'public/comics/blue-purple/v10',
    sourceManifest: 'anime/motion-comics/projects/blue-purple-pages01-21-v10.json', sourceSha256: 'a'.repeat(64),
    publicationSha256: hash(publication), release: { tag: 'blue-purple-v10', url: 'https://github.com/hreiner/cyberpunk-holt/releases/download/blue-purple-v10/blue-purple-v10.tar.gz', bytes: archive.length, sha256: hash(archive) } };
  const destination = path.join(root, config.directory);
  let checks = 0, downloads = 0;
  const checker = directory => {
    checks++;
    const data = JSON.parse(fs.readFileSync(path.join(directory, 'PUBLICATION.json'), 'utf8'));
    for (const file of data.files) { const bytes = fs.readFileSync(path.join(directory, file.path)); assert.equal(bytes.length, file.bytes); assert.equal(hash(bytes), file.sha256); }
  };
  const fetchImpl = async url => { downloads++; assert.equal(url, config.release.url); return new Response(archive); };
  return { root, config, archive, entries, index, publication, destination, checker, fetchImpl, counts: () => ({ checks, downloads }) };
}
function fileArchive(f, buffer, suffix = 'archive.tar.gz') { const file = path.join(f.root, suffix); fs.writeFileSync(file, buffer); return file; }

test('la configuration borne la version, les chemins et la release publique attendue', () => {
  const valid = { schemaVersion: 1, version: 10, directory: 'public/comics/blue-purple/v10', sourceManifest: 'anime/example.json', sourceSha256: 'a'.repeat(64), publicationSha256: 'b'.repeat(64),
    release: { tag: 'blue-purple-v10', url: 'https://github.com/hreiner/cyberpunk-holt/releases/download/blue-purple-v10/site.tar.gz', bytes: 10, sha256: 'c'.repeat(64) } };
  assert.equal(validateConfig(valid).directory, valid.directory);
  const mutations = [d => d.schemaVersion = 2, d => d.version = 0, d => d.directory = '../v10', d => d.directory = 'public/comics/blue-purple/v11',
    d => d.sourceManifest = 'C:/secret.json', d => d.sourceManifest = 'anime/../secret.json', d => d.sourceSha256 = 'incorrect',
    d => d.release.bytes = -1, d => d.release.sha256 = 'incorrect', d => d.release.tag = '../v10',
    d => d.release.url = 'https://example.com/site.tar.gz', d => d.release.url = valid.release.url.replace('hreiner', 'someone'),
    d => d.release.url = valid.release.url.replace('https:', 'http:'), d => d.release.url += '?token=forbidden',
    d => d.release.url = valid.release.url.replace('/blue-purple-v10/', '/another-tag/')];
  for (const mutate of mutations) { const config = structuredClone(valid); mutate(config); assert.throws(() => validateConfig(config)); }
});

test('les chemins TAR refusent traversée, lecteurs Windows, liens implicites et ambiguïtés multiplateformes', () => {
  assert.equal(archiveName('v10/assets/a.png', 10), 'v10/assets/a.png');
  assert.equal(archiveName('v10/', 10, true), 'v10');
  for (const name of ['/tmp/escape', 'C:/escape', 'v10/../escape', 'v10/./file', 'v10\\file', 'v11/file', 'v10//file', 'v10/file:stream', 'v10/NUL.txt', 'v10/file.', 'v10/file ', 'v10/a\nfile']) assert.throws(() => archiveName(name, 10));
});

test('une release vérifiée est restaurée par tar OS puis réutilisée hors réseau sans écrasement', async t => {
  const f = fixture(t), options = { root: f.root, config: f.config, fetchImpl: f.fetchImpl, checkPublication: f.checker };
  const first = await prepare(options); assert.equal(first.status, 'restored');
  assert.deepEqual(fs.readFileSync(path.join(f.destination, 'index.html')), f.index);
  const before = fs.statSync(path.join(f.destination, 'PUBLICATION.json')).mtimeMs;
  const second = await prepare({ ...options, fetchImpl: () => { throw Error('Le réemploi ne doit pas accéder au réseau.'); } });
  assert.equal(second.status, 'reused-offline'); assert.equal(fs.statSync(path.join(f.destination, 'PUBLICATION.json')).mtimeMs, before);
  assert.equal((await check({ root: f.root, config: f.config, checkPublication: f.checker })).status, 'checked');
  assert.deepEqual(f.counts(), { checks: 3, downloads: 1 });
  assert.deepEqual(fs.readdirSync(path.dirname(f.destination)), ['v10']);
});

test('taille et SHA du téléchargement sont vérifiés avant toute extraction', async t => {
  const f = fixture(t);
  for (const mutate of [c => c.release.bytes++, c => c.release.bytes--, c => c.release.sha256 = '0'.repeat(64)]) {
    const config = structuredClone(f.config); mutate(config);
    await assert.rejects(prepare({ root: f.root, config, fetchImpl: f.fetchImpl, checkPublication: () => { throw Error('Validation ne doit pas être atteinte.'); } }), /taille|SHA-256/);
    assert(!fs.existsSync(f.destination)); assert.deepEqual(fs.readdirSync(path.dirname(f.destination)), []);
  }
});

test('les entrées dangereuses sont rejetées même avec une archive dont le SHA est correctement épinglé', async t => {
  const f = fixture(t);
  const bad = [
    { name: 'v10/link', type: '2', link: '../../outside' }, { name: 'v10/hard', type: '1', link: 'v10/index.html' },
    { name: 'v10/pipe', type: '6' }, { name: 'v10/PaxHeader', type: 'x' }, { name: '../outside', content: 'unsafe' },
    { name: '/absolute', content: 'unsafe' }, { name: 'v10/../outside', content: 'unsafe' },
  ];
  for (const [index, entry] of bad.entries()) {
    const buffer = tar([...f.entries, entry]), config = structuredClone(f.config);
    config.release.bytes = buffer.length; config.release.sha256 = hash(buffer);
    await assert.rejects(prepare({ root: f.root, config, fetchImpl: async () => new Response(buffer), checkPublication: f.checker }), /Archive|chemin/);
    assert(!fs.existsSync(f.destination)); assert(!fs.existsSync(path.join(f.root, 'outside')));
    const archive = fileArchive(f, buffer, `bad-${index}.tar.gz`); await assert.rejects(inspectArchive(archive, 10));
  }
});

test('les collisions de casse, doublons et fichiers utilisés comme dossiers sont rejetés', async t => {
  const f = fixture(t);
  const variants = [[...f.entries, { name: 'v10/INDEX.html', content: 'collision' }], [...f.entries, f.entries[1]],
    [{ name: 'v10/', type: '5' }, { name: 'v10/assets', content: 'file' }, { name: 'v10/assets/a', content: 'child' }]];
  for (const [i, entries] of variants.entries()) await assert.rejects(inspectArchive(fileArchive(f, tar(entries), `collision-${i}.tar.gz`), 10), /collision|dupliquée|répertoire/);
});

test('les en-têtes corrompus, tailles binaires et archives TAR tronquées sont refusés', async t => {
  const f = fixture(t), original = zlib.gunzipSync(f.archive), checksum = Buffer.from(original), binary = Buffer.from(original);
  checksum[148] = checksum[148] === 48 ? 49 : 48;
  // A high-bit binary size must never be accepted as ASCII octal before calling tar OS.
  binary[124] = 0xb0; binary.fill(32, 148, 156);
  const sum = binary.subarray(0, 512).reduce((n, value) => n + value, 0);
  binary.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
  for (const [i, bytes] of [checksum, binary, original.subarray(0, 700), original.subarray(0, original.length - 512)].entries()) {
    await assert.rejects(inspectArchive(fileArchive(f, zlib.gzipSync(bytes), `malformed-${i}.tar.gz`), 10), /Archive/);
  }
});

test('une publication locale divergente reste intacte et ne provoque pas de téléchargement', async t => {
  const f = fixture(t); fs.mkdirSync(f.destination, { recursive: true }); fs.writeFileSync(path.join(f.destination, 'sentinel'), 'preserve');
  const options = { root: f.root, config: f.config, fetchImpl: () => { throw Error('Réseau interdit.'); }, checkPublication: f.checker };
  await assert.rejects(prepare(options), /diverge/); assert.equal(fs.readFileSync(path.join(f.destination, 'sentinel'), 'utf8'), 'preserve');
  fs.writeFileSync(path.join(f.destination, 'PUBLICATION.json'), f.publication); fs.writeFileSync(path.join(f.destination, 'index.html'), 'corrupted');
  await assert.rejects(prepare(options), /diverge/); assert.equal(fs.readFileSync(path.join(f.destination, 'index.html'), 'utf8'), 'corrupted');
});

test('une destination apparue en cours de préparation est conservée', async t => {
  const f = fixture(t);
  const fetchImpl = async () => { fs.mkdirSync(f.destination, { recursive: true }); fs.writeFileSync(path.join(f.destination, 'sentinel'), 'concurrent'); return new Response(f.archive); };
  await assert.rejects(prepare({ root: f.root, config: f.config, fetchImpl, checkPublication: f.checker }), /apparue/);
  assert.equal(fs.readFileSync(path.join(f.destination, 'sentinel'), 'utf8'), 'concurrent'); assert(!fs.existsSync(path.join(f.destination, 'PUBLICATION.json')));
});

test('les jonctions du chemin cible sont refusées avant tout téléchargement', async t => {
  const f = fixture(t), elsewhere = path.join(f.root, 'elsewhere'); fs.mkdirSync(elsewhere);
  try { fs.symlinkSync(elsewhere, path.join(f.root, 'public'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip('Création de liens interdite par cet environnement ; ce contrôle s’exécute sur les hôtes qui la permettent.'); return; } throw error; }
  await assert.rejects(prepare({ root: f.root, config: f.config, fetchImpl: f.fetchImpl, checkPublication: f.checker }), /lien|sortie/);
  assert.deepEqual(f.counts(), { checks: 0, downloads: 0 });
});

test('un nettoyage récursif hors du répertoire temporaire précis est refusé', t => {
  const f = fixture(t), elsewhere = path.join(f.root, 'elsewhere'); fs.mkdirSync(elsewhere);
  assert.throws(() => cleanupTemporary(f.root, elsewhere, f.root, 'v10'), /Nettoyage refusé/); assert(fs.existsSync(elsewhere));
});

test('le check hors réseau exige une publication présente et une identité correspondant à la version', async t => {
  const f = fixture(t); await assert.rejects(check({ root: f.root, config: f.config, checkPublication: f.checker }), /absente/);
  const publication = JSON.parse(f.publication); publication.source.sequenceSha256 = 'f'.repeat(64); const bytes = Buffer.from(JSON.stringify(publication));
  fs.mkdirSync(f.destination, { recursive: true }); fs.writeFileSync(path.join(f.destination, 'PUBLICATION.json'), bytes);
  const config = structuredClone(f.config); config.publicationSha256 = hash(bytes);
  await assert.rejects(check({ root: f.root, config, checkPublication: f.checker }), /Identité/);
  assert.deepEqual(f.counts(), { checks: 0, downloads: 0 });
});
