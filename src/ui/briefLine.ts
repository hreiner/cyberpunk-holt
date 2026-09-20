/**
 * Réplique brève (08-EXPLORATION.md "Répliques brèves") : une bulle au-dessus de la tête
 * pour un `npc` (parlée, entre guillemets français), une ligne de narration discrète en bas
 * de l'écran pour un `object` (« Un casier métallique cabossé… »). Jamais de panneau de
 * dialogue, une seule réplique à la fois, 3 s puis disparition.
 *
 * N'importe jamais `three` (UI-DESIGN-SYSTEM.md "Fichiers") : la position écran de la bulle
 * est calculée par l'appelant (`ExploreView.projectToScreen`, qui connaît la caméra) et
 * transmise en pixels via `setSpeechPosition`.
 */

import './explore.css';

const DURATION_S = 3;

type Mode = 'speech' | 'narration' | null;

export class BriefLineView {
  private readonly bubble: HTMLElement;
  private readonly narration: HTMLElement;
  private mode: Mode = null;
  private trackedEntityId: string | null = null;
  private elapsed = 0;

  constructor(container: HTMLElement) {
    this.bubble = document.createElement('div');
    this.bubble.className = 'brief-line-bubble';
    this.bubble.dataset.testid = 'brief-line-bubble';
    container.appendChild(this.bubble);

    this.narration = document.createElement('div');
    this.narration.className = 'brief-line-narration';
    this.narration.dataset.testid = 'brief-line-narration';
    container.appendChild(this.narration);
  }

  /** Réplique parlée d'un `npc` : bulle au-dessus de la tête, suit `entityId` à l'écran. */
  showSpeech(entityId: string, text: string): void {
    this.mode = 'speech';
    this.trackedEntityId = entityId;
    this.elapsed = 0;
    this.bubble.textContent = `« ${text} »`;
    this.bubble.classList.add('is-visible');
    this.narration.classList.remove('is-visible');
  }

  /** Réplique narrée d'un `object` : ligne discrète en bas de l'écran, pas de bulle. */
  showNarration(text: string): void {
    this.mode = 'narration';
    this.trackedEntityId = null;
    this.elapsed = 0;
    this.narration.textContent = text;
    this.narration.classList.add('is-visible');
    this.bubble.classList.remove('is-visible');
  }

  /** Entité à projeter à l'écran ce cadre, ou `null` si aucune bulle parlée n'est active. */
  get entityToTrack(): string | null {
    return this.mode === 'speech' ? this.trackedEntityId : null;
  }

  /** Position écran (pixels) de l'entité suivie ; `null` = hors champ, la bulle s'efface. */
  setSpeechScreenPosition(pos: { x: number; y: number } | null): void {
    if (this.mode !== 'speech') return;
    if (!pos) {
      this.bubble.classList.remove('is-visible');
      return;
    }
    this.bubble.classList.add('is-visible');
    this.bubble.style.left = `${pos.x}px`;
    this.bubble.style.top = `${pos.y}px`;
  }

  /** Avance le minuteur (3 s) : à appeler chaque image tant qu'une réplique est affichée. */
  tick(dt: number): void {
    if (!this.mode) return;
    this.elapsed += dt;
    if (this.elapsed >= DURATION_S) this.hide();
  }

  hide(): void {
    this.mode = null;
    this.trackedEntityId = null;
    this.bubble.classList.remove('is-visible');
    this.narration.classList.remove('is-visible');
  }

  dispose(): void {
    this.bubble.remove();
    this.narration.remove();
  }
}
