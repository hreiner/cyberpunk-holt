/**
 * Test end-to-end de l'exploration du chapitre 1 (ADR 0013, epic 3 lot 3.6b).
 *
 * Meme principe que narrative.spec.ts : on pilote `window.__game` (voir
 * docs/process/DEBUG_API.md), on ne clique pas dans le canvas. Ce fichier
 * couvre ce que narrative.spec.ts ne peut pas (`ChapterApp` melange DOM et
 * logique, donc hors de portee de vitest/Node -- voir docs/process/TESTING.md) :
 * le parcours reel etapes 1 a 6 (reveil -> cantine -> discours -> pupitre ->
 * examen -> tirage -> temps libre -> garage -> fourgon), l'absence de
 * teleportation entre deux etapes d'exploration sur la meme carte, la
 * conversation annexe qui n'avance pas le routeur et ne se rejoue pas, et la
 * reprise directe sur une etape d'exploration (`?scene=`).
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { E2EExploreSnapshot, E2EPresentedNode, E2ESceneSnapshot } from './debug-api';

async function boot(page: Page, scene: string, seed = 'e2e-explore'): Promise<void> {
  await page.goto(`/?seed=${seed}&ai=0&scene=${scene}`);
  await page.waitForFunction(() => '__game' in window);
}

/**
 * Taille RASTER du canvas d'exploration (`canvas.width`/`.height`, pas son
 * `style.width`/`.height` CSS) : régression réelle rencontrée pendant ce lot
 * -- `enterExploreScene` mesurait `exploreHost.clientWidth/Height` alors que
 * l'hôte était encore `display:none` (hérité de la scène `dialogue`
 * précédente), donnant un canvas 0x0 -- l'état logique (`scene()`, `explore()`)
 * restait pourtant parfaitement correct, ce qui ne rendait le défaut visible
 * QUE par capture d'écran, jamais par une assertion sur l'API de debug seule.
 * Ce contrôle est donc volontairement DOM (`page.evaluate` sur le canvas),
 * pas `window.__game`, pour attraper exactement ce genre de défaut.
 */
async function exploreCanvasSize(page: Page): Promise<{ width: number; height: number } | null> {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.chapter-host-explore canvas');
    return canvas ? { width: canvas.width, height: canvas.height } : null;
  });
}

/**
 * Trouve une entité à partir du vrai survol du canvas. La caméra isométrique reste privée à
 * `ExploreView` : le test ne duplique donc ni sa projection ni le raycast, il reproduit les
 * événements navigateur que reçoit le joueur et lit l'étiquette de survol publique du HUD.
 *
 * Réessaie le balayage entier (borné, voir `attempts`) plutôt que de le lancer une seule fois :
 * l'entrée d'une étape recentre la caméra pendant 450 ms (`RECENTER_DURATION_S`,
 * src/render/isoCamera.ts) -- amorti, donc en mouvement continu tant que ce n'est pas fini. Le
 * balayage dispatche ses `pointermove` de façon SYNCHRONE (une seule tâche JS, aucune image ne
 * s'affiche pendant son déroulement) : lancé pendant ce recentrage, il pique la caméra à une
 * position intermédiaire qui n'est déjà plus la bonne l'instant d'après -- pas un défaut de
 * picking en jeu (aucun joueur réel ne clique dans les premières millisecondes d'une scène), un
 * artefact du balayage instantané. Une seule pause fixe avant le balayage est fragile sous
 * charge (plusieurs navigateurs Playwright en parallèle peuvent retarder la première image bien
 * au-delà de 450 ms) ; réessayer jusqu'à ce que la caméra soit réellement stable est la version
 * fiable de la même idée.
 */
