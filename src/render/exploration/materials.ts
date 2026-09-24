/** Materiaux peints stables pour l'habillage d'exploration. */
import * as THREE from 'three';
import type { Rng } from '@/core/rng';

type MaterialKey =
  | 'creamConcrete'
  | 'coldConcrete'
  | 'coldConcreteWall'
  | 'petrolPaint'
  | 'darkMetal'
  | 'wornMetal'
  | 'linen'
  | 'blanket'
  | 'wood'
  | 'cyanSignal'
  | 'amberSignal'
  | 'alarmRed'
  | 'rust'
  | 'containerSteel';

const PALETTE: Record<MaterialKey, { base: string; stroke: string; dark: string; metalness?: number }> = {
  creamConcrete: { base: '#a49a84', stroke: '#c8bda5', dark: '#7a7469' },
  coldConcrete: { base: '#53676a', stroke: '#77888a', dark: '#354246' },
  coldConcreteWall: { base: '#58676b', stroke: '#768386', dark: '#39484b' },
  petrolPaint: { base: '#214655', stroke: '#46717a', dark: '#13313c', metalness: 0.1 },
  darkMetal: { base: '#293036', stroke: '#53616a', dark: '#161a1e', metalness: 0.55 },
  wornMetal: { base: '#57636a', stroke: '#8a9695', dark: '#30383d', metalness: 0.48 },
  linen: { base: '#c1b7a2', stroke: '#e3d6bc', dark: '#928978' },
  blanket: { base: '#273d5f', stroke: '#536681', dark: '#17263d' },
  wood: { base: '#67564a', stroke: '#947964', dark: '#40342e' },
  cyanSignal: { base: '#32aeca', stroke: '#a8eeed', dark: '#166174', metalness: 0.35 },
  amberSignal: { base: '#e0a83e', stroke: '#ffe2a1', dark: '#81571c', metalness: 0.3 },
  alarmRed: { base: '#b64037', stroke: '#ef8171', dark: '#5e2527', metalness: 0.25 },
  rust: { base: '#714a36', stroke: '#a36a48', dark: '#442c25', metalness: 0.3 },
  containerSteel: { base: '#b7b7ae', stroke: '#e0dfd2', dark: '#737a78', metalness: 0.5 },
};

/** Hash local : les touches de peinture sont reproductibles sans consommer le RNG de jeu. */
function paintedTexture(key: MaterialKey, rng: Rng): THREE.CanvasTexture {
  const palette = PALETTE[key];
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponible pour les matières d’exploration.');
  context.fillStyle = palette.base;
  context.fillRect(0, 0, 64, 64);
  if (key === 'containerSteel') {
    // Nervures verticales continues : la cour lit comme de la tôle ondulée à l'échelle iso.
    for (let x = 0; x < 64; x += 8) {
      context.fillStyle = '#727a79';
      context.fillRect(x, 0, 2, 64);
      context.fillStyle = '#e0dfd2';
      context.fillRect(x + 3, 0, 1, 64);
    }
  }
  // Touches larges et rares : la matière reste calme à la distance iso, sans damier répété.
  for (let i = 0; i < 4; i++) {
    context.globalAlpha = 0.025 + rng.next() * 0.035;
    context.fillStyle = i % 3 === 0 ? palette.dark : palette.stroke;
    const width = 16 + rng.next() * 30;
    const height = 2 + rng.next() * 4;
    context.fillRect(rng.next() * 64 - width / 2, rng.next() * 64 - height / 2, width, height);
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/** Ressources communes, possédées par la factory d'une carte. */
export class EnvironmentMaterials {
  private readonly textures: THREE.Texture[] = [];
  private readonly values = new Map<MaterialKey, THREE.MeshStandardMaterial>();

  constructor(private readonly rng: Rng) {}

  get(key: MaterialKey): THREE.MeshStandardMaterial {
    const existing = this.values.get(key);
    if (existing) return existing;
    const palette = PALETTE[key];
    // Le centre reçoit une seule matière photo CC0, à basse répétition : elle casse les grands aplats
    // sans introduire un atlas lourd ni des variations aléatoires dans le rendu.
    const texture =
      key === 'coldConcrete'
        ? new THREE.TextureLoader().load('/assets/exploration/concrete-diff-1k.jpg')
        : paintedTexture(key, this.rng.fork(`material:${key}`));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.textures.push(texture);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: texture,
      roughness: key === 'cyanSignal' || key === 'amberSignal' || key === 'alarmRed' ? 0.42 : 0.82,
      metalness: palette.metalness ?? 0,
      emissive:
        key === 'cyanSignal'
          ? new THREE.Color('#0b3d4b')
          : key === 'amberSignal'
            ? new THREE.Color('#5e3b08')
            : key === 'alarmRed'
              ? new THREE.Color('#4a1014')
              : new THREE.Color(0x000000),
      emissiveIntensity: key === 'cyanSignal' || key === 'amberSignal' || key === 'alarmRed' ? 0.55 : 0,
    });
    this.values.set(key, material);
    return material;
  }

  dispose(): void {
    for (const material of this.values.values()) material.dispose();
    for (const texture of this.textures) texture.dispose();
    this.values.clear();
    this.textures.length = 0;
  }
}
