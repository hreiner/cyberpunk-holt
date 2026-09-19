/**
 * Chrome partage par les ecrans "plein cadre" du chapitre : decor de scene
 * (ciel trame + silhouette de toits) et petits utilitaires de titre. Extrait
 * de `narrativeView.ts` pour que `HubView` et `TitleView` (docs/art/UI-DESIGN-SYSTEM.md,
 * "Hub — l'alignement" / "Écran titre") affichent EXACTEMENT le meme ciel que
 * l'ecran de dialogue -- "le decor de scene a droit a son ciel", jamais une
 * seconde variante inventee ailleurs.
 *
 * Zero dependance a `three` (regle 2 d'AGENTS.md n'exige pas cette regle pour
 * `src/ui`, mais ce module reste volontairement pur DOM/SVG, deterministe
 * -- aucun `Math.random()`, voir `buildSkylinePath`).
 */

export type SceneZone = 'academy' | 'transit' | 'interior' | 'bal';

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
 * Decor plein-largeur : ciel tramé + silhouette, sans le bandeau de titre
 * (chaque ecran pose le sien, le contenu differant trop pour etre factorise
 * ici). A poser dans un conteneur portant la classe `scene-shell` et
 * `data-zone` (voir `.scene-shell[data-zone=...]` dans styles.css).
 */
export function backdropMarkup(): string {
  return `
    <div class="narrative-backdrop halftone">
      <svg class="narrative-skyline" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="${SKYLINE_PATH}" />
      </svg>
    </div>
  `;
}
