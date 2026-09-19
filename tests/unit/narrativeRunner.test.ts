import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { addTags, createDossier } from '@/core/dossier';
import { applyTeamEffect, createRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import type { DialogueFile } from '@/narrative/types';

function context(): NarrativeContext {
  return { dossier: createDossier(), run: createRunState('graine-narrative-test') };
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
