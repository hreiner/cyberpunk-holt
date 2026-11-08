const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {ROOT,FFMPEG}=require('./mix-engine.cjs');
const run=args=>{const r=spawnSync(FFMPEG,['-v','error',...args],{maxBuffer:32*1024*1024});if(r.status!==0)throw Error(String(r.stderr));return r.stdout;};
const measure=(buffer,channels)=>{
 const peak=Array(channels).fill(0),sum=Array(channels).fill(0);let count=0;
 for(let i=0;i<buffer.length;i+=4){const c=count%channels,v=buffer.readFloatLE(i);peak[c]=Math.max(peak[c],Math.abs(v));sum[c]+=v*v;count++;}
 return {channels,peakDb:peak.map(x=>20*Math.log10(x)),rmsDb:sum.map(x=>10*Math.log10(x/(count/channels)))};
};
const routes=[
 {id:'native-mono',channels:1,filter:'anull'},
 {id:'aformat-stereo',channels:2,filter:'aformat=channel_layouts=stereo'},
 {id:'pan-stereo-unity',channels:2,filter:'pan=stereo|c0=c0|c1=c0'}
];
const results=routes.map(route=>({...route,...measure(run(['-f','lavfi','-i','sine=frequency=880:sample_rate=44100:duration=1','-af',route.filter,'-f','f32le','pipe:1']),route.channels)}));
const report={schemaVersion:1,date:'2026-11-07',source:'FFmpeg lavfi sine880Hz mono44.1kHz1s',results,recommendation:'Détecter canaux de chaque voix : mono => pan=stereo|c0=c0|c1=c0, stéréo => aformat stereo sans matrice supplémentaire. Le lecteur WebAudio distribue mono dans L/R sans atténuation. Appliquer conversion explicite avant amix, puis AAC stereo192k.',humanListening:'not-performed'};
const output=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/channel-conversion.json');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
