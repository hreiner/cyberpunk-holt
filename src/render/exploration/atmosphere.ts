/**
 * Lumière commune : trois sources globales, plus des lumières locales bon marché posées par
 * les luminaires du décor (réglettes, balises -- voir `EnvironmentPropFactory`/`props.ts`,
 * ADR 0018). Les trois globales restent calibrées pour DEUX climats bien séparés
 * (ART-DIRECTION.md "Lumière", EXPLORATION-VISUAL-DESIGN.md "Valeurs, lumière et matières") :
 * l'académie institutionnelle, propre, éclairée d'en haut, contre le centre d'examen abandonné
 * et contrasté, où l'ambiance globale est délibérément SOUS le niveau de l'académie afin que ce
 * soit visiblement "ce qui marche encore" (les luminaires locaux) qui porte la lecture des
 * pièces, pas le soleil général.
 */
import * as THREE from 'three';

export function addExplorationLighting(scene: THREE.Scene, extent: number, centre: boolean): void {
  // Les trois sources restent fixes : hémisphère, soleil et contre-jour. Le soleil porte
  // désormais les valeurs principales afin que mobilier et seuils dessinent le sol.
  // Hémisphère du centre relevé de 0,62 à 0,82 : à 0,62, tout ce que le soleil rasant ne
  // touchait pas tombait dans un quasi-noir où l'on ne distinguait plus une cage d'un mur --
  // le contraste restait, mais la moitié de chaque salle devenait illisible. Le centre reste
  // nettement sous l'académie (0,82 contre 1,05) et le soleil, lui, ne bouge pas : c'est
  // toujours l'éclairage local qui dessine les pièces, mais on voit dans les coins.
  scene.add(new THREE.HemisphereLight(centre ? 0x6c8184 : 0xd9d5c9, centre ? 0x1c2729 : 0x5c5650, centre ? 0.82 : 1.05));
  const sun = new THREE.DirectionalLight(centre ? 0xc9d9d6 : 0xffeed1, centre ? 2.4 : 4.2);
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
