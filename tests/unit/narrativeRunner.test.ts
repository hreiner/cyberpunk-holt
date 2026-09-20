import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { addTags, createDossier } from '@/core/dossier';
import { applyTeamEffect, createRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import type { DialogueFile } from '@/narrative/types';
import { validateDialogue } from '@/narrative/validate';

/**
 * Chance a 0 par defaut (ADR 0015 §2) : ces tests preexistants ne portent pas
 * sur la Chance, et `createRunState` lui donne desormais 3 points par defaut
 * -- sans ce garde-fou, un jet rate de peu sur une graine qui n'a pas ete
 * choisie pour ca basculerait en attente (`awaitingLuck`) au lieu de se
 * resoudre tout de suite. Les tests dedies a la Chance (plus bas) fixent
 * `luck` explicitement.
 */
function context(): NarrativeContext {
  return { dossier: createDossier(), run: { ...createRunState('graine-narrative-test'), luck: 0 } };
}

const graphAvecBoucle: DialogueFile = {
  id: 'test.boucle',
  start: 'a',
  nodes: {
    a: {
      text: 'Depart.',
      effects: [{ counter: 'a-entrees', delta: 1 }],
      choices: [{ text: 'Aller vers b', to: 'b' }],
    },
    b: {
      text: 'Ailleurs.',
      choices: [
        { text: 'Revenir vers a', to: 'a' },
        { text: 'Terminer', to: 'fin' },
      ],
    },
    fin: { text: 'Fin.' },
  },
};

const graphAvecConditions: DialogueFile = {
  id: 'test.conditions',
  start: 'a',
  nodes: {
    a: {
      text: 'Un choix.',
      choices: [
        { text: 'Toujours visible', to: 'b' },
        { text: 'Cache sans etiquette', to: 'b', conditions: [{ tag: 'debloque' }] },
      ],
    },
    b: { text: 'Fin.' },
  },
};

const graphAvecInsight: DialogueFile = {
  id: 'test.insight',
  start: 'question',
  nodes: {
    question: {
      text: 'Une question.',
      insight: {
        skill: 'education',
        dv: 'NORMALE',
        successText: 'Ca lui revient.',
        failureText: 'Rien.',
        successEffects: [{ tag: 'sait' }],
        failureEffects: [{ tag: 'bluffe' }],
      },
      choices: [
        { text: 'Reponse A', to: 'fin', best: true, effects: [{ counter: 'bonnes-reponses', delta: 1 }] },
        { text: 'Reponse B', to: 'fin' },
      ],
    },
    fin: { text: 'Fin.' },
  },
};

const graphAvecJet: DialogueFile = {
  id: 'test.jet',
  start: 'depart',
  nodes: {
    depart: {
      text: 'Ouverture.',
      choices: [
        {
          text: '[Perception] Regarder autour.',
          check: { skill: 'perception', dv: 'NORMALE' },
          onSuccess: 'succes',
          onFailure: 'echec',
          successEffects: [{ tag: 'observateur' }],
          failureEffects: [{ tag: 'distrait' }],
        },
      ],
    },
    succes: { text: 'Bien vu.' },
    echec: { text: 'Rien remarque.' },
  },
};

describe('DialogueRunner', () => {
  it("applique les effets d'un noeud une seule fois meme si on y revient", () => {
    const runner = new DialogueRunner(graphAvecBoucle, context(), createRng('graine-boucle'));
    runner.choose(0); // a -> b
    runner.choose(0); // b -> a (revisite)
    expect(runner.context.run.flags['a-entrees']).toBe(1);
  });

  it(
    'refuse explicitement un choix filtre par son index d origine (defaut 1, regle 3 ' +
      "d'AGENTS.md), et accepte celui reellement offert",
    () => {
      const runner = new DialogueRunner(graphAvecConditions, context(), createRng('graine-conditions'));
      expect(runner.current().choices).toHaveLength(1);
      // Le seul choix presente garde son index d'origine (0) : rien de filtre avant lui ici.
      expect(runner.current().choices[0]?.index).toBe(0);

      // Choisir l'index cache (1, filtre par sa condition) : refuse
      // EXPLICITEMENT -- ni exception, ni transition silencieuse, une raison
      // francaise affichable telle quelle. C'est le defaut 1 du rapport de
      // cloture epic 2 : avant ce correctif, cet appel ne faisait rien du
      // tout, sans le moindre signal.
      const refused = runner.choose(1);
      expect(refused.ok).toBe(false);
      expect(refused.reason).toBeTruthy();
      expect(runner.current().nodeId).toBe('a');
      expect(runner.finished).toBe(false);

      // Le choix reellement offert, lui, passe.
      const accepted = runner.choose(0);
      expect(accepted.ok).toBe(true);
      expect(runner.current().nodeId).toBe('b');
    },
  );

  it('presente le choix une fois la condition remplie', () => {
    const ctx: NarrativeContext = {
      dossier: addTags(createDossier(), ['debloque']),
      run: createRunState('g'),
    };
    const runner = new DialogueRunner(graphAvecConditions, ctx, createRng('graine-conditions-2'));
    expect(runner.current().choices).toHaveLength(2);
  });

  it("resout un jet et applique les effets de succes ou d'echec, de facon deterministe a graine fixe", () => {
    const runA = new DialogueRunner(graphAvecJet, context(), createRng('graine-jet-fixe'));
    runA.choose(0);
    const runB = new DialogueRunner(graphAvecJet, context(), createRng('graine-jet-fixe'));
    runB.choose(0);

    // Meme graine, meme deroulement : le jet est reproductible.
    expect(runA.current().nodeId).toBe(runB.current().nodeId);
    expect(runA.current().lastRoll).toBe(runB.current().lastRoll);

    const succes = runA.current().nodeId === 'succes';
    expect(runA.context.dossier.tags).toContain(succes ? 'observateur' : 'distrait');
    expect(runA.current().lastRoll).toContain(succes ? 'reussite' : 'echec');
    expect(runA.current().finished).toBe(true);
  });

  it('affiche la chance de reussite sur un choix a jet', () => {
    const runner = new DialogueRunner(graphAvecJet, context(), createRng('graine-affichage'));
    const [choice] = runner.current().choices;
    expect(choice?.check).toBeDefined();
    expect(choice?.check?.skillLabel).toBe('Perception');
    expect(choice?.check?.dvLabel).toBe('NORMALE');
    expect(choice?.check?.chancePercent).toBeGreaterThan(0);
    expect(choice?.check?.chancePercent).toBeLessThanOrEqual(100);
  });

  it(
    'accumule plusieurs cadets gazes salle 3 au lieu de n en retenir qu un seul ' +
      '(regression defaut 3, rester en salle 3 et rater plusieurs jets de Resistance)',
    () => {
      let run = createRunState('graine-gaz-multiple');
      run = applyTeamEffect(run, 'blue', { gassed: 'zachary' });
      run = applyTeamEffect(run, 'blue', { gassed: 'john' });
      run = applyTeamEffect(run, 'blue', { gassed: 'franklyn' });
      // Un meme cadet rate son jet deux fois (relance narrative improbable) :
      // pas de doublon dans la liste.
      run = applyTeamEffect(run, 'blue', { gassed: 'zachary' });

      expect(run.teams.blue.gassedMembers).toEqual(['zachary', 'john', 'franklyn']);
    },
  );
});

describe('DialogueRunner - jet de reflexion (examen ecrit, ADR 0012)', () => {
  it('commence en attente et refuse tout choix avant rollInsight()', () => {
    const runner = new DialogueRunner(graphAvecInsight, context(), createRng('graine-insight-pending'));
    expect(runner.current().insight?.status).toBe('pending');

    const refused = runner.choose(0);
    expect(refused.ok).toBe(false);
    expect(refused.reason).toBeTruthy();
    expect(runner.current().nodeId).toBe('question');
    expect(runner.finished).toBe(false);
  });

  it('un jet reussi revele exactement le choix best, jamais l autre', () => {
    // Graine tiree par recherche exhaustive (voir le rapport de la tache) : produit
    // une reussite pour education (Franklyn, INT 8 + Education 5) contre DV NORMALE.
    const runner = new DialogueRunner(graphAvecInsight, context(), createRng('seed-search-0'));
    const outcome = runner.rollInsight();
    expect(outcome.ok).toBe(true);

    const node = runner.current();
    expect(node.insight?.status).toBe('success');
    expect(node.insight?.successText).toBe('Ca lui revient.');
    expect(node.choices.find((c) => c.index === 0)?.best).toBe(true);
    expect(node.choices.find((c) => c.index === 1)?.best).toBeUndefined();
    expect(runner.context.dossier.tags).toContain('sait');
  });

  it('un jet echoue ne revele aucun choix best', () => {
    // Meme recherche, graine produisant un echec.
    const runner = new DialogueRunner(graphAvecInsight, context(), createRng('seed-search-21'));
    const outcome = runner.rollInsight();
    expect(outcome.ok).toBe(true);

    const node = runner.current();
    expect(node.insight?.status).toBe('failure');
    expect(node.insight?.failureText).toBe('Rien.');
    expect(node.choices.every((c) => c.best === undefined)).toBe(true);
    expect(runner.context.dossier.tags).toContain('bluffe');
  });

  it('deterministe a graine fixe : meme issue, meme chaine de des', () => {
    const runA = new DialogueRunner(graphAvecInsight, context(), createRng('graine-insight-fixe'));
    runA.rollInsight();
    const runB = new DialogueRunner(graphAvecInsight, context(), createRng('graine-insight-fixe'));
    runB.rollInsight();

    expect(runA.current().insight?.status).toBe(runB.current().insight?.status);
    expect(runA.current().insight?.roll?.dieFaces).toEqual(runB.current().insight?.roll?.dieFaces);
  });

  it('refuse un second jet de reflexion sur le meme noeud', () => {
    const runner = new DialogueRunner(graphAvecInsight, context(), createRng('graine-insight-double'));
    runner.rollInsight();
    const second = runner.rollInsight();
    expect(second.ok).toBe(false);
  });

  it('choisir le choix best incremente le compteur, un autre choix ne le touche pas', () => {
    const runnerBest = new DialogueRunner(graphAvecInsight, context(), createRng('seed-search-0'));
    runnerBest.rollInsight();
    runnerBest.choose(0);
    expect(runnerBest.context.run.flags['bonnes-reponses']).toBe(1);

    const runnerAutre = new DialogueRunner(graphAvecInsight, context(), createRng('seed-search-0'));
    runnerAutre.rollInsight();
    runnerAutre.choose(1);
    expect(runnerAutre.context.run.flags['bonnes-reponses']).toBeUndefined();
  });
});

describe('effet "writtenScore" (ADR 0012)', () => {
  it('finalise la note ecrite du dossier a partir du compteur pose par les choix best', () => {
    const graph: DialogueFile = {
      id: 'test.writtenScore',
      start: 'depart',
      nodes: {
        depart: { text: 'depart', effects: [{ counter: 'ch1.exam.bonnes-reponses', delta: 1 }], to: 'encore' },
        encore: { text: 'encore', effects: [{ counter: 'ch1.exam.bonnes-reponses', delta: 1 }], to: 'fin' },
        fin: {
          text: 'fin',
          effects: [{ writtenScore: { counterKey: 'ch1.exam.bonnes-reponses', total: 6 } }],
        },
      },
    };
    const runner = new DialogueRunner(graph, context(), createRng('graine-writtenscore'));
    runner.advance(); // depart -> encore
    runner.advance(); // encore -> fin (terminal : applique l'effet writtenScore a l'entree)

    expect(runner.finished).toBe(true);
    expect(runner.context.dossier.writtenScore).toEqual({ correct: 2, total: 6 });
    expect(runner.context.dossier.tags).toContain('copie-faible');
  });

  it('un compteur jamais incremente donne 0/total, jamais un crash', () => {
    const graph: DialogueFile = {
      id: 'test.writtenScoreVide',
      start: 'fin',
      nodes: {
        fin: {
          text: 'fin',
          effects: [{ writtenScore: { counterKey: 'jamais-pose', total: 6 } }],
        },
      },
    };
    const runner = new DialogueRunner(graph, context(), createRng('graine-writtenscore-vide'));
    expect(runner.context.dossier.writtenScore).toEqual({ correct: 0, total: 6 });
  });
});

/* ------------------------------------------------------------------------ */
/* Lot 3.1 (Epic 3) : alias d'equipe, gabarits, startNode/entries,          */
/* reflexion facultative avec cout, Chance.                                 */
/* ------------------------------------------------------------------------ */

describe('alias d equipe equipier1/equipier2/rivale (ADR 0014 §7)', () => {
  it('resout who dans une replique et dans who d un jet, et rivale vers le capitaine rouge du roster', () => {
    const graph: DialogueFile = {
      id: 'test.alias',
      start: 'a',
      nodes: {
        a: {
          text: 'Un noeud.',
          lines: [
            { who: 'equipier1', text: 'Je couvre.' },
            { who: 'rivale', text: 'On y va.' },
          ],
          choices: [
            {
              text: '[Perception] equipier2 tente sa chance.',
              check: { skill: 'perception', attribute: 'REF', dv: 'NORMALE', who: 'equipier2' },
              onSuccess: 'b',
              onFailure: 'b',
            },
          ],
        },
        b: { text: 'fin' },
      },
    };

    const runner = new DialogueRunner(graph, context(), createRng('graine-alias'));
    const node = runner.current();
    // Roster par defaut (DEFAULT_BLUE moins franklyn, dans l'ordre) : equipier1 = zachary, equipier2 = john.
    expect(node.lines[0]?.who).toBe('zachary');
    expect(node.lines[1]?.who).toBe('abigail'); // rivale : capitaine rouge par defaut (ADR 0014)
    expect(node.choices[0]?.check).toBeDefined();
  });

  it('lit la composition depuis RunState.roster, jamais une equipe figee en dur', () => {
    const graph: DialogueFile = {
      id: 'test.alias-roster',
      start: 'a',
      nodes: { a: { text: 'x', lines: [{ who: 'equipier1', text: 'salut' }, { who: 'rivale', text: 'hop' }] } },
    };
    const base = context();
    const ctx: NarrativeContext = {
      ...base,
      run: {
        ...base.run,
        roster: {
          blue: ['franklyn', 'grover', 'letitia'],
          red: ['zachary', 'john', 'abigail'],
          redCaptain: 'zachary',
        },
      },
    };
    const runner = new DialogueRunner(graph, ctx, createRng('graine-alias-roster'));
    const node = runner.current();
    expect(node.lines[0]?.who).toBe('grover');
    expect(node.lines[1]?.who).toBe('zachary');
  });

  it('resout l alias dans l effet d affinite et dans team.gassed', () => {
    const graph: DialogueFile = {
      id: 'test.alias-effets',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          effects: [{ affinity: { who: 'rivale', delta: 1 } }, { team: { gassed: 'equipier1' } }],
        },
      },
    };
    const runner = new DialogueRunner(graph, context(), createRng('graine-alias-effets'));
    // Abigail part a +2 (affinite de depart de sa fiche), donc +1 la met a 3.
    expect(runner.context.dossier.affinities.abigail).toBe(3);
    expect(runner.context.run.teams.blue.gassedMembers).toEqual(['zachary']);
  });
});

