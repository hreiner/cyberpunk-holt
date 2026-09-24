/** Kit sémantique partagé du dortoir, de l'académie et du centre d'examen. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Rng } from '@/core/rng';
import type { ExploreVisualPlacement } from '@/data/exploreVisualTypes';
import { EXPLORE_VISUAL_MODELS } from '@/data/exploreVisualModels';
import { EnvironmentMaterials } from './materials';
import { FactoryModels } from './factoryModels';

class PropGeometryLibrary {
  readonly box = new RoundedBoxGeometry(1, 1, 1, 3, 0.055);
  readonly post = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);
  readonly crown = new THREE.IcosahedronGeometry(0.75, 1);
  readonly wheel = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 10);
  readonly drum = new THREE.CylinderGeometry(0.29, 0.29, 0.86, 12);
  readonly ring = new THREE.TorusGeometry(2.1, 0.07, 6, 40);
  readonly routeArrow = new THREE.BufferGeometry();
  /** Tache de contact au sol, réutilisée par les objets suspendus (voir `attachGroundContact`). */
  readonly groundBlob = new THREE.PlaneGeometry(1, 1);
  constructor() {
    // Chevron pointant vers -Z : c'est la rotation du placement qui choisit la sortie visée.
    this.routeArrow.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, -0.36,
      -0.34, 0, 0.24,
      0.34, 0, 0.24,
    ], 3));
    this.routeArrow.computeVertexNormals();
  }
  dispose(): void {
    this.box.dispose();
    this.post.dispose();
    this.crown.dispose();
    this.wheel.dispose();
    this.drum.dispose();
    this.ring.dispose();
    this.routeArrow.dispose();
    this.groundBlob.dispose();
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
  const group = table(materials, kit);
  for (const [x, z] of [
    [-0.38, -0.24],
    [0.32, 0.3],
  ] as const) {
    box(group, kit, materials.get('linen'), x, 0.855, z, 0.42, 0.03, 0.3);
    box(group, kit, materials.get('wornMetal'), x, 0.875, z, 0.36, 0.012, 0.24);
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
/**
 * Armoire blindée. Un pavé sombre de 1,7 m ne lit que comme « un cube noir » à
 * la distance isométrique — défaut constaté à l'armurerie sur la première manche
 * de captures. On lui donne donc ce qui fait une armoire : deux battants avec
 * leur refend, un volant de condamnation, des ouïes, un socle en retrait et une
 * casquette de toit qui casse le cube.
 */
function electricalLocker(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const dark = materials.get('darkMetal');
  const worn = materials.get('wornMetal');
  box(group, kit, dark, 0, 0.09, 0, 1.6, 0.18, 1.6);
  box(group, kit, dark, 0, 1.2, 0, 1.68, 2.12, 1.66);
  // Casquette débordante : l'arête claire qui sort le volume du fond.
  box(group, kit, worn, 0, 2.3, 0.04, 1.84, 0.16, 1.78);
  // Deux battants, refend central, ouïes de ventilation.
  for (const x of [-0.42, 0.42]) {
    box(group, kit, worn, x, 1.26, 0.85, 0.74, 1.72, 0.05);
    for (let y = 1.74; y < 2.02; y += 0.11) box(group, kit, dark, x, y, 0.89, 0.54, 0.035, 0.03);
  }
  box(group, kit, dark, 0, 1.26, 0.88, 0.06, 1.8, 0.05);
  // Volant de condamnation et voyant : l'objet dit qu'il est fermé.
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 6, 14), materials.get('amberSignal'));
  wheel.position.set(0.42, 1.12, 0.92);
  group.add(wheel);
  box(group, kit, dark, 0.42, 1.12, 0.9, 0.06, 0.34, 0.05);
  box(group, kit, materials.get('cyanSignal'), -0.42, 1.12, 0.9, 0.16, 0.24, 0.025);
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
  box(group, kit, materials.get('cyanSignal'), -0.2, 1.24, -0.34, 0.62, 0.42, 0.016);
  // Siege recule, dossier tourne vers le plan de travail.
  box(group, kit, materials.get('petrolPaint'), -0.1, 0.46, 0.42, 0.58, 0.1, 0.56);
  box(group, kit, materials.get('petrolPaint'), -0.1, 0.78, 0.66, 0.58, 0.56, 0.1);
  post(group, kit, metal, -0.1, 0.42, 0.44);
  return group;
}
/** Armoire a pharmacie : blanche, vitree, poignee visible — jamais confondue avec une armoire blindee. */
function medicalCabinet(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('linen'), 0, 0.98, 0, 0.92, 1.96, 0.5);
  for (const y of [0.52, 1.02, 1.52]) box(group, kit, materials.get('wornMetal'), 0, y, -0.02, 0.84, 0.05, 0.42);
  box(group, kit, materials.get('cyanSignal'), 0, 1.16, -0.26, 0.76, 1.32, 0.02);
  box(group, kit, materials.get('darkMetal'), 0.3, 1.16, -0.29, 0.05, 0.3, 0.035);
  box(group, kit, materials.get('alarmRed'), 0, 2.02, -0.16, 0.3, 0.06, 0.06);
  box(group, kit, materials.get('alarmRed'), 0, 2.02, -0.16, 0.06, 0.3, 0.06);
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
  box(group, kit, materials.get('wood'), 0, 0.74, -0.16, 0.88, 0.12, 0.6);
  for (const x of [-0.31, 0.31])
    for (const z of [-0.24, 0.24]) post(group, kit, materials.get('darkMetal'), x, z - 0.16, 0.7);
  box(group, kit, materials.get('linen'), 0, 0.82, -0.18, 0.48, 0.018, 0.36);
  // Siege recule dans la meme case : le pupitre tient honnetement dans un metre.
  box(group, kit, materials.get('darkMetal'), 0, 0.43, 0.32, 0.6, 0.1, 0.36);
  box(group, kit, materials.get('darkMetal'), 0, 0.68, 0.46, 0.6, 0.4, 0.08);
  return group;
}
/**
 * Fourgon. Silhouette en DEUX masses (cabine basse à l'avant, caisson haut à
 * l'arrière) plutôt qu'un seul pavé : à la distance isométrique, un bloc unique
 * ne se distingue pas d'une armoire couchée. Le pare-brise et le bandeau de toit
 * donnent l'avant, les passages de roue donnent l'échelle.
 */
