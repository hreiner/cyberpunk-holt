/**
 * Gardien du contenu du chapitre 2 (lot 5.5, docs/chapters/ch2/TECH-DESIGN.md §6 "Lot 5.5").
 *
 * Trois propriétés GLOBALES, qui balaient tous les fichiers de dialogue du chapitre 2 via
 * `DIALOGUES` (registre) et `CHAPTER_2.scenes` (numéro de scène) -- pas des assertions
 * ponctuelles sur `ch2.egouts.json` -- pour que les lots suivants (5.6+) les étendent sans
 * réécrire ce fichier :
 *
 * 1. Après `ch2.egouts` (scène 7, la mort de Zachary), aucun dialogue d'une scène postérieure
 *    ne le fait parler ni lancer de jet (TECH-DESIGN §1, réponse à la question 1 de
 *    GAME-DESIGN §10).
 * 2. Le compteur `ch2.letitia.etat` reste dans [0, 3] : vérifié structurellement -- tout effet
 *    `counter` qui le touche, dans n'importe quel fichier, borne explicitement `min: 0` et
 *    `max: 3` (ADR 0023 §4.3) ; le moteur (`applyEffects`, `src/narrative/effects.ts`) clampe
 *    APRÈS le delta, donc cette garantie sur les données suffit à garantir la propriété en jeu,
 *    quel que soit l'ordre ou le nombre de scènes qui l'utilisent.
 * 3. L'étiquette `abigail-brisee` n'est posée que par le dialogue de la scène 8 (`ch2.adieu`).
 *
 * Un quatrième test, ponctuel cette fois (pas une propriété globale : il porte sur un choix
 * précis de la scène 3), garde la lisibilité du prix annoncé par GAME-DESIGN §4 (scène 3) :
 * "plaquer Letitia" est une blessure moins grave que "crier pour tous". Si un lot futur modifie
 * `ch2.slow.json` au point d'égaliser les deux états, ce test le signale.
 */

