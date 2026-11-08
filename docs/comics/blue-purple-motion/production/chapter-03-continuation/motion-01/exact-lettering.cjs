/* Opaque copies of approved lettering pixels avoid a second SVG antialiasing pass. */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..'),geometry=require('./GEOMETRY.json');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage();const result=[];
  for(const p of geometry.pages){
   const masks=p.frames.flatMap(frame=>frame.balloons.map(b=>b.rect)).map(([x,y,w,h])=>[Math.max(0,Math.floor(x)-2),Math.max(0,Math.floor(y)-2),Math.ceil(w)+5,Math.ceil(h)+5]);
   const r=await page.evaluate(async({data,masks})=>{
    const image=new Image();image.src=data;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    for(const [x,y,w,h] of masks)ctx.drawImage(image,x,y,w,h,x,y,w,h);
    const png=canvas.toDataURL().split(',')[1];
    const reference=document.createElement('canvas');reference.width=image.width;reference.height=image.height;const rc=reference.getContext('2d',{willReadFrequently:true});rc.drawImage(image,0,0);const before=rc.getImageData(0,0,image.width,image.height).data;
    rc.drawImage(canvas,0,0);const after=rc.getImageData(0,0,image.width,image.height).data;let changed=0;for(let i=0;i<before.length;i++)if(before[i]!==after[i])changed++;
    return {png,reconstructionChangedBytes:changed};
   },{data:'data:image/png;base64,'+fs.readFileSync(path.join(root,p.master.file)).toString('base64'),masks});
   const file=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/art',`page-${String(p.page).padStart(2,'0')}-lettering-exact.png`);
   fs.writeFileSync(file,Buffer.from(r.png,'base64'));
   result.push({page:p.page,base:p.master.file,lettering:path.relative(root,file).replaceAll('\\','/'),masks,reconstructionChangedBytes:r.reconstructionChangedBytes});
  }
  fs.writeFileSync(path.join(__dirname,'EXACT-LETTERING.json'),JSON.stringify({method:'Approved master pixels as base; opaque original-pixel lettering plates recomposed after effects. Editable SVG retained separately. No raster art redrawn.',pages:result},null,2));
  if(result.some(p=>p.reconstructionChangedBytes))throw Error('Recomposition non exacte');
  console.log(JSON.stringify(result.map(p=>({page:p.page,balloons:p.masks.length,reconstructionChangedBytes:p.reconstructionChangedBytes}))));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
