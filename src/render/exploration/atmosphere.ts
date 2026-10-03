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

export function addExplorationLighting(
  scene: THREE.Scene,
  extent: number,
  centre: boolean,
): ExplorationLights {
  // Les trois sources restent fixes : hémisphère, soleil et contre-jour. Le soleil porte
  // désormais les valeurs principales afin que mobilier et seuils dessinent le sol.
  // Le centre garde une base plus basse et plus froide que HOLT, avec assez de remplissage
  // pour distinguer les silhouettes et les volumes dans les zones que le soleil rasant
  // n'atteint pas. Les points chauds locaux restent le premier indice des pièces actives.
  const hemisphere = new THREE.HemisphereLight(
    centre ? 0x6c8184 : 0xd9d5c9,
    centre ? 0x303a46 : 0x5c5650,
    centre ? 1.28 : 1.05,
  );
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(centre ? 0xc9d9d6 : 0xffeed1, centre ? 3.0 : 4.2);
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
  const rim = new THREE.DirectionalLight(0x4cc9f0, centre ? 0.34 : 0.24);
  rim.position.set(-20, 12, -24);
  scene.add(rim);
  return { hemisphere, sun, rim };
}

/** Climat nocturne d'une carte a etapes (ADR 0026) : `null` restaure le calibrage par defaut. */
export type NightMood = 'bal' | 'fuite' | 'conduits' | 'cantine' | 'campement' | null;

/**
 * Valeurs de secours si `setMood` ne stocke pas le calibrage d'origine (voir `ExploreView`,
 * qui les lit avant tout appel a `applyNightMood` et les restaure a `null`) -- gardees ici pour
 * que la logique de climat reste a cote de `addExplorationLighting`, qu'elle module.
 */
export function applyNightMood(lights: ExplorationLights, mood: NightMood, centre = false): void {
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
  if (mood === 'conduits') {
    // Les conduits (GAME-DESIGN scene 5, lot 5.9) restent nocturnes et froids, mais les sols
    // et les silhouettes doivent se lire entre les appliques chaudes et la lueur cyan. Le
    // dispositif conserve ses trois sources globales : ce remplissage élève l'ambiance, sans
    // ajouter de lumière générale ni effacer les foyers locaux.
    lights.hemisphere.color.setHex(0x99aec8);
    lights.hemisphere.groundColor.setHex(0x4b5668);
    lights.hemisphere.intensity = 1.34;
    lights.sun.color.setHex(0x8fa2b8);
    lights.sun.intensity = 1.2;
    lights.rim.color.setHex(0x2f6f8f);
    lights.rim.intensity = 0.27;
    return;
  }
  if (mood === 'cantine') {
    // La cantine des petits (GAME-DESIGN scene 6, lot 5.9) garde les brasiers rouges comme
    // points chauds, avec un remplissage neutre plus clair pour séparer les cadets et le bois.
    lights.hemisphere.color.setHex(0xbfa194);
    lights.hemisphere.groundColor.setHex(0x424451);
    lights.hemisphere.intensity = 0.72;
    lights.sun.color.setHex(0xff5a2a);
    lights.sun.intensity = 1.28;
    lights.rim.color.setHex(0xff2a10);
    lights.rim.intensity = 0.4;
    return;
  }
  if (mood === 'campement') {
    // Un exterieur de nuit dans les Badlands (GAME-DESIGN scene 9, lot 5.10) : lune froide,
    // basse, bleutee -- assez pour lire tentes, camion et silhouettes, jamais assez pour
    // concurrencer le feu de camp (`props.ts`, sa `PointLight` qui vacille), seule source
    // chaude de la carte et centre de la composition.
    lights.hemisphere.color.setHex(0x6d80a6);
    // Un peu plus de rebond froid garde les volumes lisibles jusque dans les ombres ; le
    // bleu ardoise du sol reste sombre pour préserver le contraste avec le feu de camp.
    lights.hemisphere.groundColor.setHex(0x343846);
    lights.hemisphere.intensity = 0.98;
    lights.sun.color.setHex(0xa9bddf);
    lights.sun.intensity = 1.65;
    lights.rim.color.setHex(0x5a7fb8);
    lights.rim.intensity = 0.34;
    return;
  }
  // Repli : calibrage "academie" par defaut (`centre === false` dans `addExplorationLighting`) --
  // seules les cartes du chapitre 2 (`holt-nuit`, `conduits`, `campement`) appellent `applyNightMood` avec un climat
  // non nul (voir `ExploreSession.enterStep`), ce repli reste donc surtout defensif.
  lights.hemisphere.color.setHex(centre ? 0x6c8184 : 0xd9d5c9);
  lights.hemisphere.groundColor.setHex(centre ? 0x303a46 : 0x5c5650);
  lights.hemisphere.intensity = centre ? 1.28 : 1.05;
  lights.sun.color.setHex(centre ? 0xc9d9d6 : 0xffeed1);
  lights.sun.intensity = centre ? 3.0 : 4.2;
  lights.rim.color.setHex(0x4cc9f0);
  lights.rim.intensity = centre ? 0.34 : 0.24;
}
