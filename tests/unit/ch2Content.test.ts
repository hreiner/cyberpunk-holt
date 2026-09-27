/**
 * Gardien du contenu du chapitre 2 (lot 5.5, docs/chapters/ch2/TECH-DESIGN.md §6 "Lot 5.5").
 *
 * Trois propriétés GLOBALES, qui balaient tous les fichiers de dialogue du chapitre 2 via
 * `DIALOGUES` (registre) et `CHAPTER_2.scenes` (numéro de scène) -- pas des assertions
 * ponctuelles sur `ch2.egouts.json` -- pour que les lots suivants (5.6+) les étendent sans
 * réécrire ce fichier :
 *
 * 1. Après la mort de Zachary, plus rien ne le fait parler ni lancer de jet (TECH-DESIGN §1,
 *    réponse à la question 1 de GAME-DESIGN §10). Depuis le lot 5.13, sa mort est jouée DANS
 *    `ch2.egouts` : la garde suit le NŒUD de sa mort (celui qui écrit l'entrée `ch2.zachary`),
 *    et plus seulement les scènes postérieures -- voir le bloc « lot 5.13 » en fin de fichier.
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
 *
 * Lot 5.6 ("Fini quand", TECH-DESIGN §6) ajoute deux propriétés, structurelles comme les
 * trois premières -- lues sur les DONNÉES, jamais en faisant tourner le moteur (économie des
 * tests, AGENTS.md : un jet de garde a un vrai coût pour le marcheur exhaustif de
 * `chapter2Flow.test.ts`, inutile de le repayer ici) :
 *
 * 4. Le joker de l'enfant (relais de garde, `ch2.decharges.json`) ne sert qu'une fois : tout
 *    effet qui pose `ch2.garde.enfant-utilise` appartient à un choix dont les conditions
 *    excluent déjà "le joker est déjà utilisé" -- une fois posé, plus aucun autre choix ne
 *    peut le reposer sans repasser par cette même garde.
 * 5. Les quatre lignes du bilan qui doivent toujours se lire (État de Letitia, Abigail,
 *    L'enfant, La voiture -- TECH-DESIGN §4.6, "Photo au bilan") ont bien un dernier cas SANS
 *    `when`, donc toujours vrai : `resolveChapterEnd` (testé génériquement dans
 *    `chapterEnd.test.ts`) ne peut donc jamais les omettre, quel que soit l'état du dossier.
 */

