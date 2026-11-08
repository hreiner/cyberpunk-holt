const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { ROOT, FFMPEG, frameAt, channels, decode, mixBacking, writeWave } = require('./mix-engine.cjs');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
const oldFolder = path.join(ROOT, 'art-masters/motion-comics/blue-purple/pages-05-08/revision-02');
const priorFile = path.join(oldFolder, 'soundtrack-v1/report.json');
const timingFile = path.join(oldFolder, 'timing-r2-v1.json');
const prior = JSON.parse(fs.readFileSync(priorFile));
const timing = JSON.parse(fs.readFileSync(timingFile));
const version = process.argv.includes('--version') ? process.argv[process.argv.indexOf('--version')+1] : '2';
if (!/^\d+$/.test(version)) throw Error('Version numérique requise.');
const output = path.join(ROOT, `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/legacy-v${version}`);
if (fs.existsSync(output)) throw Error('Mix existant conservé : nouvelle version requise.');
fs.mkdirSync(output, { recursive: true });
const sourceFiles = [...new Set([priorFile, timingFile, ...prior.inputs.map(x => path.join(ROOT, x.file))])];
const preserved = sourceFiles.map(file => ({ file: relative(file), sha256: hash(file) }));
const specs = {
  'body-impact': { gainDb: 6, speechMultiplier: 1, intent: 'Conserver le coup unique déjà net ; aucun double transitoire.' },
  'gun-attack': { gainDb: 3, speechMultiplier: .42, speechRampSeconds: .025, intent: 'Attaque franche puis protection rapide du cri de Franklyn.' },
  'glass-tail': { gainDb: 4.5, speechMultiplier: .72, speechRampSeconds: .04, intent: 'Matière des éclats mieux présente après le tir unique.' },
  'engine-start': { gainDb: 11, speechMultiplier: .78, speechRampSeconds: .08, intent: 'Crantage hésitant et prise du moteur audibles sous les deux répliques.' },
  'rear-door': { gainDb: 7, speechMultiplier: .72, intent: 'Loquet et charnière marquent la sortie de pièce.' },
  'footsteps': { gainDb: 9, speechMultiplier: .68, intent: 'Appuis irréguliers du groupe et flaques présents dans la ruelle.' },
  'gate-latch': { gainDb: 8, speechMultiplier: .85, intent: 'Petit verrou précis, lisible sans effet gigantesque.' },
  'lock-click': { gainDb: 7, speechMultiplier: .85, intent: 'Action fine au premier plan ; pas un impact grave.' },
  'car-door-close': { gainDb: 5, speechMultiplier: .78, intent: 'Poids de la portière distinct du démarreur et du départ.' },
  'tire-departure': { gainDb: 6, speechMultiplier: .72, intent: 'Montée moteur/pneus humide avec départ naturel.' }
};
const events = prior.events.map(event => {
  const spec = specs[event.id];
  if (!spec) throw Error(`Événement non cadré : ${event.id}`);
  return { ...event, gain: Math.pow(10, spec.gainDb / 20), ...spec };
});
const silences = [...prior.musicSilences,
  ...events.filter(e => ['rear-door', 'gate-latch', 'lock-click', 'car-door-close'].includes(e.id)).map(e => ({ id: e.id, at: e.start, lead: .04, hold: .1, release: .22, floor: .24 }))];
