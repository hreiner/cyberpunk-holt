/**
 * Camera isometrique 3/4.
 *
 * Choix de design (ADR 0001) : camera orthographique fixe, orientable par pas
 * de 90 degres, zoom limite. Pas de camera libre : la lisibilite du combat au
 * tour par tour prime, et cela evite d'avoir a soigner les personnages vus de
 * pres (donc pas d'animation faciale).
 */

import * as THREE from 'three';

export const ISO_ELEVATION_DEG = 35.264; // arctan(1/sqrt(2)) : vraie isometrie
export const MIN_ZOOM = 18;
export const MAX_ZOOM = 70;
/** Vivacite de la rotation animee (plus grand = plus rapide). */
const ROTATE_SHARPNESS = 12;

export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  /** Cible de la rotation, en quarts de tour (continu : peut depasser 0..3). */
  private quarter = 0;
  /** Angle affiche, en quarts de tour : rattrape `quarter` en douceur. */
  private shownQuarter = 0;
  private zoom = 34;
  private target = new THREE.Vector3(0, 0, 0);

  constructor(aspect: number) {
    this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -500, 1000);
    this.applyZoom(aspect);
    this.update();
  }

  setTarget(x: number, z: number): void {
    this.target.set(x, 0, z);
    this.update();
  }

  lookAtCell(x: number, z: number): void {
    this.setTarget(x, z);
  }

  /** Tourne la camera de `step` quarts de tour ; la rotation est animee par `tick()`. */
  rotate(step: number): void {
    this.quarter += step;
  }

  /** Fait avancer la rotation animee. Renvoie true tant que la camera bouge. */
  tick(dt: number): boolean {
    const gap = this.quarter - this.shownQuarter;
    if (Math.abs(gap) < 0.001) {
      if (gap !== 0) {
        this.shownQuarter = this.quarter;
        this.update();
      }
      return false;
    }
    // Lissage exponentiel : rapide au debut, doux a l'arrivee.
    this.shownQuarter += gap * (1 - Math.exp(-ROTATE_SHARPNESS * dt));
    this.update();
    return true;
  }

  zoomBy(delta: number, aspect: number): void {
    this.zoom = THREE.MathUtils.clamp(this.zoom + delta, MIN_ZOOM, MAX_ZOOM);
    this.applyZoom(aspect);
  }

  resize(aspect: number): void {
    this.applyZoom(aspect);
  }

  private applyZoom(aspect: number): void {
    const half = this.zoom / 2;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
  }

  private update(): void {
    const azimuth = THREE.MathUtils.degToRad(45 + this.shownQuarter * 90);
    const elevation = THREE.MathUtils.degToRad(ISO_ELEVATION_DEG);
    const distance = 120;
    const horizontal = Math.cos(elevation) * distance;
    this.camera.position.set(
      this.target.x + Math.cos(azimuth) * horizontal,
      Math.sin(elevation) * distance,
      this.target.z + Math.sin(azimuth) * horizontal,
    );
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }
}
