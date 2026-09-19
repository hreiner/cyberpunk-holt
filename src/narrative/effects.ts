/**
 * Application des effets du format de dialogue. Purs : renvoient un nouveau
 * NarrativeContext, ne modifient jamais celui recu. Voir ADR 0011 pour la
 * repartition Dossier (persistant) / RunState (volatil).
 */

import { addEntry, addTags, adjustAffinity, setWrittenScore } from '@/core/dossier';
import type { CharacterId } from '@/rules/character';
import type { Effect, TeamAlias, TeamEffect } from './types';
import type { NarrativeContext } from './dialogueRunner';
import type { ResolvedTeamEffect } from './runState';
import { addTempo, applyTeamEffect, bumpCounter, setFlag } from './runState';
import { isTeamAlias, resolveTeamAlias } from './aliases';

/** Resout un `who`/`gassed` TOUJOURS defini (jamais optionnel) : `affinity.who` et `team.gassed` le sont dans le format. */
function resolveMember(who: CharacterId | TeamAlias, ctx: NarrativeContext): CharacterId {
  return isTeamAlias(who) ? resolveTeamAlias(who, ctx.run) : who;
}

/** Chapitre courant : le narratif de l'epic 2 ne concerne que le chapitre 1. Reutilise par dialogueRunner.ts (Chance, ADR 0015). */
export const NARRATIVE_CHAPTER = 1;

/** Equipe du joueur au chapitre 1 (voir DEFAULT_BLUE dans src/tactical/combat.ts). */
const PLAYER_TEAM = 'blue' as const;

/** Resout un alias d'equipe (`equipier1`...) dans `effect.team` avant de le confier a `applyTeamEffect` (ADR 0014 §7). */
function resolveTeamEffectAliases(effect: TeamEffect, ctx: NarrativeContext): ResolvedTeamEffect {
  if (!('gassed' in effect)) return effect;
  return { gassed: resolveMember(effect.gassed, ctx) };
}

export function applyEffect(effect: Effect, ctx: NarrativeContext): NarrativeContext {
  if ('affinity' in effect) {
    const who = resolveMember(effect.affinity.who, ctx);
    // Le bornage [-3, +3] est deja porte par adjustAffinity.
    return { ...ctx, dossier: adjustAffinity(ctx.dossier, who, effect.affinity.delta) };
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
    return { ...ctx, run: applyTeamEffect(ctx.run, PLAYER_TEAM, resolveTeamEffectAliases(effect.team, ctx)) };
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
