/* Local motion-comics preview and deterministic MP4 export, page or sequence. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const { ROOT: root, inside, newDirectory } = require('./project.cjs');
const { readDocument } = require('./sequence.cjs');
const { musicVolumeExpression } = require('./sequence.js');
const core = require('./core.js');
const {stereoFilter}=require('./audio.cjs');
const args = process.argv.slice(2);
const serveOnly = args[0] === '--serve';
const manifestFile = path.resolve(serveOnly ? args[1] ?? '' : args[0] ?? '');
const output = !serveOnly && args[1] ? path.resolve(args[1]) : null;
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const ffmpeg = option('--ffmpeg', process.env.HOLT_FFMPEG ?? path.join(root,'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'));
const edge = option('--browser', process.env.HOLT_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const fps = Number(option('--fps', '24'));
if (!serveOnly && (!output || !Number.isInteger(fps) || fps<1 || fps>60)) throw Error('Usage : node render.cjs MANIFEST NOUVEAU_DOSSIER [--fps 24] [--ffmpeg CHEMIN] ; ou --serve MANIFEST');
const aliasFiles=new Set();
for(let index=0;index<args.length;index++)if(args[index]==='--alias'){
 const value=args[index+1];if(!value||value.startsWith('--'))throw Error('Nom de manifeste attendu après --alias.');
 aliasFiles.add(path.resolve(path.dirname(manifestFile),value));
}
const project=readDocument(manifestFile);
const runtimeFiles=['reader.html','reader.css','reader.js','core.js','effects.js','layers.js','sequence.js',
 'assets/holt-display.woff2','assets/holt-text.woff2'].map(file=>path.join(__dirname,file));
const engineFiles=[...runtimeFiles,...['render.cjs','project.cjs','sequence.cjs','audio.cjs','package.json'].map(file=>path.join(__dirname,file))];
const allowed=new Set([manifestFile,...runtimeFiles,...project.files]);
const mime={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.m4a':'audio/mp4','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
 try{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(inside(root,file)&&aliasFiles.has(file)){res.writeHead(307,{'Location':'/'+path.relative(root,manifestFile).split(path.sep).map(encodeURIComponent).join('/'),'Cache-Control':'no-store'});res.end();return;}
  if(!inside(root,file)||!allowed.has(file)){res.writeHead(403);res.end();return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  const stat=fs.statSync(file);if(!stat.isFile())throw Error();
  const headers={'Cache-Control':'no-store','Accept-Ranges':'bytes','Content-Type':mime[path.extname(file)]??'application/octet-stream'};
  let start=0,end=stat.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range.trim());
   const invalid=()=>{res.writeHead(416,{...headers,'Content-Range':`bytes */${stat.size}`});res.end();};
   if(!match||(!match[1]&&!match[2])||stat.size===0){invalid();return;}
   if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0){invalid();return;}start=Math.max(0,stat.size-suffix);}
   else{start=Number(match[1]);end=match[2]?Number(match[2]):end;}
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=stat.size||end<start){invalid();return;}
   end=Math.min(end,stat.size-1);status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
  if(req.method==='HEAD'||stat.size===0){res.end();return;}
  fs.createReadStream(file,{start,end}).pipe(res);
 }catch{res.writeHead(404);res.end('Fichier introuvable');}
});
function run(argv){const r=spawnSync(ffmpeg,argv,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.error||r.status!==0)throw Error(r.error?.message??r.stderr);return r;}
function writeSnapshot(){
 const thumbnailFiles=project.kind==='sequence'?project.data.pages.filter(page=>page.thumbnail).map(page=>path.resolve(path.dirname(manifestFile),page.thumbnail)):[];
 const media=[...new Set([...project.pages.flatMap(page=>page.files),...thumbnailFiles,...(project.musicFile?[project.musicFile]:[])])];
 fs.mkdirSync(path.join(output,'media'));
 const copied=new Map(media.map((file,index)=>[file,`media/${String(index).padStart(3,'0')}${path.extname(file)}`]));
 for(const [file,relative] of copied)fs.copyFileSync(file,path.join(output,relative),fs.constants.COPYFILE_EXCL);
 const snapshots=project.pages.map(page=>core.rebaseAssets(page.data,relative=>copied.get(path.resolve(path.dirname(page.manifestFile),relative))));
 let snapshot;
 if(project.kind==='sequence'){
  snapshot=structuredClone(project.data);
  snapshot.pages=snapshot.pages.map((page,index)=>{const relative=`page-${String(index+1).padStart(2,'0')}.json`;fs.writeFileSync(path.join(output,relative),JSON.stringify(snapshots[index],null,2),{flag:'wx'});return {...page,manifest:relative,...(page.thumbnail?{thumbnail:copied.get(path.resolve(path.dirname(manifestFile),page.thumbnail))}:{})};});
  if(snapshot.music)snapshot.music.audio=copied.get(project.musicFile);
 }else snapshot=snapshots[0];
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(snapshot,null,2),{flag:'wx'});
}
(async()=>{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(Number(option('--port','0')),'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 const relative=path.relative(root,manifestFile).split(path.sep).map(encodeURIComponent).join('/');
 const url=`${origin}/anime/motion-comics/reader.html?manifest=/${relative}`;
 if(serveOnly){console.log(url);return;}
 newDirectory(output);
 const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const report={status:'running',startedAt:new Date().toISOString(),kind:project.kind,source:manifestFile,sourceHash:hash(manifestFile),engineVersion:require('./package.json').version,engine:engineFiles.map(file=>({file:path.relative(root,file),sha256:hash(file)})),media:project.files.map(file=>({file:path.relative(root,file),sha256:hash(file)})),fps};
 const writeReport=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));writeReport();
 let browser;
 try{
  writeSnapshot();
  browser=await chromium.launch({headless:true,executablePath:edge});const page=await browser.newPage({viewport:{width:1400,height:900}});
  await page.goto(url);await page.waitForFunction(()=>window.motionComic?.duration>0&&document.querySelector('#play')?.disabled===false,null,{timeout:30000});
  await page.evaluate(async()=>{await window.motionComic.whenPageReady(0);window.motionComic.setRenderMode(true);window.motionComic.setEffects(true);});
  const state=await page.evaluate(()=>({duration:window.motionComic.duration,tracks:window.motionComic.tracks,segments:window.motionComic.segments,pages:window.motionComic.pages}));
  if(Math.abs(state.duration-project.timeline.duration)>0.000001)throw Error('La chronologie du lecteur diffère de celle de l’export.');
  const frames=path.join(output,'frames');fs.mkdirSync(frames);const count=Math.ceil(state.duration*fps);
  for(let i=0;i<count;i++){
   const data=await page.evaluate(async t=>{window.motionComic.seek(t);await window.motionComic.whenPageReady();return document.querySelector('#screen').toDataURL('image/png').split(',')[1];},i/fps);
   fs.writeFileSync(path.join(frames,`frame_${String(i).padStart(5,'0')}.png`),Buffer.from(data,'base64'));
   if(i%240===0)console.log(`Images : ${i+1}/${count}`);
  }
  await page.evaluate(async()=>{window.motionComic.seek(0);await window.motionComic.whenPageReady();});await page.locator('#screen').screenshot({path:path.join(output,'overview.png')});
  const argv=['-nostdin','-hide_banner','-loglevel','error','-n','-framerate',String(fps),'-i',path.join(frames,'frame_%05d.png')];
  const audioTracks=project.timeline.tracks;
  for(const track of audioTracks){const audio=track.audioFile??path.resolve(path.dirname(manifestFile),track.audio);if(!inside(root,audio)||!fs.existsSync(audio))throw Error(`Audio inaccessible : ${audio}`);argv.push('-i',audio);}
  if(project.musicFile){if(!project.data.music.preMixed)argv.push('-stream_loop','-1');argv.push('-i',project.musicFile);}
  const filters=audioTracks.map((t,i)=>`[${i+1}:a]atrim=duration=${t.end-t.start},asetpts=PTS-STARTPTS,${stereoFilter(t.audioFile??path.resolve(path.dirname(manifestFile),t.audio),ffmpeg)},adelay=${Math.round(t.start*1000)}:all=1[a${i}]`);
  const labels=audioTracks.map((_,i)=>`[a${i}]`);
  if(project.musicFile){filters.push(`[${audioTracks.length+1}:a]atrim=duration=${state.duration},asetpts=PTS-STARTPTS,${stereoFilter(project.musicFile,ffmpeg)},volume='${musicVolumeExpression(state.duration,project.data.music,audioTracks)}':eval=frame[bed]`);labels.push('[bed]');}
  if(labels.length){filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0,apad,atrim=duration=${state.duration}[audio]`);argv.push('-filter_complex',filters.join(';'),'-map','0:v','-map','[audio]','-c:a','aac','-ac','2','-b:a','192k');}
  argv.push('-t',String(state.duration),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,'motion-comic.mp4'));run(argv);
  const probe=spawnSync(ffmpeg,['-hide_banner','-i',path.join(output,'motion-comic.mp4')],{encoding:'utf8'});fs.writeFileSync(path.join(output,'metadata.txt'),probe.stderr??'');
  run(['-nostdin','-hide_banner','-loglevel','error','-i',path.join(output,'motion-comic.mp4'),'-f','null','-']);
  Object.assign(report,{status:'completed',finishedAt:new Date().toISOString(),duration:state.duration,frames:count,tracks:state.tracks,segments:state.segments,pages:state.pages,music:project.data.music??null,decoded:true,reader:url,output:path.join(output,'motion-comic.mp4')});writeReport();
  console.log(JSON.stringify({duration:state.duration,frames:count,output:path.join(output,'motion-comic.mp4')},null,2));
 }catch(error){Object.assign(report,{status:'failed',finishedAt:new Date().toISOString(),error:error.message});writeReport();throw error;}
 finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e.message);server.close();process.exitCode=1;});
