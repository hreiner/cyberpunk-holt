/**
 * Étapes d'exploration du chapitre 2 (lot 5.8, `ch2.bal` et `ch2.fuite` -- ADR 0024,
 * TECH-DESIGN §4.4/§6 "Lot 5.8"). Même règle que `tests/unit/sceneRouterExplore.test.ts` pour
 * le chapitre 1 (« l'entité qui termine l'objectif porte le dialogue » -- contrat du lot
 * 3.6b/3.7b), réécrite ici pour `CHAPTER_2.scenes` plutôt que d'étendre le fichier du
 * chapitre 1 : ce dernier est explicitement scopé "chapitre 1" (titre, commentaires, données)
 * et n'est pas dans la liste "Toucher" de ce lot -- un fichier séparé, même structure, est
 * moins risqué qu'un remaniement du test existant pour le rendre générique aux deux chapitres.
 *
 * C'est ce fichier qui tient lieu du « `tests/unit/exploreScenes.test.ts` (existant) » cité
 * par TECH-DESIGN §6 "Lot 5.8, Fini quand" -- aucun fichier de ce nom exact n'existe dans ce
 * dépôt ; l'équivalent réel, pour le chapitre 1, est `sceneRouterExplore.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { CHAPTER_2 } from '@/data/chapters/ch2';
import { getMap } from '@/data/maps';
import { hasDialogue, DIALOGUES } from '@/data/dialogues/registry';
import type { SceneDef } from '@/narrative';
import { evaluateCondition, withEtape } from '@/narrative';
import { createDossier } from '@/core/dossier';
import { createRunState } from '@/narrative/runState';
import { ExploreMap, computeReach } from '@/explore';
import type { Cell, EntityDef } from '@/explore';

const exploreScenes = CHAPTER_2.scenes.filter((s) => s.kind === 'explore');

/**
 * `indexOf` (égalité de référence), pas `findIndex` sur l'id : depuis le retour de
 * l'orchestrateur (lot 5.8), `ch2.fuite` a deux `SceneDef` jumelles qui PARTAGENT leur id
 * (TECH-DESIGN §4.4, gardées par `when` sur `ch2.porteur`) -- `findIndex(s => s.id === ...)`
 * retomberait toujours sur la première des deux, quelle que soit celle réellement passée ici.
 */
function sceneAfter(scene: SceneDef): SceneDef {
  const idx = CHAPTER_2.scenes.indexOf(scene);
  const next = CHAPTER_2.scenes[idx + 1];
  if (!next) throw new Error(`Aucune scene apres "${scene.id}".`);
  return next;
}

