/** Self-contained art pilot. It uses the actual navigation, view, renderer and rig contract. */
import { createDossier } from '@/core/dossier';
import { createRng } from '@/core/rng';
import {
  DORMITORY_BASELINE_VISUALS,
  DORMITORY_PILOT_MAP,
  DORMITORY_PILOT_VISUALS,
} from './dormitoryPilotMap';
import { ExploreState, type Cell } from '@/explore';
import { createRunState } from '@/narrative';
import { getCharacter } from '@/rules/character';
import { ExploreView, KEY_ZOOM_SPEED, type ExploreViewArtOptions } from '@/render/exploreView';
import { createCadetExplorationRig } from '@/render/exploration/cadetRig';
import { preloadCadetAssets } from '@/render/exploration/characterAssets';
import { DormitoryPilotPropFactory } from '@/render/exploration/dormitoryPilotProps';
import { createDormitoryPilotFloor } from '@/render/exploration/dormitoryPilotFloor';
import { createGameRenderer, rendererDescription } from '@/render/rendererSetup';

const query = new URLSearchParams(location.search);
const baseline = query.get('quality') === 'baseline';
if (query.get('hud') === '0') document.body.classList.add('clean');
const canvas = document.querySelector<HTMLCanvasElement>('#pilot-canvas')!;
const message = document.querySelector<HTMLElement>('#message')!;
const renderer = createGameRenderer({ canvas, shadows: true, toneMappingExposure: 1.08 });
const aspect = () => Math.max(0.1, innerWidth / Math.max(1, innerHeight));
renderer.setSize(innerWidth, innerHeight, false);

const state = new ExploreState(
  DORMITORY_PILOT_MAP,
  { dossier: createDossier(), run: createRunState('dormitory-pilot') },
  { spawn: 'franklyn' },
);
const art: ExploreViewArtOptions = {
  visuals: baseline ? DORMITORY_BASELINE_VISUALS : DORMITORY_PILOT_VISUALS,
  dormitoryArchitecture: {
    camera: { x: 4, y: 6 },
    control: { x: 4, y: 7 },
    conduit: { x: 4, y: 8 },
  },
  pilotBranding: !baseline,
  ...(baseline
    ? {}
    : {
        floorTexture: createDormitoryPilotFloor(),
        propFactory: (world: (cell: Cell) => { x: number; z: number }, rng: ReturnType<typeof createRng>) =>
          new DormitoryPilotPropFactory(world, rng),
        leaderRig: (sheet: ReturnType<typeof getCharacter>, color: number) =>
          createCadetExplorationRig(sheet, color, { pilotFranklyn: true, showLabel: false }),
      }),
};

const view = new ExploreView(
  DORMITORY_PILOT_MAP,
  createRng('dormitory-pilot-visuals'),
  aspect(),
  {
    onMoveTo: (cell) => {
      const result = state.walkLeaderTo(cell);
      if (!result.ok) show(result.reason ?? 'Déplacement impossible.');
    },
    onInteract: (entityId) => {
      const result = state.requestInteract(entityId);
      if (!result.ok) show(result.reason ?? 'Interaction impossible.');
    },
  },
  art,
);

function show(text: string): void {
  message.textContent = text;
  message.classList.add('visible');
  window.setTimeout(() => message.classList.remove('visible'), 3200);
}

function ndc(event: MouseEvent | PointerEvent | WheelEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
  };
}
canvas.addEventListener('pointermove', (event) => {
  const pos = ndc(event);
  view.handlePointerMove(pos.x, pos.y);
});
canvas.addEventListener('click', (event) => {
  const pos = ndc(event);
  view.handleClick(pos.x, pos.y);
});
canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const pos = ndc(event);
    view.zoomAtCursor(pos.x, pos.y, event.deltaY, aspect());
  },
  { passive: false },
);

