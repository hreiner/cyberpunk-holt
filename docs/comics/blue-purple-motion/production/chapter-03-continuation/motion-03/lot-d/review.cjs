/* Two phases per cell, exact boundaries, immutable bodies and short encoded clips. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright');
let root=__dirname;while(!fs.existsSync(path.join(root,'AGENTS.md')))root=path.dirname(root);
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs')),{newDirectory}=require(path.join(root,'anime/motion-comics/project.cjs'));
const [url,destination]=process.argv.slice(2);if(!url||!destination)throw Error('URL et nouveau dossier requis.');
const out=newDirectory(path.resolve(destination)),anchors=JSON.parse(fs.readFileSync(path.join(__dirname,'ANCHORS.json'),'utf8'));
const project=readDocument(path.join(__dirname,'candidates-v1.json')),old=readDocument(path.join(root,'anime/motion-comics/projects/blue-purple-pages01-21-v9.json'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),rel=file=>path.relative(root,file).replaceAll('\\','/');
const engine=['core.js','layers.js','effects.js','reader.js','sequence.js','reader.html','reader.css'];
const frozen=[...new Set([old.manifestFile,...old.files,project.manifestFile,...project.files,...engine.map(f=>path.join(root,'anime/motion-comics',f))])].map(file=>({file:rel(file),sha256:sha(file)}));
const report={status:'running',reader:url,anchorsSha256:sha(path.join(__dirname,'ANCHORS.json')),sourceFiles:frozen,samples:[],cases:[],boundaries:[],clips:[],browserErrors:[],failures:[],humanListening:false};
const write=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');write();
const event=id=>anchors.anchors.find(a=>a.id===id).localSeconds;
const findPage=number=>project.timeline.pages.find(p=>p.id===`page-${number}`);
const cases=[
 [18,'18-1',2.85+.2,event('residentContact'),'Held source contact; the consequence is a separate revealed drawing.'],
 [18,'18-after',event('residentConsequence')-.04,event('residentConsequence')+.06,'Consequence hidden then revealed without a body morph.'],
 [18,'18-2',event('boltStart')-.05,event('boltClosed')+.05,'Free bolt only; all fingers fixed.'],
 [18,'18-3',event('quietFloorSweep')+.8,event('quietFloorSweep')+3.1,'One floor reflection then quiet.'],
 [19,'19-1',event('doorSlitLight')+.8,event('doorSlitLight')+2.1,'Slit light then stable opening.'],
 [19,'19-2',12.5,16.4,'Slow lift reflections, stable feet.'],
 [19,'19-3',event('greenPointPulse')+.9,23.5,'Rain and tire puddle, one green pulse.'],
 [20,'20-1',3.6,6.2,'Low shoreline waves.'],
 [20,'20-2',9.8,12.4,'More agitated water behind held threat.'],
 [20,'20-3',event('waterThrowRelease')+.1,event('waterRecovery')+.1,'Gravity, submersion and recovery.'],
 [21,'21-1',event('refugeDoorOpeningStart')+.1,event('refugeDoorOpen')+.1,'Two real door planes and exact foreground.'],
 [21,'21-2',12.0,14.7,'Dust and single floor drop in empty chamber.'],
 [21,'21-3',18.1,event('finalIndicatorOff')+.2,'Red indicator dims and extinguishes.'],
];
async function sample(page,number,time,name,extra={}){
 const global=findPage(number).start+time;
 const result=await page.evaluate(async({global,name,panelKey})=>{
  const api=window.motionComic;api.seek(global);for(let i=0;i<3;i++){api.draw(global,global);api.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,1024,1536);}
  const source=api.pageCanvas,art=api.artCanvas,ctx=source.getContext('2d'),pixels=ctx.getImageData(0,0,1024,1536).data;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;canvas.getContext('2d').drawImage(source,0,0);
  const arts=document.createElement('canvas');arts.width=1024;arts.height=1536;arts.getContext('2d').drawImage(art??source,0,0);
  window.__lotD[name]={pixels:new Uint8ClampedArray(pixels),art:arts.getContext('2d').getImageData(0,0,1024,1536).data};
  const manifest=api.manifest,local=api.frameState.storyTime,selected=manifest.panels.find(p=>p.panelKey===panelKey)??manifest.panels[0];
  const rect=selected.rect.map((v,i)=>Math.round(v*(i%2?1536:1024))),crop=document.createElement('canvas');crop.width=rect[2];crop.height=rect[3];crop.getContext('2d').drawImage(source,...rect,0,0,crop.width,crop.height);
  const lettering=document.createElement('canvas');lettering.width=1024;lettering.height=1536;const lc=lettering.getContext('2d');if(api.activeLetteringImage)lc.drawImage(api.activeLetteringImage,0,0,1024,1536);
  const lp=lc.getImageData(0,0,1024,1536).data;let tested=0,changed=0;
  const hidden=manifest.panelReveals??[],covered=(x,y)=>hidden.some(r=>local<r.atSeconds-1e-10&&(()=>{const p=manifest.panels.find(p=>p.id===r.panelId),b=p.rect.map((v,i)=>v*(i%2?1536:1024));return x>=b[0]&&x<b[0]+b[2]&&y>=b[1]&&y<b[1]+b[3];})());
  for(let i=0;i<lp.length;i+=4)if(lp[i+3]===255&&!covered(i/4%1024,Math.floor(i/4/1024))){tested++;if([0,1,2].some(c=>lp[i+c]!==pixels[i+c]))changed++;}
  return{native:canvas.toDataURL(),casePng:crop.toDataURL(),screen:document.querySelector('#screen').toDataURL(),time:local,pageIndex:api.pageIndex,letteringOpaquePixels:tested,letteringChanged:changed,layerStates:api.manifest.motionLayers?.map(l=>({id:l.id,...window.motionLayers.sample(l,local)}))??[],rect};
 },{global,name,panelKey:extra.panelKey});
 const save=(file,data)=>{const target=path.join(out,file);fs.writeFileSync(target,Buffer.from(data.split(',')[1],'base64'),{flag:'wx'});return{file:rel(target),sha256:sha(target)};};
 const native=save(name+'-page.png',result.native),caseFile=save(name+'-case.png',result.casePng),screen=extra.screen?save(name+'-screen.png',result.screen):null;
 delete result.native;delete result.casePng;delete result.screen;
 report.samples.push({name,page:number,requestedLocal:time,...result,native,caseFile,screen});
 if(result.letteringChanged)report.failures.push({name,reason:'lettering-opaque-pixels-changed',changed:result.letteringChanged});write();return result;
}
async function compare(page,a,b,rect,kind='pixels'){
 return page.evaluate(({a,b,rect,kind})=>{const p=window.__lotD[a][kind],q=window.__lotD[b][kind],[x,y,w,h]=rect;let tested=0,changed=0;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){tested++;const i=(yy*1024+xx)*4;if([0,1,2,3].some(c=>p[i+c]!==q[i+c]))changed++;}return{tested,changed};},{a,b,rect,kind});
}
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1600,height:900}});page.on('pageerror',e=>report.browserErrors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.motionComic?.pages.length===4&&!document.querySelector('#play').disabled,null,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{window.motionComic.pause();window.motionComic.setRenderMode(true);window.motionComic.setEffects(true);window.__lotD={};});
 for(const [number,key,a,b,intention]of cases){const first=key+'-a',second=key+'-b',p=project.pages.find(p=>p.id===`page-${number}`).data.panels.find(p=>p.panelKey===key),rect=p.rect.map((v,i)=>Math.round(v*(i%2?1536:1024)));
  await sample(page,number,a,first,{panelKey:key,screen:true});await sample(page,number,b,second,{panelKey:key,screen:true});const difference=await compare(page,first,second,rect);report.cases.push({page:number,key,times:[a,b],intention,...difference});if(difference.changed===0&&key!=='18-1')report.failures.push({key,reason:'two-phases-identical'});write();
  if(!['18-2','21-1'].includes(key))await page.evaluate(names=>{for(const name of names)delete window.__lotD[name];},[first,second]);
 }
 for(const [id,number,key]of [['residentConsequence',18,'18-after'],['boltClosed',18,'18-2'],['waterSplash',20,'20-3'],['waterSubmerged',20,'20-3'],['refugeDoorOpen',21,'21-1'],['finalIndicatorOff',21,'21-3']]){
  const t=event(id);for(const [suffix,dt]of [['before',-1/24],['exact',0],['after',1/24]]){const name=id+'-'+suffix;await sample(page,number,t+dt,name,{panelKey:key});report.boundaries.push({id,phase:suffix,requestedLocal:t+dt});await page.evaluate(name=>delete window.__lotD[name],name);}
 }
 // Exact hands/foreground pixels from selected art are not transformed by a prop.
 const checks=[['18-2-a','18-2-b',[866,650,45,40]],['18-2-a','18-2-b',[895,690,44,42]]];
 report.rigidProof=[];for(const [a,b,rect]of checks){const result=await compare(page,a,b,rect,'art');report.rigidProof.push({a,b,rect,...result});if(result.changed)report.failures.push({a,b,reason:'rigid-region-changed',...result});}
 const actorSource='data:image/png;base64,'+fs.readFileSync(path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-d/assets-v5/abigail-original.png')).toString('base64');
 const actorExact=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=496;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const mask=ctx.getImageData(0,0,1000,496).data,a=window.__lotD['21-1-a'].art,b=window.__lotD['21-1-b'].art;let tested=0,changed=0;for(let y=0;y<496;y++)for(let x=0;x<1000;x++)if(mask[(y*1000+x)*4+3]===255){tested++;const i=((y+12)*1024+x+12)*4;if([0,1,2,3].some(c=>a[i+c]!==b[i+c]))changed++;}return{actor:'Abigail foreground',tested,changed};},actorSource);
 report.rigidProof.push(actorExact);if(actorExact.changed)report.failures.push({reason:'foreground-actor-changed',...actorExact});
 // Narrative pause and unordered seek comparisons use the art layer, independent of FX phase.
 report.pause=[];for(const [number,t,key]of [[20,event('waterThrowRelease')+.4,'20-3'],[21,event('refugeDoorOpeningStart')+.5,'21-1']]){
  await sample(page,number,t,'pause-'+number,{panelKey:key});const global=findPage(number).start+t;const changed=await page.evaluate(({global,name})=>{window.motionComic.draw(global,global+50);const now=window.motionComic.artCanvas.getContext('2d').getImageData(0,0,1024,1536).data,old=window.__lotD[name].art;let changed=0;for(let i=0;i<now.length;i++)if(now[i]!==old[i])changed++;return changed;},{global,name:'pause-'+number});
  await page.evaluate(()=>window.motionComic.seek(0));await sample(page,number,t,'replay-'+number,{panelKey:key});const replay=await compare(page,'pause-'+number,'replay-'+number,[0,0,1024,1536],'art');report.pause.push({page:number,ambientChangedBytes:changed,replay});if(changed||replay.changed)report.failures.push({page:number,reason:'narrative-clock-not-fixed'});
 }
 const ffmpeg=process.env.HOLT_FFMPEG??path.join(root,'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
 const clipList=[['contact',18,event('residentContact')-.4,event('residentConsequence')+1.05],['bolt',18,event('boltStart')-.15,event('boltClosed')+.35],['water',20,event('waterThrowRelease')-.12,event('waterRecovery')+.4],['door',21,event('refugeLatchStart')-.15,event('refugeDoorOpen')+.35],['waves',20,3.4,6.2]];
 for(const [name,number,start,end]of clipList){const dir=path.join(out,'clips',name),frames=path.join(dir,'frames');fs.mkdirSync(frames,{recursive:true});const count=Math.ceil((end-start)*24);
  for(let frame=0;frame<count;frame++){const global=findPage(number).start+start+frame/24,data=await page.evaluate(t=>{window.motionComic.seek(t);window.motionComic.draw(t,t);return document.querySelector('#screen').toDataURL().split(',')[1];},global);fs.writeFileSync(path.join(frames,'frame-'+String(frame).padStart(4,'0')+'.png'),Buffer.from(data,'base64'));}
  const video=path.join(dir,'interval.mp4'),encode=spawnSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-n','-framerate','24','-i',path.join(frames,'frame-%04d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-an',video],{encoding:'utf8'});assert.equal(encode.status,0,encode.stderr);
  const decode=spawnSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-i',video,'-f','null','-'],{encoding:'utf8'});assert.equal(decode.status,0,decode.stderr);
  const uri='data:video/mp4;base64,'+fs.readFileSync(video).toString('base64');
  const playback=await page.evaluate(async src=>{const v=document.createElement('video');v.muted=true;v.src=src;document.body.append(v);await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject;});await v.play();await new Promise(r=>setTimeout(r,120));const result={width:v.videoWidth,height:v.videoHeight,duration:v.duration,played:!v.paused,currentTime:v.currentTime};v.pause();v.remove();return result;},uri);
  for(const [suffix,t]of [['before',0],['middle',Math.min((count-1)/24,(end-start)*.55)],['last',(count-1)/24]]){const extracted=spawnSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-n','-ss',String(t),'-i',video,'-frames:v','1',path.join(dir,suffix+'.png')],{encoding:'utf8'});assert.equal(extracted.status,0,extracted.stderr);}
  report.clips.push({name,page:number,start,end,frames:count,fps:24,silent:true,video:rel(video),sha256:sha(video),decoded:true,openedAndPlayed:playback});write();
 }
 for(const item of frozen)assert.equal(sha(path.join(root,item.file)),item.sha256,'Source modifiée : '+item.file);
 assert.deepEqual(report.browserErrors,[]);report.status=report.failures.length?'failed':'completed';report.sourcesPreserved=true;write();console.info(JSON.stringify({status:report.status,cases:report.cases,rigid:report.rigidProof,clips:report.clips.length,failures:report.failures}));if(report.failures.length)process.exitCode=1;
}catch(error){report.status='failed';report.error=error.stack;write();throw error;}finally{if(browser)await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
