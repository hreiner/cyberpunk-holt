/* Editorial revision: reader-facing case titles, without production directions. */
/* eslint @typescript-eslint/no-require-imports: "off" -- Standalone Node production tool. */
/* global require, __dirname, console */
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '../../../../..');
const folder = path.join(root, 'anime/motion-comics/projects');
const { readDocument } = require(path.join(root, 'anime/motion-comics/sequence.cjs'));
const read = name => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
const save = (name, data) => {
  const file = path.join(folder, name);
  if (fs.existsSync(file)) {
    if (!isDeepStrictEqual(read(name), data)) throw Error(`Révision existante différente : ${name}`);
  } else fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
  readDocument(file);
};
const titles = {
  '02': ['Le danger du retour', 'La dette de Letitia', "Se mettre à l'abri", "On ne l'oublie pas"],
  '03': ['Le document', 'Le vertige', 'La vision', "L'inquiétude de l'enfant"],
  '04': ['Des coordonnées anciennes', 'Trouver une borne', 'Partir', 'Le bar désert']
};
for (const [id, labels] of Object.entries(titles)) {
  const previous = `blue-purple-page${id}-v1.json`;
  const data = read(previous);
  data.version = 2;
  data.panels.forEach((panel, index) => { panel.label = `Case ${index + 1} — ${labels[index]}`; });
  data.provenance.previousManifest = previous;
  data.provenance.revision = 'Libellés narratifs courts dans le lecteur et le MP4 ; images, voix, effets et temps identiques à v1.';
  save(`blue-purple-page${id}-v2.json`, data);
}
const sequence = read('blue-purple-pages01-04-v1.json');
sequence.version = 2;
for (const page of sequence.pages.slice(1)) page.manifest = page.manifest.replace('-v1.json', '-v2.json');
sequence.provenance.previousManifest = 'blue-purple-pages01-04-v1.json';
sequence.provenance.revision = 'Sélection des révisions 2 à libellés narratifs pour les pages 2 à 4.';
save('blue-purple-pages01-04-v2.json', sequence);
console.info('Sélection v2 validée : quatre pages, mêmes médias et mêmes durées.');
