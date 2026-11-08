const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {ROOT,FFMPEG,channels,decode}=require('./mix-engine.cjs');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const args=process.argv.slice(2);
const option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const file=path.resolve(ROOT,option('--file','art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/soundtrack-v1/preview-renderer-stereo-aac.m4a'));
const output=path.resolve(ROOT,option('--output','art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/new-lot-aac-metrics-v1.json'));
if(fs.existsSync(output))throw Error('Mesure existante conservée.');
const pcm=decode(file);let peak=0,sum=0,clipped=0;for(const value of pcm){peak=Math.max(peak,Math.abs(value));sum+=value*value;clipped+=+(Math.abs(value)>=1);}
const result=spawnSync(FFMPEG,['-hide_banner','-nostats','-xerror','-err_detect','explode','-i',file,'-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8',maxBuffer:4*1024*1024});
if(result.status!==0)throw Error(result.stderr);
const summary=result.stderr.slice(result.stderr.lastIndexOf('Summary:'));
const capture=re=>{const m=re.exec(summary);return m?Number(m[1]):null;};
const report={schemaVersion:1,date:'2026-11-07',file:path.relative(ROOT,file).replaceAll('\\','/'),sha256:hash(file),scriptSha256:hash(__filename),decoded:true,channels:channels(file),sampleRate:44100,durationPcmSeconds:pcm.length/(44100*2),peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/pcm.length),clippedSamples:clipped,integratedLufs:capture(/Integrated loudness:[\s\S]*?I:\s+([\d.-]+)/),loudnessRangeLu:capture(/Loudness range:[\s\S]*?LRA:\s+([\d.-]+)/),truePeakDb:capture(/True peak:[\s\S]*?Peak:\s+([\d.-]+)/),humanListening:'not-performed',ffmpegSummary:summary};
if(clipped||report.truePeakDb===null||report.truePeakDb>=0)throw Error('Saturation ou mesure truepeak absente.');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
