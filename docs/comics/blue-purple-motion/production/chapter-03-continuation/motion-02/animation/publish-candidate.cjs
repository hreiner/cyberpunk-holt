const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../../../..'),core=require(path.join(root,'anime/motion-comics/core.js'));
const n=Number(process.argv[2]);if(![16,17].includes(n))throw Error('Usage: node publish-candidate.cjs 16|17');
const source=path.join(__dirname,'candidates-v1','page-'+n+'.json'),target=path.join(root,'anime/motion-comics/projects',`blue-purple-page${n}-motion05.json`);
const data=core.rebaseAssets(JSON.parse(fs.readFileSync(source,'utf8')),p=>path.relative(path.dirname(target),path.resolve(path.dirname(source),p)).split(path.sep).join('/'));
data.provenance.motion02=path.relative(root,path.join(__dirname,'CONTRACTS.json')).split(path.sep).join('/');
data.provenance.candidateSource=path.relative(root,source).split(path.sep).join('/');
data.title=`HOLT — Blue Purple · page ${n} · animation 2`;
fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const trace={candidateSource:source,candidateSourceSha256:sha(source),canonicalManifest:target,canonicalSha256:sha(target)};
fs.writeFileSync(path.join(__dirname,'CANONICAL-'+n+'.json'),JSON.stringify(trace,null,2)+'\n',{flag:'wx'});
const targets=[16,17].map(page=>path.join(root,'anime/motion-comics/projects',`blue-purple-page${page}-motion05.json`));
if(targets.every(f=>fs.existsSync(f))){
 const sequence={kind:'motion-comic-sequence',schemaVersion:1,version:1,title:'Blue Purple — revue ciblée16–17',pages:targets.map((f,i)=>({id:'page-'+(i+16),manifest:path.relative(__dirname,f).split(path.sep).join('/')}))};
 fs.writeFileSync(path.join(__dirname,'review-sequence.json'),JSON.stringify(sequence,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify(trace));
