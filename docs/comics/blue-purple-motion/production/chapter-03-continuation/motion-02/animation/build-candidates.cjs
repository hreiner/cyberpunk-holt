/* global DOMParser */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..'),project=path.join(root,'anime/motion-comics/projects');
const core=require(path.join(root,'anime/motion-comics/core.js'));
const args=process.argv.slice(2),value=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const pageNumber=Number(value('--page','16'));if(![16,17].includes(pageNumber))throw Error('--page16 ou17 requis.');
const candidates=path.join(__dirname,'candidates-v1');fs.mkdirSync(candidates,{recursive:true});
const assets=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/animation/assets-v1','page-'+pageNumber);
if(fs.existsSync(assets)&&fs.readdirSync(assets).length)throw Error('Assets déjà présents : nouvelle version requise.');fs.mkdirSync(assets,{recursive:true});
const sourceFile=path.join(project,`blue-purple-page${pageNumber}-motion04.json`),source=JSON.parse(fs.readFileSync(sourceFile,'utf8'));
const data=core.rebaseAssets(source,p=>path.relative(candidates,path.resolve(project,p)).split(path.sep).join('/'));
const local=p=>path.resolve(candidates,p),media=f=>path.relative(candidates,f).split(path.sep).join('/');
const uri=f=>'data:image/'+(path.extname(f)==='.svg'?'svg+xml':path.extname(f)==='.jpg'?'jpeg':'png')+';base64,'+fs.readFileSync(f).toString('base64');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write=(name,text)=>{const file=path.join(assets,name);fs.writeFileSync(file,text,{flag:'wx'});return file;};
const png=(name,data)=>write(name,Buffer.from(data,'base64'));
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage();await page.setContent('<!doctype html><title>Préparation animation HOLT</title>');
 const timeline=core.buildTimeline(data),segment=timeline.segments.find(s=>s.panel===(pageNumber===16?0:1)),hold=segment.start+data.transitionSeconds;
 const letteringText=fs.readFileSync(local(data.letteringImage),'utf8');
 let report={page:pageNumber,source:sourceFile,sourceSha256:sha(sourceFile),duration:timeline.duration,holdStart:hold};
 if(pageNumber===16){
  const mapFile=path.resolve(value('--map',path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/map/map-final.png')));
  const result=await page.evaluate(async({raw,master,map,letters})=>{
   const load=async src=>{const i=new Image();i.src=src;await i.decode();return i;};
   const [art,original,city,lettering]=await Promise.all([load(raw),load(master),load(map),load(letters)]);
   const crop=document.createElement('canvas');crop.width=1000;crop.height=496;const c=crop.getContext('2d');
   c.drawImage(art,12,12,1000,496,0,0,1000,496);const elf=crop.toDataURL().split(',')[1];
   c.clearRect(0,0,1000,496);const scale=Math.max(1000/city.width,496/city.height);
   c.drawImage(city,(1000-city.width*scale)/2,(496-city.height*scale)/2,city.width*scale,city.height*scale);const final=crop.toDataURL().split(',')[1];
   const output=document.createElement('canvas');output.width=1024;output.height=1536;const ctx=output.getContext('2d');ctx.drawImage(original,0,0);
   ctx.save();ctx.beginPath();ctx.rect(12,12,1000,496);ctx.clip();ctx.drawImage(crop,12,12);ctx.drawImage(lettering,0,0);ctx.restore();
   return{elf,final,master:output.toDataURL().split(',')[1]};
  },{raw:uri(local(data.motionBaseImage)),master:uri(local(data.image)),map:uri(mapFile),letters:uri(local(data.letteringImage))});
  const elf=png('elf.png',result.elf),city=png('night-city.png',result.final),master=png('page-final.png',result.master);
  data.image=media(master);data.storyThumbnail=true;data.effects=data.effects.filter(f=>f.panelId!=='p16-c01');
  data.motionLayers=[{id:'elf-world-to-night-city',panelId:'p16-c01',mode:'digitalReveal',rect:[...data.panels[0].rect],startSeconds:hold,endSeconds:segment.end,
   frames:[{atSeconds:0,image:media(elf)},{atSeconds:1.5,image:media(city)}],reveal:{durationSeconds:1.05,columns:12,rows:6,amplitudePx:14,color:'#55eafa'}}];
  report={...report,mapSource:mapFile,mapSha256:sha(mapFile),revealStart:hold+.45,mapSettled:hold+1.5,offMaster:'new final map page; original elf master preserved'};
 }else{
  const cleanFile=path.resolve(value('--clean',path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/art/p17-clean.png')));
  const cleanMaskFile=path.resolve(value('--mask',path.join(root,'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-02/art/p17-clean-mask-v2.json')));
  const cleanMask=JSON.parse(fs.readFileSync(cleanMaskFile,'utf8'));
  const result=await page.evaluate(async({raw,clean,letteringText,cleanMask})=>{
   const load=async src=>{const i=new Image();i.src=src;await i.decode();return i;};const [art,cleanImage]=await Promise.all([load(raw),load(clean)]);
   const crop=document.createElement('canvas');crop.width=1000;crop.height=496;const c=crop.getContext('2d',{willReadFrequently:true});c.drawImage(art,12,520,1000,496,0,0,1000,496);
   const original=document.createElement('canvas');original.width=1000;original.height=496;original.getContext('2d').drawImage(crop,0,0);
   const cleanCrop=document.createElement('canvas');cleanCrop.width=1000;cleanCrop.height=496;const cleanCtx=cleanCrop.getContext('2d',{willReadFrequently:true});const scale=Math.max(1000/cleanImage.width,496/cleanImage.height);
   const offset=[(1000-cleanImage.width*scale)/2,(496-cleanImage.height*scale)/2];
   cleanCtx.drawImage(cleanImage,...offset,cleanImage.width*scale,cleanImage.height*scale);
   const actorMask=document.createElement('canvas');actorMask.width=1000;actorMask.height=496;const actorCtx=actorMask.getContext('2d',{willReadFrequently:true});actorCtx.fillStyle='white';actorCtx.strokeStyle='white';actorCtx.lineWidth=3;
   for(const polygon of [...cleanMask.actors,cleanMask.originalRail,cleanMask.originalHole]){
    const points=polygon.map(p=>[p[0]*scale+offset[0],p[1]*scale+offset[1]]);actorCtx.beginPath();actorCtx.moveTo(...points[0]);for(const p of points.slice(1))actorCtx.lineTo(...p);actorCtx.closePath();actorCtx.fill();actorCtx.stroke();
   }
   const maskPixels=actorCtx.getImageData(0,0,1000,496).data,cleanPixels=cleanCtx.getImageData(0,0,1000,496),originalPixels=c.getImageData(0,0,1000,496).data;let protectedPixels=0;
   for(let i=0;i<maskPixels.length;i+=4)if(maskPixels[i+3]){protectedPixels++;for(let k=0;k<4;k++)cleanPixels.data[i+k]=originalPixels[i+k];}
   cleanCtx.putImageData(cleanPixels,0,0);
   const px=c.getImageData(0,0,1000,496).data;
   const seam=(lo,hi)=>{
    const points=[.03,.25,.5,.75,.97].map(u=>{const x=Math.round(1000*u);let best={y:0,score:-1};for(let y=Math.round(496*lo);y<=Math.round(496*hi);y++){
     let score=0;for(let dx=-3;dx<=3;dx++){const i=(y*1000+x+dx)*4;score+=Math.min(px[i],px[i+1],px[i+2]);}if(score>best.score)best={y,score};}return{x,y:best.y};});
    const mx=points.reduce((s,p)=>s+p.x,0)/points.length,my=points.reduce((s,p)=>s+p.y,0)/points.length;
    const slope=points.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/points.reduce((s,p)=>s+(p.x-mx)**2,0),b=my-slope*mx;
    return{points,left:b,right:b+slope*1000};
   };
   const a=seam(.30,.43),b=seam(.55,.70),polygons=[[[0,0],[1000,0],[1000,a.right],[0,a.left]],[[0,a.left],[1000,a.right],[1000,b.right],[0,b.left]],[[0,b.left],[1000,b.right],[1000,496],[0,496]]];
   const clip=(ctx,poly)=>{ctx.beginPath();ctx.moveTo(...poly[0]);for(const p of poly.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.clip();};
   const stage=(visible,flash=false,impact=false)=>{c.clearRect(0,0,1000,496);c.fillStyle='#000000';c.fillRect(0,0,1000,496);
    if(visible===3){c.drawImage(cleanCrop,0,0);return crop.toDataURL().split(',')[1];}
    for(let band=0;band<visible;band++){c.save();clip(c,polygons[band]);c.drawImage(band===0&&flash||band===1&&impact?original:cleanCrop,0,0);c.restore();}
    return crop.toDataURL().split(',')[1];};
   const stages=[stage(0),stage(1),stage(1,true),stage(2,false,true),stage(2),stage(3)];
   const letterDocument=new DOMParser().parseFromString(letteringText,'image/svg+xml');const bubble=letterDocument.querySelector('[data-key="17-2-0"]');if(!bubble)throw Error('Bulle Wendy introuvable.');bubble.remove();
   return{stages,hiddenLetters:new XMLSerializer().serializeToString(letterDocument.documentElement),seams:{first:a,second:b},polygons,protectedPixels};
  },{raw:uri(local(data.motionBaseImage)),clean:uri(cleanFile),letteringText,cleanMask});
  const files=result.stages.map((v,i)=>png('stage-'+i+'.png',v)),hidden=write('lettering-hidden.svg',result.hiddenLetters);
  const originalCueStart=timeline.tracks.find(t=>t.panel===1).start;data.panels[1].leadInSeconds=1.08;
  data.storyThumbnail=true;data.effects=data.effects.filter(f=>f.panelId!=='p17-c02');
  const smoke=source.effects.find(f=>f.type==='smoke'&&f.panelId==='p17-c02');
  if(smoke)data.effects.push({...smoke,startSeconds:hold+.80,endSeconds:hold+2.6});
  const times=[0,.02,.62,.70,.90,1.05];
  data.motionLayers=[{id:'three-bands-one-shot',panelId:'p17-c02',mode:'frames',rect:[...data.panels[1].rect],startSeconds:hold,endSeconds:segment.end,
   frames:files.map((f,i)=>({atSeconds:times[i],image:media(f),letteringImage:i===5?data.letteringImage:media(hidden)}))}];
  report={...report,cleanSource:cleanFile,cleanSha256:sha(cleanFile),cleanMaskFile,cleanMaskSha256:sha(cleanMaskFile),protectedActorAndRailPixels:result.protectedPixels,seams:result.seams,polygons:result.polygons,
   oneShot:hold+.62,metalImpact:hold+.70,coverBand:hold+1.05,originalWendyStart:originalCueStart,newWendyStart:hold+1.08};
 }
 data.version=5;data.provenance={...data.provenance,motion02:media(path.join(__dirname,'CONTRACTS.json')),previousSourceSha256:sha(sourceFile)};
 const after=core.buildTimeline(data);assert.equal(after.duration,timeline.duration);
 for(let i=0;i<timeline.tracks.length;i++){
  const a=timeline.tracks[i],b=after.tracks[i];assert.equal(a.audio,b.audio);assert.equal(a.end-a.start,b.end-b.start);
  if(pageNumber===17&&a.panel===1)assert(Math.abs(b.start-a.start-.7)<1e-8);else assert.deepEqual(a,b);
 }
 const file=path.join(candidates,'page-'+pageNumber+'.json');fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 report={...report,candidate:file,candidateSha256:sha(file),files:fs.readdirSync(assets).map(f=>({file:path.join(assets,f),sha256:sha(path.join(assets,f))})),timeline:after};
 fs.writeFileSync(path.join(__dirname,'BUILD-'+pageNumber+'.json'),JSON.stringify(report,null,2)+'\n');
 if([16,17].every(n=>fs.existsSync(path.join(candidates,'page-'+n+'.json')))){
  const sequence={kind:'motion-comic-sequence',schemaVersion:1,version:1,title:'Blue Purple — revue des animations16–17',pages:[{id:'page-16',manifest:'page-16.json'},{id:'page-17',manifest:'page-17.json'}]};
  fs.writeFileSync(path.join(candidates,'sequence.json'),JSON.stringify(sequence,null,2)+'\n',{flag:'wx'});
 }
 console.log(JSON.stringify({candidate:file,duration:after.duration,assets:report.files.length}));
}finally{if(browser)await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
