/**
 * Materiaux propres au mobilier superpose du dortoir HOLT.
 *
 * Les primitives immediates sont rendues avec une texture peinte locale. L'atlas du pilote
 * remplace ensuite l'image de la meme source THREE.Texture : les materiaux et leurs clones
 * voient donc la mise a jour sans attendre la construction synchrone d'ExploreView.
 */
import * as THREE from 'three';
import type { Rng } from '@/core/rng';

const ATLAS_URL = `${import.meta.env.BASE_URL}assets/dormitory-aaa/material-atlas.jpg`;

export type DormitoryTextureKey = 'floor' | 'wall' | 'fabric' | 'steel' | 'wood' | 'contact';
export type DormitorySurfaceKey =
  | 'floor'
  | 'wall'
  | 'steel'
  | 'edgeSteel'
  | 'darkSteel'
  | 'linen'
  | 'blanket'
  | 'canvas'
  | 'wood'
  | 'brass'
  | 'leather';
export type DormitoryMaterialKey = DormitorySurfaceKey | 'contact';

interface TextureStyle {
  base: string;
  light: string;
  dark: string;
  detail: string;
}

const TEXTURE_STYLES: Record<Exclude<DormitoryTextureKey, 'contact'>, TextureStyle> = {
  floor: { base: '#bcbdb8', light: '#d8d9d4', dark: '#8d918f', detail: '#e5e4dc' },
  wall: { base: '#88877f', light: '#aaa89b', dark: '#5e6260', detail: '#c5c0ae' },
  fabric: { base: '#35475a', light: '#53677b', dark: '#233244', detail: '#718092' },
  steel: { base: '#71879a', light: '#a9bac6', dark: '#405463', detail: '#c3cbd0' },
  wood: { base: '#8d6948', light: '#c09a6e', dark: '#55412f', detail: '#ddbd8e' },
};

interface SurfaceStyle {
  color: number;
  roughness: number;
  metalness?: number;
  texture?: Exclude<DormitoryTextureKey, 'contact'>;
  bumpTexture?: Exclude<DormitoryTextureKey, 'contact'>;
  bumpScale?: number;
  side?: THREE.Side;
}

const SURFACES: Record<DormitorySurfaceKey, SurfaceStyle> = {
  // Béton ciré : le PMREM reste une réflexion diffuse bon marché, mais sa force et le
  // clearcoat donnent enfin des éclats lisibles dans l'allée comme dans la cible.
  floor: { color: 0xb5afa3, roughness: 0.26, metalness: 0.12, texture: 'floor', bumpScale: 0.038 },
  // Les murs HOLT sont du béton coulé peint, pas des cloisons crème lisses.
  wall: { color: 0xb0aaa0, roughness: 0.91, metalness: 0, texture: 'wall', bumpScale: 0.065 },
  steel: { color: 0xb5c0c6, roughness: 0.36, metalness: 0.48, texture: 'steel', bumpScale: 0.006 },
  edgeSteel: { color: 0xb8c1c3, roughness: 0.4, metalness: 0.55, texture: 'steel', bumpScale: 0.004 },
  darkSteel: { color: 0x3b4e5b, roughness: 0.68, metalness: 0.25, texture: 'steel', bumpScale: 0.004 },
  // Le linge garde un albedo blanc; le carre de tissu du pilote ne sert qu'au relief fin.
  linen: { color: 0xd5d0c2, roughness: 1, bumpTexture: 'fabric', bumpScale: 0.008, side: THREE.DoubleSide },
  blanket: { color: 0xa8b7c4, roughness: 0.98, texture: 'fabric', bumpScale: 0.008, side: THREE.DoubleSide },
  canvas: { color: 0x596b70, roughness: 0.92, bumpTexture: 'fabric', bumpScale: 0.005 },
  wood: { color: 0x96764f, roughness: 0.58, texture: 'wood' },
  brass: { color: 0xa19470, roughness: 0.4, metalness: 0.6 },
  leather: { color: 0x16191a, roughness: 0.85 },
};

const ATLAS_REGIONS = [
  // Le pilote emploie le béton poli granuleux (haut gauche) au sol et le béton coffré
  // (haut droite) aux murs.
  ['floor', 0, 0],
  ['wall', 1, 0],
  ['fabric', 0, 1],
  ['steel', 1, 1],
] as const satisfies readonly (readonly [Exclude<DormitoryTextureKey, 'wood' | 'contact'>, number, number])[];

