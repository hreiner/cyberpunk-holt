/**
 * Harnais de developpement pour `DiceRoller` (src/render/dice3d.ts).
 *
 * Page dev-only : servie par `vite` (voir dice-lab.html a la racine), jamais
 * incluse dans le build de production (non referencee par `index.html`, donc
 * absente de `vite build` par defaut -- voir AGENTS.md, regle "pas de refonte
 * silencieuse" : aucune modification de vite.config.ts n'a ete necessaire).
 */

import '../ui/theme.css';
import { DiceRoller } from '../render/dice3d';

const host = document.getElementById('dice-lab-host');
if (!host) throw new Error('#dice-lab-host introuvable dans dice-lab.html');

const roller = new DiceRoller(host, { manual: true });

const manualToggle = document.getElementById('manual-toggle') as HTMLInputElement | null;
const reducedToggle = document.getElementById('reduced-toggle') as HTMLInputElement | null;
const logEl = document.getElementById('dice-lab-log');

let activeRoller = roller;

function log(message: string): void {
  if (!logEl) return;
  const line = document.createElement('div');
  line.textContent = `${new Date().toLocaleTimeString('fr-FR')} — ${message}`;
  logEl.prepend(line);
}

function rebuildRoller(): DiceRoller {
  activeRoller.dispose();
  activeRoller = new DiceRoller(host as HTMLElement, { manual: manualToggle?.checked ?? true });
  return activeRoller;
}

manualToggle?.addEventListener('change', () => {
  rebuildRoller();
  log(`Mode manuel : ${manualToggle.checked ? 'oui' : 'non'}`);
});

const presets: { label: string; faces: number[] }[] = [
  { label: '[7]', faces: [7] },
  { label: '[10, 4]', faces: [10, 4] },
  { label: '[10, 10, 3]', faces: [10, 10, 3] },
  { label: '[1, 6]', faces: [1, 6] },
  { label: '[1]', faces: [1] },
  { label: '[1, 1, 4]', faces: [1, 1, 4] },
  { label: '[10, 10, 10, 5]', faces: [10, 10, 10, 5] },
];

const buttonsRoot = document.getElementById('dice-lab-buttons');
if (buttonsRoot) {
  for (const preset of presets) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lab-btn';
    btn.textContent = preset.label;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      log(`Lancement ${preset.label}…`);
      try {
        await activeRoller.roll({
          faces: preset.faces,
          label: `Test — ${preset.label}`,
          reducedMotion: reducedToggle?.checked,
        });
        log(`Termine ${preset.label}.`);
      } finally {
        btn.disabled = false;
      }
    });
    buttonsRoot.appendChild(btn);
  }
}

document.getElementById('skip-btn')?.addEventListener('click', () => activeRoller.skip());
