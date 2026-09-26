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

/**
 * References des trois sources globales, rendues par `addExplorationLighting` (ADR 0026,
 * lot 5.8b) : `setNightMood` (`ExploreView`) les ajuste pour `holt-nuit` sans toucher a leur
 * calibrage par defaut (`holt`/`centre-examen` ne les lisent jamais).
 */
export interface ExplorationLights {
  hemisphere: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
}

export function addExplorationLighting(scene: THREE.Scene, extent: number, centre: boolean): ExplorationLights {
  // Les trois sources restent fixes : hémisphère, soleil et contre-jour. Le soleil porte
  // désormais les valeurs principales afin que mobilier et seuils dessinent le sol.
  // Hémisphère du centre relevé de 0,62 à 0,82 : à 0,62, tout ce que le soleil rasant ne
  // touchait pas tombait dans un quasi-noir où l'on ne distinguait plus une cage d'un mur --
  // le contraste restait, mais la moitié de chaque salle devenait illisible. Le centre reste
  // nettement sous l'académie (0,82 contre 1,05) et le soleil, lui, ne bouge pas : c'est
  // toujours l'éclairage local qui dessine les pièces, mais on voit dans les coins.
  const hemisphere = new THREE.HemisphereLight(
    centre ? 0x6c8184 : 0xd9d5c9,
    centre ? 0x1c2729 : 0x5c5650,
    centre ? 0.82 : 1.05,
  );
  scene.add(hemisphere);
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
  return { hemisphere, sun, rim };
}

/** Climat nocturne d'une carte a etapes (ADR 0026) : `null` restaure le calibrage par defaut. */
export type NightMood = 'bal' | 'fuite' | 'campement' | null;

/**
 * Valeurs de secours si `setMood` ne stocke pas le calibrage d'origine (voir `ExploreView`,
 * qui les lit avant tout appel a `applyNightMood` et les restaure a `null`) -- gardees ici pour
 * que la logique de climat reste a cote de `addExplorationLighting`, qu'elle module.
 */
export function applyNightMood(lights: ExplorationLights, mood: NightMood): void {
  if (mood === 'bal') {
    // Chaud, colore, mais pas SOMBRE : la derniere fete avant la chute (GAME-DESIGN scene 2),
    // pas un couloir eteint. Revu le 2026-09-26 (relu "trop sombre et brun") : intensites
    // relevees d'un cran sur les trois sources -- l'hemisphere reste sous le calibrage "jour"
    // de l'academie (1.05, `addExplorationLighting`) pour garder une ambiance de nuit, mais
    // assez haut pour lire les buffets et les guirlandes sans plisser les yeux. Les guirlandes
    // et lampions (`props.ts`, lumieres locales ADR 0018) restent le repere de "piste de danse"
    // au premier coup d'oeil ; cette ambiance globale les soutient au lieu de les noyer.
    lights.hemisphere.color.setHex(0xffc699);
    lights.hemisphere.groundColor.setHex(0x6a2f4c);
    lights.hemisphere.intensity = 0.78;
    lights.sun.color.setHex(0xffb37a);
    lights.sun.intensity = 2.05;
    lights.rim.color.setHex(0xff6fb0);
    lights.rim.intensity = 0.55;
    return;
  }
  if (mood === 'fuite') {
    // Sombre, orange, bas : l'academie qui brule (GAME-DESIGN scene 4). Nettement sous le
    // calibrage "centre d'examen abandonne" (deja le plus bas des deux climats par defaut) --
    // c'est la lueur du feu pres des portes bloquees (`props.ts`) qui doit porter la lecture.
    lights.hemisphere.color.setHex(0x5a4030);
    lights.hemisphere.groundColor.setHex(0x150c08);
    lights.hemisphere.intensity = 0.34;
    lights.sun.color.setHex(0xff6a35);
    lights.sun.intensity = 0.9;
    lights.rim.color.setHex(0xff3c1e);
    lights.rim.intensity = 0.22;
    return;
  }
  if (mood === 'campement') {
    // Un exterieur de nuit dans les Badlands (GAME-DESIGN scene 9, lot 5.10) : lune froide,
    // basse, bleutee -- assez pour lire tentes, camion et silhouettes, jamais assez pour
    // concurrencer le feu de camp (`props.ts`, sa `PointLight` qui vacille), seule source
    // chaude de la carte et centre de la composition.
    lights.hemisphere.color.setHex(0x6d80a6);
    lights.hemisphere.groundColor.setHex(0x1b1712);
    lights.hemisphere.intensity = 0.62;
    lights.sun.color.setHex(0xa9bddf);
    lights.sun.intensity = 1.4;
    lights.rim.color.setHex(0x5a7fb8);
    lights.rim.intensity = 0.3;
    return;
  }
  // Repli : calibrage "academie" par defaut (`centre === false` dans `addExplorationLighting`) --
  // seules les cartes du chapitre 2 (`holt-nuit`, `campement`) appellent `applyNightMood` avec un climat
  // non nul (voir `ExploreSession.enterStep`), ce repli reste donc surtout defensif.
  lights.hemisphere.color.setHex(0xd9d5c9);
  lights.hemisphere.groundColor.setHex(0x5c5650);
  lights.hemisphere.intensity = 1.05;
  lights.sun.color.setHex(0xffeed1);
  lights.sun.intensity = 4.2;
  lights.rim.color.setHex(0x4cc9f0);
  lights.rim.intensity = 0.24;
}
