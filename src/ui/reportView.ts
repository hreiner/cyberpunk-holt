/**
 * Bilan de l'exercice et fin de chapitre (docs/art/UI-DESIGN-SYSTEM.md,
 * "Bilan de l'exercice") : un procès-verbal d'examen -- feuille `--ink-2`,
 * tableau du bareme en chiffres tabulaires, mention tamponnee en travers
 * (le seul moment orchestre de cet ecran, voir la regle "Mouvement"),
 * etiquettes gagnees listees comme des notes d'instructeur.
 *
 * Deux rendus partagent la meme feuille : `renderExercise` (juste apres
 * l'affrontement, scene ajoutee par `ChapterApp` -- voir docs/process/
 * ARCHITECTURE.md) et `renderChapterEnd` (ecran de cloture, restyle a
 * l'identique par la meme passe).
 */

import type { Dossier } from '@/core/dossier';
import type { ExerciseScore, WrittenScore } from '@/rules/scoring';
import { writtenScoreTags } from '@/rules/scoring';
import type { ResolvedChapterEnd } from '@/narrative';
import { CHARACTER_IDS } from '@/rules/character';
import type { CharacterId } from '@/rules/character';
import { portraitElement } from '@/ui/portraits';
import { BACKDROPS } from '@/data/backdrops';

export interface ReportViewCallbacks {
  onContinueExercise(): void;
  onNewGame(): void;
  /** "Chapitre 2 — La nuit du bal" sur l'ecran de cloture (ADR 0022 §2, "suite directe"). */
  onNextChapter(): void;
}

/** Bouton "Chapitre suivant" du bilan de cloture (ADR 0022 §2), absent en fin de dernier chapitre. */
export interface NextChapterAction {
  /** Libelle affiche, ex. « Chapitre 2 — La nuit du bal ». */
  title: string;
}

/**
 * Traduction des etiquettes en notes d'instructeur, en francais courant.
 * Liste **fermee** (docs/design/06-SCORING-DOSSIER.md, "Vocabulaire des
 * etiquettes du chapitre 1") : une etiquette absente d'ici tombe sur le
 * repli generique de `noteFor`, jamais une erreur.
 */
const TAG_NOTES: Record<string, string> = {
  // Tempérament
  cynique: 'Ton cynique face à l’institution.',
  distrait: 'Facilement distrait pendant les exercices.',
  reserve: 'Réservé, peu bavard avec l’encadrement.',
  direct: 'Direct, sans détour avec les autres cadets.',
  rebelle: 'Tempérament rebelle, difficile à cadrer.',
  bluffeur: 'Prompt à bluffer plutôt qu’à admettre une erreur.',
  // Doctrine
  legaliste: 'Doctrine légaliste : la règle avant tout.',
  pragmatique: 'Doctrine pragmatique : le résultat avant la procédure.',
  idealiste: 'Doctrine idéaliste : croit encore à l’académie.',
  corporatiste: 'Doctrine corporatiste : loyal à la chaîne, pas à la règle.',
  // Savoir
  technicien: 'Bon technicien, à l’aise avec le matériel.',
  // Écrit (note de l'examen ecrit, ADR 0012)
  'copie-brillante': 'Copie brillante à l’examen écrit.',
  'copie-faible': 'Copie faible à l’examen écrit.',
  // Loyauté
  'loyal-academie': 'Loyal à l’académie HOLT.',
  'loyal-bande': 'Des liens avec une bande, hors de l’académie.',
  solitaire: 'Préfère agir seul.',
  // Parcours
  sauveteur: 'A sauvé l’otage de la salle 1.',
  curieux: 'A forcé l’armoire sécurisée de la salle 2.',
  renseignement: 'A exploité la vidéo de la salle 3.',
  'imprudent-salle-3': 'Au moins un cadet gazé en salle 3.',
  prudent: 'A évité les risques inutiles en salle 3.',
  // Exercice
  'vainqueur-exercice': 'Équipe victorieuse à l’exercice final.',
  'defaite-exercice': 'Équipe mise hors de combat à l’exercice final.',
  protecteur: 'Aucun coéquipier perdu pendant l’exercice.',
  'equipe-decimee': 'Toute l’équipe a été neutralisée.',
  offensif: 'Tous les adversaires neutralisés.',
  rapide: 'Tempo remarquable pendant l’exercice.',
  lent: 'Exercice étiré jusqu’à la limite de temps.',
};

function noteFor(tag: string): string {
  return TAG_NOTES[tag] ?? `Étiquette « ${tag.replace(/-/g, ' ')} ».`;
}

