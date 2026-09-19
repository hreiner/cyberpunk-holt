/**
 * Repliques radio de l'instructeur pendant le parcours interieur (scene 7,
 * salles 1 a 3). Le tempo est un compteur invisible avance par les effets
 * `{ tempo: n }` des dialogues (forcer l'armoire, s'attarder dans le gaz,
 * echouer un jet couteux). Voir docs/design/07-DIALOGUE-FORMAT.md et
 * l'ADR 0011.
 *
 * Ton : institutionnel et sec, sous pression, jamais insultant — cf.
 * docs/design/01-SETTING.md.
 */

import type { RadioCue } from '@/narrative/radio';

export const CHAPTER_1_RADIO: RadioCue[] = [
  {
    id: 'ch1.radio.depart',
    atTempo: 1,
    text: 'Équipes en mouvement. Restez sur le parcours, cadets.',
  },
  {
    id: 'ch1.radio.salle1',
    atTempo: 2,
    text: 'Progression enregistrée en salle un. On continue.',
  },
  {
    id: 'ch1.radio.adverse-avance',
    atTempo: 3,
    text: "L'autre équipe est déjà en salle deux. Accélérez le pas.",
  },
  {
    id: 'ch1.radio.armoire-forcee',
    atTempo: 4,
    when: { flag: 'ch1.salle2.armoire-forcee', equals: true },
    text: 'Temps supplémentaire noté. Ce sera dans votre rapport.',
  },
  {
    id: 'ch1.radio.salle3-entree',
    atTempo: 5,
    text: 'Salle trois. Ne traînez pas dans le gaz plus que nécessaire.',
  },
  {
    id: 'ch1.radio.adverse-salle3-entree',
    atTempo: 5,
    text: "L'autre équipe est déjà en salle trois. Ne perdez pas de terrain.",
  },
  {
    id: 'ch1.radio.adverse-salle3',
    atTempo: 6,
    text: "L'équipe adverse achève son parcours. Cadence insuffisante de votre côté.",
  },
  {
    id: 'ch1.radio.retard',
    atTempo: 7,
    text: "Vous accusez du retard sur le planning de l'exercice.",
  },
  {
    id: 'ch1.radio.fin-parcours',
    atTempo: 8,
    text: "Parcours terminé. Rejoignez la cour, l'affrontement final vous attend.",
  },
];
