/* Preserve the approved comic: separate existing lettering, never redraw it. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../../../../..');
const source = path.join(root, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5');
const out = path.join(root, 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/art');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  fs.mkdirSync(out, {recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try {
    const page = await browser.newPage({viewport:{width:1200,height:1920},deviceScaleFactor:1});
    await page.goto(pathToFileURL(path.join(source,'index.html')).href);
    await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    const pages=[];
    for (let n=9;n<=21;n++) {
      const selector=`#page-${n}`;
      const geometry=await page.locator(selector).evaluate(sheet=>{
        const bounds=sheet.getBoundingClientRect();
        const relative=b=>[b.x-bounds.x,b.y-bounds.y,b.width,b.height];
        const frames=[...sheet.querySelectorAll('.frame')].map(frame=>{
          const svg=frame.querySelector('svg'), image=frame.querySelector('img');
          return {key:frame.dataset.panel,rect:relative(frame.getBoundingClientRect()),imageRect:relative(image.getBoundingClientRect()),letteringRect:relative(svg.getBoundingClientRect()),imageSource:image.src,
            svg:svg.outerHTML,balloons:[...svg.querySelectorAll('.balloon')].map(balloon=>({key:balloon.dataset.key,speaker:balloon.dataset.speaker,rect:relative(balloon.getBoundingClientRect())}))};
        });
        const xml=new XMLSerializer();
        const content=frames.map((frame,i)=>{
          const svg=sheet.querySelectorAll('.letters')[i].cloneNode(true);
          const [x,y,w,h]=frame.letteringRect;
          svg.setAttribute('x',x);svg.setAttribute('y',y);svg.setAttribute('width',w);svg.setAttribute('height',h);
          svg.removeAttribute('class');svg.removeAttribute('style');
          return xml.serializeToString(svg);
        }).join('');
        return {page:Number(sheet.id.split('-')[1]),width:bounds.width,height:bounds.height,frames,
          lettering:`<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}">${content}</svg>`};
      });
      const number=String(n).padStart(2,'0');
      const master=path.join(source,`page-${n}.png`);
      geometry.master={file:path.relative(root,master).replaceAll('\\','/'),sha256:hash(master)};
      const svgFile=path.join(out,`page-${number}-lettering.svg`);
      fs.writeFileSync(svgFile,geometry.lettering);delete geometry.lettering;
      for(const frame of geometry.frames)delete frame.svg;
      await page.addStyleTag({content:`${selector} .letters{visibility:hidden}`});
      const base=path.join(out,`page-${number}-base.png`);
      await page.locator(selector).screenshot({path:base});
      geometry.base={file:path.relative(root,base).replaceAll('\\','/'),sha256:hash(base)};
      geometry.lettering={file:path.relative(root,svgFile).replaceAll('\\','/'),sha256:hash(svgFile)};
      const letters=await page.evaluate(async text=>{
        const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(text)));await image.decode();
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL().split(',')[1];
      },fs.readFileSync(svgFile,'utf8'));
      const letterPng=path.join(out,`page-${number}-lettering.png`);
      fs.writeFileSync(letterPng,Buffer.from(letters,'base64'));
      geometry.letteringRaster={file:path.relative(root,letterPng).replaceAll('\\','/'),sha256:hash(letterPng)};
      pages.push(geometry);
    }
    fs.writeFileSync(path.join(__dirname,'GEOMETRY.json'),JSON.stringify({sourceHtmlSha256:hash(path.join(source,'index.html')),pages},null,2));
    console.log(JSON.stringify({pages:pages.length,frames:pages.reduce((sum,p)=>sum+p.frames.length,0),out}));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
