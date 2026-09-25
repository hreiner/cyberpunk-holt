/**
 * Registre des portraits (docs/art/UI-DESIGN-SYSTEM.md, section "Portraits").
 *
 * `portraitFor(id)` donne les metadonnees (nom, couleur, matricule, image
 * definitive) ; `portraitElement(id, size)` construit l'element
 * DOM pret a poser dans une vue -- soit une <img> si `PortraitSpec.src` est
 * renseigne, soit un placeholder SVG genere ici.
 *
 * Placeholder **deterministe** : aucun aleatoire (regle 1 d'AGENTS.md), tout
 * depend uniquement de `id`. Les portraits livres sont declares ci-dessous ;
 * les placeholders ne servent plus qu'en secours si un futur locuteur n'a pas
 * encore d'image (voir docs/art/ART-PIPELINE.md).
 */

import { getCharacter } from '@/rules/character';
import { assetUrl } from '@/ui/assetUrl';
import type { SpeakerId } from '@/narrative';

export interface PortraitSpec {
  id: SpeakerId;
  /** « Zachary », « Le directeur », « Instructeur (radio) »... vide pour le narrateur. */
  name: string;
  /** Couleur du personnage (cadets : `placeholderColor` de characters.json). */
  color: string;
  /** Matricule affiche sous le portrait, ex. « HOLT 2077-014 ». */
  badge: string;
  /**
   * Initiale affichee sur le placeholder. Par defaut `name[0]` -- ce qui donne
   * "L" pour "Le directeur" / "L'instructeur" / "L'otage", trois locuteurs
   * distincts avec la MEME initiale fautive. Renseigne explicitement pour ces
   * trois-la (D / I / O) ; les cadets restent sur le defaut (premiere lettre
   * du prenom).
   */
  initial?: string;
  /** Image definitive servie depuis `public/assets/portraits/`, si le locuteur en a une. */
  src?: string;
}

export type PortraitSize = 'thumb' | 'card' | 'hero';

/**
 * Couleurs des locuteurs hors cadets, recopiees de UI-DESIGN-SYSTEM.md
 * ("directeur or terni #c9a44c, instructeur et radio --comm, otage gris
 * #9a9a9a"). Valeurs dupliquees a la main plutot que lues depuis
 * `theme.css` : ce module doit rester utilisable hors DOM (voir le test
 * unitaire de determinisme), donc pas de `getComputedStyle`.
 */
const DIRECTEUR_COLOR = '#c9a44c';
const COMM_COLOR = '#45d4e6'; // = --comm (src/ui/theme.css)
const OTAGE_COLOR = '#9a9a9a';
/** Le narrateur n'est jamais rendu (ce n'est pas une voix, voir le document), couleur de secours seulement. */
const NARRATEUR_COLOR = '#7d7064'; // = --bone-faint

/** Portraits valides du manifeste P01 a P12. La radio est la voix de Murphy. */
const PORTRAIT_SOURCES: Partial<Record<SpeakerId, string>> = {
  franklyn: assetUrl('portraits/franklyn.webp'),
  abigail: assetUrl('portraits/abigail.webp'),
  letitia: assetUrl('portraits/letitia.webp'),
  john: assetUrl('portraits/john.webp'),
  grover: assetUrl('portraits/grover.webp'),
  zachary: assetUrl('portraits/zachary.webp'),
  directeur: assetUrl('portraits/directeur.webp'),
  instructeur: assetUrl('portraits/instructeur.webp'),
  otage: assetUrl('portraits/otage.webp'),
  radio: assetUrl('portraits/instructeur.webp'),
};

const SURVEILLANT_PORTRAIT_SOURCES = {
  neutre: assetUrl('portraits/surveillant.webp'),
  mefiant: assetUrl('portraits/surveillant-mefiant.webp'),
  alerte: assetUrl('portraits/surveillant-alerte.webp'),
} as const;

const INK = '#140d0e'; // = --ink
const BONE = '#efe4d4'; // = --bone
const RED_DEEP = '#8c1219'; // = --red-deep

