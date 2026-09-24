import * as THREE from 'three';
import { getCharacter } from '@/rules/character';
import { createCadetExplorationRig } from '@/render/exploration/cadetRig';
import { preloadCadetAssets } from '@/render/exploration/characterAssets';

await preloadCadetAssets();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x716d68);
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x9b9285, roughness: 1 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const sun = new THREE.DirectionalLight(0xffe7c4, 2.5);
sun.position.set(-3, 7, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const ids = ['franklyn', 'abigail', 'letitia', 'john', 'grover', 'zachary'] as const;
const rigs = ids.map((id, index) => {
  const rig = createCadetExplorationRig(getCharacter(id));
  rig.object.position.x = (index - 2.5) * 1.05;
  rig.object.getObjectByName('cadet-label')!.visible = false;
  scene.add(rig.object);
  return rig;
});
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.01, 100);
camera.position.set(0, 2.1, 11.6);
camera.lookAt(0, 0.9, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();
function tick() {
  const dt = clock.getDelta();
  for (const rig of rigs) rig.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
(window as Window & { previewRigs?: typeof rigs }).previewRigs = rigs;