describe('gabarits de texte {equipier1}/{equipier2}/{rivale}/{franklyn} (lot 3.1)', () => {
  it('remplace les gabarits connus par le prenom du cadet resolu, dans la narration et le texte des choix', () => {
    const graph: DialogueFile = {
      id: 'test.gabarits',
      start: 'a',
      nodes: {
        a: {
          text: '{equipier1} et {rivale} attendent {franklyn}.',
          choices: [{ text: 'Suivre {equipier2}.', to: 'b' }],
        },
        b: { text: 'fin' },
      },
    };
    const runner = new DialogueRunner(graph, context(), createRng('graine-gabarits'));
    const node = runner.current();
    expect(node.text).toBe('Zachary et Abigail attendent Franklyn.');
    expect(node.choices[0]?.text).toBe('Suivre John.');
  });

  it('le validateur signale un gabarit inconnu comme une anomalie', () => {
    const file = {
      id: 'test.gabarit-inconnu',
      start: 'a',
      nodes: { a: { text: 'Bonjour {zorglub}.' } },
    };
    expect(validateDialogue(file).some((m) => m.includes('gabarit inconnu'))).toBe(true);
  });

  it('n accepte pas les gabarits connus comme des anomalies', () => {
    const file = {
      id: 'test.gabarit-connu',
      start: 'a',
      nodes: { a: { text: '{equipier1}, {equipier2}, {rivale}, {franklyn}.' } },
    };
    expect(validateDialogue(file)).toEqual([]);
  });
});

