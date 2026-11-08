/* global DOMParser, DOMPoint */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..'),projects=path.join(root,'anime/motion-comics/projects');
const file=path.join(projects,'blue-purple-page10-motion04.json'),data=JSON.parse(fs.readFileSync(file,'utf8'));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:1920}});
  const result=await page.evaluate(async text=>{
   const svg=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;svg.style.cssText='position:fixed;left:0;top:0;width:1024px;height:1536px;visibility:hidden';document.body.append(svg);await document.fonts.ready;
   const changes=[];
   for(const key of ['10-2-0','10-2-1']){
    const balloon=svg.querySelector(`[data-key="${key}"]`),polygon=balloon.querySelector('polygon'),body=balloon.querySelector('rect').getBoundingClientRect();
    const world=key.endsWith('-1')?[[body.right-46,body.bottom-12],[body.right-34,body.bottom+7],[body.right-24,body.bottom-12]]:[[body.right-20,body.bottom-18],[body.right+28,body.bottom+7],[body.right-6,body.bottom-2]];
    const matrix=polygon.getScreenCTM().inverse();
    const local=world.map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(matrix);return [p.x,p.y];});
    changes.push({key,before:polygon.getAttribute('points'),worldPoints:world});polygon.setAttribute('points',local.map(p=>p.join(',')).join(' '));
   }
   svg.removeAttribute('style');const output=new XMLSerializer().serializeToString(svg);svg.remove();return {svg:output,changes};
  },fs.readFileSync(path.resolve(projects,data.letteringImage),'utf8'));
  const folder=path.dirname(path.resolve(projects,data.image)),svgFile=path.join(folder,'lettering-final.svg'),master=path.join(folder,'page-final.png');
  fs.writeFileSync(svgFile,result.svg,{flag:'wx'});
  const png=await page.evaluate(async({art,svg})=>{const a=new Image(),b=new Image();a.src=art;b.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await Promise.all([a.decode(),b.decode()]);const c=document.createElement('canvas');c.width=1024;c.height=1536;const ctx=c.getContext('2d');ctx.drawImage(a,0,0);ctx.drawImage(b,0,0);return c.toDataURL().split(',')[1];},{art:'data:image/png;base64,'+fs.readFileSync(path.resolve(projects,data.motionBaseImage)).toString('base64'),svg:result.svg});
  fs.writeFileSync(master,Buffer.from(png,'base64'),{flag:'wx'});data.image=path.relative(projects,master).replaceAll('\\','/');data.letteringImage=path.relative(projects,svgFile).replaceAll('\\','/');fs.writeFileSync(file,JSON.stringify(data,null,2));
  const format=require('./FORMAT.json'),p=format.pages.find(p=>p.page===10);p.selectedMaster=path.relative(root,master).replaceAll('\\','/');p.selectedLettering=path.relative(root,svgFile).replaceAll('\\','/');p.masterSha256=crypto.createHash('sha256').update(fs.readFileSync(master)).digest('hex');fs.writeFileSync(path.join(__dirname,'FORMAT.json'),JSON.stringify(format,null,2));
  fs.writeFileSync(path.join(__dirname,'TAIL-FIT.json'),JSON.stringify(result.changes,null,2),{flag:'wx'});console.info('Deux queues raccourcies dans le décor, avant cheveux et manteau.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
