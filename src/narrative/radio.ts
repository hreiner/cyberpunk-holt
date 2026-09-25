/**
 * Couche radio : les repliques de l'instructeur ne sont pas des noeuds de
 * dialogue, elles vivent a part et se declenchent sur seuil de tempo (voir
 * ADR 0011). Le contenu francais vit dans src/data/radio.ts.
 */

import type { Condition } from './types';
import type { SfxId } from '@/audio/sfx';
import type { NarrativeContext } from './dialogueRunner';
import type { RunState } from './runState';
import { evaluateCondition } from './conditions';

export interface RadioCue {
  id: string;
  /** Se declenche des que le tempo atteint ce seuil. */
  atTempo: number;
  /** Facultative : restreint la replique a un contexte. */
  when?: Condition;
  text: string;
  /**
   * Canal d'affichage (ADR 0024 §2) : `'radio'` (par defaut) garde l'encart "Instructeur"
   * existant ; `'pression'` n'a pas de locuteur -- une replique de la fuite du chapitre 2
   * ("Des pas, deux couloirs plus loin.") rendue en ligne de narration en dialogue, et en
   * ligne de brief pendant l'exploration (voir `ChapterApp`/`ExploreSession`).
   */
  channel?: 'radio' | 'pression';
  /** Bruitage(s) joues au declenchement (ADR 0024 §2, ex. un tir lointain synthetise). */
  sfx?: SfxId[];
}

/** Repliques echues : tempo atteint, condition vraie, pas deja entendues. */
export function pendingRadio(cues: RadioCue[], ctx: NarrativeContext): RadioCue[] {
  return cues.filter((cue) => {
    if (ctx.run.tempo < cue.atTempo) return false;
    if (ctx.run.heardRadio.includes(cue.id)) return false;
    if (cue.when && !evaluateCondition(cue.when, ctx)) return false;
    return true;
  });
}

export function markHeard(run: RunState, ids: string[]): RunState {
  const merged = new Set([...run.heardRadio, ...ids]);
  return { ...run, heardRadio: [...merged] };
}
