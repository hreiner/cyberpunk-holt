/**
 * HUD en HTML/CSS pose au-dessus du canvas.
 *
 * Choix assume : aucune interface dessinee dans le canvas. Le DOM est plus
 * rapide a iterer, accessible, et se teste directement avec Playwright via des
 * `data-testid`. Voir docs/process/ARCHITECTURE.md.
 *
 * Reskin "Encre rouge" (docs/art/UI-DESIGN-SYSTEM.md, "HUD tactique") : meme
 * mise en page et memes `data-testid` qu'avant, jetons/polices/formes du
 * design system a la place des valeurs en dur. `--comm` reste reserve aux
 * repliques radio de l'instructeur (docs, section "Couleurs") : plus aucun
 * usage generique de ce cyan ici (survol, etat actif...).
 */

import { CARRIED_ITEMS } from '@/data/items';
import { getCharacter } from '@/rules/character';
import { assetUrl } from '@/ui/assetUrl';
import type { CharacterId } from '@/rules/character';
import type { CheckResult, D10Result, RollModifier } from '@/rules/dice';
import { ITEM_LABELS } from '@/tactical/combat';
import type { TacticalCombat } from '@/tactical/combat';
import { estimateShot } from '@/tactical/queries';
import type { CombatState, ItemId, Unit } from '@/tactical/types';
import { portraitElement } from '@/ui/portraits';

export type HudActionId =
  'shoot' | 'melee' | 'heal' | 'spot' | 'encourage' | 'pickup' | 'placeMine' | 'run' | 'endTurn';

export interface HudCallbacks {
  onAction(id: HudActionId): void;
  onSelectTarget(id: CharacterId): void;
  onRestart(): void;
  /** Tourne la camera de `step` quarts de tour (+1 : sens horaire). */
  onRotateCamera(step: number): void;
  onToggleSound(): void;
  /**
   * Le journal vient d'apparaître ou de disparaître. `GameApp` s'en sert pour recalculer les
   * marges opaques du HUD : le terrain se recadre aussitôt sur la place qu'il gagne ou qu'il
   * perd (`IsoCamera.setSafeAreaInsetsPx`), au lieu de garder un trou à droite.
   */
  onToggleLog(): void;
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
  /**
   * Le journal est **replié par défaut**. C'est un panneau de consultation, pas un organe de
   * jeu : sur un écran étroit il prenait une colonne entière pour un texte qu'on lit après
   * coup, et le terrain, lui, se jouait dans la fente qui restait. Il s'ouvre d'un bouton
   * (ou de `J`) et se referme pareil.
   */
  private logVisible = false;

