const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildTimeline } = require('../core.js');
const { buildSequence, pageAt, panelTime, musicGain, musicVolumeExpression } = require('../sequence.js');
const { readDocument } = require('../sequence.cjs');
const template = require('../templates/scene.json');
const scene = () => ({...structuredClone(template),overviewSeconds:0.2,transitionSeconds:0.1,gapSeconds:0.1,outroSeconds:0.2,panels:[{id:'case',rect:[0,0,1,1],holdSeconds:0.8,cues:[{audio:'voice.mp3',duration:0.5}]}]});
const sequence = () => ({kind:'motion-comic-sequence',schemaVersion:1,version:1,title:'Séquence témoin',pages:[{id:'first',manifest:'page1.json'},{id:'second',manifest:'page2.json'}]});

test('le changement de page conserve toutes les voix sans chevauchement ni silence ajouté', () => {
 const pages=[scene(),scene()], result=buildSequence(sequence(),pages), local=buildTimeline(pages[0]);
 assert.equal(result.duration,local.duration*2);
 assert.equal(result.pages[1].start,result.pages[0].end);
 assert.equal(result.tracks[1].start,local.duration+local.tracks[0].start);
 assert(result.tracks[0].end<result.pages[0].end);
 assert.equal(pageAt(result,result.pages[0].end-0.00001).index,0);
 assert.equal(pageAt(result,result.pages[0].end).index,1);
 assert.equal(pageAt(result,result.duration).index,1);
 assert.equal(pageAt(result,-1).index,0);
 assert.equal(panelTime(result,1,0,pages),result.pages[1].start+0.3);
 assert.throws(()=>pageAt(result,NaN),/finie/);
 assert.throws(()=>panelTime(result,2,0,pages),/Page inconnue/);
});

test('les formats ambigus, identifiants répétés et chemins distants sont refusés', () => {
 for(const mutate of [d=>d.schemaVersion=2,d=>delete d.kind,d=>d.pages[1].id='first',d=>d.pages=[],d=>d.pages[1].manifest='https://example.org/x.json',d=>d.pages[1].manifest='C:/secret.json',d=>d.music={audio:'https://example.org/music.mp3'},d=>d.music={audio:'music.mp3',gain:2}]){
  const data=sequence();mutate(data);assert.throws(()=>buildSequence(data,[scene(),scene()]));
 }
});

test('le fond continu respecte les fondus et la baisse douce sous les voix dans les deux moteurs', () => {
 const music={audio:'music.mp3',gain:0.08,fadeSeconds:0.5}, tracks=[{start:1,end:2},{start:2.1,end:3}];
 assert.equal(musicGain(0,4,music,tracks),0);
 assert.equal(musicGain(4,4,music,tracks),0);
 assert.equal(musicGain(0.5,4,music,tracks),0.08);
 assert(Math.abs(musicGain(1.5,4,music,tracks)-0.036)<1e-9);
 const expression=musicVolumeExpression(4,music,tracks).replaceAll('max(','Math.max(').replaceAll('min(','Math.min(');
 const ffmpegEquivalent=new Function('t',`return ${expression}`);
 for(let t=0;t<=4;t+=0.01)assert(Math.abs(ffmpegEquivalent(t)-musicGain(t,4,music,tracks))<1e-10);
 assert(musicGain(0.9,4,music,tracks)<musicGain(0.85,4,music,tracks));
});

test('le backing prémixé conserve ses effets et ses fondus sans seconde baisse sous les voix', () => {
 const config={audio:'backing.wav',preMixed:true,gain:0.9,fadeSeconds:0.5},tracks=[{start:1,end:2}];
 for(const time of [0,0.1,1,1.5,2,3.9,4])assert.equal(musicGain(time,4,config,tracks),0.9);
 assert.equal(musicVolumeExpression(4,config,tracks),'0.9');
 assert.equal(musicGain(1.5,4,{audio:'backing.wav',preMixed:true},tracks),1);
 const data=sequence();data.music={...config,preMixed:'oui'};assert.throws(()=>buildSequence(data,[scene(),scene()]),/booléen/);
});

test('la lecture locale résout les médias par page et refuse de sortir du dépôt', t => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'holt-sequence-test-'));
 t.after(()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('holt-sequence-test-'));fs.rmSync(root,{recursive:true,force:true});});
 fs.mkdirSync(path.join(root,'pages'));
 fs.writeFileSync(path.join(root,'pages','page.png'),'image');fs.writeFileSync(path.join(root,'pages','voice.mp3'),'voix');fs.writeFileSync(path.join(root,'music.mp3'),'musique');
 const data=sequence();data.pages[0].manifest='pages/page1.json';data.pages[1].manifest='pages/page2.json';data.music={audio:'music.mp3'};
 const page=scene();page.image='page.png';for(const entry of data.pages)fs.writeFileSync(path.join(root,entry.manifest),JSON.stringify(page));
 const source=path.join(root,'sequence.json');fs.writeFileSync(source,JSON.stringify(data));
 const project=readDocument(source,root);assert.equal(project.kind,'sequence');assert.equal(project.timeline.tracks[1].audioFile,path.join(root,'pages','voice.mp3'));assert.equal(project.musicFile,path.join(root,'music.mp3'));assert.equal(project.files.length,5);
 data.pages[0].manifest='../outside.json';fs.writeFileSync(source,JSON.stringify(data));assert.throws(()=>readDocument(source,root),/dépôt/);
});
