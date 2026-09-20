/**
 * Harnais de développement du socle d'exploration (epic 3, lot 3.5).
 *
 * Page dev-only : servie par `vite` (voir explore-lab.html à la racine),
 * jamais incluse dans le build de production (non référencée par
 * `index.html`, absente de `vite build` par défaut — même principe que
 * `src/dev/diceLab.ts`).
 *
 * Assemble `ExploreState` (src/explore), `ExploreView` (src/render) et
 * `ObjectiveHud` (src/ui) autour d'une petite carte de démonstration
 * (`exploreLabMap.ts`). C'est le seul endroit du lot qui mélange logique et
 * rendu : exactement le rôle que jouera `chapter.ts`/`app.ts` au lot 3.6,
 * en plus petit et jetable.
 */

import * as THREE from 'three';
import '../ui/theme.css';
import { createDossier } from '@/core/dossier';
import { createRng } from '@/core/rng';
import { createRunState } from '@/narrative';
import { getCharacter } from '@/rules/character';
import { ExploreState, type Cell, type ExploreEvent, type MapDef } from '@/explore';
import { ExploreView, KEY_ZOOM_SPEED, type HoverTarget } from '@/render/exploreView';
import { ObjectiveHud } from '@/ui/objectiveHud';
import { BriefLineView } from '@/ui/briefLine';
import { EXPLORE_LAB_MAP } from './exploreLabMap';
import { HOLT_MAP } from '@/data/maps/holt';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';

/**
 * Carte affichée : `?map=holt` pour l'académie HOLT (lot 3.6a), `?map=centre-examen`
 * pour le centre d'examen désaffecté (lot 3.7a), sinon la carte de démonstration par
 * défaut (comportement inchangé). Seule concession de ces lots à ce fichier — le reste
 * du harnais (objectif, tirage du concierge/banc/fourgon) reste celui de la carte de
 * démo et n'a de sens que pour elle, voir `buildScene()` plus bas.
 */
const MAP_PARAM = new URLSearchParams(window.location.search).get('map');
const ACTIVE_MAP: MapDef =
  MAP_PARAM === 'holt' ? HOLT_MAP : MAP_PARAM === 'centre-examen' ? CENTRE_EXAMEN_MAP : EXPLORE_LAB_MAP;

const viewport = document.getElementById('explore-lab-viewport') as HTMLElement;
const canvas = document.getElementById('explore-lab-canvas') as HTMLCanvasElement;
const debugEl = document.getElementById('explore-lab-debug') as HTMLElement;
const logEl = document.getElementById('explore-lab-log') as HTMLElement;
const reloadBtn = document.getElementById('reload-btn') as HTMLButtonElement;
const reducedToggle = document.getElementById('reduced-toggle') as HTMLInputElement;
const completeStepBtn = document.getElementById('complete-step-btn') as HTMLButtonElement;

function log(message: string): void {
  const line = document.createElement('div');
  line.textContent = `${new Date().toLocaleTimeString('fr-FR')} — ${message}`;
  logEl.prepend(line);
}

