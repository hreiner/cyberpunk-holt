/**
 * Test end-to-end du branchement narratif (lot 2.9 / ADR 0011).
 *
 * Meme principe que tactical.spec.ts : on ne clique pas dans la vue, on
 * pilote `window.__game` (voir docs/process/DEBUG_API.md) et on verifie
 * l'etat. Deux specs, sobres : le premier couvre les quatre points demandes
 * par la tache originale (la scene 1 s'enchaine et enrichit le dossier,
 * l'examen pose ses six entrees, l'affrontement final demarre avec le
 * `TeamState` du `RunState`) ; le second couvre le defaut 2 du rapport de
 * cloture epic 2 (le dossier ne doit pas survivre a une nouvelle partie sur
 * une autre graine -- trop couple au DOM/localStorage pour un test unitaire,
 * voir `isResumingRun` dans src/chapter.ts).
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { E2EDossier, E2EPresentedNode, E2ERunState, E2ESceneSnapshot } from './debug-api';

/**
 * Traverse le dialogue courant en choisissant toujours le premier choix
 * REELLEMENT propose (ou "Continuer" quand il n'y en a pas). S'arrete des
 * qu'un noeud terminal est atteint, SANS quitter la scene : voir
 * `advanceToNextScene`.
 *
 * Piege corrige (defaut 1 du rapport de cloture epic 2) : `choice.index` est
 * l'index D'ORIGINE dans `node.choices`, pas sa position dans cette liste
 * presentee -- un choix cache par une condition "saute" son numero. Passer
 * `0` en dur bouclait en silence des qu'un noeud filtrait son premier choix
 * (ex. ch1.fourgon / "reactions"). `choose()` ne renvoie plus le noeud
 * suivant (voir docs/process/DEBUG_API.md) : on relit `node()` a part.
 *
 * ADR 0012 (examen ecrit) : un noeud avec `insight` refuse tout `choose()`
 * tant que son jet de reflexion n'est pas resolu -- l'auto-joueur appelle
 * `rollInsight()` en premier des qu'il en voit un en attente.
 *
 * ADR 0015 §2 (Chance) : un jet de Franklyn rate de peu et rattrapable
 * (`node.pendingRoll`) suspend la navigation jusqu'a `spendLuck()`/
 * `acceptRoll()` -- l'auto-joueur accepte systematiquement l'echec
 * (`acceptRoll()`), le plus simple pour un parcours reproductible qui ne
 * cherche pas a economiser la Chance. ADR 0015 §1 (reflexion facultative,
 * `insight.optional`) : un jet non tire (`status: 'pending'` OU
 * `'available'` avec `affordable !== false`) est tire comme avant ; un jet
 * facultatif non finançable est simplement saute, les reponses restant
 * disponibles (`choose()` fonctionne directement, voir dialogueRunner.ts).
 */
