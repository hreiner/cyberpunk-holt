/* The orchestrator selects the reviewed cover and the two bounded revisions. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../../..'),dir=path.join(root,'anime/motion-comics/projects');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const sequence=require(path.join(root,'anime/motion-comics/sequence.js'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const file=name=>path.join(dir,name);
const old=readDocument(file('blue-purple-pages01-21-v8.json'));
const cover=readDocument(file('blue-purple-cover-v1.json'));
const p16=readDocument(file('blue-purple-page16-motion05.json'));
const p17=readDocument(file('blue-purple-page17-motion05.json'));
const sound=json(path.join(__dirname,'sound/SELECTION.json'));
const media=value=>path.relative(dir,path.join(root,value)).replaceAll('\\','/');
const before=json(path.join(__dirname,'../format-01/SELECTION.json'));
for(const entry of before.files)assert.equal(sha(path.join(root,entry.file)),entry.sha256,entry.file);
assert.equal(sha(old.manifestFile),before.selectedSha256);
assert.equal(cover.timeline.duration,12);
for(const [index,project] of [[15,p16],[16,p17]]){
 assert(Math.abs(project.timeline.duration-old.pages[index].timeline.duration)<1e-8);
 assert.deepEqual(project.data.panels.map(p=>p.cues),old.pages[index].data.panels.map(p=>p.cues));
}
const data={...structuredClone(old.data),version:9,title:'HOLT — Blue Purple · chapitre 3 · couverture et 21 pages'};
data.pages=[{id:'cover',manifest:'blue-purple-cover-v1.json'},...data.pages];
data.pages[16]={...data.pages[16],manifest:'blue-purple-page16-motion05.json'};
data.pages[17]={...data.pages[17],manifest:'blue-purple-page17-motion05.json'};
data.music={...data.music,audio:media(sound.backingFull)};
data.provenance={...data.provenance,revision:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-02/PROGRESS.md',previousSelection:'blue-purple-pages01-21-v8.json',engine:'1.2.0'};
const manifests=[cover.data,...old.pages.map((p,index)=>index===15?p16.data:index===16?p17.data:p.data)];
const timeline=sequence.buildSequence(data,manifests);
assert.equal(timeline.tracks.length,99);assert(Math.abs(timeline.duration-old.timeline.duration-12)<1e-7);
let shiftedWendy=0;
for(let i=0;i<99;i++){
 const a=old.timeline.tracks[i],b=timeline.tracks[i];
 const shift=a.page===16&&a.panel===1&&a.speaker==='wendy'?.7:0;
 if(shift)shiftedWendy++;
 assert.equal(b.audio,a.audio);assert.equal(b.speaker,a.speaker);assert.equal(b.panel,a.panel);assert.equal(b.page,a.page+1);
 assert(Math.abs(b.start-a.start-12-shift)<1e-7);assert(Math.abs(b.end-a.end-12-shift)<1e-7);
}
assert.equal(shiftedWendy,1);
const full=file('blue-purple-pages01-21-v9.json');
fs.writeFileSync(full,JSON.stringify(data,null,2),{flag:'wx'});
const lot={...structuredClone(data),version:5,title:'HOLT — Blue Purple · pages 9 à 21',pages:data.pages.slice(9),music:{...data.music,audio:media(sound.backingPages09To21)}};
fs.writeFileSync(file('blue-purple-pages09-21-motion05.json'),JSON.stringify(lot,null,2),{flag:'wx'});
const preview={kind:sequence.KIND,schemaVersion:1,version:1,title:'HOLT — Blue Purple · couverture',pages:[data.pages[0]],music:{audio:media(sound.coverAudio),gain:1,preMixed:true}};
fs.writeFileSync(file('blue-purple-cover-preview-v1.json'),JSON.stringify(preview,null,2),{flag:'wx'});
const selected=readDocument(full),lock=json(path.join(__dirname,'../motion-01/SOURCE-LOCK-v2.json'));
const report={status:'selected-awaiting-final-reader-qa',selected:path.relative(root,full).replaceAll('\\','/'),selectedSha256:sha(full),engineVersion:require(path.join(root,'anime/motion-comics/package.json')).version,entries:22,storyPages:21,coverSeconds:12,duration:selected.timeline.duration,voices:99,shiftedVoice:{page:17,speaker:'wendy',seconds:.7},sourceV8DependenciesExact:true,storyPageDurationsExact:true,unchangedPages:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,18,19,20,21],newArtRoles:['cover','p17-cleanplate'],proposals:'ANIMATION-PROPOSALS.md — 44 lignes, non produites sauf16/17',engine:lock.engine.map(e=>({file:e.file,sha256:sha(path.join(root,e.file))})),files:selected.files.map(f=>({file:path.relative(root,f).replaceAll('\\','/'),sha256:sha(f)}))};
fs.writeFileSync(path.join(__dirname,'SELECTION.json'),JSON.stringify(report,null,2),{flag:'wx'});
console.info(JSON.stringify({...report,engine:report.engine.length,files:report.files.length}));
