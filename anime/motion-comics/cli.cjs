const { createScene } = require('./project.cjs');
const { readDocument } = require('./sequence.cjs');
try {
  const [command, target, ...args] = process.argv.slice(2);
  if (command === 'init' && target && args[0] === '--image' && args[1] && args.length === 2) {
    const { manifestFile } = createScene(target, args[1]);
    console.log(`Scène créée : ${manifestFile}\nDécouper les cases, renseigner les sources et ajouter les prises dans le manifeste.`);
  } else if (command === 'check' && target && !args.length) {
    const { kind, data, timeline, files, pages } = readDocument(target);
    console.log(JSON.stringify({ type: kind, format: data.schemaVersion ?? 1, revision: data.version,
      pages: pages.length, cases: pages.reduce((n, page) => n + page.data.panels.length, 0),
      effets: pages.reduce((n, page) => n + (page.data.effects?.length ?? 0), 0),
      zonesProtegees: pages.reduce((n, page) => n + (page.data.protectedRegions?.length ?? 0), 0),
      duree: timeline.duration, prises: timeline.tracks.length, mediasLocaux: files.length }, null, 2));
  } else {
    throw Error('Usage : node anime/motion-comics/cli.cjs init NOUVEAU_DOSSIER --image IMAGE_LOCALE ; ou check MANIFEST');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
