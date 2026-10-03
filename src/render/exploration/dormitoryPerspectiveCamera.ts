import * as THREE from 'three';
import type { IsoCamera } from '../isoCamera';

/** Pilote autonome : PerspectiveCamera(39, aspect, 0.1, 90). */
export const DORMITORY_PILOT_FOV_DEG = 39;
export const DORMITORY_PILOT_NEAR = 0.1;
export const DORMITORY_PILOT_FAR = 500;

/** Higher framing keeps the rooms readable with permanent facade and partition heights. */
const PILOT_TARGET_HEIGHT = 1.15;
const PILOT_OFFSET_X = 8.7;
const PILOT_OFFSET_Y = 22;
const PILOT_OFFSET_Z = 12.6;
const PILOT_HORIZONTAL_DISTANCE = Math.hypot(PILOT_OFFSET_X, PILOT_OFFSET_Z);
const PILOT_YAW = Math.atan2(PILOT_OFFSET_X, PILOT_OFFSET_Z);
const PILOT_ELEVATION = Math.atan2(PILOT_OFFSET_Y, PILOT_HORIZONTAL_DISTANCE);

const FOV_TANGENT = Math.tan(THREE.MathUtils.degToRad(DORMITORY_PILOT_FOV_DEG / 2));

/**
 * Perspective rendering adapter shared by the converted HOLT/HOLT-nuit zones.
 *
 * IsoCamera remains the source of gameplay camera state (target, zoom and animated quarter-turns).
 * This object owns no GPU resources and keeps one stable camera instance for rendering, projection
 * and raycasting. Call `sync()` after IsoCamera.tick() and before any camera-dependent work.
 */
export class DormitoryPerspectiveCamera {
  readonly camera: THREE.PerspectiveCamera;
  private readonly iso: IsoCamera;
  private yaw = PILOT_YAW;
  private readonly elevation: number;

  constructor(iso: IsoCamera, aspect: number, elevationDeg?: number) {
    this.iso = iso;
    this.elevation = elevationDeg === undefined ? PILOT_ELEVATION : THREE.MathUtils.degToRad(elevationDeg);
    this.camera = new THREE.PerspectiveCamera(
      DORMITORY_PILOT_FOV_DEG,
      validAspect(aspect),
      DORMITORY_PILOT_NEAR,
      DORMITORY_PILOT_FAR,
    );
    this.sync();
  }

  /** Synchronize the stable render camera from the current (possibly interpolated) IsoCamera pose. */
  sync(aspect?: number): void {
    if (aspect !== undefined) this.resize(aspect);

    const target = this.iso.getTarget();
    const isoTarget = new THREE.Vector3(target.x, 0, target.z);
    const isoPosition = this.iso.camera.position;
    const isoYaw = Math.atan2(isoPosition.x - isoTarget.x, isoPosition.z - isoTarget.z);

    // Preserve the pilot's slightly off-isometric framing while following all four animated turns.
    const yaw = isoYaw + (PILOT_YAW - Math.PI / 4);
    this.yaw = yaw;
    // Match IsoCamera's visible short-axis span instead of mapping zoom linearly to pilot
    // distance. At entry zoom 16 the 25 x 15 m room must remain in frame; in landscape the
    // short axis is vertical, while portrait uses the narrower horizontal frustum.
    const projectionAspect = this.camera.aspect;
    const shortAxisSpan = this.iso.getZoom() / Math.min(1, projectionAspect);
    const viewDistance = shortAxisSpan / (2 * FOV_TANGENT);
    const horizontalDistance = Math.cos(this.elevation) * viewDistance;
    const focus = new THREE.Vector3(target.x, PILOT_TARGET_HEIGHT, target.z);

    this.camera.position.set(
      focus.x + Math.sin(yaw) * horizontalDistance,
      focus.y + Math.tan(this.elevation) * horizontalDistance,
      focus.z + Math.cos(yaw) * horizontalDistance,
    );
    this.camera.lookAt(focus);
    this.camera.updateMatrixWorld(true);
  }

  /** Ground-plane direction toward the right side of the rendered image. */
  screenRightXZ(): { x: number; z: number } {
    return { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) };
  }

  /** Ground-plane direction toward the top of the rendered image. */
  screenUpXZ(): { x: number; z: number } {
    return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
  }

  /** Keep the perspective frustum aligned with the exploration canvas. */
  resize(aspect: number): void {
    const nextAspect = validAspect(aspect);
    if (this.camera.aspect === nextAspect) return;
    this.camera.aspect = nextAspect;
    this.camera.updateProjectionMatrix();
  }
}

function validAspect(aspect: number): number {
  return Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
}
