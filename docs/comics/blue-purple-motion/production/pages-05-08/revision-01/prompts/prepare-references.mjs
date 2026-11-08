/* global document, Image */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { chromium } from 'playwright';
const root=process.cwd();
const destination=path.join(root,'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art/references');
await fs.mkdir(destination,{recursive:true});
const items=[
  {id:'p05-c03-v1-reference',source:'art-masters/motion-comics/blue-purple/page-05/page-raw-v1.png',rect:[518,520,494,496]},
  {id:'p06-c03-v1-reference',source:'art-masters/motion-comics/blue-purple/page-06/page-raw-v1.png',rect:[12,1028,1000,496]},
  {id:'p08-c04-v1-reference',source:'art-masters/motion-comics/blue-purple/page-08/page-raw-v1.png',rect:[12,1028,1000,496]},
];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try {
  const page=await browser.newPage();
  for(const item of items){
    const data='data:image/png;base64,'+(await fs.readFile(path.join(root,item.source))).toString('base64');
    const base64=await page.evaluate(async({data,rect})=>{const im=new Image();im.src=data;await im.decode();const [x,y,w,h]=rect;const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);return c.toDataURL('image/png').split(',')[1];},{data,rect:item.rect});
    await fs.writeFile(path.join(destination,item.id+'.png'),Buffer.from(base64,'base64'),{flag:'wx'});
  }
  await fs.writeFile(path.join(destination,'crop-provenance.json'),JSON.stringify(items,null,2),{flag:'wx'});
  console.log('Three exact panel references extracted without changing source masters.');
}finally{await browser.close();}
