/**
 * Point d'entree du jeu.
 *
 * Le chapitre 1 est decoupe en deux epics (voir docs/process/ROADMAP.md).
 * L'epic 1 demarre directement sur la phase tactique finale ; l'epic 2
 * inserera devant elle les scenes narratives (discours, examen ecrit, hub de
 * dialogue, trajet, salles 1 a 3) via un routeur de scenes.
 */

import './ui/styles.css';
import { GameApp } from './app';
import { installDebugApi } from './debug/gameApi';

const container = document.getElementById('app');
if (!container) throw new Error('#app introuvable dans index.html');

/** `?seed=xxx` permet de rejouer exactement une partie. `?ai=0` accelere les tests. */
const params = new URLSearchParams(window.location.search);
const seed = params.get('seed') ?? undefined;
const aiDelay = params.get('ai') === '0' ? 0 : Number(params.get('ai') ?? 450);

const app = new GameApp(container, { seed, aiDelayMs: Number.isFinite(aiDelay) ? aiDelay : 450 });
installDebugApi(app);

// Utile en developpement comme pour les rapports de bug.
console.info(`[HOLT] chapitre 1 - phase tactique - graine "${app.combat.state.seed}"`);
