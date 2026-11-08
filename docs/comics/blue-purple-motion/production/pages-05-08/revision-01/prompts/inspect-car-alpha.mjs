/* global document, Image */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
const file=path.resolve(process.argv[2]??'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art/p08-c04-car-rgba/attempt-01/band-v1.png');
const output=path.resolve(process.argv[3]??'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art/car-alpha-audit-v1.json');
const data=await fs.readFile(file);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try {
  const page=await browser.newPage();
  const stats=await page.evaluate(async src=>{
    const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
    let transparent=0,opaque=0,partial=0,minX=c.width,minY=c.height,maxX=-1,maxY=-1;const histogram=new Uint32Array(256);
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=pixels[(y*c.width+x)*4+3];histogram[a]++;if(a===0)transparent++;else if(a===255)opaque++;else partial++;if(a>16){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
    const alpha=(x,y)=>pixels[(y*c.width+x)*4+3];
    const samples=[[0,0],[c.width-1,0],[0,c.height-1],[c.width-1,c.height-1],[Math.floor(c.width*.1),Math.floor(c.height*.5)],[Math.floor(c.width*.5),Math.floor(c.height*.08)]].map(([x,y])=>({x,y,alpha:alpha(x,y)}));
    const seen=new Uint8Array(c.width*c.height),queue=new Int32Array(c.width*c.height);const components=[];
    for(let index=0;index<seen.length;index++){if(seen[index]||pixels[index*4+3]<=16)continue;let head=0,tail=1,count=0;queue[0]=index;seen[index]=1;let aX=c.width,aY=c.height,bX=0,bY=0;while(head<tail){const v=queue[head++],x=v%c.width,y=Math.floor(v/c.width);count++;aX=Math.min(aX,x);aY=Math.min(aY,y);bX=Math.max(bX,x);bY=Math.max(bY,y);for(const next of [x>0?v-1:-1,x<c.width-1?v+1:-1,y>0?v-c.width:-1,y<c.height-1?v+c.width:-1]){if(next<0||seen[next]||pixels[next*4+3]<=16)continue;seen[next]=1;queue[tail++]=next;}}components.push({pixels:count,bounds:[aX,aY,bX-aX+1,bY-aY+1]});}
    components.sort((a,b)=>b.pixels-a.pixels);
    const dominantAlpha=Array.from(histogram).map((pixels,alpha)=>({alpha,pixels})).filter(v=>v.pixels).sort((a,b)=>b.pixels-a.pixels).slice(0,15);
    return {width:c.width,height:c.height,transparent,opaque,partial,dominantAlpha,transparentFraction:transparent/(c.width*c.height),alphaBounds:[minX,minY,maxX-minX+1,maxY-minY+1],samples,components:components.slice(0,10),componentCount:components.length};
  },'data:image/png;base64,'+data.toString('base64'));
  const report={source:file,sha256:crypto.createHash('sha256').update(data).digest('hex'),...stats,method:'Canvas decoded alpha; alpha>16 connected components. This checks transparency, not visual anatomy.'};
  if(stats.transparentFraction<.4||stats.samples.some(p=>p.alpha!==0))throw new Error('Real transparent canvas/background samples failed: '+JSON.stringify(report));
  await fs.writeFile(output,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify(report));
}finally{await browser.close();}
