const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../../../..');
const out=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/map');
fs.mkdirSync(out,{recursive:true});
const source=path.resolve(process.argv[2]),target=path.join(out,'reference-user-night-city.png');
fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
const bytes=fs.readFileSync(target),sha=crypto.createHash('sha256').update(bytes).digest('hex');
const report={sourceProvidedByUser:source,copy:path.relative(root,target).replaceAll('\\','/'),sha256:sha,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),inspected:true,geography:'Baywest; offshoreisland/runway/3installations; Watsonnorth; CityCentercentral; Heywoodsouthwest; Westbrooknortheast; SantoDomingosoutheast; Badlandseast.',use:'Primary geography reference, restyle as comic cyberpunk; do not replace with generic grid.'};
fs.writeFileSync(path.join(__dirname,'REFERENCE.json'),JSON.stringify(report,null,2),{flag:'wx'});console.info(JSON.stringify(report));
