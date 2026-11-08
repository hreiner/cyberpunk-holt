const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..');
const base=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation');
const out=path.join(base,'motion-03/lot-b');
const source=path.join(base,'comic-review-v5/assets/p15-c03.jpg');
const closed=path.join(base,'comic-review-v5/assets/p16-c02.jpg');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const uri=(p,t='png')=>'data:image/'+t+';base64,'+fs.readFileSync(p).toString('base64');
const original=uri(source,'jpeg');
const dynamic=[[590,0],[1774,0],[1774,520],[1280,570],[1210,785],[595,785],[595,290]];
const protectedActors=[[[0,0],[600,0],[600,320],[625,400],[665,500],[665,700],[645,850],[0,887]],[[1280,40],[1645,40],[1670,830],[1360,850],[1260,545],[1238,460],[1320,385],[1300,200]]];
const poly=p=>p.map(v=>v.join(',')).join(' ');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const page=await browser.newPage();const report=[];
for(const [id,file,type] of [['35',path.join(out,'closure-35-native.png'),'png'],['closed',closed,'jpeg']]){
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1774" height="887" viewBox="0 0 1774 887"><defs><mask id="moving-capsule"><rect width="1774" height="887" fill="black"/><polygon points="${poly(dynamic)}" fill="white"/><g fill="black" stroke="black" stroke-width="4">${protectedActors.map(p=>`<polygon points="${poly(p)}"/>`).join('')}</g></mask></defs><image href="${original}" width="1774" height="887"/><image href="${uri(file,type)}" width="1774" height="887" preserveAspectRatio="none" mask="url(#moving-capsule)"/></svg>`;
fs.writeFileSync(path.join(out,`closure-${id}-composite.svg`),svg);
const r=await page.evaluate(async ({svg,original,baseImage,lettering,protectedActors})=>{const read=async src=>{const im=new Image();im.src=src;await im.decode();return im};const c=document.createElement('canvas');c.width=1774;c.height=887;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(await read(original),0,0);const before=ctx.getImageData(0,0,1774,887).data;ctx.clearRect(0,0,1774,887);ctx.drawImage(await read('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)))),0,0);const raw=c.toDataURL().split(',')[1],after=ctx.getImageData(0,0,1774,887).data;const pc=document.createElement('canvas');pc.width=1774;pc.height=887;const pctx=pc.getContext('2d');pctx.fillStyle='white';for(const points of protectedActors){pctx.beginPath();pctx.moveTo(...points[0]);for(const p of points.slice(1))pctx.lineTo(...p);pctx.closePath();pctx.fill();}const mask=pctx.getImageData(0,0,1774,887).data;let protectedChanged=0,protectedPixels=0;for(let i=0;i<after.length;i+=4)if(mask[i+3]===255){protectedPixels++;if(after[i]!==before[i]||after[i+1]!==before[i+1]||after[i+2]!==before[i+2])protectedChanged++;}
const full=document.createElement('canvas');full.width=1024;full.height=1536;const f=full.getContext('2d');f.drawImage(await read(baseImage),0,0);f.save();f.beginPath();f.rect(12,1028,1000,496);f.clip();f.drawImage(c,12,1026,1000,500);f.restore();const art=full.toDataURL().split(',')[1];f.drawImage(await read(lettering),0,0);return {raw,art,page:full.toDataURL().split(',')[1],protectedChanged,protectedPixels};},{svg,original,baseImage:uri(path.join(base,'format-01/selected/page-15/art.png')),lettering:'data:image/svg+xml;base64,'+fs.readFileSync(path.join(base,'format-01/selected/page-15/lettering.svg')).toString('base64'),protectedActors});
for(const [suffix,key] of [['raw','raw'],['art','art'],['page','page']])fs.writeFileSync(path.join(out,`closure-${id}-${suffix}.png`),Buffer.from(r[key],'base64'));
if(r.protectedChanged)throw Error('Autres personnages altérés '+id);
report.push({id,native:path.relative(root,file),nativeSha256:sha(file),compositeSha256:sha(path.join(out,`closure-${id}-composite.svg`)),rawSha256:sha(path.join(out,`closure-${id}-raw.png`)),artSha256:sha(path.join(out,`closure-${id}-art.png`)),protectedPixels:r.protectedPixels,protectedChanged:r.protectedChanged});
}
fs.writeFileSync(path.join(__dirname,'ART-SELECTION.json'),JSON.stringify({source:path.relative(root,source),sourceSha256:sha(source),closedReference:path.relative(root,closed),closedReferenceSha256:sha(closed),dynamic,protectedActors,states:report},null,2));console.log(JSON.stringify(report.map(r=>({id:r.id,protectedPixels:r.protectedPixels,protectedChanged:r.protectedChanged}))));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