import { describe, expect, it } from 'vitest';
import { createDossier } from '@/core/dossier';
import { createRng } from '@/core/rng';
import { createRunState, setFlag } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import { DIALOGUES } from '@/data/dialogues/registry';
import { CHAPTER_2, CH2_END, CH2_GAUGES } from '@/data/chapters/ch2';
import { DV } from '@/rules/attributes';
import type { DifficultyName } from '@/rules/attributes';
import type { Condition, DialogueChoice, DialogueFile, DialogueNode, Effect } from '@/narrative/types';

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

  describe('lot 5.6 : le joker de l\'enfant (relais de garde) ne sert qu\'une fois', () => {
    const ENFANT_UTILISE_FLAG = 'ch2.garde.enfant-utilise';
    /** Condition EXACTE posée par chaque choix qui ARME le joker (voir ch2.decharges.json). */
    const GUARD_CONDITION = { not: { flag: ENFANT_UTILISE_FLAG, equals: true } };

    function choicesSettingEnfantUtilise(file: DialogueFile): DialogueChoice[] {
      const all: DialogueChoice[] = [];
      for (const node of Object.values(file.nodes)) {
        all.push(...(node.choices ?? []));
      }
      return all.filter((c) =>
        (c.effects ?? []).some((e) => 'flag' in e && e.flag === ENFANT_UTILISE_FLAG && e.value === true),
      );
    }

    it('ch2.decharges pose bien au moins un choix qui arme le joker (sinon ce test ne prouve rien)', () => {
      const file = DIALOGUES['ch2.decharges'] as DialogueFile;
      expect(choicesSettingEnfantUtilise(file).length).toBeGreaterThan(0);
    });

    it.each(Object.entries(DIALOGUES).filter(([id]) => id.startsWith('ch2.')).map(([id]) => id))(
      '%s : tout choix qui pose "%s" est gardé par "pas déjà utilisé"',
      (id) => {
        const file = DIALOGUES[id] as DialogueFile;
        for (const choice of choicesSettingEnfantUtilise(file)) {
          expect(
            choice.conditions,
            `${id} : un choix pose ${ENFANT_UTILISE_FLAG} sans condition -- il pourrait le reposer indéfiniment`,
          ).toBeDefined();
          const hasGuard = (choice.conditions ?? []).some(
            (cond) => JSON.stringify(cond) === JSON.stringify(GUARD_CONDITION),
          );
          expect(hasGuard, `${id} : le choix qui pose ${ENFANT_UTILISE_FLAG} n'exclut pas "déjà utilisé"`).toBe(true);
        }
      },
    );
  });

  describe(
    'suite du lot 5.6 (décision du propriétaire, 2026-09-26) : ' +
      "voiture-pillee n'est posée par la garde qu'à partir de deux échecs non rattrapés",
    () => {
      const ECHECS_COUNTER = 'ch2.garde.echecs';

      /**
       * Lance `ch2.decharges` directement au noeud de decision d'un tour rate
       * (`garde-fail-<cadet>`), decline le joker ("Laisser faire."), et renvoie si
       * `voiture-pillee` est posee a l'issue de CET echec -- `echecsDejaLa` simule
       * les echecs precedents de la meme nuit (deja au compteur avant ce tour-ci).
       */
      function voiturePilleeApresEchec(cadet: string, echecsDejaLa: number): boolean {
        const file = DIALOGUES['ch2.decharges'] as DialogueFile;
        const run = createRunState('ch2Content::garde-echecs', { chapter: 2, sceneId: 'ch2.decharges', luck: 3 });
        if (echecsDejaLa > 0) run.flags[ECHECS_COUNTER] = echecsDejaLa;
        const ctx: NarrativeContext = { dossier: createDossier(), run };
        const runner = new DialogueRunner(file, ctx, createRng('ch2Content::garde-echecs'), {
          startNode: `garde-fail-${cadet}`,
        });
        const presented = runner.current().choices.find((c) => c.text === 'Laisser faire.');
        expect(presented, `garde-fail-${cadet} : choix "Laisser faire." introuvable`).toBeDefined();
        const outcome = runner.choose(presented!.index);
        expect(outcome.ok, `garde-fail-${cadet} : "Laisser faire." refusé`).toBe(true);
        return runner.context.dossier.tags.includes('voiture-pillee');
      }

      it.each(['franklyn', 'john', 'grover', 'abigail'])(
        '%s : un PREMIER échec non rattrapé de la nuit ne pose pas voiture-pillee',
        (cadet) => {
          expect(voiturePilleeApresEchec(cadet, 0)).toBe(false);
        },
      );

      it.each(['franklyn', 'john', 'grover', 'abigail'])(
        '%s : un DEUXIÈME échec non rattrapé (un premier déjà au compteur) pose voiture-pillee',
        (cadet) => {
          expect(voiturePilleeApresEchec(cadet, 1)).toBe(true);
        },
      );

      it(`le compteur ${ECHECS_COUNTER} est borné [0, 3] sur tout effet qui le touche (comme ${LETITIA_COUNTER})`, () => {
        const file = DIALOGUES['ch2.decharges'] as DialogueFile;
        for (const effect of allEffects(file)) {
          if ('counter' in effect && effect.counter === ECHECS_COUNTER) {
            expect(effect.min, `effet sur ${ECHECS_COUNTER} sans borne min`).toBe(0);
            expect(effect.max, `effet sur ${ECHECS_COUNTER} sans borne max`).toBe(3);
          }
        }
      });
    },
  );

  describe(
    'lot 5.8 : les échos du bal sont lus là où docs/chapters/ch2/TECH-DESIGN.md §4.6 le dit',
    () => {
      /**
       * Table de §4.6 (« Échos du bal »), complète depuis le lot 5.9 (`ch2.bal.grover.fait`, lu
       * par `ch2.enfant`). `dvNotch` : l'écho se lit par un cran de DV (le format n'a pas de
       * modificateur numérique) -- John, lui, se lit dans le texte.
       */
      const BAL_ECHOES: Array<{ dialogueId: string; flag: string; readIn: string; dvNotch: boolean }> = [
        { dialogueId: 'ch2.bal.zachary', flag: 'ch2.bal.zachary.fait', readIn: 'ch2.egouts', dvNotch: true },
        { dialogueId: 'ch2.bal.abigail', flag: 'ch2.bal.abigail.fait', readIn: 'ch2.grille', dvNotch: true },
        { dialogueId: 'ch2.bal.john', flag: 'ch2.bal.john.fait', readIn: 'ch2.decharges', dvNotch: false },
        { dialogueId: 'ch2.bal.grover', flag: 'ch2.bal.grover.fait', readIn: 'ch2.enfant', dvNotch: true },
      ];

      /** Vrai si `cond` (ou l'une de ses sous-conditions `not`/`all`/`any`) porte sur `flag`. */
      function mentionsFlag(cond: Condition, flag: string): boolean {
        if ('flag' in cond) return cond.flag === flag;
        if ('not' in cond) return mentionsFlag(cond.not, flag);
        if ('all' in cond) return cond.all.some((c) => mentionsFlag(c, flag));
        if ('any' in cond) return cond.any.some((c) => mentionsFlag(c, flag));
        return false;
      }

      function anyChoiceMentionsFlag(file: DialogueFile, flag: string): boolean {
        return allChoices(file).some((c) => (c.conditions ?? []).some((cond) => mentionsFlag(cond, flag)));
      }

      it.each(BAL_ECHOES)(
        '"$dialogueId.fait" pose bien un flag (préalable : sinon aucun écho ne peut être lu)',
        ({ dialogueId, flag }) => {
          const file = DIALOGUES[dialogueId] as DialogueFile;
          expect(file, `dialogue "${dialogueId}" introuvable`).toBeDefined();
          const flagsSet = allEffects(file)
            .filter((e): e is { flag: string; value: string | number | boolean } => 'flag' in e && 'value' in e)
            .map((e) => e.flag);
          expect(flagsSet, `"${dialogueId}" ne pose jamais "${flag}"`).toContain(flag);
        },
      );

      it.each(BAL_ECHOES)('"$flag" est bien relu dans "$readIn" (TECH-DESIGN §4.6)', ({ flag, readIn }) => {
        const file = DIALOGUES[readIn] as DialogueFile;
        expect(file, `dialogue "${readIn}" introuvable`).toBeDefined();
        expect(anyChoiceMentionsFlag(file, flag), `"${readIn}" ne lit jamais "${flag}"`).toBe(true);
      });

      /** Crans de DV, du plus facile au plus dur (`DV`, src/rules/attributes.ts). */
      const NOTCHES = (Object.keys(DV) as DifficultyName[]).sort((a, b) => DV[a] - DV[b]);
      const WITH = (flag: string): Condition => ({ flag, equals: true });
      const WITHOUT = (flag: string): Condition => ({ not: { flag, equals: true } });

      /**
       * Lot 5.9 : un écho « de DV » (`dvNotch`) vaut EXACTEMENT un cran, partout où il est lu -- sur
       * toute paire de choix jumeaux d'un même nœud (même compétence, même lanceur, mêmes autres
       * conditions), celui qui a l'écho est un cran sous celui qui ne l'a pas. Et chaque écho de DV
       * a au moins une telle paire (sinon il ne se lit pas par la DV).
       */
      it.each(BAL_ECHOES.filter((e) => e.dvNotch))('"$flag" abaisse la DV d’exactement un cran dans "$readIn"', ({ flag, readIn }) => {
        const file = DIALOGUES[readIn] as DialogueFile;
        let pairs = 0;
        for (const node of Object.values(file.nodes)) {
          for (const echoed of node.choices ?? []) {
            const conds = echoed.conditions ?? [];
            const at = conds.findIndex((c) => JSON.stringify(c) === JSON.stringify(WITH(flag)));
            if (at < 0 || !echoed.check) continue;
            const twinConds = JSON.stringify(conds.map((c, i) => (i === at ? WITHOUT(flag) : c)));
            const twin = (node.choices ?? []).find(
              (c) =>
                JSON.stringify(c.conditions ?? []) === twinConds &&
                c.check?.skill === echoed.check?.skill &&
                c.check?.who === echoed.check?.who,
            );
            expect(twin, `${readIn} : "${echoed.text}" n'a pas de jumeau sans l'écho`).toBeDefined();
            const gap = NOTCHES.indexOf(twin!.check!.dv) - NOTCHES.indexOf(echoed.check.dv);
            expect(gap, `${readIn} : "${echoed.text}" -- ${twin!.check!.dv} sans l'écho, ${echoed.check.dv} avec`).toBe(1);
            pairs++;
          }
        }
        expect(pairs, `${readIn} : aucune paire de jumeaux ne lit "${flag}" par la DV`).toBeGreaterThan(0);
      });
    },
  );

  describe('lot 5.6 : quatre lignes du bilan (CH2_END) sont TOUJOURS écrites', () => {
    // Lot 5.10 (décision du propriétaire, 2026-09-26) : « Murano » et « Le fusil » s'ajoutent.
    const ALWAYS_WRITTEN_LABELS = ['État de Letitia', 'Abigail', "L'enfant", 'La voiture', 'Murano', 'Le fusil'];

    it.each(ALWAYS_WRITTEN_LABELS)('"%s" a un dernier cas sans "when" (repli toujours vrai)', (label) => {
      const line = CH2_END.lines.find((l) => l.label === label);
      expect(line, `CH2_END ne contient pas de ligne "${label}"`).toBeDefined();
      const lastCase = line!.cases[line!.cases.length - 1];
      expect(lastCase?.when, `"${label}" : le dernier cas porte encore un "when" -- la ligne peut disparaître`).toBeUndefined();
    });

    it('les quatre lignes ci-dessus existent bien dans CH2_END (sinon ce test ne prouve rien)', () => {
      const labels = CH2_END.lines.map((l) => l.label);
      for (const label of ALWAYS_WRITTEN_LABELS) expect(labels).toContain(label);
    });
  });
});

