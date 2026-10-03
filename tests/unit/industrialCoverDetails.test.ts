import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EnvironmentMaterials } from '@/render/exploration/materials';
import { createIndustrialCoverDetails } from '@/render/exploration/industrialCoverDetails';

afterEach(() => vi.restoreAllMocks());

describe('détails des couvertures industrielles', () => {
  it('reste dans les emprises existantes et ne libère que ses ressources', () => {
    const cells = [
      { x: 0, y: 0, kind: 'container' as const },
      { x: 1, y: 0, kind: 'container' as const },
      { x: 2, y: 0, kind: 'container' as const },
      { x: 0, y: 1, kind: 'container' as const },
      { x: 5, y: 4, kind: 'crate' as const },
    ];
    const borrowedMaterials = new Map<string, THREE.MeshStandardMaterial>();
    const materials = {
      get: (key: string) => {
        let material = borrowedMaterials.get(key);
        if (!material) {
          material = new THREE.MeshStandardMaterial();
          borrowedMaterials.set(key, material);
        }
        return material;
      },
    } as unknown as EnvironmentMaterials;
    const ownedGeometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const instanceDispose = vi.spyOn(THREE.InstancedMesh.prototype, 'dispose');

    const details = createIndustrialCoverDetails({
      cells,
      world: (cell) => ({ x: cell.x, z: cell.y }),
      materials,
    });
    const meshes = details.group.children.filter(
      (child): child is THREE.InstancedMesh => child instanceof THREE.InstancedMesh,
    );
    expect(meshes.length).toBeGreaterThan(0);

    let crateInstances = 0;
    let containerInstances = 0;
    const cellHalfExtent = (kind: 'container' | 'crate') => (kind === 'crate' ? 0.4 : 0.5);
    const coveredArea = (
      bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
      kind: 'container' | 'crate',
    ) =>
      cells
        .filter((cell) => cell.kind === kind)
        .reduce((area, cell) => {
          const half = cellHalfExtent(kind);
          const overlapX = Math.max(
            0,
            Math.min(bounds.maxX, cell.x + half) - Math.max(bounds.minX, cell.x - half),
          );
          const overlapZ = Math.max(
            0,
            Math.min(bounds.maxZ, cell.y + half) - Math.max(bounds.minZ, cell.y - half),
          );
          return area + overlapX * overlapZ;
        }, 0);

    for (const mesh of meshes) {
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();
      const scale = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      for (let index = 0; index < mesh.count; index++) {
        mesh.getMatrixAt(index, matrix);
        matrix.decompose(position, rotation, scale);
        const bounds = {
          minX: position.x - scale.x / 2,
          maxX: position.x + scale.x / 2,
          minZ: position.z - scale.z / 2,
          maxZ: position.z + scale.z / 2,
        };
        const area = scale.x * scale.z;
        const crateArea = coveredArea(bounds, 'crate');
        const containerArea = coveredArea(bounds, 'container');
        const kind = crateArea >= containerArea ? 'crate' : 'container';
        expect(coveredArea(bounds, kind)).toBeCloseTo(area, 5);
        expect(position.y - scale.y / 2).toBeGreaterThanOrEqual(0);
        expect(position.y + scale.y / 2).toBeLessThanOrEqual((kind === 'crate' ? 1 : 2.6) + 1e-6);
        if (kind === 'crate') crateInstances++;
        else containerInstances++;
      }
    }
    expect(crateInstances).toBeGreaterThan(0);
    expect(containerInstances).toBeGreaterThan(0);

    const instanceCount = meshes.length;
    const borrowedDispose = [...borrowedMaterials.values()].map((material) => vi.spyOn(material, 'dispose'));
    details.dispose();
    details.dispose();

    expect(details.group.children).toHaveLength(0);
    expect(instanceDispose).toHaveBeenCalledTimes(instanceCount);
    expect(ownedGeometryDispose).toHaveBeenCalledTimes(1);
    expect(borrowedDispose.every((dispose) => dispose.mock.calls.length === 0)).toBe(true);
  });
});
