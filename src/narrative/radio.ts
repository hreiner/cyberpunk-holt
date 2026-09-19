/**
 * Couche radio : les repliques de l'instructeur ne sont pas des noeuds de
 * dialogue, elles vivent a part et se declenchent sur seuil de tempo (voir
 * ADR 0011). Le contenu francais vit dans src/data/radio.ts.
 */

import type { Condition } from './types';
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
