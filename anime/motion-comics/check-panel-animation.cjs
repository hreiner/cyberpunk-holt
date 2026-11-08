/* Check visible ambient motion inside each fully framed panel; optional paired visual proofs. */
const { chromium }=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {newDirectory,localFile}=require('./project.cjs');
(async()=>{
 if(!process.argv[2]||!process.argv[3])throw Error('Usage : node check-panel-animation.cjs URL NOUVEAU_DOSSIER [--stills] [--panel IDENTIFIANT] [--motion-proof RAPPORT_JSON] [--ambient-offset SECONDES]');
 const filterIndex=process.argv.indexOf('--panel'),panelFilter=filterIndex<0?null:process.argv[filterIndex+1];if(filterIndex>=0&&(!panelFilter||panelFilter.startsWith('--')))throw Error('Identifiant de case requis apr'+String.fromCharCode(232)+'s --panel.');
 const proofIndex=process.argv.indexOf('--motion-proof'),proofArgument=proofIndex<0?null:process.argv[proofIndex+1];
 if(proofIndex>=0&&(!proofArgument||proofArgument.startsWith('--')))throw Error('Rapport JSON requis après --motion-proof.');
 const ambientIndex=process.argv.indexOf('--ambient-offset'),ambientOffsetSeconds=ambientIndex<0?0:Number(process.argv[ambientIndex+1]);
 if(!Number.isFinite(ambientOffsetSeconds)||ambientOffsetSeconds<0||ambientOffsetSeconds>10)throw Error('Décalage ambiant attendu entre 0 et 10 secondes ; le récit reste figé.');
 const motionProofFile=proofArgument?localFile(path.resolve(proofArgument)):null,motionProof=motionProofFile?JSON.parse(fs.readFileSync(motionProofFile,'utf8')):null;
 if(motionProof&&(motionProof.status!=='completed'||motionProof.synthetic!==false||!Array.isArray(motionProof.layers)||!motionProof.layers.length||motionProof.layers.some(layer=>!layer.passed)))throw Error('La preuve doit être un contrôle de vrais calques terminé et réussi, sans fixture synthétique.');
 if(motionProof)for(const file of ['layers.js','core.js']){
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex');
  assert.equal(motionProof.engineHashes?.[file],hash,`La preuve doit porter sur la version exacte de ${file}.`);
 }
 const checkerSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'check-panel-animation.cjs'))).digest('hex');
 const output=newDirectory(process.argv[3]),report={status:'running',startedAt:new Date().toISOString(),reader:process.argv[2],checkerSha256,panels:[],pairSheets:[],panelFilter,motionProofFile,ambientOffsetSeconds};
 const write=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));write();
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.argv[2]);await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
  await page.evaluate(()=>{window.motionComic.setRenderMode(true);window.motionComic.setEffects(true);});
  const selection=await page.evaluate(()=>({title:window.motionComic.document.title,pages:window.motionComic.pages}));report.title=selection.title;
  for(const selected of selection.pages){
   await page.evaluate(t=>window.motionComic.seek(t),selected.start);
   const manifest=await page.evaluate(()=>{window.motionPanelPairs=[];return window.motionComic.manifest;});
   const panelReviews=manifest.review?.perPanelReview??manifest.perPanelReview??[];
   for(const [index,panel] of manifest.panels.entries()){
    if(panelFilter&&panel.id!==panelFilter)continue;
    const authoredLayers=(manifest.motionLayers??[]).filter(layer=>layer.panelId===panel.id);
    if(authoredLayers.length){
     assert(motionProof,`${panel.id} : l’action narrative est figée en pause ; fournir --motion-proof après le contrôle de ses vraies poses.`);
     const proofs=[];
     for(const layer of authoredLayers){
      const signature=crypto.createHash('sha256').update(JSON.stringify(layer)).digest('hex');
      const proof=motionProof.layers.find(item=>item.id===layer.id&&item.panelId===panel.id&&item.configSignature===signature&&item.passed);
      assert(proof,`${panel.id} : aucune preuve réussie ne correspond à cette version exacte du calque ${layer.id}.`);
      assert(proof.assetDigests&&Object.keys(proof.assetDigests).length,`${panel.id} : empreintes des médias absentes de la preuve.`);
      const actualDigests=await page.evaluate(async paths=>{
       const api=window.motionComic,root=new URL(new window.URLSearchParams(window.location.search).get('manifest'),window.location.href),document=api.document;
       const manifestUrl=document.kind==='motion-comic-sequence'?new URL(document.pages[api.pageIndex].manifest,root):root;
       return Object.fromEntries(await Promise.all(paths.map(async path=>{
        const response=await window.fetch(new URL(path,manifestUrl));if(!response.ok)throw Error('Média du calque inaccessible pour empreinte.');
        const digest=await window.crypto.subtle.digest('SHA-256',await response.arrayBuffer());
        return[path,Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')];
       })));
      },Object.keys(proof.assetDigests));
      assert.deepEqual(actualDigests,proof.assetDigests,`${panel.id} : les médias ont changé depuis la preuve de mouvement.`);
      proofs.push({layerId:layer.id,configSignature:signature,assetDigests:actualDigests,changedFirstLastPixels:proof.changedFirstLastPixels,proofFile:proof.proofFile,pauseExact:proof.pauseExact,finalStateHeld:proof.finalStateHeld,disabledExactMaster:proof.disabledExactMaster});
     }
     report.panels.push({pageId:selected.id,panelId:panel.id,proofType:'narrative-motion',ambientMotionRequired:false,narrativeProofs:proofs,passed:true});write();
     console.log(`${panel.id} : mouvement narratif validé par ${proofs.length} calque(s) exact(s), pause physique figée.`);continue;
    }
    const segment=selected.segments.find(item=>item.panel===index),transition=manifest.transitionSeconds??.8;
    const review=panelReviews.find(item=>item.panelId===panel.id)??{},first=segment.start+transition,last=segment.end;
    const sample=review.sampleTime??first+(last-first)*.45,delta=review.deltaSeconds??.65,minimum=review.minimumChangedPixels??250;
    assert(sample>=first&&sample<last,`${panel.id} : le temps de revue doit cadrer la case après sa transition.`);
    const time=selected.start+sample;
    const result=await page.evaluate(({time,delta,captureProofs,ambientOffset})=>{
     const api=window.motionComic,canvas=document.querySelector('#screen'),context=canvas.getContext('2d');
     api.seek(time);api.draw(time,time+ambientOffset);const state=api.frameState,[x,y,w,h]=state.screenRect,view=state.view;
     const left=Math.max(0,Math.ceil(view.x),Math.ceil(x)),top=Math.max(0,Math.ceil(view.y),Math.ceil(y)),right=Math.min(canvas.width,Math.floor(view.x+view.w),Math.floor(x+w)),bottom=Math.min(canvas.height,Math.floor(view.y+view.h),Math.floor(y+h));
     const rect=[left,top,right-left,bottom-top];if(rect[2]<=0||rect[3]<=0)throw Error('La case ne possède aucun pixel visible.');
     const pixels=()=>context.getImageData(...rect).data;
     // Warm the readback path before comparing GPU/CPU canvas pixels.
     for(let warmup=0;warmup<3;warmup++){api.draw(time,time+ambientOffset);pixels();}
     const capture=()=>{const image=document.createElement('canvas');image.width=rect[2];image.height=rect[3];image.getContext('2d').drawImage(canvas,...rect,0,0,rect[2],rect[3]);return image;};
     const first=pixels(),phaseA=captureProofs?capture():null;api.draw(time,time+ambientOffset+delta);const second=pixels(),phaseB=captureProofs?capture():null;
     if(captureProofs)window.motionPanelPairs.push({panelId:state.panelId,storyTime:state.storyTime,delta,phaseA,phaseB});
     let changed=0,maxDifference=0,totalChangedDifference=0;
     for(let i=0;i<first.length;i+=4){const difference=Math.max(Math.abs(first[i]-second[i]),Math.abs(first[i+1]-second[i+1]),Math.abs(first[i+2]-second[i+2]));maxDifference=Math.max(maxDifference,difference);if(difference>15){changed++;totalChangedDifference+=difference;}}
     api.draw(time,time+ambientOffset+delta);const repeated=pixels();const deterministic=repeated.every((value,i)=>value===second[i]);
     api.setEffects(false);api.draw(time,time+ambientOffset);const stopped=pixels();api.draw(time,time+ambientOffset+delta);const stoppedLater=pixels();const disabledStable=stoppedLater.every((value,i)=>value===stopped[i]);api.setEffects(true);api.draw(time,time+ambientOffset+delta);
     return {proof:captureProofs?{a:phaseA.toDataURL('image/png').split(',')[1],b:phaseB.toDataURL('image/png').split(',')[1]}:null,screenRect:rect,storyTime:state.storyTime,transitionBlend:state.transitionBlend,changedPixelsOver15:changed,visiblePixels:rect[2]*rect[3],changedFraction:changed/(rect[2]*rect[3]),meanChangedDifference:changed?totalChangedDifference/changed:0,maxDifference,deterministic,disabledStable};
    },{time,delta,captureProofs:process.argv.includes('--stills'),ambientOffset:ambientOffsetSeconds});
    if(result.proof){const stem=`page-${selected.index+1}-panel-${index+1}-${panel.id.replace(/[^a-zA-Z0-9_-]/g,'_')}`,phaseA=`${stem}-phase-a.png`,phaseB=`${stem}-phase-b.png`;fs.writeFileSync(path.join(output,phaseA),Buffer.from(result.proof.a,'base64'),{flag:'wx'});fs.writeFileSync(path.join(output,phaseB),Buffer.from(result.proof.b,'base64'),{flag:'wx'});result.pairedProofs={phaseA,phaseB};}delete result.proof;
    const passed=result.changedPixelsOver15>=minimum&&result.deterministic&&result.disabledStable&&result.transitionBlend===1;
    report.panels.push({pageId:selected.id,panelId:panel.id,sampleTime:sample,globalTime:time,ambientSampleTimes:[time+ambientOffsetSeconds,time+ambientOffsetSeconds+delta],deltaSeconds:delta,minimumChangedPixels:minimum,...result,passed});write();
    console.log(`${panel.id} : ${result.changedPixelsOver15} pixels > 15, seuil ${minimum}, ${passed?'réussi':'échec'}`);
    if(process.argv.includes('--stills')){
     const name={'p02-c02':'franklyn-colere.png','p03-c02':'franklyn-choc.png','p03-c03':'vision-minimap.png'}[panel.id];
     if(name){await page.locator('#screen').screenshot({path:path.join(output,name)});if(panel.id==='p03-c03'){await page.evaluate(t=>{window.motionComic.seek(t);window.motionComic.draw(t,t);},selected.start+first+.1);await page.locator('#screen').screenshot({path:path.join(output,'vision-fragments.png')});}}
    }
   }
   const pairedPanelCount=await page.evaluate(()=>window.motionPanelPairs.length);
   if(process.argv.includes('--stills')&&pairedPanelCount>0){
    const sheet=await page.evaluate(pageId=>{const pairs=window.motionPanelPairs,canvas=document.createElement('canvas');canvas.width=1280;canvas.height=64+pairs.length*280;const context=canvas.getContext('2d');context.fillStyle='#080b18';context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle='#edf7ff';context.font='22px system-ui';context.fillText(`${pageId} \u00b7 m\u00eame r\u00e9cit, deux phases ambiantes`,20,36);for(const [index,pair]of pairs.entries()){const top=64+index*280;for(const [column,image]of [pair.phaseA,pair.phaseB].entries()){const left=column*640;context.fillStyle='#a8dfe8';context.font='16px system-ui';context.fillText(`${pair.panelId} \u00b7 r\u00e9cit ${pair.storyTime.toFixed(2)} s \u00b7 phase ${column?'B + '+pair.delta+' s':'A'}`,left+12,top+20);const scale=Math.min(616/image.width,244/image.height);context.drawImage(image,left+12+(616-image.width*scale)/2,top+28+(244-image.height*scale)/2,image.width*scale,image.height*scale);}}return canvas.toDataURL('image/png').split(',')[1];},selected.id);
    const sheetFile=`page-${String(selected.index+1).padStart(2,'0')}-animation-pairs.png`;fs.writeFileSync(path.join(output,sheetFile),Buffer.from(sheet,'base64'),{flag:'wx'});report.pairSheets.push({pageId:selected.id,file:sheetFile,rows:pairedPanelCount,columns:2});write();
   }
  }
  assert.deepEqual(errors,[]);assert(report.panels.length>0,'Aucune case ne correspond au filtre.');Object.assign(report,{status:report.panels.every(panel=>panel.passed)?'completed':'failed',finishedAt:new Date().toISOString(),panelCount:report.panels.length,visiblePanelCount:report.panels.filter(panel=>panel.passed).length,pageErrors:errors});write();if(report.status==='failed')process.exitCode=1;console.log(JSON.stringify({status:report.status,panelCount:report.panelCount,visiblePanelCount:report.visiblePanelCount}));
 }catch(error){Object.assign(report,{status:'failed',finishedAt:new Date().toISOString(),error:error.message});write();throw error;}
 finally{if(browser)await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
