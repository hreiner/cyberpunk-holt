import * as THREE from 'three';
import type { EnvironmentMaterials } from './materials';

export interface IndustrialCoverCell {
  readonly x: number;
  readonly y: number;
  readonly kind: 'container' | 'crate';
}

type CoverMaterial = 'wood' | 'darkMetal' | 'wornMetal' | 'rust';
type Side = 'north' | 'south' | 'east' | 'west';

interface Point2 {
  readonly x: number;
  readonly z: number;
}

interface BorderRun {
  readonly side: Side;
  readonly cells: readonly IndustrialCoverCell[];
}

const CELL_KEY = (cell: Pick<IndustrialCoverCell, 'x' | 'y'>) => `${cell.x},${cell.y}`;
const SIDE_STEPS: Readonly<Record<Side, { x: number; y: number }>> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

function normalize(point: Point2): Point2 {
  const length = Math.hypot(point.x, point.z) || 1;
  return { x: point.x / length, z: point.z / length };
}

function componentGroups(cells: readonly IndustrialCoverCell[]): IndustrialCoverCell[][] {
  const remaining = new Map(cells.map((cell) => [CELL_KEY(cell), cell]));
  const groups: IndustrialCoverCell[][] = [];
  while (remaining.size > 0) {
    const seed = remaining.values().next().value as IndustrialCoverCell;
    remaining.delete(CELL_KEY(seed));
    const group = [seed];
    for (let index = 0; index < group.length; index++) {
      const cell = group[index]!;
      for (const step of Object.values(SIDE_STEPS)) {
        const key = CELL_KEY({ x: cell.x + step.x, y: cell.y + step.y });
        const neighbor = remaining.get(key);
        if (!neighbor) continue;
        remaining.delete(key);
        group.push(neighbor);
      }
    }
    groups.push(group);
  }
  return groups;
}

function exposedRuns(cells: readonly IndustrialCoverCell[], occupied: ReadonlySet<string>): BorderRun[] {
  const lines = new Map<string, IndustrialCoverCell[]>();
  for (const cell of cells) {
    for (const side of Object.keys(SIDE_STEPS) as Side[]) {
      const step = SIDE_STEPS[side];
      if (occupied.has(CELL_KEY({ x: cell.x + step.x, y: cell.y + step.y }))) continue;
      const horizontal = side === 'north' || side === 'south';
      const fixed = horizontal ? cell.y : cell.x;
      const key = `${side}:${fixed}`;
      const line = lines.get(key) ?? [];
      line.push(cell);
      lines.set(key, line);
    }
  }

  const runs: BorderRun[] = [];
  for (const [key, line] of lines) {
    const horizontal = key.startsWith('north:') || key.startsWith('south:');
    line.sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
    let run: IndustrialCoverCell[] = [];
    for (const cell of line) {
      const previous = run[run.length - 1];
      const coordinate = horizontal ? cell.x : cell.y;
      const priorCoordinate = previous && (horizontal ? previous.x : previous.y);
      if (previous && coordinate !== priorCoordinate! + 1) {
        runs.push({ side: key.slice(0, key.indexOf(':')) as Side, cells: run });
        run = [];
      }
      run.push(cell);
    }
    if (run.length) runs.push({ side: key.slice(0, key.indexOf(':')) as Side, cells: run });
  }
  return runs;
}

