/** Shared, redistributable Quaternius humanoids used by exploration actors. */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_BASE = import.meta.env.BASE_URL;

export type HumanModel = 'male' | 'female';
export interface CadetSharedAssets {
  readonly male: GLTF;
  readonly maleHead: GLTF;
  readonly female: GLTF;
}

let cache: CadetSharedAssets | undefined;
let loading: Promise<void> | undefined;
let liveRigs = 0;

/** Must finish before ChapterApp creates its first ExploreView. */
export function preloadCadetAssets(): Promise<void> {
  if (cache) return Promise.resolve();
  if (!loading) {
    const loader = new GLTFLoader();
    loading = Promise.all([
      loader.loadAsync(`${ASSET_BASE}assets/exploration/cadet-male-uniform.glb`),
      loader.loadAsync(`${ASSET_BASE}assets/exploration/cadet-male.glb`),
      loader.loadAsync(`${ASSET_BASE}assets/exploration/cadet-female.glb`),
    ])
      .then(([male, maleHead, female]) => {
        cache = { male, maleHead, female };
      })
      .finally(() => {
        loading = undefined;
      });
  }
  return loading;
}

export function acquireCadetAssets(model: HumanModel): GLTF {
  if (!cache) throw new Error('Les personnages 3D doivent être chargés avant l’exploration.');
  liveRigs += 1;
  return cache[model];
}

/** The head and body share exact bind matrices and bone order in this pack. */
export function getMaleHeadAsset(): GLTF {
  if (!cache) throw new Error('Les personnages 3D doivent être chargés avant l’exploration.');
  return cache.maleHead;
}

export function releaseCadetAssets(): void {
  liveRigs = Math.max(0, liveRigs - 1);
}

/** Dispose template geometry/materials after every cloned actor has left the scene. */
export function disposeCadetAssetCache(): void {
  if (!cache || liveRigs > 0) return;
  const disposedGeometry = new Set<THREE.BufferGeometry>();
  const disposedMaterial = new Set<THREE.Material>();
  for (const gltf of [cache.male, cache.maleHead, cache.female]) {
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      if (!disposedGeometry.has(node.geometry)) {
        node.geometry.dispose();
        disposedGeometry.add(node.geometry);
      }
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (!disposedMaterial.has(material)) {
          material.dispose();
          disposedMaterial.add(material);
        }
      }
    });
  }
  cache = undefined;
}

export function cadetAssetCacheState(): Readonly<{ loaded: boolean; liveRigs: number }> {
  return { loaded: cache !== undefined, liveRigs };
}
