import * as THREE from 'three';
import type { ExploreMap } from '@/explore';
import type { DormitoryMaterials, DormitorySurfaceKey } from './dormitoryMaterials';
import type { HoltArchitectureLayout, HoltWallCell, HoltWallSide } from './holtArchitectureLayout';
import { HOLT_EXTERIOR_WALL_HEIGHT, HOLT_INTERIOR_WALL_HEIGHT, type HoltWallShape } from './holtWallGeometry';

import { createWallSpanResolver } from './holtWallSpans';

const ROOM_ID = 'garage';
const WALL_DEPTH = 0.34;
const EPSILON = 0.012;
const CUT_HEIGHT = 0.4;

type DetailMaterial = Extract<DormitorySurfaceKey, 'darkSteel' | 'edgeSteel' | 'linen' | 'brass'>;

interface InstanceDetail {
  readonly wallKeys: readonly string[];
  readonly full: THREE.Matrix4;
  readonly cut: THREE.Matrix4 | null;
}

interface MaterialBatch {
  readonly mesh: THREE.InstancedMesh;
  readonly details: InstanceDetail[];
}

const keyAt = (x: number, y: number) => `${x},${y}`;

function cellWorld(map: ExploreMap, x: number, y: number): THREE.Vector3 {
  return new THREE.Vector3(x - (map.width - 1) / 2, 0, y - (map.height - 1) / 2);
}

function inward(side: HoltWallSide): THREE.Vector3 {
  switch (side) {
    case 'west':
      return new THREE.Vector3(1, 0, 0);
    case 'east':
      return new THREE.Vector3(-1, 0, 0);
    case 'north':
      return new THREE.Vector3(0, 0, 1);
    case 'south':
      return new THREE.Vector3(0, 0, -1);
  }
}

function alongWallScale(
  axis: HoltWallCell['axis'],
  length: number,
  height: number,
  depth: number,
): THREE.Vector3 {
  return axis === 'horizontal'
    ? new THREE.Vector3(length, height, depth)
    : new THREE.Vector3(depth, height, length);
}

function instanceMatrix(position: THREE.Vector3, scale: THREE.Vector3): THREE.Matrix4 {
  return new THREE.Matrix4().compose(position, new THREE.Quaternion(), scale);
}

function wallKeys(cell: HoltWallCell, side: HoltWallSide, segmentId: string): string[] {
  return [keyAt(cell.x, cell.y), cell.id, segmentId, `${ROOM_ID}:${side}:${segmentId}`];
}

function wallIsCut(keys: ReadonlySet<string>, detail: InstanceDetail): boolean {
  return detail.wallKeys.some((key) => keys.has(key));
}

/**
 * Adds restrained service details directly to the garage's real wall cells. All instances borrow
 * shared dormitory materials; only the unit box and the instance buffers belong to this view.
 */
