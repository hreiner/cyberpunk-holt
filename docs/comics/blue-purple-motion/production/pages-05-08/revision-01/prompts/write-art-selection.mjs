import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();const base=path.join(root,'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const specifications=[
 ['p05-c03','ready','p05-c03-pose-01-preparation-v2.png','p05-c03-ready/attempt-02/journal.json'],
 ['p05-c03','contact','p05-c03-pose-02-contact.png','p05-c03-contact/attempt-01/journal.json'],
 ['p05-c03','recoil','p05-c03-pose-03-recoil.png','p05-c03-recoil/attempt-01/journal.json'],
 ['p05-c03','down','p05-c03-pose-04-down.png','p05-c03-down/attempt-01/journal.json'],
 ['p06-c03','threshold','p06-c03-pose-01-seuil-v2.png','p06-c03-threshold/attempt-02/journal.json'],
 ['p06-c03','crossing','p06-c03-pose-02-franchissement-v2.png','p06-c03-crossing/attempt-02/journal.json'],
 ['p08-c04','background','p08-c04-cleanplate.png','p08-c04-cleanplate/attempt-01/journal.json'],
 ['p08-c04','car-rgba','p08-c04-car-rgba.png','p08-c04-car-rgba/attempt-01/journal.json'],
];
const assets=[];
for(const [panel,role,name,journalName]of specifications){const file=path.join(base,name),data=await fs.readFile(file),journal=JSON.parse(await fs.readFile(path.join(base,journalName),'utf8'));const hash=sha(data);if(hash!==journal.output.sha256)throw new Error('Selection differs from reviewed native '+name);assets.push({panel,role,path:file,relativePath:path.relative(root,file).replaceAll('\\','/'),sha256:hash,bytes:data.length,width:data.readUInt32BE(16),height:data.readUInt32BE(20),pngColorType:data[25],sourceJournal:path.join(base,journalName),promptSha256:journal.prompt.sha256,sourceReferences:journal.references.map(r=>({path:r.path,sha256:r.sha256})),visualReview:'Independent quality review favorable on exact native; see revision-01/QA-IMAGES.md.',requiresMotionReview:true});}
const report={schemaVersion:1,scope:'Blue Purple pages05-08 revision01 art',date:'2026-11-05',actualCalls:11,initialCalls:8,targetedCorrections:3,maximumCalls:12,remainingCorrectionCalls:1,previousLotImageCalls:16,allLotsImageCallsToDate:27,provider:'built-in ImageGen',monetaryCost:null,providerRequestIds:null,currentContractSha256AtSelection:sha(await fs.readFile(path.join(root,'docs/comics/blue-purple-motion/production/pages-05-08/revision-01/CONTRACTS.json'))),originalsPreserved:true,assets,alphaAudit:path.join(base,'car-alpha-audit-v2.json'),alphaComposites:path.join(base,'car-alpha-previews-v1/report.json'),limitations:['No full playback review is implied by native source approval.','Exit and car native dimensions vary slightly; exact dimensions listed per asset, normalize into same1000x496 case.','Car is true RGBA with mostly alpha253 on body; no visible halo on white/gray composites.']};
await fs.writeFile(path.join(base,'ART-SELECTION.json'),JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify(assets.map(({role,path,width,height,sha256})=>({role,path,width,height,sha256})),null,2));

