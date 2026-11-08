const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const engine=require('./mix-engine.cjs');
const {ROOT,RATE,FFMPEG,frameAt,channels,decode,mixBacking,writeWave}=engine;
const rel=file=>path.relative(ROOT,file).replaceAll('\\','/');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const load=file=>JSON.parse(fs.readFileSync(file));
const master=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/sound');
const timingFile=path.resolve(__dirname,'../timing/TIMING.json'),anchorFile=path.join(__dirname,'ACOUSTIC-ANCHORS.json');
const timing=load(timingFile),acoustic=load(anchorFile);
if(acoustic.status!=='locked'||acoustic.timingSha256!==hash(timingFile))throw Error('Ancres non gelées ou TIMING différent.');
for(const contract of acoustic.sourceContracts)if(hash(path.join(ROOT,contract.file))!==contract.sha256)throw Error(`Contrat d'action modifié : ${contract.file}`);
const version=process.argv.includes('--version')?process.argv[process.argv.indexOf('--version')+1]:'1';
if(!/^\d+$/.test(version))throw Error('Version numérique requise.');
const resume=process.argv.includes('--resume');
const output=path.join(master,`soundtrack-v${version}`);if(fs.existsSync(output)&&!resume)throw Error('Mix existant conservé.');
if(resume&&(!fs.existsSync(output)||fs.existsSync(path.join(output,'report.json'))))throw Error('Reprise limitée à un mix incomplet.');
const prefix=timing.unchangedPrefixSeconds,duration=timing.duration-prefix;
if(Math.abs(prefix-238.6)>1e-8||duration<=0)throw Error('Périmètre temporel différent.');
const pages=timing.pages.filter(p=>p.pageNumber>=9).map(p=>({...p,start:p.globalStart-prefix,end:p.globalStart-prefix+p.duration}));
// Adjacent page cuts share the same boundary, including half-sample frame times.
for(let index=0;index<pages.length;index++)pages[index].end=index+1<pages.length?pages[index+1].start:duration;
const page=n=>{const p=pages.find(p=>p.pageNumber===n);if(!p)throw Error(`Page absente : ${n}`);return p;};
const panel=key=>{for(const p of pages){const q=p.panels.find(q=>q.key===key);if(q)return {...q,page:p.pageNumber,start:q.start+p.start,ready:q.ready+p.start,end:q.end+p.start};}throw Error(`Case absente : ${key}`);};
const at=id=>{const a=acoustic.anchors.find(a=>a.id===id);if(!a)throw Error(`Ancre absente : ${id}`);return a.globalSeconds-prefix;};
const tracks=pages.flatMap(p=>p.voiceTracks.map(t=>({...t,start:t.globalStart-prefix,end:t.globalEnd-prefix,pageId:p.id,audioFile:path.resolve(ROOT,path.dirname(p.sourceManifest),t.audio)})));
if(tracks.length!==62)throw Error('Les62prises du lot doivent être conservées.');
const sourceMan=path.join(ROOT,'anime/motion-comics/projects/blue-purple-pages01-21-v9.json');
const source=load(sourceMan),sourceBacking=path.resolve(path.dirname(sourceMan),source.music.audio);
const soundReports=[
 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/sfx-prepared-v1/report.json',
 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/local-v1/report.json',
 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/sfx-measurements-v3.json',
 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/foley-local-v1/report.json',
 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/sound/local-v1/report.json',
 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/sound/reused-v2/report.json'
];
const sounds=new Map(soundReports.flatMap(file=>load(path.join(ROOT,file)).sounds).map(s=>[s.id,s]));
const music=(id,start,end,name,gain,extra={})=>({id,start,end,audio:`public/assets/audio/background/music-${name}.mp3`,gain,fadeIn:.9,fadeOut:.9,speechMultiplier:.28,speechRampSeconds:.30,...extra});
const ambience=(id,start,end,audio,gain,extra={})=>({id,start,end,audio,gain,fadeIn:1,fadeOut:1,speechMultiplier:.8,speechRampSeconds:.25,category:'ambience',...extra});
const crossfade=.9,pressureOrigin=page(16).start;
const sections=[
 music('neon-access',0,page(14).start+crossfade,'neon',.30,{sourceOffset:30}),
 music('neon-shop',page(14).start,page(16).start+crossfade,'neon',.24,{sourceOffset:30+page(14).start}),
 music('pressure-neural',page(16).start,page(17).start+crossfade,'pressure',.19,{sourceOffset:18}),
 music('pressure-ambush',page(17).start,page(18).start+crossfade,'pressure',.38,{sourceOffset:18+page(17).start-pressureOrigin}),
 music('pressure-hide',page(18).start,page(19).start+crossfade,'pressure',.09,{sourceOffset:18+page(18).start-pressureOrigin}),
 music('pressure-return',page(19).start,page(20).start+crossfade,'pressure',.17,{sourceOffset:18+page(19).start-pressureOrigin}),
 music('pressure-quay',page(20).start,page(21).start+crossfade,'pressure',.075,{sourceOffset:18+page(20).start-pressureOrigin}),
 music('afterglow-refuge',page(21).start,duration,'afterglow',.29,{fadeOut:2.2,speechMultiplier:.32}),
 ambience('outside-city',0,panel('12-3').start+.8,'public/assets/audio/background/ambience-night-city.mp3',.16),
 ambience('access-infrastructure',page(10).start,page(14).start+crossfade,'public/assets/audio/background/ambience-industrial.mp3',.14),
 ambience('shop-room-tone',page(14).start,page(17).start+crossfade,'public/assets/audio/background/ambience-vents.mp3',.20),
 ambience('atrium-city',page(17).start,panel('18-2').start+.35,'public/assets/audio/background/ambience-night-city.mp3',.18,{fadeOut:.5}),
 ambience('apartment-room',panel('18-2').start,panel('19-2').start+crossfade,'public/assets/audio/background/ambience-vents.mp3',.11),
 ambience('resident-elevator-tone',panel('19-2').start,page(20).start+crossfade,'public/assets/audio/background/ambience-industrial.mp3',.13),
 ambience('quay-city',panel('19-3').start,panel('21-2').ready+.6,'public/assets/audio/background/ambience-night-city.mp3',.11),
 ambience('outfall-water',panel('19-3').start,panel('21-2').ready+1.0,sounds.get('outfall-water').audio,.42,{fadeIn:1.5,fadeOut:1.5}),
 ambience('refuge-water-distant',panel('21-2').ready-.5,duration,sounds.get('outfall-water').audio,.14,{fadeIn:1.5,fadeOut:2,sourceOffset:panel('21-2').ready-.5-panel('19-3').start}),
 ambience('refuge-empty-volume',at('refugeDoorOpen'),duration,sounds.get('empty-room-vents').audio,.18,{fadeOut:2})
];
function event(id,soundId,start,extra={}){const s=sounds.get(soundId);if(!s)throw Error(`Son absent : ${soundId}`);return {id,soundId,audio:s.audio,sourceSha256:s.sha256,provider:s.provider,start,gain:1,speechMultiplier:.8,...extra};}
const events=[
 event('terminal-calculation','terminal-confirm',at('terminalAcquire'),{trimStart:0,duration:.38,speechMultiplier:.75,fadeOut:.025}),
 event('terminal-map-ready','terminal-confirm',at('terminalMapReady'),{trimStart:.48,duration:.57,speechMultiplier:.85,fadeOut:.08}),
 event('implant-confirm','implant-confirm',at('implantConfirm'),{speechMultiplier:.9}),
 event('elevator-up-start','elevator-travel',panel('12-3').ready+.4,{duration:.78,gain:Math.pow(10,3/20),speechMultiplier:.72,fadeOut:.15}),
 event('elevator-up-settles','elevator-travel',at('elevatorSettles'),{trimStart:2.34,duration:.7,gain:Math.pow(10,3/20),speechMultiplier:.72,fadeOut:.18}),
 event('repair-tool','repair-tool',panel('15-1').ready+.35,{speechMultiplier:.8,gain:Math.pow(10,3/20)}),
 event('repair-contact','connector-seat',at('repairContact'),{speechMultiplier:.9}),
 event('machine-power','machine-power',at('repairContact')+.2,{speechMultiplier:.7}),
 event('capsule-slide','capsule-slide',at('capsuleClosingStart'),{duration:Math.min(1.18,at('capsuleClosed')-at('capsuleClosingStart')),speechMultiplier:.85,fadeOut:.12}),
 event('capsule-latch','capsule-close',at('capsuleLatch'),{trimStart:.195,duration:.34,speechMultiplier:.85,fadeOut:.08}),
 event('neural-data','neural-unlock',at('digitalDisassembly'),{duration:1.65,speechMultiplier:.48,fadeOut:.12}),
 event('neural-map-resolution','neural-unlock',at('nightCityMapSettled'),{trimStart:1.7,duration:.8,speechMultiplier:.50,fadeOut:.12}),
 event('neural-green-point','implant-confirm',at('mapGreen'),{duration:.45,gain:.45,speechMultiplier:.75,fadeOut:.12}),
 event('single-shot-metal','single-shot-metal',at('oneShot'),{duration:1.7,speechMultiplier:.7,speechRampSeconds:.04,fadeOut:.16}),
 event('group-running','footsteps',panel('17-3').ready+.05,{duration:Math.min(3.4,panel('17-3').end-panel('17-3').ready-.05),gain:Math.pow(10,10/20),speechMultiplier:.78,fadeOut:.25}),
 event('resident-cloth','cloth-shift',at('residentContact')-.16,{speechMultiplier:.85}),
 event('resident-single-contact','punch-wood',at('residentContact'),{trimStart:1.132,duration:.34,gain:Math.pow(10,-4/20),speechMultiplier:1,fadeOut:.04}),
 event('apartment-bolt-slide','bolt-slide',at('boltStart'),{duration:Math.min(.6,at('boltClosed')-at('boltStart')),speechMultiplier:.85,fadeOut:.1}),
 event('apartment-bolt-click','lock-click',at('boltClosed'),{gain:Math.pow(10,4/20),speechMultiplier:.85}),
 event('pursuers-passing','footsteps-muffled',panel('18-3').ready+.2,{trimStart:.1,duration:3.0,gain:Math.pow(10,3/20),speechMultiplier:.8,fadeOut:1.1}),
 event('elevator-down-start','elevator-travel',at('elevatorReturn'),{duration:.78,gain:Math.pow(10,2/20),speechMultiplier:.72,fadeOut:.15}),
 event('elevator-down-settles','elevator-travel',panel('19-2').end-.7,{trimStart:2.34,duration:.7,gain:Math.pow(10,2/20),speechMultiplier:.72,fadeOut:.18}),
 event('water-throw-cloth','cloth-shift',at('waterThrowRelease'),{duration:.5,speechMultiplier:.85,fadeOut:.12}),
 event('body-water-splash','body-water-splash',at('waterSplash'),{duration:3.2,speechMultiplier:.72,speechRampSeconds:.06,fadeOut:.3}),
 event('refuge-latch','rear-door',at('refugeLatchStart'),{trimStart:.015,duration:.115,gain:Math.pow(10,5/20),speechMultiplier:.85,speechRampSeconds:.05,fadeOut:.02}),
 event('refuge-opening','rear-door',at('refugeDoorOpeningStart'),{trimStart:.39,duration:.55,gain:Math.pow(10,6/20),speechMultiplier:.82,speechRampSeconds:.05,fadeOut:.18})
];
for(const e of events){const available=decode(e.audio).length/(RATE*2)-(e.trimStart??0);e.duration=Math.min(e.duration??available,available,duration-e.start);if(e.start<0||e.duration<=0)throw Error(`Événement hors temps : ${e.id}`);}
if(events.filter(e=>e.soundId==='single-shot-metal').length!==1||Math.abs(at('metalImpact')-at('oneShot')-.08)>1e-7)throw Error('Un seul tir et impact80ms après requis.');
const silences=[
 {id:'terminal-focus',at:at('terminalMapReady'),lead:.06,hold:.12,release:.25,floor:.4},
 {id:'contact-focus',at:at('repairContact'),lead:.08,hold:.18,release:.35,floor:.3},
 {id:'capsule-focus',at:at('capsuleClosingStart'),lead:.12,hold:at('capsuleLatch')-at('capsuleClosingStart')+.12,release:.45,floor:.2},
 {id:'neural-focus',at:at('digitalDisassembly'),lead:.14,hold:at('nightCityMapSettled')-at('digitalDisassembly')+.35,release:.6,floor:.1},
 {id:'shot-accent',at:at('oneShot'),lead:.06,hold:.18,release:.4,floor:0},
 {id:'resident-contact',at:at('residentContact'),lead:.04,hold:.13,release:.28,floor:.12},
 {id:'water-gesture',at:at('waterSplash'),lead:.12,hold:1.2,release:.8,floor:0},
 {id:'door-material',at:at('refugeDoorOpeningStart'),lead:.06,hold:.3,release:.5,floor:.2}
];
fs.mkdirSync(output,{recursive:true});
const files=[];
const save=(name,pcm,start,end)=>{const file=path.join(output,name),measurements=writeWave(file,pcm,start,end);const row={file:rel(file),sha256:hash(file),...measurements};files.push(row);return row;};
function inspect(file){
 const b=fs.readFileSync(file),count=(b.length-44)/2;let peak=0,sum=0;
 for(let i=44;i<b.length;i+=2){const v=b.readInt16LE(i)/32767;peak=Math.max(peak,Math.abs(v));sum+=v*v;}
 const row={file:rel(file),sha256:hash(file),duration:count/(RATE*2),pcmFrames:count/2,peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/count),measurement:'PCM16 re-read after initial float-write guard'};files.push(row);return row;
}
function prepareBackingFiles(){
 let lot,pageBackings;
 if(resume){lot=inspect(path.join(output,'backing-pages09-21.wav'));pageBackings=pages.map(p=>({id:p.id,...inspect(path.join(output,`backing-${p.id}.wav`))}));}
 else {const backing=mixBacking({duration,sections,tracks,events,silences});lot=save('backing-pages09-21.wav',backing);pageBackings=pages.map(p=>({id:p.id,...save(`backing-${p.id}.wav`,backing,p.start,p.end)}));}
 const lotFile=path.join(ROOT,lot.file),header=Buffer.alloc(44),fd=fs.openSync(sourceBacking,'r');fs.readSync(fd,header,0,44,0);
 if(header.toString('ascii',0,4)!=='RIFF'||header.readUInt16LE(22)!==2||header.readUInt32LE(24)!==RATE||header.readUInt16LE(34)!==16||header.toString('ascii',36,40)!=='data')throw Error('Format du préfixe source différent.');
 const prefixPcm=Buffer.alloc(frameAt(prefix)*4),prefixRead=fs.readSync(fd,prefixPcm,0,prefixPcm.length,44);fs.closeSync(fd);if(prefixRead!==prefixPcm.length)throw Error('Préfixe source incomplet.');
 const fullFile=path.join(output,'backing-cover-and-pages01-21.wav');
 if(!resume){const lotBuffer=fs.readFileSync(lotFile),complete=Buffer.alloc(44+prefixPcm.length+lotBuffer.length-44);lotBuffer.copy(complete,0,0,44);prefixPcm.copy(complete,44);lotBuffer.copy(complete,44+prefixPcm.length,44);complete.writeUInt32LE(complete.length-8,4);complete.writeUInt32LE(complete.length-44,40);fs.writeFileSync(fullFile,complete,{flag:'wx'});}
 const check=Buffer.alloc(prefixPcm.length),fullFd=fs.openSync(fullFile,'r');const read=fs.readSync(fullFd,check,0,check.length,44);fs.closeSync(fullFd);
 if(read!==check.length||!check.equals(prefixPcm))throw Error('Préfixe PCM altéré.');
 return {lot,pageBackings,lotFile,fullFile,prefixPreservation:{seconds:prefix,pcmFrames:frameAt(prefix),pcmSha256:crypto.createHash('sha256').update(prefixPcm).digest('hex'),fullPrefixPcmSha256:crypto.createHash('sha256').update(check).digest('hex'),exact:true}};
}
const {lot,pageBackings,lotFile,fullFile,prefixPreservation}=prepareBackingFiles();
engine.clearDecodeCache();if(global.gc)global.gc();
const run=args=>{const r=spawnSync(FFMPEG,['-nostdin','-hide_banner','-loglevel','error','-n',...args],{maxBuffer:16*1024*1024,timeout:180000});if(r.status!==0)throw Error(r.error?.message??`FFmpeg status${r.status} signal${r.signal}: ${r.stderr}`);return r;};
const stats=pcm=>{let peak=0,sum=0,clipped=0;for(const value of pcm){peak=Math.max(peak,Math.abs(value));sum+=value*value;clipped+=+(Math.abs(value)>=1);}return {peakDb:peak?20*Math.log10(peak):null,rmsDb:sum?10*Math.log10(sum/pcm.length):null,clippedSamples:clipped};};
function measureFloatMix(args){
 const result=spawnSync(FFMPEG,['-nostdin','-hide_banner','-loglevel','error',...args,'-c:a','pcm_f32le','-ac','2','-f','f32le','pipe:1'],{maxBuffer:512*1024*1024,timeout:180000});
 if(result.status!==0)throw Error(result.error?.message??`FFmpeg status${result.status} signal${result.signal}: ${result.stderr}`);
 let peak=0,sum=0,clipped=0;for(let i=0;i<result.stdout.length;i+=4){const value=result.stdout.readFloatLE(i);peak=Math.max(peak,Math.abs(value));sum+=value*value;clipped+=+(Math.abs(value)>=1);}
 return {sampleCount:result.stdout.length/4,peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/(result.stdout.length/4)),clippedSamples:clipped};
}
function encodePreview(id,start,end){
 const clipDuration=end-start,wholeLot=Math.abs(start)<1e-9&&Math.abs(end-duration)<1e-9,clip=wholeLot?lotFile:path.join(output,`${id}-backing.wav`);
 if(!wholeLot&&!fs.existsSync(clip))run(['-i',lotFile,'-af',`atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS`,'-c:a','pcm_s16le',clip]);
 const selected=tracks.filter(t=>t.start>=start-1e-7&&t.start<end).map(t=>({...t,start:t.start-start,end:t.end-start}));
 if(tracks.some(t=>t.start<start&&t.end>start+.001))throw Error(`Préécoute coupe une voix : ${id}`);
 const args=[];selected.forEach(t=>args.push('-i',t.audioFile));args.push('-i',clip);
 const filters=selected.map((t,i)=>`[${i}:a]atrim=duration=${t.end-t.start},asetpts=PTS-STARTPTS,${channels(t.audioFile)===1?'pan=stereo|c0=c0|c1=c0':'aformat=channel_layouts=stereo'},adelay=${Math.round(t.start*1000)}:all=1[a${i}]`);
 filters.push(`[${selected.length}:a]atrim=duration=${clipDuration},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo[bed]`);
 filters.push(`${selected.map((_,i)=>`[a${i}]`).join('')}[bed]amix=inputs=${selected.length+1}:normalize=0,apad=whole_dur=${clipDuration},atrim=duration=${clipDuration}[audio]`);
 const filterFile=path.join(output,`${id}-filter.txt`);fs.writeFileSync(filterFile,filters.join(';'));
 args.push('-filter_complex_script',filterFile,'-map','[audio]','-t',String(clipDuration));
 const preEncoderFloat=measureFloatMix(args);if(preEncoderFloat.clippedSamples)throw Error(`Mix float surchargé avant AAC : ${id}`);
 const file=path.join(output,`${id}-audition.m4a`);args.push('-c:a','aac','-ac','2','-b:a','192k',file);if(!fs.existsSync(file))run(args);
 const measured=stats(decode(file));if(measured.clippedSamples)throw Error(`AAC écrêté : ${id}`);
 const loud=spawnSync(FFMPEG,['-hide_banner','-nostats','-xerror','-err_detect','explode','-i',file,'-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8',maxBuffer:4*1024*1024});if(loud.status!==0)throw Error(loud.stderr);
 const summary=loud.stderr.slice(loud.stderr.lastIndexOf('Summary:')),value=re=>Number(re.exec(summary)?.[1]);
 return {id,file:rel(file),sha256:hash(file),startLot:start,startGlobal:start+prefix,duration:clipDuration,channels:channels(file),targetBitRate:192000,trackCount:selected.length,preEncoderFloat,...measured,integratedLufs:value(/Integrated loudness:[\s\S]*?I:\s+([\d.-]+)/),truePeakDb:value(/True peak:[\s\S]*?Peak:\s+([\d.-]+)/),decoded:true};
}
const previews=[
 encodePreview('terminal',panel('09-2').start,panel('09-2').end),
 encodePreview('repair-capsule',panel('15-2').start,page(15).end),
 encodePreview('neural-map',panel('16-1').start,panel('16-1').end),
 encodePreview('ambush',panel('17-2').start,page(17).end),
 encodePreview('water-and-door',panel('20-3').start,panel('21-1').end)
];
const aac=encodePreview('complete-new-lot',0,duration);
const windows=[];
for(const id of ['terminal-map-ready','repair-contact','capsule-latch','neural-map-resolution','single-shot-metal','resident-single-contact','apartment-bolt-click','body-water-splash','refuge-opening']){
 const e=events.find(e=>e.id===id),start=Math.max(0,e.start-.06),end=Math.min(duration,e.start+e.duration+.12),localTracks=tracks.map(t=>({...t,start:t.start-start,end:t.end-start}));
 const pcm=mixBacking({duration:end-start,sections:[],events:[{...e,start:e.start-start}],tracks:localTracks});
 const row=save(`accent-${id}.wav`,pcm),played=pcm.subarray(frameAt(e.start-start)*2,frameAt(e.start-start+e.duration)*2),m=stats(played);
 const block=Math.round(.005*RATE)*2,blocks=[];for(let i=0;i<played.length;i+=block){blocks.push({offset:i/(RATE*2),...stats(played.subarray(i,Math.min(played.length,i+block)))});}
 const maxRms=Math.max(...blocks.map(b=>b.rmsDb??-200)),maxPeak=Math.max(...blocks.map(b=>b.peakDb??-200)),onset=blocks.find(b=>(b.peakDb??-200)>=Math.max(-30,maxPeak-18)&&(b.rmsDb??-200)>=maxRms-20)?.offset??null;
 windows.push({id,atLot:e.start,atGlobal:e.start+prefix,duration:e.duration,trimStart:e.trimStart??0,...m,strongOnsetOffset:onset,isolatedStem:row.file,isolatedStemStartLot:start});
}
const inputs=[...new Set([timingFile,anchorFile,sourceMan,sourceBacking,...acoustic.sourceContracts.map(c=>path.join(ROOT,c.file)),...soundReports.map(f=>path.join(ROOT,f)),...sections.map(s=>path.join(ROOT,s.audio)),...events.map(e=>path.join(ROOT,e.audio)),...tracks.map(t=>t.audioFile)])].map(file=>({file:rel(file),sha256:hash(file)}));
const report={
 schemaVersion:1,date:'2026-11-08',status:'produced-awaiting-integrator-review',duration,fullDuration:timing.duration,prefixSeconds:prefix,
 backingPages09To21:lot.file,backingFull:rel(fullFile),backingFullSha256:hash(fullFile),pageBackings,files,
 timing:rel(timingFile),timingSha256:hash(timingFile),acousticAnchors:rel(anchorFile),acousticAnchorsSha256:hash(anchorFile),
 sourceSelection:rel(sourceMan),sourceSelectionSha256:hash(sourceMan),sourceBacking:rel(sourceBacking),sourceBackingSha256:hash(sourceBacking),
 prefixPreservation,acousticMetadataCorrection:acoustic.metadataCorrection??null,
 postprocessingRecovery:{resumed:resume,backingRecalculated:false,note:resume?'Unbounded apad kept producing silence in a short AAC preview and previously overflowed float capture. Existing PCM retained, preview padding/output duration bounded, buffers released before postprocessing.':null},
 sections,events,musicSilences:silences,tracks:tracks.map(t=>({...t,audioFile:rel(t.audioFile)})),windows,previews,aac,inputs,
 backingContainsVoices:false,readerContract:{gain:1,preMixed:true},musicPolicy:'Boucles des stems sources non étirées ; enveloppe douce0.30s sous les voix, ambiances physiques maintenues pendant creux musicaux.',
 newPaidCalls:0,newVoices:0,newMusicGenerations:0,newSfxRequests:0,cumulativeVoiceCharacters:7062,cumulativeSfxRequests:10,cumulativeRequestedSeconds:36,humanListening:'not-performed',
 scriptSha256:hash(__filename),engineSha256:hash(path.join(__dirname,'mix-engine.cjs'))
};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
for(const name of ['build-soundtrack.cjs','mix-engine.cjs','ACOUSTIC-ANCHORS.json'])fs.copyFileSync(path.join(__dirname,name),path.join(output,name),fs.constants.COPYFILE_EXCL);fs.copyFileSync(timingFile,path.join(output,'TIMING.json'),fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({report:rel(path.join(output,'report.json')),duration,fullDuration:timing.duration,backingFull:report.backingFull,backingPages09To21:lot.file,prefixPreservation:report.prefixPreservation,aac,windows:windows.map(w=>({id:w.id,atGlobal:w.atGlobal,strongOnsetOffset:w.strongOnsetOffset,peakDb:w.peakDb})),newPaidCalls:0}));