function aspect(): number {
  return Math.max(0.1, viewport.clientWidth / Math.max(1, viewport.clientHeight));
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

let state: ExploreState;
let view: ExploreView;
let hud: ObjectiveHud;
let briefLine: BriefLineView;
let hoveredEntityId: string | null = null;
let lastPointerClient = { x: 0, y: 0 };

function entityCell(id: string): Cell | null {
  return ACTIVE_MAP.entities.find((e) => e.id === id)?.cell ?? null;
}

/** `npc` : réplique parlée (bulle qui suit la tête). `object` : narration en bas de l'écran. */
function playBriefLine(entityId: string, text: string): void {
  const entity = ACTIVE_MAP.entities.find((e) => e.id === entityId);
  if (entity?.type === 'npc') briefLine.showSpeech(entityId, text);
  else briefLine.showNarration(text);
}

function requestInteract(entityId: string): void {
  const res = state.requestInteract(entityId);
  if (!res.ok) log(`Interaction refusée (${entityId}) : ${res.reason}`);
}

function handleHover(target: HoverTarget | null): void {
  if (target?.type === 'entity') {
    hoveredEntityId = target.id;
    const info = state.listInteractables().find((i) => i.id === target.id);
    hud.setHoverLabel(info?.label ?? target.id, info?.reachable ?? true, lastPointerClient);
  } else {
    hoveredEntityId = null;
    hud.setHoverLabel(null);
  }
}

function handleEvent(ev: ExploreEvent): void {
  switch (ev.kind) {
    case 'zone-triggered':
      log(`Zone déclenchée : ${ev.entityId}`);
      break;
    case 'interaction-fired':
      log(`Interaction "${ev.entityId}" → ${ev.outcome.kind}`);
      if (ev.outcome.kind === 'door-toggled') view.setDoorOpen(ev.entityId, ev.outcome.open);
      if (ev.outcome.kind === 'brief-line') {
        log(`« ${ev.outcome.text} »`);
        playBriefLine(ev.outcome.entityId, ev.outcome.text);
      }
      if (ev.outcome.kind === 'door-locked' && ev.outcome.line) log(`« ${ev.outcome.line} »`);
      if (ev.outcome.kind === 'change-map') log(`Changement de carte → ${ev.outcome.targetMapId}`);
      break;
    case 'objective-task-progress':
      log(`Tâche "${ev.taskId}" : ${ev.count}/${ev.target}`);
      hud.setObjective(state.objectiveStatus());
      break;
    case 'objective-complete':
      log(`Objectif "${ev.objectiveId}" terminé.`);
      hud.setObjective(state.objectiveStatus());
      break;
    case 'arrived':
      break;
  }
}

function buildScene(): void {
  view?.dispose();
  hud?.dispose();
  briefLine?.dispose();

  const rng = createRng('explore-lab');
  const ctx = { dossier: createDossier(), run: createRunState('explore-lab') };
  state = new ExploreState(ACTIVE_MAP, ctx, { followerIds: ['equipier1', 'equipier2'] });
  if (ACTIVE_MAP.id === 'lab') {
    state.setObjective({
      id: 'obj1',
      title: 'Rejoindre le fourgon',
      context: 'Traverse les salles puis la cour.',
      completionTrigger: 'fourgon',
      tasks: [{ id: 't1', label: 'parler au concierge et s’asseoir', entityIds: ['concierge', 'bench'] }],
    });
  }

  view = new ExploreView(ACTIVE_MAP, rng, aspect(), {
    onHover: handleHover,
    onMoveTo: (cell) => {
      const res = state.walkLeaderTo(cell);
      if (!res.ok) log(`Déplacement refusé : ${res.reason}`);
    },
    onInteract: requestInteract,
  });
  view.setLeader(getCharacter('franklyn'));
  view.setFollower('equipier1', getCharacter('abigail'));
  view.setFollower('equipier2', getCharacter('john'));
  view.setReducedMotion(reducedToggle.checked);
  view.setPingTarget(entityCell('fourgon'));
  // Position initiale de la caméra : la caméra ne suit plus Franklyn (08-EXPLORATION.md "La
  // caméra et les murs") — elle est libre, et ne se recentre que sur des moments ponctuels.
  // Ici, l'équivalent du "début d'une étape" qui reviendra à `chapter.ts` (lot 3.6c, portée).
  view.updateRigPosition('leader', state.leaderCell(), false, 0);
  view.centerOn(state.leaderCell());

  hud = new ObjectiveHud(viewport, {
    onPingChange: (active) => view.setPingActive(active),
    onInteractSelected: requestInteract,
  });
  hud.setObjective(state.objectiveStatus());

  briefLine = new BriefLineView(viewport);

  // Crochet de débogage du banc d'essai (dev only, jamais dans le build de production — voir
  // l'en-tête de fichier) : permet de piloter une réplique brève sans souris pour la vérification
  // visuelle (Playwright), dans l'esprit de `window.__game` (08-EXPLORATION.md "L'API de debug").
  (window as unknown as { __exploreLab: unknown }).__exploreLab = {
    state,
    view,
    triggerBriefLine: (entityId: string) => {
      const outcome = state.interact(entityId);
      if (outcome.kind === 'brief-line') playBriefLine(outcome.entityId, outcome.text);
      return outcome;
    },
  };

  log('Carte rechargée.');
}

/* -------------------------------------------------------------------- */
/* Souris : conversion écran -> NDC, déléguée à `ExploreView`.           */
/* -------------------------------------------------------------------- */

function ndcFromEvent(e: PointerEvent | MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
  };
}

canvas.addEventListener('pointermove', (e) => {
  lastPointerClient = { x: e.clientX, y: e.clientY };
  const { x, y } = ndcFromEvent(e);
  view.handlePointerMove(x, y);
});

canvas.addEventListener('click', (e) => {
  const { x, y } = ndcFromEvent(e);
  view.handleClick(x, y);
});

// Molette, en continu, vers le curseur (08-EXPLORATION.md "Contrôles").
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const { x, y } = ndcFromEvent(e);
    view.zoomAtCursor(x, y, e.deltaY, aspect());
  },
  { passive: false },
);

