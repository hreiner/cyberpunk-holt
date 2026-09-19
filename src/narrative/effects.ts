/**
 * Application des effets du format de dialogue. Purs : renvoient un nouveau
 * NarrativeContext, ne modifient jamais celui recu. Voir ADR 0011 pour la
 * repartition Dossier (persistant) / RunState (volatil).
 */

import { addEntry, addTags, adjustAffinity, setWrittenScore } from '@/core/dossier';
import type { Effect } from './types';
import type { NarrativeContext } from './dialogueRunner';
import { addTempo, applyTeamEffect, bumpCounter, setFlag } from './runState';

/** Chapitre courant : le narratif de l'epic 2 ne concerne que le chapitre 1. */
const NARRATIVE_CHAPTER = 1;

/** Equipe du joueur au chapitre 1 (voir DEFAULT_BLUE dans src/tactical/combat.ts). */
const PLAYER_TEAM = 'blue' as const;

export function applyEffect(effect: Effect, ctx: NarrativeContext): NarrativeContext {
  if ('affinity' in effect) {
    // Le bornage [-3, +3] est deja porte par adjustAffinity.
    return { ...ctx, dossier: adjustAffinity(ctx.dossier, effect.affinity.who, effect.affinity.delta) };
  }
  if ('tag' in effect) {
    return { ...ctx, dossier: addTags(ctx.dossier, [effect.tag]) };
  }
  if ('entry' in effect) {
    return { ...ctx, dossier: addEntry(ctx.dossier, { ...effect.entry, chapter: NARRATIVE_CHAPTER }) };
  }
  if ('flag' in effect) {
    return { ...ctx, run: setFlag(ctx.run, effect.flag, effect.value) };
  }
  if ('counter' in effect) {
    return { ...ctx, run: bumpCounter(ctx.run, effect.counter, effect.delta) };
  }
  if ('tempo' in effect) {
    return { ...ctx, run: addTempo(ctx.run, effect.tempo) };
  }
  if ('team' in effect) {
    return { ...ctx, run: applyTeamEffect(ctx.run, PLAYER_TEAM, effect.team) };
  }
  if ('writtenScore' in effect) {
    // Lit le compteur pose par les choix `best` (voir ch1.exam.json) : un
    // compteur jamais incremente vaut 0, jamais un crash (ADR 0012).
    const raw = ctx.run.flags[effect.writtenScore.counterKey];
    const correct = typeof raw === 'number' ? raw : 0;
    return { ...ctx, dossier: setWrittenScore(ctx.dossier, { correct, total: effect.writtenScore.total }) };
  }
  return ctx;
}

export function applyEffects(effects: Effect[], ctx: NarrativeContext): NarrativeContext {
  return effects.reduce((acc, effect) => applyEffect(effect, acc), ctx);
}
