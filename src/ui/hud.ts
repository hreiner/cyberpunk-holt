/**
 * HUD en HTML/CSS pose au-dessus du canvas.
 *
 * Choix assume : aucune interface dessinee dans le canvas. Le DOM est plus
 * rapide a iterer, accessible, et se teste directement avec Playwright via des
 * `data-testid`. Voir docs/process/ARCHITECTURE.md.
 */

import { CARRIED_ITEMS, ITEM_ICONS } from '@/data/items';
import { getCharacter } from '@/rules/character';
import type { CharacterId } from '@/rules/character';
import { ITEM_LABELS } from '@/tactical/combat';
import type { TacticalCombat } from '@/tactical/combat';
import { estimateShot } from '@/tactical/queries';
import type { CombatState, ItemId, Unit } from '@/tactical/types';

export type HudActionId =
  'shoot' | 'melee' | 'heal' | 'spot' | 'encourage' | 'pickup' | 'placeMine' | 'run' | 'endTurn';

export interface HudCallbacks {
  onAction(id: HudActionId): void;
  onSelectTarget(id: CharacterId): void;
  onRestart(): void;
  /** Tourne la camera de `step` quarts de tour (+1 : sens horaire). */
  onRotateCamera(step: number): void;
  onToggleSound(): void;
}

export class Hud {
  private readonly root: HTMLElement;
  private readonly banner: HTMLElement;
  private readonly orderStrip: HTMLElement;
  private readonly sheetPanel: HTMLElement;
  private readonly actionBar: HTMLElement;
  private readonly logPanel: HTMLElement;
  private readonly footer: HTMLElement;
  private lastLogLength = 0;

  constructor(
    container: HTMLElement,
    private readonly callbacks: HudCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hud';
    this.root.innerHTML = `
      <header class="hud-top">
        <div class="hud-banner" data-testid="banner"></div>
        <div class="hud-order" data-testid="order"></div>
        <div class="hud-camera" aria-label="Camera">
          <button data-testid="camera-left" title="Pivoter la camera (A)">⟲</button>
          <span>Camera</span>
          <button data-testid="camera-right" title="Pivoter la camera (E)">⟳</button>
          <button data-testid="sound" title="Couper le son">🔊</button>
        </div>
      </header>
      <aside class="hud-sheet" data-testid="sheet"></aside>
      <section class="hud-log" data-testid="log"></section>
      <footer class="hud-actions" data-testid="actions"></footer>
      <div class="hud-footer" data-testid="footer"></div>
    `;
    container.appendChild(this.root);

    this.banner = this.q('[data-testid="banner"]');
    this.orderStrip = this.q('[data-testid="order"]');
    this.sheetPanel = this.q('[data-testid="sheet"]');
    this.actionBar = this.q('[data-testid="actions"]');
    this.logPanel = this.q('[data-testid="log"]');
    this.footer = this.q('[data-testid="footer"]');
    this.q('[data-testid="camera-left"]').addEventListener('click', () => this.callbacks.onRotateCamera(-1));
    this.q('[data-testid="camera-right"]').addEventListener('click', () => this.callbacks.onRotateCamera(1));
    this.q('[data-testid="sound"]').addEventListener('click', () => this.callbacks.onToggleSound());
  }

  setSoundMuted(muted: boolean): void {
    const button = this.q('[data-testid="sound"]');
    button.textContent = muted ? '🔇' : '🔊';
    button.title = muted ? 'Activer le son' : 'Couper le son';
  }

  private q(selector: string): HTMLElement {
    const el = this.root.querySelector(selector);
    if (!el) throw new Error(`Element de HUD introuvable : ${selector}`);
    return el as HTMLElement;
  }

