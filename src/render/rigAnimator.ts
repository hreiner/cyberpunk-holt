/**
 * Anime le deplacement d'un personnage le long d'un chemin, case par case.
 *
 * Le moteur tactique deplace les unites instantanement (il n'a pas de notion de
 * temps). Ce fichier fait la traduction : on lui donne le chemin parcouru, il fait
 * avancer le rig a vitesse constante, l'oriente dans le sens de la marche et
 * demande l'animation `walk` ou `run`. Voir ADR 0009.
 *
 * Volontairement sans dependance a `three` : il ne manipule que l'interface
 * `WalkableRig`, ce qui le rend testable sous Node.
 */

import type { RigAnimation } from './characterRig';

/** Vitesse de marche, en metres par seconde (une case = 1,5 m). */
export const WALK_SPEED = 6;
/** Vitesse de course, en metres par seconde. */
export const RUN_SPEED = 11;
/** Duree maximale d'un deplacement, en secondes : on accelere plutot que de faire attendre. */
export const MAX_MOVE_SECONDS = 1.8;

export interface WalkableRig {
  setWorldPosition(x: number, z: number): void;
  faceTowards(x: number, z: number): void;
  play(animation: RigAnimation): void;
}

export interface WorldPoint {
  x: number;
  z: number;
}

export type MoveGait = 'walk' | 'run';

export class RigAnimator {
  private position: WorldPoint = { x: 0, z: 0 };
  private queue: WorldPoint[] = [];
  private speed = WALK_SPEED;
  private gait: MoveGait = 'walk';
  private resting: RigAnimation = 'idle';

  constructor(private readonly rig: WalkableRig) {}

  get isMoving(): boolean {
    return this.queue.length > 0;
  }

  /** Position monde actuelle du rig (en cours de deplacement ou au repos). */
  get current(): WorldPoint {
    return { ...this.position };
  }

  /** Place le rig sans animation : debut de partie, rejeu, mode test. */
  snapTo(x: number, z: number): void {
    this.queue = [];
    this.position = { x, z };
    this.rig.setWorldPosition(x, z);
    this.rig.play(this.resting);
  }

  /** Pose a adopter quand le rig ne marche pas (`idle`, `down`, ...). */
  setResting(animation: RigAnimation): void {
    this.resting = animation;
    if (!this.isMoving) this.rig.play(animation);
  }

  /**
   * Fait marcher le rig a travers `path`. Si un deplacement est deja en cours, le nouveau
   * chemin s'y ajoute : le personnage finit son trajet avant d'enchainer.
   * Un chemin vide ne fait rien.
   */
  walkAlong(path: readonly WorldPoint[], gait: MoveGait): void {
    if (path.length === 0) return;
    this.gait = gait;
    this.queue.push(...path.map((p) => ({ ...p })));

    const base = gait === 'run' ? RUN_SPEED : WALK_SPEED;
    const length = pathLength(this.position, this.queue);
    // Un long trajet ne doit pas faire attendre : on accelere pour tenir dans la duree max.
    this.speed = Math.max(base, length / MAX_MOVE_SECONDS);
    this.rig.play(gait);
  }

  /** Avance l'animation de `dt` secondes. */
  update(dt: number): void {
    if (this.queue.length === 0) return;
    let budget = this.speed * dt;

    while (budget > 0 && this.queue.length > 0) {
      const next = this.queue[0] as WorldPoint;
      const dx = next.x - this.position.x;
      const dz = next.z - this.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= budget) {
        this.position = { ...next };
        this.queue.shift();
        budget -= dist;
      } else {
        this.position = {
          x: this.position.x + (dx / dist) * budget,
          z: this.position.z + (dz / dist) * budget,
        };
        budget = 0;
      }
      if (dist > 0) this.rig.faceTowards(next.x, next.z);
      this.rig.setWorldPosition(this.position.x, this.position.z);
    }

    if (this.queue.length === 0) this.rig.play(this.resting);
    else this.rig.play(this.gait);
  }
}

export function pathLength(from: WorldPoint, path: readonly WorldPoint[]): number {
  let total = 0;
  let prev = from;
  for (const p of path) {
    total += Math.hypot(p.x - prev.x, p.z - prev.z);
    prev = p;
  }
  return total;
}