describe('lot 5.10 : le campement -- qui tue Murano, et ce que coûte un échec', () => {
  const MURANO = DIALOGUES['ch2.murano'] as DialogueFile;
  /** Les quatre tueurs possibles, par le texte de leur option au noeud `qui` (Abigail : seulement si brisée). */
  const KILLERS = ['Franklyn', 'John', 'Grover', 'Abigail'] as const;
  /** Fragment qui identifie l'option de chaque tueur (Franklyn : « Le faire toi-même »). */
  const KILLER_OPTION: Record<(typeof KILLERS)[number], string> = {
    Franklyn: 'toi-même',
    John: 'John',
    Grover: 'Grover',
    Abigail: 'Abigail',
  };
  const SEEDS_PER_KILLER = 60;

  function entryValue(ctx: NarrativeContext, key: string): string | undefined {
    return ctx.dossier.entries.find((e) => e.key === key)?.value;
  }

  /** Joue le reste d'un dialogue en prenant le premier choix présenté (ou "Continuer."). */
  function playToEnd(runner: DialogueRunner): void {
    for (let guard = 0; guard < 20 && !runner.current().finished; guard++) {
      const node = runner.current();
      if (node.pendingRoll) runner.acceptRoll();
      else if (node.choices[0]) runner.choose(node.choices[0].index);
      else runner.advance();
    }
    expect(runner.current().finished, `${runner.current().nodeId} : le dialogue ne se termine pas`).toBe(true);
  }

  /**
   * Toutes les issues observées au noeud `qui` : chaque tueur, sur `SEEDS_PER_KILLER` graines,
   * sans Chance (aucun jet suspendu) et avec `abigail-brisee` (sinon Abigail n'est pas proposée).
   */
  function killOutcomes(): Array<{ killer: string; success: boolean; ctx: NarrativeContext }> {
    const outcomes: Array<{ killer: string; success: boolean; ctx: NarrativeContext }> = [];
    for (const killer of KILLERS) {
      for (let seed = 0; seed < SEEDS_PER_KILLER; seed++) {
        const ctx: NarrativeContext = {
          dossier: { ...createDossier(), tags: [ABIGAIL_BRISEE_TAG] },
          run: createRunState(`ch2Content::murano-${seed}`, { chapter: 2, sceneId: 'ch2.murano', luck: 0 }),
        };
        const runner = new DialogueRunner(MURANO, ctx, createRng(`ch2Content::murano-${killer}-${seed}`), {
          startNode: 'qui',
        });
        const option = runner.current().choices.find((c) => c.text.includes(KILLER_OPTION[killer]));
        expect(option, `option du tueur "${killer}" introuvable au noeud qui`).toBeDefined();
        runner.choose(option!.index);
        const success = runner.current().lastCheck?.success;
        expect(success, `${killer} : aucun jet résolu`).toBeDefined();
        playToEnd(runner);
        outcomes.push({ killer, success: success as boolean, ctx: runner.context });
      }
    }
    return outcomes;
  }

  const outcomes = killOutcomes();

  it.each(KILLERS)('%s : le jet du tueur réussit ET échoue selon la graine (sinon les propriétés suivantes ne prouvent rien)', (killer) => {
    const mine = outcomes.filter((o) => o.killer === killer);
    expect(mine.some((o) => o.success)).toBe(true);
    expect(mine.some((o) => !o.success)).toBe(true);
  });

  it('"a-tue" est posée si et seulement si Franklyn tue, quelle que soit l\'issue du jet', () => {
    for (const { killer, success, ctx } of outcomes) {
      const label = `${killer} (${success ? 'réussite' : 'échec'})`;
      expect(ctx.dossier.tags.includes('a-tue'), label).toBe(killer === 'Franklyn');
      expect(entryValue(ctx, 'ch2.campement.tueur'), label).toBe(killer);
    }
  });

  it('le fusil est vide si et seulement si le tueur échoue (entrée ch2.fusil et drapeau lu en scène 10)', () => {
    for (const { killer, success, ctx } of outcomes) {
      const label = `${killer} (${success ? 'réussite' : 'échec'})`;
      expect(ctx.run.flags['ch2.fusil.charge'], label).toBe(success);
      expect(entryValue(ctx, 'ch2.fusil')?.includes('vide'), label).toBe(!success);
    }
  });

  it.each(Object.keys(DIALOGUES).filter((id) => id.startsWith('ch2.')))('%s : "a-tue" n\'est posée que par ch2.murano', (id) => {
    if (id === 'ch2.murano') return;
    for (const effect of allEffects(DIALOGUES[id] as DialogueFile)) {
      if ('tag' in effect) expect(effect.tag, `${id} pose a-tue`).not.toBe('a-tue');
    }
  });

  it('ch2.campement et ch2.murano sont des scènes postérieures à ch2.egouts (couvertes par la garde de Zachary)', () => {
    expect(sceneNumberOf('ch2.campement')).toBe(9);
    expect(sceneNumberOf('ch2.murano')).toBe(9);
  });

  it('le matériel obtenu fait baisser l\'état de Letitia d\'un cran ; refusé, il ne change rien', () => {
    const seen = new Set<boolean>();
    for (let seed = 0; seed < 40; seed++) {
      const run = createRunState(`ch2Content::materiel-${seed}`, { chapter: 2, sceneId: 'ch2.murano', luck: 0 });
      run.flags[LETITIA_COUNTER] = 2;
      const runner = new DialogueRunner(MURANO, { dossier: createDossier(), run }, createRng(`ch2Content::materiel-${seed}`), {
        startNode: 'demande',
      });
      const grover = runner.current().choices.find((c) => c.text.includes('Grover'));
      runner.choose(grover!.index);
      const success = runner.current().lastCheck?.success as boolean;
      seen.add(success);
      expect(runner.context.run.flags[LETITIA_COUNTER]).toBe(success ? 1 : 2);
    }
    expect([...seen].sort()).toEqual([false, true]);
  });

  /**
   * Décision du propriétaire (2026-09-26) : rater les insignes retarde, ne perd plus. Trois
   * départs -- fouille réussie, fouille ratée, pas de fouille -- puis tout chemin de ch2.murano
   * (chaque tueur, chaque issue) : l'entrée est toujours écrite, avec sa nuance.
   */
  it('"ch2.campement.insignes" est écrite sur tout chemin : reconnus sur-le-champ, ou trouvés sur Murano', () => {
    const campement = DIALOGUES['ch2.campement'] as DialogueFile;
    const starts: Array<{ label: string; ctx: NarrativeContext; expected: string }> = [];
    for (let seed = 0; seed < 30; seed++) {
      const ctx: NarrativeContext = {
        dossier: { ...createDossier(), tags: [ABIGAIL_BRISEE_TAG] },
        run: createRunState(`ch2Content::insignes-${seed}`, { chapter: 2, sceneId: 'ch2.campement', luck: 0 }),
      };
      const runner = new DialogueRunner(campement, ctx, createRng(`ch2Content::insignes-${seed}`));
      runner.choose(runner.current().choices[0]!.index);
      const success = runner.current().lastCheck?.success as boolean;
      playToEnd(runner);
      starts.push({ label: success ? 'fouille réussie' : 'fouille ratée', ctx: runner.context, expected: success ? 'reconnus' : 'trouvés sur Murano' });
    }
    starts.push({
      label: 'pas de fouille',
      ctx: {
        dossier: { ...createDossier(), tags: [ABIGAIL_BRISEE_TAG] },
        run: createRunState('ch2Content::insignes-sans', { chapter: 2, sceneId: 'ch2.campement', luck: 0 }),
      },
      expected: 'trouvés sur Murano',
    });
    expect(new Set(starts.map((s) => s.label)).size, 'les trois départs doivent être observés').toBe(3);

    for (const start of starts) {
      for (const killer of KILLERS) {
        for (let seed = 0; seed < 8; seed++) {
          const runner = new DialogueRunner(MURANO, start.ctx, createRng(`ch2Content::insignes-${killer}-${seed}`), {
            startNode: 'qui',
          });
          const option = runner.current().choices.find((c) => c.text.includes(KILLER_OPTION[killer]));
          runner.choose(option!.index);
          playToEnd(runner);
          const value = entryValue(runner.context, 'ch2.campement.insignes');
          expect(value, `${start.label}, ${killer} : entrée manquante`).toBeDefined();
          expect(value!.includes(start.expected), `${start.label}, ${killer} : "${value}"`).toBe(true);
        }
      }
    }
  });

  it('scène 10 : un fusil chargé et un fusil vide ne proposent pas les mêmes options aux décharges', () => {
    const decharges = DIALOGUES['ch2.decharges'] as DialogueFile;
    function gangsChoices(charge: boolean | undefined): string[] {
      const run = createRunState('ch2Content::gangs', { chapter: 2, sceneId: 'ch2.decharges', luck: 0 });
      if (charge !== undefined) run.flags['ch2.fusil.charge'] = charge;
      const runner = new DialogueRunner(decharges, { dossier: createDossier(), run }, createRng('ch2Content::gangs'), {
        startNode: 'gangs',
      });
      return runner.current().choices.map((c) => c.text);
    }
    const charge = gangsChoices(true);
    const vide = gangsChoices(false);
    expect(charge.some((t) => t.includes('cartouche'))).toBe(true);
    expect(charge.some((t) => t.includes('fusil vide'))).toBe(false);
    expect(vide.some((t) => t.includes('fusil vide'))).toBe(true);
    expect(vide.some((t) => t.includes('cartouche'))).toBe(false);
    // Sans le drapeau (scène 10 lancée seule, ?scene=ch2.decharges) : le fusil vide du design d'origine.
    expect(gangsChoices(undefined)).toEqual(vide);
  });
});

