/** Kit sémantique partagé du dortoir, de l'académie et du centre d'examen. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Rng } from '@/core/rng';
import type { ExploreVisualPlacement } from '@/data/exploreVisualTypes';
import { EXPLORE_VISUAL_MODELS } from '@/data/exploreVisualModels';
import { EnvironmentMaterials } from './materials';
import { FactoryModels } from './factoryModels';
import { DormitoryKit } from './dormitoryKit';
import { DormitoryMaterials } from './dormitoryMaterials';
import { createFireFlames } from './fireFlames';

class PropGeometryLibrary {
  readonly box = new RoundedBoxGeometry(1, 1, 1, 3, 0.055);
  readonly post = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);
  readonly crown = new THREE.IcosahedronGeometry(0.75, 1);
  readonly leafCard = new THREE.PlaneGeometry(1, 1);
  readonly wheel = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 10);
  readonly drum = new THREE.CylinderGeometry(0.29, 0.29, 0.86, 12);
  readonly tentGable = new THREE.BufferGeometry();
  readonly tentGableOpening = new THREE.BufferGeometry();
  readonly ring = new THREE.TorusGeometry(2.1, 0.07, 6, 40);
  readonly floorCircle = new THREE.RingGeometry(1.92, 2.05, 64);
  readonly routeArrow = new THREE.BufferGeometry();
  /** Tache de contact au sol, réutilisée par les objets suspendus (voir `attachGroundContact`). */
  readonly groundBlob = new THREE.PlaneGeometry(1, 1);
  constructor() {
    this.tentGable.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [-0.8, 0.035, 0, 0.8, 0.035, 0, 0, 1.125, 0, 0.8, 0.035, 0, -0.8, 0.035, 0, 0, 1.125, 0],
        3,
      ),
    );
    this.tentGable.computeVertexNormals();
    this.tentGableOpening.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          -0.8, 0.035, 0, -0.25, 0.035, 0, 0, 1.125, 0, -0.25, 0.035, 0, -0.8, 0.035, 0, 0, 1.125, 0, 0.25,
          0.035, 0, 0.8, 0.035, 0, 0, 1.125, 0, 0.8, 0.035, 0, 0.25, 0.035, 0, 0, 1.125, 0,
        ],
        3,
      ),
    );
    this.tentGableOpening.computeVertexNormals();
    // Chevron pointant vers -Z : c'est la rotation du placement qui choisit la sortie visée.
    this.routeArrow.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, -0.36, -0.34, 0, 0.24, 0.34, 0, 0.24], 3),
    );
    this.routeArrow.computeVertexNormals();
  }
  dispose(): void {
    this.box.dispose();
    this.post.dispose();
    this.crown.dispose();
    this.leafCard.dispose();
    this.wheel.dispose();
    this.drum.dispose();
    this.tentGable.dispose();
    this.tentGableOpening.dispose();
    this.ring.dispose();
    this.floorCircle.dispose();
    this.routeArrow.dispose();
    this.groundBlob.dispose();
  }

  owns(geometry: THREE.BufferGeometry): boolean {
    return (
      geometry === this.box ||
      geometry === this.post ||
      geometry === this.crown ||
      geometry === this.leafCard ||
      geometry === this.wheel ||
      geometry === this.drum ||
      geometry === this.tentGable ||
      geometry === this.tentGableOpening ||
      geometry === this.ring ||
      geometry === this.floorCircle ||
      geometry === this.routeArrow ||
      geometry === this.groundBlob
    );
  }
}
function box(
  group: THREE.Group,
  kit: PropGeometryLibrary,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
): void {
  const mesh = new THREE.Mesh(kit.box, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}
function post(
  group: THREE.Group,
  kit: PropGeometryLibrary,
  material: THREE.Material,
  x: number,
  z: number,
  height: number,
): void {
  const mesh = new THREE.Mesh(kit.post, material);
  mesh.position.set(x, height / 2, z);
  mesh.scale.y = height;
  mesh.castShadow = true;
  group.add(mesh);
}

function addLeafCards(
  parent: THREE.Group,
  kit: PropGeometryLibrary,
  material: THREE.Material,
  cards: readonly { x: number; y: number; z: number; yaw: number; width: number; height: number }[],
): void {
  if (cards.length === 0) return;
  const mesh = new THREE.InstancedMesh(kit.leafCard, material, cards.length);
  mesh.name = 'holt-courtyard-alpha-foliage';
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  cards.forEach((card, index) => {
    position.set(card.x, card.y, card.z);
    rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), card.yaw);
    scale.set(card.width, card.height, 1);
    matrix.compose(position, rotation, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
}
function bed(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  box(group, kit, metal, 0, 0.42, 0, 1.72, 0.12, 2.56);
  box(group, kit, materials.get('linen'), 0, 0.61, -0.1, 1.55, 0.24, 2.32);
  box(group, kit, materials.get('linen'), 0, 0.76, -0.91, 1.36, 0.12, 0.42);
  box(group, kit, materials.get('blanket'), 0, 0.79, 0.38, 1.58, 0.09, 1.18);
  for (const x of [-0.72, 0.72]) for (const z of [-1.05, 1.05]) post(group, kit, metal, x, z, 0.7);
  box(group, kit, materials.get('wornMetal'), 0, 0.35, 1.05, 1.44, 0.55, 0.58);
  box(group, kit, metal, 0, 0.66, 1.05, 1.5, 0.05, 0.64);
  return group;
}
/** Table de chevet : caisson bas, façade de tiroir, petite lampe — sans elle, un lit de cadet fait chambrée nue. */
function bedsideTable(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('wood'), 0, 0.28, 0, 0.5, 0.56, 0.46);
  box(group, kit, materials.get('darkMetal'), 0, 0.32, 0.235, 0.34, 0.2, 0.02);
  const lamp = new THREE.Mesh(kit.drum, materials.get('linen'));
  lamp.scale.set(0.34, 0.32, 0.34);
  lamp.position.set(0, 0.7, 0);
  lamp.castShadow = true;
  group.add(lamp);
  return group;
}
function lockerBank(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  for (const z of [-1.35, -0.45, 0.45, 1.35]) {
    box(group, kit, metal, 0, 1.05, z, 0.76, 2.1, 0.82);
    box(group, kit, materials.get('darkMetal'), 0.4, 1.2, z, 0.025, 1.32, 0.58);
    for (let y = 1.52; y < 1.92; y += 0.12)
      box(group, kit, materials.get('darkMetal'), 0.415, y, z, 0.025, 0.018, 0.42);
  }
  return group;
}
function table(materials: EnvironmentMaterials, kit: PropGeometryLibrary, wide = false): THREE.Group {
  const group = new THREE.Group();
  const width = wide ? 2.45 : 1.65;
  box(group, kit, materials.get('wood'), 0, 0.78, 0, width, 0.14, 1.25);
  for (const x of [-width / 2 + 0.16, width / 2 - 0.16])
    for (const z of [-0.45, 0.45]) post(group, kit, materials.get('darkMetal'), x, z, 0.72);
  return group;
}
/** Table de réfectoire avec ses plateaux-repas : une cantine se lit servie, pas nue. */
function canteenTable(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const width = 1.88;
  const depth = 1.38;
  const steel = materials.get('darkMetal');
  // Thick, eased laminate top on a visible steel apron: a cafeteria table, not a plank.
  box(group, kit, materials.get('warmLaminate'), 0, 0.78, 0, width, 0.15, depth);
  box(group, kit, materials.get('wornMetal'), 0, 0.685, 0, width - 0.14, 0.055, depth - 0.12);
  for (const x of [-width / 2 + 0.18, width / 2 - 0.18]) {
    for (const z of [-depth / 2 + 0.17, depth / 2 - 0.17]) post(group, kit, steel, x, z, 0.68);
  }
  box(group, kit, steel, 0, 0.37, 0, width - 0.44, 0.045, 0.06);
  for (const [x, z] of [
    [-0.48, -0.22],
    [0.36, 0.22],
  ] as const) {
    // Reusable trays and stacked dishes keep the six table tops from reading as bare boards.
    box(group, kit, materials.get('linen'), x, 0.865, z, 0.52, 0.026, 0.36);
    const plate = new THREE.Mesh(kit.drum, materials.get('linen'));
    plate.scale.set(0.3, 0.035, 0.3);
    plate.position.set(x, 0.892, z);
    plate.castShadow = true;
    group.add(plate);
    const meal = new THREE.Mesh(kit.drum, materials.get('warmLaminate'));
    meal.scale.set(0.16, 0.055, 0.16);
    meal.position.set(x, 0.925, z);
    group.add(meal);
    const cup = new THREE.Mesh(kit.drum, materials.get('linen'));
    cup.scale.set(0.09, 0.18, 0.09);
    cup.position.set(x + 0.16, 0.96, z - 0.09);
    cup.castShadow = true;
    group.add(cup);
    box(group, kit, materials.get('wornMetal'), x - 0.14, 0.882, z + 0.02, 0.022, 0.012, 0.2);
  }
  return group;
}
/**
 * Guichet : plateau profond de moins d'un metre, caisson plein cote visiteur.
 * L'agent se tient DERRIERE, sur la case libre du mur — le meuble ne mange donc
 * qu'une seule rangee de cases (emprise 3 x 1 du catalogue).
 */
function receptionDesk(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('wood'), 0, 0.78, 0, 2.86, 0.12, 0.92);
  box(group, kit, materials.get('wornMetal'), 0, 0.4, 0.18, 2.7, 0.76, 0.5);
  box(group, kit, materials.get('darkMetal'), 0.92, 1.05, -0.2, 0.56, 0.4, 0.07);
  box(group, kit, materials.get('cyanSignal'), 0.92, 1.05, -0.25, 0.42, 0.28, 0.012);
  box(group, kit, materials.get('linen'), -0.75, 0.86, -0.08, 0.5, 0.03, 0.36);
  return group;
}
function holtReceptionDesk(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const steel = materials.get('wornMetal');
  // The laminate counter and recessed cabinet stay within the existing three-by-one footprint.
  box(group, kit, materials.get('warmLaminate'), 0, 0.82, 0, 2.86, 0.14, 0.92);
  box(group, kit, steel, 0, 0.42, 0.17, 2.7, 0.72, 0.54);
  box(group, kit, dark, 0, 0.79, 0.455, 2.64, 0.08, 0.035);
  for (const x of [-0.83, 0, 0.83]) {
    box(group, kit, dark, x, 0.49, 0.45, 0.7, 0.23, 0.035);
    box(group, kit, steel, x, 0.49, 0.475, 0.16, 0.035, 0.02);
  }
  // Screen faces the visitor; paper trays and a closed file stack mark a working public counter.
  box(group, kit, dark, 0.87, 1.12, -0.23, 0.58, 0.42, 0.08);
  box(group, kit, materials.get('cyanSignal'), 0.87, 1.12, -0.278, 0.46, 0.3, 0.018);
  box(group, kit, dark, -0.78, 0.94, -0.16, 0.48, 0.035, 0.35);
  box(group, kit, materials.get('linen'), -0.78, 0.99, -0.16, 0.4, 0.035, 0.29);
  box(group, kit, materials.get('warmLaminate'), -0.27, 0.91, -0.14, 0.38, 0.11, 0.3);
  box(group, kit, steel, -0.27, 0.985, -0.14, 0.38, 0.035, 0.3);
  return group;
}
/** Sas de controle : quatre bornes alignees contre un bandeau, lues d'un coup comme un portillon. */
function accessConsoleBank(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  box(group, kit, materials.get('darkMetal'), 0, 0.12, 0, 3.86, 0.24, 0.86);
  for (const x of [-1.42, -0.47, 0.47, 1.42]) {
    box(group, kit, metal, x, 0.62, 0, 0.82, 1.0, 0.62);
    box(group, kit, materials.get('darkMetal'), x, 1.2, -0.12, 0.62, 0.26, 0.38);
    box(group, kit, materials.get('cyanSignal'), x, 1.24, -0.32, 0.46, 0.2, 0.014);
  }
  return group;
}
/**
 * Hauteur de l'ASSISE d'une chaise, en mètres : la face supérieure du plateau ci-dessous
 * (centre 0,50 + demi-épaisseur 0,06). Nommée plutôt que répétée en clair, parce que c'est la
 * cote de référence d'un siège -- ce qu'il faudra viser le jour où un personnage s'y assoira
 * vraiment (la pose `sit` calculée a été retirée, voir `ExplorationPose`).
 */
const CHAIR_SEAT_HEIGHT = 0.56;

function chair(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  box(group, kit, materials.get('wood'), 0, CHAIR_SEAT_HEIGHT - 0.06, 0, 0.62, 0.12, 0.62);
  box(group, kit, materials.get('wood'), 0, 0.87, 0.25, 0.62, 0.66, 0.1);
  for (const x of [-0.22, 0.22]) for (const z of [-0.22, 0.22]) post(group, kit, metal, x, z, 0.48);
  return group;
}
function consoleProp(
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  dormitoryMaterials?: DormitoryMaterials,
): THREE.Group {
  const group = new THREE.Group();
  const steel = dormitoryMaterials?.get('steel') ?? materials.get('containerSteel');
  const edge = dormitoryMaterials?.get('edgeSteel') ?? materials.get('wornMetal');
  const dark = dormitoryMaterials?.get('darkSteel') ?? materials.get('darkMetal');
  const linen = dormitoryMaterials?.get('linen') ?? materials.get('linen');
  const screen = materials.get('cyanSignal');

  // Low welded base and sloped service body read as an industrial control island, not a desk.
  box(group, kit, dark, 0, 0.16, 0.08, 1.72, 0.26, 1.56);
  box(group, kit, steel, 0, 0.53, 0.12, 1.58, 0.54, 1.38);
  box(group, kit, dark, 0, 0.81, 0.1, 1.86, 0.12, 1.58);
  box(group, kit, edge, 0, 0.89, 0.1, 1.82, 0.035, 1.54);
  // Triple low displays face the approach and keep the exit visible above them.
  for (const [index, x] of [-1, 0, 1].entries()) {
    const width = index === 1 ? 0.52 : 0.46;
    const bezel = new THREE.Mesh(kit.box, dark);
    bezel.scale.set(width + 0.075, 0.47, 0.075);
    bezel.position.set(x * 0.53, 1.29, -0.63);
    bezel.rotation.x = -0.12;
    bezel.castShadow = true;
    group.add(bezel);
    const display = new THREE.Mesh(kit.box, materials.get('petrolPaint'));
    display.scale.set(width, 0.37, 0.018);
    display.position.set(x * 0.53, 1.3, -0.681);
    display.rotation.x = -0.12;
    group.add(display);
    // Sparse control readouts: subdued grid lines and status bars, not a bright cyan slab.
    box(group, kit, screen, x * 0.53, 1.39, -0.695, width * 0.74, 0.018, 0.009);
    box(group, kit, linen, x * 0.53 - width * 0.2, 1.25, -0.698, width * 0.32, 0.018, 0.009);
    box(group, kit, dark, x * 0.53 + width * 0.22, 1.2, -0.698, width * 0.16, 0.045, 0.009);
    box(group, kit, edge, x * 0.53, 0.965, -0.34, width * 0.78, 0.045, 0.34);
  }
  // Front service drawers, vented side panels, tactile keys and restrained indicators.
  for (const y of [0.31, 0.57]) {
    box(group, kit, dark, 0, y, -0.595, 0.84, 0.19, 0.045);
    box(group, kit, edge, 0, y + 0.02, -0.626, 0.68, 0.035, 0.018);
    box(group, kit, dark, 0.28, y + 0.02, -0.642, 0.08, 0.025, 0.014);
  }
  for (const x of [-0.69, 0.69]) {
    box(group, kit, dark, x, 0.51, -0.13, 0.14, 0.35, 0.72);
    for (let y = 0.38; y <= 0.64; y += 0.065) box(group, kit, edge, x, y, -0.5, 0.07, 0.018, 0.012);
    box(group, kit, edge, x, 0.97, -0.22, 0.16, 0.08, 0.18);
  }
  box(group, kit, dark, 0, 0.955, 0.38, 0.72, 0.045, 0.3);
  for (let x = -0.26; x <= 0.27; x += 0.13)
    for (const z of [0.29, 0.4]) box(group, kit, edge, x, 0.983, z, 0.07, 0.018, 0.045);
  for (const x of [-0.58, 0.58]) box(group, kit, materials.get('rust'), x, 0.97, 0.54, 0.055, 0.025, 0.035);
  return group;
}
function workbench(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = table(materials, kit, true);
  box(group, kit, materials.get('wornMetal'), 0, 0.92, 0, 2.5, 0.08, 1.3);
  box(group, kit, materials.get('rust'), -0.76, 0.45, 0.02, 0.45, 0.62, 0.88);
  box(group, kit, materials.get('rust'), 0.76, 0.45, 0.02, 0.45, 0.62, 0.88);
  return group;
}
function garageWorkbench(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = table(materials, kit, true);
  const steel = materials.get('containerSteel');
  const dark = materials.get('darkMetal');
  box(group, kit, steel, 0, 0.92, 0, 2.42, 0.08, 1.24);
  for (const x of [-0.72, 0, 0.72]) {
    box(group, kit, dark, x, 0.62, -0.58, 0.62, 0.24, 0.035);
    box(group, kit, materials.get('wornMetal'), x, 0.62, -0.605, 0.16, 0.035, 0.018);
  }
  // A low vise and hand tools make this read as a vehicle service bench at room scale.
  box(group, kit, dark, -0.78, 1.04, 0.26, 0.28, 0.17, 0.25);
  box(group, kit, steel, -0.78, 1.16, 0.26, 0.34, 0.055, 0.3);
  for (const [x, z, yaw] of [
    [-0.1, 0.1, 0.2],
    [0.22, 0.24, -0.28],
    [0.58, -0.16, 0.08],
  ] as const) {
    const tool = new THREE.Mesh(kit.post, materials.get('wornMetal'));
    tool.scale.set(0.045, 0.3, 0.045);
    tool.position.set(x, 1.06, z);
    tool.rotation.z = yaw;
    group.add(tool);
  }
  return group;
}
/**
 * Armoire blindée. Un pavé sombre de 1,7 m ne lit que comme « un cube noir » à
 * la distance isométrique — défaut constaté à l'armurerie sur la première manche
 * de captures. On lui donne donc ce qui fait une armoire : deux battants avec
 * leur refend, un volant de condamnation, des ouïes, un socle en retrait et une
 * casquette de toit qui casse le cube.
 */
