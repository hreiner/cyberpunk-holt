const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {ROOT,RATE,frameAt,writeWave}=require('./mix-engine.cjs');
const output=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/local-v1');
if(fs.existsSync(output))throw Error('Foley existant conservé.');
fs.mkdirSync(output,{recursive:true});
let state=7340993;
const noise=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2147483648-1;};
const clamp=x=>Math.max(0,Math.min(1,x));
const impulse=(t,at,decay,freq,amp)=>t<at?0:Math.exp(-(t-at)/decay)*Math.sin(2*Math.PI*freq*(t-at))*amp;
const ping=(t,at,freq,duration,amp)=>{const q=t-at;if(q<0||q>duration)return 0;return Math.sin(2*Math.PI*freq*q)*Math.sin(Math.PI*q/duration)*Math.exp(-q*4/duration)*amp;};
const specs=[
 {id:'terminal-confirm',duration:1.05,peakDb:-17,intention:'Recherche par touches fines suivie de confirmation courte, dans le terminal.'},
 {id:'implant-confirm',duration:.72,peakDb:-20,intention:'Confirmation interne plus feutrée et moins matérielle que la borne.'},
 {id:'connector-seat',duration:.76,peakDb:-15,intention:'Deux petits contacts mécaniques, puis prise électrique ; aucune étincelle explosive.'},
 {id:'repair-tool',duration:1.25,peakDb:-20,intention:'Outil sur métal, petit serrage matériel irrégulier.'},
 {id:'neural-unlock',duration:2.5,peakDb:-13,intention:'Acquisition de connaissances : séquence numérique intérieure brève, tension puis résolution.'},
 {id:'machine-power',duration:3.2,peakDb:-22,intention:'Alimentation électrique locale, petit relais et hum qui se stabilise ; sans alarme.'},
 {id:'cloth-shift',duration:.55,peakDb:-23,intention:'Frottement court de tissu sur le geste, aucun souffle ou grognement.'}
];
const rows=[];
for(const spec of specs){
 const frames=frameAt(spec.duration),data=new Float32Array(frames*2);let peak=0,filtered=0,low=0;
 for(let i=0;i<frames;i++){
  const t=i/RATE,n=noise(); filtered=.79*filtered+.21*n;low=.986*low+.014*n;let v=0;
  if(spec.id==='terminal-confirm')v=impulse(t,.01,.012,1530,.18)+impulse(t,.14,.01,1710,.13)+impulse(t,.3,.015,1240,.18)+ping(t,.48,920,.2,.3)+ping(t,.57,1380,.25,.18);
  if(spec.id==='implant-confirm')v=ping(t,.018,760,.26,.22)+ping(t,.12,1140,.34,.12)+filtered*Math.exp(-t/.1)*.014;
  if(spec.id==='connector-seat')v=impulse(t,.008,.015,2100,.3)+impulse(t,.087,.02,620,.32)+filtered*Math.exp(-Math.abs(t-.10)/.027)*.23+ping(t,.18,170,.27,.08);
  if(spec.id==='repair-tool')v=impulse(t,.008,.027,1430,.25)+impulse(t,.16,.02,1760,.18)+impulse(t,.4,.025,1160,.16)+filtered*Math.exp(-Math.abs(t-.67)/.14)*.09+impulse(t,.84,.035,620,.12);
  if(spec.id==='neural-unlock'){
   const swell=clamp(t/.16)*clamp((2.38-t)/.4),a=Math.exp(-Math.abs(t-.9)/.55);
   v=(Math.sin(2*Math.PI*(74*t+8*t*t))*.06+filtered*.017)*swell;
   const ats=[.01,.10,.23,.41,.66,.96,1.31,1.57];const freqs=[820,1093,1640,1230,1845,922,1383,1845];
   for(let j=0;j<ats.length;j++)v+=ping(t,ats[j],freqs[j],.055+j*.012,.05+j*.006);
   v+=ping(t,1.7,461,.54,.13)+ping(t,1.76,692,.62,.09)+a*filtered*.011;
  }
  if(spec.id==='machine-power'){const env=clamp(t/.5)*clamp((3.2-t)/.4);v=impulse(t,.007,.035,310,.11)+(Math.sin(2*Math.PI*72*t)*.06+Math.sin(2*Math.PI*144*t)*.018+low*.06)*env;}
  if(spec.id==='cloth-shift')v=(filtered-low)*Math.sin(Math.PI*t/spec.duration)*Math.exp(-t/.22)*.13;
  const edge=Math.min(clamp(i/(RATE*.002)),clamp((frames-i)/(RATE*.018)));
  const left=v*edge,right=v*edge;data[i*2]=left;data[i*2+1]=right;peak=Math.max(peak,Math.abs(left),Math.abs(right));
 }
 const gain=Math.pow(10,spec.peakDb/20)/peak;for(let i=0;i<data.length;i++)data[i]*=gain;
 const file=path.join(output,spec.id+'.wav'),measures=writeWave(file,data);
 rows.push({...spec,audio:path.relative(ROOT,file).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),provider:'local-procedural',source:'foley.cjs, synthèse de résonances/sons sinusoïdaux et bruit filtré déterministe ; aucun échantillon externe.',seed:7340993,newPaidCalls:0,...measures});
}
const report={schemaVersion:1,date:'2026-11-07',scriptSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),humanListening:'not-performed',sounds:rows};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({folder:path.relative(ROOT,output),sounds:rows.map(x=>({id:x.id,peakDb:x.peakDb,duration:x.duration})),newPaidCalls:0}));
