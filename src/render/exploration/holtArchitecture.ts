/** Shared wall and HOLT doorway renderer; all geometry here is owned by this instance. */
import * as THREE from 'three';
import type { ExploreMap } from '@/explore';
import type { DormitoryMaterials } from './dormitoryMaterials';
import type { EnvironmentMaterials } from './materials';
import {
  buildHoltArchitectureLayout,
  type HoltArchitectureLayout,
  type HoltArchitectureProfile,
  type HoltWallCell,
  type HoltWallSide,
  type HoltArchitectureWindow,
} from './holtArchitectureLayout';
import { HOLT_ARCHITECTURE_PROFILES, HOLT_DORMITORY_ARCHITECTURE } from './holtRoomProfiles';
import { holtDoorFinish } from './holtDoorFinishes';
import { buildHoltWallGeometry, type ExplorationWallHeights, type HoltWallShape } from './holtWallGeometry';
import { holtWallFinish } from './holtWallFinishes';
import { createWallSpanResolver } from './holtWallSpans';

export const HOLT_ARCHITECTURE_WALL_HEIGHT = 4.9;
const WALL_DEPTH = 0.34;
const WALL_CROWN_HEIGHT = 0.07;
const WALL_CROWN_OVERHANG = 0.025;
const WINDOW_ENVIRONMENT_INTENSITY = 0.12;
const DOOR_WIDTH = 0.88;
const DOOR_HEIGHT = 2.32;
const DOOR_DEPTH = 0.09;

export interface HoltArchitectureState {
  active: boolean;
  discoveredRoomIds: ReadonlySet<string>;
  night?: boolean;
  activeDoorIds?: ReadonlySet<string>;
  isDoorOpen?: (doorId: string) => boolean;
}

export interface HoltArchitecture {
  readonly group: THREE.Group;
  readonly layout: HoltArchitectureLayout;
  readonly geometry: ReadonlyMap<string, HoltWallShape>;
  /** Only actual interactive door entities are pickable. */
  readonly pickables: readonly THREE.Object3D[];
  setState(state: HoltArchitectureState): void;
  /** Updates the owned reflective glazing; the PMREM itself remains borrowed. */
  setEnvironment(texture: THREE.Texture | null): void;
  dispose(): void;
}

interface SideGroups {
  windows: Array<{
    roomId: string;
    viewRoomId?: string;
    alwaysVisible?: boolean;
    closed: THREE.Object3D;
    revealed: THREE.Object3D;
  }>;
  root: THREE.Group;
  full: THREE.Group;
  doorLeaves: Array<{
    id?: string;
    root: THREE.Group;
    fullLeaf: THREE.Group;
    initialOpen: boolean;
    lastOpen?: boolean;
  }>;
}

const sideKey = (roomId: string, side: HoltWallSide, segmentId: string) => `${roomId}:${side}:${segmentId}`;

function coalescePhysicalWalls(
  cells: readonly HoltWallCell[],
  geometry: ReadonlyMap<string, HoltWallShape>,
): HoltWallCell[] {
  const groups = new Map<string, HoltWallCell[]>();
  for (const cell of cells) {
    const center = geometry.get(cell.id)?.center ?? { x: cell.x, y: cell.y };
    const key = `${cell.axis}:${center.x},${center.y}`;
    const group = groups.get(key) ?? [];
    group.push(cell);
    groups.set(key, group);
  }
  return [...groups.values()].map((members) => {
    const primary = members[0]!;
    return {
      ...primary,
      faces: [
        ...new Map(
          members
            .flatMap((member) => member.faces)
            .map((face) => [`${face.roomId}:${face.side}:${face.segmentId}`, face] as const),
        ).values(),
      ],
    };
  });
}

function sideYaw(axis: HoltWallCell['axis']): number {
  return axis === 'vertical' ? Math.PI / 2 : 0;
}

function cellWorld(map: ExploreMap, x: number, y: number): THREE.Vector3 {
  return new THREE.Vector3(x - (map.width - 1) / 2, 0, y - (map.height - 1) / 2);
}

function boundaryWorld(map: ExploreMap, cell: HoltWallCell, side: HoltWallSide): THREE.Vector3 {
  const position = cellWorld(map, cell.x, cell.y);
  if (side === 'west') position.x += 0.5;
  else if (side === 'east') position.x -= 0.5;
  else if (side === 'north') position.z += 0.5;
  else position.z -= 0.5;
  return position;
}

function architectureWallWorld(
  map: ExploreMap,
  cell: HoltWallCell,
  face: HoltWallCell['faces'][number],
  geometry: ReadonlyMap<string, HoltWallShape>,
): THREE.Vector3 {
  const shape = geometry.get(cell.id);
  return shape
    ? cellWorld(map, shape.center.x, shape.center.y)
    : face.sharedWall
      ? cellWorld(map, cell.x, cell.y)
      : boundaryWorld(map, cell, face.side);
}

