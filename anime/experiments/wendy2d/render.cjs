/* Animation 2D locale d'une image cible ; les objets vectoriels sont des couches
   synchronisées aux visèmes Rhubarb, pas une génération vidéo. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  const dest = path.resolve(process.argv[2] || 'art-masters/anime/experiments/wendy2d/frames-v1');
  if (fs.existsSync(dest)) throw new Error(`Destination déjà présente : ${dest}`);
  fs.mkdirSync(dest, { recursive: true });
  const image = fs.readFileSync('art-masters/anime/experiments/wendy2d/wendy-base.png').toString('base64');
  const cues = JSON.parse(fs.readFileSync('art-masters/anime/experiments/rhubarb/wendy-01.json', 'utf8')).mouthCues;
  const browser = await chromium.launch({headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page = await browser.newPage({viewport:{width:960,height:540}, deviceScaleFactor:1});
  await page.setContent('<canvas id="frame" width="960" height="540"></canvas>');
  await page.evaluate(async ({image,cues}) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + image; await img.decode();
    const c=document.querySelector('#frame'), ctx=c.getContext('2d');
    window.draw = (t) => {
      const scale=1.006+0.012*t/5.6;
      ctx.setTransform((960/1672)*scale,0,0,(540/941)*scale,-(960*(scale-1)*.50),-(540*(scale-1)*.44));
      ctx.drawImage(img,0,0);
      const cue = cues.find(cue=>t>=cue.start && t<cue.end)?.value || 'X';
      // The painted closed mouth is retained for rests and bilabials.
      if (!['A','X'].includes(cue)) {
        const cx=845, cy=424;
        // Sample nearby skin each frame, avoiding chin and the hair shadow.
        ctx.fillStyle='#f99544'; ctx.beginPath();ctx.ellipse(cx,cy,34,13,0,0,Math.PI*2);ctx.fill();
        // Soft upper lip and a dark mouth cavity, tailored to each viseme.
        const sizes={B:[23,4],C:[24,8],D:[23,12],E:[20,7],F:[12,9],G:[22,4],H:[22,9]};
        const [rx,ry]=sizes[cue]||sizes.C;
        ctx.fillStyle='#281221';ctx.beginPath();ctx.ellipse(cx,cy+1,rx,ry,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#3b1424';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(cx-rx-2,cy-1);ctx.quadraticCurveTo(cx,cy-ry-6,cx+rx+2,cy-1);ctx.stroke();
        if (['B','C','D','G'].includes(cue)) {ctx.fillStyle='#fff4dc';ctx.beginPath();ctx.ellipse(cx,cy-ry*.28,rx*.72,Math.max(1.5,ry*.27),0,0,Math.PI*2);ctx.fill();}
        if (['C','D','E','F','H'].includes(cue)) {ctx.fillStyle='#d86073';ctx.beginPath();ctx.ellipse(cx+1,cy+ry*.62,rx*.52,Math.max(1.5,ry*.25),0,0,Math.PI*2);ctx.fill();}
      }
      // Two intentionally brief blinks, with both irises covered by opaque eyelids.
      const pulse=(center)=>Math.max(0,1-Math.abs(t-center)/.095);
      const blink=Math.max(pulse(2.02),pulse(4.36));
      if (blink>.30) {
        ctx.fillStyle='#f99544';
        ctx.beginPath();ctx.ellipse(787,322,40,18*blink,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(907,322,26,18*blink,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#30131d';ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(750,322);ctx.quadraticCurveTo(784,330,821,322);ctx.stroke();
        ctx.beginPath();ctx.moveTo(882,322);ctx.quadraticCurveTo(906,330,932,321);ctx.stroke();
      }
      ctx.setTransform(1,0,0,1,0,0);
      return c.toDataURL('image/png').split(',')[1];
    };
  }, {image,cues});
  const fps=24, count=Math.ceil(5.6*fps);
  for(let i=0;i<count;i++) {
    const png=await page.evaluate(t=>window.draw(t),i/fps);
    fs.writeFileSync(path.join(dest,`frame_${String(i).padStart(4,'0')}.png`),Buffer.from(png,'base64'));
  }
  await browser.close();
  process.stdout.write(`${count} images en 24 i/s écrites dans ${dest}\n`);
}
main().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
