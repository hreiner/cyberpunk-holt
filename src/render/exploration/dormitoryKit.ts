/** Geometries partagees pour les lits superposes et le mobilier du dortoir HOLT. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Rng } from '@/core/rng';
import type { DormitoryMaterials, DormitorySurfaceKey } from './dormitoryMaterials';

const BED_WIDTH = 1.8;
const BED_LENGTH = 2.9;
const BED_POST_X = 0.72;
const BED_POST_Z = 1.23;
const BED_POST_HEIGHT = 2.55;
const BED_LEVELS = [0.47, 1.82] as const;
const LADDER_X = 0.5;
const LADDER_Z = 1.3;
const LADDER_BOTTOM = 0.12;
const LADDER_TOP = 2.28;
const LADDER_STEP = 0.28;
const LOCKER_COUNT = 4;
const LOCKER_PITCH = 0.89;

const CONTACT_PLANE_SIZE = 1;

function foldedCoverGeometry(): THREE.BufferGeometry {
  const columns = 34;
  const rows = 48;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const z = (v - 0.5) * BED_LENGTH;
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const x = (u - 0.5) * BED_WIDTH * 0.74;
      // Plis larges et bas : ils restent lisibles a distance de jeu sans creer les grandes
      // plaques claires que produisaient les hautes frequences sous le soleil directionnel.
      const fold =
        0.007 * Math.sin(x * 15 + z * 5) +
        0.012 * Math.sin(z * 9 + x * 3) +
        0.003 * Math.sin(x * 32 + z * 13) +
        0.008 * Math.sin(z * 4) * Math.cos(x * 5);
      positions.push(x, fold, z);
      uvs.push(u * 1.15, v * 1.1);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      // Winding points the fabric normals upward (+Y).
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function hangingCoverGeometry(): THREE.BufferGeometry {
  const columns = 16;
  const rows = 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const y = (v - 0.5) * 0.58;
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const x = (u - 0.5) * BED_LENGTH * 0.57;
      const folds = 0.012 * Math.sin(y * 22 + x * 3) + 0.015 * Math.sin(x * 11 + y * 5);
      positions.push(x, y, folds);
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Chaque objet retourné reste local : origine au sol, avant +Z, dimensions compatibles au catalogue. */
export class DormitoryKit {
  private readonly geometries = new Set<THREE.BufferGeometry>();
  private readonly roundedBox: RoundedBoxGeometry;
  private readonly hardBox: THREE.BoxGeometry;
  private readonly cylinder: THREE.CylinderGeometry;
  private readonly sphere: THREE.SphereGeometry;
  private readonly foldedCover: THREE.BufferGeometry;
  private readonly hangingCover: THREE.BufferGeometry;
  private readonly contactPlane: THREE.PlaneGeometry;
  private disposed = false;

  constructor(
    private readonly materials: DormitoryMaterials,
    private readonly rng: Rng,
  ) {
    this.roundedBox = this.keep(new RoundedBoxGeometry(1, 1, 1, 3, 0.055));
    this.hardBox = this.keep(new THREE.BoxGeometry(1, 1, 1));
    this.cylinder = this.keep(new THREE.CylinderGeometry(1, 1, 1, 12, 1, false));
    this.sphere = this.keep(new THREE.SphereGeometry(1, 12, 8));
    this.foldedCover = this.keep(foldedCoverGeometry());
    this.hangingCover = this.keep(hangingCoverGeometry());
    this.contactPlane = this.keep(new THREE.PlaneGeometry(CONTACT_PLANE_SIZE, CONTACT_PLANE_SIZE));
  }

