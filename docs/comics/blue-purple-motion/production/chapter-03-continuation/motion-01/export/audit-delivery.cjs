/* Independent source/snapshot, full decode, AAC level and H264 frame evidence audit. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const h = require('./common.cjs');
const args=process.argv.slice(2), samplesOption=args.indexOf('--samples');
const sampleFile=samplesOption<0?null:h.localFile(path.resolve(args[samplesOption+1]));
const directories=(samplesOption<0?args:args.slice(0,samplesOption)).map(value=>path.resolve(value));
if(!directories.length)throw Error('Usage : audit-delivery.cjs DOSSIER_EXPORT [...] [--samples JSON_TEMPS]');
function normalized(project){
  const pages=project.pages.map(page=>h.core.rebaseAssets(page.data,file=>h.hash(h.localFile(path.resolve(path.dirname(page.manifestFile),file)))));
  const document=structuredClone(project.data);
  if(project.kind==='sequence')document.pages=document.pages.map(({manifest:_manifest,...entry})=>entry);
  if(document.music)document.music.audio=h.hash(project.musicFile);
  return {kind:project.kind,document:project.kind==='sequence'?document:null,pages};
}
for(const directory of directories){
  h.localFile(path.join(directory,'report.json'));
  const report=h.read(path.join(directory,'report.json'));
  assert.equal(report.status,'completed');assert.equal(report.decoded,true);assert.equal(report.fps,24);
  const original=h.readDocument(report.source),snapshot=h.readDocument(path.join(directory,'manifest.json'));
  assert.equal(h.hash(report.source),report.sourceHash,'Source modifiée après rendu.');
  assert.deepEqual(normalized(snapshot),normalized(original),'Snapshot différent après rebasing.');
  const differences=[...report.media,...report.engine].filter(entry=>h.hash(h.localFile(path.resolve(h.ROOT,entry.file)))!==entry.sha256).map(entry=>entry.file);
  assert.deepEqual(differences,[],'Médias ou moteur modifiés après rendu.');
  const film=h.localFile(path.join(directory,'motion-comic.mp4'));
  const metadata=spawnSync(h.ffmpeg,['-hide_banner','-i',film],{encoding:'utf8',windowsHide:true}).stderr??'';
  assert(/Video: h264/.test(metadata)&&/1280x720/.test(metadata)&&/24 fps/.test(metadata),'H2641280×720/24 attendu.');
  assert(/Audio: aac[^\n]*stereo/.test(metadata),'AAC stéréo attendu.');
  const packetCount=h.run(h.ffmpeg,['-nostdin','-hide_banner','-i',film,'-map','0:v:0','-c','copy','-f','null','-']).stderr;
  const encodedVideoFrames=Number([...packetCount.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1]);
  assert(Number.isInteger(encodedVideoFrames)&&encodedVideoFrames>0&&Math.abs(encodedVideoFrames-report.frames)<=1,'Nombre de frames H264 incohérent avec les PNG source.');
  h.run(h.ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-i',film,'-f','null','-']);
  const levels=h.run(h.ffmpeg,['-nostdin','-hide_banner','-i',film,'-vn','-af','astats=metadata=0:reset=0','-f','null','-']).stderr;
  const peakDb=Array.from(levels.matchAll(/Peak level dB:\s*(-?[\d.]+)/g),entry=>Number(entry[1]));
  assert(peakDb.length>=2&&peakDb.every(Number.isFinite),'Crêtes AAC non mesurées.');
  const maximumPeakDb=Math.max(...peakDb);assert(maximumPeakDb<0,'Saturation du mix AAC final.');
  const evidence=path.join(directory,'encoded-evidence');
  if(fs.existsSync(evidence))throw Error(`Preuves existent déjà : ${evidence}`);fs.mkdirSync(evidence);
  const requested=sampleFile?h.read(sampleFile):[{id:'opening',time:0},{id:'middle',time:report.duration/2},{id:'ending',time:report.duration-1/24}];
  const samples=(Array.isArray(requested)?requested:requested.samples).map(sample=>({...sample,requestedTime:sample.time,frame:Math.max(0,Math.min(encodedVideoFrames-1,Math.round(sample.time*24)))}));
  assert(samples.length>0&&samples.every(sample=>Number.isFinite(sample.time)&&sample.time>=0&&sample.time<report.duration),'Temps de preuve hors film.');
  const frames=[...new Set(samples.map(sample=>sample.frame))].sort((a,b)=>a-b);
  const select=frames.map(frame=>`eq(n\\,${frame})`).join('+');
  h.run(h.ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-i',film,'-vf',`select=${select}`,'-vsync','0','-start_number','0',path.join(evidence,'frame_%03d.png')]);
  const extracted=frames.map((frame,index)=>({frame,time:frame/24,file:path.join(evidence,`frame_${String(index).padStart(3,'0')}.png`)}));
  for(const entry of extracted){h.localFile(entry.file);entry.sha256=h.hash(entry.file);entry.file=h.relative(entry.file);}
  const result={status:'completed',checkedAt:new Date().toISOString(),export:h.relative(directory),filmSha256:h.hash(film),bytes:fs.statSync(film).size,
    sourceAndEngineDifferences:differences,snapshotSemanticAndMediaShaVerified:true,fullDecodeExit:0,h2641280x720At24:true,aacStereo:true,
    sourceRenderedPngFrames:report.frames,encodedVideoFrames,encodedVideoDurationSeconds:encodedVideoFrames/24,lastEncodedFrameIndex:encodedVideoFrames-1,
    sourceDurationMinusVideoSeconds:report.duration-encodedVideoFrames/24,
    aacMaximumSamplePeakDb:maximumPeakDb,aacListeningPerformed:false,metadata,levelMeasurement:levels,
    requestedSamples:sampleFile?{file:h.relative(sampleFile),sha256:h.hash(sampleFile)}:null,
    timeQuantization:'Nearest encoded frame: round(requestedTime*24); time is the actual encoded frame timestamp. An authored anchor can lie between two encoded frames.',
    samples:samples.map(sample=>({...sample,...extracted.find(entry=>entry.frame===sample.frame)})),
    note:'Frames are extracted from the encoded H264, not Canvas. This audit does not claim visual inspection or human listening.'};
  fs.writeFileSync(path.join(directory,'independent-audit.json'),JSON.stringify(result,null,2),{flag:'wx'});
  fs.writeFileSync(path.join(evidence,'report.json'),JSON.stringify({status:'completed',filmSha256:result.filmSha256,samples:result.samples},null,2),{flag:'wx'});
  console.info(JSON.stringify({export:h.relative(directory),status:result.status,sha256:result.filmSha256,peakDb:maximumPeakDb,frames:extracted.length}));
}
