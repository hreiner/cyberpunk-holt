/** Materiaux peints stables pour l'habillage d'exploration. */
import * as THREE from 'three';
import type { Rng } from '@/core/rng';

type MaterialKey =
  | 'creamConcrete'
  | 'creamConcreteWall'
  | 'warmLinoleum'
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

/**
 * `grain` : densité du mouchetis fin (agrégat de béton) -- 0 pour les matières qui n'en ont pas
 * besoin (tissu, métal peint). `seams` : joints de panneau/dalle répétés sur le module de 1 m,
 * qui donnent une échelle réelle à une texture posée case par case (voir `paintedTexture`).
 */
const PALETTE: Record<
  MaterialKey,
  { base: string; stroke: string; dark: string; metalness?: number; grain?: number; seams?: 'wall' | 'floorTile' }
> = {
  creamConcrete: { base: '#a89d85', stroke: '#cabfa4', dark: '#7d7669', grain: 0.5 },
  creamConcreteWall: { base: '#9c937f', stroke: '#bcb096', dark: '#726b5c', grain: 0.4, seams: 'wall' },
  warmLinoleum: { base: '#b7936a', stroke: '#d4ae82', dark: '#8a6a49', seams: 'floorTile' },
  coldConcrete: { base: '#53676a', stroke: '#77888a', dark: '#354246', grain: 0.5 },
  coldConcreteWall: { base: '#586269', stroke: '#76838a', dark: '#37414a', grain: 0.4, seams: 'wall' },
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

const CANVAS_SIZE = 256;

/**
 * Hash local : les touches de peinture sont reproductibles sans consommer le RNG de jeu.
 *
 * Passe C (matières et lumière) : la résolution passe de 64 à 256 px et le canevas gagne un
 * grain fin (agrégat de béton), une légère vignette d'occlusion aux coins et, pour les murs,
 * des joints de panneau alignés sur le module de 1 m -- sans quoi une matière posée case par
 * case (un `BoxGeometry` par cellule de mur) lit comme une pile de boîtes identiques plutôt que
 * comme un mur continu : voir le commentaire de `EnvironmentMaterials.get`. Toujours seedé via
 * `Rng.fork`, jamais `Math.random()` (AGENTS.md règle 1).
 */
function paintedTexture(key: MaterialKey, rng: Rng): THREE.CanvasTexture {
  const palette = PALETTE[key];
  const size = CANVAS_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponible pour les matières d’exploration.');
  context.fillStyle = palette.base;
  context.fillRect(0, 0, size, size);

  if (key === 'containerSteel') {
    // Nervures verticales continues : la cour lit comme de la tôle ondulée à l'échelle iso.
    for (let x = 0; x < size; x += size / 8) {
      context.fillStyle = '#727a79';
      context.fillRect(x, 0, size / 32, size);
      context.fillStyle = '#e0dfd2';
      context.fillRect(x + size / 21, 0, size / 64, size);
    }
  }

  // Touches larges et rares : la matière reste calme à la distance iso, sans damier répété.
  const scale = size / 64;
  for (let i = 0; i < 7; i++) {
    context.globalAlpha = 0.02 + rng.next() * 0.05;
    context.fillStyle = i % 3 === 0 ? palette.dark : palette.stroke;
    const width = (16 + rng.next() * 30) * scale;
    const height = (2 + rng.next() * 4) * scale;
    context.fillRect(rng.next() * size - width / 2, rng.next() * size - height / 2, width, height);
  }

  // Grain fin (agrégat de béton) : beaucoup de mouchetis minuscules à très faible opacité --
  // c'est ce qui donne une matière une fois posé à la distance de jeu (repeat 1x par pièce,
  // AGENTS.md "échelle de la texture juste"), là où les grandes touches seules restent trop lisses.
  const grain = palette.grain ?? 0;
  if (grain > 0) {
    const count = Math.round(900 * grain);
    for (let i = 0; i < count; i++) {
      context.globalAlpha = 0.035 + rng.next() * 0.07;
      context.fillStyle = rng.next() < 0.5 ? palette.dark : palette.stroke;
      const r = 0.4 + rng.next() * 1.1;
      context.beginPath();
      context.arc(rng.next() * size, rng.next() * size, r, 0, Math.PI * 2);
      context.fill();
    }
  }

  // Vignette d'occlusion douce aux coins : casse la platitude d'un aplat répété sans dessiner
  // de motif directionnel qui glisserait pendant le panoramique (EXPLORATION-VISUAL-DESIGN.md
  // "stables pendant le panoramique").
  const vignette = context.createRadialGradient(size / 2, size / 2, size * 0.28, size / 2, size / 2, size * 0.72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.16)');
  context.globalAlpha = 1;
  context.fillStyle = vignette;
  context.fillRect(0, 0, size, size);

  if (palette.seams === 'wall') {
    // Joint de panneau au ras du module de 1 m : une ligne fine et sombre en pied et en tête de
    // chaque case de mur. Comme la géométrie est un cube par case avec la MÊME texture, ce joint
    // se répète exactement à chaque jonction et se lit comme un mur en panneaux coulés plutôt que
    // comme des boîtes empilées (défaut réel constaté : "les murs lisent comme des blocs de carton").
    context.globalAlpha = 0.5;
    context.fillStyle = palette.dark;
    context.fillRect(0, 0, size, size * 0.02);
    context.fillRect(0, size * 0.98, size, size * 0.02);
    context.globalAlpha = 0.16;
    context.fillRect(0, 0, size * 0.015, size);
    context.fillRect(size * 0.985, 0, size * 0.015, size);
  } else if (palette.seams === 'floorTile') {
    // Dalles de linoléum 0,5 m : deux joints croisés par case, plus discrets qu'un joint de
    // panneau mural (sol marché, pas une façade), pour distinguer le "revêtement" de la cantine
    // et de l'infirmerie du béton brut des autres pièces (ART-DIRECTION.md, revêtement != teinte).
    context.globalAlpha = 0.22;
    context.fillStyle = palette.dark;
    context.fillRect(0, size * 0.49, size, size * 0.015);
    context.fillRect(size * 0.49, 0, size * 0.015, size);
    context.globalAlpha = 0.1;
    context.fillStyle = palette.stroke;
    context.fillRect(0, size * 0.02, size, size * 0.01);
    context.fillRect(0, size * 0.5 + size * 0.02, size, size * 0.01);
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
    // sans introduire un atlas lourd ni des variations aléatoires dans le rendu. Chargement réseau
    // asynchrone : l'image n'existe pas encore à cet instant, `TextureLoader` la posera elle-même
    // sur `texture.image` et marquera `needsUpdate` UNE FOIS chargée (comportement par défaut de
    // three.js). Les consommateurs qui ont besoin d'un clone indépendant (ex. `ExploreView.floorMaterial`,
    // un `repeat` propre par pièce) doivent attendre `texture.image` avant de l'attribuer ou de
    // forcer `needsUpdate` sur LEUR clone : `Texture.clone()` n'est qu'un instantané des propriétés
    // au moment de l'appel, pas un lien vivant vers cette texture partagée -- un clone pris trop tôt
    // ne recevrait jamais l'image chargée par la suite, et marquer `needsUpdate` sur un clone sans
    // image déclenche "Texture marked for update but no image data found" (défaut réel constaté).
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
      roughness:
        key === 'cyanSignal' || key === 'amberSignal' || key === 'alarmRed'
          ? 0.42
          : key === 'warmLinoleum'
            ? 0.62
            : 0.86,
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
