/* Candidate lot handoff only; root owns the chapter selection and final archive. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let root=__dirname;while(!fs.existsSync(path.join(root,'AGENTS.md')))root=path.dirname(root);
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const relative=file=>path.relative(root,file).replaceAll('\\','/'),sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const project=readDocument(path.join(__dirname,'candidates-v1.json')),build=JSON.parse(fs.readFileSync(path.join(__dirname,'BUILD.json'),'utf8'));
const master=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-d');
const proof=path.join(master,'proofs/run-v3'),review=JSON.parse(fs.readFileSync(path.join(proof,'report.json'),'utf8')),playback=JSON.parse(fs.readFileSync(path.join(proof,'PAIR-PLAYBACK.json'),'utf8'));
assert.equal(review.status,'completed');assert.equal(review.failures.length,0);assert.equal(review.cases.length,13);assert.equal(review.samples.length,48);assert.equal(playback.status,'completed');assert(playback.playbacks.every(p=>p.ended));
for(const item of review.sourceFiles)assert.equal(sha(path.join(root,item.file)),item.sha256,'Source QA changée : '+item.file);
const anchors=JSON.parse(fs.readFileSync(path.join(__dirname,'ANCHORS.json'),'utf8'));assert.equal(sha(path.join(__dirname,'../timing/TIMING.json')),anchors.timingSha256);
const extra=[
 ...['water-clean-v1.png','door-closed-clean-v1.png','door-empty-interior-v1.png','lock-retracted-v1.png','water-impact-v2.png','sdf-alpha-v2.png'].map(f=>path.join(master,'native',f)),
 path.join(master,'references/water-clean-v1.jpg'),
 ...['water-background.png','sdf-rigid.png','door-texture-clean.png','abigail-original.png','sdf-mask.svg','abigail-mask.svg','water-mask.svg','door-aperture-mask.svg'].map(f=>path.join(master,'assets-v5',f)),
 ...['p18-c02.jpg','p20-c03.jpg','p21-c01.jpg'].map(f=>path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5/assets',f)),
 ...[54,59,63].map(n=>path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/owner-review-references',`slide-${n}.png`)),
 path.join(root,'docs/Cyber-S01-E02-Had.odp'),
 ...[18,19,20,21].map(n=>path.join(root,`art-masters/motion-comics/blue-purple/chapter-03-continuation/format-01/selected/page-${n}/lettering.svg`)),
];
const extras=[...new Set(extra)].map(file=>({file:relative(file),sha256:sha(file)}));
fs.writeFileSync(path.join(__dirname,'EXTRA-SOURCES.json'),JSON.stringify({status:'explicit-source-list',files:extras,exclude:['assets-v1','assets-v2','assets-v3','assets-v4','proofs/run-v1','proofs/run-v2','**/frames/**','assets-v5/sdf-mask-review.png','assets-v5/sdf-mask-detail.png'],notes:'The two yellow SDF diagnostics are inherited manual-mask rejects; final alpha/mask and RGB sprite are explicitly listed above. No archive is created here.'},null,2)+'\n',{flag:'wx'});
const selection={schemaVersion:1,status:'candidate-lot-reviewed-ready-for-root-integration',globalSelectionOwner:'root',pages:build.pages,cells:13,timingSha256:anchors.timingSha256,anchorsFile:relative(path.join(__dirname,'ANCHORS.json')),anchorsSha256:sha(path.join(__dirname,'ANCHORS.json')),finalAssetDirectory:relative(path.join(master,'assets-v5')),runtimeFiles:[...new Set([project.manifestFile,...project.files])].map(file=>({file:relative(file),sha256:sha(file)})),extraSources:relative(path.join(__dirname,'EXTRA-SOURCES.json')),counterReview:'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-cross/LOT-D.md',proofs:{main:relative(path.join(proof,'report.json')),playback:relative(path.join(proof,'PAIR-PLAYBACK.json')),encoded:relative(path.join(proof,'ENCODED-SENSITIVITY.json')),reader:relative(path.join(master,'proofs/reader-v1/report.json'))},imageGeneration:{initialCalls:4,targetedCorrections:2,remainingTargetedCorrections:1,providerCost:'unknown',builtIn:true},newVoiceCalls:0,newAudioCalls:0,longVideoExports:0,humanListening:false,review:relative(path.join(__dirname,'REVIEW.md')),contract:relative(path.join(__dirname,'CONTRACT.md'))};
fs.writeFileSync(path.join(__dirname,'SELECTION.json'),JSON.stringify(selection,null,2)+'\n',{flag:'wx'});
console.info(JSON.stringify({status:selection.status,runtimeFiles:selection.runtimeFiles.length,extraSources:extras.length,candidates:build.pages.map(p=>({page:p.page,sha256:p.candidateSha256})),selectionSha256:sha(path.join(__dirname,'SELECTION.json'))}));
