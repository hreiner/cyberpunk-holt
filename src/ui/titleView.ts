/**
 * Ecran titre (docs/art/UI-DESIGN-SYSTEM.md, "Écran titre") : « HOLT Academy »
 * en tres grand sur l'illustration nocturne de l'academie, sous-titre,
 * embleme et les actions -- « Nouvelle partie » toujours, « Reprendre »
 * seulement si une session reprenable existe, « Chapitre 2 » (ADR 0022) pour
 * qui veut commencer directement au second chapitre.
 *
 * Sauté entierement si l'URL contient `?seed=`, `?scene=` ou `?chapter=` (voir
 * main.ts) : cette vue n'est donc jamais instanciee dans ce cas, ni par les
 * tests e2e (qui pilotent `window.__game` directement).
 *
 * « Chapitre 2 » (ADR 0022 §3) : s'il existe une archive du chapitre 1, le
 * bouton la reprend directement, avec un lien « Choisir un profil » pour
 * passer outre ; sinon, il ouvre directement le choix de profil (une
 * DEUXIEME vue plein cadre dans ce meme composant -- `showProfilePicker` --
 * plutot qu'un fichier separe, l'ecran titre restant le seul point d'entree
 * ADR 0022 §3 concerne).
 *
 * « Aller a une scene (QA) » ouvre une troisieme vue, le selecteur de scene et de branche
 * (`src/ui/scenePicker.ts`, catalogue `src/dev/scenePresets.ts`).
 */

import { assetUrl } from '@/ui/assetUrl';
import { CH2_PROFILES } from '@/data/chapters';
import type { ProfileId } from '@/data/chapters';
import { renderScenePicker } from '@/ui/scenePicker';
import type { ScenePickerChoice } from '@/ui/scenePicker';

export interface TitleViewCallbacks {
  onNewGame(): void;
  onResume(): void;
  /** Reprend l'archive du chapitre 1 (ADR 0022 §1) -- appele seulement si `hasChapter1Archive`. */
  onContinueChapter2(): void;
  /** Demarre le chapitre 2 sur le profil `profile` (ADR 0022 §3, `ch2Profiles.ts`). */
  onChooseProfile(profile: ProfileId): void;
  /** QA : demarre directement sur une scene et une branche (`src/dev/scenePresets.ts`). */
  onJumpToScene(choice: ScenePickerChoice): void;
}

export class TitleView {
  private readonly root: HTMLElement;
  private readonly mainScreen: HTMLElement;
  private readonly profileScreen: HTMLElement;
  private readonly sceneScreen: HTMLElement;

  /**
   * @param resumableSceneTitle Titre francais de la scene reprise (ex.
   *   « L'examen ecrit ») si une session en cours existe, `null` sinon --
   *   dans ce cas le bouton « Reprendre » n'est pas affiche du tout.
   * @param hasChapter1Archive Vrai si `loadArchivedDossier(1)` trouve une archive lisible
   *   (voir main.ts) -- decide si « Chapitre 2 » la reprend directement ou ouvre le choix
   *   de profil (ADR 0022 §3), et si le lien « Choisir un profil » est propose en plus.
   */
  constructor(
    container: HTMLElement,
    resumableSceneTitle: string | null,
    hasChapter1Archive: boolean,
    callbacks: TitleViewCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'title-screen scene-shell';
    this.root.dataset.zone = 'academy';
    this.root.innerHTML = `
      <img class="title-art" src="${assetUrl('ui/title.webp')}" alt="" aria-hidden="true" />
      <div class="title-content" data-testid="title-main">
        <img class="title-emblem" src="${assetUrl('ui/emblem.png')}" alt="Emblème de l’académie HOLT" />
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
          <button type="button" class="btn" data-testid="title-chapter2">Chapitre 2</button>
        </div>
        ${
          hasChapter1Archive
            ? `<button type="button" class="title-link" data-testid="title-choose-profile">Choisir un profil</button>`
            : ''
        }
        <button type="button" class="title-link" data-testid="title-scene-picker">Aller à une scène (QA)</button>
      </div>
      <div class="title-content scene-picker-host" data-testid="title-scene-screen" style="display: none"></div>
      <div class="title-content profile-picker" data-testid="title-profile-picker" style="display: none">
        <h2 class="profile-picker-title">Chapitre 2 — Choisir un profil</h2>
        <p class="profile-picker-subtitle">
          Sans partie du chapitre 1 à reprendre, le dossier de Franklyn part de l'un de ces trois profils.
        </p>
        <div class="profile-cards">
          ${Object.values(CH2_PROFILES)
            .map(
              (profile) => `
                <article class="profile-card panel" data-testid="title-profile-${profile.id}">
                  <h3>${profile.title}</h3>
                  <p>${profile.summary}</p>
                  <button type="button" class="btn btn--primary" data-testid="title-profile-${profile.id}-pick">
                    Commencer
                  </button>
                </article>
              `,
            )
            .join('')}
        </div>
        <button type="button" class="title-link" data-testid="title-profile-back">Retour</button>
      </div>
    `;
    container.appendChild(this.root);

    this.mainScreen = this.root.querySelector('[data-testid="title-main"]') as HTMLElement;
    this.profileScreen = this.root.querySelector('[data-testid="title-profile-picker"]') as HTMLElement;
    this.sceneScreen = this.root.querySelector('[data-testid="title-scene-screen"]') as HTMLElement;
    renderScenePicker(this.sceneScreen, (choice) => callbacks.onJumpToScene(choice), () => this.showMain());

    this.root.querySelector('[data-testid="title-newgame"]')?.addEventListener('click', () => callbacks.onNewGame());
    this.root.querySelector('[data-testid="title-resume"]')?.addEventListener('click', () => callbacks.onResume());
    this.root.querySelector('[data-testid="title-chapter2"]')?.addEventListener('click', () => {
      // ADR 0022 §3 : une archive existe -> le bouton la reprend tout de suite ; sinon, rien a
      // reprendre, il ouvre directement le choix de profil.
      if (hasChapter1Archive) callbacks.onContinueChapter2();
      else this.showProfilePicker();
    });
    this.root
      .querySelector('[data-testid="title-choose-profile"]')
      ?.addEventListener('click', () => this.showProfilePicker());
    this.root
      .querySelector('[data-testid="title-scene-picker"]')
      ?.addEventListener('click', () => this.showScenePicker());
    this.root.querySelector('[data-testid="title-profile-back"]')?.addEventListener('click', () => this.showMain());
    for (const id of Object.keys(CH2_PROFILES) as ProfileId[]) {
      this.root
        .querySelector(`[data-testid="title-profile-${id}-pick"]`)
        ?.addEventListener('click', () => callbacks.onChooseProfile(id));
    }
  }

  /**
   * Bascule entre les deux vues de l'ecran titre par `style.display` inline, jamais
   * l'attribut `hidden` : piege deja rencontre sur ce projet (voir le commentaire sur
   * `ChapterApp.setActiveHost`) -- une regle auteur `display:` (ici `.title-content` du
   * flexbox parent) bat la regle native `[hidden] { display: none }` du navigateur.
   */
  private showProfilePicker(): void {
    this.mainScreen.style.display = 'none';
    this.profileScreen.style.display = '';
  }

  private showScenePicker(): void {
    this.mainScreen.style.display = 'none';
    this.sceneScreen.style.display = '';
  }

  private showMain(): void {
    this.profileScreen.style.display = 'none';
    this.sceneScreen.style.display = 'none';
    this.mainScreen.style.display = '';
  }

  dismiss(): void {
    this.root.remove();
  }
}