async function canvasPointForLabel(page: Page, label: string, attempts = 20): Promise<{ x: number; y: number }> {
  const sweepOnce = (expectedLabel: string) =>
    page.evaluate((lbl) => {
      const canvas = document.querySelector<HTMLCanvasElement>('.chapter-host-explore canvas');
      const hoverLabel = document.querySelector<HTMLElement>('[data-testid=explore-hover-label]');
      if (!canvas || !hoverLabel) return null;
      const rect = canvas.getBoundingClientRect();
      for (let y = rect.top; y < rect.bottom; y += 4) {
        for (let x = rect.left; x < rect.right; x += 4) {
          canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
          if (hoverLabel.textContent === lbl && hoverLabel.style.display !== 'none') return { x, y };
        }
      }
      return null;
    }, expectedLabel);

  let point: { x: number; y: number } | null = null;
  for (let i = 0; i < attempts && !point; i++) {
    if (i > 0) await page.waitForTimeout(150);
    const candidate = await sweepOnce(label);
    if (!candidate) continue;
    // Un survol trouvé n'est pas forcément encore VALIDE une image plus tard : un coéquipier en
    // train de rattraper sa position de filature (08-EXPLORATION.md "Le groupe") peut glisser
    // devant la case visée entre le balayage et le clic réel, qui arrive après ce balayage
    // synchrone -- défaut réel constaté (le même pixel change de cible d'une image à l'autre).
    // Laisser passer une image puis revérifier CE point précis filtre ces faux positifs sans
    // reprendre tout le balayage à chaque fois.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const stillThere = await page.evaluate(
      ({ x, y, expectedLabel }) => {
        const canvas = document.querySelector<HTMLCanvasElement>('.chapter-host-explore canvas');
        const hoverLabel = document.querySelector<HTMLElement>('[data-testid=explore-hover-label]');
        if (!canvas || !hoverLabel) return false;
        canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
        return hoverLabel.textContent === expectedLabel && hoverLabel.style.display !== 'none';
      },
      { x: candidate.x, y: candidate.y, expectedLabel: label },
    );
    if (stillThere) point = candidate;
  }
  expect(point, `entité « ${label} » introuvable (ou instable) au survol du canvas après ${attempts} balayages`).not.toBeNull();
  if (!point) throw new Error(`entité « ${label} » introuvable au survol du canvas`);
  return point;
}

/**
 * Traverse le dialogue courant en choisissant toujours le premier choix
 * REELLEMENT propose (copie simplifiee de `narrative.spec.ts` -- voir ce
 * fichier pour la justification de chaque cas). S'arrete des qu'un noeud
 * terminal est atteint, SANS quitter la scene.
 */
