import { describe, expect, it } from 'vitest';
import { backdropFor } from '@/ui/sceneChrome';

describe('décors de dialogue', () => {
  it('choisit le lieu du dialogue actif avant le lieu générique de la scène', () => {
    expect(backdropFor('ch1.hub', 'ch1.hub.abigail')?.src).toBe('/assets/backdrops/infirmerie.webp');
    expect(backdropFor('ch1.hub', 'ch1.hub.john')?.src).toBe('/assets/backdrops/armurerie.webp');
    expect(backdropFor('ch1.centre-hall', 'ch1.centre-hall')?.src).toBe('/assets/backdrops/hall.webp');
    expect(backdropFor('ch1.centre-hall')?.src).toBe('/assets/backdrops/centre-examen.webp');
  });

  it('priorise le dialogue, puis le nœud, avant le décor de scène', () => {
    expect(backdropFor('ch1.fourgon', 'ch1.fourgon', 'depart')?.src).toBe('/assets/backdrops/garage.webp');
    expect(backdropFor('ch1.fourgon', 'ch1.fourgon', 'arrivee')?.src).toBe(
      '/assets/backdrops/centre-examen.webp',
    );
    expect(backdropFor('ch1.fourgon', 'ch1.fourgon', 'route')?.src).toBe('/assets/backdrops/badlands.webp');
    expect(backdropFor('ch1.fourgon', 'ch1.interface', 'depart')?.src).toBe(
      '/assets/backdrops/interface.webp',
    );
  });

  it('laisse les scènes sans correspondance sur leur décor de repli', () => {
    expect(backdropFor('ch1.inconnue')).toBeUndefined();
  });
});
