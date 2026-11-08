const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..'),[url,target]=process.argv.slice(2);
if(!url||!target)throw Error('Usage: node review-interval.cjs URL NEW_OUTPUT [--page16|17]');
const pageOption=process.argv.indexOf('--page'),wanted=pageOption<0?16:Number(process.argv[pageOption+1]),out=path.resolve(target);if(![16,17].includes(wanted))throw Error('--page 16 ou17 attendu.');if(fs.existsSync(out))throw Error('Dossier neuf requis.');fs.mkdirSync(out,{recursive:true});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),engine=['core.js','layers.js','effects.js','reader.js'];
const report={status:'running',url,wanted,engineHashes:Object.fromEntries(engine.map(f=>[f,sha(path.join(root,'anime/motion-comics',f))])),samples:[]};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');save();
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);await page.evaluate(()=>document.fonts.ready);
 const scene=await page.evaluate(wanted=>{
  const api=window.motionComic;api.pause();api.setRenderMode(true);api.setEffects(true);
  let selected=api.pages.find(p=>p.id===`page-${wanted}`)??api.pages[0];api.seek(selected.start+.001);
  const data=api.manifest;if(!data.panels[0].id.startsWith(`p${wanted}-`))throw Error('Page demandée absente.');
  const layer=data.motionLayers[0],hold=layer.startSeconds;
  const times=wanted===16?[hold,hold+.45-.001,hold+.45,hold+.57,hold+.75,hold+.95,hold+1.15,hold+1.32,hold+1.5,hold+2.4]:
   [hold-.04,hold+.02-.001,hold+.02,hold+.62-.001,hold+.62,hold+.70-.001,hold+.70,hold+.9,hold+1.05-.001,hold+1.05,hold+2.45];
  return{pageStart:selected.start,pageDuration:selected.duration,manifest:data,layer,times,clipStart:hold-.04,clipEnd:hold+2.6};
 },wanted);report.manifest=scene.manifest;report.manifestSignature=crypto.createHash('sha256').update(JSON.stringify(scene.manifest)).digest('hex');
 const capture=async(time,ambient=2.123)=>page.evaluate(({local,global,ambient,wanted})=>{
  const api=window.motionComic;api.seek(global);const W=api.pageCanvas.width,H=api.pageCanvas.height;
  for(let warm=0;warm<3;warm++){api.draw(global,ambient);api.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H);}
  const layer=api.manifest.motionLayers[0],rect=layer.rect;
  const c=document.createElement('canvas');c.width=1280;c.height=720;const ctx=c.getContext('2d');ctx.fillStyle='#080b15';ctx.fillRect(0,0,1280,720);
  ctx.fillStyle='#effaff';ctx.font='bold 20px Arial';ctx.fillText(`BLUE PURPLE · p${wanted} · preuve muette · ${local.toFixed(4)} s`,16,32);
  const [x,y,w,h]=rect.map((v,i)=>v*(i%2?H:W));ctx.drawImage(api.pageCanvas,x,y,w,h,0,58,1280,1280*h/w);
  const pixels=api.artCanvas.getContext('2d',{willReadFrequently:true}).getImageData(x,y,w,h).data;
  let hash=2166136261;for(let i=0;i<pixels.length;i++)hash=Math.imul(hash^pixels[i],16777619);
  const letterImage=api.activeLetteringImage,letters=document.createElement('canvas');letters.width=W;letters.height=H;letters.getContext('2d',{willReadFrequently:true}).drawImage(letterImage,0,0,W,H);
  const lp=letters.getContext('2d').getImageData(0,0,W,H).data,final=api.pageCanvas.getContext('2d').getImageData(0,0,W,H).data;
  let opaque=0,altered=0;for(let i=0;i<lp.length;i+=4)if(lp[i+3]===255){opaque++;if(lp[i]!==final[i]||lp[i+1]!==final[i+1]||lp[i+2]!==final[i+2]||final[i+3]!==255)altered++;}
  return{png:c.toDataURL().split(',')[1],artHash:hash>>>0,storyTime:api.frameState.storyTime,frameIndex:window.motionLayers.sample(layer,api.frameState.storyTime).frameIndex,
   revealProgress:window.motionLayers.sample(layer,api.frameState.storyTime).revealProgress??null,opaqueLetterPixels:opaque,alteredOpaqueLetterPixels:altered};
 },{local:time,global:scene.pageStart+time,ambient,wanted});
 const expectedFrames=wanted===17?[0,0,1,1,2,2,3,4,4,5,5]:null;
 for(const [i,time] of scene.times.entries()){
  const r=await capture(time),file=`proof-${String(i).padStart(2,'0')}.png`;fs.writeFileSync(path.join(out,file),Buffer.from(r.png,'base64'));delete r.png;
  report.samples.push({time,file,expectedFrameIndex:expectedFrames?.[i]??null,...r});save();
 }
 const sampleTime=wanted===16?scene.layer.startSeconds+.9:scene.layer.startSeconds+.75;
 const frozen=await capture(sampleTime,1),frozenLater=await capture(sampleTime,999);report.narrativePauseExact=frozen.artHash===frozenLater.artHash;
 await capture(scene.layer.startSeconds+.1);const repeated=await capture(sampleTime,1);report.seekOrderIndependent=frozen.artHash===repeated.artHash;
 const framesDir=path.join(out,'frames');fs.mkdirSync(framesDir);const fps=24,count=Math.ceil((scene.clipEnd-scene.clipStart)*fps),hashes=[];
 for(let i=0;i<count;i++){
  const t=scene.clipStart+i/fps,r=await capture(t);fs.writeFileSync(path.join(framesDir,`frame-${String(i).padStart(4,'0')}.png`),Buffer.from(r.png,'base64'));
  hashes.push({time:t,artHash:r.artHash,revealProgress:r.revealProgress,frameIndex:r.frameIndex});
 }
 const ffmpeg=process.env.HOLT_FFMPEG??path.join(root,'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
 const video=path.join(out,'interval.mp4');const encode=spawnSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-n','-framerate',String(fps),'-i',path.join(framesDir,'frame-%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-an',video],{encoding:'utf8'});assert.equal(encode.status,0,encode.stderr);
 const decode=spawnSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-i',video,'-f','null','-'],{encoding:'utf8'});assert.equal(decode.status,0,decode.stderr);
 const contact=await page.evaluate(async images=>{
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=Math.ceil(images.length/2)*360;const ctx=canvas.getContext('2d');ctx.fillStyle='#080b15';ctx.fillRect(0,0,canvas.width,canvas.height);
  for(const [i,src] of images.entries()){const image=new Image();image.src=src;await image.decode();ctx.drawImage(image,(i%2)*640,Math.floor(i/2)*360,640,360);}return canvas.toDataURL().split(',')[1];
 },report.samples.map(s=>'data:image/png;base64,'+fs.readFileSync(path.join(out,s.file)).toString('base64')));fs.writeFileSync(path.join(out,'contact.png'),Buffer.from(contact,'base64'));
 report.frameSequence=hashes;report.video={path:video,sha256:sha(video),fps,frames:count,duration:count/fps,decoded:true,silent:true};
 report.browserErrors=errors;report.runtimeUnchanged=engine.every(f=>sha(path.join(root,'anime/motion-comics',f))===report.engineHashes[f]);
 report.status=report.narrativePauseExact&&report.seekOrderIndependent&&report.runtimeUnchanged&&errors.length===0&&report.samples.every(s=>s.opaqueLetterPixels>0&&s.alteredOpaqueLetterPixels===0&&(s.expectedFrameIndex===null||s.expectedFrameIndex===s.frameIndex))?'completed':'failed';save();
 assert.equal(report.status,'completed');console.log(JSON.stringify({status:report.status,samples:report.samples.length,video:report.video.path}));
}catch(e){report.status='failed';report.error=String(e.stack??e);save();throw e;}finally{if(browser)await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
