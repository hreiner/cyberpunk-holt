import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ExploreMap } from '@/explore';
import { HOLT_MAP } from '@/data/maps/holt';
import { ExploreView, cellToWorld } from '@/render/exploreView';
import { IsoCamera } from '@/render/isoCamera';
import { DormitoryPerspectiveCamera } from '@/render/exploration/dormitoryPerspectiveCamera';

describe('visée de l’exploration', () => {
  it('recentre les petites salles HOLT au bord de la carte après zoom et rotation', () => {
    const map = new ExploreMap(HOLT_MAP);
    const iso = new IsoCamera(16 / 9, { min: 10, max: 96 }, 16);
    const view = Object.create(ExploreView.prototype) as ExploreView;
    Object.assign(view, {
      map, camera: iso, dormitoryPerspectiveActive: true,
      dormitoryPerspectiveCamera: new DormitoryPerspectiveCamera(iso, 16 / 9),
      panBounds: { minX: -map.width, maxX: map.width, minZ: -map.height, maxZ: map.height },
      reducedMotion: true,
    });
    for (let quarter = 0; quarter < 4; quarter++) {
      for (const zoom of [11, 16, 34]) {
        iso.setZoom(zoom, 16 / 9);
        for (const cell of [{ x: 11, y: 4 }, { x: 11, y: 43 }, { x: 38, y: 57 }]) {
          view.centerOn(cell);
          const world = cellToWorld(map, cell);
          const projected = new THREE.Vector3(world.x, 1.15, world.z).project(view.renderCamera);
          expect(projected.x).toBeCloseTo(0, 8);
          expect(projected.y).toBeCloseTo(0, 8);
        }
      }
      iso.rotate(1);
      iso.tick(10);
    }
  });

  it('survole et clique la case ou l’objet affiché dans les deux projections, après rotation et zoom', () => {
    const map = new ExploreMap(HOLT_MAP);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(map.width, map.height));
    floor.rotation.x = -Math.PI / 2;
    floor.updateMatrixWorld(true);
    const outline = new THREE.Mesh();
    const onHover = vi.fn();
    const onMoveTo = vi.fn();
    const onInteract = vi.fn();
    const iso = new IsoCamera(16 / 9, { min: 10, max: 96 }, 16);
    const center = cellToWorld(map, { x: 38, y: 8 });
    iso.setTarget(center.x, center.z);
    const perspective = new DormitoryPerspectiveCamera(iso, 16 / 9);
    const object = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    const objectCell = { x: 34, y: 3 };
    const objectWorld = cellToWorld(map, objectCell);
    object.position.set(objectWorld.x, 0.5, objectWorld.z);
    object.userData.entityId = 'casier';
    object.updateMatrixWorld(true);

    // Exercise the real picking/hover/click methods without building decor, loading actors
    // or creating a DOM. Ray intersections and the two camera controllers remain real.
    const view = Object.create(ExploreView.prototype) as ExploreView;
    Object.assign(view, {
      camera: iso,
      dormitoryPerspectiveCamera: perspective,
      dormitoryPerspectiveActive: false,
      map,
      raycaster: new THREE.Raycaster(),
      floorPlane: floor,
      hoverOutline: outline,
      hovered: null,
      pickables: [object],
      rigs: new Map(),
      entityCellIndex: new Map(),
      entityAnchors: new Map(),
      visibleEntityIds: new Set(['casier']),
      callbacks: { onHover, onMoveTo, onInteract },
    });
    try {
      for (const active of [false, true]) {
        Object.assign(view, { dormitoryPerspectiveActive: active });
        for (let quarter = 0; quarter < 4; quarter++) {
          for (const zoom of [16, 34]) {
            iso.setZoom(zoom, 16 / 9);
            const camera = view.renderCamera;
            for (const cell of [
              { x: 32, y: 7 },
              { x: 41, y: 10 },
              { x: 38, y: 8 },
            ]) {
              const world = cellToWorld(map, cell);
              const cursor = new THREE.Vector3(world.x, 0, world.z).project(camera);
              onHover.mockClear();
              onMoveTo.mockClear();
              view.handlePointerMove(cursor.x, cursor.y);
              view.handleClick(cursor.x, cursor.y);
              expect(onHover).toHaveBeenLastCalledWith({ type: 'floor', cell });
              expect(outline.position.x).toBeCloseTo(world.x);
              expect(outline.position.z).toBeCloseTo(world.z);
              expect(onMoveTo).toHaveBeenLastCalledWith(cell);
            }
            const cursor = object.position.clone().project(camera);
            onInteract.mockClear();
            view.handlePointerMove(cursor.x, cursor.y);
            view.handleClick(cursor.x, cursor.y);
            expect(onHover).toHaveBeenLastCalledWith({ type: 'entity', id: 'casier' });
            expect(outline.visible).toBe(false);
            expect(onInteract).toHaveBeenLastCalledWith('casier');
          }
          iso.rotate(1);
          iso.tick(10);
        }
      }
    } finally {
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
      outline.geometry.dispose();
      (outline.material as THREE.Material).dispose();
    }
  });

  it('identifie un membre du groupe sans ordre, ignore les enfants cachés et ferme le survol', () => {
    const map = new ExploreMap(HOLT_MAP);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(map.width, map.height));
    floor.rotation.x = -Math.PI / 2;
    floor.updateMatrixWorld(true);
    const outline = new THREE.Mesh();
    const actor = new THREE.Group();
    actor.userData.exploreCharacter = { type: 'character', id: 'leader', name: 'Franklyn' };
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6));
    body.position.y = 0.9;
    const hiddenChild = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    hiddenChild.position.set(3, 0.5, 0);
    hiddenChild.visible = false;
    actor.add(body, hiddenChild);
    const cell = { x: 38, y: 8 };
    const world = cellToWorld(map, cell);
    actor.position.set(world.x, 0, world.z);
    actor.updateMatrixWorld(true);
    const iso = new IsoCamera(16 / 9, { min: 10, max: 96 }, 16);
    iso.setTarget(world.x, world.z);
    const onHover = vi.fn();
    const onMoveTo = vi.fn();
    const onInteract = vi.fn();
    const view = Object.create(ExploreView.prototype) as ExploreView;
    Object.assign(view, {
      camera: iso,
      dormitoryPerspectiveCamera: new DormitoryPerspectiveCamera(iso, 16 / 9),
      dormitoryPerspectiveActive: false,
      map,
      raycaster: new THREE.Raycaster(),
      floorPlane: floor,
      hoverOutline: outline,
      hovered: null,
      pickables: [],
      rigs: new Map([['leader', { object: actor }]]),
      entityCellIndex: new Map(),
      entityAnchors: new Map(),
      visibleEntityIds: new Set(),
      callbacks: { onHover, onMoveTo, onInteract },
    });
    try {
      for (const active of [false, true]) {
        Object.assign(view, { dormitoryPerspectiveActive: active });
        const cursor = new THREE.Vector3(world.x, 0.9, world.z).project(view.renderCamera);
        view.handlePointerMove(cursor.x, cursor.y);
        view.handleClick(cursor.x, cursor.y);
        expect(onHover).toHaveBeenLastCalledWith({ type: 'character', id: 'leader', name: 'Franklyn' });
        expect(outline.visible).toBe(false);
        expect(onMoveTo).not.toHaveBeenCalled();
        expect(onInteract).not.toHaveBeenCalled();

        const hiddenCursor = hiddenChild.getWorldPosition(new THREE.Vector3()).project(view.renderCamera);
        view.handlePointerMove(hiddenCursor.x, hiddenCursor.y);
        expect(onHover.mock.lastCall?.[0]?.type).toBe('floor');
        view.clearHover();
        expect(onHover).toHaveBeenLastCalledWith(null);
        expect(outline.visible).toBe(false);
      }
    } finally {
      for (const mesh of [floor, body, hiddenChild, outline]) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    }
  });
});
