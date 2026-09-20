/**
 * Etapes d'exploration du chapitre 1 (ADR 0013 §4, epic 3 lots 3.6b/3.7b) : cette
 * couche ne touche ni au DOM ni a `three`, donc testable directement dans
 * Node -- contrairement a `ChapterApp` (voir docs/process/TESTING.md), dont
 * le comportement DOM (pas de teleportation, conversation annexe qui
 * n'avance pas le routeur, reprise sur une etape...) est couvert par
 * `tests/e2e/explore.spec.ts`.
 *
 * Regle testee ici en priorite (contrat du lot 3.6b, §3, etendue au lot 3.7b) :
 * "L'entite qui termine l'objectif porte le dialogue" -- soit celui de la scene
 * SUIVANTE (holt.ts : le declencheur ne joue rien lui-meme, ex. "cantine.place-franklyn"),
 * soit SON PROPRE dialogue quand il porte un noeud different du defaut de la
 * scene suivante (centre-examen.ts : ex. "salle1.panneau-porte" joue ch1.salle1
 * depuis "arrivee", ce N'EST PAS le dialogueId de "ch1.salle2"). Un
 * declencheur sans dialogue du tout (ex. "hall.instructeur") fait simplement
 * avancer vers une nouvelle scene `explore` (pas de contenu a montrer).
 * Le passage au combat (cour.portail -> ch1.affrontement) est un cas a part :
 * pas de dialogue, un tampon "CONTACT" (voir `ChapterApp.completeExploreScene`).
 */

import { describe, expect, it } from 'vitest';
import { CHAPTER_1_SCENES, TIRAGE_SCENE_ID, createRunState, exploreFollowerIds, withEtape } from '@/narrative';
import type { NarrativeContext, RunState, SceneDef } from '@/narrative';
import { createDossier } from '@/core/dossier';
import { getMap } from '@/data/maps';
import { hasDialogue, DIALOGUES } from '@/data/dialogues/registry';

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

  it.each(exploreScenes)('"$id" : le point d’apparition existe sur sa carte', (scene) => {
    const map = getMap(scene.mapId as string);
    expect(map.spawns[scene.spawn as string], `spawn "${scene.spawn}" introuvable sur "${map.id}"`).toBeDefined();
  });

  /**
   * LA regle du contrat, etendue au lot 3.7b (voir l'en-tete du fichier) :
   * - si le declencheur porte un dialogueId EGAL a celui de la scene suivante
   *   (holt.ts), c'est cette scene suivante ("dialogue") qui le joue depuis son
   *   propre depart -- le declencheur ne montre rien lui-meme ;
   * - si le declencheur porte un dialogueId, mais que la scene suivante n'a pas
   *   ce dialogueId (centre-examen.ts : la scene suivante est une autre etape
   *   `explore`, ou le combat), c'est que le declencheur joue SON PROPRE
   *   dialogue avant d'avancer (`ChapterApp.handleExploreInteraction`,
   *   `advancesRouter`) -- on verifie alors que ce dialogue et son noeud de
   *   depart existent bel et bien ;
   * - si le declencheur ne porte aucun dialogueId (ex. hall.instructeur), la
   *   scene suivante doit etre une autre scene `explore` (rien a montrer) ;
   * - cas a part : la cour (cour.portail) mene au combat tactique, pas a un
   *   dialogue -- exclue de cette regle, couverte par son propre test plus bas.
   */
  it.each(exploreScenes.filter((s) => s.id !== 'ch1.cour'))(
    'l’entité qui termine l’objectif de "$id" porte (ou avance vers) le bon dialogue',
    (scene) => {
      const map = getMap(scene.mapId as string);
      const triggerId = scene.objective?.completionTrigger;
      const entity = map.entities.find((e) => e.id === triggerId);
      expect(entity, `entité "${triggerId}" (completionTrigger de "${scene.id}") introuvable sur "${map.id}"`).toBeDefined();

      const next = sceneAfter(scene);
      const entityDialogueId =
        entity && 'dialogueId' in entity
          ? (entity as { dialogueId?: string; startNode?: string }).dialogueId
          : undefined;

      if (!entityDialogueId) {
        // Rien a montrer (ex. hall.instructeur) : la scene suivante continue simplement l'exploration.
        expect(next.kind, `"${triggerId}" n'a pas de dialogueId : "${next.id}" devrait être "explore"`).toBe(
          'explore',
        );
        return;
      }

      if (next.kind === 'dialogue' && entityDialogueId === next.dialogueId) {
        return; // Contrat du lot 3.6b : le declencheur documente le dialogueId de la scene suivante.
      }

      // Sinon (lot 3.7b) : le declencheur joue SON PROPRE dialogue avant d'avancer.
      expect(hasDialogue(entityDialogueId), `dialogue "${entityDialogueId}" ("${triggerId}") introuvable`).toBe(true);
      const startNode = (entity as { startNode?: string } | undefined)?.startNode;
      if (startNode) {
        expect(
          startNode in (DIALOGUES[entityDialogueId]?.nodes ?? {}),
          `nœud "${startNode}" introuvable dans "${entityDialogueId}" (entité "${triggerId}")`,
        ).toBe(true);
      }
    },
  );

  it('la cour (cour.portail) mène au combat tactique, pas à un dialogue', () => {
    const scene = exploreScenes.find((s) => s.id === 'ch1.cour');
    expect(scene, 'scène "ch1.cour" introuvable').toBeDefined();
    if (!scene) return;
    const map = getMap(scene.mapId as string);
    const triggerId = scene.objective?.completionTrigger;
    const entity = map.entities.find((e) => e.id === triggerId);
    expect(entity, `entité "${triggerId}" introuvable`).toBeDefined();
    expect(entity?.type).toBe('zone'); // pas de dialogueId possible pour ce type (src/explore/types.ts)
    expect(sceneAfter(scene).kind).toBe('tactical');
  });

  it.each(exploreScenes)('"$id" : les entités des facultatifs existent bien sur sa carte', (scene) => {
    const map = getMap(scene.mapId as string);
    for (const task of scene.objective?.tasks ?? []) {
      for (const entityId of task.entityIds) {
        expect(
          map.entities.some((e) => e.id === entityId),
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