function armoredLocker(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const worn = materials.get('wornMetal');
  box(group, kit, dark, 0, 0.09, 0, 1.6, 0.18, 1.6);
  box(group, kit, dark, 0, 1.2, 0, 1.68, 2.12, 1.66);
  // Casquette débordante : l'arête claire qui sort le volume du fond.
  box(group, kit, worn, 0, 2.3, 0.04, 1.84, 0.16, 1.78);
  // Two armored doors, reinforced center seam, ventilation and visible hinge straps.
  for (const x of [-0.42, 0.42]) {
    box(group, kit, worn, x, 1.26, 0.85, 0.74, 1.72, 0.05);
    for (let y = 1.74; y < 2.02; y += 0.11) box(group, kit, dark, x, y, 0.89, 0.54, 0.035, 0.03);
    for (const y of [0.62, 1.9]) {
      box(group, kit, dark, x + (x < 0 ? -0.31 : 0.31), y, 0.9, 0.08, 0.42, 0.06);
      for (const boltY of [y - 0.14, y + 0.14]) {
        const bolt = new THREE.Mesh(kit.drum, worn);
        bolt.rotation.x = Math.PI / 2;
        bolt.scale.set(0.17, 0.08, 0.17);
        bolt.position.set(x + (x < 0 ? -0.31 : 0.31), boltY, 0.94);
        group.add(bolt);
      }
    }
  }
  box(group, kit, dark, 0, 1.26, 0.88, 0.06, 1.8, 0.05);
  // Volant de condamnation et voyant : l'objet dit qu'il est fermé.
  const wheel = new THREE.Mesh(kit.ring, worn);
  wheel.position.set(0.42, 1.12, 0.92);
  wheel.scale.setScalar(0.09);
  group.add(wheel);
  box(group, kit, dark, 0.42, 1.12, 0.9, 0.06, 0.34, 0.05);
  box(group, kit, materials.get('rust'), -0.42, 1.12, 0.9, 0.16, 0.24, 0.025);
  for (const x of [-0.66, 0, 0.66]) box(group, kit, dark, x, 2.16, 0.92, 0.12, 0.11, 0.08);
  return group;
}
/** Armoire de l'ancien centre : format long, forte profondeur, portes renforcées et condamnation mécanique. */
function examSecureLocker(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const steel = materials.get('wornMetal');
  const body = materials.get('containerSteel');
  box(group, kit, dark, 0, 0.12, 0, 1.82, 0.24, 2.62);
  box(group, kit, body, 0, 1.22, 0, 1.72, 2.08, 2.48);
  box(group, kit, steel, 0, 2.31, 0, 1.9, 0.14, 2.7);
  // Two inset doors on the visible service face (-Z), with welded reinforcement rails.
  for (const x of [-0.42, 0.42]) {
    box(group, kit, steel, x, 1.22, -1.27, 0.78, 1.78, 0.055);
    box(group, kit, dark, x, 1.22, -1.31, 0.64, 1.62, 0.025);
    box(group, kit, body, x, 1.22, -1.33, 0.58, 1.55, 0.022);
    for (const y of [0.43, 1.98]) box(group, kit, steel, x, y, -1.36, 0.65, 0.08, 0.055);
    for (const y of [0.58, 1.82]) {
      box(group, kit, dark, x + (x < 0 ? -0.31 : 0.31), y, -1.37, 0.07, 0.3, 0.08);
      for (const bolt of [-0.1, 0.1])
        box(group, kit, steel, x + (x < 0 ? -0.31 : 0.31), y + bolt, -1.42, 0.055, 0.055, 0.025);
    }
    for (let y = 0.76; y < 1.65; y += 0.14) box(group, kit, dark, x, y, -1.37, 0.42, 0.035, 0.026);
  }
  box(group, kit, dark, 0, 1.22, -1.37, 0.08, 1.78, 0.07);
  box(group, kit, steel, 0.43, 1.2, -1.43, 0.18, 0.36, 0.08);
  const wheel = new THREE.Mesh(kit.ring, steel);
  wheel.position.set(0.43, 1.2, -1.48);
  wheel.scale.setScalar(0.08);
  wheel.castShadow = true;
  group.add(wheel);
  box(group, kit, dark, 0.43, 1.2, -1.49, 0.045, 0.28, 0.04);
  box(group, kit, dark, -0.5, 1.42, -1.4, 0.22, 0.42, 0.05);
  box(group, kit, materials.get('petrolPaint'), -0.5, 1.48, -1.435, 0.16, 0.2, 0.018);
  for (const y of [1.28, 1.35]) box(group, kit, steel, -0.5, y, -1.45, 0.12, 0.022, 0.018);
  box(group, kit, materials.get('rust'), -0.5, 1.12, -1.42, 0.12, 0.045, 0.03);
  for (const x of [-0.76, 0.76]) {
    box(group, kit, dark, x, 1.2, 0, 0.08, 1.85, 2.42);
    for (const z of [-0.92, 0, 0.92]) box(group, kit, steel, x, 1.22, z, 0.1, 1.56, 0.045);
    for (const z of [-1.05, 1.05]) box(group, kit, materials.get('rust'), x, 0.45, z, 0.1, 0.16, 0.36);
  }
  return group;
}
/** Poste de securite : plan de travail, bras d'ecran pivotant et siege — une silhouette assise, pas un cube. */
function securityStation(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  box(group, kit, materials.get('wornMetal'), 0, 0.74, -0.42, 1.86, 0.11, 0.86);
  for (const x of [-0.78, 0.78]) box(group, kit, metal, x, 0.36, -0.42, 0.1, 0.72, 0.8);
  // Bras et ecran deportes : la verticale qui distingue ce poste d'une armoire.
  post(group, kit, metal, 0.5, -0.42, 1.36);
  box(group, kit, metal, 0.18, 1.34, -0.42, 0.66, 0.07, 0.07);
  box(group, kit, metal, -0.2, 1.24, -0.4, 0.78, 0.56, 0.08);
  box(group, kit, materials.get('petrolPaint'), -0.2, 1.24, -0.34, 0.62, 0.42, 0.016);
  box(group, kit, materials.get('wornMetal'), -0.2, 1.01, -0.35, 0.48, 0.035, 0.06);
  box(group, kit, materials.get('rust'), 0.34, 1.37, -0.34, 0.08, 0.06, 0.02);
  for (const x of [-0.68, -0.43, -0.18, 0.07, 0.32])
    box(group, kit, materials.get('darkMetal'), x, 0.83, -0.6, 0.16, 0.035, 0.22);
  // Cabinet doors and loose power lead stay inside this already-blocked post footprint.
  for (const x of [-0.48, 0.48]) {
    box(group, kit, materials.get('darkMetal'), x, 0.38, -0.42, 0.55, 0.35, 0.7);
    for (const y of [0.3, 0.48])
      box(group, kit, materials.get('wornMetal'), x + (x < 0 ? 0.22 : -0.22), y, -0.43, 0.04, 0.045, 0.05);
  }
  box(group, kit, materials.get('rust'), 0.3, 0.06, 0.3, 0.52, 0.04, 0.06);
  // Siege recule, dossier tourne vers le plan de travail.
  box(group, kit, materials.get('petrolPaint'), -0.1, 0.46, 0.42, 0.58, 0.1, 0.56);
  box(group, kit, materials.get('petrolPaint'), -0.1, 0.78, 0.66, 0.58, 0.56, 0.1);
  post(group, kit, metal, -0.1, 0.42, 0.44);
  return group;
}
/** Armoire a pharmacie : blanche, vitree, poignee visible — jamais confondue avec une armoire blindee. */
function medicalCabinet(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const steel = materials.get('wornMetal');
  const white = materials.get('linen');
  const dark = materials.get('darkMetal');
  box(group, kit, dark, 0, 0.08, 0, 0.92, 0.16, 0.54);
  box(group, kit, white, 0, 1.02, 0, 0.86, 1.72, 0.48);
  box(group, kit, steel, 0, 1.96, 0, 0.94, 0.1, 0.56);
  for (const y of [0.56, 1.08, 1.6]) {
    box(group, kit, steel, 0, y, 0, 0.78, 0.045, 0.4);
    // Small containers remain visible behind the cabinet's cool frosted doors.
    box(group, kit, materials.get('coldConcrete'), -0.2, y + 0.13, -0.1, 0.22, 0.18, 0.22);
    box(group, kit, materials.get('petrolPaint'), 0.14, y + 0.13, -0.1, 0.18, 0.18, 0.2);
  }
  for (const x of [-0.2, 0.2]) {
    box(group, kit, steel, x, 1.08, -0.254, 0.37, 1.42, 0.025);
    box(group, kit, white, x, 1.08, -0.271, 0.31, 1.34, 0.012);
    box(group, kit, dark, x + (x < 0 ? 0.12 : -0.12), 1.1, -0.29, 0.025, 0.24, 0.022);
  }
  // Restrained red medical cross on the upper door rail.
  box(group, kit, materials.get('rust'), 0.3, 1.88, -0.3, 0.18, 0.045, 0.02);
  box(group, kit, materials.get('rust'), 0.3, 1.88, -0.301, 0.045, 0.18, 0.02);
  return group;
}
function netrunDisplay(
  group: THREE.Group,
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  focused = false,
): void {
  const surfaceZ = z - 0.052;
  box(group, kit, materials.get('darkMetal'), x, y, z, width, height, 0.09);
  box(group, kit, materials.get('petrolPaint'), x, y, surfaceZ, width - 0.11, height - 0.1, 0.016);
  // Sparse vector-like interface marks keep ordinary stations dim; the isolated terminal is brighter.
  const ui = materials.get('cyanSignal');
  const left = x - width / 2 + 0.12;
  const top = y + height / 2 - 0.12;
  box(
    group,
    kit,
    ui,
    left + (width - 0.24) * 0.42,
    top,
    surfaceZ - 0.012,
    (width - 0.24) * 0.84,
    0.022,
    0.012,
  );
  for (let line = 0; line < (focused ? 5 : 3); line++) {
    const lineWidth = (width - 0.28) * (line % 2 === 0 ? 0.62 : 0.38);
    box(
      group,
      kit,
      focused && line === 4 ? materials.get('amberSignal') : ui,
      left + lineWidth / 2,
      top - 0.12 - line * 0.08,
      surfaceZ - 0.013,
      lineWidth,
      0.018,
      0.012,
    );
  }
  if (focused) {
    for (const xOffset of [-0.18, 0, 0.18])
      box(
        group,
        kit,
        materials.get('wornMetal'),
        x + xOffset,
        y - height * 0.16,
        surfaceZ - 0.014,
        0.1,
        0.035,
        0.012,
      );
  }
}
function holtNetrunStation(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const steel = materials.get('wornMetal');
  // Low modular desk, side compute cabinets and a raised dual-display rail fit the original 2x1 cells.
  box(group, kit, dark, 0, 0.53, 0.08, 1.82, 0.92, 0.58);
  box(group, kit, steel, 0, 1.02, -0.02, 1.92, 0.1, 0.72);
  for (const x of [-0.74, 0.74]) {
    box(group, kit, materials.get('petrolPaint'), x, 0.56, 0.08, 0.38, 0.6, 0.5);
    for (let vent = 0; vent < 3; vent++)
      box(group, kit, steel, x, 0.52 + vent * 0.09, 0.342, 0.2, 0.018, 0.014);
  }
  box(group, kit, dark, 0, 1.25, 0.31, 1.78, 0.12, 0.07);
  for (const x of [-0.42, 0.42]) {
    post(group, kit, steel, x, 0.02, 1.42);
    box(group, kit, steel, x, 1.42, -0.12, 0.065, 0.07, 0.34);
    netrunDisplay(group, materials, kit, x, 1.67, -0.3, 0.72, 0.52);
    box(group, kit, dark, x, 1.09, -0.24, 0.66, 0.035, 0.28);
    // A few key blocks and a trackball read as controls without turning the desks into noisy grids.
    for (let key = 0; key < 4; key++)
      box(group, kit, steel, x - 0.2 + key * 0.13, 1.12, -0.26, 0.055, 0.016, 0.07);
    const stool = new THREE.Mesh(kit.drum, materials.get('petrolPaint'));
    stool.scale.set(0.55, 0.15, 0.55);
    stool.position.set(x, 0.52, -0.32);
    group.add(stool);
    const stem = new THREE.Mesh(kit.post, steel);
    stem.scale.set(0.3, 0.48, 0.3);
    stem.position.set(x, 0.27, -0.32);
    group.add(stem);
  }
  // Rear raceway and two drops route data/power to the wall without crossing the aisle.
  box(group, kit, dark, 0, 1.32, 0.4, 1.8, 0.08, 0.08);
  for (const x of [-0.72, 0.72]) {
    const cable = new THREE.Mesh(kit.post, materials.get('wornMetal'));
    cable.scale.set(0.22, 1.2, 0.22);
    cable.position.set(x, 0.66, 0.4);
    group.add(cable);
  }
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = false;
  });
  return group;
}
function holtNetrunTerminal(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const steel = materials.get('wornMetal');
  box(group, kit, dark, 0, 0.27, 0.08, 0.76, 0.48, 0.58);
  box(group, kit, steel, 0, 0.53, 0.08, 0.82, 0.08, 0.64);
  for (const x of [-0.26, 0.26]) {
    box(group, kit, materials.get('petrolPaint'), x, 0.29, 0.385, 0.28, 0.25, 0.018);
    box(group, kit, steel, x, 0.3, 0.4, 0.12, 0.022, 0.014);
  }
  post(group, kit, steel, 0, 0.02, 1.1);
  box(group, kit, dark, 0, 1.24, -0.08, 0.9, 0.76, 0.1);
  netrunDisplay(group, materials, kit, 0, 1.24, -0.145, 0.8, 0.64, true);
  box(group, kit, materials.get('darkMetal'), 0, 0.82, -0.12, 0.76, 0.04, 0.32);
  for (let key = 0; key < 5; key++)
    box(group, kit, materials.get('cyanSignal'), -0.24 + key * 0.12, 0.85, -0.14, 0.045, 0.014, 0.055);
  // One small amber state lamp distinguishes the narrative terminal without lighting the room.
  box(group, kit, materials.get('amberSignal'), 0.31, 0.62, 0.4, 0.08, 0.035, 0.025);
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = false;
  });
  return group;
}
function medicalBed(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  const dark = materials.get('darkMetal');
  box(group, kit, dark, 0, 0.55, 0, 0.88, 0.12, 1.7);
  box(group, kit, metal, 0, 0.64, 0, 0.92, 0.1, 1.76);
  box(group, kit, materials.get('linen'), 0, 0.79, -0.02, 0.82, 0.2, 1.54);
  box(group, kit, materials.get('blanket'), 0, 0.91, 0.26, 0.78, 0.045, 0.76);
  box(group, kit, materials.get('linen'), 0, 0.91, -0.58, 0.42, 0.08, 0.32);
  box(group, kit, materials.get('coldConcrete'), 0, 1.05, 0.83, 0.84, 0.48, 0.08);
  box(group, kit, metal, 0, 0.91, 0.89, 0.68, 0.05, 0.06);
  // Low side rails and control housings; the center remains open to the patient.
  for (const x of [-0.39, 0.39]) {
    for (const z of [-0.47, 0.46]) post(group, kit, dark, x, z, 0.3);
    box(group, kit, metal, x, 1.02, -0.005, 0.045, 0.045, 0.94);
    box(group, kit, dark, x, 0.91, 0.75, 0.1, 0.14, 0.16);
  }
  // Four recessed casters keep the frame grounded and within the existing one-by-two footprint.
  for (const x of [-0.32, 0.32])
    for (const z of [-0.69, 0.69]) {
      const caster = new THREE.Mesh(kit.wheel, dark);
      caster.rotation.z = Math.PI / 2;
      caster.scale.setScalar(0.52);
      caster.position.set(x, 0.29, z);
      caster.castShadow = true;
      group.add(caster);
    }
  // A slim IV stand rises at the head against the wall rather than over the center aisle.
  post(group, kit, metal, 0.27, 0.82, 2.0);
  box(group, kit, metal, 0.27, 1.94, 0.82, 0.48, 0.045, 0.045);
  for (const x of [0.12, 0.42]) {
    box(group, kit, materials.get('coldConcrete'), x, 1.62, 0.82, 0.16, 0.26, 0.12);
    box(group, kit, metal, x, 1.76, 0.82, 0.19, 0.025, 0.14);
  }
  box(group, kit, dark, 0.27, 0.04, 0.82, 0.42, 0.06, 0.42);
  return group;
}
function medicalWorkbench(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const steel = materials.get('containerSteel');
  const dark = materials.get('darkMetal');
  const white = materials.get('linen');
  box(group, kit, dark, 0, 0.46, 0.08, 2.78, 0.8, 1.56);
  box(group, kit, steel, 0, 0.91, 0.04, 2.92, 0.12, 1.72);
  // Cabinet fronts, pulls and clean toe-kick make it read as a clinic bench, not a shop table.
  for (const x of [-0.92, 0, 0.92]) {
    box(group, kit, materials.get('coldConcrete'), x, 0.47, 0.875, 0.82, 0.62, 0.035);
    box(group, kit, dark, x, 0.48, 0.9, 0.18, 0.035, 0.025);
  }
  box(group, kit, dark, 0, 0.12, 0.08, 2.7, 0.12, 1.48);
  // Integrated shallow wash basin, single tap and a small supply tray.
  box(group, kit, dark, -0.86, 0.985, 0.08, 0.68, 0.025, 0.58);
  box(group, kit, steel, -0.86, 1.0, 0.08, 0.56, 0.018, 0.46);
  box(group, kit, white, -0.86, 1.006, 0.08, 0.39, 0.012, 0.3);
  post(group, kit, steel, -0.86, -0.1, 1.23);
  box(group, kit, steel, -0.72, 1.22, -0.1, 0.28, 0.035, 0.035);
  box(group, kit, materials.get('coldConcrete'), 0.82, 1.02, -0.22, 0.52, 0.1, 0.34);
  box(group, kit, white, 0.82, 1.08, -0.22, 0.42, 0.035, 0.28);
  box(group, kit, materials.get('petrolPaint'), 0.36, 1.02, 0.36, 0.28, 0.16, 0.22);
  box(group, kit, dark, 0.36, 1.12, 0.36, 0.18, 0.025, 0.14);
  // A compact instrument arm is a solid medical fixture, not an added light source.
  const arm = new THREE.Mesh(kit.post, steel);
  arm.scale.set(0.18, 0.24, 0.18);
  arm.position.set(1.12, 1.1, -0.36);
  group.add(arm);
  box(group, kit, steel, 1.12, 1.25, -0.36, 0.34, 0.08, 0.2);
  return group;
}
function maintenanceWorkbench(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const steel = materials.get('containerSteel');
  const worn = materials.get('wornMetal');
  const dark = materials.get('darkMetal');
  box(group, kit, dark, 0, 0.46, 0.08, 2.82, 0.78, 1.62);
  box(group, kit, steel, 0, 0.91, 0.04, 2.94, 0.12, 1.76);
  box(group, kit, dark, 0, 0.12, 0.08, 2.75, 0.12, 1.5);
  for (const x of [-0.93, 0, 0.93]) {
    box(group, kit, worn, x, 0.48, 0.91, 0.82, 0.62, 0.045);
    box(group, kit, dark, x, 0.5, 0.943, 0.18, 0.04, 0.02);
    box(group, kit, steel, x, 0.78, 0.92, 0.82, 0.04, 0.035);
  }
  // A compact meter, fuse trays and a cable reel make the service bench legible at isometric scale.
  box(group, kit, dark, -0.86, 1.045, -0.34, 0.52, 0.18, 0.38);
  box(group, kit, materials.get('petrolPaint'), -0.86, 1.14, -0.35, 0.36, 0.025, 0.2);
  for (const x of [-1.01, -0.86, -0.71])
    box(group, kit, materials.get('rust'), x, 1.02, -0.12, 0.035, 0.025, 0.035);
  for (let fuse = 0; fuse < 4; fuse++) {
    const x = -0.18 + fuse * 0.16;
    box(group, kit, worn, x, 1.03, -0.28, 0.12, 0.08, 0.16);
    box(group, kit, materials.get('linen'), x, 1.08, -0.28, 0.045, 0.025, 0.08);
  }
  const reel = new THREE.Mesh(kit.drum, dark);
  reel.rotation.x = Math.PI / 2;
  reel.scale.set(0.6, 0.44, 0.6);
  reel.position.set(0.92, 1.12, -0.32);
  group.add(reel);
  const woundLead = new THREE.Mesh(kit.ring, worn);
  woundLead.scale.setScalar(0.1);
  woundLead.position.set(0.92, 1.12, -0.32);
  group.add(woundLead);
  for (const x of [0.28, 0.52])
    box(group, kit, materials.get('coldConcrete'), x, 1.03, 0.31, 0.16, 0.11, 0.16);
  // Rear wireway aligns with the new wall-mounted service runs rather than crossing the aisle.
  box(group, kit, dark, 0, 1.24, 0.74, 2.5, 0.08, 0.08);
  return group;
}
function weaponRack(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  const steel = materials.get('wornMetal');
  box(group, kit, metal, 0, 1.08, 0.02, 1.78, 2.12, 0.12);
  for (const x of [-0.82, 0.82]) {
    post(group, kit, steel, x, 0.04, 2.24);
    box(group, kit, metal, x, 0.1, -0.06, 0.22, 0.2, 0.22);
  }
  for (const y of [0.46, 1.02, 1.72, 2.08]) {
    box(group, kit, steel, 0, y, -0.13, 1.72, 0.075, 0.16);
    for (const x of [-0.72, 0.72]) box(group, kit, metal, x, y, -0.23, 0.08, 0.13, 0.12);
  }
  // Five matte training tasers sit in separated clips, with a visible cartridge and grip.
  for (let index = 0; index < 5; index++) {
    const x = -0.62 + index * 0.31;
    box(group, kit, materials.get('petrolPaint'), x, 1.35, -0.24, 0.22, 0.1, 0.09);
    box(group, kit, steel, x + 0.02, 1.4, -0.3, 0.18, 0.045, 0.045);
    box(group, kit, metal, x - 0.015, 1.23, -0.22, 0.075, 0.18, 0.09);
    box(group, kit, materials.get('rust'), x + 0.06, 1.35, -0.295, 0.045, 0.055, 0.024);
    box(group, kit, steel, x, 1.2, -0.16, 0.13, 0.045, 0.07);
  }
  // Numbered inventory plates and capped fixing bolts keep the rack institutional, not improvised.
  for (let index = 0; index < 5; index++) {
    const x = -0.62 + index * 0.31;
    box(group, kit, metal, x, 0.73, -0.22, 0.24, 0.17, 0.035);
    box(group, kit, materials.get('rust'), x, 0.73, -0.242, 0.055, 0.025, 0.012);
  }
  for (const x of [-0.72, 0.72])
    for (const y of [0.22, 2.0]) {
      const fastener = new THREE.Mesh(kit.drum, steel);
      fastener.rotation.x = Math.PI / 2;
      fastener.scale.set(0.15, 0.07, 0.15);
      fastener.position.set(x, y, -0.1);
      group.add(fastener);
    }
  return group;
}
function shelves(materials: EnvironmentMaterials, kit: PropGeometryLibrary, servers = false): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  if (servers) {
    const steel = materials.get('wornMetal');
    const panel = materials.get('petrolPaint');
    for (const x of [-0.84, 0.84]) {
      post(group, kit, metal, x, 0.08, 2.28);
      box(group, kit, steel, x, 0.09, 0.08, 0.2, 0.18, 0.88);
      box(group, kit, steel, x, 2.21, 0.08, 0.2, 0.12, 0.88);
    }
    for (const z of [-0.32, 0.42]) {
      for (const x of [-0.84, 0.84]) box(group, kit, steel, x, 0.06, z, 0.2, 0.12, 0.16);
    }
    for (let tier = 0; tier < 4; tier++) {
      const y = 0.4 + tier * 0.58;
      box(group, kit, steel, 0, y, 0.02, 1.68, 0.07, 0.82);
      for (const x of [-0.43, 0.43]) {
        box(group, kit, metal, x, y + 0.27, -0.18, 0.72, 0.43, 0.46);
        box(group, kit, panel, x, y + 0.27, -0.418, 0.63, 0.33, 0.018);
        // Vents, drive bays and dull status marks read as hardware without emitting light.
        for (let vent = 0; vent < 4; vent++)
          box(group, kit, steel, x - 0.19 + vent * 0.12, y + 0.21, -0.432, 0.055, 0.018, 0.012);
        for (let drive = 0; drive < 2; drive++) {
          box(group, kit, metal, x - 0.12 + drive * 0.24, y + 0.35, -0.433, 0.18, 0.065, 0.012);
          box(
            group,
            kit,
            materials.get('rust'),
            x - 0.17 + drive * 0.24,
            y + 0.27,
            -0.435,
            0.024,
            0.024,
            0.012,
          );
        }
      }
      for (const x of [-0.72, 0.72]) box(group, kit, metal, x, y + 0.08, -0.28, 0.045, 0.13, 0.1);
    }
    // Top cable tray remains behind the rack rather than floating over the central aisle.
    box(group, kit, metal, 0, 2.36, 0.39, 1.58, 0.08, 0.1);
    return group;
  }
  for (const x of [-0.52, 0.52]) post(group, kit, metal, x, 0, 2.25);
  for (const y of [0.42, 0.95, 1.48, 2.01]) {
    box(group, kit, materials.get('wornMetal'), 0, y, 0, 1.28, 0.07, 0.72);
    box(group, kit, materials.get('wood'), -0.2, y + 0.12, -0.1, 0.58, 0.25, 0.45);
  }
  return group;
}
function holtArchiveShelves(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  const shelf = materials.get('wornMetal');
  for (const x of [-0.84, 0.84]) {
    for (const z of [-0.32, 0.32]) post(group, kit, metal, x, z, 2.15);
    box(group, kit, shelf, x, 1.08, 0, 0.12, 2.08, 0.78);
    for (const y of [0.2, 2.0]) box(group, kit, shelf, x, y, 0, 0.2, 0.12, 0.82);
  }
  for (let tier = 0; tier < 4; tier++) {
    const y = 0.38 + tier * 0.52;
    box(group, kit, shelf, 0, y, 0, 1.72, 0.07, 0.72);
    for (let file = 0; file < 5; file++) {
      const x = -0.6 + file * 0.3;
      const height = 0.28 + (file % 2) * 0.04;
      box(
        group,
        kit,
        file % 2 ? materials.get('wood') : materials.get('coldConcrete'),
        x,
        y + height / 2 + 0.04,
        -0.08,
        0.24,
        height,
        0.42,
      );
      box(group, kit, metal, x, y + 0.12, -0.301, 0.17, 0.08, 0.018);
      box(group, kit, materials.get('linen'), x, y + 0.12, -0.313, 0.11, 0.035, 0.012);
    }
    if (tier === 1 || tier === 3) {
      for (const x of [-0.48, 0.48]) {
        box(group, kit, materials.get('petrolPaint'), x, y + 0.16, 0.14, 0.36, 0.26, 0.32);
        box(group, kit, shelf, x, y + 0.3, -0.03, 0.36, 0.025, 0.32);
      }
    }
  }
  return group;
}
function transformer(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const steel = materials.get('wornMetal');
  const coil = materials.get('rust');
  box(group, kit, dark, 0, 0.12, 0, 1.76, 0.2, 1.5);
  box(group, kit, steel, 0, 0.24, 0, 1.66, 0.08, 1.42);
  // Heavy side frames and the central casing support two visible winding assemblies.
  for (const x of [-0.75, 0.75]) {
    post(group, kit, dark, x, 0.05, 2.08);
    box(group, kit, steel, x, 1.08, 0, 0.13, 1.72, 1.38);
    for (let fin = 0; fin < 7; fin++)
      box(group, kit, dark, x + (x < 0 ? -0.075 : 0.075), 0.6 + fin * 0.16, 0, 0.045, 0.045, 1.12);
  }
  box(group, kit, dark, 0, 1.05, 0, 0.52, 1.58, 1.26);
  for (const x of [-0.43, 0.43]) {
    const bobbin = new THREE.Mesh(kit.drum, steel);
    bobbin.scale.set(0.82, 1.55, 0.82);
    bobbin.position.set(x, 1.12, 0);
    group.add(bobbin);
    for (const y of [0.58, 0.82, 1.06, 1.3, 1.54]) {
      box(group, kit, coil, x, y, -0.25, 0.42, 0.055, 0.045);
      box(group, kit, coil, x, y, 0.25, 0.42, 0.055, 0.045);
      box(group, kit, coil, x - 0.2, y, 0, 0.045, 0.055, 0.46);
      box(group, kit, coil, x + 0.2, y, 0, 0.045, 0.055, 0.46);
    }
  }
  // Three ceramic bushings and a covered, labelled terminal panel complete the service face.
  for (const x of [-0.55, 0, 0.55]) {
    for (const y of [1.99, 2.08, 2.17]) {
      const insulator = new THREE.Mesh(kit.drum, materials.get('linen'));
      insulator.scale.set(0.5, 0.13, 0.5);
      insulator.position.set(x, y, -0.05);
      group.add(insulator);
    }
    box(group, kit, steel, x, 2.27, -0.05, 0.22, 0.07, 0.2);
  }
  box(group, kit, steel, 0, 1.0, -0.68, 0.42, 0.82, 0.06);
  box(group, kit, dark, 0, 1.0, -0.72, 0.32, 0.66, 0.025);
  box(group, kit, coil, 0, 1.21, -0.738, 0.1, 0.045, 0.015);
  for (const y of [0.72, 0.86, 1.0, 1.14, 1.28]) box(group, kit, steel, 0, y, -0.741, 0.2, 0.018, 0.012);
  for (const x of [-0.65, 0.65])
    for (const y of [0.42, 1.86]) {
      const bolt = new THREE.Mesh(kit.drum, steel);
      bolt.rotation.x = Math.PI / 2;
      bolt.scale.set(0.13, 0.055, 0.13);
      bolt.position.set(x, y, -0.7);
      group.add(bolt);
    }
  return group;
}
function examDeskProp(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const wood = materials.get('wood');
  const steel = materials.get('darkMetal');
  box(group, kit, wood, 0, 0.74, -0.16, 0.88, 0.12, 0.6);
  box(group, kit, materials.get('wornMetal'), 0, 0.665, -0.16, 0.82, 0.035, 0.52);
  for (const x of [-0.31, 0.31]) for (const z of [-0.24, 0.24]) post(group, kit, steel, x, z - 0.16, 0.7);
  // Feuille d'examen, formulaire carbone et stylo : lecture de salle active à l'échelle du pupitre.
  box(group, kit, materials.get('linen'), -0.06, 0.82, -0.2, 0.48, 0.018, 0.36);
  box(group, kit, materials.get('linen'), 0.18, 0.824, -0.12, 0.16, 0.012, 0.21);
  box(group, kit, materials.get('darkMetal'), 0.29, 0.835, -0.2, 0.028, 0.015, 0.32);
  box(group, kit, materials.get('containerSteel'), 0.35, 0.83, -0.37, 0.16, 0.04, 0.09);
  // Siege recule dans la meme case : le pupitre tient honnetement dans un metre.
  box(group, kit, steel, 0, 0.43, 0.32, 0.6, 0.1, 0.36);
  box(group, kit, steel, 0, 0.68, 0.46, 0.6, 0.4, 0.08);
  return group;
}
/**
 * Fourgon. Silhouette en DEUX masses (cabine basse à l'avant, caisson haut à
 * l'arrière) plutôt qu'un seul pavé : à la distance isométrique, un bloc unique
 * ne se distingue pas d'une armoire couchée. Le pare-brise et le bandeau de toit
 * donnent l'avant, les passages de roue donnent l'échelle.
 */
