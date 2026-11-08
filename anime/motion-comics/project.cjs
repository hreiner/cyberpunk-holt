const fs = require('node:fs');
const path = require('node:path');
const { buildTimeline, assetPaths } = require('./core.js');
const ROOT = path.resolve(__dirname, '../..');
function inside(folder, file) {
  const relative = path.relative(folder, file);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
function localFile(file, root = ROOT) {
  const resolved = path.resolve(file);
  // Resolve junctions/symlinks too, before granting the server access.
  if (!inside(root, resolved) || !fs.statSync(resolved).isFile() || !inside(fs.realpathSync(root), fs.realpathSync(resolved))) {
    throw Error(`Fichier inaccessible dans le dépôt : ${resolved}`);
  }
  return resolved;
}
function readProject(file, root = ROOT) {
  const manifestFile = localFile(file, root);
  const data = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const timeline = buildTimeline(data);
  const media = assetPaths(data);
  const files = [...new Set(media.map(item => localFile(path.resolve(path.dirname(manifestFile), item), root)))];
  return { manifestFile, data, timeline, files };
}
function newDirectory(destination, root = ROOT) {
  const target = path.resolve(destination);
  if (!inside(root, target) || target === root) throw Error('Un nouveau dossier du dépôt est requis.');
  if (fs.existsSync(target)) throw Error('Le dossier existe déjà ; choisir une nouvelle version.');
  let parent = path.dirname(target);
  while (!fs.existsSync(parent)) parent = path.dirname(parent);
  if (!inside(fs.realpathSync(root), fs.realpathSync(parent))) throw Error('Le dossier cible sort du dépôt.');
  fs.mkdirSync(target, { recursive: true });
  return target;
}
function createScene(destination, imageFile, root = ROOT) {
  const image = localFile(imageFile, root);
  const ext = path.extname(image).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) throw Error('Image PNG, JPEG ou WebP requise.');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'templates/scene.json'), 'utf8'));
  const target = newDirectory(destination, root);
  data.title = `HOLT — ${path.basename(target)}`;
  data.image = `page-v1${ext}`;
  data.provenance.image = `Copie locale de ${path.relative(root, image).split(path.sep).join('/')} ; compléter références et revue.`;
  fs.copyFileSync(image, path.join(target, data.image), fs.constants.COPYFILE_EXCL);
  const manifestFile = path.join(target, 'manifest-v1.json');
  fs.writeFileSync(manifestFile, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
  return { manifestFile, data };
}
module.exports = { ROOT, inside, localFile, readProject, newDirectory, createScene };
