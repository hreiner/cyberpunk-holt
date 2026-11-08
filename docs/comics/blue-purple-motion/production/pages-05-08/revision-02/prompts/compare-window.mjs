/* global document, Image */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
const root=process.cwd();const base=path.join(root,'art-masters/motion-comics/blue-purple/pages-05-08/revision-02/art');
const source=path.join(root,'art-masters/motion-comics/blue-purple/page-05/band-03-v1.png');
const variant=path.join(base,'p05-c04-intact/attempt-01/band-v1.png');
const inputs=await Promise.all([source,variant].map(file=>fs.readFile(file)));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage();
 const report=await page.evaluate(async inputs=>{const ims=await Promise.all(inputs.map(async src=>{const im=new Image();im.src=src;await im.decode();return im;}));if(ims[0].width!==ims[1].width||ims[0].height!==ims[1].height)throw new Error('Native dimensions differ');const [width,height]=[ims[0].width,ims[0].height];const arrays=ims.map(im=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return ctx.getImageData(0,0,width,height).data;});const regions=[['actors-left',[0,0,1040,887]],['franklyn-hand',[84,370,125,100]],['abigail-hand',[470,620,210,175]],['franklyn-face',[135,255,160,160]],['abigail-face',[650,370,190,225]],['child-face',[245,530,240,195]],['chair',[1125,485,220,390]],['window-and-floor-right',[1330,0,444,887]]];const stats=regions.map(([name,[x0,y0,w,h]])=>{let changed=0,above15=0,maxDifference=0,sumDifference=0;for(let y=y0;y<Math.min(height,y0+h);y++)for(let x=x0;x<Math.min(width,x0+w);x++){const index=(y*width+x)*4;let d=0;for(let c=0;c<3;c++)d=Math.max(d,Math.abs(arrays[0][index+c]-arrays[1][index+c]));if(d)changed++;if(d>15)above15++;maxDifference=Math.max(maxDifference,d);sumDifference+=d;}return{name,rect:[x0,y0,w,h],pixels:w*h,changedPixels:changed,above15,maxDifference,meanMaxChannelDifference:sumDifference/(w*h)};});return{width,height,stats};},inputs.map(data=>'data:image/png;base64,'+data.toString('base64')));
 const output={source,sourceSha256:crypto.createHash('sha256').update(inputs[0]).digest('hex'),variant,variantSha256:crypto.createHash('sha256').update(inputs[1]).digest('hex'),...report,method:'PNG decode Canvas exact RGB difference, not perceptual quality judgment.'};
 await fs.writeFile(path.join(base,'window-native-difference-v1.json'),JSON.stringify(output,null,2),{flag:'wx'});console.log(JSON.stringify(output));
}finally{await browser.close();}
