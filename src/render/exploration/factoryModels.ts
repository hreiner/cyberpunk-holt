/** Petits modèles Kenney du centre, chargés une fois par carte et instanciés par clone. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const FACTORY_MODELS = [
  'box-large',
  'hopper-high-square',
  'machine-fortified',
  'robot-arm-a',
  'scanner-high',
  'screen-wide',
  'warning-traffic',
] as const;
export type FactoryModelId = (typeof FACTORY_MODELS)[number];

function release(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      if (material instanceof THREE.MeshStandardMaterial && material.map) textures.add(material.map);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

export class FactoryModels {
  private readonly loader = new GLTFLoader();
  private readonly models = new Map<FactoryModelId, Promise<THREE.Group | null>>();
  private readonly loaded = new Set<THREE.Group>();
  private disposed = false;

  create(id: string): THREE.Group {
    const name = id.slice('factory:'.length);
    if (!FACTORY_MODELS.some((candidate) => candidate === name)) {
      throw new Error(`Modèle Kenney inconnu : ${name}`);
    }
    const modelId = name as FactoryModelId;
    const anchor = new THREE.Group();
    let pending = this.models.get(modelId);
    if (!pending) {
      pending = this.loader
        .loadAsync(`/assets/exploration/factory/${modelId}.glb`)
        .then(({ scene }) => {
          if (this.disposed) {
            release(scene);
            return null;
          }
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true;
              object.receiveShadow = true;
              // Le colormap du kit est pastel ; une patine pétrole le raccorde au centre.
              for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                if (material instanceof THREE.MeshStandardMaterial) {
                  material.color.setHex(0x849392);
                  material.metalness = 0.38;
                  material.roughness = 0.78;
                }
              }
            }
          });
          this.loaded.add(scene);
          return scene;
        })
        .catch((error: unknown) => {
          console.error(`Chargement du décor Kenney impossible : ${modelId}`, error);
          return null;
        });
      this.models.set(modelId, pending);
    }
    void pending.then((scene) => {
      if (scene && !this.disposed) anchor.add(scene.clone(true));
    });
    return anchor;
  }

  dispose(): void {
    this.disposed = true;
    for (const scene of this.loaded) release(scene);
    this.loaded.clear();
    this.models.clear();
  }
}
