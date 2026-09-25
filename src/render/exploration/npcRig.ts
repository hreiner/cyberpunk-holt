/**
 * Silhouettes locales des PNJ d'exploration.
 *
 * Elles ne portent ni état narratif ni picking : `ExploreView` conserve ces
 * responsabilités. Le chien de salle 1 est explicitement quadrupède afin de
 * ne jamais être confondu avec un cadet humain.
 */

import * as THREE from 'three';
import { CADET_VISUAL_PROFILES, type CadetVisualProfile } from '@/data/exploreVisuals/characterProfiles';
import { createHumanExplorationRig, type CadetRig } from './cadetRig';

export interface ExploreNpcRig {
  readonly object: THREE.Object3D;
  update(dt: number): void;
  setReducedMotion?(reduced: boolean): void;
  dispose(): void;
}

const DOG_FUR_COLOR = 0x725c48;

export function createExploreNpcRig(entityId: string): ExploreNpcRig {
  return entityId === 'salle1.chien' ? new DogNpcRig(entityId) : new HumanNpcRig(entityId);
}

class HumanNpcRig implements ExploreNpcRig {
  readonly object: THREE.Object3D;
  private readonly rig: CadetRig;

  constructor(entityId: string) {
    const adult = entityId.includes('directeur') || entityId.includes('instructeur');
    const female = /betty|nancy|otage/.test(entityId);
    const sample = female ? CADET_VISUAL_PROFILES.abigail : CADET_VISUAL_PROFILES.grover;
    const profile: CadetVisualProfile = {
      ...sample,
      skin: female ? 0xbb876e : adult ? 0xb18a6d : 0x9e765e,
      hair: adult ? 0x48454a : female ? 0x241c1c : 0x2b2323,
      uniform: adult ? 0x3b444d : 0x253543,
      trim: adult ? 0xc4a468 : 0x879ca3,
      hairStyle: adult ? 'buzz' : female ? 'curly-bun' : 'messy-short',
      hasNeuroport: !adult,
    };
    this.rig = createHumanExplorationRig(
      { id: entityId, name: entityId },
      {
        profile,
        model: female ? 'female' : 'male',
        adult,
        showLabel: false,
        showRing: false,
      },
    );
    this.object = this.rig.object;
    this.object.name = `npc:${entityId}`;
  }

  update(dt: number): void {
    this.rig.update(dt);
  }

  setReducedMotion(reduced: boolean): void {
    this.rig.setReducedMotion(reduced);
  }

  dispose(): void {
    this.rig.dispose();
  }
}

class DogNpcRig implements ExploreNpcRig {
  readonly object = new THREE.Group();
  private readonly visual = new THREE.Group();
  private readonly material = new THREE.MeshStandardMaterial({
    color: DOG_FUR_COLOR,
    roughness: 0.9,
    flatShading: true,
  });
  private readonly geometries: THREE.BufferGeometry[] = [];
  private time = 0;
  private reducedMotion = false;

  constructor(entityId: string) {
    this.object.name = `chien:${entityId}`;
    this.object.add(this.visual);
    this.add(new THREE.BoxGeometry(0.72, 0.34, 0.36), 0, 0.48, 0);
    this.add(new THREE.IcosahedronGeometry(0.23, 1), 0, 0.57, 0.36);
    this.add(new THREE.ConeGeometry(0.1, 0.28, 4), -0.13, 0.84, 0.36, Math.PI);
    this.add(new THREE.ConeGeometry(0.1, 0.28, 4), 0.13, 0.84, 0.36, Math.PI);
    for (const [x, z] of [
      [-0.24, -0.1],
      [0.24, -0.1],
      [-0.24, 0.16],
      [0.24, 0.16],
    ] as const) {
      this.add(new THREE.BoxGeometry(0.12, 0.42, 0.12), x, 0.21, z);
    }
  }

  update(dt: number): void {
    if (this.reducedMotion) return;
    this.time += Math.min(dt, 0.1);
    this.visual.rotation.z = Math.sin(this.time * 1.3) * 0.025;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) this.visual.rotation.z = 0;
  }

  dispose(): void {
    for (const geometry of this.geometries) geometry.dispose();
    this.material.dispose();
  }

  private add(geometry: THREE.BufferGeometry, x: number, y: number, z: number, rotationY = 0): void {
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = true;
    this.visual.add(mesh);
    this.geometries.push(geometry);
  }
}
