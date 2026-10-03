import * as THREE from 'three';
import type { Cell, ExploreMap } from '@/explore';
import type { DormitoryMaterials, DormitorySurfaceKey, DormitoryTextureKey } from './dormitoryMaterials';
import type { NightMood } from './atmosphere';
import { HOLT_RENDER_PROFILES, type HoltRenderProfile } from './holtRenderProfiles';
import type { HoltArchitectureLayout, HoltWallCell } from './holtArchitectureLayout';
import { buildHoltWallGeometry, HOLT_EXTERIOR_WALL_HEIGHT, type HoltWallShape } from './holtWallGeometry';
import { createWallSpanResolver } from './holtWallSpans';

const WALL_DEPTH = 0.34;
const CELL_KEY = (x: number, y: number) => `${x},${y}`;

export interface HoltRoomRenderingState {
  activeZoneId: string | null;
  discoveredRoomIds: ReadonlySet<string>;
  /** Real map wall-cell keys (`x,y`), with optional profile side keys for convenience. */
  cutCellKeys: ReadonlySet<string>;
  night: NightMood;
  leaderCell?: Cell;
}

export interface HoltRoomRendering {
  readonly group: THREE.Group;
  readonly floorMaterials: ReadonlyMap<string, THREE.MeshStandardMaterial>;
  update(state: HoltRoomRenderingState): void;
  dispose(): void;
}

interface WallCell {
  cell: Cell;
  side: 'north' | 'south' | 'east' | 'west';
  axis: 'horizontal' | 'vertical';
  center: THREE.Vector3;
  inward: THREE.Vector3;
  height: number;
  layoutCell?: HoltWallCell;
}

interface InstancePlacement {
  key: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  yaw: number;
  hideWhenCut: boolean;
}

function worldCell(map: ExploreMap, x: number, y: number): THREE.Vector3 {
  return new THREE.Vector3(x - (map.width - 1) / 2, 0, y - (map.height - 1) / 2);
}

function boundaryCell(map: ExploreMap, x: number, y: number, side: WallCell['side']): THREE.Vector3 {
  const point = worldCell(map, x, y);
  if (side === 'west') point.x += 0.5;
  else if (side === 'east') point.x -= 0.5;
  else if (side === 'north') point.z += 0.5;
  else point.z -= 0.5;
  return point;
}

function wallWorldCenter(
  map: ExploreMap,
  cell: HoltWallCell,
  wallGeometry: ReadonlyMap<string, HoltWallShape> | undefined,
  fallbackSide: WallCell['side'],
): THREE.Vector3 {
  const shape = wallGeometry?.get(cell.id);
  if (shape) return worldCell(map, shape.center.x, shape.center.y);
  return cell.faces.some((face) => face.sharedWall)
    ? worldCell(map, cell.x, cell.y)
    : boundaryCell(map, cell.x, cell.y, fallbackSide);
}

function wallCells(
  map: ExploreMap,
  profile: HoltRenderProfile,
  architectureLayout: HoltArchitectureLayout | undefined,
  wallGeometry: ReadonlyMap<string, HoltWallShape> | undefined,
): WallCell[] {
  if (!profile.rect) return [];
  const { origin, width, height } = profile.rect;
  const edges: Array<{ x: number; y: number; side: WallCell['side']; axis: WallCell['axis'] }> = [];
  for (let i = 0; i < height + 2; i++) {
    edges.push({ x: origin.x - 1, y: origin.y - 1 + i, side: 'west', axis: 'vertical' });
    edges.push({ x: origin.x + width, y: origin.y - 1 + i, side: 'east', axis: 'vertical' });
  }
  for (let i = 0; i < width + 2; i++) {
    edges.push({ x: origin.x - 1 + i, y: origin.y - 1, side: 'north', axis: 'horizontal' });
    edges.push({ x: origin.x - 1 + i, y: origin.y + height, side: 'south', axis: 'horizontal' });
  }
  const result: WallCell[] = [];
  const seen = new Set<string>();
  for (const edge of edges) {
    const key = CELL_KEY(edge.x, edge.y);
    const char = map.def.ascii[edge.y]?.[edge.x];
    if (char !== '#' || seen.has(`${key}:${edge.side}`)) continue;
    seen.add(`${key}:${edge.side}`);
    const layoutCell = architectureLayout?.cells.find(
      (cell) =>
        cell.x === edge.x &&
        cell.y === edge.y &&
        cell.faces.some((face) => face.roomId === profile.zoneId && face.side === edge.side),
    );
    const shape = layoutCell ? wallGeometry?.get(layoutCell.id) : undefined;
    const center = layoutCell
      ? wallWorldCenter(map, layoutCell, wallGeometry, edge.side)
      : boundaryCell(map, edge.x, edge.y, edge.side);
    const inward = new THREE.Vector3(
      edge.side === 'west' ? 1 : edge.side === 'east' ? -1 : 0,
      0,
      edge.side === 'north' ? 1 : edge.side === 'south' ? -1 : 0,
    );
    result.push({
      cell: { x: edge.x, y: edge.y },
      side: edge.side,
      axis: edge.axis,
      center,
      inward,
      height: shape?.height ?? HOLT_EXTERIOR_WALL_HEIGHT,
      ...(layoutCell ? { layoutCell } : {}),
    });
  }
  return result;
}

function labelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible pour la signalétique HOLT.');
  ctx.fillStyle = '#18313a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#b0c2bd';
  ctx.fillRect(16, 13, canvas.width - 32, canvas.height - 26);
  ctx.fillStyle = '#17313a';
  ctx.font = 'bold 37px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 36);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function cellIsCut(keys: ReadonlySet<string>, profile: HoltRenderProfile, wall: WallCell): boolean {
  return (
    keys.has(CELL_KEY(wall.cell.x, wall.cell.y)) ||
    keys.has(`${profile.zoneId}:${wall.side}`) ||
    keys.has(profile.zoneId)
  );
}

function wallKeyIsCut(keys: ReadonlySet<string>, profile: HoltRenderProfile, key: string): boolean {
  const [coordinates, sideValue] = key.split(':');
  const [x, y] = (coordinates ?? '').split(',').map(Number);
  const side = sideValue as WallCell['side'];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return cellIsCut(keys, profile, {
    cell: { x: x!, y: y! },
    side,
    axis: side === 'west' || side === 'east' ? 'vertical' : 'horizontal',
    center: new THREE.Vector3(),
    inward: new THREE.Vector3(),
    height: HOLT_EXTERIOR_WALL_HEIGHT,
  });
}

function addInstancedPlacements(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  placements: readonly InstancePlacement[],
): THREE.InstancedMesh | null {
  if (!placements.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  for (let i = 0; i < placements.length; i++) {
    const item = placements[i]!;
    rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.yaw);
    matrix.compose(item.position, rotation, item.scale);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function setPlacementMatrices(
  mesh: THREE.InstancedMesh | null,
  placements: readonly InstancePlacement[],
  cutKeys: ReadonlySet<string>,
  profile: HoltRenderProfile,
): void {
  if (!mesh) return;
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  for (let i = 0; i < placements.length; i++) {
    const item = placements[i]!;
    const [xText, yWithSide] = item.key.split(':')[0]!.split(',');
    const cut =
      item.hideWhenCut &&
      cellIsCut(cutKeys, profile, {
        cell: { x: Number(xText), y: Number(yWithSide) },
        side: item.key.endsWith(':east')
          ? 'east'
          : item.key.endsWith(':north')
            ? 'north'
            : item.key.endsWith(':south')
              ? 'south'
              : 'west',
        axis: 'vertical',
        center: new THREE.Vector3(),
        inward: new THREE.Vector3(),
        height: HOLT_EXTERIOR_WALL_HEIGHT,
      });
    rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.yaw);
    matrix.compose(item.position, rotation, cut ? new THREE.Vector3(0, 0, 0) : item.scale);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function buildZoneFinish(
  parent: THREE.Group,
  map: ExploreMap,
  profile: HoltRenderProfile,
  materials: DormitoryMaterials,
  architectureLayout: HoltArchitectureLayout | undefined,
  wallGeometry: ReadonlyMap<string, HoltWallShape> | undefined,
  ownedMaterials: Set<THREE.Material>,
  ownedGeometries: Set<THREE.BufferGeometry>,
  ownedTextures: Set<THREE.Texture>,
): {
  floorMaterial: THREE.MeshStandardMaterial;
  cuttable: Array<{ mesh: THREE.InstancedMesh | null; placements: InstancePlacement[] }>;
  wallFixtures: Array<{ root: THREE.Group; key: string }>;
} {
  const rect = profile.rect!;
  const isHolt = map.def.id === 'holt' || map.def.id === 'holt-nuit';
  const zone = new THREE.Group();
  zone.name = `holt-zone-${profile.id}`;
  parent.add(zone);

  const floorGeometry = new THREE.PlaneGeometry(rect.width, rect.height);
  ownedGeometries.add(floorGeometry);
  const floorSurface = profile.floor.material.slice('dormitory:'.length) as DormitorySurfaceKey;
  const floorMaterial = materials.get(floorSurface).clone();
  ownedMaterials.add(floorMaterial);
  const textureKey: Partial<Record<DormitorySurfaceKey, DormitoryTextureKey>> = {
    floor: 'floor',
    wall: 'wall',
    steel: 'steel',
    edgeSteel: 'steel',
    darkSteel: 'steel',
    linen: 'fabric',
    blanket: 'fabric',
    canvas: 'fabric',
    wood: 'wood',
  };
  const surfaceTexture = textureKey[floorSurface];
  if (surfaceTexture) {
    const floorMap = materials.cloneTexture(surfaceTexture);
    const bumpMap = materials.cloneTexture(surfaceTexture);
    ownedTextures.add(floorMap);
    ownedTextures.add(bumpMap);
    floorMap.repeat.set(rect.width / profile.floor.repeatMeters, rect.height / profile.floor.repeatMeters);
    bumpMap.repeat.copy(floorMap.repeat);
    floorMaterial.map = floorMap;
    floorMaterial.bumpMap = bumpMap;
    floorMaterial.bumpScale = floorSurface === 'floor' ? 0.018 : 0.006;
  }
  floorMaterial.roughness = profile.floor.roughness;
  floorMaterial.envMapIntensity = profile.floor.environmentGain;
  floorMaterial.userData.reflectionGain = profile.floor.reflectionGain;
  if (profile.floor.tint !== undefined) floorMaterial.color.setHex(profile.floor.tint);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.name = `${profile.zoneId}-floor`;
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(
    rect.origin.x + (rect.width - 1) / 2 - (map.width - 1) / 2,
    0.025,
    rect.origin.y + (rect.height - 1) / 2 - (map.height - 1) / 2,
  );
  floor.receiveShadow = true;
  zone.add(floor);
  const cuttable: Array<{ mesh: THREE.InstancedMesh | null; placements: InstancePlacement[] }> = [];

  if (
    profile.finish.family === 'canteen' ||
    profile.finish.family === 'courtyard' ||
    profile.finish.family === 'training' ||
    profile.finish.family === 'garage' ||
    profile.finish.family === 'administration' ||
    profile.finish.family === 'clinic' ||
    profile.finish.family === 'archives' ||
    profile.finish.family === 'maintenance'
  ) {
    const seamGeometry = new THREE.BoxGeometry(1, 1, 1);
    ownedGeometries.add(seamGeometry);
    const seamMaterial = new THREE.MeshStandardMaterial({
      color: 0x514f49,
      roughness: 0.68,
      metalness: 0.02,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    ownedMaterials.add(seamMaterial);
    const seams: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
    for (let x = 1; x < rect.width; x++)
      seams.push({
        position: new THREE.Vector3(floor.position.x - rect.width / 2 + x, 0.032, floor.position.z),
        scale: new THREE.Vector3(0.006, 0.006, rect.height),
      });
    for (let y = 1; y < rect.height; y++)
      seams.push({
        position: new THREE.Vector3(floor.position.x, 0.032, floor.position.z - rect.height / 2 + y),
        scale: new THREE.Vector3(rect.width, 0.006, 0.006),
      });
    const seamPlacements = seams.map((seam, index) => ({
      key: `${profile.zoneId}:floor-joint:${index}`,
      position: seam.position,
      scale: seam.scale,
      yaw: 0,
      hideWhenCut: false,
    }));
    cuttable.push({
      mesh: addInstancedPlacements(zone, seamGeometry, seamMaterial, seamPlacements),
      placements: seamPlacements,
    });
  }

  if (isHolt && profile.finish.family === 'canteen') {
    const aisleGeometry = new THREE.PlaneGeometry(1.94, 10.8);
    ownedGeometries.add(aisleGeometry);
    const aisleMaterial = new THREE.MeshStandardMaterial({
      color: 0x85847b,
      roughness: 0.42,
      metalness: 0.04,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    ownedMaterials.add(aisleMaterial);
    const aisle = new THREE.Mesh(aisleGeometry, aisleMaterial);
    aisle.name = 'cantine-inset-aisle';
    aisle.rotation.x = -Math.PI / 2;
    aisle.position.set(42.5 - (map.width - 1) / 2, 0.033, 23.5 - (map.height - 1) / 2);
    aisle.receiveShadow = true;
    zone.add(aisle);
  }

  const walls = wallCells(map, profile, architectureLayout, wallGeometry);
  const resolveSpan =
    architectureLayout && wallGeometry ? createWallSpanResolver(architectureLayout, wallGeometry) : undefined;
  const baseboardGeometry = new THREE.BoxGeometry(1, 1, 1);
  ownedGeometries.add(baseboardGeometry);
  const conduitGeometry = new THREE.BoxGeometry(1, 1, 1);
  ownedGeometries.add(conduitGeometry);
  const baseboardMaterial = materials.get(
    profile.finish.baseboardMaterial.slice('dormitory:'.length) as DormitorySurfaceKey,
  );
  const conduitMaterial = materials.get('darkSteel');
  const wallFixtures: Array<{ root: THREE.Group; key: string }> = [];

  for (const side of ['west', 'east', 'north', 'south'] as const) {
    const sideWalls = walls.filter((wall) => wall.side === side);
    if (!sideWalls.length) continue;
    const baseboards: InstancePlacement[] = [];
    const conduits: InstancePlacement[] = [];
    const lowConduits: InstancePlacement[] = [];
    for (const wall of sideWalls) {
      const vertical = wall.axis === 'vertical';
      const span =
        wall.layoutCell && resolveSpan ? resolveSpan(wall.layoutCell, 0.98, WALL_DEPTH) : undefined;
      const center = wall.center.clone();
      if (span) {
        if (vertical) center.z += span.center.y - wall.cell.y;
        else center.x += span.center.x - wall.cell.x;
      }
      const length = span?.length ?? 0.98;
      const offset = wall.inward.clone().multiplyScalar(WALL_DEPTH / 2 + 0.014);
      baseboards.push({
        key: `${CELL_KEY(wall.cell.x, wall.cell.y)}:${side}`,
        position: center.clone().add(offset).setY(0.12),
        scale: new THREE.Vector3(vertical ? 0.045 : length, 0.24, vertical ? length : 0.045),
        yaw: 0,
        hideWhenCut: false,
      });
      const pipeHeight = Math.min(profile.finish.family === 'maintenance' ? 1.95 : 3.63, wall.height - 0.22);
      const pipeAt = center.clone().add(offset).setY(pipeHeight);
      const crossesWindow =
        architectureLayout?.windows.some(
          (window) =>
            window.cell.x === wall.cell.x &&
            window.cell.y === wall.cell.y &&
            window.roomId === profile.zoneId &&
            window.side === side,
        ) ?? false;
      if (!crossesWindow)
        conduits.push({
          key: `${CELL_KEY(wall.cell.x, wall.cell.y)}:${side}`,
          position: pipeAt,
          scale: new THREE.Vector3(
            vertical ? 0.12 : length,
            profile.finish.family === 'maintenance' ? 0.11 : 0.09,
            vertical ? length : 0.12,
          ),
          yaw: 0,
          hideWhenCut: true,
        });
      if (!crossesWindow && profile.finish.family === 'maintenance')
        conduits.push({
          key: `${CELL_KEY(wall.cell.x, wall.cell.y)}:${side}`,
          position: center
            .clone()
            .add(offset)
            .setY(Math.min(1.58, wall.height - 0.22)),
          scale: new THREE.Vector3(vertical ? 0.07 : length, 0.055, vertical ? length : 0.07),
          yaw: 0,
          hideWhenCut: true,
        });
      if (profile.finish.family === 'interface')
        lowConduits.push({
          key: `${CELL_KEY(wall.cell.x, wall.cell.y)}:${side}`,
          position: center
            .clone()
            .add(offset)
            .setY(Math.min(1.28, wall.height - 0.22)),
          scale: new THREE.Vector3(vertical ? 0.075 : length, 0.055, vertical ? length : 0.075),
          yaw: 0,
          hideWhenCut: true,
        });
    }
    const baseMesh = addInstancedPlacements(zone, baseboardGeometry, baseboardMaterial, baseboards);
    cuttable.push({ mesh: baseMesh, placements: baseboards });
    const conduitMesh = addInstancedPlacements(zone, conduitGeometry, conduitMaterial, conduits);
    cuttable.push({ mesh: conduitMesh, placements: conduits });
    const lowConduitMesh = addInstancedPlacements(zone, conduitGeometry, conduitMaterial, lowConduits);
    cuttable.push({ mesh: lowConduitMesh, placements: lowConduits });
  }

  // Recessed luminaires are emissive fixtures only. A small shared light pool below lights the
  // corridor; repeating a fixture never creates another shadow-casting source.
  const sconceGeometry = new THREE.BoxGeometry(0.18, 0.42, 0.22);
  const diffuserGeometry = new THREE.BoxGeometry(0.035, 0.29, 0.12);
  ownedGeometries.add(sconceGeometry);
  ownedGeometries.add(diffuserGeometry);
  const sconceMaterial = materials.get(
    profile.finish.wallDeviceMaterial.slice('dormitory:'.length) as DormitorySurfaceKey,
  );
  const diffuserMaterial = new THREE.MeshStandardMaterial({
    color:
      profile.finish.family === 'interface'
        ? 0xb4d9e8
        : profile.finish.family === 'clinic'
          ? 0xe2f0f1
          : profile.finish.family === 'armory' ||
              profile.finish.family === 'archives' ||
              profile.finish.family === 'maintenance'
            ? 0xc8d1d5
            : 0xffd4a1,
    emissive:
      profile.finish.family === 'interface'
        ? 0x6caac0
        : profile.finish.family === 'clinic'
          ? 0xb3d3dc
          : profile.finish.family === 'armory' ||
              profile.finish.family === 'archives' ||
              profile.finish.family === 'maintenance'
            ? 0x778790
            : 0xffbd76,
    emissiveIntensity:
      profile.finish.family === 'interface'
        ? 0.38
        : profile.finish.family === 'clinic'
          ? 0.48
          : profile.finish.family === 'armory' ||
              profile.finish.family === 'archives' ||
              profile.finish.family === 'maintenance'
            ? 0.28
            : 0.7,
    roughness: 0.42,
  });
  ownedMaterials.add(diffuserMaterial);
  const sconceCells = !isHolt
    ? map.def.id !== 'centre-examen' || profile.zoneId === 'cour' || profile.zoneId === 'parking'
      ? []
      : walls
          .filter((wall, index) => {
            // Place fixtures on actual wall cells, avoiding corners and nearby duplicates.
            const onCorner =
              (wall.cell.x === rect.origin.x - 1 || wall.cell.x === rect.origin.x + rect.width) &&
              (wall.cell.y === rect.origin.y - 1 || wall.cell.y === rect.origin.y + rect.height);
            return !onCorner && index % 6 === 2;
          })
          .slice(0, 8)
          .map((wall) => ({ side: wall.side, cell: wall.cell }))
    : profile.finish.family === 'administration'
      ? [
          { side: 'west' as const, cell: { x: 4, y: 2 } },
          { side: 'east' as const, cell: { x: 17, y: 2 } },
          { side: 'west' as const, cell: { x: 4, y: 6 } },
          { side: 'east' as const, cell: { x: 17, y: 6 } },
        ]
      : profile.finish.family === 'armory'
        ? [
            { side: 'west' as const, cell: { x: 4, y: 25 } },
            { side: 'east' as const, cell: { x: 17, y: 25 } },
            { side: 'west' as const, cell: { x: 4, y: 29 } },
            { side: 'east' as const, cell: { x: 17, y: 29 } },
          ]
        : profile.finish.family === 'archives'
          ? [
              { side: 'west' as const, cell: { x: 4, y: 33 } },
              { side: 'east' as const, cell: { x: 17, y: 33 } },
              { side: 'west' as const, cell: { x: 4, y: 37 } },
              { side: 'east' as const, cell: { x: 17, y: 37 } },
            ]
          : profile.finish.family === 'maintenance'
            ? [
                { side: 'west' as const, cell: { x: 4, y: 42 } },
                { side: 'north' as const, cell: { x: 10, y: 39 } },
                { side: 'east' as const, cell: { x: 17, y: 41 } },
                { side: 'east' as const, cell: { x: 17, y: 45 } },
              ]
            : profile.finish.family === 'clinic'
              ? [
                  { side: 'west' as const, cell: { x: 4, y: 18 } },
                  { side: 'east' as const, cell: { x: 17, y: 17 } },
                  { side: 'west' as const, cell: { x: 4, y: 22 } },
                  { side: 'east' as const, cell: { x: 17, y: 21 } },
                ]
              : profile.finish.family === 'interface'
                ? [
                    { side: 'west' as const, cell: { x: 4, y: 10 } },
                    { side: 'east' as const, cell: { x: 17, y: 9 } },
                    { side: 'west' as const, cell: { x: 4, y: 14 } },
                    { side: 'east' as const, cell: { x: 17, y: 14 } },
                  ]
                : profile.zoneId === 'couloir-est'
                  ? [
                      { side: 'west' as const, cell: { x: 17, y: 8 } },
                      { side: 'east' as const, cell: { x: 21, y: 15 } },
                      { side: 'west' as const, cell: { x: 17, y: 24 } },
                      { side: 'east' as const, cell: { x: 21, y: 31 } },
                      { side: 'west' as const, cell: { x: 17, y: 40 } },
                    ]
                  : profile.zoneId === 'couloir-ouest'
                    ? [
                        { side: 'east' as const, cell: { x: 4, y: 12 } },
                        { side: 'west' as const, cell: { x: 0, y: 5 } },
                        { side: 'east' as const, cell: { x: 4, y: 22 } },
                        { side: 'west' as const, cell: { x: 0, y: 30 } },
                        { side: 'east' as const, cell: { x: 4, y: 32 } },
                        { side: 'east' as const, cell: { x: 4, y: 42 } },
                        { side: 'west' as const, cell: { x: 0, y: 42 } },
                      ]
                    : profile.finish.family === 'canteen'
                      ? [
                          { side: 'west' as const, cell: { x: 38, y: 20 } },
                          { side: 'west' as const, cell: { x: 38, y: 28 } },
                          { side: 'south' as const, cell: { x: 47, y: 31 } },
                        ]
                      : profile.finish.family === 'courtyard'
                        ? [
                            { side: 'west' as const, cell: { x: 25, y: 25 } },
                            { side: 'south' as const, cell: { x: 29, y: 31 } },
                          ]
                        : profile.finish.family === 'training'
                          ? [
                              { side: 'west' as const, cell: { x: 25, y: 36 } },
                              { side: 'west' as const, cell: { x: 25, y: 46 } },
                              { side: 'south' as const, cell: { x: 32, y: 50 } },
                              { side: 'south' as const, cell: { x: 46, y: 50 } },
                            ]
                          : profile.finish.family === 'garage'
                            ? [
                                { side: 'west' as const, cell: { x: 29, y: 58 } },
                                { side: 'east' as const, cell: { x: 47, y: 58 } },
                                { side: 'south' as const, cell: { x: 33, y: 62 } },
                              ]
                            : [3, 14, 29, 44].map((y, index) => ({
                                side: index % 2 === 0 ? ('west' as const) : ('east' as const),
                                cell: { y },
                              }));
  for (let index = 0; index < sconceCells.length; index++) {
    const sconce = sconceCells[index]!;
    const wall = walls.find(
      (candidate) =>
        candidate.side === sconce.side &&
        (!('x' in sconce.cell) || candidate.cell.x === sconce.cell.x) &&
        candidate.cell.y === sconce.cell.y,
    );
    if (!wall) continue;
    const root = new THREE.Group();
    root.name = `${profile.zoneId}-wall-light-${index}`;
    const key = `${CELL_KEY(wall.cell.x, wall.cell.y)}:${sconce.side}`;
    root.userData.wallCellKey = CELL_KEY(wall.cell.x, wall.cell.y);
    root.position.copy(wall.center).add(wall.inward.clone().multiplyScalar(WALL_DEPTH / 2 + 0.035));
    root.position.y = Math.min(2.65, wall.height - 0.3);
    const body = new THREE.Mesh(sconceGeometry, sconceMaterial);
    const diffuser = new THREE.Mesh(diffuserGeometry, diffuserMaterial);
    diffuser.position.x = wall.inward.x * 0.11;
    diffuser.position.z = wall.inward.z * 0.11;
    root.add(body, diffuser);
    zone.add(root);
    wallFixtures.push({ root, key });
  }

  const signMaterialBase = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.52,
    metalness: 0.15,
  });
  ownedMaterials.add(signMaterialBase);
  for (const [index, sign] of (profile.finish.signText ?? []).entries()) {
    const side = sign.side ?? (index % 2 === 0 ? 'west' : 'east');
    const layoutCell = architectureLayout?.cells.find(
      (cell) =>
        cell.x === sign.at.x &&
        cell.y === sign.at.y &&
        cell.faces.some((face) => face.roomId === profile.zoneId && face.side === side),
    );
    const wall =
      walls.find(
        (candidate) =>
          candidate.side === side && candidate.cell.x === sign.at.x && candidate.cell.y === sign.at.y,
      ) ??
      (layoutCell
        ? {
            cell: sign.at,
            side,
            axis: layoutCell.axis,
            center: wallWorldCenter(map, layoutCell, wallGeometry, side),
            inward: new THREE.Vector3(
              side === 'west' ? 1 : side === 'east' ? -1 : 0,
              0,
              side === 'north' ? 1 : side === 'south' ? -1 : 0,
            ),
            height: wallGeometry?.get(layoutCell.id)?.height ?? HOLT_EXTERIOR_WALL_HEIGHT,
          }
        : undefined);
    if (!wall) continue;
    const root = new THREE.Group();
    root.name = `${profile.zoneId}-sign-${index}`;
    root.userData.wallCellKey = CELL_KEY(wall.cell.x, wall.cell.y);
    root.position.copy(wall.center).add(wall.inward.clone().multiplyScalar(WALL_DEPTH / 2 + 0.028));
    // Interior door plaques are shorter and sit just under the lowered lintel.
    const shortOpening = layoutCell?.kind === 'opening' && wall.height < HOLT_EXTERIOR_WALL_HEIGHT;
    const plaqueHeight = shortOpening ? 0.12 : 0.32;
    root.position.y =
      layoutCell?.kind === 'opening'
        ? shortOpening
          ? wall.height - plaqueHeight / 2 - 0.01
          : 2.88
        : Math.min(2.15, wall.height - plaqueHeight / 2 - 0.01);
    root.rotation.y =
      side === 'west' ? Math.PI / 2 : side === 'east' ? -Math.PI / 2 : side === 'north' ? 0 : Math.PI;
    const texture = labelTexture(sign.text);
    ownedTextures.add(texture);
    const material = signMaterialBase.clone();
    material.map = texture;
    ownedMaterials.add(material);
    const plaqueGeometry = new THREE.BoxGeometry(0.94, plaqueHeight, 0.045);
    const faceGeometry = new THREE.PlaneGeometry(0.86, shortOpening ? 0.09 : 0.25);
    ownedGeometries.add(plaqueGeometry);
    ownedGeometries.add(faceGeometry);
    const plaque = new THREE.Mesh(plaqueGeometry, materials.get('darkSteel'));
    // The label plane is only 3 mm proud of its borrowed steel plaque.
    const face = new THREE.Mesh(faceGeometry, material);
    face.position.z = 0.027;
    root.add(plaque, face);
    zone.add(root);
    wallFixtures.push({ root, key: `${CELL_KEY(wall.cell.x, wall.cell.y)}:${side}` });
  }

  return { floorMaterial, cuttable, wallFixtures };
}

/**
 * Build the HOLT zone dressing without taking ownership of shared material depots or camera.
 * Profiles declare room/region bounds, surface, local light levels and finish family; each
 * instance owns only its cloned floor textures/materials, generated labels and geometry.
 */
export function createHoltRoomRendering(options: {
  map: ExploreMap;
  dormitoryMaterials: DormitoryMaterials;
  architectureLayout?: HoltArchitectureLayout;
  profiles?: readonly HoltRenderProfile[];
  wallGeometry?: ReadonlyMap<string, HoltWallShape>;
}): HoltRoomRendering {
  const { map, dormitoryMaterials } = options;
  const wallGeometry =
    options.wallGeometry ??
    (options.architectureLayout ? buildHoltWallGeometry(options.architectureLayout) : undefined);
  const profiles = (options.profiles ?? HOLT_RENDER_PROFILES).map((profile) => {
    if (profile.rect || !profile.roomId) return profile;
    const room = map.def.rooms.find((candidate) => candidate.id === profile.roomId);
    return room ? { ...profile, rect: room.rect } : profile;
  });
  const group = new THREE.Group();
  group.name = 'holt-zone-rendering';
  const ownedGeometries = new Set<THREE.BufferGeometry>();
  const ownedMaterials = new Set<THREE.Material>();
  const ownedTextures = new Set<THREE.Texture>();
  const floorMaterials = new Map<string, THREE.MeshStandardMaterial>();
  const zones = new Map<
    string,
    {
      group: THREE.Group;
      profile: HoltRenderProfile;
      cuttable: Array<{ mesh: THREE.InstancedMesh | null; placements: InstancePlacement[] }>;
      wallFixtures: Array<{ root: THREE.Group; key: string }>;
    }
  >();

  for (const profile of profiles) {
    if (!profile.rect) continue;
    const zoneRoot = new THREE.Group();
    zoneRoot.name = `holt-profile-${profile.id}`;
    group.add(zoneRoot);
    const { floorMaterial, cuttable, wallFixtures } = buildZoneFinish(
      zoneRoot,
      map,
      profile,
      dormitoryMaterials,
      options.architectureLayout,
      wallGeometry,
      ownedMaterials,
      ownedGeometries,
      ownedTextures,
    );
    floorMaterials.set(profile.zoneId, floorMaterial);
    zones.set(profile.zoneId, {
      group: zoneRoot,
      profile,
      cuttable,
      wallFixtures,
    });
  }

  // A single reusable local-light pool serves whichever converted zone is occupied.
  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'holt-active-zone-light-pool';
  group.add(lightsGroup);
  const spot = new THREE.SpotLight(0xffd4a4, 0, 22, 0.72, 0.76, 1.15);
  spot.name = 'holt-active-zone-shadow-key';
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.camera.near = 0.5;
  spot.shadow.camera.far = 24;
  spot.shadow.bias = -0.00018;
  spot.shadow.normalBias = 0.025;
  lightsGroup.add(spot, spot.target);
  const fills = [-1, 1].map((side) => {
    const light = new THREE.PointLight(0xb4d4ed, 0, 12, 1.4);
    light.name = `holt-active-zone-fill-${side}`;
    lightsGroup.add(light);
    return light;
  });

  let previousSignature = '';
  let disposed = false;
  function update(state: HoltRoomRenderingState): void {
    if (disposed) return;
    const signature = [
      state.activeZoneId ?? '',
      [...state.discoveredRoomIds].sort().join(','),
      [...state.cutCellKeys].sort().join(','),
      state.night ?? '',
      state.leaderCell ? `${Math.floor(state.leaderCell.x / 2)},${Math.floor(state.leaderCell.y / 2)}` : '',
    ].join('|');
    if (signature === previousSignature) return;
    previousSignature = signature;
    for (const zone of zones.values()) {
      const discovered =
        zone.profile.visibility === 'always' ||
        Boolean(zone.profile.roomId && state.discoveredRoomIds.has(zone.profile.roomId));
      zone.group.visible = discovered;
      for (const fixture of zone.wallFixtures) {
        fixture.root.visible = discovered && !wallKeyIsCut(state.cutCellKeys, zone.profile, fixture.key);
      }
      for (const item of zone.cuttable)
        setPlacementMatrices(item.mesh, item.placements, state.cutCellKeys, zone.profile);
    }
    const candidateZone = state.activeZoneId ? zones.get(state.activeZoneId) : undefined;
    const activeZone =
      candidateZone &&
      (candidateZone.profile.visibility === 'always' ||
        Boolean(candidateZone.profile.roomId && state.discoveredRoomIds.has(candidateZone.profile.roomId)))
        ? candidateZone
        : undefined;
    const active = activeZone !== undefined;
    lightsGroup.visible = active;
    spot.visible = active;
    for (const light of fills) light.visible = active;
    if (!activeZone?.profile.rect) {
      spot.intensity = 0;
      for (const light of fills) light.intensity = 0;
      return;
    }
    const profile = activeZone.profile;
    const rect = profile.rect!;
    const origin = state.leaderCell ?? {
      x: rect.origin.x + (rect.width - 1) / 2,
      y: rect.origin.y + (rect.height - 1) / 2,
    };
    const leadX = origin.x - (map.width - 1) / 2;
    const leadZ = origin.y - (map.height - 1) / 2;
    spot.position.set(leadX - 0.45, 3.15, leadZ - 2.2);
    spot.target.position.set(leadX, 0.03, leadZ + 5.2);
    spot.color.setHex(profile.lighting.keyColor);
    const isNight = state.night !== null;
    const isFlightNight = profile.finish.family === 'training' && state.night === 'fuite';
    spot.intensity = isNight
      ? isFlightNight
        ? 0.8
        : profile.lighting.nightIntensity
      : profile.lighting.dayIntensity;
    if (isFlightNight) spot.color.setHex(0xff8a4c);
    spot.castShadow = profile.finish.family !== 'courtyard' || isNight;
    const daylightWindow = !isNight
      ? options.architectureLayout?.windows
          .filter((window) => window.roomId === profile.zoneId && window.exterior === 'badlands')
          .sort((a, b) => Math.abs(a.cell.y - origin.y) - Math.abs(b.cell.y - origin.y))[0]
      : undefined;
    if (daylightWindow) {
      const architectureCell = options.architectureLayout?.cells.find(
        (cell) =>
          cell.x === daylightWindow.cell.x &&
          cell.y === daylightWindow.cell.y &&
          cell.faces.some(
            (face) => face.roomId === daylightWindow.roomId && face.side === daylightWindow.side,
          ),
      );
      const center = architectureCell
        ? wallWorldCenter(map, architectureCell, wallGeometry, daylightWindow.side)
        : boundaryCell(map, daylightWindow.cell.x, daylightWindow.cell.y, daylightWindow.side);
      const outward =
        daylightWindow.side === 'east'
          ? new THREE.Vector3(1, 0, 0)
          : daylightWindow.side === 'west'
            ? new THREE.Vector3(-1, 0, 0)
            : daylightWindow.side === 'north'
              ? new THREE.Vector3(0, 0, -1)
              : new THREE.Vector3(0, 0, 1);
      spot.position.copy(center).addScaledVector(outward, 2.2);
      spot.position.y = daylightWindow.sillHeight + daylightWindow.height + 0.35;
      spot.target.position.copy(center).addScaledVector(outward, -4.6);
      spot.target.position.y = 0.02;
      spot.intensity = Math.max(profile.lighting.dayIntensity, 32);
    } else {
      spot.position.set(leadX - 0.45, 3.15, leadZ - 2.2);
      spot.target.position.set(leadX, 0.03, leadZ + 5.2);
    }
    const confined = map.def.id === 'conduits';
    const minX = rect.origin.x - (map.width - 1) / 2 - 0.35;
    const maxX = minX + rect.width - 0.3;
    const minZ = rect.origin.y - (map.height - 1) / 2 - 0.35;
    const maxZ = minZ + rect.height - 0.3;
    if (confined) {
      spot.position.x = THREE.MathUtils.clamp(spot.position.x, minX, maxX);
      spot.position.z = THREE.MathUtils.clamp(spot.position.z, minZ, maxZ);
      spot.position.y = 2.12;
      spot.target.position.x = THREE.MathUtils.clamp(spot.target.position.x, minX, maxX);
      spot.target.position.z = THREE.MathUtils.clamp(spot.target.position.z, minZ, maxZ);
      spot.distance = Math.max(4, Math.min(12, Math.max(rect.width, rect.height)));
    }
    for (const [index, light] of fills.entries()) {
      light.position.set(leadX + (index === 0 ? -0.72 : 0.72), 2.05, leadZ + (index === 0 ? -4.5 : 4.5));
      if (confined) {
        light.position.x = THREE.MathUtils.clamp(light.position.x, minX, maxX);
        light.position.z = THREE.MathUtils.clamp(light.position.z, minZ, maxZ);
        light.distance = rect.width <= 3 || rect.height <= 3 ? 3 : 5;
      }
      light.color.setHex(profile.lighting.fillColor);
      light.intensity = isNight
        ? isFlightNight
          ? 0.12
          : profile.lighting.nightFillIntensity
        : profile.lighting.dayFillIntensity;
    }
  }

  return {
    group,
    floorMaterials,
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      spot.shadow.map?.dispose();
      spot.shadow.map = null;
      for (const zone of zones.values()) for (const item of zone.cuttable) item.mesh?.dispose();
      for (const geometry of ownedGeometries) geometry.dispose();
      for (const texture of ownedTextures) texture.dispose();
      for (const material of ownedMaterials) material.dispose();
      ownedGeometries.clear();
      ownedTextures.clear();
      ownedMaterials.clear();
      zones.clear();
      group.clear();
      group.removeFromParent();
    },
  };
}