  /** Lit superposé de 1,8 × 2,9 m : cadre tubulaire, deux couchages, duvet plissé et affaires. */
  bunk(seed = 'dortoir.lit'): THREE.Group {
    this.assertAlive();
    const variation = this.rng.fork(`dormitory-bunk:${seed}`);
    const group = new THREE.Group();
    this.addContact(group, BED_WIDTH, BED_LENGTH);

    for (const x of [-BED_POST_X, BED_POST_X]) {
      for (const z of [-BED_POST_Z, BED_POST_Z]) {
        this.addCylinder(group, 'edgeSteel', x, BED_POST_HEIGHT / 2, z, 0.044, BED_POST_HEIGHT);
        this.addBox(group, 'darkSteel', x, 0.035, z, 0.16, 0.06, 0.16, 0.015);
        this.addSphere(group, 'edgeSteel', x, BED_POST_HEIGHT, z, 0.055);
      }
    }

    for (const level of BED_LEVELS) {
      // Long side rails and the two end rails make the frame readable from each iso rotation.
      for (const x of [-0.7, 0.7]) {
        this.addTube(
          group,
          'edgeSteel',
          new THREE.Vector3(x, level, -1.25),
          new THREE.Vector3(x, level, 1.25),
          0.04,
        );
      }
      for (const z of [-1.25, 1.25]) {
        this.addTube(
          group,
          'edgeSteel',
          new THREE.Vector3(-0.7, level, z),
          new THREE.Vector3(0.7, level, z),
          0.04,
        );
      }
      this.addBox(group, 'steel', 0, level - 0.07, 0, 1.42, 0.1, 2.52, 0.025);
      // Eight slats under each mattress stop the frame reading as a single solid block.
      for (let slat = 0; slat < 8; slat++) {
        const z = -1.02 + slat * (2.04 / 7);
        this.addBox(group, 'darkSteel', 0, level + 0.015, z, 1.34, 0.025, 0.075, 0.008);
      }
      this.addBox(group, 'linen', 0, level + 0.09, 0, 1.36, 0.2, 2.36, 0.06);

      const quilt = new THREE.Mesh(this.foldedCover, this.materials.get('blanket'));
      quilt.position.set(0, level + 0.23, 0.12);
      quilt.scale.set(0.98, 1, 0.57);
      quilt.castShadow = true;
      quilt.receiveShadow = true;
      group.add(quilt);

      // A shaped edge falls over the open side; the mesh is shared across every bunk.
      const drape = new THREE.Mesh(this.hangingCover, this.materials.get('blanket'));
      drape.rotation.y = Math.PI / 2;
      drape.position.set(0.716, level + 0.08, 0.25);
      drape.castShadow = true;
      drape.receiveShadow = true;
      group.add(drape);

      this.addBox(group, 'linen', 0, level + 0.27, -0.86, 0.96 + variation.next() * 0.035, 0.15, 0.43, 0.075);
      // Pillow seams and two folds give a soft silhouette without a unique mesh per bed.
      this.addBox(group, 'linen', 0, level + 0.35, -0.86, 0.71, 0.013, 0.014, 0.004);

      // Small book and sewn piping at the foot, placed inside the 2 × 3-cell footprint.
      this.addBox(group, 'leather', 0.31, level + 0.225, 0.72, 0.24, 0.035, 0.31, 0.008);
      this.addBox(group, 'linen', 0.31, level + 0.247, 0.72, 0.21, 0.012, 0.28, 0.003);
      this.addBox(group, 'edgeSteel', 0, level + 0.31, -0.38, 1.31, 0.025, 0.03, 0.006);
    }

    // Upper guardrails and an integrated end ladder, all below 2.55 m.
    for (const x of [-0.71, 0.71]) {
      this.addTube(
        group,
        'steel',
        new THREE.Vector3(x, 2.28, -0.94),
        new THREE.Vector3(x, 2.28, 0.96),
        0.027,
      );
      this.addTube(
        group,
        'steel',
        new THREE.Vector3(x, 1.99, -0.94),
        new THREE.Vector3(x, 1.99, 0.96),
        0.024,
      );
    }
    for (const z of [-0.94, 0.96]) {
      this.addTube(
        group,
        'steel',
        new THREE.Vector3(-0.71, 2.28, z),
        new THREE.Vector3(0.71, 2.28, z),
        0.027,
      );
    }
    this.addTube(
      group,
      'edgeSteel',
      new THREE.Vector3(LADDER_X - 0.15, LADDER_BOTTOM, LADDER_Z),
      new THREE.Vector3(LADDER_X - 0.15, LADDER_TOP, LADDER_Z),
      0.03,
    );
    this.addTube(
      group,
      'edgeSteel',
      new THREE.Vector3(LADDER_X + 0.15, LADDER_BOTTOM, LADDER_Z),
      new THREE.Vector3(LADDER_X + 0.15, LADDER_TOP, LADDER_Z),
      0.03,
    );
    for (let y = 0.28; y < LADDER_TOP; y += LADDER_STEP) {
      this.addTube(
        group,
        'steel',
        new THREE.Vector3(LADDER_X - 0.15, y, LADDER_Z),
        new THREE.Vector3(LADDER_X + 0.15, y, LADDER_Z),
        0.022,
      );
    }

    // Personal bag, hard case and boots stay over the bed's blocked cells.
    const bagTilt = (variation.next() - 0.5) * 0.08;
    const bag = new THREE.Group();
    bag.position.set(-0.25, 0, -0.42 + variation.next() * 0.16);
    bag.rotation.y = bagTilt;
    this.addBox(bag, 'canvas', 0, 0.21, 0, 0.58, 0.34, 0.4, 0.08);
    this.addBox(bag, 'darkSteel', 0, 0.22, 0.205, 0.28, 0.18, 0.022, 0.018);
    for (const x of [-0.19, 0.19]) {
      this.addBox(bag, 'darkSteel', x, 0.23, 0, 0.035, 0.36, 0.42, 0.008);
      this.addBox(bag, 'brass', x, 0.2, 0.22, 0.05, 0.055, 0.02, 0.006);
    }
    this.addTube(
      bag,
      'darkSteel',
      new THREE.Vector3(-0.12, 0.39, -0.08),
      new THREE.Vector3(0.12, 0.39, -0.08),
      0.018,
    );
    group.add(bag);

    const caseX = 0.27;
    const caseZ = 0.99;
    this.addBox(group, 'steel', caseX, 0.17, caseZ, 0.58, 0.32, 0.36, 0.035);
    this.addBox(group, 'darkSteel', caseX, 0.335, caseZ, 0.59, 0.045, 0.37, 0.014);
    for (const x of [caseX - 0.22, caseX + 0.22]) {
      this.addBox(group, 'edgeSteel', x, 0.18, caseZ, 0.025, 0.28, 0.34, 0.007);
      this.addBox(group, 'brass', x, 0.23, caseZ + 0.19, 0.045, 0.065, 0.02, 0.005);
    }

    for (const x of [-0.12, 0.12]) {
      const shoe = new THREE.Group();
      shoe.position.set(x + 0.43, 0.02, 1.25);
      shoe.rotation.y = x < 0 ? -0.08 : 0.08;
      this.addBox(shoe, 'leather', 0, 0.07, 0, 0.15, 0.13, 0.28, 0.045);
      this.addBox(shoe, 'darkSteel', 0, 0.03, 0.015, 0.155, 0.035, 0.29, 0.012);
      for (let lace = 0; lace < 3; lace++) {
        this.addBox(shoe, 'brass', 0, 0.143, -0.065 + lace * 0.047, 0.085, 0.008, 0.014, 0.003);
      }
      group.add(shoe);
    }

    // A slim HOLT plate on the foot rail, kept inside the declared bed footprint.
    this.addBox(group, 'darkSteel', -0.29, 1.95, 1.279, 0.48, 0.14, 0.02, 0.008);
    this.addBox(group, 'brass', -0.29, 1.95, 1.293, 0.035, 0.055, 0.008, 0.003);
    this.addBox(group, 'brass', -0.22, 1.95, 1.293, 0.035, 0.055, 0.008, 0.003);
    return group;
  }

