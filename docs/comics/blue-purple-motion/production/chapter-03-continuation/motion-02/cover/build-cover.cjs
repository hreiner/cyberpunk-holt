/* Cover art from built-in ImageGen; editorial type stays editable and rigid. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..'),projects=path.join(root,'anime/motion-comics/projects');
const out=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/cover');
fs.mkdirSync(out,{recursive:true});
const native=path.join(out,'art-native-01.png');
if(!process.argv[2])throw Error('Chemin du candidat ImageGen requis.');
fs.copyFileSync(path.resolve(process.argv[2]),native,fs.constants.COPYFILE_EXCL);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rel=file=>path.relative(projects,file).replaceAll('\\','/');
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536"><defs><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#03070f" stop-opacity=".52"/><stop offset="1" stop-color="#03070f" stop-opacity="0"/></linearGradient></defs><rect width="1024" height="355" fill="url(#shade)"/><g font-family="Impact, Arial Narrow, sans-serif"><text x="48" y="199" fill="#020812" stroke="#020812" stroke-width="7" paint-order="stroke" font-size="195" letter-spacing="-6">HOLT.</text><text x="44" y="195" fill="#fffdf6" font-size="195" letter-spacing="-6">HOLT.</text></g><path d="M53 222h316" stroke="#63e4ff" stroke-width="4"/><path d="M369 222h63" stroke="#f450d8" stroke-width="4"/><text x="50" y="295" font-family="Impact, Arial Narrow, sans-serif" fill="#b8f5ff" stroke="#060c17" stroke-width="3" paint-order="stroke" font-size="67" letter-spacing="4">BLUE PURPLE</text><g font-family="Arial, sans-serif" fill="#fffdf6" text-anchor="end"><text x="974" y="60" font-size="16" letter-spacing="3">CHAPITRE</text><text x="976" y="125" font-size="64" font-weight="700">03</text><path d="M920 142h54" stroke="#e6b568" stroke-width="3"/></g></svg>';
fs.writeFileSync(path.join(out,'lettering.svg'),svg,{flag:'wx'});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:1536}});
  const png=await page.evaluate(async({art,letters})=>{const load=async src=>{const image=new Image();image.src=src;await image.decode();return image;};const a=await load(art),b=await load(letters),canvas=document.createElement('canvas');if(a.width!==1024||a.height!==1536)throw Error('Canvas couverture inattendu.');canvas.width=1024;canvas.height=1536;const c=canvas.getContext('2d');c.drawImage(a,0,0);c.drawImage(b,0,0);return canvas.toDataURL().split(',')[1];},{art:'data:image/png;base64,'+fs.readFileSync(native).toString('base64'),letters:'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')});
  const master=path.join(out,'cover-v1.png');fs.writeFileSync(master,Buffer.from(png,'base64'),{flag:'wx'});
  const data={schemaVersion:1,version:1,title:'HOLT — Blue Purple · couverture',image:rel(master),motionBaseImage:rel(native),letteringImage:rel(path.join(out,'lettering.svg')),overviewSeconds:0,transitionSeconds:0,gapSeconds:0,outroSeconds:0,panels:[{id:'cover',label:'Couverture — Blue Purple',rect:[0,0,1,1],holdSeconds:12,cues:[]}],effects:[{type:'rain',panelId:'cover',rect:[.015,.015,.97,.19],color:'#74b8e6',strength:.48,speed:.9,count:48},{type:'reflection',panelId:'cover',rect:[.81,.76,.18,.20],color:'#ff58de',strength:.45,speed:.65,softEdge:true}],protectedRegions:[{id:'cover-group',rect:[.035,.27,.77,.705]}],provenance:{art:'ImageGen intégré — PROMPT-v3.md, candidat01, six personnages de référence',prompt:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-02/cover/PROMPT-v3.md',type:'lettering.svg — SVG éditable, Impact/Arial locaux',duration:'12s, musique HOLT réemployée'} };
  require(path.join(root,'anime/motion-comics/core.js')).buildTimeline(data);
  const manifest=path.join(projects,'blue-purple-cover-v1.json');fs.writeFileSync(manifest,JSON.stringify(data,null,2),{flag:'wx'});
  const references=['art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5/assets/p17-c01.jpg','docs/art/Reference_pictures/grover.png','docs/art/Reference_pictures/abigail.png','docs/art/Reference_pictures/john.png','docs/art/Reference_pictures/Frankly.png','docs/art/Reference_pictures/Chapter2/BluePurple.png'];
  const report={status:'assembled-awaiting-review',tool:'built-in ImageGen',prompt:'PROMPT-v3.md',attempts:{prevalidationRefLimit:1,networkFailures:2,successfulImages:1,providerCost:'unknown'},generatedNativeSource:path.resolve(process.argv[2]),width:1024,height:1536,seconds:12,references:references.map(file=>({file,sha256:sha(path.join(root,file)),submittedInSuccessfulCall:file.endsWith('p17-c01.jpg')})),files:[native,master,path.join(out,'lettering.svg'),manifest].map(file=>({file:path.relative(root,file).replaceAll('\\','/'),sha256:sha(file)}))};
  fs.writeFileSync(path.join(__dirname,'SELECTION.json'),JSON.stringify(report,null,2),{flag:'wx'});console.info(JSON.stringify({master,manifest,seconds:12,images:1}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