describe('lot 5.9 : les conduits et la cantine -- ce que la scène 10 attend de la scène 5', () => {
  const ENFANT = DIALOGUES['ch2.enfant'] as DialogueFile;
  const SMITH = DIALOGUES['ch2.smith'] as DialogueFile;
  const CANTINE = DIALOGUES['ch2.cantine'] as DialogueFile;

  /** Joue le reste d'un dialogue en prenant le premier choix présenté (ou "Continuer."). */
  function playToEnd(runner: DialogueRunner): void {
    for (let guard = 0; guard < 30 && !runner.current().finished; guard++) {
      const node = runner.current();
      if (node.pendingRoll) runner.acceptRoll();
      else if (node.choices[0]) runner.choose(node.choices[0].index);
      else runner.advance();
    }
    expect(runner.current().finished, `${runner.current().nodeId} : le dialogue ne se termine pas`).toBe(true);
  }

  /**
   * `enfant-confiance` ouvre le joker du relais de garde (scène 10) : elle se gagne ou se perd ICI,
   * et seulement par le jet. Chaque option du nœud `calmer` (Grover sans et avec l'écho du bal,
   * Franklyn avec `sauveteur`), sur des graines variées, sans Chance : l'étiquette est posée si et
   * seulement si le jet réussit ; l'échec fait monter l'état de Letitia d'un cran (GAME-DESIGN
   * §5.1, l'enfant qui crie) ; et tout chemin pose `ch2.enfant.fait`, qui ouvre la porte de la
   * cantine à l'étape suivante.
   */
  it('enfant-confiance si et seulement si le jet réussit ; l’échec coûte un cran à Letitia', () => {
    const seen = new Set<string>();
    for (const echo of [false, true]) {
      for (let seed = 0; seed < 60; seed++) {
        const run = createRunState(`ch2Content::enfant-${seed}`, { chapter: 2, sceneId: 'ch2.enfant', luck: 0 });
        run.flags[LETITIA_COUNTER] = 1;
        if (echo) run.flags['ch2.bal.grover.fait'] = true;
        const dossier = { ...createDossier(), tags: ['sauveteur'] };
        for (const option of ['Grover', 'toi-même']) {
          const runner = new DialogueRunner(ENFANT, { dossier, run }, createRng(`ch2Content::enfant-${echo}-${option}-${seed}`), {
            startNode: 'calmer',
          });
          const choice = runner.current().choices.find((c) => c.text.includes(option));
          expect(choice, `option "${option}" introuvable (écho ${echo})`).toBeDefined();
          runner.choose(choice!.index);
          const success = runner.current().lastCheck?.success as boolean;
          playToEnd(runner);
          const { dossier: after, run: runAfter } = runner.context;
          const label = `${option}, écho ${echo}, graine ${seed} (${success ? 'réussite' : 'échec'})`;
          expect(after.tags.includes('enfant-confiance'), label).toBe(success);
          expect(runAfter.flags[LETITIA_COUNTER], label).toBe(success ? 1 : 2);
          expect(runAfter.flags['ch2.enfant.fait'], label).toBe(true);
          seen.add(success ? 'réussite' : 'échec');
        }
      }
    }
    expect([...seen].sort(), 'les deux issues doivent être observées').toEqual(['réussite', 'échec']);
  });

  it('vu-simulation est posée sur tout chemin du détour chez Smith, qui coûte un cran de tempo', () => {
    const tagSets = [[], ['pris-a-tricher'], ['tricheur'], ['copie-brillante']];
    for (const tags of tagSets) {
      for (const choiceAtMachine of [0, 1]) {
        const ctx: NarrativeContext = {
          dossier: { ...createDossier(), tags },
          run: createRunState('ch2Content::smith', { chapter: 2, sceneId: 'ch2.conduits', luck: 0 }),
        };
        const runner = new DialogueRunner(SMITH, ctx, createRng('ch2Content::smith'));
        for (let guard = 0; guard < 20 && !runner.current().finished; guard++) {
          const node = runner.current();
          const pick = node.nodeId === 'machine' ? node.choices[choiceAtMachine] : node.choices[0];
          if (pick) runner.choose(pick.index);
          else runner.advance();
        }
        expect(runner.current().finished).toBe(true);
        expect(runner.context.dossier.tags, `tags ${JSON.stringify(tags)}`).toContain('vu-simulation');
        expect(runner.context.run.tempo).toBe(1);
      }
    }
  });

  it.each(Object.keys(DIALOGUES).filter((id) => id.startsWith('ch2.')))(
    '%s : enfant-confiance n’est posée que par ch2.enfant, vu-simulation que par ch2.smith',
    (id) => {
      for (const effect of allEffects(DIALOGUES[id] as DialogueFile)) {
        if (!('tag' in effect)) continue;
        if (effect.tag === 'enfant-confiance') expect(id).toBe('ch2.enfant');
        if (effect.tag === 'vu-simulation') expect(id).toBe('ch2.smith');
      }
    },
  );

  it('la scène 10 lit bien les deux étiquettes posées en scène 5 (le rendez-vous, le joker de l’enfant)', () => {
    const decharges = DIALOGUES['ch2.decharges'] as DialogueFile;
    const conditions = allChoices(decharges).flatMap((c) => c.conditions ?? []);
    const reads = (tag: string) => conditions.some((c) => JSON.stringify(c).includes(`"tag":"${tag}"`));
    expect(reads('vu-simulation')).toBe(true);
    expect(reads('enfant-confiance')).toBe(true);
  });

  /**
   * La cantine (scène 6) : rater la traversée coûte un cran de tempo -- et ce cran se paie à la
   * trappe si la nuit a déjà trop traîné (seuil du nœud `seuil`). Même tempo de départ, une
   * traversée réussie passe, une traversée ratée fait tirer la rafale sur Letitia.
   */
  it('rater la traversée de la fumée coûte du tempo, qui peut coûter Letitia à la trappe', () => {
    const seen = new Set<boolean>();
    for (let seed = 0; seed < 60; seed++) {
      const run = createRunState(`ch2Content::cantine-${seed}`, { chapter: 2, sceneId: 'ch2.cantine', luck: 0 });
      run.tempo = 5;
      run.flags['ch2.porteur'] = 'abigail';
      const runner = new DialogueRunner(CANTINE, { dossier: createDossier(), run }, createRng(`ch2Content::cantine-${seed}`));
      runner.choose(runner.current().choices[0]!.index);
      const success = runner.current().lastCheck?.success as boolean;
      playToEnd(runner);
      seen.add(success);
      expect(runner.context.run.tempo).toBe(success ? 5 : 6);
      expect(runner.context.run.flags[LETITIA_COUNTER] ?? 0).toBe(success ? 0 : 1);
    }
    expect([...seen].sort()).toEqual([false, true]);
  });
});

