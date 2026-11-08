const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {ROOT,RATE,FFMPEG,frameAt,channels,decode}=require('./mix-engine.cjs');
const actual=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/exports/pages-01-21/render-v2/motion-comic.mp4');
const folder=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/full-qa-v1');
if(fs.existsSync(folder))throw Error('QA existante conservée.');fs.mkdirSync(folder,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const relative=f=>path.relative(ROOT,f).replaceAll('\\','/');
const timingFile=path.resolve(__dirname,'../TIMING-FULL.json'),timing=JSON.parse(fs.readFileSync(timingFile));
const selection=JSON.parse(fs.readFileSync(path.join(__dirname,'SELECTION.json'))),backing=path.join(ROOT,selection.backingFull);
const filters=timing.tracks.map((t,i)=>`[${i}:a]atrim=duration=${t.end-t.start},asetpts=PTS-STARTPTS,${channels(t.audioFile)===1?'pan=stereo|c0=c0|c1=c0':'aformat=channel_layouts=stereo'},adelay=${Math.round(t.start*1000)}:all=1[a${i}]`);
filters.push(`[${timing.tracks.length}:a]atrim=duration=${timing.duration},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo,volume=1:eval=frame[bed]`);
filters.push(`${timing.tracks.map((_,i)=>`[a${i}]`).join('')}[bed]amix=inputs=${timing.tracks.length+1}:normalize=0,apad,atrim=duration=${timing.duration}[audio]`);
const filterFile=path.join(folder,'filter.txt');fs.writeFileSync(filterFile,filters.join(';'));
const expected=path.join(folder,'expected-full-aac.m4a'),args=[];timing.tracks.forEach(t=>args.push('-i',t.audioFile));args.push('-i',backing,'-filter_complex_script',filterFile,'-map','[audio]','-c:a','aac','-ac','2','-b:a','192k',expected);
const encode=spawnSync(FFMPEG,['-hide_banner','-loglevel','error','-n',...args],{maxBuffer:16*1024*1024});if(encode.status!==0)throw Error(String(encode.stderr));
function essence(file){const r=spawnSync(FFMPEG,['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],{maxBuffer:32*1024*1024});if(r.status!==0)throw Error(String(r.stderr));return {bytes:r.stdout.length,sha256:sha(r.stdout)};}
const full=decode(actual),planned=decode(expected);
const pcmSha=pcm=>sha(Buffer.from(pcm.buffer,pcm.byteOffset,pcm.byteLength));
const fullSha=pcmSha(full),plannedSha=pcmSha(planned),actualEssence=essence(actual),expectedEssence=essence(expected);
const legacy=decode('art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/legacy-v2/preview-renderer-stereo-aac.m4a');
const newLot=decode('art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/soundtrack-v2/preview-renderer-stereo-aac.m4a');
const specs=[
 {id:'punch',offset:144.6,anchor:11.08,seconds:.42,pcm:legacy},
 {id:'shot-glass',offset:144.6,anchor:16.4,seconds:1.2,pcm:legacy},
 {id:'alley-footsteps',offset:144.6,anchor:34.68,seconds:1.4,pcm:legacy},
 {id:'starter',offset:144.6,anchor:63.5,seconds:1.4,pcm:legacy},
 ...['capsuleClose','oneShot','residentImpact','bodySplash','refugeOpen'].map(id=>({id,offset:226.6,anchor:timing.events.find(e=>e.id===id).time-226.6,seconds:id==='residentImpact'?.42:1.1,pcm:newLot}))
];
function correlate(spec){
 const referenceStart=frameAt(Math.max(0,spec.anchor-.04)),fullStart=frameAt(spec.offset+Math.max(0,spec.anchor-.04)),count=frameAt(spec.seconds),maxLag=88;
 let best={correlation:-1,lagSamples:null};
 for(let lag=-maxLag;lag<=maxLag;lag++){
  let dot=0,left=0,right=0;
  for(let i=0;i<count;i+=4){const a=spec.pcm[(referenceStart+i)*2],b=full[(fullStart+i+lag)*2];dot+=a*b;left+=a*a;right+=b*b;}
  const correlation=dot/Math.sqrt(left*right);if(correlation>best.correlation)best={correlation,lagSamples:lag};
 }
 if(best.correlation<.98||Math.abs(best.lagSamples/RATE)>1/24)throw Error(`Fenêtre sonore décalée : ${spec.id}, ${JSON.stringify(best)}`);
 return {id:spec.id,referenceAnchor:spec.anchor,fullAnchor:spec.offset+spec.anchor,windowSeconds:spec.seconds,...best,lagMilliseconds:best.lagSamples/RATE*1000,withinOneFrame24:true};
}
const windows=specs.map(correlate);
const report={schemaVersion:1,date:'2026-11-07',actualFile:relative(actual),actualSha256:sha(fs.readFileSync(actual)),expectedFile:relative(expected),expectedSha256:sha(fs.readFileSync(expected)),timing:relative(timingFile),timingSha256:sha(fs.readFileSync(timingFile)),backing:relative(backing),backingSha256:sha(fs.readFileSync(backing)),duration:timing.duration,trackCount:timing.tracks.length,channels:channels(actual),targetBitRate:192000,actualPcmSamples:full.length,expectedPcmSamples:planned.length,actualPcmSha256:fullSha,expectedPcmSha256:plannedSha,pcmIdentical:full.length===planned.length&&fullSha===plannedSha,actualEssence,expectedEssence,aacEssenceIdentical:actualEssence.bytes===expectedEssence.bytes&&actualEssence.sha256===expectedEssence.sha256,windows,method:'Reproduction audio seule depuis les99prises et le backing gelés, même atrim/asetpts/pan/adelay/amix/AAC que render. Fenêtres comparées au PCM des préécoutes5–8/9–21 par corrélation normalisée et recherche±2ms.',humanListening:'not-performed'};
if(!report.pcmIdentical||!report.aacEssenceIdentical)throw Error('Le mix complet exporté diffère du mix gelé reproduit.');
fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report));
