import { describe, expect, it } from 'vitest';
import { generationOptions } from '../../scripts/audio-generation-options';

describe('options de production audio', () => {
  it('refuse les reprises sans cible et les fautes de filtre avant tout appel payant', () => {
    for (const selector of ['file', 'asset'] as const) {
      for (const args of [
        ['--force'],
        ['--force', '--dry-run'],
        [`--${selector}=`],
        [`--${selector}=a`, `--${selector}=b`],
        ['--fiel=a', '--force'],
      ])
        expect(() => generationOptions(args, selector)).toThrow();
      expect(generationOptions([`--${selector}=a`, '--force', '--dry-run'], selector)).toMatchObject({
        selected: 'a',
        force: true,
        dryRun: true,
      });
      expect(generationOptions([], selector)).toMatchObject({
        selected: undefined,
        force: false,
        dryRun: false,
      });
    }
  });
});