function van(
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  glass: THREE.MeshStandardMaterial,
  abandoned = false,
  dormitoryMaterials?: DormitoryMaterials,
): THREE.Group {
  const group = new THREE.Group();
  const body =
    !abandoned && dormitoryMaterials ? dormitoryMaterials.get('steel') : materials.get('containerSteel');
  const dark =
    !abandoned && dormitoryMaterials ? dormitoryMaterials.get('darkSteel') : materials.get('darkMetal');
  const edge =
    !abandoned && dormitoryMaterials ? dormitoryMaterials.get('edgeSteel') : materials.get('wornMetal');
  const headlamp = dormitoryMaterials?.get('linen') ?? materials.get('linen');
  // Châssis et caisson arrière.
  box(group, kit, dark, 0, 0.44, 0.1, 2.42, 0.42, 4.2);
  box(group, kit, body, 0, 1.36, 0.62, 2.36, 1.64, 3.0);
  // One roof plane runs from the windscreen to the rear doors. This keeps the cab joined to
  // the cargo body instead of reading as a separate low box with an open top.
  box(group, kit, body, 0, 2.12, 0.06, 2.32, 0.12, 4.0);
  // The nose rises into a real sloped windscreen. Its top leans back toward the cargo bay.
  box(group, kit, body, 0, 1.05, -1.35, 2.34, 0.9, 1.16);
  const windshield = new THREE.Mesh(kit.box, glass);
  windshield.scale.set(1.82, 0.62, 0.035);
  windshield.position.set(0, 1.75, -1.94);
  windshield.rotation.x = 0.46;
  windshield.castShadow = false;
  group.add(windshield);
  // Narrow A-pillars and a lower cowl frame the glass on the continuous cab roof.
  for (const x of [-0.96, 0.96]) {
    const pillar = new THREE.Mesh(kit.box, edge);
    pillar.scale.set(0.075, 0.72, 0.075);
    pillar.position.set(x, 1.75, -1.94);
    pillar.rotation.x = 0.46;
    group.add(pillar);
  }
  box(group, kit, edge, 0, 1.44, -2.07, 1.94, 0.08, 0.06);
  // Cab side windows sit between the windscreen and the cargo body; the tall rear glazing
  // makes the cargo volume read as a van while the front panes identify the driver's cab.
  for (const side of [-1, 1]) {
    const x = side * 1.19;
    box(group, kit, dark, x, 1.94, 0.74, 0.035, 0.43, 1.05);
    box(group, kit, glass, x + side * 0.02, 1.94, 0.74, 0.018, 0.34, 0.9);
    box(group, kit, dark, x, 1.56, -1.24, 0.035, 0.48, 0.74);
    box(group, kit, glass, x + side * 0.02, 1.57, -1.24, 0.018, 0.36, 0.58);
    box(group, kit, dark, x, 1.31, -0.72, 0.035, 1.08, 0.04);
    box(group, kit, edge, x + side * 0.03, 1.28, -0.47, 0.025, 0.07, 0.28);
    box(group, kit, dark, x, 1.88, 1.55, 0.045, 0.46, 0.055);
  }
  // Hood, grille and bumper form a clear front face beneath the glass.
  box(group, kit, body, 0, 1.11, -1.71, 1.96, 0.36, 0.36);
  box(group, kit, dark, 0, 1.11, -1.91, 0.9, 0.25, 0.035);
  for (const y of [1.04, 1.11, 1.18]) box(group, kit, edge, 0, y, -1.936, 0.74, 0.025, 0.018);
  for (const x of [-0.84, 0.84]) {
    box(group, kit, abandoned ? materials.get('rust') : headlamp, x, 1.17, -1.91, 0.3, 0.18, 0.055);
    box(group, kit, dark, x, 1.0, -1.92, 0.24, 0.045, 0.05);
  }
  box(group, kit, dark, 0, 0.78, -2.02, 2.4, 0.2, 0.16);
  box(group, kit, edge, 0, 0.79, -2.11, 0.82, 0.06, 0.025);
  // Rampe lumineuse de toit : c'est ce qui dit « police » de loin.
  box(group, kit, dark, 0, 2.24, -1.3, 1.5, 0.16, 0.34);
  box(
    group,
    kit,
    abandoned ? materials.get('rust') : materials.get('alarmRed'),
    -0.38,
    2.24,
    -1.3,
    0.48,
    0.12,
    0.3,
  );
  box(group, kit, abandoned ? edge : materials.get('cyanSignal'), 0.38, 2.24, -1.3, 0.48, 0.12, 0.3);
  for (const x of [-1.18, 1.18])
    for (const z of [-1.28, 1.42]) {
      const wheel = new THREE.Mesh(kit.wheel, dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.3, z);
      wheel.castShadow = true;
      group.add(wheel);
      const hub = new THREE.Mesh(kit.drum, edge);
      hub.rotation.z = Math.PI / 2;
      hub.scale.set(0.24, 0.13, 0.24);
      hub.position.set(x * 1.01, 0.3, z);
      group.add(hub);
      box(group, kit, body, x * 0.94, 0.78, z, 0.16, 0.46, 0.86);
    }
  if (abandoned) {
    const steel = materials.get('wornMetal');
    const rust = materials.get('rust');
    // Faded service markings, inset glazing and tired hardware distinguish the old exam
    // shuttle from the clean police vans used elsewhere on the academy map.
    for (const side of [-1, 1]) {
      const xSide = side * 1.18;
      box(group, kit, dark, xSide, 1.92, 0.58, 0.035, 0.48, 2.38);
      box(group, kit, steel, xSide + side * 0.022, 1.92, 0.58, 0.02, 0.37, 2.2);
      for (const z of [-0.1, 1.2]) box(group, kit, dark, xSide + side * 0.036, 1.92, z, 0.012, 0.28, 0.035);
      box(group, kit, rust, xSide, 0.72, 0.58, 0.06, 0.12, 2.62);
      box(group, kit, steel, side * 1.23, 1.08, 0.06, 0.06, 0.055, 0.42);
      for (const z of [-1.55, 1.66]) {
        box(group, kit, dark, side * 1.2, 0.71, z, 0.08, 0.31, 0.58);
        box(group, kit, rust, side * 1.25, 0.71, z, 0.025, 0.18, 0.3);
      }
    }
    box(group, kit, dark, 0, 0.64, -2.16, 2.48, 0.2, 0.16);
    box(group, kit, steel, 0, 0.82, -2.2, 1.18, 0.055, 0.06);
    for (const x of [-0.86, 0.86]) {
      box(group, kit, steel, x, 1.09, -1.92, 0.24, 0.16, 0.06);
      box(group, kit, dark, x, 1.1, -1.96, 0.15, 0.09, 0.018);
      box(group, kit, rust, x * 1.1, 1.98, -1.38, 0.34, 0.08, 0.16);
    }
  }
  return group;
}
function securityPanel(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 1.1, 0, 0.46, 1.5, 0.16);
  box(group, kit, materials.get('cyanSignal'), 0, 1.32, -0.09, 0.3, 0.46, 0.018);
  box(group, kit, materials.get('rust'), 0.12, 0.65, -0.1, 0.12, 0.16, 0.02);
  return group;
}
function punchingBag(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  post(group, kit, materials.get('darkMetal'), 0, 0, 2.55);
  const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.2, 12), materials.get('rust'));
  bag.position.y = 1.55;
  bag.castShadow = true;
  group.add(bag);
  box(group, kit, materials.get('wornMetal'), 0, 0.98, 0, 0.5, 0.06, 0.5);
  return group;
}
/** Conduite de service ; la variante centre la plaque au mur et garde le même profil. */
function pipeRun(materials: EnvironmentMaterials, kit: PropGeometryLibrary, isCentre: boolean): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  if (isCentre) {
    // The old centre keeps its service run on the perimeter wall, with short brackets and
    // collars; no ceiling drops cross the player's sightline.
    box(group, kit, materials.get('darkMetal'), 0, 2.38, 0.25, 3.8, 0.42, 0.08);
    box(group, kit, metal, 0, 2.28, -0.02, 3.7, 0.18, 0.18);
    for (const x of [-1.38, -0.46, 0.46, 1.38]) {
      const collar = new THREE.Mesh(kit.ring, materials.get('darkMetal'));
      collar.rotation.y = Math.PI / 2;
      collar.scale.setScalar(0.055);
      collar.position.set(x, 2.28, -0.02);
      group.add(collar);
      box(group, kit, metal, x, 2.28, 0.14, 0.08, 0.06, 0.34);
    }
    return group;
  }
  box(group, kit, metal, 0, 2.34, 0, 3.85, 0.18, 0.18);
  for (const x of [-1.35, -0.45, 0.45, 1.35]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.028, 6, 10), materials.get('darkMetal'));
    collar.rotation.y = Math.PI / 2;
    collar.position.set(x, 2.34, 0);
    group.add(collar);
  }
  // Suspentes courtes vers le plafond, pas des poteaux : elles montent, elles ne descendent pas.
  for (const x of [-1.6, 1.6]) box(group, kit, materials.get('darkMetal'), x, 2.66, 0, 0.06, 0.52, 0.06);
  return group;
}

