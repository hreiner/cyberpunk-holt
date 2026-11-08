/* Sequence timing shared by the reader and exporter. No media access. */
/* global module, require */
(() => {
  // CommonJS and classic browser scripts share this dependency without a bundler.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const core = typeof module !== 'undefined' && module.exports ? require('./core.js') : globalThis.motionComicCore;
  const KIND = 'motion-comic-sequence';
  function localPath(value) {
    return typeof value === 'string' && value.length > 0 && !/^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(value) && !/[\\?#]/.test(value) && ![...value].some(character => character.charCodeAt(0) < 32);
  }
  function assertSequence(data) {
    if (!data || data.kind !== KIND || data.schemaVersion !== 1) throw Error('Format de séquence non pris en charge.');
    if (!Number.isInteger(data.version) || data.version < 1) throw Error('version : révision entière positive requise.');
    if (typeof data.title !== 'string' || !data.title.trim()) throw Error('Titre de séquence requis.');
    if (data.loadingMode !== undefined && !['eager', 'progressive'].includes(data.loadingMode)) throw Error('loadingMode : eager ou progressive attendu.');
    if (!Array.isArray(data.pages) || !data.pages.length) throw Error('Aucune page définie.');
    const ids = new Set();
    for (const page of data.pages) {
      if (!page || typeof page.id !== 'string' || !page.id.trim() || ids.has(page.id)) throw Error('Identifiant de page absent ou en double.');
      ids.add(page.id);
      if (!localPath(page.manifest)) throw Error('Manifeste de page : chemin local relatif attendu.');
      if (page.thumbnail !== undefined && !localPath(page.thumbnail)) throw Error('Miniature : chemin local relatif attendu.');
    }
    if (data.music !== undefined) {
      if (!data.music || !localPath(data.music.audio)) throw Error('Fond musical : chemin local relatif attendu.');
      if (data.music.preMixed !== undefined && typeof data.music.preMixed !== 'boolean') throw Error('preMixed : booléen requis.');
      const defaultGain = data.music.preMixed ? 1 : 0.08;
      if (!Number.isFinite(data.music.gain ?? defaultGain) || (data.music.gain ?? defaultGain) < 0 || (data.music.gain ?? defaultGain) > 1) throw Error('Gain musical entre 0 et 1 requis.');
      if (!Number.isFinite(data.music.fadeSeconds ?? 0.5) || (data.music.fadeSeconds ?? 0.5) < 0) throw Error('Fondu musical positif ou nul requis.');
    }
    return data;
  }
  function buildSequence(data, pageData) {
    assertSequence(data);
    if (!Array.isArray(pageData) || pageData.length !== data.pages.length) throw Error('Les manifestes de toutes les pages sont requis.');
    let cursor = 0;
    const segments = [], tracks = [];
    const pages = pageData.map((manifest, index) => {
      const local = core.buildTimeline(manifest), start = cursor;
      const page = { id: data.pages[index].id, index, start, end: start + local.duration, duration: local.duration, segments: local.segments };
      for (const segment of local.segments) segments.push({ ...segment, start: segment.start + start, end: segment.end + start, page: index, pageId: page.id });
      for (const track of local.tracks) tracks.push({ ...track, start: track.start + start, end: track.end + start, page: index, pageId: page.id });
      cursor = page.end;
      return page;
    });
    return { pages, segments, tracks, duration: cursor };
  }
  function pageAt(timeline, time) {
    if (!Number.isFinite(time)) throw Error('Position de lecture finie requise.');
    return timeline.pages.find(page => time < page.end) ?? timeline.pages.at(-1);
  }
  function panelTime(timeline, pageIndex, panelIndex, pageData) {
    const page = timeline.pages[pageIndex];
    if (!page) throw Error('Page inconnue.');
    const segment = page.segments.find(item => item.panel === panelIndex);
    if (!segment) throw Error('Case inconnue.');
    return page.start + segment.start + (pageData[pageIndex].transitionSeconds ?? core.DEFAULTS.transitionSeconds);
  }
  function musicGain(time, duration, music, tracks) {
    // A backing file already contains its authored music/SFX balance and fades.
    if (music.preMixed) return music.gain ?? 1;
    const clamp = value => Math.max(0, Math.min(1, value));
    const fade = music.fadeSeconds ?? 0.5;
    const envelope = fade === 0 ? 1 : Math.min(clamp(time / fade), clamp((duration - time) / fade));
    const duck = tracks.reduce((value, track) => Math.max(value, Math.min(clamp((time - track.start + 0.15) / 0.15), clamp((track.end + 0.15 - time) / 0.15))), 0);
    return (music.gain ?? 0.08) * envelope * (1 - 0.55 * duck);
  }
  function musicVolumeExpression(duration, music, tracks) {
    if (music.preMixed) return String(music.gain ?? 1);
    const clamp = expression => `max(0,min(1,${expression}))`;
    const fade = music.fadeSeconds ?? 0.5;
    const envelope = fade === 0 ? '1' : `min(${clamp(`t/${fade}`)},${clamp(`(${duration}-t)/${fade}`)})`;
    const duck = tracks.map(track => `min(${clamp(`(t-${track.start}+0.15)/0.15`)},${clamp(`(${track.end}+0.15-t)/0.15`)})`).reduce((value, expression) => `max(${value},${expression})`, '0');
    return `${music.gain ?? 0.08}*${envelope}*(1-0.55*${duck})`;
  }
  // A small deduplicating queue, shared by page media and lightweight thumbnails.
  // Failure is not cached as success: a later explicit request starts a fresh attempt.
  function createPageLoader(load, concurrency = 2) {
    if (typeof load !== 'function' || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw Error('File de chargement invalide.');
    const jobs = new Map(), queue = [];
    let active = 0;
    function pump() {
      while (active < concurrency && queue.length) {
        const job = queue.shift(); active++; job.status = 'loading';
        Promise.resolve().then(() => load(job.index)).then(value => {
          job.value = value; job.status = 'ready'; job.resolve(value);
        }, error => {
          job.error = error; job.status = 'error'; job.reject(error);
        }).finally(() => { active--; pump(); });
      }
    }
    function request(index, priority = false) {
      let job = jobs.get(index);
      if (!job || job.status === 'error') {
        job = { index, status: 'queued', error: null };
        job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
        jobs.set(index, job); queue.push(job);
      }
      if (priority && job.status === 'queued') { queue.splice(queue.indexOf(job), 1); queue.unshift(job); }
      pump(); return job.promise;
    }
    function state(index) {
      const job = jobs.get(index);
      return { index, status: job?.status ?? 'idle', error: job?.error ? String(job.error.message ?? job.error) : null };
    }
    return Object.freeze({ request, state, get active() { return active; }, get queued() { return queue.length; } });
  }
  const api = Object.freeze({ KIND, assertSequence, buildSequence, pageAt, panelTime, musicGain, musicVolumeExpression, createPageLoader });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.motionComicSequence = api;
})();