  render(combat: TacticalCombat, playerTeam: 'blue' | 'red', pendingMode: string | null): void {
    const state = combat.state;
    this.renderBanner(state, playerTeam);
    this.renderOrder(combat, playerTeam);
    this.renderSheet(combat, playerTeam);
    this.renderActions(combat, playerTeam, pendingMode);
    this.renderLog(state);
    this.footer.textContent = `Graine : ${state.seed} — clic : deplacer · maj+clic : courir · A/E : pivoter la camera (un cadet cache derriere un container reste visible en silhouette)`;
  }

  private renderBanner(state: CombatState, playerTeam: 'blue' | 'red'): void {
    if (state.phase === 'finished') {
      const won = state.winner === playerTeam;
      const label = state.winner === 'draw' ? 'Match nul' : won ? 'Exercice reussi' : 'Exercice manque';
      this.banner.innerHTML = `<strong>${label}</strong> <button data-testid="restart">Rejouer</button>`;
      const btn = this.banner.querySelector('[data-testid="restart"]');
      btn?.addEventListener('click', () => this.callbacks.onRestart());
      return;
    }
    const current = getCharacter(state.order[state.turnIndex] as CharacterId).name;
    const kits = (team: 'blue' | 'red', label: string) =>
      `<span class="kit team-${team}" title="Kits de soin de l'equipe ${label}">${ITEM_ICONS.healkit} ${label} ×${state.teams[team].healkits}</span>`;
    this.banner.innerHTML = `<span>Round ${state.round}/${state.roundLimit}</span><span>Au tour de <strong>${current}</strong></span>${kits(playerTeam, playerTeam === 'blue' ? 'bleue' : 'rouge')}`;
  }

  private renderOrder(combat: TacticalCombat, playerTeam: 'blue' | 'red'): void {
    const state = combat.state;
    this.orderStrip.innerHTML = '';
    state.order.forEach((id, index) => {
      const unit = combat.unit(id);
      const chip = document.createElement('button');
      chip.className = [
        'order-chip',
        `team-${unit.team}`,
        index === state.turnIndex ? 'is-current' : '',
        unit.status === 'neutralized' ? 'is-down' : '',
      ]
        .filter(Boolean)
        .join(' ');
      chip.dataset.testid = `order-${id}`;
      const sheet = getCharacter(id);
      // Le joueur ne connait que le materiel de sa propre equipe.
      const known = unit.team === playerTeam;
      chip.title = known ? itemsSentence(unit.items) : 'Materiel inconnu';
      chip.innerHTML = `<i class="swatch" style="background:${sheet.placeholderColor}"></i>${sheet.name}<span class="chip-items">${known ? itemIcons(unit.items) : ''}</span>`;
      chip.addEventListener('click', () => this.callbacks.onSelectTarget(id));
      this.orderStrip.appendChild(chip);
    });
  }

  private renderSheet(combat: TacticalCombat, playerTeam: 'blue' | 'red'): void {
    const unit = combat.currentUnit();
    const sheet = getCharacter(unit.id);
    const enemies = combat.activeUnitsOf(playerTeam === 'blue' ? 'red' : 'blue');
    // Le joueur ne connait que le materiel de sa propre equipe : pendant le tour adverse,
    // la fiche n'en revele rien (ni objets, ni tirs possibles).
    const known = unit.team === playerTeam;
    const shots = !known
      ? '<li class="muted">Equipement adverse inconnu</li>'
      : unit.items.includes('taser')
        ? enemies
            .map((e) => ({ e, est: estimateShot(combat, unit, e) }))
            .filter((s) => s.est.possible)
            .map(
              (s) =>
                `<li><button data-shoot="${s.e.id}" data-testid="shoot-${s.e.id}">${getCharacter(s.e.id).name} — ${s.est.chance}% (couvert ${s.est.coverLabel}, ${s.est.distance} cases)</button></li>`,
            )
            .join('')
        : '<li class="muted">Pas de taser</li>';

    this.sheetPanel.innerHTML = `
      <h2>${sheet.name}</h2>
      <p class="role">${sheet.role}</p>
      <ul class="stats">
        <li>PM restants <strong data-testid="mp">${unit.mp}</strong></li>
        <li>Action <strong>${unit.actionUsed ? 'utilisee' : 'disponible'}</strong></li>
        <li>Etat <strong>${statusLabel(unit)}</strong></li>
        <li>Materiel <strong>${known ? unit.items.map((i) => `${ITEM_ICONS[i]} ${ITEM_LABELS[i]}`).join(', ') || 'aucun' : 'inconnu'}</strong></li>
      </ul>
      <h3>${known ? 'Tirs possibles' : 'Equipe adverse'}</h3>
      <ul class="shots">${shots}</ul>
    `;

    this.sheetPanel.querySelectorAll('[data-shoot]').forEach((el) => {
      el.addEventListener('click', () => {
        this.callbacks.onSelectTarget((el as HTMLElement).dataset.shoot as CharacterId);
        this.callbacks.onAction('shoot');
      });
    });
  }

