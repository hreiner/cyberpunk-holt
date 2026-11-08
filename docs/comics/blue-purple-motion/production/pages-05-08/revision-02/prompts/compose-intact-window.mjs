/* global document, Image */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
const root=process.cwd(),base=path.join(root,'art-masters/motion-comics/blue-purple/pages-05-08/revision-02/art');
const source=path.join(root,'art-masters/motion-comics/blue-purple/page-05/band-03-v1.png');
const generated=path.join(base,'p05-c04-intact/attempt-01/band-v1.png');
const inputs=await Promise.all([source,generated].map(file=>fs.readFile(file)));
const hrefs=inputs.map(data=>'data:image/png;base64,'+data.toString('base64'));
// Masks describe only the repaired window and debris-covered background.
// Original people, table, upholstery and chair foreground are restored verbatim.
const editPath='M1325 0H1774V887H1100V500H1325Z';
const chairPaths=[
 ['backrest','M1190 516 Q1196 504 1208 507 L1296 518 Q1317 522 1317 536 L1289 605 L1182 594 Q1174 592 1175 580 L1184 532Z'],
 ['seat','M1100 664 L1219 664 Q1250 665 1271 674 L1288 692 L1282 714 L1100 724Z'],
 ['left-support','M1208 531 L1162 712 L1186 880'],
 ['right-support','M1307 540 L1272 711 L1325 883'],
 ['seat-front-bar','M1100 712 L1279 712'],
];
const stroked=new Set(['left-support','right-support','seat-front-bar']);
const restore=chairPaths.map(([id,d])=>`<path id="${id}" d="${d}" fill="${stroked.has(id)?'none':'black'}" stroke="${stroked.has(id)?'black':'none'}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1774" height="887" viewBox="0 0 1774 887"><defs><mask id="window-edit" maskUnits="userSpaceOnUse" x="0" y="0" width="1774" height="887"><rect width="1774" height="887" fill="black"/><path id="edit-region" d="${editPath}" fill="white"/>${restore}</mask></defs><image id="original-unchanged" width="1774" height="887" href="${hrefs[0]}"/><image id="generated-glass-only" width="1774" height="887" href="${hrefs[1]}" mask="url(#window-edit)"/></svg>`;
const svgFile=path.join(base,'p05-c04-intact-composite-v1.svg');await fs.writeFile(svgFile,svg,{flag:'wx'});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage();
 const result=await page.evaluate(async({source,svg,chairPaths})=>{const load=async src=>{const im=new Image();im.src=src;await im.decode();return im;};const [original,assembled]=await Promise.all([load(source),load(svg)]);const canvas=document.createElement('canvas');canvas.width=1774;canvas.height=887;const ctx=canvas.getContext('2d');ctx.drawImage(original,0,0);const a=ctx.getImageData(0,0,1774,887).data;ctx.clearRect(0,0,1774,887);ctx.drawImage(assembled,0,0);const b=ctx.getImageData(0,0,1774,887).data;const output=canvas.toDataURL('image/png').split(',')[1];
  const regions=[['all-actors',[0,0,1040,887]],['franklyn-hand',[84,370,125,100]],['abigail-hand',[470,620,210,175]],['franklyn-face',[135,255,160,160]],['abigail-face',[650,370,190,225]],['child-face',[245,530,240,195]],['table-top',[825,365,480,135]],['table-pedestal',[1020,500,78,350]],['chair-backrest-core',[1200,540,75,45]],['chair-seat-core',[1130,685,110,15]]];
  const stats=regions.map(([name,[x0,y0,w,h]])=>{let changed=0,maxDifference=0;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=(y*1774+x)*4;let d=0;for(let c=0;c<4;c++)d=Math.max(d,Math.abs(a[i+c]-b[i+c]));if(d)changed++;maxDifference=Math.max(maxDifference,d);}return{name,rect:[x0,y0,w,h],changedPixels:changed,maxDifference};});
  return{png:output,width:1774,height:887,stats,chairPaths};
 },{source:hrefs[0],svg:'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'),chairPaths});
 const png=Buffer.from(result.png,'base64');delete result.png;
 if(result.stats.some(stat=>stat.changedPixels!==0))throw new Error('Protected pixel check failed: '+JSON.stringify(result.stats));
 const final=path.join(base,'p05-c04-intact-composite-v1.png');await fs.writeFile(final,png,{flag:'wx'});
 const proof={source,sourceSha256:crypto.createHash('sha256').update(inputs[0]).digest('hex'),generated,generatedSha256:crypto.createHash('sha256').update(inputs[1]).digest('hex'),svg:svgFile,svgSha256:crypto.createHash('sha256').update(svg).digest('hex'),image:final,imageSha256:crypto.createHash('sha256').update(png).digest('hex'),editPath,...result,method:'Original raster unchanged outside editable SVG mask. Generated raster supplies repaired glass/debris background. Protected regions decoded and compared exact RGBA.'};
 await fs.writeFile(path.join(base,'window-composite-proof-v1.json'),JSON.stringify(proof,null,2),{flag:'wx'});console.log(JSON.stringify(proof));
}finally{await browser.close();}
