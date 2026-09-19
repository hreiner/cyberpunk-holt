/**
 * Le hub ("Avant le depart") : parade d'identification de police devant un
 * mur a graduations de hauteur (docs/art/UI-DESIGN-SYSTEM.md, "Hub —
 * l'alignement"). Ecran plein cadre a part entiere -- distinct de
 * `NarrativeView`, qui affiche la CONVERSATION une fois un cadet choisi.
 *
 * Reutilise le meme decor que l'ecran de dialogue (`sceneChrome.ts`) pour
 * que les deux se lisent comme la meme piece du dossier.
 */

import { portraitElement } from '@/ui/portraits';
import { backdropMarkup, sceneZone, splitTitle } from '@/ui/sceneChrome';
import type { CharacterId } from '@/rules/character';
import type { HubEntry } from '@/chapter';

export interface HubViewCallbacks {
  onPick(dialogueId: string): void;
  onLeave(): void;
}

const HUB_TITLE = 'Avant le départ';

/**
 * Graduations affichees a gauche du mur, en cm (docs : "cotes 150–200 a
 * gauche"). Purement decoratif -- aucune donnee de jeu n'en depend.
 */
const CHART_TICKS = [200, 190, 180, 170, 160, 150];
const CHART_MIN = 150;
const CHART_MAX = 205;

function cadetIdOf(entry: HubEntry): CharacterId {
  return entry.dialogueId.split('.').pop() as CharacterId;
}

export class HubView {
  private readonly root: HTMLElement;
  private readonly sceneNameEl: HTMLElement;
  private readonly chartEl: HTMLElement;
  private readonly lineupEl: HTMLElement;
  private readonly leaveBtn: HTMLButtonElement;

  private entries: HubEntry[] = [];

  constructor(
    container: HTMLElement,
    private readonly callbacks: HubViewCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hub-screen scene-shell';
    this.root.dataset.zone = sceneZone('ch1.hub');
    this.root.innerHTML = `
      ${backdropMarkup()}
      <div class="narrative-scene-tag" data-testid="scene-title">
        <h1 class="narrative-scene-name"></h1>
        <p class="hub-subtitle">Le fourgon part dans quelques minutes. À qui parler ?</p>
      </div>
      <div class="hub-lineup-wrap">
        <div class="hub-heightchart" data-testid="hub-heightchart"></div>
        <ul class="hub-lineup" data-testid="hub-lineup"></ul>
      </div>
      <button type="button" class="btn btn--primary hub-leave" data-testid="hub-leave">
        Rejoindre le fourgon
      </button>
    `;
    container.appendChild(this.root);

    this.sceneNameEl = this.q('.narrative-scene-name');
    this.chartEl = this.q('[data-testid="hub-heightchart"]');
    this.lineupEl = this.q('[data-testid="hub-lineup"]');
    this.leaveBtn = this.q('[data-testid="hub-leave"]') as HTMLButtonElement;

    const [room, name] = splitTitle(HUB_TITLE);
    this.sceneNameEl.innerHTML = room ? `<span class="narrative-scene-room">${room}</span> — ${name}` : name;

    this.chartEl.innerHTML = CHART_TICKS.map((cm) => {
      const bottom = (((cm - CHART_MIN) / (CHART_MAX - CHART_MIN)) * 100).toFixed(1);
      return `<div class="hub-chart-rule" style="bottom:${bottom}%"><span>${cm}</span></div>`;
    }).join('');

    this.leaveBtn.addEventListener('click', () => this.callbacks.onLeave());
    window.addEventListener('keydown', this.onKeyDown);
  }

  private q(selector: string): HTMLElement {
    const el = this.root.querySelector(selector);
    if (!el) throw new Error(`Element de HubView introuvable : ${selector}`);
    return el as HTMLElement;
  }

  /** Cinq cadets `card`, alignes devant le mur a graduations. */
  render(entries: HubEntry[]): void {
    this.entries = entries;
    this.lineupEl.innerHTML = '';

    entries.forEach((entry, position) => {
      const cadetId = cadetIdOf(entry);

      const li = document.createElement('li');
      li.className = 'hub-cadet';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = entry.done ? 'hub-cadet-btn is-done' : 'hub-cadet-btn';
      btn.dataset.testid = `hub-${entry.dialogueId}`;
      btn.setAttribute('aria-label', `${entry.label}${entry.done ? ' (deja vu)' : ''} — touche ${position + 1}`);
      btn.appendChild(portraitElement(cadetId, 'card'));
      if (entry.done) {
        const stamp = document.createElement('span');
        stamp.className = 'stamp stamp--ok hub-cadet-vu';
        stamp.textContent = 'VU';
        btn.appendChild(stamp);
      }
      const number = document.createElement('span');
      number.className = 'hub-cadet-number';
      number.textContent = String(position + 1);
      btn.appendChild(number);
      const name = document.createElement('span');
      name.className = 'hub-cadet-name';
      name.textContent = entry.label;
      btn.appendChild(name);

      btn.addEventListener('click', () => this.callbacks.onPick(entry.dialogueId));
      li.appendChild(btn);
      this.lineupEl.appendChild(li);
    });
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

  /** 1-5 choisit le cadet correspondant (docs : "Clavier : 1–5 picks"). */
  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.root.hidden) return;
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1 || n > this.entries.length) return;
    const entry = this.entries[n - 1];
    if (!entry) return;
    e.preventDefault();
    this.callbacks.onPick(entry.dialogueId);
  };
}
