import * as THREE from 'three';

/** Local lighting rig for the playable HOLT dormitory, based on the accepted AAA pilot. */
export interface DormitoryPilotLightingOptions {
  scene: THREE.Scene;
  /** The camera actually used to render the view (the dormitory perspective proxy when active). */
  camera: THREE.Camera;
  /** East-façade window centers, in world coordinates. Ownership stays with this rig. */
  windowCenters: readonly THREE.Vector3[];
  /** Matching aperture dimensions, supplied by the architecture rather than legacy window slots. */
  windowSizes?: readonly { width: number; height: number }[];
  /** Bounds of the dormitory in world X/Z coordinates. */
  roomBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface DormitoryPilotLightingState {
  /** Only true for the HOLT dormitory scene (holt or holt-nuit). */
  active: boolean;
  /** Current ExploreState.discoveredRoomIds() membership for `dortoirs`. */
  discovered: boolean;
  /** null is day; any NightMood marks the night profile. */
  night: 'bal' | 'fuite' | 'conduits' | 'cantine' | 'campement' | null;
  /** True when the east façade is cut away for the current camera orientation. */
  wallCut: boolean;
}

export interface DormitoryPilotLighting {
  readonly group: THREE.Group;
  update(state: DormitoryPilotLightingState): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

const SHADOW_MAP_SIZE = 4096;
const SUN_DAY = new THREE.Color(0xffd2a0);
const SUN_NIGHT = new THREE.Color(0x8caacb);
const SHAFT_DAY = new THREE.Color(0xf0c78d);
const SHAFT_NIGHT = new THREE.Color(0x8caed5);

/**
 * Recreates the pilot's defining light: low, warm sunlight entering through the east windows,
 * broad soft-edged shadowing, cool fill and restrained visible shafts. The rig is gated as one
 * unit so it cannot alter another map or reveal a room before discovery.
 */
export function createDormitoryPilotLighting(options: DormitoryPilotLightingOptions): DormitoryPilotLighting {
  const { scene, camera, windowCenters, roomBounds } = options;
  const group = new THREE.Group();
  group.name = 'dormitory-pilot-lighting';
  scene.add(group);

  const width = Math.max(1, roomBounds.maxX - roomBounds.minX);
  const depth = Math.max(1, roomBounds.maxZ - roomBounds.minZ);
  const centerX = (roomBounds.minX + roomBounds.maxX) / 2;
  const centerZ = (roomBounds.minZ + roomBounds.maxZ) / 2;
  const eastFacadeX = windowCenters.length
    ? Math.max(...windowCenters.map((window) => window.x)) - 0.08
    : roomBounds.maxX - 0.08;
  const keyWindow = windowCenters.reduce<THREE.Vector3 | undefined>((nearest, window) => {
    const desiredZ = centerZ - depth * 0.28;
    return !nearest || Math.abs(window.z - desiredZ) < Math.abs(nearest.z - desiredZ) ? window : nearest;
  }, undefined);

  // Keep these sources spatially local: the actual map also contains other rooms whose lighting
  // must not change when the dormitory is discovered. The key is a room-sized, east-facing spot
  // with the pilot's soft shadow map instead of a map-wide DirectionalLight.
  const sun = new THREE.SpotLight(SUN_DAY, 32, width * 2.1, 0.62, 0.52, 1.1);
  // The key must originate in a real aperture: its old fixed height sits inside the new lintel.
  sun.position.set(eastFacadeX, keyWindow?.y ?? 3.48, keyWindow?.z ?? centerZ);
  sun.target.position.set(centerX - width * 0.16, 0.02, centerZ + depth * 0.12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  sun.shadow.camera.near = 0.2;
  sun.shadow.camera.far = width * 2.1;
  sun.shadow.bias = -0.00018;
  sun.shadow.normalBias = 0.022;
  sun.shadow.radius = 3;
  sun.shadow.camera.updateProjectionMatrix();
  group.add(sun, sun.target);

  const shafts = new THREE.Group();
  shafts.name = 'dormitory-window-light-shafts';
  group.add(shafts);
  const shaftMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      shaftColor: { value: SHAFT_DAY.clone() },
      gain: { value: 0.14 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform vec3 shaftColor; uniform float gain;
      void main(){
        float edge=pow(max(0.0,sin(vUv.x*3.14159265)),1.65);
        float along=pow(max(0.0,sin(vUv.y*3.14159265)),0.72);
        float core=0.72+0.28*(1.0-abs(vUv.x*2.0-1.0));
        gl_FragColor=vec4(shaftColor,edge*along*core*gain);
      }`,
  });
  const shaftGeometries: THREE.BufferGeometry[] = [];
  const shaftLength = Math.min(width * 0.43, 8.2);
  for (const [index, window] of windowCenters.entries()) {
    // Quad tapers toward the aisle, matching the broad, angled rays in the standalone pilot.
    const geometry = new THREE.BufferGeometry();
    const z = window.z;
    const zSpread = (options.windowSizes?.[index]?.width ?? 1.24) * 0.45;
    const eastX = window.x - 0.08;
    const innerX = eastX - shaftLength;
    const verts = new Float32Array([
      eastX,
      window.y,
      z - zSpread,
      eastX,
      window.y,
      z + zSpread,
      innerX,
      0.055,
      z + zSpread * 1.65,
      innerX,
      0.055,
      z - zSpread * 1.65,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    shaftGeometries.push(geometry);
    shafts.add(new THREE.Mesh(geometry, shaftMaterial));
  }

  // Dust motes are deterministic, sparse and confined to the window shafts (never Math.random).
  const moteCount = Math.max(24, Math.min(72, windowCenters.length * 12));
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    const windowIndex = i % Math.max(1, windowCenters.length);
    const window = windowCenters[windowIndex];
    const u = fract((i + 1) * 0.61803398875);
    const v = fract((i + 1) * 0.75487766625);
    motePositions[i * 3] = (window?.x ?? eastFacadeX) - 0.08 - u * shaftLength;
    const aperture = options.windowSizes?.[windowIndex];
    const rayHeight = (window?.y ?? 3.48) * (1 - u) + 0.055 * u;
    motePositions[i * 3 + 1] = rayHeight + (v - 0.5) * (aperture?.height ?? 1.52) * 0.22;
    motePositions[i * 3 + 2] = window
      ? window.z + (fract((i + 1) * 0.569840291) - 0.5) * (aperture?.width ?? 1.24)
      : centerZ;
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const motes = new THREE.Points(
    moteGeometry,
    new THREE.PointsMaterial({
      color: 0xffe2b2,
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  group.add(motes);

  // Window spots supply the softer secondary pools; only the key source casts a shadow map.
  const windowLights: THREE.SpotLight[] = [];
  for (const [index, window] of windowCenters.entries()) {
    const light = new THREE.SpotLight(0xffd09a, 5.2, Math.max(width, depth) * 1.55, 0.56, 0.72, 1.25);
    light.position.set(window.x - 0.08, window.y, window.z);
    light.target.position.set(centerX - width * 0.24, 0.03, window.z + ((index % 2) * 2 - 1) * 0.42);
    light.castShadow = false;
    group.add(light, light.target);
    windowLights.push(light);
  }

  let disposed = false;
  let state: DormitoryPilotLightingState = { active: false, discovered: false, night: null, wallCut: false };
  const applyState = () => {
    const enabled = state.active && state.discovered;
    group.visible = enabled;
    const night = state.night !== null;
    sun.color.copy(night ? SUN_NIGHT : SUN_DAY);
    sun.intensity = night ? (state.night === 'fuite' ? 5.2 : state.night === 'conduits' ? 3.4 : 8.5) : 32;
    shaftMaterial.uniforms.shaftColor!.value.copy(night ? SHAFT_NIGHT : SHAFT_DAY);
    shaftMaterial.uniforms.gain!.value = night ? 0.035 : 0.14;
    (motes.material as THREE.PointsMaterial).color.set(night ? 0x9bb9df : 0xffe2b2);
    (motes.material as THREE.PointsMaterial).opacity = night ? 0.1 : 0.28;
    for (const light of windowLights) {
      light.color.set(night ? 0x9cb8df : 0xffd09a);
      light.intensity = night ? (state.night === 'bal' ? 1.35 : 0.5) : 5.2;
    }
    // When the east façade is cut, keep the visible rays but soften them: the opening is now
    // a readability cut, not an extra source of sunlight.
    shafts.visible = enabled;
    shaftMaterial.uniforms.gain!.value *= state.wallCut ? 0.62 : 1;
  };

  return {
    group,
    update(next) {
      if (disposed) return;
      state = { ...next };
      applyState();
      // Keep the camera dependency explicit: this supports projection-aware future shaft sizing
      // without ever reaching back into ExploreView's camera controller.
      camera.updateMatrixWorld();
    },
    resize(widthPx, heightPx) {
      if (disposed || widthPx <= 0 || heightPx <= 0) return;
      // Shadow frustum is room-space; this hook exists so the owner can include it in its resize
      // lifecycle alongside the render targets/post-processing it owns.
      sun.shadow.camera.updateProjectionMatrix();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(group);
      for (const geometry of shaftGeometries) geometry.dispose();
      moteGeometry.dispose();
      shaftMaterial.dispose();
      (motes.material as THREE.Material).dispose();
      sun.shadow.dispose();
      group.clear();
    },
  };
}

function fract(value: number): number {
  return value - Math.floor(value);
}