/** Adds non-solid strapping and edge trim to yard containers and crates. */
export function createIndustrialCoverDetails(options: {
  cells: readonly IndustrialCoverCell[];
  world: (cell: { x: number; y: number }) => { x: number; z: number };
  materials: EnvironmentMaterials;
}): { group: THREE.Group; dispose(): void } {
  const { cells, world, materials } = options;
  const group = new THREE.Group();
  group.name = 'industrial-cover-details';
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const placements = new Map<CoverMaterial, THREE.Matrix4[]>();
  const identity = new THREE.Quaternion();
  let disposed = false;

  const add = (
    material: CoverMaterial,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const matrices = placements.get(material) ?? [];
    matrices.push(
      new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), identity, new THREE.Vector3(sx, sy, sz)),
    );
    placements.set(material, matrices);
  };

  const crates = cells.filter((cell) => cell.kind === 'crate');
  for (const cell of crates) {
    const point = world(cell);
    // Lid boards are surface details only; the caller owns the crate's wooden body.
    for (const offset of [-0.27, -0.09, 0.09, 0.27])
      add('wood', point.x, 0.994, point.z + offset, 0.76, 0.012, 0.105);
    // Two dark straps cross the lid and continue down the front face, within the 0.8 m footprint.
    for (const offset of [-0.24, 0.24]) {
      add('darkMetal', point.x + offset, 0.991, point.z, 0.055, 0.018, 0.76);
      add('darkMetal', point.x + offset, 0.52, point.z - 0.391, 0.055, 0.91, 0.018);
    }
    for (const xSign of [-1, 1])
      for (const ySign of [-1, 1]) {
        add('rust', point.x + xSign * 0.345, 0.84 + ySign * 0.055, point.z - 0.389, 0.075, 0.035, 0.018);
      }
  }

  const containers = cells.filter((cell) => cell.kind === 'container');
  const occupied = new Set(containers.map(CELL_KEY));
  for (const component of componentGroups(containers)) {
    const runs = exposedRuns(component, occupied);
    const cornerKeys = new Set<string>();
    for (const run of runs) {
      const first = run.cells[0]!;
      const last = run.cells[run.cells.length - 1]!;
      const firstPoint = world(first);
      const lastPoint = world(last);
      const normalStep = SIDE_STEPS[run.side];
      const normalPoint = normalize({
        x: world({ x: first.x + normalStep.x, y: first.y + normalStep.y }).x - firstPoint.x,
        z: world({ x: first.x + normalStep.x, y: first.y + normalStep.y }).z - firstPoint.z,
      });
      const horizontal = run.side === 'north' || run.side === 'south';
      const count = run.cells.length;
      const center = {
        x: (firstPoint.x + lastPoint.x) / 2 + normalPoint.x * 0.47,
        z: (firstPoint.z + lastPoint.z) / 2 + normalPoint.z * 0.47,
      };
      const length = Math.max(0.1, count - 0.04);
      for (const height of [0.055, 2.545])
        add(
          'wornMetal',
          center.x,
          height,
          center.z,
          horizontal ? length : 0.06,
          0.055,
          horizontal ? 0.06 : length,
        );

      const tangent = normalize({ x: lastPoint.x - firstPoint.x, z: lastPoint.z - firstPoint.z });
      for (const [endpoint, sign] of [
        [firstPoint, -1],
        [lastPoint, 1],
      ] as const) {
        const x = endpoint.x + normalPoint.x * 0.4625 + tangent.x * sign * 0.4625;
        const z = endpoint.z + normalPoint.z * 0.4625 + tangent.z * sign * 0.4625;
        const cornerKey = `${x.toFixed(3)},${z.toFixed(3)}`;
        if (cornerKeys.has(cornerKey)) continue;
        cornerKeys.add(cornerKey);
        add('darkMetal', x, 1.3, z, 0.075, 2.58, 0.075);
      }
    }

    // One small service latch per connected container block, placed on an exposed face.
    const latchCell = [...component].sort((a, b) => a.y - b.y || a.x - b.x)[0]!;
    const latchSide = (['south', 'east', 'north', 'west'] as const).find((side) => {
      const step = SIDE_STEPS[side];
      return !occupied.has(CELL_KEY({ x: latchCell.x + step.x, y: latchCell.y + step.y }));
    });
    if (latchSide) {
      const point = world(latchCell);
      const step = SIDE_STEPS[latchSide];
      const normal = normalize({
        x: world({ x: latchCell.x + step.x, y: latchCell.y + step.y }).x - point.x,
        z: world({ x: latchCell.x + step.x, y: latchCell.y + step.y }).z - point.z,
      });
      add(
        'rust',
        point.x + normal.x * 0.4825,
        0.58,
        point.z + normal.z * 0.4825,
        normal.z === 0 ? 0.035 : 0.18,
        0.22,
        normal.x === 0 ? 0.035 : 0.18,
      );
    }
  }

  for (const [material, matrices] of placements) {
    const mesh = new THREE.InstancedMesh(unitBox, materials.get(material), matrices.length);
    mesh.name = `industrial-cover-${material}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  return {
    group,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const child of [...group.children]) {
        if (child instanceof THREE.InstancedMesh) child.dispose();
        group.remove(child);
      }
      unitBox.dispose();
      group.clear();
      placements.clear();
    },
  };
}
