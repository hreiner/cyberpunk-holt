/* Lot D only. v9 is immutable; timing and physical anchors are shared contracts. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let root=__dirname;while(!fs.existsSync(path.join(root,'AGENTS.md')))root=path.dirname(root);
const core=require(path.join(root,'anime/motion-comics/core.js')),{getTiming}=require('../timing/retime.cjs');
const anchorsFile=path.join(__dirname,'ANCHORS.json'),anchors=JSON.parse(fs.readFileSync(anchorsFile,'utf8'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert.equal(sha(path.join(__dirname,'../timing/TIMING.json')),anchors.timingSha256);assert.equal(sha(path.join(__dirname,'../timing/retime.cjs')),anchors.helperSha256);
const assetFolder=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-d/assets-v5');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'ASSET-MASKS-v5.json'),'utf8'));
const manifestFolder=path.join(root,'anime/motion-comics/projects');
const rect=(x,y,w,h)=>[x/1024,y/1536,w/1024,h/1536];
const normalized=points=>points.map(p=>[p[0]/1024,p[1]/1536]);
const box=points=>{const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));return rect(x,y,Math.max(...points.map(p=>p[0]))-x,Math.max(...points.map(p=>p[1]))-y);};
const region=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const event=id=>anchors.anchors.find(a=>a.id===id).localSeconds;
const report={status:'building',timingSha256:anchors.timingSha256,anchorsSha256:sha(anchorsFile),engineVersion:require(path.join(root,'anime/motion-comics/package.json')).version,pages:[],cells:[]};
function draftWrite(file,body){if(fs.existsSync(file)){const old=fs.readFileSync(file,'utf8');if(old===body)return;const folder=path.join(__dirname,'drafts-v1');fs.mkdirSync(folder,{recursive:true});const backup=path.join(folder,path.basename(file));if(fs.existsSync(backup))assert.equal(fs.readFileSync(backup,'utf8'),old,'Une autre version existe ; ne pas écraser.');else fs.writeFileSync(backup,old,{flag:'wx'});fs.writeFileSync(file,body);}else fs.writeFileSync(file,body,{flag:'wx'});}
for(const number of [18,19,20,21]){
 const source=path.join(manifestFolder,`blue-purple-page${number}-motion04.json`),original=JSON.parse(fs.readFileSync(source,'utf8'));
 const timing=getTiming(original,number),data=timing.data,target=path.join(manifestFolder,`blue-purple-page${number}-motion06.json`);
 const relative=file=>path.relative(path.dirname(target),file).replaceAll('\\','/');
 const media=name=>relative(path.join(assetFolder,name));
 data.version=6;data.effects=[];data.motionLayers=[];data.panelReveals=[];data.storyThumbnail=true;
 data.letteringImage=media('lettering-'+number+'.png');
 const panel=key=>timing.panels.find(p=>p.key===key),dataPanel=key=>data.panels.find(p=>p.panelKey===key);
 const add=(key,type,points,options={},start,end)=>{const p=panel(key);data.effects.push({type,panelId:p.id,rect:box(points),clipPolygon:normalized(points),clock:'story',startSeconds:start??p.ready,endSeconds:end??p.end-.08,envelope:{attackSeconds:.22,releaseSeconds:.55},...options});};
 const physical=(key,id,prefix,times,start,end)=>data.motionLayers.push({id,panelId:dataPanel(key).id,mode:'frames',rect:[...dataPanel(key).rect],startSeconds:start,endSeconds:end??panel(key).end,frames:times.map((atSeconds,i)=>({atSeconds,image:media(`${prefix}-${String(i).padStart(2,'0')}.png`)}))});
 if(number===18){
  for(const key of ['18-after','18-2','18-3'])data.panelReveals.push({panelId:panel(key).id,atSeconds:panel(key).start});
  physical('18-2','bolt-slides-fingers-fixed','lock',config.lockRelativeTimes,panel('18-2').ready);
  data.protectedRegions=data.protectedRegions.filter(p=>p.id!=='18-3-rigid-1');
  data.protectedRegions.push({id:'18-3-grover-child-rigid',rect:rect(390,1130,350,390)},{id:'18-3-abigail-rigid',rect:rect(835,1120,162,400)});
  add('18-3','lightSweep',region(754,1479,72,31),{color:'#557a9a',strength:.35,amplitude:16,speed:.90,phase:-1.35,envelope:{attackSeconds:.45,releaseSeconds:1.10}},event('quietFloorSweep'),event('quietFloorSweep')+2.8);
 }else if(number===19){
  data.protectedRegions=data.protectedRegions.filter(p=>!['19-1-rigid-2','19-3-rigid-2'].includes(p.id));
  data.protectedRegions.push({id:'19-1-grover-body-rigid',rect:rect(744,175,190,330)},{id:'19-3-car-wendy-rigid',rect:rect(611,1056,390,442)});
  add('19-1','neon',[[940,136],[950,131],[950,499],[939,495]],{color:'#69d5f1',strength:.26,frequency:.28,phase:-1.10,softEdge:true,envelope:{attackSeconds:.35,releaseSeconds:.65}},event('doorSlitLight'),event('doorSlitLight')+1.85);
  add('19-2','reflection',region(54,605,135,355),{color:'#69aabb',strength:.24,frequency:.18,phase:-.45,softEdge:true,envelope:{attackSeconds:.9,releaseSeconds:1.5}},panel('19-2').ready,panel('19-2').end-.35);
  add('19-3','rain',[[265,1036],[380,1036],[387,1168],[345,1166]],{rainFlow:true,count:19,speed:.55,strength:.45,envelope:{attackSeconds:.25,releaseSeconds:.65}});
  add('19-3','neon',region(435,1191,37,31),{color:'#54ef93',strength:.38,frequency:.45,phase:-1.57,softEdge:true,envelope:{attackSeconds:.42,releaseSeconds:.65}},event('greenPointPulse'),event('greenPointPulse')+1.75);
  add('19-3','wave',[[771,1503],[926,1503],[1004,1522],[755,1522]],{color:'#72bfd0',strength:.35,amplitude:1.1,speed:.45,count:3});
 }else if(number===20){
  data.protectedRegions=data.protectedRegions.filter(p=>p.id!=='20-2-rigid-2');
  data.protectedRegions.push({id:'20-2-john-sdf-rigid',rect:rect(365,608,575,408)});
  add('20-1','wave',[[401,505],[654,454],[1011,428],[1011,507],[401,507]],{color:'#89cfdf',strength:.57,amplitude:3.2,speed:.55,count:5,envelope:{attackSeconds:.45,releaseSeconds:.65}});
  add('20-2','wave',[[946,740],[1011,727],[1011,947],[977,940],[967,883],[944,833]],{color:'#8cd0e3',strength:.64,amplitude:3.8,speed:.75,count:5,envelope:{attackSeconds:.28,releaseSeconds:.5}});
  physical('20-3','released-man-gravity-water-occlusion','fall',config.fallRelativeTimes,event('waterThrowRelease'));
  data.panelReveals.push({panelId:panel('20-3').id,atSeconds:event('waterThrowRelease')});
  data.protectedRegions=data.protectedRegions.filter(p=>p.id!=='20-3-rigid-2');
  add('20-3','wave',[[644,1483],[791,1451],[1011,1423],[1011,1523],[617,1523]],{color:'#86cde0',strength:.52,amplitude:2.8,speed:.62,count:5},event('waterThrowRelease'),panel('20-3').end-.12);
  add('20-3','ripple',region(721,1451,236,58),{color:'#a0e0ef',strength:.42,count:3,speed:.7,envelope:{attackSeconds:.05,releaseSeconds:.35}},event('waterSplash'),event('waterSplash')+1.30);
 }else if(number===21){
  physical('21-1','double-leaf-door-original-foreground','door',config.doorRelativeTimes,panel('21-1').ready);
  add('21-1','lightSweep',[[740,84],[747,83],[747,395],[739,393]],{color:'#9baab2',strength:.18,amplitude:8,speed:.6,envelope:{attackSeconds:.08,releaseSeconds:.22}},event('refugeLatchStart'),event('refugeLatchStart')+.6);
  add('21-2','particles',[[743,661],[965,641],[990,941],[735,942]],{color:'#c6ccd1',strength:.21,count:9,speed:.22,envelope:{attackSeconds:.8,releaseSeconds:1.2}},event('emptyRoom'),panel('21-2').end-.2);
  add('21-2','ripple',region(793,967,88,24),{color:'#9aaebd',strength:.23,count:1,envelope:{attackSeconds:.10,releaseSeconds:.45}},event('emptyRoom')+2,event('emptyRoom')+3.3);
  data.protectedRegions=data.protectedRegions.filter(p=>p.id!=='21-3-rigid-1');
  add('21-3','neon',region(320,1164,18,22),{color:'#e95545',strength:.3,frequency:.26,phase:-1.4,softEdge:true,envelope:{attackSeconds:.6,releaseSeconds:.85}},panel('21-3').ready,event('finalIndicatorOff'));
  data.motionLayers.push({id:'last-red-indicator-extinguished',panelId:panel('21-3').id,mode:'frames',rect:rect(320,1164,18,22),startSeconds:panel('21-3').ready,endSeconds:panel('21-3').end,frames:[{atSeconds:0,image:media('lamp-on.png')},{atSeconds:event('finalIndicatorOff')-panel('21-3').ready,image:media('lamp-off.png')}]});
 }
 data.provenance={...data.provenance,motion03Lot:'lot-d',sourceV9Sha256:anchors.sourceSha256,previousPageSourceSha256:sha(source),timingContract:relative(path.join(__dirname,'../timing/TIMING.json')),physicalAnchors:relative(anchorsFile),assets:relative(path.join(__dirname,'ASSETS-v5.json')),editableLetteringSvg:original.letteringImage,lettering:'Original SVG alpha, opaque RGB from approved master; frozen PNG composed last, editable SVG retained. PanelReveals masks art and letters together.'};
 core.assertManifest(data);const timeline=core.buildTimeline(data);assert.equal(timeline.duration,timing.newTimeline.duration);assert.deepEqual(timeline.tracks.map(t=>({audio:t.audio,duration:t.end-t.start})),timing.newTimeline.tracks.map(t=>({audio:t.audio,duration:t.end-t.start})));
 for(const f of core.assetPaths(data))assert(fs.existsSync(path.resolve(path.dirname(target),f)),f);
 draftWrite(target,JSON.stringify(data,null,2)+'\n');
 report.pages.push({page:number,source:path.relative(root,source).replaceAll('\\','/'),sourceSha256:sha(source),candidate:path.relative(root,target).replaceAll('\\','/'),candidateSha256:sha(target),duration:timeline.duration,effects:data.effects.length,layers:data.motionLayers.length,panelReveals:data.panelReveals});
 for(const p of timing.panels)report.cells.push({page:number,panelKey:p.key,start:p.start,ready:p.ready,end:p.end,effects:data.effects.filter(e=>e.panelId===p.id),layers:data.motionLayers.filter(e=>e.panelId===p.id).map(l=>l.id),reveal:data.panelReveals.find(r=>r.panelId===p.id)?.atSeconds??null});
}
const sequence={kind:'motion-comic-sequence',schemaVersion:1,version:1,title:'Blue Purple — revue de production lot D, pages 18–21',pages:report.pages.map(p=>({id:'page-'+p.page,manifest:path.relative(__dirname,path.join(root,p.candidate)).replaceAll('\\','/')}))};
draftWrite(path.join(__dirname,'candidates-v1.json'),JSON.stringify(sequence,null,2)+'\n');report.status='candidates-awaiting-visual-review';draftWrite(path.join(__dirname,'BUILD.json'),JSON.stringify(report,null,2)+'\n');
console.info(JSON.stringify({status:report.status,pages:report.pages,cells:report.cells.length}));
