const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {ROOT}=require('./mix-engine.cjs');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative=file=>path.relative(ROOT,file).replaceAll('\\','/');
const timingFile=path.resolve(__dirname,'../timing/TIMING.json'),timing=JSON.parse(fs.readFileSync(timingFile)),timingSha256=hash(timingFile);
const specs=[
 {lot:'lot-a',aliases:{}},
 {lot:'lot-b',aliases:{capsuleContact:'repairContact',capsuleLock:'capsuleLatch'}},
 {lot:'lot-c',aliases:{vision:'elfLandscapeHeld',disassembly:'digitalDisassembly',mapStable:'nightCityMapSettled',holt:'mapHolt',position:'mapPosition',unknown:'mapUnknown',green:'mapGreen',firstBand:'topBand',wendy:'wendyVoice'}},
 {lot:'lot-d',aliases:{}}
];
const sourceContracts=[],anchors=[];
for(const spec of specs){
 const file=path.resolve(__dirname,'..',spec.lot,'ANCHORS.json'),data=JSON.parse(fs.readFileSync(file));
 if(data.timingSha256&&data.timingSha256!==timingSha256)throw Error(`Horloge différente : ${spec.lot}`);
 const record={lot:spec.lot,file:relative(file),sha256:hash(file),status:data.status??'final-contract-supplied-by-worker'};sourceContracts.push(record);
 for(const source of data.anchors??data.events){
  const pageNumber=source.page??source.pageNumber,page=timing.pages.find(p=>p.pageNumber===pageNumber),pageLocalSeconds=source.localTime??source.localSeconds??source.pageLocalSeconds;
  const globalSeconds=source.globalSeconds??page.globalStart+pageLocalSeconds;
  if(!Number.isFinite(pageLocalSeconds)||!page||Math.abs(globalSeconds-page.globalStart-pageLocalSeconds)>1e-6||pageLocalSeconds<0||pageLocalSeconds>page.duration)throw Error(`Ancre hors page : ${spec.lot}/${source.id}`);
  const id=spec.aliases[source.id]??source.id;if(anchors.some(a=>a.id===id))throw Error(`Ancre dupliquée : ${id}`);
  anchors.push({id,page:pageNumber,panelKey:source.panelKey??null,pageLocalSeconds,globalSeconds,lotSeconds:globalSeconds-timing.unchangedPrefixSeconds,intention:source.intention??source.source??null,source:{file:record.file,sha256:record.sha256,id:source.id}});
 }
}
const required=['terminalAcquire','terminalMapReady','implantConfirm','elevatorSettles','repairContact','capsuleClosingStart','capsuleClosed','capsuleLatch','digitalDisassembly','nightCityMapSettled','mapGreen','oneShot','metalImpact','residentContact','boltStart','boltClosed','elevatorReturn','waterThrowRelease','waterSplash','refugeLatchStart','refugeDoorOpeningStart','refugeDoorOpen'];
for(const id of required)if(!anchors.some(a=>a.id===id))throw Error(`Ancre requise absente : ${id}`);
const output=path.join(__dirname,'ACOUSTIC-ANCHORS.json'),previous=JSON.parse(fs.readFileSync(output)),metadataUpdate=process.argv.includes('--metadata-update');
if(previous.status==='locked'&&!metadataUpdate)throw Error('Ancres déjà verrouillées.');
let metadataCorrection;
if(metadataUpdate){
 const compact=rows=>rows.map(a=>({id:a.id,globalSeconds:a.globalSeconds})).sort((a,b)=>a.id.localeCompare(b.id));
 const before=compact(previous.anchors.filter(a=>required.includes(a.id))),after=compact(anchors.filter(a=>required.includes(a.id)));
 if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Une ancre sonore a changé : recalage requis.');
 let index=1;while(fs.existsSync(path.join(__dirname,`ACOUSTIC-ANCHORS-v${index}.json`)))index++;
 const archive=path.join(__dirname,`ACOUSTIC-ANCHORS-v${index}.json`);fs.copyFileSync(output,archive,fs.constants.COPYFILE_EXCL);
 metadataCorrection={reason:'Auxiliary visual anchors updated after owner map/pose corrections; no HOLT sound existed and no accent used the rejected capsule75 pose. All sound-relevant times identical, WAV files retained.',previous:relative(archive),previousSha256:hash(archive),removedAuxiliaryIds:previous.anchors.filter(a=>!required.includes(a.id)&&!anchors.some(b=>b.id===a.id)).map(a=>a.id),addedAuxiliaryIds:anchors.filter(a=>!required.includes(a.id)&&!previous.anchors.some(b=>b.id===a.id)).map(a=>a.id),audioTimesUnchanged:true};
}
const record={schemaVersion:1,date:'2026-11-08',status:'locked',authority:'Root-approved final action contracts supplied by A/B/C/D. Timing revision2 fixes speech/camera; approved actions supersede inherited action proposals without moving speech.',timing:relative(timingFile),timingRevision:2,timingSha256,prefixSeconds:timing.unchangedPrefixSeconds,duration:timing.duration,sourceContracts,anchors:anchors.sort((a,b)=>a.globalSeconds-b.globalSeconds)};
if(metadataCorrection)record.metadataCorrection=metadataCorrection;
fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({file:relative(output),sha256:hash(output),contracts:sourceContracts.map(c=>c.lot),anchors:anchors.length,timingSha256,duration:record.duration}));