  /** Banque de quatre casiers, 0,86 × 3,56 m, pour l'emprise declarative 1 × 4. */
  lockerBank(): THREE.Group {
    this.assertAlive();
    const group = new THREE.Group();
    this.addContact(group, 0.9, LOCKER_COUNT * LOCKER_PITCH);
    for (let index = 0; index < LOCKER_COUNT; index++) {
      const z = (index - (LOCKER_COUNT - 1) / 2) * LOCKER_PITCH;
      this.addBox(group, 'darkSteel', 0, 1.27, z, 0.79, 2.48, 0.82, 0.04);
      this.addBox(group, 'steel', 0, 1.28, z, 0.755, 2.43, 0.78, 0.035);
      // Recessed door panel, vents, hinges and the numbered nameplate from the AAA study.
      this.addBox(group, 'darkSteel', 0.392, 1.3, z, 0.018, 2.28, 0.68, 0.012);
      this.addBox(group, 'steel', 0.406, 1.3, z, 0.02, 2.2, 0.62, 0.009);
      this.addBox(group, 'brass', 0.42, 2.36, z, 0.016, 0.085, 0.22, 0.005);
      this.addBox(group, 'darkSteel', 0.423, 2.355, z, 0.012, 0.045, 0.14, 0.003);
      this.addBox(group, 'edgeSteel', 0.427, 1.25, z + 0.23, 0.026, 0.26, 0.05, 0.008);
      this.addBox(group, 'darkSteel', 0.442, 1.25, z + 0.23, 0.012, 0.16, 0.022, 0.004);
      for (const y of [0.5, 2.02]) {
        for (let vent = 0; vent < 5; vent++) {
          this.addBox(group, 'darkSteel', 0.423, y + vent * 0.052, z - 0.08, 0.012, 0.015, 0.34, 0.004);
        }
      }
      for (const y of [0.45, 1.25, 2.16]) {
        this.addBox(group, 'edgeSteel', 0.423, y, z - 0.34, 0.03, 0.1, 0.06, 0.01);
      }
      for (const x of [-0.34, 0.34]) {
        this.addBox(group, 'edgeSteel', x, 0.045, z, 0.075, 0.09, 0.75, 0.02);
      }
    }
    // Continuous top cap and foot plinth tie the four doors into one bank.
    this.addBox(group, 'edgeSteel', 0, 2.56, 0, 0.86, 0.09, 3.58, 0.025);
    this.addBox(group, 'darkSteel', 0, 0.105, 0, 0.82, 0.12, 3.56, 0.02);
    return group;
  }

