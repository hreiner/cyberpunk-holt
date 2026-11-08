/* An editable, subjective map, not a surveyed plan of the fictional city. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../../..');
const out=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/map');
fs.mkdirSync(out,{recursive:true});
const put=(name,text)=>fs.writeFileSync(path.join(out,name),text,{flag:'wx'});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const coast='M700 150 L1030 120 1280 180 1480 160 1600 260 1770 340 1815 520 1710 650 1820 840 1640 940 1130 925 970 850 760 880 670 750 740 650 650 560 710 470 630 360Z';
const river='M1410 190 C1320 340 1510 350 1390 460 S1050 560 1120 680 S1410 770 1240 950';
const buildings=[];
for(let row=0;row<11;row++)for(let col=0;col<20;col++){
 const x=700+col*52+((row%2)*17),y=230+row*57;
 const w=22+(col*7+row*3)%18,h=15+(row*11+col*3)%19,z=9+(row*13+col*17)%31;
 buildings.push(`<path d="M${x} ${y}v${-z}l${w} -7v${h}l-${w} 7v-${h}l${w} -7 9 6v${h}l-${w} 7-9-6" fill="#073a4c" stroke="#37a8bb" stroke-opacity=".65" stroke-width="1.3"/><path d="M${x} ${y-z}l${w} -7 9 6-${w} 7Z" fill="#15637a" stroke="#64d9e8" stroke-width="1"/>`);
}
const mainRoads=['M690 675Q1060 570 1720 340','M760 270Q1200 490 1720 690','M810 900Q980 550 1130 170','M1550 890Q1410 600 1500 250','M720 490Q1250 240 1770 510','M850 790Q1310 840 1760 760'];
const dots=[
 {id:'holt',x:1555,y:164,color:'#78eeff',label:'HOLT',caption:'BADLANDS · NORD'},
 {id:'position',x:1045,y:695,color:'#ffb65d',label:'NOTRE POSITION'},
 {id:'unknown',x:1350,y:460,color:'#ffb65d',label:'SIGNAL INCONNU',warning:true},
 {id:'green',x:770,y:815,color:'#76ffb1',label:'POINT VERT'},
];
const pin=(p)=>`<g id="${p.id}" fill="${p.color}" stroke="${p.color}"><circle cx="${p.x}" cy="${p.y}" r="31" fill="none" stroke-opacity=".25" stroke-width="2"/><circle cx="${p.x}" cy="${p.y}" r="17" fill="none" stroke-width="3"/><circle cx="${p.x}" cy="${p.y}" r="6" stroke="none"/><path d="M${p.x-42} ${p.y}h15m54 0h15M${p.x} ${p.y-42}v15m0 54v15" fill="none" stroke-width="2"/>${p.warning?`<path d="M${p.x+52} ${p.y-19}l19 33h-38Z" fill="#111b22" stroke-width="2"/><text x="${p.x+52}" y="${p.y+7}" text-anchor="middle" font-size="25" stroke="none">!</text>`:''}<rect x="${p.x-117}" y="${p.y+46}" width="${p.label.length>11?300:234}" height="${p.caption?92:53}" rx="8" fill="#03121c" fill-opacity=".95" stroke-opacity=".45"/><text x="${p.x-101}" y="${p.y+82}" font-size="32" font-weight="700" stroke="none">${p.label}</text>${p.caption?`<text x="${p.x-101}" y="${p.y+115}" font-size="21" stroke="none" fill="#9ac2ca">${p.caption}</text>`:''}</g>`;
const open=`<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1000" viewBox="0 0 2000 1000"><defs><radialGradient id="bed"><stop stop-color="#103547"/><stop offset="1" stop-color="#020c19"/></radialGradient><pattern id="grid" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M70 0H0V70" fill="none" stroke="#39a4b4" stroke-opacity=".14"/></pattern><pattern id="water" width="70" height="24" patternUnits="userSpaceOnUse"><path d="M5 12h29m13 0h7" stroke="#53d6ee" stroke-opacity=".18"/></pattern><clipPath id="land"><path d="${coast}"/></clipPath><filter id="glow" x="-.2" y="-.2" width="1.4" height="1.4"><feGaussianBlur stdDeviation="2.5"/></filter></defs><g font-family="Arial, sans-serif"><rect width="2000" height="1000" fill="url(#bed)"/><rect width="2000" height="1000" fill="url(#grid)"/><path d="M20 300 140 237 230 268 312 178 390 240 506 138 600 206 690 101 765 169 840 95 920 150 1030 50 1110 123 1250 84 1420 129 1570 65 1670 158 1815 105 1980 210" fill="none" stroke="#337489" stroke-width="2" opacity=".65"/><path d="M0 340Q410 300 630 360L700 470 650 560 740 650 670 750 760 880 970 850 1130 925 1640 940 2000 1000H0Z" fill="#061c32"/><path d="M0 340Q410 300 630 360L700 470 650 560 740 650 670 750 760 880 970 850 1130 925 1640 940 2000 1000H0Z" fill="url(#water)"/><path d="${coast}" fill="#082a3c" stroke="#52d0df" stroke-width="3"/><g clip-path="url(#land)">${buildings.join('')}<g fill="none">${mainRoads.map(d=>`<path d="${d}" stroke="#041b2a" stroke-width="21"/><path d="${d}" stroke="#79dbe7" stroke-opacity=".8" stroke-width="3"/>`).join('')}<path d="${river}" stroke="#061c32" stroke-width="67"/><path d="${river}" stroke="#4bc9e0" stroke-opacity=".7" stroke-width="70"/><path d="${river}" stroke="#061c32" stroke-width="63"/></g></g><path d="M1770 340 1830 240 1760 180 1650 132" fill="none" stroke="#5bcbd6" stroke-width="2" stroke-dasharray="8 11" opacity=".5"/><g fill="none" stroke="#28c8df" opacity=".32"><path d="M35 145V35h430M1530 35h435v340M35 790v175h450M1600 965h365V790" stroke-width="3"/><path d="M40 955h300M1660 45h300" stroke="#ef65d9" stroke-width="5"/></g><text x="1920" y="100" text-anchor="end" fill="#bcf9ff" font-size="62" font-weight="700" letter-spacing="8">NIGHT CITY</text><text x="1920" y="139" text-anchor="end" fill="#69afb9" font-size="22" letter-spacing="5">VISION PARTIELLE</text><text x="90" y="876" fill="#729bad" font-size="23" letter-spacing="6" transform="rotate(-90 90 876)">INTERFACE NEURALE</text>`;
const end='</g></svg>';
const source=open+end,annotated=open+dots.map(pin).join('')+end;
put('map-base.svg',source);put('map-final.svg',annotated);
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:2000,height:1000}});
  for(const [name,svg] of [['map-base',source],['map-final',annotated]]){
   const png=await page.evaluate(async data=>{const image=new Image();image.src='data:image/svg+xml;base64,'+data;await image.decode();const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1000;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL().split(',')[1];},Buffer.from(svg).toString('base64'));
   put(name+'.png',Buffer.from(png,'base64'));
  }
  const report={type:'editable-subjective-schematic',width:2000,height:1000,reference:'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/map-reference/fallback-p09-c02-reference.png',referenceSha256:hash(path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/map-reference/fallback-p09-c02-reference.png')),source:'docs/chapters/ch3/SCENARIO.md — Le vieux simulateur et la carte',limits:'Schéma subjectif : géographie et positions non calibrées, aucun itinéraire ni adresse. HOLT au nord ; signal inconnu au centre-ville ; quatre repères narratifs.',markers:dots.map(p=>({...p,normalized:[p.x/2000,p.y/1000]})),files:['map-base.svg','map-final.svg','map-base.png','map-final.png'].map(file=>({file,sha256:hash(path.join(out,file))}))};
  put('SOURCE.json',JSON.stringify(report,null,2));console.info(JSON.stringify({output:out,files:report.files.length,markers:report.markers}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
