/**
 * Registre des chapitres (ADR 0021). `ChapterApp` (src/chapter.ts) et
 * `main.ts` ne connaissent que ce fichier -- jamais `CHAPTER_1_SCENES` ou
 * `CHAPTER_2_SCENES` directement, sauf les rares cas deja gardes par un
 * identifiant de scene precis (voir docs/process/ARCHITECTURE.md).
 */

import type { ChapterDef, ChapterId } from '@/narrative';
import { CHAPTER_1 } from './ch1';
import { CHAPTER_2 } from './ch2';

export const CHAPTERS: Record<ChapterId, ChapterDef> = {
  1: CHAPTER_1,
  2: CHAPTER_2,
};

/**
 * Chapitre auquel appartient `sceneId` (ADR 0021 : "`?scene=` en deduit le
 * chapitre"). Les identifiants de scene restent prefixes par leur chapitre
 * (`ch1.*`/`ch2.*`), mais on cherche par appartenance reelle a la liste des
 * scenes plutot que par le prefixe -- plus robuste, et ca reste bon marche (au
 * plus une douzaine de scenes par chapitre). `null` si aucun chapitre ne la
 * connait (identifiant invalide).
 */
export function chapterOfScene(sceneId: string): ChapterId | null {
  for (const def of Object.values(CHAPTERS)) {
    if (def.scenes.some((s) => s.id === sceneId)) return def.id;
  }
  return null;
}

export { CHAPTER_1 } from './ch1';
export { CHAPTER_2, CHAPTER_2_SCENES, CH2_ETAPE_FLAG, CH2_INITIAL_LUCK } from './ch2';
export type { ProfileId, DossierProfile } from './ch2Profiles';
export { NEUTRAL_PROFILE, CH2_PROFILES } from './ch2Profiles';
