/* Build the exact native/reference ancestry of the selected static pages, not all trials. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('./common.cjs');
const production=path.join(h.ROOT,'docs/comics/blue-purple-motion/production/chapter-03-continuation');
const art=path.join(h.ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation');
const target=path.join(__dirname,'EXTRA-SOURCES.json'),reportTarget=path.join(__dirname,'EXTRA-SOURCES-PROVENANCE.json');
if(fs.existsSync(target)||fs.existsSync(reportTarget))throw Error('La liste existe déjà ; la réviser explicitement.');
const files=new Map(),selected=new Map(),nativeProof=[];
function add(input,category,expected){
  const file=h.localFile(path.resolve(h.ROOT,input.replaceAll('\\','/')));
  assert(!file.split(path.sep).some(part=>['frames','node_modules','__pycache__'].includes(part))&&!/\.zip$/i.test(file),'Source interdite.');
  const sha256=h.hash(file);if(expected)assert.equal(sha256.toLowerCase(),expected.toLowerCase(),`Source changée : ${file}`);
  const key=h.relative(file);if(!files.has(key))files.set(key,{file:key,sha256,bytes:fs.statSync(file).size,categories:[]});
  if(!files.get(key).categories.includes(category))files.get(key).categories.push(category);return file;
}
function addTree(input,category){for(const entry of fs.readdirSync(input,{withFileTypes:true})){
  const file=path.join(input,entry.name);if(entry.isSymbolicLink()||['frames','node_modules','__pycache__'].includes(entry.name))continue;
  if(entry.isDirectory())addTree(file,category);else if(!/\.zip$/i.test(file))add(file,category);
}}
const baseline=h.read(path.join(production,'revision-02/SELECTION.json'));
for(const entry of baseline.images)selected.set(entry.id,{native:entry.path,sha256:entry.sha256,origin:'revision-02-selection'});
const revision03={ 'p13-c01':'native.png','p15-c03':'native.png','p16-c02':'native.png','p19-c01':'fix01.png' };
for(const [id,name]of Object.entries(revision03))selected.set(id,{native:h.relative(path.join(art,'revision-03',id,name)),origin:'revision-03-selected-correction'});
for(const revision of ['04','05'])for(const entry of h.read(path.join(production,`revision-${revision}/ART-RESULTS.json`)))selected.set(entry.id,{native:entry.master,sha256:entry.sha256,origin:`revision-${revision}-results`});
const html=fs.readFileSync(path.join(art,'comic-review-v5/index.html'),'utf8');
const ids=[...new Set(Array.from(html.matchAll(/<img src="assets\/([^"/]+)\.jpg"/g),match=>match[1]))];
assert.equal(ids.length,41,'41 sources uniques attendues pour42 images affichées.');
for(const id of ids){
  const entry=selected.get(id);assert(entry,`Native sélectionné introuvable : ${id}`);
  const native=add(entry.native,'selected-native-output',entry.sha256),jpg=add(path.join(art,'comic-review-v5/assets',`${id}.jpg`),'approved-jpeg-selection');
  let journal=null;
  if(entry.origin==='revision-04-results'){
    add(path.join(production,'revision-04/ART-RESULTS.json'),'selected-art-journal');
    const job=h.read(path.join(production,'revision-04/ART-JOBS.json')).find(item=>item.id===id);
    const result=h.read(path.join(production,'revision-04/ART-RESULTS.json')).find(item=>item.id===id);
    add(job.reference,'exact-selected-generation-reference',result.reference_sha256);
  }else if(entry.origin==='revision-05-results'){
    add(path.join(production,'revision-05/ART-RESULTS.json'),'selected-art-journal');
    if(id==='p12-c03'){
      const result=h.read(path.join(production,'revision-05/ART-RESULTS.json')).find(item=>item.id===id);
      add(result.reference,'exact-selected-generation-reference',result.reference_sha256);
      add(path.join(production,'revision-05/p12-c03-prompt.txt'),'selected-exact-prompt');
    }else{
      const reference=h.read(path.join(production,'revision-05/REFERENCES.json')).find(item=>item.id===id);
      add(reference.path,'exact-selected-generation-reference',reference.sha256);
    }
  }else{
    let stem=id,folder=production;
    if(entry.native.replaceAll('\\','/').includes('/revision-03/')){folder=path.join(production,'revision-03');if(id==='p19-c01')stem+='-fix';}
    else if(entry.native.replaceAll('\\','/').includes('/revision-02/')){folder=path.join(production,'revision-02');if(entry.native.endsWith('fix01.png'))stem+='-fix';}
    else if(id==='p09-c01')stem='p09-c01-v2';
    else if(id==='p18-c01-after')stem='p18-c01-after';
    journal=path.join(folder,`${stem}-attempt.json`);
    const take=h.read(add(journal,'selected-art-journal'));
    assert.equal(h.hash(native).toLowerCase(),take.sha256.toLowerCase(),`Journal du natif différent : ${id}`);
    add(path.resolve(folder,take.prompt),'selected-exact-prompt');
    const referencesFile=add(path.resolve(folder,take.references),'selected-reference-journal');
    const references=h.read(referencesFile);
    for(const reference of Array.isArray(references)?references:[references])add(reference.path,'exact-selected-generation-reference',reference.sha256);
  }
  nativeProof.push({id,native:h.relative(native),nativeSha256:h.hash(native),approvedJpeg:h.relative(jpg),approvedJpegSha256:h.hash(jpg),selectionSource:entry.origin,journal:journal?h.relative(journal):null});
}
const staticSelection=h.read(path.join(production,'revision-05/SELECTION.json'));
add('output/pdf/blue-purple-chapitre-3-revue-v5.pdf','approved-book',staticSelection.pdf_sha256);
add('output/pdf/blue-purple-chapitre-3-revue-v5.cbz','approved-book',staticSelection.cbz_sha256);
for(const file of ['docs/Cyber-S01-E02-Had.odp','docs/process/adr/0051-motion-comics-stereo-export.md','docs/process/adr/0052-motion-comics-separated-lettering.md',
 'docs/process/adr/0050-immersive-reader-and-stable-export.md','docs/design/MOTION-COMICS-READER.md','docs/design/FRONTEND-DESIGN.md',
 'docs/art/REFERENCES.md','docs/anime/MOTION-COMICS-EFFECTS.md','docs/anime/MOTION-COMICS-VOICE-DIRECTION.md',
 'docs/anime/MOTION-COMICS-ORCHESTRATOR.md','docs/anime/MOTION-COMICS-PAGES-05-08-ORCHESTRATOR.md',
 'docs/process/reviews/2026-11-07-reader-ui.md','docs/process/reviews/2026-11-07-motion-design-skills.md',
 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-08/lettering-v3.svg',
 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-08/lettering-v3.json'])add(file,'essential-reference-or-procedure');
const legacy=h.readDocument(path.join(h.ROOT,'anime/motion-comics/projects/blue-purple-pages01-08-v5.json'));
add(legacy.manifestFile,'legacy-selected-reader');for(const file of legacy.files)add(file,'legacy-selected-reader-dependency');
for(const folder of ['docs/comics/blue-purple-motion/production/pages-01-04','docs/comics/blue-purple-motion/production/pages-05-08','anime/motion-comics/prototypes/motion-design-v2'])addTree(path.join(h.ROOT,folder),'legacy-method-documents-and-replayable-prototype');
addTree(path.join(h.ROOT,'anime/motion-comics/assets'),'local-fonts-and-licenses');
for(const file of ['public/assets/audio/ATTRIBUTION.md','docs/art/audio-generation/background.json'])add(file,'audio-source-license-and-generation-contract');
for(const file of ['soundtrack-v2/report.json','legacy-v2/report.json']){
  const reportFile=path.join(art,'motion-01/sound',file),report=h.read(reportFile);
  add(reportFile,'selected-sound-source-journal');
  for(const entry of report.inputs??report.sourcePreservation??[])add(entry.file,'exact-selected-sound-input',entry.sha256);
}
const list=[...files.keys()].sort();
fs.writeFileSync(target,JSON.stringify(list,null,2),{flag:'wx'});
const report={status:'completed',checkedAt:new Date().toISOString(),selectedUniqueDrawings:ids.length,selectedRevision05Natives:nativeProof.filter(entry=>entry.selectionSource==='revision-05-results').length,
 selectedRevision04Natives:nativeProof.filter(entry=>entry.selectionSource==='revision-04-results').length,natives:nativeProof,files:[...files.values()],
 totalFiles:files.size,totalBytes:[...files.values()].reduce((sum,entry)=>sum+entry.bytes,0),approvedBookHashesVerified:true,
 policy:'Only selected native outputs are treated as selected art. A prior image can appear solely as the exact input reference of a selected generation; no directory of rejected attempts or historical exports is included.',
 limitation:'Journal/selection hash lineage checked. The separate provenance check must confirm native-to-approved-JPEG correspondence; lossless native SHA cannot equal a lossy JPEG SHA.'};
fs.writeFileSync(reportTarget,JSON.stringify(report,null,2),{flag:'wx'});
console.info(JSON.stringify({list:h.relative(target),report:h.relative(reportTarget),selectedNative:ids.length,files:files.size,bytes:report.totalBytes}));
