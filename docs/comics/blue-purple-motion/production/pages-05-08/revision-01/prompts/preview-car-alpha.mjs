/* global document, Image */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { chromium } from 'playwright';
const base=path.resolve('art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art');
const source=path.join(base,'p08-c04-car-rgba/attempt-01/band-v1.png');
const destination=path.join(base,'car-alpha-previews-v1');await fs.mkdir(destination,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage();const input='data:image/png;base64,'+(await fs.readFile(source)).toString('base64');
 const result=await page.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;const boxes=[0,16,64,128,240].map(threshold=>{let aX=c.width,aY=c.height,bX=-1,bY=-1,count=0,alphaSum=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=pixels[(y*c.width+x)*4+3];if(a>threshold){aX=Math.min(aX,x);aY=Math.min(aY,y);bX=Math.max(bX,x);bY=Math.max(bY,y);count++;alphaSum+=a;}}return{threshold,pixels:count,meanAlpha:alphaSum/count,bounds:[aX,aY,bX-aX+1,bY-aY+1]};});const previews={};for(const [name,color]of[['white','#ffffff'],['gray','#808080']]){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(im,0,0);previews[name]=c.toDataURL('image/png').split(',')[1];}return{width:c.width,height:c.height,boxes,previews};},input);
 for(const [name,value]of Object.entries(result.previews))await fs.writeFile(path.join(destination,'car-on-'+name+'.png'),Buffer.from(value,'base64'),{flag:'wx'});
 delete result.previews;await fs.writeFile(path.join(destination,'report.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
}finally{await browser.close();}
