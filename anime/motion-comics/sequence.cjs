const fs = require('node:fs');
const path = require('node:path');
const { ROOT, localFile, readProject } = require('./project.cjs');
const { KIND, assertSequence, buildSequence } = require('./sequence.js');

function readDocument(file, root = ROOT) {
  const manifestFile = localFile(file, root);
  const data = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (data.kind !== KIND) {
    const project = readProject(file, root);
    return { ...project, kind: 'page', pages: [{ ...project, id: 'page-01' }] };
  }
  assertSequence(data);
  const pages = data.pages.map(page => ({ ...readProject(path.resolve(path.dirname(manifestFile), page.manifest), root), id: page.id }));
  const timeline = buildSequence(data, pages.map(page => page.data));
  timeline.tracks = timeline.tracks.map(track => ({ ...track, audioFile: path.resolve(path.dirname(pages[track.page].manifestFile), track.audio) }));
  const musicFile = data.music ? localFile(path.resolve(path.dirname(manifestFile), data.music.audio), root) : null;
  const thumbnails = data.pages.filter(page => page.thumbnail !== undefined).map(page => localFile(path.resolve(path.dirname(manifestFile), page.thumbnail), root));
  return { kind: 'sequence', manifestFile, data, pages, timeline, musicFile, files: [...new Set([...pages.flatMap(page => [page.manifestFile, ...page.files]), ...thumbnails, ...(musicFile ? [musicFile] : [])])] };
}
module.exports = { readDocument };