/** Conduite de quatre mètres ancrée contre une paroi, pour garder libres les plafonds bas. */
function conduitWallRun(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  const bracket = materials.get('darkMetal');
  box(group, kit, bracket, 0, 2.34, -0.42, 3.82, 0.2, 0.08);
  box(group, kit, metal, 0, 2.27, -0.29, 3.72, 0.18, 0.22);
  for (const x of [-1.38, -0.46, 0.46, 1.38]) {
    const collar = new THREE.Mesh(kit.ring, bracket);
    collar.rotation.y = Math.PI / 2;
    collar.scale.setScalar(0.055);
    collar.position.set(x, 2.27, -0.29);
    group.add(collar);
    box(group, kit, bracket, x, 2.27, -0.16, 0.08, 0.06, 0.34);
  }
  return group;
}
/**
 * Réglette : c'est une LUMIÈRE, donc le tube émissif doit primer et le corps
 * rester mince. Un boîtier épais vu de dessus en isométrie ne lit que comme une
 * barre noire suspendue — défaut constaté sur la première manche de captures.
 *
 * Passe C (matières et lumière) : elle porte maintenant une vraie `THREE.PointLight`, pas
 * seulement un matériau émissif -- ADR 0018 "un émissif seul n'éclaire pas les surfaces
 * voisines" (EXPLORATION-VISUAL-DESIGN.md). Portée courte, pas d'ombre projetée (une de plus
 * coûterait cher pour un gain minime à cette échelle) : c'est la lumière la moins chère qui
 * obtient l'effet. Elle est enfant du groupe du placement, donc `ExploreDressing.syncVisibility`
 * l'éteint gratuitement avec la pièce (objet masqué = lumière ignorée par le renderer).
 * Climat différent par lieu : blanc froid institutionnel à l'académie, cyan plus sourd et plus
 * faible au centre ("ce qui marche encore", pas une ambiance uniforme).
 */
function stripLight(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  // Slim wall-mounted fixture with a weak cyan pool: no suspended hardware over the room.
  box(group, kit, materials.get('darkMetal'), 0, 2.42, 0.25, 1.56, 0.22, 0.08);
  box(group, kit, materials.get('wornMetal'), 0, 2.43, 0.13, 1.42, 0.1, 0.16);
  box(group, kit, materials.get('cyanSignal'), 0, 2.38, -0.015, 1.28, 0.1, 0.045);
  for (const x of [-0.58, 0.58]) box(group, kit, materials.get('darkMetal'), x, 2.43, 0.07, 0.08, 0.18, 0.12);
  box(group, kit, materials.get('rust'), 0.56, 2.38, -0.04, 0.12, 0.1, 0.012);
  const light = new THREE.PointLight(0x49c7d6, 0.82, 2.9, 2);
  light.position.set(0, 2.34, -0.08);
  group.add(light);
  return group;
}
/**
 * Gyrophare mural. La platine, la potence et le fourreau qui remonte au mur sont
 * indispensables : sans eux, le globe rouge flotte en l'air au milieu de la
 * pièce, sans rien dessous — défaut constaté au hall du centre sur la manche de
 * captures. Ce modèle se pose donc TOUJOURS sur une case au contact d'un mur.
 */
/**
 * Gyrophare mural. Porte désormais une vraie lumière (voir `stripLight`) : "une balise pose
 * une lueur" (ADR 0018). Rouge et rare par construction -- une poignée d'instances par carte
 * (UI-DESIGN-SYSTEM.md "le rouge est rare" : la règle vaut d'abord pour l'encre du HUD, mais la
 * même discipline s'applique ici, on ne sème pas de rouge partout).
 */
