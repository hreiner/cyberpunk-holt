import * as T from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

/**
 * Identity pass over the stock Exo Gray mesh: Holt Academy colours, PBR materials and
 * name-tape decals. Runs at rest pose, before any animation.
 */

function toHsl(r: number, g: number, b: number) {
  const c = new T.Color(r / 255, g / 255, b / 255);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return hsl;
}

/** Re-paints a diffuse atlas pixel by pixel. */
function repaint(texture: T.Texture, fn: (r: number, g: number, b: number) => [number, number, number]) {
  const image = texture.image as CanvasImageSource & { width: number; height: number };
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = fn(px[i]!, px[i + 1]!, px[i + 2]!);
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
  const out = new T.CanvasTexture(canvas);
  out.colorSpace = T.SRGBColorSpace;
  out.wrapS = texture.wrapS;
  out.wrapT = texture.wrapT;
  out.flipY = texture.flipY;
  out.anisotropy = 8;
  return out;
}

// Body atlas: skin, hair, eyes and the dark under-suit. Only neutral-grey, dark pixels are the
// suit (skin and hair are warm, eyes are bright), so they alone are re-toned to navy graphite.
function paintUnderSuit(r: number, g: number, b: number): [number, number, number] {
  const { s, l } = toHsl(r, g, b);
  if (s < 0.14 && l < 0.5 && Math.abs(r - b) < 14) {
    const v = (r + g + b) / 3;
    return [v * 0.5, v * 0.62, v * 0.86 + 3];
  }
  return [r, g, b];
}

// Armour atlas: the saturated blue panels become academy navy, plates get a cool graphite cast.
function paintPanels(r: number, g: number, b: number): [number, number, number] {
  const { h, s, l } = toHsl(r, g, b);
  if (s > 0.25 && h > 0.5 && h < 0.72) {
    const c = new T.Color().setHSL(0.61, 0.38, Math.min(0.26, l * 0.5));
    return [c.r * 255, c.g * 255, c.b * 255];
  }
  return [r * 0.9, g * 0.95, b * 1.06];
}

function tape(text: string, width = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#101a26';
  ctx.fillRect(0, 0, width, 128);
  ctx.strokeStyle = '#7d8586';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, width - 16, 112);
  ctx.font = '600 58px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#cfd0c4';
  ctx.fillText(text, width / 2, 68, width - 50);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  // DecalGeometry projects with a mirrored U.
  texture.wrapS = T.RepeatWrapping;
  texture.repeat.x = -1;
  texture.offset.x = 1;
  return texture;
}

/** FBXLoader resolves embedded textures after the model itself; wait for the pixels. */
async function texturesReady(meshes: T.SkinnedMesh[]) {
  const maps = new Set<T.Texture>();
  for (const mesh of meshes) {
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const phong = m as T.MeshPhongMaterial;
      for (const map of [phong.map, phong.normalMap, phong.specularMap]) if (map) maps.add(map);
    }
  }
  const ready = (map: T.Texture) => {
    const image = map.image as (HTMLImageElement & { complete?: boolean }) | null;
    return !!image && image.width > 0 && image.complete !== false;
  };
  for (let waited = 0; waited < 20000; waited += 50) {
    if ([...maps].every(ready)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export async function styleExoFranklyn(root: T.Object3D, meshes: T.SkinnedMesh[]) {
  await texturesReady(meshes);
  // -- materials: repaint atlases once per source material, then move to PBR -------------
  const cache = new Map<T.Material, T.MeshStandardMaterial>();
  const pbr = (source: T.MeshPhongMaterial): T.MeshStandardMaterial => {
    const known = cache.get(source);
    if (known) return known;
    const isBody = source.name === 'Body_MAT';
    const isPanels = source.name === 'Exo_MAT';
    const map = source.map
      ? isBody
        ? repaint(source.map, paintUnderSuit)
        : isPanels
          ? repaint(source.map, paintPanels)
          : source.map
      : null;
    if (map) map.anisotropy = 8;
    const material = new T.MeshPhysicalMaterial({
      name: source.name,
      map,
      normalMap: source.normalMap,
      normalScale: new T.Vector2(1.15, 1.15),
      // Specular atlas -> roughness: bright spec means glossy, so invert through roughness.
      roughness: isPanels ? 0.5 : isBody ? 0.58 : 0.4,
      metalness: isPanels ? 0.35 : 0,
      sheen: isBody ? 0.12 : 0,
      sheenColor: new T.Color(0xe9b9a1),
      transparent: source.transparent,
      alphaTest: source.alphaTest,
      side: source.side,
      opacity: source.opacity,
    });
    if (source.name.startsWith('Eye_Spec')) {
      material.roughness = 0.05;
      material.transparent = true;
      material.opacity = Math.min(1, source.opacity);
    }
    if (source.normalMap) source.normalMap.anisotropy = 8;
    cache.set(source, material);
    return material;
  };
  for (const mesh of meshes) {
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((m) => pbr(m as T.MeshPhongMaterial))
      : pbr(mesh.material as T.MeshPhongMaterial);
  }

  // -- decals: projected onto the rest-pose mesh, then parented to bones -----------------
  root.updateMatrixWorld(true);
  const holder = new T.Group();
  const armour = meshes.reduce((a, b) =>
    b.geometry.attributes.position!.count > a.geometry.attributes.position!.count ? b : a,
  );
  const bone = (name: string) => root.getObjectByName(`mixamorig${name}`)!;
  const world = (name: string) => bone(name).getWorldPosition(new T.Vector3());
  const height = world('Head').y - world('Hips').y;

  function decal(
    text: string,
    target: T.SkinnedMesh,
    at: T.Vector3,
    facing: T.Vector3,
    width: number,
    owner: string,
    roll = 0,
  ) {
    const raycaster = new T.Raycaster(at.clone().addScaledVector(facing, 1), facing.clone().negate());
    const hit = raycaster.intersectObject(target, false)[0];
    if (!hit) {
      console.warn(`[franklyn] pas d'impact pour l'écusson ${text}`);
      return;
    }
    const orientation = new T.Euler().setFromRotationMatrix(
      new T.Matrix4().lookAt(hit.point, hit.point.clone().add(facing), new T.Vector3(0, 1, 0)),
    );
    orientation.z += roll;
    const size = new T.Vector3(width, width / 3.6, width * 0.6);
    const mesh = new T.Mesh(
      new DecalGeometry(target, hit.point, orientation, size),
      new T.MeshStandardMaterial({
        map: tape(text),
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      }),
    );
    mesh.castShadow = false;
    holder.add(mesh);
    holder.updateMatrixWorld(true);
    bone(owner).attach(mesh);
  }
  const chest = world('Spine2');
  const front = new T.Vector3(0, 0, 1);
  const w = height * 0.2;
  decal(
    'FRANKLYN',
    armour,
    chest.clone().add(new T.Vector3(height * 0.12, -height * 0.02, 0)),
    front,
    w,
    'Spine2',
  );
  decal(
    'HOLT ACADEMY',
    armour,
    chest.clone().add(new T.Vector3(-height * 0.12, -height * 0.02, 0)),
    front,
    w,
    'Spine2',
  );
  for (const side of ['Left', 'Right'] as const) {
    const arm = world(`${side}Arm`);
    const fore = world(`${side}ForeArm`);
    const mid = arm.clone().lerp(fore, 0.5);
    decal(
      'NCPD',
      armour,
      mid,
      new T.Vector3(0, 1, 0),
      height * 0.14,
      `${side}Arm`,
      side === 'Left' ? Math.PI / 2 : -Math.PI / 2,
    );
  }
}
