/**
 * Presentation du materiel : pictogrammes et couleurs.
 *
 * Un objet doit se reconnaitre au premier coup d'oeil, sur la carte comme dans le HUD :
 * meme pictogramme et meme couleur partout. Les libelles francais restent dans
 * `ITEM_LABELS` (`src/tactical/combat.ts`).
 */

import type { ItemId } from '@/tactical/types';

export const ITEM_ICONS: Record<ItemId, string> = {
  taser: '⚡', // eclair
  healkit: '✚', // croix
  hackingTool: '\u{1F4BB}', // ordinateur portable
  mine: '\u{1F4A3}', // bombe
};

export const ITEM_COLORS: Record<ItemId, number> = {
  taser: 0xffd400,
  healkit: 0x5cff8a,
  hackingTool: 0x4cc9f0,
  mine: 0xff8a1f,
};

/** Objets qui peuvent etre portes par un cadet (le kit de soin est une ressource d'equipe). */
export const CARRIED_ITEMS: readonly ItemId[] = ['taser', 'hackingTool', 'mine'];