  constructor(
    container: HTMLElement,
    private readonly callbacks: HudCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hud';
    this.root.innerHTML = `
      <header class="hud-top">
        <div class="hud-banner panel" data-testid="banner"></div>
        <div class="hud-order" data-testid="order"></div>
        <div class="hud-camera" aria-label="Caméra">
          <button data-testid="camera-left" title="Pivoter la caméra (A)">⟲</button>
          <span>Caméra</span>
          <button data-testid="camera-right" title="Pivoter la caméra (E)">⟳</button>
          <button data-testid="log-toggle" title="Afficher le journal (J)" aria-pressed="false">🗒</button>
          <button data-testid="sound" title="Couper le son">🔊</button>
        </div>
      </header>
      <aside class="hud-sheet panel" data-testid="sheet"></aside>
      <section class="hud-log panel" data-testid="log"></section>
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
    this.q('[data-testid="log-toggle"]').addEventListener('click', () => this.toggleLog());
    this.applyLogVisibility();
  }

  /** Bascule le journal (bouton du HUD, ou `J`). */
  toggleLog(): void {
    this.logVisible = !this.logVisible;
    this.applyLogVisibility();
    this.callbacks.onToggleLog();
  }

  private applyLogVisibility(): void {
    this.logPanel.hidden = !this.logVisible;
    const button = this.q('[data-testid="log-toggle"]');
    button.setAttribute('aria-pressed', String(this.logVisible));
    button.title = this.logVisible ? 'Masquer le journal (J)' : 'Afficher le journal (J)';
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
    this.footer.textContent = `Graine : ${state.seed} — clic ou appui : déplacer · maj+clic : courir · glisser : déplacer la vue · molette ou pincer : zoomer · A/E ou les boutons Caméra : pivoter (un cadet caché derrière un conteneur reste visible en silhouette)`;
  }

  private renderBanner(state: CombatState, playerTeam: 'blue' | 'red'): void {
    if (state.phase === 'finished') {
      const won = state.winner === playerTeam;
      const label = state.winner === 'draw' ? 'Match nul' : won ? 'Exercice réussi' : 'Exercice manqué';
      this.banner.innerHTML = `<strong>${label}</strong> <button class="btn btn--primary" data-testid="restart">Rejouer</button>`;
      const btn = this.banner.querySelector('[data-testid="restart"]');
      btn?.addEventListener('click', () => this.callbacks.onRestart());
      return;
    }
    const current = getCharacter(state.order[state.turnIndex] as CharacterId).name;
    const kits = (team: 'blue' | 'red', label: string) =>
      `<span class="kit team-${team}" title="Kits de soin de l'équipe ${label}">${itemIconMarkup('healkit')} ${label} ×${state.teams[team].healkits}</span>`;
    this.banner.innerHTML = `<span>Round ${state.round}/${state.roundLimit}</span><span>Au tour de <strong>${current}</strong></span>${kits(playerTeam, playerTeam === 'blue' ? 'bleue' : 'rouge')}`;
  }

  /** Bande d'initiative : une vignette `thumb` par cadet, plus le cadre d'equipe et l'etat actif/neutralise. */
  private renderOrder(combat: TacticalCombat, playerTeam: 'blue' | 'red'): void {
    const state = combat.state;
    this.orderStrip.innerHTML = '';
    state.order.forEach((id, index) => {
      const unit = combat.unit(id);
      const sheet = getCharacter(id);
      // Le joueur ne connait que le materiel de sa propre equipe.
      const known = unit.team === playerTeam;

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
      chip.title = known ? itemsSentence(unit.items) : 'Matériel inconnu';

      chip.appendChild(portraitElement(id, 'thumb'));
      const label = document.createElement('span');
      label.className = 'order-chip-label';
      const name = document.createElement('span');
      name.className = 'order-chip-name';
      name.textContent = sheet.name;
      const items = document.createElement('span');
      items.className = 'chip-items';
      items.innerHTML = known ? itemIcons(unit.items) : '';
      label.append(name, items);
      chip.appendChild(label);

      chip.addEventListener('click', () => this.callbacks.onSelectTarget(id));
      this.orderStrip.appendChild(chip);
    });
  }

  /** Fiche du cadet actif : portrait `card`, PM, materiel, tirs possibles (jetons "il y a un jet" -- --tape). */
  private renderSheet(combat: TacticalCombat, playerTeam: 'blue' | 'red'): void {
    const unit = combat.currentUnit();
    const sheet = getCharacter(unit.id);
    const enemies = combat.activeUnitsOf(playerTeam === 'blue' ? 'red' : 'blue');
    // Le joueur ne connait que le materiel de sa propre equipe : pendant le tour adverse,
    // la fiche n'en revele rien (ni objets, ni tirs possibles).
    const known = unit.team === playerTeam;
    const shots = !known
      ? '<li class="muted">Équipement adverse inconnu</li>'
      : unit.items.includes('taser')
        ? enemies
            .map((e) => ({ e, est: estimateShot(combat, unit, e) }))
            .filter((s) => s.est.possible)
            .map(
              (s) =>
                `<li><button class="shot-btn" data-shoot="${s.e.id}" data-testid="shoot-${s.e.id}"><span class="chip-check"><span class="chip-check__skill">${getCharacter(s.e.id).name}</span><span class="chip-check__dv">couvert ${s.est.coverLabel} · ${s.est.distance} cases</span><span class="chip-check__pct">${s.est.chance}%</span></span></button></li>`,
            )
            .join('')
        : '<li class="muted">Pas de taser</li>';

    this.sheetPanel.innerHTML = `
      <div class="hud-sheet-head">
        <div class="hud-sheet-portrait" data-testid="sheet-portrait"></div>
        <div class="hud-sheet-heading">
          <h2 style="border-bottom-color:${sheet.placeholderColor}">${sheet.name}</h2>
          <p class="role">${sheet.role}</p>
        </div>
      </div>
      <ul class="stats">
        <li>PM restants <strong data-testid="mp">${unit.mp}</strong></li>
        <li>Action <strong>${unit.actionUsed ? 'utilisée' : 'disponible'}</strong></li>
        <li>État <strong>${statusLabel(unit)}</strong></li>
        <li>Matériel <strong>${known ? unit.items.map((i) => `${itemIconMarkup(i)} ${ITEM_LABELS[i]}`).join(', ') || 'aucun' : 'inconnu'}</strong></li>
      </ul>
      <h3>${known ? 'Tirs possibles' : 'Équipe adverse'}</h3>
      <ul class="shots">${shots}</ul>
    `;

    this.sheetPanel.querySelector('[data-testid="sheet-portrait"]')?.appendChild(portraitElement(unit.id, 'card'));

    this.sheetPanel.querySelectorAll('[data-shoot]').forEach((el) => {
      el.addEventListener('click', () => {
        this.callbacks.onSelectTarget((el as HTMLElement).dataset.shoot as CharacterId);
        this.callbacks.onAction('shoot');
      });
    });
  }

  /** Barre d'actions : classe `.btn` partagee (docs, "Formes"/"Mouvement") -- desactive clairement, focus visible via `:focus-visible` global. */
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
      { id: 'spot', label: 'Repérer', enabled: !unit.actionUsed },
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
      el.className = 'btn';
      el.textContent = b.label;
      el.dataset.testid = `action-${b.id}`;
      el.disabled = !playable || !b.enabled;
      el.addEventListener('click', () => this.callbacks.onAction(b.id));
      this.actionBar.appendChild(el);
    }
  }

  /**
   * Journal : mise en scene (docs/art/ART-DIRECTION.md, "Interface") -- un jet
   * resolu (`entry.check`) devient une mini-vignette RÉUSSI/ÉCHEC avec sa
   * chaine de des en --tape et ses modificateurs nommes, plutot que la seule
   * ligne texte brute de `formatCheck` (gardee pour les autres natures
   * d'entrees : deplacement, systeme, resultat...).
   */
  private renderLog(state: CombatState): void {
    if (state.log.length === this.lastLogLength) return;
    const fresh = state.log.slice(this.lastLogLength);
    this.lastLogLength = state.log.length;
    for (const entry of fresh) {
      const line = document.createElement('p');
      line.className = `log-line log-${entry.kind}`;
      if (entry.kind === 'check' && entry.check) {
        line.innerHTML = checkEntryMarkup(entry.check);
      } else {
        line.textContent = entry.text;
      }
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
  if (unit.status === 'neutralized') return 'neutralisé';
  const flags: string[] = [];
  if (unit.exposed) flags.push('à découvert');
  if (unit.gassed) flags.push('gazé');
  return flags.length > 0 ? flags.join(', ') : 'opérationnel';
}

/** Pictogrammes du materiel porte, dans un ordre stable. */
function itemIcons(items: readonly ItemId[]): string {
  return CARRIED_ITEMS.filter((i) => items.includes(i))
    .map((i) => `<span class="icon icon-${i}">${itemIconMarkup(i)}</span>`)
    .join('');
}

/** Icones peintes du materiel : le texte alternatif conserve leur sens hors rendu visuel. */
function itemIconMarkup(item: ItemId): string {
  const asset: Record<ItemId, string> = {
    taser: 'taser',
    healkit: 'kit-soin',
    hackingTool: 'outil-piratage',
    mine: 'mine',
  };
  return `<img class="item-icon item-icon--${item}" src="${assetUrl(`icons/${asset[item]}.png`)}" alt="${ITEM_LABELS[item]}" />`;
}

function itemsSentence(items: readonly ItemId[]): string {
  return items.length > 0 ? `Matériel : ${items.map((i) => ITEM_LABELS[i]).join(', ')}` : 'Sans matériel';
}

/** Chaine de des lisible, meme convention que `narrativeView.ts` (explosion/implosion nommee). */
function dieChainText(die: D10Result): string {
  const [first, ...rest] = die.faces;
  if (rest.length === 0) return `d10 ${first}`;
  const kind = die.exploded ? 'explosion' : die.imploded ? 'implosion' : 'relance';
  const sign = die.exploded ? '+' : '−';
  const tail = rest.map((f) => `${sign}${f}`).join(' ');
  return `d10 ${first} → ${kind} ${tail} = ${die.value}`;
}

function modifiersText(mods: readonly RollModifier[]): string {
  return mods.map((m) => `${m.label} ${m.value >= 0 ? '+' : ''}${m.value}`).join(' · ');
}

/** Mini-tampon RÉUSSI/ÉCHEC + chaine de des (--tape) + modificateurs nommes + total contre DV. */
function checkEntryMarkup(check: CheckResult): string {
  const verdictClass = check.success ? 'stamp--ok' : 'stamp--ko';
  const verdictText = check.success ? 'RÉUSSI' : 'ÉCHEC';
  const mods = modifiersText(check.modifiers);
  const detail = [
    check.label,
    `${check.attribute}+${check.skill}`,
    mods,
    `total ${check.total} contre DV ${check.dv}`,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    `<span class="stamp ${verdictClass} log-verdict">${verdictText}</span>` +
    `<span class="log-check-dice">${dieChainText(check.die)}</span>` +
    `<span class="log-check-detail">${detail}</span>`
  );
}
