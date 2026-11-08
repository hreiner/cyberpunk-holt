/* Preserve the edited SVG and replay its exact pixels without system-font dependency. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..');
const out=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/cover');
const manifest=path.join(root,'anime/motion-comics/projects/blue-purple-cover-v1.json');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage();
  const data=await page.evaluate(async svg=>{const image=new Image();image.src='data:image/svg+xml;base64,'+svg;await image.decode();const c=document.createElement('canvas');c.width=1024;c.height=1536;c.getContext('2d').drawImage(image,0,0);return c.toDataURL().split(',')[1];},fs.readFileSync(path.join(out,'lettering.svg')).toString('base64'));
  const png=path.join(out,'lettering.png');fs.writeFileSync(png,Buffer.from(data,'base64'),{flag:'wx'});
  const value=JSON.parse(fs.readFileSync(manifest,'utf8'));value.letteringImage=path.relative(path.dirname(manifest),png).replaceAll('\\','/');
  value.provenance.type='lettering.svg éditable ; lettering.png figé pour un rejeu sans dépendance de police système';
  fs.writeFileSync(manifest,JSON.stringify(value,null,2));
  const selection=path.join(__dirname,'SELECTION.json'),report=JSON.parse(fs.readFileSync(selection,'utf8'));
  report.runtimeLettering=path.relative(root,png).replaceAll('\\','/');
  report.files=report.files.map(entry=>entry.file.endsWith('blue-purple-cover-v1.json')?{...entry,sha256:sha(manifest)}:entry);
  report.files.push({file:report.runtimeLettering,sha256:sha(png)});fs.writeFileSync(selection,JSON.stringify(report,null,2));
  console.info(JSON.stringify({runtimeLettering:report.runtimeLettering,masterUnchanged:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
