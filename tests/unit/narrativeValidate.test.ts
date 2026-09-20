import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateDialogue } from '@/narrative/validate';

const DIALOGUES_DIR = join(process.cwd(), 'src', 'data', 'dialogues');

describe('validateDialogue', () => {
  it('accepte un graphe correct', () => {
    const file = {
      id: 'test.ok',
      start: 'a',
      nodes: {
        a: { text: 'x', to: 'b' },
        b: { text: 'y' },
      },
    };
    expect(validateDialogue(file)).toEqual([]);
  });

  it('detecte un "to" qui pointe vers un noeud inexistant', () => {
    const file = {
      id: 'test.to-invalide',
      start: 'a',
      nodes: { a: { text: 'x', to: 'fantome' } },
    };
    expect(validateDialogue(file).some((m) => m.includes('inexistant'))).toBe(true);
  });

  it('detecte un noeud inatteignable depuis start', () => {
    const file = {
      id: 'test.orphelin',
      start: 'a',
      nodes: {
        a: { text: 'x' },
        orphelin: { text: 'jamais visite' },
      },
    };
    expect(validateDialogue(file).some((m) => m.includes('inatteignable'))).toBe(true);
  });

  it('detecte un check sans onSuccess ou sans onFailure', () => {
    const sansSucces = {
      id: 'test.check-incomplet',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [{ text: 'un choix', check: { skill: 'perception', dv: 'NORMALE' }, onFailure: 'a' }],
        },
      },
    };
    expect(validateDialogue(sansSucces).some((m) => m.includes('onSuccess'))).toBe(true);

    const sansEchec = {
      id: 'test.check-incomplet-2',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [{ text: 'un choix', check: { skill: 'perception', dv: 'NORMALE' }, onSuccess: 'a' }],
        },
      },
    };
    expect(validateDialogue(sansEchec).some((m) => m.includes('onFailure'))).toBe(true);
  });

  it('detecte une competence, un attribut, une DV ou un locuteur inconnu', () => {
    const competenceInconnue = {
      id: 'test.competence',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [{ text: 'c', check: { skill: 'magie', dv: 'NORMALE' }, onSuccess: 'a', onFailure: 'a' }],
        },
      },
    };
    expect(validateDialogue(competenceInconnue).some((m) => m.includes('competence inconnue'))).toBe(true);

    const attributInconnu = {
      id: 'test.attribut',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [
            {
              text: 'c',
              check: { skill: 'perception', attribute: 'CHARISME', dv: 'NORMALE' },
              onSuccess: 'a',
              onFailure: 'a',
            },
          ],
        },
      },
    };
    expect(validateDialogue(attributInconnu).some((m) => m.includes('attribut inconnu'))).toBe(true);

    const dvInconnue = {
      id: 'test.dv-inconnue',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [
            { text: 'c', check: { skill: 'perception', dv: 'IMPOSSIBLE' }, onSuccess: 'a', onFailure: 'a' },
          ],
        },
      },
    };
    expect(validateDialogue(dvInconnue).some((m) => m.includes('DV inconnue'))).toBe(true);

    const locuteurInconnu = {
      id: 'test.locuteur',
      start: 'a',
      nodes: { a: { text: 'x', lines: [{ who: 'zorglub', text: 'hein ?' }] } },
    };
    expect(validateDialogue(locuteurInconnu).some((m) => m.includes('locuteur inconnu'))).toBe(true);

    const personnageInconnu = {
      id: 'test.personnage',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          effects: [{ affinity: { who: 'napoleon', delta: 1 } }],
        },
      },
    };
    expect(validateDialogue(personnageInconnu).some((m) => m.includes('personnage inconnu'))).toBe(true);
  });

  it('detecte une DV ecrite en nombre', () => {
    const file = {
      id: 'test.dv-nombre',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [{ text: 'c', check: { skill: 'perception', dv: 13 }, onSuccess: 'a', onFailure: 'a' }],
        },
      },
    };
    expect(validateDialogue(file).some((m) => m.includes('nombre'))).toBe(true);
  });

  it('detecte un choix sans texte', () => {
    const file = {
      id: 'test.sans-texte',
      start: 'a',
      nodes: { a: { text: 'x', choices: [{ to: 'a' }] } },
    };
    expect(validateDialogue(file).some((m) => m.includes('pas de texte'))).toBe(true);
  });

  it('tolere une entree completement invalide sans planter', () => {
    expect(validateDialogue(null)).not.toEqual([]);
    expect(validateDialogue('pas un dialogue')).not.toEqual([]);
    expect(validateDialogue({})).not.toEqual([]);
  });

  it('detecte un "dvByCounter" mal forme, vide, ou avec une DV inconnue (ADR 0015 §3)', () => {
    const malForme = {
      id: 'test.dvByCounter-malforme',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [
            {
              text: 'c',
              check: { skill: 'discretion', dv: 'NORMALE', dvByCounter: 'pas-un-objet' },
              onSuccess: 'a',
              onFailure: 'a',
            },
          ],
        },
      },
    };
    expect(validateDialogue(malForme).some((m) => m.includes('dvByCounter'))).toBe(true);

    const vide = {
      id: 'test.dvByCounter-vide',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [
            {
              text: 'c',
              check: { skill: 'discretion', dv: 'NORMALE', dvByCounter: { counter: 'v', levels: [] } },
              onSuccess: 'a',
              onFailure: 'a',
            },
          ],
        },
      },
    };
    expect(validateDialogue(vide).some((m) => m.includes('levels'))).toBe(true);

    const dvInconnue = {
      id: 'test.dvByCounter-dv-inconnue',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          choices: [
            {
              text: 'c',
              check: {
                skill: 'discretion',
                dv: 'NORMALE',
                dvByCounter: { counter: 'v', levels: ['NORMALE', 'IMPOSSIBLE'] },
              },
              onSuccess: 'a',
              onFailure: 'a',
            },
          ],
        },
      },
    };
    expect(validateDialogue(dvInconnue).some((m) => m.includes('dvByCounter.levels'))).toBe(true);
  });

  it('accepte un "dvByCounter" bien forme, sur un check comme sur un insight', () => {
    const file = {
      id: 'test.dvByCounter-ok',
      start: 'a',
      nodes: {
        a: {
          text: 'x',
          insight: {
            skill: 'discretion',
            dv: 'NORMALE',
            dvByCounter: { counter: 'v', levels: ['NORMALE', 'DIFFICILE'] },
          },
          choices: [
            {
              text: 'c',
              check: {
                skill: 'discretion',
                dv: 'NORMALE',
                dvByCounter: { counter: 'v', levels: ['NORMALE', 'DIFFICILE'] },
              },
              onSuccess: 'a',
              onFailure: 'a',
            },
          ],
        },
      },
    };
    expect(validateDialogue(file)).toEqual([]);
  });

  it('valide tous les fichiers de src/data/dialogues sans aucune anomalie', () => {
    const files = readdirSync(DIALOGUES_DIR).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const raw = readFileSync(join(DIALOGUES_DIR, file), 'utf8');
      const parsed: unknown = JSON.parse(raw);
      expect(validateDialogue(parsed), `${file} : ${validateDialogue(parsed).join(' | ')}`).toEqual([]);
    }
  });
});
