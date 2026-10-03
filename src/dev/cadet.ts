import * as T from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { createMixamoRetarget } from '@/render/characters/mixamoRetarget';
import { dressCadet, mergeDecals, styleCadet } from '@/render/characters/cadetStyle';
import { LOOKS, type CadetLook } from '@/render/characters/cadetLooks';

/**
 * A HOLT cadet built with MPFB2 (Blender, headless; see tools/characters) on a Mixamo skeleton:
 * bone names are the real `mixamorig:*`, so Mixamo clips drive it through mixamoRetarget.ts.
 */
const BASE = `${import.meta.env.BASE_URL}assets/mixamo/`;

/** Idle and walk clips are shared: one download, one skeleton clone per character. */
let animations: Promise<{ idle: T.Object3D; walk: T.Object3D }> | null = null;
function loadAnimations() {
  animations ??= (async () => {
    const loader = new FBXLoader();
    const [idle, walk] = await Promise.all([
      loader.loadAsync(`${BASE}exo/idle.fbx`),
      loader.loadAsync(`${BASE}exo/walk.fbx`),
    ]);
    return { idle, walk };
  })();
  return animations;
}

/** Extra standing clips (Mixamo, no skin), fetched the first time a pose is played. */
export const POSES = [
  'talk',
  'argue',
  'disappointed',
  'salute',
  'look',
  'nervous',
  'sad',
  'wave',
  'run',
  'dance1',
  'dance2',
  'dance3',
] as const;
export type PoseName = (typeof POSES)[number];

const poseClips = new Map<PoseName, Promise<T.AnimationClip>>();
function loadPose(name: PoseName) {
  let clip = poseClips.get(name);
  if (!clip) {
    clip = new FBXLoader()
      .loadAsync(`${BASE}exo/${name}.fbx`)
      .then((source) => source.animations.find((c) => c.tracks.length > 0) ?? source.animations[0]!);
    poseClips.set(name, clip);
  }
  return clip;
}

/** An invisible copy of the Mixamo skeleton: it is only sampled, then retargeted. */
function skeletonOnly(source: T.Object3D) {
  const rig = cloneSkinned(source);
  const meshes: T.Object3D[] = [];
  rig.traverse((node) => {
    if ((node as T.Mesh).isMesh) meshes.push(node);
  });
  for (const mesh of meshes) mesh.removeFromParent();
  return rig;
}

export async function createCadet(look: CadetLook) {
  const [gltf, sources] = await Promise.all([
    new GLTFLoader().loadAsync(`${BASE}${look.id}/${look.id}.glb`),
    loadAnimations(),
  ]);
  const character = gltf.scene;
  const root = new T.Group();
  root.name = `cadet-${look.id}`;
  root.add(character);

  const meshes: T.Mesh[] = [];
  character.traverse((node) => {
    if (node instanceof T.Mesh) meshes.push(node);
  });
  const skinned = meshes.filter((m): m is T.SkinnedMesh => m instanceof T.SkinnedMesh);

  // Fit to the cadet's height from the rest-pose bounds.
  root.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(root, true);
  const scale = look.height / (box.max.y - box.min.y);
  root.scale.setScalar(scale);
  root.position.y = -box.min.y * scale;
  root.updateMatrixWorld(true);

  const params = new URLSearchParams(location.search);
  styleCadet(meshes, look, { mode: params.get('style') === 'pbr' ? 'pbr' : 'toon' });
  dressCadet(root, meshes, look);
  if (params.get('decals') !== 'split') mergeDecals(root);
  for (const mesh of meshes) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
  }

  const sourceRig = skeletonOnly(sources.idle);
  sourceRig.updateMatrixWorld(true);
  const retarget = createMixamoRetarget(character, sourceRig, {
    yaw: Number(params.get('yaw') ?? 0),
    curl: Number(params.get('curl') ?? 1),
  });
  const pickClip = (source: T.Object3D) =>
    source.animations.find((c) => c.tracks.length > 0) ?? source.animations[0]!;
  const walkClip = pickClip(sources.walk);
  const mixer = new T.AnimationMixer(sourceRig);
  const idle = mixer.clipAction(pickClip(sources.idle));
  const walk = mixer.clipAction(walkClip);
  idle.play();
  walk.play();
  walk.setEffectiveWeight(0);

  // Ground speed the walk clip was authored for: fore/aft travel of one foot per cycle.
  const stride = (() => {
    const foot = sourceRig.getObjectByName('mixamorigLeftFoot');
    if (!foot) return 1.2;
    const probe = new T.AnimationMixer(sourceRig);
    const action = probe.clipAction(walkClip).play();
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 24; i++) {
      action.time = (i / 24) * walkClip.duration;
      probe.update(0);
      sourceRig.updateMatrixWorld(true);
      const z = sourceRig.worldToLocal(foot.getWorldPosition(new T.Vector3())).z;
      min = Math.min(min, z);
      max = Math.max(max, z);
    }
    probe.stopAllAction();
    probe.uncacheRoot(sourceRig);
    return Math.max(0.5, ((max - min) * retarget.scale * scale) / (walkClip.duration * 0.6));
  })();

  // Poses crossfade against each other and against idle; walking always takes over.
  const poseActions = new Map<PoseName, T.AnimationAction>();
  const poseWeights = new Map<PoseName, number>();
  let currentPose: PoseName | null = null;
  let walkWeight = 0;
  return {
    object: root,
    look,
    debug: { retarget: true, mixer, retargeter: retarget },
    stats: {
      meshes: meshes.length,
      skinned: skinned.length,
      bones: skinned[0]?.skeleton.bones.length ?? 0,
      stride,
      scale,
      materials: meshes.map((m) => `${m.name}:${(m.material as T.Material).name}`),
    },
    get pose() {
      return currentPose;
    },
    /** Plays a standing pose (or returns to idle with `null`). Loads the clip on first use. */
    async play(name: PoseName | null) {
      if (name === currentPose) return;
      if (name && !poseActions.has(name)) {
        const action = mixer.clipAction(await loadPose(name));
        poseActions.set(name, action);
        poseWeights.set(name, 0);
      }
      currentPose = name;
      if (name) poseActions.get(name)!.reset().play();
    },
    update(dt: number, speed: number) {
      walkWeight = T.MathUtils.damp(walkWeight, speed > 0.15 ? 1 : 0, 9, dt);
      const standing = 1 - walkWeight;
      let poseSum = 0;
      for (const [name, action] of poseActions) {
        const weight = T.MathUtils.damp(poseWeights.get(name)!, name === currentPose ? 1 : 0, 6, dt);
        poseWeights.set(name, weight);
        if (weight < 0.002 && name !== currentPose) action.stop();
        action.setEffectiveWeight(standing * weight);
        poseSum += weight;
      }
      walk.setEffectiveWeight(walkWeight);
      idle.setEffectiveWeight(standing * Math.max(0, 1 - Math.min(1, poseSum)));
      walk.timeScale = T.MathUtils.clamp(speed / stride, 0.4, 1.6);
      mixer.update(dt);
      if (this.debug.retarget) retarget.apply();
    },
  };
}

export type Cadet = Awaited<ReturnType<typeof createCadet>>;

export const createMpfbFranklyn = () => createCadet(LOOKS.franklyn!);
