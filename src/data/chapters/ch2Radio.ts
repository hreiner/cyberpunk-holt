/**
 * Répliques de pression du chapitre 2 (ADR 0024 §2, TECH-DESIGN §4.6 "La fuite qui s'entend",
 * lot 5.8) : `channel: 'pression'` -- pas de locuteur, une ligne de narration (dialogue) ou de
 * brief (exploration), toujours accompagnée d'un bruitage synthétisé (tir lointain, rafale).
 * Déclenchées par les trois zones à effets de `holt-nuit.ts` (`fuite.zone-1/2/3`), qui avancent
 * `RunState.tempo` d'un cran chacune -- une réplique par seuil, comme demandé.
 *
 * Ton : identique à `ch2.slow.json`/`ch2.grille.json`, jamais institutionnel (contrairement à
 * `CHAPTER_1_RADIO` -- ici personne ne parle à la radio, c'est le monde qui se rapproche).
 */

import type { RadioCue } from '@/narrative/radio';

export const CHAPTER_2_RADIO: RadioCue[] = [
  {
    id: 'ch2.radio.fuite.1',
    atTempo: 1,
    channel: 'pression',
    text: 'Des pas, deux couloirs plus loin.',
    sfx: ['distant-shot'],
  },
  {
    id: 'ch2.radio.fuite.2',
    atTempo: 2,
    channel: 'pression',
    text: 'Une porte claque, quelque part derrière.',
    sfx: ['distant-shot'],
  },
  {
    id: 'ch2.radio.fuite.3',
    atTempo: 3,
    channel: 'pression',
    text: 'Le couloir tremble sous une rafale -- tout près, cette fois.',
    sfx: ['burst'],
  },
];
