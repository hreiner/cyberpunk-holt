/* Reuse the retained eight-page raster, repaint pagination only, render the new suffix
   directly on the full narrative clock. Never splice compressed video or offset caches. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const h = require('./common.cjs');
const [manifest, retainedExport, destination] = process.argv.slice(2);
if (!manifest || !retainedExport || !destination) throw Error('Usage : export-complete.cjs MANIFEST_COMPLET CACHE_1_8 DOSSIER_NEUF [--proof-only]');
const manifestFile = h.localFile(path.resolve(manifest)), cache = path.resolve(retainedExport);
const previousReportFile = h.localFile(path.join(cache, 'report.json'));
const previous = h.read(previousReportFile), previousOriginsFile = h.localFile(path.join(cache, 'frame-origins.json'));
assert.equal(previous.status, 'completed'); assert.equal(previous.fps, 24); assert.equal(previous.decoded, true);
const old = h.readDocument(h.localFile(previous.source)), project = h.readDocument(manifestFile);
assert.equal(h.hash(old.manifestFile), previous.sourceHash, 'Manifeste historique modifié.');
for (const item of previous.media) assert.equal(h.hash(h.localFile(path.resolve(h.ROOT, item.file))), item.sha256, `Média historique modifié : ${item.file}`);
assert(old.pages.length === 8 && project.pages.length === 21, 'Cet outil est borné à la reprise1–8 vers1–21.');
function visual(page) {
  const data = h.core.rebaseAssets(page.data, file => h.hash(h.localFile(path.resolve(path.dirname(page.manifestFile), file))));
  for (const key of ['version', 'title', 'provenance', 'source', 'review', 'music']) delete data[key];
  // Cues still keep speaker and measured duration: both affect the exported pixels/timing.
  return data;
}
for (let index = 0; index < old.pages.length; index++) {
  assert.deepEqual(visual(project.pages[index]), visual(old.pages[index]), `Configuration préfixe différente : page${index + 1}`);
  assert.deepEqual(project.timeline.pages[index], old.timeline.pages[index], `Temps préfixe différents : page${index + 1}`);
}
assert.deepEqual(project.timeline.tracks.slice(0, old.timeline.tracks.length), old.timeline.tracks, 'Pistes préfixe différentes.');
const engine = h.engine();
const permittedEngineChanges = new Set(['anime/motion-comics/render.cjs', 'anime/motion-comics/package.json', 'anime/motion-comics/reader.js', 'anime/motion-comics/core.js']);
const engineChanges = previous.engine.filter(item => h.hash(h.localFile(path.resolve(h.ROOT, item.file))) !== item.sha256);
assert(engineChanges.every(item => permittedEngineChanges.has(item.file)), 'Moteur visuel différent : rendre le préfixe neuf.');
const fps = 24, prefixFrames = Math.ceil(old.timeline.duration * fps), count = Math.ceil(project.timeline.duration * fps);
assert.equal(previous.frames, prefixFrames);
const inventory = h.read(previousOriginsFile).frames;
assert.equal(inventory.length, prefixFrames);
const output = h.newDirectory(path.resolve(destination)), proofOnly = process.argv.includes('--proof-only');
const proofDirectory = path.join(output, 'cache-proof'); fs.mkdirSync(proofDirectory);
if (!proofOnly) fs.mkdirSync(path.join(output, 'frames'));
const media = project.files.map(file => ({ file: h.relative(file), sha256: h.hash(file) }));
const report = { status: 'running', startedAt: new Date().toISOString(), kind: project.kind, source: manifestFile,
  sourceHash: h.hash(manifestFile), engineVersion: require(path.join(h.ROOT, 'anime/motion-comics/package.json')).version,
  engine, media, fps, duration: project.timeline.duration, frames: count,
  retainedCache: { source: h.relative(cache), reportSha256: h.hash(previousReportFile), originsSha256: h.hash(previousOriginsFile),
    prefixDuration: old.timeline.duration, prefixFrames, engineChanges, firstSuffixFrame: prefixFrames,
    firstSuffixGlobalTime: prefixFrames / fps, firstSuffixLocalTime: prefixFrames / fps - old.timeline.duration,
    suffixRenderedOnGlobalClock: true, independentSuffixCacheUsed: false },
  paginationRect: [18, 14, 190, 30], productionTools: ['common.cjs', 'export-complete.cjs', 'copy-prefix.py'].map(file => ({file:h.relative(path.join(__dirname,file)),sha256:h.hash(path.join(__dirname,file))})) };
const write = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); write();
(async () => {
  let browser, preview;
  try {
    preview = await h.preview(manifestFile);
    browser = await chromium.launch({headless: true, executablePath:h.browserPath});
    const page = await browser.newPage({viewport:{width:1400,height:900}}); await page.goto(preview.url);
    await page.waitForFunction(() => window.motionComic?.duration > 0 && !document.querySelector('#play').disabled);
    await page.evaluate(() => {window.motionComic.setRenderMode(true);window.motionComic.setEffects(true);});
    const state = await page.evaluate(() => ({duration:window.motionComic.duration, tracks:window.motionComic.tracks,segments:window.motionComic.segments,pages:window.motionComic.pages}));
    assert(Math.abs(state.duration-project.timeline.duration)<1e-8);
    async function png(index, target) {
      const data = await page.evaluate(t => {window.motionComic.seek(t);return document.querySelector('#screen').toDataURL('image/png').split(',')[1];}, index/fps);
      fs.writeFileSync(target, Buffer.from(data,'base64'),{flag:'wx'});
    }
    const indices = new Set([0,prefixFrames-1]);
    for (const retained of old.timeline.pages) {
      const first = Math.ceil(retained.start*fps), last = Math.min(prefixFrames-1,Math.ceil(retained.end*fps)-1);
      for (const index of [first,last,Math.floor((first+last)/2)]) if(index>=0&&index<prefixFrames) indices.add(index);
      for (const layer of old.pages[retained.index].data.motionLayers??[]) for (const frame of layer.frames) {
        const index=Math.ceil((retained.start+layer.startSeconds+frame.atSeconds)*fps);
        for(const guard of [index-1,index,index+1])if(guard>=first&&guard<=last)indices.add(guard);
      }
    }
    const patches = [], witnesses=[];
    for (const retained of old.timeline.pages) {
      const index = Math.ceil(retained.start*fps), image = path.join(proofDirectory,`pagination-page-${retained.index+1}.png`);
      await png(index,image); patches.push({page:retained.index,image});
    }
    for (const index of [...indices].sort((a,b)=>a-b)) {
      const image=path.join(proofDirectory,h.frameName(index));await png(index,image);witnesses.push({index,image});
    }
    const frames = inventory.map((frame,index)=>{
      assert.equal(frame.index,index);
      return {index,sha256:frame.sha256,page:h.sequence.pageAt(old.timeline,index/fps).index};
    });
    const planFile=path.join(proofDirectory,'prefix-plan.json');
    fs.writeFileSync(planFile,JSON.stringify({output,cache,ffmpeg:h.ffmpeg,fps,paginationRect:report.paginationRect,proofOnly,patches,witnesses,frames},null,2),{flag:'wx'});
    const copied = h.run(h.python,[path.join(__dirname,'copy-prefix.py'),planFile]);console.info(copied.stdout.trim());
    if (proofOnly) {
      assert.deepEqual(h.engine(),engine,'Moteur modifié pendant les témoins.');
      for(const item of media)assert.equal(h.hash(h.localFile(path.resolve(h.ROOT,item.file))),item.sha256,`Média modifié pendant les témoins : ${item.file}`);
      assert.equal(h.hash(manifestFile),report.sourceHash);
      Object.assign(report,{status:'completed',finishedAt:new Date().toISOString(),proofOnly:true,witnesses:witnesses.length});write();return;
    }
    h.snapshot(project,output);
    const origins=h.read(path.join(proofDirectory,'prefix-copy-report.json')).frames;
    for(let index=prefixFrames;index<count;index++){
      const target=path.join(output,'frames',h.frameName(index));await png(index,target);
      origins.push({index,time:index/fps,origin:'new-suffix-full-timeline-render',sha256:h.hash(target)});
      if(index%240===0)console.info(`Images nouvelles : ${index-prefixFrames+1}/${count-prefixFrames}`);
    }
    fs.writeFileSync(path.join(output,'frame-origins.json'),JSON.stringify({retainedCache:report.retainedCache,paginationRect:report.paginationRect,frames:origins},null,2),{flag:'wx'});
    await page.evaluate(()=>window.motionComic.seek(0));await page.locator('#screen').screenshot({path:path.join(output,'overview.png')});
    report.encodeArguments=h.encode(project,output,fps);
    assert.deepEqual(h.engine(),engine,'Moteur modifié pendant le rendu.');
    for(const item of media)assert.equal(h.hash(h.localFile(path.resolve(h.ROOT,item.file))),item.sha256,`Média modifié pendant le rendu : ${item.file}`);
    assert.equal(h.hash(manifestFile),report.sourceHash);
    assert.equal(h.hash(previousReportFile),report.retainedCache.reportSha256);
    assert.equal(h.hash(previousOriginsFile),report.retainedCache.originsSha256);
    Object.assign(report,{status:'completed',finishedAt:new Date().toISOString(),tracks:state.tracks,segments:state.segments,pages:state.pages,
      music:project.data.music??null,decoded:true,copiedRetainedRasters:prefixFrames,paginationPatchedFrames:prefixFrames,renderedFrames:count-prefixFrames,
      frameOriginsSha256:h.hash(path.join(output,'frame-origins.json')),output:path.join(output,'motion-comic.mp4'),outputSha256:h.hash(path.join(output,'motion-comic.mp4'))});write();
    console.info(JSON.stringify({output,duration:state.duration,frames:count,retained:prefixFrames,rendered:count-prefixFrames,sha256:report.outputSha256}));
  }catch(error){Object.assign(report,{status:'failed',finishedAt:new Date().toISOString(),error:error.message});write();throw error;}
  finally{if(browser)await browser.close();if(preview)preview.child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
