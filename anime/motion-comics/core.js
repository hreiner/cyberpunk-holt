/* Shared by the browser and Node; no media access or provider calls. */
/* global module */
(() => {
  const SCHEMA_VERSION = 1;
  const EFFECT_TYPES = ['neon', 'reflection', 'hair', 'rain', 'particles', 'lightSweep', 'sparks', 'digitalVision', 'smoke', 'debris', 'ripple', 'wind', 'wave'];
  const DEFAULTS = Object.freeze({ overviewSeconds: 1.8, transitionSeconds: 0.8, gapSeconds: 0.35, outroSeconds: 1.5 });
  const LAYER_LIMITS = Object.freeze({ frames: 12, keyframes: 12, translation: 2, minScale: 0.05, maxScale: 2, rotationDegrees: 20, impactPx: 8, impactSeconds: 0.25, shadowEllipses: 4, shadowOpacity: 0.75 });
  const fail = message => { throw new Error(message); };
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = (value, name) => typeof value === 'string' && value.trim() || fail(`${name} : texte requis.`);
  function number(value, name, min = 0, max = Infinity) {
    if (!Number.isFinite(value) || value < min || value > max) fail(`${name} : nombre attendu entre ${min} et ${max}.`);
  }
  function rect(value, name) {
    if (!Array.isArray(value) || value.length !== 4 || value.some(v => !Number.isFinite(v)) ||
      value[0] < 0 || value[1] < 0 || value[2] <= 0 || value[3] <= 0 ||
      value[0] + value[2] > 1.000001 || value[1] + value[3] > 1.000001) {
      fail(`${name} : rectangle [x, y, largeur, hauteur] normalisé invalide.`);
    }
  }
  function media(value, name) {
    text(value, name);
    if (/^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(value) || /[?#]/.test(value) || [...value].some(c => c.charCodeAt(0) < 32) || value.includes('\\')) {
      fail(`${name} : chemin local relatif attendu, avec des /.`);
    }
  }
  function pair(value, name, min, max) {
    if (!Array.isArray(value) || value.length !== 2) fail(`${name} : paire attendue.`);
    value.forEach(v => number(v, name, min, max));
  }
  function polygon(value, name, container) {
    if (!Array.isArray(value) || value.length < 3 || value.length > 16) fail(`${name} : polygone simple de 3 à 16 points requis.`);
    const [x, y, w, h] = container;
    for (const point of value) {
      pair(point, name, 0, 1);
      if (point[0] < x - 1e-6 || point[1] < y - 1e-6 || point[0] > x + w + 1e-6 || point[1] > y + h + 1e-6) fail(`${name} : les points doivent rester dans le rectangle.`);
    }
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    let area = 0;
    for (let i = 0; i < value.length; i++) {
      const a = value[i], b = value[(i + 1) % value.length];
      if (a[0] === b[0] && a[1] === b[1]) fail(`${name} : deux points consécutifs se confondent.`);
      area += a[0] * b[1] - b[0] * a[1];
      for (let j = i + 2; j < value.length; j++) {
        if ((j + 1) % value.length === i) continue;
        const c = value[j], d = value[(j + 1) % value.length];
        if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) fail(`${name} : les côtés ne doivent pas se croiser.`);
      }
    }
    if (Math.abs(area) < 1e-10) fail(`${name} : surface non nulle requise.`);
  }
  function assertLayers(data, panelIds) {
    if (data.motionBaseImage !== undefined) media(data.motionBaseImage, 'motionBaseImage');
    if (data.letteringImage !== undefined) media(data.letteringImage, 'letteringImage');
    if (data.letteringImage !== undefined && data.motionBaseImage === undefined) fail('Le lettrage séparé exige un dessin de base.');
    if (data.motionBaseImage !== undefined && data.panels.some(p => p.cues?.length)) media(data.letteringImage, 'letteringImage');
    if (data.motionLayers === undefined) return;
    if (!Array.isArray(data.motionLayers)) fail('motionLayers : liste attendue.');
    if (!data.motionLayers.length) return;
    media(data.motionBaseImage, 'motionBaseImage');
    if (data.panels.some(p => p.cues?.length)) media(data.letteringImage, 'letteringImage');
    const layerIds = new Set();
    let letteringTracks = 0;
    for (const layer of data.motionLayers) {
      if (!object(layer)) fail('Calque de mouvement invalide.');
      text(layer.id, 'Identifiant de calque');
      if (layerIds.has(layer.id)) fail(`Identifiant de calque en double : ${layer.id}`);
      layerIds.add(layer.id);
      if (!panelIds.has(layer.panelId)) fail('Calque : case inconnue.');
      rect(layer.rect, 'Calque');
      if (layer.clipPolygon !== undefined) polygon(layer.clipPolygon, 'Calque.clipPolygon', layer.rect);
      const panel = data.panels.find(p => p.id === layer.panelId);
      if (layer.rect[0] < panel.rect[0] || layer.rect[1] < panel.rect[1] ||
        layer.rect[0] + layer.rect[2] > panel.rect[0] + panel.rect[2] + 0.000001 ||
        layer.rect[1] + layer.rect[3] > panel.rect[1] + panel.rect[3] + 0.000001) fail('Le calque doit rester dans sa case.');
      if (!['frames', 'sprite', 'digitalReveal'].includes(layer.mode)) fail('Calque : mode frames, sprite ou digitalReveal attendu.');
      number(layer.startSeconds, 'Calque.startSeconds');
      number(layer.endSeconds, 'Calque.endSeconds', Number.MIN_VALUE);
      if (layer.endSeconds <= layer.startSeconds) fail('La fin du calque doit suivre son début.');
      const duration = layer.endSeconds - layer.startSeconds;
      if (layer.background !== undefined) media(layer.background, 'Calque.background');
      if (layer.mode === 'sprite' && !layer.background) fail('Un sprite exige un fond reconstruit.');
      if (layer.pivot !== undefined) pair(layer.pivot, 'Calque.pivot', 0, 1);
      if (!Array.isArray(layer.frames) || !layer.frames.length || layer.frames.length > LAYER_LIMITS.frames) fail('Calque.frames : 1 à 12 dessins requis.');
      let previous = -1;
      for (const frame of layer.frames) {
        if (!object(frame)) fail('Dessin de calque invalide.');
        media(frame.image, 'Dessin.image'); number(frame.atSeconds, 'Dessin.atSeconds', 0, duration);
        if (frame.atSeconds <= previous || previous < 0 && frame.atSeconds !== 0) fail('Les dessins doivent commencer à zéro puis suivre des temps strictement croissants.');
        previous = frame.atSeconds;
        if (frame.sourceRect !== undefined) rect(frame.sourceRect, 'Dessin.sourceRect');
        if (frame.letteringImage !== undefined) media(frame.letteringImage, 'Dessin.letteringImage');
      }
      if (layer.mode === 'digitalReveal') {
        if (layer.frames.length !== 2 || !object(layer.reveal)) fail('La révélation numérique exige deux dessins et sa transition.');
        number(layer.reveal.durationSeconds, 'Révélation.durationSeconds', Number.MIN_VALUE, layer.frames[1].atSeconds);
        for (const [key, min, max] of [['columns', 4, 24], ['rows', 2, 16]]) {
          const value = layer.reveal[key];
          if (!Number.isInteger(value) || value < min || value > max) fail(`Révélation.${key} : entier attendu entre ${min} et ${max}.`);
        }
        if (layer.reveal.amplitudePx !== undefined) number(layer.reveal.amplitudePx, 'Révélation.amplitudePx', 0, 32);
        if (layer.reveal.color !== undefined && !/^#[\da-f]{6}$/i.test(layer.reveal.color)) fail('Révélation.color : couleur #RRGGBB attendue.');
        if (layer.background !== undefined || layer.impact !== undefined) fail('La révélation numérique reste un échange d’images, sans fond mobile ni secousse.');
      } else if (layer.reveal !== undefined) fail('reveal : réservé au mode digitalReveal.');
      if (layer.frames.some(frame => frame.letteringImage !== undefined) && ++letteringTracks > 1) fail('Un seul calque par page peut choisir un lettrage de pleine page.');
      if (layer.keyframes !== undefined) {
        if (layer.mode !== 'sprite') fail('Les transformations durables exigent un sprite isolé ; les dessins de case changent par poses.');
        if (!Array.isArray(layer.keyframes) || !layer.keyframes.length || layer.keyframes.length > LAYER_LIMITS.keyframes) fail('Calque.keyframes : 1 à 12 clés requises.');
        previous = -1;
        for (const key of layer.keyframes) {
          if (!object(key)) fail('Clé de mouvement invalide.');
          number(key.atSeconds, 'Clé.atSeconds', 0, duration);
          if (key.atSeconds <= previous || previous < 0 && key.atSeconds !== 0) fail('Les clés doivent commencer à zéro puis suivre des temps strictement croissants.');
          previous = key.atSeconds;
          if (key.translate !== undefined) pair(key.translate, 'Clé.translate', -LAYER_LIMITS.translation, LAYER_LIMITS.translation);
          if (key.scale !== undefined) number(key.scale, 'Clé.scale', LAYER_LIMITS.minScale, LAYER_LIMITS.maxScale);
          if (key.rotationDegrees !== undefined) number(key.rotationDegrees, 'Clé.rotationDegrees', -LAYER_LIMITS.rotationDegrees, LAYER_LIMITS.rotationDegrees);
          if (key.opacity !== undefined) number(key.opacity, 'Clé.opacity', 0, 1);
          if (key.easing !== undefined && !['linear', 'smoothstep'].includes(key.easing)) fail('Clé.easing : linear ou smoothstep attendu.');
        }
      }
      if (layer.impact !== undefined) {
        const impact = layer.impact;
        if (!object(impact)) fail('Impact de calque invalide.');
        number(impact.atSeconds, 'Impact.atSeconds', 0, duration);
        number(impact.durationSeconds, 'Impact.durationSeconds', Number.MIN_VALUE, LAYER_LIMITS.impactSeconds);
        number(impact.amplitudePx, 'Impact.amplitudePx', 0, LAYER_LIMITS.impactPx);
        if (impact.atSeconds + impact.durationSeconds > duration) fail('L’impact doit finir dans la durée du calque.');
      }
      if (layer.contactShadow !== undefined) {
        const shadow = layer.contactShadow;
        if (layer.mode !== 'sprite' || !object(shadow)) fail('L’ombre de contact exige un sprite isolé.');
        if (shadow.color !== undefined && !/^#[\da-f]{6}$/i.test(shadow.color)) fail('Ombre.color : couleur #RRGGBB attendue.');
        if (shadow.opacity !== undefined) number(shadow.opacity, 'Ombre.opacity', 0, LAYER_LIMITS.shadowOpacity);
        if (!Array.isArray(shadow.ellipses) || !shadow.ellipses.length || shadow.ellipses.length > LAYER_LIMITS.shadowEllipses) fail('Ombre.ellipses : 1 à 4 contacts requis.');
        for (const ellipse of shadow.ellipses) {
          if (!object(ellipse)) fail('Contact elliptique invalide.');
          pair(ellipse.center, 'Contact.center', 0, 1); pair(ellipse.size, 'Contact.size', Number.MIN_VALUE, 1);
          if (ellipse.rotationDegrees !== undefined) number(ellipse.rotationDegrees, 'Contact.rotationDegrees', -LAYER_LIMITS.rotationDegrees, LAYER_LIMITS.rotationDegrees);
          if (ellipse.opacity !== undefined) number(ellipse.opacity, 'Contact.opacity', 0, 1);
        }
      }
    }
  }
  function assertManifest(data) {
    if (!object(data)) fail('Le manifeste doit être un objet JSON.');
    // Before the format was named, version meant editorial revision (v1–v4).
    if ((data.schemaVersion ?? 1) !== SCHEMA_VERSION) fail('Version de format non prise en charge.');
    if (!Number.isInteger(data.version) || data.version < 1) fail('version : révision entière positive requise.');
    text(data.title, 'title'); media(data.image, 'image');
    if (data.storyThumbnail !== undefined && typeof data.storyThumbnail !== 'boolean') fail('storyThumbnail : booléen attendu.');
    for (const name of Object.keys(DEFAULTS)) if (data[name] !== undefined) number(data[name], name);
    if (!Array.isArray(data.panels) || !data.panels.length) fail('Aucune case définie.');
    const ids = new Set();
    data.panels.forEach((panel, index) => {
      if (!object(panel)) fail(`Case ${index + 1} invalide.`);
      text(panel.id, 'Identifiant de case');
      if (ids.has(panel.id)) fail(`Identifiant de case en double : ${panel.id}`);
      ids.add(panel.id); rect(panel.rect, panel.id);
      if (panel.holdSeconds !== undefined) number(panel.holdSeconds, `${panel.id}.holdSeconds`);
      if (panel.leadInSeconds !== undefined) number(panel.leadInSeconds, `${panel.id}.leadInSeconds`);
      if (panel.cues !== undefined && !Array.isArray(panel.cues)) fail(`${panel.id}.cues : liste attendue.`);
      for (const cue of panel.cues ?? []) {
        if (!object(cue)) fail(`Réplique invalide : ${panel.id}`);
        media(cue.audio, `${panel.id}.audio`);
        number(cue.duration, `${panel.id}.duration`, Number.MIN_VALUE);
        if (cue.gapSeconds !== undefined) number(cue.gapSeconds, `${panel.id}.gapSeconds`);
      }
    });
    assertLayers(data, ids);
    if (data.panelReveals !== undefined) {
      if (!Array.isArray(data.panelReveals)) fail('panelReveals : liste attendue.');
      const revealed = new Set();
      for (const reveal of data.panelReveals) {
        if (!object(reveal) || !ids.has(reveal.panelId) || revealed.has(reveal.panelId)) fail('Révélation de case : identifiant unique connu requis.');
        revealed.add(reveal.panelId); number(reveal.atSeconds, 'Révélation.atSeconds');
      }
    }
    if (data.effects !== undefined && !Array.isArray(data.effects)) fail('effects : liste attendue.');
    for (const [index, fx] of (data.effects ?? []).entries()) {
      if (!object(fx) || !EFFECT_TYPES.includes(fx.type)) fail(`Effet ${index + 1} inconnu.`);
      rect(fx.rect, `Effet ${index + 1}`);
      if (fx.clipPolygon !== undefined) polygon(fx.clipPolygon, 'Effet.clipPolygon', fx.rect);
      if (fx.frequency !== undefined) number(fx.frequency, 'frequency', Number.MIN_VALUE);
      if (fx.phase !== undefined) number(fx.phase, 'phase', -Infinity);
      if (fx.amplitude !== undefined) number(fx.amplitude, 'amplitude', 0, fx.type === 'hair' ? 12 : 40);
      if (fx.strength !== undefined) number(fx.strength, 'strength', 0, fx.type === 'rain' ? 1 : 0.7);
      if (fx.count !== undefined && (!Number.isInteger(fx.count) || fx.count < 1 || fx.count > 80)) fail('count : entier attendu entre 1 et 80.');
      if (fx.speed !== undefined) number(fx.speed, 'speed', 0, 2);
      if (fx.startSeconds !== undefined) number(fx.startSeconds, 'startSeconds');
      if (fx.endSeconds !== undefined) {
        number(fx.endSeconds, 'endSeconds', Number.MIN_VALUE);
        if (fx.endSeconds <= (fx.startSeconds ?? 0)) fail('endSeconds doit suivre startSeconds.');
      }
      if (fx.clock !== undefined && !['ambient', 'story'].includes(fx.clock)) fail('clock : ambient ou story attendu.');
      if (fx.rainFlow !== undefined && (fx.type !== 'rain' || typeof fx.rainFlow !== 'boolean')) fail('rainFlow : booléen réservé à rain.');
      if (fx.envelope !== undefined) {
        if (!object(fx.envelope) || fx.clock !== 'story' || fx.startSeconds === undefined || fx.endSeconds === undefined || fx.type === 'hair') fail('envelope : effet de matière story borné requis.');
        number(fx.envelope.attackSeconds, 'Enveloppe.attackSeconds'); number(fx.envelope.releaseSeconds, 'Enveloppe.releaseSeconds');
        if (fx.envelope.attackSeconds + fx.envelope.releaseSeconds > fx.endSeconds - fx.startSeconds + 1e-10) fail('Enveloppe : attaque et sortie doivent tenir dans l’effet.');
      }
      if (fx.direction !== undefined && (fx.type !== 'smoke' || !['up', 'left', 'right'].includes(fx.direction))) fail('direction : up, left ou right, réservé à smoke.');
      if (fx.directionDegrees !== undefined) {
        if (fx.type !== 'wind') fail('directionDegrees : réservé au vent.');
        number(fx.directionDegrees, 'directionDegrees', -180, 180);
      }
      if (fx.softEdge !== undefined && (typeof fx.softEdge !== 'boolean' || !['neon', 'reflection'].includes(fx.type))) fail('softEdge : booléen réservé à neon et reflection.');
      if (fx.revealSeconds !== undefined) {
        if (fx.type !== 'digitalVision') fail('revealSeconds : réservé à digitalVision.');
        number(fx.revealSeconds, 'revealSeconds', 0, 10);
      }
      if (fx.mapRect !== undefined) {
        if (fx.type !== 'digitalVision') fail('mapRect : réservé à digitalVision.');
        rect(fx.mapRect, 'mapRect');
        if (fx.mapRect[0] < fx.rect[0] || fx.mapRect[1] < fx.rect[1] ||
          fx.mapRect[0] + fx.mapRect[2] > fx.rect[0] + fx.rect[2] + 0.000001 ||
          fx.mapRect[1] + fx.mapRect[3] > fx.rect[1] + fx.rect[3] + 0.000001) fail('mapRect : la minimap doit rester dans la région de vision.');
      }
      if (fx.panelId !== undefined && !ids.has(fx.panelId)) fail('panelId : case d’effet inconnue.');
      if (fx.color !== undefined && !/^#[\da-f]{6}$/i.test(fx.color)) fail('color : couleur #RRGGBB attendue.');
      if (fx.protect !== undefined && !Array.isArray(fx.protect)) fail('protect : liste de rectangles attendue.');
      for (const r of fx.protect ?? []) rect(r, 'Protection locale');
    }
    if (data.protectedRegions !== undefined && !Array.isArray(data.protectedRegions)) fail('protectedRegions : liste attendue.');
    const regionIds = new Set();
    for (const region of data.protectedRegions ?? []) {
      if (!object(region)) fail('Zone protégée invalide.');
      text(region.id, 'Identifiant de zone protégée'); rect(region.rect, region.id);
      if (regionIds.has(region.id)) fail(`Zone protégée en double : ${region.id}`);
      regionIds.add(region.id);
    }
    if (data.review !== undefined) {
      if (!object(data.review)) fail('review : objet attendu.');
      for (const key of ['sampleTime', 'deltaSeconds', 'minimumChangedPixels', 'minimumLiveChangedPixels']) {
        if (data.review[key] !== undefined) number(data.review[key], `review.${key}`, key === 'deltaSeconds' ? Number.MIN_VALUE : 0);
      }
    }
    return data;
  }
  function buildTimeline(data) {
    assertManifest(data);
    const timing = { ...DEFAULTS, ...data };
    let cursor = timing.overviewSeconds;
    const segments = [{ start: 0, end: cursor, rect: [0, 0, 1, 1], panel: -1 }], tracks = [];
    data.panels.forEach((panel, index) => {
      const start = cursor;
      cursor += timing.transitionSeconds;
      cursor += panel.leadInSeconds ?? 0;
      for (const cue of panel.cues ?? []) {
        tracks.push({ start: cursor, end: cursor + cue.duration, audio: cue.audio, speaker: cue.speaker ?? '', panel: index });
        cursor += cue.duration + (cue.gapSeconds ?? timing.gapSeconds);
      }
      cursor = Math.max(cursor, start + timing.transitionSeconds + (panel.holdSeconds ?? 1));
      segments.push({ start, end: cursor, rect: [...panel.rect], panel: index });
    });
    segments.push({ start: cursor, end: cursor + timing.outroSeconds, rect: [0, 0, 1, 1], panel: -1 });
    const duration = cursor + timing.outroSeconds;
    if (!Number.isFinite(duration) || duration <= 0) fail('La chronologie doit avoir une durée positive finie.');
    if ((data.effects ?? []).some(fx => fx.startSeconds !== undefined && fx.startSeconds >= duration)) fail('startSeconds doit être dans la chronologie de la page.');
    if ((data.effects ?? []).some(fx => fx.endSeconds !== undefined && fx.endSeconds > duration)) fail('endSeconds doit être dans la chronologie de la page.');
    if ((data.motionLayers ?? []).some(layer => layer.endSeconds > duration)) fail('La fin du calque doit être dans la chronologie de la page.');
    if ((data.panelReveals ?? []).some(reveal => reveal.atSeconds >= duration)) fail('Révélation de case : ancre dans la chronologie requise.');
    for (const layer of data.motionLayers ?? []) {
      const index = data.panels.findIndex(panel => panel.id === layer.panelId);
      const segment = segments.find(segment => segment.panel === index);
      if (layer.startSeconds < segment.start + timing.transitionSeconds - 1e-8 || layer.endSeconds > segment.end + 1e-8) {
        fail('L’action du calque doit rester pendant la tenue de sa case.');
      }
    }
    if (data.review?.sampleTime !== undefined && data.review.sampleTime >= duration) fail('review.sampleTime doit être dans la chronologie.');
    return { segments, tracks, duration };
  }
  function assetPaths(data) {
    return [...new Set([data.image, data.motionBaseImage, data.letteringImage,
      ...data.panels.flatMap(panel => (panel.cues ?? []).map(cue => cue.audio)),
      ...(data.motionLayers ?? []).flatMap(layer => [layer.background, ...layer.frames.flatMap(frame => [frame.image, frame.letteringImage])]),
    ].filter(value => value !== undefined))];
  }
  function rebaseAssets(data, mapPath) {
    const copy = JSON.parse(JSON.stringify(data));
    for (const key of ['image', 'motionBaseImage', 'letteringImage']) if (copy[key] !== undefined) copy[key] = mapPath(copy[key]);
    for (const panel of copy.panels) for (const cue of panel.cues ?? []) cue.audio = mapPath(cue.audio);
    for (const layer of copy.motionLayers ?? []) {
      if (layer.background !== undefined) layer.background = mapPath(layer.background);
      for (const frame of layer.frames) {
        frame.image = mapPath(frame.image);
        if (frame.letteringImage !== undefined) frame.letteringImage = mapPath(frame.letteringImage);
      }
    }
    return assertManifest(copy);
  }
  const api = Object.freeze({ SCHEMA_VERSION, EFFECT_TYPES, DEFAULTS, LAYER_LIMITS, assertManifest, buildTimeline, assetPaths, rebaseAssets });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.motionComicCore = api;
})();
