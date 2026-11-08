const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../../..'),folder=path.join(root,'anime/motion-comics/projects');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const old=readDocument(path.join(folder,'blue-purple-pages09-21-motion01.json'));
const current=readDocument(path.join(folder,'blue-purple-pages09-21-motion02.json'));
const changes=[];
for(let i=0;i<old.pages.length;i++){
 const a=structuredClone(old.pages[i].data),b=structuredClone(current.pages[i].data);
 delete a.version;delete b.version;
 for(let j=0;j<a.panels.length;j++){
  changes.push({page:i+9,panel:a.panels[j].id,before:a.panels[j].label,after:b.panels[j].label});
  delete a.panels[j].label;delete b.panels[j].label;
 }
 assert.deepEqual(a,b,'Modification visuelle/audio hors libellé.');
}
assert.deepEqual(current.timeline,old.timeline,'Chronologie modifiée.');
assert.equal(current.musicFile,old.musicFile,'Backing différent.');
const result={status:'completed',reason:'Replace technical case/after/detail labels with French scene labels. The approved drawings, balloons, motion, timings and all audio remain exactly selected.',pageDataEqualExceptVersionAndLabels:true,identicalTimeline:true,identicalAudio:true,pageCanvasAnimationProofReused:'animation/integrated-v3',changes};
fs.writeFileSync(path.join(__dirname,'METADATA-CORRECTION.json'),JSON.stringify(result,null,2));console.info(JSON.stringify({status:result.status,changedLabels:changes.length,timingAndAudioUnchanged:true}));