function warningBeacon(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  // Platine et fourreau plaqués au mur, côté +Z (l'arrière du modèle).
  box(group, kit, materials.get('wornMetal'), 0, 1.72, 0.42, 0.34, 0.9, 0.09);
  box(group, kit, dark, 0, 1.1, 0.44, 0.13, 1.5, 0.11);
  // Potence qui déporte le gyrophare hors du mur.
  box(group, kit, dark, 0, 2.02, 0.16, 0.1, 0.1, 0.62);
  box(group, kit, dark, 0, 1.94, -0.08, 0.4, 0.14, 0.34);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), materials.get('alarmRed'));
  globe.position.set(0, 2.14, -0.08);
  group.add(globe);
  box(group, kit, dark, 0, 2.3, -0.08, 0.3, 0.09, 0.28);
  const light = new THREE.PointLight(0xff4a3c, 0.95, 3.2, 2);
  light.position.set(0, 2.14, -0.08);
  group.add(light);
  return group;
}
function equipmentCage(
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  abandoned = false,
): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  for (const x of [-0.64, 0.64]) for (const z of [-0.4, 0.4]) post(group, kit, metal, x, z, 2.35);
  for (const y of [0.3, 1.1, 2.15]) box(group, kit, materials.get('wornMetal'), 0, y, 0, 1.45, 0.055, 0.98);
  box(
    group,
    kit,
    abandoned ? materials.get('rust') : materials.get('amberSignal'),
    0,
    1.38,
    -0.5,
    0.82,
    0.42,
    0.025,
  );
  if (abandoned) {
    const steel = materials.get('wornMetal');
    // Mesh frontage, hanging hooks and bolted shelf lips keep the old stores cage legible.
    for (const x of [-0.48, -0.24, 0, 0.24, 0.48]) box(group, kit, steel, x, 1.22, -0.43, 0.018, 1.78, 0.025);
    for (const x of [-0.42, -0.14, 0.14, 0.42]) {
      box(group, kit, metal, x, 0.68, -0.46, 0.045, 0.36, 0.04);
      box(group, kit, steel, x, 0.48, -0.48, 0.12, 0.035, 0.04);
      box(group, kit, materials.get('containerSteel'), x, 1.9, 0, 0.18, 0.28, 0.52);
    }
    for (const y of [0.3, 1.1, 2.15])
      for (const x of [-0.55, 0.55]) box(group, kit, steel, x, y + 0.05, -0.52, 0.08, 0.035, 0.06);
    box(group, kit, steel, 0, 2.28, 0, 1.54, 0.09, 1.08);
    for (const x of [-0.64, 0.64]) box(group, kit, materials.get('rust'), x, 0.09, 0, 0.2, 0.12, 0.2);
  }
  return group;
}
/** Banc du hall désaffecté : assise à lames métalliques, jambes rivetées et dossier écaillé. */
function examWaitingBench(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const steel = materials.get('wornMetal');
  const dark = materials.get('darkMetal');
  const rust = materials.get('rust');
  for (const x of [-1.18, -0.4, 0.4, 1.18]) {
    box(group, kit, dark, x, 0.32, 0.02, 0.09, 0.58, 0.52);
    box(group, kit, steel, x, 0.08, 0.02, 0.2, 0.12, 0.64);
    box(group, kit, rust, x, 0.06, 0.02, 0.11, 0.035, 0.52);
  }
  for (const z of [-0.18, 0.18]) box(group, kit, dark, 0, 0.53, z, 2.72, 0.09, 0.08);
  for (let x = -1.28; x <= 1.28; x += 0.64) {
    box(group, kit, steel, x, 0.72, 0.08, 0.6, 0.1, 0.62);
    box(group, kit, steel, x, 0.91, 0.29, 0.6, 0.42, 0.08);
  }
  // Exposed bolt heads and the one surviving end cap add scale without cluttering the walk lane.
  for (const x of [-1.2, -0.4, 0.4, 1.2])
    for (const z of [-0.2, 0.2]) box(group, kit, dark, x, 0.78, z, 0.055, 0.055, 0.055);
  box(group, kit, rust, 1.34, 0.93, 0.29, 0.12, 0.24, 0.1);
  return group;
}
function k9CourseGate(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const steel = materials.get('wornMetal');
  for (const x of [-0.72, 0.72]) {
    post(group, kit, dark, x, 0, 2.15);
    box(group, kit, steel, x, 0.07, 0, 0.28, 0.14, 0.58);
    box(group, kit, materials.get('rust'), x, 2.12, 0, 0.22, 0.12, 0.22);
  }
  box(group, kit, steel, 0, 1.72, 0, 1.7, 0.13, 0.16);
  box(group, kit, dark, 0, 1.45, 0, 1.56, 0.08, 0.12);
  for (const x of [-0.52, -0.17, 0.17, 0.52])
    box(group, kit, materials.get('rust'), x, 1.6, 0, 0.055, 0.22, 0.18);
  box(group, kit, materials.get('rust'), 0, 0.23, 0, 1.95, 0.18, 0.85);
  return group;
}
function gasRack(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  for (const x of [-0.38, 0.38]) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1.45, 10),
      materials.get('coldConcrete'),
    );
    tank.position.set(x, 0.82, 0);
    tank.castShadow = true;
    group.add(tank);
    box(group, kit, materials.get('alarmRed'), x, 1.48, 0, 0.3, 0.08, 0.3);
  }
  box(group, kit, materials.get('darkMetal'), 0, 0.16, 0, 1.1, 0.16, 0.6);
  return group;
}
/** Encadrement ajouré : rend un seuil de progression lisible sans remplir sa case traversable. */
function examDoorPortal(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const frame = materials.get('wornMetal');
  for (const x of [-0.44, 0.44]) box(group, kit, frame, x, 1.3, 0, 0.12, 2.6, 0.16);
  box(group, kit, frame, 0, 2.48, 0, 1.05, 0.15, 0.16);
  // Lecteur incliné, posé contre le montant : la traversée reste visuellement ouverte.
  box(group, kit, materials.get('darkMetal'), 0.54, 1.13, -0.06, 0.16, 0.55, 0.12);
  box(group, kit, materials.get('amberSignal'), 0.54, 1.27, -0.13, 0.08, 0.16, 0.018);
  // Plaque de seuil sans texte : le code couleur reste lisible en vue isométrique sans dessiner de typographie dans le canvas.
  box(group, kit, materials.get('amberSignal'), 0, 2.2, -0.1, 0.92, 0.28, 0.028);
  box(group, kit, materials.get('darkMetal'), 0, 2.2, -0.125, 0.5, 0.055, 0.015);
  box(group, kit, materials.get('cyanSignal'), 0, 2.37, -0.14, 0.76, 0.055, 0.02);
  const warning = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), materials.get('alarmRed'));
  warning.position.set(-0.56, 2.18, -0.08);
  group.add(warning);
  return group;
}
/** Marquage peint au sol : donne une fonction à une zone vide sans créer d'obstacle ni de cible de clic. */
function hazardFloorZone(
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  isCentre: boolean,
): THREE.Group {
  const group = new THREE.Group();
  const paint = materials.get(isCentre ? 'wornMetal' : 'amberPaint');
  for (let x = -1.05; x <= 1.05; x += 0.42) {
    box(group, kit, paint, x, 0.022, 0, 0.18, 0.022, 1.7);
  }
  for (const z of [-0.94, 0.94]) box(group, kit, materials.get('darkMetal'), 0, 0.026, z, 2.65, 0.02, 0.08);
  return group;
}
/** Banque technique haute : une masse de maintenance lisible depuis l'autre bout d'une salle. */
function industrialServiceBank(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const casing = materials.get('wornMetal');
  for (const x of [-0.88, 0, 0.88]) {
    box(group, kit, casing, x, 1.28, 0, 0.78, 2.56, 0.46);
    box(group, kit, materials.get('darkMetal'), x, 1.42, -0.25, 0.58, 1.42, 0.025);
  }
  box(group, kit, materials.get('darkMetal'), 0, 2.48, 0.03, 2.78, 0.18, 0.64);
  box(group, kit, materials.get('cyanSignal'), -0.88, 1.58, -0.275, 0.36, 0.54, 0.016);
  box(group, kit, materials.get('amberSignal'), 0.88, 1.58, -0.275, 0.36, 0.54, 0.016);
  for (const x of [-1.1, 1.1]) post(group, kit, materials.get('darkMetal'), x, 0.22, 2.72);
  return group;
}
/**
 * Enclos cynophile : grillage sur trois côtés, porte ouverte, niche au fond.
 * C'est la silhouette qui raconte le chien AVANT qu'on le voie — une cage
 * ajourée ne se confond avec aucune des armoires pleines du centre.
 */
function kennelRun(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  const dark = materials.get('darkMetal');
  for (const x of [-1.4, -0.45, 0.45, 1.4]) post(group, kit, dark, x, -0.85, 1.85);
  for (const x of [-1.4, 1.4]) post(group, kit, dark, x, 0.75, 1.85);
  // Trois panneaux de grillage : fond et deux joues. Le quatrième côté reste ouvert.
  box(group, kit, metal, 0, 1.78, -0.85, 2.9, 0.09, 0.07);
  box(group, kit, metal, 0, 0.9, -0.85, 2.9, 0.06, 0.06);
  for (let x = -1.3; x <= 1.3; x += 0.26) box(group, kit, metal, x, 0.92, -0.85, 0.035, 1.78, 0.035);
  for (const x of [-1.4, 1.4]) {
    box(group, kit, metal, x, 1.78, -0.05, 0.07, 0.09, 1.65);
    for (let z = -0.7; z <= 0.65; z += 0.26) box(group, kit, metal, x, 0.92, z, 0.035, 1.78, 0.035);
  }
  // Porte grillagée battue vers l'extérieur : l'enclos est vide, et ça se voit.
  box(group, kit, dark, -1.05, 0.92, 0.95, 0.06, 1.7, 0.06);
  box(group, kit, dark, -0.45, 0.92, 1.28, 0.06, 1.7, 0.06);
  box(group, kit, metal, -0.75, 1.72, 1.12, 0.72, 0.07, 0.07);
  // Niche et gamelle : l'échelle d'un animal, pas d'un casier.
  box(group, kit, materials.get('rust'), 0.72, 0.36, -0.42, 1.05, 0.72, 0.78);
  box(group, kit, dark, 0.72, 0.36, -0.03, 0.42, 0.6, 0.06);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.1, 10), materials.get('rust'));
  bowl.position.set(-0.85, 0.05, 0.25);
  group.add(bowl);
  return group;
}
/** Fûts : des cylindres, seule silhouette ronde du décor industriel — repère immédiat. */
function barrelStack(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const tints = ['rust', 'amberSignal', 'petrolPaint', 'wornMetal'] as const;
  const layout: Array<[number, number, number]> = [
    [-0.36, 0.43, -0.36],
    [0.36, 0.43, -0.36],
    [-0.36, 0.43, 0.36],
    [0.36, 0.43, 0.36],
    [0, 1.29, -0.05],
  ];
  layout.forEach(([x, y, z], index) => {
    const mesh = new THREE.Mesh(
      kit.drum,
      materials.get(tints[index % tints.length] as (typeof tints)[number]),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    box(group, kit, materials.get('darkMetal'), x, y + 0.2, z, 0.61, 0.05, 0.61);
  });
  return group;
}
/** Caisses sur palette : des angles nets et du bois, contre les cylindres et les tôles. */
function crateStack(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const wood = materials.get('wood');
  for (const z of [-0.5, 0, 0.5]) box(group, kit, wood, 0, 0.06, z, 1.72, 0.12, 0.22);
  box(group, kit, materials.get('rust'), -0.38, 0.52, -0.06, 0.92, 0.8, 1.42);
  box(group, kit, wood, 0.46, 0.4, 0.2, 0.78, 0.56, 0.9);
  box(group, kit, wood, 0.42, 0.94, -0.26, 0.66, 0.52, 0.72);
  box(group, kit, materials.get('darkMetal'), -0.38, 0.92, -0.06, 0.96, 0.06, 1.46);
  box(group, kit, materials.get('amberSignal'), -0.38, 0.62, -0.79, 0.38, 0.26, 0.02);
  return group;
}
/** Pylône de signalisation : une lecture verticale de l'accès et du danger, sans microtexte 3D. */
function signalPylon(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  post(group, kit, materials.get('darkMetal'), 0, 0, 2.9);
  box(group, kit, materials.get('wornMetal'), 0, 1.55, -0.04, 0.62, 1.72, 0.22);
  box(group, kit, materials.get('alarmRed'), 0, 2.06, -0.16, 0.42, 0.28, 0.02);
  box(group, kit, materials.get('cyanSignal'), 0, 1.42, -0.16, 0.42, 0.58, 0.02);
  box(group, kit, materials.get('amberSignal'), 0, 0.91, -0.16, 0.42, 0.24, 0.02);
  box(group, kit, materials.get('darkMetal'), 0, 0.12, 0, 0.92, 0.16, 0.72);
  return group;
}
/**
 * Casier ouvert de Franklyn : porte entrouverte penchée contre la rangée, sac de sport et
 * vêtement plié au pied. C'est le fantôme du dortoir (`OBJECT_COLOR` flottant, aucun modèle
 * dédié) devenu lisible -- "les traces personnelles des cadets" (EXPLORATION-VISUAL-DESIGN.md
 * §1). Posé sur une case franchissable (occupancy `flat`) : bas et hors de l'allée, on marche
 * à côté, jamais au travers d'un meuble plein qui n'existe pas ici.
 */
function personalLocker(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('wornMetal'), -0.26, 0.58, -0.36, 0.46, 1.14, 0.04);
  box(group, kit, materials.get('petrolPaint'), 0.2, 0.14, -0.06, 0.44, 0.26, 0.24);
  box(group, kit, materials.get('darkMetal'), 0.2, 0.29, -0.06, 0.28, 0.045, 0.15);
  box(group, kit, materials.get('linen'), -0.08, 0.045, 0.26, 0.32, 0.055, 0.22);
  return group;
}
/**
 * Grille de sol technique, au pied des transformateurs : le second fantôme (entité
 * "Écouter le local technique" sans modèle dédié). Basse et posée, elle ne prétend pas être un
 * meuble -- juste le repère au sol d'un point d'écoute, cohérent avec le bourdonnement du texte.
 */
function floorVent(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 0.02, 0, 0.6, 0.03, 0.42);
  for (let x = -0.22; x <= 0.22; x += 0.11)
    box(group, kit, materials.get('wornMetal'), x, 0.032, 0, 0.035, 0.012, 0.36);
  return group;
}

/* -- Habillage de nuit (holt-nuit, lot 5.8b) : le bal, puis la fuite --------------------- */

/**
 * Table de buffet du bal : le plateau large de `table()`, couronne d'une piece montee (trois
 * caissons decroissants, glacage clair) et de deux bouteilles -- "gateaux et boissons sur la
 * table" (GAME-DESIGN scene 2). Primitives seules, aucun asset externe.
 */
function buffetTable(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const wood = materials.get('wood');
  // Plateau compact : une seule case (comme `exam-desk`), pas le large plateau de `table()` --
  // `holt-nuit` pose ces tables sur d'anciennes cases de pupitre (1 x 1 m).
  box(group, kit, wood, 0, 0.74, 0, 0.86, 0.1, 0.58);
  for (const x of [-0.34, 0.34])
    for (const z of [-0.22, 0.22]) post(group, kit, materials.get('darkMetal'), x, z, 0.7);
  const icing = materials.get('linen');
  const cake = materials.get('warmLaminate');
  box(group, kit, cake, -0.2, 0.87, 0, 0.34, 0.14, 0.32);
  box(group, kit, icing, -0.2, 0.945, 0, 0.28, 0.03, 0.26);
  box(group, kit, cake, -0.2, 1.0, 0, 0.22, 0.1, 0.2);
  box(group, kit, icing, -0.2, 1.06, 0, 0.16, 0.025, 0.15);
  const bottle = new THREE.Mesh(kit.drum, materials.get('petrolPaint'));
  bottle.scale.set(0.14, 0.34, 0.14);
  bottle.position.set(0.26, 0.96, 0.1);
  bottle.castShadow = true;
  group.add(bottle);
  return group;
}

/**
 * Guirlande de lampions : un fil tendu (deux ancrages au plafond) et une rangee de petits
 * lampions colores, chacun sa propre teinte emissive -- pas de nouvelle lumiere reelle par
 * lampion (le budget d'appels de dessin resterait tenu, mais celui de la boucle d'eclairage du
 * shader grimperait vite, ADR 0018 §Consequences) : une SEULE `PointLight` chaude au centre du
 * fil suffit a lire "lumiere de fete", le reste est emissif seulement.
 */
function partyStringLights(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const wire = materials.get('darkMetal');
  box(group, kit, wire, 0, 2.48, 0, 2.9, 0.02, 0.02);
  // Palette plus colorée (revue du 2026-09-26, "plus de guirlandes visibles") : amber/cyan
  // alternés avec deux lampions rouges au lieu d'un seul -- se lit comme une vraie guirlande de
  // fête, pas une simple rangée de points ambre.
  const lanternColors = ['amberSignal', 'cyanSignal', 'alarmRed', 'cyanSignal', 'amberSignal'] as const;
  lanternColors.forEach((colorKey, index) => {
    const x = -1.2 + index * 0.6;
    const sag = 0.05 + Math.abs(index - (lanternColors.length - 1) / 2) * -0.03;
    const lantern = new THREE.Mesh(kit.drum, materials.get(colorKey));
    lantern.scale.set(0.16, 0.22, 0.16);
    lantern.position.set(x, 2.48 - 0.16 - sag, 0);
    group.add(lantern);
  });
  // Portee et intensite relevees (0.9/3.4 -> 1.35/4.6, revue du 2026-09-26, "un ou deux spots
  // colores au-dessus du centre") : cette lumiere doit se lire comme un spot de piste, pas
  // seulement comme l'accent d'un luminaire de couloir (ADR 0018 -- toujours locale, toujours
  // sans ombre, toujours gratuite quand la piece se ferme).
  const light = new THREE.PointLight(0xffb37a, 1.35, 4.6, 2);
  light.position.set(0, 2.16, 0);
  group.add(light);
  return group;
}

/**
 * Pupitre renverse : les memes planches que `examDeskProp`, basculees sur le flanc -- "John et
 * Grover renversent les tables" (`ch2.slow.json`). Occupancy `flat` (ADR 0026, `holt-nuit` n'a
 * aucune entite `entrainement.pupitre-*` : rien ne bloque le passage ici, la case reste
 * franchissable comme avant, seule sa lecture change).
 */
