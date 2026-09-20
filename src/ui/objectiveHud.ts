/**
 * Encart d'objectif du mode exploration (docs/design/08-EXPLORATION.md
 * "Les objectifs") + étiquette de survol et navigation clavier des
 * interactables (section "Accessibilité et lisibilité"). HTML/CSS au-dessus
 * du canvas, comme `src/ui/hud.ts` — jamais de texte dessiné dans la scène
 * 3D (docs/art/ART-DIRECTION.md "Interface"). N'importe jamais `three`.
 *
 * Le repère au sol de l'objectif ("Tab maintenu") est dessiné par
 * `src/render/exploreView.ts` : ce module se contente de détecter l'appui
 * long et de prévenir l'appelant (`onPingChange`).
 */

import './explore.css';
import type { ObjectiveStatus } from '@/explore';

export interface HudInteractable {
  id: string;
  label: string;
  reachable: boolean;
}

export interface ObjectiveHudCallbacks {
  /** Tab maintenu plus de `HOLD_THRESHOLD_MS` : affiche/masque le repère de destination. */
  onPingChange?(active: boolean): void;
  /** Tab (ou Maj+Tab) relâché avant le seuil de maintien : fait défiler la sélection clavier. */
  onCycle?(direction: 1 | -1): void;
  /** Espace, avec une entité sélectionnée au clavier. */
  onInteractSelected?(entityId: string): void;
}

/** Au-delà de ce délai, un Tab maintenu bascule en mode "repère" plutôt qu'un défilement. */
const HOLD_THRESHOLD_MS = 220;

export class ObjectiveHud {
  private readonly root: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly hoverLabel: HTMLElement;
  private readonly selectedLabel: HTMLElement;

  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private pinging = false;
  private tabHeld = false;

  private selected: HudInteractable | null = null;
  private interactables: HudInteractable[] = [];

  private readonly onKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
  private readonly onKeyUp = (e: KeyboardEvent) => this.handleKeyUp(e);

