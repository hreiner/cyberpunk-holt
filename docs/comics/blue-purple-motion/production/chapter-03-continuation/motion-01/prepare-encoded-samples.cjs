const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../../../..'),timing=require('./TIMING.json');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const full=readDocument(path.join(root,'anime/motion-comics/projects/blue-purple-pages01-21-v6.json'));
const samples=timing.pages.map(p=>({id:p.id+'-reading',time:p.segments[0].holdStart+.75}));
for(const e of timing.events)for(const [suffix,delta] of [['before',-1/24],['exact',0],['after',.125]])samples.push({id:e.id+'-'+suffix,time:e.time+delta});
for(const key of ['09-2','19-2']){
 const segment=timing.pages.flatMap(p=>p.segments).find(s=>s.panelKey===key);
 samples.push({id:key+'-reflection-a',time:segment.holdStart+.7},{id:key+'-reflection-b',time:segment.holdStart+1.7});
}
samples.push({id:'ending',time:timing.duration-.1});
const complete=samples.map(s=>({...s,time:s.time+226.6}));
for(const [index,page] of full.pages.entries())if(index<8){
 const t=full.timeline.pages[index];complete.push({id:`retained-page-${index+1}`,time:t.start+Math.min(t.duration/2,7)});
 for(const layer of page.data.motionLayers??[])if(layer.id.includes('punch')||layer.panelId==='p05-c03'){
  for(const [i,frame] of layer.frames.entries())complete.push({id:`retained-john-pose-${i}`,time:t.start+layer.startSeconds+frame.atSeconds+.03});
 }
}
for(const [name,data] of [['ENCODED-SAMPLES-LOT.json',samples],['ENCODED-SAMPLES-FULL.json',complete]])fs.writeFileSync(path.join(__dirname,name),JSON.stringify(data.sort((a,b)=>a.time-b.time),null,2));
console.info(JSON.stringify({lot:samples.length,complete:complete.length}));
