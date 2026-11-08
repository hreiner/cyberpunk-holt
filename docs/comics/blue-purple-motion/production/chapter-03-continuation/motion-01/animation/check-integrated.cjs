/* Verify the real assembled reader without editing its manifests or timings. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../../../../../../..');
const project = path.join(root, 'anime/motion-comics');
const [url, target] = process.argv.slice(2);
if (!url || !target) throw Error('Usage: node check-integrated.cjs URL NEW_OUTPUT_DIRECTORY');
const output = path.resolve(target);
if (fs.existsSync(output)) throw Error('Le dossier de preuve doit être neuf.');
fs.mkdirSync(output, {recursive:true});
const sha = file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'ANIMATION-PLAN.json'),'utf8'));
const report={status:'running',reader:url,startedAt:new Date().toISOString(),
 checkerSha256:sha(__filename),engineHashes:Object.fromEntries(['reader.js','effects.js','layers.js','core.js'].map(f=>[f,sha(path.join(project,f))])),pages:[]};
const write=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
write();
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
  await page.evaluate(()=>{const api=window.motionComic;api.pause();api.setRenderMode(true);api.setEffects(true);});
  const selected=await page.evaluate(()=>window.motionComic.pages);
  for(const selectedPage of selected){
   const n=Number(selectedPage.id.match(/\d+/)?.[0]);if(n<9||n>21)continue;
   await page.evaluate(time=>window.motionComic.seek(time+.00001),selectedPage.start);
   const data=await page.evaluate(()=>window.motionComic.manifest);
   const result=await page.evaluate(async({selectedPage,data})=>{
    const api=window.motionComic,W=api.pageCanvas.width,H=api.pageCanvas.height;
    const pixels=canvas=>canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
    const draw=(story,ambient=story)=>{const global=selectedPage.start+story;api.seek(global);api.draw(global,selectedPage.start+ambient);return pixels(api.pageCanvas);};
    const changed=(a,b,rect=[0,0,1,1],threshold=0)=>{
     const x0=Math.max(0,Math.ceil(rect[0]*W)),y0=Math.max(0,Math.ceil(rect[1]*H));
     const x1=Math.min(W,Math.floor((rect[0]+rect[2])*W)),y1=Math.min(H,Math.floor((rect[1]+rect[3])*H));let count=0;
     for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*W+x)*4;if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]),Math.abs(a[i+3]-b[i+3]))>threshold)count++;
     }return count;
    };
    const asset=async relative=>{const base=new URL(new URLSearchParams(location.search).get('manifest'),location.href);
     const document=api.document,manifestUrl=document.kind==='motion-comic-sequence'?new URL(document.pages[api.pageIndex].manifest,base):base;
     const image=new Image();image.src=new URL(relative,manifestUrl).href;await image.decode();const c=window.document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(image,0,0,W,H);return c;};
    const master=pixels(await asset(data.image));
    const t=Math.min(selectedPage.duration-.01,(data.overviewSeconds??.7)+.5);
    for(let i=0;i<3;i++)draw(t);
    api.setEffects(false);const off=draw(t),offLater=draw(t,999),disabledExactMaster=changed(master,off)===0,disabledStable=changed(off,offLater)===0;
    api.setEffects(true);
    const proofs=[];
    for(const [index,panel] of data.panels.entries()){
     const segment=selectedPage.segments.find(s=>s.panel===index),start=segment.start+(data.transitionSeconds??.8),end=segment.end;
     const effects=(data.effects??[]).filter(f=>f.panelId===panel.id);
     const finite=effects.find(f=>f.clock==='story'&&f.endSeconds!==undefined);
     const storyA=finite?finite.startSeconds+(finite.endSeconds-finite.startSeconds)*.25:Math.min(end-.05,start+.75);
     const storyB=finite?finite.startSeconds+(finite.endSeconds-finite.startSeconds)*.75:storyA;
     let ambientA=storyA+.175,ambientB=finite?ambientA:ambientA+.65,sampleMethod=finite?'finiteStoryEvent':'ordinaryAmbientPair';
     const reflection=effects.find(f=>f.clock!=='story'&&['reflection','neon'].includes(f.type));
     if(reflection&&!finite){
      const frequency=reflection.frequency??.55,period=1/frequency,firstMaximum=(.25-(reflection.phase??0)/(Math.PI*2))/frequency;
      const globalStory=selectedPage.start+storyA,maximum=firstMaximum+Math.ceil((globalStory-firstMaximum)/period)*period;
      ambientA=maximum-selectedPage.start;ambientB=ambientA+period*.5;sampleMethod='explicitReflectionExtremesAtFixedStory';
     }
     for(let i=0;i<3;i++)draw(storyA,ambientA);
     const a=draw(storyA,ambientA),artA=pixels(api.artCanvas??api.pageCanvas),afterEffects=pixels(window.motionEffects.render.canvas);
     const protectedRegions=(data.protectedRegions??[]).map(r=>({id:r.id,alteredFromCurrentArt:api.artCanvas?changed(artA,afterEffects,r.rect):null}));
     const letterCanvas=window.document.createElement('canvas');letterCanvas.width=W;letterCanvas.height=H;
     if(api.activeLetteringImage)letterCanvas.getContext('2d').drawImage(api.activeLetteringImage,0,0,W,H);
     const letters=pixels(letterCanvas);
     const panelX=Math.floor(panel.rect[0]*W),panelY=Math.floor(panel.rect[1]*H),panelW=Math.ceil(panel.rect[2]*W),panelH=Math.ceil(panel.rect[3]*H);
     const cellW=640,cellH=Math.round(panelH/panelW*cellW),sheet=window.document.createElement('canvas');sheet.width=cellW*2;sheet.height=cellH+48;
     const sheetCtx=sheet.getContext('2d');sheetCtx.fillStyle='#070b15';sheetCtx.fillRect(0,0,sheet.width,sheet.height);
     sheetCtx.fillStyle='#e6f7ff';sheetCtx.font='16px sans-serif';sheetCtx.fillText(`${panel.id} · récit ${storyA.toFixed(3)} s · phase ${ambientA.toFixed(3)}`,8,25);
     sheetCtx.drawImage(api.pageCanvas,panelX,panelY,panelW,panelH,0,48,cellW,cellH);
     const b=draw(storyB,ambientB);sheetCtx.fillStyle='#e6f7ff';sheetCtx.fillText(`${panel.id} · récit ${storyB.toFixed(3)} s · phase ${ambientB.toFixed(3)}`,cellW+8,25);
     sheetCtx.drawImage(api.pageCanvas,panelX,panelY,panelW,panelH,cellW,48,cellW,cellH);
     const again=draw(storyB,ambientB),deterministic=changed(b,again)===0;
     draw(Math.max(0,start-.1),.1);const reverseSeek=draw(storyB,ambientB),seekOrderIndependent=changed(b,reverseSeek)===0;
     const change=changed(a,b,panel.rect,10),rigidStable=(data.protectedRegions??[]).map(r=>({id:r.id,changed:changed(a,b,r.rect)}));
     let opaqueLetterPixels=0,opaqueLetterChanged=0;
     for(let i=0;i<letters.length;i+=4)if(letters[i+3]===255){opaqueLetterPixels++;if([0,1,2,3].some(c=>a[i+c]!==b[i+c]))opaqueLetterChanged++;}
     const proof={panelId:panel.id,effectTypes:effects.map(f=>f.type),intentionalStill:effects.length===0,sampleMethod,storyTimes:[storyA,storyB],ambientTimes:[ambientA,ambientB],changedOver10:change,
      deterministic,seekOrderIndependent,protectedRegions,rigidStable,opaqueLetterPixels,opaqueLetterChanged,
      passed:deterministic&&seekOrderIndependent&&protectedRegions.every(r=>r.alteredFromCurrentArt===null||r.alteredFromCurrentArt===0)&&rigidStable.every(r=>r.changed===0)&&opaqueLetterChanged===0&&(effects.length===0||change>0),
      proof:sheet.toDataURL('image/png').split(',')[1]};
     proofs.push(proof);
    }
    const eventTests=[];
    for(const [index,fx] of (data.effects??[]).entries()){
     if(fx.clock!=='story'||fx.endSeconds===undefined)continue;
     const at=fx.startSeconds+(fx.endSeconds-fx.startSeconds)*.5;draw(at,at);
     const input=window.document.createElement('canvas');input.width=W;input.height=H;input.getContext('2d').drawImage(api.artCanvas??api.pageCanvas,0,0);
     const direct=(story,ambient=1)=>pixels(window.motionEffects.render(input,[fx],ambient,true,data.protectedRegions,story));
     for(let warm=0;warm<3;warm++)direct(at);
     const original=pixels(input),before=direct(fx.startSeconds-.001),during=direct(at),duringLater=direct(at,999),after=direct(fx.endSeconds+.001);
     const item={effectIndex:index,panelId:fx.panelId,type:fx.type,start:fx.startSeconds,end:fx.endSeconds,
      beforeExact:changed(original,before)===0,afterExact:changed(original,after)===0,pausedStoryExact:changed(during,duringLater)===0,duringChanged:changed(original,during,fx.rect,10)};
     item.passed=item.beforeExact&&item.afterExact&&item.pausedStoryExact&&item.duringChanged>0;eventTests.push(item);
    }
    return {pageId:selectedPage.id,width:W,height:H,disabledExactMaster,disabledStable,panels:proofs,eventTests};
   },{selectedPage,data});
   for(const p of result.panels){const stem=p.panelId.replace(/[^a-zA-Z0-9_-]/g,'_');fs.writeFileSync(path.join(output,stem+'-pair.png'),Buffer.from(p.proof,'base64'));delete p.proof;p.proofFile=stem+'-pair.png';}
   result.manifestSignature=crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');report.pages.push(result);write();
   console.log(`${result.pageId}: ${result.panels.length} cases; ${result.panels.filter(p=>p.passed).length} contrôles réussis.`);
  }
  report.sourcePreservation=Object.entries(plan.sourceHashes).map(([file,digest])=>({file,unchanged:sha(path.join(root,file))===digest}));
  report.browserErrors=errors;report.completedAt=new Date().toISOString();
  report.status=report.pages.length===13&&errors.length===0&&report.sourcePreservation.every(p=>p.unchanged)&&report.pages.every(p=>p.disabledExactMaster&&p.disabledStable&&p.panels.every(s=>s.passed)&&p.eventTests.every(e=>e.passed))?'completed':'failed';write();
  if(report.status!=='completed')throw Error('Contrôle intégré incomplet ou défaut ; consulter report.json, sans abaisser les seuils.');
 }catch(error){report.status='failed';report.error=String(error.stack??error);write();throw error;}
 finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
