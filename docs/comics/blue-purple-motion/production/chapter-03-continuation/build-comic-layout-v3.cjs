const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../../..');
const art=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation');
const lines=JSON.parse(fs.readFileSync(path.join(__dirname,'revision-03','DIALOGUE-FR.json'),'utf8').replace(/^\uFEFF/,''));
const e=x=>String(x).trim().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function frame(id,key,side=''){
  const file=`assets/${id}.jpg`;if(!fs.existsSync(path.join(art,'comic-review-v3',file)))throw Error('Image manquante '+file);
  if(!Array.isArray(lines[key]))throw Error('Dialogue manquant '+key);
  const text=lines[key].map(a=>`<div class="balloon"><span class="who">${e(a.speaker)}</span><span>${e(a.text)}</span></div>`).join('');
  return `<div class="frame ${side}"><div class="letters">${text}</div><div class="picture"><img src="${file}" alt="${e(id)}"></div></div>`;
}
let pages='';for(let n=9;n<=21;n++){
 let num=String(n).padStart(2,'0'), rows='';
 for(let i=1;i<=3;i++){
   const id=`p${num}-c0${i}`,key=`${num}-${i}`;
   if(key==='10-2'||key==='13-2'){rows+=`<div class="row split">${frame(id,key,'left')}${frame(id,key+'-detail','right')}</div>`;continue;}
   if(key==='11-3'){rows+=`<div class="row split">${frame('p11-c03a','11-3a')}${frame('p11-c03b','11-3b')}</div>`;continue;}
   if(key==='18-1'){rows+=`<div class="row split">${frame('p18-c01','18-1','right')}${frame('p18-c01-after','18-after','right')}</div>`;continue;}
   rows+=`<div class="row">${frame(id,key)}</div>`;
 }
 pages+=`<section class="sheet" id="page-${n}"><header><span>BLUE PURPLE</span><span>CHAPITRE 3 · REVUE 3</span><b>${num}</b></header><main>${rows}</main><footer><span>LA NUIT · NIGHT CITY</span><span>${num} / 21</span></footer></section>`;
}
const css=`*{box-sizing:border-box}html,body{margin:0;background:#111724;color:#fff}body{font-family:Arial,sans-serif}.sheet{width:1200px;height:1920px;padding:24px 32px 20px;background:#080b13;display:flex;flex-direction:column;overflow:hidden;break-after:page}.sheet:last-child{break-after:auto}header,footer{display:flex;align-items:center;justify-content:space-between;letter-spacing:.14em;font-size:15px;font-weight:700;color:#80deea;height:38px;flex:none}header b{font-size:26px;color:#fff}footer{height:30px;color:#798b9d;font-size:12px}main{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}.row{display:flex;gap:10px;flex:1;min-height:0;justify-content:center}.frame{width:96%;min-width:0;display:flex;flex-direction:column;background:#101622;border:3px solid #e8f7f9;overflow:hidden}.split .frame{width:48%}.picture{flex:1;min-height:0;background:#050810}.picture img{width:100%;height:100%;display:block;object-fit:contain}.split .picture img{object-fit:cover;object-position:center}.split .left img{object-position:0% center}.split .right img{object-position:100% center}.letters{min-height:0;display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap;padding:6px 8px;background:#141c29;flex:none}.letters:empty{display:none}.balloon{display:flex;align-items:baseline;gap:9px;background:#fff;color:#111a24;border:2px solid #111;border-radius:24px;padding:8px 14px;font-size:23px;line-height:1.14;font-weight:700;max-width:100%}.who{font-size:12px;letter-spacing:.05em;color:#a5235c;text-transform:uppercase;font-weight:800;white-space:nowrap}.split .balloon{font-size:20px}@page{size:1200px 1920px;margin:0}@media screen{.sheet{margin:20px auto;box-shadow:0 4px 24px #0008}}@media print{html,body{margin:0;background:#080b13}.sheet{margin:0;box-shadow:none}}`;
const out=path.join(art,'comic-review-v3');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Blue Purple — planches revue 3</title><style>${css}</style></head><body>${pages}</body></html>`,'utf8');console.log('13 planches de revue');

