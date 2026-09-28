import { describe, expect, it } from 'vitest';
import { createDossier } from '@/core/dossier';
import { createRng } from '@/core/rng';
import { DIALOGUES } from '@/data/dialogues/registry';
import { DialogueRunner, createRunState } from '@/narrative';
import type { CharacterId } from '@/rules/character';
import { CH1_TASER_BEARER_FLAG, assignLoadout, resolveBriefingTaserBearer } from '@/tactical/combat';

describe('briefing du centre d entraînement', () => {
  it('transmet les trois choix du dialogue au vrai porteur du taser malgré un tirage variable', () => {
    const file = DIALOGUES['ch1.centre-hall'];
    expect(file).toBeDefined();
    const blue: CharacterId[] = ['franklyn', 'letitia', 'grover'];
    for (const [index, expected] of blue.entries()) {
      const run = {
        ...createRunState(`briefing-${index}`),
        roster: { ...createRunState('base').roster, blue },
      };
      const runner = new DialogueRunner(
        file!,
        { dossier: createDossier(), run },
        createRng(`briefing-${index}`),
      );
      while (runner.current().nodeId !== 'choix-taser') runner.advance();
      expect(runner.choose(index).ok).toBe(true);
      const selected = resolveBriefingTaserBearer(blue, runner.context.run.flags[CH1_TASER_BEARER_FLAG]);
      expect(selected).toBe(expected);
      const loadout = assignLoadout(blue, false, selected);
      expect(loadout[expected]!).toContain('taser');
      expect(
        Object.values(loadout)
          .flat()
          .filter((item) => item === 'taser'),
      ).toHaveLength(1);
    }
    expect(resolveBriefingTaserBearer(blue, 'ancienne-sauvegarde')).toBeUndefined();
  });
});
