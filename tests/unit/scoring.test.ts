import { describe, expect, it } from 'vitest';
import {
  COURSE_MAX_POINTS,
  FLAG_CABINET_FORCED,
  FLAG_HOSTAGE_SAVED,
  FLAG_VIDEO_WATCHED,
  SCORE_MAX,
  courseResultFromFlags,
  courseResultToScoreInput,
  mentionFor,
  scoreExercise,
  writtenScoreTags,
} from '@/rules/scoring';
import { addTags, createDossier, migrateDossier, setPracticalScore, setWrittenScore } from '@/core/dossier';

const base = {
  playerTeam: 'blue' as const,
  rounds: 6,
  roundLimit: 12,
  alliesStanding: 2,
  alliesTotal: 3,
  enemiesDown: 3,
  enemiesTotal: 3,
};

describe('notation', () => {
  it('reste dans les bornes du bareme', () => {
    for (const winner of ['blue', 'red', 'draw'] as const) {
      for (let allies = 0; allies <= 3; allies++) {
        for (let rounds = 1; rounds <= 12; rounds++) {
          const score = scoreExercise({ ...base, winner, alliesStanding: allies, rounds });
          expect(score.total).toBeGreaterThanOrEqual(0);
          expect(score.total).toBeLessThanOrEqual(SCORE_MAX);
        }
      }
    }
  });

  it('recompense la victoire', () => {
    const win = scoreExercise({ ...base, winner: 'blue' });
    const loss = scoreExercise({ ...base, winner: 'red' });
    expect(win.total).toBeGreaterThan(loss.total);
  });

  it('recompense la rapidite', () => {
    const fast = scoreExercise({ ...base, winner: 'blue', rounds: 3 });
    const slow = scoreExercise({ ...base, winner: 'blue', rounds: 12 });
    expect(fast.total).toBeGreaterThan(slow.total);
  });

  it('ne penalise pas l absence de donnees du parcours interieur', () => {
    const withoutRooms = scoreExercise({ ...base, winner: 'blue' });
    const withRooms = scoreExercise({ ...base, winner: 'blue', hostageSaved: true, cabinetOpened: true });
    expect(withRooms.total).toBeGreaterThan(withoutRooms.total);
    expect(withoutRooms.total).toBeGreaterThan(0);
  });

  it('produit des etiquettes exploitables par le dossier', () => {
    const score = scoreExercise({ ...base, winner: 'blue', alliesStanding: 3, rounds: 3 });
    expect(score.tags).toContain('vainqueur-exercice');
    expect(score.tags).toContain('protecteur');
    expect(score.tags).toContain('rapide');
  });

  it('associe une mention coherente', () => {
    expect(mentionFor(20)).toBe('Excellent');
    expect(mentionFor(0)).toBe('Insuffisant');
  });
});

describe('parcours interieur (lot 2.8)', () => {
  it('ajoute les points et les etiquettes attendus quand le parcours est complet', () => {
    const course = courseResultFromFlags(
      {
        [FLAG_HOSTAGE_SAVED]: true,
        [FLAG_CABINET_FORCED]: true,
        [FLAG_VIDEO_WATCHED]: true,
      },
      ['zachary'],
    );
    const score = scoreExercise({ ...base, winner: 'blue', ...courseResultToScoreInput(course) });
    const withoutCourse = scoreExercise({ ...base, winner: 'blue' });

    expect(score.total).toBe(withoutCourse.total + COURSE_MAX_POINTS);
    expect(score.tags).toEqual(
      expect.arrayContaining(['sauveteur', 'curieux', 'renseignement', 'imprudent-salle-3']),
    );
  });

  it("ne penalise jamais l'absence de parcours et reste identique a aujourd'hui", () => {
    const course = courseResultFromFlags({}, []);
    const withCourseHelper = scoreExercise({ ...base, winner: 'blue', ...courseResultToScoreInput(course) });
    const legacy = scoreExercise({ ...base, winner: 'blue' });

    expect(withCourseHelper).toEqual(legacy);
    expect(legacy.total).toBeGreaterThan(0);
  });
});

describe('dossier du candidat', () => {
  it('fusionne les etiquettes sans doublon', () => {
    const d = addTags(addTags(createDossier(), ['rapide']), ['rapide', 'protecteur']);
    expect(d.tags).toEqual(['protecteur', 'rapide']);
  });

  it('enregistre la note pratique et ses etiquettes', () => {
    const score = scoreExercise({ ...base, winner: 'blue' });
    const d = setPracticalScore(createDossier(), score);
    expect(d.practicalScore?.total).toBe(score.total);
    expect(d.tags).toContain('vainqueur-exercice');
  });

  it('survit a une entree corrompue', () => {
    expect(migrateDossier(null).tags).toEqual([]);
    expect(migrateDossier({ tags: ['x'] }).tags).toEqual(['x']);
  });
});

describe('note ecrite (ADR 0012)', () => {
  it('pose "copie-brillante" a partir de 5/6, jamais en dessous', () => {
    expect(writtenScoreTags({ correct: 5, total: 6 })).toContain('copie-brillante');
    expect(writtenScoreTags({ correct: 6, total: 6 })).toContain('copie-brillante');
    expect(writtenScoreTags({ correct: 4, total: 6 })).not.toContain('copie-brillante');
  });

  it('pose "copie-faible" a 2/6 et en dessous, jamais au-dela', () => {
    expect(writtenScoreTags({ correct: 2, total: 6 })).toContain('copie-faible');
    expect(writtenScoreTags({ correct: 0, total: 6 })).toContain('copie-faible');
    expect(writtenScoreTags({ correct: 3, total: 6 })).not.toContain('copie-faible');
  });

  it('un score intermediaire ne pose aucune des deux etiquettes', () => {
    expect(writtenScoreTags({ correct: 3, total: 6 })).toEqual([]);
  });

  it('setWrittenScore enregistre la note et ses etiquettes dans le dossier', () => {
    const d = setWrittenScore(createDossier(), { correct: 6, total: 6 });
    expect(d.writtenScore).toEqual({ correct: 6, total: 6 });
    expect(d.tags).toContain('copie-brillante');
  });

  it('migrateDossier accepte un dossier v1 sans writtenScore (retombe sur null)', () => {
    expect(migrateDossier({ tags: ['x'] }).writtenScore).toBeNull();
    expect(migrateDossier(null).writtenScore).toBeNull();
  });
});
