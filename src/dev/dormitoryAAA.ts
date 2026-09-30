import './dormitoryAAA.css';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng } from '../core/rng';
import { preloadCadetAssets } from '../render/exploration/characterAssets';
import { createHumanExplorationRig } from '../render/exploration/cadetRig';
import { createExoFranklyn } from './franklynExo';
import { createCadet, POSES, type Cadet, type PoseName } from './cadet';
import { CAST_ORDER, LOOKS } from './cadetLooks';

/** Dedicated art study, intentionally independent of chapter state and saves. */
const params = new URLSearchParams(location.search);
const rng = createRng(params.get('seed') ?? 'holt-last-morning');
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<canvas id="world" aria-label="Dortoir de l'académie HOLT, scène jouable"></canvas>
<div class="vignette"></div><header class="scene-title"><span class="eyebrow">ACADÉMIE HOLT · BADLANDS</span><h1>Le dernier matin</h1><p>DORTOIR 04 <span>06:42</span></p></header>
<div class="scene-status"><i></i> FRANKLYN <span>CADET · PROMOTION 2077</span></div>
<div class="interaction" hidden></div><aside class="story" hidden><span class="eyebrow">DORTOIR 04</span><h2></h2><p></p><button>Reprendre l'exploration <kbd>ÉCHAP</kbd></button></aside>
<footer><div><kbd>CLIC</kbd> Marcher <kbd>ZQSD</kbd> Se déplacer <kbd>E</kbd> Examiner</div><div><kbd>MOLETTE</kbd> Zoom <kbd>GLISSER</kbd> Cadrer <kbd>C</kbd> Recentrer <kbd>H</kbd> Interface</div><button id="portrait-toggle">Franklyn <kbd>P</kbd></button><button id="quality">Qualité élevée</button><button id="metrics-toggle">Mesures</button></footer><div class="portrait-help" hidden>FRANKLYN <span>Glisser pour tourner · Molette pour approcher · P pour revenir</span></div><pre id="metrics" hidden></pre><div id="loading">HOLT <span>Ouverture du dortoir…</span></div>`;
if (params.get('hud') === '0') document.body.classList.add('hide-hud');
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.info.autoReset = false;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene();
scene.background = new T.Color(0x1c252c);
scene.fog = new T.FogExp2(0x46515a, 0.008);
const camera = new T.PerspectiveCamera(39, 1, 0.1, 90);
const cameraTarget = new T.Vector3(-0.15, 1.15, -0.25);
const cameraOffset = new T.Vector3(8.7, 8.5, 12.6);
let zoom = 1;
let portraitMode = false;
let portraitAzimuth = 0;
let portraitElevation = 0.13;
let portraitDistance = 3.2;
function cameraPosition() {
  if (portraitMode) {
    const height = portraitDistance < 2 ? 1.38 : 0.95;
    cameraTarget.set(rig.object.position.x, height, rig.object.position.z);
    camera.position.set(
      cameraTarget.x + Math.sin(portraitAzimuth) * portraitDistance,
      height + portraitElevation * portraitDistance,
      cameraTarget.z + Math.cos(portraitAzimuth) * portraitDistance,
    );
    camera.lookAt(cameraTarget);
    return;
  }
  camera.position.copy(cameraTarget).addScaledVector(cameraOffset, zoom);
  camera.lookAt(cameraTarget);
}
cameraPosition();
const pmrem = new T.PMREMGenerator(renderer);
const environment = new RoomEnvironment();
scene.environment = pmrem.fromScene(environment, 0.03).texture;
scene.environmentIntensity = 0.65;
environment.dispose();
pmrem.dispose();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new T.Vector2(800, 450), 0.19, 0.5, 1.6);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const hemi = new T.HemisphereLight(0xc3d8e9, 0x665448, 1.65);
scene.add(hemi);
const sun = new T.DirectionalLight(0xffd2a0, 4.8);
sun.position.set(-10, 7, -4);
sun.target.position.set(3, 0, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 40;
sun.shadow.normalBias = 0.025;
sun.shadow.bias = -0.00015;
sun.shadow.radius = 3;
scene.add(sun, sun.target);
const fill = new T.DirectionalLight(0x9ebcd0, 1.15);
fill.position.set(3, 6, 8);
scene.add(fill);
const world = new T.Group();
scene.add(world);
const textures = new T.TextureLoader();
const atlasImage = await new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = `${import.meta.env.BASE_URL}assets/dormitory-aaa/material-atlas.jpg`;
});
function atlasTile(x: number, y: number, repeat = 1): T.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  c.getContext('2d')!.drawImage(
    atlasImage,
    (x * atlasImage.width) / 2,
    (y * atlasImage.height) / 2,
    atlasImage.width / 2,
    atlasImage.height / 2,
    0,
    0,
    1024,
    1024,
  );
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}
const floorTex = atlasTile(0, 0, 4);
const wallTex = atlasTile(1, 0, 2);
const clothTex = atlasTile(0, 1);
const metalTex = atlasTile(1, 1);
// Lift the generated painted steel albedo while preserving its scratches.
const steelCanvas = metalTex.image as HTMLCanvasElement;
const steelContext = steelCanvas.getContext('2d')!;
steelContext.globalCompositeOperation = 'screen';
steelContext.fillStyle = '#405464';
steelContext.fillRect(0, 0, 1024, 1024);
steelContext.globalCompositeOperation = 'source-over';
metalTex.needsUpdate = true;
const woodTex = textures.load(`${import.meta.env.BASE_URL}assets/exploration/wood-laminate-cantine-1k.jpg`);
woodTex.colorSpace = T.SRGBColorSpace;
const floorMat = new T.MeshStandardMaterial({
  color: 0xb5afa3,
  map: floorTex,
  bumpMap: floorTex,
  bumpScale: 0.038,
  roughness: 0.26,
  metalness: 0.12,
});
const wallMat = new T.MeshStandardMaterial({
  color: 0xb0aaa0,
  map: wallTex,
  bumpMap: wallTex,
  bumpScale: 0.065,
  roughness: 0.91,
});
const steel = new T.MeshStandardMaterial({
  color: 0xb5c0c6,
  map: metalTex,
  roughness: 0.36,
  metalness: 0.48,
});
const edge = new T.MeshStandardMaterial({ color: 0xa7a596, roughness: 0.29, metalness: 0.72 });
const dark = new T.MeshStandardMaterial({ color: 0x172127, roughness: 0.7, metalness: 0.3 });
const blanket = new T.MeshStandardMaterial({
  color: 0xc4d0d7,
  map: clothTex,
  bumpMap: clothTex,
  bumpScale: 0.018,
  roughness: 0.98,
});
const linen = new T.MeshStandardMaterial({
  color: 0xc9c6ba,
  roughness: 1,
  bumpMap: clothTex,
  bumpScale: 0.008,
});
const wood = new T.MeshStandardMaterial({ color: 0x96764f, map: woodTex, roughness: 0.58 });
const black = new T.MeshStandardMaterial({ color: 0x16191a, roughness: 0.85 });
const strap = new T.MeshStandardMaterial({ color: 0x31322b, roughness: 1 });
const canvasCloth = new T.MeshStandardMaterial({
  color: 0x5a6259,
  roughness: 0.92,
  bumpMap: clothTex,
  bumpScale: 0.006,
});
const brass = new T.MeshStandardMaterial({ color: 0xa19470, roughness: 0.4, metalness: 0.6 });
const teal = new T.MeshStandardMaterial({ color: 0x33464d, map: floorTex, roughness: 0.48 });
const obstacles: { x: number; z: number; w: number; d: number }[] = [];
function box(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: T.Material,
  parent: T.Object3D = world,
  radius = 0,
): T.Mesh {
  const mesh = new T.Mesh(
    radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new T.BoxGeometry(w, h, d),
    mat,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function pipe(a: T.Vector3, b: T.Vector3, radius: number, mat: T.Material, parent: T.Object3D = world) {
  const delta = b.clone().sub(a);
  const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, delta.length(), 12), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function label(text: string, width: number, height: number, color: string, bg: string | null = null) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = Math.round((1024 * height) / width);
  const ctx = c.getContext('2d')!;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.fillStyle = color;
  ctx.font = `700 ${c.height * 0.65}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 512, c.height / 2);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  const mesh = new T.Mesh(
    new T.PlaneGeometry(width, height),
    new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.85, depthWrite: false }),
  );
  return mesh;
}
// Concrete slab and contraction joints: small seams, not a board-game grid.
box(15, 0.32, 12, 0, -0.18, 0, floorMat);
const seam = new T.MeshStandardMaterial({ color: 0x393e3c, roughness: 0.8 });
for (let x = -7.5; x <= 7.5; x += 1.5) box(0.014, 0.007, 12, x, -0.012, 0, seam);
for (let z = -6; z <= 6; z += 1.5) box(15, 0.007, 0.014, 0, -0.012, z, seam);
box(0.64, 0.005, 10, 1.3, -0.01, 0, teal);
// A small planar pass supplies room reflections. Generated concrete and a nine-tap
// filter break their coherence, keeping the finish waxed rather than mirror-like.
const floorReflection = new Reflector(new T.PlaneGeometry(15, 12), {
  textureWidth: 768,
  textureHeight: 768,
  clipBias: 0.003,
  multisample: 0,
  shader: {
    uniforms: {
      color: { value: new T.Color(0x7f7f7f) },
      tDiffuse: { value: null },
      textureMatrix: { value: new T.Matrix4() },
      surface: { value: floorTex },
    },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 surfaceUv;
      void main(){vUv=textureMatrix*vec4(position,1.);surfaceUv=uv*4.;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D surface;
      varying vec4 vUv; varying vec2 surfaceUv;
      void main(){vec3 grain=texture2D(surface,surfaceUv).rgb;
      vec2 uv=vUv.xy/vUv.w; vec2 d=(grain.rg-.5)*.004;
      vec3 reflection=vec3(0.); float r=.0035;
      for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){
        reflection+=texture2D(tDiffuse,uv+d+vec2(float(x),float(y))*r).rgb/9.;}}
      gl_FragColor=vec4(reflection,clamp(.13+grain.r*.20,.13,.3));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  },
});
floorReflection.rotation.x = -Math.PI / 2;
floorReflection.position.y = -0.015;
const reflectionMaterial = floorReflection.material as T.ShaderMaterial;
reflectionMaterial.transparent = true;
reflectionMaterial.depthWrite = false;
scene.add(floorReflection);
// Rear wall and open west windows, full-scale architectural framing.
box(15, 4.9, 0.25, 0, 2.4, -6.12, wallMat);
box(0.26, 2.78, 12, -7.62, 1.34, 0, wallMat);
box(0.26, 0.65, 12, -7.62, 4.55, 0, wallMat);
for (const z of [-6, -3, 0, 3, 6]) box(0.32, 2.1, 0.34, -7.6, 3.3, z, wallMat);
box(15, 0.24, 0.03, 0, 3.15, -5.976, teal);
box(0.03, 0.24, 12, -7.475, 1.45, 0, teal);
const emblem = label('H', 1.0, 1.0, '#193341');
emblem.position.set(1.4, 3.9, -5.975);
world.add(emblem);
const dormNumber = label('DORTOIR 04', 1.4, 0.2, '#627176');
dormNumber.position.set(1.4, 3.43, -5.965);
world.add(dormNumber);
for (let x = -7.5; x <= 7.5; x += 1.5) {
  box(0.013, 4.7, 0.02, x, 2.4, -5.978, seam);
  for (const y of [0.35, 2.8, 4.4]) {
    const bolt = new T.Mesh(new T.SphereGeometry(0.025, 6, 4), dark);
    bolt.position.set(x + 0.13, y, -5.96);
    world.add(bolt);
  }
}
// Exterior depth: mountains, desert and silhouettes visible through real apertures.
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 1024;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext('2d')!;
const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
skyGrad.addColorStop(0, '#c4bfaf');
skyGrad.addColorStop(0.6, '#f5d3a0');
skyGrad.addColorStop(1, '#b9956b');
skyCtx.fillStyle = skyGrad;
skyCtx.fillRect(0, 0, 1024, 512);
const skyTex = new T.CanvasTexture(skyCanvas);
skyTex.colorSpace = T.SRGBColorSpace;
const skyPanel = new T.Mesh(new T.PlaneGeometry(40, 15), new T.MeshBasicMaterial({ map: skyTex }));
skyPanel.rotation.y = Math.PI / 2;
skyPanel.position.set(-16, 5, 0);
scene.add(skyPanel);
for (let j = 0; j < 3; j++) {
  const points: T.Vector2[] = [new T.Vector2(-17, -1)];
  for (let i = 0; i <= 24; i++) points.push(new T.Vector2(-17 + i * 1.45, 1 + j * 0.4 + rng.next() * 1.1));
  points.push(new T.Vector2(18, -1));
  const mesh = new T.Mesh(
    new T.ShapeGeometry(new T.Shape(points)),
    new T.MeshBasicMaterial({ color: [0xb6a18a, 0xc7af8c, 0xd8be94][j] }),
  );
  mesh.rotation.y = Math.PI / 2;
  mesh.position.set(-15 + j, 1.9 - j * 0.3, 0);
  scene.add(mesh);
}
for (const z of [-4.5, -1.5, 1.5, 4.5]) {
  box(0.55, 0.13, 2.65, -7.4, 2.77, z, wallMat);
  box(0.15, 0.09, 2.65, -7.46, 4.23, z, dark);
  for (const zz of [z - 1.28, z, z + 1.28]) box(0.12, 1.43, 0.065, -7.46, 3.51, zz, dark);
  // Deliberately no glass plane: open apertures make real shadowed sunlight reach the room.
}
for (const y of [4.47, 4.64]) pipe(new T.Vector3(-7.37, y, -6), new T.Vector3(-7.37, y, 6), 0.045, steel);
pipe(new T.Vector3(-7.3, 4.64, -5.8), new T.Vector3(7.2, 4.64, -5.8), 0.16, steel);
for (let x = -7; x < 7.4; x += 0.95) {
  const collar = new T.Mesh(new T.TorusGeometry(0.171, 0.024, 6, 16), edge);
  collar.rotation.y = Math.PI / 2;
  collar.position.set(x, 4.64, -5.8);
  world.add(collar);
}
for (const x of [-5.6, 6.4]) {
  pipe(new T.Vector3(x, 0.05, -5.86), new T.Vector3(x, 4.6, -5.86), 0.055, steel);
  pipe(new T.Vector3(x + 0.18, 0.05, -5.86), new T.Vector3(x + 0.18, 4.6, -5.86), 0.034, edge);
}
// Navy lockers: readable sheet thickness, hinges, label frames and recessed vents.
function locker(x: number, z: number, rotation = 0, index = 0) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotation;
  world.add(g);
  box(0.86, 2.52, 0.65, 0, 1.31, 0, steel, g, 0.025);
  box(0.78, 2.39, 0.035, 0, 1.32, 0.35, dark, g, 0.008);
  box(0.74, 2.34, 0.025, 0, 1.32, 0.375, steel, g, 0.007);
  for (const y of [0.48, 2.15])
    for (let i = 0; i < 5; i++) box(0.34, 0.016, 0.018, 0, y + i * 0.052, 0.397, black, g);
  box(0.21, 0.085, 0.025, 0, 2.39, 0.407, brass, g);
  const n = label(String(index + 1).padStart(2, '0'), 0.15, 0.055, '#d3c8aa');
  n.position.set(0, 2.391, 0.423);
  g.add(n);
  box(0.045, 0.23, 0.06, 0.25, 1.22, 0.42, brass, g, 0.01);
  box(0.018, 0.14, 0.065, 0.25, 1.23, 0.448, black, g, 0.005);
  for (const y of [0.46, 1.25, 2.15]) box(0.04, 0.1, 0.05, -0.38, y, 0.41, edge, g);
  for (const xx of [-0.33, 0.33]) box(0.065, 0.08, 0.48, xx, 0.025, 0, edge, g);
  return g;
}
for (let i = 0; i < 11; i++) locker(-3.45 + i * 0.89, -5.46, 0, i);
obstacles.push({ x: 1, z: -5.4, w: 10.8, d: 1.1 });
// Fabric geometry carries actual folds so grazing sunlight models the bed surface.
function fabric(
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: T.Material,
  g: T.Object3D,
  seed: number,
) {
  const geo = new T.PlaneGeometry(w, d, 36, 48);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i),
      pz = pos.getZ(i);
    pos.setY(
      i,
      Math.max(
        -0.045,
        0.022 * Math.sin(px * 24 + pz * 7 + seed) +
          0.032 * Math.sin(pz * 15 + px * 4) +
          0.008 * Math.sin(px * 49 + pz * 21) +
          0.025 * Math.sin(pz * 5 + seed) * Math.cos(px * 8),
      ),
    );
  }
  geo.computeVertexNormals();
  const mesh = new T.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
}
function bag(x: number, y: number, z: number, g: T.Object3D = world) {
  box(0.63, 0.34, 0.39, x, y + 0.17, z, canvasCloth, g, 0.09);
  for (const xx of [-0.2, 0.2]) {
    box(0.035, 0.36, 0.405, x + xx, y + 0.17, z, dark, g, 0.008);
    box(0.065, 0.06, 0.019, x + xx, y + 0.22, z + 0.214, brass, g, 0.006);
  }
  box(0.27, 0.19, 0.03, x, y + 0.13, z + 0.2, strap, g, 0.02);
  pipe(new T.Vector3(x - 0.11, y + 0.38, z), new T.Vector3(x + 0.11, y + 0.38, z), 0.023, dark, g);
  for (const dx of [-0.11, 0.11])
    pipe(new T.Vector3(x + dx, y + 0.32, z), new T.Vector3(x + dx, y + 0.38, z), 0.017, dark, g);
}
function equipmentCase(x: number, y: number, z: number, g: T.Object3D = world) {
  box(0.66, 0.32, 0.42, x, y + 0.16, z, steel, g, 0.025);
  box(0.68, 0.055, 0.44, x, y + 0.32, z, dark, g, 0.014);
  for (const dx of [-0.27, 0.27]) {
    box(0.025, 0.31, 0.43, x + dx, y + 0.17, z, edge, g);
    box(0.055, 0.07, 0.03, x + dx * 0.7, y + 0.27, z + 0.228, brass, g, 0.005);
  }
  box(0.2, 0.07, 0.025, x, y + 0.16, z + 0.232, black, g, 0.014);
}
function book(x: number, y: number, z: number, g: T.Object3D = world) {
  box(0.23, 0.035, 0.31, x, y, z, dark, g, 0.008);
  box(0.21, 0.018, 0.285, x, y + 0.022, z, linen, g);
  box(0.23, 0.01, 0.31, x, y + 0.033, z, dark, g);
  box(0.055, 0.008, 0.018, x + 0.06, y + 0.04, z + 0.06, brass, g);
}
function boots(x: number, z: number, g: T.Object3D) {
  for (const dx of [-0.09, 0.09]) {
    box(0.14, 0.15, 0.28, x + dx, 0.11, z, black, g, 0.045);
    box(0.135, 0.24, 0.15, x + dx, 0.27, z - 0.05, dark, g, 0.03);
    for (let j = 0; j < 4; j++) box(0.08, 0.013, 0.015, x + dx, 0.23 + j * 0.042, z + 0.032, strap, g);
  }
}
function bunk(x: number, z: number, rotation = 0, index = 0) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotation;
  world.add(g);
  for (const xx of [-0.7, 0.7])
    for (const zz of [-1.23, 1.23]) {
      pipe(new T.Vector3(xx, 0.02, zz), new T.Vector3(xx, 2.55, zz), 0.044, edge, g);
      box(0.15, 0.04, 0.15, xx, 0.02, zz, black, g, 0.015);
      const cap = new T.Mesh(new T.SphereGeometry(0.05, 12, 8), edge);
      cap.position.set(xx, 2.55, zz);
      g.add(cap);
    }
  for (const y of [0.48, 1.83]) {
    box(1.43, 0.09, 2.55, 0, y, 0, steel, g, 0.025);
    box(1.34, 0.16, 2.4, 0, y + 0.12, 0, linen, g, 0.055);
    // The deepest cloth fold must stay above the mattress, including its white cover.
    fabric(1.32, 1.76, 0, y + 0.26, 0.31, blanket, g, index);
    const pillow = box(0.97, 0.18, 0.44, 0, y + 0.27, -0.85, linen, g, 0.085);
    const pillowPositions = pillow.geometry.attributes.position!;
    for (let i = 0; i < pillowPositions.count; i++) {
      const px = pillowPositions.getX(i),
        pz = pillowPositions.getZ(i);
      pillowPositions.setY(i, pillowPositions.getY(i) + 0.011 * Math.sin(px * 38 + pz * 21) * Math.abs(px));
    }
    pillow.geometry.computeVertexNormals();
    pillow.rotation.y = 0.05 * ((index % 3) - 1);
    pillow.rotation.z = 0.025;
    for (const zz of [-1.23, 1.23])
      pipe(new T.Vector3(-0.7, y + 0.38, zz), new T.Vector3(0.7, y + 0.38, zz), 0.038, edge, g);
    pipe(new T.Vector3(-0.7, y + 0.36, -1.2), new T.Vector3(-0.7, y + 0.36, 1.2), 0.025, steel, g);
    book(0.27, y + 0.245, 0.66, g);
    // Heavy cover draped over visible side, waving at its bottom edge.
    const drapeGeo = new T.PlaneGeometry(0.45, 1.62, 12, 32);
    const p = drapeGeo.attributes.position!;
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i);
      p.setZ(i, 0.025 * Math.sin(p.getY(i) * 18 + index) + 0.03 * Math.sin(vx * 16));
    }
    drapeGeo.computeVertexNormals();
    const drape = new T.Mesh(
      drapeGeo,
      new T.MeshStandardMaterial({
        color: 0xb5c6d0,
        map: clothTex,
        bumpMap: clothTex,
        bumpScale: 0.01,
        roughness: 1,
        side: T.DoubleSide,
      }),
    );
    drape.rotation.z = Math.PI / 2;
    drape.rotation.y = Math.PI / 2;
    drape.position.set(0.69, y - 0.02, 0.28);
    drape.castShadow = true;
    g.add(drape);
  }
  for (const xx of [0.35, 0.65])
    pipe(new T.Vector3(xx, 0.05, 1.31), new T.Vector3(xx, 2.25, 1.31), 0.028, edge, g);
  for (let y = 0.25; y < 2.2; y += 0.28)
    pipe(new T.Vector3(0.35, y, 1.31), new T.Vector3(0.65, y, 1.31), 0.022, steel, g);
  bag(-0.25, 0.02, 0.3, g);
  equipmentCase(-0.16, 0.01, 0.94, g);
  bag(-0.17, 0.015, -0.81, g);
  boots(0.4, 1.66, g);
  const plaque = label(`HOLT / ${String(index + 1).padStart(2, '0')}`, 0.4, 0.095, '#b5b6a8', '#243138');
  plaque.position.set(-0.27, 1.84, 1.281);
  g.add(plaque);
  obstacles.push({ x, z, w: rotation ? 2.85 : 1.8, d: rotation ? 1.8 : 2.9 });
}
// Beds perpendicular to the west wall, framing an open central aisle.
for (let i = 0; i < 3; i++) bunk(-5.6, -3.5 + i * 3.05, Math.PI / 2, i);
for (let i = 0; i < 2; i++) bunk(5.9, -2.9 + i * 3.15, -Math.PI / 2, i + 3);
for (const z of [-5, -1.98, 1.08, 4.13]) locker(-7.01, z, Math.PI / 2, 12 + Math.round(z + 5));
function bench(x: number, z: number) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  world.add(g);
  for (const xx of [-0.17, 0.17]) box(0.32, 0.12, 1.95, xx, 0.55, 0, wood, g, 0.025);
  for (const zz of [-0.8, 0.8])
    for (const xx of [-0.25, 0.25]) box(0.055, 0.5, 0.075, xx, 0.25, zz, steel, g);
  box(0.05, 0.07, 1.7, 0, 0.19, 0, dark, g);
  for (let i = 0; i < 3; i++) box(0.46, 0.035, 0.39, 0, 0.64 + i * 0.035, -0.45, blanket, g, 0.016);
  if (x < 0) {
    const flask = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.24, 14), dark);
    flask.position.set(0.08, 0.73, 0.55);
    flask.castShadow = true;
    g.add(flask);
    box(0.07, 0.035, 0.07, 0.08, 0.866, 0.55, brass, g, 0.006);
  }
  obstacles.push({ x, z, w: 0.95, d: 2.2 });
}
bench(-2.95, 3.65);
bench(3.65, 3.25);
for (const x of [-3.45, -1.65, 0.15, 2.8, 4.6]) {
  bag(x, 2.59, -5.45);
  if (x > 0) {
    book(x + 0.3, 2.62, -5.4);
    book(x + 0.3, 2.68, -5.4);
  }
}
equipmentCase(-2.6, 2.59, -5.45);
equipmentCase(3.55, 2.59, -5.45);
// Industrial radiator, conduits and switched wall boxes reinforce the room's scale.
for (let i = 0; i < 17; i++) box(0.16, 0.8, 0.12, -7.36, 0.53, -5.65 + i * 0.095, steel, world, 0.03);
pipe(new T.Vector3(-7.3, 0.2, -5.7), new T.Vector3(-7.3, 0.2, 5.8), 0.025, edge);
for (const x of [-4.36, 6.87]) {
  box(0.26, 0.4, 0.1, x, 2.35, -5.9, steel, world, 0.014);
  box(0.13, 0.19, 0.02, x, 2.37, -5.835, black);
  box(0.027, 0.028, 0.018, x + 0.035, 2.39, -5.814, brass);
  pipe(new T.Vector3(x, 2.55, -5.87), new T.Vector3(x, 4.57, -5.87), 0.018, edge);
}
const redMat = new T.MeshStandardMaterial({ color: 0xff3025, emissive: 0xff1605, emissiveIntensity: 3 });
box(0.12, 0.12, 0.1, 1.1, 2.77, -5.14, redMat);
const redLight = new T.PointLight(0xff3020, 1, 2);
redLight.position.set(1.1, 2.83, -4.99);
scene.add(redLight);
for (const x of [-3.7, 3.4]) {
  box(1.12, 0.11, 0.33, x, 4.15, -5.62, dark);
  const glow = new T.MeshStandardMaterial({ color: 0xc1f7ff, emissive: 0x81dfff, emissiveIntensity: 3 });
  box(0.89, 0.025, 0.18, x, 4.08, -5.58, glow);
  const light = new T.PointLight(0x9edfff, 3, 4, 2);
  light.position.set(x, 3.86, -5.05);
  scene.add(light);
}
// Contact shadows: soft ambient grounding, independent from direct sunlight.
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = shadowCanvas.height = 128;
const sc = shadowCanvas.getContext('2d')!;
const sg = sc.createRadialGradient(64, 64, 8, 64, 64, 64);
sg.addColorStop(0, 'rgba(0,0,0,.5)');
sg.addColorStop(0.5, 'rgba(0,0,0,.22)');
sg.addColorStop(1, 'rgba(0,0,0,0)');
sc.fillStyle = sg;
sc.fillRect(0, 0, 128, 128);
const shadowTex = new T.CanvasTexture(shadowCanvas);
for (const o of obstacles) {
  const sh = new T.Mesh(
    new T.PlaneGeometry(o.w * 1.45, o.d * 1.35),
    new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }),
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.set(o.x, 0.009, o.z);
  world.add(sh);
}
// Dust motes are restricted to the shafts, not scattered over the whole image.
const dustPositions = new Float32Array(240 * 3);
for (let i = 0; i < 240; i++) {
  dustPositions[i * 3] = -7 + rng.next() * 8;
  dustPositions[i * 3 + 1] = 0.4 + rng.next() * 3.8;
  dustPositions[i * 3 + 2] = -5 + rng.next() * 10;
}
const dustGeo = new T.BufferGeometry();
dustGeo.setAttribute('position', new T.BufferAttribute(dustPositions, 3));
const dust = new T.Points(
  dustGeo,
  new T.PointsMaterial({ color: 0xffdfaa, size: 0.017, transparent: true, opacity: 0.38, depthWrite: false }),
);
scene.add(dust);
// Batch the static assemblies by material, retaining their shadow flags.
world.updateMatrixWorld(true);
const batches = new Map<
  string,
  { material: T.Material; geometries: T.BufferGeometry[]; cast: boolean; receive: boolean }
