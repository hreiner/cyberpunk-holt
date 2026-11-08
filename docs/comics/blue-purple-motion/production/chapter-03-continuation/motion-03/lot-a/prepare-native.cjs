/* Native SVG matter overlays: no generated raster and no changes to approved drawings. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../../../../../../..');
const OUT=path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-a/native');
fs.mkdirSync(OUT,{recursive:true});
const catalog={};
function svg(name,rect,body){
 const [x,y,w,h]=rect,file=path.join(OUT,name+'.svg');
 const text=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${body}</svg>`;
 fs.writeFileSync(file,text);return path.relative(ROOT,file).replaceAll('\\','/');
}
function frames(name,rect,images){catalog[name]={rect,images:images.map((body,i)=>svg(`${name}-${String(i).padStart(2,'0')}`,rect,body))};}
const screen=[[198,565],[480,592],[555,829],[287,857]],screenPoints=screen.map(p=>p.join(',')).join(' ');
frames('p09-screen-acquire',[12,520,1000,496],Array.from({length:11},(_,i)=>{
 const p=i/10,y=559+p*312,opacity=i===10?0:.95;
 const ringOpacity=i<6||i===10?0:Math.sin((i-6)/4*Math.PI)*.9,ringRadius=30-(i-6)*5;
 return `<defs><clipPath id="glass"><polygon points="${screenPoints}"/></clipPath></defs><g clip-path="url(#glass)"><rect x="170" y="${y}" width="410" height="${Math.max(0,885-y)}" fill="#020a13" opacity="${opacity}"/>${i&&i<10?`<path d="M170 ${y} H580" stroke="#58ecff" stroke-width="2" opacity=".8"/>`:''}${ringOpacity>0?`<circle cx="474" cy="685" r="${ringRadius}" fill="none" stroke="#ff5fdb" stroke-width="2" opacity="${ringOpacity}"/>`:''}</g>`;
}));
function lamp(name,center,radius,color){
 const [cx,cy]=center,rect=[cx-radius*4,cy-radius*4,radius*8,radius*8],profile=[0,0,.25,1,.5,.2,0];
 frames(name,rect,profile.map((a,i)=>i===0||i===1?`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#07101a" opacity=".94"/>`:i===profile.length-1?'':`<defs><radialGradient id="glow"><stop stop-color="${color}" stop-opacity="${a}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${radius*3.5}" fill="url(#glow)"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" opacity="${a}"/>`));
}
lamp('p10-camera-entry',[775.5,559.5],2.7,'#ff2455');
lamp('p10-camera-warning',[968,1077],3.5,'#ff244c');
lamp('p12-gate-awake',[877,276],3.4,'#74fff0');
frames('p12-implant-confirm',[594,699,24,26],[.1,.45,1,.35,.12,.6,1,.35,.2].map(a=>`<defs><radialGradient id="implant"><stop stop-color="#bfffff" stop-opacity="${a}"/><stop offset=".3" stop-color="#57fff1" stop-opacity="${a*.9}"/><stop offset="1" stop-color="#4eeedc" stop-opacity="0"/></radialGradient><clipPath id="implant-matter"><polygon points="603,704 611,706 614,712 610,719 604,717 603,714"/></clipPath></defs><g clip-path="url(#implant-matter)"><ellipse cx="606" cy="712" rx="5.8" ry="6.5" fill="#034442" opacity="${(1-a)*.78}"/><ellipse cx="606" cy="712" rx="5.8" ry="6.5" fill="url(#implant)"/><ellipse cx="606" cy="712" rx="2.6" ry="3.1" fill="#d9ffff" opacity="${a}"/></g>`));
frames('p13-neural-disturbance',[419,106,43,34],[0,.6,1,.4,.8,.2,0].map((a,i)=>a===0?'':`<defs><clipPath id="background-only"><polygon points="421,107 457,110 462,128 442,139 420,130"/></clipPath></defs><g clip-path="url(#background-only)" fill="#65f2ff" opacity="${a}">${[0,1,2,3].map(k=>`<rect x="${422+(k%2)*8+(i%3)*2}" y="${110+k*7}" width="${12+(k%2)*7}" height="${k%2?2:3}"/>`).join('')}</g>`));
function trace(name,rect,points){
 const d=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),length=points.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
 frames(name,rect,Array.from({length:10},(_,i)=>`<path d="${d}" fill="none" stroke="#9cfbff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" opacity="${i===0?0:.88}" stroke-dasharray="${length}" stroke-dashoffset="${length*(1-i/9)}"/>`));
}
trace('p13-plan-link-left',[410,969,96,26],[[421,980],[500,980]]);
trace('p13-plan-link-right',[518,945,86,52],[[520,980],[593,980],[590,956]]);
catalog['p09-pole-drop']={rect:[84,1136,39,155],travel:[.45,.75],image:svg('p09-pole-drop',[0,0,39,155],'<path d="M11 8 C7 15 6 19 11 21 C16 19 15 15 11 8Z" fill="#a6f4ff" opacity=".9"/><path d="M11 12 L10 17" stroke="#fff" stroke-width="1" opacity=".8"/>'),background:svg('p09-pole-clear',[0,0,39,155],'')};
catalog['p11-service-puff']={rect:[721,319,240,97],image:svg('p11-service-puff',[0,0,240,97],'<defs><radialGradient id="vapour"><stop stop-color="#eafaff" stop-opacity=".93"/><stop offset=".35" stop-color="#d2ebf3" stop-opacity=".75"/><stop offset=".68" stop-color="#b1d2e0" stop-opacity=".45"/><stop offset="1" stop-color="#92bdcc" stop-opacity="0"/></radialGradient></defs><g fill="url(#vapour)"><ellipse cx="121" cy="68" rx="49" ry="23"/><ellipse cx="91" cy="77" rx="31" ry="17"/><ellipse cx="150" cy="76" rx="35" ry="18"/><ellipse cx="133" cy="53" rx="27" ry="19"/></g><path d="M94 74 C94 59 127 57 129 67 C131 77 111 75 115 66" fill="none" stroke="#e1f3fb" stroke-width="1.3" opacity=".19"/>'),background:svg('p11-service-puff-clear',[0,0,240,97],'')};
catalog['p13-window-drops']={rect:[892,1208,106,173],image:svg('p13-window-drops',[0,0,106,173],'<g fill="#c7f2ff" opacity=".82"><path d="M18 9 C14 18 13 23 18 25 C23 23 22 17 18 9Z"/><path d="M78 26 C75 32 74 36 78 38 C82 36 81 31 78 26Z"/></g>'),background:svg('p13-window-clear',[0,0,106,173],'')};
fs.writeFileSync(path.join(__dirname,'NATIVES.json'),JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({nativeAssets:Object.values(catalog).reduce((n,x)=>n+(x.images?.length??2),0),catalog:path.join(__dirname,'NATIVES.json')}));
