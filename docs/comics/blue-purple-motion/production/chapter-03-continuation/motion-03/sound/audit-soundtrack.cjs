const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const engine=require('./mix-engine.cjs');
const {ROOT,RATE,frameAt,channels,decode}=engine;
const {readDocument}=require('../../../../../../../anime/motion-comics/sequence.cjs');
const selectionFile=path.join(__dirname,'SELECTION.json');
const selection=JSON.parse(fs.readFileSync(selectionFile));
const report=JSON.parse(fs.readFileSync(path.join(ROOT,selection.report)));
const acoustic=JSON.parse(fs.readFileSync(path.join(ROOT,report.acousticAnchors)));
const output=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/sound/final-audit.json');
if(fs.existsSync(output))throw Error('Audit existant conservé.');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const bytes=file=>fs.statSync(path.join(ROOT,file)).size-44;
function rangeEqual(a,offsetA,b,offsetB,length){
 const first=fs.openSync(path.join(ROOT,a),'r'),second=fs.openSync(path.join(ROOT,b),'r'),left=Buffer.alloc(1024*1024),right=Buffer.alloc(1024*1024);let equal=true;
 try{for(let offset=0;offset<length;offset+=left.length){const count=Math.min(left.length,length-offset),l=fs.readSync(first,left,0,count,44+offsetA+offset),r=fs.readSync(second,right,0,count,44+offsetB+offset);if(l!==count||r!==count||!left.subarray(0,count).equals(right.subarray(0,count))){equal=false;break;}}}finally{fs.closeSync(first);fs.closeSync(second);}return equal;
}
function rangeHash(file,length){const fd=fs.openSync(path.join(ROOT,file),'r'),buffer=Buffer.alloc(1024*1024),digest=crypto.createHash('sha256');try{for(let offset=0;offset<length;offset+=buffer.length){const count=Math.min(buffer.length,length-offset);if(fs.readSync(fd,buffer,0,count,44+offset)!==count)throw Error('PCM tronqué');digest.update(buffer.subarray(0,count));}}finally{fs.closeSync(fd);}return digest.digest('hex');}
const prefixBytes=frameAt(report.prefixSeconds)*4,lotBytes=bytes(report.backingPages09To21);
const checks={prefix238Point6Exact:rangeEqual(report.sourceBacking,0,report.backingFull,0,prefixBytes),newLotExact:rangeEqual(report.backingFull,prefixBytes,report.backingPages09To21,0,lotBytes),fullDuration:bytes(report.backingFull)===frameAt(report.fullDuration)*4,stereo:channels(report.backingFull)===2,oneShot:report.events.filter(e=>e.soundId==='single-shot-metal').length===1,oneSplash:report.events.filter(e=>e.soundId==='body-water-splash').length===1,oneResidentContact:report.events.filter(e=>e.id==='resident-single-contact').length===1,noVoiceInputInBacking:[...report.sections,...report.events].every(e=>!e.audio.includes('/voice')&&!e.audio.includes('/takes/')),anchorsLocked:acoustic.status==='locked'&&hash(path.join(ROOT,report.acousticAnchors))===report.acousticAnchorsSha256};
const origin=readDocument(path.join(ROOT,report.sourceSelection));
const voiceKey=t=>path.resolve(ROOT,t.audioFile)+'\0'+Math.round((t.end-t.start)*1e6);
const oldVoices=origin.timeline.tracks.filter(t=>t.start>=report.prefixSeconds-1e-6).map(voiceKey).sort();
const newVoices=report.tracks.map(voiceKey).sort();
checks.same62TakesAndDurations=oldVoices.length===62&&JSON.stringify(oldVoices)===JSON.stringify(newVoices);
for(const row of report.inputs){if(hash(path.join(ROOT,row.file))!==row.sha256)throw Error(`Source changée après mix : ${row.file}`);}
let cursor=0;
for(const page of report.pageBackings){const length=bytes(page.file),first=cursor;cursor+=length;if(!rangeEqual(report.backingPages09To21,first,page.file,0,length))throw Error(`Coupe audio page non raccordée : ${page.id}`);}
checks.all13PageCutsExact=report.pageBackings.length===13&&cursor===lotBytes;
const anchor=id=>acoustic.anchors.find(a=>a.id===id).globalSeconds;
checks.metal80ms=Math.abs(anchor('metalImpact')-anchor('oneShot')-.08)<1e-7;
const timing=JSON.parse(fs.readFileSync(path.join(ROOT,report.timing)));
const p9=timing.pages.find(p=>p.pageNumber===9),f9=p9.voiceTracks.find(t=>t.panel===1&&t.speaker==='franklyn');
checks.franklynAfterTerminalMap=f9.globalStart>=anchor('terminalMapReady');
const p15=timing.pages.find(p=>p.pageNumber===15),f15=p15.voiceTracks.find(t=>t.panel===2&&t.speaker==='franklyn');
checks.capsuleAfterFranklyn=anchor('capsuleClosingStart')>=f15.globalEnd+.19;
for(const [id,ok]of Object.entries(checks))if(!ok)throw Error(`Vérification audio : ${id}`);
const measurements=[];
function measure(file){
 const data=decode(file);let peak=0,sum=0,clipped=0;for(const v of data){peak=Math.max(peak,Math.abs(v));sum+=v*v;clipped+=+(Math.abs(v)>=1);}
 if(clipped)throw Error(`Audio écrêté : ${file}`);
 return {file,sha256:hash(path.join(ROOT,file)),channels:channels(file),duration:data.length/(RATE*2),peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/data.length),clippedSamples:clipped,decoded:true};
}
for(const file of [report.backingPages09To21,report.backingFull,report.aac.file]){measurements.push(measure(file));engine.clearDecodeCache();if(global.gc)global.gc();}
const played=decode(report.aac.file),correlations=[];
for(const id of ['single-shot-metal','resident-single-contact','body-water-splash']){
 const event=report.events.find(e=>e.id===id),window=report.windows.find(w=>w.id===id),stem=decode(window.isolatedStem),offset=frameAt(event.start-window.isolatedStemStartLot),at=frameAt(event.start),count=frameAt(.26);let best={correlation:-1,lagSamples:null};
 for(let lag=-88;lag<=88;lag++){
  let dot=0,left=0,right=0;for(let i=0;i<count;i+=4){const a=stem[(offset+i)*2],b=played[(at+i+lag)*2];dot+=a*b;left+=a*a;right+=b*b;}
  const correlation=dot/Math.sqrt(left*right);if(correlation>best.correlation)best={correlation,lagSamples:lag};
 }
 const voiceOverlap=report.tracks.some(t=>t.start<event.start+.26&&t.end>event.start);
 const minimumCorrelation=id==='single-shot-metal'?.95:.65;
 if(!voiceOverlap&&(best.correlation<minimumCorrelation||Math.abs(best.lagSamples/RATE)>1/24))throw Error(`Accent AAC décalé : ${id}`);
 correlations.push({id,...best,lagMilliseconds:best.lagSamples/RATE*1000,voiceOverlap,minimumCorrelation,strictThresholdApplied:!voiceOverlap,note:voiceOverlap?'Informational NCC only: the voice overlaps this accent; source onset and shared clock remain the synchronization evidence.':id==='resident-single-contact'?'NCC is measured in the actual city ambience, not an isolated stem. A0.65 detection threshold accepts background energy while retaining a time-alignment check.':null});
}
const evidence={schemaVersion:1,date:'2026-11-08',selection:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/sound/SELECTION.json',selectionSha256:hash(selectionFile),checks,measurements,correlations,prefixSha256:rangeHash(report.backingFull,prefixBytes),sourceSelection:report.sourceSelection,sourceSelectionSha256:hash(path.join(ROOT,report.sourceSelection)),timingSha256:hash(path.join(ROOT,report.timing)),newPaidCalls:0,humanListening:'not-performed'};
fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(evidence));