>();
world.traverse((node) => {
  if (!(node instanceof T.Mesh) || Array.isArray(node.material)) return;
  const key = `${node.material.uuid}/${node.castShadow}/${node.receiveShadow}`;
  let batch = batches.get(key);
  if (!batch) {
    batch = { material: node.material, geometries: [], cast: node.castShadow, receive: node.receiveShadow };
    batches.set(key, batch);
  }
  const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
  batch.geometries.push(geometry.applyMatrix4(node.matrixWorld));
  node.geometry.dispose();
});
world.clear();
for (const batch of batches.values()) {
  const merged = mergeGeometries(batch.geometries);
  if (merged) {
    const mesh = new T.Mesh(merged, batch.material);
    mesh.castShadow = batch.cast;
    mesh.receiveShadow = batch.receive;
    world.add(mesh);
  }
  for (const geometry of batch.geometries) geometry.dispose();
}
// Feathered, low-opacity airborne haze follows the aperture light direction.
const shaftMat = new T.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: T.DoubleSide,
  blending: T.AdditiveBlending,
  uniforms: { color: { value: new T.Color(0xe9b678) } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv; uniform vec3 color; void main(){float sideFade=pow(sin(vUv.x*3.14159),1.4);float lengthFade=sin(vUv.y*3.14159);gl_FragColor=vec4(color,sideFade*lengthFade*.055);}`,
});
for (const z of [-4.5, -1.5, 1.5, 4.5]) {
  const geo = new T.BufferGeometry();
  geo.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [-7.4, 3.95, z - 1.18, -7.4, 3.95, z + 1.18, -0.8, 0.04, z + 4.48, -0.8, 0.04, z + 2.12],
      3,
    ),
  );
  geo.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  scene.add(new T.Mesh(geo, shaftMat));
}
await preloadCadetAssets();
const rig = createHumanExplorationRig(
  { id: 'franklyn', name: 'Franklyn' },
  { model: 'male', pilotFranklyn: true, showLabel: false, showRing: false },
);
scene.add(rig.object);
// The chapter rig only supplies position, facing and speed here; the visible Franklyn is skinned
// directly on the Mixamo skeleton.
rig.object.getObjectByName('personnage-modele:franklyn')!.visible = false;
// Custom MPFB Franklyn by default; `?body=exo` keeps the stock Mixamo Exo Gray for comparison.
// `?lead=abigail` (etc.) plays another cadet; `?cast=1` lines the rest of the cast up in the aisle.
const leadLook = LOOKS[params.get('lead') ?? 'franklyn'] ?? LOOKS.franklyn!;
let franklyn = params.get('body') === 'exo' ? await createExoFranklyn() : await createCadet(leadLook);
rig.object.add(franklyn.object);
Object.assign(window, { __franklyn: franklyn });

// Cast selector: swaps the playable body live (models load on first use). Keys 1-7 work too.
const CAST_LABELS: Record<string, string> = {
  franklyn: 'Franklyn',
  abigail: 'Abigail',
  zachary: 'Zachary',
  letitia: 'Letitia',
  john: 'John',
  grover: 'Grover',
  enfant: "L'enfant",
};
const cadetCache = new Map<string, Cadet>();
let currentName = CAST_LABELS[leadLook.id] ?? 'Franklyn';
const selector = document.createElement('nav');
selector.className = 'cast-selector';
selector.setAttribute('aria-label', 'Choix du personnage');
const selectorButtons = new Map<string, HTMLButtonElement>();
for (const [i, id] of CAST_ORDER.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<kbd>${i + 1}</kbd>${CAST_LABELS[id]}`;
  button.style.setProperty('--rim', `#${LOOKS[id]!.rim.toString(16).padStart(6, '0')}`);
  button.addEventListener('click', () => void selectCadet(id));
  selector.append(button);
  selectorButtons.set(id, button);
}
document.body.append(selector);
const markSelected = (id: string) => {
  for (const [key, button] of selectorButtons) button.classList.toggle('active', key === id);
};
markSelected(leadLook.id);