import { describe, expect, it } from 'vitest';
import { createDossier } from '@/core/dossier';
import { createRng } from '@/core/rng';
import { createRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import { DIALOGUES } from '@/data/dialogues/registry';
import { CHAPTER_2 } from '@/data/chapters/ch2';
import type { DialogueChoice, DialogueFile, DialogueNode, Effect } from '@/narrative/types';

const EGOUTS_DIALOGUE_ID = 'ch2.egouts';
const LETITIA_COUNTER = 'ch2.letitia.etat';
const LETITIA_MIN = 0;
const LETITIA_MAX = 3;
const ABIGAIL_BRISEE_TAG = 'abigail-brisee';
const ABIGAIL_BRISEE_SCENE_DIALOGUE_ID = 'ch2.adieu';

/** Numéro de scène (TECH-DESIGN §4.4) d'un `dialogueId`, via le registre de scènes du chapitre. */
function sceneNumberOf(dialogueId: string): number | undefined {
  const scene = CHAPTER_2.scenes.find((s) => (s.dialogueId ?? s.id) === dialogueId);
  return scene?.number;
}

/** Tous les fichiers de dialogue du chapitre 2 (préfixe `ch2.`), avec leur numéro de scène. */
function ch2Files(): Array<{ id: string; file: DialogueFile; number: number | undefined }> {
  return Object.entries(DIALOGUES)
    .filter(([id]) => id.startsWith('ch2.'))
    .map(([id, file]) => ({ id, file: file as DialogueFile, number: sceneNumberOf(id) }));
}

function allChoices(file: DialogueFile): DialogueChoice[] {
  return Object.values(file.nodes).flatMap((node: DialogueNode) => node.choices ?? []);
}

function allEffects(file: DialogueFile): Effect[] {
  const fromNodes = Object.values(file.nodes).flatMap((node: DialogueNode) => node.effects ?? []);
  const fromChoices = allChoices(file).flatMap((c) => [
    ...(c.effects ?? []),
    ...(c.successEffects ?? []),
    ...(c.failureEffects ?? []),
  ]);
  return [...fromNodes, ...fromChoices];
}

describe('chapitre 2 (lot 5.5) : garde de contenu', () => {
  const egoutsNumber = sceneNumberOf(EGOUTS_DIALOGUE_ID);
  it('ch2.egouts est bien enregistré avec un numéro de scène (préalable des autres tests)', () => {
    expect(egoutsNumber, 'CHAPTER_2.scenes doit contenir ch2.egouts').toBeDefined();
  });

  describe('Zachary ne parle plus et ne lance plus de jet après ch2.egouts', () => {
    const laterFiles = ch2Files().filter(
      ({ number }) => egoutsNumber !== undefined && number !== undefined && number > egoutsNumber,
    );

    it('au moins une scène postérieure à ch2.egouts existe (sinon ce test ne prouve rien)', () => {
      expect(laterFiles.length).toBeGreaterThan(0);
    });

    it.each(laterFiles.map(({ id }) => id))('%s : aucune réplique, aucun jet de/par zachary', (id) => {
      const { file } = laterFiles.find((f) => f.id === id) as { file: DialogueFile };

      for (const node of Object.values(file.nodes)) {
        for (const line of node.lines ?? []) {
          expect(line.who, `${id} : une réplique de zachary après ch2.egouts`).not.toBe('zachary');
        }
        if (node.insight) {
          expect(node.insight.who, `${id} : un jet de réflexion de zachary après ch2.egouts`).not.toBe('zachary');
        }
      }
      for (const choice of allChoices(file)) {
        if (choice.check) {
          expect(choice.check.who, `${id} : un jet de zachary après ch2.egouts`).not.toBe('zachary');
        }
      }
    });
  });

  describe(`le compteur ${LETITIA_COUNTER} reste dans [${LETITIA_MIN}, ${LETITIA_MAX}] sur tout chemin`, () => {
    const files = ch2Files();

    it.each(files.map(({ id }) => id))('%s : tout effet counter sur ce compteur est borné [0, 3]', (id) => {
      const { file } = files.find((f) => f.id === id) as { file: DialogueFile };
      for (const effect of allEffects(file)) {
        if ('counter' in effect && effect.counter === LETITIA_COUNTER) {
          expect(effect.min, `${id} : effet sur ${LETITIA_COUNTER} sans borne min`).toBe(LETITIA_MIN);
          expect(effect.max, `${id} : effet sur ${LETITIA_COUNTER} sans borne max`).toBe(LETITIA_MAX);
        }
      }
    });
  });

  describe(`"${ABIGAIL_BRISEE_TAG}" n'est posée qu'à la scène 8 (${ABIGAIL_BRISEE_SCENE_DIALOGUE_ID})`, () => {
    const files = ch2Files();

    it.each(files.map(({ id }) => id))('%s : pas de tag abigail-brisee hors ch2.adieu', (id) => {
      if (id === ABIGAIL_BRISEE_SCENE_DIALOGUE_ID) return;
      const { file } = files.find((f) => f.id === id) as { file: DialogueFile };
      for (const effect of allEffects(file)) {
        if ('tag' in effect) {
          expect(effect.tag, `${id} : "${ABIGAIL_BRISEE_TAG}" posée hors scène 8`).not.toBe(ABIGAIL_BRISEE_TAG);
        }
      }
    });

    it('ch2.adieu pose bien "abigail-brisee" quelque part (sinon ce test ne prouve rien)', () => {
      const adieu = DIALOGUES[ABIGAIL_BRISEE_SCENE_DIALOGUE_ID] as DialogueFile;
      const tags = allEffects(adieu)
        .filter((e): e is { tag: string } => 'tag' in e)
        .map((e) => e.tag);
      expect(tags).toContain(ABIGAIL_BRISEE_TAG);
    });
  });

  describe('scène 3 (ch2.slow) : plaquer Letitia coûte moins cher que crier pour tous', () => {
    /** Lance `ch2.slow` depuis le noeud de la décision post-réussite, choix `choiceText` pris. */
    function letitiaStateAfter(choiceText: string): number {
      const file = DIALOGUES['ch2.slow'] as DialogueFile;
      const ctx: NarrativeContext = {
        dossier: createDossier(),
        run: createRunState('ch2Content::slow', { chapter: 2, sceneId: 'ch2.slow', luck: 3 }),
      };
      const runner = new DialogueRunner(file, ctx, createRng('ch2Content::slow'), {
        startNode: 'choix-protection',
      });
      const presented = runner.current().choices.find((c) => c.text === choiceText);
      expect(presented, `choix "${choiceText}" introuvable sur choix-protection`).toBeDefined();
      const outcome = runner.choose(presented!.index);
      expect(outcome.ok, `choix "${choiceText}" refusé`).toBe(true);
      return (runner.context.run.flags[LETITIA_COUNTER] as number | undefined) ?? 0;
    }

    it('"Plaquer Letitia au sol" et "Crier pour que tout le monde s\'aplatisse" aboutissent à des états différents', () => {
      const plaque = letitiaStateAfter('Plaquer Letitia au sol.');
      const crie = letitiaStateAfter("Crier pour que tout le monde s'aplatisse.");
      expect(plaque).not.toBe(crie);
      expect(plaque).toBeLessThan(crie);
    });
  });
});
