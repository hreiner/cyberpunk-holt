const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page = await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1});
  await page.goto(pathToFileURL(path.resolve('art-masters/motion-comics/blue-purple/chapter-03-continuation/review-v1/index.html')).href);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  const info=await page.evaluate(()=>({pages:document.querySelectorAll('.page').length, images:[...document.images].map(i=>({ok:i.complete&&i.naturalWidth>0,src:i.getAttribute('src')})), dialogues:document.querySelectorAll('.speech').length, map:document.querySelectorAll('.map').length, bodyWidth:document.body.scrollWidth, windowWidth:innerWidth}));
  await page.screenshot({path:'art-masters/motion-comics/blue-purple/chapter-03-continuation/review-v1/desktop.png'});
  await page.setViewportSize({width:390,height:844}); await page.screenshot({path:'art-masters/motion-comics/blue-purple/chapter-03-continuation/review-v1/mobile.png'});
  const mobile=await page.evaluate(()=>({bodyWidth:document.body.scrollWidth,windowWidth:innerWidth}));
  console.log(JSON.stringify({pages:info.pages,images:info.images.length,broken:info.images.filter(i=>!i.ok),dialogues:info.dialogues,map:info.map,desktop:info.bodyWidth===info.windowWidth,mobile},null,2)); await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
