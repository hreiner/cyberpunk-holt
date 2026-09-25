/**
 * Contrat d'un chapitre (ADR 0021) : un chapitre est une DONNEE, pas du code
 * different par chapitre. Type pur, sans DOM ni `three` (regle 2 d'AGENTS.md,
 * verifie par tests/unit/architecture.test.ts) -- exactement comme le reste
 * de src/narrative.
 *
 * Les chapitres eux-memes (leurs scenes, leur radio, ...) vivent en donnees
 * dans src/data/chapters/ (registre `CHAPTERS`, `chapterOfScene`) : ce fichier
 * ne fait que decrire la FORME commune.
 */

import type { RadioCue } from './radio';
import type { SceneDef } from './sceneRouter';

/** Deux chapitres a ce jour (ADR 0021). Un troisieme s'ajoute en etendant cette union. */
export type ChapterId = 1 | 2;

/**
 * Bilan de fin de chapitre : l'ADR 0025 (lot 5.4) introduira `ChapterEndDef`
 * (bilan declare en donnees, avec jauges et photo). En attendant, tout
 * chapitre -- y compris le 2, provisoirement -- reutilise l'ecran de cloture
 * du chapitre 1 (`ReportView.renderChapterEnd`, voir docs/process/ARCHITECTURE.md
 * "Le bilan de l'exercice"). Union a un seul membre aujourd'hui, deja geree
 * comme telle par `ChapterApp.showChapterEnd` : pas de branchement a ajouter,
 * juste a etendre le jour ou `ChapterEndDef` existe.
 */
export type ChapterEndRef = 'ch1-report';

export interface ChapterDef {
  id: ChapterId;
  /** Titre francais affichable, ex. « La nuit du bal ». */
  title: string;
  scenes: SceneDef[];
  /** Nom du drapeau de `RunState.flags` qui porte l'etape courante de CE chapitre (voir `withEtape`). */
  etapeFlag: string;
  /** Chance de Franklyn au debut du chapitre (ADR 0015 §2, generalise par l'ADR 0021). */
  initialLuck: number;
  radio: RadioCue[];
  end: ChapterEndRef;
}
