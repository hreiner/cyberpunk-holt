/* Real selected v9 inputs, real engine validation; no generated fixtures or voice work. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {getTiming}=require('./retime.cjs');
const root=path.resolve(__dirname,'../../../../../../..'),contract=require('./TIMING.json');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(sha(path.join(root,contract.source)),contract.sourceSha256);
assert.equal(sha(path.join(__dirname,'retime.cjs')),contract.helperSha256);
const project=require(path.join(root,'anime/motion-comics/sequence.cjs')).readDocument(path.join(root,contract.source));
let cursor=0,voices=0,layers=0,effects=0;
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
project.pages.forEach((page,pageNumber)=>{
 const source=page.data,before=JSON.stringify(source),t=getTiming(source,pageNumber),record=contract.pages[pageNumber];
 assert.equal(JSON.stringify(source),before);near(cursor,record.globalStart);near(t.newTimeline.duration,record.duration);
 if(pageNumber<9)assert.deepEqual(t.data,source);
 t.oldTimeline.tracks.forEach((old,index)=>{const next=t.newTimeline.tracks[index];assert.equal(next.audio,old.audio);assert.equal(next.speaker,old.speaker);near(next.end-next.start,old.end-old.start);near(t.mapPageTime((old.start+old.end)/2),(next.start+next.end)/2);voices++;});
 for(let i=1;i<t.points.length;i++){assert(t.points[i].old>=t.points[i-1].old);assert(t.points[i].new>=t.points[i-1].new);}
 for(let i=0;i<(source.effects??[]).length;i++){const old=source.effects[i],next=t.data.effects[i];for(const name of ['startSeconds','endSeconds'])if(old[name]!==undefined)near(next[name],t.mapPageTime(old[name]));assert.equal(next.frequency,old.frequency);effects++;}
 for(let i=0;i<(source.motionLayers??[]).length;i++){const old=source.motionLayers[i],next=t.data.motionLayers[i];near(next.startSeconds,t.mapPageTime(old.startSeconds));near(next.endSeconds,t.mapPageTime(old.endSeconds));for(let k=0;k<old.frames.length;k++)near(next.startSeconds+next.frames[k].atSeconds,t.mapPageTime(old.startSeconds+old.frames[k].atSeconds));layers++;}
 for(const panel of t.panels){const last=t.newTimeline.tracks.filter(v=>v.panel===source.panels.findIndex(p=>p.id===panel.id)).at(-1);if(last)assert(panel.end-last.end>=panel.tail-1e-8);}
 near(t.mapPageTime(t.oldTimeline.duration),t.newTimeline.duration);cursor+=t.newTimeline.duration;
});
near(cursor,contract.duration);near(contract.unchangedPrefixSeconds,238.6);assert.equal(voices,99);
if(contract.revision===2){
 const previous=require('./TIMING-v1.json'),changed=[];
 contract.pages.forEach((page,p)=>{near(page.duration,previous.pages[p].duration);page.voiceTracks.forEach((voice,i)=>{const before=previous.pages[p].voiceTracks[i];if(Math.abs(voice.start-before.start)>1e-8)changed.push({page:p,cue:voice.cueId,speaker:voice.speaker,shift:voice.start-before.start});});});
 assert.equal(changed.length,1);assert.equal(changed[0].page,9);assert.equal(changed[0].speaker,'franklyn');assert.equal(changed[0].cue,'bp-l040');near(changed[0].shift,1.1);
}
console.log(JSON.stringify({pages:22,voices,existingEffectsChecked:effects,existingLayersChecked:layers,sourceImmutable:true,voiceDurationsExact:true,voiceIntervalSlopeOne:true,unchangedPrefixSeconds:238.6,duration:cursor}));
