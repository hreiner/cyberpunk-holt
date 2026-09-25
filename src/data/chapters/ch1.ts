/**
 * `ChapterDef` du chapitre 1 (ADR 0021) : enveloppe `CHAPTER_1_SCENES` sans
 * changer son contenu ni son comportement -- voir docs/chapters/ch2/TECH-DESIGN.md
 * §1 ("Le chapitre 1 devient la première `ChapterDef` sans changer de comportement").
 */

import { CH1_ETAPE_FLAG, CHAPTER_1_SCENES } from '@/narrative/sceneRouter';
import { INITIAL_LUCK } from '@/narrative/runState';
import type { ChapterDef } from '@/narrative/chapter';
import { CHAPTER_1_RADIO } from '@/data/radio';

export const CHAPTER_1: ChapterDef = {
  id: 1,
  title: 'Le dernier jour',
  scenes: CHAPTER_1_SCENES,
  etapeFlag: CH1_ETAPE_FLAG,
  initialLuck: INITIAL_LUCK,
  radio: CHAPTER_1_RADIO,
  end: 'ch1-report',
};
