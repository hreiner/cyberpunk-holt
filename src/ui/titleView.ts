/**
 * Ecran titre (docs/art/UI-DESIGN-SYSTEM.md, "Écran titre") : « HOLT Academy »
 * en tres grand sur le ciel rouge tramé (meme decor que le reste, voir
 * `sceneChrome.ts`), sous-titre, et les deux actions -- « Nouvelle partie »
 * toujours, « Reprendre » seulement si une session reprenable existe.
 *
 * Sauté entierement si l'URL contient `?seed=` ou `?scene=` (voir main.ts) :
 * cette vue n'est donc jamais instanciee dans ce cas, ni par les tests e2e.
 */

import { backdropMarkup } from '@/ui/sceneChrome';

export interface TitleViewCallbacks {
  onNewGame(): void;
  onResume(): void;
}

export class TitleView {
  private readonly root: HTMLElement;

  /**
   * @param resumableSceneTitle Titre francais de la scene reprise (ex.
   *   « L'examen ecrit ») si une session en cours existe, `null` sinon --
   *   dans ce cas le bouton « Reprendre » n'est pas affiche du tout.
   */
  constructor(container: HTMLElement, resumableSceneTitle: string | null, callbacks: TitleViewCallbacks) {
    this.root = document.createElement('div');
    this.root.className = 'title-screen scene-shell';
    this.root.dataset.zone = 'academy';
    this.root.innerHTML = `
      ${backdropMarkup()}
      <div class="title-content">
        <h1 class="title-name">HOLT Academy</h1>
        <p class="title-subtitle">Chapitre 1 — Le dernier examen</p>
        <div class="title-actions">
          ${
            resumableSceneTitle
              ? `<button type="button" class="btn btn--primary" data-testid="title-resume">Reprendre — ${resumableSceneTitle}</button>`
              : ''
          }
          <button type="button" class="btn ${resumableSceneTitle ? '' : 'btn--primary'}" data-testid="title-newgame">
            Nouvelle partie
          </button>
        </div>
      </div>
    `;
    container.appendChild(this.root);

    this.root.querySelector('[data-testid="title-newgame"]')?.addEventListener('click', () => callbacks.onNewGame());
    this.root.querySelector('[data-testid="title-resume"]')?.addEventListener('click', () => callbacks.onResume());
  }

  dismiss(): void {
    this.root.remove();
  }
}
