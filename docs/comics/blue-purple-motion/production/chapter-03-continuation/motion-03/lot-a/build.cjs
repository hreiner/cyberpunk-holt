/* Lot A: five concrete candidates, native matter overlays and shared timing only. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../../../../..'),PROJECTS=path.join(ROOT,'anime/motion-comics/projects');
const {getTiming}=require('../timing/retime.cjs');
const natives=JSON.parse(fs.readFileSync(path.join(__dirname,'NATIVES.json'),'utf8'));
const rootRel=file=>path.relative(ROOT,file).replaceAll('\\','/');
const media=file=>path.relative(PROJECTS,path.join(ROOT,file)).replaceAll('\\','/');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const norm=rect=>rect.map((v,i)=>v/(i%2?1536:1024));
const poly=points=>points.map(([x,y])=>[x/1024,y/1536]);
const lock=[],contracts=[],anchors=[],cases=[];
function addFx(data,id,type,panel,rect,extra={}){data.effects.push({id,type,rect:norm(rect),clock:'ambient',panelId:panel,...(type==='rain'?{rainFlow:true}:{}),...extra});return id;}
function addPolyFx(data,id,type,panel,points,extra={}){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return addFx(data,id,type,panel,[Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)],{clipPolygon:poly(points),...extra});
}
function layerFrames(data,name,panel,start,duration,at){
 const n=natives[name],end=start+duration,span=end-start,l={id:name,panelId:panel,mode:'frames',rect:norm(n.rect),startSeconds:start,endSeconds:end,
 frames:n.images.map((image,i)=>({image:media(image),atSeconds:Math.min(span,at?.[i]??span*i/(n.images.length-1))}))};
 data.motionLayers.push(l);return name;
}
function drop(data,name,panel,ready,span){
 const n=natives[name],start=ready+.3,end=start+span,actualSpan=end-start,travel=n.travel??[0,.73],l={id:name,panelId:panel,mode:'sprite',rect:norm(n.rect),background:media(n.background),
 startSeconds:start,endSeconds:end,frames:[{image:media(n.image),atSeconds:0}],
 keyframes:[{atSeconds:0,opacity:0,translate:[0,0]},{atSeconds:.3,opacity:.9,translate:travel.map(v=>v*.04),easing:'linear'},
 {atSeconds:actualSpan-.45,opacity:.86,translate:travel.map(v=>v*.9),easing:'linear'},{atSeconds:actualSpan,opacity:0,translate:travel,easing:'linear'}]};
 data.motionLayers.push(l);return name;
}
function protect(data,id,rect){data.protectedRegions.push({id,rect:norm(rect)});}
function servicePuff(data,ready){
 const n=natives['p11-service-puff'],start=ready+.35,end=start+2,span=end-start;
 data.motionLayers.push({id:'p11-service-puff',panelId:'p11-c01',mode:'sprite',rect:norm(n.rect),background:media(n.background),startSeconds:start,endSeconds:end,
  frames:[{image:media(n.image),atSeconds:0}],pivot:[.5,.9],
  keyframes:[{atSeconds:0,opacity:0,scale:.62,translate:[0,.04]},
   {atSeconds:.3,opacity:.76,scale:.92,translate:[-.01,-.04],easing:'smoothstep'},
   {atSeconds:.85,opacity:.82,scale:1.12,translate:[-.025,-.18],easing:'smoothstep'},
   {atSeconds:1.45,opacity:.48,scale:1.3,translate:[-.04,-.32],easing:'smoothstep'},
   {atSeconds:span,opacity:0,scale:1.42,translate:[-.05,-.44],easing:'smoothstep'}]});
 return 'p11-service-puff';
}
function entry(page,key,intention,ids,proofs,notes){cases.push({page,key,intention,mechanisms:ids,proofTimes:proofs,status:'implemented-awaiting-rendered-review',notes});}
for(let num=9;num<=13;num++){
 const padded=String(num).padStart(2,'0'),source=path.join(PROJECTS,`blue-purple-page${padded}-motion04.json`);
 const old=JSON.parse(fs.readFileSync(source,'utf8')),retimed=getTiming(old,num),data=retimed.data;
 const tp=key=>retimed.panels.find(p=>p.key===key),_p=key=>data.panels.find(p=>p.panelKey===key),r=key=>tp(key).ready,e=key=>tp(key).end;
 data.version=6;data.effects=[];data.motionLayers=[];
 data.provenance={...data.provenance,revision:'motion-03',lot:'A-pages09-13',timingContract:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/timing/TIMING.json',animation:'Native SVG acquisition/lamps/drops/traces, local material effects, staged comic replies; rigid bodies and final lettering.'};
 lock.push({source:rootRel(source),sha256:sha(source),media:[old.image,old.motionBaseImage,old.letteringImage].map(file=>{const f=path.resolve(PROJECTS,file);return{file:rootRel(f),sha256:sha(f)};})});
 if(num===9){
  protect(data,'09-1-car-rigid',[486,112,277,175]);
  data.protectedRegions=data.protectedRegions.filter(q=>q.id!=='09-2-rigid-1');
  protect(data,'09-2-hand-rigid',[474,849,248,165]);
  protect(data,'09-2-sleeve-rigid',[648,720,364,296]);
  const ids1=[addPolyFx(data,'p09-street-rain-depth','rain','p09-c01',[[475,13],[708,13],[708,119],[475,119]],{count:24,speed:.65,strength:.52}),
   addPolyFx(data,'p09-street-rain-floor','rain','p09-c01',[[479,291],[707,301],[704,504],[462,504]],{count:28,speed:.9,strength:.66}),
   addFx(data,'p09-puddle-rings','ripple','p09-c01',[493,352,183,93],{count:4,color:'#95e8f7',strength:.62,speed:.9})];
  entry(9,'09-1','Pluie oblique et anneaux dans la flaque entre les acteurs, véhicule fixé.',ids1,[r('09-1')+1,r('09-1')+1.7],'Corps et voiture restaurés, flux limité à la profondeur et au sol libre.');
  const start=r('09-2')+.25;layerFrames(data,'p09-screen-acquire','p09-c02',start,1.0);
  anchors.push({id:'terminalAcquire',page:9,panelKey:'09-2',localTime:start,intention:'Début du calcul, quadrilatère de vitre existante'});
  anchors.push({id:'terminalMapReady',page:9,panelKey:'09-2',localTime:start+1,intention:'Carte lisible, halo rose resserré ; avant parole de Franklyn'});
  if(data.panels.find(p=>p.panelKey==='09-2').leadInSeconds<1.45)throw Error('Exception de causalité09.2 pas encore intégrée au helper.');
  entry(9,'09-2','Acquisition du réseau dans les quatre coins exacts de la vitre, point rose stabilisé.',['p09-screen-acquire'],[start-.05,start+.5,start+1.05],'Pas de carte ajoutée ; masque SVG limité à la vitre, doigts et cadre inchangés.');
  const ids3=[drop(data,'p09-pole-drop','p09-c03',r('09-3'),2.8),addPolyFx(data,'p09-decision-rain','rain','p09-c03',[[71,1030],[126,1030],[126,1275],[73,1275]],{count:17,speed:.58,strength:.45})];
  entry(9,'09-3','Une goutte longe le montant gauche ; pluie en arrière-plan.',ids3,[r('09-3')+.7,r('09-3')+2.1],'Geste de Grover conservé intégralement.');
 }
 if(num===10){
  const id1=[addPolyFx(data,'p10-scale-depth-rain','rain','p10-c01',[[18,14],[1007,14],[1007,299],[627,299],[627,337],[382,337],[382,360],[18,360]],{count:36,speed:.62,strength:.46}),
  addFx(data,'p10-scale-foreground-rain','rain','p10-c01',[18,466,988,40],{count:36,speed:1.2,strength:.64}),
  addPolyFx(data,'p10-scale-wet-reflection','reflection','p10-c01',[[43,423],[337,423],[390,506],[34,506]],{color:'#65ccef',frequency:.35,strength:.32,softEdge:true})];
  entry(10,'10-1','Deux profondeurs de pluie et reflets humides sur chaussée.',id1,[r('10-1')+1,r('10-1')+1.8],'Voiture/roues/ombre inchangées, aucun trajet factice.');
  const id2l=[addPolyFx(data,'p10-entry-left-depth','rain','p10-c02',[[18,589],[234,602],[232,644],[18,644]],{count:20,speed:.6,strength:.48}),
  addPolyFx(data,'p10-entry-left-water','ripple','p10-c02',[[180,971],[332,972],[333,1013],[180,1013]],{count:3,strength:.53,speed:.75,color:'#7cdaef'})];
  entry(10,'10-2 gauche','Profondeur de rue et eau libre entre les appuis.',id2l,[r('10-2')+1,r('10-2')+1.7],'Aucun déplacement des personnages ou de la foule.');
  layerFrames(data,'p10-camera-entry','p10-c02',r('10-2')+.2,1.0);
  const id2r=['p10-camera-entry',addPolyFx(data,'p10-entry-right-water','reflection','p10-c02',[[566,867],[767,867],[767,1009],[557,1009]],{color:'#58d9f2',frequency:.32,strength:.31,softEdge:true})];
  entry(10,'10-2 droite','Témoin de caméra et reflet sous l’entrée.',id2r,[r('10-2')+.25,r('10-2')+.65,r('10-2')+1.25],'Caméra fixe et foule rigide ; accent de lampe séparé de la moitié gauche.');
  data.protectedRegions=data.protectedRegions.filter(q=>q.id!=='10-3-rigid-1');
  [[185,1081,172,256],[83,1260,325,264],[435,1252,140,129],[405,1360,194,164],[404,1200,87,193],[548,1237,107,198],[651,1130,167,218],[637,1321,264,203],[898,1235,108,244]].forEach((rect,i)=>protect(data,`10-3-actor-${i}`,rect));
  const id3l=[addPolyFx(data,'p10-child-protected-rain','rain','p10-c03',[[18,1034],[177,1034],[184,1148],[151,1172],[18,1163]],{count:23,speed:.48,strength:.43})];
  entry(10,'10-3 gauche','Pluie lente derrière la protection de Grover.',id3l,[r('10-3')+1,r('10-3')+1.8],'Main sur l’épaule, enfant et toutes les silhouettes fixes.');
  layerFrames(data,'p10-camera-warning','p10-c03',r('10-3')+.45,.95);
  entry(10,'10-3 droite','Une impulsion rouge pendant l’avertissement de Wendy.',['p10-camera-warning'],[r('10-3')+.5,r('10-3')+.9,r('10-3')+1.45],'Aucune lumière sur le visage, bras croisés et appareil immobiles.');
 }
 if(num===11){
  const id1=[servicePuff(data,r('11-1')),
  addPolyFx(data,'p11-service-rain','rain','p11-c01',[[552,105],[657,105],[657,297],[548,297]],{count:20,speed:.72,strength:.48})];
  entry(11,'11-1','Bouffée de vapeur depuis la grille droite et pluie proche de l’entrée.',id1,[r('11-1')+.55,r('11-1')+1.45,r('11-1')+2.4],'Vapeur contenue hors geste de Grover et hors appuis des gardiens.');
  const id2=[addPolyFx(data,'p11-barrier-wet-floor','ripple','p11-c02',[[572,944],[744,944],[741,1008],[570,1008]],{count:3,strength:.55,speed:.58,color:'#91d1e5'}),
  addPolyFx(data,'p11-barrier-rain','rain','p11-c02',[[548,870],[672,870],[672,1008],[563,1008]],{count:19,speed:.62,strength:.46})];
  entry(11,'11-2','Pluie et ronds d’eau dans l’espace libre devant la barrière.',id2,[r('11-2')+1,r('11-2')+1.8],'Bottes, barrière et main du gardien restent fixes.');
  data.protectedRegions=data.protectedRegions.filter(q=>q.id!=='11-3a-rigid-1');
  [[157,1225,91,99],[100,1300,208,224],[308,1240,151,284],[17,1310,90,214],[460,1310,45,214]].forEach((rect,i)=>protect(data,`11-3a-actor-${i}`,rect));
  addPolyFx(data,'p11-john-rain-depth','rain','p11-c03a',[[17,1033],[501,1033],[501,1140],[17,1140]],{count:25,speed:.58,strength:.46});
  data.panelReveals=[{panelId:'p11-c03a',atSeconds:r('11-3a')+.08},{panelId:'p11-c03b',atSeconds:r('11-3b')+.08}];
  anchors.push({id:'johnProposalReveal',page:11,panelKey:'11-3a',localTime:r('11-3a')+.08,intention:'Case et bulle John apparaissent ensemble'});
  anchors.push({id:'abigailReplyReveal',page:11,panelKey:'11-3b',localTime:r('11-3b')+.08,intention:'Réponse révélée après proposition de John'});
  entry(11,'11-3a','Apparition franche de John avec sa proposition, pluie dans le haut du décor.',['panelReveals:p11-c03a','p11-john-rain-depth'],[r('11-3a')+.04,r('11-3a')+.13,r('11-3a')+1],'Montage franc, aucune interpolation de corps.');
  entry(11,'11-3b','Réponse d’Abigail après la proposition, puis silence visuel.',['panelReveals:p11-c03b'],[r('11-3b')+.04,r('11-3b')+.13,r('11-3b')+1],'Tenue calme voulue pendant le désaccord, toutes les mains intactes.');
 }
 if(num===12){
  protect(data,'12-1-car-through-window',[19,150,113,105]);
  layerFrames(data,'p12-gate-awake','p12-c01',r('12-1')+.2,1.0);
  const id1=['p12-gate-awake',addPolyFx(data,'p12-hall-floor-reflection','reflection','p12-c01',[[830,395],[1005,387],[1005,503],[820,503]],{clock:'story',startSeconds:r('12-1')+.3,endSeconds:r('12-1')+1.7,envelope:{attackSeconds:.35,releaseSeconds:.45},color:'#ffe0a1',strength:.38,softEdge:true,frequency:.35})];
  entry(12,'12-1','Voyant du portillon éveillé et reflet bref dans le hall.',id1,[r('12-1')+.25,r('12-1')+.75,r('12-1')+1.8],'Aucune ouverture de porte ou confirmation anticipée.');
  layerFrames(data,'p12-implant-confirm','p12-c02',r('12-2')+.35,1.2,[0,.16,.3,.45,.55,.65,.78,.95,1.2]);
  anchors.push({id:'implantPulseStart',page:12,panelKey:'12-2',localTime:r('12-2')+.35,intention:'Montée implant puis deux impulsions'});
  anchors.push({id:'implantConfirm',page:12,panelKey:'12-2',localTime:r('12-2')+1.15,intention:'Deuxième impulsion de confirmation de réservation'});
  entry(12,'12-2','Deux pulsations cyan de l’implant puis apaisement.',['p12-implant-confirm'],[r('12-2')+.4,r('12-2')+.67,r('12-2')+1.13,r('12-2')+1.6],'Petit ovale de matière lumineuse ; peau, doigt et crâne non déplacés.');
  const end=e('12-3')-.7,start=r('12-3')+.4;
  const id3=[addPolyFx(data,'p12-elevator-left-glide','lightSweep','p12-c03',[[21,1050],[215,1112],[215,1502],[21,1508]],{clock:'story',startSeconds:start,endSeconds:end,envelope:{attackSeconds:.5,releaseSeconds:.6},color:'#71dce7',strength:.38,speed:.18,amplitude:22}),
  addPolyFx(data,'p12-elevator-right-glide','lightSweep','p12-c03',[[820,1072],[1000,1052],[1000,1508],[820,1502]],{clock:'story',startSeconds:start,endSeconds:end,envelope:{attackSeconds:.5,releaseSeconds:.6},color:'#e67dd1',strength:.29,speed:.15,amplitude:19})];
  anchors.push({id:'elevatorSettles',page:12,panelKey:'12-3',localTime:end,intention:'Arrêt des reflets avant la dernière tenue, sans ouverture physique'});
  entry(12,'12-3','Reflets latéraux des parois métalliques, puis arrêt.',id3,[start+.7,start+2.2,end+.1],'Deux balayages justifiés par le métal de la cabine ; groupe et plafond restent fixes.');
 }
 if(num===13){
  // Replace one coarse whole-group rectangle with actual rigid-body bounds;
  // the cyan disturbance lives only in a clear corridor fragment beside the hand.
  data.protectedRegions=data.protectedRegions.filter(q=>q.id!=='13-1-rigid-1');
  [[16,55,218,451],[231,60,120,447],[475,94,196,230],[373,288,489,220],[460,185,58,130],[657,61,140,377],[770,46,162,376],[838,218,172,200]].forEach((rect,i)=>protect(data,`13-1-actor-${i}`,rect));
  layerFrames(data,'p13-neural-disturbance','p13-c01',r('13-1')+.45,.7);
  anchors.push({id:'franklynNeuralHint',page:13,panelKey:'13-1',localTime:r('13-1')+.45,intention:'Trouble subjectif bref dans le décor, aucune carte'});
  entry(13,'13-1','Perturbation cyan courte hors tête/peau, puis retour au couloir.',['p13-neural-disturbance'],[r('13-1')+.4,r('13-1')+.68,r('13-1')+1.2],'Aucune déformation de tempe, de doigt ou de coiffure.');
  layerFrames(data,'p13-plan-link-left','p13-c02',r('13-2')+.45,.8);
  entry(13,'13-2','Accent progressif sur une liaison cyan déjà tracée.',['p13-plan-link-left'],[r('13-2')+.4,r('13-2')+.85,r('13-2')+1.3],'Surlignage de la ligne existante, aucun déplacement du doigt ni étage ajouté.');
  layerFrames(data,'p13-plan-link-right','p13-c02-detail',r('13-2-detail')+.12,.75);
  entry(13,'13-2-detail','La même liaison atteint la moitié droite du plan.',['p13-plan-link-right'],[r('13-2-detail')+.1,r('13-2-detail')+.5,r('13-2-detail')+.92],'Poursuite géométrique de la gauche, sans nouveau bip ni balayage autonome.');
  const id3=[drop(data,'p13-window-drops','p13-c03',r('13-3'),3.1),addPolyFx(data,'p13-shop-window-rain','rain','p13-c03',[[894,1213],[994,1201],[994,1367],[894,1379]],{count:18,speed:.48,strength:.4})];
  entry(13,'13-3','Gouttes sur une vitre de boutique et pluie atténuée.',id3,[r('13-3')+.7,r('13-3')+2.1],'La lumière chaude est tenue ; les acteurs dessinés marchant ne glissent pas.');
 }
 contracts.push({page:num,candidate:`anime/motion-comics/projects/blue-purple-page${padded}-motion06.json`,source:rootRel(source),sourceSha256:sha(source),master:data.image,lettering:data.letteringImage,
 duration:retimed.newTimeline.duration,panels:retimed.panels,layerCount:data.motionLayers.length,effectCount:data.effects.length,panelReveals:data.panelReveals??[]});
 const destination=path.join(PROJECTS,`blue-purple-page${padded}-motion06.json`);fs.writeFileSync(destination,JSON.stringify(data,null,2)+'\n');
}
const timingFile=path.join(__dirname,'../timing/TIMING.json'),helperFile=path.join(__dirname,'../timing/retime.cjs');
fs.writeFileSync(path.join(__dirname,'CONTRACTS.json'),JSON.stringify({scope:'lot-a-pages09-13',timing:{file:rootRel(timingFile),sha256:sha(timingFile),helperSha256:sha(helperFile)},width:1024,height:1536,margin:12,gutter:12,paidMediaCalls:0,pages:contracts,cases},null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'ANCHORS.json'),JSON.stringify({origin:'local-page-seconds',timingContract:rootRel(timingFile),timingSha256:sha(timingFile),events:anchors},null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'SOURCE-LOCK.json'),JSON.stringify({scope:'read-only-v9-pages09-13',sources:lock},null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'CANDIDATES.json'),JSON.stringify({kind:'motion-comic-sequence',schemaVersion:1,version:6,title:'HOLT — Blue Purple · candidats animation lot A',pages:contracts.map(page=>({id:`page-${String(page.page).padStart(2,'0')}`,manifest:path.relative(__dirname,path.join(ROOT,page.candidate)).replaceAll('\\','/')}))},null,2)+'\n');
console.log(JSON.stringify({candidates:contracts.length,visibleCases:cases.length,events:anchors.length}));
