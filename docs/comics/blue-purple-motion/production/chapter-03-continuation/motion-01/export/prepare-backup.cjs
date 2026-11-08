/* Exact-file inclusion plan: no ignored folder can smuggle frames or old archives in. */
const fs=require('node:fs'),path=require('node:path');
const h=require('./common.cjs');
const [fullManifest,lotManifest,fullExport,lotExport,planDestination,...extraArgs]=process.argv.slice(2);
if(!planDestination)throw Error('Usage : prepare-backup.cjs MANIFEST_COMPLET MANIFEST_LOT EXPORT_COMPLET EXPORT_LOT NOUVEAU_PLAN.json [--extra LISTE_JSON]');
const target=path.resolve(planDestination);
if(!h.inside(h.ROOT,target)||fs.existsSync(target))throw Error('Nouveau plan local requis.');
const base=path.dirname(target),files=new Map();
const unselectedExportTree=path.join(h.ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/exports');
const forbidden=file=>/\.zip$/i.test(file)||file.split(path.sep).some(part=>['frames','node_modules','__pycache__'].includes(part));
function add(input,category){
  const file=h.localFile(path.resolve(input));if(forbidden(file))throw Error(`Inclusion interdite : ${file}`);
  if(!files.has(file))files.set(file,{file:h.relative(file),category,sha256:h.hash(file),bytes:fs.statSync(file).size});
}
function walk(folder,category){
  const source=path.resolve(folder);if(!h.inside(h.ROOT,source)||!fs.existsSync(source))throw Error(`Dossier absent ou hors dépôt : ${source}`);
  for(const entry of fs.readdirSync(source,{withFileTypes:true})){
    const file=path.join(source,entry.name);
    if(entry.isSymbolicLink()||forbidden(file))continue;
    // Selected export folders were added explicitly above. Do not re-include v1
    // failures or superseded films through the broad motion01 source walk.
    if(path.resolve(file)===unselectedExportTree)continue;
    if(entry.isDirectory())walk(file,category);else if(path.resolve(file)!==target)add(file,category);
  }
}
for(const manifest of [fullManifest,lotManifest]){
  const project=h.readDocument(path.resolve(manifest));add(project.manifestFile,'selected-manifest');
  for(const dependency of project.files)add(dependency,'selected-media-or-page-manifest');
  for(const page of project.pages)for(const cue of page.data.panels.flatMap(panel=>panel.cues??[]))if(cue.takeJournal)add(path.resolve(path.dirname(page.manifestFile),cue.takeJournal),'selected-voice-journal');
}
for(const directory of [fullExport,lotExport]){
  const report=h.read(h.localFile(path.join(path.resolve(directory),'report.json')));
  if(report.status!=='completed'||!report.decoded)throw Error('Export final incomplet.');
  h.localFile(path.join(path.resolve(directory),'independent-audit.json'));
  walk(directory,'final-film-snapshot-and-evidence');
}
for(const entry of h.engine())add(path.resolve(h.ROOT,entry.file),'frozen-engine');
for(const name of ['AGENTS.md','package.json','package-lock.json'])add(path.join(h.ROOT,name),'root-runtime-dependencies');
for(const name of ['anime/motion-comics/tests','anime/motion-comics/templates','anime/motion-comics/production','docs/anime/motion-comics',
  'docs/comics/blue-purple-motion/production/chapter-03-continuation','art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5',
  'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01'])walk(path.join(h.ROOT,name),'production-sources-and-proof');
for(const name of ['docs/INDEX.md','docs/WORKFLOWS.md','docs/anime/MOTION-COMICS-TECHNICAL.md','docs/art/AUDIO-WORKFLOW.md','docs/Cyber-S01-E02-Had.odp'])add(path.join(h.ROOT,name),'source-and-current-context');
for(const entry of fs.readdirSync(path.join(h.ROOT,'anime/motion-comics'),{withFileTypes:true}))if(entry.isFile()&&/\.(cjs|md)$/.test(entry.name))add(path.join(h.ROOT,'anime/motion-comics',entry.name),'validation-tools');
const extraIndex=extraArgs.indexOf('--extra');
if(extraIndex>=0){const extraFile=h.localFile(path.resolve(extraArgs[extraIndex+1]));add(extraFile,'explicit-additional-source-list');for(const name of h.read(extraFile))add(path.resolve(h.ROOT,name),'explicit-additional-source');}
const relation=file=>path.relative(base,file).replaceAll('\\','/');
const plan={schemaVersion:1,output:'delivery-backup-v1.zip',include:[...files.keys(),target].map(relation),frozenFiles:[...files.values()],
  excludes:['all frames directories','node_modules','__pycache__','ZIP files','unselected historical exports'],
  membership:'Every include is one explicit file, not an unchecked directory. FrozenFile hashes must be checked again at backup.',
  runtime:'Install root package-lock dependencies, Node and browser/FFmpeg. Standard render.cjs rebuilds either snapshot without the deliberately omitted historical PNG frame caches.',
  stagedAt:new Date().toISOString(),totalFiles:files.size,totalBytes:[...files.values()].reduce((sum,entry)=>sum+entry.bytes,0)};
fs.mkdirSync(base,{recursive:true});fs.writeFileSync(target,JSON.stringify(plan,null,2),{flag:'wx'});
console.info(JSON.stringify({plan:h.relative(target),files:plan.totalFiles,bytes:plan.totalBytes,includesFrames:false,includesZip:false}));
