const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {ROOT,RATE,frameAt,channels,decode}=require('./mix-engine.cjs');
const selection=JSON.parse(fs.readFileSync(path.join(__dirname,'SELECTION.json')));
const report=JSON.parse(fs.readFileSync(path.join(ROOT,selection.report)));
const output=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/sound/final-audit.json');
if(fs.existsSync(output))throw Error('Audit existant conservé.');
const relative=f=>path.relative(ROOT,f).replaceAll('\\','/');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const bytes=f=>fs.readFileSync(path.join(ROOT,f)).subarray(44);
const v8File=path.join(ROOT,'anime/motion-comics/projects/blue-purple-pages01-21-v8.json');
const v8=JSON.parse(fs.readFileSync(v8File));
const old=path.resolve(path.dirname(v8File),v8.music.audio);
if(hash(old)!==report.sourceChapterSha256)throw Error('Mauvaise sélection sourcev8.');
const oldPcm=fs.readFileSync(old).subarray(44),chapter=bytes(selection.backingChapter),complete=bytes(selection.backingFull),cover=bytes(selection.coverAudio),lot=bytes(selection.backingPages09To21),page17=bytes(selection.backingPage17);
const start=report.preservation.patchFirstByte,end=report.preservation.patchEndByte;
const checks={prefixExact:chapter.subarray(0,start).equals(oldPcm.subarray(0,start)),suffixExact:chapter.subarray(end).equals(oldPcm.subarray(end)),chapterDurationExact:chapter.length===oldPcm.length,coverDurationExact:cover.length===frameAt(12)*4,completeCoverExact:complete.subarray(0,cover.length).equals(cover),completeChapterExact:complete.subarray(cover.length).equals(chapter),page17Exact:chapter.subarray(start,end).equals(page17),lotExact:chapter.subarray(frameAt(226.6)*4).equals(lot),oneShotOnly:report.events.filter(e=>e.id==='single-shot-metal').length===1};
for(const [id,value]of Object.entries(checks))if(!value)throw Error(`Audit audio : ${id}`);
function measure(file){const pcm=decode(file);let peak=0,sum=0,clipped=0;for(const v of pcm){peak=Math.max(peak,Math.abs(v));sum+=v*v;clipped+=+(Math.abs(v)>=1);}return {file,sha256:hash(path.join(ROOT,file)),channels:channels(file),pcmFrames:pcm.length/2,duration:pcm.length/(RATE*2),peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/pcm.length),clippedSamples:clipped,decoded:true};}
const measured=[selection.coverAudio,selection.backingPage17,selection.backingFull,...selection.previews.map(p=>p.file)].map(measure);
if(measured.some(m=>m.channels!==2||m.clippedSamples))throw Error('Canaux ou écrêtage.');
const isolated=decode(report.isolatedShotMetal),preview=decode(selection.previews.find(p=>p.id==='page-17').file),anchor=report.anchors.oneShot.page,startFrame=frameAt(anchor),count=frameAt(.28);
let best={correlation:-1,lagSamples:null};
for(let lag=-88;lag<=88;lag++){
 let dot=0,left=0,right=0;for(let i=0;i<count;i+=4){const a=isolated[(startFrame+i)*2],b=preview[(startFrame+i+lag)*2];dot+=a*b;left+=a*a;right+=b*b;}
 const correlation=dot/Math.sqrt(left*right);if(correlation>best.correlation)best={correlation,lagSamples:lag};
}
if(best.correlation<.98||Math.abs(best.lagSamples/RATE)>1/24)throw Error('Tir AAC décalé.');
const voiceInputs=selection.previews.flatMap(p=>p.tracks).map(t=>t.audio);
const provenanceInputs=[report.sourceChapter,report.cover.source,...report.events.map(e=>e.audio),...voiceInputs];
const evidence={schemaVersion:1,date:'2026-11-08',selection:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-02/sound/SELECTION.json',sourceV8:relative(v8File),sourceV8Sha256:hash(v8File),checks,measured,shotCorrelation:{...best,lagMilliseconds:best.lagSamples/RATE*1000,windowSeconds:.28,searchMilliseconds:2},anchors:report.anchors,inputs:[...new Set(provenanceInputs)].map(f=>({file:f,sha256:hash(path.join(ROOT,f))})),newPaidCalls:0,newVoices:0,humanListening:'not-performed',note:'Niveaux et synchronisation mesurés ; la seconde ancre appartient au composé unique, sans second départ sonore. Hors17, PCM du chapitre v8 copié exactement.'};
fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output:relative(output),checks,measured,shotCorrelation:evidence.shotCorrelation}));
