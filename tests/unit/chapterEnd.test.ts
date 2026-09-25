/**
 * Bilan de fin de chapitre declare en donnees (ADR 0025 §1, lot 5.4) :
 * `resolveChapterEnd` est pure (`src/narrative/chapterEnd.ts`) -- ce test ne
 * couvre que son comportement generique ("Fini quand" du lot) : le premier
 * cas vrai d'une ligne l'emporte, une ligne sans cas vrai disparait du
 * resultat, `kicker`/`title`/`photo`/`next` passent tels quels. Le contenu
 * REEL du bilan du chapitre 2 (`CH2_END`, `src/data/chapters/ch2.ts`) n'a pas
 * besoin de son propre test ici : c'est du contenu, pas un nouveau
 * comportement (voir AGENTS.md, "L'économie des tests").
 */

import { describe, expect, it } from 'vitest';
import { createDossier, addTags } from '@/core/dossier';
import { createRunState, resolveChapterEnd } from '@/narrative';
import type { ChapterEndDef, NarrativeContext } from '@/narrative';

function context(overrides: Partial<NarrativeContext['run']> = {}, tags: string[] = []): NarrativeContext {
  return {
    dossier: addTags(createDossier(), tags),
    run: { ...createRunState('graine-bilan'), ...overrides },
  };
}

describe('resolveChapterEnd', () => {
  it('retient le premier cas vrai de chaque ligne', () => {
    const def: ChapterEndDef = {
      kicker: 'Rapport',
      title: 'Fin de test',
      lines: [
        {
          label: 'État',
          cases: [
            { when: { flag: 'compteur', equals: 3 }, value: 'critique' },
            { when: { flag: 'compteur', atLeast: 1 }, value: 'blessé' },
            { value: 'stable' },
          ],
        },
      ],
    };

    expect(resolveChapterEnd(def, context({ flags: { compteur: 3 } })).lines).toEqual([
      { label: 'État', value: 'critique' },
    ]);
    expect(resolveChapterEnd(def, context({ flags: { compteur: 1 } })).lines).toEqual([
      { label: 'État', value: 'blessé' },
    ]);
    // Ni 3 ni >=1 : le troisieme cas, sans `when`, sert de repli toujours vrai.
    expect(resolveChapterEnd(def, context({ flags: {} })).lines).toEqual([{ label: 'État', value: 'stable' }]);
  });

  it('omet une ligne dont aucun cas n’est vrai', () => {
    const def: ChapterEndDef = {
      kicker: 'Rapport',
      title: 'Fin de test',
      lines: [
        { label: 'Toujours là', cases: [{ value: 'présent' }] },
        { label: 'Conditionnelle', cases: [{ when: { tag: 'absente' }, value: 'jamais vu' }] },
      ],
    };

    expect(resolveChapterEnd(def, context()).lines).toEqual([{ label: 'Toujours là', value: 'présent' }]);
  });

  it('transmet kicker, titre, photo et next tels quels', () => {
    const def: ChapterEndDef = {
      kicker: 'Rapport de nuit',
      title: 'Fin du chapitre 2',
      photo: { backdrop: 'photo-souvenir', faded: ['zachary'] },
      lines: [],
      next: undefined,
    };

    const resolved = resolveChapterEnd(def, context());
    expect(resolved.kicker).toBe('Rapport de nuit');
    expect(resolved.title).toBe('Fin du chapitre 2');
    expect(resolved.photo).toEqual({ backdrop: 'photo-souvenir', faded: ['zachary'] });
    expect(resolved.lines).toEqual([]);
    expect(resolved.next).toBeUndefined();
  });
});
