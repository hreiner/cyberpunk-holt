/* Native illustration and three editable POI plates; no invented geographic grid. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..');
const out=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/map');
const native=path.join(out,'native-map-v2.png');
const W=2000,H=1000;
const markers=[
 {id:'position',normalized:[.533,.214],color:'#f2e52a',role:'Premier POI jaune — Watson'},
 {id:'unknown',normalized:[.572,.632],color:'#f2e52a',role:'Second POI jaune — City Center'},
 {id:'green',normalized:[.382,.755],color:'#39de83',role:'POI vert — rive ouest de Heywood'},
];
const svg=items=>`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${items.map(p=>{const x=p.normalized[0]*W,y=p.normalized[1]*H;return `<g id="${p.id}" transform="translate(${x} ${y})" stroke-linejoin="round"><rect x="-29" y="-37" width="58" height="74" rx="7" fill="#02070c" fill-opacity=".2" stroke="${p.color}" stroke-opacity=".22" stroke-width="7"/><path d="M-20-28H12L20-20V28H-20Z" fill="#030d12" fill-opacity=".94" stroke="#010406" stroke-width="9"/><path d="M-20-28H12L20-20V28H-20Z" fill="#030d12" fill-opacity=".94" stroke="${p.color}" stroke-width="4"/><path d="M11-27V-19H19M-12-14H4M-12-5H12M-12 4H12M-12 13H12M-12 21H6" fill="none" stroke="${p.color}" stroke-width="3.5"/></g>`;}).join('')}</svg>`;
const write=(name,bytes)=>fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});
for(const marker of markers)write(`marker-${marker.id}.svg`,svg([marker]));
write('marker-all.svg',svg(markers));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage();
  const result=await page.evaluate(async ({source,plates,W,H})=>{
   const load=async src=>{const i=new Image();i.src=src;await i.decode();return i;};
   const image=await load(source);if(Math.abs(image.width/image.height-2)>.0001)throw Error('Carte source attendue au ratio2:1.');
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const context=canvas.getContext('2d');context.drawImage(image,0,0,W,H);
   const base=canvas.toDataURL().split(',')[1],outputs={};
   for(const [name,plate]of Object.entries(plates)){const layer=await load(plate);const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(layer,0,0,W,H);outputs[name]=c.toDataURL().split(',')[1];}
   context.drawImage(await load(plates.all),0,0,W,H);
   return {native:[image.width,image.height],base,outputs,final:canvas.toDataURL().split(',')[1]};
  },{source:'data:image/png;base64,'+fs.readFileSync(native).toString('base64'),plates:Object.fromEntries([...markers.map(p=>[p.id,svg([p])]),['all',svg(markers)]].map(([key,text])=>[key,'data:image/svg+xml;base64,'+Buffer.from(text).toString('base64')])),W,H});
  write('map-base.png',Buffer.from(result.base,'base64'));write('map-final.png',Buffer.from(result.final,'base64'));
  for(const [id,png]of Object.entries(result.outputs))write(`marker-${id}.png`,Buffer.from(png,'base64'));
  const names=['map-base.png','map-final.png',...markers.flatMap(p=>[`marker-${p.id}.png`,`marker-${p.id}.svg`]),'marker-all.png','marker-all.svg'];
  const report={status:'assembled-reviewed-geography',width:W,height:H,nativeSize:result.native,native:path.relative(root,native).replaceAll('\\','/'),nativeSha256:sha(native),reference:'REFERENCE.json',prompt:'PROMPT-v2.txt + outpaint journal',style:'ImageGen built-in, cyberpunk comic atlas',geographyReviewed:['Bay to west','Offshore runway and three triangular installations','Watson north / CityCenter / Heywood southwest / Westbrook northeast / SantoDomingo southeast','Rugged eastern Badlands','No invented river or generic wireframe city'],latestUserDirection:'Exactly two yellow document POIs and one green, at original reference positions. No HOLT marker for now.',markers,coordinates:'Normalized from the supplied visual reference, no real-world LAT/LON or invented address.',files:names.map(file=>({file:path.relative(root,path.join(out,file)).replaceAll('\\','/'),sha256:sha(path.join(out,file))}))};
  fs.writeFileSync(path.join(__dirname,'SELECTION.json'),JSON.stringify(report,null,2),{flag:'wx'});console.info(JSON.stringify({output:out,markers:markers.length,colors:['yellow','yellow','green'],holtMarker:false,files:names.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
