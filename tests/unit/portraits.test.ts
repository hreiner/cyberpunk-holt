import { describe, expect, it } from 'vitest';
import { CHARACTER_IDS } from '@/rules/character';
import { portraitFor, surveillantPortraitSource } from '@/ui/portraits';

describe('registre des portraits (src/ui/portraits.ts)', () => {
  it('portraitFor est deterministe : meme id, meme fiche', () => {
    for (const id of [...CHARACTER_IDS, 'directeur', 'instructeur', 'otage', 'radio', 'narrateur'] as const) {
      expect(portraitFor(id)).toEqual(portraitFor(id));
    }
  });

  it('chaque cadet reprend son nom et sa couleur de characters.json', () => {
    for (const id of CHARACTER_IDS) {
      const spec = portraitFor(id);
      expect(spec.name.length).toBeGreaterThan(0);
      expect(spec.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('le matricule est stable et ne depend que de l id', () => {
    expect(portraitFor('zachary').badge).toBe(portraitFor('zachary').badge);
    expect(portraitFor('zachary').badge).not.toBe(portraitFor('john').badge);
  });

  it('choisit la variante du surveillant selon sa vigilance', () => {
    expect(surveillantPortraitSource(0)).toBe('/assets/portraits/surveillant.webp');
    expect(surveillantPortraitSource(1)).toBe('/assets/portraits/surveillant.webp');
    expect(surveillantPortraitSource(2)).toBe('/assets/portraits/surveillant-mefiant.webp');
    expect(surveillantPortraitSource(3)).toBe('/assets/portraits/surveillant-alerte.webp');
    expect(surveillantPortraitSource(99)).toBe('/assets/portraits/surveillant-alerte.webp');
  });
});
