const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const [url,output]=process.argv.slice(2);
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{
 const page=await browser.newPage(),parsed=new URL(url),manifest=new URLSearchParams(parsed.search).get('manifest');
 await page.route('**/reader.html',async route=>{const response=await route.fetch(),body=(await response.text()).replace('<html lang="fr">',`<html lang="fr" data-manifest="${manifest}">`);await route.fulfill({response,body});});
 parsed.search='';await page.goto(parsed.href);await page.waitForFunction(()=>window.motionComic?.duration>0&&document.querySelector('#reader').dataset.ready==='true');
 const result=await page.evaluate(()=>({status:'completed',mode:motionComic.loadingState.mode,duration:motionComic.duration,label:document.querySelector('#page-label').textContent,dataset:document.documentElement.dataset.manifest,query:location.search}));
 assert.equal(result.mode,'progressive');assert.equal(result.duration,584.3);assert.equal(result.label,'Couverture');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify(result));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
