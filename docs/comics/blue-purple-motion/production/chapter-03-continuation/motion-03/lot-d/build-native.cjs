/* Authored masks, rigid source pixels, two independent door planes and gravity. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
let root=__dirname;while(!fs.existsSync(path.join(root,'AGENTS.md')))root=path.dirname(root);
const lot=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-d');
const version=process.argv[2]??'1';const output=path.join(lot,'assets-v'+version);
if(fs.existsSync(output))throw Error('Nouveau dossier assets requis.');fs.mkdirSync(output,{recursive:true});
const masksFile=path.join(__dirname,'ASSET-MASKS-v'+version+'.json'),masks=JSON.parse(fs.readFileSync(masksFile,'utf8'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const uri=file=>'data:image/'+(path.extname(file)==='.jpg'?'jpeg':path.extname(file)==='.svg'?'svg+xml':'png')+';base64,'+fs.readFileSync(file).toString('base64');
const input={},letteringSources=[];for(const n of [18,19,20,21]){const file=path.join(root,`anime/motion-comics/projects/blue-purple-page${n}-motion04.json`),d=JSON.parse(fs.readFileSync(file,'utf8'));input['art'+n]=uri(path.resolve(path.dirname(file),d.motionBaseImage));if(masks.restoreMasterLettering){const letters=path.resolve(path.dirname(file),d.letteringImage),master=path.resolve(path.dirname(file),d.image);input['letters'+n]=uri(letters);input['master'+n]=uri(master);letteringSources.push({page:n,svg:path.relative(root,letters),svgSha256:sha(letters),approvedMaster:path.relative(root,master),approvedMasterSha256:sha(master),method:'SVG alpha with opaque RGB restored from approved master; editable SVG preserved.'});}}
for(const [key,file]of Object.entries({water:'water-clean-v1.png',closed:'door-closed-clean-v1.png',empty:'door-empty-interior-v1.png',unlocked:'lock-retracted-v1.png'}))input[key]=uri(path.join(lot,'native',file));
if(masks.alphaSource)input.alpha=uri(path.join(lot,'native',masks.alphaSource));
if(masks.waterImpactSource)input.impact=uri(path.join(lot,'native',masks.waterImpactSource));
const report={status:'running',masks:path.relative(root,masksFile),masksSha256:sha(masksFile),output:path.relative(root,output),files:[],physics:{releaseAfterReady:.55,waterImpactAfterReady:1.02,submergedAfterReady:1.42,gravityPixelsPerSecondSquared:1400,initialVerticalVelocity:-40,initialVerticalOffset:-150,horizontalVelocity:420,waterPlaneY:760},door:{startsAfterReady:1.10,fullyOpenAfterReady:2.65,degrees:78},lock:{startsAfterReady:.8,closedAfterReady:1.35}};
report.letteringSources=letteringSources;
const write=()=>fs.writeFileSync(path.join(__dirname,'ASSETS-v'+version+'.json'),JSON.stringify(report,null,2)+'\n');write();
if(masks.alphaSource)Object.assign(report.physics,{releaseAfterReady:masks.fallReleaseAfterReady,waterImpactAfterReady:masks.fallReleaseAfterReady+masks.waterImpactAfterLayer,submergedAfterReady:masks.fallReleaseAfterReady+masks.submergedAfterLayer,alphaSource:masks.alphaSource,generatedRgbUsed:false});
(async()=>{let browser;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.HOLT_BROWSER??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage();
 const images=await page.evaluate(async({input,masks})=>{
  const images={};await Promise.all(Object.entries(input).map(async([key,src])=>{const image=new Image();image.src=src;await image.decode();images[key]=image;}));
  const canvas=(w=1000,h=496)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const crop=(image,x,y,w=1000,h=496)=>{const c=canvas(w,h);c.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);return c;};
  const scale=1000/1774,offsetY=(496-887*scale)/2;
  const point=p=>[p[0]*scale,p[1]*scale+offsetY],poly=p=>p.map(point);
  const cover=image=>{const c=canvas();c.getContext('2d').drawImage(image,0,offsetY,1000,887*scale);return c;};
  const clip=(ctx,points)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.clip();};
  const drawMask=(target,source,points)=>{const c=target.getContext('2d');c.save();clip(c,points);c.drawImage(source,0,0);c.restore();};
  const result={};const save=(name,c)=>result[name]=c.toDataURL().split(',')[1];
  const sdfOriginal=crop(images.art20,12,1028),water=cover(images.water),clean=canvas();clean.getContext('2d').drawImage(sdfOriginal,0,0);drawMask(clean,water,poly(masks.waterReplace));save('water-background.png',clean);
  const sprite=canvas(),sc=sprite.getContext('2d');
  if(images.alpha){sc.drawImage(sdfOriginal,0,0);sc.globalCompositeOperation='destination-in';sc.drawImage(cover(images.alpha),0,0);sc.globalCompositeOperation='source-over';
   if(masks.alphaNoiseThreshold){const pixels=sc.getImageData(0,0,1000,496);for(let y=0;y<496;y++)for(let x=0;x<1000;x++){const i=(y*1000+x)*4;if(pixels.data[i+3]<masks.alphaNoiseThreshold||x<1080*scale||x>1665*scale||y<410*scale+offsetY||y>800*scale+offsetY)pixels.data[i+3]=0;}sc.putImageData(pixels,0,0);}}
  else {sc.save();clip(sc,poly(masks.sdfOutline));sc.drawImage(sdfOriginal,0,0);sc.restore();}save('sdf-rigid.png',sprite);
  const maskView=canvas();const mc=maskView.getContext('2d');mc.drawImage(sdfOriginal,0,0);mc.strokeStyle='#ffff00';mc.lineWidth=1.2;mc.beginPath();mc.moveTo(...poly(masks.sdfOutline)[0]);for(const p of poly(masks.sdfOutline).slice(1))mc.lineTo(...p);mc.closePath();mc.stroke();save('sdf-mask-review.png',maskView);
  const zoom=canvas(1400,950),zc=zoom.getContext('2d');zc.drawImage(maskView,580,220,420,276,0,0,1400,920);save('sdf-mask-detail.png',zoom);
  const splash=(ctx,age)=>{
   if(age<0||age>1.2)return;const p=age/1.2,cx=1380*scale,cy=760*scale+offsetY;
   if(images.impact){
    const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    const opacity=age<.12?.25+.75*smooth(age/.12):1-smooth((age-.12)/1.08);
    ctx.save();clip(ctx,poly(masks.waterReplace));ctx.globalAlpha=opacity;ctx.drawImage(cover(images.impact),0,0);ctx.restore();
    ctx.save();ctx.translate(cx,cy);ctx.fillStyle='#d8f7ff';
    for(let i=0;i<16;i++){const angle=Math.PI*(.1+.8*i/15),v=45+(i*31%60),t=age;
     const x=Math.cos(angle)*v*t*2.2*scale,y=-Math.sin(angle)*v*t*2.2*scale+150*t*t*scale;
     ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=Math.max(0,1-age)*.75;ctx.beginPath();ctx.ellipse(0,0,1.0*scale,(2.3+i%3)*scale,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.restore();return;
   }
   const strength=Math.sin(Math.PI*Math.min(1,p*1.5))*(1-p*.65);
   if(strength<=0)return;ctx.save();ctx.translate(cx,cy);ctx.globalAlpha=strength;
   ctx.fillStyle='#d5f5ff';ctx.strokeStyle='#43b8d3';ctx.lineWidth=1;
   const width=(95+125*p)*scale,height=(80*Math.sin(Math.PI*Math.min(1,p*1.7))+15)*scale;
   ctx.beginPath();ctx.moveTo(-width,6);
   for(let i=0;i<=12;i++){const u=i/12,x=-width+u*2*width,r=.35+.65*((i*7)%11)/10;ctx.lineTo(x,-height*r*(i%2?1:.25));}
   ctx.lineTo(width,8);ctx.quadraticCurveTo(0,25,-width,6);ctx.fill();ctx.stroke();
   ctx.strokeStyle='#f2fcff';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(0,8,width*1.08,Math.max(3,14*scale*(.5+p)),0,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<18;i++){const angle=Math.PI*(.10+.8*i/17),v=40+(i*31%65),t=age;const x=Math.cos(angle)*v*t*3*scale,y=-Math.sin(angle)*v*t*3*scale+140*t*t*scale;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.ellipse(0,0,(1.3+i%2)*scale,(3+i%4)*scale,0,0,Math.PI*2);ctx.fill();ctx.restore();}
   ctx.restore();
  };
  for(const [index,time]of masks.fallRelativeTimes.entries()){
   const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(clean,0,0);const t=Math.max(0,time-(masks.alphaSource?0:.55));
   if(masks.splashBehindBody)splash(ctx,time-(masks.waterImpactAfterLayer??1.02));
   if(time<(masks.submergedAfterLayer??1.42)){ctx.save();ctx.beginPath();ctx.rect(0,0,1000,760*scale+offsetY);ctx.clip();
    const x=(-200+420*t)*scale,y=(-150-40*t+700*t*t)*scale,pivot=[1380*scale,625*scale+offsetY];
    ctx.translate(pivot[0]+x,pivot[1]+y);ctx.rotate((-10+32*t)*Math.PI/180);ctx.drawImage(sprite,-pivot[0],-pivot[1]);ctx.restore();}
   if(!masks.splashBehindBody)splash(ctx,time-(masks.waterImpactAfterLayer??1.02));save(`fall-${String(index).padStart(2,'0')}.png`,c);
  }
  // A real 2D projective door object. No character or limb enters the texture warp.
  const doorOriginal=crop(images.art21,12,12),closed=cover(images.closed),empty=cover(images.empty),doorTexture=canvas();doorTexture.getContext('2d').drawImage(doorOriginal,0,0);drawMask(doorTexture,closed,poly(masks.abigail));save('door-texture-clean.png',doorTexture);
  const actor=canvas();drawMask(actor,doorOriginal,poly(masks.abigail));save('abigail-original.png',actor);
  const actorReview=canvas();const ar=actorReview.getContext('2d');ar.drawImage(doorOriginal,0,0);ar.strokeStyle='#ffff00';ar.lineWidth=1.2;ar.beginPath();ar.moveTo(...poly(masks.abigail)[0]);for(const p of poly(masks.abigail).slice(1))ar.lineTo(...p);ar.closePath();ar.stroke();save('abigail-mask-review.png',actorReview);
  const triangle=(ctx,image,s,d)=>{const [a,b,c]=s,[p,q,r]=d,den=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
   const aa=((q[0]-p[0])*(c[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/den,cc=((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(c[0]-a[0]))/den;
   const bb=((q[1]-p[1])*(c[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/den,dd=((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(c[0]-a[0]))/den;
   ctx.save();ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.lineTo(...r);ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,p[0]-aa*a[0]-cc*a[1],p[1]-bb*a[0]-dd*a[1]);ctx.drawImage(image,0,0);ctx.restore();};
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),bilinear=(quad,u,v)=>mix(mix(quad[0],quad[1],u),mix(quad[3],quad[2],u),v);
  const warp=(ctx,image,source,dest)=>{const nx=12,ny=12;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const uv=[[x/nx,y/ny],[(x+1)/nx,y/ny],[(x+1)/nx,(y+1)/ny],[x/nx,(y+1)/ny]];const s=uv.map(([u,v])=>bilinear(source,u,v)),d=uv.map(([u,v])=>bilinear(dest,u,v));triangle(ctx,image,[s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle(ctx,image,[s[0],s[2],s[3]],[d[0],d[2],d[3]]);}};
  const aperture=poly(masks.doorAperture),left=poly(masks.doorLeft),right=poly(masks.doorRight);
  for(const [index,degrees]of masks.doorDegrees.entries()){
   const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(doorOriginal,0,0);
   if(index){ctx.save();clip(ctx,aperture);ctx.drawImage(empty,0,0);const angle=degrees*Math.PI/180,s=Math.sin(angle),ratio=Math.cos(angle)/(1+.35*s);
    const ld=left.map(p=>[...p]),rd=right.map(p=>[...p]);
    ld[1]=[left[0][0]+(left[1][0]-left[0][0])*ratio,left[1][1]+48*scale*s];ld[2]=[left[3][0]+(left[2][0]-left[3][0])*ratio,left[2][1]-50*scale*s];
    rd[0]=[right[1][0]+(right[0][0]-right[1][0])*ratio,right[0][1]+48*scale*s];rd[3]=[right[2][0]+(right[3][0]-right[2][0])*ratio,right[3][1]-50*scale*s];
    warp(ctx,doorTexture,left,ld);warp(ctx,doorTexture,right,rd);
    ctx.strokeStyle='#080b10';ctx.lineWidth=2.2;for(const edge of [[ld[1],ld[2]],[rd[0],rd[3]]]){ctx.beginPath();ctx.moveTo(...edge[0]);ctx.lineTo(...edge[1]);ctx.stroke();}ctx.restore();
    // Restore immutable foreground from the exact selected PNG, including all fingers.
    ctx.drawImage(actor,0,0);
   }save(`door-${String(index).padStart(2,'0')}.png`,c);
  }
  const lockOriginal=crop(images.art18,12,520),unlocked=cover(images.unlocked),lockPatch=masks.lockPatch.map((v,i)=>v*scale+(i===1?offsetY:0)),bolt=masks.lockBolt.map((v,i)=>v*scale+(i===1?offsetY:0));
  for(const [index,time]of masks.lockRelativeTimes.entries()){
   const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(lockOriginal,0,0);const p=index===0?0:Math.min(1,Math.max(0,(time-.8)/.55));
   if(p<1){ctx.save();ctx.beginPath();ctx.rect(...lockPatch);ctx.clip();ctx.drawImage(unlocked,0,0);ctx.drawImage(lockOriginal,...bolt,bolt[0]-(1-p)*35*scale,bolt[1],bolt[2],bolt[3]);ctx.restore();
    for(const source of masks.lockHands){const box=source.map((v,i)=>v*scale+(i===1?offsetY:0));if(masks.restoreRigidPixels){const [x,y,w,h]=box,xx=Math.floor(x),yy=Math.floor(y);ctx.putImageData(lockOriginal.getContext('2d').getImageData(xx,yy,Math.ceil(x+w)-xx,Math.ceil(y+h)-yy),xx,yy);}else ctx.drawImage(lockOriginal,...box,...box);}
   }save(`lock-${String(index).padStart(2,'0')}.png`,c);
  }
  if(masks.lampRect){const [x,y,w,h]=masks.lampRect,on=crop(images.art21,x,y,w,h);save('lamp-on.png',on);const off=canvas(w,h),ctx=off.getContext('2d');ctx.filter='grayscale(1) brightness(.30)';ctx.drawImage(on,0,0);save('lamp-off.png',off);}
  if(masks.restoreMasterLettering)for(const n of [18,19,20,21]){const c=canvas(1024,1536),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(images['letters'+n],0,0);const letters=ctx.getImageData(0,0,1024,1536),master=canvas(1024,1536),mc=master.getContext('2d',{willReadFrequently:true});mc.drawImage(images['master'+n],0,0);const pixels=mc.getImageData(0,0,1024,1536).data;for(let i=0;i<letters.data.length;i+=4)if(letters.data[i+3]===255){letters.data[i]=pixels[i];letters.data[i+1]=pixels[i+1];letters.data[i+2]=pixels[i+2];}ctx.putImageData(letters,0,0);save('lettering-'+n+'.png',c);}
  return result;
 },{input,masks});
 for(const [name,data]of Object.entries(images)){const file=path.join(output,name);fs.writeFileSync(file,Buffer.from(data,'base64'),{flag:'wx'});report.files.push({file:path.relative(root,file).replaceAll('\\','/'),sha256:sha(file)});}
 // Editable clip definitions retain the actual raster pixels, not a colour-key cutout.
 for(const [id,points]of [['sdf',masks.sdfOutline],['abigail',masks.abigail],['water',masks.waterReplace],['door-aperture',masks.doorAperture]]){
  const file=path.join(output,id+'-mask.svg');const body=id==='sdf'&&masks.alphaSource?`<svg xmlns="http://www.w3.org/2000/svg" width="1774" height="887" viewBox="0 0 1774 887"><defs><mask id="sdf-alpha" style="mask-type:alpha"><image href="../native/${masks.alphaSource}" width="1774" height="887"/></mask></defs><image href="../../../comic-review-v5/assets/p20-c03.jpg" width="1774" height="887" mask="url(#sdf-alpha)"/></svg>`:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1774 887"><defs><clipPath id="${id}"><polygon points="${points.map(p=>p.join(',')).join(' ')}"/></clipPath></defs><polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ffde37" stroke-width="2"/></svg>`;fs.writeFileSync(file,body,{flag:'wx'});report.files.push({file:path.relative(root,file).replaceAll('\\','/'),sha256:sha(file)});
 }
 report.status='completed';write();console.info(JSON.stringify({status:report.status,assets:report.files.length,output}));
}catch(error){report.status='failed';report.error=error.stack;write();throw error;}finally{if(browser)await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