// Pose selector: standing Mixamo clips on the playable cadet. Walking overrides a pose; the pose
// resumes when the cadet stops. `?pose=<name>` starts with one.
const POSE_LABELS: Record<PoseName | 'idle', string> = {
  idle: 'Repos',
  talk: 'Parle',
  argue: 'Dispute',
  disappointed: 'Déçu',
  salute: 'Salut',
  look: 'Regarde',
  nervous: 'Nerveux',
  sad: 'Triste',
  wave: 'Signe',
  run: 'Court',
};
let poseChoice: PoseName | null = POSES.find((name) => name === params.get('pose')) ?? null;
const poseSelector = document.createElement('nav');
poseSelector.className = 'cast-selector pose-selector';
poseSelector.setAttribute('aria-label', 'Choix de la pose');
const poseButtons = new Map<string, HTMLButtonElement>();
const applyPose = (member: Cadet | typeof franklyn) => {
  if ('play' in member) void member.play(poseChoice);
};
for (const key of ['idle', ...POSES] as const) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = POSE_LABELS[key];
  button.addEventListener('click', () => {
    poseChoice = key === 'idle' ? null : key;
    for (const [name, other] of poseButtons) other.classList.toggle('active', name === key);
    applyPose(franklyn);
  });
  poseSelector.append(button);
  poseButtons.set(key, button);
}
poseButtons.get(poseChoice ?? 'idle')!.classList.add('active');
document.body.append(poseSelector);
applyPose(franklyn);

