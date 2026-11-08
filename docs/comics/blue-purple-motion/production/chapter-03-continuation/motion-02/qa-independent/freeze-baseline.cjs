/* Read-only preservation baseline of the selected v8 source/media. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let root=__dirname;while(!fs.existsSync(path.join(root,'AGENTS.md'))){const next=path.dirname(root);if(next===root)throw Error('Racine HOLT introuvable.');root=next;}
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lockFile=path.join(root,'docs/comics/blue-purple-motion/production/chapter-03-continuation/format-01/SELECTION.json');
const lock=JSON.parse(fs.readFileSync(lockFile,'utf8')),manifest=path.join(root,'anime/motion-comics/projects/blue-purple-pages01-21-v8.json');
assert.equal(sha(manifest),lock.selectedSha256);for(const item of lock.files)assert.equal(sha(path.resolve(root,item.file)),item.sha256,`Ancienne source modifiée : ${item.file}`);
const target=path.resolve(process.argv[2]??'');if(!target.startsWith(root+path.sep)||fs.existsSync(target))throw Error('Nouveau fichier local de preuve requis.');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({status:'completed',checkedAt:new Date().toISOString(),source:path.relative(root,manifest).replaceAll('\\','/'),sourceSha256:sha(manifest),lock:path.relative(root,lockFile).replaceAll('\\','/'),lockSha256:sha(lockFile),files:lock.files,mediaPreserved:true},null,2),{flag:'wx'});
console.info(JSON.stringify({status:'completed',files:lock.files.length,sourceSha256:sha(manifest)}));
