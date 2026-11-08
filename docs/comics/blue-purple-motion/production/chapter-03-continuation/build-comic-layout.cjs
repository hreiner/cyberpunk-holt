const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../../..');
const art=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation');
const lines=JSON.parse(fs.readFileSync(path.join(__dirname,'DIALOGUE-FR.json'),'utf8').replace(/^\uFEFF/,''));
const selected={'12-2':'fix01','14-2':'fix01','15-2':'fix01','15-3':'fix01','16-1':'fix01','19-1':'fix01','21-3':'fix01'};
const e=x=>String(x).trim().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let pages='';
for(let n=9;n<=21;n++){
  const num=String(n).padStart(2,'0');let frames='';
  for(let i=1;i<=3;i++){
    const key=`${num}-${i}`,id=`p${num}-c0${i}`,rel=id==='p09-c01'?'p09-c01-v2/native.png':`${id}/${selected[key]||'attempt-01'}/native.png`;
    if(!fs.existsSync(path.join(art,rel)))throw new Error('Missing '+rel);
    const text=(lines[key]||[]).map(a=>`<div class="balloon"><span class="who">${e(a.speaker)}</span><span>${e(a.text)}</span></div>`).join('');
    const map=key==='09-2'?`<svg class="map" viewBox="0 0 1774 887"><path d="M410 161 L832 130 L884 480 L488 535 Z" fill="#092d43" opacity=".92"/><path d="M465 237 L780 196 M454 286 L820 250 M473 340 L838 313 M497 405 L849 378 M533 183 L556 499 M638 168 L655 480 M737 153 L759 467" stroke="#298ca4" stroke-width="5"/><circle cx="703" cy="302" r="16" fill="#ff477d"/><circle cx="703" cy="302" r="29" fill="none" stroke="#ffb0c8" stroke-width="4"/></svg>`:'';
    if(!fs.existsSync(path.join(art,'comic-review-v1','assets',`${id}.jpg`)))throw new Error('Image de lecture absente : '+id);
    frames+=`<div class="frame"><div class="letters">${text}</div><div class="picture"><img src="assets/${id}.jpg">${map}</div></div>`;
    if(key==='18-1')frames+=`<div class="frame extra"><div class="letters"></div><div class="picture"><img src="assets/p18-c01-after.jpg"></div></div>`;
  }
  pages+=`<section class="sheet${n===18?' four':''}" id="page-${n}"><header><span>BLUE PURPLE</span><span>CHAPITRE 3 · REVUE</span><b>${num}</b></header><main>${frames}</main><footer><span>LA NUIT · NIGHT CITY</span><span>${num} / 21</span></footer></section>`;
}
const css=`*{box-sizing:border-box}html,body{margin:0;background:#111724;color:#fff}body{font-family:Arial,sans-serif}.sheet{width:1200px;height:1920px;padding:25px 32px 20px;background:#080b13;display:flex;flex-direction:column;overflow:hidden;page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto;break-after:auto}header,footer{display:flex;align-items:center;justify-content:space-between;letter-spacing:.14em;font-size:15px;font-weight:700;color:#80deea;height:38px}header b{font-size:26px;color:#fff}footer{height:30px;color:#798b9d;font-size:12px}main{flex:1;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;gap:10px}.frame{width:94%;background:#101622;border:3px solid #e8f7f9;overflow:hidden}.picture{position:relative}.picture img{width:100%;height:auto;display:block}.map{position:absolute;inset:0;width:100%;height:100%}.letters{min-height:52px;display:flex;align-items:center;gap:14px;padding:5px 10px;background:#141c29}.letters:empty{display:none}.balloon{display:flex;align-items:baseline;gap:12px;background:white;color:#111a24;border:2px solid #fff;border-radius:18px;padding:7px 15px;font-size:25px;line-height:1.12;font-weight:600;max-width:100%}.who{font-size:14px;letter-spacing:.05em;color:#a5235c;text-transform:uppercase;font-weight:800;white-space:nowrap}.four main{align-items:center}.four .frame{width:70%}.four .balloon{font-size:21px}.four .letters{min-height:42px;padding:3px 8px}@page{size:1200px 1920px;margin:0}@media screen{.sheet{margin:20px auto;box-shadow:0 4px 24px #0008}}@media print{html,body{margin:0;background:#080b13}.sheet{margin:0;box-shadow:none}}`;
const out=path.join(art,'comic-review-v1');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Blue Purple — planches de revue</title><style>${css}</style></head><body>${pages}</body></html>`,'utf8');console.log('13 pages HTML créées : '+out);