describe('startNode et entries (exploration, lot 3.1)', () => {
  const graph: DialogueFile = {
    id: 'test.entries',
    start: 'debut',
    entries: ['alt'],
    nodes: {
      debut: { text: 'debut', to: 'fin' },
      alt: { text: 'point d entree alternatif', to: 'fin' },
      fin: { text: 'fin' },
    },
  };

  it('demarre sur startNode quand il existe', () => {
    const runner = new DialogueRunner(graph, context(), createRng('graine-startnode'), { startNode: 'alt' });
    expect(runner.current().nodeId).toBe('alt');
  });

  it('retombe silencieusement sur start si startNode est inconnu', () => {
    const runner = new DialogueRunner(graph, context(), createRng('graine-startnode-inconnu'), {
      startNode: 'fantome',
    });
    expect(runner.current().nodeId).toBe('debut');
  });

  it('ne signale pas un noeud declare dans entries comme inatteignable depuis start', () => {
    expect(validateDialogue(graph)).toEqual([]);
  });

  it('signale toujours un vrai noeud orphelin, absent de entries', () => {
    const withOrphan: DialogueFile = {
      ...graph,
      nodes: { ...graph.nodes, orphelin: { text: 'jamais atteint' } },
    };
    expect(validateDialogue(withOrphan).some((m) => m.includes('inatteignable'))).toBe(true);
  });
});

