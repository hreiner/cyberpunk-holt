const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..');
const dir=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/art');
const source=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5/assets/p17-c02.jpg');
const native=path.join(dir,'p17-clean-native-01.png');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const shapes=[
 {id:'top-tracer',points:[[1125,174],[1520,78],[1550,66],[1570,78],[1570,105],[1540,112],[1130,195]]},
 {id:'middle-impact',points:[[1080,340],[1190,311],[1350,298],[1510,294],[1710,304],[1760,340],[1755,435],[1680,480],[1450,510],[1325,510],[1310,430],[1210,420],[1080,390]]},
 {id:'middle-stray-spark',circle:[997,340,10]},
 {id:'lower-residual-smoke',points:[[1380,620],[1455,625],[1465,690],[1420,730],[1400,780],[1350,810],[1310,800],[1290,775],[1320,730],[1340,690]]}
];
const protectedActors=[
 [[0,0],[1085,0],[1085,225],[1205,225],[1205,330],[0,340]],
 [[0,340],[900,340],[900,352],[985,352],[1000,375],[1080,405],[1130,445],[1130,470],[1220,470],[1220,540],[0,585]],
 [[0,570],[1250,530],[1280,620],[1280,780],[1320,820],[1320,887],[0,887]],
 [[1572,55],[1710,55],[1710,135],[1572,135]]
];
const shape=s=>s.circle?`<circle cx="${s.circle[0]}" cy="${s.circle[1]}" r="${s.circle[2]}"/>`:`<polygon points="${s.points.map(p=>p.join(',')).join(' ')}"/>`;
const originalData='data:image/jpeg;base64,'+fs.readFileSync(source).toString('base64'),nativeData='data:image/png;base64,'+fs.readFileSync(native).toString('base64');
const geometry={width:1774,height:887,source:path.relative(root,source),native:path.relative(root,native),sourceSha256:hash(source),nativeSha256:hash(native),shapes,protectedActors,featherPixels:1.25};
const foregroundRail=[[1080,420],[1320,420],[1320,530],[1080,550]];
const masks=shapes.map((s,i)=>`<mask id="fx-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="1774" height="887"><rect width="1774" height="887" fill="black"/><g fill="white" filter="url(#feather)">${shape(s)}</g><g fill="black" stroke="black" stroke-width="3">${[...protectedActors,foregroundRail].map(points=>shape({points})).join('')}</g></mask>`).join('');
const inserts=shapes.map((s,i)=>`<g mask="url(#fx-${i})"><image href="${nativeData}" y="${s.offsetY||0}" width="1774" height="887"/></g>`).join('');
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1774" height="887" viewBox="0 0 1774 887"><defs><filter id="feather" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.25"/></filter>${masks}</defs><image href="${originalData}" width="1774" height="887"/>${inserts}</svg>`;
fs.writeFileSync(path.join(dir,'p17-clean-composite.svg'),svg);
fs.writeFileSync(path.join(__dirname,'p17-clean-mask.json'),JSON.stringify(geometry,null,2));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const page=await browser.newPage();
const smallRayMask=await page.evaluate(async ({originalData,protectedActors})=>{const im=new Image();im.src=originalData;await im.decode();const c=document.createElement('canvas');c.width=1774;c.height=887;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,1774,887).data;ctx.clearRect(0,0,1774,887);ctx.fillStyle='white';let seeds=0;for(let y=305;y<475;y++)for(let x=990;x<1310;x++){const i=(y*1774+x)*4,r=d[i],g=d[i+1],b=d[i+2];if(r>170&&r>g*1.15&&g>b*1.25&&r-b>80){ctx.fillRect(x-2,y-2,5,5);seeds++;}}ctx.globalCompositeOperation='destination-out';ctx.fillStyle='black';ctx.strokeStyle='black';ctx.lineWidth=4;for(const points of protectedActors){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fill();ctx.stroke();}return {data:c.toDataURL(),seeds};},{originalData,protectedActors});
svg=svg.replace('</defs>',`<mask id="small-rays" maskUnits="userSpaceOnUse" x="0" y="0" width="1774" height="887"><image href="${smallRayMask.data}" width="1774" height="887"/></mask></defs>`).replace('</svg>',`<g mask="url(#small-rays)"><image href="${nativeData}" y="40" width="1774" height="887"/></g></svg>`);
fs.writeFileSync(path.join(dir,'p17-clean-small-rays-mask.png'),Buffer.from(smallRayMask.data.split(',')[1],'base64'));fs.writeFileSync(path.join(dir,'p17-clean-composite.svg'),svg);fs.writeFileSync(path.join(__dirname,'p17-clean-mask.json'),JSON.stringify({...geometry,foregroundRail,smallRayMask:{bounds:[990,305,320,170],predicate:'r>170 && r>g*1.15 && g>b*1.25 && r-b>80',dilatePixels:2,nativeOffsetY:40,seeds:smallRayMask.seeds}},null,2));
const result=await page.evaluate(async ({svg,originalData,protectedActors})=>{const read=async src=>{const im=new Image();im.src=src;await im.decode();return im};const c=document.createElement('canvas');c.width=1774;c.height=887;const ctx=c.getContext('2d');ctx.drawImage(await read(originalData),0,0);const original=ctx.getImageData(0,0,1774,887).data;const originalPng=c.toDataURL().split(',')[1];ctx.clearRect(0,0,1774,887);ctx.drawImage(await read('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)))),0,0);const final=ctx.getImageData(0,0,1774,887).data;const mc=document.createElement('canvas');mc.width=1774;mc.height=887;const m=mc.getContext('2d');m.fillStyle='white';for(const p of protectedActors){m.beginPath();m.moveTo(...p[0]);for(const q of p.slice(1))m.lineTo(...q);m.closePath();m.fill();}const mask=m.getImageData(0,0,1774,887).data;let protectedPixels=0,protectedChanged=0,changed=0;for(let i=0;i<final.length;i+=4){const differs=final[i]!==original[i]||final[i+1]!==original[i+1]||final[i+2]!==original[i+2];if(differs)changed++;if(mask[i+3]===255){protectedPixels++;if(differs)protectedChanged++;}}return {png:c.toDataURL().split(',')[1],originalPng,report:{width:1774,height:887,protectedPixels,protectedChanged,changed}};},{svg,originalData,protectedActors});
fs.writeFileSync(path.join(dir,'p17-source-decoded.png'),Buffer.from(result.originalPng,'base64'));fs.writeFileSync(path.join(dir,'p17-clean.png'),Buffer.from(result.png,'base64'));fs.writeFileSync(path.join(__dirname,'p17-clean-pixel-review.json'),JSON.stringify({...result.report,compositeSha256:hash(path.join(dir,'p17-clean-composite.svg')),cleanSha256:hash(path.join(dir,'p17-clean.png'))},null,2));console.log(JSON.stringify(result.report));if(result.report.protectedChanged)throw Error('Acteurs protégés modifiés');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
