const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {ROOT,FFMPEG,decode,channels}=require('./mix-engine.cjs');
const arg=(key,fallback)=>process.argv.includes(key)?process.argv[process.argv.indexOf(key)+1]:fallback;
const actual=path.resolve(ROOT,arg('--actual','art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/exports/pages-09-21/render-v1/motion-comic.mp4'));
const expected=path.resolve(ROOT,arg('--expected','art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/soundtrack-v2/preview-renderer-stereo-aac.m4a'));
const output=path.resolve(ROOT,arg('--output','art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/sound/final-lot-aac-comparison.json'));
if(fs.existsSync(output))throw Error('Comparaison existante conservée.');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function essence(file){const r=spawnSync(FFMPEG,['-hide_banner','-loglevel','error','-i',file,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],{maxBuffer:32*1024*1024});if(r.status!==0)throw Error(String(r.stderr));return {bytes:r.stdout.length,sha256:sha(r.stdout)};}
function record(file){const pcm=decode(file),probe=spawnSync(FFMPEG,['-hide_banner','-i',file],{encoding:'utf8'});return {file:path.relative(ROOT,file).replaceAll('\\','/'),fileSha256:sha(fs.readFileSync(file)),channels:channels(file),pcmSamples:pcm.length,pcmSha256:sha(Buffer.from(pcm.buffer,pcm.byteOffset,pcm.byteLength)),aac:essence(file),audioMetadata:probe.stderr.split(/\r?\n/).find(line=>line.includes('Audio:'))?.trim()};}
const left=record(expected),right=record(actual);
const report={schemaVersion:1,date:'2026-11-07',expected:left,actual:right,pcmIdentical:left.pcmSha256===right.pcmSha256&&left.pcmSamples===right.pcmSamples,aacEssenceIdentical:left.aac.sha256===right.aac.sha256&&left.aac.bytes===right.aac.bytes,targetCodec:'AAC LC stereo192k',humanListening:'not-performed'};
if(!report.pcmIdentical||!report.aacEssenceIdentical)throw Error('Mix AAC final différent de préécoute exacte ; diagnostic requis.');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
