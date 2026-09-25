/**
 * L'examen ecrit vivant (lot 3.3, ADR 0015 §1 et §3) : la concentration
 * (reflexion facultative a cout), la vigilance du surveillant (DV variable),
 * et la triche (Zachary a la question 2, la copie de Letitia a la question 4,
 * l'aide a Grover a la question 5). Joue directement `DIALOGUES['ch1.exam']`
 * (donnee reelle, pas un graphe de test) pour couvrir le contenu livre, pas
 * seulement le moteur.
 */

import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { createDossier } from '@/core/dossier';
import { createRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import { DIALOGUES } from '@/data/dialogues/registry';
import type { DialogueFile } from '@/narrative/types';

function requireDialogue(id: string): DialogueFile {
  const file = DIALOGUES[id];
  if (!file) throw new Error(`${id} introuvable dans le registre des dialogues.`);
  return file;
}

const EXAM = requireDialogue('ch1.exam');

/** Chance a 0 (comme narrativeRunner.test.ts) : aucun de ces tests ne porte sur la Chance. */
function context(): NarrativeContext {
  return { dossier: createDossier(), run: { ...createRunState('graine-exam-test'), luck: 0 } };
}

/**
 * Graines tirees par recherche exhaustive (meme methode que les
 * `seed-search-*` de narrativeRunner.test.ts) sur le PREMIER jet de
 * Discretion de la partie (Franklyn : DEX 5, Discretion 4, total de base 9) :
 * - `cheat-search-0` : reussite large (marge +12 a NORMALE, +10 a DIFFICILE) --
 *   jamais rattrapable a la Chance de toute facon (`luck` vaut 0 ci-dessus).
 * - `cheat-search-3` : echec large (marge -8 a NORMALE, -10 a DIFFICILE).
 */
const SEED_DISCRETION_SUCCESS = 'cheat-search-0';
const SEED_DISCRETION_FAILURE = 'cheat-search-3';

/**
 * Avance ouverture -> question1 -> question2 -> question3 -> question4, sans
 * jamais lancer de reflexion (Rng intact pour le premier jet reel : la
 * triche a la question 4) ET sans jamais choisir la reponse "best" (index 0
 * de question1 et question2, index 1 de question3 -- verifie contre
 * ch1.exam.json) : ces tests portent sur la triche, pas sur le score
 * legitime des questions precedentes.
 */
function reachQuestion4(rng = createRng('graine-neutre')): DialogueRunner {
  const runner = new DialogueRunner(EXAM, context(), rng);
  runner.advance(); // ouverture -> question1
  runner.choose(0); // question1 -> question2 (pas la reponse best)
  runner.choose(0); // question2 -> question3 (pas la reponse best)
  runner.choose(1); // question3 -> question4 (pas la reponse best, qui est l index 0 ici)
  expect(runner.current().nodeId).toBe('question4');
  expect(runner.context.run.flags['ch1.exam.bonnes-reponses']).toBeUndefined();
  return runner;
}

describe('la concentration (ADR 0015 §1)', () => {
  it('commence a 3 points, propres a l examen (poses par l effet de "ouverture")', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-concentration'));
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(3);
  });

  it('chaque reflexion facultative coute un point, jusqu a epuisement', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-concentration-2'));
    runner.advance(); // ouverture -> question1
    expect(runner.current().insight?.affordable).toBe(true);

    runner.rollInsight(); // question1 : 3 -> 2
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(2);
    runner.choose(0);

    runner.rollInsight(); // question2 : 2 -> 1
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(1);
    runner.choose(0);

    runner.rollInsight(); // question3 : 1 -> 0
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(0);
    expect(runner.current().insight?.affordable).toBe(false);
  });

  it('le bouton "disparait" cote donnees (affordable=false) une fois les 3 points epuises, mais repondre reste possible', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-concentration-3'));
    runner.advance(); // ouverture -> question1
    runner.rollInsight();
    runner.choose(0);
    runner.rollInsight();
    runner.choose(0);
    runner.rollInsight();
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(0);

    const insight = runner.current().insight;
    expect(insight?.optional).toBe(true);
    expect(insight?.affordable).toBe(false);
    // Repondre sans reflexion reste possible (facultatif : jamais bloquant).
    expect(runner.choose(0).ok).toBe(true);
  });

  it('une reflexion refusee faute de point ne consomme rien (le compteur reste a 0)', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-concentration-4'));
    runner.advance(); // ouverture -> question1
    runner.rollInsight(); // question1 : 3 -> 2
    runner.choose(0);
    runner.rollInsight(); // question2 : 2 -> 1
    runner.choose(0);
    runner.rollInsight(); // question3 : 1 -> 0
    runner.choose(0); // -> question4 (le portail de triche, pas d insight ici)
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(0);

    runner.choose(1); // "Repondre sans regarder ailleurs." -> question4-reponses (a de nouveau un insight)
    expect(runner.current().insight?.affordable).toBe(false);

    const refused = runner.rollInsight();
    expect(refused.ok).toBe(false);
    expect(refused.reason).toBe('Plus de concentration.');
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(0);
  });

  it('est remise a zero a la sortie de l examen (noeud "fin")', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-concentration-fin'));
    // Traverse tout l examen sans jamais reflechir ni tricher : six reponses neutres.
    runner.advance(); // ouverture -> question1
    runner.choose(0); // -> question2
    runner.choose(0); // -> question3
    runner.choose(0); // -> question4
    runner.choose(1); // "Repondre sans regarder ailleurs." -> question4-reponses
    runner.choose(0); // -> question5
    runner.choose(1); // "Refuser, trop risque." -> question5-reponses
    runner.choose(0); // -> question6
    runner.choose(1); // -> fin
    expect(runner.current().nodeId).toBe('fin');
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(0);
  });
});

