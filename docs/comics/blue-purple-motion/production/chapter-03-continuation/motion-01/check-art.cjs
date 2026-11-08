const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..');
const geometry=require('./GEOMETRY.json');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try {
  const page=await browser.newPage();await page.goto(pathToFileURL(path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5/index.html')).href);
  const rows=[];
  for(const p of geometry.pages){
   const urls=[p.master.file,p.base.file,p.letteringRaster.file].map(file=>'data:image/png;base64,'+fs.readFileSync(path.join(root,file)).toString('base64'));
   const report=await page.evaluate(async urls=>{
    const images=await Promise.all(urls.map(async url=>{const im=new Image();im.src=url;await im.decode();return im;}));
    const canvas=document.createElement('canvas');canvas.width=images[0].width;canvas.height=images[0].height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(images[0],0,0);const master=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(images[1],0,0);ctx.drawImage(images[2],0,0);const composite=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let sum=0,pixelsOver2=0,pixelsOver20=0,max=0;for(let i=0;i<master.length;i+=4){const ds=[0,1,2].map(k=>Math.abs(master[i+k]-composite[i+k]));sum+=ds.reduce((a,b)=>a+b,0);const peak=Math.max(...ds);max=Math.max(max,peak);if(peak>2)pixelsOver2++;if(peak>20)pixelsOver20++;}
    return {meanAbsoluteRgb:sum/(canvas.width*canvas.height*3),max,pixelsOver2,pixelsOver20,width:canvas.width,height:canvas.height};
   },urls);
   rows.push({page:p.page,...report});
  }
  const out=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/art/layer-reconstruction-report.json');fs.writeFileSync(out,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
