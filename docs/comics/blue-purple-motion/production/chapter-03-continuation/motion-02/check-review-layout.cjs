/* global setTimeout */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..');
const out=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/review-layout-v2');
fs.mkdirSync(out,{recursive:false});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const report={reviewFile:'ANIMATION-REVIEW-v2.html',views:[],errors};
  await page.goto(pathToFileURL(path.join(__dirname,'ANIMATION-REVIEW-v2.html')).href);
  await page.locator('img').evaluateAll(images=>{images.forEach(image=>{image.loading='eager';});return Promise.race([Promise.all(images.map(image=>image.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Décodage des planches trop long.')),30000))]);});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('section').count(),13);assert.equal(await page.locator('tbody tr').count(),46);
  for(const [name,width,height] of [['review-desktop',1600,1000],['review-mobile',390,844]]){
   await page.setViewportSize({width,height});
   const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,loaded:[...document.images].every(i=>i.complete&&i.naturalWidth>0)}));
   assert(layout.loaded);assert(layout.scrollWidth<=layout.width);await page.screenshot({path:path.join(out,name+'.png')});report.views.push({name,width,height,...layout});
  }
  await page.setViewportSize({width:1600,height:1000});
  await page.goto('http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v9.json');
  await page.waitForFunction(()=>window.motionComic?.duration>450&&!document.querySelector('#play').disabled);
  const state=await page.evaluate(()=>({label:document.querySelector('#page-label').textContent,entries:window.motionComic.pages.length,position:window.motionComic.position,duration:window.motionComic.duration}));
  assert.equal(state.label,'Couverture');assert.equal(state.entries,22);
  await page.screenshot({path:path.join(out,'reader-cover.png')});report.cover=state;assert.equal(errors.length,0);
  report.files=fs.readdirSync(out).filter(f=>f.endsWith('.png')).map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex')}));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});console.info(JSON.stringify({...report,files:report.files.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