const SIZES: Record<PortraitSize, { w: number; h: number }> = {
  thumb: { w: 52, h: 52 },
  card: { w: 160, h: 213 },
  hero: { w: 260, h: 347 },
};

/** Canevas de travail du placeholder : ratio 3:4, cf. tailles `card`/`hero`. */
const VB_W = 300;
const VB_H = 400;

/** Matricule stable par id, sans aucun aleatoire : hash simple de la chaine. */
function badgeFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const num = (hash % 900) + 100;
  return `HOLT 2077-${String(num).padStart(3, '0')}`;
}

function registryEntry(id: SpeakerId): Omit<PortraitSpec, 'badge'> {
  switch (id) {
    case 'narrateur':
      return { id, name: '', color: NARRATEUR_COLOR };
    case 'directeur':
      return { id, name: 'Le directeur', color: DIRECTEUR_COLOR, initial: 'D' };
    case 'instructeur':
      return { id, name: "L'instructeur", color: COMM_COLOR, initial: 'I' };
    case 'radio':
      return { id, name: 'Radio', color: COMM_COLOR };
    case 'otage':
      return { id, name: "L'otage", color: OTAGE_COLOR, initial: 'O' };
    default: {
      const sheet = getCharacter(id);
      return { id, name: sheet.name, color: sheet.placeholderColor };
    }
  }
}

/**
 * Source du portrait de Keith, surveillant de l'examen ecrit.
 *
 * Keith n'est pas un `SpeakerId` : cette fonction sert a la puce de vigilance.
 * Les niveaux 0 et 1 gardent son expression neutre, 2 devient mefiant, 3 et
 * au-dela utilisent l'expression alertee.
 */
export function surveillantPortraitSource(vigilance: number): string {
  if (vigilance >= 3) return SURVEILLANT_PORTRAIT_SOURCES.alerte;
  if (vigilance >= 2) return SURVEILLANT_PORTRAIT_SOURCES.mefiant;
  return SURVEILLANT_PORTRAIT_SOURCES.neutre;
}

/** Fiche de portrait d'un locuteur : nom, couleur, matricule et image livree. */
export function portraitFor(id: SpeakerId): PortraitSpec {
  const src = PORTRAIT_SOURCES[id];
  return { ...registryEntry(id), badge: badgeFor(id), ...(src ? { src } : {}) };
}

