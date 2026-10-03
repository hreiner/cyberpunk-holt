import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createStableSceneLights,
  EXPLORATION_POINT_LIGHT_BUDGET,
} from '@/render/exploration/stableSceneLights';

function gpuPointLights(scene: THREE.Scene): THREE.PointLight[] {
  const group = scene.getObjectByName('exploration-stable-lights');
  return (
    group?.children.filter((child): child is THREE.PointLight => child instanceof THREE.PointLight) ?? []
  );
}

describe('lumières de scène stables', () => {
  it('garde un nombre fixe de lumières GPU et suit visibilité et position monde', () => {
    const scene = new THREE.Scene();
    const room = new THREE.Group();
    room.position.set(10, 2, -4);
    scene.add(room);
    const fixture = new THREE.Group();
    fixture.position.set(1, 3, 2);
    room.add(fixture);
    const source = new THREE.PointLight(0xffaa66, 4, 12);
    source.position.set(2, 1, -1);
    fixture.add(source);

    const stable = createStableSceneLights(scene);
    try {
      const [gpu] = gpuPointLights(scene);
      expect(gpuPointLights(scene)).toHaveLength(1);
      stable.update({ x: 0, z: 0 });
      expect(gpu?.position.toArray()).toEqual([13, 6, -3]);
      expect(gpu?.intensity).toBe(4);

      room.visible = false;
      stable.update({ x: 0, z: 0 });
      expect(gpuPointLights(scene)).toHaveLength(1);
      expect(gpu?.intensity).toBe(0);
      room.visible = true;
      source.visible = false;
      stable.update({ x: 0, z: 0 });
      expect(gpuPointLights(scene)).toHaveLength(1);
      expect(gpu?.intensity).toBe(0);
      source.visible = true;
      stable.update({ x: 0, z: 0 });
      expect(gpu?.intensity).toBe(4);
    } finally {
      stable.dispose();
    }
  });

  it('limite le pool de points à huit sources actives les plus proches', () => {
    const scene = new THREE.Scene();
    const parents: THREE.Group[] = [];
    for (let index = 0; index < 10; index++) {
      const parent = new THREE.Group();
      parent.position.set(index + 1, 0, 0);
      scene.add(parent);
      const source = new THREE.PointLight(0xffffff, 2);
      parent.add(source);
      parents.push(parent);
    }
    const stable = createStableSceneLights(scene);
    try {
      stable.update({ x: 0, z: 0 });
      expect(gpuPointLights(scene)).toHaveLength(EXPLORATION_POINT_LIGHT_BUDGET);
      expect(
        gpuPointLights(scene)
          .map((light) => light.position.x)
          .sort((a, b) => a - b),
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

      parents[0]!.visible = false;
      stable.update({ x: 0, z: 0 });
      expect(gpuPointLights(scene)).toHaveLength(EXPLORATION_POINT_LIGHT_BUDGET);
      expect(
        gpuPointLights(scene)
          .map((light) => light.position.x)
          .sort((a, b) => a - b),
      ).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
      expect(gpuPointLights(scene).every((light) => light.intensity === 2)).toBe(true);
    } finally {
      stable.dispose();
    }
  });

  it('conserve le slot d’ombre du spot stable quand sa source est masquée', () => {
    const scene = new THREE.Scene();
    const room = new THREE.Group();
    scene.add(room);
    const source = new THREE.SpotLight(0xffffff, 3);
    source.castShadow = false;
    source.userData.stableShadow = true;
    source.shadow.intensity = 0.7;
    room.add(source);

    const stable = createStableSceneLights(scene);
    try {
      const group = scene.getObjectByName('exploration-stable-lights');
      const gpu = group?.children.find((child): child is THREE.SpotLight => child instanceof THREE.SpotLight);
      expect(gpu).toBeDefined();
      stable.update({ x: 0, z: 0 });
      expect(gpu?.castShadow).toBe(true);
      expect(gpu?.shadow.intensity).toBe(0);
      source.castShadow = true;
      stable.update({ x: 0, z: 0 });
      expect(gpu?.shadow.intensity).toBe(0.7);

      source.visible = false;
      stable.update({ x: 0, z: 0 });
      expect(gpu?.castShadow).toBe(true);
      expect(gpu?.intensity).toBe(0);
      expect(gpu?.shadow.intensity).toBe(0);

      source.visible = true;
      stable.update({ x: 0, z: 0 });
      expect(gpu?.castShadow).toBe(true);
      expect(gpu?.shadow.intensity).toBe(0.7);
    } finally {
      stable.dispose();
    }
  });

  it('réattache les lumières sources à leur parent au dispose', () => {
    const scene = new THREE.Scene();
    const parent = new THREE.Group();
    scene.add(parent);
    const point = new THREE.PointLight();
    const spot = new THREE.SpotLight();
    parent.add(point, spot);

    const stable = createStableSceneLights(scene);
    expect(point.parent).not.toBe(parent);
    expect(spot.parent).not.toBe(parent);
    stable.dispose();
    expect(point.parent).toBe(parent);
    expect(spot.parent).toBe(parent);
    expect(parent.children).toContain(point);
    expect(parent.children).toContain(spot);
  });
});