describe('la vigilance du surveillant (ADR 0015 §3)', () => {
  it('monte de 1 a CHAQUE tentative, reussie ou non', () => {
    const runnerEchec = reachQuestion4(createRng(SEED_DISCRETION_FAILURE));
    expect(runnerEchec.context.run.flags['ch1.exam.vigilance']).toBeUndefined();
    runnerEchec.choose(0); // [Discretion] Regarder la copie de Letitia -> echec
    expect(runnerEchec.current().nodeId).toBe('question4-pris');
    expect(runnerEchec.context.run.flags['ch1.exam.vigilance']).toBe(1);

    const runnerSucces = reachQuestion4(createRng(SEED_DISCRETION_SUCCESS));
    runnerSucces.choose(0);
    expect(runnerSucces.current().nodeId).toBe('question4-informe');
    expect(runnerSucces.context.run.flags['ch1.exam.vigilance']).toBe(1);
  });

  it('la DV de Discretion presentee suit le niveau de vigilance (NORMALE au premier essai)', () => {
    const runner = reachQuestion4();
    expect(runner.current().choices.find((c) => c.check)?.check?.dvLabel).toBe('NORMALE');
  });

  it('suivre Zachary (question 2) est aussi une tentative -- sans jet, elle fait quand meme monter la vigilance', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-zachary-vigilance'));
    runner.advance(); // ouverture -> question1
    runner.choose(0); // -> question2
    expect(runner.context.run.flags['ch1.exam.vigilance']).toBeUndefined();

    const suivreZachary = runner.current().choices.find((c) => c.text.includes('Zachary'));
    runner.choose(suivreZachary!.index);
    expect(runner.context.run.flags['ch1.exam.vigilance']).toBe(1);
  });

  it('les trois occasions cumulees font monter la DV jusqu a TRES_DIFFICILE, jamais EXCEPTIONNELLE (chapitre 1)', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng(SEED_DISCRETION_SUCCESS));
    runner.advance(); // ouverture -> question1
    runner.choose(0); // -> question2

    // 1re tentative : suivre Zachary (pas de jet, vigilance 0 -> 1).
    const suivreZachary = runner.current().choices.find((c) => c.text.includes('Zachary'));
    runner.choose(suivreZachary!.index); // -> question3
    runner.choose(1); // -> question4 (pas la reponse best)
    expect(runner.context.run.flags['ch1.exam.vigilance']).toBe(1);
    // La DV du portail de question4 reflete deja cette 1re tentative.
    expect(runner.current().choices.find((c) => c.check)?.check?.dvLabel).toBe('DIFFICILE');

    // 2e tentative : regarder la copie de Letitia (jet, vigilance 1 -> 2, quel que soit le resultat).
    runner.choose(0);
    expect(runner.context.run.flags['ch1.exam.vigilance']).toBe(2);
    runner.advance(); // -> question4-reponses(-pris)
    runner.choose(1); // -> question5

    // 3e tentative (Grover) : la DV du portail de question5 reflete les 2 tentatives precedentes.
    expect(runner.current().choices.find((c) => c.check)?.check?.dvLabel).toBe('TRES_DIFFICILE');
  });
});

