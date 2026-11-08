const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../../../../../..'),[url,output,number]=process.argv.slice(2),wanted=Number(number);
assert(url&&output&&[16,17].includes(wanted),'URL OUTPUT PAGE requis.');
const out=path.resolve(output);assert(!fs.existsSync(out),'Preuves dans un dossier neuf.');fs.mkdirSync(out,{recursive:true});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const engine=['core.js','effects.js','layers.js','reader.js','package.json'];
const report={status:'running',url,page:wanted,engine:Object.fromEntries(engine.map(file=>[file,sha(path.join(root,'anime/motion-comics',file))])),samples:[]};
const save=()=>fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url);await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);await page.evaluate(()=>document.fonts.ready);
 const scene=await page.evaluate(wanted=>{
  const api=window.motionComic;api.pause();api.setRenderMode(true);api.setEffects(true);
  const p=api.pages.find(page=>page.id===`page-${wanted}`)??api.pages[0];api.seek(p.start+.001);
  const data=api.manifest,timeline=window.motionComicCore.buildTimeline(data);
  const holds=data.panels.map((panel,index)=>timeline.segments.find(s=>s.panel===index).start+data.transitionSeconds);
  return {start:p.start,duration:p.duration,data,holds};
 },wanted);report.scene=scene;
 const capture=async(local,ambient=1.37,panelIndex=0)=>page.evaluate(({global,local,ambient,panelIndex})=>{
  const api=window.motionComic;api.seek(global);const W=api.pageCanvas.width,H=api.pageCanvas.height;
  const bytes=canvas=>canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  for(let warm=0;warm<3;warm++){api.draw(global,ambient);bytes(api.pageCanvas);bytes(api.artCanvas);bytes(window.motionEffects.render.canvas);}
  const art=bytes(api.artCanvas),painted=bytes(window.motionEffects.render.canvas),final=bytes(api.pageCanvas);
  const hash=values=>{let v=2166136261;for(const n of values)v=Math.imul(v^n,16777619);return v>>>0;};
  const changed=(a,b,rect=[0,0,1,1])=>{let count=0;for(let y=Math.floor(rect[1]*H);y<Math.floor((rect[1]+rect[3])*H);y++)for(let x=Math.floor(rect[0]*W);x<Math.floor((rect[0]+rect[2])*W);x++){const i=(y*W+x)*4;if([0,1,2,3].some(k=>a[i+k]!==b[i+k]))count++;}return count;};
  const mask=document.createElement('canvas');mask.width=W;mask.height=H;const m=mask.getContext('2d',{willReadFrequently:true});m.fillStyle='white';m.strokeStyle='white';m.lineWidth=3;
  for(const fx of api.manifest.effects??[]){m.beginPath();if(fx.clipPolygon){const p=fx.clipPolygon.map(([x,y])=>[x*W,y*H]);m.moveTo(...p[0]);for(const point of p.slice(1))m.lineTo(...point);m.closePath();m.fill();m.stroke();}else m.fillRect(...fx.rect.map((v,i)=>v*(i%2?H:W)));}
  const allowed=bytes(mask);let outsideMaterials=0;for(let i=0;i<art.length;i+=4)if(!allowed[i+3]&&[0,1,2,3].some(k=>art[i+k]!==painted[i+k]))outsideMaterials++;
  const letter=document.createElement('canvas');letter.width=W;letter.height=H;letter.getContext('2d',{willReadFrequently:true}).drawImage(api.activeLetteringImage,0,0,W,H);const lp=bytes(letter);let opaque=0,altered=0;
  for(let i=0;i<lp.length;i+=4)if(lp[i+3]===255){opaque++;if([0,1,2,3].some(k=>lp[i+k]!==final[i+k]))altered++;}
  const rect=api.manifest.panels[panelIndex].rect.map((v,i)=>v*(i%2?H:W));
  const proof=document.createElement('canvas');proof.width=1000;proof.height=548;const c=proof.getContext('2d');c.fillStyle='#080b15';c.fillRect(0,0,1000,548);c.fillStyle='#d9f7ff';c.font='18px Arial';c.fillText(`p${api.manifest.panels[0].id.slice(1,3)} · case ${panelIndex+1} · récit ${local.toFixed(6)} s · ambiance ${ambient.toFixed(2)} s`,12,29);c.drawImage(api.pageCanvas,...rect,0,52,1000,496);
  let screenMean=0;for(let y=1193;y<1201;y++)for(let x=271;x<308;x++){const i=(y*W+x)*4;screenMean+=(art[i]+art[i+1])*.5/(8*37);}
  return {png:proof.toDataURL().split(',')[1],artHash:hash(art),paintHash:hash(painted),pageHash:hash(final),outsideMaterials,opaqueLetters:opaque,alteredLetters:altered,screenMean,
   protectedRegions:(api.manifest.protectedRegions??[]).map(region=>({id:region.id,changed:changed(art,painted,region.rect)})),
   layers:api.manifest.motionLayers.map(layer=>({id:layer.id,...window.motionLayers.sample(layer,api.frameState.storyTime)}))};
 },{global:scene.start+local,local,ambient,panelIndex});
 const h=scene.holds;
 const requested=wanted===16?[
  [h[0],0],[h[0]+.55,0],[h[0]+1.1,0],[h[0]+1.8,0],[h[0]+2.35,0],[h[0]+2.85,0],[h[0]+3.25,0],[h[0]+3.65,0],[h[0]+6,0],
  [h[1]+.16,1],[h[1]+.8,1],[h[1]+2.2,1],[h[1]+3.2,1],[h[2]+.2,2],[h[2]+1.14,2],[h[2]+1.78,2],[h[2]+5,2]
 ]:[
  [h[0]+1,0,1],[h[0]+1,0,2.3],[h[1]+.019999,1],[h[1]+.02,1],[h[1]+.619999,1],[h[1]+.62,1],[h[1]+.699999,1],[h[1]+.7,1],[h[1]+.9,1],[h[1]+1.049999,1],[h[1]+1.05,1],[h[1]+2,1],
  [h[2]+.8,2,1],[h[2]+.8,2,2.3],[h[2]+1.6,2,1],[h[2]+2.7,2,2.3]
 ];
 for(const [i,[time,panel,ambient]] of requested.entries()){
  const r=await capture(time,ambient??1.37,panel),file=`proof-${String(i).padStart(2,'0')}.png`;fs.writeFileSync(path.join(out,file),Buffer.from(r.png,'base64'));delete r.png;
  report.samples.push({time,panel:panel+1,ambient:ambient??1.37,file,...r});save();
 }
 report.boundaries=[];
 if(wanted===17){for(const offset of [.02,.62,.7,.9,1.05])for(const delta of [-1e-6,0,1e-6]){
  const result=await capture(h[1]+offset+delta,1.37,1),expected=[0,.02,.62,.7,.9,1.05].filter(x=>x<=offset+delta+1e-10).length-1;
  const actual=result.layers.find(layer=>layer.id==='three-bands-one-shot').frameIndex;
  report.boundaries.push({global:scene.start+h[1]+offset+delta,local:h[1]+offset+delta,delta,actual,expected});assert.equal(actual,expected);
 }}
 if(wanted===16){
  for(const [i,id] of ['position','unknown','green'].entries())for(const delta of [-1e-6,0,1e-6]){
   const time=h[0]+2.85+i*.4+delta,result=await capture(time,1.37,0),expected=delta<0?0:1;
   const actual=result.layers.find(layer=>layer.id===`map-marker-${id}`).frameIndex;
   report.boundaries.push({id,global:scene.start+time,local:time,delta,actual,expected});assert.equal(actual,expected);
  }
  for(const delta of [-1e-6,0,1e-6]){
   const time=h[0]+2.35+delta,result=await capture(time,1.37,0),progress=result.layers.find(layer=>layer.id==='elf-world-to-night-city').revealProgress;
   report.boundaries.push({id:'map-stable',global:scene.start+time,local:time,delta,progress});assert(delta<0?progress<1:progress===1);
  }
 }
 const t=wanted===16?h[0]+1.2:h[1]+.73;
 const first=await capture(t,1,0),later=await capture(t,99,0);await capture(h[2]+2,2,2);const repeated=await capture(t,1,0);
 report.narrativePauseExact=first.artHash===later.artHash;report.seekIndependent=first.pageHash===repeated.pageHash;
 report.off=await page.evaluate(async({time,url:_url})=>{
  const api=window.motionComic;api.seek(time);const data=api.manifest,doc=api.document,base=new URL(new URLSearchParams(location.search).get('manifest'),location.href);
  const manifest=doc.kind==='motion-comic-sequence'?new URL(doc.pages[api.pageIndex].manifest,base):base;
  const image=new Image();image.src=new URL(data.image,manifest);await image.decode();
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;
  api.setEffects(false);for(let i=0;i<3;i++){api.draw(time,1);api.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height);}const b=api.pageCanvas.getContext('2d').getImageData(0,0,c.width,c.height).data;let changed=0;for(let i=0;i<a.length;i+=4)if([0,1,2,3].some(k=>a[i+k]!==b[i+k]))changed++;
  api.setEffects(true);api.seek(0);return {changedPixels:changed};
 },{time:scene.start+t,url});
 if(process.argv.includes('--clip')){
  const dir=path.join(out,'frames');fs.mkdirSync(dir);const fps=24,start=wanted===16?h[0]-.1:h[1]-.05,duration=wanted===16?5.1:2.4,panel=wanted===16?0:1,count=Math.ceil(duration*fps);
  for(let i=0;i<count;i++){
   const local=start+i/fps;
   const png=await page.evaluate(({global,local,panel})=>{
    const api=window.motionComic;api.seek(global);api.draw(global,1.37);const art=api.pageCanvas,W=art.width,H=art.height;
    const c=document.createElement('canvas');c.width=1000;c.height=548;const ctx=c.getContext('2d');ctx.fillStyle='#080b15';ctx.fillRect(0,0,1000,548);ctx.fillStyle='#d9f7ff';ctx.font='18px Arial';ctx.fillText(`Intervalle réel · case ${panel+1} · ${local.toFixed(6)} s`,12,29);
    const r=api.manifest.panels[panel].rect.map((v,j)=>v*(j%2?H:W));ctx.drawImage(art,...r,0,52,1000,496);return c.toDataURL().split(',')[1];
   },{global:scene.start+local,local,panel});
   fs.writeFileSync(path.join(dir,`frame-${String(i).padStart(4,'0')}.png`),Buffer.from(png,'base64'));
  }
  const ffmpeg=path.join(root,'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'),file=path.join(out,'interval.mp4');
  const result=spawnSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-n','-framerate',String(fps),'-i',path.join(dir,'frame-%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-an',file],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  const decoded=spawnSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-i',file,'-f','null','-'],{encoding:'utf8'});assert.equal(decoded.status,0,decoded.stderr);report.clip={file,fps,frames:count,sha256:sha(file),silent:true,decoded:true};
 }
 const contact=await page.evaluate(async images=>{const c=document.createElement('canvas');c.width=1200;c.height=Math.ceil(images.length/2)*329;const ctx=c.getContext('2d');ctx.fillStyle='#080b15';ctx.fillRect(0,0,c.width,c.height);for(const [i,src] of images.entries()){const image=new Image();image.src=src;await image.decode();ctx.drawImage(image,i%2*600,Math.floor(i/2)*329,600,329);}return c.toDataURL().split(',')[1];},report.samples.map(s=>'data:image/png;base64,'+fs.readFileSync(path.join(out,s.file)).toString('base64')));
 fs.writeFileSync(path.join(out,'CONTACT.png'),Buffer.from(contact,'base64'));
 report.browserErrors=errors;report.engineUnchanged=engine.every(file=>sha(path.join(root,'anime/motion-comics',file))===report.engine[file]);
 report.status=report.narrativePauseExact&&report.seekIndependent&&report.off.changedPixels===0&&report.engineUnchanged&&!errors.length&&report.samples.every(s=>s.outsideMaterials===0&&s.alteredLetters===0&&s.protectedRegions.every(r=>r.changed===0))?'completed':'failed';save();
 assert.equal(report.status,'completed');console.log(JSON.stringify({status:report.status,page:wanted,samples:report.samples.length,boundaries:report.boundaries.length,out}));
}catch(error){report.status='failed';report.error=String(error.stack??error);save();throw error;}finally{if(browser)await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
