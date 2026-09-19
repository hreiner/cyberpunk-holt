/**
 * Effets visuels ponctuels : trait de tir du taser, gerbes d'impact.
 *
 * Tout est fabrique a partir de formes simples, additives et lumineuses (esprit neon de la
 * direction artistique). Aucun aleatoire : le scintillement est une sinusoide.
 */

import * as THREE from 'three';

interface TimedEffect {
  object: THREE.Object3D;
  material: THREE.MeshBasicMaterial;
  age: number;
  life: number;
  tick(progress: number): void;
}

const TRACER_COLOR = 0xffe14a;
const TRACER_CORE = 0xffffff;
const TRACER_SECONDS = 0.28;
const BURST_SECONDS = 0.4;
/** Decalage lateral d'un tir manque, en metres. */
const MISS_OFFSET = 1.1;

export class EffectsLayer {
  readonly group = new THREE.Group();
  private readonly effects: TimedEffect[] = [];
  private readonly cylinder = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  private readonly sphere = new THREE.SphereGeometry(1, 14, 10);
  private readonly ring = new THREE.RingGeometry(0.7, 1, 24);

  /** Trait de tir de `from` vers `to`. Un tir manque devie et finit au sol. */
  tracer(from: THREE.Vector3, to: THREE.Vector3, hit: boolean): void {
    const end = to.clone();
    if (!hit) {
      const side = new THREE.Vector3(-(to.z - from.z), 0, to.x - from.x).normalize();
      end.addScaledVector(side, MISS_OFFSET);
      end.y = 0.05;
    }
    this.beam(from, end, 0.13, TRACER_COLOR, 0.45);
    this.beam(from, end, 0.045, TRACER_CORE, 0.95);
    // Petite etincelle a la bouche du canon.
    this.burst(from, TRACER_COLOR, 0.35, false);
    this.burst(end, hit ? TRACER_COLOR : 0x9aa0b0, hit ? 0.9 : 0.4, hit);
  }

  /** Gerbe lumineuse : impact, explosion de mine, coup au corps a corps. */
  burst(position: THREE.Vector3, color: number, size: number, withRing = true): void {
    const material = additive(color, 0.85);
    const flash = new THREE.Mesh(this.sphere, material);
    flash.position.copy(position);
    flash.renderOrder = 16;
    this.add({
      object: flash,
      material,
      age: 0,
      life: BURST_SECONDS,
      tick: (p) => {
        flash.scale.setScalar(size * (0.2 + 0.8 * easeOut(p)));
        material.opacity = 0.85 * (1 - p);
      },
    });

    if (!withRing) return;
    const ringMaterial = additive(color, 0.7);
    const ring = new THREE.Mesh(this.ring, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, 0.06, position.z);
    ring.renderOrder = 16;
    this.add({
      object: ring,
      material: ringMaterial,
      age: 0,
      life: BURST_SECONDS * 1.3,
      tick: (p) => {
        ring.scale.setScalar(size * (0.4 + 1.6 * easeOut(p)));
        ringMaterial.opacity = 0.7 * (1 - p);
      },
    });
  }

  update(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i] as TimedEffect;
      effect.age += dt;
      const progress = Math.min(1, effect.age / effect.life);
      effect.tick(progress);
      if (progress >= 1) {
        this.group.remove(effect.object);
        effect.material.dispose();
        this.effects.splice(i, 1);
      }
    }
  }

  dispose(): void {
    for (const effect of this.effects) effect.material.dispose();
    this.effects.length = 0;
    this.group.clear();
    this.cylinder.dispose();
    this.sphere.dispose();
    this.ring.dispose();
  }

  /** Cylindre etire entre deux points, qui scintille puis s'eteint. */
  private beam(from: THREE.Vector3, to: THREE.Vector3, radius: number, color: number, opacity: number): void {
    const direction = to.clone().sub(from);
    const length = direction.length();
    if (length === 0) return;

    const material = additive(color, opacity);
    const mesh = new THREE.Mesh(this.cylinder, material);
    mesh.position.copy(from).addScaledVector(direction, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.scale.set(radius, length, radius);
    mesh.renderOrder = 15;
    this.add({
      object: mesh,
      material,
      age: 0,
      life: TRACER_SECONDS,
      tick: (p) => {
        const flicker = 0.75 + 0.25 * Math.sin(p * 90);
        material.opacity = opacity * flicker * (1 - p * p);
        mesh.scale.x = mesh.scale.z = radius * (1 - 0.6 * p);
      },
    });
  }

  private add(effect: TimedEffect): void {
    this.group.add(effect.object);
    this.effects.push(effect);
  }
}

function additive(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function easeOut(p: number): number {
  return 1 - (1 - p) * (1 - p);
}