describe('lot 5.11 : l’état de Letitia finit au dossier (B18, « entrée finale écrite par quatre branches silencieuses »)', () => {
  const CHARCUDOC = DIALOGUES['ch2.charcudoc'] as DialogueFile;
  const levels = CH2_GAUGES[0]?.levels ?? [];

  it.each(levels.map((level, value) => [value, level] as const))(
    'état %i : ch2.charcudoc écrit l’entrée « %s », le mot de la jauge',
    (value, level) => {
      const ctx: NarrativeContext = {
        dossier: createDossier(),
        run: setFlag(createRunState('ch2Content::letitia', { chapter: 2, sceneId: 'ch2.charcudoc', luck: 0 }), LETITIA_COUNTER, value),
      };
      const runner = new DialogueRunner(CHARCUDOC, ctx, createRng('ch2Content::letitia'), { startNode: 'delai-intro' });
      for (let guard = 0; guard < 10 && !runner.current().finished; guard++) {
        const node = runner.current();
        if (node.choices[0]) runner.choose(node.choices[0].index);
        else runner.advance();
      }
      expect(runner.context.dossier.entries.find((e) => e.key === LETITIA_COUNTER)?.value).toBe(level);
    },
  );
});

/**
 * Lot 5.15 (ajout du propriétaire, GAME-DESIGN scène 3) : le slow qui dure, la bascule plus longue.
 * Deux propriétés, sur TOUS les chemins de `ch2.slow` (marcheur par rejeu : chaque préfixe de choix
 * est rejoué depuis le début avec la même graine, donc le jet de Perception retombe pareil), avec
 * et sans `cavalier-letitia`, sur assez de graines pour voir la réussite et l'échec :
 * 1. le murmure (les choix qui écrivent l'affinité avec Letitia) n'existe qu'avec
 *    `cavalier-letitia`, sans jet, et chaque option écrit exactement ±1 ;
 * 2. la suite des décors montre `rafale-gangers`, `rafale-cadets`, `rafale-zachary`, dans cet ordre.
 */
describe('lot 5.15 : le slow et la rafale, enrichis (ch2.slow)', () => {
  const SLOW = DIALOGUES['ch2.slow'] as DialogueFile;
  const RAFALE_SEQUENCE = ['rafale-gangers', 'rafale-cadets', 'rafale-zachary'];
  const SEEDS = 16;

  function letitiaDelta(choice: DialogueChoice): number | undefined {
    for (const effect of choice.effects ?? []) {
      if ('affinity' in effect && effect.affinity.who === 'letitia') return effect.affinity.delta;
    }
    return undefined;
  }
  const murmureNodes = Object.entries(SLOW.nodes)
    .filter(([, node]) => (node.choices ?? []).some((c) => letitiaDelta(c) !== undefined))
    .map(([id]) => id);

  interface SlowPath {
    /** Noeuds montrés au joueur, dans l'ordre (les aiguillages sans texte sont traversés). */
    trail: string[];
    /** Variation d'affinité avec Letitia à chaque choix pris sur un noeud du murmure. */
    murmureDeltas: number[];
  }

  function walkSlow(tags: string[], seed: string): SlowPath[] {
    const paths: SlowPath[] = [];
    const explore = (prefix: number[]): void => {
      const base = createDossier();
      const ctx: NarrativeContext = {
        dossier: { ...base, tags, affinities: { ...base.affinities, letitia: 0 } },
        run: createRunState(seed, { chapter: 2, sceneId: 'ch2.slow', luck: 0 }),
      };
      const runner = new DialogueRunner(SLOW, ctx, createRng(seed));
      const trail: string[] = [];
      const murmureDeltas: number[] = [];
      const note = (): void => {
        const id = runner.current().nodeId;
        if (trail[trail.length - 1] !== id) trail.push(id);
      };
      const settle = (): void => {
        note();
        for (let guard = 0; guard < 60; guard++) {
          const node = runner.current();
          if (node.finished) return;
          if (node.pendingRoll) runner.acceptRoll();
          else if (node.choices.length === 0) runner.advance();
          else return;
          note();
        }
        throw new Error(`ch2.slow ne se termine pas (${runner.current().nodeId})`);
      };
      settle();
      for (const index of prefix) {
        const at = runner.current().nodeId;
        const before = runner.context.dossier.affinities.letitia ?? 0;
        expect(runner.choose(index).ok, `${at} : choix ${index} refusé`).toBe(true);
        if (murmureNodes.includes(at)) murmureDeltas.push((runner.context.dossier.affinities.letitia ?? 0) - before);
        settle();
      }
      const node = runner.current();
      if (node.finished) paths.push({ trail, murmureDeltas });
      else for (const choice of node.choices) explore([...prefix, choice.index]);
    };
    explore([]);
    return paths;
  }

  const cases = [false, true].flatMap((cavalier) =>
    Array.from({ length: SEEDS }, (_, i) => ({
      cavalier,
      paths: walkSlow(cavalier ? ['cavalier-letitia'] : [], `ch2Content::slow-5.15-${i}`),
    })),
  );

  it('le murmure existe dans les données : des choix sans jet, qui écrivent chacun ±1 avec Letitia', () => {
    expect(murmureNodes.length, 'aucun choix de ch2.slow n’écrit l’affinité avec Letitia').toBeGreaterThan(0);
    for (const id of murmureNodes) {
      for (const choice of SLOW.nodes[id]?.choices ?? []) {
        expect(choice.check, `${id} : « ${choice.text} » porte un jet`).toBeUndefined();
        expect(Math.abs(letitiaDelta(choice) ?? 0), `${id} : « ${choice.text} »`).toBe(1);
      }
    }
  });

  it('le murmure n’est atteint qu’avec cavalier-letitia, une fois, et écrit ±1 avec Letitia', () => {
    for (const { cavalier, paths } of cases) {
      expect(paths.length).toBeGreaterThan(0);
      for (const { trail, murmureDeltas } of paths) {
        const seen = trail.filter((id) => murmureNodes.includes(id));
        if (!cavalier) {
          expect(seen, `sans cavalier-letitia : ${trail.join(' > ')}`).toEqual([]);
        } else {
          expect(seen.length, `avec cavalier-letitia : ${trail.join(' > ')}`).toBe(1);
          expect(murmureDeltas.map(Math.abs)).toEqual([1]);
        }
      }
    }
    // Les deux issues de la Perception sont bien parcourues (sinon la propriété suivante ne couvre pas tout).
    const all = cases.flatMap(({ paths }) => paths.map((p) => p.trail));
    expect(all.some((t) => t.includes('choix-protection'))).toBe(true);
    expect(all.some((t) => t.includes('touchee-de-plein-fouet'))).toBe(true);
  });

  it('sur tout chemin, la rafale montre rafale-gangers, rafale-cadets puis rafale-zachary', () => {
    for (const { paths } of cases) {
      for (const { trail } of paths) {
        const backdrops = trail
          .map((id) => SLOW.nodes[id]?.backdrop)
          .filter((b): b is string => b !== undefined)
          .filter((b, i, all) => all[i - 1] !== b);
        const positions = RAFALE_SEQUENCE.map((key) => backdrops.indexOf(key));
        const label = backdrops.join(' > ');
        expect(positions.every((p) => p >= 0), label).toBe(true);
        expect([...positions].sort((a, b) => a - b), label).toEqual(positions);
        expect(backdrops.indexOf('attaque'), label).toBeLessThan(positions[0]!);
      }
    }
  });
});