const graphInsightFacultatif: DialogueFile = {
  id: 'test.insight-facultatif',
  start: 'question',
  nodes: {
    question: {
      text: 'Une question.',
      insight: {
        skill: 'education',
        dv: 'NORMALE',
        optional: true,
        cost: { counter: 'ch1.exam.concentration', amount: 1 },
        successText: 'Ca lui revient.',
        failureText: 'Rien.',
      },
      choices: [
        { text: 'Reponse A', to: 'fin', best: true },
        { text: 'Reponse B', to: 'fin' },
      ],
    },
    fin: { text: 'Fin.' },
  },
};

describe('reflexion facultative avec cout (ADR 0015 §1)', () => {
  it('le noeud n est pas bloque : choose() fonctionne directement sans avoir lance le de', () => {
    const runner = new DialogueRunner(graphInsightFacultatif, context(), createRng('graine-insight-facultatif'));
    expect(runner.current().insight?.status).toBe('available');
    const outcome = runner.choose(1);
    expect(outcome.ok).toBe(true);
    expect(runner.current().nodeId).toBe('fin');
  });

  it('expose optional, cost et affordable', () => {
    const base = context();
    const ctx: NarrativeContext = {
      ...base,
      run: { ...base.run, flags: { 'ch1.exam.concentration': 2 } },
    };
    const runner = new DialogueRunner(graphInsightFacultatif, ctx, createRng('graine-insight-cout'));
    const insight = runner.current().insight;
    expect(insight?.optional).toBe(true);
    expect(insight?.cost).toEqual({ counter: 'ch1.exam.concentration', amount: 1 });
    expect(insight?.affordable).toBe(true);
  });

  it('rollInsight() consomme le compteur quand il est suffisant', () => {
    const base = context();
    const ctx: NarrativeContext = {
      ...base,
      run: { ...base.run, flags: { 'ch1.exam.concentration': 2 } },
    };
    const runner = new DialogueRunner(graphInsightFacultatif, ctx, createRng('seed-search-0'));
    const outcome = runner.rollInsight();
    expect(outcome.ok).toBe(true);
    expect(runner.current().insight?.status).toBe('success');
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(1);
  });

  it('rollInsight() refuse et ne consomme rien si le compteur est insuffisant', () => {
    const base = context();
    const ctx: NarrativeContext = {
      ...base,
      run: { ...base.run, flags: { 'ch1.exam.concentration': 0 } },
    };
    const runner = new DialogueRunner(graphInsightFacultatif, ctx, createRng('graine-insight-pauvre'));
    const outcome = runner.rollInsight();
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toBe('Plus de concentration.');
    expect(runner.current().insight?.status).toBe('available');
    expect(runner.current().insight?.affordable).toBe(false);
    expect(runner.context.run.flags['ch1.exam.concentration']).toBe(0);
  });
});

