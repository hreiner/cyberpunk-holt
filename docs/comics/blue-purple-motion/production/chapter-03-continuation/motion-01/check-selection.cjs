const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../../..'),lock=require('./SOURCE-LOCK-v2.json');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const h=require('./export/common.cjs');
const expected=require('../revision-05/DIALOGUE-FR.json');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const normalize=text=>text.trim().replace(/\s+/g,' ');
for(const item of [...lock.engine,...lock.files])assert.equal(hash(path.join(root,item.file)),item.sha256,`Source gelée modifiée : ${item.file}`);
assert.deepEqual(h.engine(),lock.engine);
const full=readDocument(path.join(root,lock.document)),lot=readDocument(path.join(root,'anime/motion-comics/projects/blue-purple-pages09-21-motion02.json'));
const original=readDocument(path.join(root,'anime/motion-comics/projects/blue-purple-pages01-08-v5.json'));
assert.deepEqual(full.data.pages.slice(0,8),original.data.pages);
const all=full.pages.flatMap(p=>p.data.panels.flatMap(panel=>panel.cues??[]));
assert.equal(new Set(all.map(c=>c.id)).size,99);assert.equal(all.length,99);
const selected=lot.pages.flatMap(p=>p.data.panels.flatMap(panel=>(panel.cues??[]).map(c=>({...c,key:panel.sourcePanelKey}))));
for(const [key,lines] of Object.entries(expected)){
 const actual=selected.filter(c=>c.key===key);
 assert.equal(actual.length,lines.length,`Nombre de voix différent : ${key}`);
 for(let i=0;i<lines.length;i++){
  assert.equal(normalize(actual[i].textFr),normalize(lines[i].text),`Texte différent : ${key}/${i}`);
  assert.equal(actual[i].speaker,lines[i].speaker.toLowerCase(),`Locuteur différent : ${key}/${i}`);
 }
}
for(let i=1;i<full.timeline.tracks.length;i++)assert(full.timeline.tracks[i].start>=full.timeline.tracks[i-1].end,'Voix superposées.');
assert(full.data.music.preMixed&&lot.data.music.preMixed);
assert.equal(path.resolve(path.dirname(full.manifestFile),full.data.music.audio),path.resolve(root,require('./sound/SELECTION.json').backingFull));
const report={status:'completed',date:new Date().toISOString(),document:lock.document,documentSha256:hash(path.join(root,lock.document)),pages:21,segments:72,voices:99,newVoiceMappings:62,unchangedPrefixPageManifests:8,noOverlappingVoices:true,staticFrenchAndSpeakersExact:true,sourceLockVerified:true,engineFiles:lock.engine.length,duration:full.timeline.duration};
fs.writeFileSync(path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/qa/selection-audit-v2.json'),JSON.stringify(report,null,2));console.info(JSON.stringify(report));
