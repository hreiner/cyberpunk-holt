/**
 * Enveloppe architecturale du dortoir jouable, portee depuis le pilote autonome AAA.
 *
 * La coque assume ses deux facades exterieures: le mur nord partage avec l'exterieur et la
 * facade est de HOLT. Le couloir ouest et les seuils sud restent au renderer de carte. Aucune
 * piece ne surplombe les cadets: gaines et luminaires sont fixes aux murs.
 */
import * as THREE from 'three';
import type { Rng } from '@/core/rng';
import type { ExploreMap, WallSide } from '@/explore';
import type { DormitoryMaterials } from './dormitoryMaterials';

type Side = WallSide;

export const DORMITORY_PILOT_WALL_HEIGHT = 4.9;
export const DORMITORY_PILOT_CUT_HEIGHT = 0.4;
export const DORMITORY_PILOT_WINDOW_WIDTH = 1.24;
export const DORMITORY_PILOT_WINDOW_HEIGHT = 1.52;

export interface DormitoryPilotWindow {
  /** Centre du vitrage en coordonnees monde; les spots et rayons doivent partir d'ici. */
  center: THREE.Vector3;
  /** Largeur le long de la facade (axe Z pour la facade est). */
  width: number;
  height: number;
  side: 'east';
}

export interface DormitoryPilotArchitectureState {
  active: boolean;
  discovered: boolean;
  cutSides: ReadonlySet<Side>;
  night: string | null;
}

export interface DormitoryPilotArchitecture {
  readonly group: THREE.Group;
  readonly windows: readonly DormitoryPilotWindow[];
  readonly roomBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  setState(state: DormitoryPilotArchitectureState): void;
  setEnvironment(texture: THREE.Texture | null): void;
  dispose(): void;
}

const WINDOW_BOTTOM = 2.72;
const WALL_TOP = DORMITORY_PILOT_WALL_HEIGHT;
const NORTH = 'north' satisfies Side;
const EAST = 'east' satisfies Side;

