/* Explicitly retain maintained skills/profiles and the helpers used for replay. */
const fs=require('node:fs'),path=require('node:path');
const h=require('./common.cjs');
const target=path.join(__dirname,'EXTRA-SOURCES.json'),previous=h.read(target),names=new Set(previous),entries=[];
const reportFile=path.join(__dirname,'EXTRA-SOURCES-CONTEXT.json');
if(fs.existsSync(reportFile))throw Error('Ajout de contexte déjà enregistré.');
function add(input,category,expected){
  const file=h.localFile(path.resolve(h.ROOT,input)),name=h.relative(file),sha256=h.hash(file);
  if(expected&&sha256.toLowerCase()!==expected.toLowerCase())throw Error(`Source changée : ${name}`);
  names.add(name);entries.push({file:name,sha256,bytes:fs.statSync(file).size,category});
}
function tree(folder,category){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  const file=path.join(folder,entry.name);if(entry.isSymbolicLink()||['frames','node_modules','__pycache__'].includes(entry.name))continue;
  if(entry.isDirectory())tree(file,category);else add(file,category);
}}
for(const name of ['holt-motion-comics','holt-motion-storyboard','holt-motion-art','holt-motion-voice','holt-motion-sound','holt-motion-animation','holt-motion-delivery','holt-frontend-design','holt-audio','holt-comics'])tree(path.join(h.ROOT,'.agents/skills',name),'maintained-canonical-skill-and-metadata');
for(const entry of fs.readdirSync(path.join(h.ROOT,'docs/process/agents'),{withFileTypes:true}))if(entry.isFile()&&entry.name.startsWith('anime'))add(`docs/process/agents/${entry.name}`,'canonical-anime-agent-profile');
for(const file of ['docs/process/AGENT-WORKFLOW.md','docs/process/agent-profiles.json','docs/anime/STUDIO-PROMPT.md','docs/anime/README.md','docs/anime/SCREENPLAY.md',
 'docs/chapters/ch3/SCENARIO.md','docs/chapters/CH2-LEGACY.md','docs/art/COMICS-WORKFLOW.md','docs/art/UI-DESIGN-SYSTEM.md',
 'docs/process/reviews/2026-11-07-comics-session-lessons.md'])add(file,'linked-production-source-or-maintenance-evidence');
for(const file of ['anime/holt_anime/__init__.py','anime/holt_anime/voice_take.py'])add(file,'exact-voice-generation-helper');
const voicePlan=h.read(path.join(__dirname,'../voice/PLAN.json'));
add(voicePlan.historicalCounter,'historical-cumulative-voice-accounting',voicePlan.historicalCounterSha256);
add(h.ffmpeg,'exact-local-ffmpeg-used-for-render-and-audit');
for(const file of ['art-masters/tools/audio-python/imageio_ffmpeg/binaries/README.md','art-masters/tools/audio-python/imageio_ffmpeg-0.6.0.dist-info/LICENSE'])add(file,'bundled-media-tool-provenance');
fs.writeFileSync(target,JSON.stringify([...names].sort(),null,2));
const report={status:'completed',checkedAt:new Date().toISOString(),listSha256:h.hash(target),priorFiles:previous.length,totalFiles:names.size,newUniqueFiles:names.size-previous.length,entries,
 policy:'Dot directories are read only. Only the extra-source list is edited; source skills/profiles/helpers remain untouched.'};
fs.writeFileSync(reportFile,JSON.stringify(report,null,2),{flag:'wx'});
console.info(JSON.stringify({before:previous.length,after:names.size,added:report.newUniqueFiles,ffmpegSha256:h.hash(h.ffmpeg)}));
