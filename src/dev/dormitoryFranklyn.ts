import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng } from '../core/rng';

/** Local study skin. The chapter rig supplies the motion, never these meshes. */
export async function dressDormitoryFranklyn(root: T.Group) {
  const atlas = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = `${import.meta.env.BASE_URL}assets/dormitory-aaa/franklyn-atlas.jpg`;
  });
  function tile(x: number, y: number, repeat = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    canvas
      .getContext('2d')!
      .drawImage(
        atlas,
        (x * atlas.width) / 2,
        (y * atlas.height) / 2,
        atlas.width / 2,
        atlas.height / 2,
        0,
        0,
        1024,
        1024,
      );
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.setScalar(repeat);
    texture.anisotropy = 8;
    return texture;
  }
  const faceTexture = tile(0, 0);
  faceTexture.wrapS = faceTexture.wrapT = T.ClampToEdgeWrapping;
  const fabricTexture = tile(1, 0, 2);
  const hairTexture = tile(0, 1);
  const leatherTexture = tile(1, 1, 2);
  const navy = new T.MeshStandardMaterial({
    color: 0x8298b6,
    map: fabricTexture,
    bumpMap: fabricTexture,
    bumpScale: 0.00055,
    roughness: 0.86,
  });
  const seam = new T.MeshStandardMaterial({ color: 0x253344, roughness: 0.92 });
  const rib = new T.MeshStandardMaterial({ color: 0x182330, map: fabricTexture, roughness: 0.94 });
  const metal = new T.MeshStandardMaterial({ color: 0x716c5c, metalness: 0.8, roughness: 0.38 });
  const leather = new T.MeshStandardMaterial({
    color: 0xa7abb1,
    map: leatherTexture,
    bumpMap: leatherTexture,
    bumpScale: 0.001,
    roughness: 0.5,
  });
  const sole = new T.MeshStandardMaterial({ color: 0x151719, roughness: 0.92 });
  const skin = new T.MeshPhysicalMaterial({
    color: 0xb68d73,
    roughness: 0.7,
    sheen: 0.16,
    sheenColor: new T.Color(0xe9b9a1),
  });
  const face = new T.MeshPhysicalMaterial({
    map: faceTexture,
    roughness: 0.69,
    sheen: 0.16,
    sheenColor: new T.Color(0xe9b9a1),
  });
  const hair = new T.MeshStandardMaterial({
    color: 0x71665c,
    map: hairTexture,
    bumpMap: hairTexture,
    bumpScale: 0.0007,
    roughness: 0.87,
  });
  // The source silhouette includes armour, mitten hands and a very coarse head.
  // Keep its bones and clips but replace every visible surface in this study.
  root.traverse((node) => {
    if (node instanceof T.Mesh || node instanceof T.Sprite) node.visible = false;
  });
  const anchors = new Map<string, T.Group>();
  function anchor(name: string) {
    let group = anchors.get(name);
    if (group) return group;
    const bone = root.getObjectByName(name)!;
    group = new T.Group();
    group.name = `étude-franklyn:${name}`;
    group.scale.setScalar(0.01);
    bone.add(group);
    anchors.set(name, group);
    return group;
  }
  function mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, x = 0, y = 0, z = 0) {
    const part = new T.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  function rounded(
    parent: T.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material = navy,
    radius = 0.01,
  ) {
    return mesh(parent, new RoundedBoxGeometry(w, h, d, 3, radius), material, x, y, z);
  }
  function line(parent: T.Object3D, points: T.Vector3[], radius: number, material: T.Material) {
    return mesh(
      parent,
      new T.TubeGeometry(new T.CatmullRomCurve3(points), points.length * 4, radius, 5, false),
      material,
    );
  }
  // Elliptic rings give the garment a continuous silhouette and actual broad folds.
  function garment(
    parent: T.Object3D,
    rings: readonly (readonly [number, number, number])[],
    material: T.Material,
    folds = 0.003,
    phase = 0,
  ) {
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    const count = 48;
    rings.forEach(([y, rx, rz], row) => {
      for (let column = 0; column <= count; column++) {
        const a = (column / count) * Math.PI * 2;
        const crease =
          folds * Math.sin(a * 7 + row * 1.8 + phase) * Math.sin((row / (rings.length - 1)) * Math.PI);
        positions.push(Math.sin(a) * (rx + crease), y, Math.cos(a) * (rz + crease));
        uvs.push(column / count, row / (rings.length - 1));
        if (row && column) {
          const i = row * (count + 1) + column;
          indices.push(i, i - 1, i - count - 2, i, i - count - 2, i - count - 1);
        }
      }
    });
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(parent, geometry, material);
  }
  const chest = anchor('Chest');
  garment(
    chest,
    [
      [-0.425, 0.159, 0.105],
      [-0.4, 0.17, 0.116],
      [-0.34, 0.177, 0.123],
      [-0.27, 0.174, 0.12],
      [-0.18, 0.189, 0.13],
      [-0.08, 0.205, 0.139],
      [0.02, 0.217, 0.125],
      [0.085, 0.197, 0.098],
      [0.1, 0.095, 0.072],
    ],
    navy,
    0.005,
  );
  garment(
    chest,
    [
      [-0.44, 0.158, 0.107],
      [-0.413, 0.164, 0.113],
    ],
    rib,
    0,
  );
  // Raised collar stays open at the throat, with its zipper below the opening.
  for (const side of [-1, 1]) {
    const collar = rounded(chest, 0.065, 0.1, 0.12, side * 0.074, 0.104, 0.004, navy, 0.013);
    collar.rotation.z = side * 0.14;
    rounded(chest, 0.135, 0.019, 0.105, side * 0.163, 0.069, 0.018, rib, 0.007);
    for (let i = 0; i < 3; i++) {
      rounded(chest, 0.016, 0.009, 0.081, side * (0.135 + i * 0.027), 0.083, 0.019, metal, 0.003);
    }
    rounded(chest, 0.135, 0.11, 0.013, side * 0.11, -0.14, 0.13, navy, 0.009);
    const flap = rounded(chest, 0.138, 0.032, 0.019, side * 0.11, -0.09, 0.137, navy, 0.006);
    flap.rotation.z = side * 0.035;
    line(
      chest,
      [
        new T.Vector3(side * 0.172, -0.38, 0.073),
        new T.Vector3(side * 0.167, -0.25, 0.1),
        new T.Vector3(side * 0.186, -0.08, 0.078),
      ],
      0.0014,
      seam,
    );
  }
  rounded(chest, 0.024, 0.46, 0.01, 0, -0.18, 0.139, rib, 0.002);
  for (let i = 0; i < 48; i++) rounded(chest, 0.011, 0.003, 0.004, 0, 0.036 - i * 0.009, 0.147, metal, 0.001);
  rounded(chest, 0.015, 0.028, 0.008, 0, 0.025, 0.153, metal, 0.003);
  function tape(
    parent: T.Object3D,
    text: string,
    width: number,
    height: number,
    x: number,
    y: number,
    z: number,
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#101a26';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#6d7374';
    ctx.lineWidth = 3;
    ctx.strokeRect(7, 7, 498, 114);
    ctx.font = '54px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c2c3b8';
    ctx.fillText(text, 256, 67, 465);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    return mesh(
      parent,
      new T.PlaneGeometry(width, height),
      new T.MeshStandardMaterial({ map: texture, roughness: 1 }),
      x,
      y,
      z,
    );
  }
  tape(chest, 'FRANKLYN', 0.139, 0.034, -0.109, -0.031, 0.143);
  tape(chest, 'HOLT ACADEMY', 0.145, 0.034, 0.112, -0.031, 0.143);
  const hips = anchor('Hips');
  garment(
    hips,
    [
      [-0.11, 0.115, 0.085],
      [-0.075, 0.166, 0.102],
      [0, 0.17, 0.112],
      [0.08, 0.157, 0.102],
    ],
    navy,
  );
  garment(
    hips,
    [
      [0.046, 0.16, 0.107],
      [0.073, 0.16, 0.107],
    ],
    rib,
    0,
  );
  rounded(hips, 0.046, 0.032, 0.01, 0, 0.061, 0.111, metal, 0.003);
  for (const side of ['L', 'R']) {
    const arm = anchor(`UpperArm${side}`),
      forearm = anchor(`LowerArm${side}`);
    garment(
      arm,
      [
        [-0.025, 0.052, 0.054],
        [0.005, 0.07, 0.067],
        [0.05, 0.074, 0.07],
        [0.11, 0.063, 0.063],
        [0.16, 0.058, 0.055],
        [0.197, 0.05, 0.052],
      ],
      navy,
      0.0035,
    );
    garment(
      forearm,
      [
        [-0.014, 0.052, 0.053],
        [0.035, 0.056, 0.054],
        [0.09, 0.054, 0.05],
        [0.15, 0.045, 0.043],
        [0.205, 0.04, 0.04],
        [0.234, 0.037, 0.036],
      ],
      navy,
      0.003,
    );
    garment(
      forearm,
      [
        [0.213, 0.039, 0.038],
        [0.24, 0.037, 0.036],
      ],
      rib,
      0,
    );
    const badge = tape(arm, 'NCPD', 0.064, 0.035, 0, 0.064, 0.072);
    badge.rotation.z = Math.PI;
    const hand = anchor(`Wrist${side}`);
    const palm = mesh(hand, new T.SphereGeometry(1, 20, 14), skin, 0, 0.045, 0);
    palm.scale.set(0.035, 0.054, 0.018);
    for (let finger = 0; finger < 4; finger++) {
      const length = [0.058, 0.066, 0.062, 0.048][finger]!;
      const x = (finger - 1.5) * 0.016;
      const digit = mesh(
        hand,
        new T.CapsuleGeometry(0.008, length - 0.016, 5, 10),
        skin,
        x,
        0.085 + length * 0.3,
        0.006,
      );
      digit.rotation.x = 0.22;
      digit.rotation.z = -(finger - 1.5) * 0.025;
    }
    const thumb = mesh(
      hand,
      new T.CapsuleGeometry(0.01, 0.035, 5, 10),
      skin,
      side === 'L' ? 0.034 : -0.034,
      0.055,
      0.014,
    );
    thumb.rotation.z = side === 'L' ? -0.42 : 0.42;
    const thigh = anchor(`UpperLeg${side}`),
      calf = anchor(`LowerLeg${side}`);
    garment(
      thigh,
      [
        [-0.025, 0.089, 0.093],
        [0.04, 0.098, 0.099],
        [0.12, 0.096, 0.097],
        [0.22, 0.085, 0.087],
        [0.32, 0.074, 0.077],
        [0.408, 0.069, 0.074],
        [0.447, 0.068, 0.071],
      ],
      navy,
      0.004,
    );
    garment(
      calf,
      [
        [-0.024, 0.07, 0.075],
        [0.025, 0.071, 0.075],
        [0.1, 0.071, 0.078],
        [0.19, 0.067, 0.07],
        [0.29, 0.056, 0.06],
        [0.36, 0.052, 0.055],
        [0.415, 0.05, 0.052],
      ],
      navy,
      0.004,
    );
    rounded(thigh, 0.017, 0.14, 0.102, side === 'L' ? 0.091 : -0.091, 0.19, 0, navy, 0.009);
    rounded(thigh, 0.025, 0.027, 0.106, side === 'L' ? 0.099 : -0.099, 0.134, 0, rib, 0.005);
    const foot = anchor(`Foot${side}`);
    // Foot bone +Y points towards the toe; its -Z is the top of the boot.
    const shoe = rounded(foot, 0.115, 0.255, 0.092, 0, 0.069, -0.038, leather, 0.035);
    shoe.rotation.x = 0.04;
    rounded(foot, 0.123, 0.267, 0.027, 0, 0.07, 0.009, sole, 0.012);
    rounded(foot, 0.1, 0.1, 0.16, 0, -0.007, -0.109, leather, 0.024);
    for (let lace = 0; lace < 5; lace++) {
      const y = 0.019 + lace * 0.017;
      line(foot, [new T.Vector3(-0.031, y, -0.091), new T.Vector3(0.028, y + 0.014, -0.091)], 0.0023, sole);
      line(foot, [new T.Vector3(0.031, y, -0.093), new T.Vector3(-0.028, y + 0.014, -0.093)], 0.0023, sole);
    }
  }
  const head = anchor('Head');
  // The source Head origin includes its stylised long neck. Lower only the local
  // surface, keeping the shared animation skeleton and its tracks untouched.
  head.position.y = -0.00043;
  head.scale.y *= 0.95;
  const neck = anchor('Neck');
  mesh(neck, new T.CylinderGeometry(0.048, 0.057, 0.1, 32), skin, 0, 0.006, -0.003);
  // Frontal anatomical surface, not a billboard: recessed temples and sockets,
  // projecting cheekbones, bridge, nostrils, muzzle and chin. UVs stay photographic.
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const rows = 64,
    columns = 64;
  const gaussian = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) =>
    Math.exp(-(((x - cx) / sx) ** 2) - ((y - cy) / sy) ** 2);
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const jaw = 0.053 + 0.038 * Math.sin(Math.min(1, v * 1.6) * Math.PI * 0.5);
    for (let column = 0; column <= columns; column++) {
      const u = column / columns,
        nx = u * 2 - 1;
      const x = nx * jaw,
        y = 0.014 + v * 0.235 + 0.018 * (1 - v) ** 5 * nx * nx;
      let z = 0.037 + 0.035 * Math.sqrt(Math.max(0, 1 - nx * nx));
      z += 0.025 * gaussian(u, v, 0.5, 0.43, 0.078, 0.15);
      z += 0.014 * gaussian(u, v, 0.5, 0.39, 0.13, 0.055);
      z += 0.006 * gaussian(u, v, 0.5, 0.23, 0.21, 0.065);
      z += 0.004 * gaussian(u, v, 0.5, 0.09, 0.27, 0.11);
      z -= 0.009 * (gaussian(u, v, 0.285, 0.67, 0.12, 0.065) + gaussian(u, v, 0.715, 0.67, 0.12, 0.065));
      positions.push(x, y, z);
      uvs.push(u, v);
      if (row && column) {
        const i = row * (columns + 1) + column;
        indices.push(i, i - 1, i - columns - 2, i, i - columns - 2, i - columns - 1);
      }
    }
  }
  const faceGeo = new T.BufferGeometry();
  faceGeo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  faceGeo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  faceGeo.setIndex(indices);
  faceGeo.computeVertexNormals();
  mesh(head, faceGeo, face);
  // Close the head with a continuous cheek-to-occiput surface. Sampling the same
  // edge of the face atlas avoids the pasted-on photograph/plain-skull boundary.
  const backPositions: number[] = [],
    backUvs: number[] = [],
    backIndices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const jaw = 0.053 + 0.038 * Math.sin(Math.min(1, v * 1.6) * Math.PI * 0.5);
    for (let column = 0; column <= columns; column++) {
      const a = (column / columns) * Math.PI;
      const x = Math.cos(a) * jaw;
      const y = 0.014 + v * 0.235 + 0.018 * (1 - v) ** 5;
      const z = 0.037 - Math.sin(a) * jaw * 1.55;
      backPositions.push(x, y, z);
      // Back and sides need skin only, never duplicated eyes or mouth.
      backUvs.push(column < columns / 2 ? 0.995 : 0.005, v);
      if (row && column) {
        const i = row * (columns + 1) + column;
        backIndices.push(i, i - 1, i - columns - 2, i, i - columns - 2, i - columns - 1);
      }
    }
  }
  const backGeo = new T.BufferGeometry();
  backGeo.setAttribute('position', new T.Float32BufferAttribute(backPositions, 3));
  backGeo.setAttribute('uv', new T.Float32BufferAttribute(backUvs, 2));
  backGeo.setIndex(backIndices);
  backGeo.computeVertexNormals();
  mesh(head, backGeo, face);
  for (const side of [-1, 1]) {
    const ear = mesh(head, new T.SphereGeometry(1, 20, 16), skin, side * 0.095, 0.125, -0.001);
    ear.scale.set(0.017, 0.035, 0.02);
    const inner = mesh(
      head,
      new T.SphereGeometry(1, 16, 12),
      new T.MeshStandardMaterial({ color: 0x986d56, roughness: 0.85 }),
      side * 0.102,
      0.124,
      0.012,
    );
    inner.scale.set(0.008, 0.023, 0.008);
  }
  // Sculpted cap and hundreds of merged tapered strands make a short swept crop.
  const capPositions: number[] = [],
    capUvs: number[] = [],
    capIndices: number[] = [];
  const hairline = (angle: number) => 1.64 - Math.sin(angle) * 0.42 + Math.sin(angle * 17) * 0.028;
  for (let row = 0; row <= 28; row++) {
    for (let column = 0; column <= 96; column++) {
      const angle = (column / 96) * Math.PI * 2;
      const latitude = (row / 28) * hairline(angle);
      capPositions.push(
        Math.cos(angle) * Math.sin(latitude) * 0.097,
        0.182 + Math.cos(latitude) * 0.096,
        Math.sin(angle) * Math.sin(latitude) * 0.101 - 0.027,
      );
      capUvs.push(column / 96, row / 28);
      if (row && column) {
        const i = row * 97 + column;
        capIndices.push(i, i - 1, i - 98, i, i - 98, i - 97);
      }
    }
  }
  const capGeo = new T.BufferGeometry();
  capGeo.setAttribute('position', new T.Float32BufferAttribute(capPositions, 3));
  capGeo.setAttribute('uv', new T.Float32BufferAttribute(capUvs, 2));
  capGeo.setIndex(capIndices);
  capGeo.computeVertexNormals();
  mesh(head, capGeo, hair);
  const hairRng = createRng('franklyn-study-hair');
  const strands: T.BufferGeometry[] = [];
  for (let i = 0; i < 420; i++) {
    const angle = hairRng.next() * Math.PI * 2;
    const latitude = hairRng.next() * hairline(angle);
    const x = Math.cos(angle) * Math.sin(latitude) * 0.099;
    const z = Math.sin(angle) * Math.sin(latitude) * 0.103 - 0.027;
    const y = 0.182 + Math.cos(latitude) * 0.098;
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(x, y, z),
      new T.Vector3(x - 0.011, y + 0.009, z + 0.006),
      new T.Vector3(x - 0.022, y + 0.005, z + 0.014),
    ]);
    strands.push(new T.TubeGeometry(curve, 4, 0.00075 + hairRng.next() * 0.00065, 3, false));
  }
  // Short overlapping tapered locks break the silhouette along the side crop.
  for (let i = 0; i < 150; i++) {
    const angle = (i / 150) * Math.PI * 2;
    const latitude = hairline(angle);
    const start = new T.Vector3(
      Math.cos(angle) * Math.sin(latitude) * 0.098,
      0.182 + Math.cos(latitude) * 0.097,
      Math.sin(angle) * Math.sin(latitude) * 0.102 - 0.027,
    );
    const length = 0.006 + hairRng.next() * 0.011;
    const lock = new T.ConeGeometry(0.0025, length, 4);
    lock.rotateZ(Math.PI + 0.3);
    lock.translate(start.x - 0.001, start.y - length * 0.35, start.z);
    strands.push(lock);
  }
  const strandsGeometry = mergeGeometries(strands);
  if (strandsGeometry) mesh(head, strandsGeometry, hair);
  for (const geometry of strands) geometry.dispose();
  // Merge only within a bone, retaining natural articulation while bounding draw calls.
  for (const group of anchors.values()) {
    const batches = new Map<T.Material, T.BufferGeometry[]>();
    for (const child of [...group.children]) {
      if (!(child instanceof T.Mesh) || Array.isArray(child.material)) continue;
      child.updateMatrix();
      const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
      geometry.applyMatrix4(child.matrix);
      const batch = batches.get(child.material) ?? [];
      batch.push(geometry);
      batches.set(child.material, batch);
      child.geometry.dispose();
      group.remove(child);
    }
    for (const [material, geometries] of batches) {
      const geometry = mergeGeometries(geometries);
      if (geometry) mesh(group, geometry, material);
      for (const part of geometries) part.dispose();
    }
  }
  const headBone = root.getObjectByName('Head')!;
  const chestBone = root.getObjectByName('Chest')!;
  let lastTime = 0;
  let bodyLean = 0;
  let gazeTurn = 0;
  return {
    update(time: number, speed: number, turn: number) {
      const dt = Math.min(0.05, Math.max(0, time - lastTime));
      lastTime = time;
      const rest = 1 - T.MathUtils.clamp(speed / 1.7, 0, 1);
      bodyLean = T.MathUtils.damp(bodyLean, -Math.min(speed, 1.7) * 0.012, 6, dt);
      gazeTurn = T.MathUtils.damp(gazeTurn, T.MathUtils.clamp(turn, -0.09, 0.09), 7, dt);
      headBone.rotateY(Math.sin(time * 0.43) * 0.035 * rest + gazeTurn);
      headBone.rotateX(Math.sin(time * 0.67) * 0.012 * rest);
      chestBone.rotateX(Math.sin(time * 1.65) * 0.006 * rest + bodyLean);
      chestBone.rotateZ(-gazeTurn * (1 - rest) * 0.32);
    },
  };
}
