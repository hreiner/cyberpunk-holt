/**
 * `ChapterDef` du chapitre 2 (« la nuit du bal », ADR 0021, lot 5.1). Les 14
 * scenes de docs/chapters/ch2/TECH-DESIGN.md §4.4 : au lot 5.1, les cinq
 * scenes qui deviendront `explore` (bal, fuite, conduits, cantine, campement)
 * sont PROVISOIREMENT des dialogues d'un seul noeud, du meme identifiant --
 * elles redeviendront `explore` dans le lot de leur carte (meme id, autre
 * type, regle du lot 3.6b deja appliquee au chapitre 1).
 *
 * Contenu narratif volontairement minimal (un a trois noeuds) : ce lot ne
 * livre que le SQUELETTE qui garde le chapitre jouable de bout en bout, avec
 * le vocabulaire ferme de docs/chapters/ch2/GAME-DESIGN.md §7 deja en place
 * sur quelques choix, a titre d'exemple -- le contenu complet arrive scene
 * par scene aux lots 5.5 et suivants (voir TECH-DESIGN §6).
 */

import type { ChapterDef, SceneDef } from '@/narrative';

/** Drapeau d'etape du chapitre 2 (ADR 0021) -- pas encore utilise au lot 5.1 (aucune scene `explore` ici). */
export const CH2_ETAPE_FLAG = 'ch2.etape';

/** Chance de Franklyn au chapitre 2 : reserve pleine, non heritee du chapitre 1 (TECH-DESIGN B25). */
export const CH2_INITIAL_LUCK = 3;

export const CHAPTER_2_SCENES: SceneDef[] = [
  { id: 'ch2.photo', kind: 'dialogue', title: 'La photo', dialogueId: 'ch2.photo', number: 1 },
  { id: 'ch2.bal', kind: 'dialogue', title: 'Le bal', dialogueId: 'ch2.bal', number: 2 },
  { id: 'ch2.slow', kind: 'dialogue', title: 'Le slow', dialogueId: 'ch2.slow', number: 3 },
  { id: 'ch2.fuite', kind: 'dialogue', title: 'La fuite', dialogueId: 'ch2.fuite', number: 4 },
  { id: 'ch2.grille', kind: 'dialogue', title: 'La grille', dialogueId: 'ch2.grille', number: 4 },
  { id: 'ch2.conduits', kind: 'dialogue', title: 'Les conduits', dialogueId: 'ch2.conduits', number: 5 },
  { id: 'ch2.enfant', kind: 'dialogue', title: "L'enfant", dialogueId: 'ch2.enfant', number: 5 },
  { id: 'ch2.cantine', kind: 'dialogue', title: 'La cantine', dialogueId: 'ch2.cantine', number: 6 },
  { id: 'ch2.egouts', kind: 'dialogue', title: 'Les égouts', dialogueId: 'ch2.egouts', number: 7 },
  { id: 'ch2.adieu', kind: 'dialogue', title: "L'adieu", dialogueId: 'ch2.adieu', number: 8 },
  { id: 'ch2.campement', kind: 'dialogue', title: 'Le campement', dialogueId: 'ch2.campement', number: 9 },
  { id: 'ch2.murano', kind: 'dialogue', title: 'Murano', dialogueId: 'ch2.murano', number: 9 },
  { id: 'ch2.decharges', kind: 'dialogue', title: 'Les décharges', dialogueId: 'ch2.decharges', number: 10 },
  { id: 'ch2.charcudoc', kind: 'dialogue', title: 'Le charcudoc', dialogueId: 'ch2.charcudoc', number: 11 },
];

export const CHAPTER_2: ChapterDef = {
  id: 2,
  title: 'La nuit du bal',
  scenes: CHAPTER_2_SCENES,
  etapeFlag: CH2_ETAPE_FLAG,
  initialLuck: CH2_INITIAL_LUCK,
  // Pas de repliques radio propres au chapitre 2 avant le lot 5.7 (pression, ADR 0024).
  radio: [],
  // Bilan provisoire : reutilise l'ecran de cloture du chapitre 1 (voir src/narrative/chapter.ts,
  // ChapterEndRef) tant que l'ADR 0025 (lot 5.4) n'introduit pas de bilan propre.
  end: 'ch1-report',
};