function van(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const body = materials.get('containerSteel');
  const dark = materials.get('darkMetal');
  // Châssis et caisson arrière.
  box(group, kit, dark, 0, 0.44, 0.1, 2.42, 0.42, 4.2);
  box(group, kit, body, 0, 1.36, 0.62, 2.36, 1.64, 3.0);
  box(group, kit, materials.get('petrolPaint'), 0, 1.5, -0.86, 2.4, 0.5, 0.06);
  // Cabine : plus basse, avec pare-brise incliné vers l'avant (-Z).
  box(group, kit, body, 0, 1.06, -1.32, 2.28, 1.06, 1.1);
  box(group, kit, dark, 0, 1.34, -1.62, 1.96, 0.58, 0.5);
  box(group, kit, materials.get('cyanSignal'), 0, 1.3, -1.9, 1.7, 0.42, 0.04);
  // Rampe lumineuse de toit : c'est ce qui dit « police » de loin.
  box(group, kit, dark, 0, 2.24, -1.3, 1.5, 0.16, 0.34);
  box(group, kit, materials.get('alarmRed'), -0.38, 2.24, -1.3, 0.6, 0.18, 0.36);
  box(group, kit, materials.get('cyanSignal'), 0.38, 2.24, -1.3, 0.6, 0.18, 0.36);
  for (const x of [-1.18, 1.18])
    for (const z of [-1.28, 1.42]) {
      const wheel = new THREE.Mesh(kit.wheel, dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.3, z);
      wheel.castShadow = true;
      group.add(wheel);
      box(group, kit, body, x * 0.94, 0.78, z, 0.16, 0.46, 0.86);
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
/**
 * Conduite de plafond. Aucun pied au sol : ce modele est classe `overhead` et
 * se pose au-dessus de cases FRANCHISSABLES — un pied dessine ici mentirait au
 * joueur, qui le traverserait (ADR 0017, l'ASCII est la verite de collision).
 */
function pipeRun(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
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
function stripLight(materials: EnvironmentMaterials, kit: PropGeometryLibrary, isCentre: boolean): THREE.Group {
  const group = new THREE.Group();
  box(group, kit, materials.get('darkMetal'), 0, 2.54, 0, 1.5, 0.07, 0.18);
  box(group, kit, materials.get('cyanSignal'), 0, 2.44, 0, 1.62, 0.1, 0.3);
  for (const x of [-0.6, 0.6]) box(group, kit, materials.get('darkMetal'), x, 2.7, 0, 0.05, 0.3, 0.05);
  const light = new THREE.PointLight(isCentre ? 0x49c7d6 : 0xe9f6ff, isCentre ? 1.1 : 1.6, isCentre ? 3.6 : 4.6, 2);
  light.position.set(0, 2.4, 0);
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
/**
 * Portique suspendu au plafond. Comme `pipeRun`, aucun appui au sol : il cadre
 * un passage par le haut, jamais par les pieds (voir `ExploreVisualOccupancy`).
 */
function overheadServiceGantry(materials: EnvironmentMaterials, kit: PropGeometryLibrary): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('wornMetal');
  box(group, kit, metal, 0, 2.56, 0, 4.8, 0.16, 0.36);
  box(group, kit, metal, 0, 2.39, -0.18, 4.42, 0.055, 0.055);
  for (const x of [-1.8, -0.6, 0.6, 1.8]) {
    box(group, kit, materials.get('amberSignal'), x, 2.36, -0.22, 0.42, 0.08, 0.05);
    box(group, kit, materials.get('darkMetal'), x, 2.82, 0, 0.07, 0.36, 0.07);
  }
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
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.1, 10), materials.get('amberSignal'));
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
    const mesh = new THREE.Mesh(kit.drum, materials.get(tints[index % tints.length] as (typeof tints)[number]));
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
  for (let x = -0.22; x <= 0.22; x += 0.11) box(group, kit, materials.get('wornMetal'), x, 0.032, 0, 0.035, 0.012, 0.36);
  return group;
}
function simple(model: string, materials: EnvironmentMaterials, kit: PropGeometryLibrary, isCentre: boolean): THREE.Group {
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
    box(group, kit, materials.get('amberSignal'), 0, 0.73, -0.06, 0.62, 0.22, 0.02);
    return group;
  }
  if (model === 'training-rig') {
    // Cage d'agrès : une vraie structure de 3 x 3 m, barres à trois hauteurs.
    const metal = materials.get('darkMetal');
    for (const x of [-1.32, 1.32]) for (const z of [-1.32, 1.32]) post(group, kit, metal, x, z, 2.52);
    for (const z of [-1.32, 1.32]) box(group, kit, metal, 0, 2.46, z, 2.74, 0.13, 0.13);
    for (const x of [-1.32, 1.32]) box(group, kit, metal, x, 2.46, 0, 0.13, 0.13, 2.74);
    for (const y of [1.1, 1.72]) box(group, kit, materials.get('wornMetal'), -1.32, y, 0, 0.1, 0.1, 2.6);
    for (const z of [-0.44, 0.44]) box(group, kit, materials.get('wornMetal'), 0.4, 2.3, z, 1.7, 0.09, 0.09);
    box(group, kit, materials.get('rust'), 0.7, 0.07, 0.7, 1.5, 0.14, 1.5);
    return group;
  }
  if (model === 'vent-duct') {
    // Tôle claire, pas métal noir : suspendue sans plafond visible, une gaine
    // sombre ne se lit que comme une barre flottante.
    box(group, kit, materials.get('wornMetal'), 0, 2.2, 0, 2.8, 0.34, 0.4);
    for (const x of [-0.94, 0, 0.94]) box(group, kit, materials.get('darkMetal'), x, 2.2, 0, 0.07, 0.4, 0.46);
    // Panneau arraché : c'est par là que passe le gaz de la salle 3.
    box(group, kit, materials.get('darkMetal'), 1.05, 1.98, -0.22, 0.6, 0.22, 0.34);
    for (const x of [-0.5, 0.5]) box(group, kit, materials.get('darkMetal'), x, 2.52, 0, 0.05, 0.3, 0.05);
    return group;
  }
  if (model === 'kennel-run') return kennelRun(materials, kit);
  if (model === 'barrel-stack') return barrelStack(materials, kit);
  if (model === 'crate-stack') return crateStack(materials, kit);
  if (model === 'combat-circle') {
    // Cercle peint : le seul marquage qui justifie un centre de pièce vide.
    const ring = new THREE.Mesh(kit.ring, materials.get('amberSignal'));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.024;
    ring.scale.set(1, 1, 3.2);
    group.add(ring);
    for (const [x, z] of [[-2.1, 0], [2.1, 0], [0, -2.1], [0, 2.1]] as const)
      box(group, kit, materials.get('alarmRed'), x, 0.026, z, 0.5, 0.02, 0.5);
    return group;
  }
  if (model === 'pipe-run') return pipeRun(materials, kit);
  if (model === 'strip-light') return stripLight(materials, kit, isCentre);
  if (model === 'warning-beacon') return warningBeacon(materials, kit);
  if (model === 'locker-open') return personalLocker(materials, kit);
  if (model === 'floor-grate') return floorVent(materials, kit);
  if (model === 'equipment-cage') return equipmentCage(materials, kit);
  if (model === 'k9-course-gate') return k9CourseGate(materials, kit);
  if (model === 'gas-rack') return gasRack(materials, kit);
  if (model === 'exam-door-portal') return examDoorPortal(materials, kit);
  if (model === 'hazard-floor-zone') return hazardFloorZone(materials, kit);
  if (model === 'industrial-service-bank') return industrialServiceBank(materials, kit);
  if (model === 'overhead-service-gantry') return overheadServiceGantry(materials, kit);
  if (model === 'signal-pylon') return signalPylon(materials, kit);
  if (model === 'exit-chevrons') {
    // Quatre chevrons alignés, pointe vers -Z : la rotation du placement décide
    // vers quelle sortie ils pointent, et l'emprise 4 x 2 reste honnête.
    for (const x of [-1.5, -0.5, 0.5, 1.5]) {
      const arrow = new THREE.Mesh(kit.routeArrow, materials.get('cyanSignal'));
      arrow.position.set(x, 0.035, 0.1);
      group.add(arrow);
    }
    box(group, kit, materials.get('darkMetal'), 0, 0.028, 0.58, 3.7, 0.02, 0.09);
    return group;
  }
  if (model === 'weapon-case') {
    box(group, kit, materials.get('darkMetal'), 0, 0.38, 0, 1.12, 0.58, 0.76);
    box(group, kit, materials.get('rust'), 0, 0.69, 0, 1.18, 0.07, 0.82);
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
    // Comptoir de self : caisson, plan inox et glissière à plateaux. Sans ces
    // trois niveaux, il ne lit que comme une longue poutre posée au mur.
    box(group, kit, materials.get('wood'), 0, 0.42, 0, 0.72, 0.84, 6.7);
    box(group, kit, materials.get('wornMetal'), 0, 0.88, 0, 0.9, 0.09, 6.9);
    box(group, kit, materials.get('darkMetal'), -0.42, 0.72, 0, 0.09, 0.07, 6.7);
    box(group, kit, materials.get('coldConcrete'), 0.3, 1.52, 0, 0.3, 1.2, 6.7);
    for (let z = -2.7; z <= 2.8; z += 1.35)
      box(group, kit, materials.get('amberSignal'), 0.12, 1.06, z, 0.02, 0.28, 0.92);
    return group;
  }
  throw new Error(`Modèle d’habillage inconnu : ${model}`);
}
export function createEnvironmentProp(
  placement: ExploreVisualPlacement,
  materials: EnvironmentMaterials,
  kit: PropGeometryLibrary,
  isCentre: boolean,
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
      return consoleProp(materials, kit);
    case 'security-station':
      return securityStation(materials, kit);
    case 'medical-cabinet':
      return medicalCabinet(materials, kit);
    case 'secure-locker':
      return electricalLocker(materials, kit);
    case 'admin-desk':
      return receptionDesk(materials, kit);
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
    case 'waiting-bench':
    case 'exam-low-barrier':
    case 'weapon-case':
    case 'pipe-run':
    case 'strip-light':
    case 'warning-beacon':
    case 'equipment-cage':
    case 'k9-course-gate':
    case 'kennel-run':
    case 'barrel-stack':
    case 'crate-stack':
    case 'combat-circle':
    case 'gas-rack':
    case 'exam-door-portal':
    case 'hazard-floor-zone':
    case 'industrial-service-bank':
    case 'overhead-service-gantry':
    case 'signal-pylon':
    case 'exit-chevrons':
    case 'locker-open':
    case 'floor-grate':
      return simple(placement.model, materials, kit, isCentre);
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
const OVERHEAD_GROUND_CONTACT = new Set(['vent-duct', 'pipe-run', 'overhead-service-gantry']);

/**
 * Tache de contact au sol sous un objet suspendu : un disque sombre et doux, sans lumière ni
 * relief, qui donne un "en dessous, séparé" -- la lecture la moins chère d'une suspension sans
 * plafond ni ombre projetée (celle-ci est désactivée juste au-dessus, voir le commentaire sur
 * `castShadow`). Dimensionnée sur l'emprise déclarée du modèle (`EXPLORE_VISUAL_MODELS`), donc
 * cohérente avec la légende affichée dans `docs/art/ROOM-COMPOSITION.md`.
 */
function attachGroundContact(
  object: THREE.Object3D,
  kit: PropGeometryLibrary,
  material: THREE.Material,
  cells: readonly [number, number],
  rotation: number,
): void {
  const [w, h] = rotation === 90 || rotation === 270 ? [cells[1], cells[0]] : cells;
  const blob = new THREE.Mesh(kit.groundBlob, material);
  blob.scale.set(Math.max(0.7, w * 0.6), Math.max(0.7, h * 0.6), 1);
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.015;
  object.add(blob);
}

/** Factory par carte : géométries et matières partagées, ancrage au centre réel de l'emprise. */
export class EnvironmentPropFactory {
  private readonly kit = new PropGeometryLibrary();
  private readonly factoryModels = new FactoryModels();
  private readonly materials: EnvironmentMaterials;
  private readonly groundContactMaterial = new THREE.MeshBasicMaterial({
    color: 0x08090b,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  constructor(
    private readonly cellToWorld: (cell: ExploreVisualPlacement['cell']) => { x: number; z: number },
    rng: Rng,
    private readonly isCentre: boolean = false,
  ) {
    this.materials = new EnvironmentMaterials(rng);
  }
  create(placement: ExploreVisualPlacement): THREE.Object3D {
    const object = placement.model.startsWith('factory:')
      ? this.factoryModels.create(placement.model)
      : createEnvironmentProp(placement, this.materials, this.kit, this.isCentre);
    const model = EXPLORE_VISUAL_MODELS[placement.model];
    // Un objet suspendu au plafond ne projette pas d'ombre : la scène n'a pas de
    // plafond, donc son ombre tomberait en pleine lumière au milieu de la pièce
    // sous forme d'une barre noire posée sur rien -- défaut réel constaté.
    if (model.occupancy === 'overhead') {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = false;
      });
      if (OVERHEAD_GROUND_CONTACT.has(placement.model)) {
        attachGroundContact(object, this.kit, this.groundContactMaterial, model.cells, placement.rotation ?? 0);
      }
    }
    // Ces petits détails sont montés sur le meuble qui occupe déjà la case :
    // une seule emprise, une seule règle de découverte et aucun obstacle fantôme.
    const attachments: Record<string, { model: string; x: number; y: number; z: number; scale: number }[]> = {
      'hall.cage-materiel': [{ model: 'box-large', x: 0, y: 0.34, z: 0, scale: 0.7 }],
      'hall.banque-technique': [{ model: 'screen-wide', x: 0, y: 1.74, z: -0.34, scale: 0.7 }],
      'salle1.banque-technique': [{ model: 'screen-wide', x: 0, y: 1.74, z: -0.34, scale: 0.7 }],
      'salle1.poste-securite': [{ model: 'scanner-high', x: -0.78, y: 0, z: 0.1, scale: 0.6 }],
      'salle2.armoire': [{ model: 'screen-wide', x: 0, y: 0.88, z: 0.57, scale: 0.5 }],
      'salle3.console': [{ model: 'screen-wide', x: 0, y: 0.95, z: -0.2, scale: 0.8 }],
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
    if (placement.offset) object.position.add(new THREE.Vector3(placement.offset.x, placement.offset.y, placement.offset.z));
    if (placement.scale) object.scale.setScalar(placement.scale);
    return object;
  }
  dispose(): void {
    this.factoryModels.dispose();
    this.kit.dispose();
    this.materials.dispose();
    this.groundContactMaterial.dispose();
  }
}
