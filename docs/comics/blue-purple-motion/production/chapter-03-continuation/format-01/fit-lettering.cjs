/* global DOMParser */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..'),projects=path.join(root,'anime/motion-comics/projects');
const format=require('./FORMAT.json');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:1920}}),results=[];
  for(const p of format.pages){
   const file=path.join(root,p.manifest),data=JSON.parse(fs.readFileSync(file,'utf8'));
   const svgFile=path.resolve(projects,data.letteringImage);
   const result=await page.evaluate(async({svg,frames})=>{
    const element=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
    element.style.cssText='position:fixed;left:0;top:0;width:1024px;height:1536px;visibility:hidden';document.body.append(element);await document.fonts.ready;
    const changes=[],bounds=[];
    for(const balloon of element.querySelectorAll('.balloon')){
     const clip=balloon.closest('g[clip-path]'),key=clip.getAttribute('clip-path').match(/#clip-([^)]*)/)[1],target=frames.find(f=>f.key===key).target;
     const b=balloon.getBoundingClientRect(),pad=3;
     if(b.width>target[2]-pad*2||b.height>target[3]-pad*2)throw Error('Bulle trop grande '+balloon.dataset.key);
     const dx=b.left<target[0]+pad?target[0]+pad-b.left:b.right>target[0]+target[2]-pad?target[0]+target[2]-pad-b.right:0;
     const dy=b.top<target[1]+pad?target[1]+pad-b.top:b.bottom>target[1]+target[3]-pad?target[1]+target[3]-pad-b.bottom:0;
     if(Math.abs(dx)>.01||Math.abs(dy)>.01){const m=balloon.getScreenCTM();balloon.setAttribute('transform',`translate(${dx/m.a} ${dy/m.d})`);changes.push({key:balloon.dataset.key,dx,dy});}
     const after=balloon.getBoundingClientRect();bounds.push({key:balloon.dataset.key,rect:[after.x,after.y,after.width,after.height],frame:target});
     if(after.left<target[0]+pad-.02||after.top<target[1]+pad-.02||after.right>target[0]+target[2]-pad+.02||after.bottom>target[1]+target[3]-pad+.02)throw Error('Bulle hors cadre '+balloon.dataset.key);
    }
    element.removeAttribute('style');const output=new XMLSerializer().serializeToString(element);element.remove();return {svg:output,changes,bounds};
   },{svg:fs.readFileSync(svgFile,'utf8'),frames:p.frames});
   if(result.changes.length){
    const out=path.dirname(svgFile),fitted=path.join(out,'lettering-fitted.svg'),master=path.join(out,'page-fitted.png');
    fs.writeFileSync(fitted,result.svg,{flag:'wx'});
    const png=await page.evaluate(async({art,svg})=>{
     const load=async data=>{const i=new Image();i.src=data;await i.decode();return i;};
     const a=await load(art),b=await load('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg))));
     const c=document.createElement('canvas');c.width=1024;c.height=1536;const ctx=c.getContext('2d');ctx.drawImage(a,0,0);ctx.drawImage(b,0,0);return c.toDataURL().split(',')[1];
    },{art:'data:image/png;base64,'+fs.readFileSync(path.resolve(projects,data.motionBaseImage)).toString('base64'),svg:result.svg});
    fs.writeFileSync(master,Buffer.from(png,'base64'),{flag:'wx'});
    data.image=path.relative(projects,master).replaceAll('\\','/');data.letteringImage=path.relative(projects,fitted).replaceAll('\\','/');
    data.provenance.letteringFit='Whole approved balloon groups translated to stay 3px inside frames; text/tails retained.';
    fs.writeFileSync(file,JSON.stringify(data,null,2));
    p.originalCompositeSha256=p.masterSha256;p.masterSha256=sha(master);
   }
   p.selectedMaster=path.relative(root,path.resolve(projects,data.image)).replaceAll('\\','/');p.selectedLettering=path.relative(root,path.resolve(projects,data.letteringImage)).replaceAll('\\','/');
   results.push({page:p.page,changes:result.changes,bounds:result.bounds});
  }
  fs.writeFileSync(path.join(__dirname,'FORMAT.json'),JSON.stringify(format,null,2));
  fs.writeFileSync(path.join(__dirname,'LETTERING-FIT.json'),JSON.stringify(results,null,2),{flag:'wx'});
  console.info(JSON.stringify(results.map(p=>({page:p.page,fittedBalloons:p.changes.length,maxShift:Math.max(0,...p.changes.map(c=>Math.hypot(c.dx,c.dy)))}))));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
