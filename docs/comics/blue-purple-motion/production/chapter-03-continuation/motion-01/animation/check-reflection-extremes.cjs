const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const [url,target]=process.argv.slice(2);if(!url||!target)throw Error('Usage: node check-reflection-extremes.cjs URL NEW_OUTPUT');
const out=path.resolve(target);if(fs.existsSync(out))throw Error('Dossier neuf requis.');fs.mkdirSync(out,{recursive:true});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage();await page.goto(url);await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
 const reports=[];for(const n of [9,19]){
  const r=await page.evaluate(n=>{
   const api=window.motionComic;api.pause();api.setRenderMode(true);api.setEffects(true);
   const selected=api.pages.find(p=>Number(p.id.match(/\d+/)?.[0])===n);api.seek(selected.start+.001);
   const data=api.manifest,index=data.panels.findIndex(p=>p.id===`p${String(n).padStart(2,'0')}-c02`),panel=data.panels[index],segment=selected.segments.find(s=>s.panel===index);
   const fx=data.effects.find(f=>f.panelId===panel.id&&f.type==='reflection'),story=segment.start+(data.transitionSeconds??.8)+.75,global=selected.start+story;
   const frequency=fx.frequency??.55,period=1/frequency,firstMaximum=(.25-(fx.phase??0)/(Math.PI*2))/frequency;
   const ambientA=firstMaximum+Math.ceil((global-firstMaximum)/period)*period,ambientB=ambientA+period*.5;
   const bytes=()=>api.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,api.pageCanvas.width,api.pageCanvas.height).data;
   const draw=phase=>{api.seek(global);api.draw(global,phase);return bytes();};for(let k=0;k<3;k++)draw(ambientA);
   const W=api.pageCanvas.width,H=api.pageCanvas.height,a=draw(ambientA),sheet=document.createElement('canvas');
   const [x,y,w,h]=panel.rect.map((v,i)=>v*(i%2?H:W)),cw=640,ch=Math.round(h/w*cw);sheet.width=cw*2;sheet.height=ch+48;
   const c=sheet.getContext('2d');c.fillStyle='#080b15';c.fillRect(0,0,sheet.width,sheet.height);c.fillStyle='white';c.font='16px sans-serif';c.fillText(`${panel.id} · maximum · phase ${ambientA.toFixed(3)} s`,8,26);c.drawImage(api.pageCanvas,x,y,w,h,0,48,cw,ch);
   const b=draw(ambientB);c.fillStyle='white';c.fillText(`${panel.id} · minimum · phase ${ambientB.toFixed(3)} s`,cw+8,26);c.drawImage(api.pageCanvas,x,y,w,h,cw,48,cw,ch);
   let changedOver10=0,maxDifference=0;const [rx,ry,rw,rh]=fx.rect.map((v,i)=>v*(i%2?H:W));
   for(let py=Math.ceil(ry);py<Math.floor(ry+rh);py++)for(let px=Math.ceil(rx);px<Math.floor(rx+rw);px++){
    const i=(py*W+px)*4,diff=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));maxDifference=Math.max(maxDifference,diff);if(diff>10)changedOver10++;
   }
   const repeated=draw(ambientB),deterministic=b.every((v,i)=>v===repeated[i]);
   return{pageId:selected.id,panelId:panel.id,manifestSignature:null,storyTime:story,globalStoryTime:global,ambientTimes:[ambientA,ambientB],frequency,phase:fx.phase,changedOver10,maxDifference,deterministic,passed:changedOver10>0&&deterministic,proof:sheet.toDataURL('image/png').split(',')[1]};
  },n);fs.writeFileSync(path.join(out,r.panelId+'-extremes.png'),Buffer.from(r.proof,'base64'));delete r.proof;
  r.manifestSignature=await page.evaluate(()=>JSON.stringify(window.motionComic.manifest));r.manifestSignature=crypto.createHash('sha256').update(r.manifestSignature).digest('hex');reports.push(r);
 }
 const boundaries=await page.evaluate(()=>{
  const api=window.motionComic,selected=api.pages.find(p=>p.id==='page-17');api.setEffects(false);api.seek(selected.start+.001);
  const W=api.pageCanvas.width,H=api.pageCanvas.height,pixels=api.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  const x0=57.71875,y0=671,w=1084.546875,h=590;
  const inspect=(lo,hi)=>[.03,.25,.5,.75,.97].map(u=>{
   const cx=Math.round(x0+w*u);let best={y:0,score:-1};
   for(let y=Math.round(y0+h*lo);y<=Math.round(y0+h*hi);y++){
    let score=0;for(let dx=-3;dx<=3;dx++){const i=(y*W+cx+dx)*4;score+=Math.min(pixels[i],pixels[i+1],pixels[i+2]);}
    if(score>best.score)best={y,score};
   }return{u,...best,localY:(best.y-y0)/h};
  });return{firstSeam:inspect(.31,.43),secondSeam:inspect(.55,.69)};
 });
 const report={status:reports.every(r=>r.passed)?'completed':'failed',source:'integrated-v1 retained: two ordinary-phase pairs had 0 pixels >10. Supplement samples explicit extrema without changing threshold.',reader:url,checkerSha256:sha(__filename),reports,boundaries};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 if(report.status!=='completed')throw Error('Reflet imperceptible même aux extrêmes.');
}finally{if(browser)await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