/* ---------------------------------- couleur -------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Assombrit une couleur vers ~25 % de luminosite, teinte conservee. */
function darken(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  return hslToHex(h, Math.max(s, 0.35), 0.22);
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/* --------------------------------- placeholder ------------------------------ */

/**
 * Compteur d'instances, uniquement pour prefixer les ids de `<pattern>` SVG
 * (evite les collisions quand plusieurs portraits du meme id sont rendus a
 * l'ecran, ex. le fil de dialogue). N'affecte jamais le rendu : ce n'est pas
 * de l'aleatoire, juste un identifiant unique de DOM.
 */
let instanceCounter = 0;

/** Buste + tete communs a tous les personnages (cercle centre 150,128 rayon 58 : sommet y=70). */
const BUST_PATH =
  'M55 400 L55 250 Q55 195 105 178 L195 178 Q245 195 245 250 L245 400 Z' +
  ' M150 128 m-58 0 a58 58 0 1 0 116 0 a58 58 0 1 0 -116 0';

/**
 * Coiffe/couvre-chef specifique a chaque locuteur, en sous-chemins fermes
 * ajoutes au buste (meme remplissage/contour, donc meme double-trace de
 * reperage). C'est ce qui rend les six cadets reconnaissables a la silhouette
 * seule, avant meme la couleur ou l'initiale -- voir docs/design/04-CHARACTERS.md
 * pour les indices d'apparence des cadets ; directeur/instructeur/otage sont
 * des inventions dans le meme esprit (casquette, casque radio, capuche).
 */
function hairFillPath(id: SpeakerId): string {
  switch (id) {
    case 'zachary':
      // "Coupe au bol" : calotte pleine, frange droite qui plonge legerement au centre.
      return ' M90 96 Q90 40 150 40 Q210 40 210 96 L206 110 Q150 124 94 110 Z';
    case 'abigail':
      // "Tresses serrees" : calotte courte -- les nattes elles-memes sont tracees a part (extraStrokeMarkup).
      return ' M96 92 Q150 50 204 92 L204 78 Q150 40 96 78 Z';
    case 'grover':
      // "Cheveux noirs raides, frange" : chevelure asymetrique, frange en pointe d'un cote.
      return ' M92 92 Q98 42 150 40 Q205 44 208 92 L208 112 L150 86 L92 112 Z';
    case 'franklyn':
      // Touffu, en epis -- l'apprenti netrunner, jamais peigne (le neuroport est ajoute a part).
      return ' M92 94 L105 50 L121 88 L137 46 L153 88 L169 46 L185 88 L201 50 L208 94 Z';
    case 'directeur':
      // Casquette d'officier a visiere.
      return (
        ' M82 100 Q82 38 150 38 Q218 38 218 100 L218 114 L82 114 Z' +
        ' M104 114 Q150 130 196 114 L196 102 L104 102 Z'
      );
    case 'otage':
      // Capuche non-violente qui enveloppe tete et epaules (pas de bandeau sur les yeux).
      return ' M48 280 Q46 66 150 54 Q254 66 252 280 Z';
    default:
      // letitia (bouclee), john (ras), instructeur (casque radio) : voir extraStrokeMarkup.
      return '';
  }
}

/**
 * Elements decoratifs qui ne peuvent pas etre de simples sous-chemins remplis
 * (boucles, meches fines, casque radio, nattes) : un calque supplementaire,
 * sans le double-trace de reperage (reserve au premier plan, voir le document
 * de design -- ici ce n'est qu'un detail de placeholder).
 */
function extraStrokeMarkup(spec: PortraitSpec): string {
  switch (spec.id) {
    case 'letitia': {
      // "Cheveux boucles" : chapelet de bourrelets le long du haut du crane.
      const n = 7;
      let out = '';
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const angle = Math.PI - t * Math.PI;
        const cx = (150 + Math.cos(angle) * 64).toFixed(1);
        const cy = (98 - Math.sin(angle) * 42).toFixed(1);
        out += `<circle cx="${cx}" cy="${cy}" r="15" fill="${INK}" stroke="${BONE}" stroke-width="2.5" />`;
      }
      return out;
    }
    case 'john': {
      // "Cheveux blancs ras" : texture legere plutot qu'une masse pleine (coupe tres courte).
      let out = '';
      for (let i = 0; i < 8; i++) {
        const x = 100 + i * 14.5;
        out += `<line x1="${x}" y1="77" x2="${x}" y2="63" stroke="${BONE}" stroke-width="2" stroke-linecap="round" />`;
      }
      return out;
    }
    case 'abigail': {
      // Nattes serrees de part et d'autre du visage, en zigzag.
      const rope = (cx: number, dir: number) => {
        let d = `M${cx} 96`;
        for (let i = 1; i <= 6; i++) {
          const x = cx + dir * (i % 2 === 0 ? 12 : -2);
          const y = 96 + i * 14;
          d += ` L${x} ${y}`;
        }
        return `<path d="${d}" fill="none" stroke="${BONE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />`;
      };
      return rope(94, -1) + rope(206, 1);
    }
    case 'franklyn': {
      // Neuroport (marque du netrunner), a la couleur du personnage.
      return (
        `<circle cx="204" cy="150" r="7" fill="${INK}" stroke="${spec.color}" stroke-width="2.5" />` +
        `<path d="M204 157 L204 174" fill="none" stroke="${spec.color}" stroke-width="2.5" stroke-linecap="round" />`
      );
    }
    case 'instructeur': {
      // Casque radio : arceau, deux oreillettes, micro-perche.
      return (
        `<path d="M96 84 Q150 46 204 84" fill="none" stroke="${BONE}" stroke-width="4" stroke-linecap="round" />` +
        `<circle cx="90" cy="124" r="15" fill="${INK}" stroke="${BONE}" stroke-width="3" />` +
        `<circle cx="210" cy="124" r="15" fill="${INK}" stroke="${BONE}" stroke-width="3" />` +
        `<path d="M206 134 Q226 152 198 172" fill="none" stroke="${BONE}" stroke-width="3" stroke-linecap="round" />` +
        `<circle cx="198" cy="172" r="4" fill="${COMM_COLOR}" />`
      );
    }
    default:
      return '';
  }
}