let selecting = false;
async function selectCadet(id: string) {
  const look = LOOKS[id];
  if (!look || selecting || (franklyn as { look?: { id: string } }).look?.id === id) return;
  selecting = true;
  const button = selectorButtons.get(id)!;
  button.classList.add('loading');
  try {
    let next = cadetCache.get(id);
    if (!next) {
      next = await createCadet(look);
      cadetCache.set(id, next);
    }
    rig.object.remove(franklyn.object);
    rig.object.add(next.object);
    franklyn = next;
    applyPose(next);
    Object.assign(window, { __franklyn: next });
    currentName = CAST_LABELS[id] ?? id;
    markSelected(id);
    portraitButton.innerHTML = portraitMode ? 'Dortoir <kbd>P</kbd>' : `${currentName} <kbd>P</kbd>`;
    if (portraitHelp.firstChild) portraitHelp.firstChild.textContent = `${currentName.toUpperCase()} `;
  } finally {
    button.classList.remove('loading');
    selecting = false;
  }
}
addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const index = Number(event.key) - 1;
  if (Number.isInteger(index) && index >= 0 && index < CAST_ORDER.length)
    void selectCadet(CAST_ORDER[index]!);
});
const castMembers: Cadet[] = [];
const CAST_POSES: (PoseName | null)[] = ['talk', null, 'look', 'argue', 'nervous', 'sad'];
if (params.get('cast')) {
  const others = CAST_ORDER.filter((id) => id !== leadLook.id);
  const spacing = 0.95;
  for (const [i, id] of others.entries()) {
    const member = await createCadet(LOOKS[id]!);
    const x = (i - (others.length - 1) / 2) * spacing;
    member.object.position.set(x, member.object.position.y, 3.6);
    member.object.rotation.y = Math.atan2(-x * 0.25, -1) + Math.PI;
    scene.add(member.object);
    castMembers.push(member);
    // Each bystander gets its own pose so the line-up does not look cloned.
    void member.play(CAST_POSES[i % CAST_POSES.length]!);
  }
  Object.assign(window, { __cast: castMembers });
}
rig.setWorldPosition(0, 1.3);
rig.faceTowards(4, 7);
rig.play('idle');
const player = new T.Vector2(0, 1.3);
let destination: T.Vector2 | null = null;
let path: T.Vector2[] = [];
const WALK_SPEED = 1.7;
const WALK_ACCELERATION = 6.5;
const TURN_SPEED = 7;
let motionSpeed = 0;
let facingAngle = rig.object.rotation.y;
const portraitHelp = document.querySelector<HTMLElement>('.portrait-help')!;
const portraitButton = document.querySelector<HTMLButtonElement>('#portrait-toggle')!;
const overviewTarget = cameraTarget.clone();
function togglePortrait() {
  portraitMode = !portraitMode;
  if (portraitMode) {
    overviewTarget.copy(cameraTarget);
    portraitAzimuth = rig.object.rotation.y + 0.14;
    portraitDistance = 3.2;
    portraitElevation = 0.13;
    destination = null;
    path = [];
  } else cameraTarget.copy(overviewTarget);
  portraitHelp.hidden = !portraitMode;
  portraitButton.innerHTML = portraitMode ? 'Dortoir <kbd>P</kbd>' : `${currentName} <kbd>P</kbd>`;
  cameraPosition();
}
portraitButton.addEventListener('click', togglePortrait);
const playerShadow = new T.Mesh(
  new T.PlaneGeometry(1.05, 1.05),
  new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }),
);
playerShadow.rotation.x = -Math.PI / 2;
scene.add(playerShadow);
const destinationMarker = new T.Mesh(
  new T.RingGeometry(0.16, 0.18, 40),
  new T.MeshBasicMaterial({ color: 0xd3bc90, transparent: true, opacity: 0.7, depthWrite: false }),
);
destinationMarker.rotation.x = -Math.PI / 2;
destinationMarker.visible = false;
scene.add(destinationMarker);
const points = [
  {
    x: -3.45,
    z: -4.42,
    title: 'Le casier de Franklyn',
    text: 'Une tenue soigneusement pliée. Un insigne qui attend demain. Dix-sept ans, et déjà cette impression que tout va trop vite.',
  },
  {
    x: -3.9,
    z: -0.45,
    title: 'Un dernier réveil ici',
    text: 'Le métal est froid sous les doigts. Les couvertures sentent la lessive industrielle et la poussière des Badlands. Demain, ce lit sera vide.',
  },
  {
    x: 3.65,
    z: 1.75,
    title: 'La promotion',
    text: 'Des affaires oubliées sur le banc. Les voix des autres cadets résonnent déjà dans le couloir. Encore une journée à traverser ensemble.',
  },
];
const interaction = document.querySelector<HTMLDivElement>('.interaction')!;
const story = document.querySelector<HTMLElement>('.story')!;
let activePoint: (typeof points)[number] | undefined;
function showStory() {
  if (!activePoint) return;
  story.querySelector('h2')!.textContent = activePoint.title;
  story.querySelector('p')!.textContent = activePoint.text;
  story.hidden = false;
  destination = null;
  path = [];
}
function closeStory() {
  story.hidden = true;
}
story.querySelector('button')!.addEventListener('click', closeStory);
function free(x: number, z: number) {
  return (
    x > -7.15 &&
    x < 7.1 &&
    z > -4.8 &&
    z < 5.6 &&
    !obstacles.some((o) => Math.abs(x - o.x) < o.w / 2 + 0.22 && Math.abs(z - o.z) < o.d / 2 + 0.22)
  );
}
/** Compact local navigation graph. A click on furniture is projected to a reachable floor node. */
function navigate(x: number, z: number) {
  const step = 0.35;
  const nodes = new Map<string, { x: number; z: number; parent: string | null }>();
  const key = (a: number, b: number) => `${a},${b}`;
  const sx = Math.round(player.x / step),
    sz = Math.round(player.y / step);
  const start = key(sx, sz);
  nodes.set(start, { x: sx, z: sz, parent: null });
  const queue = [start];
  let best = start;
  let distance = Infinity;
  for (let i = 0; i < queue.length; i++) {
    const k = queue[i]!;
    const n = nodes.get(k)!;
    const d = (n.x * step - x) ** 2 + (n.z * step - z) ** 2;
    if (d < distance) {
      distance = d;
      best = k;
    }
    if (d < step * step * 0.3) break;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = n.x + dx,
        nz = n.z + dz,
        nk = key(nx, nz);
      if (!nodes.has(nk) && free(nx * step, nz * step)) {
        nodes.set(nk, { x: nx, z: nz, parent: k });
        queue.push(nk);
      }
    }
  }
  const result: T.Vector2[] = [];
  let cursor: string | null = best;
  while (cursor && cursor !== start) {
    const n: { x: number; z: number; parent: string | null } = nodes.get(cursor)!;
    result.unshift(new T.Vector2(n.x * step, n.z * step));
    cursor = n.parent;
  }
  // Retain the collision-safe route but remove grid stair steps when a straight
  // segment is clear. Sampling uses the same body clearance as keyboard movement.
  const simplified: T.Vector2[] = [];
  let anchor = player.clone();
  let index = 0;
  while (index < result.length) {
    let farthest = index;
    for (let candidate = result.length - 1; candidate > index; candidate--) {
      const end = result[candidate]!;
      const steps = Math.ceil(anchor.distanceTo(end) / 0.07);
      let clear = true;
      for (let sample = 1; sample <= steps; sample++) {
        const t = sample / steps;
        if (!free(T.MathUtils.lerp(anchor.x, end.x, t), T.MathUtils.lerp(anchor.y, end.y, t))) {
          clear = false;
          break;
        }
      }
      if (clear) {
        farthest = candidate;
        break;
      }
    }
    anchor = result[farthest]!.clone();
    simplified.push(anchor);
    index = farthest + 1;
  }
  path = simplified;
  destination = path.shift() ?? null;
  const end = path.at(-1) ?? destination;
  if (end) {
    destinationMarker.position.set(end.x, 0.023, end.y);
    destinationMarker.visible = true;
  }
}
const raycaster = new T.Raycaster();
const pointer = new T.Vector2();
const floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
const hit = new T.Vector3();
let pointerDown: { x: number; y: number; target: T.Vector3; azimuth: number; elevation: number } | null =
  null;