const backing = mixBacking({ duration: timing.duration, sections: prior.sections, tracks: timing.tracks, events, silences });
const files = [];
function save(name, pcm, start, end) {
  const file = path.join(output, name), measures = writeWave(file, pcm, start, end);
  const row = { name, audio: relative(file), sha256: hash(file), ...measures };
  files.push(row); return row;
}
const backingRecord = save('backing-pages05-08.wav', backing);
for (const page of timing.pages) save(`backing-${page.id}.wav`, backing, page.start, page.end);
const preview = new Float32Array(backing);
for (const track of timing.tracks) {
  const pcm = decode(track.audioFile), start = frameAt(track.start) * 2;
  const count = Math.min(pcm.length, frameAt(track.end - track.start) * 2);
  for (let i = 0; i < count; i++) preview[start + i] += pcm[i];
}
save('preview-pages05-08.wav', preview);
const run = args => { const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-n', ...args], {maxBuffer: 128*1024*1024}); if(r.status !== 0) throw Error(String(r.stderr)); return r; };
function measure(pcm) {
  let peak = 0, sum = 0, clipped = 0;
  for (const value of pcm) { peak=Math.max(peak,Math.abs(value)); sum+=value*value; clipped += +(Math.abs(value)>=1); }
  return {peakDb:peak?20*Math.log10(peak):null,rmsDb:sum?10*Math.log10(sum/pcm.length):null,clippedSamples:clipped};
}
function encode(channelCount) {
  const file = path.join(output, `preview-renderer-${channelCount===2?'stereo':'mono'}-aac.m4a`);
  const args=[];
  timing.tracks.forEach(t=>args.push('-i',t.audioFile)); args.push('-i',path.join(ROOT,backingRecord.audio));
  const filters=timing.tracks.map((t,i)=>`[${i}:a]atrim=duration=${t.end-t.start},asetpts=PTS-STARTPTS,adelay=${Math.round(t.start*1000)}:all=1${channelCount===2?(channels(t.audioFile)===1?',pan=stereo|c0=c0|c1=c0':',aformat=channel_layouts=stereo'):''}[a${i}]`);
  filters.push(`[${timing.tracks.length}:a]atrim=duration=${timing.duration},asetpts=PTS-STARTPTS${channelCount===2?',aformat=channel_layouts=stereo':''}[bed]`);
  filters.push(`${timing.tracks.map((_,i)=>`[a${i}]`).join('')}[bed]amix=inputs=${timing.tracks.length+1}:normalize=0,apad,atrim=duration=${timing.duration}[audio]`);
  args.push('-filter_complex',filters.join(';'),'-map','[audio]','-c:a','aac','-ac',String(channelCount),'-b:a','192k',file); run(args);
  const pcm=decode(file), measures=measure(pcm);
  if(measures.clippedSamples) throw Error(`Écrêtage AAC ${channelCount}canaux : ${measures.peakDb}`);
  return {audio:relative(file),sha256:hash(file),channels:channels(file),bitRate:192000,...measures,decoded:true};
}
const aac = [encode(2)];
const windows=[];
for(const item of events){
  const single=mixBacking({duration:timing.duration,sections:[],tracks:timing.tracks,events:[item]});
  const oldEvent=prior.events.find(e=>e.id===item.id);
  const old=mixBacking({duration:timing.duration,sections:[],tracks:timing.tracks,events:[oldEvent]});
  const first=frameAt(item.start)*2,last=frameAt(Math.min(timing.duration,item.start+item.duration))*2;
  const before=measure(old.subarray(first,last)),after=measure(single.subarray(first,last));
  const stem=save(`accent-${item.id}.wav`,single,Math.max(0,item.start-.05),Math.min(timing.duration,item.start+item.duration+.12));
  windows.push({id:item.id,start:item.start,duration:item.duration,before,after,rmsChangeDb:after.rmsDb-before.rmsDb,stem:stem.audio,intent:item.intent});
}
for(const row of preserved) if(hash(path.join(ROOT,row.file))!==row.sha256) throw Error(`Source modifiée : ${row.file}`);
const report={schemaVersion:1,date:'2026-11-07',status:'produced-awaiting-integrator-review',duration:timing.duration,timing:relative(timingFile),timingSha256:hash(timingFile),priorReport:relative(priorFile),priorReportSha256:hash(priorFile),sections:prior.sections,events,musicSilences:silences,files,windows,aac,sourcePreservation:preserved,voicesUnchanged:true,voiceGainChangeDb:0,newPaidCalls:0,newSfx:0,cumulativeSfxRequests:6,cumulativeRequestedSeconds:20,backingContainsVoices:false,readerContract:{gain:1,preMixed:true},humanListening:'not-performed',scriptSha256:hash(__filename),engineSha256:hash(path.join(__dirname,'mix-engine.cjs'))};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:relative(output),duration:timing.duration,aac,windows:windows.map(x=>({id:x.id,rmsChangeDb:x.rmsChangeDb,peakDb:x.after.peakDb}))}));
