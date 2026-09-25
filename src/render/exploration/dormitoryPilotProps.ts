/** Bespoke, shared-geometry kit for the isolated dormitory pilot. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Rng } from '@/core/rng';
import type { ExploreVisualPlacement } from '@/data/exploreVisualTypes';
import type { ExploreDressingFactory } from './dressing';
import { EnvironmentPropFactory } from './props';

const PILOT_MODELS = new Set([
  'bed-cadet',
  'bedside-table',
  'locker-bank',
  'waiting-bench',
  'access-console-bank',
  'pilot-aisle',
]);

export class DormitoryPilotPropFactory implements ExploreDressingFactory {
  private readonly fallback: EnvironmentPropFactory;
  private readonly box = new RoundedBoxGeometry(1, 1, 1, 2, 0.045);
  private readonly hardBox = new THREE.BoxGeometry(1, 1, 1);
  private readonly cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  private readonly materials = {
    frame: new THREE.MeshStandardMaterial({ color: 0x25343b, metalness: 0.5, roughness: 0.43 }),
    frameEdge: new THREE.MeshStandardMaterial({ color: 0x718687, metalness: 0.65, roughness: 0.4 }),
    linen: new THREE.MeshStandardMaterial({ color: 0xddd5c2, roughness: 0.96 }),
    blanket: new THREE.MeshStandardMaterial({ color: 0x243f51, roughness: 0.91 }),
    blanketAlt: new THREE.MeshStandardMaterial({ color: 0x49585c, roughness: 0.93 }),
    warm: new THREE.MeshStandardMaterial({ color: 0xaa7851, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x17252c, roughness: 0.8 }),
    signal: new THREE.MeshStandardMaterial({ color: 0x79bcc1, emissive: 0x204e52, emissiveIntensity: 0.75 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xd9a563, emissive: 0x624422, emissiveIntensity: 0.55 }),
    paint: new THREE.MeshStandardMaterial({
      color: 0x8f8a71,
      roughness: 0.99,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
    }),
    runner: new THREE.MeshStandardMaterial({ color: 0x627573, roughness: 0.98 }),
  } as const;

  constructor(
    private readonly world: (cell: { x: number; y: number }) => { x: number; z: number },
    rng: Rng,
  ) {
    this.fallback = new EnvironmentPropFactory(world, rng);
  }

  private cuboid(
    group: THREE.Group,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    sharp = false,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(sharp ? this.hardBox : this.box, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = sy > 0.04;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  private bed(id: string): THREE.Group {
    const g = new THREE.Group();
    const m = this.materials;
    const personal = id.endsWith('ouest-2');
    const blanket = personal
      ? m.blanket
      : id.endsWith('est-1') || id.endsWith('est-4')
        ? m.blanketAlt
        : m.blanket;
    // The open underframe and chamfered mattress read as a bed from every quarter turn.
    for (const x of [-0.8, 0.8]) this.cuboid(g, m.frame, x, 0.39, 0, 0.075, 0.17, 2.57);
    for (const z of [-1.23, 1.23]) this.cuboid(g, m.frameEdge, 0, 0.39, z, 1.66, 0.095, 0.06);
    for (const x of [-0.7, 0.7])
      for (const z of [-1.14, 1.14]) this.cuboid(g, m.frame, x, 0.22, z, 0.09, 0.43, 0.09);
    this.cuboid(g, m.linen, 0, 0.55, 0, 1.55, 0.22, 2.42);
    this.cuboid(g, blanket, 0, 0.68, 0.47, 1.55, 0.095, 1.38);
    this.cuboid(g, m.frameEdge, 0, 0.72, -1.25, 1.62, 0.9, 0.075);
    this.cuboid(g, m.dark, 0, 0.75, -1.3, 1.36, 0.39, 0.026);
    // Folded pillow, blanket piping and a soft luggage roll at the foot.
    this.cuboid(g, m.linen, 0, 0.74, -0.77, 1.14, 0.13, 0.42);
    this.cuboid(g, m.frameEdge, 0, 0.74, -0.42, 1.5, 0.025, 0.035);
    this.cuboid(g, m.warm, 0, 0.19, 0.86, 1.27, 0.34, 0.55);
    this.cuboid(g, m.dark, 0, 0.2, 1.145, 1.13, 0.23, 0.018);
    this.cuboid(g, m.frameEdge, 0, 0.2, 1.16, 0.07, 0.1, 0.024);
    if (personal) {
      // Franklyn's jacket is laid out ready at the end of his bed.
      this.cuboid(g, m.dark, -0.25, 0.765, 0.84, 0.48, 0.11, 0.34);
      this.cuboid(g, m.amber, -0.25, 0.823, 0.8, 0.2, 0.025, 0.025);
    }
    return g;
  }

  private lockers(id: string): THREE.Group {
    const g = new THREE.Group();
    const m = this.materials;
    for (let i = 0; i < 4; i++) {
      const z = -1.34 + i * 0.89;
      this.cuboid(g, m.frame, 0, 1.05, z, 0.77, 2.1, 0.82);
      this.cuboid(g, m.frameEdge, 0.397, 1.08, z, 0.028, 1.8, 0.68);
      this.cuboid(g, m.dark, 0.415, 1.85, z, 0.015, 0.18, 0.53);
      this.cuboid(g, m.warm, 0.433, 1.85, z, 0.009, 0.09, 0.34);
      this.cuboid(g, m.dark, 0.425, 1.23, z - 0.21, 0.019, 0.26, 0.055);
      this.cuboid(g, m.frameEdge, 0.445, 1.23, z - 0.21, 0.028, 0.11, 0.028);
      for (let slit = 0; slit < 4; slit++)
        this.cuboid(g, m.dark, 0.421, 1.56 - slit * 0.07, z + 0.12, 0.012, 0.019, 0.3, true);
      this.cuboid(
        g,
        i === 1 && id.endsWith('ouest') ? m.signal : m.amber,
        0.426,
        0.31,
        z,
        0.015,
        0.045,
        0.18,
      );
    }
    return g;
  }

  private table(): THREE.Group {
    const g = new THREE.Group();
    const m = this.materials;
    this.cuboid(g, m.frame, 0, 0.32, 0, 0.52, 0.6, 0.48);
    this.cuboid(g, m.warm, 0, 0.64, 0, 0.58, 0.075, 0.53);
    this.cuboid(g, m.dark, 0, 0.36, 0.25, 0.42, 0.17, 0.023);
    this.cuboid(g, m.frameEdge, 0, 0.36, 0.266, 0.08, 0.025, 0.022);
    const lamp = new THREE.Mesh(this.cylinder, m.linen);
    lamp.position.set(0.12, 0.78, -0.1);
    lamp.scale.set(0.15, 0.19, 0.15);
    lamp.castShadow = true;
    g.add(lamp);
    this.cuboid(g, m.amber, 0.12, 0.885, -0.1, 0.24, 0.025, 0.24);
    return g;
  }

  private bench(): THREE.Group {
    const g = new THREE.Group();
    const m = this.materials;
    for (const x of [-1.27, 0, 1.27]) this.cuboid(g, m.frame, x, 0.23, 0, 0.11, 0.43, 0.68);
    this.cuboid(g, m.warm, 0, 0.47, 0, 2.84, 0.1, 0.7);
    for (const x of [-0.85, 0.85]) this.cuboid(g, m.dark, x, 0.53, 0, 0.78, 0.035, 0.6);
    return g;
  }

  private access(): THREE.Group {
    const g = new THREE.Group();
    const m = this.materials;
    this.cuboid(g, m.frame, 0, 0.15, 0, 3.86, 0.3, 0.83);
    for (const x of [-1.42, -0.47, 0.47, 1.42]) {
      this.cuboid(g, m.frameEdge, x, 0.75, 0, 0.72, 0.95, 0.62);
      this.cuboid(g, m.dark, x, 1.18, 0.13, 0.63, 0.29, 0.5);
      this.cuboid(g, m.signal, x, 1.22, 0.39, 0.46, 0.14, 0.016);
      this.cuboid(g, m.amber, x + 0.23, 1.37, 0.1, 0.08, 0.025, 0.08);
    }
    return g;
  }

  private aisle(): THREE.Group {
    const g = new THREE.Group();
    const m = this.materials;
    this.cuboid(g, m.runner, 0, 0.014, 0, 0.89, 0.018, 8.72, true);
    for (const x of [-0.45, 0.45]) this.cuboid(g, m.paint, x, 0.018, 0, 0.035, 0.008, 8.72, true);
    for (const z of [-4.25, 4.25]) this.cuboid(g, m.paint, 0, 0.018, z, 0.93, 0.008, 0.038, true);
    for (const z of [-2.8, 0, 2.8]) this.cuboid(g, m.paint, 0, 0.018, z, 0.32, 0.008, 0.035, true);
    return g;
  }

  create(placement: ExploreVisualPlacement): THREE.Object3D {
    if (!PILOT_MODELS.has(placement.model)) return this.fallback.create(placement);
    const object =
      placement.model === 'bed-cadet'
        ? this.bed(placement.id)
        : placement.model === 'locker-bank'
          ? this.lockers(placement.id)
          : placement.model === 'bedside-table'
            ? this.table()
            : placement.model === 'waiting-bench'
              ? this.bench()
              : placement.model === 'access-console-bank'
                ? this.access()
                : this.aisle();
    const cells = placement.footprint ?? [placement.cell];
    const x = (Math.min(...cells.map((cell) => cell.x)) + Math.max(...cells.map((cell) => cell.x))) / 2;
    const y = (Math.min(...cells.map((cell) => cell.y)) + Math.max(...cells.map((cell) => cell.y))) / 2;
    const world = this.world({ x, y });
    object.position.set(world.x, 0, world.z);
    object.rotation.y = THREE.MathUtils.degToRad(placement.rotation ?? 0);
    if (placement.offset)
      object.position.add(new THREE.Vector3(placement.offset.x, placement.offset.y, placement.offset.z));
    if (placement.scale) object.scale.setScalar(placement.scale);
    return object;
  }

  dispose(): void {
    this.fallback.dispose();
    this.box.dispose();
    this.hardBox.dispose();
    this.cylinder.dispose();
    for (const material of Object.values(this.materials)) material.dispose();
  }
}
