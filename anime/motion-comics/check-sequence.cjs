/* Browser contract check for a selected sequence, without provider calls. */
const { chromium }=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {newDirectory}=require('./project.cjs');
(async()=>{
 if(!process.argv[2]||!process.argv[3])throw Error('Usage : node check-sequence.cjs URL NOUVEAU_DOSSIER');
 const output=newDirectory(process.argv[3]);
 const browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext();const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.argv[2]);await page.waitForFunction(()=>window.motionComic?.pages.length>=2&&!document.querySelector('#play').disabled);
  const selected=await page.evaluate(()=>({pages:window.motionComic.pages,duration:window.motionComic.duration,tracks:window.motionComic.tracks}));
  assert.equal(await page.evaluate(()=>window.motionComic.audioState.musicPlaying),false,'Le fond attend une action du lecteur.');
  for(let i=1;i<selected.pages.length;i++){await page.click('#next-page');assert.equal(await page.evaluate(()=>window.motionComic.pageIndex),i);assert.equal(await page.evaluate(()=>window.motionComic.position),selected.pages[i].start);}
  for(let i=selected.pages.length-2;i>=0;i--){await page.click('#previous-page');assert.equal(await page.evaluate(()=>window.motionComic.pageIndex),i);}
  await page.click('#next');assert.equal(await page.evaluate(()=>window.motionComic.segments.find(s=>s.page===0&&s.panel===0).start<window.motionComic.position),true);
  const firstVoice=selected.tracks[0];
  if(firstVoice){await page.evaluate(t=>window.motionComic.seek(t),firstVoice.start+.02);await page.click('#play');await page.waitForTimeout(120);await page.click('#play');const paused=await page.evaluate(()=>({position:window.motionComic.position,audio:window.motionComic.audioState}));assert.equal(paused.audio.voices.length,0);assert.equal(paused.audio.musicPlaying,false);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.motionComic.position),paused.position);}
  for(const next of selected.pages.slice(1)){await page.evaluate(t=>window.motionComic.seek(t),next.start-.12);await page.click('#play');await page.waitForFunction(index=>window.motionComic.pageIndex===index,next.index);await page.click('#play');const state=await page.evaluate(()=>({index:window.motionComic.pageIndex,audio:window.motionComic.audioState}));assert.equal(state.index,next.index);assert.equal(state.audio.voices.length,0);assert.equal(state.audio.musicPlaying,false);}
  await page.evaluate(()=>window.motionComic.seek(window.motionComic.duration));await page.click('#next');assert.equal(await page.evaluate(()=>window.motionComic.pageIndex),selected.pages.length-1);await page.evaluate(()=>window.motionComic.seek(0));await page.click('#previous');assert.equal(await page.evaluate(()=>window.motionComic.pageIndex),0);await page.evaluate(t=>{const render=window.motionEffects.render;window.renderClockCalls=[];window.motionEffects.render=function(...args){window.renderClockCalls.push({ambient:args[2],story:args[5]});return render.apply(this,args);};window.motionComic.seek(t);window.motionComic.setEffects(true);},selected.pages[1].start+.1);const idle=await page.evaluate(()=>({position:window.motionComic.position,effectTime:window.motionComic.effectTime}));await page.waitForTimeout(300);const live=await page.evaluate(()=>({position:window.motionComic.position,effectTime:window.motionComic.effectTime}));assert.equal(live.position,idle.position);assert(live.effectTime>idle.effectTime+.1);const clocks=await page.evaluate(()=>window.renderClockCalls);assert(clocks.length>=2);for(const clock of clocks)assert(Math.abs(clock.story-(idle.position-selected.pages[1].start))<1e-9,'Le récit reste au temps local de la page pendant la pause.');assert(clocks.at(-1).ambient>clocks[0].ambient,'La phase ambiante avance indépendamment du récit.');
  await page.click('#effects');await page.evaluate(()=>window.stoppedFrame=document.querySelector('#screen').toDataURL());await page.waitForTimeout(180);assert(await page.evaluate(()=>window.stoppedFrame===document.querySelector('#screen').toDataURL()));
  const reduced=await browser.newContext({reducedMotion:'reduce'}),reducedPage=await reduced.newPage();await reducedPage.goto(process.argv[2]);await reducedPage.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);assert.equal(await reducedPage.evaluate(()=>window.motionComic.effectsEnabled),false);await reduced.close();
  assert.deepEqual(errors,[]);const report={status:'completed',pages:selected.pages.length,duration:selected.duration,voices:selected.tracks.length,pageButtons:true,panelNavigation:true,automaticPageChanges:true,pausedAudioStopped:true,idleTimelineStable:true,idleEffectsAdvance:true,localStoryTimeFrozenInPause:true,effectsStop:true,reducedMotion:true,pageErrors:errors};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
