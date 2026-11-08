const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../core.js');
const layers=require('../layers.js');

const layer=()=>({id:'vision',panelId:'memory',mode:'digitalReveal',rect:[0,0,1,1],startSeconds:1.2,endSeconds:4,
 frames:[{atSeconds:0,image:'elf.png'},{atSeconds:1.5,image:'city.png'}],
 reveal:{durationSeconds:1.05,columns:12,rows:6,amplitudePx:14,color:'#55eafa'}});
const manifest=()=>({schemaVersion:1,version:1,title:'Mémoire révélée',image:'master.png',motionBaseImage:'art.png',letteringImage:'letters.svg',
 overviewSeconds:1,transitionSeconds:.2,outroSeconds:.3,panels:[{id:'memory',rect:[0,0,1,1],holdSeconds:5,cues:[]}],motionLayers:[layer()]});

test('le paysage tient avant sa désagrégation et la carte finale reste exacte après une révélation bornée',()=>{
 const track=layer(),before=JSON.stringify(track);
 assert.equal(layers.sample(track,0).revealProgress,0);
 assert.equal(layers.sample(track,1.2+.44).revealProgress,0);
 assert(layers.sample(track,2).revealProgress>0&&layers.sample(track,2).revealProgress<1);
 assert.equal(layers.sample(track,2.7).revealProgress,1);
 assert.equal(layers.sample(track,900).revealProgress,1);
 for(const t of [2.4,1.3,2.7,0,2.4])assert.deepEqual(layers.sample(track,t),layers.sample(track,t));
 assert.equal(JSON.stringify(track),before);
});

test('la révélation refuse une transition vide, des dimensions excessives et un déplacement de corps',()=>{
 assert.doesNotThrow(()=>core.buildTimeline(manifest()));
 for(const mutate of [
  d=>{d.motionLayers[0].reveal.durationSeconds=0;},d=>{d.motionLayers[0].reveal.durationSeconds=2;},
  d=>{d.motionLayers[0].reveal.columns=25;},d=>{d.motionLayers[0].reveal.rows=2.5;},
  d=>{d.motionLayers[0].reveal.amplitudePx=33;},d=>{d.motionLayers[0].frames.push({atSeconds:2,image:'third.png'});},
  d=>{d.motionLayers[0].keyframes=[{atSeconds:0,translate:[.2,0]}];},d=>{d.motionLayers[0].background='back.png';},
  d=>{d.motionLayers[0].mode='frames';},
 ]){const bad=manifest();mutate(bad);assert.throws(()=>core.buildTimeline(bad));}
 const snapshot=core.rebaseAssets(manifest(),p=>'snapshot/'+p);
 assert.deepEqual(core.assetPaths(snapshot),['snapshot/master.png','snapshot/art.png','snapshot/letters.svg','snapshot/elf.png','snapshot/city.png']);
});

test('les extrémités peintes utilisent un seul vrai dessin et OFF restitue son master',()=>{
 const calls=[],ctx=new Proxy({}, {get:(o,k)=>o[k]??((...args)=>calls.push([k,...args.map(a=>a?.id??a)])),set:(o,k,v)=>{o[k]=v;return true;}});
 layers.render.canvas={width:1000,height:500,getContext:()=>ctx};
 const master={id:'master',width:1000,height:500},assets={'elf.png':{id:'elf',width:1000,height:500},'city.png':{id:'city',width:1000,height:500}};
 const paint=(t,on)=>{calls.length=0;layers.render(master,[layer()],assets,t,on);return calls.filter(c=>c[0]==='drawImage').map(c=>c[1]);};
 assert.deepEqual(paint(1.3,true),['master','elf']);assert.deepEqual(paint(3,true),['master','city']);
 assert.deepEqual(paint(3,false),['master']);assert.deepEqual(paint(999,false),['master']);
});

test('les bandes apparaissent à leur ancre absolue exacte malgré la soustraction flottante',()=>{
 const track={id:'bandes',panelId:'action',mode:'frames',rect:[0,0,1,1],startSeconds:4.050000000000001,endSeconds:7.45,
  frames:[{atSeconds:0,image:'blank.png'},{atSeconds:1.05,image:'covered.png'}]};
 const at=track.startSeconds+track.frames[1].atSeconds;
 assert.equal(layers.sample(track,at-1e-6).frameIndex,0);
 assert.equal(layers.sample(track,at).frameIndex,1);
 assert.equal(layers.sample(track,at+1e-6).frameIndex,1);
 for(const offset of [0,16.25,380.89,10000.25]){
  const global=offset+at,local=global-offset;
  assert.equal(layers.sample(track,local).frameIndex,1,`Ancre exacte après annulation de l’offset ${offset}.`);
  assert.equal(layers.sample(track,global-1e-6-offset).frameIndex,0);
  assert.equal(layers.sample(track,global+1e-6-offset).frameIndex,1);
 }
});
