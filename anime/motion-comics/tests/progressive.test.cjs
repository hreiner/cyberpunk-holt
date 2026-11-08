const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {assertSequence,createPageLoader}=require('../sequence.js');
const {readDocument}=require('../sequence.cjs');
const descriptor=()=>({kind:'motion-comic-sequence',schemaVersion:1,version:1,title:'Lecture progressive',loadingMode:'progressive',pages:[{id:'cover',manifest:'page.json',thumbnail:'thumb.png'}]});
test('le chargement progressif reste optionnel et ses miniatures sont des médias locaux vérifiés',t=>{
 const data=descriptor();assert.doesNotThrow(()=>assertSequence(data));delete data.loadingMode;assert.doesNotThrow(()=>assertSequence(data));
 for(const value of ['lazy',true,null])assert.throws(()=>assertSequence({...data,loadingMode:value}),/loadingMode/);
 for(const value of ['https://exemple.fr/a.png','/tmp/a.png','C:/a.png','thumb.png?q=1',''])assert.throws(()=>assertSequence({...data,pages:[{...data.pages[0],thumbnail:value}]}),/Miniature/);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'holt-progressive-'));t.after(()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('holt-progressive-'));fs.rmSync(root,{recursive:true,force:true});});
 const page={schemaVersion:1,version:1,title:'Couverture',image:'art.png',panels:[{id:'c',rect:[0,0,1,1],holdSeconds:1}]};
 for(const [file,text]of [['page.json',JSON.stringify(page)],['art.png','art'],['thumb.png','initial thumbnail'],['sequence.json',JSON.stringify(descriptor())]])fs.writeFileSync(path.join(root,file),text);
 const document=readDocument(path.join(root,'sequence.json'),root);assert(document.files.includes(path.join(root,'thumb.png')));assert.equal(document.files.length,3);
 const invalid=descriptor();invalid.pages[0].thumbnail='../outside.png';fs.writeFileSync(path.join(root,'sequence.json'),JSON.stringify(invalid));assert.throws(()=>readDocument(path.join(root,'sequence.json'),root),/dépôt/);
});
test('la file borne le réseau, déduplique et sert la destination froide avant les voisins en attente',async()=>{
 const release=new Map(),started=[];let active=0,peak=0;
 const loader=createPageLoader(index=>new Promise(resolve=>{started.push(index);active++;peak=Math.max(peak,active);release.set(index,()=>{active--;resolve(index);});}),2);
 const first=loader.request(0),second=loader.request(1),neighbor=loader.request(2),cold=loader.request(9,true);
 assert.equal(loader.request(9,true),cold);await Promise.resolve();assert.deepEqual(started,[0,1]);assert.equal(loader.state(9).status,'queued');
 release.get(0)();await first;await new Promise(setImmediate);assert.deepEqual(started,[0,1,9]);
 release.get(1)();await second;await new Promise(setImmediate);assert.deepEqual(started,[0,1,9,2]);
 release.get(9)();release.get(2)();await Promise.all([cold,neighbor]);assert.equal(peak,2);assert.equal(loader.state(9).status,'ready');assert.equal(await loader.request(9),9);assert.deepEqual(started,[0,1,9,2]);
});
test('une panne libère la file et une demande ultérieure réessaie réellement le média',async()=>{
 let attempts=0;const loader=createPageLoader(async index=>{if(index===4&&++attempts===1)throw Error('Média absent');return index;},1);
 const failed=loader.request(4),next=loader.request(5);await assert.rejects(failed,/Média absent/);assert.equal(await next,5);assert.equal(loader.state(4).status,'error');assert.equal(await loader.request(4,true),4);assert.equal(attempts,2);
});
