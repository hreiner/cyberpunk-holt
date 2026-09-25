/**
 * Profils de départ du chapitre 2 (ADR 0022, docs/chapters/ch2/TECH-DESIGN.md §4.2) : pour un
 * joueur qui commence directement au chapitre 2, sans archive du chapitre 1. Trois profils
 * complets (Loyal à la bande, Solitaire, Neutre), chacun un `Dossier` construit pour que la
 * trace d'une partie du chapitre 1 se sente même sans l'avoir jouée (ADR 0022 §3).
 *
 * « La bande » (docs/design/04-CHARACTERS.md, "Les bandes") : parmi les cinq amis jouables,
 * seuls Zachary et Abigail forment la bande de Franklyn -- Letitia appartient au « trio
 * critique » (avec Grover et Théodore, non jouable), et John reste solitaire, proche du seul
 * Franklyn. « bande +2 »/« bande 0 » (TECH-DESIGN §4.2) portent donc sur `zachary`/`abigail`.
 */

import { addTags, adjustAffinity, createDossier } from '@/core/dossier';
import type { Dossier } from '@/core/dossier';

export type ProfileId = 'loyal' | 'solitaire' | 'neutre';

export interface DossierProfile {
  id: ProfileId;
  title: string;
  summary: string;
  build(): Dossier;
}

/** Les deux membres jouables de la bande de Franklyn (voir la note d'en-tête). */
const BANDE = ['zachary', 'abigail'] as const;

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

/**
 * « Loyal à la bande » (TECH-DESIGN §4.2) : a choisi son camp au tirage, a sauvé l'otage,
 * remporté l'exercice -- la bande de Zachary le lui rend (+2 d'affinité chacun), et Letitia,
 * plus distante, s'en trouve un peu radoucie (+1). Pensé pour voir la bande porter Franklyn
 * au chapitre 2 (scènes 2, 4, 8 -- GAME-DESIGN §7).
 */
export const LOYAL_PROFILE: DossierProfile = {
  id: 'loyal',
  title: 'Loyal à la bande',
  summary: 'La bande au tirage, l’otage sauvé, l’exercice remporté : Zachary et Abigail lui rendent la pareille.',
  build: () => {
    let dossier = addTags(createDossier(), ['loyal-bande', 'equipe-bande', 'vainqueur-exercice', 'sauveteur']);
    for (const who of BANDE) dossier = adjustAffinity(dossier, who, 2);
    dossier = adjustAffinity(dossier, 'letitia', 1);
    return dossier;
  },
};

/**
 * « Solitaire » (TECH-DESIGN §4.2) : a joué l'équipe tactique du tirage, perdu l'exercice,
 * bluffé et triché en salle d'examen -- froid avec la bande (affinités ramenées à zéro, plutôt
 * qu'amorcées comme au profil Neutre), mais plus proche de Letitia (+2), qui n'en fait pas
 * partie non plus. Pensé pour voir les options froides du chapitre 2 (scènes 4, 8).
 */
export const SOLITAIRE_PROFILE: DossierProfile = {
  id: 'solitaire',
  title: 'Solitaire',
  summary: "L'équipe tactique, l'exercice perdu, un bluff et une triche à l'examen : distant avec la bande.",
  build: () => {
    let dossier = addTags(createDossier(), [
      'solitaire',
      'equipe-tactique',
      'defaite-exercice',
      'bluffeur',
      'tricheur',
    ]);
    dossier = { ...dossier, affinities: { ...dossier.affinities, zachary: 0, abigail: 0 } };
    dossier = adjustAffinity(dossier, 'letitia', 2);
    return dossier;
  },
};

/** Registre des trois profils (ADR 0022). */
export const CH2_PROFILES: Record<ProfileId, DossierProfile> = {
  loyal: LOYAL_PROFILE,
  solitaire: SOLITAIRE_PROFILE,
  neutre: NEUTRAL_PROFILE,
};
