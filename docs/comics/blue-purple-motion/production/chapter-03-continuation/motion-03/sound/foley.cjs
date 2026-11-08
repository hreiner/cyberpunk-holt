const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {ROOT,RATE,frameAt,writeWave}=require('./mix-engine.cjs');
const folder=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/sound/local-v1');
if(fs.existsSync(folder))throw Error('Foley existant conservé.');fs.mkdirSync(folder,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
let state=384197;
const noise=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2147483648-1;};
const clamp=x=>Math.max(0,Math.min(1,x));
const specs=[{id:'capsule-slide',duration:1.18,peakDb:-23,intention:'Friction et faible assistance mécanique de la capsule ; le clac du verrou est une source séparée et unique.'},{id:'bolt-slide',duration:.6,peakDb:-24,intention:'Pêne qui glisse sur son guide ; aucun clic ni choc synthétisé dans ce fichier.'}];
const sounds=[];
for(const spec of specs){
 const frames=frameAt(spec.duration),pcm=new Float32Array(frames*2);let low=0,band=0,peak=0;
 for(let i=0;i<frames;i++){
  const t=i/RATE,n=noise();low=.985*low+.015*n;band=.82*band+.18*n;
  const envelope=clamp(t/.08)*clamp((spec.duration-t)/.19);
  const pressure=.72+.16*Math.sin(2*Math.PI*.8*t)+.08*Math.sin(2*Math.PI*3.2*t);
  let value;
  if(spec.id==='capsule-slide')value=((band-low)*.17+Math.sin(2*Math.PI*(74*t+3*t*t))*.023+Math.sin(2*Math.PI*335*t)*.007)*envelope*pressure;
  else value=((band-low)*.16+Math.sin(2*Math.PI*(1020*t-160*t*t))*.01)*envelope*(.78+.12*Math.sin(2*Math.PI*2*t));
  pcm[i*2]=pcm[i*2+1]=value;peak=Math.max(peak,Math.abs(value));
 }
 const gain=Math.pow(10,spec.peakDb/20)/peak;for(let i=0;i<pcm.length;i++)pcm[i]*=gain;
 const file=path.join(folder,spec.id+'.wav'),measurements=writeWave(file,pcm);
 sounds.push({...spec,audio:path.relative(ROOT,file).replaceAll('\\','/'),sha256:hash(file),provider:'local-procedural',seed:384197,source:'foley.cjs : bruit filtré déterministe et résonances mécaniques faibles ; aucun échantillon externe, aucune voix.',...measurements});
}
const report={schemaVersion:1,date:'2026-11-08',scriptSha256:hash(__filename),newPaidCalls:0,humanListening:'not-performed',sounds};
fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});fs.copyFileSync(__filename,path.join(folder,'foley.cjs'),fs.constants.COPYFILE_EXCL);console.log(JSON.stringify(report));
