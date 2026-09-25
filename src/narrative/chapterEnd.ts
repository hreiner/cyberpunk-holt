/**
 * Bilan de fin de chapitre declare en donnees (ADR 0025 §1, lot 5.4) : un
 * `ChapterEndDef` decrit un en-tete, une photo facultative et des lignes ; ce
 * module se contente de le RESOUDRE contre un `NarrativeContext` -- pur, sans
 * DOM, testable dans Node (regle 2 d'AGENTS.md), exactement comme
 * `conditions.ts`/`effects.ts`. `src/ui/reportView.ts` (`renderChapterBilan`)
 * n'en affiche que le resultat, jamais la logique de choix des lignes.
 *
 * Le chapitre 1 garde son ecran de cloture actuel : `ChapterDef.end` reste
 * `'ch1-report' | ChapterEndDef` (voir `chapter.ts`), et rien ici ne touche a
 * ce repli.
 */

import type { CharacterId } from '@/rules/character';
import type { ChapterId } from './chapter';
import type { Condition } from './types';
import { evaluateCondition } from './conditions';
import type { NarrativeContext } from './dialogueRunner';

/** Photo souvenir en tete du bilan (ADR 0025 §4.6, "Photo au bilan") : decor plein cadre, cadets estompes. */
export interface ChapterEndPhotoDef {
  /** Cle de `src/data/backdrops.ts`. */
  backdrop: string;
  /** Cadets affiches en estompe (ex. Zachary, s'il n'a pas survecu). */
  faded: CharacterId[];
}

/**
 * Une ligne du bilan : le PREMIER cas dont `when` est vrai (ou absent, donc
 * toujours vrai) l'emporte. Une ligne dont aucun cas n'est vrai est omise du
 * resultat -- jamais affichee vide (voir `resolveChapterEnd`).
 */
export interface ChapterEndLineDef {
  label: string;
  cases: { when?: Condition; value: string }[];
}

export interface ChapterEndDef {
  /** Amorce courte au-dessus du titre, ex. « Rapport de nuit ». */
  kicker: string;
  /** Titre du bilan, ex. « Fin du chapitre 2 ». */
  title: string;
  photo?: ChapterEndPhotoDef;
  lines: ChapterEndLineDef[];
  /** Chapitre suivant propose en action primaire (ADR 0022 §2) -- absent en fin du dernier chapitre. */
  next?: ChapterId;
}

export interface ResolvedChapterEndLine {
  label: string;
  value: string;
}

export interface ResolvedChapterEnd {
  kicker: string;
  title: string;
  photo?: ChapterEndPhotoDef;
  lines: ResolvedChapterEndLine[];
  next?: ChapterId;
}

/**
 * Resout `def` contre `ctx` : chaque ligne devient `{ label, value }` du
 * premier cas vrai, ou disparait si aucun ne l'est. Pure -- aucun effet de
 * bord, rejouable a l'identique pour le meme `ctx` (comme `evaluateCondition`
 * dont elle ne fait que s'appuyer).
 */
export function resolveChapterEnd(def: ChapterEndDef, ctx: NarrativeContext): ResolvedChapterEnd {
  const lines: ResolvedChapterEndLine[] = [];
  for (const line of def.lines) {
    const found = line.cases.find((c) => c.when === undefined || evaluateCondition(c.when, ctx));
    if (found) lines.push({ label: line.label, value: found.value });
  }
  return {
    kicker: def.kicker,
    title: def.title,
    photo: def.photo,
    lines,
    next: def.next,
  };
}