  /** Banc d'attente en bois et acier, emprise 3 × 1; le linge plié garde la silhouette habitée. */
  bench(): THREE.Group {
    this.assertAlive();
    const group = new THREE.Group();
    this.addContact(group, 2.9, 0.86);
    this.addBox(group, 'wood', 0, 0.62, 0, 2.76, 0.13, 0.72, 0.045);
    this.addBox(group, 'wood', 0, 0.31, -0.29, 2.58, 0.075, 0.13, 0.025);
    for (const x of [-1.2, -0.4, 0.4, 1.2]) {
      this.addBox(group, 'steel', x, 0.3, 0, 0.07, 0.48, 0.62, 0.025);
      this.addBox(group, 'darkSteel', x, 0.095, 0, 0.17, 0.055, 0.68, 0.018);
    }
    for (const x of [-0.93, 0.93]) {
      this.addBox(group, 'darkSteel', x, 0.7, 0, 0.58, 0.035, 0.59, 0.012);
    }
    // Folded sheets, books and a flask echo the lived-in foreground of the reference.
    for (let layer = 0; layer < 3; layer++) {
      this.addBox(
        group,
        layer === 1 ? 'blanket' : 'linen',
        -0.72,
        0.72 + layer * 0.035,
        -0.16,
        0.48,
        0.035,
        0.38,
        0.012,
      );
    }
    this.addBox(group, 'leather', 0.25, 0.705, -0.12, 0.27, 0.035, 0.32, 0.008);
    this.addBox(group, 'linen', 0.25, 0.728, -0.12, 0.24, 0.012, 0.29, 0.003);
    const flask = new THREE.Mesh(this.cylinder, this.materials.get('darkSteel'));
    flask.position.set(0.82, 0.77, 0.2);
    flask.scale.set(0.055, 0.23, 0.055);
    flask.castShadow = true;
    flask.receiveShadow = true;
    group.add(flask);
    this.addBox(group, 'brass', 0.82, 0.89, 0.2, 0.065, 0.025, 0.065, 0.006);
    return group;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const geometry of this.geometries) geometry.dispose();
    this.geometries.clear();
  }

  private keep<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geometries.add(geometry);
    return geometry;
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('DormitoryKit deja libere.');
  }

  private addBox(
    group: THREE.Group,
    material: DormitorySurfaceKey,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    radius = 0,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(radius ? this.roundedBox : this.hardBox, this.materials.get(material));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = sy > 0.035;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  private addCylinder(
    group: THREE.Group,
    material: DormitorySurfaceKey,
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(this.cylinder, this.materials.get(material));
    mesh.position.set(x, y, z);
    mesh.scale.set(radius, height, radius);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  private addTube(
    group: THREE.Group,
    material: DormitorySurfaceKey,
    from: THREE.Vector3,
    to: THREE.Vector3,
    radius: number,
  ): THREE.Mesh {
    const delta = to.clone().sub(from);
    const mesh = new THREE.Mesh(this.cylinder, this.materials.get(material));
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    mesh.scale.set(radius, delta.length(), radius);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  private addSphere(
    group: THREE.Group,
    material: DormitorySurfaceKey,
    x: number,
    y: number,
    z: number,
    radius: number,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(this.sphere, this.materials.get(material));
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(radius);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  private addContact(group: THREE.Group, width: number, depth: number): void {
    const contact = new THREE.Mesh(this.contactPlane, this.materials.get('contact'));
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.008;
    contact.scale.set(Math.min(width, BED_WIDTH), Math.min(depth, BED_LENGTH), 1);
    contact.castShadow = false;
    contact.receiveShadow = false;
    group.add(contact);
  }
}
