/**
 * L'ecran du tirage (scene 4, ADR 0014 -- BINDING). Reutilise le langage
 * visuel du hub (docs/art/UI-DESIGN-SYSTEM.md, "Hub — l'alignement") : portraits
 * `card` devant le mur a graduations, coins coupes, tampons. Les quatre cadets
 * disputes restent CENTRES et VISIBLES du debut a la fin (jamais retires de
 * l'ecran une fois pris) -- seul un tampon "ÉQUIPE BLEUE"/"ÉQUIPE ROUGE"
 * change sur leur carte, pour que le joueur revoie d'un coup d'oeil l'ordre
 * complet du tirage. Les deux capitaines (Franklyn a gauche, Abigail a droite)
 * sont fixes.
 */

import { portraitElement } from '@/ui/portraits';
import { backdropMarkup, sceneZone, splitTitle } from '@/ui/sceneChrome';
import type { CharacterId } from '@/rules/character';
import { TRAITS, getCharacter } from '@/rules/character';
import type { Dossier } from '@/core/dossier';
import { ABIGAIL_PICK_LINES, DRAFT_POOL } from '@/narrative';
import type { DraftState, DraftStepResult } from '@/narrative';

export interface DraftViewCallbacks {
  onPick(cadetId: CharacterId): void;
  onContinue(): void;
}

const SCENE_TITLE = 'Le tirage des équipes';

function pickedTeamOf(state: DraftState, cadetId: CharacterId): 'blue' | 'red' | null {
  return state.picks.find((p) => p.cadet === cadetId)?.team ?? null;
}

export class DraftView {
  private readonly root: HTMLElement;
  private readonly sceneNameEl: HTMLElement;
  private readonly poolEl: HTMLElement;
  private readonly infoEl: HTMLElement;
  private readonly reactionEl: HTMLElement;
  private readonly recapEl: HTMLElement;

  private state: DraftState | null = null;

  constructor(
    container: HTMLElement,
    private readonly callbacks: DraftViewCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'draft-screen scene-shell';
    this.root.dataset.zone = sceneZone('ch1.tirage');
    this.root.hidden = true;
    this.root.innerHTML = `
      ${backdropMarkup()}
      <div class="narrative-scene-tag" data-testid="scene-title">
        <h1 class="narrative-scene-name"></h1>
        <p class="draft-subtitle">Franklyn choisit en premier. Abigail suit, dans l'ordre qui est le sien.</p>
      </div>
      <div class="draft-board">
        <div class="draft-captain draft-captain--blue" data-testid="draft-captain-franklyn">
          <span class="stamp stamp--blue draft-captain-tag">Équipe bleue</span>
          ${portraitElement('franklyn', 'card').outerHTML}
          <span class="draft-captain-name">Franklyn</span>
          <span class="draft-captain-role">Capitaine</span>
        </div>
        <div class="draft-pool-wrap">
          <div class="draft-heightchart" data-testid="draft-heightchart"></div>
          <ul class="draft-pool" data-testid="draft-pool"></ul>
        </div>
        <div class="draft-captain draft-captain--red" data-testid="draft-captain-abigail">
          <span class="stamp stamp--red draft-captain-tag">Équipe rouge</span>
          ${portraitElement('abigail', 'card').outerHTML}
          <span class="draft-captain-name">Abigail</span>
          <span class="draft-captain-role">Capitaine</span>
        </div>
      </div>
      <p class="draft-info panel" data-testid="draft-info" hidden></p>
      <p class="draft-reaction" data-testid="draft-reaction" hidden></p>
      <div class="draft-recap panel panel--lifted" data-testid="draft-recap" hidden></div>
    `;
    container.appendChild(this.root);

    this.sceneNameEl = this.q('.narrative-scene-name');
    this.poolEl = this.q('[data-testid="draft-pool"]');
    this.infoEl = this.q('[data-testid="draft-info"]');
    this.reactionEl = this.q('[data-testid="draft-reaction"]');
    this.recapEl = this.q('[data-testid="draft-recap"]');

    const [room, name] = splitTitle(SCENE_TITLE);
    this.sceneNameEl.innerHTML = room ? `<span class="narrative-scene-room">${room}</span> — ${name}` : name;

    const chartEl = this.q('[data-testid="draft-heightchart"]');
    chartEl.innerHTML = [200, 190, 180, 170, 160, 150]
      .map((cm) => {
        const bottom = (((cm - 150) / (205 - 150)) * 100).toFixed(1);
        return `<div class="hub-chart-rule" style="bottom:${bottom}%"><span>${cm}</span></div>`;
      })
      .join('');

    window.addEventListener('keydown', this.onKeyDown);
  }

  private q(selector: string): HTMLElement {
    const el = this.root.querySelector(selector);
    if (!el) throw new Error(`Element de DraftView introuvable : ${selector}`);
    return el as HTMLElement;
  }

