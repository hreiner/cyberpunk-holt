/**
 * Tests end-to-end du chapitre 1.
 *
 * Principe : on ne clique pas dans le canvas. On pilote une partie deterministe
 * via `window.__game` (contrat decrit dans docs/process/DEBUG_API.md), puis on
 * verifie l'etat et le HUD.
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { E2EState } from './debug-api';

async function boot(page: Page, seed = 'e2e-1'): Promise<E2EState> {
  await page.goto(`/?seed=${seed}&ai=0`);
  await page.waitForFunction(() => '__game' in window);
  return page.evaluate((s) => window.__game.newGame({ seed: s }), seed);
}

test('le jeu demarre et affiche le HUD', async ({ page }) => {
  const state = await boot(page);
  expect(state.phase).toBe('playing');
  expect(state.units).toHaveLength(6);

  await expect(page.getByTestId('banner')).toContainText('Round 1');
  await expect(page.getByTestId('action-endTurn')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
});

test('l ordre d initiative est stable et affiche', async ({ page }) => {
  const state = await boot(page, 'e2e-initiative');
  for (const id of state.order) {
    await expect(page.getByTestId(`order-${id}`)).toBeVisible();
  }
});

test('la meme graine rejoue exactement la meme partie', async ({ page }) => {
  await page.goto('/?ai=0');
  await page.waitForFunction(() => '__game' in window);

  const run = () =>
    page.evaluate(() => {
      window.__game.newGame({ seed: 'rejeu-e2e' });
      window.__game.runToEnd();
      return { log: window.__game.log(), state: window.__game.state() };
    });

  const first = await run();
  const second = await run();
  expect(second.log).toEqual(first.log);
  expect(second.state.winner).toBe(first.state.winner);
});

test('une action illegale est refusee proprement', async ({ page }) => {
  await boot(page, 'e2e-illegal');
  const outcome = await page.evaluate(() => window.__game.perform({ type: 'move', to: { x: 0, y: 0 } }));
  expect(outcome.ok).toBe(false);
  expect(typeof outcome.reason).toBe('string');
});

test('une partie complete se termine et produit une note', async ({ page }) => {
  await boot(page, 'e2e-complet');
  const result = await page.evaluate(() => ({
    state: window.__game.runToEnd(),
    score: window.__game.score(),
  }));

  expect(result.state.phase).toBe('finished');
  expect(['blue', 'red', 'draw']).toContain(result.state.winner);
  expect(result.score.total).toBeGreaterThanOrEqual(0);
  expect(result.score.total).toBeLessThanOrEqual(20);

  await expect(page.getByTestId('banner')).toContainText(/Exercice|Match nul/);
});

test('le deplacement du joueur consomme des points de mouvement', async ({ page }) => {
  await boot(page, 'e2e-move');
  const result = await page.evaluate(() => {
    let state = window.__game.state();
    // On avance jusqu'au premier tour d'une unite bleue.
    for (let i = 0; i < 6; i++) {
      const current = state.units.find((u) => u.id === state.current);
      if (current && current.team === 'blue') break;
      state = window.__game.endTurn();
    }
    const before = state.units.find((u) => u.id === state.current);
    if (!before) throw new Error('unite courante introuvable');
    const outcome = window.__game.perform({ type: 'move', to: { x: before.x, y: before.y - 1 } });
    const after = window.__game.state().units.find((u) => u.id === before.id);
    return { outcome, beforeMp: before.mp, afterMp: after?.mp ?? -1 };
  });

  expect(result.outcome.ok).toBe(true);
  expect(result.afterMp).toBe(result.beforeMp - 1);
});

/**
 * L'IA doit se lancer TOUTE SEULE quand l'initiative met l'equipe adverse en tete. Elle ne
 * l'etait que sur une action du joueur : au premier tour, si l'ordre commencait par un rouge,
 * personne ne jouait et rien n'etait cliquable -- defaut constate en jeu ("le combat commence
 * par le tour de Grover, de l'equipe adverse, il ne fait rien et on ne peut rien cliquer").
 * Aucun des autres tests ne l'attrapait : tous font passer les tours adverses a la main.
 *
 * La graine est choisie pour que l'ordre commence par un cadet rouge (verifie par le test
 * lui-meme, qui n'aurait sinon plus rien a prouver si l'initiative changeait).
 */
test('l IA prend la main d elle-meme quand l equipe adverse ouvre le combat', async ({ page }) => {
  await page.goto('/?seed=e2e-ia-4&ai=0&scene=ch1.affrontement');
  await page.waitForFunction(() => '__game' in window);

  const opening = await page.evaluate(() => {
    const state = window.__game.state();
    return state.units.find((u) => u.id === state.order[0])?.team;
  });
  expect(opening).toBe('red');

  // Personne ne clique : c'est au jeu de derouler les tours adverses et de rendre la main.
  await page.waitForFunction(
    () => {
      const state = window.__game.state();
      return state.units.find((u) => u.id === state.current)?.team === 'blue';
    },
    undefined,
    { timeout: 10_000 },
  );

  // Le tour adverse a bien ete JOUE, pas seulement saute.
  const log = await page.evaluate(() => window.__game.log());
  expect(log.some((line) => /se déplace|tire sur|corps à corps|pose une mine/.test(line))).toBe(true);
});
