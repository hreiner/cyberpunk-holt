/* Select four reviewed production lots on one shared timing contract. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../../..'),projects=path.join(root,'anime/motion-comics/projects');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const sequence=require(path.join(root,'anime/motion-comics/sequence.js'));
const {applyTiming}=require('./timing/retime.cjs');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative=file=>path.relative(root,file).replaceAll('\\','/');
const media=file=>path.relative(projects,path.join(root,file)).replaceAll('\\','/');
const source=readDocument(path.join(projects,'blue-purple-pages01-21-v9.json'));
const before=read(path.join(__dirname,'../motion-02/SELECTION.json')),timing=read(path.join(__dirname,'timing/TIMING.json'));
assert.equal(sha(source.manifestFile),before.selectedSha256);
assert.equal(sha(path.join(__dirname,'timing/retime.cjs')),timing.helperSha256);
for(const entry of before.files)assert.equal(sha(path.join(root,entry.file)),entry.sha256,entry.file);
const candidates=Array.from({length:13},(_,i)=>readDocument(path.join(projects,`blue-purple-page${String(i+9).padStart(2,'0')}-motion06.json`)));
const withoutGap=cue=>{const copy=structuredClone(cue);delete copy.gapSeconds;return copy;};
for(let i=0;i<candidates.length;i++){
 const n=i+9,old=source.pages[n],actual=candidates[i],expected=applyTiming(old.data,n);
 assert(Math.abs(actual.timeline.duration-timing.pages[n].duration)<1e-7,`Durée page ${n}`);
 assert.deepEqual(actual.data.panels.map(p=>[p.id,p.rect,p.holdSeconds,p.leadInSeconds]),expected.panels.map(p=>[p.id,p.rect,p.holdSeconds,p.leadInSeconds]));
 assert.deepEqual(actual.data.panels.map(p=>(p.cues??[]).map(withoutGap)),old.data.panels.map(p=>(p.cues??[]).map(withoutGap)),`Voix/textes page ${n}`);
}
const sound=read(path.join(__dirname,'sound/SELECTION.json'));
const data={...structuredClone(source.data),version:10,title:'HOLT — Blue Purple · chapitre 3 · couverture et 21 pages'};
data.pages=[...data.pages.slice(0,9),...candidates.map((p,i)=>({id:'page-'+String(i+9).padStart(2,'0'),manifest:path.basename(p.manifestFile)}))];
data.music={...data.music,audio:media(sound.backingFull)};
data.provenance={...data.provenance,revision:relative(__dirname)+'/PROGRESS.md',previousSelection:'blue-purple-pages01-21-v9.json',engine:'1.3.0',timing:relative(__dirname)+'/timing/TIMING.json',map:'User reference; two yellow POIs and one green; no HOLT marker'};
assert.deepEqual(data.pages.slice(0,9),source.data.pages.slice(0,9));
const expectedData=source.pages.map((p,index)=>index<9?p.data:applyTiming(p.data,index));
const expected=sequence.buildSequence(data,expectedData);
const actual=sequence.buildSequence(data,[...source.pages.slice(0,9).map(p=>p.data),...candidates.map(p=>p.data)]);
assert(Math.abs(actual.duration-timing.duration)<1e-7);assert.equal(actual.tracks.length,99);
for(let i=0;i<99;i++){
 const a=actual.tracks[i],b=expected.tracks[i];
 assert.equal(a.audio,b.audio);assert.equal(a.speaker,b.speaker);assert.equal(a.panel,b.panel);assert.equal(a.page,b.page);
 assert(Math.abs(a.start-b.start)<1e-7);assert(Math.abs(a.end-b.end)<1e-7);
}
assert(Math.abs(actual.pages[9].start-238.6)<1e-7);
const map=read(path.join(__dirname,'map/SELECTION.json'));
assert.equal(map.markers.length,3);assert.equal(map.markers.filter(m=>m.color==='#f2e52a').length,2);assert.equal(map.markers.filter(m=>m.color==='#39de83').length,1);
assert(!map.markers.some(m=>m.id==='holt'));
const full=path.join(projects,'blue-purple-pages01-21-v10.json');
fs.writeFileSync(full,JSON.stringify(data,null,2),{flag:'wx'});
const lot={...structuredClone(data),version:6,title:'HOLT — Blue Purple · pages 9 à 21',pages:data.pages.slice(9),music:{...data.music,audio:media(sound.backingPages09To21)}};
fs.writeFileSync(path.join(projects,'blue-purple-pages09-21-motion06.json'),JSON.stringify(lot,null,2),{flag:'wx'});
const selected=readDocument(full);
const engineNames=['reader.html','reader.css','reader.js','core.js','effects.js','layers.js','sequence.js','assets/holt-display.woff2','assets/holt-text.woff2','render.cjs','project.cjs','sequence.cjs','audio.cjs','package.json'];
const report={status:'integrated-awaiting-final-reader-review',selected:relative(full),selectedSha256:sha(full),engineVersion:'1.3.0',entries:22,storyPages:21,visibleSubcasesAnimated:46,coverSeconds:12,duration:actual.duration,unchangedPrefixSeconds:238.6,voices:99,voicesNotAccelerated:true,timingRevision:2,timingSha256:sha(path.join(__dirname,'timing/TIMING.json')),sourceV9DependenciesExact:true,sourceV9Sha256:sha(source.manifestFile),mapPOIs:{yellow:2,green:1,holt:false},engine:engineNames.map(f=>{const file=path.join(root,'anime/motion-comics',f);return {file:relative(file),sha256:sha(file)};}),files:selected.files.map(file=>({file:relative(file),sha256:sha(file)}))};
fs.writeFileSync(path.join(__dirname,'SELECTION.json'),JSON.stringify(report,null,2),{flag:'wx'});
console.info(JSON.stringify({...report,engine:report.engine.length,files:report.files.length}));
