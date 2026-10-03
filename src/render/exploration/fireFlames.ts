import * as THREE from 'three';

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += amplitude * noise(p);
      p = p * 2.03 + 17.17;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    float y = vUv.y;
    float rise = uTime * 0.72;
    float turbulence = fbm(vec2(vUv.x * 5.0 + uTime * 0.13, y * 3.8 - rise));
    float edgeWobble = (turbulence - 0.48) * 0.22
      + sin(y * 11.0 - rise * 2.4 + vUv.x * 4.0) * 0.035;
    float taper = mix(0.43, 0.035, y);
    float center = 0.5 + edgeWobble * (0.3 + y);
    float distanceFromCenter = abs(vUv.x - center);
    float edge = taper - distanceFromCenter;
    float body = smoothstep(-0.035, 0.055, edge);
    float topFade = 1.0 - smoothstep(0.78, 1.0, y + turbulence * 0.09);
    float baseFade = smoothstep(0.0, 0.1, y);
    float alpha = body * topFade * baseFade * 0.78;
    if (alpha < 0.012) discard;

    float coreWidth = taper * 0.36;
    float core = 1.0 - smoothstep(coreWidth * 0.28, coreWidth, distanceFromCenter);
    float hot = smoothstep(0.02, 0.5, turbulence + (1.0 - y) * 0.22);
    vec3 outerColor = vec3(0.55, 0.035, 0.006);
    vec3 orangeColor = vec3(1.0, 0.19 + hot * 0.14, 0.012);
    vec3 yellowColor = vec3(1.0, 0.68, 0.09);
    vec3 color = mix(outerColor, orangeColor, smoothstep(0.0, 0.75, edge / max(taper, 0.001)));
    color = mix(color, yellowColor, core * (0.48 + 0.34 * hot));
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** A few animated translucent cards create irregular flames without solid orange slabs. */
export function createFireFlames(width: number, height: number, depth = 0.08, layers = 3): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  material.name = 'procedural-fire-flames';
  material.userData.exploreTimeUniform = 'uTime';

  for (let layer = 0; layer < layers; layer++) {
    const taper = layer === 1 ? 0.76 : 1;
    const planeWidth = width * taper;
    const planeHeight = height * (layer === 2 ? 0.78 : 1);
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'procedural-fire-flame';
    mesh.position.set(
      layer === 1 ? width * 0.08 : 0,
      planeHeight / 2 + 0.055,
      layer === 2 ? -depth : depth * (layer === 1 ? -0.4 : 1),
    );
    mesh.rotation.y = layer === 0 ? 0 : layer === 1 ? Math.PI / 2 : 0.48;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }
  return group;
}
