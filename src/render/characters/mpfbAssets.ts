/**
 * Préchargement de la distribution MPFB (ADR 0041) : un GLB par personnage
 * (`public/assets/mixamo/<id>/<id>.glb`, construit par `tools/characters`) et les clips Mixamo
 * sans peau (`public/assets/mixamo/exo/*.fbx`).
 *
 * L'habillage d'un personnage (repeinture des atlas, décalques projetés, coque d'encre) coûte
 * cher : il est fait UNE fois par personnage au chargement, sur un modèle-patron, puis chaque rig
 * clone ce patron (`cloneMpfbCadet`). Les rigs du jeu restent ainsi synchrones et bon marché.
 */
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { LOOKS, type CadetLook } from './cadetLooks';
import { dressCadet, mergeDecals, styleCadet } from './cadetStyle';

const BASE = `${import.meta.env.BASE_URL}assets/mixamo/`;

/** Clips joués par le rig du jeu. `inspect` réemploie « Looking Around ». */
export const MPFB_CLIP_FILES = {
  idle: 'idle',
  walk: 'walk',
  run: 'run',
  shoot: 'shoot',
  down: 'down',
  revive: 'getup',
  talk: 'talk',
  inspect: 'look',
  lean: 'lean',
  dance1: 'dance1',
  dance2: 'dance2',
  dance3: 'dance3',
} as const;
export type MpfbClip = keyof typeof MPFB_CLIP_FILES;
/**
 * Clips dont les hanches voyagent au sol : la chute recule de ~0,9 m et le relevé avance d'autant,
 * ce qui ferait sauter le corps à chaque changement de clip. Le gameplay place le personnage.
 */
const PINNED: readonly MpfbClip[] = ['down', 'revive'];

/**
 * Portion utile d'un clip, en secondes. « Getting Up » reste couché 3,6 s puis se tient debout
 * 2 s de plus : ranimer un cadet doit le relever tout de suite et lui rendre la main vite.
 */
const TRIM: Partial<Record<MpfbClip, readonly [number, number]>> = { revive: [3.3, 6.6] };

/**
 * Hanches au sol, en place : `pin` les fige à l'aplomb du repos (x = z = 0, comme l'idle) ; `detrend`
 * retire seulement la dérive linéaire (une danse qui avance d'un mètre par boucle) en gardant
 * le balancement.
 */
function groundHips(clip: THREE.AnimationClip, mode: 'pin' | 'detrend'): void {
  const track = clip.tracks.find((t) => t.name === 'mixamorigHips.position');
  if (!track) return;
  const v = track.values;
  const n = track.times.length;
  if (n < 2) return;
  const [x0, z0] = [v[0]!, v[2]!];
  const [dx, dz] = [v[(n - 1) * 3]! - x0, v[(n - 1) * 3 + 2]! - z0];
  const span = track.times[n - 1]! - track.times[0]!;
  for (let i = 0; i < n; i++) {
    const f = span > 0 ? (track.times[i]! - track.times[0]!) / span : 0;
    if (mode === 'pin') {
      v[i * 3] = 0;
      v[i * 3 + 2] = 0;
    } else {
      v[i * 3] = v[i * 3]! - dx * f;
      v[i * 3 + 2] = v[i * 3 + 2]! - dz * f;
    }
  }
}

/** Sans eux, le rig n'a pas de sens : leur absence fait échouer le chargement. */
const REQUIRED: readonly MpfbClip[] = ['idle', 'walk', 'run'];

interface Template {
  readonly look: CadetLook;
  /** Personnage habillé, à l'échelle de `look.height`, pieds à y = 0. */
  readonly root: THREE.Object3D;
}

interface Cast {
  readonly templates: ReadonlyMap<string, Template>;
  /** Squelette Mixamo sans maillage, au repos (T-pose) : source du retarget. */
  readonly skeleton: THREE.Object3D;
  /** Filled as clips arrive: the optional ones load after startup. */
  readonly clips: Map<MpfbClip, THREE.AnimationClip>;
}

let cast: Cast | undefined;
let loading: Promise<void> | undefined;

/** Personnages MPFB disponibles (identifiants de `LOOKS`). */
export function hasMpfbLook(id: string): boolean {
  return cast?.templates.has(id) ?? false;
}

export function mpfbCastReady(): boolean {
  return cast !== undefined;
}

/** `?rig=quaternius` garde les anciens humanoïdes, pour comparer ou en cas de souci. */
export function mpfbCastEnabled(): boolean {
  return (
    cast !== undefined &&
    (typeof location === 'undefined' || new URLSearchParams(location.search).get('rig') !== 'quaternius')
  );
}

export function preloadMpfbCast(): Promise<void> {
  if (cast) return Promise.resolve();
  loading ??= load().finally(() => {
    loading = undefined;
  });
  return loading;
}

async function load(): Promise<void> {
  const gltf = new GLTFLoader();
  const looks = Object.values(LOOKS);
  // Only the locomotion clips block startup; the others (shoot, fall, dances...) stream in after.
  const [scenes, required] = await Promise.all([
    Promise.all(looks.map((look) => gltf.loadAsync(`${BASE}${look.id}/${look.id}.glb`))),
    Promise.all(REQUIRED.map((clip) => loadClip(clip))),
  ]);
  const clips = new Map<MpfbClip, THREE.AnimationClip>();
  REQUIRED.forEach((clip, i) => clips.set(clip, required[i]!.animation));
  const templates = new Map<string, Template>();
  looks.forEach((look, i) => templates.set(look.id, makeTemplate(look, scenes[i]!.scene)));
  const walk = required[REQUIRED.indexOf('walk')]!.source;
  cast = { templates, skeleton: skeletonOnly(walk), clips };

  const optional = (Object.keys(MPFB_CLIP_FILES) as MpfbClip[]).filter((clip) => !REQUIRED.includes(clip));
  for (const clip of optional) {
    loadClip(clip)
      .then(({ animation }) => clips.set(clip, animation))
      .catch(() =>
        console.warn(`[HOLT] clip ${MPFB_CLIP_FILES[clip]}.fbx absent : repli sur la pose de repos`),
      );
  }
}

