/**
 * Bout en bout du chapitre 2 (lot 5.1, ADR 0021 ; complete au lot 5.11). Deux scenarios :
 *
 * 1. `?chapter=2&seed=...` joue la nuit entiere jusqu'au bilan, pilote par `window.__game` (voir
 *    docs/process/DEBUG_API.md), meme principe que tests/e2e/narrative.spec.ts pour le chapitre 1 :
 *    la fin est atteinte, le bilan s'affiche avec ses lignes et sa photo, le dossier porte les
 *    entrees du chapitre. En passant, le portrait d'un dialogue ne deborde pas sur le suivant.
 * 2. Au clic, sur le canvas : ce que l'API contourne et qu'un joueur rencontre -- le bal attend
 *    l'invitation (« Pas tout de suite » rend la main), la grille du dortoir se force d'un clic.
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { E2EPresentedNode, E2ESceneSnapshot } from './debug-api';

/** Etat du portrait hero du panneau de dialogue (DOM) : `null` s'il est cache, sinon le nom affiche. */
async function heroName(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('[data-testid=hero]');
    if (!hero || hero.hidden) return null;
    return hero.querySelector('.narrative-hero-name')?.textContent?.trim() ?? '';
  });
}

/** Les lignes du bilan de nuit, telles qu'affichees (`ReportView.renderChapterBilan`). */
async function bilanLines(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const line of document.querySelectorAll('.chapter-host-report .report-bilan-line')) {
      const label = line.querySelector('.report-bilan-label')?.textContent?.trim() ?? '';
      out[label] = line.querySelector('.report-bilan-value')?.textContent?.trim() ?? '';
    }
    return out;
  });
}

/**
 * Point du canvas dont le survol affiche `label` (vrais `pointermove`, etiquette publique du HUD),
 * meme methode que `canvasPointForLabel` d'explore.spec.ts : ni projection ni raycast dupliques.
 */
async function canvasPointForLabel(page: Page, label: string): Promise<{ x: number; y: number }> {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (attempt > 0) await page.waitForTimeout(150);
    const point = await page.evaluate((lbl) => {
      const canvas = document.querySelector<HTMLCanvasElement>('.chapter-host-explore canvas');
      const hover = document.querySelector<HTMLElement>('[data-testid=explore-hover-label]');
      if (!canvas || !hover) return null;
      const rect = canvas.getBoundingClientRect();
      for (let y = rect.top; y < rect.bottom; y += 4) {
        for (let x = rect.left; x < rect.right; x += 4) {
          canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
          if (hover.textContent === lbl && hover.style.display !== 'none') return { x, y };
        }
      }
      return null;
    }, label);
    if (!point) continue;
    // Comme explore.spec.ts : l'entree d'etape recentre la camera (450 ms) et un balayage
    // synchrone peut la saisir en mouvement. On laisse passer deux images et on reverifie CE point.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const stillThere = await page.evaluate(
      ({ x, y, lbl }) => {
        const canvas = document.querySelector<HTMLCanvasElement>('.chapter-host-explore canvas');
        const hover = document.querySelector<HTMLElement>('[data-testid=explore-hover-label]');
        if (!canvas || !hover) return false;
        canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
        return hover.textContent === lbl && hover.style.display !== 'none';
      },
      { ...point, lbl: label },
    );
    if (stillThere) return point;
  }
  throw new Error(`« ${label} » introuvable au survol du canvas`);
}

/** Cadre la camera sur `cell` sans deplacer Franklyn : il y est pose, `c` recentre, il revient. */
async function lookAt(page: Page, cell: { x: number; y: number }): Promise<void> {
  const back = await page.evaluate(() => window.__game.explore()?.leader);
  await page.evaluate(({ x, y }) => window.__game.walkTo(x, y), cell);
  await page.keyboard.press('c');
  await page.waitForTimeout(600);
  if (back) await page.evaluate(({ x, y }) => window.__game.walkTo(x, y), back);
}

/** Clique l'entite de libelle `label` : Franklyn marche jusqu'a elle, puis le dialogue s'ouvre. */
async function clickEntityAndWaitDialogue(page: Page, label: string): Promise<void> {
  const point = await canvasPointForLabel(page, label);
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => window.__game.node() !== null, undefined, { timeout: 20_000 });
}

