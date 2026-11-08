'use strict';

// Records one bounded built-in ImageGen attempt. No provider call is made here.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '../../../../..');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const die = message => { throw new Error(message); };

function inside(candidate, label) {
  const absolute = path.resolve(candidate);
  const relative = path.relative(ROOT, absolute);
  if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
    die(label + ' doit rester dans le dépôt : ' + absolute);
  }
  let ancestor = absolute;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) die('Parent introuvable : ' + absolute);
    ancestor = parent;
  }
  const realAncestor = fs.realpathSync(ancestor);
  const realRoot = fs.realpathSync(ROOT);
  const realRelative = path.relative(realRoot, realAncestor);
  if (realRelative.startsWith('..' + path.sep) || realRelative === '..' || path.isAbsolute(realRelative)) {
    die(label + ' traverse un lien hors du dépôt : ' + absolute);
  }
  return absolute;
}

function localFile(candidate, label) {
  const absolute = inside(candidate, label);
  if (!fs.statSync(absolute).isFile()) die(label + ' : fichier requis.');
  return absolute;
}

function describe(file) {
  const data = fs.readFileSync(file);
  return { path: file, relativePath: path.relative(ROOT, file).split(path.sep).join('/'), bytes: data.length, sha256: sha256(data) };
}

function referenceEntries(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    for (const key of ['references', 'inputs', 'images', 'paths']) {
      if (Array.isArray(value[key])) return value[key];
    }
  }
  die('refs.json doit être une liste ou contenir references[], inputs[], images[] ou paths[].');
}

function saveNew(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}

function loadAttempt(folder) {
  const directory = inside(folder, 'Dossier de tentative');
  const file = localFile(path.join(directory, 'journal.json'), 'Journal');
  const journal = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (journal.status !== 'running') die('Tentative déjà clôturée : ' + journal.status);
  return { directory, file, journal };
}

function updateJournal(file, journal) {
  const temporary = file + '.update-' + crypto.randomUUID();
  saveNew(temporary, journal);
  fs.renameSync(temporary, file);
}

function prepare(promptFile, referencesFile, folder) {
  if (!promptFile || !referencesFile || !folder) die('Usage : prepare prompt.txt refs.json dossier_neuf');
  const promptPath = localFile(promptFile, 'Prompt');
  const refsPath = localFile(referencesFile, 'Références');
  const directory = inside(folder, 'Dossier de tentative');
  if (fs.existsSync(directory)) die('Le dossier de tentative doit être neuf : ' + directory);
  const prompt = fs.readFileSync(promptPath, 'utf8');
  if (!prompt.trim()) die('Prompt vide.');
  const refsText = fs.readFileSync(refsPath, 'utf8');
  const refs = JSON.parse(refsText);
  const entries = referenceEntries(refs);
  if (!entries.length) die('Au moins une référence inspectée est requise.');
  const references = entries.map((entry, index) => {
    const referencePath = typeof entry === 'string' ? entry : entry && (entry.path || entry.file || entry.filePath || entry.reference);
    if (typeof referencePath !== 'string' || !referencePath) die('Chemin de référence absent à l\'index ' + index);
    // Relative input paths are repository-relative, like all CLI arguments.
    return { index, input: entry, ...describe(localFile(referencePath, 'Référence ' + index)) };
  });
  const createdAt = now();
  const journal = {
    schemaVersion: 1, provider: 'built-in-imagegen', status: 'running',
    createdAt, updatedAt: createdAt, attemptDirectory: directory,
    prompt: { ...describe(promptPath), text: prompt },
    referencesFile: { ...describe(refsPath), text: refsText, parsed: refs },
    references, providerRequestId: null, monetaryCost: null,
    output: null, diagnostic: null,
    history: [{ at: createdAt, status: 'running', action: 'prepare' }]
  };
  fs.mkdirSync(directory, { recursive: true });
  fs.mkdirSync(path.join(directory, 'events'));
  saveNew(path.join(directory, 'events', '001-running.json'), journal);
  saveNew(path.join(directory, 'journal.json'), journal);
  return { status: journal.status, directory, journal: path.join(directory, 'journal.json'), promptSha256: journal.prompt.sha256, references: references.length };
}

function finish(folder, outputFile) {
  if (!folder || !outputFile) die('Usage : finish dossier_neuf chemin_sortie');
  const { directory, file, journal } = loadAttempt(folder);
  const source = path.resolve(outputFile); // Generated output may be outside the repo.
  if (!fs.statSync(source).isFile()) die('La sortie doit être un fichier.');
  const signature = fs.readFileSync(source).subarray(0, 8);
  if (!signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    die('La sortie n\'est pas un PNG ; conserver le format réel avant de finaliser band-v1.png.');
  }
  const target = inside(path.join(directory, 'band-v1.png'), 'Image retenue pour revue');
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  const timestamp = now();
  journal.status = 'review';
  journal.updatedAt = timestamp;
  journal.output = { ...describe(target), sourcePath: source, sourceSha256: sha256(fs.readFileSync(source)) };
  journal.history.push({ at: timestamp, status: 'review', action: 'finish' });
  saveNew(path.join(directory, 'events', '002-review.json'), journal);
  updateJournal(file, journal);
  return { status: journal.status, image: target, sha256: journal.output.sha256, bytes: journal.output.bytes };
}

function fail(folder, words) {
  if (!folder || !words.length) die('Usage : fail dossier_neuf diagnostic...');
  const { directory, file, journal } = loadAttempt(folder);
  const timestamp = now();
  journal.status = 'failed';
  journal.updatedAt = timestamp;
  journal.diagnostic = words.join(' ');
  journal.history.push({ at: timestamp, status: 'failed', action: 'fail', diagnostic: journal.diagnostic });
  saveNew(path.join(directory, 'events', '002-failed.json'), journal);
  updateJournal(file, journal);
  return { status: journal.status, journal: file, diagnostic: journal.diagnostic };
}

if (require.main === module) {
  try {
    const [command, ...args] = process.argv.slice(2);
    const result = command === 'prepare' ? prepare(...args) :
      command === 'finish' ? finish(...args) :
      command === 'fail' ? fail(args[0], args.slice(1)) :
      die('Commandes : prepare prompt.txt refs.json dossier_neuf | finish dossier_neuf chemin_sortie | fail dossier_neuf diagnostic...');
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}

module.exports = { prepare, finish, fail };

