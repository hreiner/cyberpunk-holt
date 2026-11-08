const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../../..');
const core=require(path.join(root,'anime/motion-comics/core.js'));
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const geometry=require('./GEOMETRY.json'),lettering=require('./EXACT-LETTERING.json');
const voices=require('./voice/SELECTION.json'),plan=require('./animation/ANIMATION-PLAN.json'),anchors=require('./animation/ANCHORS.json');
const projects=path.join(root,'anime/motion-comics/projects');
const revision=Number(process.argv[2]??2),tag=String(revision).padStart(2,'0');
if(![1,2].includes(revision))throw Error('Révision de production inconnue.');
const labels={
 '09-1':'La borne de rue','09-2':'Une destination','09-3':'Reprendre la route',
 '10-1':'Le mégabuilding','10-2':'Les accès surveillés','10-3':'Chercher un autre passage',
 '11-1':'L’entrée de service','11-2':'Le prix du passage','11-3a':'John propose la force','11-3b':'Abigail le raisonne',
 '12-1':'L’idée de Grover','12-2':'Une réservation discrète','12-3':'Rester ensemble',
 '13-1':'Une direction changeante','13-2':'Un étage à la fois','13-2-detail':'Abigail observe','13-3':'La boutique lumineuse',
 '14-1':'Les danses sensorielles','14-2':'Une machine différente','14-3':'L’accord du vendeur',
 '15-1':'Réparer le contact','15-2':'Abigail rebranche','15-3':'Franklyn entre dans la capsule',
 '16-1':'La connaissance retrouvée','16-2':'La simulation','16-3':'Une carte en mémoire',
 '17-1':'À l’autre bout','17-2':'Le tir et la mise à couvert','17-3':'Fuir ensemble',
 '18-1':'Sur le seuil','18-after':'Après le geste','18-2':'La porte verrouillée','18-3':'Attendre en silence',
 '19-1':'Le couloir est libre','19-2':'Un répit provisoire','19-3':'Vers le point vert',
 '20-1':'Le quai','20-2':'Reculez','20-3':'Le geste de John',
 '21-1':'La porte du refuge','21-2':'Un abri vide','21-3':'Souffler un instant'
};
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative=file=>path.relative(projects,path.resolve(root,file)).replaceAll('\\','/');
const norm=(r,p)=>r.map((v,i)=>v/(i%2?p.height:p.width));
const transpose=(local,parent)=>[parent[0]+local[0]*parent[2],parent[1]+local[1]*parent[3],local[2]*parent[2],local[3]*parent[3]];
const keyId=key=>'p'+key.replace('-', '-c0').replace('p18-c0after','p18-after');
const pages=[],timingPages=[],events=[];
let offset=0;
for(const g of geometry.pages){
 const num=String(g.page).padStart(2,'0'),frames=g.frames,plates=lettering.pages.find(p=>p.page===g.page);
 const panels=[];
 for(const frame of frames){
  const keys=[frame.key];
  for(const key of keys){
   let rect=norm(frame.rect,g);
   const selected=voices.cues.filter(c=>c.panel_id===frame.key).sort((a,b)=>a.dialogueIndex-b.dialogueIndex);
   const cues=selected.map(c=>({...c,audio:relative(c.audio),takeJournal:relative(c.takeJournal)}));
   if(frame.key==='15-3'&&cues.length)cues[0].gapSeconds=1.35;
   const text=selected.map(c=>c.textFr).join(' '),words=text.trim()?text.trim().split(/\s+/).length:0;
   const minHold=Math.max(2.5,words/3.6+.5);
   const holdSeconds=key==='17-2'?3.4:key==='18-after'?1.2:key==='13-2-detail'?1.6:minHold;
   const leadInSeconds=key==='17-2'?.38:key==='20-3'?.85:key==='15-2'?.25:key==='16-1'?.45:.18;
   if(!labels[key])throw Error('Libellé français absent '+key);
   panels.push({id:keyId(key),panelKey:key,sourcePanelKey:frame.key,label:revision===1?`Page ${g.page} · ${key.replace(/^\d+-/,'case ')}`:labels[key],rect,holdSeconds,leadInSeconds,cues});
  }
 }
 const file=path.join(projects,`blue-purple-page${num}-motion${tag}.json`);
 const data={schemaVersion:1,version:revision,title:`HOLT — Blue Purple · page ${g.page}`,image:relative(g.master.file),motionBaseImage:relative(plates.base),letteringImage:relative(plates.lettering),storyThumbnail:true,
  overviewSeconds:.65,transitionSeconds:.28,gapSeconds:.18,outroSeconds:.45,panels,effects:[],protectedRegions:[],
  source:'docs/chapters/ch3/SCENARIO.md',provenance:{production:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01',approvedStaticRevision:'revision-05',approvedMasterSha256:g.master.sha256,lettering:'Exact approved raster plates after effects; original SVG retained.',animation:'Local matter effects and authored comic ellipses. No body morphing.',humanListeningApproval:false}};
 const timeline=core.buildTimeline(data);
 const localSegments=panels.map((p,i)=>{
  const s=timeline.segments.find(s=>s.panel===i);
  const tracks=timeline.tracks.filter(t=>t.panel===i).map((t,j)=>({...t,id:p.cues[j].id,textFr:p.cues[j].textFr,textEn:p.cues[j].textEn,audioFile:path.resolve(projects,t.audio),panelKey:p.panelKey}));
  return {...s,panelKey:p.panelKey,panelId:p.id,sourcePanelKey:p.sourcePanelKey,holdStart:s.start+data.transitionSeconds,tracks};
 });
 const localEvents=[];
 for(const a of anchors.anchors.filter(a=>a.panelKey.startsWith(num+'-'))){
  const segment=localSegments.find(s=>s.panelKey===(a.virtualPanel??a.panelKey));if(!segment)throw Error('Ancre sans segment '+a.id);
  let at=segment.holdStart+(a.virtualPanel?a.virtualPanelOffsetSeconds:a.offsetSeconds??0);
  if(a.at==='cueEnd'){const cue=segment.tracks.find(t=>t.speaker===a.speaker);at=cue?cue.end+(a.offsetSeconds??0):segment.holdStart+a.fallbackHoldOffsetSeconds;}
  if(a.at==='nextPanelHoldStart'){const next=localSegments.find(s=>s.panelKey===a.nextPanel);at=next.holdStart+(a.offsetSeconds??0);}
  const event={id:a.id,panelKey:a.virtualPanel??a.panelKey,page:`page-${num}`,time:at+offset,localTime:at};localEvents.push(event);events.push(event);
 }
 for(const frame of frames){
  const panelPlan=plan.panels.find(p=>p.key===frame.key);if(!panelPlan)throw Error('Plan absent '+frame.key);
  const parent=norm(frame.imageRect,g);
  for(const protection of panelPlan.protectedRegions??[])data.protectedRegions.push({id:frame.key+'-'+protection.id,rect:transpose(protection.rect,parent)});
  for(const fx0 of panelPlan.effects??[]){
   const fx=structuredClone(fx0);fx.rect=transpose(fx.rect,parent);if(fx.protect)fx.protect=fx.protect.map(r=>transpose(r,parent));
   fx.panelId=keyId(frame.key);
   if(fx.startAnchor){const event=localEvents.find(e=>e.id===fx.startAnchor);if(!event)throw Error('Effet sans ancre '+fx.startAnchor);fx.startSeconds=event.localTime+(fx.offsetSeconds??0);if(fx.durationSeconds)fx.endSeconds=Math.min(timeline.duration,fx.startSeconds+fx.durationSeconds);}
   delete fx.startAnchor;delete fx.offsetSeconds;delete fx.durationSeconds;data.effects.push(fx);
  }
 }
 core.buildTimeline(data);write(file,data);
 pages.push({id:`page-${num}`,manifest:path.basename(file)});
 timingPages.push({id:`page-${num}`,manifest:path.relative(root,file).replaceAll('\\','/'),manifestSha256:sha(file),start:offset,end:offset+timeline.duration,duration:timeline.duration,segments:localSegments.map(s=>({...s,localStart:s.start,localEnd:s.end,localHoldStart:s.holdStart,start:s.start+offset,end:s.end+offset,holdStart:s.holdStart+offset,tracks:s.tracks.map(t=>({...t,start:t.start+offset,end:t.end+offset}))}))});
 offset+=timeline.duration;
}
const sequenceFile=path.join(projects,`blue-purple-pages09-21-motion${tag}.json`);
const seq={kind:'motion-comic-sequence',schemaVersion:1,version:revision,title:'HOLT — Blue Purple · pages 9 à 21',pages,provenance:{production:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01',humanListeningApproval:false}};
const soundSelectionFile=path.join(__dirname,'sound/SELECTION.json');
if(fs.existsSync(soundSelectionFile)){
 const sound=JSON.parse(fs.readFileSync(soundSelectionFile,'utf8'));if(sound.backingPages09To21)seq.music={audio:relative(sound.backingPages09To21),gain:1,preMixed:true};
}
write(sequenceFile,seq);
const lot=readDocument(sequenceFile);
write(path.join(__dirname,revision===1?'TIMING.json':`TIMING-v${revision}.json`),{schemaVersion:1,scope:'pages09-21-local-origin',duration:lot.timeline.duration,frames24:Math.ceil(lot.timeline.duration*24),voiceSeconds:voices.cues.reduce((s,c)=>s+c.duration,0),pages:timingPages,tracks:lot.timeline.tracks.map(t=>({...t,panelKey:timingPages[t.page].segments[t.panel].panelKey})),events});
const oldFile=path.join(projects,'blue-purple-pages01-08-v5.json'),old=JSON.parse(fs.readFileSync(oldFile,'utf8'));
const complete={...old,version:5+revision,title:'HOLT — Blue Purple · chapitre 3 complet · 21 pages',pages:[...old.pages,...pages],provenance:{production:seq.provenance.production,sourcePages01To08:'blue-purple-pages01-08-v5.json',staticRevision09To21:'revision-05',humanListeningApproval:false}};
if(fs.existsSync(soundSelectionFile)){
 const sound=JSON.parse(fs.readFileSync(soundSelectionFile,'utf8'));if(sound.backingFull)complete.music={audio:relative(sound.backingFull),gain:1,preMixed:true};
}else delete complete.music;
write(path.join(projects,`blue-purple-pages01-21-v${5+revision}.json`),complete);
const all=readDocument(path.join(projects,`blue-purple-pages01-21-v${5+revision}.json`));
write(path.join(__dirname,revision===1?'TIMING-FULL.json':`TIMING-FULL-v${revision}.json`),{duration:all.timeline.duration,pages:all.timeline.pages,tracks:all.timeline.tracks,events:events.map(e=>({...e,time:e.time+226.6}))});
console.log(JSON.stringify({pages:pages.length,panels:timingPages.reduce((s,p)=>s+p.segments.length,0),voices:lot.timeline.tracks.length,duration:lot.timeline.duration,completeDuration:all.timeline.duration,events}));