const held = { up: false, down: false, left: false, right: false, zoomIn: false, zoomOut: false };
const arrows = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' } as const;
window.addEventListener('keydown', (event) => {
  if (event.key in arrows) {
    held[arrows[event.key as keyof typeof arrows]] = true;
    event.preventDefault();
  } else if (event.key === 'a' || event.key === 'A') view.rotate(-1);
  else if (event.key === 'e' || event.key === 'E') view.rotate(1);
  else if (event.key === 'c' || event.key === 'C') view.centerOnLeader();
  else if (event.key === '+' || event.key === '=') held.zoomIn = true;
  else if (event.key === '-' || event.key === '_') held.zoomOut = true;
});
window.addEventListener('keyup', (event) => {
  if (event.key in arrows) held[arrows[event.key as keyof typeof arrows]] = false;
  if (event.key === '+' || event.key === '=') held.zoomIn = false;
  if (event.key === '-' || event.key === '_') held.zoomOut = false;
});
window.addEventListener('blur', () =>
  Object.keys(held).forEach((key) => {
    held[key as keyof typeof held] = false;
  }),
);
window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  view.resize(aspect());
});

const frameTimes: number[] = [];
const renderTimes: number[] = [];
let previous = performance.now();
function frame(now: number): void {
  const elapsedMs = now - previous;
  const dtMs = Math.min(elapsedMs, 250);
  previous = now;
  frameTimes.push(elapsedMs);
  if (frameTimes.length > 600) frameTimes.shift();
  const dt = dtMs / 1000;
  for (const event of state.tick(dtMs)) {
    if (event.kind === 'interaction-fired' && event.outcome.kind === 'brief-line') show(event.outcome.text);
  }
  view.panScreenRelative(held, dt);
  if (held.zoomIn) view.zoomBy(-KEY_ZOOM_SPEED * dt, aspect());
  if (held.zoomOut) view.zoomBy(KEY_ZOOM_SPEED * dt, aspect());
  view.updateRigPosition('leader', state.leaderPosition(), state.isMoving(), dt);
  view.tick(dt);
  view.setVisibleEntities(state.listInteractables().map((entry) => entry.id));
  view.setDiscoveredRooms(state.discoveredRoomIds());
  const renderStart = performance.now();
  renderer.render(view.scene, view.camera.camera);
  renderTimes.push(performance.now() - renderStart);
  if (renderTimes.length > 600) renderTimes.shift();
  requestAnimationFrame(frame);
}

function summary(values: number[]): { median: number; p95: number } {
  const sorted = values.slice(30).sort((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)] ?? 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
  };
}

/** Dev-only handle for reproducible browser review, separate from the chapter's __game API. */
Object.assign(window, {
  __dormitoryPilot: {
    state,
    view,
    renderer,
    baseline,
    walkTo: (x: number, y: number) => state.walkLeaderTo({ x, y }),
    metrics: () => ({
      gpu: rendererDescription(renderer),
      frameMs: summary(frameTimes),
      renderMs: summary(renderTimes),
      frameSamples: frameTimes.length,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      resourceTransferBytes: performance
        .getEntriesByType('resource')
        .reduce((total, entry) => total + (entry as PerformanceResourceTiming).transferSize, 0),
      resourceEncodedBytes: performance
        .getEntriesByType('resource')
        .reduce((total, entry) => total + (entry as PerformanceResourceTiming).encodedBodySize, 0),
      jsHeapBytes:
        (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null,
      zoom: view.camera.getZoom(),
      viewport: [innerWidth, innerHeight],
      dpr: renderer.getPixelRatio(),
      leader: state.leaderPosition(),
      moving: state.isMoving(),
    }),
  },
});

await preloadCadetAssets();
view.setLeader(getCharacter('franklyn'));
view.updateRigPosition('leader', state.leaderCell(), false, 0);
view.centerOn({ x: 14, y: 8 });
view.setVisibleEntities(state.listInteractables().map((entry) => entry.id));
view.setDiscoveredRooms(state.discoveredRoomIds());
requestAnimationFrame(frame);
