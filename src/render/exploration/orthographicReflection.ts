import * as THREE from 'three';
import type { Reflector } from 'three/addons/objects/Reflector.js';

/**
 * Reflector's built-in oblique projection assumes a perspective camera. Use the
 * general projection formula for the exploration camera, keeping its owned target
 * and shader. No renderer state or GPU resource belongs to this adapter.
 */
export function supportOrthographicReflection(reflector: Reflector): void {
  const perspectiveRender = reflector.onBeforeRender;
  const camera = new THREE.OrthographicCamera();
  const rotation = new THREE.Matrix4();
  const inverseProjection = new THREE.Matrix4();
  const normal = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const sourcePosition = new THREE.Vector3();
  const position = new THREE.Vector3();
  const look = new THREE.Vector3();
  const target = new THREE.Vector3();
  const plane = new THREE.Plane();
  const clip = new THREE.Vector4();
  const corner = new THREE.Vector4();
  const textureMatrix = (reflector.material as THREE.ShaderMaterial).uniforms.textureMatrix!
    .value as THREE.Matrix4;

  reflector.onBeforeRender = function (renderer, scene, source, geometry, material, group) {
    if (!(source instanceof THREE.OrthographicCamera)) {
      perspectiveRender.call(this, renderer, scene, source, geometry, material, group);
      return;
    }
    origin.setFromMatrixPosition(reflector.matrixWorld);
    sourcePosition.setFromMatrixPosition(source.matrixWorld);
    rotation.extractRotation(reflector.matrixWorld);
    normal.set(0, 0, 1).applyMatrix4(rotation);
    position.subVectors(origin, sourcePosition);
    if (position.dot(normal) > 0) return;
    position.reflect(normal).negate().add(origin);

    rotation.extractRotation(source.matrixWorld);
    look.set(0, 0, -1).applyMatrix4(rotation).add(sourcePosition);
    target.subVectors(origin, look).reflect(normal).negate().add(origin);
    camera.position.copy(position);
    camera.up.set(0, 1, 0).applyMatrix4(rotation).reflect(normal);
    camera.lookAt(target);
    camera.near = source.near;
    camera.far = source.far;
    camera.layers.mask = source.layers.mask;
    camera.updateMatrixWorld();
    camera.projectionMatrix.copy(source.projectionMatrix);

    textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    textureMatrix
      .multiply(camera.projectionMatrix)
      .multiply(camera.matrixWorldInverse)
      .multiply(reflector.matrixWorld);

    plane.setFromNormalAndCoplanarPoint(normal, origin).applyMatrix4(camera.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    inverseProjection.copy(camera.projectionMatrix).invert();
    corner.set(Math.sign(clip.x), Math.sign(clip.y), 1, 1).applyMatrix4(inverseProjection);
    clip.multiplyScalar(2 / clip.dot(corner));
    const projection = camera.projectionMatrix.elements;
    projection[2] = clip.x - projection[3]!;
    projection[6] = clip.y - projection[7]!;
    projection[10] = clip.z - projection[11]!;
    projection[14] = clip.w - projection[15]!;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    const renderTarget = renderer.getRenderTarget();
    const xrEnabled = renderer.xr.enabled;
    const shadowAutoUpdate = renderer.shadowMap.autoUpdate;
    reflector.visible = false;
    try {
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(reflector.getRenderTarget());
      renderer.state.buffers.depth.setMask(true);
      if (!renderer.autoClear) renderer.clear();
      renderer.render(scene, camera);
    } finally {
      renderer.xr.enabled = xrEnabled;
      renderer.shadowMap.autoUpdate = shadowAutoUpdate;
      renderer.setRenderTarget(renderTarget);
      reflector.visible = true;
    }
  };
}