function scoreTableMarkup(score: ExerciseScore): string {
  const rows = score.breakdown
    .map(
      (b) => `
      <tr>
        <td>${b.label}</td>
        <td>${b.comment}</td>
        <td class="report-points">${b.points} / ${b.max}</td>
      </tr>`,
    )
    .join('');
  return `
    <table class="report-table">
      <thead><tr><th>Poste</th><th>Détail</th><th>Points</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="report-points">${score.total} / ${score.max}</td></tr></tfoot>
    </table>
    <div class="report-mention">
      <span class="stamp ${score.total >= 8 ? 'stamp--ok' : 'stamp--ko'} report-mention-stamp">${score.mention}</span>
    </div>
  `;
}

/**
 * Note de l'examen ecrit (scene 3, ADR 0012) : un poste separe du bareme de
 * l'affrontement (docs/design/06-SCORING-DOSSIER.md, "La note écrite") --
 * affichee au-dessus du tableau du barème pratique, jamais fondue dedans,
 * chiffres tabulaires comme le reste du procès-verbal.
 */
function writtenScoreMarkup(score: WrittenScore): string {
  return `
    <p class="report-written">
      Examen écrit — <span class="report-written-count">${score.correct} / ${score.total}</span> bonnes réponses
    </p>
  `;
}

function notesMarkup(heading: string, tags: string[]): string {
  if (tags.length === 0) return '';
  const items = tags.map((t) => `<li>${noteFor(t)}</li>`).join('');
  return `
    <div class="report-notes">
      <h2>${heading}</h2>
      <ul>${items}</ul>
    </div>
  `;
}

/**
 * Bilan de nuit (ADR 0025 §1, "Photo au bilan") : lignes `{ label, value }`
 * deja resolues par `resolveChapterEnd` -- ce module n'y choisit plus rien,
 * il ne fait qu'aligner label/valeur comme les notes d'instructeur ci-dessus.
 */
function bilanLinesMarkup(lines: { label: string; value: string }[]): string {
  if (lines.length === 0) return '';
  const items = lines
    .map((l) => `<div class="report-bilan-line"><span class="report-bilan-label">${l.label}</span><span class="report-bilan-value">${l.value}</span></div>`)
    .join('');
  return `<div class="report-bilan-lines">${items}</div>`;
}

/**
 * Photo souvenir plein cadre (ADR 0025 §4.6) : le decor de `photo.backdrop`
 * (`src/data/backdrops.ts`), au-dessus d'une rangee de portraits des cinq
 * amis jouables -- `faded` les estompe (`.report-photo-faded`), sans les
 * retirer : la photo garde tout le monde, mais pas tout le monde pareil.
 */
function photoMarkup(photo: { backdrop: string; faded: CharacterId[] }): string {
  const src = BACKDROPS[photo.backdrop]?.src;
  const img = src ? `<img class="report-photo-image" src="${src}" alt="Photo de classe" />` : '';
  return `
    <div class="report-photo" data-testid="report-photo">
      ${img}
      <div class="report-photo-cast" data-testid="report-photo-cast"></div>
    </div>
  `;
}

export class ReportView {
  private readonly root: HTMLElement;
  private readonly sheetEl: HTMLElement;

  constructor(
    container: HTMLElement,
    private readonly callbacks: ReportViewCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'report-screen';
    this.root.hidden = true;
    this.root.innerHTML = `<div class="report-sheet panel panel--lifted" data-testid="report-sheet"></div>`;
    container.appendChild(this.root);
    this.sheetEl = this.root.querySelector('.report-sheet') as HTMLElement;
  }

  /**
   * Procès-verbal de l'exercice, juste apres l'affrontement final (voir
   * ChapterApp.showReport). `writtenScore` (note de l'examen ecrit, scene 3,
   * ADR 0012) est deja posee dans le dossier a ce stade -- elle ne modifie
   * PAS la note pratique sur 20 (docs/design/06-SCORING-DOSSIER.md : deux
   * postes distincts), seulement les etiquettes copie-brillante/copie-faible,
   * ajoutees ici aux notes de l'instructeur au meme titre que celles de
   * l'exercice.
   */
  renderExercise(score: ExerciseScore, writtenScore: WrittenScore | null): void {
    const writtenTags = writtenScore ? writtenScoreTags(writtenScore) : [];
    this.sheetEl.innerHTML = `
      <header class="report-head">
        <p class="report-kicker">Académie HOLT</p>
        <h1>Procès-verbal de l’examen pratique</h1>
      </header>
      ${writtenScore ? writtenScoreMarkup(writtenScore) : ''}
      ${scoreTableMarkup(score)}
      ${notesMarkup("Notes de l'instructeur", [...score.tags, ...writtenTags])}
      <button type="button" class="btn btn--primary report-continue" data-testid="report-continue">
        Continuer
      </button>
    `;
    (this.sheetEl.querySelector('[data-testid="report-continue"]') as HTMLButtonElement).onclick = () =>
      this.callbacks.onContinueExercise();
  }