async function traverseDialogue(page: Page): Promise<E2EPresentedNode | null> {
  return page.evaluate(() => {
    const api = window.__game;
    let node = api.node();
    // Le plus long dialogue du chapitre (ch1.bal) tient sur 22 noeuds : large marge.
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

/** Sur un noeud terminal, un dernier "Continuer" rend la main au chapitre (voir chapter.ts). */
async function advanceToNextScene(page: Page): Promise<E2ESceneSnapshot> {
  const scene = await page.evaluate(() => {
    window.__game.advance();
    return window.__game.scene();
  });
  // Le tirage (ADR 0014) intercale un ecran hors dialogue avant de vraiment
  // avancer le routeur (meme principe que le bilan de l'exercice, voir
  // docs/process/ARCHITECTURE.md) : la scene reste "ch1.tirage" tant que le
  // joueur n'a pas choisi ses deux coequipiers. L'auto-joueur les choisit ici
  // pour ne jamais rester bloque devant cet ecran.
  if (scene.id === 'ch1.tirage' && !scene.finished) return performDraft(page);
  return scene;
}

/**
 * Joue le tirage (ADR 0014) : Franklyn choisit toujours le premier cadet
 * encore disponible (reproductible, comme le reste de l'auto-joueur), le
 * choix d'Abigail est resolu dans le meme appel (voir `pickTeammate` dans
 * src/debug/gameApi.ts). Un dernier `advance()` rend la main a la scene
 * suivante une fois le recap affiche.
 */
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

async function boot(page: Page, scene: string, seed = 'e2e-narrative'): Promise<void> {
  await page.goto(`/?seed=${seed}&ai=0&scene=${scene}`);
  await page.waitForFunction(() => '__game' in window);
}

test('le chapitre s enchaine reellement : intro, examen, affrontement', async ({ page }) => {
  await boot(page, 'ch1.intro');

  /* --- 1. La scene 1 (reveil) s'enchaine jusqu'a son noeud terminal --- */
  const introEnd = await traverseDialogue(page);
  expect(introEnd?.finished).toBe(true);

  const introDossier = await page.evaluate(() => window.__game.dossier());
  // "Aller aider John" (premier choix de dortoir) ne pose qu'une affinite, pas
  // d'etiquette : on verifie que le dossier a bien bouge au sens large plutot
  // que d'exiger specifiquement une etiquette qu'aucun premier choix ne pose ici.
  expect(dossierSize(introDossier)).toBeGreaterThan(0);

  // Le reveil enchaine desormais sur une etape d'exploration (ADR 0013 §4,
  // epic 3 lot 3.6b) avant le discours -- ce test se concentre sur le
  // dossier/tirage/combat, pas sur le deplacement (voir explore.spec.ts pour
  // le parcours reel a la souris/API) : `completeStep()` (outil de dev,
  // docs/process/DEBUG_API.md) saute directement au declencheur.
  const afterIntro = await advanceToNextScene(page);
  expect(afterIntro.kind).toBe('explore');
  expect(afterIntro.id).toBe('ch1.vers-cantine');

  const afterVersCantine = await page.evaluate(() => {
    window.__game.completeStep();
    return window.__game.scene();
  });
  expect(afterVersCantine.id).toBe('ch1.discours');

  /* --- 2. L'examen : six questions, six entrees de dossier --- */
  const examScene = await page.evaluate(() => {
    window.__game.goToScene('ch1.exam');
    return window.__game.scene();
  });
  expect(examScene.id).toBe('ch1.exam');
  expect(examScene.kind).toBe('dialogue');

  const examEnd = await traverseDialogue(page);
  expect(examEnd?.finished).toBe(true);

  const examDossier = await page.evaluate(() => window.__game.dossier());
  const examEntries = examDossier.entries.filter((e) => e.key.startsWith('ch1.exam.question'));
  expect(examEntries).toHaveLength(6);

  /* --- 3bis. Le tirage (ADR 0014) : l'auto-joueur choisit deux coequipiers, --- */
  /* le roster du RunState (source de verite du combat, plus DEFAULT_BLUE/RED) en garde la trace. */
  await page.evaluate(() => window.__game.goToScene('ch1.tirage'));
  await traverseDialogue(page); // joue l'ouverture (le directeur nomme les deux capitaines)
  const afterTirage = await advanceToNextScene(page); // joue le tirage lui-meme, avance au hub
  expect(afterTirage.id).toBe('ch1.hub');

  const runAfterDraft: E2ERunState = await page.evaluate(() => window.__game.runState());
  expect(runAfterDraft.roster.blue[0]).toBe('franklyn');
  expect(runAfterDraft.roster.blue).toHaveLength(3);
  expect(runAfterDraft.roster.red[0]).toBe('abigail');
  expect(runAfterDraft.roster.red).toHaveLength(3);

  const dossierAfterDraft = await page.evaluate(() => window.__game.dossier());
  expect(dossierAfterDraft.entries.some((e) => e.key === 'ch1.tirage.choix')).toBe(true);
  expect(
    dossierAfterDraft.tags.includes('equipe-bande') || dossierAfterDraft.tags.includes('equipe-tactique'),
  ).toBe(true);

  /* --- 3. Le parcours interieur (epic 3 lot 3.7b) : les salles se jouent en entier ---
   * -- via l'entite qui porte le dialogue, dans le centre d'examen desormais explorable --
   * et le RunState/le dossier en sortent nourris, avant l'affrontement. */
  const centreHall = await page.evaluate(() => {
    window.__game.goToScene('ch1.centre-hall');
    return window.__game.scene();
  });
  expect(centreHall.id).toBe('ch1.centre-hall');
  expect(centreHall.kind).toBe('explore');

  // Le briefing de l'instructeur termine le hall et ouvre la porte vers la salle 1.
  await page.evaluate(() => window.__game.interact('hall.instructeur'));
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.centre-hall');
  await traverseDialogue(page);
  await page.evaluate(() => window.__game.advance());
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle1');

  // Salle 1 : le panneau est une conversation annexe ; la porte nord termine l'etape.
  await page.evaluate(() => window.__game.interact('salle1.panneau-porte'));
  const salle1End = await traverseDialogue(page);
  expect(salle1End?.finished).toBe(true);
  await page.evaluate(() => window.__game.advance());
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle1');
  await page.evaluate(() => window.__game.interact('salle1.porte-nord'));
  await traverseDialogue(page);
  await page.evaluate(() => window.__game.advance());
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle2');

  // Salle 2 : l'armoire d'abord (conversation annexe, "le choix couteux", n'avance pas le
  // routeur), puis la porte nord (declencheur, deja "faite" -- avance sans rejouer).
  await page.evaluate(() => window.__game.interact('salle2.armoire'));
  await traverseDialogue(page);
  await page.evaluate(() => window.__game.advance());
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle2'); // conversation annexe : pas d'avancee
  // Le dialogue de l'armoire raconte l'ouverture de la porte : le passage doit déjà être
  // physiquement libre avant le clic qui termine l'objectif.
  await page.evaluate(() => window.__game.walkTo(26, 31));
  expect((await page.evaluate(() => window.__game.explore()))?.leader).toEqual({ x: 26, y: 31 });
  await page.evaluate(() => window.__game.interact('salle2.porte-nord'));
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle3'); // deja "faite" via l'armoire -> avance directement

  // Salle 3 : choisit explicitement de rester malgre le gaz (2e choix de "choix-rester")
  // pour garantir la video (`renseignement`), plutot que le 1er choix par defaut ("foncer").
  await page.evaluate(() => window.__game.interact('salle3.ordinateur'));
  await page.evaluate(() => {
    const api = window.__game;
    for (let i = 0; i < 3 && api.node()?.nodeId !== 'choix-rester'; i++) {
      const first = api.node()?.choices[0];
      if (first) api.choose(first.index);
      else api.advance();
    }
  });
  const choixRester = await page.evaluate(() => window.__game.node());
  const resterChoice = choixRester?.choices[1];
  expect(resterChoice, 'choix "rester" introuvable sur choix-rester').toBeDefined();
  if (resterChoice) await page.evaluate((index) => window.__game.choose(index), resterChoice.index);
  await traverseDialogue(page);
  await page.evaluate(() => window.__game.advance());
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.salle3'); // conversation annexe

  const runAfterSalle3: E2ERunState = await page.evaluate(() => window.__game.runState());
  // Deterministe (le choix "rester" mene toujours a video-recuperee, quel que soit le jet de
  // Resistance) : c'est CE drapeau que `courseResultFromFlags` relit pour le poste "parcours
  // interieur" du bareme (docs/design/06-SCORING-DOSSIER.md), desormais atteignable pour de bon.
  expect(runAfterSalle3.flags['ch1.salle3.video-vue']).toBe(true);

  await page.evaluate(() => window.__game.interact('salle3.porte-nord'));
  await traverseDialogue(page);
  await page.evaluate(() => window.__game.advance());
  expect((await page.evaluate(() => window.__game.scene())).id).toBe('ch1.cour');

  const runBeforeCombat: E2ERunState = await page.evaluate(() => window.__game.runState());

  /* --- 4. La cour : le portail declenche le tampon "CONTACT" (08-EXPLORATION.md "Passer au
   * combat") puis, apres la coupure de 400 ms, le combat demarre avec le TeamState du RunState. --- */
  await page.evaluate(() => window.__game.interact('cour.portail'));
  await page.waitForFunction(() => window.__game.scene().id === 'ch1.affrontement');
  const combatScene = await page.evaluate(() => window.__game.scene());
  expect(combatScene.kind).toBe('tactical');

  const combatState = await page.evaluate(() => window.__game.state());
  expect(combatState.phase).toBe('playing');
  expect(combatState.units).toHaveLength(6);
  // Preuve du branchement : les kits de soin du combat sont ceux du RunState
  // construit par le parcours interieur, pas `defaultTeamState()` recalcule a la volee.
  expect(combatState.healkits.blue).toBe(runBeforeCombat.teams.blue.healkits);

  /* --- 5. Jusqu'au proces-verbal : le combat termine, le poste "parcours interieur" du
   * bareme n'est plus a zero (defaut historique corrige par ce lot). --- */
  await page.evaluate(() => window.__game.runToEnd());
  const dossierAfterCombat = await page.evaluate(() => window.__game.dossier());
  expect(dossierAfterCombat.practicalScore).not.toBeNull();
  expect(dossierAfterCombat.practicalScore?.tags).toContain('renseignement');
});

test(
  'deux parties sur des graines differentes ne cumulent pas leurs etiquettes ' +
    '(defaut 2 du rapport de cloture epic 2)',
  async ({ page }) => {
    await boot(page, 'ch1.intro', 'e2e-dossier-a');
    await traverseDialogue(page);
    await advanceToNextScene(page); // persiste dossier + RunState de la partie A (jamais au milieu d'un dialogue)

    const dossierA = await page.evaluate(() => window.__game.dossier());
    expect(dossierSize(dossierA)).toBeGreaterThan(0);

    // Nouvelle partie, graine differente, SANS `?scene=` (flot normal d'un
    // joueur qui relance depuis le debut, pas un saut de dev), SANS vider le
    // localStorage entre les deux `page.goto` : reproduction exacte du
    // defaut 2.
    await page.goto('/?seed=e2e-dossier-b&ai=0');
    await page.waitForFunction(() => '__game' in window);

    const dossierB = await page.evaluate(() => window.__game.dossier());
    // `dossierSize()` compte aussi les affinites, TOUJOURS non vides des la
    // creation (`createDossier()`/`startingAffinities()`, epic 3 lot 3.2 --
    // amorcees depuis les fiches, docs/design/04-CHARACTERS.md) : une partie
    // neuve n'a donc jamais un dossier de taille 0. Ce qui doit rester a zero
    // sur une graine neuve, ce sont les etiquettes/entrees VRAIMENT acquises
    // pendant la partie precedente -- l'assertion isole ces deux champs
    // plutot que l'agregat (voir `dossierSize`, garde en dessous pour la
    // premiere moitie de ce test).
    expect(dossierB.tags).toHaveLength(0);
    expect(dossierB.entries).toHaveLength(0);
    for (const tag of dossierA.tags) expect(dossierB.tags).not.toContain(tag);
  },
);

function dossierSize(d: E2EDossier): number {
  return d.tags.length + d.entries.length + Object.keys(d.affinities).length;
}
