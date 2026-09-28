import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '@/data/chapters';
import { SceneRouter } from '@/narrative/sceneRouter';
import { SCENE_PRESETS, buildScenePresetStart } from '@/dev/scenePresets';

describe('sélecteur de scène de la QA', () => {
  it('propose chaque scène de chaque chapitre, une seule fois', () => {
    for (const def of Object.values(CHAPTERS)) {
      const ids = [...new Set(def.scenes.map((s) => s.id))];
      expect(SCENE_PRESETS.filter((p) => p.chapter === def.id).map((p) => p.sceneId)).toEqual(ids);
    }
  });

  it('chaque variante démarre une partie posée sur sa scène, jumelle éligible comprise', () => {
    for (const preset of SCENE_PRESETS) {
      for (const variant of preset.variants) {
        const start = buildScenePresetStart(variant.id, { seed: 'qa', profile: 'loyal' });
        expect(start, variant.id).not.toBeNull();
        const def = CHAPTERS[preset.chapter];
        const router = new SceneRouter(def.scenes, { dossier: start!.dossier, run: start!.run }, def.etapeFlag);
        router.goTo(start!.run.sceneId);
        const scene = router.current();
        expect(scene.id, variant.id).toBe(preset.sceneId);
        // Une jumelle gardée par `when` n'est retenue que si la branche la rend éligible.
        if (scene.when && variant.flags?.['ch2.porteur']) {
          expect(scene.followers?.[1], variant.id).toBe(variant.flags['ch2.porteur']);
        }
        if (variant.teammates) expect(start!.run.roster.blue).toEqual(['franklyn', ...variant.teammates]);
      }
    }
  });
});
