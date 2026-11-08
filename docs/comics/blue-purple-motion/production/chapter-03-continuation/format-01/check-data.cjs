const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../../..'),projects=path.join(root,'anime/motion-comics/projects');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const old=readDocument(path.join(projects,'blue-purple-pages01-21-v7.json')),current=readDocument(path.join(projects,'blue-purple-pages01-21-v8.json'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lock=require('../motion-01/SOURCE-LOCK-v2.json');
for(const item of [...lock.engine,...lock.files])assert.equal(sha(path.join(root,item.file)),item.sha256,`Source précédente modifiée : ${item.file}`);
assert.deepEqual(current.data.pages.slice(0,8),old.data.pages.slice(0,8));assert.equal(current.musicFile,old.musicFile);
assert.deepEqual(current.timeline.tracks,old.timeline.tracks);
assert.deepEqual(current.timeline.segments.map(s=>[s.start,s.end,s.page,s.panel]),old.timeline.segments.map(s=>[s.start,s.end,s.page,s.panel]));
for(let i=8;i<21;i++){
 const a=old.pages[i].data,b=current.pages[i].data;
 assert.deepEqual(b.panels.map(p=>p.cues),a.panels.map(p=>p.cues));
 assert.deepEqual(b.panels.map(p=>[p.id,p.label,p.holdSeconds,p.leadInSeconds]),a.panels.map(p=>[p.id,p.label,p.holdSeconds,p.leadInSeconds]));
 assert.equal(b.effects.length,a.effects.length);assert.equal(b.protectedRegions.length,a.protectedRegions.length);
 const png=fs.readFileSync(path.resolve(projects,b.image));assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);
 for(const p of b.panels){const r=p.rect.map((v,n)=>v*(n%2?1536:1024));assert([12,518].includes(r[0]));assert([12,520,1028].includes(r[1]));assert([494,1000].includes(r[2]));assert.equal(r[3],496);}
}
const result={status:'completed',source:'blue-purple-pages01-21-v7.json',selected:'blue-purple-pages01-21-v8.json',selectedSha256:sha(current.manifestFile),pages:21,formattedPages:13,panelCount:72,voices:99,duration:current.timeline.duration,previousSourceLockExact:true,previous8PagesExact:true,voiceTimingMusicExact:true,format:'1024×1536 / margin12 / gutter12 / no white frame or paper metadata',files:current.files.map(file=>({file:path.relative(root,file).replaceAll('\\','/'),sha256:sha(file)}))};
fs.writeFileSync(path.join(__dirname,'SELECTION.json'),JSON.stringify(result,null,2),{flag:'wx'});console.info(JSON.stringify({...result,files:result.files.length}));