export function createHangarDetails(options: {
  map: ExploreMap;
  materials: DormitoryMaterials;
  architectureLayout: HoltArchitectureLayout;
  wallGeometry: ReadonlyMap<string, HoltWallShape>;
}): {
  group: THREE.Group;
  update(discovered: boolean, cutCellKeys: ReadonlySet<string>): void;
  dispose(): void;
} {
  const { map, materials, architectureLayout, wallGeometry } = options;
  const resolveSpan = createWallSpanResolver(architectureLayout, wallGeometry);
  const group = new THREE.Group();
  group.name = 'holt-garage-wall-details';
  const detailsByMaterial = new Map<DetailMaterial, InstanceDetail[]>();
  const batches: MaterialBatch[] = [];
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  group.visible = false;
  let disposed = false;
  let previousSignature = '';

  const addDetail = (
    material: DetailMaterial,
    wallCell: HoltWallCell,
    side: HoltWallSide,
    segmentId: string,
    position: THREE.Vector3,
    fullScale: THREE.Vector3,
    cutScale: THREE.Vector3 | null,
    cutPosition?: THREE.Vector3,
    keysOverride?: readonly string[],
  ) => {
    let details = detailsByMaterial.get(material);
    if (!details) {
      details = [];
      detailsByMaterial.set(material, details);
    }
    details.push({
      wallKeys: keysOverride ?? wallKeys(wallCell, side, segmentId),
      full: instanceMatrix(position, fullScale),
      cut: cutScale ? instanceMatrix(cutPosition ?? position, cutScale) : null,
    });
  };

  const garageRoom = map.def.rooms.find((room) => room.id === ROOM_ID);
  const garageCells = architectureLayout.cells.flatMap((cell) => {
    if (cell.kind !== 'wall' || map.kindAt({ x: cell.x, y: cell.y }) !== 'wall') return [];
    const face = cell.faces.find((candidate) => candidate.roomId === ROOM_ID);
    if (!face) return [];
    const hasWindow = architectureLayout.windows.some(
      (window) => window.roomId === ROOM_ID && window.cell.x === cell.x && window.cell.y === cell.y,
    );
    if (hasWindow) return [];
    return [{ cell, side: face.side, segmentId: face.segmentId }];
  });

  for (const { cell, side, segmentId } of garageCells) {
    const shape = wallGeometry.get(cell.id);
    const span = resolveSpan(cell, 0.96, WALL_DEPTH);
    const center = cellWorld(map, span.center.x, span.center.y);
    const normal = inward(side);
    const height =
      shape?.height ??
      (cell.faces.some((face) => face.sharedWall) ? HOLT_INTERIOR_WALL_HEIGHT : HOLT_EXTERIOR_WALL_HEIGHT);
    const atSurface = (depth: number, offset = depth / 2 + EPSILON) =>
      center.clone().addScaledVector(normal, WALL_DEPTH / 2 + offset);

    // Continuous low rub rail: it remains wholly below the 0.4 m cutaway edge.
    const railPosition = atSurface(0.11);
    railPosition.y = 0.28;
    addDetail(
      'darkSteel',
      cell,
      side,
      segmentId,
      railPosition,
      alongWallScale(cell.axis, span.length, 0.14, 0.11),
      alongWallScale(cell.axis, span.length, 0.14, 0.11),
    );

    // Panel uprights begin above the rail and shorten to the wall's visible cut remnant.
    const uprightBase = 0.35;
    const uprightHeight = Math.max(0.08, Math.min(2.05, height - uprightBase - 0.1));
    const uprightPosition = atSurface(0.075);
    uprightPosition.y = uprightBase + uprightHeight / 2;
    const cutUprightHeight = Math.max(0.015, CUT_HEIGHT - uprightBase);
    const cutUprightPosition = uprightPosition.clone().setY(uprightBase + cutUprightHeight / 2);
    addDetail(
      'edgeSteel',
      cell,
      side,
      segmentId,
      uprightPosition,
      alongWallScale(cell.axis, 0.052, uprightHeight, 0.075),
      alongWallScale(cell.axis, 0.052, cutUprightHeight, 0.075),
      cutUprightPosition,
    );
    // Two flush fasteners on each rail bracket keep the modular wall hardware legible up close.
    const fastenerOffset = Math.max(0.015, Math.min(0.43, span.length / 2 - 0.035));
    for (const along of [-fastenerOffset, fastenerOffset]) {
      const fastenerPosition = railPosition.clone().addScaledVector(normal, 0.055 + 0.009 + EPSILON);
      if (cell.axis === 'horizontal') fastenerPosition.x += along;
      else fastenerPosition.z += along;
      fastenerPosition.y = 0.28;
      addDetail(
        'brass',
        cell,
        side,
        segmentId,
        fastenerPosition,
        alongWallScale(cell.axis, 0.035, 0.035, 0.018),
        alongWallScale(cell.axis, 0.035, 0.035, 0.018),
      );
    }

    // Cable trunking sits below the high window sills and vanishes with any cut wall cell.
    const channelY = Math.min(2.12, height - 0.28);
    const channelPosition = atSurface(0.13);
    channelPosition.y = channelY;
    addDetail(
      'darkSteel',
      cell,
      side,
      segmentId,
      channelPosition,
      alongWallScale(cell.axis, span.length, 0.12, 0.13),
      null,
    );
  }

  // Long paired luminaires sit on uninterrupted wall runs. Window and door cells split a run,
  // so no fixture can bridge or cover an opening. The lamp housings and diffusers are instances.
  const lines = new Map<string, typeof garageCells>();
  for (const item of garageCells) {
    const key = `${item.side}:${item.segmentId}`;
    const line = lines.get(key) ?? [];
    line.push(item);
    lines.set(key, line);
  }
  for (const items of lines.values()) {
    items.sort((a, b) => (a.cell.axis === 'horizontal' ? a.cell.x - b.cell.x : a.cell.y - b.cell.y));
    let run: typeof items = [];
    const flushRun = () => {
      for (let index = 0; index + 1 < run.length; index += 2) {
        const first = run[index]!;
        const second = run[index + 1]!;
        const firstCoordinate = first.cell.axis === 'horizontal' ? first.cell.x : first.cell.y;
        const secondCoordinate = second.cell.axis === 'horizontal' ? second.cell.x : second.cell.y;
        if (secondCoordinate !== firstCoordinate + 1) continue;
        if (
          resolveSpan(first.cell, 0.96, WALL_DEPTH).length < 0.9 ||
          resolveSpan(second.cell, 0.96, WALL_DEPTH).length < 0.9
        )
          continue;
        const firstShape = wallGeometry.get(first.cell.id);
        const secondShape = wallGeometry.get(second.cell.id);
        const firstCenter = firstShape?.center ?? { x: first.cell.x, y: first.cell.y };
        const secondCenter = secondShape?.center ?? { x: second.cell.x, y: second.cell.y };
        const center = cellWorld(
          map,
          (firstCenter.x + secondCenter.x) / 2,
          (firstCenter.y + secondCenter.y) / 2,
        );
        const normal = inward(first.side);
        const firstHeight = firstShape?.height ?? HOLT_EXTERIOR_WALL_HEIGHT;
        const secondHeight = secondShape?.height ?? HOLT_EXTERIOR_WALL_HEIGHT;
        const wallHeight = Math.min(firstHeight, secondHeight);
        const lampY = wallHeight > 3.5 ? 3.52 : Math.min(1.52, wallHeight - 0.55);
        const housingDepth = 0.105;
        center.addScaledVector(normal, WALL_DEPTH / 2 + housingDepth / 2 + EPSILON);
        center.y = lampY;
        const wallKeysForPair = [
          ...wallKeys(first.cell, first.side, first.segmentId),
          ...wallKeys(second.cell, second.side, second.segmentId),
        ];
        const housingScale = alongWallScale(first.cell.axis, 1.72, 0.14, housingDepth);
        addDetail(
          'darkSteel',
          first.cell,
          first.side,
          first.segmentId,
          center,
          housingScale,
          null,
          undefined,
          wallKeysForPair,
        );

        const diffuserPosition = center.clone().addScaledVector(normal, housingDepth / 2 + 0.008);
        const diffuserScale = alongWallScale(first.cell.axis, 1.48, 0.045, 0.012);
        addDetail(
          'linen',
          first.cell,
          first.side,
          first.segmentId,
          diffuserPosition,
          diffuserScale,
          null,
          undefined,
          wallKeysForPair,
        );
      }
      run = [];
    };
    for (const item of items) {
      const last = run[run.length - 1];
      const lastCoordinate = last && (last.cell.axis === 'horizontal' ? last.cell.x : last.cell.y);
      const coordinate = item.cell.axis === 'horizontal' ? item.cell.x : item.cell.y;
      if (last && coordinate !== lastCoordinate! + 1) flushRun();
      run.push(item);
    }
    flushRun();
  }

  // Aged brass corner guards are fixed to the four actual inside corners, below window sills.
  if (garageRoom) {
    const { x, y } = garageRoom.rect.origin;
    const { width, height } = garageRoom.rect;
    const corners = new Set([
      `${x - 1},${y - 1}`,
      `${x + width},${y - 1}`,
      `${x - 1},${y + height}`,
      `${x + width},${y + height}`,
    ]);
    for (const { cell, side, segmentId } of garageCells) {
      if (!corners.has(keyAt(cell.x, cell.y))) continue;
      const span = resolveSpan(cell, 0.96, WALL_DEPTH);
      const position = cellWorld(map, span.center.x, span.center.y).addScaledVector(
        inward(side),
        WALL_DEPTH / 2 + 0.055,
      );
      position.y = 0.43;
      const cutPosition = position.clone().setY(CUT_HEIGHT / 2);
      addDetail(
        'brass',
        cell,
        side,
        segmentId,
        position,
        alongWallScale(cell.axis, 0.12, 0.78, 0.035),
        alongWallScale(cell.axis, 0.12, CUT_HEIGHT, 0.035),
        cutPosition,
      );
    }
  }

  for (const [material, details] of detailsByMaterial) {
    const mesh = new THREE.InstancedMesh(unitBox, materials.get(material), details.length);
    mesh.name = `garage-${material}-details`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    details.forEach((detail, index) => mesh.setMatrixAt(index, detail.full));
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    batches.push({ mesh, details });
  }

  const update = (discovered: boolean, cutCellKeys: ReadonlySet<string>) => {
    if (disposed) return;
    group.visible = discovered;
    if (!discovered) {
      previousSignature = '';
      return;
    }
    const signature = [...cutCellKeys].sort().join('|');
    if (signature === previousSignature) return;
    previousSignature = signature;
    for (const batch of batches) {
      batch.details.forEach((detail, index) => {
        const matrix = wallIsCut(cutCellKeys, detail) ? (detail.cut ?? zeroMatrix) : detail.full;
        batch.mesh.setMatrixAt(index, matrix);
      });
      batch.mesh.instanceMatrix.needsUpdate = true;
    }
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const batch of batches) {
      batch.mesh.dispose();
      group.remove(batch.mesh);
    }
    unitBox.dispose();
    group.clear();
  };

  return { group, update, dispose };
}
