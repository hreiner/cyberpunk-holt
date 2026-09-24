/** Lumière commune : trois sources seulement, calibrées pour les deux contrastes de lieu. */
import * as THREE from 'three';

export function addExplorationLighting(scene: THREE.Scene, extent: number, centre: boolean): void {
  // Les trois sources restent fixes : hémisphère, soleil et contre-jour. Le soleil porte
  // désormais les valeurs principales afin que mobilier et seuils dessinent le sol.
  scene.add(new THREE.HemisphereLight(centre ? 0x80989b : 0xd9d5c9, centre ? 0x27363a : 0x5c5650, centre ? 0.9 : 1.05));
  const sun = new THREE.DirectionalLight(centre ? 0xdbe7e3 : 0xffeed1, centre ? 3.25 : 4.2);
  // Angle bas : les ombres traversent les pièces et portent la composition au sol.
  sun.position.set(28, 26, 16);
  sun.castShadow = true;
  const shadowHalf = extent / 2 + 3;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -shadowHalf;
  sun.shadow.camera.right = shadowHalf;
  sun.shadow.camera.top = shadowHalf;
  sun.shadow.camera.bottom = -shadowHalf;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 1.5;
  scene.add(sun.target);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x4cc9f0, centre ? 0.3 : 0.24);
  rim.position.set(-20, 12, -24);
  scene.add(rim);
}
