const fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v8.json');await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
const result=await page.evaluate(()=>{
 const api=window.motionComic;api.pause();api.setRenderMode(true);api.setEffects(true);const selected=api.pages[15];
 const pixels=canvas=>canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height).data;
 const draw=(story,ambient=2.205)=>{const time=selected.start+story;api.seek(time);api.draw(time,selected.start+ambient);return {composite:pixels(api.pageCanvas),art:pixels(api.artCanvas),effects:pixels(window.motionEffects.render.canvas)};};
 const diff=(a,b)=>{let changed=0,max=0;for(let i=0;i<a.length;i+=4){let d=0;for(let k=0;k<4;k++)d=Math.max(d,Math.abs(a[i+k]-b[i+k]));if(d)changed++;max=Math.max(max,d);}return {changed,max};};
 const rows=[];for(let i=0;i<12;i++){draw(2.03);const a=draw(3.13);draw(.83,.1);const b=draw(3.13);rows.push({iteration:i,composite:diff(a.composite,b.composite),art:diff(a.art,b.art),effects:diff(a.effects,b.effects)});}
 return {page:16,story:3.13,ambient:2.205,rows};
});fs.writeFileSync(path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/format-01/seek16-diagnostic.json'),JSON.stringify(result,null,2));console.info(JSON.stringify(result));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
