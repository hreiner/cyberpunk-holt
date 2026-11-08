const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..');
const dir=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/art');
const source=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5/assets/p17-c02.jpg');
const native=path.join(dir,'p17-clean-native-01.png'),impact=path.join(dir,'p17-impact-clean-native-02.png');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const data=(p,type)=>'data:image/'+type+';base64,'+fs.readFileSync(p).toString('base64');
const originalData=data(source,'jpeg'),nativeData=data(native,'png'),impactData=data(impact,'png');
const patches=[
 {id:'top-tracer',input:'native',points:[[1125,174],[1520,78],[1550,66],[1570,78],[1570,105],[1540,112],[1130,195]]},
 {id:'middle-reconstruction',input:'impact',points:[[1080,315],[1774,292],[1774,499],[1080,528]]},
 {id:'middle-stray-spark',input:'native',circle:[997,340,10]},
 {id:'middle-stray-spark-local',input:'impact-local',circle:[1035,360,12]},
 {id:'lower-residual-smoke',input:'native',points:[[1285,620],[1510,620],[1510,870],[1285,870]]}
];
const actors=[
 [[0,0],[1085,0],[1085,225],[1205,225],[1205,295],[0,334]],
 [[0,340],[900,340],[900,352],[985,352],[1000,375],[1080,405],[1130,445],[1130,470],[1220,470],[1220,540],[0,585]],
 [[0,570],[1250,530],[1280,620],[1280,780],[1320,820],[1320,887],[0,887]],
 [[1572,55],[1710,55],[1710,135],[1572,135]]
];
const originalRail=[[1080,497],[1240,472],[1251,478],[1251,526],[1080,538]];
const originalHole=[[1410,590],[1510,590],[1510,710],[1420,725]];
const shape=s=>s.circle?`<circle cx="${s.circle[0]}" cy="${s.circle[1]}" r="${s.circle[2]}"/>`:`<polygon points="${s.points.map(p=>p.join(',')).join(' ')}"/>`;
const masks=patches.map((p,i)=>`<mask id="fx-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="1774" height="887"><rect width="1774" height="887" fill="black"/><g fill="white" filter="url(#feather)">${shape(p)}</g><g fill="black" stroke="black" stroke-width="3">${[...actors,originalRail,originalHole].map(points=>shape({points})).join('')}</g></mask>`).join('');
const inserts=patches.map((p,i)=>{const insert=p.input==='native'?`<image href="${nativeData}" width="1774" height="887"/>`:`<image href="${impactData}" x="${p.input==='impact-local'?1020:1080}" y="290" width="694" height="240" preserveAspectRatio="none"/>`;return `<g mask="url(#fx-${i})">${insert}</g>`;}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1774" height="887" viewBox="0 0 1774 887"><defs><filter id="feather" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.25"/></filter>${masks}</defs><image href="${originalData}" width="1774" height="887"/>${inserts}</svg>`;
fs.writeFileSync(path.join(dir,'p17-clean-composite-v2.svg'),svg);
fs.writeFileSync(path.join(__dirname,'p17-clean-mask-v2.json'),JSON.stringify({width:1774,height:887,source:path.relative(root,source),sourceSha256:hash(source),nativeSha256:hash(native),impactSha256:hash(impact),patches,actors,originalRail,originalHole,featherPixels:1.25,impactMapping:[1080,290,694,240],impactNativeSize:[2132,738],localSparkMapping:[1020,290,694,240]},null,2));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const page=await browser.newPage();
const result=await page.evaluate(async ({svg,originalData,actors,originalRail})=>{const read=async src=>{const im=new Image();im.src=src;await im.decode();return im};const c=document.createElement('canvas');c.width=1774;c.height=887;const ctx=c.getContext('2d');ctx.drawImage(await read(originalData),0,0);const original=ctx.getImageData(0,0,1774,887).data;const originalPng=c.toDataURL().split(',')[1];ctx.clearRect(0,0,1774,887);ctx.drawImage(await read('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)))),0,0);const final=ctx.getImageData(0,0,1774,887).data;const mc=document.createElement('canvas');mc.width=1774;mc.height=887;const m=mc.getContext('2d');m.fillStyle='white';for(const p of [...actors,originalRail]){m.beginPath();m.moveTo(...p[0]);for(const q of p.slice(1))m.lineTo(...q);m.closePath();m.fill();}const mask=m.getImageData(0,0,1774,887).data;let protectedPixels=0,protectedChanged=0,changed=0;for(let i=0;i<final.length;i+=4){const differs=final[i]!==original[i]||final[i+1]!==original[i+1]||final[i+2]!==original[i+2];if(differs)changed++;if(mask[i+3]===255){protectedPixels++;if(differs)protectedChanged++;}}return {png:c.toDataURL().split(',')[1],originalPng,report:{width:1774,height:887,protectedPixels,protectedChanged,changed}};},{svg,originalData,actors,originalRail});
fs.writeFileSync(path.join(dir,'p17-source-decoded.png'),Buffer.from(result.originalPng,'base64'));fs.writeFileSync(path.join(dir,'p17-clean-v2.png'),Buffer.from(result.png,'base64'));fs.writeFileSync(path.join(__dirname,'p17-clean-pixel-review-v2.json'),JSON.stringify({...result.report,compositeSha256:hash(path.join(dir,'p17-clean-composite-v2.svg')),cleanSha256:hash(path.join(dir,'p17-clean-v2.png'))},null,2));console.log(JSON.stringify(result.report));if(result.report.protectedChanged)throw Error('Acteurs/rail protégés modifiés');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