/** Builds a room-anchored pilot envelope. Shared surface materials are borrowed, never disposed. */
export function createDormitoryPilotArchitecture(options: {
  map: ExploreMap;
  materials: DormitoryMaterials;
  rng: Rng;
}): DormitoryPilotArchitecture {
  const { map, materials, rng } = options;
  const room = map.def.rooms.find((candidate) => candidate.id === 'dortoirs');
  if (!room) throw new Error('La carte ne declare pas la piece dortoirs.');
  const { origin, width, height } = room.rect;
  const cellWorld = (x: number, y: number) => ({
    x: x - (map.width - 1) / 2,
    z: y - (map.height - 1) / 2,
  });
  const first = cellWorld(origin.x, origin.y);
  const bounds = {
    minX: first.x - 0.5,
    maxX: first.x + width - 0.5,
    minZ: first.z - 0.5,
    maxZ: first.z + height - 0.5,
  };
  const northZ = bounds.minZ;
  const eastX = bounds.maxX;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const group = new THREE.Group();
  group.name = 'dormitory-pilot-architecture';

  const northFull = new THREE.Group();
  northFull.name = 'dormitory-pilot-north-facade';
  const northCut = new THREE.Group();
  northCut.name = 'dormitory-pilot-north-cutaway';
  const eastFull = new THREE.Group();
  eastFull.name = 'dormitory-pilot-east-facade';
  const eastReveals = new THREE.Group();
  eastReveals.name = 'dormitory-pilot-east-window-details';
  const eastUndiscovered = new THREE.Group();
  eastUndiscovered.name = 'dormitory-pilot-east-undiscovered-window-backs';
  eastFull.add(eastReveals, eastUndiscovered);
  const eastCut = new THREE.Group();
  eastCut.name = 'dormitory-pilot-east-cutaway';
  group.add(northFull, northCut, eastFull, eastCut);

  // Geometry belongs to this architecture; materials come from the session depot.
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const ownGeometries = new Set<THREE.BufferGeometry>([unitBox]);
  const ownMaterials = new Set<THREE.Material>();
  const ownInstancedMeshes = new Set<THREE.InstancedMesh>();
  const boxBatches = new Map<
    string,
    {
      parent: THREE.Object3D;
      material: THREE.Material;
      castShadow: boolean;
      transforms: THREE.Matrix4[];
    }
  >();
  const boxPosition = new THREE.Vector3();
  const boxScale = new THREE.Vector3();
  const boxQuaternion = new THREE.Quaternion();
  const boxTransform = new THREE.Matrix4();
  const wall = materials.get('wall');
  const steel = materials.get('steel');
  const edge = materials.get('edgeSteel');
  const dark = materials.get('darkSteel');
  const brass = materials.get('brass');

  const box = (
    parent: THREE.Object3D,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    castShadow = true,
  ) => {
    const key = `${parent.uuid}/${material.uuid}/${castShadow}`;
    let batch = boxBatches.get(key);
    if (!batch) {
      batch = { parent, material, castShadow, transforms: [] };
      boxBatches.set(key, batch);
    }
    boxTransform.compose(boxPosition.set(x, y, z), boxQuaternion, boxScale.set(sx, sy, sz));
    batch.transforms.push(boxTransform.clone());
  };

  const addFacadeWall = (
    parent: THREE.Group,
    x: number,
    z: number,
    sx: number,
    sz: number,
    wallHeight = WALL_TOP,
  ) => {
    box(parent, wall, x, wallHeight / 2, z, sx, wallHeight, sz);
  };

  // Northerly return: 25 m of full-height poured concrete with the pilot's panel rhythm,
  // recessed dark datum stripe and the HOLT room plaque. The east shared corridor wall is
  // intentionally not duplicated here.
  // Reach the canonical west partition plane, half a cell beyond the floor bounds.
  addFacadeWall(northFull, centerX - 0.25, northZ, width + 0.58, 0.34);
  addFacadeWall(northCut, centerX - 0.25, northZ, width + 0.58, 0.34, DORMITORY_PILOT_CUT_HEIGHT);
  box(northFull, dark, centerX, 1.23, northZ + 0.185, width, 0.16, 0.035, false);
  box(northCut, dark, centerX, 0.28, northZ + 0.185, width, 0.075, 0.035, false);
  const boltGeometry = new THREE.SphereGeometry(0.022, 7, 5);
  ownGeometries.add(boltGeometry);
  const boltPositions: THREE.Vector3[] = [];
  for (let x = bounds.minX + 1.5; x < bounds.maxX; x += 1.5) {
    box(northFull, dark, x, 2.45, northZ + 0.18, 0.018, 4.6, 0.018, false);
    for (const y of [0.35, 2.8, 4.4]) {
      boltPositions.push(new THREE.Vector3(x + 0.12, y, northZ + 0.2));
    }
  }
  const bolts = new THREE.InstancedMesh(boltGeometry, dark, boltPositions.length);
  ownInstancedMeshes.add(bolts);
  bolts.castShadow = false;
  bolts.receiveShadow = false;
  boltPositions.forEach((position, index) => {
    boxTransform.compose(position, boxQuaternion, boxScale.setScalar(1));
    bolts.setMatrixAt(index, boxTransform);
  });
  bolts.instanceMatrix.needsUpdate = true;
  northFull.add(bolts);
  box(northFull, dark, centerX, 3.52, northZ + 0.22, 1.35, 1.18, 0.12);
  box(northFull, brass, centerX - 0.23, 3.52, northZ + 0.295, 0.11, 0.83, 0.045);
  box(northFull, brass, centerX + 0.23, 3.52, northZ + 0.295, 0.11, 0.83, 0.045);
  box(northFull, brass, centerX, 3.52, northZ + 0.3, 0.48, 0.11, 0.05);
  const plaqueCanvas = document.createElement('canvas');
  plaqueCanvas.width = 512;
  plaqueCanvas.height = 128;
  const plaqueContext = plaqueCanvas.getContext('2d');
  if (plaqueContext) {
    plaqueContext.fillStyle = '#24343d';
    plaqueContext.fillRect(0, 0, plaqueCanvas.width, plaqueCanvas.height);
    plaqueContext.fillStyle = '#d3d3c4';
    plaqueContext.font = '700 48px Arial';
    plaqueContext.textAlign = 'center';
    plaqueContext.textBaseline = 'middle';
    plaqueContext.fillText('DORTOIR 04', 256, 64);
  }
  const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
  plaqueTexture.colorSpace = THREE.SRGBColorSpace;
  const plaqueMaterial = new THREE.MeshBasicMaterial({ map: plaqueTexture, transparent: true });
  ownMaterials.add(plaqueMaterial);
  const plaqueText = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.263), plaqueMaterial);
  ownGeometries.add(plaqueText.geometry);
  plaqueText.position.set(centerX, 3.52, northZ + 0.326);
  northFull.add(plaqueText);

  // Wall-mounted service run and drops: they keep the reference's industrial scale while
  // remaining against the north wall instead of spanning above the characters.
  const pipeGeometry = new THREE.CylinderGeometry(0.16, 0.16, width - 0.7, 12);
  ownGeometries.add(pipeGeometry);
  const serviceRun = new THREE.Mesh(pipeGeometry, steel);
  serviceRun.rotation.z = Math.PI / 2;
  serviceRun.position.set(centerX, 4.64, northZ + 0.22);
  serviceRun.castShadow = true;
  serviceRun.receiveShadow = true;
  northFull.add(serviceRun);
  const collarGeometry = new THREE.TorusGeometry(0.171, 0.024, 6, 16);
  ownGeometries.add(collarGeometry);
  const collarCount = Math.ceil((width - 1.3) / 0.95);
  const collars = new THREE.InstancedMesh(collarGeometry, edge, collarCount);
  ownInstancedMeshes.add(collars);
  const collarQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  for (let index = 0; index < collarCount; index++) {
    const x = bounds.minX + 0.8 + index * 0.95;
    boxTransform.compose(new THREE.Vector3(x, 4.64, northZ + 0.22), collarQuaternion, boxScale.setScalar(1));
    collars.setMatrixAt(index, boxTransform);
  }
  collars.instanceMatrix.needsUpdate = true;
  collars.castShadow = false;
  collars.receiveShadow = false;
  northFull.add(collars);
  for (const x of [bounds.minX + 1.8, bounds.maxX - 1.8]) {
    for (const [offset, radius] of [
      [0, 0.055],
      [0.18, 0.034],
    ] as const) {
      const dropGeometry = new THREE.CylinderGeometry(radius, radius, 4.25, 8);
      ownGeometries.add(dropGeometry);
      const drop = new THREE.Mesh(dropGeometry, offset === 0 ? steel : edge);
      drop.position.set(x + offset, 2.35, northZ + 0.22);
      drop.castShadow = true;
      northFull.add(drop);
    }
  }

  // The real HOLT east elevation is the long window wall. Five narrow upper bays retain the
  // pilot's tall openings, heavy reveals and daylight while reducing its broad 2.65 m glazing.
  const windowWidth = DORMITORY_PILOT_WINDOW_WIDTH;
  const windowHeight = DORMITORY_PILOT_WINDOW_HEIGHT;
  const windowTop = WINDOW_BOTTOM + windowHeight;
  const windowOffsets = [-5.7, -2.85, 0, 2.85, 5.7] as const;
  const windows: DormitoryPilotWindow[] = [];
  const pane = new THREE.MeshPhysicalMaterial({
    color: 0x9cb5bd,
    transparent: true,
    opacity: 0.23,
    roughness: 0.19,
    metalness: 0.24,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  });
  pane.envMap = materials.get('steel').envMap;
  pane.envMapIntensity = 0.5;
  ownMaterials.add(pane);
  const paneGeometry = new THREE.PlaneGeometry(windowWidth - 0.08, windowHeight - 0.08);
  ownGeometries.add(paneGeometry);
  const glassMeshes: THREE.Matrix4[] = [];
  const undiscoveredMeshes: THREE.Matrix4[] = [];
  const glassQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  const eastWallThickness = 0.34;
  const eastInteriorFaceX = eastX - eastWallThickness / 2;
  const eastOuterX = eastX + eastWallThickness / 2;
  for (let i = 0; i < windowOffsets.length; i++) {
    const center = centerZ + windowOffsets[i]!;
    if (center < bounds.minZ + 0.65 || center > bounds.maxZ - 0.65) continue;
    windows.push({
      center: new THREE.Vector3(eastOuterX, WINDOW_BOTTOM + windowHeight / 2, center),
      width: windowWidth,
      height: windowHeight,
      side: 'east',
    });

    // Build the opening as wall masses, not a pane pasted over a full opaque box.
    box(
      eastFull,
      wall,
      eastX,
      WINDOW_BOTTOM / 2,
      center,
      eastWallThickness,
      WINDOW_BOTTOM,
      windowWidth + 0.09,
    );
    box(
      eastFull,
      wall,
      eastX,
      (windowTop + WALL_TOP) / 2,
      center,
      eastWallThickness,
      WALL_TOP - windowTop,
      windowWidth + 0.09,
    );
    box(eastFull, dark, eastInteriorFaceX - 0.025, 1.22, center, 0.045, 0.16, 0.94, false);
    // Deep concrete reveal, sill and lintel, plus a restrained steel mullion.
    box(
      eastReveals,
      edge,
      eastInteriorFaceX - 0.1,
      WINDOW_BOTTOM + windowHeight / 2,
      center - windowWidth / 2,
      0.22,
      windowHeight + 0.2,
      0.075,
    );
    box(
      eastReveals,
      edge,
      eastInteriorFaceX - 0.1,
      WINDOW_BOTTOM + windowHeight / 2,
      center + windowWidth / 2,
      0.22,
      windowHeight + 0.2,
      0.075,
    );
    box(
      eastReveals,
      wall,
      eastInteriorFaceX - 0.1,
      WINDOW_BOTTOM - 0.07,
      center,
      0.3,
      0.14,
      windowWidth + 0.16,
    );
    box(eastReveals, wall, eastInteriorFaceX - 0.1, windowTop + 0.06, center, 0.3, 0.12, windowWidth + 0.16);
    box(
      eastReveals,
      edge,
      eastInteriorFaceX - 0.14,
      WINDOW_BOTTOM - 0.14,
      center,
      0.42,
      0.12,
      windowWidth + 0.3,
    );
    box(
      eastReveals,
      dark,
      eastInteriorFaceX - 0.02,
      WINDOW_BOTTOM + windowHeight / 2,
      center,
      0.035,
      windowHeight,
      0.035,
      false,
    );
    boxTransform.compose(
      new THREE.Vector3(eastX + 0.01, WINDOW_BOTTOM + windowHeight / 2, center),
      glassQuaternion,
      boxScale.setScalar(1),
    );
    glassMeshes.push(boxTransform.clone());
    boxTransform.compose(
      new THREE.Vector3(eastX - eastWallThickness / 2 - 0.012, WINDOW_BOTTOM + windowHeight / 2, center),
      glassQuaternion,
      boxScale.setScalar(1),
    );
    undiscoveredMeshes.push(boxTransform.clone());
  }
  const glazing = new THREE.InstancedMesh(paneGeometry, pane, glassMeshes.length);
  ownInstancedMeshes.add(glazing);
  glassMeshes.forEach((matrix, index) => glazing.setMatrixAt(index, matrix));
  glazing.instanceMatrix.needsUpdate = true;
  glazing.castShadow = false;
  glazing.receiveShadow = false;
  eastReveals.add(glazing);
  const darkWindowMaterial = new THREE.MeshBasicMaterial({
    color: 0x111a20,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  ownMaterials.add(darkWindowMaterial);
  const darkWindowGeometry = new THREE.PlaneGeometry(windowWidth - 0.08, windowHeight - 0.08);
  ownGeometries.add(darkWindowGeometry);
  const darkWindows = new THREE.InstancedMesh(
    darkWindowGeometry,
    darkWindowMaterial,
    undiscoveredMeshes.length,
  );
  ownInstancedMeshes.add(darkWindows);
  undiscoveredMeshes.forEach((matrix, index) => darkWindows.setMatrixAt(index, matrix));
  darkWindows.instanceMatrix.needsUpdate = true;
  darkWindows.castShadow = false;
  darkWindows.receiveShadow = false;
  eastUndiscovered.add(darkWindows);

  // Fill masonry between the discrete apertures. One longitudinal wall is kept in a small
  // set of continuous spans for low draw-call cost and clean corner joints.
  const sortedCenters = windows.map((item) => item.center.z).sort((a, b) => a - b);
  const spanRanges: [number, number][] = [];
  let cursor = bounds.minZ;
  for (const center of sortedCenters) {
    const halfOpening = windowWidth / 2 + 0.09 / 2;
    const left = center - halfOpening;
    if (left > cursor + 0.01) spanRanges.push([cursor, left]);
    cursor = center + halfOpening;
  }
  if (cursor < bounds.maxZ + 0.5) spanRanges.push([cursor, bounds.maxZ + 0.5]);
  for (const [a, b] of spanRanges) {
    const length = b - a;
    const z = (a + b) / 2;
    box(eastFull, wall, eastX, WALL_TOP / 2, z, eastWallThickness, WALL_TOP, length);
    box(eastFull, dark, eastInteriorFaceX - 0.025, 1.22, z, 0.045, 0.16, length, false);
  }

  // The alternate cutaway is a continuous low parapet. It belongs to the same side as the
  // facade and cannot create a second roofline or hide the room's contents.
  box(
    eastCut,
    wall,
    eastX,
    DORMITORY_PILOT_CUT_HEIGHT / 2,
    centerZ + 0.25,
    eastWallThickness,
    DORMITORY_PILOT_CUT_HEIGHT,
    height + 0.5,
    false,
  );
  box(eastCut, dark, eastInteriorFaceX - 0.025, 0.28, centerZ + 0.25, 0.045, 0.075, height + 0.5, false);

  // Outdoor depth behind the glazing follows the autonomous pilot: warm gradient, layered
  // Badlands silhouettes and a far horizon. Geometry and colors are switched for the night run.
  const landscapeCanvas = document.createElement('canvas');
  landscapeCanvas.width = 1024;
  landscapeCanvas.height = 512;
  const ctx = landscapeCanvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#9eafb4');
    gradient.addColorStop(0.45, '#f1c99b');
    gradient.addColorStop(1, '#b5855f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    for (let layer = 0; layer < 4; layer++) {
      ctx.beginPath();
      ctx.moveTo(0, 360 + layer * 26);
      for (let x = 0; x <= 1024; x += 32) {
        const ridge = 255 + layer * 28 + rng.fork(`ridge-${layer}-${x}`).next() * 120;
        ctx.lineTo(x, ridge);
      }
      ctx.lineTo(1024, 512);
      ctx.lineTo(0, 512);
      ctx.closePath();
      ctx.fillStyle = ['#a89176', '#b39779', '#8c806f', '#716f68'][layer]!;
      ctx.globalAlpha = 0.34 + layer * 0.12;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const landscapeTexture = new THREE.CanvasTexture(landscapeCanvas);
  landscapeTexture.colorSpace = THREE.SRGBColorSpace;
  landscapeTexture.wrapS = THREE.ClampToEdgeWrapping;
  landscapeTexture.wrapT = THREE.ClampToEdgeWrapping;
  landscapeTexture.anisotropy = 4;
  const landscapeMaterial = new THREE.MeshBasicMaterial({
    map: landscapeTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  ownMaterials.add(landscapeMaterial);
  // The integrated room has an open surrounding map. Bound the borrowed outdoor view to
  // each aperture so the pilot's large background cannot protrude above the cutaway walls.
  for (const window of windows) {
    const geometry = new THREE.PlaneGeometry(window.width - 0.08, window.height - 0.08);
    const uv = geometry.getAttribute('uv');
    for (let index = 0; index < uv.count; index++) {
      const alongFacade = window.center.z - (uv.getX(index) - 0.5) * window.width;
      uv.setX(index, (alongFacade - bounds.minZ) / height);
    }
    ownGeometries.add(geometry);
    const landscape = new THREE.Mesh(geometry, landscapeMaterial);
    landscape.rotation.y = Math.PI / 2;
    landscape.position.set(eastOuterX + 0.025, window.center.y, window.center.z);
    landscape.castShadow = false;
    landscape.receiveShadow = false;
    eastReveals.add(landscape);
  }

  // East facade's exterior frame and upper panel joints recall the accepted pilot construction.
  for (let i = 0; i <= 5; i++) {
    const z = bounds.minZ + i * 3;
    box(eastFull, dark, eastInteriorFaceX - 0.035, 2.45, z, 0.04, 4.7, 0.025, false);
  }
  box(eastFull, dark, eastInteriorFaceX - 0.04, 1.23, centerZ, 0.055, 0.16, height, false);
  // Twin conduits stay on the room-facing side of the window elevation, as in the pilot.
  for (const y of [4.47, 4.64]) {
    const geometry = new THREE.CylinderGeometry(0.045, 0.045, height - 0.7, 12);
    ownGeometries.add(geometry);
    const pipe = new THREE.Mesh(geometry, steel);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(eastInteriorFaceX - 0.08, y, centerZ);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    eastFull.add(pipe);
  }

  // Static trim and reveals are submitted as a handful of instanced material groups.
  for (const batch of boxBatches.values()) {
    const instances = new THREE.InstancedMesh(unitBox, batch.material, batch.transforms.length);
    ownInstancedMeshes.add(instances);
    for (let index = 0; index < batch.transforms.length; index++) {
      instances.setMatrixAt(index, batch.transforms[index]!);
    }
    instances.instanceMatrix.needsUpdate = true;
    instances.castShadow = batch.castShadow;
    instances.receiveShadow = true;
    batch.parent.add(instances);
  }

  let disposed = false;
  const state: DormitoryPilotArchitectureState = {
    active: true,
    discovered: false,
    cutSides: new Set<Side>(),
    night: null,
  };
  const applyState = () => {
    if (disposed) return;
    const shown = state.active && state.discovered;
    group.visible = state.active;
    const northIsCut = state.cutSides.has(NORTH);
    const eastIsCut = state.cutSides.has(EAST);
    northFull.visible = state.active && !northIsCut;
    northCut.visible = state.active && northIsCut;
    eastFull.visible = state.active && !eastIsCut;
    eastCut.visible = state.active && eastIsCut;
    eastReveals.visible = shown && !eastIsCut;
    eastUndiscovered.visible = state.active && !state.discovered && !eastIsCut;
    landscapeMaterial.color.set(state.night ? 0x71819b : 0xffffff);
  };

  return {
    group,
    windows,
    roomBounds: bounds,
    setEnvironment(texture) {
      if (disposed) return;
      pane.envMap = texture;
      pane.needsUpdate = true;
    },
    setState(next) {
      state.active = next.active;
      state.discovered = next.discovered;
      state.cutSides = next.cutSides;
      state.night = next.night;
      applyState();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const mesh of ownInstancedMeshes) mesh.dispose();
      for (const geometry of ownGeometries) geometry.dispose();
      for (const material of ownMaterials) {
        if (material instanceof THREE.MeshBasicMaterial && material.map === landscapeTexture) {
          landscapeTexture.dispose();
        }
        if (material instanceof THREE.MeshBasicMaterial && material.map === plaqueTexture) {
          plaqueTexture.dispose();
        }
        material.dispose();
      }
      group.clear();
    },
  };
}
