/**
 * Bout en bout du chapitre 2 (lot 5.1, ADR 0021) : `?chapter=2&seed=...` joue
 * le squelette de 14 scenes jusqu'a l'ecran de fin, pilote par
 * `window.__game` (voir docs/process/DEBUG_API.md), meme principe que
 * tests/e2e/narrative.spec.ts pour le chapitre 1. Un seul scenario, sobre :
 * la preuve que le chapitre s'enchaine reellement de bout en bout.
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { E2EPresentedNode, E2ESceneSnapshot } from './debug-api';

/** Meme auto-joueur que narrative.spec.ts : premier choix REELLEMENT propose, sinon "Continuer.". */
async function traverseDialogue(page: Page): Promise<E2EPresentedNode | null> {
  return page.evaluate(() => {
    const api = window.__game;
    let node = api.node();
    for (let i = 0; i < 50 && node && !node.finished; i++) {
      if (node.pendingRoll) {
        api.acceptRoll();
        node = api.node();
        continue;
      }
      if (
        node.insight &&
        (node.insight.status === 'pending' ||
          (node.insight.status === 'available' && node.insight.affordable !== false))
      ) {
        api.rollInsight();
        node = api.node();
        continue;
      }
      const first = node.choices[0];
      if (first) api.choose(first.index);
      else api.advance();
      node = api.node();
    }
    return node;
  });
}

async function advanceToNextScene(page: Page): Promise<E2ESceneSnapshot> {
  return page.evaluate(() => {
    window.__game.advance();
    return window.__game.scene();
  });
}

test('?chapter=2 : le squelette de 14 scenes s enchaine jusqu a l ecran de fin', async ({ page }) => {
  await page.goto('/?chapter=2&seed=e2e-chapter2&ai=0');
  await page.waitForFunction(() => '__game' in window);

  const scene = await page.evaluate(() => window.__game.scene());
  expect(scene.id).toBe('ch2.photo');
  expect(scene.kind).toBe('dialogue');

  const runState = await page.evaluate(() => window.__game.runState());
  expect(runState.chapter).toBe(2);
  expect(runState.luck).toBe(3);

  // Les 14 scenes du squelette (docs/chapters/ch2/TECH-DESIGN.md §4.4), toutes des dialogues a
  // ce lot : on les traverse jusqu'a l'ecran de fin, sans jamais rester bloque.
  let current = scene;
  for (let i = 0; i < 20 && !current.finished; i++) {
    await traverseDialogue(page);
    current = await advanceToNextScene(page);
  }

  expect(current.finished, `le chapitre 2 devrait etre termine, scene courante : "${current.id}"`).toBe(true);

  // L'ecran de fin (bilan provisoire, ChapterDef.end === 'ch1-report' au lot 5.1) est bien
  // affiche : le dossier accumule au moins les etiquettes du profil Neutre.
  const dossier = await page.evaluate(() => window.__game.dossier());
  expect(dossier.tags.length).toBeGreaterThan(0);
});
