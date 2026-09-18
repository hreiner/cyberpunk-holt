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

export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  /** Rotation en pas de 90 degres : 0, 1, 2, 3. */
  private quarter = 0;
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

  rotate(step: number): void {
    this.quarter = (this.quarter + step + 4) % 4;
    this.update();
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
    const azimuth = THREE.MathUtils.degToRad(45 + this.quarter * 90);
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
