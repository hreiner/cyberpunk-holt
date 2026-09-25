/**
 * Chrome partage par les ecrans "plein cadre" du chapitre : image de lieu
 * pour les dialogues, ciel trame et silhouette de toits en repli, utilitaires
 * de titre. Le tirage reutilise le meme decor ; l'ecran titre pose sa propre
 * illustration derriere le contenu (docs/art/UI-DESIGN-SYSTEM.md).
 *
 * Zero dependance a `three` (regle 2 d'AGENTS.md n'exige pas cette regle pour
 * `src/ui`, mais ce module reste volontairement pur DOM/SVG, deterministe
 * -- aucun `Math.random()`, voir `buildSkylinePath`).
 */

import { assetUrl } from '@/ui/assetUrl';

export type SceneZone = 'academy' | 'transit' | 'interior' | 'bal';

/** Image de décor livrée pour un dialogue, servie depuis `public/assets/backdrops/`. */
export interface SceneBackdrop {
  src: string;
}

const BACKDROP_ASSET = assetUrl('backdrops/');

/**
 * Décor des dialogues du chapitre 1. `dialogueId` prime sur `sceneId` : une
 * conversation annexe du hub conserve la scène `ch1.hub`, mais se déroule
 * dans le lieu du cadet abordé. Les scènes sans entrée gardent le ciel
 * graphique existant.
 */
const BACKDROPS_BY_DIALOGUE: Record<string, SceneBackdrop> = {
  'ch1.interface': { src: `${BACKDROP_ASSET}interface.webp` },
  'ch1.hub.abigail': { src: `${BACKDROP_ASSET}infirmerie.webp` },
  'ch1.hub.john': { src: `${BACKDROP_ASSET}armurerie.webp` },
  'ch1.hub.letitia': { src: `${BACKDROP_ASSET}archives.webp` },
  'ch1.hub.grover': { src: `${BACKDROP_ASSET}cour-interieure.webp` },
  'ch1.hub.zachary': { src: `${BACKDROP_ASSET}salle-examen.webp` },
  'ch1.centre-hall': { src: `${BACKDROP_ASSET}hall.webp` },
};

/**
 * Un même dialogue peut traverser plusieurs lieux. Cette table est consultée
 * après le dialogue actif et avant le décor générique de scène : le noeud
 * décrit l'instant précis, le dialogue garde la priorité pour ses annexes.
 */
const BACKDROPS_BY_NODE: Record<string, SceneBackdrop> = {
  'ch1.fourgon:depart': { src: `${BACKDROP_ASSET}garage.webp` },
  'ch1.fourgon:arrivee': { src: `${BACKDROP_ASSET}centre-examen.webp` },
};

const BACKDROPS_BY_SCENE: Record<string, SceneBackdrop> = {
  'ch1.intro': { src: `${BACKDROP_ASSET}dortoirs.webp` },
  'ch1.discours': { src: `${BACKDROP_ASSET}cantine.webp` },
  'ch1.exam': { src: `${BACKDROP_ASSET}salle-examen.webp` },
  'ch1.tirage': { src: `${BACKDROP_ASSET}salle-examen.webp` },
  'ch1.fourgon': { src: `${BACKDROP_ASSET}badlands.webp` },
  'ch1.centre-hall': { src: `${BACKDROP_ASSET}centre-examen.webp` },
  'ch1.salle1': { src: `${BACKDROP_ASSET}salle1.webp` },
  'ch1.salle2': { src: `${BACKDROP_ASSET}salle2.webp` },
  'ch1.salle3': { src: `${BACKDROP_ASSET}salle3.webp` },
  'ch1.cour': { src: `${BACKDROP_ASSET}cour-containers.webp` },
  'ch1.bal': { src: `${BACKDROP_ASSET}bal.webp` },
};

/**
 * Renvoie le décor associé, ou `undefined` pour conserver le décor de repli.
 * Le dialogue reste prioritaire sur le noeud afin qu'une conversation annexe
 * garde son lieu, puis le noeud affine une scène à plusieurs étapes.
 */
export function backdropFor(sceneId: string, dialogueId = '', nodeId = ''): SceneBackdrop | undefined {
  return (
    BACKDROPS_BY_DIALOGUE[dialogueId] ??
    BACKDROPS_BY_NODE[`${dialogueId}:${nodeId}`] ??
    BACKDROPS_BY_SCENE[sceneId]
  );
}

/** Meme regle que dans narrativeView.ts : une legere variation du ciel par groupe de scenes. */
export function sceneZone(sceneId: string): SceneZone {
  if (sceneId.startsWith('ch1.salle')) return 'interior';
  if (sceneId === 'ch1.fourgon') return 'transit';
  if (sceneId === 'ch1.bal') return 'bal';
  return 'academy';
}

/** "Salle 2 — Le choix couteux" -> ["Salle 2", "Le choix couteux"] ; sans tiret, pas de sur-titre. */
export function splitTitle(title: string): [string | null, string] {
  const sep = ' — ';
  const idx = title.indexOf(sep);
  if (idx < 0) return [null, title];
  return [title.slice(0, idx), title.slice(idx + sep.length)];
}

/**
 * Silhouette de toits en dents de scie, placeholder d'horizon -- deterministe
 * (regle 1 d'AGENTS.md) : hauteurs derivees d'un calcul entier fixe, jamais
 * de `Math.random()`.
 */
function buildSkylinePath(): string {
  const n = 26;
  const w = 400 / n;
  let d = 'M0 60 ';
  let x = 0;
  for (let i = 0; i < n; i++) {
    const h = 12 + ((i * 53) % 34);
    d += `L${x.toFixed(1)} ${60 - h} L${(x + w).toFixed(1)} ${60 - h} `;
    x += w;
  }
  d += 'L400 60 Z';
  return d;
}

export const SKYLINE_PATH = buildSkylinePath();

/**
 * Decor plein-largeur : illustration ou ciel trame et silhouette en repli,
 * sans le bandeau de titre
 * (chaque ecran pose le sien, le contenu differant trop pour etre factorise
 * ici). A poser dans un conteneur portant la classe `scene-shell` et
 * `data-zone` (voir `.scene-shell[data-zone=...]` dans styles.css).
 */
export function backdropMarkup(): string {
  return `
    <div class="narrative-backdrop halftone">
      <img class="scene-backdrop-image" alt="" aria-hidden="true" hidden />
      <svg class="narrative-skyline" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="${SKYLINE_PATH}" />
      </svg>
    </div>
  `;
}
