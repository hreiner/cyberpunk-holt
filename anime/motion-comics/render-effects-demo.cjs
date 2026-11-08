const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
(async()=>{
 const out=path.resolve(process.argv[3]);if(fs.existsSync(out))throw Error('Dossier déjà présent.');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage();await page.goto(process.argv[2]);await page.waitForFunction(()=>window.motionComic?.duration>0&&!document.querySelector('#play').disabled);
  await page.evaluate(()=>window.motionComic.setRenderMode(true));
  for(let frame=0;frame<144;frame++){
   const encoded=await page.evaluate(frame=>{
    const api=window.motionComic,screen=document.querySelector('#screen');
    const c=document.createElement('canvas');c.width=1920;c.height=720;const ctx=c.getContext('2d');ctx.fillStyle='#080b18';ctx.fillRect(0,0,1920,720);
    const shot=frame<72?4:15,time=frame/24;
    for(let side=0;side<2;side++){
     api.setEffects(side===1);api.draw(shot,shot+time);
     ctx.drawImage(screen,230,24,1026,648,side*960+20,80,920,581);
     ctx.fillStyle=side?'#57e8ee':'#d0d5df';ctx.font='28px sans-serif';ctx.fillText(side?'APRÈS · ambiance animée':'AVANT · image fixe',side*960+30,48);
    }
    ctx.fillStyle='#a7b9d0';ctx.font='22px sans-serif';ctx.fillText(frame<72?'Néon et pluie dans la fenêtre':'Mèche de Wendy · yeux et bulles stables',30,700);
    return c.toDataURL('image/png').split(',')[1];
   },frame);
   fs.writeFileSync(path.join(out,`frame_${String(frame).padStart(4,'0')}.png`),Buffer.from(encoded,'base64'));
  }
 }finally{await browser.close();}
 const ffmpeg=path.resolve('art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
 const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-n','-framerate','24','-i',path.join(out,'frame_%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p',path.join(out,'avant-apres.mp4')],{encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr);console.log(path.join(out,'avant-apres.mp4'));
})().catch(e=>{console.error(e);process.exitCode=1});
