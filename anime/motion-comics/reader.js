/* global window, document, matchMedia, requestAnimationFrame, Image, Audio, URL, URLSearchParams, location, fetch, structuredClone, ResizeObserver, AbortController, setTimeout, clearTimeout */
const canvas = document.querySelector('#screen'),
  ctx = canvas.getContext('2d'),
  core = window.motionComicCore,
  sequence = window.motionComicSequence;
const reader = document.querySelector('#reader'),
  drawer = document.querySelector('#pages-drawer');
let muted = false,
  ready = false,
  idleTimer = null,
  chromeHidden = false;
const thumbnailCanvases = [];
let manualRendering = false,
  effectTime = 0,
  lastDraw = 0,
  effectsEnabled = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let manifest = null,
  img = null,
  segments = [],
  tracks = [],
  duration = 0,
  position = 0,
  playing = false,
  last = 0,
  pages = [],
  timeline = null,
  documentData = null,
  music = null;
let progressive = false,
  pageLoader = null,
  thumbnailLoader = null,
  loadRevision = 0,
  navigationRevision = 0,
  pendingNavigation = null,
  navigationPromise = null,
  navigationAbort = null,
  buffering = false,
  playIntent = false;
let currentPageCanvas = null,
  currentArtCanvas = null,
  currentLetteringImage = null,
  currentLetteringPath = null;