function deskOverturned(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const wood = materials.get('wood');
  box(group, kit, wood, 0, 0.3, 0, 0.6, 0.9, 0.12);
  box(group, kit, materials.get('darkMetal'), -0.22, 0.62, 0.18, 0.05, 0.62, 0.05);
  box(group, kit, materials.get('darkMetal'), 0.22, 0.62, 0.18, 0.05, 0.62, 0.05);
  box(group, kit, materials.get('linen'), 0, 0.14, 0.08, 0.44, 0.03, 0.34);
  group.rotation.z = Math.PI / 2 - 0.32;
  group.position.y = -0.02;
  return group;
}

/**
 * Lueur au sol sous une porte bloquee par le feu (`fuite.porte-cour-ouest/est`) : embrasement
 * plat, sans relief (`flat`, franchissable -- la porte elle-meme reste bloquante, verite
 * portee par `MapDef`/`EntityDef.locked`, jamais par ce placement, ADR 0017). Sa `PointLight`
 * est reperee et animee par `ExploreDressing.tick` (vacillement, jamais `Math.random()`).
 */
function fireGlow(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 0.018, 0, 0.62, 0.018, 0.28);
  const flames = createFireFlames(0.62, 0.52, 0.04, 2);
  flames.position.z = -0.02;
  group.add(flames);
  const light = new THREE.PointLight(0xff5a2e, 1.1, 3.4, 2);
  light.position.set(0, 0.4, 0);
  group.add(light);
  return group;
}

/**
 * Fumee : une paire de plans translucides superposes, sans lumiere -- l'ADR 0018 le rappelle,
 * un objet suspendu sans repere de hauteur proche se lit comme un objet flottant ; ces deux
 * plans restent bas et discrets (pas une colonne de fumee dense) precisement pour ne pas y
 * retomber. Suspendu (`overhead`), donc jamais bloquant. `smokeMaterial` est une matiere
 * PARTAGEE (voir `EnvironmentPropFactory.smokeMaterial`, meme principe que
 * `groundContactMaterial`) : jamais clonee, jamais mutee ici, pour rester libere une seule
 * fois par la fabrique (ADR 0017).
 */
function smokeWisp(kit: PropGeometryLibrary, smokeMaterial: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  for (const y of [0.5, 0.92]) {
    const plane = new THREE.Mesh(kit.groundBlob, smokeMaterial);
    plane.rotation.x = -Math.PI / 2.4;
    plane.position.y = y;
    plane.scale.set(0.6, 0.9, 1);
    group.add(plane);
  }
  return group;
}
/**
 * Feu de camp (le campement, lot 5.10) : un petit tas de rondins sombres, des braises
 * émissives au centre, et une vraie `PointLight` chaude -- même recette que `fireGlow`
 * (vacillement porté par `ExploreDressing.tick`, jamais `Math.random()`), mais ce feu-ci est
 * un OBSTACLE plein (`solid`, on ne marche pas au travers d'un foyer), pas un marquage au sol
 * sous une porte bloquée.
 */
function campfire(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const wood = materials.get('wood');
  for (const [x, z] of [
    [-0.22, 0],
    [0.22, 0],
    [0, -0.22],
    [0, 0.22],
  ] as const) {
    box(group, kit, wood, x, 0.08, z, 0.5, 0.1, 0.13);
  }
  const ember = materials.get('alarmRed');
  box(group, kit, ember, 0, 0.05, 0, 0.3, 0.06, 0.3);
  group.add(createFireFlames(0.48, 0.52, 0.08, 2));
  // Pierres du foyer : un anneau de six blocs sombres.
  const stone = materials.get('darkMetal');
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    box(group, kit, stone, Math.cos(angle) * 0.4, 0.06, Math.sin(angle) * 0.4, 0.14, 0.12, 0.14);
  }
  // A little ash and two unburned sticks make the low fire read as a used camp, not a signal marker.
  box(group, kit, materials.get('wornMetal'), 0, 0.03, 0, 0.54, 0.025, 0.48);
  box(group, kit, materials.get('wood'), -0.18, 0.16, -0.12, 0.46, 0.07, 0.08);
  // Seule source chaude du campement (climat `campement`, lune froide) : c'est elle qui porte la
  // lecture de la carte, d'où une portée qui atteint les tentes et le camion.
  const light = new THREE.PointLight(0xff8a3d, 9, 11, 1.2);
  light.position.set(0, 0.7, 0);
  group.add(light);
  return group;
}

/**
 * Tente de fortune : une bâche canadienne (deux pans inclinés qui se rejoignent sur un faîtage),
 * tendue sur deux perches de tube -- la silhouette en A dit « tente » au premier coup d'oeil, là
 * où un toit plat sur quatre poteaux se lisait comme une table (manche de captures du lot 5.10).
 */
function canvasTent(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const canvas = materials.get('linen');
  const metal = materials.get('darkMetal');
  const ridge = 1.15;
  // Perches aux deux bouts du faîtage, et le faîtage lui-même (axe Z, profondeur de la tente).
  for (const z of [-0.85, 0.85]) post(group, kit, metal, 0, z, ridge);
  box(group, kit, metal, 0, ridge, 0, 0.06, 0.06, 1.8);
  // Deux pans : chacun descend du faîtage jusqu'au sol, à ~0,8 m de l'axe.
  const halfBase = 0.8;
  const slope = Math.atan2(ridge, halfBase);
  const panelLength = Math.hypot(ridge, halfBase);
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(kit.box, canvas);
    panel.scale.set(panelLength, 0.05, 1.84);
    panel.position.set((side * halfBase) / 2, ridge / 2, 0);
    panel.rotation.z = side * -slope;
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
    // Patchwork follows the tarp slope; a horizontal patch reads as a floating black mark.
    const patch = new THREE.Mesh(kit.box, materials.get('wornMetal'));
    patch.scale.set(0.28, 0.018, 0.32);
    patch.position.set(side * 0.34, 0.55, 0.02);
    patch.rotation.z = side * -slope;
    patch.castShadow = false;
    group.add(patch);
    for (const z of [-0.7, 0.7]) {
      box(group, kit, metal, side * 0.76, 0.08, z, 0.05, 0.16, 0.05);
      box(group, kit, materials.get('darkMetal'), side * 0.61, 0.45, z, 0.3, 0.035, 0.035);
    }
  }
  // Close the two triangular ends so the silhouette reads as a shelter instead of two floating
  // sheets. The doorway stays open at human scale below the ridge.
  const rearGable = new THREE.Mesh(kit.tentGable, canvas);
  rearGable.position.z = 0.89;
  rearGable.castShadow = true;
  group.add(rearGable);
  const entranceGable = new THREE.Mesh(kit.tentGableOpening, canvas);
  entranceGable.position.z = -0.89;
  entranceGable.castShadow = true;
  group.add(entranceGable);
  // Folded entrance flap gives the split gable a readable edge from above.
  const flap = new THREE.Mesh(kit.box, materials.get('petrolPaint'));
  flap.scale.set(0.12, 0.66, 0.025);
  flap.position.set(-0.48, 0.34, -0.905);
  flap.rotation.z = -0.42;
  group.add(flap);
  return group;
}

/**
 * Le vieux véhicule du campement : plus bas et plus cabossé qu'un fourgon (`van`, lot 3.7a) —
 * carrosserie rouillée, pas de rampe lumineuse, une bâche de fortune sur la benne à la place
 * d'un caisson fermé. C'est ce que Murano garde, et ce que la bande prend après lui
 * (docs/chapters/ch2/GAME-DESIGN.md, scène 9).
 */
function wreckVehicle(
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  glass: THREE.MeshStandardMaterial,
): THREE.Group {
  const group = new THREE.Group();
  const rust = materials.get('rust');
  const dark = materials.get('darkMetal');
  box(group, kit, dark, 0, 0.4, 0.3, 2.1, 0.36, 3.7);
  box(group, kit, rust, 0, 1.0, 1.0, 2.0, 0.86, 2.1);
  box(group, kit, rust, 0, 0.94, -0.9, 1.96, 0.8, 1.1);
  // A distinct cab roof and sloped windscreen break the single-box pickup silhouette.
  box(group, kit, materials.get('wornMetal'), 0, 1.43, -0.86, 1.82, 0.12, 1.0);
  const windshield = new THREE.Mesh(kit.box, glass);
  windshield.scale.set(1.52, 0.38, 0.035);
  windshield.position.set(0, 1.27, -1.43);
  windshield.rotation.x = 0.34;
  windshield.castShadow = false;
  group.add(windshield);
  // Side windows are set high in the cab, leaving a visible belt line below them.
  for (const side of [-1, 1]) {
    box(group, kit, materials.get('petrolPaint'), side * 1.005, 1.29, -0.87, 0.028, 0.34, 0.66);
    box(group, kit, materials.get('wornMetal'), side * 1.025, 1.29, -0.87, 0.025, 0.04, 0.72);
    box(group, kit, materials.get('darkMetal'), side * 1.02, 0.95, -0.48, 0.04, 0.035, 0.16);
  }
  box(group, kit, materials.get('linen'), 0, 1.5, 1.05, 1.86, 0.05, 1.95);
  // Broken service truck: cab glass, battered grille, mismatched panels and door hardware.
  box(group, kit, dark, 0, 1.3, -1.48, 1.62, 0.45, 0.06);
  box(group, kit, materials.get('wornMetal'), 0, 1.29, -1.52, 1.36, 0.32, 0.025);
  for (const x of [-0.72, 0.72]) {
    box(group, kit, glass, x, 1.36, -1.43, 0.48, 0.32, 0.035);
    box(group, kit, materials.get('linen'), x * 1.2, 0.98, -1.49, 0.24, 0.15, 0.04);
    box(group, kit, materials.get('rust'), x, 0.63, -0.7, 0.48, 0.12, 0.62);
    box(group, kit, dark, x * 1.08, 1.12, -0.55, 0.05, 0.9, 0.045);
    box(group, kit, materials.get('wornMetal'), x * 1.08, 1.31, -0.48, 0.07, 0.05, 0.18);
    box(group, kit, materials.get('darkMetal'), x * 1.08, 1.37, 1.15, 0.055, 0.42, 0.045);
  }
  box(group, kit, materials.get('wornMetal'), 0, 0.48, -1.76, 2.18, 0.16, 0.2);
  box(group, kit, dark, 0, 1.18, 2.12, 1.9, 0.74, 0.06);
  box(group, kit, materials.get('wornMetal'), 0, 1.18, 2.16, 1.48, 0.54, 0.025);
  for (const x of [-1.02, 1.02])
    for (const z of [-1.0, 1.1]) {
      const wheel = new THREE.Mesh(kit.wheel, dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.26, z);
      wheel.castShadow = true;
      group.add(wheel);
      const hub = new THREE.Mesh(kit.drum, materials.get('wornMetal'));
      hub.rotation.z = Math.PI / 2;
      hub.scale.set(0.2, 0.11, 0.2);
      hub.position.set(x * 1.01, 0.26, z);
      group.add(hub);
    }
  return group;
}

/**
 * Insigne au scorpion : un tissu maculé posé au sol, presque plat -- un marquage (`flat`), pas
 * un obstacle, pour rester franchissable exactement comme `campement.insignes` (un `object`
 * facultatif, jamais un meuble plein) l'exige.
 */
function gangEmblem(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('rust'), 0, 0.012, 0, 0.62, 0.012, 0.44);
  box(group, kit, materials.get('darkMetal'), 0, 0.02, 0, 0.24, 0.02, 0.24);
  return group;
}

/* -- Les conduits et la cantine des petits (lot 5.9) ------------------------------------------ */

/**
 * La machine de la simulation (le labo de Smith) : un caisson sombre, un écran incliné qui
 * pulse en cyan, une grappe de câbles au sol -- et une vraie `PointLight` froide, la « lueur
 * bleue » qu'on aperçoit depuis la bifurcation. C'est elle, et elle seule, qui éclaire le labo.
 */
function simMachine(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  box(group, kit, dark, 0, 0.55, 0.1, 1.7, 1.1, 1.3);
  box(group, kit, materials.get('wornMetal'), 0, 1.14, 0.1, 1.76, 0.08, 1.36);
  // Écran incliné vers l'avant (-Z) et bandeau lumineux.
  const screen = new THREE.Mesh(kit.box, materials.get('cyanSignal'));
  screen.scale.set(1.2, 0.72, 0.05);
  screen.position.set(0, 1.58, -0.3);
  screen.rotation.x = -0.35;
  group.add(screen);
  box(group, kit, dark, 0, 1.58, -0.24, 1.32, 0.84, 0.04);
  box(group, kit, materials.get('cyanSignal'), 0, 0.7, -0.56, 1.4, 0.06, 0.02);
  // Câbles au sol, en éventail.
  for (const [x, z, r] of [
    [-0.55, -0.72, 0.4],
    [0.1, -0.78, -0.2],
    [0.6, -0.68, 0.7],
  ] as const) {
    const cable = new THREE.Mesh(kit.box, dark);
    cable.scale.set(0.06, 0.05, 0.6);
    cable.position.set(x, 0.03, z);
    cable.rotation.y = r;
    group.add(cable);
  }
  const light = new THREE.PointLight(0x4fd8ff, 8, 8.5, 1.3);
  light.position.set(0, 1.7, -0.8);
  group.add(light);
  return group;
}

/**
 * Ventilateur de reprise d'air, posé sur la case de porte du conduit (`conduits.ventilateur-pales`) :
 * un cadre carré, un moyeu et quatre pales, légèrement avancé côté sud (+Z, d'où l'on arrive)
 * pour rester lisible devant le panneau de porte. Il ne bloque rien lui-même : la porte
 * verrouillée porte la collision (ADR 0017), le modèle ne fait que la montrer.
 */
function ductFan(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const closure = new THREE.Group();
  closure.name = 'door-closure';
  const frame = materials.get('darkMetal');
  const z = 0.16;
  box(group, kit, frame, 0, 0.08, z, 0.98, 0.12, 0.1);
  box(group, kit, frame, 0, 1.92, z, 0.98, 0.12, 0.1);
  box(group, kit, frame, -0.44, 1.0, z, 0.1, 1.9, 0.1);
  box(group, kit, frame, 0.44, 1.0, z, 0.1, 1.9, 0.1);
  const hub = new THREE.Mesh(kit.drum, materials.get('wornMetal'));
  hub.scale.set(0.34, 0.2, 0.34);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0, 1.1, z + 0.02);
  closure.add(hub);
  const blade = materials.get('wornMetal');
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(kit.box, blade);
    mesh.scale.set(0.2, 0.74, 0.03);
    const angle = (i / 4) * Math.PI * 2 + 0.4;
    mesh.position.set(Math.sin(angle) * 0.36, 1.1 + Math.cos(angle) * 0.36, z + 0.04);
    mesh.rotation.z = -angle;
    closure.add(mesh);
  }
  // Grille de protection arrachée : deux barres de travers.
  box(closure, kit, materials.get('rust'), 0, 1.1, z + 0.09, 0.84, 0.04, 0.03);
  box(closure, kit, materials.get('rust'), 0, 0.72, z + 0.09, 0.84, 0.04, 0.03);
  group.add(closure);
  return group;
}

/**
 * Boîtier de commande du ventilateur, scellé au mur : le modèle est centré sur la case de MUR
 * (`threshold`) et fait saillie de sa face avant (-Z), que la rotation du placement tourne vers
 * le conduit. Un voyant rouge, sans lumière propre (le rouge est rare, UI-DESIGN-SYSTEM.md).
 */
function fanControl(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('wornMetal'), 0, 1.25, -0.56, 0.46, 0.62, 0.14);
  box(group, kit, materials.get('darkMetal'), 0, 1.25, -0.64, 0.34, 0.44, 0.03);
  box(group, kit, materials.get('alarmRed'), 0.12, 1.48, -0.66, 0.06, 0.06, 0.02);
  box(group, kit, materials.get('darkMetal'), -0.1, 0.72, -0.53, 0.06, 0.5, 0.06);
  return group;
}

/**
 * Ampoule grillagée du conduit : un culot, une cage, une ampoule ambre, et une `PointLight`
 * faible et courte -- des flaques de lumière espacées, du noir entre elles (ambiance
 * oppressante, demande du lot). Elle grésille (`ExploreDressing.tick`, jamais `Math.random()`).
 */
