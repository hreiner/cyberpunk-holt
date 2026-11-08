const {chromium}=require('playwright');const {pathToFileURL}=require('node:url');const path=require('node:path'),fs=require('node:fs');
(async()=>{
const out='art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await browser.newPage({viewport:{width:1200,height:1920},deviceScaleFactor:1});await page.goto(pathToFileURL(path.resolve(out,'index.html')).href);await page.locator('img').evaluateAll(a=>Promise.all(a.map(i=>i.decode())));
const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'revision-05/DIALOGUE-FR.json'),'utf8').replace(/^\uFEFF/,''));
const report=await page.evaluate(expected=>{
const normalize=t=>t.trim().replace(/\s+/g,' '),issues=[];
for(const g of document.querySelectorAll('.balloon')){const svg=g.ownerSVGElement,view=svg.viewBox.baseVal;const ellipse=g.querySelector('.bubble-body').getBBox(),text=g.querySelector('text'),box=text.getBBox();if(ellipse.x<-.5||ellipse.y<-.5||ellipse.x+ellipse.width>view.width+.5||ellipse.y+ellipse.height>view.height+.5)issues.push({kind:'balloon-outside-image',key:g.dataset.key});if(box.x<ellipse.x||box.x+box.width>ellipse.x+ellipse.width||box.y<ellipse.y||box.y+box.height>ellipse.y+ellipse.height)issues.push({kind:'text-outside-balloon-bounds',key:g.dataset.key});const key=g.closest('.frame').dataset.panel,i=Number(g.dataset.key.split('-').at(-1));if(normalize([...text.querySelectorAll('tspan')].map(x=>x.textContent).join(' '))!==normalize(expected[key][i].text))issues.push({kind:'dialogue-mismatch',key:g.dataset.key});}
return {pages:document.querySelectorAll('.sheet').length,images:[...document.images].filter(x=>x.naturalWidth>0).length,dialogues:document.querySelectorAll('.balloon').length,aboveImageCartouches:document.querySelectorAll('.who,.letters:not(svg)').length,issues,overflow:[...document.querySelectorAll('.sheet')].map(x=>({id:x.id,scroll:x.scrollHeight,client:x.clientHeight})).filter(x=>x.scroll>x.client)};
},expected);
fs.writeFileSync(path.join(out,'technical-report.json'),JSON.stringify(report,null,2));if(report.pages!==13||report.images!==42||report.dialogues!==62||report.aboveImageCartouches||report.issues.length||report.overflow.length)throw Error(JSON.stringify(report));
for(let n=9;n<=21;n++)await page.locator(`#page-${n}`).screenshot({path:`${out}/page-${n}.png`});fs.mkdirSync('output/pdf',{recursive:true});await page.pdf({path:'output/pdf/blue-purple-chapitre-3-revue-v5.pdf',width:'1200px',height:'1920px',printBackground:true,preferCSSPageSize:true});console.log(JSON.stringify(report));}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});



