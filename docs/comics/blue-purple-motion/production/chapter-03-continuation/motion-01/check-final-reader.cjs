const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..');
const url='http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v7.json';
const output=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/qa/final-reader-v1');
if(fs.existsSync(output))throw Error('Nouveau dossier requis.');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
  const original=await page.evaluate(()=>({pages:window.motionComic.pages.length,voices:window.motionComic.tracks.length,duration:window.motionComic.duration}));
  assert.equal(original.pages,21);assert.equal(original.voices,99);
  await page.evaluate(()=>{const p=window.motionComic.pages.find(p=>p.id==='page-18');window.motionComic.seek(p.start+p.segments[2].start+.4);});
  assert.equal(await page.evaluate(()=>window.motionComic.manifest.panels[1].label),'Après le geste');
  await page.screenshot({path:path.join(output,'desktop-page18.png')});
  const jump=226.6+197.21222222222224;
  await page.evaluate(time=>window.motionComic.seek(time),jump);await page.click('#play');await page.waitForTimeout(180);
  const audio=await page.evaluate(()=>({position:window.motionComic.position,...window.motionComic.audioState}));
  assert(audio.musicPlaying);assert(audio.musicPreMixed);assert(Math.abs(audio.musicTime-audio.position)<.2);await page.evaluate(()=>window.motionComic.pause());
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{const p=window.motionComic.pages.at(-1);window.motionComic.seek(p.start+1.5);});await page.waitForTimeout(100);
  await page.screenshot({path:path.join(output,'mobile-page21.png')});
  const music=require('./sound/SELECTION.json').backingFull;
  const endpoint='http://127.0.0.1:50589/'+music;
  const response=await fetch(endpoint,{headers:{Range:'bytes=4096-8191'}});assert.equal(response.status,206);
  const bytes=Buffer.from(await response.arrayBuffer()),source=fs.readFileSync(path.join(root,music));assert.deepEqual(bytes,source.subarray(4096,8192));
  assert.match(response.headers.get('content-type'),/^audio\/wav/);assert.deepEqual(errors,[]);
  const report={status:'completed',url,...original,correctFrenchSceneLabels:true,lateBackingSeekDelta:audio.musicTime-audio.position,musicPlayingAfterGesture:true,premixed:true,range206ExactBytes:true,pageErrors:errors,screenshots:['desktop-page18.png','mobile-page21.png']};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.info(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