const TEXTURE_SIZE = 1024;
const CONTACT_SIZE = 128;
const WALL_ATLAS_REPEAT = 2;
const WOOD_TEXTURE_URL = `${import.meta.env.BASE_URL}assets/exploration/wood-laminate-cantine-1k.jpg`;

const ENVIRONMENT_INTENSITY: Partial<Record<DormitorySurfaceKey, number>> = {
  floor: 0.65,
  steel: 0.4,
  edgeSteel: 0.32,
  darkSteel: 0.2,
};

function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  return texture;
}

function paintedFallback(key: Exclude<DormitoryTextureKey, 'contact'>, rng: Rng): THREE.CanvasTexture {
  const style = TEXTURE_STYLES[key];
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponible pour le kit du dortoir.');

  context.fillStyle = style.base;
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < 26; i++) {
    context.globalAlpha = 0.045 + rng.next() * 0.1;
    context.fillStyle = i % 3 === 0 ? style.dark : style.light;
    const width = 18 + rng.next() * 115;
    const height = key === 'steel' || key === 'wall' ? 1 + rng.next() * 5 : 3 + rng.next() * 20;
    context.fillRect(rng.next() * TEXTURE_SIZE, rng.next() * TEXTURE_SIZE, width, height);
  }
  const grainCount = key === 'fabric' ? 950 : 620;
  for (let i = 0; i < grainCount; i++) {
    context.globalAlpha = 0.025 + rng.next() * 0.06;
    context.fillStyle = rng.next() < 0.5 ? style.detail : style.dark;
    const radius = 0.35 + rng.next() * 1.15;
    context.beginPath();
    context.arc(rng.next() * TEXTURE_SIZE, rng.next() * TEXTURE_SIZE, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  return canvasTexture(canvas);
}

function contactTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CONTACT_SIZE;
  canvas.height = CONTACT_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponible pour l’ombre de contact du dortoir.');
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,.48)');
  gradient.addColorStop(0.48, 'rgba(0,0,0,.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, CONTACT_SIZE, CONTACT_SIZE);
  const texture = canvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/** Ressources partagees du kit ; tous les materiaux et toutes les textures lui appartiennent. */
export class DormitoryMaterials {
  private readonly textures = new Map<DormitoryTextureKey, THREE.Texture>();
  private readonly clones = new Map<DormitoryTextureKey, Set<THREE.Texture>>();
  private readonly surfaces = new Map<DormitorySurfaceKey, THREE.MeshStandardMaterial>();
  private readonly contactMaterial: THREE.MeshBasicMaterial;
  private environment: THREE.Texture | null = null;
  private disposed = false;

  constructor(private readonly rng: Rng) {
    for (const key of ['floor', 'wall', 'fabric', 'steel', 'wood'] as const) {
      this.textures.set(key, paintedFallback(key, rng.fork(`dormitory-material:${key}`)));
    }
    this.textures.get('wall')!.repeat.set(WALL_ATLAS_REPEAT, WALL_ATLAS_REPEAT);
    this.textures.set('contact', contactTexture());

    this.contactMaterial = new THREE.MeshBasicMaterial({
      map: this.textures.get('contact'),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      toneMapped: false,
    });
    this.loadAtlas();
    this.loadWoodTexture();
  }

  get(key: DormitorySurfaceKey): THREE.MeshStandardMaterial;
  get(key: 'contact'): THREE.MeshBasicMaterial;
  get(key: DormitoryMaterialKey): THREE.MeshStandardMaterial | THREE.MeshBasicMaterial {
    if (key === 'contact') return this.contactMaterial;
    const existing = this.surfaces.get(key);
    if (existing) return existing;
    const style = SURFACES[key];
    const texture = style.texture ? this.textures.get(style.texture) : undefined;
    const bumpTexture = style.bumpTexture
      ? this.textures.get(style.bumpTexture)
      : style.bumpScale
        ? texture
        : undefined;
    const params = {
      color: style.color,
      map: texture,
      bumpMap: bumpTexture ?? null,
      bumpScale: style.bumpScale ?? 0,
      roughness: style.roughness,
      metalness: style.metalness ?? 0,
      side: style.side ?? THREE.FrontSide,
    };
    const material =
      key === 'floor' ? new THREE.MeshPhysicalMaterial(params) : new THREE.MeshStandardMaterial(params);
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.clearcoat = key === 'floor' ? 0.28 : 0.68;
      material.clearcoatRoughness = key === 'floor' ? 0.28 : 0.16;
    }
    this.applyEnvironment(key, material);
    this.surfaces.set(key, material);
    return material;
  }

  /** Applique l'environnement partagé aux matériaux cirés/métalliques sans en prendre ownership. */
  setEnvironment(texture: THREE.Texture | null): void {
    this.environment = texture;
    for (const [key, material] of this.surfaces) this.applyEnvironment(key, material);
  }

  /**
   * Retourne la texture possedee par ce depot. `clone()` cree un wrapper independant qui partage
   * la meme Source; il recoit donc aussi le remplacement asynchrone du fallback par l'atlas.
   * Le code appelant reste proprietaire de tout clone cree.
   */
  getTexture(key: DormitoryTextureKey): THREE.Texture {
    const texture = this.textures.get(key);
    if (!texture) throw new Error(`Texture du dortoir inconnue : ${key}`);
    return texture;
  }

  /**
   * Clone independant (repeat/offset propres au sol, par exemple) avec invalidation WebGL
   * explicite. THREE.Texture.clone partage `Source`, mais `WebGLTextures.setTexture2D` exige aussi
   * un `Texture.version` propre non nul; les clones sont donc re-marques a chaque chargement.
   * Le clone appartient a l'appelant et n'est jamais detruit par ce depot.
   */
  cloneTexture(key: DormitoryTextureKey): THREE.Texture {
    const clone = this.getTexture(key).clone();
    clone.needsUpdate = true;
    let ownedClones = this.clones.get(key);
    if (!ownedClones) {
      ownedClones = new Set();
      this.clones.set(key, ownedClones);
    }
    const clones = ownedClones;
    clones.add(clone);
    clone.addEventListener('dispose', () => clones.delete(clone));
    return clone;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const material of this.surfaces.values()) material.dispose();
    this.surfaces.clear();
    this.contactMaterial.dispose();
    this.clones.clear();
    for (const texture of this.textures.values()) texture.dispose();
    this.textures.clear();
  }

  private loadAtlas(): void {
    if (typeof Image === 'undefined') return;
    const image = new Image();
    image.onload = () => {
      if (this.disposed || image.width < 2 || image.height < 2) return;
      for (const [key, tileX, tileY] of ATLAS_REGIONS) {
        const texture = this.textures.get(key);
        if (!texture || this.disposed) return;
        const canvas = document.createElement('canvas');
        canvas.width = TEXTURE_SIZE;
        canvas.height = TEXTURE_SIZE;
        const context = canvas.getContext('2d');
        if (!context) continue;
        context.drawImage(
          image,
          (tileX * image.width) / 2,
          (tileY * image.height) / 2,
          image.width / 2,
          image.height / 2,
          0,
          0,
          TEXTURE_SIZE,
          TEXTURE_SIZE,
        );
        if (key === 'steel') {
          context.globalCompositeOperation = 'screen';
          context.fillStyle = '#607a8e';
          context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
          context.globalCompositeOperation = 'source-over';
        }
        this.replaceTextureImage(key, canvas);
      }
    };
    image.onerror = () => {
      // The procedurally painted images remain installed as the permanent offline fallback.
    };
    image.src = ATLAS_URL;
  }

  private loadWoodTexture(): void {
    if (typeof Image === 'undefined') return;
    const image = new Image();
    image.onload = () => {
      if (this.disposed || image.width < 2 || image.height < 2) return;
      this.replaceTextureImage('wood', image);
    };
    image.onerror = () => {
      // Le fallback peint reste actif si l'albedo bois n'est pas disponible.
    };
    image.src = WOOD_TEXTURE_URL;
  }

  private replaceTextureImage(key: DormitoryTextureKey, image: TexImageSource): void {
    if (this.disposed) return;
    const texture = this.textures.get(key);
    if (!texture) return;
    // `Texture.image` ecrit dans la Source partagee; les wrappers deja uploades recoivent aussi
    // leur propre version, condition requise par WebGLTextures.setTexture2D.
    texture.image = image;
    texture.needsUpdate = true;
    for (const clone of this.clones.get(key) ?? []) clone.needsUpdate = true;
  }

  private applyEnvironment(key: DormitorySurfaceKey, material: THREE.MeshStandardMaterial): void {
    const intensity = ENVIRONMENT_INTENSITY[key];
    if (intensity === undefined) return;
    material.envMap = this.environment;
    material.envMapIntensity = intensity;
    material.needsUpdate = true;
  }
}
