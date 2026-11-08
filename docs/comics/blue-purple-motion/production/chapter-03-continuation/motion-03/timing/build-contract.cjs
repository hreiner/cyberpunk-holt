/* Run once after orchestrator approval; freezes source timings without selecting media. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {applyTiming:_applyTiming,getTiming,PROFILE,SPECIAL}=require('./retime.cjs');
const root=path.resolve(__dirname,'../../../../../../..');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const source='anime/motion-comics/projects/blue-purple-pages01-21-v9.json';
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const project=readDocument(path.join(root,source));
const median=values=>{const s=values.toSorted((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;};
const metrics=(from,to)=>{
 const data=project.pages.slice(from,to+1).map(p=>p.data),panels=data.flatMap(d=>d.panels);
 return {pages:[from,to],count:to-from+1,duration:project.pages.slice(from,to+1).reduce((n,p)=>n+p.timeline.duration,0),
  overviewSeconds:[...new Set(data.map(d=>d.overviewSeconds))],transitionSeconds:[...new Set(data.map(d=>d.transitionSeconds))],gapSeconds:[...new Set(data.map(d=>d.gapSeconds))],outroSeconds:[...new Set(data.map(d=>d.outroSeconds))],
  declaredHoldMedian:median(panels.map(p=>p.holdSeconds)),actualHoldMedian:median(project.pages.slice(from,to+1).flatMap(p=>p.timeline.segments.filter(s=>s.panel>=0).map(s=>s.end-s.start-p.data.transitionSeconds)))};
};
let oldCursor=0,newCursor=0;
const pages=project.pages.map((p,pageNumber)=>{
 const t=getTiming(p.data,pageNumber),record={pageNumber,id:project.data.pages[pageNumber].id,sourceManifest:path.relative(root,p.manifestFile).replaceAll('\\','/'),sourceSha256:sha(p.manifestFile),oldGlobalStart:oldCursor,globalStart:newCursor,oldDuration:t.oldTimeline.duration,duration:t.newTimeline.duration,
  camera:{overviewSeconds:t.data.overviewSeconds,transitionSeconds:t.data.transitionSeconds,gapSeconds:t.data.gapSeconds,outroSeconds:t.data.outroSeconds},panels:t.panels,mapPoints:t.points,
  voiceTracks:t.newTimeline.tracks.map((track,index)=>({...track,cueId:p.data.panels[track.panel].cues[t.newTimeline.tracks.slice(0,index).filter(x=>x.panel===track.panel).length].id??null,globalStart:newCursor+track.start,globalEnd:newCursor+track.end}))};
 oldCursor+=t.oldTimeline.duration;newCursor+=t.newTimeline.duration;return record;
});
const anchors=[];
const anchored=(pageNumber,id,seconds,status='inherited-remapped')=>{const p=pages[pageNumber];anchors.push({id,pageNumber,pageLocalSeconds:seconds,globalSeconds:p.globalStart+seconds,status});};
const oldAnchors=JSON.parse(fs.readFileSync(path.join(__dirname,'../../motion-02/animation/ANCHORS.json'),'utf8'));
for(const a of oldAnchors.anchors){const p=['elfLandscapeHeld','digitalDisassembly','nightCityMapSettled'].includes(a.id)?16:17;anchored(p,a.id,getTiming(project.pages[p].data,p).mapPageTime(a.pageLocalSeconds));}
anchored(15,'repairContact',getTiming(project.pages[15].data,15).mapPageTime(5.61));
anchored(20,'waterSplash',getTiming(project.pages[20].data,20).mapPageTime(7.86));
for(const [pageNumber,key,events] of [[15,'15-3',[['capsuleClosingStart',.8],['capsuleClosed',2.4]]],[21,'21-1',[['refugeDoorOpeningStart',.9],['refugeDoorOpen',2.5]]]]){
 const p=pages[pageNumber].panels.find(p=>p.key===key);
 for(const [id,offset] of events)anchored(pageNumber,id,p.ready+offset,'proposed-local-action-within-frozen-hold');
}
const report={status:'frozen-timing-contract',revision:2,previousRevision:'TIMING-v1.json',approval:'Paramètres approuvés par orchestrateur ; révision2 approuve uniquement lead09-2 à1.45, voixFranklyn+1.1s sans changement de durée. Ne pas modifier sans réouverture du contrat.',source,sourceSha256:sha(path.join(root,source)),helperSha256:sha(path.join(__dirname,'retime.cjs')),profile:PROFILE,exceptions:SPECIAL,
 oldDuration:oldCursor,duration:newCursor,increaseSeconds:newCursor-oldCursor,unchangedPrefixSeconds:pages[9].globalStart,preservePrefixPCM:'Couverture12s + pages1–8 =238.6s, aucune modification des voix/caméras ni du PCM de ce préfixe.',
 measurement:{pages01To04:metrics(1,4),pages05To08:metrics(5,8),pages09To21:metrics(9,21)},pages,anchors,
 invariants:['Sources v9/motion02 immuables','Couverture et pages1–8 identiques','99 médias vocaux et durées conservés','Mapping monotone et pente1 dans chaque prise vocale','Effets/calques hérités recalés en temps page, fréquences et durées physiques brèves non étirées'],
 actionAnchorPolicy:'Les ancres héritées sont recalées ; les quatre ancres fermeture/porte restent propositions de mise en scène à confirmer dans les contrats de leurs workers, sans modifier les durées gelées. Root réconcilie les événements avant le mix final.'};
const approvedUpdate=process.argv.includes('--approved-revision-2');
if(approvedUpdate&&sha(path.join(__dirname,'TIMING.json'))!==sha(path.join(__dirname,'TIMING-v1.json')))throw Error('Le contrat précédent doit être préservé exactement avant révision2.');
fs.writeFileSync(path.join(__dirname,'TIMING.json'),JSON.stringify(report,null,2),{flag:approvedUpdate?'w':'wx'});
console.log(JSON.stringify({duration:newCursor,unchangedPrefixSeconds:report.unchangedPrefixSeconds,pages:pages.map(p=>({page:p.pageNumber,start:p.globalStart,duration:p.duration})),anchors}));
