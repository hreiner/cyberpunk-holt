import * as T from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CadetLook } from './cadetLooks';

/**
 * Cyberpunk-anime look for the MPFB cast: opaque materials, stepped (cel) shading and an
 * inverted-hull ink outline that follows the skin. Study scene only.
 */

function ramp(steps: number[]) {
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((value, i) => {
    const v = Math.round(value * 255);
    data.set([v, v, v, 255], i * 4);
  });
  const texture = new T.DataTexture(data, steps.length, 1, T.RGBAFormat);
  texture.minFilter = texture.magFilter = T.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

const outlineMaterial = (thickness: number, color = 0x05070d) =>
  new T.ShaderMaterial({
    side: T.BackSide,
    uniforms: { thickness: { value: thickness }, color: { value: new T.Color(color) } },
    vertexShader: /* glsl */ `
      #include <common>
      #include <skinning_pars_vertex>
      uniform float thickness;
      void main() {
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        transformed += normalize(objectNormal) * thickness;
        #include <project_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      void main() { gl_FragColor = vec4(color, 1.0); }`,
  });

/** Cyan-magenta neon rim, the Edgerunners signature: a Fresnel term added after the cel shading. */
function rimLight(material: T.MeshToonMaterial, strength: number, cool: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.rimStrength = { value: strength };
    shader.uniforms.rimCool = { value: new T.Color(cool) };
    shader.uniforms.rimWarm = { value: new T.Color(0xff4fa8) };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float rimStrength;
        uniform vec3 rimCool;
        uniform vec3 rimWarm;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `float rimF = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 3.0);
        float rimSide = smoothstep(-0.6, 0.6, normal.x);
        rimF = smoothstep(0.35, 0.8, rimF);
        outgoingLight += mix(rimWarm, rimCool, rimSide) * rimF * rimStrength;
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => `cadet-rim-${cool.toString(16)}`;
}

export interface StyleOptions {
  /** 'toon' (default) or 'pbr' to keep plain lit materials. */
  mode?: 'toon' | 'pbr';
  outline?: number;
}

export function styleCadet(meshes: T.Mesh[], look: CadetLook, options: StyleOptions = {}) {
  const toon = (options.mode ?? 'toon') === 'toon';
  const gradient = ramp([0.34, 0.62, 0.86, 1]);
  // Skin keeps softer steps: hard bands on a face read as dirty blotches.
  const skinGradient = ramp([0.62, 0.8, 0.93, 1]);
  const thickness = options.outline ?? 0.0042;
  const outline = outlineMaterial(thickness);
  const inks: T.SkinnedMesh[] = [];

  for (const mesh of meshes) {
    const source = mesh.material as T.MeshPhongMaterial;
    const id = `${mesh.name}|${source.name}`.toLowerCase();
    const isEyes =
      id.includes('low-poly') || (id.includes('eye') && !id.includes('brow') && !id.includes('lash'));
    const isHair = /short0\d|hair|bob|braid|bangs|bun/.test(id);
    const isCutout = /eyebrow|eyelash/.test(id) || isHair;
    const isTeeth = id.includes('teeth');
    const isBrowOrLash = /eyebrow|eyelash/.test(id);
    const isSkin = id.includes('.body') || id.startsWith(`${look.id}_export`);

    // Per-character palette (hair, brows, boots, skin); clothes are repainted in dressCadet.
    const isBoots = /boots|shoes|flats/.test(id);
    const tint = isHair
      ? look.tint.hair
      : isBrowOrLash
        ? look.tint.brow
        : isBoots
          ? look.tint.boots
          : isSkin
            ? look.tint.skin
            : null;

    let material: T.Material;
    if (toon) {
      material = new T.MeshToonMaterial({
        name: source.name,
        map: source.map,
        color: tint ?? (source.map ? 0xffffff : source.color),
        gradientMap: isSkin ? skinGradient : gradient,
        alphaMap: source.alphaMap,
        alphaTest: isCutout ? 0.5 : 0,
        side: isCutout ? T.DoubleSide : T.FrontSide,
      });
    } else {
      material = new T.MeshStandardMaterial({
        name: source.name,
        map: source.map,
        normalMap: source.normalMap,
        roughness: 0.62,
        alphaTest: isCutout ? 0.5 : 0,
        side: isCutout ? T.DoubleSide : T.FrontSide,
      });
    }
    if (toon && !isEyes)
      rimLight(material as T.MeshToonMaterial, isSkin ? 0.16 : isHair ? 0.12 : 0.5, look.rim);
    if (source.map) {
      source.map.colorSpace = T.SRGBColorSpace;
      source.map.anisotropy = 8;
    }
    mesh.material = material;

    // No hull on hair (alpha-cut cards draw black slabs) nor on the skin mesh: its hull covers the
    // skin hidden under the clothes and pokes through at the collar and cuffs as black knots.
    const inked = !isEyes && !isTeeth && !isBrowOrLash && !isHair && !isSkin;
    if (toon && mesh instanceof T.SkinnedMesh && inked) {
      const ink = new T.SkinnedMesh(mesh.geometry, outline);
      ink.name = `${mesh.name}:ink`;
      ink.bind(mesh.skeleton, mesh.bindMatrix);
      ink.frustumCulled = false;
      inks.push(ink);
      mesh.parent?.add(ink);
    }
  }
  return { inks };
}

// ---- identity pass ----------------------------------------------------------------------

function repaint(texture: T.Texture, fn: (c: T.Color, hsl: { h: number; s: number; l: number }) => void) {
  const image = texture.image as CanvasImageSource & { width: number; height: number };
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const color = new T.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  for (let i = 0; i < px.length; i += 4) {
    color.setRGB(px[i]! / 255, px[i + 1]! / 255, px[i + 2]! / 255);
    color.getHSL(hsl);
    fn(color, hsl);
    px[i] = Math.round(color.r * 255);
    px[i + 1] = Math.round(color.g * 255);
    px[i + 2] = Math.round(color.b * 255);
  }
  ctx.putImageData(data, 0, 0);
  const out = new T.CanvasTexture(canvas);
  out.colorSpace = T.SRGBColorSpace;
  out.flipY = texture.flipY;
  out.wrapS = texture.wrapS;
  out.wrapT = texture.wrapT;
  out.anisotropy = 8;
  return out;
}

interface Cloth {
  mesh: T.SkinnedMesh;
  surface: T.Mesh;
  nearest: (p: T.Vector3) => number;
  rest: Float32Array;
  /** Inverse of the vertex's skinning matrix at the current pose: rest-space point -> bind-space point. */
  inverseSkin: (vertex: number) => T.Matrix4;
  inverseFor: (indices: number[], weights: number[]) => T.Matrix4;
}

/** A garment's posed rest surface plus a nearest-vertex index, so decals can be skinned like the cloth. */
function makeCloth(mesh: T.SkinnedMesh): Cloth {
  const geometry = mesh.geometry.clone();
  const position = geometry.getAttribute('position');
  const v = new T.Vector3();
  for (let i = 0; i < position.count; i++) {
    mesh.getVertexPosition(i, v);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  const surface = new T.Mesh(geometry, new T.MeshBasicMaterial({ side: T.DoubleSide }));
  surface.matrixAutoUpdate = false;
  surface.matrixWorld.copy(mesh.matrixWorld);
  surface.matrixWorldNeedsUpdate = false;

  const rest = new Float32Array(position.count * 3);
  const cell = 0.03;
  const cells = new Map<string, number[]>();
  for (let i = 0; i < position.count; i++) {
    rest.set([position.getX(i), position.getY(i), position.getZ(i)], i * 3);
    const key = `${Math.floor(position.getX(i) / cell)},${Math.floor(position.getY(i) / cell)},${Math.floor(position.getZ(i) / cell)}`;
    (cells.get(key) ?? cells.set(key, []).get(key)!).push(i);
  }
  const nearest = (p: T.Vector3) => {
    const cx = Math.floor(p.x / cell);
    const cy = Math.floor(p.y / cell);
    const cz = Math.floor(p.z / cell);
    let best = 0;
    let bestD = Infinity;
    for (let r = 1; r <= 5 && bestD === Infinity; r++)
      for (let x = cx - r; x <= cx + r; x++)
        for (let y = cy - r; y <= cy + r; y++)
          for (let z = cz - r; z <= cz + r; z++)
            for (const i of cells.get(`${x},${y},${z}`) ?? []) {
              const d =
                (rest[i * 3]! - p.x) ** 2 + (rest[i * 3 + 1]! - p.y) ** 2 + (rest[i * 3 + 2]! - p.z) ** 2;
              if (d < bestD) {
                bestD = d;
                best = i;
              }
            }
    return best;
  };
  const skinIndex = mesh.geometry.getAttribute('skinIndex');
  const skinWeight = mesh.geometry.getAttribute('skinWeight');
  const cache = new Map<number, T.Matrix4>();
  const boneMatrix = new T.Matrix4();
  /** Inverse skinning for arbitrary bone indices and weights (rest-space point -> bind-space point). */
  const inverseFor = (indices: number[], weights: number[]) => {
    const sum = new T.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    for (let k = 0; k < 4; k++) {
      const weight = weights[k]!;
      if (!weight) continue;
      const j = indices[k]!;
      boneMatrix.multiplyMatrices(mesh.skeleton.bones[j]!.matrixWorld, mesh.skeleton.boneInverses[j]!);
      for (let e = 0; e < 16; e++) sum.elements[e]! += boneMatrix.elements[e]! * weight;
    }
    return new T.Matrix4().multiplyMatrices(mesh.bindMatrixInverse, sum).multiply(mesh.bindMatrix).invert();
  };
  const inverseSkin = (vertex: number) => {
    let inverse = cache.get(vertex);
    if (!inverse) {
      const at = (attribute: T.BufferAttribute | T.InterleavedBufferAttribute) =>
        [0, 1, 2, 3].map((k) => attribute.getComponent(vertex, k));
      inverse = inverseFor(at(skinIndex), at(skinWeight));
      cache.set(vertex, inverse);
    }
    return inverse;
  };
  return { mesh, surface, nearest, rest, inverseSkin, inverseFor };
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, flip = false) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  if (flip) {
    texture.wrapS = T.RepeatWrapping;
    texture.repeat.x = -1;
    texture.offset.x = 1;
  }
  return texture;
}

/** Repaints every garment atlas in the look's palette, then sews the patches its decal flags ask for. */
export async function dressCadet(root: T.Object3D, meshes: T.Mesh[], look: CadetLook) {
  const isTop = (m: T.Mesh) =>
    /jacket|suit|shirt|hoodie|tracksuit|elegant/i.test(m.name) && !/pants/i.test(m.name);
  const isLegs = (m: T.Mesh) => /pants/i.test(m.name);
  const isGarment = (m: T.Mesh) => /jacket|pants|suit|shirt|hoodie|tracksuit|elegant/i.test(m.name);

  const waitForImage = async (map: T.Texture) => {
    for (let waited = 0; waited < 20000; waited += 50) {
      const image = map.image as { width?: number } | null;
      if (image && (image.width ?? 0) > 0) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const hp = look.hairPaint;
  if (hp) {
    for (const mesh of meshes) {
      if (!/short0\d|hair|bob|braid|bangs|bun/i.test(mesh.name)) continue;
      const material = mesh.material as T.MeshToonMaterial;
      if (!material.map) continue;
      await waitForImage(material.map);
      material.map = repaint(material.map, (col, { l }) => {
        col.setHSL(hp.hue, hp.sat, hp.lo + Math.min(1, l * hp.gain) * hp.range);
      });
      material.needsUpdate = true;
    }
  }

  const c = look.cloth;
  for (const mesh of meshes) {
    if (!isGarment(mesh)) continue;
    const material = mesh.material as T.MeshToonMaterial | T.MeshStandardMaterial;
    const map = material.map;
    if (!map) continue;
    await waitForImage(map);
    material.map = repaint(map, (col, { l }) => {
      // Luminance survives (seams, pockets, folds); hue and saturation are replaced. Near-white
      // shirt cloth (dropAbove) goes dark so only the jacket reads.
      const light =
        c.dropAbove !== undefined && l > c.dropAbove ? c.lo : c.lo + Math.min(1, l * c.gain) * c.range;
      col.setHSL(c.hue, c.sat, light);
    });
    material.color.set(0xffffff);
    material.needsUpdate = true;
  }

  root.updateMatrixWorld(true);
  const bone = (n: string) => root.getObjectByName(`mixamorig${n}`);
  const topMesh = meshes.find(isTop) as T.SkinnedMesh | undefined;
  const legsMesh = (meshes.find(isLegs) ??
    meshes.find((m) => /suit/i.test(m.name) && !/jacket/i.test(m.name)) ??
    topMesh) as T.SkinnedMesh | undefined;
  if (!topMesh) return;
  const top = makeCloth(topMesh);
  const legs = legsMesh === topMesh ? top : legsMesh ? makeCloth(legsMesh) : top;
  const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  const front = V(0, 0, 1);
  const up = V(0, 1, 0);

  /** Projects a decal onto `cloth` (rest pose) along -normal from `at`, skinned like the cloth. */
  const stick = (
    cloth: Cloth,
    at: T.Vector3,
    normal: T.Vector3,
    upDir: T.Vector3,
    size: T.Vector3,
    map: T.Texture,
    lift = 0.005,
  ) => {
    const n = normal.clone().normalize();
    const hit = new T.Raycaster(at.clone().addScaledVector(n, 1), n.clone().negate()).intersectObject(
      cloth.surface,
      false,
    )[0];
    if (!hit) return;
    const orientation = new T.Euler().setFromRotationMatrix(
      new T.Matrix4().lookAt(hit.point, hit.point.clone().add(n), upDir),
    );
    const geometry = new DecalGeometry(cloth.surface, hit.point, orientation, size);
    const pos = geometry.getAttribute('position');
    const nor = geometry.getAttribute('normal');
    const inverse = new T.Matrix4().copy(cloth.surface.matrixWorld).invert();
    const skinIndex = cloth.mesh.geometry.getAttribute('skinIndex');
    const skinWeight = cloth.mesh.geometry.getAttribute('skinWeight');
    const indices: number[] = [];
    const weights: number[] = [];
    const local = new T.Vector3();
    for (let i = 0; i < pos.count; i++) {
      // Float the patch just above the cloth, then borrow the skin weights of the nearest vertex.
      local
        .set(
          pos.getX(i) + nor.getX(i) * lift,
          pos.getY(i) + nor.getY(i) * lift,
          pos.getZ(i) + nor.getZ(i) * lift,
        )
        .applyMatrix4(inverse);
      const near = cloth.nearest(local);
      local.applyMatrix4(cloth.inverseSkin(near));
      pos.setXYZ(i, local.x, local.y, local.z);
      indices.push(skinIndex.getX(near), skinIndex.getY(near), skinIndex.getZ(near), skinIndex.getW(near));
      weights.push(
        skinWeight.getX(near),
        skinWeight.getY(near),
        skinWeight.getZ(near),
        skinWeight.getW(near),
      );
    }
    geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    const decal = new T.SkinnedMesh(
      geometry,
      new T.MeshBasicMaterial({ map, transparent: true, polygonOffset: true, polygonOffsetFactor: -4 }),
    );
    decal.bind(cloth.mesh.skeleton, cloth.mesh.bindMatrix);
    decal.frustumCulled = false;
    cloth.mesh.parent?.add(decal);
  };

  const tape = (ctx: CanvasRenderingContext2D, text: string) => {
    ctx.fillStyle = '#0a1018';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#3a4656';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.font = '600 62px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e4e9ee';
    ctx.fillText(text, 256, 66, 470);
  };

  const chest = bone('Spine2');
  const origin = chest?.getWorldPosition(new T.Vector3()) ?? V(0, 1.3, 0);
  const d = look.decals;

  if (d.tapes && look.tape) {
    for (const [text, side] of [
      ['HOLT ACADEMY', 1],
      [look.tape, -1],
    ] as const)
      stick(
        top,
        origin.clone().add(V(side * 0.085, 0.06, 0)),
        front,
        up,
        V(0.15, 0.042, 0.1),
        canvasTexture(512, 128, (ctx) => tape(ctx, text), true),
      );
  }

  const patch = canvasTexture(
    256,
    320,
    (ctx) => {
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(236, 20);
      ctx.lineTo(236, 190);
      ctx.quadraticCurveTo(236, 270, 128, 304);
      ctx.quadraticCurveTo(20, 270, 20, 190);
      ctx.closePath();
      ctx.fillStyle = '#26344a';
      ctx.fill();
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#c7d0da';
      ctx.stroke();
      ctx.fillStyle = '#e8edf2';
      ctx.font = '700 62px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NCPD', 128, 82);
      ctx.strokeStyle = '#c7d0da';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 180, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(128, 180, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.moveTo(128 + Math.cos(a) * 26, 180 + Math.sin(a) * 26);
        ctx.lineTo(128 + Math.cos(a) * 50, 180 + Math.sin(a) * 50);
      }
      ctx.stroke();
    },
    true,
  );
  const strap = (bars: boolean) =>
    canvasTexture(128, 256, (ctx) => {
      ctx.fillStyle = '#0b1018';
      ctx.fillRect(0, 0, 128, 256);
      ctx.strokeStyle = '#3d4858';
      ctx.lineWidth = 6;
      ctx.strokeRect(5, 5, 118, 246);
      ctx.fillStyle = '#7d8896';
      if (bars) {
        ctx.fillRect(22, 70, 84, 16);
        ctx.fillRect(22, 110, 84, 16);
      } else {
        ctx.beginPath();
        ctx.arc(64, 190, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  const epaulette = strap(false);
  const rankBars = strap(true);

  for (const name of ['Left', 'Right'] as const) {
    const arm = bone(`${name}Arm`);
    const fore = bone(`${name}ForeArm`);
    if (!arm || !fore) continue;
    const at = arm.getWorldPosition(new T.Vector3());
    const elbow = fore.getWorldPosition(new T.Vector3());
    const side = Math.sign(at.x) || 1;
    if (d.patches) {
      // A-pose sleeve: patch on the outer-front face, lettering upright toward the shoulder.
      const axis = elbow.clone().sub(at).normalize();
      stick(
        top,
        at.clone().lerp(elbow, 0.4),
        V(side * 0.76, 0.65, 0.5),
        axis.clone().negate(),
        V(0.12, 0.14, 0.12),
        patch,
      );
    }
    if (d.epaulettes || d.rankBars)
      stick(
        top,
        at.clone().add(V(side * -0.01, 0.06, 0)),
        up,
        V(0, 0, -1),
        V(0.075, 0.12, 0.1),
        d.rankBars ? rankBars : epaulette,
      );
  }

  // Collar bars (mandarin tunic) and a plain black tie for the shirt-and-tie variants.
  if (d.collarBars) {
    const bar = canvasTexture(128, 64, (ctx) => {
      ctx.fillStyle = '#0b1018';
      ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = '#9aa5b3';
      ctx.fillRect(20, 24, 88, 16);
    });
    for (const side of [1, -1])
      stick(top, origin.clone().add(V(side * 0.05, 0.17, 0)), front, up, V(0.05, 0.03, 0.1), bar);
  }
  if (d.tie) {
    const tie = canvasTexture(64, 256, (ctx) => {
      ctx.fillStyle = '#07090d';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(48, 0);
      ctx.lineTo(44, 40);
      ctx.lineTo(56, 240);
      ctx.lineTo(32, 256);
      ctx.lineTo(8, 240);
      ctx.lineTo(20, 40);
      ctx.closePath();
      ctx.fill();
    });
    stick(top, origin.clone().add(V(0, -0.02, 0)), front, up, V(0.05, 0.3, 0.1), tie);
  }

  if (d.braids) {
    // Two three-strand plaits from behind the ears down over the chest. They are skinned: the part
    // beside the head follows the head bone, the rest borrows the blouse's skin weights.
    const eyes = meshes.filter((m) => /low-poly/i.test(m.name));
    const eyeBox = new T.Box3();
    for (const eye of eyes) eyeBox.expandByObject(eye, true);
    const eyeAt = eyeBox.getCenter(new T.Vector3());
    const k = look.height / 1.75;
    // The braids hang down the back: find the blouse's back surface from behind.
    const backZ = (x: number, y: number) => {
      const hit = new T.Raycaster(V(x, y, -2), V(0, 0, 1)).intersectObject(top.surface, false)[0];
      return hit ? hit.point.z - 0.012 : eyeAt.z - 0.14;
    };
    const head = bone('Head');
    const headIndex = head ? top.mesh.skeleton.bones.indexOf(head as T.Bone) : -1;
    const headInverse = headIndex >= 0 ? top.inverseFor([headIndex, 0, 0, 0], [1, 0, 0, 0]) : null;
    const neckY = origin.y + 0.2 * k;
    const gradient = ramp([0.34, 0.62, 0.86, 1]);
    const material = new T.MeshToonMaterial({ color: look.tint.hair, gradientMap: gradient });
    rimLight(material, 0.1, look.rim);
    for (const side of [1, -1]) {
      const at = (x: number, y: number) => V(side * x * k, y, backZ(side * x * k, y));
      const curve = new T.CatmullRomCurve3(
        [
          V(side * 0.07 * k, eyeAt.y - 0.03 * k, eyeAt.z - 0.1 * k),
          V(side * 0.068 * k, eyeAt.y - 0.12 * k, eyeAt.z - 0.115 * k),
          at(0.078, origin.y + 0.13 * k),
          at(0.076, origin.y + 0.02 * k),
          at(0.074, origin.y - 0.1 * k),
          at(0.072, origin.y - 0.22 * k),
          at(0.07, origin.y - 0.34 * k),
        ],
        false,
        'catmullrom',
        0.4,
      );
      const strandCount = 3;
      const samples = 150;
      const turns = 11;
      const geometries: T.BufferGeometry[] = [];
      for (let strand = 0; strand < strandCount; strand++) {
        const points: T.Vector3[] = [];
        for (let i = 0; i <= samples; i++) {
          const t = i / samples;
          const centre = curve.getPoint(t);
          const tangent = curve.getTangent(t).normalize();
          const across = new T.Vector3().crossVectors(tangent, V(0, 0, 1)).normalize();
          const depth = new T.Vector3().crossVectors(across, tangent).normalize();
          const phase = (strand / strandCount) * Math.PI * 2 + t * turns * Math.PI * 2;
          const radius = 0.0085 * k * (1 - 0.5 * t);
          points.push(
            centre
              .clone()
              .addScaledVector(across, Math.cos(phase) * radius)
              .addScaledVector(depth, Math.sin(phase) * radius),
          );
        }
        geometries.push(new T.TubeGeometry(new T.CatmullRomCurve3(points), samples, 0.0075 * k, 7, false));
      }
      const geometry = mergeGeometries(geometries)!;
      const pos = geometry.getAttribute('position');
      const indices: number[] = [];
      const weights: number[] = [];
      const local = new T.Vector3();
      const inverse = new T.Matrix4().copy(top.surface.matrixWorld).invert();
      const skinIndex = top.mesh.geometry.getAttribute('skinIndex');
      const skinWeight = top.mesh.geometry.getAttribute('skinWeight');
      for (let i = 0; i < pos.count; i++) {
        local.fromBufferAttribute(pos, i);
        const onHead = headInverse !== null && local.y > neckY;
        local.applyMatrix4(inverse);
        if (onHead) {
          local.applyMatrix4(headInverse!);
          indices.push(headIndex, 0, 0, 0);
          weights.push(1, 0, 0, 0);
        } else {
          const near = top.nearest(local);
          local.applyMatrix4(top.inverseSkin(near));
          indices.push(
            skinIndex.getX(near),
            skinIndex.getY(near),
            skinIndex.getZ(near),
            skinIndex.getW(near),
          );
          weights.push(
            skinWeight.getX(near),
            skinWeight.getY(near),
            skinWeight.getZ(near),
            skinWeight.getW(near),
          );
        }
        pos.setXYZ(i, local.x, local.y, local.z);
      }
      geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4));
      geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
      const braid = new T.SkinnedMesh(geometry, material);
      braid.bind(top.mesh.skeleton, top.mesh.bindMatrix);
      braid.frustumCulled = false;
      braid.castShadow = true;
      top.mesh.parent?.add(braid);
    }
  }

  if (d.belt) {
    const hips = bone('Hips')?.getWorldPosition(new T.Vector3());
    const beltTex = canvasTexture(256, 48, (ctx) => {
      ctx.fillStyle = '#070a10';
      ctx.fillRect(0, 0, 256, 48);
      ctx.fillStyle = '#9aa5b3';
      ctx.fillRect(104, 6, 48, 36);
      ctx.fillStyle = '#070a10';
      ctx.fillRect(112, 14, 32, 20);
    });
    if (hips) stick(legs, hips.clone().add(V(0, 0.1, 0)), front, up, V(0.36, 0.04, 0.1), beltTex);
  }

  if (d.pockets) {
    // Cargo pockets on the thighs, chest flaps and knee pads: lighter navy stitching so they read.
    const seam = '#41546f';
    const pocket = canvasTexture(192, 256, (ctx) => {
      ctx.fillStyle = '#1b2739';
      ctx.fillRect(0, 0, 192, 256);
      ctx.strokeStyle = seam;
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 176, 240);
      ctx.beginPath();
      ctx.moveTo(8, 92);
      ctx.lineTo(184, 92);
      ctx.stroke();
      ctx.fillStyle = '#5b6f8c';
      ctx.beginPath();
      ctx.arc(96, 92, 12, 0, Math.PI * 2);
      ctx.fill();
    });
    const flap = canvasTexture(192, 128, (ctx) => {
      ctx.fillStyle = '#1b2739';
      ctx.fillRect(0, 0, 192, 128);
      ctx.strokeStyle = seam;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(184, 8);
      ctx.lineTo(184, 70);
      ctx.lineTo(96, 120);
      ctx.lineTo(8, 70);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#5b6f8c';
      ctx.beginPath();
      ctx.arc(96, 62, 10, 0, Math.PI * 2);
      ctx.fill();
    });
    const kneePad = canvasTexture(192, 192, (ctx) => {
      ctx.fillStyle = '#141d2b';
      ctx.fillRect(0, 0, 192, 192);
      ctx.strokeStyle = seam;
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 176, 176);
      ctx.lineWidth = 5;
      for (const y of [64, 96, 128]) {
        ctx.beginPath();
        ctx.moveTo(24, y);
        ctx.lineTo(168, y);
        ctx.stroke();
      }
    });
    for (const name of ['Left', 'Right'] as const) {
      const hip = bone(`${name}UpLeg`);
      const knee = bone(`${name}Leg`);
      if (!hip || !knee) continue;
      const a = hip.getWorldPosition(new T.Vector3());
      const b = knee.getWorldPosition(new T.Vector3());
      const side = Math.sign(a.x) || 1;
      stick(
        legs,
        a
          .clone()
          .lerp(b, 0.38)
          .add(V(side * 0.02, 0, 0)),
        V(side * 0.55, 0, 1),
        up,
        V(0.12, 0.16, 0.12),
        pocket,
      );
      stick(legs, b.clone().add(V(0, 0.06, 0)), front, up, V(0.11, 0.1, 0.1), kneePad);
    }
    for (const side of [1, -1])
      stick(top, origin.clone().add(V(side * 0.075, -0.075, 0)), front, up, V(0.1, 0.07, 0.1), flap);
  }
}
