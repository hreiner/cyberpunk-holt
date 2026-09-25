/**
 * Silhouettes de l'exploration. Ces données ne portent aucun état de jeu : elles
 * distinguent seulement les cadets quand la caméra isométrique les réduit à
 * quelques dizaines de pixels.
 */

import type { CharacterId } from '@/rules/character';

export type CadetHair = 'messy-short' | 'braids' | 'curly-bun' | 'buzz' | 'long-fringe' | 'bowl';

export interface CadetVisualProfile {
  readonly skin: number;
  readonly hair: number;
  readonly hairStyle: CadetHair;
  readonly uniform: number;
  readonly trim: number;
  /** Coupe de veste et proportions : une variation de silhouette, pas une règle. */
  readonly build: 'slim' | 'balanced' | 'athletic';
  readonly hasNeuroport: boolean;
  readonly rankStripes: number;
  /**
   * Multiplicateur de taille au-delà de l'écart adulte/cadet (`HumanRigOptions.adult`,
   * ADR 0024 §3) : 1 par défaut (omis), 0,7 pour l'enfant du chapitre 2 — jamais confondu
   * avec un cadet à la distance de jeu.
   */
  readonly scale?: number;
}

/** Une source unique pour les acteurs humains de HOLT. */
export const CADET_VISUAL_PROFILES: Record<CharacterId, CadetVisualProfile> = {
  franklyn: {
    // Références : peau claire, taches de rousseur et cheveux châtain foncé.
    skin: 0xe0b394,
    hair: 0x251914,
    hairStyle: 'messy-short',
    uniform: 0x202b3b,
    trim: 0x9aa9aa,
    build: 'slim',
    hasNeuroport: true,
    rankStripes: 0,
  },
  abigail: {
    // `REFERENCES.md` fixe une peau claire avec taches de rousseur.
    skin: 0xe1b89f,
    hair: 0x17151a,
    hairStyle: 'braids',
    uniform: 0x263443,
    trim: 0xb88c53,
    build: 'balanced',
    hasNeuroport: true,
    rankStripes: 0,
  },
  letitia: {
    skin: 0xa66d4f,
    hair: 0x5a3828,
    hairStyle: 'curly-bun',
    uniform: 0x273746,
    trim: 0xd1b26b,
    build: 'balanced',
    hasNeuroport: true,
    rankStripes: 2,
  },
  john: {
    skin: 0xd0aa91,
    hair: 0xd5d2cf,
    hairStyle: 'buzz',
    uniform: 0x1d2b35,
    trim: 0x7e99a3,
    build: 'athletic',
    hasNeuroport: false,
    rankStripes: 0,
  },
  grover: {
    skin: 0x9c654a,
    hair: 0x16151b,
    hairStyle: 'long-fringe',
    uniform: 0x30313b,
    trim: 0x8ea1a6,
    build: 'balanced',
    hasNeuroport: true,
    rankStripes: 0,
  },
  zachary: {
    skin: 0x70452f,
    hair: 0x191318,
    hairStyle: 'bowl',
    uniform: 0x283642,
    trim: 0xc47745,
    build: 'athletic',
    hasNeuroport: true,
    rankStripes: 0,
  },
};

/**
 * L'enfant recueilli au chapitre 2 (ADR 0024 §3) : suiveur au même titre qu'un cadet, mais
 * sans `CharacterSheet` (`FollowerId = CharacterId | 'enfant'`) — silhouette dédiée, réduite
 * (`scale: 0.7`), jamais habillée en cadet HOLT.
 */
export const CHILD_VISUAL_PROFILE: CadetVisualProfile = {
  skin: 0xc99873,
  hair: 0x2b2119,
  hairStyle: 'bowl',
  uniform: 0x4d4038,
  trim: 0x8a6b4c,
  build: 'slim',
  hasNeuroport: false,
  rankStripes: 0,
  scale: 0.7,
};

/**
 * Figurant armé générique (silhouettes des gangers de la fuite, lot 5.8) : tenue sombre,
 * sans insigne HOLT ni neuroport — un profil de rig, pas encore branché sur une carte.
 */
export const GANGER_VISUAL_PROFILE: CadetVisualProfile = {
  skin: 0x9c7355,
  hair: 0x151312,
  hairStyle: 'buzz',
  uniform: 0x1c1c1f,
  trim: 0x4a1f1f,
  build: 'athletic',
  hasNeuroport: false,
  rankStripes: 0,
};
