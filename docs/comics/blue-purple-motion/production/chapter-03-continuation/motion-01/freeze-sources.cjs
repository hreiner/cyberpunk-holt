const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../../..');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const h=require('./export/common.cjs');
const file=path.join(root,process.argv[2]??'anime/motion-comics/projects/blue-purple-pages01-21-v6.json');
const project=readDocument(file);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative=file=>path.relative(root,file).replaceAll('\\','/');
const approved=require('../revision-05/SELECTION.json');
for(const page of approved.pages)if(sha(page.path).toUpperCase()!==page.sha256)throw Error('Master statique modifié '+page.page);
const report={date:new Date().toISOString(),stage:'frozen-before-exports',document:relative(file),sha256:sha(file),engine:h.engine(),
 duration:project.timeline.duration,pages:project.pages.length,segments:project.pages.reduce((sum,p)=>sum+p.data.panels.length,0),voices:project.timeline.tracks.length,
 staticApproval:'docs/comics/blue-purple-motion/production/chapter-03-continuation/revision-05/APPROVAL.md',approvedPdfSha256:approved.pdf_sha256,
 files:project.files.map(file=>({file:relative(file),bytes:fs.statSync(file).size,sha256:sha(file)}))};
fs.writeFileSync(path.join(__dirname,process.argv[3]??'SOURCE-LOCK.json'),JSON.stringify(report,null,2),{flag:'wx'});
console.info(JSON.stringify({pages:report.pages,segments:report.segments,voices:report.voices,duration:report.duration,files:report.files.length,engine:report.engine.length}));