describe('pris en train de tricher (question 4 : la copie de Letitia)', () => {
  it('pose l etiquette "pris-a-tricher" et penalise Letitia, immediatement', () => {
    const runner = reachQuestion4(createRng(SEED_DISCRETION_FAILURE));
    runner.choose(0);
    expect(runner.current().nodeId).toBe('question4-pris');
    expect(runner.context.dossier.tags).toContain('pris-a-tricher');
    expect(runner.context.dossier.affinities.letitia).toBe(0); // depart +1 (fiche) - 1 = 0
  });

  it('la question vaut zero QUOI QU ON REPONDE ENSUITE, meme en choisissant le texte de la meilleure reponse', () => {
    const runner = reachQuestion4(createRng(SEED_DISCRETION_FAILURE));
    runner.choose(0); // -> question4-pris
    runner.advance(); // -> question4-reponses-pris
    expect(runner.current().nodeId).toBe('question4-reponses-pris');

    // Index 1 porte le MEME texte que la reponse "best" de question4-reponses,
    // mais sans l effet de compteur : le choisir ne doit rien verser.
    const bestLookingChoice = runner.current().choices[1];
    expect(bestLookingChoice?.text).toContain('sécurise le périmètre');
    runner.choose(1);
    expect(runner.context.run.flags['ch1.exam.bonnes-reponses']).toBeUndefined();
  });

  it('ne propose plus de reflexion (elle ne rapporterait plus rien) -- les etiquettes de doctrine restent', () => {
    const runner = reachQuestion4(createRng(SEED_DISCRETION_FAILURE));
    runner.choose(0); // -> question4-pris
    runner.advance(); // -> question4-reponses-pris
    expect(runner.current().nodeId).toBe('question4-reponses-pris');
    expect(runner.current().insight).toBeUndefined();

    // Repondre reste possible et pose toujours une etiquette de doctrine.
    runner.choose(0); // "On les laisse faire..." -> tag cynique
    expect(runner.context.dossier.tags).toContain('cynique');
  });
});

describe('tricher sans etre pris', () => {
  it('question 4 (copie de Letitia) reussie pose "tricheur", jamais "pris-a-tricher"', () => {
    const runner = reachQuestion4(createRng(SEED_DISCRETION_SUCCESS));
    runner.choose(0);
    expect(runner.current().nodeId).toBe('question4-informe');
    expect(runner.context.dossier.tags).toContain('tricheur');
    expect(runner.context.dossier.tags).not.toContain('pris-a-tricher');
  });

  it('question 2 (suivre Zachary) pose "tricheur" sans aucun jet -- toujours indetectable', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-zachary'));
    runner.advance(); // ouverture -> question1
    runner.choose(0); // -> question2
    const suivreZachary = runner.current().choices.find((c) => c.text.includes('Zachary'));
    expect(suivreZachary).toBeDefined();
    const before = runner.context.dossier.affinities.zachary ?? 0;
    runner.choose(suivreZachary!.index);
    expect(runner.context.dossier.tags).toContain('tricheur');
    expect(runner.context.dossier.affinities.zachary).toBe(before + 1);
    // Ce n est pas la meilleure reponse : aucun point de bonnes-reponses.
    expect(runner.context.run.flags['ch1.exam.bonnes-reponses']).toBeUndefined();
  });
});

describe('la reflexion n est jamais offerte sur une copie deja marquee "pris"', () => {
  it('question4-reponses-pris n a pas d insight, question4-reponses (non pris) en a toujours un', () => {
    const pris = reachQuestion4(createRng(SEED_DISCRETION_FAILURE));
    pris.choose(0);
    pris.advance();
    expect(pris.current().nodeId).toBe('question4-reponses-pris');
    expect(pris.current().insight).toBeUndefined();

    const nonPris = reachQuestion4(createRng(SEED_DISCRETION_SUCCESS));
    nonPris.choose(1); // "Repondre sans regarder ailleurs." -> question4-reponses, jamais marquee
    expect(nonPris.current().nodeId).toBe('question4-reponses');
    expect(nonPris.current().insight).toBeDefined();
  });

  it('question5-reponses-pris n a pas d insight, question5-reponses (non pris) en a toujours un', () => {
    // N a jamais tente la triche a la question 4 (repond directement) : vigilance
    // encore a 0 en arrivant a la question 5, meme graine d echec que SEED_DISCRETION_FAILURE.
    const pris = reachQuestion4(createRng(SEED_DISCRETION_FAILURE));
    pris.choose(1); // "Repondre sans regarder ailleurs." -> question4-reponses
    pris.choose(0); // reponse quelconque -> question5
    expect(pris.current().nodeId).toBe('question5');
    expect(pris.context.run.flags['ch1.exam.vigilance']).toBeUndefined();

    pris.choose(0); // [Discretion] Glisser une reponse a Grover -> echec (meme graine qu a la question 4)
    expect(pris.current().nodeId).toBe('question5-pris');
    pris.advance();
    expect(pris.current().nodeId).toBe('question5-reponses-pris');
    expect(pris.current().insight).toBeUndefined();

    const nonPris = reachQuestion4(createRng(SEED_DISCRETION_SUCCESS));
    nonPris.choose(1); // "Repondre sans regarder ailleurs." -> question4-reponses
    nonPris.choose(0); // reponse quelconque -> question5
    expect(nonPris.current().nodeId).toBe('question5');
    nonPris.choose(1); // "Refuser, trop risque." -> question5-reponses (jamais marquee)
    expect(nonPris.current().nodeId).toBe('question5-reponses');
    expect(nonPris.current().insight).toBeDefined();
  });
});

