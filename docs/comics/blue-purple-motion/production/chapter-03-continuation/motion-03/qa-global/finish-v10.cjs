/* Supplement the preserved first run: responsive visibility and genuinely paused UI clocks. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'../../../../../../..');
const [url,sourceReport,output]=process.argv.slice(2),out=path.resolve(output);assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const previous=JSON.parse(fs.readFileSync(sourceReport)),selection=JSON.parse(fs.readFileSync(path.join(__dirname,'../SELECTION.json')));
const invalidMobile=previous.checks.some(c=>c.name==='ui-mobile-door fits viewport'&&!c.ok);
const report={status:'running',url,firstRun:{file:sourceReport,sha256:sha(sourceReport),status:previous.status,keptChecks:invalidMobile?previous.checks.filter(c=>c.name!=='ui-mobile-door fits viewport'):previous.checks,invalidAssertion:invalidMobile?{name:'ui-mobile-door fits viewport',reason:'The original selector included responsive display:none previous-page/next-page buttons. The original screenshot and measurements are retained. Recheck only visible controls; no viewport tolerance changed.'}:null},checks:[],livePause:[],ui:[]};
const check=(name,ok,data={})=>report.checks.push({name,ok,...data});const save=()=>fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');save();
check('All317 selected dependencies match the frozen selection',selection.files.length===317&&selection.files.every(item=>sha(path.join(root,item.file))===item.sha256));
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.motionComic?.duration>0&&document.querySelector('#reader').dataset.ready==='true',null,{timeout:60000});
 const inspect=async(panelId,filename)=>{
  const result=await page.evaluate(panelId=>{
   const api=window.motionComic;api.draw(api.position,api.effectTime);const W=api.pageCanvas.width,H=api.pageCanvas.height,data=api.manifest;
   const pixels=api.artCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;let hash=2166136261;for(const v of pixels)hash=Math.imul(hash^v,16777619);
   const c=document.createElement('canvas');c.width=1000;c.height=548;const ctx=c.getContext('2d'),panel=data.panels.find(p=>p.id===panelId);ctx.fillStyle='#080b15';ctx.fillRect(0,0,1000,548);ctx.fillStyle='#e8f9ff';ctx.font='18px Arial';ctx.fillText(`Pause réelle · ${panelId} · récit ${api.position.toFixed(6)} · ambiance ${api.effectTime.toFixed(6)} s`,12,29);ctx.drawImage(api.pageCanvas,...panel.rect.map((v,i)=>v*(i%2?H:W)),0,52,1000,496);
   return {position:api.position,effectTime:api.effectTime,playing:api.playing,artHash:hash>>>0,layers:data.motionLayers.map(l=>({id:l.id,...window.motionLayers.sample(l,api.frameState.storyTime)})),png:c.toDataURL().split(',')[1]};
  },panelId);fs.writeFileSync(path.join(out,filename),Buffer.from(result.png,'base64'));delete result.png;return result;
 };
 for(const [id,time,panelId]of [['capsule',427.3,'p15-c03'],['water',550.55,'p20-c03'],['door',562.4,'p21-c01']]){
  await page.evaluate(time=>{const api=window.motionComic;api.setRenderMode(false);api.pause();api.seek(time);},time);await page.waitForTimeout(80);
  const first=await inspect(panelId,`pause-${id}-before.png`);await page.waitForTimeout(420);const second=await inspect(panelId,`pause-${id}-after.png`);
  const result={id,first,second};report.livePause.push(result);check('Real paused reader keeps '+id+' pose while ambience advances',!first.playing&&!second.playing&&first.position===second.position&&second.effectTime>first.effectTime+.25&&first.artHash===second.artHash&&JSON.stringify(first.layers)===JSON.stringify(second.layers),result);save();
 }
 for(const [name,width,height,time]of [['desktop',1440,1000,438.7],['mobile',390,844,562.4],['landscape',844,390,468.6]]){
  await page.setViewportSize({width,height});await page.evaluate(time=>{const a=window.motionComic;a.pause();a.seek(time);},time);await page.waitForTimeout(120);
  const layout=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],buttons:[...document.querySelectorAll('.transport button,#pages-toggle')].map(b=>{const r=b.getBoundingClientRect();return {id:b.id,display:getComputedStyle(b).display,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};})}));
  await page.screenshot({path:path.join(out,`ui-${name}.png`)});report.ui.push({name,...layout});const visible=layout.buttons.filter(b=>b.display!=='none');check(name+' visible controls fit viewport',layout.scroll[0]<=width+1&&visible.length>=7&&visible.every(b=>b.width>0&&b.height>0&&b.x>=-1&&b.right<=width+1&&b.y>=-1&&b.bottom<=height+1),layout);save();
 }
 await page.evaluate(()=>{const a=window.motionComic;a.setRenderMode(true);a.pause();a.seek(584.3);});
 const off=await page.evaluate(async()=>{
  const api=window.motionComic,data=api.manifest,base=new URL(new URLSearchParams(location.search).get('manifest'),location.href),manifestUrl=new URL(api.document.pages[api.pageIndex].manifest,base);const image=new Image();image.src=new URL(data.image,manifestUrl);await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const expected=ctx.getImageData(0,0,c.width,c.height).data;api.setEffects(false);for(let i=0;i<3;i++){api.draw(584.3,1);api.pageCanvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height);}const actual=api.pageCanvas.getContext('2d').getImageData(0,0,c.width,c.height).data;let changed=0;for(let i=0;i<expected.length;i+=4)if([0,1,2,3].some(k=>actual[i+k]!==expected[i+k]))changed++;api.setEffects(true);api.seek(0);return {changedPixels:changed,page:api.pageIndex,position:api.position};
 });check('OFF final master exact and seek back to zero',off.changedPixels===0&&off.position===0&&off.page===0,off);
 report.browserErrors=errors;check('No supplemental browser errors',errors.length===0);
}catch(error){report.error=String(error.stack??error);check('Supplement completed',false,{error:report.error});}finally{
 const old=previous.sourceV9.before;report.sourceV9After=Object.fromEntries(Object.keys(old).map(file=>[file,sha(path.join(root,file))]));report.engineAfter=Object.fromEntries(selection.engine.map(item=>[item.file,sha(path.join(root,item.file))]));
 check('Frozen v9 source entry and all195 dependencies still exact',Object.keys(old).every(file=>old[file]===report.sourceV9After[file]));check('All14 frozen engine files still exact',selection.engine.every(item=>report.engineAfter[item.file]===item.sha256));
 report.status=[...report.firstRun.keptChecks,...report.checks].every(c=>c.ok)?'completed':'failed';save();if(browser)await browser.close();console.log(JSON.stringify({status:report.status,checks:report.firstRun.keptChecks.length+report.checks.length,failures:report.checks.filter(c=>!c.ok).map(c=>c.name),out}));if(report.status!=='completed')process.exitCode=1;
}})();