/**
 * Lot 5.13 (ajout du propriétaire, GAME-DESIGN scène 7) : la mort de Zachary, jouée ; les
 * répliques de garde ; l'enfant qui parle. Propriétés lues sur les DONNÉES (graphe des nœuds),
 * sans faire tourner le moteur -- `chapter2Flow.test.ts` garantit déjà que tout va au bout.
 *
 * Portraits : `NarrativeView.renderHero` montre le DERNIER locuteur du nœud et, sur un nœud de
 * pure narration, garde celui du nœud précédent tant qu'on reste dans le même fichier (repli sur
 * `DialogueFile.speaker` s'il existe). Les deux propriétés « le portrait ne reste pas » traduisent
 * cette règle en contrainte sur le graphe.
 */
describe('lot 5.13 : la mort de Zachary, la garde, l’enfant', () => {
  const EGOUTS = DIALOGUES[EGOUTS_DIALOGUE_ID] as DialogueFile;
  /** La décision existante (calmer Abigail ou soigner Letitia) : la séquence de deuil finit là. */
  const DECISION_NODE = 'ordre';

  /** Toutes les destinations d'un nœud, conditions ignorées (lecture structurelle). */
  function targets(node: DialogueNode): string[] {
    const out: string[] = [];
    if (node.to) out.push(node.to);
    for (const c of node.choices ?? []) {
      for (const t of [c.to, c.onSuccess, c.onFailure]) if (t) out.push(t);
    }
    return out;
  }

  function reachableFrom(file: DialogueFile, start: string, stopAt?: string): Set<string> {
    const seen = new Set<string>();
    const stack = [start];
    while (stack.length > 0) {
      const id = stack.pop() as string;
      if (seen.has(id) || id === stopAt) continue;
      seen.add(id);
      const node = file.nodes[id];
      if (node) stack.push(...targets(node));
    }
    return seen;
  }

  /** Même définition que `isRoutingNode` (dialogueRunner.ts) : rien à lire, le runner le traverse. */
  function isRouting(node: DialogueNode): boolean {
    const terminal = node.to === undefined && (node.choices ?? []).length === 0;
    return !terminal && node.text === undefined && (node.lines ?? []).length === 0 && node.insight === undefined;
  }

  /** Nœuds AFFICHÉS juste après `id` : les aiguillages sont traversés. */
  function shownSuccessors(file: DialogueFile, id: string): string[] {
    const out = new Set<string>();
    const seen = new Set<string>();
    const stack = targets(file.nodes[id] as DialogueNode);
    while (stack.length > 0) {
      const next = stack.pop() as string;
      if (seen.has(next)) continue;
      seen.add(next);
      const node = file.nodes[next];
      if (!node) continue;
      if (isRouting(node)) stack.push(...targets(node));
      else out.add(next);
    }
    return [...out];
  }

  const deathNodeId = Object.entries(EGOUTS.nodes).find(([, node]) =>
    (node.effects ?? []).some((e) => 'entry' in e && e.entry.key === 'ch2.zachary'),
  )?.[0] as string;

  it('ch2.egouts a un nœud de mort (celui qui écrit ch2.zachary), atteint avant la décision', () => {
    expect(deathNodeId).toBeDefined();
    expect(reachableFrom(EGOUTS, EGOUTS.start, DECISION_NODE).has(deathNodeId)).toBe(true);
    expect(EGOUTS.nodes[DECISION_NODE], 'la décision calmer/soigner existe toujours').toBeDefined();
  });

  it('à partir du nœud de sa mort, Zachary ne parle plus, ne lance plus de jet, et son portrait ne reste pas', () => {
    for (const id of reachableFrom(EGOUTS, deathNodeId)) {
      const node = EGOUTS.nodes[id] as DialogueNode;
      for (const line of node.lines ?? []) expect(line.who, `${id} : réplique de zachary après sa mort`).not.toBe('zachary');
      expect(node.insight?.who, `${id} : jet de réflexion de zachary`).not.toBe('zachary');
      for (const c of node.choices ?? []) expect(c.check?.who, `${id} : jet de zachary`).not.toBe('zachary');
    }
    // Le portrait : le nœud de sa mort fait parler quelqu'un d'autre (dernier locuteur = nouveau
    // portrait), et le fichier n'a pas Zachary pour locuteur de repli.
    expect((EGOUTS.nodes[deathNodeId]?.lines ?? []).length, 'le nœud de sa mort doit donner la parole à un autre').toBeGreaterThan(0);
    expect(EGOUTS.speaker).not.toBe('zachary');
    // Il parle bien AVANT (sinon ce test ne prouve rien).
    const before = reachableFrom(EGOUTS, EGOUTS.start, deathNodeId);
    expect([...before].some((id) => (EGOUTS.nodes[id]?.lines ?? []).some((l) => l.who === 'zachary'))).toBe(true);
  });

  /**
   * Lot 5.14 (défaut relevé au lot 5.13) : même règle pour Murano. `ch2.murano` avait Murano pour
   * locuteur de fichier, et son portrait revenait sur la narration qui suit sa mort (`fusil-charge`,
   * `fin`…). Ses nœuds de mort sont les issues du choix qui écrit `ch2.campement.tueur`.
   */
  it('ch2.murano : à partir de sa mort, Murano ne parle plus et son portrait ne revient pas', () => {
    const MURANO = DIALOGUES['ch2.murano'] as DialogueFile;
    const deathNodes = allChoices(MURANO)
      .filter((c) => (c.effects ?? []).some((e) => 'entry' in e && e.entry.key === 'ch2.campement.tueur'))
      .flatMap((c) => [c.onSuccess, c.onFailure])
      .filter((id): id is string => id !== undefined);
    expect(deathNodes.length, 'quatre tueurs, deux issues chacun').toBe(8);
    // Aucun repli de fichier sur lui : la narration garde le portrait de celui qui vient de parler.
    expect(MURANO.speaker).not.toBe('murano');
    for (const death of deathNodes) {
      const lines = MURANO.nodes[death]?.lines ?? [];
      expect(lines.length, `${death} : un autre prend la parole`).toBeGreaterThan(0);
      expect(lines[lines.length - 1]?.who, death).not.toBe('murano');
      for (const id of reachableFrom(MURANO, death)) {
        for (const line of MURANO.nodes[id]?.lines ?? []) expect(line.who, `${id} : réplique de Murano après sa mort`).not.toBe('murano');
      }
    }
    // Il parle bien avant (sinon ce test ne prouve rien).
    expect(Object.values(MURANO.nodes).some((n) => (n.lines ?? []).some((l) => l.who === 'murano'))).toBe(true);
  });

  // Lot 5.16 (ADR 0028) : le portrait livré de Zachary rit ; mourant, il parle sous sa variante.
  it('toute réplique de Zachary aux égouts, avant sa mort, utilise la variante « blesse »', () => {
    const before = reachableFrom(EGOUTS, EGOUTS.start, deathNodeId);
    let count = 0;
    for (const id of before) {
      for (const line of EGOUTS.nodes[id]?.lines ?? []) {
        if (line.who !== 'zachary') continue;
        count += 1;
        expect(line.portrait, `${id} : « ${line.text} »`).toBe('blesse');
      }
    }
    expect(count, 'Zachary parle avant sa mort (sinon ce test ne prouve rien)').toBeGreaterThan(0);
  });

  it('la séquence de deuil (jusqu’à la décision) ne porte aucun jet ni effet mécanique', () => {
    const mourning = reachableFrom(EGOUTS, EGOUTS.start, DECISION_NODE);
    for (const id of mourning) {
      const node = EGOUTS.nodes[id] as DialogueNode;
      expect(node.insight, `${id} : jet de réflexion`).toBeUndefined();
      for (const effect of node.effects ?? []) {
        // Seule trace : l'entrée du dossier qui dit sa mort (au nœud de sa mort).
        expect('entry' in effect && effect.entry.key === 'ch2.zachary', `${id} : effet ${JSON.stringify(effect)}`).toBe(true);
      }
      for (const c of node.choices ?? []) {
        const label = `${id} : « ${c.text} »`;
        expect(c.check, label).toBeUndefined();
        expect(c.effects ?? [], label).toEqual([]);
        expect(c.successEffects ?? [], label).toEqual([]);
        expect(c.failureEffects ?? [], label).toEqual([]);
      }
    }
    // Les gestes et l'arrachement sont de vrais choix : deux nœuds au moins, sans condition.
    const realChoices = [...mourning].filter((id) => {
      const choices = EGOUTS.nodes[id]?.choices ?? [];
      return choices.length >= 2 && choices.every((c) => c.conditions === undefined);
    });
    expect(realChoices.length).toBeGreaterThanOrEqual(2);
  });

  it('les décors de la séquence : egouts-zachary jusqu’à sa mort, puis egouts-arrachee', () => {
    for (const id of [...reachableFrom(EGOUTS, EGOUTS.start, deathNodeId), deathNodeId]) {
      const node = EGOUTS.nodes[id] as DialogueNode;
      if (!isRouting(node)) expect(node.backdrop, id).toBe('egouts-zachary');
    }
    const afterDeath = reachableFrom(EGOUTS, deathNodeId, DECISION_NODE);
    afterDeath.delete(deathNodeId);
    expect(afterDeath.size).toBeGreaterThan(0);
    for (const id of afterDeath) expect(EGOUTS.nodes[id]?.backdrop, id).toBe('egouts-arrachee');
  });

  it.each(Object.keys(DIALOGUES).filter((id) => id.startsWith('ch2.')))(
    '%s : le portrait de l’enfant ne reste pas sur la narration qui suit sa réplique',
    (id) => {
      const file = DIALOGUES[id] as DialogueFile;
      if (file.speaker === 'enfant') return; // sa propre scène : son portrait y est le repli voulu
      for (const [nodeId, node] of Object.entries(file.nodes)) {
        const lines = node.lines ?? [];
        if (lines[lines.length - 1]?.who !== 'enfant') continue;
        for (const next of shownSuccessors(file, nodeId)) {
          const nextNode = file.nodes[next] as DialogueNode;
          // Un autre locuteur prend la place, ou le fichier a son propre locuteur de repli.
          const replaced = (nextNode.lines ?? []).length > 0 || file.speaker !== undefined;
          expect(replaced, `${id} : « ${next} » hérite du portrait de l’enfant`).toBe(true);
        }
      }
    },
  );

  it.each(['ch2.egouts', 'ch2.murano', 'ch2.decharges', 'ch2.charcudoc'])(
    '%s : l’enfant parle, méfiant sans enfant-confiance, accroché à quelqu’un avec',
    (id) => {
      const file = DIALOGUES[id] as DialogueFile;
      const confiance = new Set<string>();
      const mefiant = new Set<string>();
      for (const node of Object.values(file.nodes)) {
        for (const c of node.choices ?? []) {
          const target = c.to ? file.nodes[c.to] : undefined;
          const said = (target?.lines ?? []).filter((l) => l.who === 'enfant').map((l) => l.text);
          if (said.length === 0) continue;
          const conds = JSON.stringify(c.conditions ?? []);
          if (conds.includes('{"not":{"tag":"enfant-confiance"}}')) said.forEach((t) => mefiant.add(t));
          else if (conds.includes('{"tag":"enfant-confiance"}')) said.forEach((t) => confiance.add(t));
        }
      }
      expect(confiance.size, 'réplique avec enfant-confiance').toBeGreaterThan(0);
      expect(mefiant.size, 'réplique sans enfant-confiance').toBeGreaterThan(0);
      for (const t of confiance) expect(mefiant.has(t), t).toBe(false);
    },
  );

  it('relais de garde : chaque veilleur a sa réplique quand il tient, et une autre quand l’enfant le réveille', () => {
    const file = DIALOGUES['ch2.decharges'] as DialogueFile;
    const seen = new Map<string, { tient: Set<string>; reveil: Set<string> }>();
    for (const node of Object.values(file.nodes)) {
      for (const c of node.choices ?? []) {
        if (c.check?.skill !== 'resistance') continue;
        const who = c.check.who as string;
        const joker = (c.effects ?? []).some((e) => 'flag' in e && e.flag === 'ch2.garde.enfant-utilise');
        const success = file.nodes[c.onSuccess as string] as DialogueNode;
        expect(success.text, `${c.onSuccess} : une réplique entre guillemets`).toMatch(/«.+»/);
        expect(success.to, `${c.onSuccess} : reprend le relais`).toBe('garde-continue');
        expect(success.effects, `${c.onSuccess} : aucun effet`).toBeUndefined();
        const entry = seen.get(who) ?? { tient: new Set<string>(), reveil: new Set<string>() };
        (joker ? entry.reveil : entry.tient).add(success.text as string);
        seen.set(who, entry);
      }
    }
    expect([...seen.keys()].sort()).toEqual(['abigail', 'franklyn', 'grover', 'john']);
    const all: string[] = [];
    for (const [who, { tient, reveil }] of seen) {
      expect(tient.size, `${who} : une réplique quand il tient`).toBe(1);
      expect(reveil.size, `${who} : une réplique quand l'enfant le réveille`).toBe(1);
      all.push(...tient, ...reveil);
    }
    expect(new Set(all).size, 'huit répliques distinctes').toBe(8);
  });
});

