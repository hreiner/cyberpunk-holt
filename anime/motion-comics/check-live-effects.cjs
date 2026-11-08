const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {newDirectory}=require('./project.cjs');
(async()=>{
 if(!process.argv[2]||!process.argv[3])throw Error('Usage : node check-live-effects.cjs URL NOUVEAU_DOSSIER');
 const out=newDirectory(process.argv[3]);
 const browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage();await page.goto(process.argv[2]);
  await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
  const settings=await page.evaluate(()=>({sampleTime:window.motionComic.manifest.review?.sampleTime??window.motionComic.duration/2,minimumChangedPixels:window.motionComic.manifest.review?.minimumLiveChangedPixels??(window.motionComic.manifest.effects?.length?1:0)}));
  const snapshot=()=>page.evaluate(()=>({position:window.motionComic.position,effectTime:window.motionComic.effectTime,playing:window.motionComic.playing}));
  await page.evaluate(t=>{window.motionComic.setEffects(true);window.motionComic.seek(t);},settings.sampleTime);
  await page.evaluate(()=>{window.idleFirst=document.querySelector('#screen').getContext('2d').getImageData(0,0,1280,720).data;});
  const before=await snapshot();await page.waitForTimeout(800);const after=await snapshot();
  assert.equal(before.playing,false);assert.equal(after.playing,false);assert.equal(before.position,after.position);
  assert(after.effectTime-before.effectTime>.25,'Le temps des effets doit avancer même en pause.');
  const {changed,maxDifference}=await page.evaluate(()=>{
    const before=window.idleFirst,after=document.querySelector('#screen').getContext('2d').getImageData(0,0,1280,720).data;
    let changed=0,maxDifference=0;
    for(let i=0;i<before.length;i+=4){const diff=Math.max(...[0,1,2].map(k=>Math.abs(before[i+k]-after[i+k])));if(diff>15)changed++;maxDifference=Math.max(maxDifference,diff);}
    return {changed,maxDifference};
  });
  assert(changed>=settings.minimumChangedPixels,'Le mouvement doit atteindre le seuil configuré pour cette scène.');
  await page.locator('#screen').screenshot({path:path.join(out,'live-hair.png')});
  await page.click('#effects');await page.evaluate(()=>{window.idleOff=document.querySelector('#screen').toDataURL();});await page.waitForTimeout(400);
  assert(await page.evaluate(()=>window.idleOff===document.querySelector('#screen').toDataURL()),'Le bouton doit figer les effets.');
  await page.click('#effects');await page.click('#play');await page.waitForTimeout(650);await page.click('#play');
  const playback=await snapshot();assert(playback.position>Math.min(settings.sampleTime+.25,await page.evaluate(()=>window.motionComic.duration)-.01),'La lecture doit continuer avec les effets actifs.');
  const result={idleTimelineStable:true,idleEffectsElapsed:after.effectTime-before.effectTime,changedPixelsOver15:changed,maxDifference,disabledStable:true,playbackPosition:playback.position};
  fs.writeFileSync(path.join(out,'live-report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
