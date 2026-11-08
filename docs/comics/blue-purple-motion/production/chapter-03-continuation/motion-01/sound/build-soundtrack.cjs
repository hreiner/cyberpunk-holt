const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const engine=require('./mix-engine.cjs');
const {ROOT,RATE,FFMPEG,frameAt,channels,decode,mixBacking,writeWave}=engine;
const relative=f=>path.relative(ROOT,f).replaceAll('\\','/');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const master=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound');
const timingFile=path.resolve(__dirname,'../TIMING.json');
const timing=JSON.parse(fs.readFileSync(timingFile));
const version=process.argv.includes('--version')?process.argv[process.argv.indexOf('--version')+1]:'1';
if(!/^\d+$/.test(version))throw Error('Version numérique requise.');
const output=path.join(master,`soundtrack-v${version}`);
if(fs.existsSync(output))throw Error('Mix existant conservé ; nouvelle version requise.');
fs.mkdirSync(output,{recursive:true});
const newReportFile=path.join(master,'sfx-prepared-v1/report.json');
const localReportFile=path.join(master,'local-v1/report.json');
const oldReportFile=path.join(ROOT,'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/sfx-measurements-v3.json');
const foleyReportFile=path.join(ROOT,'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/foley-local-v1/report.json');
const sounds=new Map([newReportFile,localReportFile,oldReportFile,foleyReportFile].flatMap(f=>JSON.parse(fs.readFileSync(f)).sounds).map(s=>[s.id,s]));
const page=id=>{const row=timing.pages.find(p=>p.id===`page-${String(id).padStart(2,'0')}`);if(!row)throw Error(`Page absente : ${id}`);return row;};
const panel=key=>{const row=timing.pages.flatMap(p=>p.segments).find(s=>s.panelKey===key);if(!row)throw Error(`Case absente : ${key}`);return row;};
const anchor=id=>{const row=timing.events.find(e=>e.id===id);if(!row)throw Error(`Ancre absente : ${id}`);return row.time;};
const music=(id,start,end,asset,gain,extras={})=>({id,start,end,audio:`public/assets/audio/background/music-${asset}.mp3`,gain,fadeIn:.8,fadeOut:.8,speechMultiplier:.28,...extras});
const ambience=(id,start,end,asset,gain,extras={})=>({id,start,end,audio:`public/assets/audio/${asset}`,gain,fadeIn:.8,fadeOut:.8,speechMultiplier:.7,category:'ambience',...extras});
const crossfade=.8;
const sections=[
 music('neon-access',0,page(14).start+crossfade,'neon',.30,{sourceOffset:30}),
 music('neon-shop',page(14).start,page(16).start+crossfade,'neon',.23,{sourceOffset:30+page(14).start}),
 music('pressure-neural',page(16).start,page(17).start+crossfade,'pressure',.20,{sourceOffset:18}),
 music('pressure-ambush',page(17).start,page(18).start+crossfade,'pressure',.38,{sourceOffset:18+page(17).start-page(16).start}),
 music('pressure-hide',page(18).start,page(19).start+crossfade,'pressure',.11,{sourceOffset:18+page(18).start-page(16).start}),
 music('pressure-return',page(19).start,page(20).start+crossfade,'pressure',.17,{sourceOffset:18+page(19).start-page(16).start}),
 music('pressure-quay',page(20).start,page(21).start+crossfade,'pressure',.075,{sourceOffset:18+page(20).start-page(16).start}),
 music('afterglow-refuge',page(21).start,timing.duration,'afterglow',.29,{fadeOut:2,speechMultiplier:.32}),
 ambience('outside-city',0,page(12).end,'background/ambience-night-city.mp3',.16,{fadeOut:1.4}),
 ambience('access-infrastructure',page(10).start,page(14).start+crossfade,'background/ambience-industrial.mp3',.14),
 ambience('shop-room-tone',page(14).start,page(17).start+crossfade,'background/ambience-vents.mp3',.20),
 ambience('atrium-city',page(17).start,panel('18-2').start+.35,'background/ambience-night-city.mp3',.18,{fadeOut:.45}),
 ambience('apartment-room',panel('18-2').start,panel('19-2').start+crossfade,'background/ambience-vents.mp3',.11),
 ambience('resident-elevator-tone',panel('19-2').start,page(20).start+crossfade,'background/ambience-industrial.mp3',.13),
 ambience('quay-city',panel('19-3').start,page(21).start+crossfade,'background/ambience-night-city.mp3',.11),
 ambience('outfall-water',panel('19-3').start,timing.duration,'sewer-drips.wav',.14,{fadeIn:1.4,fadeOut:2,speechMultiplier:.75}),
 ambience('refuge-ventilation',anchor('refugeOpen'),timing.duration,'background/ambience-vents.mp3',.18,{fadeOut:2})
];
function event(id,soundId,start,extras={}){
 const sound=sounds.get(soundId);if(!sound)throw Error(`Son absent : ${soundId}`);
 return {id,soundId,audio:sound.audio,sourceSha256:sound.sha256,provider:sound.provider,start,gain:1,speechMultiplier:.75,...extras};
}
const events=[
 event('terminal-map','terminal-confirm',anchor('terminalMap'),{speechMultiplier:.8}),
 event('implant-reservation','implant-confirm',anchor('implantConfirm'),{speechMultiplier:.9}),
 event('elevator-up','elevator-travel',panel('12-3').holdStart+.12,{gain:Math.pow(10,3/20),speechMultiplier:.72,duration:4}),
 event('repair-tool','repair-tool',panel('15-1').holdStart+.3,{speechMultiplier:.7}),
 event('connector-seat','connector-seat',anchor('connector'),{speechMultiplier:.9}),
 event('machine-power','machine-power',anchor('connector')+.25,{speechMultiplier:.7}),
 event('capsule-close','capsule-close',anchor('capsuleClose'),{trimStart:.195,duration:1.95,speechMultiplier:.85,fadeOut:.08}),
 event('neural-unlock','neural-unlock',anchor('neuralUnlock'),{duration:Math.min(2.5,panel('16-1').end-anchor('neuralUnlock')+.15),speechMultiplier:.9,fadeOut:.22}),
 event('single-shot-metal','single-shot-metal',anchor('oneShot'),{duration:1.7,speechMultiplier:.7,speechRampSeconds:.04,fadeOut:.16}),
 event('group-running','footsteps',panel('17-3').holdStart+.05,{duration:Math.min(3.4,panel('17-3').end-panel('17-3').holdStart-.05),gain:Math.pow(10,10/20),speechMultiplier:.78,fadeOut:.22}),
 event('resident-cloth','cloth-shift',panel('18-1').holdStart+.25,{speechMultiplier:.8}),
 event('resident-single-contact','punch-wood',anchor('residentImpact'),{trimStart:1.132,duration:.34,gain:Math.pow(10,-4/20),speechMultiplier:1,fadeOut:.04}),
 event('apartment-lock','lock-click',panel('18-2').holdStart+.10,{gain:Math.pow(10,5/20),speechMultiplier:.85}),
 event('pursuers-passing','footsteps',panel('18-3').holdStart-.1,{trimStart:.15,duration:2.6,gain:Math.pow(10,-2/20),speechMultiplier:.75,fadeOut:1.1}),
 event('door-peek','cloth-shift',panel('19-1').holdStart+.15,{gain:.8,speechMultiplier:.8}),
 event('elevator-down','elevator-travel',panel('19-2').holdStart+.12,{gain:Math.pow(10,2/20),speechMultiplier:.72,duration:4}),
 event('quay-cloth','cloth-shift',panel('20-2').holdStart+.18,{speechMultiplier:.85}),
 event('body-water-splash','body-water-splash',anchor('bodySplash'),{duration:3.2,speechMultiplier:.72,speechRampSeconds:.06,fadeOut:.3}),
 event('refuge-open','rear-door',anchor('refugeOpen'),{trimStart:.015,duration:1.8,gain:Math.pow(10,6/20),speechMultiplier:.82,speechRampSeconds:.05,fadeOut:.16})
];
for(const e of events){
 const available=decode(e.audio).length/(RATE*2)-(e.trimStart??0);
 e.duration=Math.min(e.duration??available,available,timing.duration-e.start);
 if(e.duration<=0||e.start<0||e.start>=timing.duration)throw Error(`Événement hors temps : ${e.id}`);
}
const silences=[
 {id:'connector-detail',at:anchor('connector'),lead:.08,hold:.18,release:.35,floor:.3},
 {id:'capsule-detail',at:anchor('capsuleClose'),lead:.12,hold:.35,release:.55,floor:.2},
 {id:'neural-focus',at:anchor('neuralUnlock'),lead:.14,hold:.8,release:.6,floor:.1},
 {id:'shot-accent',at:anchor('oneShot'),lead:.06,hold:.18,release:.4,floor:0},
 {id:'resident-contact',at:anchor('residentImpact'),lead:.04,hold:.13,release:.28,floor:.12},
 {id:'water-gesture',at:anchor('bodySplash'),lead:.12,hold:1.2,release:.8,floor:0},
 {id:'door-material',at:anchor('refugeOpen'),lead:.06,hold:.18,release:.5,floor:.2}
];
const backing=mixBacking({duration:timing.duration,sections,tracks:timing.tracks,events,silences});
const files=[];
const save=(name,pcm,start,end)=>{const file=path.join(output,name),measures=writeWave(file,pcm,start,end);const row={audio:relative(file),sha256:hash(file),...measures};files.push(row);return row;};
const backingRecord=save('backing-pages09-21.wav',backing);
const pageBackings=timing.pages.map(p=>({id:p.id,...save(`backing-${p.id}.wav`,backing,p.start,p.end)}));
const preview=new Float32Array(backing);
for(const t of timing.tracks){const source=decode(t.audioFile),first=frameAt(t.start)*2,count=Math.min(source.length,frameAt(t.end-t.start)*2);for(let i=0;i<count;i++)preview[first+i]+=source[i];}
const previewRecord=save('preview-pages09-21.wav',preview);
function statistics(pcm){let peak=0,sum=0,clipped=0;for(const v of pcm){peak=Math.max(peak,Math.abs(v));sum+=v*v;clipped+=+(Math.abs(v)>=1);}return {peakDb:peak?20*Math.log10(peak):null,rmsDb:sum?10*Math.log10(sum/pcm.length):null,clippedSamples:clipped};}
const windows=[];
for(const event of events){
 const start=Math.max(0,event.start-.06),end=Math.min(timing.duration,event.start+event.duration+.12),duration=end-start;
 const tracks=timing.tracks.map(t=>({...t,start:t.start-start,end:t.end-start}));
 const pcm=mixBacking({duration,sections:[],tracks,events:[{...event,start:event.start-start}]});
 const row=save(`accent-${event.id}.wav`,pcm);
 const pre=frameAt(event.start-start)*2,played=pcm.subarray(pre,pre+frameAt(event.duration)*2);
 const voice=preview.subarray(frameAt(event.start)*2,frameAt(Math.min(timing.duration,event.start+event.duration))*2);
 const music=mixBacking({duration,sections:sections.filter(s=>s.category!=='ambience').map(s=>({...s,start:s.start-start,end:s.end-start,sourceOffset:(s.sourceOffset??0)})),tracks,events:[],silences:silences.map(s=>({...s,at:s.at-start}))});
 const segmentStats=statistics(played),combinedStats=statistics(voice),musicStats=statistics(music);
 let onset=null;const block=Math.round(.005*RATE)*2,blocks=[];
 for(let i=0;i<played.length;i+=block){const m=statistics(played.subarray(i,Math.min(played.length,i+block)));blocks.push({offset:i/(RATE*2),...m});}
 const maxRms=Math.max(...blocks.map(b=>b.rmsDb??-200)),maxPeak=Math.max(...blocks.map(b=>b.peakDb??-200));
 onset=blocks.find(b=>(b.peakDb??-200)>=Math.max(-30,maxPeak-18)&&(b.rmsDb??-200)>=maxRms-20)?.offset??null;
 windows.push({id:event.id,soundId:event.soundId,start:event.start,duration:event.duration,trimStart:event.trimStart??0,played:segmentStats,combined:combinedStats,music:musicStats,sfxOverMusicRmsDb:segmentStats.rmsDb-musicStats.rmsDb,strongOnsetOffset:onset,isolatedStem:row.audio,isolatedStemStart:start});
}
const prefixFile=path.join(ROOT,'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/soundtrack-v1/legacy-prefix.wav');
const legacyFile=path.join(master,'legacy-v2/backing-pages05-08.wav');
function pcmBytes(file){const b=fs.readFileSync(file);if(b.toString('ascii',0,4)!=='RIFF'||b.readUInt32LE(24)!==RATE||b.readUInt16LE(22)!==2||b.readUInt16LE(34)!==16||b.toString('ascii',36,40)!=='data')throw Error(`WAV PCM16stereo44.1attendu : ${file}`);return b.subarray(44);}
const prefix=pcmBytes(prefixFile),legacy=pcmBytes(legacyFile),next=pcmBytes(path.join(ROOT,backingRecord.audio));
if(prefix.length!==frameAt(144.6)*4||legacy.length!==frameAt(82)*4)throw Error('Préfixe historique de durée différente.');
const fullFile=path.join(output,'backing-full.wav'),header=Buffer.from(fs.readFileSync(path.join(ROOT,backingRecord.audio)).subarray(0,44)),data=Buffer.concat([prefix,legacy,next]);
header.writeUInt32LE(data.length+36,4);header.writeUInt32LE(data.length,40);fs.writeFileSync(fullFile,Buffer.concat([header,data]),{flag:'wx'});
const exactPrefix=pcmBytes(fullFile).subarray(0,prefix.length).equals(prefix);if(!exactPrefix)throw Error('Préfixe1–4modifié.');
const run=args=>{const r=spawnSync(FFMPEG,['-hide_banner','-loglevel','error','-n',...args],{maxBuffer:16*1024*1024});if(r.status!==0)throw Error(String(r.stderr));return r;};
const filters=timing.tracks.map((t,i)=>`[${i}:a]atrim=duration=${t.end-t.start},asetpts=PTS-STARTPTS,adelay=${Math.round(t.start*1000)}:all=1,${channels(t.audioFile)===1?'pan=stereo|c0=c0|c1=c0':'aformat=channel_layouts=stereo'}[a${i}]`);
filters.push(`[${timing.tracks.length}:a]atrim=duration=${timing.duration},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo[bed]`);
filters.push(`${timing.tracks.map((_,i)=>`[a${i}]`).join('')}[bed]amix=inputs=${timing.tracks.length+1}:normalize=0,apad,atrim=duration=${timing.duration}[audio]`);
const filterFile=path.join(output,'preview-filter.txt');fs.writeFileSync(filterFile,filters.join(';'));
const aacFile=path.join(output,'preview-renderer-stereo-aac.m4a');const args=[];timing.tracks.forEach(t=>args.push('-i',t.audioFile));args.push('-i',path.join(ROOT,backingRecord.audio),'-filter_complex_script',filterFile,'-map','[audio]','-c:a','aac','-ac','2','-b:a','192k',aacFile);run(args);
const aacStats=statistics(decode(aacFile));if(aacStats.clippedSamples)throw Error('AAC écrêté, reprendre accents concernés.');
for(const file of [path.join(ROOT,backingRecord.audio),fullFile,aacFile]){const r=spawnSync(FFMPEG,['-v','error','-xerror','-err_detect','explode','-i',file,'-f','null','-']);if(r.status!==0)throw Error(`Décodage invalide : ${file}`);}
const sourceFiles=[...new Set([timingFile,newReportFile,localReportFile,oldReportFile,foleyReportFile,prefixFile,legacyFile,...sections.map(s=>path.join(ROOT,s.audio)),...events.map(e=>path.join(ROOT,e.audio)),...timing.tracks.map(t=>t.audioFile)])];
const report={schemaVersion:1,date:'2026-11-07',status:'produced-awaiting-integrator-review',duration:timing.duration,fullDuration:144.6+82+timing.duration,timing:relative(timingFile),timingSha256:hash(timingFile),scriptSha256:hash(__filename),engineSha256:hash(path.join(__dirname,'mix-engine.cjs')),backingContainsVoices:false,readerContract:{gain:1,preMixed:true},sections,events,musicSilences:silences,windows,files,pageBackings,backingPages09To21:backingRecord.audio,backingFull:relative(fullFile),backingFullSha256:hash(fullFile),prefix:{duration:144.6,audio:relative(prefixFile),pcmSha256:crypto.createHash('sha256').update(prefix).digest('hex'),fullPrefixPcmSha256:crypto.createHash('sha256').update(pcmBytes(fullFile).subarray(0,prefix.length)).digest('hex'),exactPcmCopy:exactPrefix},legacy:{duration:82,audio:relative(legacyFile),sha256:hash(legacyFile),exactPcmCopy:pcmBytes(fullFile).subarray(prefix.length,prefix.length+legacy.length).equals(legacy)},preview:previewRecord,aac:{audio:relative(aacFile),sha256:hash(aacFile),channels:channels(aacFile),bitRate:192000,decoded:true,...aacStats},inputs:sourceFiles.map(file=>({file:relative(file),sha256:hash(file)})),newSfxRequests:4,newRequestedSeconds:16,cumulativeSfxRequests:10,cumulativeRequestedSeconds:36,newMusicGenerations:0,humanListening:'not-performed'};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({report:relative(path.join(output,'report.json')),backingPages09To21:report.backingPages09To21,backingFull:report.backingFull,duration:timing.duration,fullDuration:report.fullDuration,prefixExact:exactPrefix,aac:report.aac,accentOnsets:windows.filter(w=>['single-shot-metal','body-water-splash','resident-single-contact','capsule-close'].includes(w.id)).map(w=>({id:w.id,strongOnsetOffset:w.strongOnsetOffset,peakDb:w.played.peakDb}))}));