function ductLamp(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  // Backplate and cage hug one wall; the lamp projects into the passage, never down from the roof.
  box(group, kit, materials.get('darkMetal'), 0, 2.22, -0.48, 0.42, 0.3, 0.08);
  box(group, kit, materials.get('wornMetal'), 0, 2.22, -0.4, 0.28, 0.2, 0.16);
  const bulb = new THREE.Mesh(kit.drum, materials.get('amberSignal'));
  bulb.scale.set(0.2, 0.22, 0.2);
  bulb.position.set(0, 2.22, -0.28);
  group.add(bulb);
  for (const x of [-0.15, 0.15])
    box(group, kit, materials.get('darkMetal'), x, 2.22, -0.27, 0.025, 0.32, 0.14);
  const light = new THREE.PointLight(0xffb866, 2.6, 5, 1.6);
  light.position.set(0, 2.22, -0.08);
  group.add(light);
  return group;
}

/** Poussière bleue sur la tôle (le secret de Franklyn, au-delà de l'annexe) : plate, franchissable. */
function blueDust(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dust = materials.get('cyanSignal');
  box(group, kit, dust, -0.12, 0.012, 0.08, 0.5, 0.01, 0.34);
  box(group, kit, dust, 0.2, 0.012, -0.18, 0.26, 0.01, 0.2);
  return group;
}

/**
 * Brasier de la cantine : un tas de tables et de chaises renversées, des flammes hautes (lames
 * émissives croisées, sans particules -- même économie que `campfire`) et une vraie
 * `PointLight` rouge et forte, qui vacille (`ExploreDressing.tick`). Obstacle plein : on passe
 * entre les deux brasiers, jamais au travers.
 */
function blaze(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const wood = materials.get('wood');
  const dark = materials.get('darkMetal');
  box(group, kit, wood, -0.3, 0.3, 0.1, 1.3, 0.1, 0.8);
  box(group, kit, wood, 0.3, 0.22, -0.2, 0.9, 0.44, 0.1);
  box(group, kit, dark, 0.1, 0.12, 0.4, 1.4, 0.24, 0.5);
  box(group, kit, dark, -0.5, 0.5, -0.3, 0.08, 1.0, 0.08);
  // Irregular translucent flame cards leave the burning furniture visible underneath.
  group.add(createFireFlames(1.0, 1.5, 0.34, 3));
  const light = new THREE.PointLight(0xff7a2a, 8, 7.5, 1.4);
  light.position.set(0, 1.1, 0);
  group.add(light);
  return group;
}

/**
 * Trappe du vide-ordures, dans le mur sud de la cantine : un cadre d'acier et un volet
 * entrouvert, en saillie de la face avant (-Z, que le placement tourne vers la salle), avec un
 * liseré ambre -- l'issue doit se lire à travers la fumée.
 */
function garbageChute(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const steel = materials.get('wornMetal');
  box(group, kit, steel, 0, 0.95, -0.54, 0.9, 0.9, 0.1);
  box(group, kit, materials.get('darkMetal'), 0, 0.95, -0.6, 0.7, 0.66, 0.04);
  const flap = new THREE.Mesh(kit.box, steel);
  flap.scale.set(0.72, 0.06, 0.4);
  flap.position.set(0, 1.28, -0.78);
  flap.rotation.x = 0.5;
  group.add(flap);
  box(group, kit, materials.get('amberSignal'), 0, 0.48, -0.6, 0.9, 0.04, 0.03);
  return group;
}

function simple(
  model: string,
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  isCentre: boolean,
): THREE.Group {
  const group = new THREE.Group();
  if (model === 'courtyard-tree') {
    post(group, kit, materials.get('barkWood'), 0, 0, 1.75);
    for (const [x, z, height, leanX, leanZ] of [
      [-0.24, 0.02, 1.35, -0.42, -0.25],
      [0.23, 0.04, 1.48, 0.4, -0.22],
      [0.02, -0.25, 1.4, 0.02, -0.48],
    ] as const) {
      const branch = new THREE.Mesh(kit.post, materials.get('barkWood'));
      branch.position.set(x * 0.5, height, z * 0.5);
      branch.scale.set(0.55, 0.74, 0.55);
      branch.rotation.z = leanX;
      branch.rotation.x = leanZ;
      branch.castShadow = true;
      group.add(branch);
    }
    const leaves = Array.from({ length: 24 }, (_, index) => {
      const layer = Math.floor(index / 8);
      const angle = ((index % 8) * Math.PI) / 4 + layer * 0.37;
      const radius = layer === 1 ? 0.52 : 0.35;
      return [0, Math.PI / 2].map((offset) => ({
        x: Math.cos(angle) * radius,
        y: 1.94 + layer * 0.36,
        z: Math.sin(angle) * radius,
        yaw: angle + offset,
        width: 0.92 + (index % 3) * 0.06,
        height: 0.88 + (index % 2) * 0.08,
      }));
    }).flat();
    addLeafCards(group, kit, materials.get('canopyLeaves'), leaves);
    return group;
  }
  if (model === 'square-basin') {
    const stone = materials.get('coldConcrete');
    const water = materials.get('petrolPaint');
    box(group, kit, stone, 0, 0.2, 0, 2.35, 0.4, 2.35);
    const steel = materials.get('containerSteel');
    const cavity = 1.65;
    const rim = 0.2;
    const rimOffset = (cavity + rim) / 2;
    const rimOuter = cavity + rim * 2;
    box(group, kit, steel, 0, 0.425, -rimOffset, rimOuter, 0.11, rim);
    box(group, kit, steel, 0, 0.425, rimOffset, rimOuter, 0.11, rim);
    box(group, kit, steel, -rimOffset, 0.425, 0, rim, 0.11, cavity);
    box(group, kit, steel, rimOffset, 0.425, 0, rim, 0.11, cavity);
    const rimCenter = 0.49;
    const rimHeight = 0.08;
    box(group, kit, stone, 0, rimCenter, -rimOffset, rimOuter, rimHeight, rim);
    box(group, kit, stone, 0, rimCenter, rimOffset, rimOuter, rimHeight, rim);
    box(group, kit, stone, -rimOffset, rimCenter, 0, rim, rimHeight, cavity);
    box(group, kit, stone, rimOffset, rimCenter, 0, rim, rimHeight, cavity);
    box(group, kit, water, 0, 0.4625, 0, cavity, 0.035, cavity);
    return group;
  }
  if (model === 'courtyard-planter' || model === 'courtyard-planter-trough') {
    const width = model === 'courtyard-planter-trough' ? 1.92 : 0.92;
    box(group, kit, materials.get('coldConcrete'), 0, 0.2, 0, width, 0.4, 0.86);
    box(group, kit, materials.get('containerSteel'), 0, 0.42, 0, width + 0.05, 0.08, 0.92);
    box(group, kit, materials.get('darkMetal'), 0, 0.47, 0, width - 0.18, 0.025, 0.72);
    const count = model === 'courtyard-planter-trough' ? 3 : 1;
    const leaves = Array.from({ length: count }, (_, plant) => {
      const centerX = count === 1 ? 0 : (plant - 1) * 0.54;
      return Array.from({ length: 8 }, (_, leaf) => ({
        x: centerX + (leaf % 2 ? 0.045 : -0.045),
        y: 0.72 + Math.floor(leaf / 2) * 0.055,
        z: (leaf % 2 ? 0.11 : -0.1) + (plant % 2) * 0.035,
        yaw: ((leaf % 2) * Math.PI) / 2 + (Math.floor(leaf / 2) % 2) * 0.24,
        width: 0.38 + (leaf % 3) * 0.025,
        height: 0.42 + (leaf % 2) * 0.05,
      }));
    }).flat();
    addLeafCards(group, kit, materials.get('canopyLeaves'), leaves);
    return group;
  }
  if (model === 'waiting-bench') {
    box(group, kit, materials.get('wood'), 0, 0.46, 0, 2.7, 0.14, 0.52);
    box(group, kit, materials.get('wood'), 0, 0.78, 0.26, 2.7, 0.5, 0.1);
    for (const x of [-1.02, 1.02]) {
      post(group, kit, materials.get('darkMetal'), x, -0.14, 0.46);
      post(group, kit, materials.get('darkMetal'), x, 0.24, 1.04);
    }
    return group;
  }
  if (model === 'exam-low-barrier') {
    // Barrière de contrôle de foule : deux lisses ajourées sur pieds évasés.
    // Volontairement distincte du banc, qui est plein et porte un dossier.
    const metal = materials.get('wornMetal');
    for (const y of [0.52, 0.94]) box(group, kit, metal, 0, y, 0, 2.86, 0.09, 0.09);
    for (const x of [-1.28, 0, 1.28]) box(group, kit, metal, x, 0.5, 0, 0.09, 1.0, 0.09);
    for (const x of [-1.28, 1.28]) box(group, kit, materials.get('darkMetal'), x, 0.05, 0, 0.16, 0.1, 0.72);
    box(group, kit, materials.get('rust'), 0.88, 0.73, -0.06, 0.48, 0.18, 0.035);
    box(group, kit, materials.get('darkMetal'), -0.58, 0.73, -0.06, 0.72, 0.06, 0.03);
    return group;
  }
  if (model === 'training-rig') {
    // Cage d'agrès : une vraie structure de 3 x 3 m, barres à trois hauteurs.
    const metal = materials.get('darkMetal');
    for (const x of [-1.32, 1.32])
      for (const z of [-1.32, 1.32]) {
        post(group, kit, metal, x, z, 2.52);
        box(group, kit, materials.get('wornMetal'), x, 0.075, z, 0.34, 0.15, 0.34);
        box(group, kit, materials.get('containerSteel'), x, 2.34, z, 0.22, 0.16, 0.22);
      }
    for (const z of [-1.32, 1.32]) box(group, kit, metal, 0, 2.46, z, 2.74, 0.13, 0.13);
    for (const x of [-1.32, 1.32]) box(group, kit, metal, x, 2.46, 0, 0.13, 0.13, 2.74);
    for (const y of [1.1, 1.72]) box(group, kit, materials.get('wornMetal'), -1.32, y, 0, 0.1, 0.1, 2.6);
    for (const z of [-0.44, 0.44]) box(group, kit, materials.get('wornMetal'), 0.4, 2.3, z, 1.7, 0.09, 0.09);
    // Deux anneaux suspendus, leurs sangles et leur traverse d'accroche donnent une fonction lisible.
    for (const x of [-0.38, 0.38]) {
      box(group, kit, metal, x, 1.82, 0.38, 0.045, 0.92, 0.045);
      box(group, kit, materials.get('containerSteel'), x, 2.23, 0.38, 0.16, 0.06, 0.14);
      const ring = new THREE.Mesh(kit.ring, materials.get('wornMetal'));
      ring.position.set(x, 1.13, 0.38);
      ring.scale.setScalar(0.15);
      ring.castShadow = true;
      group.add(ring);
    }
    box(group, kit, materials.get('rust'), 0.7, 0.07, 0.7, 1.5, 0.14, 1.5);
    return group;
  }
  if (model === 'wall-vent-duct') {
    // Torn wall duct above the gas bottles. Its open north end vents toward the floor hazard,
    // keeping the route and ceiling view clear.
    box(group, kit, materials.get('darkMetal'), 0, 2.28, 0.26, 2.88, 0.46, 0.08);
    box(group, kit, materials.get('wornMetal'), 0, 2.29, 0.11, 2.78, 0.3, 0.22);
    for (const x of [-1.08, -0.36, 0.36, 1.08])
      box(group, kit, materials.get('darkMetal'), x, 2.29, -0.02, 0.08, 0.38, 0.24);
    box(group, kit, materials.get('darkMetal'), 1.12, 2.1, -0.1, 0.48, 0.25, 0.26);
    box(group, kit, materials.get('rust'), 1.15, 2.42, 0, 0.38, 0.05, 0.18);
    for (const x of [-0.88, 0.88])
      box(group, kit, materials.get('wornMetal'), x, 2.53, 0.18, 0.06, 0.24, 0.12);
    return group;
  }
  if (model === 'kennel-run') return kennelRun(materials, kit);
  if (model === 'barrel-stack') return barrelStack(materials, kit);
  if (model === 'crate-stack') return crateStack(materials, kit);
  if (model === 'combat-circle') {
    // Cercle peint : le seul marquage qui justifie un centre de pièce vide.
    //
    // En peinture usée, jamais en couleur de signalisation. Il était tracé en `amberSignal`,
    // qui est ÉMISSIVE : cinq mètres d'ambre lumineux au sol, exactement le langage que le jeu
    // réserve à ce qui se clique (survol, repère d'objet, jalon d'objectif). Le joueur en
    // sortant de l'examen y lisait une consigne -- "un gros rond jaune, on ne sait pas ce que
    // c'est et s'il faut mettre notre équipe dans le cercle". Un marquage au sol ne brille pas.
    const ring = new THREE.Mesh(kit.floorCircle, materials.get('linen'));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.036;
    group.add(ring);
    for (const [x, z] of [
      [-2.1, 0],
      [2.1, 0],
      [0, -2.1],
      [0, 2.1],
    ] as const)
      box(group, kit, materials.get('petrolPaint'), x, 0.026, z, 0.5, 0.02, 0.5);
    return group;
  }
  if (model === 'conduit-wall-run') return conduitWallRun(materials, kit);
  if (model === 'wall-pipe-run') return pipeRun(materials, kit, true);
  if (model === 'wall-strip-light') return stripLight(materials, kit);
  if (model === 'warning-beacon') return warningBeacon(materials, kit);
  if (model === 'locker-open') return personalLocker(materials, kit);
  if (model === 'floor-grate') return floorVent(materials, kit);
  if (model === 'exam-equipment-cage') return equipmentCage(materials, kit, true);
  if (model === 'k9-course-gate') return k9CourseGate(materials, kit);
  if (model === 'gas-rack') return gasRack(materials, kit);
  if (model === 'exam-door-portal') return examDoorPortal(materials, kit);
  if (model === 'hazard-floor-zone') return hazardFloorZone(materials, kit, isCentre);
  if (model === 'industrial-service-bank') return industrialServiceBank(materials, kit);
  if (model === 'signal-pylon') return signalPylon(materials, kit);
  if (model === 'exit-chevrons') {
    // Quatre chevrons alignés, pointe vers -Z : la rotation du placement décide
    // vers quelle sortie ils pointent, et l'emprise 4 x 2 reste honnête.
    for (const x of [-1.5, -0.5, 0.5, 1.5]) {
      const arrow = new THREE.Mesh(kit.routeArrow, materials.get('cyanPaint'));
      arrow.position.set(x, 0.035, 0.1);
      group.add(arrow);
    }
    box(group, kit, materials.get('darkMetal'), 0, 0.028, 0.58, 3.7, 0.02, 0.09);
    return group;
  }
  if (model === 'garage-parking-marking') {
    const paint = materials.get('wornMetal');
    box(group, kit, paint, 0, 0.031, -1.9, 0.055, 0.012, 4.7);
    return group;
  }
  if (model === 'weapon-case') {
    const dark = materials.get('darkMetal');
    const steel = materials.get('wornMetal');
    const foam = materials.get('petrolPaint');
    box(group, kit, dark, 0, 0.31, 0, 1.82, 0.5, 0.82);
    box(group, kit, steel, 0, 0.57, 0, 1.84, 0.07, 0.84);
    box(group, kit, foam, 0, 0.62, 0, 1.66, 0.035, 0.66);
    for (let x = -0.62; x <= 0.63; x += 0.42) {
      box(group, kit, dark, x, 0.68, 0, 0.28, 0.045, 0.5);
      box(group, kit, steel, x, 0.72, -0.03, 0.19, 0.025, 0.26);
    }
    // Reinforced lid is propped open to expose fitted foam; hinges and front latches stay low-key.
    const lid = new THREE.Mesh(kit.box, dark);
    lid.scale.set(1.82, 0.11, 0.66);
    lid.position.set(0, 0.84, -0.12);
    lid.rotation.x = -0.32;
    lid.castShadow = true;
    group.add(lid);
    for (const x of [-0.68, 0, 0.68]) {
      box(group, kit, steel, x, 0.61, 0.405, 0.12, 0.16, 0.045);
      box(group, kit, materials.get('rust'), x, 0.63, 0.432, 0.065, 0.045, 0.018);
    }
    for (const x of [-0.62, 0.62]) {
      box(group, kit, steel, x, 0.27, 0.41, 0.28, 0.12, 0.045);
      box(group, kit, dark, x, 0.27, 0.44, 0.14, 0.055, 0.025);
      box(group, kit, steel, x, 0.79, -0.31, 0.08, 0.12, 0.1);
    }
    // Rubber corner guards and two narrow handles keep the hard case visibly transportable.
    for (const x of [-0.82, 0.82])
      for (const z of [-0.34, 0.34]) box(group, kit, steel, x, 0.31, z, 0.12, 0.54, 0.14);
    box(group, kit, dark, 0, 0.64, 0.31, 0.32, 0.045, 0.14);
    return group;
  }
  if (model === 'canteen-podium') {
    box(group, kit, materials.get('wood'), 0, 0.2, 0, 2.7, 0.4, 0.88);
    box(group, kit, materials.get('wornMetal'), 0, 0.42, 0, 2.8, 0.08, 0.96);
    box(group, kit, materials.get('darkMetal'), 0, 0.92, -0.32, 0.72, 0.92, 0.1);
    box(group, kit, materials.get('cyanSignal'), 0, 1.24, -0.38, 0.62, 0.22, 0.02);
    return group;
  }
  if (model === 'service-counter') {
    // Inox worktop and repeated glazed service bays, kept inside the existing 1 x 7 footprint.
    const steel = materials.get('containerSteel');
    const dark = materials.get('darkMetal');
    box(group, kit, materials.get('petrolPaint'), 0, 0.42, 0, 0.72, 0.84, 6.7);
    box(group, kit, steel, 0, 0.88, 0, 0.94, 0.1, 6.9);
    box(group, kit, dark, -0.43, 0.72, 0, 0.08, 0.07, 6.7);
    // Framed, cool-tinted pane: vertical uprights and a top rail read as glazing at game scale.
    box(group, kit, steel, 0.31, 1.53, 0, 0.07, 1.28, 6.72);
    box(group, kit, dark, 0.34, 1.54, -3.25, 0.1, 1.36, 0.08);
    box(group, kit, dark, 0.34, 1.54, 3.25, 0.1, 1.36, 0.08);
    box(group, kit, dark, 0.34, 2.2, 0, 0.1, 0.08, 6.58);
    for (let z = -2.6; z <= 2.7; z += 1.35) {
      box(group, kit, steel, 0.04, 1.05, z, 0.78, 0.035, 0.92);
      box(group, kit, materials.get('linen'), 0.04, 1.075, z, 0.58, 0.018, 0.64);
    }
    return group;
  }
  if (model === 'dance-floor-tile') {
    // Piste degagee du bal : une longue bande claire (13 x 1 m, jamais emissive, contrairement
    // au cercle de combat -- ce marquage ne se clique pas, il ne doit donc pas parler le meme
    // langage visuel que "survol"/"objectif", voir le commentaire de `combat-circle` plus haut).
    box(group, kit, materials.get('linen'), 0, 0.018, 0, 12.8, 0.018, 0.9);
    for (let x = -5.85; x <= 5.85; x += 1.3)
      box(group, kit, materials.get('warmLaminate'), x, 0.024, 0, 0.9, 0.012, 0.7);
    return group;
  }
  throw new Error(`Modèle d’habillage inconnu : ${model}`);
}
export function createEnvironmentProp(
  placement: ExploreVisualPlacement,
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  isCentre: boolean,
  smokeMaterial: THREE.Material,
  dormitoryMaterials?: DormitoryMaterials,
  vehicleGlassMaterial?: THREE.MeshStandardMaterial,
): THREE.Group {
  switch (placement.model) {
    case 'bed-cadet':
      return bed(materials, kit);
    case 'locker-bank':
      return lockerBank(materials, kit);
    case 'canteen-table':
      return canteenTable(materials, kit);
    case 'canteen-chair':
      return chair(materials, kit);
    case 'bedside-table':
      return bedsideTable(materials, kit);
    case 'access-console-bank':
      return accessConsoleBank(materials, kit);
    case 'exam-terminal':
      return consoleProp(materials, kit, dormitoryMaterials);
    case 'exam-secure-locker':
      return examSecureLocker(materials, kit);
    case 'exam-waiting-bench':
      return examWaitingBench(materials, kit);
    case 'security-station':
      return securityStation(materials, kit);
    case 'medical-cabinet':
      return medicalCabinet(materials, kit);
    case 'secure-locker':
      return armoredLocker(materials, kit);
    case 'admin-desk':
      return receptionDesk(materials, kit);
    case 'holt-reception-desk':
      return holtReceptionDesk(materials, kit);
    case 'netrun-station':
      return holtNetrunStation(materials, kit);
    case 'netrun-terminal':
      return holtNetrunTerminal(materials, kit);
    case 'medical-bed':
      return medicalBed(materials, kit);
    case 'medical-workbench':
      return medicalWorkbench(materials, kit);
    case 'maintenance-workbench':
      return maintenanceWorkbench(materials, kit);
    case 'weapon-rack':
      return weaponRack(materials, kit);
    case 'archive-shelves':
      return shelves(materials, kit);
    case 'holt-archive-shelves':
      return holtArchiveShelves(materials, kit);
    case 'server-shelves':
      return shelves(materials, kit, true);
    case 'transformer':
      return transformer(materials, kit);
    case 'exam-desk':
      return examDeskProp(materials, kit);
    case 'workbench':
      return workbench(materials, kit);
    case 'garage-workbench':
      return garageWorkbench(materials, kit);
    case 'exam-van':
      return van(
        materials,
        kit,
        vehicleGlassMaterial ?? materials.get('darkMetal'),
        true,
        dormitoryMaterials,
      );
    case 'police-van':
      return van(
        materials,
        kit,
        vehicleGlassMaterial ?? materials.get('darkMetal'),
        false,
        dormitoryMaterials,
      );
    case 'security-panel':
      return securityPanel(materials, kit);
    case 'punching-bag':
      return punchingBag(materials, kit);
    case 'courtyard-tree':
    case 'courtyard-planter':
    case 'courtyard-planter-trough':
    case 'square-basin':
    case 'canteen-podium':
    case 'service-counter':
    case 'training-rig':
    case 'wall-vent-duct':
    case 'waiting-bench':
    case 'exam-low-barrier':
    case 'weapon-case':
    case 'conduit-wall-run':
    case 'wall-pipe-run':
    case 'wall-strip-light':
    case 'warning-beacon':
    case 'exam-equipment-cage':
    case 'k9-course-gate':
    case 'kennel-run':
    case 'barrel-stack':
    case 'crate-stack':
    case 'combat-circle':
    case 'gas-rack':
    case 'exam-door-portal':
    case 'hazard-floor-zone':
    case 'industrial-service-bank':
    case 'signal-pylon':
    case 'exit-chevrons':
    case 'garage-parking-marking':
    case 'locker-open':
    case 'floor-grate':
    case 'dance-floor-tile':
      return simple(placement.model, materials, kit, isCentre);
    case 'buffet-table':
      return buffetTable(materials, kit);
    case 'party-string-lights':
      return partyStringLights(materials, kit);
    case 'desk-overturned':
    case 'desk-overturned-loose':
      return deskOverturned(materials, kit);
    case 'fire-glow':
      return fireGlow(materials, kit);
    case 'smoke-wisp':
      return smokeWisp(kit, smokeMaterial);
    case 'campfire':
      return campfire(materials, kit);
    case 'canvas-tent':
      return canvasTent(materials, kit);
    case 'wreck-vehicle':
      return wreckVehicle(materials, kit, vehicleGlassMaterial ?? materials.get('darkMetal'));
    case 'gang-emblem':
      return gangEmblem(materials, kit);
    case 'sim-machine':
      return simMachine(materials, kit);
    case 'duct-fan':
      return ductFan(materials, kit);
    case 'fan-control':
      return fanControl(materials, kit);
    case 'duct-lamp':
      return ductLamp(materials, kit);
    case 'blue-dust':
      return blueDust(materials, kit);
    case 'blaze':
      return blaze(materials, kit);
    case 'garbage-chute':
      return garbageChute(materials, kit);
    default:
      throw new Error(`Modèle d’habillage inconnu : ${placement.model as string}`);
  }
}
/**
 * Modèles suspendus qui n'ont, par ailleurs, aucun élément qui touche le sol ni de lumière
 * propre : sans un repère, ils se lisent comme des barres qui traînent au sol plutôt que comme
 * un objet accroché en hauteur -- défaut réel constaté (rapporté "des barres sombres traînent
 * au sol"), racine commune avec le commentaire de `vent-duct` plus haut ("une gaine sombre ne se
 * lit que comme une barre flottante"). `strip-light`/`warning-beacon` n'en ont pas besoin : leur
 * lumière propre (voir plus haut) crée déjà une flaque au sol qui les ancre.
 */
