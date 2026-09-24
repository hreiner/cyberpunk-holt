/** Kit sémantique partagé du dortoir, de l'académie et du centre d'examen. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Rng } from '@/core/rng';
import type { ExploreVisualPlacement } from '@/data/exploreVisualTypes';
import { EnvironmentMaterials } from './materials';
import { FactoryModels } from './factoryModels';

class PropGeometryLibrary {
  readonly box = new RoundedBoxGeometry(1, 1, 1, 3, 0.055);
  readonly post = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);
  readonly crown = new THREE.IcosahedronGeometry(0.75, 1);
  readonly wheel = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 10);
  readonly routeArrow = new THREE.BufferGeometry();
  constructor() {
    this.routeArrow.setAttribute('position', new THREE.Float32BufferAttribute([
      0.32, 0, -0.32,
      -0.3, 0, -0.12,
      0.12, 0, 0.3,
    ], 3));
    this.routeArrow.computeVertexNormals();
  }
  dispose(): void {
    this.box.dispose();
    this.post.dispose();
    this.crown.dispose();
    this.wheel.dispose();
    this.routeArrow.dispose();
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
function chair(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  box(group, kit, materials.get('wood'), 0, 0.5, 0, 0.62, 0.12, 0.62);
  box(group, kit, materials.get('wood'), 0, 0.87, 0.25, 0.62, 0.66, 0.1);
  for (const x of [-0.22, 0.22]) for (const z of [-0.22, 0.22]) post(group, kit, metal, x, z, 0.48);
  return group;
}
function consoleProp(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = table(materials, kit);
  box(group, kit, materials.get('darkMetal'), 0, 1.16, -0.26, 1.12, 0.55, 0.22);
  box(group, kit, materials.get('cyanSignal'), 0, 1.16, -0.385, 0.82, 0.3, 0.015);
  return group;
}
function workbench(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = table(materials, kit, true);
  box(group, kit, materials.get('wornMetal'), 0, 0.92, 0, 2.5, 0.08, 1.3);
  box(group, kit, materials.get('rust'), -0.76, 0.45, 0.02, 0.45, 0.62, 0.88);
  box(group, kit, materials.get('rust'), 0.76, 0.45, 0.02, 0.45, 0.62, 0.88);
  return group;
}
function electricalLocker(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 1.2, 0, 1.72, 2.4, 1.72);
  box(group, kit, materials.get('wornMetal'), 0, 1.3, 0.88, 1.38, 1.55, 0.04);
  box(group, kit, materials.get('cyanSignal'), 0.52, 1.28, 0.91, 0.18, 0.28, 0.02);
  return group;
}
function adminDesk(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = table(materials, kit, true);
  box(group, kit, materials.get('wornMetal'), -0.84, 0.42, 0, 0.56, 0.7, 0.95);
  box(group, kit, materials.get('darkMetal'), 0.56, 1.17, -0.3, 0.62, 0.42, 0.08);
  box(group, kit, materials.get('cyanSignal'), 0.56, 1.17, -0.35, 0.44, 0.25, 0.012);
  return group;
}
function netrunStation(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 0.7, 0, 1.25, 1.4, 0.88);
  box(group, kit, materials.get('wornMetal'), 0, 1.48, 0.15, 1.36, 0.1, 0.56);
  for (const x of [-0.35, 0.35]) {
    box(group, kit, materials.get('darkMetal'), x, 1.76, -0.14, 0.5, 0.52, 0.07);
    box(group, kit, materials.get('cyanSignal'), x, 1.76, -0.185, 0.39, 0.37, 0.012);
  }
  return group;
}
function netrunTerminal(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 0.26, 0.12, 0.7, 0.48, 0.58);
  post(group, kit, materials.get('wornMetal'), 0, 0.02, 1.1);
  box(group, kit, materials.get('darkMetal'), 0, 1.14, -0.1, 0.78, 0.62, 0.08);
  box(group, kit, materials.get('cyanSignal'), 0, 1.14, -0.16, 0.62, 0.46, 0.014);
  return group;
}
function medicalBed(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  box(group, kit, metal, 0, 0.64, 0, 0.92, 0.12, 1.72);
  box(group, kit, materials.get('linen'), 0, 0.79, -0.08, 0.82, 0.19, 1.52);
  box(group, kit, materials.get('coldConcrete'), 0, 1.05, 0.63, 0.84, 0.56, 0.08);
  for (const x of [-0.34, 0.34]) for (const z of [-0.66, 0.66]) post(group, kit, metal, x, z, 0.62);
  return group;
}
function weaponRack(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  for (const x of [-0.52, 0.52]) post(group, kit, metal, x, 0, 2.12);
  for (const y of [0.58, 1.32, 1.96]) box(group, kit, materials.get('wornMetal'), 0, y, 0, 1.32, 0.07, 0.16);
  for (const x of [-0.28, 0.28])
    box(group, kit, materials.get('petrolPaint'), x, 1.08, -0.13, 0.12, 0.8, 0.12);
  return group;
}
function shelves(materials: EnvironmentMaterials, kit: PropGeometryLibrary, servers = false): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  for (const x of [-0.52, 0.52]) post(group, kit, metal, x, 0, 2.25);
  for (const y of [0.42, 0.95, 1.48, 2.01]) {
    box(group, kit, materials.get('wornMetal'), 0, y, 0, 1.28, 0.07, 0.72);
    if (servers) box(group, kit, materials.get('cyanSignal'), 0.3, y + 0.1, -0.38, 0.2, 0.08, 0.015);
    else box(group, kit, materials.get('wood'), -0.2, y + 0.12, -0.1, 0.58, 0.25, 0.45);
  }
  return group;
}
function transformer(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 0.28, 0, 1.38, 0.22, 1.08);
  for (const x of [-0.34, 0.34]) {
    post(group, kit, materials.get('wornMetal'), x, 0, 1.42);
    box(group, kit, materials.get('rust'), x, 1.33, 0, 0.42, 0.18, 0.42);
  }
  box(group, kit, materials.get('cyanSignal'), 0, 0.72, -0.57, 0.3, 0.18, 0.02);
  return group;
}
function examDeskProp(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('wood'), 0, 0.74, -0.1, 0.88, 0.12, 0.72);
  for (const x of [-0.31, 0.31])
    for (const z of [-0.28, 0.28]) post(group, kit, materials.get('darkMetal'), x, z - 0.1, 0.7);
  box(group, kit, materials.get('linen'), 0, 0.82, -0.13, 0.48, 0.018, 0.42);
  box(group, kit, materials.get('darkMetal'), 0, 0.43, 0.48, 0.62, 0.1, 0.42);
  return group;
}
function van(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('wornMetal'), 0, 0.72, 0, 2.5, 1.32, 4.3);
  box(group, kit, materials.get('darkMetal'), 0, 1.48, -0.45, 2.2, 0.35, 2.35);
  box(group, kit, materials.get('cyanSignal'), 0, 1.48, -1.68, 1.72, 0.32, 0.025);
  for (const x of [-1.08, 1.08])
    for (const z of [-1.38, 1.38]) {
      const wheel = new THREE.Mesh(kit.wheel, materials.get('darkMetal'));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.3, z);
      wheel.castShadow = true;
      group.add(wheel);
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
/** Décor de centre d'examen : volumes hauts placés aux bords des salles, jamais sur une case jouable. */
function pipeRun(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  box(group, kit, metal, 0, 2.34, 0, 3.45, 0.18, 0.18);
  for (const x of [-1.35, -0.45, 0.45, 1.35]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.028, 6, 10), materials.get('darkMetal'));
    collar.rotation.y = Math.PI / 2;
    collar.position.set(x, 2.34, 0);
    group.add(collar);
  }
  post(group, kit, materials.get('darkMetal'), -1.38, 0, 2.3);
  return group;
}
function stripLight(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 2.45, 0, 1.5, 0.14, 0.26);
  box(group, kit, materials.get('cyanSignal'), 0, 2.37, -0.12, 1.22, 0.045, 0.035);
  return group;
}
function warningBeacon(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 1.6, 0, 0.44, 0.22, 0.24);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), materials.get('alarmRed'));
  globe.position.y = 1.78;
  group.add(globe);
  return group;
}
function equipmentCage(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  for (const x of [-0.64, 0.64]) for (const z of [-0.4, 0.4]) post(group, kit, metal, x, z, 2.35);
  for (const y of [0.3, 1.1, 2.15]) box(group, kit, materials.get('wornMetal'), 0, y, 0, 1.45, 0.055, 0.98);
  box(group, kit, materials.get('amberSignal'), 0, 1.38, -0.5, 0.82, 0.42, 0.025);
  return group;
}
function k9CourseGate(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  for (const x of [-0.72, 0.72]) post(group, kit, materials.get('darkMetal'), x, 0, 2.15);
  box(group, kit, materials.get('amberSignal'), 0, 1.72, 0, 1.7, 0.13, 0.16);
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
function hazardFloorZone(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const paint = materials.get('amberSignal');
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
/** Portique suspendu, réservé aux bords : il compose l'espace sans occuper le chemin de grille. */
function overheadServiceGantry(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  box(group, kit, metal, 0, 2.56, 0, 4.8, 0.16, 0.36);
  box(group, kit, materials.get('wornMetal'), 0, 2.39, -0.18, 4.42, 0.055, 0.055);
  for (const x of [-1.8, -0.6, 0.6, 1.8]) {
    post(group, kit, metal, x, 0, 2.46);
    box(group, kit, materials.get('amberSignal'), x, 2.36, -0.22, 0.42, 0.05, 0.025);
  }
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
function simple(model: string, materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  if (model === 'courtyard-tree') {
    post(group, kit, materials.get('wood'), 0, 0, 1.35);
    const crown = new THREE.Mesh(kit.crown, materials.get('petrolPaint'));
    crown.position.y = 1.55;
    crown.castShadow = true;
    group.add(crown);
    return group;
  }
  if (model === 'square-basin') {
    box(group, kit, materials.get('coldConcrete'), 0, 0.22, 0, 2.35, 0.42, 2.35);
    box(group, kit, materials.get('petrolPaint'), 0, 0.44, 0, 1.65, 0.08, 1.65);
    return group;
  }
  if (model === 'waiting-bench' || model === 'bench-bank' || model === 'exam-low-barrier') {
    box(group, kit, materials.get('wornMetal'), 0, 0.52, 0, 2.3, 0.16, 0.48);
    post(group, kit, materials.get('darkMetal'), -0.85, 0, 0.54);
    post(group, kit, materials.get('darkMetal'), 0.85, 0, 0.54);
    return group;
  }
  if (model === 'training-rig') {
    post(group, kit, materials.get('darkMetal'), -0.72, 0, 2.1);
    post(group, kit, materials.get('darkMetal'), 0.72, 0, 2.1);
    box(group, kit, materials.get('darkMetal'), 0, 2.05, 0, 1.65, 0.12, 0.12);
    return group;
  }
  if (model === 'vent-duct') {
    box(group, kit, materials.get('darkMetal'), 0, 2.15, 0, 2.6, 0.28, 0.34);
    for (const x of [-1, 0, 1]) box(group, kit, materials.get('wornMetal'), x, 2.15, -0.2, 0.06, 0.38, 0.05);
    return group;
  }
  if (model === 'pipe-run') return pipeRun(materials, kit);
  if (model === 'strip-light') return stripLight(materials, kit);
  if (model === 'warning-beacon') return warningBeacon(materials, kit);
  if (model === 'equipment-cage') return equipmentCage(materials, kit);
  if (model === 'k9-course-gate') return k9CourseGate(materials, kit);
  if (model === 'gas-rack') return gasRack(materials, kit);
  if (model === 'exam-door-portal') return examDoorPortal(materials, kit);
  if (model === 'hazard-floor-zone') return hazardFloorZone(materials, kit);
  if (model === 'industrial-service-bank') return industrialServiceBank(materials, kit);
  if (model === 'overhead-service-gantry') return overheadServiceGantry(materials, kit);
  if (model === 'signal-pylon') return signalPylon(materials, kit);
  if (model === 'exit-chevrons') {
    for (const n of [-1.5, -0.5, 0.5, 1.5]) {
      const arrow = new THREE.Mesh(kit.routeArrow, materials.get('cyanSignal'));
      arrow.position.set(n, 0.035, -n);
      group.add(arrow);
    }
    return group;
  }
  if (model === 'medical-cabinet') return electricalLocker(materials, kit);
  if (model === 'weapon-case') {
    box(group, kit, materials.get('darkMetal'), 0, 0.38, 0, 1.12, 0.58, 0.76);
    box(group, kit, materials.get('rust'), 0, 0.69, 0, 1.18, 0.07, 0.82);
    return group;
  }
  if (model === 'canteen-podium' || model === 'service-counter') {
    box(
      group,
      kit,
      materials.get('wood'),
      0,
      0.42,
      0,
      model === 'service-counter' ? 0.86 : 2.45,
      0.82,
      model === 'service-counter' ? 6.9 : 0.9,
    );
    return group;
  }
  throw new Error(`Modèle d’habillage inconnu : ${model}`);
}
export function createEnvironmentProp(
  placement: ExploreVisualPlacement,
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
): THREE.Group {
  if (placement.id === 'salle1.mobilier-ouest') return workbench(materials, kit);
  switch (placement.model) {
    case 'bed-cadet':
      return bed(materials, kit);
    case 'locker-bank':
      return lockerBank(materials, kit);
    case 'canteen-table':
      return table(materials, kit);
    case 'canteen-chair':
      return chair(materials, kit);
    case 'access-console-bank':
    case 'exam-terminal':
    case 'security-station':
      return consoleProp(materials, kit);
    case 'secure-locker':
      return electricalLocker(materials, kit);
    case 'admin-desk':
      return adminDesk(materials, kit);
    case 'netrun-station':
      return netrunStation(materials, kit);
    case 'netrun-terminal':
      return netrunTerminal(materials, kit);
    case 'medical-bed':
      return medicalBed(materials, kit);
    case 'weapon-rack':
      return weaponRack(materials, kit);
    case 'archive-shelves':
      return shelves(materials, kit);
    case 'server-shelves':
      return shelves(materials, kit, true);
    case 'transformer':
      return transformer(materials, kit);
    case 'exam-desk':
      return examDeskProp(materials, kit);
    case 'workbench':
      return workbench(materials, kit);
    case 'exam-van':
    case 'police-van':
      return van(materials, kit);
    case 'security-panel':
      return securityPanel(materials, kit);
    case 'punching-bag':
      return punchingBag(materials, kit);
    case 'courtyard-tree':
    case 'square-basin':
    case 'canteen-podium':
    case 'service-counter':
    case 'training-rig':
    case 'vent-duct':
    case 'bench-bank':
    case 'waiting-bench':
    case 'exam-low-barrier':
    case 'medical-cabinet':
    case 'weapon-case':
    case 'pipe-run':
    case 'strip-light':
    case 'warning-beacon':
    case 'equipment-cage':
    case 'k9-course-gate':
    case 'gas-rack':
    case 'exam-door-portal':
    case 'hazard-floor-zone':
    case 'industrial-service-bank':
    case 'overhead-service-gantry':
    case 'signal-pylon':
    case 'exit-chevrons':
      return simple(placement.model, materials, kit);
    default:
      throw new Error(`Modèle d’habillage inconnu : ${placement.model}`);
  }
}
/** Factory par carte : géométries et matières partagées, ancrage au centre réel de l'emprise. */
export class EnvironmentPropFactory {
  private readonly kit = new PropGeometryLibrary();
  private readonly factoryModels = new FactoryModels();
  private readonly materials: EnvironmentMaterials;
  constructor(
    private readonly cellToWorld: (cell: ExploreVisualPlacement['cell']) => { x: number; z: number },
    rng: Rng,
  ) {
    this.materials = new EnvironmentMaterials(rng);
  }
  create(placement: ExploreVisualPlacement): THREE.Object3D {
    const object = placement.model.startsWith('factory:')
      ? this.factoryModels.create(placement.model)
      : createEnvironmentProp(placement, this.materials, this.kit);
    // Ces petits détails sont montés sur le meuble qui occupe déjà la case :
    // une seule emprise, une seule règle de découverte et aucun obstacle fantôme.
    const attachments: Record<string, { model: string; x: number; y: number; z: number; scale: number }[]> = {
      'hall.banc-est': [{ model: 'box-large', x: 0.45, y: 0.62, z: 0, scale: 0.75 }],
      'hall.casier-archives': [{ model: 'screen-wide', x: 0, y: 1.32, z: -0.52, scale: 0.7 }],
      'salle1.mobilier-ouest': [{ model: 'robot-arm-a', x: 0, y: 0.97, z: 0, scale: 0.55 }],
      'salle1.poste-securite': [{ model: 'scanner-high', x: 0, y: 2.32, z: 0, scale: 0.6 }],
      'salle2.armoire': [{ model: 'screen-wide', x: 0, y: 0.88, z: 0.57, scale: 0.5 }],
      'salle3.console': [{ model: 'screen-wide', x: 0, y: 0.95, z: -0.2, scale: 0.8 }],
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
    if (placement.offset) object.position.add(new THREE.Vector3(placement.offset.x, placement.offset.y, placement.offset.z));
    if (placement.scale) object.scale.setScalar(placement.scale);
    return object;
  }
  dispose(): void {
    this.factoryModels.dispose();
    this.kit.dispose();
    this.materials.dispose();
  }
}