describe('étapes d’exploration du chapitre 2 (CHAPTER_2.scenes, lot 5.8)', () => {
  it('porte au moins deux étapes explore (le bal, la fuite -- sinon ce test ne teste rien)', () => {
    expect(exploreScenes.length).toBeGreaterThanOrEqual(2);
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

  /** Carte attendue par scène (TECH-DESIGN §4.4) : le bal et la fuite sur `holt-nuit`, le campement sur la sienne. */
  const EXPECTED_MAP: Record<string, string> = {
    'ch2.bal': 'holt-nuit',
    'ch2.fuite': 'holt-nuit',
    'ch2.conduits': 'conduits',
    'ch2.cantine': 'conduits',
    'ch2.campement': 'campement',
  };

  it.each(exploreScenes)('"$id" se joue sur la carte de TECH-DESIGN §4.4', (scene) => {
    expect(EXPECTED_MAP[scene.id], `${scene.id} : scène explore absente de la table`).toBeDefined();
    expect(scene.mapId).toBe(EXPECTED_MAP[scene.id]);
  });

  /**
   * Toute entité d'une carte à étapes du chapitre 2 est conditionnée à UNE étape : sans quoi une
   * entité d'une scène apparaîtrait dans une autre (défaut réel du lot 5.8, les figurants du bal
   * restés plantés pendant la fuite). Et chaque étape jouée sur la carte y trouve bien son
   * déclencheur -- jamais une étape dont l'objectif vise une entité absente à cette étape.
   */
  it.each(exploreScenes)('"$id" : le déclencheur est gardé par la même étape que la scène', (scene) => {
    const map = getMap(scene.mapId as string);
    const trigger = map.entities.find((e) => e.id === scene.objective?.completionTrigger);
    expect(trigger?.condition).toEqual({ flag: CHAPTER_2.etapeFlag, equals: scene.etape });
    for (const entity of map.entities) {
      expect(entity.condition, `${map.id}/${entity.id} : entité sans condition d'étape`).toBeDefined();
    }
  });

  /** Même règle que `sceneRouterExplore.test.ts` (voir son en-tête) -- résumée ici. */
  it.each(exploreScenes)(
    'l’entité qui termine l’objectif de "$id" porte (ou avance vers) le bon dialogue',
    (scene) => {
      const map = getMap(scene.mapId as string);
      const triggerId = scene.objective?.completionTrigger;
      const entity = map.entities.find((e) => e.id === triggerId);
      expect(entity, `entité "${triggerId}" (completionTrigger de "${scene.id}") introuvable sur "${map.id}"`).toBeDefined();

      const next = sceneAfter(scene);
      const entityDialogueId =
        entity && 'dialogueId' in entity ? (entity as { dialogueId?: string }).dialogueId : undefined;

      if (!entityDialogueId) {
        expect(next.kind, `"${triggerId}" n'a pas de dialogueId : "${next.id}" devrait être "explore"`).toBe(
          'explore',
        );
        return;
      }

      if (next.kind === 'dialogue' && entityDialogueId === next.dialogueId) {
        return; // Contrat du lot 3.6b : le déclencheur documente le dialogueId de la scène suivante.
      }

      // Sinon (lot 3.7b) : le déclencheur joue SON PROPRE dialogue avant d'avancer.
      expect(hasDialogue(entityDialogueId), `dialogue "${entityDialogueId}" ("${triggerId}") introuvable`).toBe(true);
      const startNode = (entity as { startNode?: string } | undefined)?.startNode;
      if (startNode) {
        expect(
          startNode in (DIALOGUES[entityDialogueId]?.nodes ?? {}),
          `nœud "${startNode}" introuvable dans "${entityDialogueId}"`,
        ).toBe(true);
      }
    },
  );

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

  it('"ch2.campement" : John et Grover visibles en tête, Letitia portée hors champ (TECH-DESIGN §4.4)', () => {
    const campement = exploreScenes.find((s) => s.id === 'ch2.campement');
    expect(campement?.followers?.slice(0, 2)).toEqual(['john', 'grover']);
    expect(campement?.followers).not.toContain('letitia');
    expect(campement?.followers).not.toContain('zachary');
  });

  it('"ch2.conduits" suit le porteur comme la fuite ; "ch2.cantine" montre l’enfant en tête (lot 5.9)', () => {
    const conduits = exploreScenes.filter((s) => s.id === 'ch2.conduits');
    const fuite = exploreScenes.filter((s) => s.id === 'ch2.fuite');
    expect(conduits.map((s) => [s.when, s.followers])).toEqual(fuite.map((s) => [s.when, s.followers]));
    const cantine = exploreScenes.find((s) => s.id === 'ch2.cantine');
    expect(cantine?.followers?.[0]).toBe('enfant');
    // Même carte, deux étapes qui se suivent : la cantine ne se reconstruit pas, Franklyn y
    // arrive depuis le dortoir des petits -- la porte qui les sépare est ouverte par l'enfant.
    const map = getMap('conduits');
    const enfant = map.entities.find((e) => e.id === 'petits.enfant');
    expect(enfant && 'opensDoorAfterDialogue' in enfant ? enfant.opensDoorAfterDialogue : undefined).toBe('petits.porte-cantine');
  });

  it('"ch2.bal" ne déclare aucun suiveur (la bande est déjà placée dans la salle par ses entités)', () => {
    const bal = exploreScenes.find((s) => s.id === 'ch2.bal');
    expect(bal?.followers).toEqual([]);
  });

  it(
    '"ch2.fuite" a deux SceneDef jumelles (le porteur, retour de l\'orchestrateur lot 5.8) : ' +
      'Letitia et le porteur en tête (B9)',
    () => {
      const fuiteTwins = exploreScenes.filter((s) => s.id === 'ch2.fuite');
      expect(fuiteTwins).toHaveLength(2);
      for (const twin of fuiteTwins) {
        expect(twin.followers?.length, `${JSON.stringify(twin.when)}`).toBeGreaterThanOrEqual(3);
        expect(twin.followers?.[0]).toBe('letitia'); // le reste du groupe, dit par la narration
      }
      const john = fuiteTwins.find((s) => JSON.stringify(s.when) === JSON.stringify({ flag: 'ch2.porteur', equals: 'john' }));
      const abigail = fuiteTwins.find(
        (s) => JSON.stringify(s.when) === JSON.stringify({ flag: 'ch2.porteur', equals: 'abigail' }),
      );
      expect(john?.followers?.[1]).toBe('john');
      expect(abigail?.followers?.[1]).toBe('abigail');
    },
  );

  /**
   * Décision du propriétaire (2026-09-26) : le tempo pèse par les CHOIX, jamais par le chemin. Toute
   * zone qui fait avancer le tempo est incontournable : sur le plan, l'aire de la zone bouchée, le
   * déclencheur de l'objectif devient inatteignable depuis le point d'apparition. Portes : franchissables
   * de principe (elles peuvent s'ouvrir), sauf celles qui restent verrouillées pour de bon (aucune
   * entité ne les ouvre -- les portes fermées par le feu de la fuite). Même calcul que le simulateur
   * (`scripts/simulate-ch2.ts`, `zoneIsMandatory`).
   */
  describe('aucun chemin de l’apparition au déclencheur n’évite une zone de tempo', () => {
    function tempoZones(scene: SceneDef): Array<Extract<EntityDef, { type: 'zone' }>> {
      const ctx = withEtape(
        { dossier: createDossier(), run: createRunState('ch2ExploreScenes::zones', { chapter: 2, sceneId: scene.id, luck: 0 }) },
        scene,
        CHAPTER_2.etapeFlag,
      );
      return getMap(scene.mapId as string).entities.filter(
        (e): e is Extract<EntityDef, { type: 'zone' }> =>
          e.type === 'zone' &&
          (!e.condition || evaluateCondition(e.condition, ctx)) &&
          (e.effects ?? []).some((effect) => 'tempo' in effect),
      );
    }

    it('la fuite porte bien ses trois zones de tempo (sinon la propriété ne prouve rien)', () => {
      const fuite = exploreScenes.find((s) => s.id === 'ch2.fuite') as SceneDef;
      expect(tempoZones(fuite)).toHaveLength(3);
    });

    const cases = exploreScenes.flatMap((scene) => tempoZones(scene).map((zone) => ({ scene, zone, label: `${scene.id} / ${zone.id}` })));
    it.each(cases)('$label : incontournable', ({ scene, zone }) => {
      const def = getMap(scene.mapId as string);
      const map = new ExploreMap(def);
      const opened = new Set(def.entities.flatMap((e) => ('opensDoorAfterDialogue' in e && e.opensDoorAfterDialogue ? [e.opensDoorAfterDialogue] : [])));
      const triggerId = scene.objective?.completionTrigger;
      const sealed = new Set(
        def.entities
          .filter((e) => e.type === 'door' && e.locked && !opened.has(e.id) && e.id !== triggerId)
          .map((e) => `${e.cell.x},${e.cell.y}`),
      );
      const { origin, width, height } = zone.area;
      const inZone = (c: Cell) => c.x >= origin.x && c.x < origin.x + width && c.y >= origin.y && c.y < origin.y + height;
      const walkable = (c: Cell) => {
        const kind = map.kindAt(c);
        return (kind === 'floor' || kind === 'door') && !sealed.has(`${c.x},${c.y}`);
      };
      const spawn = def.spawns[scene.spawn as string] as Cell;
      const trigger = def.entities.find((e) => e.id === triggerId) as EntityDef;
      // Témoin : sans la zone bouchée, le déclencheur est bien atteignable.
      expect(computeReach(map, spawn, walkable).costs.has(`${trigger.cell.x},${trigger.cell.y}`)).toBe(true);
      const avoiding = computeReach(map, spawn, (c) => !inZone(c) && walkable(c));
      expect(avoiding.costs.has(`${trigger.cell.x},${trigger.cell.y}`), `un chemin évite ${zone.id}`).toBe(false);
    });

    /**
     * Correctif du lot 5.9 : pendant la fuite, le dortoir ne s'atteint QUE par sa grille -- plus de
     * porte sans entité au sud (cour intérieure, cantine) qui y mènerait sans passer la grille ni
     * les zones. Portes verrouillées : infranchissables ; la grille ouverte, le dortoir est atteint.
     */
    it('fuite : le dortoir ne s’atteint que par la grille', () => {
      const def = getMap('holt-nuit');
      const map = new ExploreMap(def);
      const dortoirs = def.rooms.find((r) => r.id === 'dortoirs');
      expect(dortoirs).toBeDefined();
      const { origin, width, height } = dortoirs!.rect;
      const inDortoir = (key: string) => {
        const [x, y] = key.split(',').map(Number) as [number, number];
        return x >= origin.x && x < origin.x + width && y >= origin.y && y < origin.y + height;
      };
      const locked = new Map(def.entities.filter((e) => e.type === 'door' && e.locked).map((e) => [`${e.cell.x},${e.cell.y}`, e.id]));
      const reachFrom = (openDoorId?: string) =>
        computeReach(map, def.spawns.fuite as Cell, (c) => {
          const kind = map.kindAt(c);
          const door = locked.get(`${c.x},${c.y}`);
          return (kind === 'floor' || kind === 'door') && (!door || door === openDoorId);
        });
      expect([...reachFrom().costs.keys()].some(inDortoir), 'le dortoir est atteignable sans la grille').toBe(false);
      expect([...reachFrom('dortoir.grille').costs.keys()].some(inDortoir), 'témoin : la grille ouverte y mène').toBe(true);
    });
  });
});
