/* Recompose the retained panels in page08's format; never stretch a drawn body. */
/* global getComputedStyle */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL,fileURLToPath}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..');
const projectDir=path.join(root,'anime/motion-comics/projects');
const art=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/format-01/selected');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const core=require(path.join(root,'anime/motion-comics/core.js'));
const previous=readDocument(path.join(projectDir,'blue-purple-pages01-21-v7.json'));
const geometry=require('../motion-01/GEOMETRY.json');
const relative=file=>path.relative(root,file).replaceAll('\\','/');
const media=file=>path.relative(projectDir,file).replaceAll('\\','/');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2),{flag:'wx'});
const W=1024,H=1536;
const unit=r=>r.map((v,i)=>v/(i%2?H:W));
function box(r,m){
 const a=[r[0]*1200,r[1]*1920,r[2]*1200,r[3]*1920];
 const x=m.x+a[0]*m.scale,y=m.y+a[1]*m.scale;
 const x0=Math.max(m.target[0],x),y0=Math.max(m.target[1],y);
 const x1=Math.min(m.target[0]+m.target[2],x+a[2]*m.scale),y1=Math.min(m.target[1]+m.target[3],y+a[3]*m.scale);
 return x1>x0&&y1>y0?unit([x0,y0,x1-x0,y1-y0]):null;
}
(async()=>{
 fs.mkdirSync(art,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:1920},deviceScaleFactor:1});
  await page.goto(pathToFileURL(path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5/index.html')).href);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  const referenceFile=path.resolve(projectDir,previous.pages[7].data.image);
  const background=await page.evaluate(async data=>{const image=new Image();image.src=data;await image.decode();const c=document.createElement('canvas');c.width=1;c.height=1;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,1,1).data;return '#'+[...p.slice(0,3)].map(v=>v.toString(16).padStart(2,'0')).join('');},'data:image/png;base64,'+fs.readFileSync(referenceFile).toString('base64'));
  const report={sourceSequence:relative(previous.manifestFile),sourceSha256:sha(previous.manifestFile),reference:relative(referenceFile),referenceSha256:sha(referenceFile),width:W,height:H,margin:12,gutter:12,background,pages:[]};
  const newPages=[];
  for(const g of geometry.pages){
   const frames=await page.locator(`#page-${g.page}`).evaluate(sheet=>{
    return [...sheet.querySelectorAll('.frame')].map(frame=>{
     const image=frame.querySelector('img'),svg=frame.querySelector('svg'),style=getComputedStyle(image);
     return {key:frame.dataset.panel,imageSource:image.src,width:image.naturalWidth,height:image.naturalHeight,position:style.objectPosition,viewBox:svg.getAttribute('viewBox'),letters:[...svg.childNodes].map(node=>new XMLSerializer().serializeToString(node)).join('')};
    });
   });
   const maps={},svgParts=[],prepared=[];
   for(const frame of frames){
    const old=g.frames.find(f=>f.key===frame.key),[ox,oy,ow,oh]=old.imageRect;
    const row=Math.round((oy-65)/606),siblings=g.frames.filter(f=>Math.abs(f.imageRect[1]-oy)<1);
    const target=siblings.length===1?[12,12+row*508,1000,496]:[old.imageRect[0]<600?12:518,12+row*508,494,496];
    const position=frame.position.split(' ').map(v=>parseFloat(v)/100);
    const oldScale=Math.max(ow/frame.width,oh/frame.height);
    const oldOffset=[(ow-frame.width*oldScale)*position[0],(oh-frame.height*oldScale)*position[1]];
    const scale=Math.max(target[2]/frame.width,target[3]/frame.height);
    const newPosition=frame.width===1672?[position[0],1]:position;
    const newOffset=[(target[2]-frame.width*scale)*newPosition[0],(target[3]-frame.height*scale)*newPosition[1]];
    const factor=scale/oldScale;
    const matrix={target,scale:factor,x:target[0]+newOffset[0]-(ox+oldOffset[0])*factor,y:target[1]+newOffset[1]-(oy+oldOffset[1])*factor};
    maps[frame.key]=matrix;
    const tx=target[0]+newOffset[0]-oldOffset[0]*factor,ty=target[1]+newOffset[1]-oldOffset[1]*factor;
    const clip='clip-'+frame.key;
    svgParts.push(`<defs><clipPath id="${clip}"><rect x="${target[0]}" y="${target[1]}" width="${target[2]}" height="${target[3]}"/></clipPath></defs><g clip-path="url(#${clip})"><g transform="translate(${tx} ${ty}) scale(${factor})"><svg x="0" y="0" width="${ow}" height="${oh}" viewBox="${frame.viewBox}" preserveAspectRatio="none">${frame.letters}</svg></g></g>`);
    prepared.push({...frame,target,scale,offset:newOffset,matrix,sourceFile:fileURLToPath(frame.imageSource)});
   }
   const number=String(g.page).padStart(2,'0'),folder=path.join(art,'page-'+number);fs.mkdirSync(folder,{recursive:true});
   const lettering=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svgParts.join('')}</svg>`;
   fs.writeFileSync(path.join(folder,'lettering.svg'),lettering,{flag:'wx'});
   const inputs=prepared.map(f=>({...f,data:'data:image/jpeg;base64,'+fs.readFileSync(f.sourceFile).toString('base64')}));
   const result=await page.evaluate(async({inputs,lettering,background,W,H})=>{
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
    for(const f of inputs){const image=new Image();image.src=f.data;await image.decode();const [x,y,w,h]=f.target;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+f.offset[0],y+f.offset[1],image.width*f.scale,image.height*f.scale);ctx.restore();}
    const base=canvas.toDataURL().split(',')[1];
    const letters=new Image();letters.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(lettering)));await letters.decode();ctx.drawImage(letters,0,0);
    return {base,master:canvas.toDataURL().split(',')[1]};
   },{inputs,lettering,background,W,H});
   fs.writeFileSync(path.join(folder,'art.png'),Buffer.from(result.base,'base64'),{flag:'wx'});
   fs.writeFileSync(path.join(folder,'page.png'),Buffer.from(result.master,'base64'),{flag:'wx'});
   const before=previous.pages[g.page-1].data,data=structuredClone(before);
   data.version=4;data.image=media(path.join(folder,'page.png'));data.motionBaseImage=media(path.join(folder,'art.png'));data.letteringImage=media(path.join(folder,'lettering.svg'));
   const keyForPanel=id=>before.panels.find(p=>p.id===id).sourcePanelKey;
   for(const p of data.panels)p.rect=unit(maps[p.sourcePanelKey].target);
   data.effects=before.effects.map(effect=>{const m=maps[keyForPanel(effect.panelId)],out={...effect,rect:box(effect.rect,m)};if(effect.protect)out.protect=effect.protect.map(r=>box(r,m)).filter(Boolean);if(effect.amplitude!==undefined)out.amplitude=effect.amplitude*m.scale;return out;}).filter(f=>f.rect);
   const keys=Object.keys(maps).sort((a,b)=>b.length-a.length);
   data.protectedRegions=before.protectedRegions.map(r=>{const key=keys.find(key=>r.id.startsWith(key+'-'));if(!key)throw Error('Protection sans case '+r.id);return {...r,rect:box(r.rect,maps[key])};}).filter(r=>r.rect);
   data.provenance.formatCorrection='docs/comics/blue-purple-motion/production/chapter-03-continuation/format-01/PROGRESS.md';
   const timeline=core.buildTimeline(data),oldTimeline=core.buildTimeline(before);
   assert.deepEqual(timeline.tracks,oldTimeline.tracks);assert.equal(timeline.duration,oldTimeline.duration);
   assert.deepEqual(timeline.segments.map(s=>[s.start,s.end,s.panel]),oldTimeline.segments.map(s=>[s.start,s.end,s.panel]));
   assert.equal(data.effects.length,before.effects.length);
   const manifest=path.join(projectDir,`blue-purple-page${number}-motion04.json`);write(manifest,data);
   newPages.push({id:'page-'+number,manifest:path.basename(manifest)});
   report.pages.push({page:g.page,manifest:relative(manifest),frames:prepared.map(f=>({key:f.key,target:f.target,naturalSize:[f.width,f.height],sourceSha256:sha(f.sourceFile),uniformScale:f.scale,matrix:f.matrix})),masterSha256:sha(path.join(folder,'page.png')),effects:data.effects.length,protectedRegions:data.protectedRegions.length,previousProtectedRegions:before.protectedRegions.length,voiceAndTimingExact:true});
  }
  const full={...structuredClone(previous.data),version:8,pages:[...previous.data.pages.slice(0,8),...newPages]};
  full.provenance.formatCorrection=relative(__dirname)+'/PROGRESS.md';
  write(path.join(projectDir,'blue-purple-pages01-21-v8.json'),full);
  const lot={...full,version:4,title:'HOLT — Blue Purple · pages 9 à 21',pages:newPages,music:{...full.music,audio:media(path.join(root,require('../motion-01/sound/SELECTION.json').backingPages09To21))}};
  write(path.join(projectDir,'blue-purple-pages09-21-motion04.json'),lot);
  write(path.join(__dirname,'FORMAT.json'),report);
  console.info(JSON.stringify({pages:report.pages.length,frames:report.pages.reduce((s,p)=>s+p.frames.length,0),width:W,height:H,background,voicesAndTimingPreserved:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