/** Silhouette tete-epaules : encre, contour os, double contour rouge-profond decale. */
function silhouetteMarkup(spec: PortraitSpec): string {
  const d = BUST_PATH + hairFillPath(spec.id);
  return `
    <path d="${d}" transform="translate(4,4)" fill="none" stroke="${RED_DEEP}" stroke-width="3" />
    <path d="${d}" fill="${INK}" stroke="${BONE}" stroke-width="3" />
    ${extraStrokeMarkup(spec)}
  `;
}

/** `radio` : un haut-parleur stylise a la place de la silhouette. */
function loudspeakerMarkup(): string {
  const cone = 'M90 150 L150 150 L210 105 L210 275 L150 230 L90 230 Z';
  const wave1 = 'M232 132 Q272 190 232 248';
  const wave2 = 'M252 108 Q308 190 252 272';
  return `
    <g transform="translate(4,4)" fill="none" stroke="${RED_DEEP}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="${cone}" />
      <path d="${wave1}" />
      <path d="${wave2}" />
    </g>
    <g fill="none" stroke="${BONE}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="${cone}" fill="${INK}" />
      <path d="${wave1}" />
      <path d="${wave2}" />
    </g>
  `;
}

function svgPlaceholder(spec: PortraitSpec, size: PortraitSize): string {
  const uid = instanceCounter++;
  const bg = darken(spec.color);
  const patternId = `pt-halftone-${uid}`;
  const initial = (spec.initial ?? spec.name[0] ?? '?').toUpperCase();
  const figure = spec.id === 'radio' ? loudspeakerMarkup() : silhouetteMarkup(spec);
  // `thumb` est recadre sur le visage : slice + alignement haut sur un
  // viewBox 3:4 fait deborder le bas (bande de matricule comprise), exactement
  // l'effet recherche.
  const preserve = size === 'thumb' ? 'xMidYMin slice' : 'xMidYMid meet';

  return `
    <svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg" class="portrait-svg"
         preserveAspectRatio="${preserve}" role="img" aria-label="${escapeXml(spec.name || 'Portrait')}">
      <defs>
        <pattern id="${patternId}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <rect width="14" height="14" fill="${bg}" />
          <circle cx="7" cy="7" r="3.1" fill="${spec.color}" opacity="0.45" />
        </pattern>
      </defs>
      <rect width="${VB_W}" height="${VB_H}" fill="url(#${patternId})" />
      ${figure}
      <text x="18" y="${VB_H - 46}" font-family="'Big Shoulders Display','Arial Narrow',sans-serif"
            font-weight="800" font-size="120" fill="${spec.color}" style="letter-spacing:-2px">${escapeXml(initial)}</text>
      <rect x="0" y="${VB_H - 34}" width="${VB_W}" height="34" fill="${INK}" opacity="0.7" />
      <text x="12" y="${VB_H - 12}" font-family="'Barlow Semi Condensed',sans-serif" font-weight="600"
            font-size="16" letter-spacing="1" fill="${BONE}">${escapeXml(spec.badge)}</text>
    </svg>`;
}

/** Element DOM pret a poser : `<img>` si `src` est renseigne, sinon le placeholder SVG. */
export function portraitElement(id: SpeakerId, size: PortraitSize): HTMLElement {
  const spec = portraitFor(id);
  const { w, h } = SIZES[size];

  const wrap = document.createElement('div');
  wrap.className = `portrait portrait--${size}`;
  wrap.style.width = `${w}px`;
  wrap.style.height = `${h}px`;

  if (spec.src) {
    const img = document.createElement('img');
    img.src = spec.src;
    img.alt = spec.name;
    img.width = w;
    img.height = h;
    wrap.appendChild(img);
    return wrap;
  }

  wrap.innerHTML = svgPlaceholder(spec, size);
  return wrap;
}
