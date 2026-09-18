/**
 * Abstraction de "rig" de personnage.
 *
 * Le reste du jeu ne connait QUE cette interface. Aujourd'hui elle est
 * implementee par des capsules colorees (`PlaceholderRig`) ; demain par des
 * GLB riggees et animees sous Mixamo (`GltfRig`, a ecrire dans l'epic 2 art)
 * sans qu'une seule ligne de gameplay ne change.
 *
 * C'est la condition posee au depart : pouvoir remplacer le pipeline art
 * sans refondre le jeu. Voir docs/art/ART-PIPELINE.md et ADR 0004.
 */

import * as THREE from 'three';
import type { CharacterSheet } from '@/rules/character';

/** Etats d'animation demandes par le gameplay, volontairement peu nombreux. */
export type RigAnimation = 'idle' | 'walk' | 'run' | 'shoot' | 'down' | 'revive';

export interface CharacterRig {
  readonly id: string;
  readonly object: THREE.Object3D;
  /** Position monde (le rig gere lui-meme son offset au sol). */
  setWorldPosition(x: number, z: number): void;
  /** Oriente le personnage vers un point. */
  faceTowards(x: number, z: number): void;
  play(animation: RigAnimation): void;
  setHighlighted(on: boolean): void;
  dispose(): void;
}

const BODY_HEIGHT = 1.1;
const BODY_RADIUS = 0.34;

/**
 * Rig de remplacement : une capsule a la couleur du cadet, un anneau de couleur d'equipe
 * au sol, et une inclinaison quand le cadet est neutralise.
 */
export class PlaceholderRig implements CharacterRig {
  readonly id: string;
  readonly object: THREE.Group;
  private readonly body: THREE.Mesh;
  private readonly ring: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly ringMaterial: THREE.MeshBasicMaterial;
  private current: RigAnimation = 'idle';

  constructor(sheet: CharacterSheet, teamColor: number) {
    this.id = sheet.id;
    this.object = new THREE.Group();

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sheet.placeholderColor),
      roughness: 0.65,
      metalness: 0.1,
    });
    const geometry = new THREE.CapsuleGeometry(BODY_RADIUS, BODY_HEIGHT - 2 * BODY_RADIUS, 4, 10);
    this.body = new THREE.Mesh(geometry, this.material);
    this.body.position.y = BODY_HEIGHT / 2;
    this.body.castShadow = true;
    this.object.add(this.body);

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: teamColor,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 24), this.ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.object.add(this.ring);

    // Petit repere d'orientation : le "nez" du cadet.
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1f }),
    );
    nose.position.set(0, BODY_HEIGHT * 0.78, 0.3);
    this.object.add(nose);
  }

  setWorldPosition(x: number, z: number): void {
    this.object.position.set(x, 0, z);
  }

  faceTowards(x: number, z: number): void {
    const dx = x - this.object.position.x;
    const dz = z - this.object.position.z;
    if (dx === 0 && dz === 0) return;
    this.object.rotation.y = Math.atan2(dx, dz);
  }

  play(animation: RigAnimation): void {
    if (animation === this.current) return;
    this.current = animation;
    // Les capsules n'ont pas de squelette : on se contente d'une pose lisible.
    if (animation === 'down') {
      this.body.rotation.z = Math.PI / 2;
      this.body.position.y = BODY_RADIUS;
      this.material.opacity = 0.7;
      this.material.transparent = true;
    } else {
      this.body.rotation.z = 0;
      this.body.position.y = BODY_HEIGHT / 2;
      this.material.transparent = false;
      this.material.opacity = 1;
    }
  }

  setHighlighted(on: boolean): void {
    this.material.emissive = new THREE.Color(on ? 0x3a3a00 : 0x000000);
    this.ringMaterial.opacity = on ? 1 : 0.85;
  }

  dispose(): void {
    this.body.geometry.dispose();
    this.material.dispose();
    this.ring.geometry.dispose();
    this.ringMaterial.dispose();
  }
}
