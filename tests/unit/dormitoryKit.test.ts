import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { EXPLORE_VISUAL_MODELS } from '@/data/exploreVisualModels';
import { DormitoryKit } from '@/render/exploration/dormitoryKit';
import type { DormitoryMaterials } from '@/render/exploration/dormitoryMaterials';

describe('mobilier détaillé du dortoir', () => {
  it('garde tous ses volumes et accessoires dans les cases bloquées du catalogue', () => {
    // Le rendu n'est pas jugé ici : une vraie chaussure ou une retombée de drap hors
    // emprise ferait traverser un objet dans l'allée malgré un plan de données valide.
    // La géométrie se construit sans DOM, avec une matière neutre pour toute surface.
    const material = new THREE.MeshStandardMaterial();
    const materials = { get: () => material } as unknown as DormitoryMaterials;
    const kit = new DormitoryKit(materials, createRng('emprises-dortoir'));
    try {
      for (const [model, object] of [
        ['dormitory-bunk', kit.bunk('lit-franklyn')],
        ['dormitory-bunk', kit.bunk('lit-autre')],
        ['dormitory-locker-bank', kit.lockerBank()],
        ['dormitory-bench', kit.bench()],
      ] as const) {
        const [width, depth] = EXPLORE_VISUAL_MODELS[model].cells;
        const bounds = new THREE.Box3().setFromObject(object);
        expect(bounds.min.x, model).toBeGreaterThanOrEqual(-width / 2 - 0.001);
        expect(bounds.max.x, model).toBeLessThanOrEqual(width / 2 + 0.001);
        expect(bounds.min.z, model).toBeGreaterThanOrEqual(-depth / 2 - 0.001);
        expect(bounds.max.z, model).toBeLessThanOrEqual(depth / 2 + 0.001);
      }
    } finally {
      kit.dispose();
      material.dispose();
    }
  });
});
