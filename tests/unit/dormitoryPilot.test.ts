import { describe, expect, it } from 'vitest';
import { createDossier } from '@/core/dossier';
import { DORMITORY_PILOT_MAP } from '@/dev/dormitoryPilotMap';
import { ExploreState } from '@/explore';
import { createRunState } from '@/narrative';

describe('pilote du dortoir', () => {
  it('relie le lit de Franklyn aux casiers, aux lits et aux trois seuils', () => {
    const state = new ExploreState(
      DORMITORY_PILOT_MAP,
      { dossier: createDossier(), run: createRunState('pilote-test') },
      { spawn: 'franklyn' },
    );
    for (const target of [
      { x: 13, y: 2 }, // casier
      { x: 27, y: 7 }, // lits est
      { x: 17, y: 8 }, // allée centrale
      { x: 2, y: 7 }, // seuil ouest
      { x: 10, y: 18 }, // sortie cour
      { x: 23, y: 18 }, // sortie cantine
    ]) {
      expect(state.walkLeaderTo(target)).toMatchObject({ ok: true });
      for (let i = 0; i < 400 && state.isMoving(); i++) state.tick(100);
      expect(state.leaderCell()).toEqual(target);
    }
  });
});
