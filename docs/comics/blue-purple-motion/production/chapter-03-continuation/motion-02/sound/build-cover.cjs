const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {ROOT,RATE,FFMPEG,frameAt,decode,writeWave}=require('./mix-engine.cjs');
const source='public/assets/audio/background/music-neon.mp3';
const output=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/sound/cover-v1');
if(fs.existsSync(output))throw Error('Couverture sonore existante conservée.');
fs.mkdirSync(output,{recursive:true});
const relative=f=>path.relative(ROOT,f).replaceAll('\\','/');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const duration=12,trimStart=24,fadeIn=.8,fadeOut=1.4,targetRmsDb=-25,maxPeakDb=-8;
const sourcePcm=decode(source),first=frameAt(trimStart)*2,count=frameAt(duration)*2,pcm=new Float32Array(count);
let sum=0,peak=0;
for(let i=0;i<count;i++){
 const t=(i>>1)/RATE,env=Math.min(1,t/fadeIn,(duration-t)/fadeOut),v=sourcePcm[first+i]*env;
 pcm[i]=v;sum+=v*v;peak=Math.max(peak,Math.abs(v));
}
const priorRmsDb=10*Math.log10(sum/count),priorPeakDb=20*Math.log10(peak);
const gainDb=Math.min(targetRmsDb-priorRmsDb,maxPeakDb-priorPeakDb),gain=Math.pow(10,gainDb/20);
for(let i=0;i<count;i++)pcm[i]*=gain;
const backingFile=path.join(output,'cover-backing.wav'),measures=writeWave(backingFile,pcm);
const aacFile=path.join(output,'cover-audition.m4a');
const encode=spawnSync(FFMPEG,['-v','error','-n','-i',backingFile,'-c:a','aac','-ac','2','-b:a','192k',aacFile]);if(encode.status!==0)throw Error(String(encode.stderr));
const measured=spawnSync(FFMPEG,['-hide_banner','-nostats','-i',aacFile,'-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8',maxBuffer:2*1024*1024});if(measured.status!==0)throw Error(measured.stderr);
const summary=measured.stderr.slice(measured.stderr.lastIndexOf('Summary:'));
const value=re=>Number(re.exec(summary)?.[1]);
const aacPcm=decode(aacFile);let aacPeak=0,aacSum=0,clipped=0;for(const v of aacPcm){aacPeak=Math.max(aacPeak,Math.abs(v));aacSum+=v*v;clipped+=+(Math.abs(v)>=1);}
const report={schemaVersion:1,date:'2026-11-08',status:'cover-prepared',duration,source,sourceSha256:hash(path.join(ROOT,source)),trimStart,sourceEnd:trimStart+duration,fadeIn,fadeOut,priorRmsDb,priorPeakDb,gainDb,gain,targetRmsDb,maxPeakDb,backing:relative(backingFile),backingSha256:hash(backingFile),...measures,aac:{file:relative(aacFile),sha256:hash(aacFile),channels:2,bitRateTarget:192000,peakDb:20*Math.log10(aacPeak),rmsDb:10*Math.log10(aacSum/aacPcm.length),integratedLufs:value(/Integrated loudness:[\s\S]*?I:\s+([\d.-]+)/),truePeakDb:value(/True peak:[\s\S]*?Peak:\s+([\d.-]+)/),clippedSamples:clipped,decoded:true},provider:'Reused HOLT ElevenLabs original music_v2_5, existing October2026 generation',provenance:'public/assets/audio/ATTRIBUTION.md and docs/art/audio-generation/background.json; no new generation.',newPaidCalls:0,newVoices:0,humanListening:'not-performed'};
if(clipped||report.aac.truePeakDb>=0)throw Error('Couverture écrêtée.');
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});fs.copyFileSync(__filename,path.join(output,'build-cover.cjs'),fs.constants.COPYFILE_EXCL);console.log(JSON.stringify(report));
