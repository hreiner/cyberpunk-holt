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
import type { ChapterEndDef } from './chapterEnd';

/** Deux chapitres a ce jour (ADR 0021). Un troisieme s'ajoute en etendant cette union. */
export type ChapterId = 1 | 2;

/**
 * Bilan de fin de chapitre (ADR 0025 §1, lot 5.4) : le chapitre 1 garde
 * l'ecran de cloture existant (`ReportView.renderChapterEnd`, voir
 * docs/process/ARCHITECTURE.md "Le bilan de l'exercice") via la valeur
 * `'ch1-report'`, geree comme un cas a part par `ChapterApp.showChapterEnd`.
 * Tout autre chapitre decrit son bilan en donnees avec un `ChapterEndDef`
 * (`src/narrative/chapterEnd.ts`), resolu par `resolveChapterEnd` et rendu
 * par `ReportView.renderChapterBilan`.
 */
export type ChapterEndRef = 'ch1-report';

/**
 * Jauge d'etat visible (ADR 0025 §1, lot 5.4) : lit un compteur de
 * `RunState.flags` et l'affiche en MOTS via `levels` (jamais un chiffre,
 * TECH-DESIGN §7) -- `levels[0]` correspond a la valeur 0 du compteur,
 * `levels[levels.length - 1]` a sa valeur maximale et a tout ce qui la
 * depasse. `from`, s'il est donne, est l'id d'une `SceneDef` de CE chapitre :
 * la jauge ne s'affiche qu'a partir de cette scene (incluse), jamais avant.
 */
export interface GaugeDef {
  id: string;
  /** Cle de `RunState.flags` (compteur numerique, voir `Effect` de type `counter`). */
  counter: string;
  /** Libelle affiche, ex. « Letitia ». */
  label: string;
  levels: string[];
  from?: string;
}

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
  /** Jauges d'etat visibles (ADR 0025 §1) -- absent ou vide : aucune jauge pour ce chapitre. */
  gauges?: GaugeDef[];
  end: ChapterEndRef | ChapterEndDef;
}
