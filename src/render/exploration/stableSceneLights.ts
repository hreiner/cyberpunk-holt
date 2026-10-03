import * as THREE from 'three';

/** Fixed shader light count; the closest useful fixtures share these slots. */
export const EXPLORATION_POINT_LIGHT_BUDGET = 8;

type LocalLight = THREE.PointLight | THREE.SpotLight;
interface LightSource {
  light: LocalLight;
  parent: THREE.Object3D;
  position: THREE.Vector3;
  score: number;
}

export interface StableSceneLights {
  update(focus: { x: number; z: number }): void;
  dispose(): void;
}

function visibleInHierarchy(source: LightSource): boolean {
  if (!source.light.visible) return false;
  for (let parent: THREE.Object3D | null = source.parent; parent; parent = parent.parent) {
    if (!parent.visible) return false;
  }
  return true;
}

/**
 * Hidden room fixtures otherwise change NUM_POINT_LIGHTS / NUM_SPOT_LIGHTS at every
 * discovery, recompiling every lit material. Keep GPU lights in one visible group and
 * let the existing fixture hierarchy control their intensity, including fire animation.
 * The original lights stay owned by their fixtures; this adapter owns the GPU copies.
 */
export function createStableSceneLights(scene: THREE.Scene): StableSceneLights {
  const sources: LightSource[] = [];
  scene.traverse((object) => {
    if ((object instanceof THREE.PointLight || object instanceof THREE.SpotLight) && object.parent) {
      sources.push({ light: object, parent: object.parent, position: new THREE.Vector3(), score: 0 });
    }
  });
  const group = new THREE.Group();
  group.name = 'exploration-stable-lights';
  scene.add(group);
  for (const source of sources) source.light.removeFromParent();

  const points = sources.filter((source) => source.light instanceof THREE.PointLight);
  const pointSlots = Array.from({ length: Math.min(points.length, EXPLORATION_POINT_LIGHT_BUDGET) }, () => {
    const light = new THREE.PointLight(0xffffff, 0);
    group.add(light);
    return light;
  });
  const spots = sources
    .filter((source) => source.light instanceof THREE.SpotLight)
    .map((source) => {
      const original = source.light as THREE.SpotLight;
      const light = original.clone();
      light.intensity = 0;
      light.visible = true;
      // The shadow count is also a shader define. Disable its strength/update, not its slot.
      light.castShadow = original.castShadow || original.userData.stableShadow === true;
      light.shadow.autoUpdate = false;
      light.shadow.needsUpdate = false;
      group.add(light, light.target);
      return { source, light };
    });
  const sourceWorld = new THREE.Matrix4();
  const targetWorld = new THREE.Vector3();
  let disposed = false;

  function update(focus: { x: number; z: number }): void {
    if (disposed) return;
    scene.updateMatrixWorld(true);
    for (const source of sources) {
      source.light.updateMatrix();
      source.position.setFromMatrixPosition(
        sourceWorld.multiplyMatrices(source.parent.matrixWorld, source.light.matrix),
      );
      const distanceSquared = (source.position.x - focus.x) ** 2 + (source.position.z - focus.z) ** 2;
      source.score = visibleInHierarchy(source) ? source.light.intensity / (1 + distanceSquared) : 0;
    }
    points.sort((a, b) => b.score - a.score);
    for (const [index, light] of pointSlots.entries()) {
      const source = points[index]!;
      const original = source.light as THREE.PointLight;
      light.position.copy(source.position);
      light.color.copy(original.color);
      light.intensity = source.score > 0 ? original.intensity : 0;
      light.distance = original.distance;
      light.decay = original.decay;
    }
    for (const { source, light } of spots) {
      const original = source.light as THREE.SpotLight;
      const active = visibleInHierarchy(source) && original.intensity > 0;
      light.position.copy(source.position);
      original.target.getWorldPosition(targetWorld);
      light.target.position.copy(targetWorld);
      light.color.copy(original.color);
      light.intensity = active ? original.intensity : 0;
      light.distance = original.distance;
      light.decay = original.decay;
      light.angle = original.angle;
      light.penumbra = original.penumbra;
      light.shadow.intensity = active && original.castShadow ? original.shadow.intensity : 0;
      light.shadow.autoUpdate = active && original.castShadow && original.shadow.autoUpdate;
      light.shadow.needsUpdate = active && original.castShadow && original.shadow.needsUpdate;
    }
  }

  return {
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const { light } of spots) light.shadow.dispose();
      group.clear();
      for (const source of sources) source.parent.add(source.light);
    },
  };
}