let dragged = false;
canvas.addEventListener('pointerdown', (e) => {
  pointerDown = {
    x: e.clientX,
    y: e.clientY,
    target: cameraTarget.clone(),
    azimuth: portraitAzimuth,
    elevation: portraitElevation,
  };
  dragged = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointerDown) return;
  const dx = e.clientX - pointerDown.x,
    dy = e.clientY - pointerDown.y;
  if (Math.hypot(dx, dy) > 6) dragged = true;
  if (dragged) {
    if (portraitMode) {
      portraitAzimuth = pointerDown.azimuth - dx * 0.008;
      portraitElevation = T.MathUtils.clamp(pointerDown.elevation + dy * 0.003, -0.12, 0.65);
      cameraPosition();
      return;
    }
    const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new T.Vector3().crossVectors(right, new T.Vector3(0, 1, 0));
    cameraTarget
      .copy(pointerDown.target)
      .addScaledVector(right, -dx * 0.013 * zoom)
      .addScaledVector(up, dy * 0.018 * zoom);
    cameraTarget.x = T.MathUtils.clamp(cameraTarget.x, -4, 4);
    cameraTarget.z = T.MathUtils.clamp(cameraTarget.z, -3, 4);
    cameraPosition();
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (!dragged && story.hidden && !portraitMode) {
    pointer.set((e.clientX / innerWidth) * 2 - 1, (-e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(floorPlane, hit)) navigate(hit.x, hit.z);
  }
  pointerDown = null;
});
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (portraitMode) {
      portraitDistance = T.MathUtils.clamp(portraitDistance + e.deltaY * 0.002, 0.85, 4.5);
      cameraPosition();
      return;
    }
    zoom = T.MathUtils.clamp(zoom + e.deltaY * 0.00065, 0.58, 1.3);
    cameraPosition();
  },
  { passive: false },
);
const keys = new Set<string>();
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'e') showStory();
  if (e.key === 'Escape') closeStory();
  if (e.key.toLowerCase() === 'h') document.body.classList.toggle('hide-hud');
  if (e.key.toLowerCase() === 'p' && !e.repeat) togglePortrait();
  if (e.key.toLowerCase() === 'c') {
    cameraTarget.set(player.x, 1.05, player.y);
    cameraPosition();
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
let high = params.get('quality') !== 'performance';
const qualityButton = document.querySelector<HTMLButtonElement>('#quality')!;
function setQuality() {
  renderer.setPixelRatio(high ? Math.min(devicePixelRatio, 1.5) : 1);
  bloom.enabled = high;
  floorReflection.visible = high;
  qualityButton.textContent = high ? 'Qualité élevée' : 'Mode fluide';
  resize();
}
qualityButton.addEventListener('click', () => {
  high = !high;
  setQuality();
});
const metrics = document.querySelector<HTMLElement>('#metrics')!;
document.querySelector('#metrics-toggle')!.addEventListener('click', () => {
  metrics.hidden = !metrics.hidden;
});
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
}
window.addEventListener('resize', resize);
setQuality();
document.querySelector('#loading')!.remove();
let last = performance.now(),
  frameCount = 0,
  sampleTime = last,
  fps = 60;
