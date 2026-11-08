/* global document, Image */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { chromium } from 'playwright';
const root=process.cwd();const base=path.join(root,'art-masters/motion-comics/blue-purple/pages-05-08/revision-02/art');
const files=[['source','art-masters/motion-comics/blue-purple/page-05/band-03-v1.png'],['generated',path.join(base,'p05-c04-intact/attempt-01/band-v1.png')]];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await browser.newPage();for(const [name,file]of files){const data='data:image/png;base64,'+(await fs.readFile(path.resolve(file))).toString('base64');const output=await page.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=1011;c.height=731;c.getContext('2d').drawImage(im,1100,400,674,487,0,0,1011,731);return c.toDataURL('image/png').split(',')[1];},data);await fs.writeFile(path.join(base,'detail-'+name+'-right-v1.png'),Buffer.from(output,'base64'),{flag:'wx'});}}finally{await browser.close();}