const W = 1280,
  H = 720,
  MEDIA_LOAD_TIMEOUT_MS = 20000,
  legacyView = { x: 230, y: 24, w: 1026, h: 648 },
  view = { ...legacyView },
  mini = { x: 22, y: 62, w: 186, h: 572 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
  ease = (x) => {
    x = clamp(x, 0, 1);
    return x * x * (3 - 2 * x);
  },
  fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
function pageLabel(index, withTotal = true) {
  const entries = timeline?.pages ?? [];
  if (entries[index]?.id === 'cover') return 'Couverture';
  const number = entries.slice(0, index + 1).filter((entry) => entry.id !== 'cover').length;
  const total = entries.filter((entry) => entry.id !== 'cover').length;
  return `Page ${number}${withTotal ? ` / ${total}` : ''}`;
}
function imageFit(box, rect = [0, 0, 1, 1]) {
  const rw = img.width * rect[2],
    rh = img.height * rect[3],
    s = Math.min(box.w / rw, box.h / rh);
  return {
    s,
    x: box.x + box.w / 2 - (rect[0] * img.width + rw / 2) * s,
    y: box.y + box.h / 2 - (rect[1] * img.height + rh / 2) * s,
  };
}
function pageAt(t) {
  return sequence.pageAt(timeline, t);
}
function stateAt(t) {
  const page = pageAt(t),
    local = page.segments,
    localTime = Math.min(t - page.start, page.duration - 0.00001),
    found = local.findIndex((s) => localTime < s.end),
    i = found < 0 ? local.length - 1 : found,
    s = local[i],
    prev = local[Math.max(0, i - 1)] ?? s,
    transition = pages[page.index].data.transitionSeconds ?? core.DEFAULTS.transitionSeconds;
  return { page, s, prev, blend: transition === 0 ? 1 : ease((localTime - s.start) / transition) };
}
function pageArt(active, storyTime, ambientTime) {
  if (!effectsEnabled || !active.data.motionBaseImage) {
    currentArtCanvas = null;
    currentLetteringImage = null;
    currentLetteringPath = null;
    const painted = window.motionEffects.render(
      active.image,
      active.data.effects,
      ambientTime,
      effectsEnabled,
      active.data.protectedRegions,
      storyTime,
    );
    currentPageCanvas = window.motionLayers.concealPanels(
      painted, active.data.panels, active.data.panelReveals, storyTime, effectsEnabled,
      active.revealCanvas ?? (active.revealCanvas = document.createElement('canvas')),
    );
    return currentPageCanvas;
  }
  const animated = window.motionLayers.render(
    active.motionBaseImage,
    active.data.motionLayers,
    active.layerAssets,
    storyTime,
    true,
  );
  currentArtCanvas = animated;
  const painted = window.motionEffects.render(
    animated,
    active.data.effects,
    ambientTime,
    true,
    active.data.protectedRegions,
    storyTime,
  );
  const output = active.compositeCanvas ?? (active.compositeCanvas = document.createElement('canvas'));
  if (output.width !== active.image.width || output.height !== active.image.height) {
    output.width = active.image.width;
    output.height = active.image.height;
  }
  const outputContext = output.getContext('2d');
  outputContext.clearRect(0, 0, output.width, output.height);
  outputContext.drawImage(painted, 0, 0);
  currentLetteringPath = window.motionLayers.letteringPath(
    active.data.motionLayers,
    storyTime,
    active.data.letteringImage ?? null,
  );
  currentLetteringImage = currentLetteringPath ? active.layerAssets[currentLetteringPath] : null;
  if (currentLetteringImage)
    outputContext.drawImage(currentLetteringImage, 0, 0, output.width, output.height);
  currentPageCanvas = window.motionLayers.concealPanels(
    output, active.data.panels, active.data.panelReveals, storyTime, true,
    active.revealCanvas ?? (active.revealCanvas = document.createElement('canvas')),
  );
  return currentPageCanvas;
}
function draw(t, ambientTime = t) {
  if (!timeline || !pages.length || !ready) return;
  const wanted = pageAt(Math.min(t, duration));
  if (!pages[wanted.index]?.image || (progressive && pageLoader?.state(wanted.index).status !== 'ready')) {
    if (manualRendering) throw Error('La page est encore en chargement. Attendez whenPageReady avant la capture.');
    if (!buffering && !pendingNavigation?.error) requestNavigation(Math.min(t, duration));
    return;
  }
  const { page, s, prev, blend } = stateAt(Math.min(t, duration)),
    active = pages[page.index];
  manifest = active.data;
  img = active.image;
  ctx.fillStyle = manualRendering ? '#080b18' : '#05070d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const a = imageFit(view, prev.rect),
    b = imageFit(view, s.rect),
    z = { s: a.s + (b.s - a.s) * blend, x: a.x + (b.x - a.x) * blend, y: a.y + (b.y - a.y) * blend };
  ctx.save();
  ctx.beginPath();
  ctx.rect(view.x, view.y, view.w, view.h);
  ctx.clip();
  ctx.fillStyle = manualRendering ? '#111727' : '#05070d';
  ctx.fillRect(view.x, view.y, view.w, view.h);
  const visible = prev.rect.map((v, i) => v + (s.rect[i] - v) * blend);
  ctx.beginPath();
  ctx.rect(
    z.x + visible[0] * img.width * z.s,
    z.y + visible[1] * img.height * z.s,
    visible[2] * img.width * z.s,
    visible[3] * img.height * z.s,
  );
  ctx.clip();
  ctx.drawImage(pageArt(active, t - page.start, ambientTime), z.x, z.y, img.width * z.s, img.height * z.s);
  ctx.restore();
  // The export layout is intentionally frozen: no DOM styling enters this branch.
  if (manualRendering) {
    const m = imageFit(mini);
    ctx.drawImage(
      active.data.storyThumbnail ? currentPageCanvas : img,
      m.x,
      m.y,
      img.width * m.s,
      img.height * m.s,
    );
    if (s.panel >= 0) {
      const r = s.rect;
      ctx.strokeStyle = '#4ee5ef';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        m.x + r[0] * img.width * m.s,
        m.y + r[1] * img.height * m.s,
        r[2] * img.width * m.s,
        r[3] * img.height * m.s,
      );
    }
    ctx.fillStyle = '#a7b9d0';
    ctx.font = '15px system-ui';
    ctx.fillText(
      pages.length > 1 || timeline.pages[page.index].id === 'cover'
        ? pageLabel(page.index).toUpperCase()
        : 'LA PAGE',
      22,
      34,
    );
    ctx.fillStyle = '#f4f7fc';
    ctx.font = '17px system-ui';
    ctx.fillText(
      s.panel < 0 ? 'Vue de la page' : (manifest.panels[s.panel].label ?? `Case ${s.panel + 1}`),
      view.x,
      700,
    );
    const voice = tracks.find((c) => t >= c.start && t < c.end);
    ctx.fillStyle = '#54dce9';
    ctx.font = '14px system-ui';
    if (voice) ctx.fillText(voice.speaker, 22, 674);
  }
  document.querySelector('#clock').textContent = `${fmt(t)} / ${fmt(duration)}`;
  document.querySelector('#progress').max = duration;
  document.querySelector('#progress').value = t;
  document
    .querySelector('#progress')
    .style.setProperty('--progress', `${duration ? (t / duration) * 100 : 0}%`);
  document.querySelector('#progress').setAttribute('aria-valuetext', `${fmt(t)} sur ${fmt(duration)}`);
  updateReadingLabels(page, s);
  document.querySelector('#previous-page').disabled = page.index === 0;
  document.querySelector('#next-page').disabled = page.index === pages.length - 1;
}
function frameState() {
  if (!timeline || !img) return null;
  const { page, s, prev, blend } = stateAt(position),
    a = imageFit(view, prev.rect),
    b = imageFit(view, s.rect),
    z = { s: a.s + (b.s - a.s) * blend, x: a.x + (b.x - a.x) * blend, y: a.y + (b.y - a.y) * blend },
    r = prev.rect.map((v, i) => v + (s.rect[i] - v) * blend);
  return {
    pageIndex: page.index,
    pageId: page.id,
    storyTime: position - page.start,
    panelIndex: s.panel,
    panelId: s.panel >= 0 ? manifest.panels[s.panel].id : null,
    screenRect: [
      z.x + r[0] * img.width * z.s,
      z.y + r[1] * img.height * z.s,
      r[2] * img.width * z.s,
      r[3] * img.height * z.s,
    ],
    view: { ...view },
    transitionBlend: blend,
  };
}
function audioAt(t, force = false) {
  if (progressive && buffering) { pauseMedia(); return; }
  const sync = (element, wanted) => {
    if (element.readyState > 0 && (force || Math.abs(element.currentTime - wanted) > 0.18))
      element.currentTime = Math.max(0, wanted);
  };
  if (music) {
    const element = music.element;
    if (Number.isFinite(element.duration) && element.duration > 0) {
      const wanted = music.config.preMixed ? Math.min(t, element.duration) : t % element.duration;
      if (playing || force) sync(element, wanted);
    }
    if (playing) {
      element.volume = sequence.musicGain(t, duration, music.config, tracks);
      if (element.paused) {
        const revision = navigationRevision;
        element.play().catch(() => {
          if (progressive && (revision !== navigationRevision || buffering || !playIntent)) return;
          document.querySelector('#error').textContent = 'Lecture audio bloquée : cliquez sur Lire.';
          pause();
        });
      }
    } else element.pause();
  }
  for (const track of tracks) {
    if (!track.element) continue;
    const inRange = t >= track.start && t < track.end,
      active = playing && inRange;
    if (force || active) sync(track.element, clamp(t - track.start, 0, track.end - track.start));
    if (active) {
      if (track.element.paused) {
        const revision = navigationRevision;
        track.element.play().catch(() => {
          if (progressive && (revision !== navigationRevision || buffering || !playIntent)) return;
          document.querySelector('#error').textContent = 'Lecture audio bloquée : cliquez sur Lire.';
          pause();
        });
      }
    } else if (!track.element.paused) track.element.pause();
  }
}
function pause() {
  playing = false;
  playIntent = false;
  audioAt(position);
  updatePlay();
  revealChrome();
}
function seek(t) {
  const wanted = clamp(t, 0, duration);
  if (progressive) {
    requestNavigation(wanted);
    return wanted;
  }
  position = wanted;
  effectTime = position;
  draw(position, effectTime);
  if (!manualRendering) audioAt(position, true);
  return position;
}
async function fetchManifest(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error('Manifeste inaccessible.');
  return { data: await response.json(), url: response.url };
}
function pauseMedia() {
  music?.element.pause();
  for (const track of tracks) track.element?.pause();
}
async function limitedMap(values, limit, work) {
  const output = new Array(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) { const index = cursor++; output[index] = await work(values[index], index); }
  }));
  return output;
}
function decodeImage(url, bounded = false) {
  const image = new Image(); image.src = url;
  if (!bounded) return image.decode().then(() => image);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { image.src = ''; reject(Error('Le dessin est inaccessible. Réessayez le chargement.')); }, MEDIA_LOAD_TIMEOUT_MS);
    image.decode().then(() => { clearTimeout(timer); resolve(image); }, error => { clearTimeout(timer); reject(error); });
  });
}
async function loadPageArt(entry, controlled = progressive) {
  const image = await decodeImage(new URL(entry.data.image, entry.url).href, controlled);
  const voicePaths = new Set(entry.data.panels.flatMap(panel => (panel.cues ?? []).map(cue => cue.audio)));
  const extra = core.assetPaths(entry.data).filter(file => file !== entry.data.image && !voicePaths.has(file));
  const pairs = await limitedMap(extra, controlled ? 4 : Math.max(1, extra.length), async file => {
    const asset = await decodeImage(new URL(file, entry.url).href, controlled); return [file, asset];
  });
  const layerAssets = Object.fromEntries(pairs); layerAssets[entry.data.image] = image;
  Object.assign(entry, { image, layerAssets, motionBaseImage: layerAssets[entry.data.motionBaseImage], letteringImage: layerAssets[entry.data.letteringImage] });
  return entry;
}
function preloadMetadata(element) {
  if (element.readyState >= 1 && !element.error) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const done = error => { clearTimeout(timer); element.removeEventListener('loadedmetadata', loaded); element.removeEventListener('error', failed); error ? reject(error) : resolve(); };
    const loaded = () => done(), failed = () => done(Error('Le son est inaccessible. Réessayez la lecture.'));
    const timer = setTimeout(failed, MEDIA_LOAD_TIMEOUT_MS);
    element.addEventListener('loadedmetadata', loaded, { once: true }); element.addEventListener('error', failed, { once: true });
    element.load();
  });
}
function prepareAudioAt(element, wanted, signal) {
  return new Promise((resolve, reject) => {
    let positioned = false;
    const names = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked'];
    const done = error => { clearTimeout(timer); for (const name of names) element.removeEventListener(name, inspect); element.removeEventListener('error', failed); signal?.removeEventListener('abort', aborted); error ? reject(error) : resolve(); };
    const failed = () => done(Error('Le son est inaccessible. Cliquez sur Lire pour réessayer.'));
    const aborted = () => done(Error('Chargement remplacé par une nouvelle navigation.'));
    const inspect = () => {
      if (signal?.aborted) { aborted(); return; }
      if (!positioned && element.readyState >= 1) {
        positioned = true;
        if (Math.abs(element.currentTime - wanted) > .015) element.currentTime = wanted;
      }
      if (positioned && element.readyState >= 2 && !element.seeking && Math.abs(element.currentTime - wanted) < .08) done();
    };
    const timer = setTimeout(failed, MEDIA_LOAD_TIMEOUT_MS);
    for (const name of names) element.addEventListener(name, inspect);
    element.addEventListener('error', failed, { once: true }); signal?.addEventListener('abort', aborted, { once: true });
    element.preload = 'auto';
    // Do not discard a range request already seeking to the desired AAC segment.
    if (element.error || element.readyState === 0 || (element.readyState < 2 && !element.seeking)) element.load();
    inspect();
  });
}
async function prepareNavigationAudio(time, signal) {
  if (manualRendering) return;
  const tasks = [];
  if (music) {
    await preloadMetadata(music.element);
    tasks.push(prepareAudioAt(music.element, music.config.preMixed ? Math.min(time, music.element.duration) : time % music.element.duration, signal));
  }
  const active = tracks.find(track => time >= track.start && time < track.end);
  if (active) tasks.push(prepareAudioAt(active.element, time - active.start, signal));
  await Promise.all(tasks);
}
function prefetchNeighbors(index) {
  if (!progressive) return;
  for (const neighbor of [index + 1, index - 1]) if (neighbor >= 0 && neighbor < pages.length) pageLoader.request(neighbor).catch(() => {});
}
function requestNavigation(time, forceAudio = false) {
  if (!timeline || !pages.length) return;
  const index = pageAt(time).index, revision = ++navigationRevision, documentRevision = loadRevision;
  navigationAbort?.abort(); navigationAbort = new AbortController();
  const signal = navigationAbort.signal;
  const needsPage = pageLoader.state(index).status !== 'ready';
  const needsAudio = !manualRendering && (forceAudio || playIntent || Boolean(pendingNavigation));
  const commit = (audioPrepared = false) => {
    if (revision !== navigationRevision || documentRevision !== loadRevision) return;
    buffering = false; pendingNavigation = null; position = time; effectTime = time; last = 0;
    playing = playIntent && !manualRendering;
    const active = pages[index];
    if (!active.thumbnailImage && !active.initialThumbnailReady) { active.initialThumbnail = initialThumbnail(active); active.initialThumbnailReady = true; }
    document.querySelector('#status').style.removeProperty('display');
    document.querySelector('#status').textContent = 'Prêt à lire.'; document.querySelector('#error').textContent = '';
    draw(position, effectTime); if (!manualRendering) audioAt(position, !audioPrepared); updatePlay(); prefetchNeighbors(index);
  };
  if (!needsPage && !needsAudio) { commit(); navigationPromise = Promise.resolve(); return; }
  buffering = true; playing = false; pendingNavigation = { index, targetTime: time, error: null }; pauseMedia();
  document.querySelector('#status').textContent = `Chargement de ${pageLabel(index, false).toLowerCase()}…`;
  // The existing stylesheet hides the ready-state status; expose it only while buffering.
  document.querySelector('#status').style.display = 'block'; revealChrome();
  document.querySelector('#error').textContent = ''; updatePlay();
  navigationPromise = (async () => {
    try {
      await pageLoader.request(index, true);
      if (revision !== navigationRevision || documentRevision !== loadRevision) return;
      await prepareNavigationAudio(time, signal); commit(true);
    } catch (error) {
      if (revision !== navigationRevision || documentRevision !== loadRevision) return;
      buffering = false; playing = false; pendingNavigation = { index, targetTime: time, error: String(error.message ?? error) }; pauseMedia();
      document.querySelector('#status').textContent = 'Chargement interrompu.';
      document.querySelector('#status').style.removeProperty('display'); revealChrome();
      document.querySelector('#error').textContent = 'Cette page est inaccessible pour le moment. Cliquez sur Lire ou choisissez une page pour réessayer.';
      updatePlay(); throw error;
    }
  })();
  navigationPromise.catch(() => {});
}
function attachBufferEvents(element) {
  element.addEventListener('waiting', () => {
    if (progressive && playing && !buffering && !element.paused) requestNavigation(position, true);
  });
}
async function whenPageReady(index = pendingNavigation?.index ?? pageAt(position).index) {
  if (!Number.isInteger(index) || index < 0 || index >= pages.length) throw Error('Page inconnue.');
  if (!progressive) return { index };
  await pageLoader.request(index, true);
  if (pendingNavigation?.index === index && navigationPromise) await navigationPromise;
  return { index };
}
async function ensureAllPagesReady() {
  if (progressive) await Promise.all(pages.map((_, index) => pageLoader.request(index)));
  return { pages: pages.length };
}
function retry() {
  if (!progressive || !pendingNavigation?.error) return whenPageReady();
  requestNavigation(pendingNavigation.targetTime, true);
  return navigationPromise;
}
async function load(data, url = location.href) {
  pause();
  const revision = ++loadRevision;
  navigationRevision++; navigationAbort?.abort(); pendingNavigation = null; navigationPromise = null; buffering = false;
  progressive = data.kind === sequence.KIND && data.loadingMode === 'progressive';
  const controlled = progressive;
  img = null; currentPageCanvas = null; currentArtCanvas = null;
  ready = false;
  reader.dataset.ready = 'false';
  document.querySelector('#status').style.removeProperty('display');
  document.querySelector('#status').textContent = 'Chargement des images et du son…';
  document.querySelector('#progress').disabled = true;
  document.querySelectorAll('button').forEach((b) => (b.disabled = true));
  document.querySelector('#close-pages').disabled = false;
  documentData = data;
  music = null;
  let entries, descriptor;
  if (data.kind === sequence.KIND) {
    sequence.assertSequence(data);
    entries = controlled
      ? await limitedMap(data.pages, 6, p => fetchManifest(new URL(p.manifest, url).href))
      : await Promise.all(data.pages.map((p) => fetchManifest(new URL(p.manifest, url).href)));
    descriptor = data;
  } else {
    core.assertManifest(data);
    entries = [{ data, url }];
    descriptor = {
      kind: sequence.KIND,
      schemaVersion: 1,
      version: 1,
      title: data.title,
      pages: [{ id: 'page-01', manifest: 'page.json' }],
    };
  }
  if (revision !== loadRevision) return;
  for (const entry of entries) core.assertManifest(entry.data);
  pages = entries.map((entry, index) => ({ ...entry, thumbnailUrl: descriptor.pages[index].thumbnail ? new URL(descriptor.pages[index].thumbnail, url).href : null }));
  timeline = sequence.buildSequence(
    descriptor,
    pages.map((p) => p.data),
  );
  ({ segments, tracks, duration } = timeline);
  for (const track of tracks) {
    track.audioUrl = new URL(track.audio, pages[track.page].url).href;
    track.element = new Audio();
    track.element.preload = controlled ? 'none' : 'auto';
    track.element.src = track.audioUrl;
    track.element.muted = muted;
    track.element.addEventListener('loadedmetadata', () => {
      if (revision === loadRevision && !controlled && !manualRendering) audioAt(position, true);
    });
    attachBufferEvents(track.element);
  }
  if (data.music) {
    const element = new Audio();
    element.preload = controlled ? 'metadata' : 'auto';
    element.src = new URL(data.music.audio, url).href;
    element.loop = !data.music.preMixed;
    element.muted = muted;
    element.addEventListener('loadedmetadata', () => {
      if (revision === loadRevision && !controlled && !manualRendering) audioAt(position, true);
    });
    music = { config: data.music, element };
    attachBufferEvents(element);
  }
  let initialError = null;
  if (controlled) {
    const ownedPages = pages, ownedTracks = tracks;
    pageLoader = sequence.createPageLoader(async index => {
      if (revision !== loadRevision) return;
      const entry = ownedPages[index];
      await loadPageArt(entry, true);
      await limitedMap(ownedTracks.filter(track => track.page === index), 2, track => {
        track.element.preload = 'auto'; if (track.element.error) track.element.load(); return preloadAudio(track.element, MEDIA_LOAD_TIMEOUT_MS);
      });
      return entry;
    }, 2);
    try { await Promise.all([pageLoader.request(0, true), ...(music ? [preloadMetadata(music.element)] : []), document.fonts.ready]); }
    catch (error) { initialError = error; pendingNavigation = { index: 0, targetTime: 0, error: String(error.message ?? error) }; }
  } else {
    pageLoader = null;
    await Promise.all([Promise.all(pages.map(entry => loadPageArt(entry, false))), ...tracks.map(track => preloadAudio(track.element)), ...(music ? [preloadAudio(music.element)] : []), document.fonts.ready]);
  }
  if (revision !== loadRevision) return;
  position = 0;
  effectTime = 0;
  last = 0;
  const readingTitle =
    String(data.title ?? '')
      .replace(/^HOLT\s*[—–·:-]\s*/i, '')
      .replace(/\s+·\s+(?:pages?|révision|revision)\b.*$/i, '')
      .trim() || 'Comics en mouvement';
  document.querySelector('#title').textContent = readingTitle;
  document.querySelector('#title').title = data.title;
  document.title = `HOLT · ${readingTitle}`;
  document.querySelectorAll('button').forEach((b) => (b.disabled = false));
  document.querySelector('#progress').disabled = false;
  ready = true;
  reader.dataset.ready = 'true';
  updateEffects();
  updateMute();
  updateFullscreen();
  buildPageDrawer();
  resizeScreen();
  document.querySelector('#status').textContent = initialError ? 'Chargement interrompu.' : 'Prêt à lire.';
  document.querySelector('#error').textContent = initialError ? 'Cette page est inaccessible pour le moment. Cliquez sur Lire pour réessayer.' : '';
  draw(0);
  if (controlled) {
    const thumbnailPages = pages;
    thumbnailLoader = sequence.createPageLoader(async index => {
      if (revision !== loadRevision) return;
      const active = thumbnailPages[index]; if (!active.thumbnailUrl) return;
      const image = await decodeImage(active.thumbnailUrl, true);
      if (revision !== loadRevision) return;
      active.thumbnailImage = image; active.initialThumbnail = image;
      const target = thumbnailCanvases[index]; target.height = Math.round(target.width * image.height / image.width);
      paintThumbnail(target, drawer.open && pageAt(position).index === index && active.data.storyThumbnail && currentPageCanvas ? currentPageCanvas : image);
    }, 4);
    for (let index = 0; index < pages.length; index++) if (pages[index].thumbnailUrl) thumbnailLoader.request(index).catch(() => {});
    if (!initialError) prefetchNeighbors(0);
  }
  return { duration, tracks: publicTracks() };
}
function publicTracks() {
  return tracks.map(({ element: _element, ...rest }) => rest);
}
function loop(now) {
  const elapsed = last ? Math.max(0, (now - last) / 1000) : 0;
  last = now;
  if (!manualRendering && !buffering) {
    if (playing) {
      const next = Math.min(position + elapsed, duration);
      if (progressive && pageLoader.state(pageAt(next).index).status !== 'ready') {
        requestNavigation(next);
        requestAnimationFrame(loop); return;
      }
      position = next;
      if (position >= duration) {
        position = duration;
        pause();
      }
      audioAt(position);
    }
    if (effectsEnabled) effectTime += elapsed;
    if ((playing || effectsEnabled) && now - lastDraw >= 1000 / 24) {
      draw(position, effectTime);
      lastDraw = now;
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
function jump(delta) {
  pause();
  const current = stateAt(position),
    targets = timeline.pages.flatMap((page) =>
      page.segments
        .filter((s) => s.panel >= 0)
        .map((s) => ({
          page: page.index,
          panel: s.panel,
          time:
            page.start +
            s.start +
            (pages[page.index].data.transitionSeconds ?? core.DEFAULTS.transitionSeconds),
        })),
    );
  let i = targets.findIndex((v) => v.page === current.page.index && v.panel === current.s.panel);
  if (i < 0) {
    const found =
      delta > 0
        ? targets.findIndex((v) => v.time >= position)
        : targets.findLastIndex((v) => v.time <= position);
    i = found < 0 ? (delta > 0 ? targets.length - 1 : 0) : found;
  } else i = clamp(i + delta, 0, targets.length - 1);
  seek(targets[i].time);
}
function jumpPage(delta) {
  pause();
  const page = pageAt(position);
  seek(timeline.pages[clamp(page.index + delta, 0, pages.length - 1)].start);
}
function updateEffects() {
  const button = document.querySelector('#effects');
  paintButton(button, 'spark', effectsEnabled ? 'Animations actives' : 'Animations désactivées');
  button.setAttribute('aria-pressed', String(effectsEnabled));
}
function play() {
  if (!ready) return;
  playIntent = true;
  if (progressive) {
    if (buffering) { updatePlay(); return; }
    requestNavigation(pendingNavigation?.targetTime ?? (position >= duration ? 0 : position), true);
    revealChrome(); return;
  }
  if (position >= duration) seek(0);
  playing = true;
  last = 0;
  updatePlay();
  audioAt(position);
  revealChrome();
}

// The player UI only changes the viewport. Narrative drawing and export clocks stay shared.
function icon(name) {
  const paths = {
    play: '<path d="m8 5 11 7-11 7Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    previous: '<path d="m15 5-7 7 7 7"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    previousPage: '<path d="M5 5v14m13-14-8 7 8 7"/>',
    nextPage: '<path d="M19 5v14M6 5l8 7-8 7"/>',
    page: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 9h16M11 9v12"/>',
    pages: '<path d="M8 3h12v15H8zM4 7v14h12"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
    sound: '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6m0-6-6 6"/>',
    expand: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
    collapse: '<path d="M3 9h6V3m6 0v6h6M9 21v-6H3m18 0h-6v6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] ?? paths.page}</svg>`;
}
function paintButton(button, name, label, visible = false) {
  button.innerHTML = icon(name);
  button.setAttribute('aria-label', label);
  if (visible) {
    const span = document.createElement('span');
    span.className = 'button-label';
    span.textContent = label;
    button.append(span);
  }
}
function updatePlay() {
  const wantsPause = playing || (buffering && playIntent);
  paintButton(document.querySelector('#play'), wantsPause ? 'pause' : 'play', wantsPause ? 'Pause' : 'Lire', true);
}
function updateMute() {
  const button = document.querySelector('#mute'),
    label = muted ? 'Rétablir le son' : 'Couper le son';
  paintButton(button, muted ? 'muted' : 'sound', label);
  button.title = `${label} (M)`;
  button.setAttribute('aria-pressed', String(muted));
}
function toggleMute() {
  muted = !muted;
  for (const track of tracks) if (track.element) track.element.muted = muted;
  if (music) music.element.muted = muted;
  updateMute();
  revealChrome();
  return muted;
}
function updateFullscreen() {
  const active = Boolean(document.fullscreenElement),
    button = document.querySelector('#fullscreen');
  paintButton(button, active ? 'collapse' : 'expand', active ? 'Quitter le plein écran' : 'Plein écran');
  button.title = `${active ? 'Quitter le plein écran' : 'Plein écran'} (F)`;
  button.disabled = !ready || !document.fullscreenEnabled;
}
async function toggleFullscreen() {
  if (!ready || !document.fullscreenEnabled) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await reader.requestFullscreen();
  } catch {
    document.querySelector('#error').textContent =
      'Le plein écran est indisponible. Vous pouvez poursuivre la lecture dans cette fenêtre.';
  }
  revealChrome();
}
function preloadAudio(element, timeout = 0) {
  if (element.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = timeout ? setTimeout(() => { element.preload = 'none'; element.load(); failed(); }, timeout) : null;
    const cleanup = () => {
      if (timer !== null) clearTimeout(timer);
      element.removeEventListener('loadeddata', loaded);
      element.removeEventListener('error', failed);
    };
    const loaded = () => {
      cleanup();
      resolve();
    };
    const failed = () => {
      cleanup();
      reject(Error('Le son est inaccessible. Rechargez le récit pour réessayer.'));
    };
    element.addEventListener('loadeddata', loaded, { once: true });
    element.addEventListener('error', failed, { once: true });
    if (element.error) failed();
    else element.load();
  });
}
function resizeScreen() {
  if (manualRendering) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2),
    width = Math.max(1, Math.round(reader.clientWidth * ratio)),
    height = Math.max(1, Math.round(reader.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  // Reserve the real chrome height so speech balloons never sit under the controls.
  const top = chromeHidden
    ? 0
    : Math.ceil(document.querySelector('.masthead').getBoundingClientRect().height * ratio);
  const bottom = chromeHidden
    ? 0
    : Math.ceil(document.querySelector('.transport').getBoundingClientRect().height * ratio);
  Object.assign(view, { x: 0, y: top, w: width, h: Math.max(1, height - top - bottom) });
  draw(position, effectTime);
}
function setChromeHidden(value) {
  const wanted = Boolean(value) && !drawer.open;
  if (wanted === chromeHidden) return;
  chromeHidden = wanted;
  reader.classList.toggle('chrome-hidden', chromeHidden);
  resizeScreen();
}
function revealChrome() {
  clearTimeout(idleTimer);
  setChromeHidden(false);
  if (playing)
    idleTimer = setTimeout(() => {
      if (playing && !drawer.open && !reader.querySelector(':focus-visible')) setChromeHidden(true);
    }, 2600);
}
function updateReadingLabels(page, segment) {
  document.querySelector('#page-label').textContent = pageLabel(page.index);
  document.querySelector('#panel-label').textContent =
    segment.panel < 0
      ? 'Vue de la page'
      : (pages[page.index].data.panels[segment.panel].label ?? `Case ${segment.panel + 1}`);
  for (const [index, thumbnail] of thumbnailCanvases.entries()) {
    const button = thumbnail.parentElement;
    if (index === page.index) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
    if (drawer.open) {
      const source =
        index === page.index && pages[index].data.storyThumbnail
          ? (currentPageCanvas ?? pages[index].initialThumbnail)
          : pages[index].initialThumbnail;
      paintThumbnail(thumbnail, source);
    }
  }
}
function paintThumbnail(target, source) {
  const context = target.getContext('2d');
  context.clearRect(0, 0, target.width, target.height);
  context.drawImage(source, 0, 0, target.width, target.height);
}
function initialThumbnail(active) {
  const hasReveals = Boolean(active.data.panelReveals?.length);
  if ((!active.data.storyThumbnail || !active.data.motionLayers?.length) && !hasReveals) return active.image;
  // The page navigator starts before the action: no broken window from a later master.
  const art = active.data.motionBaseImage ? window.motionLayers.render(
      active.motionBaseImage,
      active.data.motionLayers,
      active.layerAssets,
      0,
      true,
    ) : active.image,
    output = document.createElement('canvas');
  output.width = active.image.width;
  output.height = active.image.height;
  const context = output.getContext('2d');
  context.drawImage(art, 0, 0);
  const lettering = window.motionLayers.letteringPath(
    active.data.motionLayers,
    0,
    active.data.letteringImage ?? null,
  );
  if (lettering && active.data.motionBaseImage) context.drawImage(active.layerAssets[lettering], 0, 0, output.width, output.height);
  return window.motionLayers.concealPanels(output, active.data.panels, active.data.panelReveals, 0, true);
}
function buildPageDrawer() {
  const list = document.querySelector('#page-list');
  list.replaceChildren();
  thumbnailCanvases.length = 0;
  pages.forEach((active, index) => {
    const button = document.createElement('button'),
      thumbnail = document.createElement('canvas'),
      label = document.createElement('span');
    button.className = 'page-choice';
    button.setAttribute(
      'aria-label',
      timeline.pages[index].id === 'cover' ? 'Lire la couverture' : `Lire la ${pageLabel(index, false).toLowerCase()}`,
    );
    button.dataset.page = index;
    thumbnail.width = 228;
    const placeholder = document.createElement('canvas'); placeholder.width = 228; placeholder.height = 342;
    const placeholderContext = placeholder.getContext('2d'); placeholderContext.fillStyle = '#101621'; placeholderContext.fillRect(0, 0, 228, 342);
    const preview = active.thumbnailImage ?? (active.image ? initialThumbnail(active) : placeholder);
    thumbnail.height = Math.round((228 * preview.height) / preview.width);
    thumbnail.setAttribute('aria-hidden', 'true');
    active.initialThumbnail = preview; active.initialThumbnailReady = Boolean(active.image);
    paintThumbnail(thumbnail, active.initialThumbnail);
    label.textContent = pageLabel(index, false);
    button.append(thumbnail, label);
    list.append(button);
    thumbnailCanvases.push(thumbnail);
    button.onclick = () => {
      pause();
      seek(timeline.pages[index].start);
      drawer.close();
    };
  });
}
function initializeControls() {
  updatePlay();
  updateEffects();
  updateMute();
  updateFullscreen();
  for (const [id, name, label] of [
    ['previous-page', 'previousPage', 'Page précédente'],
    ['next-page', 'nextPage', 'Page suivante'],
    ['previous', 'previous', 'Case précédente'],
    ['next', 'next', 'Case suivante'],
    ['overview', 'page', 'Vue page'],
    ['close-pages', 'close', 'Fermer les pages'],
  ])
    paintButton(document.querySelector(`#${id}`), name, label, id === 'overview');
  document.querySelector('#pages-toggle .button-icon').innerHTML = icon('pages');
  document.querySelector('#close-pages').disabled = false;
  document.querySelector('#play').onclick = () => {
    if (playing || (buffering && playIntent)) pause();
    else play();
  };
  document.querySelector('#effects').onclick = () => {
    effectsEnabled = !effectsEnabled;
    updateEffects();
    draw(position, effectTime);
  };
  document.querySelector('#overview').onclick = () => {
    pause();
    seek(pageAt(position).start);
  };
  document.querySelector('#previous').onclick = () => jump(-1);
  document.querySelector('#next').onclick = () => jump(1);
  document.querySelector('#previous-page').onclick = () => jumpPage(-1);
  document.querySelector('#next-page').onclick = () => jumpPage(1);
  document.querySelector('#progress').oninput = (event) => seek(Number(event.target.value));
  document.querySelector('#mute').onclick = toggleMute;
  document.querySelector('#fullscreen').onclick = toggleFullscreen;
  document.querySelector('#pages-toggle').onclick = () => {
    revealChrome();
    drawer.showModal();
    document.querySelector('#pages-toggle').setAttribute('aria-expanded', 'true');
    draw(position, effectTime);
    drawer.querySelector('[aria-current=page]')?.focus();
  };
  document.querySelector('#close-pages').onclick = () => drawer.close();
  drawer.addEventListener('close', () => {
    document.querySelector('#pages-toggle').setAttribute('aria-expanded', 'false');
    document.querySelector('#pages-toggle').focus();
    revealChrome();
  });
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) {
      const rect = drawer.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        drawer.close();
    }
  });
  reader.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse') revealChrome();
  });
  reader.addEventListener('pointerdown', (event) => {
    if (event.target !== canvas) revealChrome();
  });
  canvas.addEventListener('click', () => {
    if (chromeHidden) revealChrome();
    else if (ready) setChromeHidden(true);
  });
  reader.addEventListener('focusin', () => {
    if (document.activeElement?.matches(':focus-visible')) revealChrome();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      revealChrome();
      return;
    }
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.isComposing ||
      !ready
    )
      return;
    if (event.target.closest('input,textarea,select,[contenteditable=true]')) return;
    if (drawer.open) return;
    if (event.key === ' ' && event.target.closest('button')) return; // Native Space click is already exactly one action.
    let handled = true;
    if (event.code === 'Space' || event.key === ' ') {
      if (playing || (buffering && playIntent)) pause();
      else play();
    } else if (event.key === 'ArrowLeft') {
      if (event.shiftKey) jumpPage(-1);
      else jump(-1);
    } else if (event.key === 'ArrowRight') {
      if (event.shiftKey) jumpPage(1);
      else jump(1);
    } else if (event.key.toLowerCase() === 'm') toggleMute();
    else if (event.key.toLowerCase() === 'f') void toggleFullscreen();
    else handled = false;
    if (handled) {
      event.preventDefault();
      revealChrome();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    updateFullscreen();
    resizeScreen();
  });
  new ResizeObserver(resizeScreen).observe(reader);
  new ResizeObserver(resizeScreen).observe(document.querySelector('.masthead'));
  new ResizeObserver(resizeScreen).observe(document.querySelector('.transport'));
  document.fonts.ready.then(resizeScreen);
  resizeScreen();
}
window.motionComic = {
  load,
  seek,
  draw,
  play,
  pause,
  jump,
  jumpPage,
  whenPageReady,
  ensureAllPagesReady,
  retry,
  get buffering() { return buffering; },
  get loadingState() {
    return { mode: progressive ? 'progressive' : 'eager', buffering, playRequested: playIntent, pageIndex: pendingNavigation?.index ?? (timeline ? pageAt(position).index : 0),
      targetTime: pendingNavigation?.targetTime ?? position, error: pendingNavigation?.error ?? null,
      pages: pages.map((_, index) => progressive ? pageLoader?.state(index) ?? { index, status: 'idle', error: null } : { index, status: ready ? 'ready' : 'loading', error: null }) };
  },
  setRenderMode(value) {
    manualRendering = Boolean(value);
    if (manualRendering) {
      canvas.width = W;
      canvas.height = H;
      Object.assign(view, legacyView);
    } else resizeScreen();
    draw(position, effectTime);
  },
  get pageCanvas() {
    return currentPageCanvas;
  },
  get artCanvas() {
    return currentArtCanvas;
  },
  get activeLetteringImage() {
    return currentLetteringImage;
  },
  get activeLetteringPath() {
    return currentLetteringPath;
  },
  get manifest() {
    return structuredClone(manifest);
  },
  get document() {
    return structuredClone(documentData);
  },
  get position() {
    return position;
  },
  get pageIndex() {
    return timeline ? pageAt(position).index : 0;
  },
  get frameState() {
    return frameState();
  },
  get pages() {
    return timeline ? structuredClone(timeline.pages) : [];
  },
  get audioState() {
    return {
      voices: tracks
        .filter((t) => t.element && !t.element.paused)
        .map((t) => ({ page: t.page, start: t.start, end: t.end })),
      musicPlaying: music ? !music.element.paused : false,
      musicGain: music?.element.volume ?? 0,
      musicTime: music?.element.currentTime ?? 0,
      musicDuration: music?.element.duration ?? 0,
      musicReadyState: music?.element.readyState ?? 0,
      musicPreMixed: music?.config.preMixed ?? false,
    };
  },
  get effectTime() {
    return effectTime;
  },
  get playing() {
    return playing;
  },
  get muted() {
    return muted;
  },
  toggleMute,
  setEffects(value) {
    effectsEnabled = Boolean(value);
    updateEffects();
    draw(position, effectTime);
  },
  get effectsEnabled() {
    return effectsEnabled;
  },
  get duration() {
    return duration;
  },
  get tracks() {
    return publicTracks();
  },
  get segments() {
    return segments;
  },
};
initializeControls();
const source = new URLSearchParams(location.search).get('manifest') ?? document.documentElement.dataset.manifest;
if (source)
  fetchManifest(source)
    .then(({ data, url }) => load(data, url))
    .catch(() => {
      document.querySelector('#status').textContent = 'Chargement interrompu.';
      document.querySelector('#error').textContent =
        'Le récit est inaccessible. Rechargez cette page pour réessayer.';
    });
else document.querySelector('#status').textContent = 'Ouvrez le lien du récit pour commencer la lecture.';