function addInstances(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  placements: readonly { position: THREE.Vector3; scale: THREE.Vector3; yaw?: number }[],
  own: Set<THREE.InstancedMesh>,
): void {
  if (!placements.length) return;
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  mesh.name = 'holt-architecture-panels';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  placements.forEach((item, index) => {
    rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.yaw ?? 0);
    matrix.compose(item.position, rotation, item.scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  own.add(mesh);
}

function setRaycastEnabled(root: THREE.Object3D, enabled: boolean): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (enabled) object.layers.enable(0);
    else object.layers.disableAll();
  });
}

/** Build an architecture profile from map data. Shared depot materials are borrowed. */
export function createHoltArchitecture(options: {
  map: ExploreMap;
  dormitoryMaterials: DormitoryMaterials;
  environmentMaterials: EnvironmentMaterials;
  profile?: HoltArchitectureProfile;
  profileId?: string;
  /** Several staged room profiles can share one physical envelope and one doorway set. */
  profiles?: readonly HoltArchitectureProfile[];
  wallHeights?: ExplorationWallHeights;
  wallTint?: number;
  wallPaintTint?: number;
  /** Specialized closures (fan blades) are rendered by the entity dressing. */
  entityDoorLeaves?: ReadonlySet<string>;
}): HoltArchitecture {
  const { map, dormitoryMaterials, environmentMaterials } = options;
  const profiles = options.profiles ?? [
    options.profile ?? HOLT_ARCHITECTURE_PROFILES[options.profileId ?? ''] ?? HOLT_DORMITORY_ARCHITECTURE,
  ];
  const layout = buildHoltArchitectureLayout(map.def, profiles);
  const geometry = buildHoltWallGeometry(layout, options.wallHeights);
  const wallHeightAt = (cell: HoltWallCell) =>
    geometry.get(cell.id)?.height ?? options.wallHeights?.interior ?? HOLT_ARCHITECTURE_WALL_HEIGHT;
  const doorHeaderHeightAt = (cell: HoltWallCell) =>
    Math.min(0.09, Math.max(0.015, wallHeightAt(cell) - DOOR_HEIGHT - 0.025));
  const resolveSpan = createWallSpanResolver(layout, geometry);
  const group = new THREE.Group();
  group.name = `holt-architecture-${layout.profileId}`;
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const ownGeometries = new Set<THREE.BufferGeometry>([unitBox]);
  const ownInstancedMeshes = new Set<THREE.InstancedMesh>();
  const ownWindowMaterials = new Set<THREE.Material>();
  const ownWindowGeometries = new Set<THREE.BufferGeometry>();
  const ownWindowTextures = new Set<THREE.Texture>();
  const sideGroups = new Map<string, SideGroups>();
  const pickables: THREE.Object3D[] = [];
  const wallMaterial =
    options.wallTint === undefined ? dormitoryMaterials.get('wall') : dormitoryMaterials.get('wall').clone();
  if (options.wallTint !== undefined) {
    wallMaterial.color.setHex(options.wallTint);
    ownWindowMaterials.add(wallMaterial);
  }
  const darkSteel = dormitoryMaterials.get('darkSteel');
  const petrolPaint =
    options.wallPaintTint === undefined
      ? environmentMaterials.get('petrolPaint')
      : environmentMaterials.get('petrolPaint').clone();
  if (options.wallPaintTint !== undefined) {
    petrolPaint.color.setHex(options.wallPaintTint);
    ownWindowMaterials.add(petrolPaint);
  }
  const edgeMetal = environmentMaterials.get('darkMetal');
  const frameMaterial = dormitoryMaterials.get('edgeSteel');
  // The shared wall crown is a concrete edge, not a second bright steel rail. Cloning
  // the wall finish keeps the profile's tint and texture while avoiding the hard blue
  // highlight that made every room read as if it had a luminous metal cap.
  const crownMaterial = wallMaterial.clone();
  crownMaterial.color.multiplyScalar(0.9);
  crownMaterial.roughness = 0.86;
  crownMaterial.metalness = 0.04;
  ownWindowMaterials.add(crownMaterial);
  const paneMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9cb5bd,
    transparent: true,
    opacity: 0.22,
    roughness: 0.2,
    metalness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
    side: THREE.DoubleSide,
    envMapIntensity: WINDOW_ENVIRONMENT_INTENSITY,
  });
  ownWindowMaterials.add(paneMaterial);
  let landscapeMaterial: THREE.MeshBasicMaterial | undefined;
  let landscapeTexture: THREE.CanvasTexture | undefined;
  ownWindowMaterials.add(new THREE.MeshBasicMaterial({ color: 0x253941, side: THREE.DoubleSide }));
  const closedWindowMaterial = [...ownWindowMaterials].at(-1)!;
  const fullWall = coalescePhysicalWalls(
    layout.cells.filter((cell) => cell.kind === 'wall'),
    geometry,
  );
  const openings = layout.cells.filter((cell) => cell.kind === 'opening');
  const windowGeometries = ownWindowGeometries;
  const getLandscapeMaterial = (): THREE.MeshBasicMaterial => {
    if (landscapeMaterial) return landscapeMaterial;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#9eafb4');
      gradient.addColorStop(0.45, '#f1c99b');
      gradient.addColorStop(1, '#b5855f');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1024, 512);
      for (let layer = 0; layer < 4; layer++) {
        context.beginPath();
        context.moveTo(0, 325 + layer * 34);
        for (let x = 0; x <= 1024; x += 32) {
          const ridge = 242 + layer * 35 + (Math.sin(x * 0.031 + layer * 1.7) * 0.5 + 0.5) * 86;
          context.lineTo(x, ridge);
        }
        context.lineTo(1024, 512);
        context.lineTo(0, 512);
        context.closePath();
        context.fillStyle = ['#a89176', '#b39779', '#8c806f', '#716f68'][layer]!;
        context.globalAlpha = 0.34 + layer * 0.12;
        context.fill();
      }
      context.globalAlpha = 1;
    }
    landscapeTexture = new THREE.CanvasTexture(canvas);
    ownWindowTextures.add(landscapeTexture);
    landscapeTexture.colorSpace = THREE.SRGBColorSpace;
    landscapeTexture.wrapS = THREE.ClampToEdgeWrapping;
    landscapeTexture.wrapT = THREE.ClampToEdgeWrapping;
    landscapeTexture.anisotropy = 4;
    landscapeMaterial = new THREE.MeshBasicMaterial({
      map: landscapeTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    ownWindowMaterials.add(landscapeMaterial);
    return landscapeMaterial;
  };

  const ensureSide = (roomId: string, side: HoltWallSide, segmentId: string): SideGroups => {
    const key = sideKey(roomId, side, segmentId);
    const current = sideGroups.get(key);
    if (current) return current;
    const parent = new THREE.Group();
    parent.name = `holt-wall-${key}`;
    const full = new THREE.Group();
    full.name = `${key}-full-height`;
    parent.add(full);
    group.add(parent);
    const created: SideGroups = {
      windows: [],
      root: parent,
      full,
      doorLeaves: [],
    };
    sideGroups.set(key, created);
    return created;
  };

  const addWindow = (
    sides: SideGroups,
    cell: HoltWallCell,
    face: HoltWallCell['faces'][number],
    window: HoltArchitectureWindow,
  ) => {
    const at = architectureWallWorld(map, cell, face, geometry);
    const revealed = new THREE.Group();
    revealed.name = `${window.id}-revealed`;
    const closed = new THREE.Group();
    closed.name = `${window.id}-undiscovered`;
    const vertical = cell.axis === 'vertical';
    const normal = vertical
      ? new THREE.Vector3(face.side === 'east' ? -1 : 1, 0, 0)
      : new THREE.Vector3(0, 0, face.side === 'south' ? -1 : 1);
    const yaw = vertical ? Math.PI / 2 : 0;
    const inner = at.clone().addScaledVector(normal, 0.185);
    const outer = at.clone().addScaledVector(normal, -0.23);
    const paneGeometry = new THREE.PlaneGeometry(window.width - 0.075, window.height - 0.075);
    windowGeometries.add(paneGeometry);
    const pane = new THREE.Mesh(paneGeometry, paneMaterial);
    pane.rotation.y = yaw;
    pane.position.set(inner.x, window.sillHeight + window.height / 2, inner.z);
    pane.renderOrder = 2;
    revealed.add(pane);
    if (window.exterior === 'badlands') {
      const landscape = new THREE.Mesh(paneGeometry, getLandscapeMaterial());
      landscape.rotation.y = yaw;
      landscape.position.set(outer.x, window.sillHeight + window.height / 2, outer.z);
      landscape.renderOrder = 1;
      revealed.add(landscape);
    }

    const part = (
      parent: THREE.Group,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
    ) => {
      const mesh = new THREE.Mesh(unitBox, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
    };
    const frame = at.clone().addScaledVector(normal, 0.19);
    const halfWidth = window.width / 2;
    const centerY = window.sillHeight + window.height / 2;
    const frameDepth = 0.12;
    const frameBar = 0.065;
    if (vertical) {
      part(
        revealed,
        frameMaterial,
        frame.x,
        centerY,
        frame.z - halfWidth,
        frameDepth,
        window.height + 0.14,
        frameBar,
      );
      part(
        revealed,
        frameMaterial,
        frame.x,
        centerY,
        frame.z + halfWidth,
        frameDepth,
        window.height + 0.14,
        frameBar,
      );
      part(
        revealed,
        frameMaterial,
        frame.x,
        window.sillHeight - 0.035,
        frame.z,
        frameDepth,
        0.07,
        window.width + 0.14,
      );
      part(
        revealed,
        frameMaterial,
        frame.x,
        window.sillHeight + window.height + 0.035,
        frame.z,
        frameDepth,
        0.07,
        window.width + 0.14,
      );
      part(
        revealed,
        wallMaterial,
        frame.x - normal.x * 0.1,
        window.sillHeight - 0.08,
        frame.z,
        0.36,
        0.12,
        window.width + 0.23,
      );
    } else {
      part(
        revealed,
        frameMaterial,
        frame.x - halfWidth,
        centerY,
        frame.z,
        frameBar,
        window.height + 0.14,
        frameDepth,
      );
      part(
        revealed,
        frameMaterial,
        frame.x + halfWidth,
        centerY,
        frame.z,
        frameBar,
        window.height + 0.14,
        frameDepth,
      );
      part(
        revealed,
        frameMaterial,
        frame.x,
        window.sillHeight - 0.035,
        frame.z,
        window.width + 0.14,
        0.07,
        frameDepth,
      );
      part(
        revealed,
        frameMaterial,
        frame.x,
        window.sillHeight + window.height + 0.035,
        frame.z,
        window.width + 0.14,
        0.07,
        frameDepth,
      );
      part(
        revealed,
        wallMaterial,
        frame.x,
        window.sillHeight - 0.08,
        frame.z - normal.z * 0.1,
        window.width + 0.23,
        0.12,
        0.36,
      );
    }
    const coverGeometry = new THREE.PlaneGeometry(window.width - 0.01, window.height - 0.01);
    windowGeometries.add(coverGeometry);
    const cover = new THREE.Mesh(coverGeometry, closedWindowMaterial);
    cover.rotation.y = yaw;
    cover.position.set(inner.x, centerY, inner.z);
    closed.add(cover);
    sides.full.add(revealed, closed);
    sides.windows.push({
      roomId: window.roomId,
      viewRoomId: window.viewRoomId,
      alwaysVisible: window.alwaysVisible,
      closed,
      revealed,
    });
  };

  // A physical wall cell is emitted once and attached to its first declared room face.
  // This gives later shared-wall profiles a stable ownership point without duplicate slabs.
  const cellsBySide = new Map<string, HoltWallCell[]>();
  for (const cell of fullWall) {
    const face = cell.faces[0];
    if (!face) continue;
    const key = sideKey(face.roomId, face.side, face.segmentId);
    const list = cellsBySide.get(key) ?? [];
    list.push(cell);
    cellsBySide.set(key, list);
  }
  for (const cells of cellsBySide.values()) {
    const face = cells[0]?.faces[0];
    if (!face) continue;
    const sides = ensureSide(face.roomId, face.side, face.segmentId);
    const wallFull: Array<{ position: THREE.Vector3; scale: THREE.Vector3; yaw?: number }> = [];
    const facePaint = new Map<
      THREE.Material,
      {
        full: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }>;
      }
    >();
    const capFull: Array<{ position: THREE.Vector3; scale: THREE.Vector3; yaw?: number }> = [];
    for (const cell of cells) {
      const at = architectureWallWorld(map, cell, face, geometry);
      const span = resolveSpan(cell, 1.02, WALL_DEPTH);
      const spanAt = at.clone();
      if (cell.axis === 'vertical') spanAt.z += span.center.y - cell.y;
      else spanAt.x += span.center.x - cell.x;
      const wallHeight = geometry.get(cell.id)?.height ?? HOLT_ARCHITECTURE_WALL_HEIGHT;
      const window = layout.windows.find(
        (candidate) =>
          candidate.cell.x === cell.x &&
          candidate.cell.y === cell.y &&
          cell.faces.some(
            (cellFace) => cellFace.roomId === candidate.roomId && cellFace.side === candidate.side,
          ),
      );
      if (window) {
        const side = cell.axis === 'vertical' ? 'z' : 'x';
        const sideSpan = Math.max(0.01, (1.02 - window.width) / 2);
        const spanMin = spanAt[cell.axis === 'vertical' ? 'z' : 'x'] - span.length / 2;
        const spanMax = spanAt[cell.axis === 'vertical' ? 'z' : 'x'] + span.length / 2;
        const apertureCenter = cell.axis === 'vertical' ? at.z : at.x;
        const apertureMin = Math.max(apertureCenter - window.width / 2, spanMin);
        const apertureMax = Math.min(apertureCenter + window.width / 2, spanMax);
        const apertureLength = Math.max(0.001, apertureMax - apertureMin);
        const apertureAt = at.clone();
        apertureAt[cell.axis === 'vertical' ? 'z' : 'x'] = (apertureMin + apertureMax) / 2;
        for (const sign of [-1, 1]) {
          const position = at.clone();
          const partCenter =
            (cell.axis === 'vertical' ? at.z : at.x) + sign * (window.width / 2 + sideSpan / 2);
          const partMin = Math.max(partCenter - sideSpan / 2, spanMin);
          const partMax = Math.min(partCenter + sideSpan / 2, spanMax);
          const partLength = Math.max(0.001, partMax - partMin);
          position[side] += (partMin + partMax) / 2 - partCenter;
          wallFull.push({
            position: position.setY(wallHeight / 2),
            scale:
              cell.axis === 'vertical'
                ? new THREE.Vector3(WALL_DEPTH, wallHeight, partLength)
                : new THREE.Vector3(partLength, wallHeight, WALL_DEPTH),
          });
        }
        const lowerHeight = window.sillHeight;
        const upperHeight = Math.max(0, wallHeight - (window.sillHeight + window.height));
        wallFull.push({
          position: apertureAt.clone().setY(lowerHeight / 2),
          scale:
            cell.axis === 'vertical'
              ? new THREE.Vector3(WALL_DEPTH, lowerHeight, apertureLength)
              : new THREE.Vector3(apertureLength, lowerHeight, WALL_DEPTH),
        });
        if (upperHeight > 0)
          wallFull.push({
            position: apertureAt.clone().setY(wallHeight - upperHeight / 2),
            scale:
              cell.axis === 'vertical'
                ? new THREE.Vector3(WALL_DEPTH, upperHeight, apertureLength)
                : new THREE.Vector3(apertureLength, upperHeight, WALL_DEPTH),
          });
        for (const cellFace of cell.faces) {
          const configured = layout.windows.find(
            (candidate) =>
              candidate.roomId === cellFace.roomId &&
              candidate.cell.x === cell.x &&
              candidate.cell.y === cell.y &&
              candidate.side === cellFace.side,
          );
          if (configured) addWindow(sides, cell, cellFace, configured);
        }
      } else {
        wallFull.push({
          position: spanAt.clone().setY(wallHeight / 2),
          scale: new THREE.Vector3(
            cell.axis === 'vertical' ? WALL_DEPTH : span.length,
            wallHeight,
            cell.axis === 'vertical' ? span.length : WALL_DEPTH,
          ),
        });
      }
      for (const faceDef of cell.faces) {
        const lower = holtWallFinish(faceDef.roomId).lower;
        const material = lower === 'petrolPaint' ? petrolPaint : dormitoryMaterials.get(lower);
        const paint = facePaint.get(material) ?? { full: [] };
        facePaint.set(material, paint);
        // Offset toward the room-facing side of its boundary plane.
        const sideSign = faceDef.side === 'west' || faceDef.side === 'north' ? 1 : -1;
        const outward = (cell.axis === 'vertical' ? 'x' : 'z') as 'x' | 'z';
        const paintSpan = resolveSpan(cell, 0.96, WALL_DEPTH);
        const paintAt = at.clone();
        if (cell.axis === 'vertical') paintAt.z += paintSpan.center.y - cell.y;
        else paintAt.x += paintSpan.center.x - cell.x;
        paintAt[outward] += sideSign * (WALL_DEPTH / 2 + 0.008);
        paint.full.push({
          position: paintAt.clone().setY(0.69),
          scale: new THREE.Vector3(
            cell.axis === 'vertical' ? 0.018 : paintSpan.length,
            1.34,
            cell.axis === 'vertical' ? paintSpan.length : 0.018,
          ),
        });
      }
      const capSpan = resolveSpan(cell, 1.04, WALL_DEPTH + 0.05);
      const capAt = at.clone();
      if (cell.axis === 'vertical') capAt.z += capSpan.center.y - cell.y;
      else capAt.x += capSpan.center.x - cell.x;
      capAt.y = wallHeight + WALL_CROWN_HEIGHT / 2;
      capFull.push({
        position: capAt,
        scale: new THREE.Vector3(
          cell.axis === 'vertical' ? WALL_DEPTH + WALL_CROWN_OVERHANG * 2 : capSpan.length,
          WALL_CROWN_HEIGHT,
          cell.axis === 'vertical' ? capSpan.length : WALL_DEPTH + WALL_CROWN_OVERHANG * 2,
        ),
      });
    }
    // Shared load-bearing partitions remain concrete on both sides. Corrugated sheets
    // dress the garage's own façades, independently of profile registration order.
    const sharedPartition = cells.some(
      (cell) => cell.faces.length > 1 || cell.faces.some((owner) => owner.sharedWall),
    );
    const body =
      !sharedPartition && holtWallFinish(face.roomId).body === 'corrugated'
        ? environmentMaterials.get('corrugatedSteel')
        : wallMaterial;
    addInstances(sides.full, unitBox, body, wallFull, ownInstancedMeshes);
    for (const [material, paint] of facePaint) {
      addInstances(sides.full, unitBox, material, paint.full, ownInstancedMeshes);
    }
    addInstances(sides.full, unitBox, crownMaterial, capFull, ownInstancedMeshes);
  }

  // Shared frame details are instanced by side/material. The leaf remains a small, stateful
  // group per doorway so an actual door can follow runtime conditions and open/close state.
  // The north training access crosses two adjacent wall rows: line the entire passage,
  // rather than leaving two freestanding portal frames with a dark gap between them.
  const pairedPassages = new Set<string>();
  for (const first of openings) {
    const second = openings.find(
      (candidate) =>
        candidate.axis === first.axis &&
        (first.axis === 'horizontal'
          ? candidate.x === first.x && candidate.y === first.y + 1
          : candidate.y === first.y && candidate.x === first.x + 1),
    );
    if (!second || pairedPassages.has(second.id)) continue;
    pairedPassages.add(first.id);
    pairedPassages.add(second.id);
    const face = first.faces[0];
    const otherFace = second.faces[0];
    if (!face || !otherFace) continue;
    const sides = ensureSide(face.roomId, face.side, face.segmentId);
    const a = architectureWallWorld(map, first, face, geometry);
    const b = architectureWallWorld(map, second, otherFace, geometry);
    const center = a.clone().add(b).multiplyScalar(0.5);
    const span = a.distanceTo(b) + WALL_DEPTH;
    const alongZ = first.axis === 'horizontal';
    const passageHeaderHeight = doorHeaderHeightAt(first);
    const lining = [-1, 1].map((direction) => ({
      position: center
        .clone()
        .add(new THREE.Vector3(alongZ ? direction * 0.48 : 0, DOOR_HEIGHT / 2, alongZ ? 0 : direction * 0.48)),
      scale: new THREE.Vector3(alongZ ? 0.065 : span, DOOR_HEIGHT, alongZ ? span : 0.065),
    }));
    addInstances(sides.full, unitBox, frameMaterial, lining, ownInstancedMeshes);
    const threshold = {
      position: center.clone().setY(0.035),
      scale: new THREE.Vector3(alongZ ? 0.94 : span, 0.04, alongZ ? span : 0.94),
    };
    addInstances(sides.full, unitBox, darkSteel, [threshold], ownInstancedMeshes);
    addInstances(
      sides.full,
      unitBox,
      frameMaterial,
      [
        {
          position: center.clone().setY(DOOR_HEIGHT + passageHeaderHeight / 2),
          scale: new THREE.Vector3(alongZ ? 1.03 : span, passageHeaderHeight, alongZ ? span : 1.03),
        },
      ],
      ownInstancedMeshes,
    );
  }
  for (const opening of openings) {
    const face = opening.faces[0];
    if (face) {
      const sides = ensureSide(face.roomId, face.side, face.segmentId);
      const at = architectureWallWorld(map, opening, face, geometry);
      const yaw = sideYaw(opening.axis);
      const isVertical = opening.axis === 'vertical';
      const wallHeight = wallHeightAt(opening);
      const headerHeight = doorHeaderHeightAt(opening);
      const jambDepth = WALL_DEPTH + 0.08;
      const fullFrame = new THREE.Group();
      fullFrame.name = `${opening.id}-holt-door-frame`;
      const framePieces = pairedPassages.has(opening.id)
        ? []
        : [
            {
              p: new THREE.Vector3(-DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0),
              s: new THREE.Vector3(0.09, DOOR_HEIGHT, jambDepth),
            },
            {
              p: new THREE.Vector3(DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0),
              s: new THREE.Vector3(0.09, DOOR_HEIGHT, jambDepth),
            },
            {
              p: new THREE.Vector3(0, DOOR_HEIGHT + headerHeight / 2, 0),
              s: new THREE.Vector3(DOOR_WIDTH + 0.18, headerHeight, jambDepth),
            },
            {
              p: new THREE.Vector3(0, 0.035, 0),
              s: new THREE.Vector3(DOOR_WIDTH + 0.12, 0.07, jambDepth + 0.05),
            },
          ];
      for (const piece of framePieces) {
        const mesh = new THREE.Mesh(unitBox, frameMaterial);
        mesh.position.copy(piece.p);
        mesh.scale.copy(piece.s);
        fullFrame.add(mesh);
      }
      fullFrame.position.copy(at);
      fullFrame.rotation.y = yaw;
      sides.full.add(fullFrame);

      // Fill the wall above the portal and continue its crown across the doorway.
      const tympan = new THREE.Mesh(unitBox, wallMaterial);
      tympan.name = `${opening.id}-holt-door-tympan`;
      tympan.position.copy(at).setY((DOOR_HEIGHT + wallHeight) / 2);
      tympan.scale.set(
        isVertical ? WALL_DEPTH : 1.02,
        wallHeight - DOOR_HEIGHT,
        isVertical ? 1.02 : WALL_DEPTH,
      );
      tympan.castShadow = true;
      tympan.receiveShadow = true;
      sides.full.add(tympan);
      const crown = new THREE.Mesh(unitBox, crownMaterial);
      crown.name = `${opening.id}-holt-door-wall-crown`;
      crown.position.copy(at).setY(wallHeight + WALL_CROWN_HEIGHT / 2);
      crown.scale.set(
        isVertical ? WALL_DEPTH + WALL_CROWN_OVERHANG * 2 : 1.04,
        WALL_CROWN_HEIGHT,
        isVertical ? 1.04 : WALL_DEPTH + WALL_CROWN_OVERHANG * 2,
      );
      crown.castShadow = true;
      crown.receiveShadow = true;
      sides.full.add(crown);

      if (opening.doorId && options.entityDoorLeaves?.has(opening.doorId)) continue;

      const leafRoot = new THREE.Group();
      leafRoot.name = `${opening.id}-holt-door-leaf`;
      // Hinge sits at the negative edge of local X. The rotated vertical-wall leaf uses the
      // same local model, aligned to the actual opening axis.
      leafRoot.position.copy(at);
      if (isVertical) leafRoot.position.z += 0.4;
      else leafRoot.position.x -= 0.4;
      leafRoot.rotation.y = yaw;
      const fullLeaf = new THREE.Group();
      const finish = holtDoorFinish(
        opening.faces.map((owner) => owner.roomId),
        opening.doorId,
      );
      const doorBody = dormitoryMaterials.get(finish.body);
      const doorInset = finish.family === 'residential' ? petrolPaint : dormitoryMaterials.get(finish.inset);
      const doorDepth = finish.family === 'armored' ? 0.16 : DOOR_DEPTH;
      const panel = new THREE.Mesh(unitBox, doorBody);
      panel.name = 'holt-door-steel-leaf';
      panel.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0);
      panel.scale.set(DOOR_WIDTH, DOOR_HEIGHT, doorDepth);
      panel.castShadow = true;
      panel.receiveShadow = true;
      fullLeaf.add(panel);
      const inset = new THREE.Mesh(unitBox, doorInset);
      inset.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT * 0.6, doorDepth / 2 + 0.007);
      inset.scale.set(DOOR_WIDTH * 0.66, DOOR_HEIGHT * 0.34, 0.018);
      fullLeaf.add(inset);
      const stripe = new THREE.Mesh(unitBox, darkSteel);
      stripe.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT * 0.36, doorDepth / 2 + 0.008);
      stripe.scale.set(DOOR_WIDTH * 0.76, 0.045, 0.02);
      fullLeaf.add(stripe);
      const handle = new THREE.Mesh(unitBox, edgeMetal);
      handle.position.set(DOOR_WIDTH * 0.77, DOOR_HEIGHT * 0.49, doorDepth / 2 + 0.026);
      handle.scale.set(0.045, 0.22, 0.045);
      fullLeaf.add(handle);
      // Both room and corridor faces carry the same inset and handle.
      for (const front of [inset, stripe, handle]) {
        const back = front.clone();
        back.position.z *= -1;
        fullLeaf.add(back);
      }
      const details: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
      for (const direction of [-1, 1]) {
        const z = direction * (doorDepth / 2 + 0.025);
        if (finish.family === 'armored') {
          for (const y of [0.45, 0.98, 1.8])
            details.push({
              position: new THREE.Vector3(DOOR_WIDTH / 2, y, z),
              scale: new THREE.Vector3(0.78, 0.09, 0.035),
            });
          for (const x of [0.1, 0.78])
            for (const y of [0.15, 0.68, 1.2, 1.74, 2.16])
              details.push({
                position: new THREE.Vector3(x, y, z),
                scale: new THREE.Vector3(0.035, 0.035, 0.022),
              });
        } else if (finish.family === 'maintenance' || finish.family === 'garage') {
          for (let index = 0; index < 6; index++)
            details.push({
              position: new THREE.Vector3(DOOR_WIDTH / 2, 0.35 + index * 0.1, z),
              scale: new THREE.Vector3(0.6, 0.035, 0.028),
            });
        } else if (finish.family === 'medical') {
          details.push(
            {
              position: new THREE.Vector3(DOOR_WIDTH / 2, 1.48, z),
              scale: new THREE.Vector3(0.065, 0.3, 0.028),
            },
            {
              position: new THREE.Vector3(DOOR_WIDTH / 2, 1.48, z),
              scale: new THREE.Vector3(0.24, 0.065, 0.028),
            },
          );
        }
      }
      addInstances(
        fullLeaf,
        unitBox,
        finish.family === 'medical' ? petrolPaint : frameMaterial,
        details,
        ownInstancedMeshes,
      );
      leafRoot.add(fullLeaf);
      leafRoot.userData.architectureCellId = opening.id;
      leafRoot.userData.isPassageLining = pairedPassages.has(opening.id) && !opening.doorId;
      if (opening.doorId) {
        leafRoot.userData.entityId = opening.doorId;
        pickables.push(leafRoot);
      }
      sides.root.add(leafRoot);
      const doorEntity = map.def.entities.find((entity) => entity.id === opening.doorId);
      sides.doorLeaves.push({
        id: opening.doorId,
        root: leafRoot,
        fullLeaf,
        initialOpen: opening.doorId ? !(doorEntity?.type === 'door' && doorEntity.locked) : true,
      });
    }
  }

  // Recessed panel joints stay flush to both wall faces instead of floating in the wall volume.
  for (const [key, cells] of cellsBySide) {
    const face = cells[0]?.faces[0];
    if (!face) continue;
    const sides = sideGroups.get(key);
    if (!sides) continue;
    const fullRibs: Array<{ position: THREE.Vector3; scale: THREE.Vector3; yaw?: number }> = [];
    for (const cell of cells) {
      for (const cellFace of cell.faces) {
        if (
          layout.windows.some(
            (window) =>
              window.cell.x === cell.x &&
              window.cell.y === cell.y &&
              window.roomId === cellFace.roomId &&
              window.side === cellFace.side,
          )
        )
          continue;
        // Both finishes sit on the same physical boundary plane. Only the normal offset changes.
        const at = architectureWallWorld(map, cell, face, geometry);
        const outward = (cell.axis === 'vertical' ? 'x' : 'z') as 'x' | 'z';
        const sign = cellFace.side === 'west' || cellFace.side === 'north' ? 1 : -1;
        at[outward] += sign * (WALL_DEPTH / 2 + 0.009);
        const horizontalScale =
          cell.axis === 'vertical'
            ? new THREE.Vector3(0.018, 0.022, 0.98)
            : new THREE.Vector3(0.98, 0.022, 0.018);
        const wallHeight = geometry.get(cell.id)?.height ?? HOLT_ARCHITECTURE_WALL_HEIGHT;
        const verticalScale =
          cell.axis === 'vertical'
            ? new THREE.Vector3(0.018, wallHeight - 0.18, 0.022)
            : new THREE.Vector3(0.022, wallHeight - 0.18, 0.018);
        for (const y of [0.36, 2.35, 4.42].filter((height) => height < wallHeight - 0.1)) {
          fullRibs.push({ position: at.clone().setY(y), scale: horizontalScale.clone() });
        }
        fullRibs.push({ position: at.clone().setY(wallHeight / 2), scale: verticalScale });
      }
    }
    addInstances(sides.full, unitBox, darkSteel, fullRibs, ownInstancedMeshes);
  }

  let previousSignature: string | undefined;
  let disposed = false;
  const setKey = (values: ReadonlySet<string> | undefined) => [...(values ?? [])].sort().join(',');
  const setState = (state: HoltArchitectureState) => {
    const doors = [...sideGroups.values()].flatMap((sides) => sides.doorLeaves);
    const doorStates = new Map<object, { active: boolean; open: boolean }>();
    const doorSnapshot = doors
      .map((door) => {
        const active = !door.id || !state.activeDoorIds || state.activeDoorIds.has(door.id);
        const open = door.id ? (state.isDoorOpen?.(door.id) ?? door.initialOpen) : true;
        doorStates.set(door, { active, open });
        return `${door.id ?? String(door.root.userData.architectureCellId)}:${active ? 1 : 0}:${open ? 1 : 0}`;
      })
      .join('|');
    const signature = [
      state.active ? '1' : '0',
      setKey(state.discoveredRoomIds),
      setKey(state.activeDoorIds),
      state.night ? 'night' : 'day',
      doorSnapshot,
    ].join(';');
    // Snapshot set contents, not identities: callers may mutate and reuse their ReadonlySet.
    if (previousSignature === signature) return;
    previousSignature = signature;
    if (landscapeMaterial) landscapeMaterial.color.setHex(state.night ? 0x71819b : 0xffffff);
    for (const sides of sideGroups.values()) {
      // Architectural shell stays legible before discovery; discovery gates the room contents.
      const show = state.active;
      sides.full.visible = show;
      for (const window of sides.windows) {
        const discovered =
          (window.alwaysVisible || state.discoveredRoomIds.has(window.roomId)) &&
          (!window.viewRoomId || state.discoveredRoomIds.has(window.viewRoomId));
        window.closed.visible = !discovered;
        window.revealed.visible = discovered;
      }
      for (const door of sides.doorLeaves) {
        const doorState = doorStates.get(door);
        const doorActive = doorState?.active ?? true;
        const isOpen = doorState?.open ?? true;
        // Keep the actual lock/open state visible outside the active interaction step;
        // activeDoorIds only controls whether the leaf can be picked.
        door.root.visible = show && !door.root.userData.isPassageLining;
        setRaycastEnabled(door.fullLeaf, show && doorActive);
        if (door.lastOpen !== isOpen) {
          const opening = layout.cells.find((cell) => cell.id === door.root.userData.architectureCellId);
          door.root.rotation.y = sideYaw(opening?.axis ?? 'horizontal') + (isOpen ? Math.PI / 2 : 0);
          door.lastOpen = isOpen;
        }
      }
    }
  };

  setState({ active: false, discoveredRoomIds: new Set(), night: false });
  return {
    group,
    layout,
    geometry,
    pickables,
    setState,
    setEnvironment(texture) {
      if (disposed) return;
      paneMaterial.envMap = texture;
      paneMaterial.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const mesh of ownInstancedMeshes) mesh.dispose();
      for (const geometry of ownGeometries) geometry.dispose();
      for (const geometry of ownWindowGeometries) geometry.dispose();
      for (const texture of ownWindowTextures) texture.dispose();
      for (const material of ownWindowMaterials) material.dispose();
      group.clear();
      group.removeFromParent();
    },
  };
}