  private renderActions(
    combat: TacticalCombat,
    playerTeam: 'blue' | 'red',
    pendingMode: string | null,
  ): void {
    const unit = combat.currentUnit();
    const playable = combat.state.phase === 'playing' && unit.team === playerTeam;
    const buttons: Array<{ id: HudActionId; label: string; enabled: boolean }> = [
      {
        id: 'run',
        label: pendingMode === 'run' ? 'Choisir la case…' : 'Courir',
        enabled: !unit.actionUsed && unit.mp > 0,
      },
      { id: 'spot', label: 'Reperer', enabled: !unit.actionUsed },
      { id: 'encourage', label: 'Encourager', enabled: !unit.actionUsed },
      { id: 'heal', label: 'Ranimer', enabled: !unit.actionUsed },
      { id: 'pickup', label: 'Ramasser', enabled: !unit.actionUsed },
      {
        id: 'placeMine',
        label: pendingMode === 'placeMine' ? 'Choisir la case…' : 'Poser la mine',
        enabled: !unit.actionUsed && unit.items.includes('mine'),
      },
      { id: 'endTurn', label: 'Fin du tour', enabled: true },
    ];

    this.actionBar.innerHTML = '';
    for (const b of buttons) {
      const el = document.createElement('button');
      el.textContent = b.label;
      el.dataset.testid = `action-${b.id}`;
      el.disabled = !playable || !b.enabled;
      el.addEventListener('click', () => this.callbacks.onAction(b.id));
      this.actionBar.appendChild(el);
    }
  }

  private renderLog(state: CombatState): void {
    if (state.log.length === this.lastLogLength) return;
    const fresh = state.log.slice(this.lastLogLength);
    this.lastLogLength = state.log.length;
    for (const entry of fresh) {
      const line = document.createElement('p');
      line.className = `log-line log-${entry.kind}`;
      line.textContent = entry.text;
      this.logPanel.appendChild(line);
    }
    this.logPanel.scrollTop = this.logPanel.scrollHeight;
  }

  resetLog(): void {
    this.lastLogLength = 0;
    this.logPanel.innerHTML = '';
  }
}

function statusLabel(unit: Unit): string {
  if (unit.status === 'neutralized') return 'neutralise';
  const flags: string[] = [];
  if (unit.exposed) flags.push('a decouvert');
  if (unit.gassed) flags.push('gaze');
  return flags.length > 0 ? flags.join(', ') : 'operationnel';
}

/** Pictogrammes du materiel porte, dans un ordre stable. */
function itemIcons(items: readonly ItemId[]): string {
  return CARRIED_ITEMS.filter((i) => items.includes(i))
    .map((i) => `<span class="icon icon-${i}">${ITEM_ICONS[i]}</span>`)
    .join('');
}

function itemsSentence(items: readonly ItemId[]): string {
  return items.length > 0 ? `Materiel : ${items.map((i) => ITEM_LABELS[i]).join(', ')}` : 'Sans materiel';
}
