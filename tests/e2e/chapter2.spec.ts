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

/**
 * Entité qui termine l'objectif de chaque scène `explore` du chapitre 2 (lots 5.8, 5.9 et 5.10, `ch2.bal`,
 * `ch2.fuite`, `ch2.conduits`, `ch2.cantine`, `ch2.campement` -- voir `src/data/chapters/ch2.ts`) : `window.__game.interact(id)` déclenche
 * son `completionTrigger` sans marcher (même API que `ChapterApp.exploreInteract`), le plus
 * court chemin pour un parcours de bout en bout qui ne juge pas le rendu 3D.
 */
const EXPLORE_TRIGGERS: Record<string, string> = {
  'ch2.bal': 'bal.letitia',
  'ch2.fuite': 'dortoir.grille',
  'ch2.conduits': 'petits.enfant',
  'ch2.cantine': 'cantine.vide-ordures',
  'ch2.campement': 'campement.murano',
};

/**
 * Lot 5.9 : ce qu'une scène `explore` impose AVANT son déclencheur -- le boîtier du ventilateur
 * des conduits ouvre la seule route vers l'enfant, puis vers la cantine. On le joue comme un
 * joueur, pour que la cantine se trouve réellement atteignable (plus bas), pas seulement
 * déclenchable à distance.
 */
const EXPLORE_PREREQUISITES: Record<string, string[]> = {
  'ch2.conduits': ['conduits.ventilateur'],
};

test('?chapter=2 : les scenes s enchainent jusqu a l ecran de fin', async ({ page }) => {
  await page.goto('/?chapter=2&seed=e2e-chapter2&ai=0');
  await page.waitForFunction(() => '__game' in window);

  const scene = await page.evaluate(() => window.__game.scene());
  expect(scene.id).toBe('ch2.photo');
  expect(scene.kind).toBe('dialogue');

  const runState = await page.evaluate(() => window.__game.runState());
  expect(runState.chapter).toBe(2);
  expect(runState.luck).toBe(3);

  // Les scenes du chapitre 2 (docs/chapters/ch2/TECH-DESIGN.md §4.4) : des dialogues, et
  // depuis les lots 5.8 a 5.10, cinq scenes `explore` (bal, fuite, conduits, cantine, campement) -- on les traverse jusqu'a
  // l'ecran de fin, sans jamais rester bloque.
  let current = scene;
  for (let i = 0; i < 20 && !current.finished; i++) {
    if (current.kind === 'explore') {
      for (const entityId of EXPLORE_PREREQUISITES[current.id] ?? []) {
        await page.evaluate((id) => window.__game.interact(id), entityId);
        await traverseDialogue(page);
        await page.evaluate(() => window.__game.advance());
      }
      if (current.id === 'ch2.cantine') {
        // La porte de la cantine s'est ouverte avec l'enfant, le ventilateur avec son boîtier :
        // depuis là où la scène 5 a laissé Franklyn, le vide-ordures est à portée de pas.
        const explore = await page.evaluate(() => window.__game.explore());
        const chute = explore?.interactables.find((e) => e.id === 'cantine.vide-ordures');
        expect(chute?.reachable, 'le vide-ordures doit être atteignable à pied').toBe(true);
      }
      const triggerId = EXPLORE_TRIGGERS[current.id];
      if (triggerId) await page.evaluate((id) => window.__game.interact(id), triggerId);
      const node = await page.evaluate(() => window.__game.node());
      if (!node) {
        // L'entité n'ouvre aucune conversation (ex. `dortoir.grille`, contrat du lot 3.6b) :
        // elle a fait avancer le routeur directement.
        current = await page.evaluate(() => window.__game.scene());
        continue;
      }
    }
    await traverseDialogue(page);
    current = await advanceToNextScene(page);
  }

  expect(current.finished, `le chapitre 2 devrait etre termine, scene courante : "${current.id}"`).toBe(true);

  // L'ecran de fin (bilan provisoire, ChapterDef.end === 'ch1-report' au lot 5.1) est bien
  // affiche : le dossier accumule au moins les etiquettes du profil Neutre.
  const dossier = await page.evaluate(() => window.__game.dossier());
  expect(dossier.tags.length).toBeGreaterThan(0);
});
