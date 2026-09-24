/**
 * Point d'entree du jeu.
 *
 * Le chapitre 1 est pilote par `ChapterApp` (src/chapter.ts), qui enchaine les
 * neuf scenes narratives (voir docs/process/adr/0011-moteur-narratif-etat-de-partie-et-radio.md)
 * et traite la phase tactique finale comme une scene parmi les autres.
 */

import './ui/theme.css';
import './ui/styles.css';
import { ChapterApp } from './chapter';
import { installDebugApi } from './debug/gameApi';
import { TitleView } from './ui/titleView';
import { loadSession } from './core/save';
import { CHAPTER_1_SCENES } from './narrative';
import { preloadCadetAssets } from './render/exploration/characterAssets';

const container = document.getElementById('app');
if (!container) throw new Error('#app introuvable dans index.html');

// Les scènes d'exploration sont synchrones : le jeu ne construit ChapterApp qu'après les
// GLB locaux. La page ne reste jamais blanche en cas de cache vidé ou de fichier manquant.
const assetStatus = document.createElement('p');
assetStatus.className = 'panel';
assetStatus.style.cssText =
  'position:fixed;inset:40% auto auto 50%;transform:translateX(-50%);padding:1rem 1.5rem;z-index:10';
assetStatus.textContent = 'Chargement des personnages…';
container.appendChild(assetStatus);
let characterAssetsReady = true;
try {
  await preloadCadetAssets();
  assetStatus.remove();
} catch (error) {
  console.error('[HOLT] chargement des personnages impossible', error);
  assetStatus.textContent = 'Impossible de charger les personnages.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'btn btn--primary';
  retry.textContent = 'Réessayer';
  retry.addEventListener('click', () => window.location.reload());
  assetStatus.append(' ', retry);
  characterAssetsReady = false;
}

if (characterAssetsReady) {
  /**
   * `?seed=xxx` permet de rejouer exactement une partie. `?ai=0` accelere les tests.
   * `?scene=<id>` demarre directement sur une scene precise (developpement, tests e2e) :
   * voir docs/process/DEBUG_API.md.
   */
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('seed') ?? undefined;
  const aiDelay = params.get('ai') === '0' ? 0 : Number(params.get('ai') ?? 450);
  const startSceneId = params.get('scene') ?? undefined;
  /** `?dice=0` desactive la mise en scene du de 3D (voir docs/process/DEBUG_API.md) : utile pour un parcours de test. */
  const diceEnabled = params.get('dice') !== '0';

  /**
   * Ecran titre (docs/art/UI-DESIGN-SYSTEM.md, "Écran titre") : saute
   * entierement des que l'URL porte `?seed=` ou `?scene=` -- ce sont des
   * outils de dev et de test (voir docs/process/DEBUG_API.md) qui doivent
   * demarrer DIRECTEMENT dans la partie, jamais derriere un ecran a cliquer
   * (les tests e2e s'appuient explicitement sur ce raccourci).
   */
  const showTitle = seed === undefined && startSceneId === undefined;
  // Lu AVANT la construction de `ChapterApp` : son constructeur reprend
  // silencieusement une session existante des que les parametres le
  // permettent (voir `isResumingRun` dans chapter.ts). C'est donc le seul
  // moyen de savoir si CE chargement est une vraie reprise, pour proposer ou
  // non le bouton "Reprendre" -- une fois `ChapterApp` construit, l'etat
  // resume et l'etat "partie neuve faute de session" sont indiscernables.
  const hadResumableRun = showTitle && Boolean(loadSession().run);

  // `ChapterApp` (et donc `window.__game`) est construit inconditionnellement,
  // meme quand l'ecran titre va s'afficher par-dessus : la partie tourne deja
  // en arriere-plan (voir le lot "Écran titre" de la passe UI), ce qui est ce
  // qui permet a `window.__game` de fonctionner immediatement, y compris
  // pendant que le titre est a l'ecran.
  const chapter = new ChapterApp(container, {
    seed,
    aiDelayMs: Number.isFinite(aiDelay) ? aiDelay : 450,
    startSceneId,
    diceEnabled,
  });
  installDebugApi(chapter);

  // Utile en developpement comme pour les rapports de bug.
  console.info(`[HOLT] chapitre 1 - graine "${chapter.run.seed}" - scene "${chapter.run.sceneId}"`);

  if (showTitle) {
    const resumeSceneTitle = hadResumableRun
      ? (CHAPTER_1_SCENES.find((s) => s.id === chapter.run.sceneId)?.title ?? chapter.run.sceneId)
      : null;
    const title = new TitleView(container, resumeSceneTitle, {
      onNewGame: () => {
        // Graine fraiche, jamais celle (eventuellement reprise) avec laquelle
        // `chapter` vient d'etre construit -- voir `ChapterApp.startNewGame`.
        chapter.startNewGame();
        title.dismiss();
      },
      onResume: () => title.dismiss(),
    });
  }
}
