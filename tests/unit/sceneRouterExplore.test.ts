/**
 * Etapes d'exploration du chapitre 1 (ADR 0013 §4, epic 3 lot 3.6b) : cette
 * couche ne touche ni au DOM ni a `three`, donc testable directement dans
 * Node -- contrairement a `ChapterApp` (voir docs/process/TESTING.md), dont
 * le comportement DOM (pas de teleportation, conversation annexe qui
 * n'avance pas le routeur, reprise sur une etape...) est couvert par
 * `tests/e2e/explore.spec.ts`.
 *
 * Regle testee ici en priorite (contrat du lot, §3) : "L'entite qui termine
 * l'objectif porte le dialogueId de la scene SUIVANTE."
 */

import { describe, expect, it } from 'vitest';
import { CHAPTER_1_SCENES, TIRAGE_SCENE_ID, createRunState, exploreFollowerIds, withEtape } from '@/narrative';
import type { NarrativeContext, RunState, SceneDef } from '@/narrative';
import { createDossier } from '@/core/dossier';
import { HOLT_MAP } from '@/data/maps/holt';

function baseCtx(run: RunState = createRunState('scene-router-explore')): NarrativeContext {
  return { dossier: createDossier(), run };
}

const exploreScenes = CHAPTER_1_SCENES.filter((s) => s.kind === 'explore');

function sceneAfter(scene: SceneDef): SceneDef {
  const idx = CHAPTER_1_SCENES.findIndex((s) => s.id === scene.id);
  const next = CHAPTER_1_SCENES[idx + 1];
  if (!next) throw new Error(`Aucune scene apres "${scene.id}" (le chapitre se termine sur une scene explore ?)`);
  return next;
}

describe('etapes d’exploration du chapitre 1 (CHAPTER_1_SCENES)', () => {
  it('porte au moins une etape explore (sinon ce test ne teste rien)', () => {
    expect(exploreScenes.length).toBeGreaterThan(0);
  });

  it.each(exploreScenes)('"$id" porte mapId, spawn, etape et objectif complets', (scene) => {
    expect(scene.mapId, `${scene.id} : mapId manquant`).toBeTruthy();
    expect(scene.spawn, `${scene.id} : spawn manquant`).toBeTruthy();
    expect(scene.etape, `${scene.id} : etape manquante`).toBeTruthy();
    expect(scene.objective, `${scene.id} : objectif manquant`).toBeTruthy();
    expect(scene.objective?.title.length ?? 0, `${scene.id} : titre d'objectif vide`).toBeGreaterThan(0);
    expect(scene.objective?.context.length ?? 0, `${scene.id} : contexte d'objectif vide`).toBeGreaterThan(0);
    expect(scene.objective?.completionTrigger, `${scene.id} : completionTrigger manquant`).toBeTruthy();
  });

  it.each(exploreScenes)('"$id" : le point d’apparition existe sur sa carte (HOLT_MAP)', (scene) => {
    expect(scene.mapId).toBe('holt');
    expect(HOLT_MAP.spawns[scene.spawn as string], `spawn "${scene.spawn}" introuvable`).toBeDefined();
  });

  /**
   * LA regle du contrat (§3) : l'entite qui termine l'objectif porte le
   * dialogueId de la scene qui suit CETTE etape dans CHAPTER_1_SCENES --
   * jamais son propre dialogue, c'est la scene suivante qui le joue.
   */
  it.each(exploreScenes)(
    'l’entité qui termine l’objectif de "$id" porte le dialogueId de la scène suivante',
    (scene) => {
      const triggerId = scene.objective?.completionTrigger;
      const entity = HOLT_MAP.entities.find((e) => e.id === triggerId);
      expect(entity, `entité "${triggerId}" (completionTrigger de "${scene.id}") introuvable sur HOLT_MAP`).toBeDefined();
      expect('dialogueId' in (entity as never), `l'entité "${triggerId}" ne porte pas de dialogueId`).toBe(true);

      const next = sceneAfter(scene);
      expect(next.kind, `la scène qui suit "${scene.id}" ("${next.id}") n'est pas une scène "dialogue"`).toBe(
        'dialogue',
      );
      const entityDialogueId = (entity as { dialogueId?: string } | undefined)?.dialogueId;
      expect(
        entityDialogueId,
        `"${triggerId}" porte le dialogueId "${entityDialogueId}", attendu "${next.dialogueId}" (dialogueId de "${next.id}")`,
      ).toBe(next.dialogueId);
    },
  );

  it.each(exploreScenes)('"$id" : les entités des facultatifs existent bien sur HOLT_MAP', (scene) => {
    for (const task of scene.objective?.tasks ?? []) {
      for (const entityId of task.entityIds) {
        expect(
          HOLT_MAP.entities.some((e) => e.id === entityId),
          `tâche "${task.id}" (${scene.id}) référence l'entité inconnue "${entityId}"`,
        ).toBe(true);
      }
    }
  });

  it('le drapeau ch1.etape est posé à l’entrée de chaque étape (withEtape)', () => {
    for (const scene of exploreScenes) {
      const ctx = withEtape(baseCtx(), scene);
      expect(ctx.run.flags['ch1.etape'], `withEtape("${scene.id}")`).toBe(scene.etape);
    }
  });

  it('withEtape ne touche pas au contexte pour une scène sans étape (dialogue, tactique)', () => {
    const nonExplore = CHAPTER_1_SCENES.filter((s) => s.kind !== 'explore');
    expect(nonExplore.length).toBeGreaterThan(0);
    for (const scene of nonExplore) {
      const before = baseCtx();
      const after = withEtape(before, scene);
      expect(after).toBe(before); // même référence : aucun effet
    }
  });

  it('Franklyn est seul avant le tirage (exploreFollowerIds)', () => {
    const beforeDraft = CHAPTER_1_SCENES.slice(0, CHAPTER_1_SCENES.findIndex((s) => s.id === TIRAGE_SCENE_ID));
    expect(beforeDraft.some((s) => s.kind === 'explore')).toBe(true);
    for (const scene of beforeDraft.filter((s) => s.kind === 'explore')) {
      const run = { ...createRunState('seule'), sceneId: scene.id };
      expect(exploreFollowerIds(run), `${scene.id}`).toEqual([]);
    }
  });

  it('les deux coéquipiers du tirage suivent Franklyn après le tirage (exploreFollowerIds)', () => {
    const run: RunState = {
      ...createRunState('coequipiers'),
      sceneId: 'ch1.hub',
      roster: { blue: ['franklyn', 'john', 'letitia'], red: ['abigail', 'grover', 'zachary'], redCaptain: 'abigail' },
    };
    expect(exploreFollowerIds(run)).toEqual(['john', 'letitia']);
  });
});