describe('les deux etiquettes de triche sont lues quelque part (jamais un cout sans recette)', () => {
  /** Meme mecanisme que `narrativeDeadEnds.test.ts` (`vocabulary()`) : les etiquettes lues par une condition, dans TOUS les dialogues du chapitre. */
  function tagsReadSomewhere(): Set<string> {
    const tags = new Set<string>();
    for (const file of Object.values(DIALOGUES)) {
      for (const node of Object.values(file.nodes)) {
        for (const choice of node.choices ?? []) {
          const walk = (cond: unknown): void => {
            if (!cond || typeof cond !== 'object') return;
            const c = cond as Record<string, unknown>;
            if (typeof c.tag === 'string') tags.add(c.tag);
            if (c.not) walk(c.not);
            if (Array.isArray(c.all)) c.all.forEach(walk);
            if (Array.isArray(c.any)) c.any.forEach(walk);
          };
          (choice.conditions ?? []).forEach(walk);
        }
      }
    }
    return tags;
  }

  it('"tricheur" est lu par une condition (au bal)', () => {
    expect(tagsReadSomewhere().has('tricheur')).toBe(true);
  });

  it('"pris-a-tricher" est lu par une condition (au bal, par le directeur)', () => {
    expect(tagsReadSomewhere().has('pris-a-tricher')).toBe(true);
  });
});

describe('les affinites de la triche comptent immediatement pour le tirage qui suit (ADR 0014, ADR 0015 §3)', () => {
  it('l affinite gagnee en trichant pour Zachary est deja presente quand ch1.tirage demarre', () => {
    const runner = new DialogueRunner(EXAM, context(), createRng('graine-enchainement'));
    runner.advance();
    runner.choose(0);
    const suivreZachary = runner.current().choices.find((c) => c.text.includes('Zachary'));
    runner.choose(suivreZachary!.index);
    const zacharyApresTriche = runner.context.dossier.affinities.zachary ?? 0;

    // Enchainement reel (ChapterApp.completeDialogueScene -> mergeContext -> scene suivante) :
    // le contexte FINAL de ch1.exam (dossier inclus) est ce qui nourrit le DialogueRunner de
    // ch1.tirage -- exactement ce que fait `mergeContext`/`enterDialogueScene` dans chapter.ts.
    const tirage = requireDialogue('ch1.tirage');
    const tirageRunner = new DialogueRunner(tirage, runner.context, createRng('graine-enchainement::ch1.tirage'));

    expect(tirageRunner.context.dossier.affinities.zachary).toBe(zacharyApresTriche);
  });
});

/**
 * L'enonce reste sous les yeux du joueur (`DialogueNode.recall`). Defaut constate en jeu :
 * tricher a la question 4 ou 5 emmene sur un noeud qui ne dit plus que "Reste a repondre",
 * l'enonce du surveillant ayant disparu avec le noeud precedent. On teste ce que le CONTENU
 * produit -- l'enonce present sur le noeud de reponse --, pas le mecanisme qui le porte.
 */
describe('examen ecrit : la question reste lisible apres la triche', () => {
  const CHEAT_NODES: Array<{ reponses: string; enonce: string }> = [
    { reponses: 'question4-reponses', enonce: 'question4' },
    { reponses: 'question4-reponses-pris', enonce: 'question4' },
    { reponses: 'question5-reponses', enonce: 'question5' },
    { reponses: 'question5-reponses-pris', enonce: 'question5' },
  ];

  it.each(CHEAT_NODES)('$reponses rappelle l enonce de $enonce', ({ reponses, enonce }) => {
    const runner = new DialogueRunner(EXAM, context(), createRng('g-rappel'), { startNode: reponses });
    const recall = runner.current().recall ?? [];
    const attendu = (EXAM.nodes[enonce]?.lines ?? []).find((l) => l.who === 'instructeur');
    expect(attendu, `${enonce} n'a pas de réplique du surveillant`).toBeDefined();
    expect(recall.map((l) => l.text)).toContain(attendu?.text);
  });
});
