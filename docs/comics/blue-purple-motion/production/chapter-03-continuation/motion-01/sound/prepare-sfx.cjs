const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {ROOT,RATE,decode,writeWave}=require('./mix-engine.cjs');
const folder=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound');
const output=path.join(folder,'sfx-prepared-v1');
if(fs.existsSync(output))throw Error('Préparation existante conservée.');
fs.mkdirSync(output,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const relative=f=>path.relative(ROOT,f).replaceAll('\\','/');
const targets={'capsule-close':-13,'elevator-travel':-20,'single-shot-metal':-10,'body-water-splash':-11};
const rows=[];
function measures(pcm){let peak=0,sum=0;for(const v of pcm){peak=Math.max(peak,Math.abs(v));sum+=v*v;}return {peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/pcm.length),duration:pcm.length/(RATE*2)};}
for(const name of fs.readdirSync(path.join(folder,'sfx-takes')).filter(x=>x.endsWith('.json'))){
 const journal=path.join(folder,'sfx-takes',name),record=JSON.parse(fs.readFileSync(journal));
 if(record.state!=='review')throw Error(`Prise non disponible : ${name}`);
 const source=path.join(path.dirname(journal),record.file);if(hash(source)!==record.sha256)throw Error('Source modifiée');
 const pcm=decode(source),sourceMeasures=measures(pcm),gainDb=targets[record.soundId]-sourceMeasures.peakDb;
 const prepared=Float32Array.from(pcm,v=>v*Math.pow(10,gainDb/20));
 const file=path.join(output,record.soundId+'.wav'),result=writeWave(file,prepared);
 const blocks=[];const size=Math.round(.005*RATE)*2;
 for(let i=0;i<prepared.length;i+=size){const m=measures(prepared.subarray(i,Math.min(prepared.length,i+size)));blocks.push({time:i/(RATE*2),peakDb:m.peakDb,rmsDb:m.rmsDb});}
 const strongest=blocks.reduce((a,b)=>a.rmsDb>b.rmsDb?a:b),maxPeak=Math.max(...blocks.map(b=>b.peakDb));
 const active=blocks.filter(b=>b.peakDb>=Math.max(-42,maxPeak-24)&&b.rmsDb>=strongest.rmsDb-25);
 const strong=blocks.filter(b=>b.peakDb>=Math.max(-30,maxPeak-18)&&b.rmsDb>=strongest.rmsDb-20);
 const trimStart=Math.max(0,(active[0]?.time??0)-.01);
 rows.push({id:record.soundId,audio:relative(file),sha256:hash(file),sourceAudio:relative(source),sourceSha256:hash(source),takeJournal:relative(journal),takeJournalSha256:hash(journal),provider:record.provider,model:record.request.model_id,requestedSeconds:record.requestedSeconds,actualCost:null,providerRequestId:null,constantGainDb:gainDb,sourceMeasures,...result,trimStart,activeOnset:active[0]?.time??null,strongOnset:strong[0]?.time??null,strongestBlock:strongest,strongRule:'Blocs5ms : peak>=max(-30,maxPeak-18)dB ET RMS>=maxBlockRMS-20dB ; début actif<=24/25dB sous maximum pour garder matière.',blocks,humanListening:'not-performed'});
}
const report={schemaVersion:1,date:'2026-11-07',scriptSha256:hash(__filename),newSfxRequests:rows.length,newRequestedSeconds:rows.reduce((s,x)=>s+x.requestedSeconds,0),cumulativeSfxRequests:6+rows.length,cumulativeRequestedSeconds:20+rows.reduce((s,x)=>s+x.requestedSeconds,0),humanListening:'not-performed',sounds:rows};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:relative(output),sounds:rows.map(({id,peakDb,rmsDb,trimStart,strongOnset,strongestBlock})=>({id,peakDb,rmsDb,trimStart,strongOnset,strongestBlock}))}));
