const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../core.js'),effects=require('../effects.js'),layers=require('../layers.js');

const manifest=()=>({schemaVersion:1,version:1,title:'Matières et révélations',image:'master.png',overviewSeconds:1,transitionSeconds:.2,outroSeconds:.2,
 panels:[{id:'screen',rect:[.1,.1,.8,.8],holdSeconds:6,cues:[]}],effects:[{type:'rain',rect:[.1,.1,.8,.8],clipPolygon:[[.1,.1],[.9,.1],[.8,.9],[.2,.9]],count:24,speed:.65,strength:.35}]});
function recording(id='canvas'){
 const calls=[],gradient={addColorStop:(...args)=>calls.push(['stop',...args])};
 const ctx=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>o[k]??((...args)=>calls.push([k,...args.map(v=>v?.id??v)])),set:(o,k,v)=>{o[k]=v;calls.push(['set',k,v]);return true;}});
 return{calls,canvas:{id,width:1000,height:500,getContext:()=>ctx}};
}

test('les polygones restent simples, non vides et contenus dans leur matière ou leur calque',()=>{
 assert.doesNotThrow(()=>core.buildTimeline(manifest()));
 for(const polygon of [ [[.1,.1],[.2,.2]],[[.1,.1],[.95,.1],[.8,.8]],[[.1,.1],[.8,.8],[.1,.8],[.8,.1]],[[.1,.1],[.2,.2],[.3,.3]],[[.1,.1],[.1,.1],[.8,.8]] ]){
  const bad=manifest();bad.effects[0].clipPolygon=polygon;assert.throws(()=>core.buildTimeline(bad));
 }
 const data=manifest();data.motionBaseImage='art.png';data.motionLayers=[{id:'glass',panelId:'screen',mode:'frames',rect:[.1,.1,.8,.8],clipPolygon:[[.2,.2],[.8,.2],[.75,.8],[.25,.8]],startSeconds:1.2,endSeconds:6,frames:[{atSeconds:0,image:'glass.png'}]}];
 assert.doesNotThrow(()=>core.buildTimeline(data));data.motionLayers[0].clipPolygon[0]=[0,0];assert.throws(()=>core.buildTimeline(data));
});

test('une enveloppe de matière attaque, tient et s’éteint sur le seul temps narratif borné',()=>{
 const fx={type:'reflection',rect:[0,0,1,1],clock:'story',startSeconds:1,endSeconds:3,envelope:{attackSeconds:.4,releaseSeconds:.4}};
 assert.equal(effects.sample(fx,900,.9).gain,0);assert.equal(effects.sample(fx,900,1).gain,0);
 assert(Math.abs(effects.sample(fx,1,1.2).gain-.5)<1e-10);assert.equal(effects.sample(fx,1,2).gain,1);
 assert(Math.abs(effects.sample(fx,900,2.8).gain-.5)<1e-10);assert.equal(effects.sample(fx,900,3).gain,0);
 assert.equal(effects.sample(fx,2,2).gain,effects.sample(fx,900,2).gain);
 assert.equal(effects.sample(fx,900,3-1e-12).active,false,'La borne exacte absorbe l’erreur de représentation, sans prolonger la lumière.');
 for(const change of [d=>{d.effects[0].clock='ambient';},d=>{delete d.effects[0].endSeconds;},d=>{d.effects[0].envelope.releaseSeconds=9;},d=>{d.effects[0].type='hair';}]){
  const data=manifest();data.effects=[structuredClone(fx)];change(data);assert.throws(()=>core.buildTimeline(data));
 }
});

test('la pluie garde exactement son dessin historique par défaut et permet deux profondeurs lisibles',()=>{
 const image={id:'source',width:1000,height:500},fx={type:'rain',rect:[0,0,1,1]};
 const paint=effect=>{const r=recording();effects.render.canvas=r.canvas;effects.render(image,[effect],2);return r.calls;};
 assert.deepEqual(paint(fx),paint({...fx,count:14,speed:1,strength:1}));
 assert.deepEqual(paint(fx),paint({...fx,count:48,speed:.9,strength:.48,color:'#74b8e6'}),'La couverture historique garde ses paramètres alors ignorés.');
 assert.notDeepEqual(paint(fx),paint({...fx,rainFlow:true,count:36,speed:1.15,strength:.6}));
 const data=manifest();data.effects[0].strength=1;assert.doesNotThrow(()=>core.buildTimeline(data));
});

test('les crêtes d’eau se déplacent sans aléatoire et restent découpées par le polygone',()=>{
 const image={id:'eau',width:1000,height:500},fx={type:'wave',rect:[.1,.3,.7,.4],clipPolygon:[[.1,.3],[.8,.3],[.7,.7],[.2,.7]],count:8,amplitude:2.5,strength:.5,speed:.7};
 const paint=time=>{const r=recording();effects.render.canvas=r.canvas;effects.render(image,[fx],time);return r.calls;};
 assert.deepEqual(paint(2),paint(2));assert.notDeepEqual(paint(2),paint(3));
 assert(paint(2).some(c=>c[0]==='closePath'));assert(paint(2).some(c=>c[0]==='stroke'));
 assert(!paint(2).some(c=>c.slice(1).some(v=>typeof v==='number'&&!Number.isFinite(v))));
});

test('le masque final cache la case et ses lettres sans polluer sa source ni empêcher un retour au début',()=>{
 const source={id:'source',width:1000,height:500},panels=[{id:'later',rect:[.2,.3,.4,.5]}],reveals=[{panelId:'later',atSeconds:5.1}],r=recording();
 assert.equal(layers.concealPanels(source,panels,reveals,4,true,r.canvas),r.canvas);
 assert(r.calls.some(c=>c[0]==='fillRect'&&c.slice(1).join(',')==='200,150,400,250'));
 assert.equal(layers.concealPanels(source,panels,reveals,5.1,true,r.canvas),source);
 assert.equal(layers.concealPanels(source,panels,reveals,(380.89+5.1)-380.89,true,r.canvas),source);
 assert.equal(layers.concealPanels(source,panels,reveals,0,false,r.canvas),source);
 assert.equal(layers.concealPanels(source,panels,reveals,0,true,r.canvas),r.canvas);
 assert.throws(()=>layers.concealPanels(source,panels,reveals,0,true,source));
 const data=manifest();data.panelReveals=[{panelId:'screen',atSeconds:2}];assert.doesNotThrow(()=>core.buildTimeline(data));
 data.panelReveals.push({panelId:'screen',atSeconds:3});assert.throws(()=>core.buildTimeline(data));
 data.panelReveals=[{panelId:'screen',atSeconds:99}];assert.throws(()=>core.buildTimeline(data));
});
