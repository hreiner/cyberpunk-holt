/** Peaux architecturales basses : panneau béton, bande pétrole et arête de coupe. */
import * as THREE from 'three';
import type { EnvironmentMaterials } from './materials';

const wallDetailGeometry = new THREE.BoxGeometry(1, 1, 1);

export function createWallBand(materials: EnvironmentMaterials, centre: boolean): THREE.Mesh {
  const band = new THREE.Mesh(wallDetailGeometry, materials.get(centre ? 'petrolPaint' : 'petrolPaint'));
  band.scale.set(0.987, 0.28, 0.987);
  band.position.y = centre ? 0.62 : 0.76;
  band.castShadow = false;
  band.receiveShadow = true;
  return band;
}

/** Cadre de contrôle maigre, utilisable sur les portes sans inventer une interaction. */
export function createDoorControl(materials: EnvironmentMaterials): THREE.Group {
  const group = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.06), materials.get('darkMetal'));
  back.position.set(0, 0.85, 0.49);
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.02), materials.get('cyanSignal'));
  light.position.set(0, 0.87, 0.53);
  group.add(back, light);
  return group;
}

/** Caméra compacte, lisible depuis l'iso sans devenir une nouvelle interaction. */
export function createSurveillanceCamera(materials: EnvironmentMaterials): THREE.Group {
  const group = new THREE.Group();
  const metal = materials.get('darkMetal');
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), metal);
  bracket.position.y = 1.75;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.24), metal);
  body.position.set(0, 1.52, 0.18);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 8), materials.get('cyanSignal'));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.52, 0.32);
  group.add(bracket, body, lens);
  return group;
}

/** Canal de câbles institutionnel : court, net et répété seulement aux seuils utiles. */
export function createTechnicalConduit(materials: EnvironmentMaterials, length = 1.6): THREE.Group {
  const group = new THREE.Group();
  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, length, 8), materials.get('darkMetal'));
  conduit.rotation.z = Math.PI / 2;
  conduit.position.y = 1.52;
  group.add(conduit);
  for (const x of [-length / 2 + 0.15, length / 2 - 0.15]) {
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.1), materials.get('wornMetal'));
    clamp.position.set(x, 1.52, 0.03);
    group.add(clamp);
  }
  return group;
}
