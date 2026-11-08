/* Targeted real-reader review; material pulses are judged at peaks as well as endpoints. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../../../../../../..');
const contracts=JSON.parse(fs.readFileSync(path.join(__dirname,'CONTRACTS.json'),'utf8'));
const output=path.resolve(process.argv[3]??path.join(ROOT,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-a/qa-v1'));
const input=process.argv[2]??'http://127.0.0.1:50936/anime/motion-comics/reader.html?manifest=/docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/lot-a/CANDIDATES.json';
const filterIndex=process.argv.indexOf('--page'),pageFilter=filterIndex<0?null:Number(process.argv[filterIndex+1]);
if(fs.existsSync(output))throw Error('Dossier QA existant préservé ; employer une nouvelle version.');
fs.mkdirSync(output,{recursive:true});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),rel=file=>path.relative(ROOT,file).replaceAll('\\','/');
const report={status:'running',startedAt:new Date().toISOString(),input,pageFilter,contractsSha256:sha(path.join(__dirname,'CONTRACTS.json')),engineHashes:Object.fromEntries(['core.js','effects.js','layers.js','reader.js'].map(f=>[f,sha(path.join(ROOT,'anime/motion-comics',f))])),cases:[],pages:[],clip:null};
const write=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');write();
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(input);await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
  await page.evaluate(()=>{window.motionComic.pause();window.motionComic.setRenderMode(true);window.motionComic.setEffects(true);});
  const pages=await page.evaluate(()=>window.motionComic.pages);
  for(const contract of contracts.pages.filter(p=>pageFilter===null||p.page===pageFilter)){
   const number=contract.page,selected=pages.find(p=>p.id===`page-${String(number).padStart(2,'0')}`);assert(selected);
   const cases=contracts.cases.filter(c=>c.page===number),contactRows=[];
   for(const entry of cases){
    const baseKey=entry.key.split(' ')[0],panelKey=baseKey,side=entry.key.includes('gauche')?'left':entry.key.includes('droite')?'right':null;
    const result=await page.evaluate(async({selected,entry,panelKey,side})=>{
     const api=window.motionComic;api.seek(selected.start+entry.proofTimes[0]);api.draw(selected.start+entry.proofTimes[0],selected.start+entry.proofTimes[0]);
     const manifest=api.manifest,panel=manifest.panels.find(p=>p.panelKey===panelKey);if(!panel)throw Error('Case inconnue '+panelKey);
     let rect=panel.rect.map((v,i)=>Math.round(v*(i%2?1536:1024)));
     if(side){if(panelKey==='10-3')rect=side==='left'?[12,1028,620,496]:[632,1028,380,496];else rect=side==='left'?[12,520,506,496]:[518,520,494,496];}
     const pixels=canvas=>new Uint8ClampedArray(canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height).data);
     const crop=canvas=>{const c=document.createElement('canvas');c.width=rect[2];c.height=rect[3];c.getContext('2d').drawImage(canvas,...rect,0,0,c.width,c.height);return c;};
     const equals=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
     for(let warm=0;warm<3;warm++){api.draw(selected.start+entry.proofTimes[0],selected.start+entry.proofTimes[0]);pixels(api.pageCanvas);}
     const shots=[],bytes=[];
     for(const local of entry.proofTimes){const global=selected.start+local;api.seek(global);api.draw(global,global);const c=crop(api.pageCanvas);bytes.push(pixels(c));shots.push({localTime:local,png:c.toDataURL('image/png').split(',')[1]});}
     const diffs=bytes.slice(1).map((b,index)=>{const a=bytes[index];let changed=0,over15=0,max=0;for(let i=0;i<a.length;i+=4){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));if(d)changed++;if(d>15)over15++;max=Math.max(max,d);}return{changedPixels:changed,changedPixelsOver15:over15,maximumDifference:max};});
     const heldTime=selected.start+entry.proofTimes.at(-1);api.seek(heldTime);api.draw(heldTime,heldTime);const held=pixels(api.pageCanvas);api.draw(heldTime,heldTime+.7);const later=pixels(api.pageCanvas);
     let rigidChanged=0,rigidPixels=0;
     for(const region of manifest.protectedRegions??[]){const [x,y,w,h]=region.rect.map((v,i)=>v*(i%2?1536:1024));const left=Math.max(rect[0],Math.ceil(x)),top=Math.max(rect[1],Math.ceil(y)),right=Math.min(rect[0]+rect[2],Math.floor(x+w)),bottom=Math.min(rect[1]+rect[3],Math.floor(y+h));
      for(let py=top;py<bottom;py++)for(let px=left;px<right;px++){const i=(py*1024+px)*4;rigidPixels++;if([0,1,2,3].some(k=>held[i+k]!==later[i+k]))rigidChanged++;}}
     const stamp=selected.start+entry.proofTimes[Math.floor(entry.proofTimes.length/2)];api.draw(stamp,stamp);const first=pixels(crop(api.pageCanvas));api.draw(stamp,stamp);const second=pixels(crop(api.pageCanvas));
     const deterministic=equals(first,second);api.seek(selected.start);api.draw(stamp,stamp);const sought=pixels(crop(api.pageCanvas)),seekExact=equals(second,sought);
     return{rect,shots,diffs,rigidChangedPixels:rigidChanged,rigidCheckedPixels:rigidPixels,deterministic,seekExact,manifestPanelId:panel.id};
    },{selected,entry,panelKey,side});
    const stem=entry.key.replace(/[^a-zA-Z0-9_-]/g,'_'),shots=[];
    for(const [i,shot]of result.shots.entries()){const file=`p${number}-${stem}-phase-${i}.png`;fs.writeFileSync(path.join(output,file),Buffer.from(shot.png,'base64'));shots.push({file,localTime:shot.localTime});}
    contactRows.push({key:entry.key,intention:entry.intention,a:result.shots[0].png,b:result.shots[1].png});
    const passed=result.diffs.some(d=>d.changedPixelsOver15>0)&&result.rigidChangedPixels===0&&result.deterministic&&result.seekExact;
    report.cases.push({...entry,shots,rect:result.rect,diffs:result.diffs,rigidChangedPixels:result.rigidChangedPixels,rigidCheckedPixels:result.rigidCheckedPixels,deterministic:result.deterministic,seekExact:result.seekExact,passed});write();
   }
   const pageProof=await page.evaluate(async({selected,rows})=>{
    const api=window.motionComic;const endTime=selected.end-.2;api.seek(endTime);api.draw(endTime,endTime);const active=api.manifest;
    const root=new URL(new URLSearchParams(location.search).get('manifest'),location.href),doc=api.document,entry=doc.pages.find(p=>p.id===selected.id),manifestUrl=new URL(entry.manifest,root);
    const master=new Image();master.src=new URL(active.image,manifestUrl);await master.decode();
    api.setEffects(false);api.draw(endTime,endTime);const c=document.createElement('canvas');c.width=1024;c.height=1536;c.getContext('2d').drawImage(master,0,0);const bytes=canvas=>canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,1024,1536).data;
    const expected=bytes(c),actual=bytes(api.pageCanvas);let offChanged=0;for(let i=0;i<actual.length;i+=4)if([0,1,2,3].some(k=>actual[i+k]!==expected[i+k]))offChanged++;
    api.setEffects(true);api.draw(endTime,endTime);const full=api.pageCanvas.toDataURL('image/png').split(',')[1];
    const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=50+rows.length*354;const ctx=sheet.getContext('2d');ctx.fillStyle='#080b13';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.fillStyle='#eefaff';ctx.font='bold 22px Arial';ctx.fillText(selected.id+' · phases de la production réelle',16,32);
    for(const [i,row]of rows.entries()){const y=50+i*354;ctx.font='bold 17px Arial';ctx.fillStyle='#a2e8f1';ctx.fillText(row.key+' · phase A / phase B',16,y+24);for(const [col,encoded]of [row.a,row.b].entries()){const im=new Image();im.src='data:image/png;base64,'+encoded;await im.decode();const scale=Math.min(616/im.width,308/im.height);ctx.drawImage(im,col*640+12+(616-im.width*scale)/2,y+38+(308-im.height*scale)/2,im.width*scale,im.height*scale);}}
    return{offChangedPixels:offChanged,full,sheet:sheet.toDataURL('image/png').split(',')[1]};
   },{selected,rows:contactRows});
   fs.writeFileSync(path.join(output,`page-${number}-pairs.png`),Buffer.from(pageProof.sheet,'base64'));fs.writeFileSync(path.join(output,`page-${number}-final.png`),Buffer.from(pageProof.full,'base64'));
   const candidate=path.join(ROOT,contract.candidate);report.pages.push({page:number,manifest:contract.candidate,sha256:sha(candidate),duration:selected.duration,offChangedPixels:pageProof.offChangedPixels,pairSheet:`page-${number}-pairs.png`,passed:pageProof.offChangedPixels===0});write();
  }
  // A compact mute clip is enough to assess the acquisition and material rhythms.
  const excerpts=[{page:9,key:'09-2',offset:-.08,seconds:1.7},{page:11,key:'11-3b',offset:-.18,seconds:1.0},{page:12,key:'12-2',offset:.15,seconds:1.9},{page:13,key:'13-1',offset:.35,seconds:1.0},{page:13,key:'13-2',offset:.3,seconds:1.1},{page:13,key:'13-2-detail',offset:.02,seconds:1.15}].filter(p=>pageFilter===null||p.page===pageFilter);
  const clipDir=path.join(output,'clip-frames');fs.mkdirSync(clipDir);let index=0;const clipTimes=[];
  for(const excerpt of excerpts){const p=pages.find(p=>p.id===`page-${String(excerpt.page).padStart(2,'0')}`),t=contracts.pages.find(p=>p.page===excerpt.page).panels.find(t=>t.key===excerpt.key);const start=p.start+t.ready+excerpt.offset,count=Math.round(excerpt.seconds*24);clipTimes.push({...excerpt,start,frames:count});
   for(let i=0;i<count;i++){const encoded=await page.evaluate(t=>{window.motionComic.seek(t);window.motionComic.draw(t,t);return document.querySelector('#screen').toDataURL('image/png').split(',')[1];},start+i/24);fs.writeFileSync(path.join(clipDir,`frame_${String(index++).padStart(5,'0')}.png`),Buffer.from(encoded,'base64'));}}
  const ff=path.join(ROOT,'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'),movie=path.join(output,'motion-preview.mp4');
  const encoded=spawnSync(ff,['-hide_banner','-v','error','-framerate','24','-i',path.join(clipDir,'frame_%05d.png'),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',movie],{encoding:'utf8'});if(encoded.status)throw Error(encoded.stderr);
  const decoded=spawnSync(ff,['-hide_banner','-v','error','-xerror','-i',movie,'-f','null','-'],{encoding:'utf8'});assert.equal(decoded.status,0,decoded.stderr);
  report.clip={file:rel(movie),sha256:sha(movie),frames:index,fps:24,seconds:index/24,muted:true,fullDecodeExit:decoded.status,excerpts:clipTimes};
  assert.deepEqual(errors,[]);report.pageErrors=errors;report.status=report.cases.every(c=>c.passed)&&report.pages.every(p=>p.passed)?'completed':'failed';report.finishedAt=new Date().toISOString();write();
  console.log(JSON.stringify({status:report.status,cases:report.cases.length,passedCases:report.cases.filter(c=>c.passed).length,output:rel(output),clip:report.clip.file}));if(report.status!=='completed')process.exitCode=1;
 }catch(error){report.status='failed';report.error=error.message;report.finishedAt=new Date().toISOString();write();throw error;}finally{if(browser)await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
