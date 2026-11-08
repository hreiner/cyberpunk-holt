/* Mechanical QA contact sheets from already captured native proof images. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const source=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: node make-contacts.cjs PROOF_DIRECTORY');
const report=JSON.parse(fs.readFileSync(path.join(source,'report.json'),'utf8'));
const out=path.join(source,'contacts');if(fs.existsSync(out))throw Error('Contacts déjà présents.');fs.mkdirSync(out);
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage();await page.setContent('<!doctype html><title>Contacts des preuves animation</title>');const index=[];
 for(const item of report.pages){
  const files=item.panels.map(p=>p.proofFile),images=files.map(f=>'data:image/png;base64,'+fs.readFileSync(path.join(source,f)).toString('base64'));
  const data=await page.evaluate(async({id,images})=>{
   const loaded=await Promise.all(images.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;})));
   const c=document.createElement('canvas');c.width=1280;c.height=70+loaded.reduce((sum,img)=>sum+Math.round(img.height/img.width*1280)+12,0);
   const ctx=c.getContext('2d');ctx.fillStyle='#070b15';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#dffaff';ctx.font='bold 25px Arial';ctx.fillText(`BLUE PURPLE · ${id} · comparaison de phases`,18,40);let y=70;
   for(const img of loaded){const h=Math.round(img.height/img.width*1280);ctx.drawImage(img,0,y,1280,h);y+=h+12;}
   return c.toDataURL('image/png').split(',')[1];
  },{id:item.pageId,images});const file=path.join(out,item.pageId+'-animation.png');fs.writeFileSync(file,Buffer.from(data,'base64'));
  index.push({pageId:item.pageId,path:file,sha256:sha(file),sourceProofs:files.map(f=>({file:f,sha256:sha(path.join(source,f))}))});
 }
 fs.writeFileSync(path.join(out,'INDEX.json'),JSON.stringify({sourceReportSha256:sha(path.join(source,'report.json')),sheets:index},null,2)+'\n');
 console.log(`${index.length} contacts par page.`);
}finally{if(browser)await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