  constructor(
    container: HTMLElement,
    private readonly callbacks: ObjectiveHudCallbacks = {},
  ) {
    this.root = document.createElement('div');
    this.root.dataset.testid = 'objective-hud-root';

    this.panel = document.createElement('div');
    this.panel.className = 'objective-hud panel';
    this.panel.dataset.testid = 'objective-hud';
    this.panel.style.display = 'none';
    this.root.appendChild(this.panel);

    this.hoverLabel = document.createElement('div');
    this.hoverLabel.className = 'explore-hover-label';
    this.hoverLabel.dataset.testid = 'explore-hover-label';
    this.hoverLabel.style.display = 'none';
    container.appendChild(this.hoverLabel);

    this.selectedLabel = document.createElement('div');
    this.selectedLabel.className = 'explore-selected-label';
    this.selectedLabel.dataset.testid = 'explore-selected-label';
    this.selectedLabel.style.display = 'none';
    container.appendChild(this.selectedLabel);

    container.appendChild(this.root);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /* ------------------------------------------------------------------ */
  /* Objectif                                                            */
  /* ------------------------------------------------------------------ */

  setObjective(status: ObjectiveStatus | null): void {
    this.panel.style.display = status ? '' : 'none';
    this.panel.innerHTML = '';
    if (!status) return;

    const title = document.createElement('p');
    title.className = 'objective-hud__title';
    title.textContent = status.title;
    this.panel.appendChild(title);

    const context = document.createElement('p');
    context.className = 'objective-hud__context';
    context.textContent = status.context;
    this.panel.appendChild(context);

    if (status.complete) {
      const stamp = document.createElement('div');
      stamp.className = 'objective-hud__stamp stamp stamp--ok';
      stamp.textContent = 'FAIT';
      this.panel.appendChild(stamp);
    }

    if (status.tasks.length > 0) {
      const rule = document.createElement('hr');
      rule.className = 'objective-hud__rule';
      this.panel.appendChild(rule);

      const list = document.createElement('ul');
      list.className = 'objective-hud__tasks';
      for (const task of status.tasks) {
        const li = document.createElement('li');
        li.className = `objective-hud__task${task.done ? ' objective-hud__task--done' : ''}`;

        const label = document.createElement('span');
        label.className = 'objective-hud__task-label';
        label.textContent = task.label;
        li.appendChild(label);

        const count = document.createElement('span');
        count.className = 'objective-hud__task-count';
        count.textContent = `${task.count}/${task.target}`;
        li.appendChild(count);

        list.appendChild(li);
      }
      this.panel.appendChild(list);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Étiquette de survol (souris)                                        */
  /* ------------------------------------------------------------------ */

  /**
   * `label` : verbe + cible ("Parler à John"). `reachable` : si faux, le texte
   * affiché est "Hors d'atteinte" (08-EXPLORATION.md "Contrôles"). `clientPos` :
   * coordonnées écran de la souris (`MouseEvent.clientX/clientY`), pour suivre
   * le curseur sans dupliquer la projection 3D→écran, déjà faite par l'appelant.
   */
  setHoverLabel(label: string | null, reachable = true, clientPos?: { x: number; y: number }): void {
    if (!label) {
      this.hoverLabel.style.display = 'none';
      return;
    }
    this.hoverLabel.textContent = reachable ? label : 'Hors d’atteinte';
    this.hoverLabel.classList.toggle('explore-hover-label--unreachable', !reachable);
    if (clientPos) {
      this.hoverLabel.style.left = `${clientPos.x}px`;
      this.hoverLabel.style.top = `${clientPos.y}px`;
    }
    this.hoverLabel.style.display = '';
  }

  /* ------------------------------------------------------------------ */
  /* Navigation clavier (Tab/Maj+Tab + Espace)                            */
  /* ------------------------------------------------------------------ */

  /** Liste des interactables actuellement visibles à l'écran, fournie par l'appelant à chaque frame utile. */
  setInteractables(list: HudInteractable[]): void {
    this.interactables = list;
    if (this.selected && !list.some((i) => i.id === this.selected?.id)) this.setSelected(null);
  }

  private setSelected(entity: HudInteractable | null): void {
    this.selected = entity;
    if (!entity) {
      this.selectedLabel.style.display = 'none';
      return;
    }
    this.selectedLabel.textContent = entity.reachable ? entity.label : 'Hors d’atteinte';
    this.selectedLabel.style.display = '';
  }

  /** Y a-t-il une sélection clavier active (Tab/Maj+Tab) ? Sert à ne pas doubler "Espace sur le survol". */
  hasSelection(): boolean {
    return this.selected !== null;
  }

  cycleSelection(direction: 1 | -1): void {
    if (this.interactables.length === 0) return this.setSelected(null);
    const currentIndex = this.selected ? this.interactables.findIndex((i) => i.id === this.selected?.id) : -1;
    const next = (currentIndex + direction + this.interactables.length) % this.interactables.length;
    this.setSelected(this.interactables[next] ?? null);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      if (this.tabHeld) return; // auto-repeat
      this.tabHeld = true;
      e.preventDefault();
      this.holdTimer = setTimeout(() => {
        this.pinging = true;
        this.callbacks.onPingChange?.(true);
      }, HOLD_THRESHOLD_MS);
      return;
    }
    if (e.key === ' ' || e.code === 'Space') {
      if (this.selected) {
        e.preventDefault();
        this.callbacks.onInteractSelected?.(this.selected.id);
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    this.tabHeld = false;
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.pinging) {
      this.pinging = false;
      this.callbacks.onPingChange?.(false);
      return;
    }
    this.callbacks.onCycle?.(e.shiftKey ? -1 : 1);
    this.cycleSelection(e.shiftKey ? -1 : 1);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.root.remove();
    this.hoverLabel.remove();
    this.selectedLabel.remove();
  }
}
