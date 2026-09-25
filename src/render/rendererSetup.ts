/**
 * Fabrique unique des `WebGLRenderer` du jeu.
 *
 * Elle existe parce que les réglages étaient recopiés à trois endroits et avaient fini par
 * diverger : la vue tactique demandait `powerPreference: 'high-performance'`, la vue
 * d'EXPLORATION — de loin la plus lourde — ne demandait rien. Sur une machine à deux cartes
 * (portable à GPU commutable, ou simplement un navigateur qui choisit lui-même), « rien » veut
 * dire « le GPU intégré », et le même build tournait bien dans un navigateur et ramait dans un
 * autre, sans que le jeu ait changé. Défaut réel, remonté par le propriétaire du projet sur la
 * version déployée : fluide sous Edge, poussif sous Chrome.
 *
 * Tout nouveau contexte WebGL du jeu passe par ici. Un contexte qui se crée à la main
 * recommence à diverger le jour où l'on change un réglage.
 */
import * as THREE from 'three';

/**
 * Plafond du rapport de pixels. En 3D plein écran, le coût est en pixels dessinés : à 2, un
 * écran à 200 % fait rendre quatre fois la surface logique — 14 Mpx par image sur un 1440p,
 * plus la passe d'ombres. À 1,5 on en dessine 44 % de moins, et l'antialiasing matériel rattrape
 * la différence à l'œil. La règle du projet (EXPLORATION-VISUAL-DESIGN.md §5) est une cible
 * GTX 1070 : mieux vaut un jeu fluide partout qu'un jeu net sur deux machines.
 */
export const MAX_PIXEL_RATIO = 1.5;

export interface GameRendererOptions {
  /** Canvas existant ; sinon le renderer crée le sien (`domElement`). */
  canvas?: HTMLCanvasElement;
  /** Fond transparent (l'overlay des dés, posé par-dessus l'interface). */
  alpha?: boolean;
  /** Ombres portées : les deux vues 3D de jeu en ont, l'overlay des dés non. */
  shadows?: boolean;
  /** Exposition ACES ; absent = pas de tone mapping (défaut `NoToneMapping` de three). */
  toneMappingExposure?: number;
}

export function createGameRenderer(options: GameRendererOptions = {}): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas: options.canvas,
    alpha: options.alpha ?? false,
    antialias: true,
    // Le réglage qui manquait à l'exploration : sur une machine à deux cartes, il désigne la
    // carte dédiée. Sans lui, le navigateur tranche seul, et pas toujours de la même façon.
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (options.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  if (options.toneMappingExposure !== undefined) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = options.toneMappingExposure;
  }
  warnIfSoftwareRendering(renderer);
  return renderer;
}

/** Noms que rapportent les implémentations LOGICIELLES de WebGL, toutes plateformes confondues. */
const SOFTWARE_RENDERER_MARKERS = ['swiftshader', 'llvmpipe', 'software', 'basic render'];

/**
 * Nom du GPU réellement utilisé, tel que le pilote le rapporte (`WEBGL_debug_renderer_info`) --
 * `null` quand le navigateur masque l'extension, ce qu'il a le droit de faire.
 */
export function rendererDescription(renderer: THREE.WebGLRenderer): string | null {
  const gl = renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  if (!ext) return null;
  const name = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as unknown;
  return typeof name === 'string' ? name : null;
}

/**
 * Un seul avertissement par session, dans la console : quand le navigateur rend en LOGICIEL, le
 * jeu est injouable et aucune optimisation du code n'y changera rien — c'est l'accélération
 * matérielle qu'il faut réactiver. Sans ce message, le symptôme (« ça rame ») est indiscernable
 * d'un défaut de rendu, et on cherche des heures du mauvais côté.
 */
let softwareWarningShown = false;
function warnIfSoftwareRendering(renderer: THREE.WebGLRenderer): void {
  if (softwareWarningShown) return;
  const name = rendererDescription(renderer);
  if (!name) return;
  const lower = name.toLowerCase();
  if (!SOFTWARE_RENDERER_MARKERS.some((marker) => lower.includes(marker))) return;
  softwareWarningShown = true;
  console.warn(
    `Rendu 3D LOGICIEL détecté (${name}) : le jeu va ramer quoi qu'il arrive. ` +
      `Activez l'accélération matérielle du navigateur (Chrome : chrome://settings/system, ` +
      `puis vérifiez chrome://gpu — la ligne WebGL doit dire « Hardware accelerated »).`,
  );
}
