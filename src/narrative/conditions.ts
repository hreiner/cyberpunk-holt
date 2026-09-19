/**
 * Evaluation des conditions du format de dialogue (visibilite des choix,
 * scenes sautees, repliques radio conditionnees).
 */

import type { CharacterId } from '@/rules/character';
import type { Condition } from './types';
import type { NarrativeContext } from './dialogueRunner';

export function evaluateCondition(cond: Condition, ctx: NarrativeContext): boolean {
  if ('not' in cond) return !evaluateCondition(cond.not, ctx);
  if ('all' in cond) return cond.all.every((c) => evaluateCondition(c, ctx));
  if ('any' in cond) return cond.any.some((c) => evaluateCondition(c, ctx));
  if ('flag' in cond) return evaluateFlag(cond, ctx);
  if ('tag' in cond) return ctx.dossier.tags.includes(cond.tag);
  if ('affinity' in cond) return evaluateAffinity(cond, ctx);
  return false;
}

export function evaluateAll(conds: Condition[], ctx: NarrativeContext): boolean {
  return conds.every((c) => evaluateCondition(c, ctx));
}

function evaluateFlag(cond: Extract<Condition, { flag: string }>, ctx: NarrativeContext): boolean {
  const value = ctx.run.flags[cond.flag];
  if (cond.equals !== undefined) return value === cond.equals;
  if (cond.atLeast !== undefined) return typeof value === 'number' && value >= cond.atLeast;
  return value !== undefined;
}

function evaluateAffinity(
  cond: Extract<Condition, { affinity: CharacterId }>,
  ctx: NarrativeContext,
): boolean {
  const value = ctx.dossier.affinities[cond.affinity] ?? 0;
  if (cond.atLeast !== undefined && value < cond.atLeast) return false;
  if (cond.atMost !== undefined && value > cond.atMost) return false;
  return true;
}
