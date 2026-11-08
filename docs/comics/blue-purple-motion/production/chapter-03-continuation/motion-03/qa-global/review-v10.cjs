/* Read-only production QA. All outputs stay in motion03/qa-global. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..'),runtime=path.join(root,'anime/motion-comics');
const {readDocument}=require(path.join(runtime,'sequence.cjs')),core=require(path.join(runtime,'core.js'));
const {getTiming}=require('../timing/retime.cjs');
const [url,output]=process.argv.slice(2);assert(url&&output,'URL et dossier neuf requis.');
const out=path.resolve(output);assert(!fs.existsSync(out),'Conserver les preuves précédentes.');fs.mkdirSync(out,{recursive:true});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),relative=file=>path.relative(root,file).split(path.sep).join('/');
const currentFile=path.join(root,'anime/motion-comics/projects/blue-purple-pages01-21-v10.json'),oldFile=path.join(root,'anime/motion-comics/projects/blue-purple-pages01-21-v9.json');
assert.equal(sha(currentFile),'d180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce');
const current=readDocument(currentFile),old=readDocument(oldFile),selection=JSON.parse(fs.readFileSync(path.join(__dirname,'../SELECTION.json')));
const timeline=JSON.parse(fs.readFileSync(path.join(__dirname,'../timing/TIMING.json')));
const oldBefore=Object.fromEntries([oldFile,...old.files].map(file=>[relative(file),sha(file)]));
const engineBefore=Object.fromEntries(selection.engine.map(item=>[item.file,sha(path.join(root,item.file))]));
const report={status:'running',url,selected:{file:relative(currentFile),sha256:sha(currentFile)},sourceV9:{dependencies:old.files.length,before:oldBefore},engine:{before:engineBefore},checks:[],boundaries:[],samples:[],ui:[]};
const check=(name,ok,data={})=>{report.checks.push({name,ok,...data});if(!ok)process.stderr.write('CHECK FAILED '+name+'\n');};
const save=()=>fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');save();
check('22 entries',current.pages.length===22);check('584.3 seconds',Math.abs(current.timeline.duration-584.3)<1e-9,{actual:current.timeline.duration});
check('99 voice tracks',current.timeline.tracks.length===99);check('Timing revision 2',timeline.revision===2);
check('195 frozen v9 dependencies',old.files.length===195);check('14 frozen runtime files',selection.engine.length===14&&selection.engine.every(item=>engineBefore[item.file]===item.sha256));
check('Voice files and measured durations preserved',current.timeline.tracks.every((track,index)=>track.audioFile===old.timeline.tracks[index].audioFile&&Math.abs((track.end-track.start)-(old.timeline.tracks[index].end-old.timeline.tracks[index].start))<1e-9));
check('Prefix ends at 238.6',Math.abs(current.timeline.pages[8].end-238.6)<1e-9);
check('Prefix JSON and media unchanged',current.pages.slice(0,9).every((page,index)=>page.manifestFile===old.pages[index].manifestFile&&sha(page.manifestFile)===oldBefore[relative(page.manifestFile)]&&page.files.length===old.pages[index].files.length&&page.files.every((file,i)=>file===old.pages[index].files[i])));
check('37 prefix voice takes',current.timeline.tracks.filter(track=>track.page<9).length===37);
const schedule=[];for(let i=9;i<current.pages.length;i++){
 const expected=getTiming(old.pages[i].data,i).newTimeline,actual=current.pages[i].timeline,expectedPage=timeline.pages.find(page=>page.pageNumber===i);
 schedule.push({page:i,voiceTimesExact:actual.tracks.every((track,j)=>Math.abs(track.start-expected.tracks[j].start)<1e-9&&Math.abs(track.end-expected.tracks[j].end)<1e-9),globalStart:current.timeline.pages[i].start,expectedStart:expectedPage.globalStart});
}check('All retimed voices follow the shared grid',schedule.every(page=>page.voiceTimesExact&&Math.abs(page.globalStart-page.expectedStart)<1e-9),{pages:schedule});
const mapLayers=current.pages[16].data.motionLayers.filter(layer=>layer.id.startsWith('map-marker-'));
check('Exactly three map POIs, no HOLT layer',mapLayers.length===3&&mapLayers.map(l=>l.id).join('|')==='map-marker-position|map-marker-unknown|map-marker-green'&&!mapLayers.some(l=>/holt/i.test(l.id)),{layers:mapLayers.map(l=>l.id)});
const contracts=[['C','../lot-c/ANCHORS.json'],['B','../lot-b/ANCHORS.json'],['D','../lot-d/ANCHORS.json']].flatMap(([lot,file])=>{const data=JSON.parse(fs.readFileSync(path.join(__dirname,file)));return (data.anchors??data.events).map(event=>({...event,lot,page:event.page??event.pageNumber}));});
const anchor=id=>{const result=contracts.find(event=>event.id===id);assert(result,id);return result;};
const events=['position','unknown','green','oneShot','metalImpact','capsuleClosed','waterSplash','refugeDoorOpen','residentConsequence'].map(anchor);
const prefixSamples=current.pages.slice(0,9).map((page,index)=>{
 let local=page.data.panels.length?((page.timeline.segments.find(s=>s.panel===(index===7?page.data.panels.length-1:0))?.start??0)+(page.data.transitionSeconds??core.DEFAULTS.transitionSeconds)+1.1):5;
 if(index===0)local=5;
 if(index===3)local=(page.data.effects.find(f=>f.type==='digitalVision')?.startSeconds??local)+1.7;
 if([5,6].includes(index)){const layer=page.data.motionLayers[0];local=layer.startSeconds+layer.frames[Math.min(2,layer.frames.length-1)].atSeconds+.1;}
 if(index===8)local=(page.data.effects.find(f=>f.type==='wind')?.startSeconds??local)+1.1;
 return {id:page.id,index,global:current.timeline.pages[index].start+local,local,ambient:23.456+index*.37};
});
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],httpErrors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.addInitScript(()=>{const Original=window.Audio;window.__qaAudio=[];window.Audio=function(...args){const element=new Original(...args);window.__qaAudio.push(element);return element;};window.Audio.prototype=Original.prototype;Object.setPrototypeOf(window.Audio,Original);});
 await page.goto(url);await page.waitForFunction(()=>window.motionComic?.duration>0&&document.querySelector('#reader').dataset.ready==='true',null,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
 const loaded=await page.evaluate(()=>{const a=window.motionComic;a.pause();a.setRenderMode(true);a.setEffects(true);return {duration:a.duration,entries:a.pages.length,tracks:a.tracks.length};});check('Browser loaded the complete v10',loaded.entries===22&&loaded.tracks===99&&Math.abs(loaded.duration-584.3)<1e-9,loaded);
 const capture=async(global,panelId,name)=>{
  const result=await page.evaluate(({global,panelId})=>{
   const api=window.motionComic;api.seek(global);const W=api.pageCanvas.width,H=api.pageCanvas.height,read=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
   for(let i=0;i<3;i++){api.draw(global,13.37);read(api.pageCanvas);if(api.artCanvas)read(api.artCanvas);}
   const state=api.frameState,data=api.manifest,local=state.storyTime,panel=data.panels.find(p=>p.id===panelId)??data.panels[0];
   const layerStates=data.motionLayers?.map(layer=>({id:layer.id,...window.motionLayers.sample(layer,local)}))??[];
   const c=document.createElement('canvas');c.width=1000;c.height=548;const ctx=c.getContext('2d');ctx.fillStyle='#080b15';ctx.fillRect(0,0,1000,548);ctx.fillStyle='#ddf8ff';ctx.font='18px Arial';ctx.fillText(`${panel.id} · global ${global.toFixed(9)} · local ${local.toFixed(9)} s`,12,29);ctx.drawImage(api.pageCanvas,...panel.rect.map((v,i)=>v*(i%2?H:W)),0,52,1000,496);
   const final=read(api.pageCanvas),art=api.artCanvas?read(api.artCanvas):final;let hash=2166136261;for(const value of art)hash=Math.imul(hash^value,16777619);
   const hidden=data.panelReveals?.filter(r=>local<r.atSeconds-1e-10).map(r=>data.panels.find(p=>p.id===r.panelId))??[];
   let visibleOpaqueLetters=0,alteredLetters=0,hiddenWrongPixels=0;
   if(api.activeLetteringImage){const l=document.createElement('canvas');l.width=W;l.height=H;l.getContext('2d',{willReadFrequently:true}).drawImage(api.activeLetteringImage,0,0,W,H);const lp=read(l);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,covered=hidden.some(p=>x>=p.rect[0]*W&&x<(p.rect[0]+p.rect[2])*W&&y>=p.rect[1]*H&&y<(p.rect[1]+p.rect[3])*H);if(lp[i+3]===255&&!covered){visibleOpaqueLetters++;if([0,1,2,3].some(k=>final[i+k]!==lp[i+k]))alteredLetters++;}}
   }
   for(const p of hidden){const r=p.rect.map((v,i)=>v*(i%2?H:W));for(let y=Math.ceil(r[1])+2;y<r[1]+r[3]-2;y++)for(let x=Math.ceil(r[0])+2;x<r[0]+r[2]-2;x++){const i=(y*W+x)*4;if(final[i]!==5||final[i+1]!==5||final[i+2]!==9||final[i+3]!==255)hiddenWrongPixels++;}}
   return {png:c.toDataURL().split(',')[1],global,local,pageIndex:api.pageIndex,layerStates,artHash:hash>>>0,visibleOpaqueLetters,alteredLetters,hiddenWrongPixels};
  },{global,panelId});
  const file=name+'.png';fs.writeFileSync(path.join(out,file),Buffer.from(result.png,'base64'));delete result.png;report.samples.push({file,...result});save();return result;
 };
 for(const event of events){
  const entry=current.timeline.pages[event.page],data=current.pages[event.page].data;
  const layer=event.page===16?data.motionLayers.find(l=>l.id==='map-marker-'+event.id):event.page===17?data.motionLayers.find(l=>l.id==='three-bands-one-shot'):event.page===15?data.motionLayers[0]:event.page===20?data.motionLayers[0]:event.page===21?data.motionLayers[0]:null;
  const panelId=layer?.panelId??data.panels.find(p=>p.panelKey==='18-after')?.id;
  const actualBoundary=event.globalSeconds;
  for(const [label,delta] of [['before',-1e-6],['exact',0],['after',1e-6]]){
   const r=await capture(actualBoundary+delta,panelId,`action-${event.id}-${label}`);
   if(layer){const state=r.layerStates.find(item=>item.id===layer.id),local=actualBoundary+delta-entry.start;const expected=layer.frames.filter(frame=>local+1e-10>=layer.startSeconds+frame.atSeconds).length-1;
    report.boundaries.push({id:event.id,label,global:actualBoundary+delta,frame:state.frameIndex,expected:Math.max(0,expected)});check(event.id+' '+label,state.frameIndex===Math.max(0,expected));
   }else{report.boundaries.push({id:event.id,label,global:actualBoundary+delta,hiddenWrongPixels:r.hiddenWrongPixels});check(event.id+' hidden composition '+label,r.hiddenWrongPixels===0);}
  }
 }
 check('Visible lettering and hidden cases exact at every action',report.samples.every(s=>s.alteredLetters===0&&s.hiddenWrongPixels===0));
 for(const [id,time]of [['capsule',427.3],['water',550.55],['door',562.4]]){
  const before=await capture(time,null,`pause-${id}-start`);await page.waitForTimeout(280);const after=await capture(time,null,`pause-${id}-end`);
  check('Narrative physical pause '+id,before.artHash===after.artHash&&JSON.stringify(before.layerStates)===JSON.stringify(after.layerStates));
 }
 // Save native prefix pixels before loading the old reduced descriptor in this same context.
 await page.evaluate(samples=>{window.__qaPrefix=new Map();const api=window.motionComic;for(const sample of samples){api.seek(sample.global);for(let k=0;k<3;k++){api.draw(sample.global,sample.ambient);api.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,api.pageCanvas.width,api.pageCanvas.height);}const c=api.pageCanvas,bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;window.__qaPrefix.set(sample.id,{bytes:new Uint8ClampedArray(bytes),width:c.width,height:c.height});}},prefixSamples);
 // UI and playback use the actual responsive composition, with no synthetic clicks per button.
 await page.evaluate(()=>{const a=window.motionComic;a.setRenderMode(false);a.seek(0);});
 const labels=await page.evaluate(()=>{const a=window.motionComic,items=[];for(const i of [0,1,21]){a.seek(a.pages[i].start+.01);items.push({index:i,label:document.querySelector('#page-label').textContent});}return items;});check('Cover/page1/page21 labels',labels.map(i=>i.label).join('|')==='Couverture|Page 1 / 21|Page 21 / 21',{labels});
 const uiShot=async(name,width,height,time)=>{await page.setViewportSize({width,height});await page.evaluate(time=>{const a=window.motionComic;a.pause();a.seek(time);},time);await page.waitForTimeout(120);const layout=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],label:document.querySelector('#page-label').textContent,screen:(()=>{const r=document.querySelector('#screen').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})(),buttons:[...document.querySelectorAll('.transport button,#pages-toggle')].map(b=>{const r=b.getBoundingClientRect();return {id:b.id,visible:getComputedStyle(b).display!=='none',x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};})}));await page.screenshot({path:path.join(out,name+'.png')});report.ui.push({file:name+'.png',...layout});check(name+' fits viewport',layout.scroll[0]<=width+1&&layout.buttons.filter(b=>b.visible).every(b=>b.width>0&&b.height>0&&b.x>=-1&&b.right<=width+1&&b.y>=-1&&b.bottom<=height+1));save();};
 await uiShot('ui-desktop-map',1440,1000,438.7);await uiShot('ui-mobile-door',390,844,562.4);await uiShot('ui-landscape-shot',844,390,468.6);
 await page.setViewportSize({width:1440,height:1000});
 const track=current.timeline.tracks.find(t=>t.start>400&&t.end-t.start>1),seekTime=track.start+.4;
 await page.evaluate(t=>{const a=window.motionComic;a.pause();a.seek(t);if(!a.muted)a.toggleMute();},seekTime);
 await page.waitForTimeout(100);
 const audio=await page.evaluate(()=>{const api=window.motionComic,track=api.tracks.find(t=>api.position>=t.start&&api.position<t.end),element=window.__qaAudio.findLast(e=>e.src===track.audioUrl);return {position:api.position,muted:api.muted,music:api.audioState,voice:{currentTime:element.currentTime,expected:api.position-track.start,readyState:element.readyState},allMuted:window.__qaAudio.every(e=>e.muted)};});
 check('Seek synchronizes backing and voice',Math.abs(audio.music.musicTime-seekTime)<.04&&Math.abs(audio.voice.currentTime-audio.voice.expected)<.04,audio);check('Mute reaches every media element',audio.muted&&audio.allMuted);
 await page.locator('#play').click();await page.waitForTimeout(320);await page.locator('#play').click();const played=await page.evaluate(()=>({position:window.motionComic.position,playing:window.motionComic.playing,muted:window.motionComic.muted,audio:window.motionComic.audioState}));check('Actual play then pause advances and stops',played.position>seekTime+.15&&!played.playing&&played.audio.voices.length===0&&!played.audio.musicPlaying,played);
 await page.evaluate(()=>{const a=window.motionComic;a.seek(a.duration-.06);a.play();});await page.waitForTimeout(220);const end=await page.evaluate(()=>({position:window.motionComic.position,duration:window.motionComic.duration,playing:window.motionComic.playing,audio:window.motionComic.audioState,label:document.querySelector('#page-label').textContent}));check('End stops at page21',Math.abs(end.position-end.duration)<1e-9&&!end.playing&&end.label==='Page 21 / 21'&&!end.audio.musicPlaying&&end.audio.voices.length===0,end);
 await page.evaluate(()=>{const a=window.motionComic;a.seek(0);a.pause();});await page.locator('#pages-toggle').click();await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'ui-drawer-initial.png')});
 const thumbs=await page.evaluate(async()=>{
  const api=window.motionComic,descriptor=api.document,base=new URL(new URLSearchParams(location.search).get('manifest'),location.href),results=[];
  const read=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;
  for(const index of [18,21]){
   const entry=descriptor.pages[index],manifestUrl=new URL(entry.manifest,base),data=await(await fetch(manifestUrl)).json(),assets={};
   for(const file of new Set([data.motionBaseImage,data.letteringImage,...data.motionLayers.flatMap(l=>[l.frames[0].image,l.frames.at(-1).image])])){const image=new Image();image.src=new URL(file,manifestUrl);await image.decode();assets[file]=image;}
   const actual=document.querySelector(`#page-list button[data-page="${index}"] canvas`),pixels=read(actual),renderAt=time=>{
    const art=window.motionLayers.render(assets[data.motionBaseImage],data.motionLayers,assets,time,true),c=document.createElement('canvas');c.width=art.width;c.height=art.height;const ctx=c.getContext('2d');ctx.drawImage(art,0,0);ctx.drawImage(assets[data.letteringImage],0,0);const complete=window.motionLayers.concealPanels(c,data.panels,data.panelReveals,time,true),tiny=document.createElement('canvas');tiny.width=actual.width;tiny.height=actual.height;tiny.getContext('2d',{willReadFrequently:true}).drawImage(complete,0,0,tiny.width,tiny.height);return read(tiny);
   },initial=renderAt(0),final=renderAt(60);let initialDifferent=0,finalDifferent=0,hiddenWrong=0;for(let i=0;i<pixels.length;i+=4){if([0,1,2,3].some(k=>pixels[i+k]!==initial[i+k]))initialDifferent++;if([0,1,2,3].some(k=>pixels[i+k]!==final[i+k]))finalDifferent++;}
   for(const reveal of data.panelReveals??[]){if(reveal.atSeconds<=0)continue;const p=data.panels.find(p=>p.id===reveal.panelId),r=p.rect.map((v,i)=>v*(i%2?actual.height:actual.width));for(let y=Math.ceil(r[1])+2;y<r[1]+r[3]-2;y++)for(let x=Math.ceil(r[0])+2;x<r[0]+r[2]-2;x++){const i=(y*actual.width+x)*4;if(pixels[i]!==5||pixels[i+1]!==5||pixels[i+2]!==9)hiddenWrong++;}}
   results.push({page:index,initialDifferent,finalDifferent,hiddenWrong,png:actual.toDataURL().split(',')[1]});
  }return results;
 });
 for(const thumb of thumbs){fs.writeFileSync(path.join(out,`thumbnail-page-${thumb.page}.png`),Buffer.from(thumb.png,'base64'));delete thumb.png;check('Initial thumbnail gate page '+thumb.page,thumb.hiddenWrong===0&&thumb.initialDifferent<thumb.finalDifferent,thumb);}await page.locator('#close-pages').click();
 // Baseline JSON comes from disk, never via the v9 redirect, and excludes its old music.
 const baseline={...old.data,pages:old.data.pages.slice(0,9)};delete baseline.music;
 await page.evaluate(async({data,base})=>{await window.motionComic.load(data,base);window.motionComic.pause();window.motionComic.setRenderMode(true);window.motionComic.setEffects(true);},{data:baseline,base:new URL('/anime/motion-comics/projects/blue-purple-pages01-21-v9.json',url).href});
 const prefix=await page.evaluate(samples=>{
  const a=window.motionComic,results=[];for(const sample of samples){a.seek(sample.global);for(let i=0;i<3;i++){a.draw(sample.global,sample.ambient);a.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,a.pageCanvas.width,a.pageCanvas.height);}const c=a.pageCanvas,b=c.getContext('2d').getImageData(0,0,c.width,c.height).data,previous=window.__qaPrefix.get(sample.id),p=previous.bytes;let changed=0,firstMismatch=null;for(let i=0;i<b.length;i+=4)if([0,1,2,3].some(k=>b[i+k]!==p[i+k])){changed++;firstMismatch??={x:i/4%c.width,y:Math.floor(i/4/c.width),current:[...p.slice(i,i+4)],baseline:[...b.slice(i,i+4)]};}results.push({...sample,changedPixels:changed,firstMismatch});}return {duration:a.duration,samples:results};
 },prefixSamples);report.prefixVisual=prefix;check('Nine native prefix compositions identical',prefix.samples.length===9&&prefix.samples.every(s=>s.changedPixels===0)&&Math.abs(prefix.duration-238.6)<1e-9,{scope:'Same frozen current engine and same explicit story/ambient clocks; separate from legacy shader unit tests.'});
 report.browserErrors=errors;report.httpErrors=httpErrors;check('No browser or HTTP errors',!errors.length&&!httpErrors.length,{errors,httpErrors});
 const contacts=await page.evaluate(async images=>{const c=document.createElement('canvas');c.width=1200;c.height=Math.ceil(images.length/2)*329;const ctx=c.getContext('2d');ctx.fillStyle='#080b15';ctx.fillRect(0,0,c.width,c.height);for(const [i,src]of images.entries()){const image=new Image();image.src=src;await image.decode();ctx.drawImage(image,i%2*600,Math.floor(i/2)*329,600,329);}return c.toDataURL().split(',')[1];},report.samples.filter(s=>/-(exact|start)$/.test(s.file.replace('.png',''))).map(s=>'data:image/png;base64,'+fs.readFileSync(path.join(out,s.file)).toString('base64')));
 fs.writeFileSync(path.join(out,'CONTACT-ACTIONS.png'),Buffer.from(contacts,'base64'));
}catch(error){report.error=String(error.stack??error);check('Execution completed',false,{error:report.error});}finally{
 report.sourceV9.after=Object.fromEntries(Object.keys(oldBefore).map(file=>[file,sha(path.join(root,file))]));report.engine.after=Object.fromEntries(Object.keys(engineBefore).map(file=>[file,sha(path.join(root,file))]));
 check('All 195 v9 dependencies and entry unchanged',Object.keys(oldBefore).every(file=>oldBefore[file]===report.sourceV9.after[file]));check('All 14 runtime files unchanged',Object.keys(engineBefore).every(file=>engineBefore[file]===report.engine.after[file]));
 report.status=report.checks.every(c=>c.ok)?'completed':'failed';save();if(browser)await browser.close();console.log(JSON.stringify({status:report.status,checks:report.checks.length,failed:report.checks.filter(c=>!c.ok).map(c=>c.name),output:out}));if(report.status!=='completed')process.exitCode=1;
}})();