/* -------------------------------------------------------------------- */
/* Clavier : flèches (panoramique continu), A/E rotation, molette/+/-    */
/* zoom continu, C recentre sur Franklyn, Espace sur l'objet survolé.    */
/* (Tab maintenu / Tab-Maj+Tab / Espace-sur-sélection : `ObjectiveHud`.) */
/* -------------------------------------------------------------------- */

const heldKeys = { up: false, down: false, left: false, right: false, zoomIn: false, zoomOut: false };

const PAN_KEYS: Record<string, keyof typeof heldKeys> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

window.addEventListener('keydown', (e) => {
  const panKey = PAN_KEYS[e.key];
  if (panKey) {
    heldKeys[panKey] = true;
    e.preventDefault();
    return;
  }
  if (e.key === '+' || e.key === '=') {
    heldKeys.zoomIn = true;
    return;
  }
  if (e.key === '-' || e.key === '_') {
    heldKeys.zoomOut = true;
    return;
  }
  if (e.key === 'a' || e.key === 'A') view.rotate(-1);
  else if (e.key === 'e' || e.key === 'E') view.rotate(1);
  else if (e.key === 'c' || e.key === 'C') view.centerOnLeader();
  else if ((e.key === ' ' || e.code === 'Space') && !hud.hasSelection() && hoveredEntityId) {
    e.preventDefault();
    requestInteract(hoveredEntityId);
  }
});

window.addEventListener('keyup', (e) => {
  const panKey = PAN_KEYS[e.key];
  if (panKey) heldKeys[panKey] = false;
  else if (e.key === '+' || e.key === '=') heldKeys.zoomIn = false;
  else if (e.key === '-' || e.key === '_') heldKeys.zoomOut = false;
});

// Touches restées "enfoncées" si la fenêtre perd le focus pendant un appui (alt-tab...).
window.addEventListener('blur', () => {
  heldKeys.up = heldKeys.down = heldKeys.left = heldKeys.right = false;
  heldKeys.zoomIn = heldKeys.zoomOut = false;
});

/* -------------------------------------------------------------------- */
/* Contrôles du harnais                                                  */
/* -------------------------------------------------------------------- */

reloadBtn.addEventListener('click', () => buildScene());
reducedToggle.addEventListener('change', () => view.setReducedMotion(reducedToggle.checked));
completeStepBtn.addEventListener('click', () => {
  state.completeStep();
  for (const ev of state.drainEvents()) handleEvent(ev);
});

window.addEventListener('resize', () => {
  renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
  view.resize(aspect());
});

/* -------------------------------------------------------------------- */
/* Boucle d'image                                                        */
/* -------------------------------------------------------------------- */

let lastTime = performance.now();

function frame(now: number): void {
  const dtMs = Math.min(now - lastTime, 250);
  lastTime = now;
  const dt = dtMs / 1000;

  for (const ev of state.tick(dtMs)) handleEvent(ev);

  // Caméra libre (08-EXPLORATION.md "La caméra et les murs") : plus de suivi automatique du
  // meneur ici — seul un panoramique clavier continu et le recentrage `C`/`centerOnLeader()`.
  view.panScreenRelative(heldKeys, dt);
  if (heldKeys.zoomIn) view.zoomBy(-KEY_ZOOM_SPEED * dt, aspect());
  if (heldKeys.zoomOut) view.zoomBy(KEY_ZOOM_SPEED * dt, aspect());

  view.updateRigPosition('leader', state.leaderPosition(), state.isMoving(), dt);
  for (const [i, pos] of state.followerPositions().entries()) {
    view.updateRigPosition(i === 0 ? 'equipier1' : 'equipier2', pos, state.isMoving(), dt);
  }
  view.tick(dt);

  briefLine.tick(dt);
  const trackedEntityId = briefLine.entityToTrack;
  if (trackedEntityId) {
    const cell = entityCell(trackedEntityId);
    const pos = cell ? view.projectToScreen(cell, viewport.clientWidth, viewport.clientHeight) : null;
    briefLine.setSpeechScreenPosition(pos);
  }

  const interactables = state.listInteractables();
  hud.setInteractables(interactables.map((it) => ({ id: it.id, label: it.label, reachable: it.reachable })));
  if (hoveredEntityId) {
    const info = interactables.find((i) => i.id === hoveredEntityId);
    if (info) hud.setHoverLabel(info.label, info.reachable, lastPointerClient);
  }

  debugEl.textContent = JSON.stringify(state.explore(), null, 2);

  renderer.render(view.scene, view.camera.camera);
  requestAnimationFrame(frame);
}

renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
buildScene();
requestAnimationFrame(frame);
