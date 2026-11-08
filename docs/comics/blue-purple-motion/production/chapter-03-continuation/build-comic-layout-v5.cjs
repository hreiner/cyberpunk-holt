const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../../..');
const art=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation');
const out=path.join(art,'comic-review-v5');
const lines=JSON.parse(fs.readFileSync(path.join(__dirname,'revision-05/DIALOGUE-FR.json'),'utf8').replace(/^\uFEFF/,''));
const mappings={...JSON.parse(fs.readFileSync(path.join(__dirname,'revision-05/BALLOONS-A.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(__dirname,'revision-05/BALLOONS-B.json'),'utf8'))};
const e=x=>String(x).trim().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function balloon(line,b,index){
 const [x,y,w,targetX,targetY]=b, font=b[5]||22, lh=font*1.13;
 const words=line.text.trim().replace(/\s+([?!:;])/g,'\u00a0$1').split(/ +/);let rows=[],row='';const max=Math.floor((w-45)/(font*.55));
 for(const word of words){if((row+' '+word).trim().length>max&&row){rows.push(row);row=word}else row=(row+' '+word).trim()}if(row)rows.push(row);
 if(Array.isArray(b[7]))rows=b[7];
 const h=Math.max(48,rows.length*lh+24),cx=x+w/2,cy=y+h/2,rx=w/2,ry=h/2;
 const dx=targetX-cx,dy=targetY-cy,n=Math.max(Math.abs(dx)/rx,Math.abs(dy)/ry),ex=cx+dx/n*.90,ey=cy+dy/n*.90;
 const norm=Math.hypot(dx,dy)||1,px=-dy/norm*10,py=dx/norm*10;
 const distance=Math.hypot(targetX-ex,targetY-ey)||1,stop=Math.min(25,distance*.3),tipX=targetX-(targetX-ex)*stop/distance,tipY=targetY-(targetY-ey)*stop/distance;
 const points=Array.isArray(b[6])?b[6]:[[ex+px,ey+py],[tipX,tipY],[ex-px,ey-py]];
 const tail=b[6]===null||b[6]==='offscreen'?'':`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="#fffdf6" stroke="#080910" stroke-width="3" stroke-linejoin="round"/>`;
 const textY=cy-(rows.length-1)*lh/2;
 return `<g class="balloon" data-speaker="${e(line.speaker)}" data-key="${index}">${tail}<rect class="bubble-body" x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(36,h/2)}" fill="#fffdf6" stroke="#080910" stroke-width="3"/><text x="${cx}" y="${textY}" font-size="${font}" text-anchor="middle" dominant-baseline="middle" fill="#080910" font-family="Arial, sans-serif" font-weight="700">${rows.map((r,i)=>`<tspan x="${cx}" dy="${i?lh:0}">${e(r)}</tspan>`).join('')}</text></g>`;
}
function frame(id,key,side='',split=false){
 const file=`assets/${id}.jpg`;if(!fs.existsSync(path.join(out,file)))throw Error('Image manquante '+file);
 const data=lines[key];if(!Array.isArray(data))throw Error('Dialogue manquant '+key);
 const boxes=mappings[key]||[];if(boxes.length!==data.length)throw Error('Bulles manquantes '+key);
 const svg=data.map((a,i)=>balloon(a,boxes[i],`${key}-${i}`)).join('');
 return `<div class="frame ${side}" data-panel="${key}"><img src="${file}" alt="${e(id)}"><svg class="letters" viewBox="0 0 ${split?500:1000} 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${svg}</svg></div>`;
}
let pages='';for(let n=9;n<=21;n++){let num=String(n).padStart(2,'0'),rows='';for(let i=1;i<=3;i++){const id=`p${num}-c0${i}`,key=`${num}-${i}`;if(key==='13-2'){rows+=`<div class="row split">${frame(id,key,'left',true)}${frame(id,key+'-detail','right',true)}</div>`;continue}if(key==='11-3'){rows+=`<div class="row split">${frame('p11-c03a','11-3a','',true)}${frame('p11-c03b','11-3b','',true)}</div>`;continue}if(key==='18-1'){rows+=`<div class="row split">${frame('p18-c01','18-1','right',true)}${frame('p18-c01-after','18-after','right',true)}</div>`;continue}rows+=`<div class="row">${frame(id,key)}</div>`}pages+=`<section class="sheet" id="page-${n}"><header><span>BLUE PURPLE</span><span>CHAPITRE 3</span><b>${num}</b></header><main>${rows}</main><footer><span>LA NUIT · NIGHT CITY</span><span>${num} / 21</span></footer></section>`}
const css=`*{box-sizing:border-box}html,body{margin:0;background:#111724;color:#fff}body{font-family:Arial,sans-serif}.sheet{width:1200px;height:1920px;padding:24px 32px 20px;background:#080b13;display:flex;flex-direction:column;overflow:hidden;break-after:page}.sheet:last-child{break-after:auto}header,footer{display:flex;align-items:center;justify-content:space-between;letter-spacing:.14em;font-size:15px;font-weight:700;color:#80deea;height:38px;flex:none}header b{font-size:26px;color:#fff}footer{height:30px;color:#798b9d;font-size:12px}main{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}.row{display:flex;gap:10px;flex:1;min-height:0;justify-content:center}.frame{width:96%;min-width:0;position:relative;background:#050810;border:3px solid #e8f7f9;overflow:hidden}.split .frame{width:48%}.frame img{width:100%;height:100%;display:block;object-fit:cover;object-position:center}.split .left img{object-position:0% center}.split .right img{object-position:100% center}.letters{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}@page{size:1200px 1920px;margin:0}@media screen{.sheet{margin:20px auto;box-shadow:0 4px 24px #0008}}@media print{html,body{margin:0;background:#080b13}.sheet{margin:0;box-shadow:none}}`;
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Blue Purple — comics revue 5</title><style>${css}</style></head><body>${pages}</body></html>`);console.log('13 planches lettrées avec bulles et queues');



