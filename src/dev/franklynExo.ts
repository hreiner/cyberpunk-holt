import * as T from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { styleExoFranklyn } from './franklynExoStyle';

/**
 * Study-only Franklyn: Mixamo's "Exo Gray" mesh, skinned on the Mixamo skeleton, driven by
 * Mixamo clips directly. The chapter's Quaternius rig only supplies position and facing.
 */
const BASE = `${import.meta.env.BASE_URL}assets/mixamo/exo/`;
const HEIGHT_M = 1.78;

export async function createExoFranklyn() {
  const loader = new FBXLoader();
  const [character, walkSource] = await Promise.all([
    loader.loadAsync(`${BASE}idle.fbx`),
    loader.loadAsync(`${BASE}walk.fbx`),
  ]);
  const root = character;
  root.name = 'franklyn-exo';

  // Every skinned mesh of the download carries its own copy of the bones; only the hierarchy
  // hanging off the root is animated by name, so bind them all to that one skeleton.
  const animatedHips = root.getObjectByName('mixamorigHips')!;
  const meshes: T.SkinnedMesh[] = [];
  root.traverse((node) => {
    if (node instanceof T.SkinnedMesh) meshes.push(node);
  });
  const shared = (meshes.find((m) => m.skeleton.bones.includes(animatedHips as T.Bone)) ?? meshes[0]!)
    .skeleton;
  for (const mesh of meshes) mesh.bind(shared, mesh.bindMatrix);
  const pickClip = (source: T.Object3D) =>
    source.animations.find((clip) => clip.tracks.length > 0) ?? source.animations[0]!;

  // Fit to a 1.78 m cadet from the skinned bounds in rest pose.
  root.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(root, true);
  const scale = HEIGHT_M / (box.max.y - box.min.y);
  root.scale.multiplyScalar(scale);
  root.position.y = -box.min.y * scale;

  root.updateMatrixWorld(true);
  await styleExoFranklyn(root, meshes);
  const stats = { meshes: meshes.length, triangles: 0 };
  for (const mesh of meshes) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    stats.triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position!.count) / 3;
  }

  const mixer = new T.AnimationMixer(root);
  const idle = mixer.clipAction(pickClip(character));
  const walkClip = pickClip(walkSource);
  const walk = mixer.clipAction(walkClip);
  idle.play();
  walk.play();
  walk.setEffectiveWeight(0);

  // Ground speed the clip was authored for: fore/aft travel of one foot per cycle.
  const stride = (() => {
    const probe = new T.AnimationMixer(root);
    const action = probe.clipAction(walkClip).play();
    const foot = root.getObjectByName('mixamorigLeftFoot')!;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 24; i++) {
      action.time = (i / 24) * walkClip.duration;
      probe.update(0);
      root.updateMatrixWorld(true);
      const z = foot.getWorldPosition(new T.Vector3()).z;
      min = Math.min(min, z);
      max = Math.max(max, z);
    }
    probe.stopAllAction();
    probe.uncacheRoot(root);
    return (max - min) / (walkClip.duration * 0.6);
  })();

  let walkWeight = 0;
  return {
    object: root,
    stats: {
      ...stats,
      stride,
      scale,
      walk: {
        d: walkClip.duration,
        tracks: walkClip.tracks.length,
        sample: walkClip.tracks.slice(0, 4).map((t) => t.name),
      },
      clips: walkSource.animations.map((a) => `${a.name}:${a.tracks.length}`),
    },
    update(dt: number, speed: number) {
      walkWeight = T.MathUtils.damp(walkWeight, speed > 0.15 ? 1 : 0, 9, dt);
      walk.setEffectiveWeight(walkWeight);
      idle.setEffectiveWeight(1 - walkWeight);
      walk.timeScale = T.MathUtils.clamp(speed / stride, 0.4, 1.6);
      mixer.update(dt);
    },
  };
}
