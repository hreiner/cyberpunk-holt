/**
 * Sélecteur de scène de la QA (troisième vue de l'écran titre, voir `TitleView`) : chaque
 * scène des chapitres, avec ses branches préparées (`src/dev/scenePresets.ts`), une graine
 * libre et le profil de départ du chapitre 2. Choisir une variante appelle `onPick` ; c'est
 * main.ts qui écrit la partie et recharge la page.
 */

import './scenePicker.css';
import { SCENE_PRESETS } from '@/dev/scenePresets';
import { CH2_PROFILES, CHAPTERS } from '@/data/chapters';
import type { ProfileId } from '@/data/chapters';

export interface ScenePickerChoice {
  variantId: string;
  /** Graine saisie, `undefined` si le champ est vide (main.ts en tire une). */
  seed?: string;
  profile: ProfileId;
}

const KIND_LABELS: Record<string, string> = {
  dialogue: 'dialogue',
  explore: 'exploration',
  tactical: 'combat',
  draft: 'tirage',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function renderScenePicker(host: HTMLElement, onPick: (choice: ScenePickerChoice) => void, onBack: () => void): void {
  const chapters = Object.values(CHAPTERS)
    .map((def) => {
      const rows = SCENE_PRESETS.filter((p) => p.chapter === def.id)
        .map(
          (preset) => `
            <li class="scene-picker-row">
              <div class="scene-picker-scene">
                <span class="scene-picker-title">${escapeHtml(preset.title)}</span>
                <code class="scene-picker-id">${preset.sceneId} · ${KIND_LABELS[preset.kind] ?? preset.kind}</code>
              </div>
              <div class="scene-picker-variants">
                ${preset.variants
                  .map(
                    (v, i) =>
                      `<button type="button" class="btn ${i === 0 ? 'btn--primary' : ''} scene-picker-variant" data-variant="${v.id}" data-testid="scene-pick-${v.id}">${escapeHtml(v.label)}</button>`,
                  )
                  .join('')}
              </div>
            </li>`,
        )
        .join('');
      return `
        <section class="scene-picker-chapter">
          <h3>Chapitre ${def.id} — ${escapeHtml(def.title)}</h3>
          <ol class="scene-picker-list">${rows}</ol>
        </section>`;
    })
    .join('');

  host.innerHTML = `
    <div class="scene-picker panel">
      <header class="scene-picker-header">
        <h2>Aller à une scène <span class="scene-picker-badge">QA</span></h2>
        <p>La partie démarre directement sur la scène, avec l'état de la branche choisie.</p>
        <div class="scene-picker-options">
          <label>Graine
            <input type="text" data-testid="scene-picker-seed" placeholder="aléatoire" spellcheck="false" />
          </label>
          <label>Profil (chapitre 2)
            <select data-testid="scene-picker-profile">
              ${Object.values(CH2_PROFILES)
                .map((p) => `<option value="${p.id}" ${p.id === 'neutre' ? 'selected' : ''}>${escapeHtml(p.title)}</option>`)
                .join('')}
            </select>
          </label>
          <button type="button" class="title-link" data-testid="scene-picker-back">Retour</button>
        </div>
      </header>
      <div class="scene-picker-body">${chapters}</div>
    </div>
  `;

  const seedInput = host.querySelector('[data-testid="scene-picker-seed"]') as HTMLInputElement;
  const profileSelect = host.querySelector('[data-testid="scene-picker-profile"]') as HTMLSelectElement;
  host.querySelector('[data-testid="scene-picker-back"]')?.addEventListener('click', onBack);
  host.querySelectorAll<HTMLButtonElement>('[data-variant]').forEach((button) => {
    button.addEventListener('click', () => {
      const seed = seedInput.value.trim();
      onPick({
        variantId: button.dataset.variant ?? '',
        seed: seed === '' ? undefined : seed,
        profile: profileSelect.value as ProfileId,
      });
    });
  });
}
