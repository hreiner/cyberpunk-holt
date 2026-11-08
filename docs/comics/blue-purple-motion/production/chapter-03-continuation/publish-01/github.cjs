/* Explicit publication operations for this checkpoint; credentials stay in memory. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../../../../..');
const REPO='hreiner/cyberpunk-holt',API=`https://api.github.com/repos/${REPO}`;
const args=process.argv.slice(2),mode=args[0];
const option=name=>{const n=args.indexOf(name);return n<0?undefined:args[n+1];};
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function credentials(){
 const response=spawnSync('git',['credential','fill'],{cwd:ROOT,input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}});
 if(response.status!==0)throw Error('Authentification GitHub non disponible via Git.');
 const pairs=Object.fromEntries(response.stdout.trim().split(/\r?\n/).map(line=>{const n=line.indexOf('=');return [line.slice(0,n),line.slice(n+1)];}));
 if(!pairs.password)throw Error('Identifiant GitHub non disponible.');
 return {'Authorization':`Bearer ${pairs.password}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'cyberpunk-holt-publisher'};
}
async function main(){
 if(!['status','release','runs'].includes(mode))throw Error('Usage : github.cjs status | runs --commit SHA | release --commit SHA --archive PATH');
 const headers=credentials();
 const request=async(endpoint,body)=>{
  const response=await fetch(API+endpoint,{headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});
  if(response.status===404)return null;
  if(!response.ok)throw Error(`GitHub ${endpoint} : HTTP ${response.status}`);
  return response.json();
 };
 if(mode==='status'){
  const repo=await request(''),pages=await request('/pages');
  console.info(JSON.stringify({repo:repo.full_name,branch:repo.default_branch,push:repo.permissions?.push,pages:pages?{url:pages.html_url,status:pages.status,type:pages.build_type}:null}));return;
 }
 const commit=option('--commit');if(!/^[a-f0-9]{40}$/.test(commit??''))throw Error('SHA de commit complet requis.');
 if(mode==='runs'){
  const result=await request(`/actions/runs?head_sha=${commit}&per_page=20`);
  console.info(JSON.stringify({commit,runs:result.workflow_runs.map(run=>({id:run.id,name:run.name,status:run.status,conclusion:run.conclusion,url:run.html_url,headSha:run.head_sha}))}));return;
 }
 const config=JSON.parse(fs.readFileSync(path.join(ROOT,'anime/motion-comics/web-release.json'),'utf8'));
 const archive=path.resolve(ROOT,option('--archive')??'');
 if(!archive.startsWith(ROOT+path.sep)||!fs.statSync(archive).isFile())throw Error('Archive locale du dépôt requise.');
 if(fs.statSync(archive).size!==config.release.bytes||sha(archive)!==config.release.sha256)throw Error('Archive différente du verrou web.');
 if(!(await request(`/commits/${commit}`)))throw Error('Pousser ce commit sur la branche de préparation avant de publier la release.');
 const tag=config.release.tag;
 if(!/^[a-z0-9-]+$/.test(tag))throw Error('Tag de publication invalide.');
 let release=await request(`/releases/tags/${tag}`);
 if(!release){
  release=await request('/releases',{tag_name:tag,target_commitish:commit,name:'Blue Purple — chapitre 3, comics animé v10',body:'Couverture musicale et 21 pages, voix anglaises et bulles françaises. Durée : 9 min 44. Paquet statique web dérivé de la sélection v10 approuvée, avec chargement progressif.\n\nLecteur : https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/\n\nSHA-256 du paquet : '+config.release.sha256,draft:false,prerelease:false,make_latest:'false'});
 }
 const remoteCommit=await request(`/commits/${encodeURIComponent(tag)}`);
 if(remoteCommit?.sha!==commit)throw Error('Le tag existant ne désigne pas ce commit ; ne pas écraser une release.');
 const name=path.basename(new URL(config.release.url).pathname);
 if(name!==path.basename(archive))throw Error('Nom du paquet différent de son URL publique.');
 const assets=await request(`/releases/${release.id}/assets`);
 let asset=assets.find(item=>item.name===name);
 if(!asset){
  const upload=`https://uploads.github.com/repos/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`;
  const response=await fetch(upload,{method:'POST',headers:{...headers,'Content-Type':'application/gzip','Content-Length':String(config.release.bytes)},body:fs.createReadStream(archive),duplex:'half'});
  if(!response.ok)throw Error(`Téléversement du paquet : HTTP ${response.status}`);
  asset=await response.json();
 }
 if(asset.state!=='uploaded'||asset.size!==config.release.bytes||asset.digest!=='sha256:'+config.release.sha256)throw Error('Le paquet GitHub ne correspond pas au verrou local.');
 const result={status:'uploaded-and-verified',commit,tag,releaseUrl:release.html_url,assetUrl:asset.browser_download_url,bytes:asset.size,sha256:config.release.sha256,assetId:asset.id};
 const report=path.join(__dirname,'GITHUB-RELEASE.json');
 if(fs.existsSync(report)){if(fs.readFileSync(report,'utf8')!==JSON.stringify(result,null,2)+'\n')throw Error('Rapport existant différent.');}
 else fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.info(JSON.stringify(result));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