  /**
   * Ecran de cloture du chapitre : meme feuille, dossier complet plutot que le seul exercice.
   * `next` (ADR 0022 §2, absent en fin du dernier chapitre) ajoute "Chapitre 2 — La nuit du
   * bal" en action PRIMAIRE -- "Nouvelle partie" reste possible mais rejoue le meme chapitre
   * (voir `ChapterApp.startNewGame`), ce n'est pas la suite naturelle quand il y en a une.
   */
  renderChapterEnd(dossier: Dossier, next: NextChapterAction | null = null): void {
    const score = dossier.practicalScore;
    this.sheetEl.innerHTML = `
      <header class="report-head">
        <p class="report-kicker">Académie HOLT</p>
        <h1>Fin du chapitre 1</h1>
      </header>
      ${score ? scoreTableMarkup(score) : '<p class="report-empty">Exercice pratique non evalue.</p>'}
      ${notesMarkup('Dossier du candidat', dossier.tags)}
      ${
        next
          ? `<button type="button" class="btn btn--primary report-next-chapter" data-testid="report-next-chapter">
              ${next.title}
            </button>`
          : ''
      }
      <button type="button" class="btn ${next ? '' : 'btn--primary'} report-newgame" data-testid="report-newgame">
        Nouvelle partie
      </button>
    `;
    (this.sheetEl.querySelector('[data-testid="report-newgame"]') as HTMLButtonElement).onclick = () =>
      this.callbacks.onNewGame();
    const nextBtn = this.sheetEl.querySelector('[data-testid="report-next-chapter"]') as HTMLButtonElement | null;
    if (nextBtn) nextBtn.onclick = () => this.callbacks.onNextChapter();
  }

  /**
   * Bilan declare en donnees (ADR 0025 §1, lot 5.4) : meme feuille que
   * `renderChapterEnd`, cette fois entierement pilotee par `resolveChapterEnd`
   * -- kicker, titre, photo souvenir facultative, lignes deja resolues. Le
   * chapitre 1 ne passe jamais ici (voir `ChapterApp.showChapterEnd`, qui
   * garde `renderChapterEnd` pour `'ch1-report'`) : ce rendu n'a donc aucune
   * contrainte de retro-compatibilite visuelle a tenir.
   */
  renderChapterBilan(resolved: ResolvedChapterEnd, next: NextChapterAction | null = null): void {
    this.sheetEl.innerHTML = `
      <header class="report-head">
        <p class="report-kicker">${resolved.kicker}</p>
        <h1>${resolved.title}</h1>
      </header>
      ${resolved.photo ? photoMarkup(resolved.photo) : ''}
      ${bilanLinesMarkup(resolved.lines)}
      ${
        next
          ? `<button type="button" class="btn btn--primary report-next-chapter" data-testid="report-next-chapter">
              ${next.title}
            </button>`
          : ''
      }
      <button type="button" class="btn ${next ? '' : 'btn--primary'} report-newgame" data-testid="report-newgame">
        Nouvelle partie
      </button>
    `;

    const cast = this.sheetEl.querySelector('[data-testid="report-photo-cast"]') as HTMLElement | null;
    if (cast && resolved.photo) {
      for (const id of CHARACTER_IDS) {
        if (id === 'franklyn') continue; // derriere l'appareil, jamais sur la photo (voir la scene ch2.photo).
        const thumb = portraitElement(id, 'thumb');
        if (resolved.photo.faded.includes(id)) thumb.classList.add('report-photo-faded');
        cast.appendChild(thumb);
      }
    }

    (this.sheetEl.querySelector('[data-testid="report-newgame"]') as HTMLButtonElement).onclick = () =>
      this.callbacks.onNewGame();
    const nextBtn = this.sheetEl.querySelector('[data-testid="report-next-chapter"]') as HTMLButtonElement | null;
    if (nextBtn) nextBtn.onclick = () => this.callbacks.onNextChapter();
  }

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }

  dispose(): void {
    this.root.remove();
  }
}
