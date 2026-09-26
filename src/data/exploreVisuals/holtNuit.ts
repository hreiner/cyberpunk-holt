/**
 * Habillage de la variante de nuit (`holt-nuit`, lot 5.8) : reprend TEL QUEL le mobilier de
 * `holt.ts` (mêmes salles, même mobilier -- l'invariant du lot : « holt-nuit est une
 * variante, pas une modification de holt »), sous la clé `mapId: 'holt-nuit'` qu'attend
 * `EXPLORE_VISUALS` (`ExploreView` choisit son habillage par `def.id`, ADR 0024).
 *
 * L'« habillage enrichi » demandé par TECH-DESIGN §3 (B4 : ballons, guirlandes, gâteaux,
 * tables renversées) n'est PAS posé ici : il demanderait de nouveaux modèles procéduraux
 * dans `src/data/exploreVisualModels.ts` (aucun modèle de ballon/guirlande/gâteau n'y existe
 * à ce lot), hors de la liste "Toucher" de ce lot et non nécessaire pour que le bal et la
 * fuite se jouent -- signalé dans le rapport du lot comme un écart, pas un blocage : la
 * salle reste lisible (même mobilier que l'examen, mêmes pièces), seule la lumière et la
 * narration (texte, `ch2.bal.json`, `ch2.slow.json`) portent l'ambiance de fête puis de
 * rafale.
 */
import type { ExploreVisualMapDef } from '../exploreVisualTypes';
import { HOLT_VISUALS } from './holt';

export const HOLT_NUIT_VISUALS: ExploreVisualMapDef = {
  mapId: 'holt-nuit',
  placements: HOLT_VISUALS.placements,
};
