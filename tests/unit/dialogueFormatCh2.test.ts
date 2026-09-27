/**
 * Extensions du format de dialogue pour le chapitre 2 (ADR 0023, lot 5.3),
 * en une seule table comme demandé par "Fini quand"
 * (docs/chapters/ch2/TECH-DESIGN.md, lot 5.3) : compteur borné (plafond et
 * plancher), condition `tempo`, décor d'un nœud prioritaire sur celui du
 * fichier, clé de décor inconnue signalée par `validateDialogue`. Chaque
 * mécanisme est déjà couvert par ses propres tests unitaires ailleurs
 * (conditions/effets ordinaires, `validateDialogue` sur le contenu réel) :
 * cette table ne balaie que le comportement NOUVEAU de ce lot.
 */

import { describe, expect, it } from 'vitest';
import { createDossier } from '@/core/dossier';
import { applyEffect, createRunState, evaluateCondition, validateDialogue } from '@/narrative';
import type { Condition, DialogueFile, Effect, NarrativeContext } from '@/narrative';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import { createRng } from '@/core/rng';
import { BACKDROP_KEYS } from '@/data/backdrops';
import { PORTRAIT_VARIANT_KEYS } from '@/ui/portraits';

/** Compteur borné réel du chapitre 2 (TECH-DESIGN §4.6, B18), réutilisé pour les trois premiers cas. */
const LETITIA_ETAT = 'ch2.letitia.etat';

function context(tempo = 0): NarrativeContext {
  return { dossier: createDossier(), run: { ...createRunState('graine-format-ch2'), tempo } };
}

const CASES: Array<{ name: string; run: () => void }> = [
  {
    name: 'compteur borné : le plafond (max) arrête la montée',
    run: () => {
      const effect: Effect = { counter: LETITIA_ETAT, delta: 5, min: 0, max: 3 };
      expect(applyEffect(effect, context()).run.flags[LETITIA_ETAT]).toBe(3);
    },
  },
  {
    name: 'compteur borné : le plancher (min) arrête la descente',
    run: () => {
      const ctx: NarrativeContext = {
        dossier: createDossier(),
        run: { ...createRunState('graine-format-ch2'), flags: { [LETITIA_ETAT]: 1 } },
      };
      const effect: Effect = { counter: LETITIA_ETAT, delta: -5, min: 0, max: 3 };
      expect(applyEffect(effect, ctx).run.flags[LETITIA_ETAT]).toBe(0);
    },
  },
  {
    name: 'compteur SANS bornes : comportement inchangé (repli sur bumpCounter)',
    run: () => {
      const effect: Effect = { counter: LETITIA_ETAT, delta: 5 };
      expect(applyEffect(effect, context()).run.flags[LETITIA_ETAT]).toBe(5);
    },
  },
  {
    name: 'condition tempo : atLeast/atMost lisent RunState.tempo',
    run: () => {
      const cond: Condition = { tempo: { atLeast: 2, atMost: 4 } };
      expect(evaluateCondition(cond, context(1))).toBe(false); // trop tôt
      expect(evaluateCondition(cond, context(3))).toBe(true);
      expect(evaluateCondition(cond, context(5))).toBe(false); // trop tard
    },
  },
  {
    // Addendum ADR 0023 (lot 5.17) : le décor d'un nœud RESTE jusqu'au prochain nœud qui en pose un.
    name: 'décor : le fichier ouvre, un nœud le remplace, et ce décor reste jusqu’au suivant qui en pose un',
    run: () => {
      const file: DialogueFile = {
        id: 'test.backdrop',
        backdrop: 'bal',
        start: 'a',
        nodes: {
          a: { text: 'x', to: 'b' },
          b: { text: 'y', backdrop: 'garage', to: 'c' },
          c: { text: 'z', to: 'd' },
          d: { text: 'w', backdrop: 'hall' },
        },
      };
      const runner = new DialogueRunner(file, context(), createRng('decor'));
      const seen: Array<string | undefined> = [runner.current().backdrop];
      for (let i = 0; i < 3; i++) {
        runner.advance();
        seen.push(runner.current().backdrop);
      }
      expect(seen).toEqual(['bal', 'garage', 'garage', 'hall']);
      // Sans décor de fichier ni de nœud : aucune clé (la vue garde ses tables de repli du chapitre 1).
      const bare: DialogueFile = { id: 'test.nu', start: 'a', nodes: { a: { text: 'x' } } };
      expect(new DialogueRunner(bare, context(), createRng('decor')).current().backdrop).toBeUndefined();
    },
  },
  {
    name: 'validateDialogue signale une clé de décor inconnue (fichier ou nœud)',
    run: () => {
      const fileLevel = {
        id: 'test.backdrop.fichier',
        backdrop: 'lieu-qui-nexiste-pas',
        start: 'a',
        nodes: { a: { text: 'x' } },
      };
      const nodeLevel = {
        id: 'test.backdrop.noeud',
        start: 'a',
        nodes: { a: { text: 'x', backdrop: 'lieu-qui-nexiste-pas' } },
      };
      expect(
        validateDialogue(fileLevel, BACKDROP_KEYS).some((m) => m.includes('decor') && m.includes('inconnue')),
      ).toBe(true);
      expect(
        validateDialogue(nodeLevel, BACKDROP_KEYS).some((m) => m.includes('decor') && m.includes('inconnue')),
      ).toBe(true);
      // Une clé RÉELLE du registre ne doit, elle, jamais être signalée.
      const known = { id: 'test.backdrop.connu', backdrop: BACKDROP_KEYS[0], start: 'a', nodes: { a: { text: 'x' } } };
      expect(validateDialogue(known, BACKDROP_KEYS)).toEqual([]);
    },
  },
  {
    name: 'variante de portrait (ADR 0028) : connue acceptée, inconnue ou sur un alias refusée',
    run: () => {
      const withLine = (line: Record<string, string>) => ({
        id: 'test.portrait',
        start: 'a',
        nodes: { a: { lines: [{ text: 'x', ...line }] } },
      });
      const errors = (line: Record<string, string>) =>
        validateDialogue(withLine(line), BACKDROP_KEYS, PORTRAIT_VARIANT_KEYS);
      expect(errors({ who: 'zachary', portrait: 'blesse' })).toEqual([]);
      expect(errors({ who: 'zachary' })).toEqual([]); // sans variante : inchangé
      const refused = (m: string) => m.includes('variante de portrait');
      expect(errors({ who: 'zachary', portrait: 'hilare' }).some(refused)).toBe(true);
      expect(errors({ who: 'abigail', portrait: 'blesse' }).some(refused)).toBe(true); // propre à Zachary
      expect(errors({ who: 'equipier1', portrait: 'blesse' }).some(refused)).toBe(true);
    },
  },
];

describe('format de dialogue du chapitre 2 (ADR 0023)', () => {
  for (const testCase of CASES) it(testCase.name, testCase.run);
});
