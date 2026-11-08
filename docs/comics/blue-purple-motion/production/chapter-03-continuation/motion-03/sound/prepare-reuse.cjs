const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {ROOT,RATE,FFMPEG,decode,writeWave}=require('./mix-engine.cjs');
const version=process.argv.includes('--version')?process.argv[process.argv.indexOf('--version')+1]:'2';
if(!/^\d+$/.test(version))throw Error('Version numérique requise.');
const folder=path.join(ROOT,`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/sound/reused-v${version}`);
if(fs.existsSync(folder))throw Error('Préparation existante conservée.');fs.mkdirSync(folder,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const relative=f=>path.relative(ROOT,f).replaceAll('\\','/');
const specs=[
 {id:'footsteps-muffled',source:'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/sfx-prepared-v3/footsteps.wav',filter:'highpass=f=90,lowpass=f=1150',peakDb:-24,provider:'ElevenLabs CLI OAuth, existing November5 take',intention:'Poursuivants derrière la porte ; filtrage de la portion existante, aucune nouvelle course dans la pièce.'},
 {id:'outfall-water',source:'public/assets/audio/sewer-drips.wav',filter:'acompressor=threshold=0.04:ratio=5:attack=5:release=250:makeup=1',targetRmsDb:-25,maxPeakDb:-12,provider:'Existing CC0 Urkki69 Storm Drain, public/assets/audio/ATTRIBUTION.md',intention:'Écoulement de l’exutoire continu, drips contenus pour faire entendre le flux sans pics excessifs ; aucune voix ou issue ajoutée au rejet20.'},
 {id:'empty-room-vents',source:'public/assets/audio/background/ambience-vents.mp3',filter:null,peakDb:-12,circularEcho:true,provider:'Existing CC0 NickTayloe Air Return Vent, public/assets/audio/ATTRIBUTION.md',intention:'Ancien volume technique vide ; résonances circulaires discrètes sans meubler la pièce.'}
];
const sounds=[];
for(const spec of specs){
 let pcm;
 if(spec.filter){const r=spawnSync(FFMPEG,['-v','error','-i',path.join(ROOT,spec.source),'-af',spec.filter,'-ac','2','-ar',String(RATE),'-f','f32le','pipe:1'],{maxBuffer:32*1024*1024});if(r.status!==0)throw Error(String(r.stderr));pcm=new Float32Array(r.stdout.length/4);for(let i=0;i<pcm.length;i++)pcm[i]=r.stdout.readFloatLE(i*4);}
 else pcm=new Float32Array(decode(spec.source));
 if(spec.circularEcho){const original=new Float32Array(pcm),frames=pcm.length/2;for(const [delay,gain]of [[.08,.08],[.19,.05],[.29,.03]]){const offset=Math.round(delay*RATE);for(let i=0;i<frames;i++){const from=(i-offset+frames)%frames;pcm[i*2]+=original[from*2]*gain;pcm[i*2+1]+=original[from*2+1]*gain;}}}
 let peak=0,sum=0;for(const value of pcm){peak=Math.max(peak,Math.abs(value));sum+=value*value;}
 const priorPeakDb=20*Math.log10(peak),priorRmsDb=10*Math.log10(sum/pcm.length);
 const gainDb=spec.peakDb!==undefined?spec.peakDb-priorPeakDb:Math.min(spec.targetRmsDb-priorRmsDb,spec.maxPeakDb-priorPeakDb);
 const gain=Math.pow(10,gainDb/20);for(let i=0;i<pcm.length;i++)pcm[i]*=gain;
 const file=path.join(folder,spec.id+'.wav'),measures=writeWave(file,pcm);
 sounds.push({...spec,audio:relative(file),sha256:hash(file),sourceSha256:hash(path.join(ROOT,spec.source)),priorPeakDb,priorRmsDb,gainDb,...measures});
}
const report={schemaVersion:1,date:'2026-11-08',scriptSha256:hash(__filename),newPaidCalls:0,newSfxRequests:0,humanListening:'not-performed',sounds};
fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});fs.copyFileSync(__filename,path.join(folder,'prepare-reuse.cjs'),fs.constants.COPYFILE_EXCL);console.log(JSON.stringify(report));