/**
 * Graine de jet a Chance (skill perception, attribut REF force, DV NORMALE,
 * candidat par defaut Franklyn) : tirees par recherche exhaustive comme les
 * graines `seed-search-*` de l'examen ecrit (voir plus haut). `luck-exact-12`
 * produit un echec de marge -2 (Franklyn, INT/REF 5, perception 4, vs DV 13) ;
 * `luck-big-3` un echec de marge -7 (hors de portee d'une Chance a 3) ;
 * `luck-john-53` le meme jet mais lance par John (marge -3, jamais rattrapable
 * a la Chance : elle est reservee a Franklyn).
 */
const graphAvecJetChance: DialogueFile = {
  id: 'test.chance',
  start: 'depart',
  nodes: {
    depart: {
      text: 'Ouverture.',
      choices: [
        {
          text: '[Perception] Regarder autour.',
          check: { skill: 'perception', attribute: 'REF', dv: 'NORMALE' },
          onSuccess: 'succes',
          onFailure: 'echec',
          successEffects: [{ tag: 'observateur' }],
          failureEffects: [{ tag: 'distrait' }],
        },
      ],
    },
    succes: { text: 'Bien vu.' },
    echec: { text: 'Rien remarque.' },
  },
};

function chanceContext(luck = 3): NarrativeContext {
  const base = context();
  return { ...base, run: { ...base.run, luck } };
}

