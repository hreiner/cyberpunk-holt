/* Pure timing conversion: no IO, no voice stretching, no writes to selected projects. */
const core=require('../../../../../../../anime/motion-comics/core.js');
const PROFILE=Object.freeze({overviewSeconds:2,transitionSeconds:.85,outroSeconds:1.5,gapSeconds:.45,leadInSeconds:.35,minimumCalmHold:5.5,wordsPerSecond:3,readingMargin:.6,voiceTail:.8});
const SPECIAL=Object.freeze({
 '09-2':{leadInSeconds:1.45,reason:'Carte stabilisée avant la réplique de Franklyn ; exception approuvée root'},
 '13-2-detail':{minimum:3,tail:.5,reason:'Insert muet de réflexion'},
 '15-3':{minimum:7,reason:'Fermeture de capsule lisible'},
 '16-1':{minimum:7.5,reason:'Paysage, déverrouillage, carte puis lecture'},
 '17-1':{minimum:3.8,tail:.4,reason:'Repérage tendu'},
 '17-2':{minimum:4.6,tail:.4,reason:'Trois états, tir, impact et couvert'},
 '17-3':{minimum:3.8,tail:.4,reason:'Départ de fuite'},
 '18-after':{minimum:2.2,tail:.3,reason:'Conséquence brève du contact'},
 '20-2':{minimum:4.5,tail:.5,reason:'Saisie tendue'},
 '21-1':{minimum:7,reason:'Découverte et ouverture de porte'},
 '21-3':{minimum:7,reason:'Retombée finale du groupe'},
});
const ceilFrame=value=>Math.ceil((value-1e-9)*24)/24;
const keyOf=panel=>panel.panelKey??panel.sourcePanelKey??panel.id.replace(/^p(\d+)-c0?/, '$1-');
const words=text=>(text.match(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu)??[]).length;
function mapTime(points,time){
 if(!Number.isFinite(time))throw Error('Temps fini requis.');
 if(time<=points[0].old)return points[0].new+(time-points[0].old);
 for(let i=1;i<points.length;i++)if(time<=points[i].old+1e-10){const a=points[i-1],b=points[i];return b.old===a.old?b.new:a.new+(time-a.old)*(b.new-a.new)/(b.old-a.old);}
 const last=points.at(-1);return last.new+time-last.old;
}
function getTiming(source,pageNumber){
 const data=structuredClone(source),old=core.buildTimeline(source);
 if(pageNumber<9||pageNumber>21){const points=[{old:0,new:0},{old:old.duration,new:old.duration}];return {data,oldTimeline:old,newTimeline:old,points,mapPageTime:t=>mapTime(points,t),panels:[]};}
 for(const name of ['overviewSeconds','transitionSeconds','outroSeconds','gapSeconds'])data[name]=PROFILE[name];
 const panels=[];
 data.panels.forEach((panel,index)=>{
  const key=keyOf(panel),special=SPECIAL[key]??{},cues=panel.cues??[];
  panel.leadInSeconds=Math.max(panel.leadInSeconds??0,special.leadInSeconds??PROFILE.leadInSeconds);
  // Keep explicitly directed pauses at least as long as before; never alter cue durations.
  for(const cue of cues)cue.gapSeconds=Math.max(cue.gapSeconds??0,PROFILE.gapSeconds);
  const wordCount=words(cues.map(c=>c.textFr??'').join(' '));
  const readingSeconds=wordCount/PROFILE.wordsPerSecond+PROFILE.readingMargin;
  const voicedSeconds=panel.leadInSeconds+cues.reduce((n,c)=>n+c.duration+c.gapSeconds,0);
  const minimum=special.minimum??PROFILE.minimumCalmHold,tail=special.tail??PROFILE.voiceTail;
  panel.holdSeconds=ceilFrame(Math.max(panel.holdSeconds??0,minimum,readingSeconds,voicedSeconds+tail));
  panels.push({id:panel.id,key,wordCount,readingSeconds,minimum,voiceBudget:voicedSeconds,tail,holdSeconds:panel.holdSeconds,reason:special.reason??'Lecture et réaction calmes'});
 });
 // Old action clocks are invalid until remapped; compute the new speech/camera grid first.
 const skeleton=structuredClone(data);delete skeleton.motionLayers;delete skeleton.effects;delete skeleton.review;
 const next=core.buildTimeline(skeleton),points=[];
 function point(a,b,label){const last=points.at(-1);if(last&&Math.abs(last.old-a)<1e-9){if(Math.abs(last.new-b)>1e-7)throw Error('Correspondance ambiguë à '+label);return;}points.push({old:a,new:b,label});}
 point(0,0,'page-start');point(old.segments[0].end,next.segments[0].end,'overview-end');
 source.panels.forEach((panel,index)=>{
  const a=old.segments.find(s=>s.panel===index),b=next.segments.find(s=>s.panel===index);
  point(a.start,b.start,panel.id+':transition-start');
  point(a.start+(source.transitionSeconds??core.DEFAULTS.transitionSeconds),b.start+data.transitionSeconds,panel.id+':ready');
  const ta=old.tracks.filter(t=>t.panel===index),tb=next.tracks.filter(t=>t.panel===index);
  for(let i=0;i<ta.length;i++){point(ta[i].start,tb[i].start,panel.id+':voice-'+i+'-start');point(ta[i].end,tb[i].end,panel.id+':voice-'+i+'-end');}
  point(a.end,b.end,panel.id+':end');
  Object.assign(panels[index],{oldStart:a.start,oldReady:a.start+(source.transitionSeconds??core.DEFAULTS.transitionSeconds),oldEnd:a.end,start:b.start,ready:b.start+data.transitionSeconds,end:b.end,voiceStarts:tb.map(t=>t.start),voiceEnds:tb.map(t=>t.end)});
 });
 point(old.duration,next.duration,'page-end');
 const map=t=>mapTime(points,t);
 for(const fx of data.effects??[]){if(fx.startSeconds!==undefined)fx.startSeconds=map(fx.startSeconds);if(fx.endSeconds!==undefined)fx.endSeconds=map(fx.endSeconds);}
 for(const layer of data.motionLayers??[]){const start=layer.startSeconds;layer.startSeconds=map(start);layer.endSeconds=map(layer.endSeconds);for(const frame of layer.frames??[])frame.atSeconds=map(start+frame.atSeconds)-layer.startSeconds;for(const k of layer.keyframes??[])k.atSeconds=map(start+k.atSeconds)-layer.startSeconds;if(layer.impact)layer.impact.atSeconds=map(start+layer.impact.atSeconds)-layer.startSeconds;}
 if(data.review?.sampleTime!==undefined)data.review.sampleTime=map(data.review.sampleTime);
 core.buildTimeline(data);
 return {data,oldTimeline:old,newTimeline:core.buildTimeline(data),points,panels,mapPageTime:map};
}
function applyTiming(source,pageNumber){return getTiming(source,pageNumber).data;}
function mapPageTime(source,pageNumber,time){return getTiming(source,pageNumber).mapPageTime(time);}
module.exports={PROFILE,SPECIAL,applyTiming,getTiming,mapPageTime};
