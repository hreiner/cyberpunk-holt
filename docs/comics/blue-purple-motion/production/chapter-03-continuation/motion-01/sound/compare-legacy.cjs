const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {ROOT,RATE,FFMPEG,decode,frameAt,writeWave}=require('./mix-engine.cjs');
const output=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/comparison-v1');
if(fs.existsSync(output))throw Error('Comparatif existant conservé.');
fs.mkdirSync(output,{recursive:true});
const oldBacking='art-masters/motion-comics/blue-purple/pages-05-08/revision-02/soundtrack-v1/backing-pages05-08.wav';
const newPreview='art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/legacy-v2/preview-pages05-08.wav';
const timing=JSON.parse(fs.readFileSync(path.join(ROOT,'art-masters/motion-comics/blue-purple/pages-05-08/revision-02/timing-r2-v1.json')));
const prior=new Float32Array(decode(oldBacking));
for(const t of timing.tracks){const source=decode(t.audioFile),first=frameAt(t.start)*2,count=Math.min(source.length,frameAt(t.end-t.start)*2);for(let i=0;i<count;i++)prior[first+i]+=source[i];}
const next=decode(newPreview),specs=[{id:'door-footsteps',start:33.5,end:38.8},{id:'hesitant-starter',start:62.9,end:69.2},{id:'door-departure',start:75.9,end:81.7}],gap=.6;
const total=specs.reduce((s,x)=>s+2*(x.end-x.start)+2*gap,0),result=new Float32Array(frameAt(total)*2),segments=[];let cursor=0;
for(const spec of specs)for(const [version,source] of [['v5-same-voices-and-stereo',prior],['motion01-improved',next]]){
 const first=frameAt(spec.start)*2,last=frameAt(spec.end)*2,count=last-first,start=frameAt(cursor)*2;
 for(let i=0;i<count;i++){const frame=i>>1,envelope=Math.min(1,frame/(RATE*.008),((count>>1)-frame)/(RATE*.012));result[start+i]=source[first+i]*envelope;}
 segments.push({id:spec.id,version,start:cursor,end:cursor+spec.end-spec.start,sourceStart:spec.start,sourceEnd:spec.end});cursor+=spec.end-spec.start+gap;
}
const file=path.join(output,'comparison-pages05-08.wav'),measures=writeWave(file,result),aac=path.join(output,'comparison-pages05-08.m4a');
const r=spawnSync(FFMPEG,['-v','error','-n','-i',file,'-c:a','aac','-ac','2','-b:a','192k',aac]);if(r.status!==0)throw Error(String(r.stderr));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const report={schemaVersion:1,date:'2026-11-07',intention:'A/B équitable : mêmes voix et duplication mono unity dans les deux versions. Pour chaque scène : ancien backingv5 puis nouveau,600ms de silence entre extraits. Aucun changement de gain de voix.',sourceOldBacking:oldBacking,sourceNewPreview:newPreview,segments,files:[file,aac].map(f=>({file:path.relative(ROOT,f).replaceAll('\\','/'),sha256:hash(f)})),...measures,humanListening:'not-performed'};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