async function traverseDialogue(page: Page): Promise<E2EPresentedNode | null> {
  return page.evaluate(() => {
    const api = window.__game;
    let node = api.node();
    for (let i = 0; i < 100 && node && !node.finished; i++) {
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

/**
 * Un dernier "Continuer" sur un noeud terminal rend la main a la scene
 * suivante -- SAUF sur le noeud terminal de `ch1.tirage`, qui ouvre l'ecran
 * de tirage plutot que d'avancer le routeur (ADR 0014, `sceneSnapshot()`
 * reste alors `{ id: 'ch1.tirage', finished: false }` tant que Franklyn n'a
 * pas choisi ses deux coequipiers) : voir `performDraft`.
 */
async function advanceScene(page: Page): Promise<E2ESceneSnapshot> {
  const scene = await page.evaluate(() => {
    window.__game.advance();
    return window.__game.scene();
  });
  if (scene.id === 'ch1.tirage' && !scene.finished) return performDraft(page);
  return scene;
}

/** Joue le tirage (ADR 0014) en prenant toujours le premier cadet encore disponible. */
async function performDraft(page: Page): Promise<E2ESceneSnapshot> {
  return page.evaluate(() => {
    const api = window.__game;
    let state = api.draft();
    for (let i = 0; i < 10 && state && state.turn !== 'done'; i++) {
      const cadetId = state.pool[0];
      if (!cadetId) break;
      api.pickTeammate(cadetId);
      state = api.draft();
    }
    api.advance();
    return api.scene();
  });
}

/**
 * Marche jusqu'a la case d'interaction de `entityId` puis le declenche --
 * reproduit le flot d'un clic joueur (marcher, puis interagir), a la
 * difference que `interact()` ne verifie pas l'atteignabilite (voir
 * docs/process/DEBUG_API.md).
 *
 * `roomWaypoint` : une case DANS la piece qui porte `entityId`, pour y entrer
 * d'abord -- `explore().interactables` ne montre qu'une entite npc/object/seat
 * DECOUVERTE (08-EXPLORATION.md "La decouverte des lieux"), exactement ce que
 * voit un vrai joueur, donc `entityId` n'y figure pas tant que la piece n'a
 * pas ete visitee. Coordonnees reprises d'un point d'apparition DEJA public
 * de la carte (`SPAWNS` de `src/data/maps/holt.ts`), jamais inventees pour ce
 * test.
 */
async function walkAndInteract(
  page: Page,
  entityId: string,
  roomWaypoint: { x: number; y: number },
): Promise<E2ESceneSnapshot> {
  return page.evaluate(
    ({ id, waypoint }) => {
      const api = window.__game;
      api.walkTo(waypoint.x, waypoint.y); // entre dans la piece -> la decouvre
      const snapshot = api.explore();
      const target = snapshot?.interactables.find((i) => i.id === id);
      if (!target) throw new Error(`interactable "${id}" introuvable dans explore().interactables`);
      api.walkTo(target.interactionCell.x, target.interactionCell.y);
      api.interact(id);
      return api.scene();
    },
    { id: entityId, waypoint: roomWaypoint },
  );
}

test('le chapitre 1 se joue de bout en bout par l’API de debug (réveil -> fourgon)', async ({ page }) => {
  await boot(page, 'ch1.intro');

  /* --- 1. Réveil (dialogue) -> "Rejoindre la cantine" (explore, étape reveil) --- */
  await traverseDialogue(page);
  let scene = await advanceScene(page);
  expect(scene).toMatchObject({ id: 'ch1.vers-cantine', kind: 'explore' });

  let explore = await page.evaluate(() => window.__game.explore());
  expect(explore?.mapId).toBe('holt');
  expect(explore?.followers).toHaveLength(0); // seul avant le tirage (08-EXPLORATION.md "Le groupe")
  expect(explore?.objective?.title).toBe('Rejoindre la cantine');
  // Le canvas est bien dessiné (voir `exploreCanvasSize` : régression réelle du lot, invisible
  // depuis window.__game seul).
  const canvasAtReveil = await exploreCanvasSize(page);
  expect(canvasAtReveil?.width).toBeGreaterThan(0);
  expect(canvasAtReveil?.height).toBeGreaterThan(0);
  const runAfterReveil = await page.evaluate(() => window.__game.runState());
  expect(runAfterReveil.flags['ch1.etape']).toBe('reveil');
  const leaderAtSpawn = explore?.leader;

  /* --- 2. Marche jusqu'à la place de la cantine, s'assoit -> ch1.discours (dialogue) --- */
  scene = await walkAndInteract(page, 'cantine.place-franklyn', { x: 41, y: 20 }); // SPAWNS.cantine
  expect(scene).toMatchObject({ id: 'ch1.discours', kind: 'dialogue' });

  /* --- 3. Discours -> "Rejoindre les salles d'entraînement" (explore, MÊME carte) --- */
  await traverseDialogue(page);
  scene = await advanceScene(page);
  expect(scene).toMatchObject({ id: 'ch1.vers-examen', kind: 'explore' });

  // Pas de téléportation (contrat du lot) : Franklyn reste où le dialogue l'a laissé (la
  // cantine), jamais reposé au point d'apparition du réveil (le lit).
  explore = await page.evaluate(() => window.__game.explore());
  expect(explore?.leader).not.toEqual(leaderAtSpawn);
  const runAfterDiscours = await page.evaluate(() => window.__game.runState());
  expect(runAfterDiscours.flags['ch1.etape']).toBe('examen');
  // Le retour à l'exploration APRÈS un dialogue est le cas qui a régressé (voir
  // `exploreCanvasSize`) : le canvas doit rester correctement dimensionné, pas 0x0.
  const canvasAfterDiscours = await exploreCanvasSize(page);
  expect(canvasAfterDiscours?.width).toBeGreaterThan(0);
  expect(canvasAfterDiscours?.height).toBeGreaterThan(0);

  /* --- 4. Marche jusqu'au pupitre, s'assoit -> ch1.exam (dialogue) --- */
  scene = await walkAndInteract(page, 'entrainement.pupitre-franklyn', { x: 37, y: 37 }); // SPAWNS.pupitre
  expect(scene).toMatchObject({ id: 'ch1.exam', kind: 'dialogue' });

  /* --- 5. Examen -> tirage -> "Rejoindre le garage" (explore, étape temps-libre) --- */
  await traverseDialogue(page);
  scene = await advanceScene(page); // ouvre ch1.tirage
  expect(scene.id).toBe('ch1.tirage');
  await traverseDialogue(page); // narration d'ouverture du tirage (le directeur nomme les capitaines)
  scene = await advanceScene(page); // ouvre l'écran de tirage, joue le tirage, avance au hub
  expect(scene).toMatchObject({ id: 'ch1.hub', kind: 'explore' });

  // Les deux coéquipiers du tirage suivent désormais Franklyn (08-EXPLORATION.md "Le groupe").
  explore = await page.evaluate(() => window.__game.explore());
  expect(explore?.followers).toHaveLength(2);
  const runAfterTirage = await page.evaluate(() => window.__game.runState());
  expect(runAfterTirage.flags['ch1.etape']).toBe('temps-libre');

  /* --- 6. Conversation annexe : parler à un cadet n'avance pas le routeur, et ne se rejoue pas --- */
  await page.evaluate(() => window.__game.interact('armurerie.john'));
  let node = await page.evaluate(() => window.__game.node());
  expect(node, 'la conversation annexe aurait dû ouvrir un dialogue').not.toBeNull();

  await traverseDialogue(page);
  const afterConvo = await advanceScene(page);
  expect(afterConvo, 'une conversation annexe ne fait pas avancer le routeur').toMatchObject({
    id: 'ch1.hub',
    kind: 'explore',
  });
  node = await page.evaluate(() => window.__game.node());
  expect(node).toBeNull(); // la conversation est bien refermée, retour à l'exploration

  const repeatOutcome = await page.evaluate(() => window.__game.interact('armurerie.john'));
  expect(repeatOutcome?.kind, 'une conversation déjà jouée répond par une réplique brève').toBe('brief-line');
  node = await page.evaluate(() => window.__game.node());
  expect(node, 'la conversation déjà jouée ne doit pas se rejouer').toBeNull();

  /* --- 7. Marche jusqu'au garage, monte dans le fourgon -> ch1.fourgon (dialogue) --- */
  scene = await walkAndInteract(page, 'garage.fourgon', { x: 37, y: 60 }); // SPAWNS.garage
  expect(scene).toMatchObject({ id: 'ch1.fourgon', kind: 'dialogue' });
});

test('completeStep() (outil de développement) saute directement à la scène suivante', async ({ page }) => {
  await boot(page, 'ch1.vers-cantine', 'e2e-explore-completestep');
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.vers-cantine');

  const next = await page.evaluate(() => {
    window.__game.completeStep();
    return window.__game.scene();
  });
  expect(next).toMatchObject({ id: 'ch1.discours', kind: 'dialogue' });
});

test('les clics canvas sur le panneau puis la porte traversent les salles 1 et 2', async ({ page }) => {
  await boot(page, 'ch1.salle1', 'e2e-explore-semantic-pick');
  // La salle doit avoir été découverte avant que son contenu soit une cible visuelle.
  await page.evaluate(() => window.__game.walkTo(22, 47));
  // Voir la docstring de `canvasPointForLabel` : l'entrée d'étape recentre la caméra pendant
  // 450 ms, en cours juste après `boot()`. Le balayage réessaie donc jusqu'à ce qu'elle soit
  // stable plutôt que de dépendre d'une pause fixe.
  const point = await canvasPointForLabel(page, 'Pirater le panneau de la porte');

  // Vrai clic navigateur : ce test protège le raccord objet 3D -> raycast -> interaction,
  // que `window.__game.interact()` contourne volontairement.
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => window.__game.node() !== null);
  const node = await page.evaluate(() => window.__game.node());
  expect(node?.nodeId).toBe('arrivee');

  await traverseDialogue(page);
  expect(await advanceScene(page)).toMatchObject({ id: 'ch1.salle2', kind: 'explore' });
  // Salle 1 -> salle 2 ne téléporte pas (même carte, voir `ExploreSession.enterStep`) : Franklyn
  // reste au SEUIL sud de "salle2" (là où le panneau vient de le faire entrer), à l'autre bout
  // de la pièce (9 cases) de la porte nord visée ensuite. Recentrer la caméra à cet instant
  // (`enterExploreScene`) la centre donc sur ce seuil, PAS sur la porte -- une salle 2 entière
  // (18 x 9) déborde largement du cadre d'exploration à ce zoom, portant la porte tout au bord,
  // voire hors champ. Un vrai joueur marcherait d'abord vers la pièce avant de viser la porte
  // suivante ; `walkTo` + `C` (recentrage manuel, 08-EXPLORATION.md "Contrôles") reproduit
  // exactement ce geste, plutôt que de laisser le balayage chasser un pixel à peine visible dans
  // un coin -- défaut réel de cadrage identifié en jeu (pas un picking mort), corrigé ici où il
  // se manifeste plutôt que dans le rendu, faute de contrat public pour le recentrage automatique.
  // (23, 37) plutôt qu'une case collée à la porte : trop près, le meneur ET ses deux coéquipiers
  // (filature, 08-EXPLORATION.md "Le groupe") finissent masser exactement devant elle et la
  // recouvrent à l'écran -- constaté en jeu, un vrai joueur ne resterait de toute façon pas planté
  // sur le seuil qu'il vient de viser.
  await page.evaluate(() => window.__game.walkTo(23, 37));
  await page.keyboard.press('c');
  const doorPoint = await canvasPointForLabel(page, 'Franchir la porte nord');
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, doorPoint)).toBe('CANVAS');
  await page.mouse.click(doorPoint.x, doorPoint.y);
  await page.waitForFunction(() => window.__game.node()?.nodeId === 'porte');
  await traverseDialogue(page);
  expect(await advanceScene(page)).toMatchObject({ id: 'ch1.salle3', kind: 'explore' });
});

test('la porte ouverte depuis l’armoire reste franchissable après une reprise', async ({ page }) => {
  await boot(page, 'ch1.salle2', 'e2e-salle2-resume');
  await page.evaluate(() => window.__game.interact('salle2.armoire'));
  await traverseDialogue(page);
  expect(await advanceScene(page)).toMatchObject({ id: 'ch1.salle2', kind: 'explore' });

  await page.goto('/?ai=0');
  await page.waitForFunction(() => '__game' in window);
  await page.getByTestId('title-resume').click();
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle2');
  await page.evaluate(() => window.__game.walkTo(26, 31));
  expect((await page.evaluate(() => window.__game.explore()))?.leader).toEqual({ x: 26, y: 31 });
  await page.evaluate(() => window.__game.interact('salle2.porte-nord'));
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle3');
});

test('une partie reprise directement sur une étape d’exploration repart au bon endroit', async ({ page }) => {
  await boot(page, 'ch1.hub', 'e2e-explore-resume');

  const scene = await page.evaluate(() => window.__game.scene());
  expect(scene).toMatchObject({ id: 'ch1.hub', kind: 'explore' });

  const explore: E2EExploreSnapshot | null = await page.evaluate(() => window.__game.explore());
  expect(explore).not.toBeNull();
  // Entrée à froid (`?scene=`) : Franklyn apparaît au spawn de l'étape (SceneDef.spawn), pas à
  // une position arbitraire -- voir docs/design/09-MAPS-CHAPTER-1.md, SPAWNS.temps-libre.
  expect(explore?.leader).toEqual({ x: 23, y: 20 });
  const run = await page.evaluate(() => window.__game.runState());
  expect(run.flags['ch1.etape']).toBe('temps-libre');
});