const fbx = new FBXLoader();
async function loadClip(clip: MpfbClip): Promise<{ source: THREE.Object3D; animation: THREE.AnimationClip }> {
  const source = await fbx.loadAsync(`${BASE}exo/${MPFB_CLIP_FILES[clip]}.fbx`);
  const raw = source.animations.find((c) => c.tracks.length > 0) ?? source.animations[0];
  if (!raw) throw new Error(`Clip vide : ${MPFB_CLIP_FILES[clip]}.fbx`);
  const trim = TRIM[clip];
  const animation = trim
    ? THREE.AnimationUtils.subclip(raw, clip, Math.round(trim[0] * 30), Math.round(trim[1] * 30), 30)
    : raw;
  if (PINNED.includes(clip)) groundHips(animation, 'pin');
  else if (clip.startsWith('dance')) groundHips(animation, 'detrend');
  return { source, animation };
}

function makeTemplate(look: CadetLook, scene: THREE.Object3D): Template {
  const root = new THREE.Group();
  root.name = `mpfb:${look.id}`;
  root.add(scene);
  const meshes: THREE.Mesh[] = [];
  scene.traverse((node) => {
    if (node instanceof THREE.Mesh) meshes.push(node);
  });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root, true);
  const scale = look.height / (box.max.y - box.min.y);
  root.scale.setScalar(scale);
  root.position.y = -box.min.y * scale;
  root.updateMatrixWorld(true);
  styleCadet(meshes, look);
  dressCadet(root, meshes, look);
  // Closed mouths at game distance: the teeth (~7k triangles per character) never show.
  const teeth: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (node instanceof THREE.Mesh && /teeth/i.test(node.name)) teeth.push(node);
  });
  for (const node of teeth) node.removeFromParent();
  mergeDecals(root);
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    // Only the solid volumes cast shadows: ink hulls, decals, eyes, brows and lashes would add a
    // draw call per shadow pass for nothing visible.
    const solid =
      node.material instanceof THREE.MeshToonMaterial && !/eye|brow|lash|low-poly/i.test(node.name);
    node.castShadow = solid;
    node.receiveShadow = solid || node.userData.decal === true;
    // Skinned bounds are those of the rest pose: an animated arm would be culled at screen edges.
    node.frustumCulled = false;
  });
  return { look, root };
}

/** Skinless Mixamo clips still carry the full skeleton at its T-pose rest; meshes are dropped. */
function skeletonOnly(source: THREE.Object3D): THREE.Object3D {
  const rig = cloneSkinned(source);
  const meshes: THREE.Object3D[] = [];
  rig.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) meshes.push(node);
  });
  for (const mesh of meshes) mesh.removeFromParent();
  return rig;
}

export interface MpfbBody {
  readonly look: CadetLook;
  /** Personnage habillé (clone du patron). Sa racine porte l'échelle et le décalage au sol. */
  readonly root: THREE.Object3D;
  /** Modèle glTF dans `root` : cible du retarget. */
  readonly character: THREE.Object3D;
  /** Squelette source invisible, à animer avec un `AnimationMixer`. */
  readonly source: THREE.Object3D;
  /** Shared and filled in the background: a clip absent now may be there on the next play. */
  readonly clips: ReadonlyMap<MpfbClip, THREE.AnimationClip>;
}

export function cloneMpfbCadet(id: string): MpfbBody {
  if (!cast) throw new Error('Les personnages MPFB doivent être chargés avant l’exploration.');
  const template = cast.templates.get(id);
  if (!template) throw new Error(`Personnage MPFB inconnu : ${id}`);
  const root = cloneSkinned(template.root);
  root.updateMatrixWorld(true);
  const character = root.children[0]!;
  const source = cloneSkinned(cast.skeleton);
  source.updateMatrixWorld(true);
  return { look: template.look, root, character, source, clips: cast.clips };
}

/**
 * Vitesse au sol (m/s) pour laquelle un clip de marche ou de course a été animé : course d'un pied
 * d'avant en arrière sur un cycle, rapportée à l'échelle du personnage. Mise en cache par
 * personnage et par clip (l'échantillonnage déplace le squelette source, sans effet ensuite).
 */
const strideCache = new Map<string, number>();
export function clipGroundSpeed(body: MpfbBody, clip: MpfbClip, sourceToCharacter: number): number {
  const key = `${body.look.id}:${clip}`;
  const cached = strideCache.get(key);
  if (cached !== undefined) return cached;
  const animation = body.clips.get(clip);
  const foot = body.source.getObjectByName('mixamorigLeftFoot');
  let speed = clip === 'run' ? 3.5 : 1.3;
  if (animation && foot) {
    const probe = new THREE.AnimationMixer(body.source);
    const action = probe.clipAction(animation).play();
    let min = Infinity;
    let max = -Infinity;
    const at = new THREE.Vector3();
    for (let i = 0; i < 24; i++) {
      action.time = (i / 24) * animation.duration;
      probe.update(0);
      body.source.updateMatrixWorld(true);
      const z = body.source.worldToLocal(foot.getWorldPosition(at)).z;
      min = Math.min(min, z);
      max = Math.max(max, z);
    }
    probe.stopAllAction();
    probe.uncacheRoot(body.source);
    speed = Math.max(0.5, ((max - min) * sourceToCharacter) / (animation.duration * 0.6));
  }
  strideCache.set(key, speed);
  return speed;
}
