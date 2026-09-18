import { describe, expect, it } from 'vitest';
import { SCORE_MAX, mentionFor, scoreExercise } from '@/rules/scoring';
import { addTags, createDossier, migrateDossier, setPracticalScore } from '@/core/dossier';

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
