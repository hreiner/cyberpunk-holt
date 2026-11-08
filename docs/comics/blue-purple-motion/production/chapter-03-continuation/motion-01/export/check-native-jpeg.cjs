/* Verify that journal-selected natives depict the approved JPEG, allowing JPEG loss. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('./common.cjs');
const source=h.read(path.join(__dirname,'EXTRA-SOURCES-PROVENANCE.json'));
const destination=h.newDirectory(path.resolve(process.argv[2]??'')),results=[];
for(const entry of source.natives){
  const native=h.localFile(path.resolve(h.ROOT,entry.native)),jpeg=h.localFile(path.resolve(h.ROOT,entry.approvedJpeg));
  assert.equal(h.hash(native),entry.nativeSha256);assert.equal(h.hash(jpeg),entry.approvedJpegSha256);
  const measurement=h.run(h.ffmpeg,['-nostdin','-hide_banner','-i',native,'-i',jpeg,'-lavfi','ssim','-frames:v','1','-f','null','-']).stderr;
  const match=/SSIM Y:([\d.]+).*?All:([\d.]+)/.exec(measurement);assert(match,`Mesure SSIM absente : ${entry.id}`);
  const result={...entry,lumaSsim:Number(match[1]),allSsim:Number(match[2])};results.push(result);
  console.info(`${entry.id} Y=${result.lumaSsim} all=${result.allSsim}`);
}
const status=results.every(entry=>entry.lumaSsim>=.965&&entry.allSsim>=.93)?'completed':'needs-source-review';
const report={status,checkedAt:new Date().toISOString(),method:'Native/JPEG journal hashes checked; FFmpeg SSIM with identical source dimensions and no geometric resize. Thresholds detect a different image, not artistic correctness; JPEG chroma subsampling changes pixels.',
 sourceSha256:h.hash(path.join(__dirname,'EXTRA-SOURCES-PROVENANCE.json')),lumaMinimum:Math.min(...results.map(entry=>entry.lumaSsim)),allMinimum:Math.min(...results.map(entry=>entry.allSsim)),results};
fs.writeFileSync(path.join(destination,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});
console.info(JSON.stringify({status,drawings:results.length,minY:report.lumaMinimum,minAll:report.allMinimum}));if(status!=='completed')process.exitCode=1;
