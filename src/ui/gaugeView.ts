/**
 * Jauge d'etat generique (ADR 0025 §1, lot 5.4 ; docs/art/UI-DESIGN-SYSTEM.md
 * "Jauge d'etat") : meme vocabulaire visuel que les encarts persistants de
 * `narrativeView.ts` (`status-chip`/`status-pips`, voir `renderStatus`) --
 * une rangee de pastilles pleines/vides et un libelle **en mots**, jamais un
 * chiffre (TECH-DESIGN §7 : « la jauge rend le chapitre comptable » est le
 * risque explicitement ecarte). Se pose aussi bien dans le panneau de
 * dialogue (`NarrativeView`) que dans l'encart d'objectif de l'exploration
 * (`ObjectiveHud`) : les deux montent une instance sur leur propre conteneur,
 * c'est la seule chose qu'elles partagent ici.
 *
 * Le tampon (docs/art/UI-DESIGN-SYSTEM.md "Mouvement", meme jeton `.stamp`
 * que le verdict d'un jet) ne tombe qu'au CHANGEMENT de niveau, jamais a
 * chaque rendu -- l'instance retient donc le dernier niveau affiche.
 */

export interface GaugeStatus {
  id: string;
  /** Libelle de la jauge, ex. « Letitia ». */
  label: string;
  /** Index dans `levels` (0 = premier libelle). */
  levelIndex: number;
  /** `levels[levelIndex]`, deja resolu -- ex. « blessure grave ». */
  levelLabel: string;
  levelsCount: number;
}

/** Duree du tampon de changement de niveau -- memes 180 ms que le tampon de jet (UI-DESIGN-SYSTEM "Mouvement"). */
const STAMP_DURATION_MS = 900;

export class GaugeView {
  private readonly root: HTMLElement;
  private readonly labelEl: HTMLElement;
  private readonly levelEl: HTMLElement;
  private readonly pipsEl: HTMLElement;
  private lastLevelIndex: number | null = null;
  private stampTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'gauge-hud panel';
    this.root.dataset.testid = 'gauge-hud';
    this.root.style.display = 'none';
    this.root.innerHTML = `
      <span class="gauge-hud__label"></span>
      <span class="gauge-hud__level" data-testid="gauge-level"></span>
      <span class="gauge-hud__pips"></span>
    `;
    container.appendChild(this.root);
    this.labelEl = this.root.querySelector('.gauge-hud__label') as HTMLElement;
    this.levelEl = this.root.querySelector('.gauge-hud__level') as HTMLElement;
    this.pipsEl = this.root.querySelector('.gauge-hud__pips') as HTMLElement;
  }

  /** `null` : jauge absente/hors de sa scene `from` -- masquee, memoire du niveau reinitialisee. */
  render(status: GaugeStatus | null): void {
    if (!status) {
      this.root.style.display = 'none';
      this.lastLevelIndex = null;
      return;
    }
    this.root.style.display = '';
    this.labelEl.textContent = status.label;
    this.levelEl.textContent = status.levelLabel;

    this.pipsEl.innerHTML = '';
    for (let i = 0; i < status.levelsCount; i++) {
      const pip = document.createElement('span');
      pip.className = `gauge-hud__pip${i <= status.levelIndex ? ' is-filled' : ' is-empty'}`;
      this.pipsEl.appendChild(pip);
    }

    const changed = this.lastLevelIndex !== null && this.lastLevelIndex !== status.levelIndex;
    this.lastLevelIndex = status.levelIndex;
    if (!changed) return;

    this.root.classList.remove('gauge-hud--stamp');
    // Force le redemarrage de l'animation CSS meme si un changement precedent tournait encore.
    void this.root.offsetWidth;
    this.root.classList.add('gauge-hud--stamp');
    if (this.stampTimer) clearTimeout(this.stampTimer);
    this.stampTimer = setTimeout(() => this.root.classList.remove('gauge-hud--stamp'), STAMP_DURATION_MS);
  }

  dispose(): void {
    if (this.stampTimer) clearTimeout(this.stampTimer);
    this.root.remove();
  }
}