  /**
   * `step` est le resultat du dernier appel a `pick()` (voir src/narrative/draft.ts),
   * absent au tout premier rendu (avant que Franklyn n'ait choisi).
   */
  render(state: DraftState, dossier: Dossier, step?: DraftStepResult): void {
    this.state = state;
    this.renderPool(state, dossier);
    this.renderReaction(step);
    if (state.turn === 'done') this.renderRecap(state);
    else this.recapEl.hidden = true;
  }

  private renderPool(state: DraftState, dossier: Dossier): void {
    this.poolEl.innerHTML = '';
    DRAFT_POOL.forEach((cadetId, position) => {
      const sheet = getCharacter(cadetId);
      const team = pickedTeamOf(state, cadetId);
      const available = team === null && state.turn === 'franklyn';

      const li = document.createElement('li');
      li.className = 'draft-cadet';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'draft-cadet-btn';
      btn.dataset.testid = `draft-cadet-${cadetId}`;
      btn.dataset.cadet = cadetId;
      btn.disabled = !available;
      btn.setAttribute(
        'aria-label',
        `${sheet.name}${team ? (team === 'blue' ? ' (équipe bleue)' : ' (équipe rouge)') : ''} — touche ${position + 1}`,
      );
      btn.appendChild(portraitElement(cadetId, 'card'));

      if (team) {
        const stamp = document.createElement('span');
        stamp.className = `stamp draft-cadet-stamp ${team === 'blue' ? 'stamp--blue' : 'stamp--red'}`;
        stamp.textContent = team === 'blue' ? 'ÉQUIPE BLEUE' : 'ÉQUIPE ROUGE';
        btn.appendChild(stamp);
      }

      const number = document.createElement('span');
      number.className = 'draft-cadet-number';
      number.textContent = String(position + 1);
      btn.appendChild(number);

      const name = document.createElement('span');
      name.className = 'draft-cadet-name';
      name.textContent = sheet.name;
      btn.appendChild(name);

      btn.addEventListener('click', () => {
        if (available) this.callbacks.onPick(cadetId);
      });
      btn.addEventListener('mouseenter', () => this.showInfo(cadetId, dossier));
      btn.addEventListener('focus', () => this.showInfo(cadetId, dossier));
      btn.addEventListener('mouseleave', () => this.hideInfo());
      btn.addEventListener('blur', () => this.hideInfo());

      li.appendChild(btn);
      this.poolEl.appendChild(li);
    });
  }

  /** Survol/focus d'un cadet (consigne : role, deux traits, affinite actuelle -- choix informe). */
  private showInfo(cadetId: CharacterId, dossier: Dossier): void {
    const sheet = getCharacter(cadetId);
    const traitLabels = sheet.traits.slice(0, 2).map((t) => TRAITS[t]?.label ?? t);
    const affinity = dossier.affinities[cadetId] ?? 0;
    this.infoEl.hidden = false;
    this.infoEl.innerHTML = `
      <strong>${sheet.name}</strong> — ${sheet.role}<br />
      ${traitLabels.join(' · ')}<br />
      Affinité avec Franklyn : <span class="draft-info-affinity">${affinity >= 0 ? '+' : ''}${affinity}</span>
    `;
  }

  private hideInfo(): void {
    this.infoEl.hidden = true;
    this.infoEl.innerHTML = '';
  }

  private renderReaction(step?: DraftStepResult): void {
    if (!step) {
      this.reactionEl.hidden = true;
      this.reactionEl.innerHTML = '';
      return;
    }
    const line = ABIGAIL_PICK_LINES[step.abigailPick];
    this.reactionEl.hidden = false;
    this.reactionEl.innerHTML = `<strong>Abigail</strong> — « ${line} »`;
  }

  private renderRecap(state: DraftState): void {
    const blue: CharacterId[] = ['franklyn', ...state.picks.filter((p) => p.team === 'blue').map((p) => p.cadet)];
    const red: CharacterId[] = ['abigail', ...state.picks.filter((p) => p.team === 'red').map((p) => p.cadet)];
    const list = (ids: CharacterId[]) => ids.map((id) => `<li>${getCharacter(id).name}</li>`).join('');

    this.recapEl.hidden = false;
    this.recapEl.innerHTML = `
      <h2>Équipes formées</h2>
      <div class="draft-recap-teams">
        <div><h3 class="draft-recap-blue">Équipe bleue</h3><ul>${list(blue)}</ul></div>
        <div><h3 class="draft-recap-red">Équipe rouge</h3><ul>${list(red)}</ul></div>
      </div>
      <button type="button" class="btn btn--primary draft-continue" data-testid="draft-continue">
        Continuer
      </button>
    `;
    (this.recapEl.querySelector('[data-testid="draft-continue"]') as HTMLButtonElement).onclick = () =>
      this.callbacks.onContinue();
  }

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.root.remove();
  }

  /** 1-4 choisit le cadet correspondant (meme idiome que le hub, touche = position). */
  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.root.hidden || !this.state) return;
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1 || n > DRAFT_POOL.length) return;
    const cadetId = DRAFT_POOL[n - 1] as CharacterId;
    if (this.state.turn !== 'franklyn' || pickedTeamOf(this.state, cadetId) !== null) return;
    e.preventDefault();
    this.callbacks.onPick(cadetId);
  };
}
