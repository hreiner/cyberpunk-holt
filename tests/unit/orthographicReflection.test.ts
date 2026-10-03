import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { describe, expect, it } from 'vitest';
import { supportOrthographicReflection } from '@/render/exploration/orthographicReflection';

describe('reflet du sol avec la caméra isométrique', () => {
  it('garde la pièce au-dessus du sol dans les quatre orientations et exclut le dessous', () => {
    const reflector = new Reflector(new THREE.PlaneGeometry(25, 15), { multisample: 0 });
    reflector.rotation.x = -Math.PI / 2;
    reflector.updateMatrixWorld();
    supportOrthographicReflection(reflector);
    const scene = new THREE.Scene();
    const previousTarget = new THREE.WebGLRenderTarget(8, 8);
    let activeTarget: THREE.WebGLRenderTarget | null = previousTarget;
    let reflectedFrustum = new THREE.Frustum();
    let simulateFailure = false;
    const renderer = {
      xr: { enabled: true },
      shadowMap: { autoUpdate: true },
      autoClear: true,
      state: { buffers: { depth: { setMask: () => {} } } },
      getRenderTarget: () => activeTarget,
      setRenderTarget: (target: THREE.WebGLRenderTarget | null) => {
        activeTarget = target;
      },
      render: (_scene: THREE.Scene, camera: THREE.Camera) => {
        expect(camera).toBeInstanceOf(THREE.OrthographicCamera);
        expect(reflector.visible).toBe(false);
        reflectedFrustum = new THREE.Frustum().setFromProjectionMatrix(
          new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
        );
        if (simulateFailure) throw new Error('échec simulé du rendu');
      },
    } as unknown as THREE.WebGLRenderer;
    const source = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 500);
    const render = () =>
      reflector.onBeforeRender(
        renderer,
        scene,
        source,
        reflector.geometry,
        reflector.material as THREE.Material,
        null as unknown as THREE.Group,
      );
    try {
      for (const zoom of [0.7, 1.3]) {
        source.zoom = zoom;
        source.updateProjectionMatrix();
        for (let quarter = 0; quarter < 4; quarter++) {
          const angle = Math.PI / 4 + (quarter * Math.PI) / 2;
          source.position.set(80 * Math.cos(angle), 60, 80 * Math.sin(angle));
          source.lookAt(0, 0, 0);
          source.updateMatrixWorld();
          render();
          for (const [x, z] of [
            [-5, -3],
            [0, 0],
            [5, 3],
          ]) {
            expect(reflectedFrustum.containsPoint(new THREE.Vector3(x, 1, z))).toBe(true);
            expect(reflectedFrustum.containsPoint(new THREE.Vector3(x, -1, z))).toBe(false);
          }
          expect(activeTarget).toBe(previousTarget);
          expect(renderer.xr.enabled).toBe(true);
          expect(renderer.shadowMap.autoUpdate).toBe(true);
        }
      }
      simulateFailure = true;
      expect(render).toThrow('échec simulé du rendu');
      expect(activeTarget).toBe(previousTarget);
      expect(renderer.xr.enabled).toBe(true);
      expect(renderer.shadowMap.autoUpdate).toBe(true);
      expect(reflector.visible).toBe(true);
    } finally {
      previousTarget.dispose();
      reflector.dispose();
      reflector.geometry.dispose();
    }
  });
});
