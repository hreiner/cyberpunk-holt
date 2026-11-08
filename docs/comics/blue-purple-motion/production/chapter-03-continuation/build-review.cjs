const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../../..');
const art = path.join(root, 'art-masters/motion-comics/blue-purple/chapter-03-continuation');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'DIALOGUE-FR.json'), 'utf8').replace(/^\uFEFF/, ''));
const esc = s => String(s).trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const selected = { '12-2':'fix01', '14-2':'fix01', '15-2':'fix01', '15-3':'fix01', '16-1':'fix01', '19-1':'fix01', '21-3':'fix01' };
let blocks = '';
for(let page=9;page<=21;page++) {
  let panels='';
  for(let i=1;i<=3;i++) {
    const key=`${String(page).padStart(2,'0')}-${i}`, id=`p${String(page).padStart(2,'0')}-c0${i}`;
    const rel=id==='p09-c01'?'p09-c01-v2/native.png':`${id}/${selected[key]||'attempt-01'}/native.png`;
    if(!fs.existsSync(path.join(art,rel))) throw Error(`Image absente : ${rel}`);
    if(!Array.isArray(data[key])) throw Error(`Texte absent : ${key}`);
    const speech=data[key].map(d=>`<div class="speech"><strong>${esc(d.speaker)}</strong><span>${esc(d.text)}</span></div>`).join('');
    const map=key==='09-2'?`<svg class="map" viewBox="0 0 1774 887" aria-label="Carte de la borne et destination"><path d="M410 161 L832 130 L884 480 L488 535 Z" fill="#092d43" opacity=".9"/><path d="M465 237 L780 196 M454 286 L820 250 M473 340 L838 313 M497 405 L849 378 M533 183 L556 499 M638 168 L655 480 M737 153 L759 467" stroke="#298ca4" stroke-width="5" opacity=".8"/><circle cx="703" cy="302" r="16" fill="#ff477d"/><circle cx="703" cy="302" r="29" fill="none" stroke="#ffb0c8" stroke-width="4"/></svg>`:'';
    panels+=`<figure><div class="picture"><img src="../${rel}" alt="Page ${page}, case ${i}">${map}</div>${speech?`<figcaption>${speech}</figcaption>`:''}</figure>`;
    if (key === '18-1') panels += '<figure><div class="picture"><img src="../p18-c01/after01/native.png" alt="Page 18, conséquence de la confrontation"></div></figure>';
  }
  blocks+=`<section class="page" id="page-${page}"><h2>PAGE ${page}</h2>${panels}</section>`;
}
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blue Purple — suite du chapitre 3</title><style>*{box-sizing:border-box}body{margin:0;background:#090d1b;color:#fff;font:18px system-ui,sans-serif}header{padding:2rem 1rem;text-align:center;background:linear-gradient(135deg,#251634,#063c50)}h1{margin:.3rem;font-size:clamp(2rem,5vw,3.5rem)}header p{color:#b9dbe2;max-width:45rem;margin:.8rem auto}.page{max-width:1050px;margin:2rem auto;padding:12px;background:#07090f;border:1px solid #294452}.page h2{font-size:.9rem;letter-spacing:.18em;color:#68deea;margin:2px 0 10px}figure{margin:0 0 12px;background:#101827}.picture{position:relative}.picture img{display:block;width:100%;height:auto}.map{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}figcaption{display:flex;gap:10px;flex-wrap:wrap;padding:10px;background:#131a2a}.speech{background:#fff;color:#141420;padding:9px 14px;border-radius:14px;max-width:90%;line-height:1.35}.speech strong{display:block;color:#a32361;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em}nav{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center}a{color:#8de8f2}footer{text-align:center;padding:2rem;color:#aabdc9}</style></head><body><header><h1>Blue Purple</h1><p>Suite du chapitre 3 — version statique de revue. Dessins et textes français séparés pour permettre les corrections.</p><nav>${Array.from({length:13},(_,i)=>`<a href="#page-${i+9}">${i+9}</a>`).join(' ')}</nav></header><main>${blocks}</main><footer>Fin du chapitre — refuge</footer></body></html>`;
const dir=path.join(art,'review-v1');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html,'utf8');console.log(`13 pages, 39 cases : ${path.join(dir,'index.html')}`);

