/**
 * Profils de départ du chapitre 2 (ADR 0022, docs/chapters/ch2/TECH-DESIGN.md §4.2) : pour un
 * joueur qui commence directement au chapitre 2, sans archive du chapitre 1. Trois profils sont
 * prévus (Loyal à la bande, Solitaire, Neutre) ; seul **Neutre** est implémenté à ce lot (5.1) --
 * les deux autres, et le choix à l'écran titre, arrivent au lot 5.2 avec l'archive.
 */

import { addTags, createDossier } from '@/core/dossier';
import type { Dossier } from '@/core/dossier';

export type ProfileId = 'loyal' | 'solitaire' | 'neutre';

export interface DossierProfile {
  id: ProfileId;
  title: string;
  summary: string;
  build(): Dossier;
}

/**
 * « Le dossier moyen » (TECH-DESIGN §4.2) : les étiquettes d'une partie du chapitre 1 jouée sans
 * parti pris (équipe tactique au tirage, exercice remporté) et les affinités de départ des
 * fiches, inchangées (`createDossier()` les amorce déjà -- voir docs/design/06-SCORING-DOSSIER.md).
 */
export const NEUTRAL_PROFILE: DossierProfile = {
  id: 'neutre',
  title: 'Neutre',
  summary: "Ni la bande, ni le franc-tireur : l'équipe tactique, l'exercice remporté, les affinités de départ.",
  build: () => addTags(createDossier(), ['equipe-tactique', 'vainqueur-exercice']),
};

/** Registre des profils implémentés. `loyal`/`solitaire` s'ajoutent au lot 5.2. */
export const CH2_PROFILES: Partial<Record<ProfileId, DossierProfile>> = {
  neutre: NEUTRAL_PROFILE,
};