/** Factory par carte : géométries et matières partagées, ancrage au centre réel de l'emprise. */
export class EnvironmentPropFactory {
  private readonly kit = new PropGeometryLibrary();
  /** Geometries uniques créées par les builders locaux, hors géométries partagées du kit/GLTF. */
  private readonly adHocGeometries = new Set<THREE.BufferGeometry>();
  private readonly adHocMaterials = new Set<THREE.Material>();
  private readonly factoryModels = new FactoryModels();
  private readonly materials: EnvironmentMaterials;
  private readonly vehicleGlassMaterial: THREE.MeshStandardMaterial;
  private readonly rng: Rng;
  private dormitoryMaterials: DormitoryMaterials | null = null;
  private readonly ownsDormitoryMaterials: boolean;
  private dormitoryKit: DormitoryKit | null = null;
  /** Partagee entre toutes les instances de `smoke-wisp` (lot 5.8b) : jamais clonee, une seule liberation (`dispose`). */
  private readonly smokeMaterial = new THREE.MeshBasicMaterial({
    color: 0x3a3a3e,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  constructor(
    private readonly cellToWorld: (cell: ExploreVisualPlacement['cell']) => { x: number; z: number },
    rng: Rng,
    private readonly isCentre: boolean = false,
    dormitoryMaterials?: DormitoryMaterials,
  ) {
    this.rng = rng;
    this.materials = new EnvironmentMaterials(rng);
    this.dormitoryMaterials = dormitoryMaterials ?? null;
    this.ownsDormitoryMaterials = dormitoryMaterials === undefined;
    // A smooth, smoked clone shares only the depot's reflection environment. Its paint and
    // bump maps are removed, so the windows remain inexpensive and do not inherit metal grain.
    const glassSource = this.dormitoryMaterials?.get('steel') ?? this.materials.get('containerSteel');
    this.vehicleGlassMaterial = glassSource.clone();
    this.vehicleGlassMaterial.name = 'exploration-smoked-vehicle-glass';
    this.vehicleGlassMaterial.color.set(0x182b36);
    this.vehicleGlassMaterial.map = null;
    this.vehicleGlassMaterial.bumpMap = null;
    this.vehicleGlassMaterial.normalMap = null;
    this.vehicleGlassMaterial.roughnessMap = null;
    this.vehicleGlassMaterial.metalnessMap = null;
    this.vehicleGlassMaterial.aoMap = null;
    this.vehicleGlassMaterial.roughness = 0.17;
    this.vehicleGlassMaterial.metalness = 0.22;
    this.vehicleGlassMaterial.envMapIntensity = 0.6;
    this.vehicleGlassMaterial.transparent = false;
  }
  create(placement: ExploreVisualPlacement): THREE.Object3D {
    const dormitoryObject = this.createDormitoryProp(placement);
    const object =
      dormitoryObject ??
      (placement.model.startsWith('factory:')
        ? this.factoryModels.create(placement.model)
        : createEnvironmentProp(
            placement,
            this.materials,
            this.kit,
            this.isCentre,
            this.smokeMaterial,
            this.dormitoryMaterials ?? undefined,
            this.vehicleGlassMaterial,
          ));
    // Plusieurs builders d'objets créent leurs propres roues, tuyaux, globes ou pièces de cuve.
    // ExploreDressing peut détacher ces Mesh lors de la fusion statique : l'instance reste alors
    // seule dans la scène, mais la géométrie source appartient toujours à cette factory.
    // Enregistrer avant les attachments évite de prendre possession des modèles GLTF; le kit
    // dortoir a son propre owner et le kit partagé est exclu par identité.
    if (!dormitoryObject && !placement.model.startsWith('factory:')) {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh && !this.kit.owns(child.geometry)) {
          this.adHocGeometries.add(child.geometry);
        }
        if (
          child instanceof THREE.Mesh &&
          !Array.isArray(child.material) &&
          child.material.userData.exploreTimeUniform
        ) {
          this.adHocMaterials.add(child.material);
        }
      });
    }
    const model = EXPLORE_VISUAL_MODELS[placement.model];
    // Un objet suspendu au plafond ne projette pas d'ombre : la scène n'a pas de
    // plafond, donc son ombre tomberait en pleine lumière au milieu de la pièce
    // sous forme d'une barre noire posée sur rien -- défaut réel constaté.
    if (model.occupancy === 'overhead') {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = false;
      });
    }
    // Ces petits détails sont montés sur le meuble qui occupe déjà la case :
    // une seule emprise, une seule règle de découverte et aucun obstacle fantôme.
    const attachments: Record<string, { model: string; x: number; y: number; z: number; scale: number }[]> = {
      'hall.cage-materiel': [{ model: 'box-large', x: 0, y: 0.34, z: 0, scale: 0.7 }],
      'hall.banque-technique': [{ model: 'screen-wide', x: 0, y: 1.74, z: -0.34, scale: 0.7 }],
      'salle1.banque-technique': [{ model: 'screen-wide', x: 0, y: 1.74, z: -0.34, scale: 0.7 }],
      'salle1.poste-securite': [{ model: 'scanner-high', x: -0.78, y: 0, z: 0.1, scale: 0.6 }],
      'local-technique.etabli': [{ model: 'robot-arm-a', x: 0, y: 0.97, z: 0, scale: 0.55 }],
      'garage.etabli': [{ model: 'robot-arm-a', x: 0.6, y: 0.97, z: 0, scale: 0.5 }],
    };
    for (const attachment of attachments[placement.id] ?? []) {
      const detail = this.factoryModels.create(`factory:${attachment.model}`);
      detail.position.set(attachment.x, attachment.y, attachment.z);
      detail.scale.setScalar(attachment.scale);
      object.add(detail);
    }
    const cells = placement.footprint ?? [placement.cell];
    const minX = Math.min(...cells.map((cell) => cell.x));
    const maxX = Math.max(...cells.map((cell) => cell.x));
    const minY = Math.min(...cells.map((cell) => cell.y));
    const maxY = Math.max(...cells.map((cell) => cell.y));
    const world = this.cellToWorld({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
    object.position.set(world.x, 0, world.z);
    object.rotation.y = THREE.MathUtils.degToRad(placement.rotation ?? 0);
    if (placement.offset)
      object.position.add(new THREE.Vector3(placement.offset.x, placement.offset.y, placement.offset.z));
    if (placement.scale) object.scale.setScalar(placement.scale);
    return object;
  }

  /** Le kit du dortoir n'est alloué que si une carte demande ses modèles dédiés. */
  private createDormitoryProp(placement: ExploreVisualPlacement): THREE.Object3D | null {
    if (
      placement.model !== 'dormitory-bunk' &&
      placement.model !== 'dormitory-locker-bank' &&
      placement.model !== 'dormitory-bench'
    )
      return null;
    this.dormitoryMaterials ??= new DormitoryMaterials(this.rng.fork('dormitory-materials'));
    this.dormitoryKit ??= new DormitoryKit(this.dormitoryMaterials, this.rng.fork('dormitory-kit'));
    switch (placement.model) {
      case 'dormitory-bunk':
        return this.dormitoryKit.bunk(placement.id);
      case 'dormitory-locker-bank':
        return this.dormitoryKit.lockerBank();
      case 'dormitory-bench':
        return this.dormitoryKit.bench();
    }
  }

  dispose(): void {
    this.factoryModels.dispose();
    for (const geometry of this.adHocGeometries) geometry.dispose();
    this.adHocGeometries.clear();
    for (const material of this.adHocMaterials) material.dispose();
    this.adHocMaterials.clear();
    this.kit.dispose();
    this.materials.dispose();
    this.vehicleGlassMaterial.dispose();
    this.dormitoryKit?.dispose();
    if (this.ownsDormitoryMaterials) this.dormitoryMaterials?.dispose();
    this.smokeMaterial.dispose();
  }

  /** Environnement PMREM partagé et emprunté au propriétaire de la scène. */
  setEnvironment(texture: THREE.Texture | null): void {
    this.vehicleGlassMaterial.envMap = texture;
    this.vehicleGlassMaterial.needsUpdate = true;
  }
}