/**
 * Lot 5.14 (ajout du propriétaire, GAME-DESIGN scène 12) : le Blue Purple. Le fichier n'a ni jet ni
 * aléatoire : chaque chemin se déroule entièrement (DFS sur les choix), pour toutes les
 * combinaisons de ce que la nuit a laissé -- état de Letitia, `abigail-brisee`, `a-tue`,
 * `vu-simulation`, `enfant-confiance` et à qui l'enfant s'accroche.
 */
describe('lot 5.14 : le Blue Purple (ch2.bluepurple)', () => {
  const BLUE = DIALOGUES['ch2.bluepurple'] as DialogueFile;
  const PREMIER_MOT = 'ch2.inconnue.premier-mot';
  /** Premier nœud où l'inconnue est à leur table : ce qui précède est l'attente. */
  const ARRIVAL_NODE = 'arrivee';
  const FACTOR_TAGS = ['abigail-brisee', 'a-tue', 'vu-simulation', 'enfant-confiance'] as const;

  interface Night {
    letitia: number;
    tags: string[];
    lien?: 'franklyn' | 'grover';
  }
  interface BluePath {
    night: Night;
    /** Répliques et narration de l'attente (avant l'arrivée de l'inconnue), dans l'ordre. */
    waiting: string[];
    trail: string[];
    ctx: NarrativeContext;
  }

  const nights: Night[] = [];
  for (let letitia = LETITIA_MIN; letitia <= LETITIA_MAX; letitia++) {
    for (let mask = 0; mask < 1 << FACTOR_TAGS.length; mask++) {
      const tags = FACTOR_TAGS.filter((_, i) => mask & (1 << i));
      for (const lien of [undefined, 'franklyn', 'grover'] as const) nights.push({ letitia, tags, lien });
    }
  }

  function walkBlue(night: Night): BluePath[] {
    const paths: BluePath[] = [];
    const explore = (prefix: number[]): void => {
      let run = setFlag(createRunState('ch2Content::blue', { chapter: 2, sceneId: 'ch2.bluepurple', luck: 0 }), LETITIA_COUNTER, night.letitia);
      if (night.lien) run = setFlag(run, 'ch2.enfant.lien', night.lien);
      const runner = new DialogueRunner(BLUE, { dossier: { ...createDossier(), tags: night.tags }, run }, createRng('ch2Content::blue'));
      const trail: string[] = [];
      const waiting: string[] = [];
      const note = (): void => {
        const node = runner.current();
        if (trail[trail.length - 1] === node.nodeId) return;
        trail.push(node.nodeId);
        if (!trail.includes(ARRIVAL_NODE)) waiting.push(node.text ?? '', ...node.lines.map((l) => `${l.who}: ${l.text}`));
      };
      const settle = (): void => {
        note();
        for (let guard = 0; guard < 40 && !runner.current().finished; guard++) {
          const node = runner.current();
          if (node.choices.length > 1) return;
          if (node.choices[0]) runner.choose(node.choices[0].index);
          else runner.advance();
          note();
        }
      };
      settle();
      for (const index of prefix) {
        runner.choose(index);
        settle();
      }
      const node = runner.current();
      if (node.finished) paths.push({ night, waiting, trail, ctx: runner.context });
      else node.choices.forEach((c) => explore([...prefix, c.index]));
    };
    explore([]);
    return paths;
  }

  const paths = nights.flatMap(walkBlue);

  it('scène 12 : juste après le charcudoc, la dernière du chapitre', () => {
    const scenes = CHAPTER_2.scenes;
    expect(scenes[scenes.length - 1]).toMatchObject({ id: 'ch2.bluepurple', kind: 'dialogue', number: 12 });
    expect(scenes[scenes.length - 2]?.id).toBe('ch2.charcudoc');
  });

  it('l’entrée ch2.inconnue.premier-mot est écrite sur tout chemin, avec le drapeau que lit le bilan', () => {
    expect(paths.length).toBeGreaterThan(nights.length); // la décision a bien plusieurs issues
    const values = new Set<string>();
    for (const { night, trail, ctx } of paths) {
      const label = `${JSON.stringify(night)} : ${trail.join(' > ')}`;
      const entry = ctx.dossier.entries.find((e) => e.key === PREMIER_MOT);
      expect(entry, label).toBeDefined();
      expect(ctx.run.flags[PREMIER_MOT], label).toBeDefined();
      values.add(entry!.value);
    }
    expect(values.size, 'méfiant, direct, laisser parler John').toBe(3);
  });

  it('aucun jet ni effet mécanique : seules l’entrée et son drapeau miroir sont écrits', () => {
    for (const node of Object.values(BLUE.nodes)) expect(node.insight).toBeUndefined();
    for (const choice of allChoices(BLUE)) expect(choice.check, choice.text).toBeUndefined();
    for (const effect of allEffects(BLUE)) {
      const ok = ('entry' in effect && effect.entry.key === PREMIER_MOT) || ('flag' in effect && effect.flag === PREMIER_MOT);
      expect(ok, JSON.stringify(effect)).toBe(true);
    }
  });

  it('l’attente lit la nuit : au moins deux variantes selon l’état de Letitia, et selon chaque étiquette', () => {
    const waitingFor = (pred: (n: Night) => boolean): Set<string> =>
      new Set(paths.filter((p) => pred(p.night)).map((p) => p.waiting.join(' | ')));
    const byLetitia = new Set(paths.map((p) => p.waiting.find((w) => w.startsWith('grover:'))));
    expect(byLetitia.size, 'la réplique sur le délai de Letitia').toBeGreaterThanOrEqual(2);
    // Même nuit, seul l'état de Letitia change : l'attente change aussi (« quelques heures » / « demain soir »).
    const base = (n: Night) => n.tags.length === 0 && n.lien === undefined;
    expect(waitingFor((n) => base(n) && n.letitia === LETITIA_MIN)).not.toEqual(waitingFor((n) => base(n) && n.letitia === LETITIA_MAX));
    for (const tag of FACTOR_TAGS) {
      const without = waitingFor((n) => n.letitia === LETITIA_MIN && n.lien === undefined && n.tags.length === 0);
      const withTag = waitingFor((n) => n.letitia === LETITIA_MIN && n.lien === undefined && n.tags.length === 1 && n.tags[0] === tag);
      expect(withTag, `« ${tag} » ne change rien à l'attente`).not.toEqual(without);
    }
  });

  it('le portrait de l’inconnue : absent de l’attente, le sien dès qu’elle s’assoit, et le dernier du chapitre', () => {
    // Pas de locuteur de fichier : il afficherait son portrait sur l'entrée dans le bar.
    expect(BLUE.speaker).toBeUndefined();
    for (const { night, waiting, trail } of paths) {
      const label = `${JSON.stringify(night)} : ${trail.join(' > ')}`;
      expect(waiting.some((w) => w.startsWith('inconnue:')), label).toBe(false);
      const arrival = BLUE.nodes[ARRIVAL_NODE] as DialogueNode;
      expect(arrival.lines?.[arrival.lines.length - 1]?.who, 'elle parle dès son arrivée').toBe('inconnue');
      const last = BLUE.nodes[trail[trail.length - 1] as string] as DialogueNode;
      expect(last.lines?.[last.lines.length - 1]?.who, label).toBe('inconnue');
      // Le décor de la rencontre, de son arrivée à la fin.
      for (const id of trail.slice(trail.indexOf(ARRIVAL_NODE))) expect(BLUE.nodes[id]?.backdrop, id).toBe('blue-purple-rencontre');
    }
  });
});