const samples: number[] = [];
function frame(now: number) {
  requestAnimationFrame(frame);
  const rawDt = (now - last) / 1000;
  const dt = Math.min(rawDt, 0.05);
  last = now;
  let moving = false;
  const previousPlayer = player.clone();
  if (story.hidden) {
    let ix = 0,
      iz = 0;
    if (keys.has('z') || keys.has('w') || keys.has('arrowup')) iz -= 1;
    if (keys.has('s') || keys.has('arrowdown')) iz += 1;
    if (keys.has('q') || keys.has('a') || keys.has('arrowleft')) ix -= 1;
    if (keys.has('d') || keys.has('arrowright')) ix += 1;
    if (ix || iz) {
      destination = null;
      path = [];
      const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const forward = new T.Vector3().crossVectors(right, new T.Vector3(0, 1, 0));
      const dir = right.multiplyScalar(ix).addScaledVector(forward, iz).normalize();
      motionSpeed = Math.min(WALK_SPEED, motionSpeed + WALK_ACCELERATION * dt);
      const speed = motionSpeed * dt;
      const nx = player.x + dir.x * speed,
        nz = player.y + dir.z * speed;
      facingAngle = Math.atan2(dir.x, dir.z);
      if (free(nx, player.y)) {
        player.x = nx;
        moving = true;
      }
      if (free(player.x, nz)) {
        player.y = nz;
        moving = true;
      }
    } else if (destination) {
      const delta = destination.clone().sub(player);
      const dist = delta.length();
      if (dist < 0.045) {
        player.copy(destination);
        destination = path.shift() ?? null;
      } else {
        delta.normalize();
        facingAngle = Math.atan2(delta.x, delta.y);
        const arrivalSpeed = path.length
          ? WALK_SPEED
          : Math.min(WALK_SPEED, Math.sqrt(2 * WALK_ACCELERATION * dist));
        motionSpeed = T.MathUtils.damp(motionSpeed, arrivalSpeed, 10, dt);
        player.addScaledVector(delta, Math.min(dist, dt * motionSpeed));
        moving = true;
      }
    }
  }
  rig.setWorldPosition(player.x, player.y);
  if (!moving) motionSpeed = 0;
  const angleDelta = Math.atan2(
    Math.sin(facingAngle - rig.object.rotation.y),
    Math.cos(facingAngle - rig.object.rotation.y),
  );
  rig.object.rotation.y += T.MathUtils.clamp(angleDelta, -TURN_SPEED * dt, TURN_SPEED * dt);
  const actualSpeed = player.distanceTo(previousPlayer) / Math.max(dt, 0.001);
  rig.setExplorationMotionSpeed(actualSpeed);
  rig.play(moving ? 'walk' : 'idle');
  rig.update(dt);
  franklyn.update(dt, moving ? actualSpeed : 0);
  for (const member of castMembers) member.update(dt, 0);
  if (portraitMode) cameraPosition();
  playerShadow.position.set(player.x, 0.017, player.y);
  destinationMarker.visible = destination !== null;
  activePoint = points.find((p) => Math.hypot(p.x - player.x, p.z - player.y) < 1.8);
  interaction.hidden = !activePoint || !story.hidden;
  if (activePoint) interaction.innerHTML = `<kbd>E</kbd> ${activePoint.title}`;
  dust.rotation.y = Math.sin(now * 0.00008) * 0.008;
  renderer.info.reset();
  composer.render();
  frameCount++;
  samples.push(rawDt * 1000);
  if (samples.length > 180) samples.shift();
  if (now - sampleTime > 750) {
    fps = Math.round((frameCount * 1000) / (now - sampleTime));
    frameCount = 0;
    sampleTime = now;
    const sorted = [...samples].sort((a, b) => a - b);
    const stats = {
      fps,
      frameMsP95: Number((sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(2)),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      quality: high ? 'élevée' : 'fluide',
      camera: portraitMode ? 'portrait' : 'dortoir',
      player: { x: Number(player.x.toFixed(2)), z: Number(player.y.toFixed(2)) },
      moving,
      destination: destination ? { x: destination.x, z: destination.y } : null,
    };
    Object.assign(window, { __dormitoryAAA: stats });
    metrics.textContent = `${fps} IPS · ${stats.frameMsP95} ms (p95)\n${stats.drawCalls} appels · ${stats.triangles.toLocaleString('fr')} triangles\n${stats.geometries} géométries · ${stats.textures} textures\nFranklyn ${stats.player.x} / ${stats.player.z}`;
  }
}
/** Read-only scene inspection and deterministic movement targets for local art reviews. */
Object.assign(window, {
  __dormitoryAAAReview: {
    screenPoint: (x: number, z: number) => {
      const p = new T.Vector3(x, 0, z).project(camera);
      return { x: ((p.x + 1) * innerWidth) / 2, y: ((1 - p.y) * innerHeight) / 2 };
    },
    state: () => ({
      player: { x: player.x, z: player.y },
      moving: destination !== null || motionSpeed > 0,
      pathLength: path.length,
      inspection: story.hidden ? null : story.querySelector('h2')!.textContent,
      walkable: free(player.x, player.y),
      quality: high ? 'high' : 'performance',
      camera: portraitMode ? 'portrait' : 'dormitory',
    }),
    isWalkable: free,
    renderer,
  },
});
requestAnimationFrame(frame);