/** Clique, dans le panneau de dialogue, le choix dont le texte contient `text`. */
async function clickChoice(page: Page, text: string): Promise<void> {
  await page.locator('[data-testid=choices] button.narrative-choice', { hasText: text }).click();
}

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
    if (current.id === 'ch2.decharges') {
      // Defaut de QA (lot 5.11) : le portrait de Murano restait a l'ecran aux decharges -- le
      // repli « garder le dernier portrait » debordait d'un fichier de dialogue sur le suivant.
      expect(await heroName(page), 'aucun portrait herite de ch2.murano aux decharges').not.toBe('Murano');
    }
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

  // Le bilan de nuit (ChapterDef.end, ADR 0025) est a l'ecran : la photo, et une ligne par
  // survivant, par mort, par objet -- toutes renseignees.
  await expect(page.getByTestId('report-photo')).toBeVisible();
  const lines = await bilanLines(page);
  for (const label of ['État de Letitia', 'Zachary', 'Abigail', "L'enfant", 'Murano', 'Le fusil', 'La voiture']) {
    expect(lines[label], `ligne « ${label} » du bilan`).toBeTruthy();
  }
  // Les entrees du chapitre (06-SCORING-DOSSIER.md) sont toutes ecrites au dossier.
  const dossier = await page.evaluate(() => window.__game.dossier());
  const keys = dossier.entries.map((e) => e.key);
  for (const key of [
    'ch2.letitia.etat',
    'ch2.zachary',
    'ch2.zachary.adieu',
    'ch2.campement.insignes',
    'ch2.campement.tueur',
    'ch2.fusil',
    'ch2.rendezvous.source',
  ]) {
    expect(keys, `entree « ${key} » au dossier`).toContain(key);
  }
});

/**
 * Deux defauts de QA du lot 5.11, joues au clic parce que `interact()` les contournait :
 * - le bal se fermait des qu'on parlait a Letitia (declencheur de l'objectif) ; il attend
 *   desormais que Franklyn s'engage (`ObjectiveDef.completesWhen`) : « Pas tout de suite » rend
 *   la main, et la conversation se rejoue en entier ;
 * - la grille du dortoir, porte verrouillee d'un mur nord-sud, se voyait de profil et se survolait
 *   mal : elle doit se forcer d'un vrai clic.
 */
test('au clic : le bal attend l invitation, la grille se force', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?scene=ch2.bal&seed=e2e-chapter2-clic&ai=0&dice=0');
  await page.waitForFunction(() => '__game' in window);

  await clickEntityAndWaitDialogue(page, 'Parler à Letitia');
  await clickChoice(page, 'Pas tout de suite');
  await page.getByTestId('advance').click();
  expect(await page.evaluate(() => window.__game.scene().id)).toBe('ch2.bal');
  expect((await page.evaluate(() => window.__game.explore()))?.objective?.complete).toBe(false);

  await clickEntityAndWaitDialogue(page, 'Parler à Letitia');
  expect(await page.evaluate(() => window.__game.node()?.nodeId)).toBe('salle');
  await clickChoice(page, 'Rester en retrait');
  await traverseDialogue(page);
  expect(await advanceToNextScene(page)).toMatchObject({ id: 'ch2.slow' });

  // Abigail pour porteuse : la jumelle « Abigail » de la fuite est celle que la grille relancait
  // au lieu d'ouvrir ch2.grille (SceneRouter.goTo retenait la premiere jumelle, lot 5.11).
  await page.evaluate(() => {
    const api = window.__game;
    for (let i = 0; i < 40; i++) {
      const node = api.node();
      if (!node || node.finished) break;
      if (node.pendingRoll) api.acceptRoll();
      else {
        const pick = node.choices.find((c) => c.text.startsWith('Abigail la porte')) ?? node.choices[0];
        if (pick) api.choose(pick.index);
        else api.advance();
      }
    }
  });
  expect(await advanceToNextScene(page)).toMatchObject({ id: 'ch2.fuite', kind: 'explore' });
  expect(await page.evaluate(() => window.__game.runState().flags['ch2.porteur'])).toBe('abigail');
  await lookAt(page, { x: 24, y: 9 });
  await clickEntityAndWaitDialogue(page, 'Forcer la grille');
  expect(await page.evaluate(() => window.__game.scene().id)).toBe('ch2.grille');
});