describe('la Chance de Franklyn (ADR 0015 §2)', () => {
  it('un echec rattrapable bascule en attente : ni navigation ni effets d issue tant que rien n est tranche', () => {
    const runner = new DialogueRunner(graphAvecJetChance, chanceContext(), createRng('luck-exact-12'));
    const outcome = runner.choose(0);
    expect(outcome.ok).toBe(true);

    const node = runner.current();
    expect(node.nodeId).toBe('depart');
    expect(node.pendingRoll).toBeDefined();
    expect(node.pendingRoll?.missingBy).toBe(2);
    expect(node.pendingRoll?.luckAvailable).toBe(3);
    expect(node.pendingRoll?.roll.dieFaces.length).toBeGreaterThan(0);
    expect(runner.context.dossier.tags).not.toContain('distrait');
    expect(runner.context.dossier.tags).not.toContain('observateur');
  });

  it('choose(), advance() et rollInsight() sont refuses (ou sans effet) tant que la Chance est en attente', () => {
    const runner = new DialogueRunner(graphAvecJetChance, chanceContext(), createRng('luck-exact-12'));
    runner.choose(0);

    expect(runner.choose(0).ok).toBe(false);
    expect(runner.rollInsight().ok).toBe(false);
    runner.advance();
    expect(runner.current().nodeId).toBe('depart');
    expect(runner.current().pendingRoll).toBeDefined();
  });

  it('spendLuck(missingBy) transforme l echec en reussite, deduit la Chance et pose une entree de dossier cumulative (pas d etiquette)', () => {
    const runner = new DialogueRunner(graphAvecJetChance, chanceContext(3), createRng('luck-exact-12'));
    runner.choose(0);
    const missingBy = runner.current().pendingRoll?.missingBy ?? 0;

    const spend = runner.spendLuck(missingBy);
    expect(spend.ok).toBe(true);

    const node = runner.current();
    expect(node.pendingRoll).toBeUndefined();
    expect(node.nodeId).toBe('succes');
    expect(node.lastCheck?.success).toBe(true);
    expect(node.lastCheck?.luckSpent).toBe(missingBy);
    expect(runner.context.run.luck).toBe(3 - missingBy);
    expect(runner.context.dossier.tags).toContain('observateur');

    const entry = runner.context.dossier.entries.find((e) => e.key === 'ch1.chance');
    expect(entry?.value).toBe(String(missingBy));
    expect(runner.context.dossier.tags).not.toContain('chance');
  });

  it('spendLuck refuse une depense inferieure a la marge manquante ou superieure a la Chance disponible', () => {
    const runner = new DialogueRunner(graphAvecJetChance, chanceContext(3), createRng('luck-exact-12'));
    runner.choose(0);

    expect(runner.spendLuck(1).ok).toBe(false); // < missingBy (2)
    expect(runner.spendLuck(4).ok).toBe(false); // > Chance disponible (3)
    expect(runner.current().pendingRoll).toBeDefined();
  });

  it('acceptRoll() resout l echec sans depenser de Chance', () => {
    const runner = new DialogueRunner(graphAvecJetChance, chanceContext(3), createRng('luck-exact-12'));
    runner.choose(0);

    const accept = runner.acceptRoll();
    expect(accept.ok).toBe(true);

    const node = runner.current();
    expect(node.pendingRoll).toBeUndefined();
    expect(node.nodeId).toBe('echec');
    expect(runner.context.run.luck).toBe(3);
    expect(runner.context.dossier.tags).toContain('distrait');
  });

  it('un jet de coequipier (who resout vers quelqu un d autre que Franklyn) n entre jamais en attente de Chance', () => {
    const graph: DialogueFile = {
      id: 'test.chance-coequipier',
      start: 'depart',
      nodes: {
        depart: {
          text: 'x',
          choices: [
            {
              text: '[Perception] John regarde.',
              check: { skill: 'perception', attribute: 'REF', dv: 'NORMALE', who: 'john' },
              onSuccess: 'succes',
              onFailure: 'echec',
            },
          ],
        },
        succes: { text: 'ok' },
        echec: { text: 'ko' },
      },
    };
    const runner = new DialogueRunner(graph, chanceContext(3), createRng('luck-john-53'));
    runner.choose(0);
    expect(runner.current().pendingRoll).toBeUndefined();
    expect(runner.current().nodeId).toBe('echec');
  });

  it('un echec trop lourd pour la Chance restante se resout tout de suite, sans attente', () => {
    const runner = new DialogueRunner(graphAvecJetChance, chanceContext(3), createRng('luck-big-3'));
    runner.choose(0);
    expect(runner.current().pendingRoll).toBeUndefined();
    expect(runner.current().nodeId).toBe('echec');
  });

  it('deterministe a graine fixe : meme marge manquante, meme resolution une fois la Chance depensee', () => {
    const runnerA = new DialogueRunner(graphAvecJetChance, chanceContext(3), createRng('luck-exact-12'));
    const runnerB = new DialogueRunner(graphAvecJetChance, chanceContext(3), createRng('luck-exact-12'));
    runnerA.choose(0);
    runnerB.choose(0);
    expect(runnerA.current().pendingRoll?.missingBy).toBe(runnerB.current().pendingRoll?.missingBy);

    runnerA.spendLuck(2);
    runnerB.spendLuck(2);
    expect(runnerA.current().nodeId).toBe(runnerB.current().nodeId);
    expect(runnerA.current().lastCheck?.total).toBe(runnerB.current().lastCheck?.total);
  });

  it('un jet de reflexion rate de peu bascule aussi en attente de Chance, et se resout via spendLuck', () => {
    const runner = new DialogueRunner(graphAvecInsight, chanceContext(3), createRng('seed-search-21'));
    const outcome = runner.rollInsight();
    expect(outcome.ok).toBe(true);

    const pending = runner.current().pendingRoll;
    expect(pending).toBeDefined();
    expect(runner.current().insight?.status).toBe('pending');

    const spend = runner.spendLuck(pending!.missingBy);
    expect(spend.ok).toBe(true);

    const node = runner.current();
    expect(node.pendingRoll).toBeUndefined();
    expect(node.insight?.status).toBe('success');
    expect(node.insight?.roll?.luckSpent).toBe(pending!.missingBy);
    expect(node.choices.find((c) => c.index === 0)?.best).toBe(true);
  });
});
