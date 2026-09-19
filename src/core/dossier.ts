/**
 * Dossier du candidat : la memoire du jeu.
 *
 * Tout ce que le chapitre 1 doit pouvoir faire ressortir plus tard (au bal de
 * promo, au chapitre 2, dans un dialogue) passe par ce dossier. C'est le SEUL
 * contrat de donnees entre chapitres : il est versionne et exportable en JSON.
 *
 * Reference de design : docs/design/06-SCORING-DOSSIER.md
 */

import type { CharacterId } from '@/rules/character';
import type { ExerciseScore, WrittenScore } from '@/rules/scoring';
import { writtenScoreTags } from '@/rules/scoring';

/** v2 (ADR 0012) : ajoute `writtenScore`. `migrateDossier` accepte un dossier v1 sans ce champ. */
export const DOSSIER_VERSION = 2;

export interface DossierEntry {
  /** Identifiant stable, ex: `ch1.exam.question3`. */
  key: string;
  /** Libelle lisible affiche dans la fiche du candidat. */
  label: string;
  /** Valeur libre : reponse choisie, resultat, commentaire. */
  value: string;
  chapter: number;
}

export interface Dossier {
  version: number;
  candidate: CharacterId;
  /** Etiquettes accumulees : "rapide", "protecteur", "imprudent-salle-3"... */
  tags: string[];
  /** Affinites courantes avec les cinq amis, de -3 a +3. */
  affinities: Partial<Record<CharacterId, number>>;
  entries: DossierEntry[];
  /** Note de l'examen pratique, une fois l'exercice termine. */
  practicalScore: ExerciseScore | null;
  /** Note de l'examen ecrit (scene 3, ADR 0012), une fois la copie terminee. */
  writtenScore: WrittenScore | null;
  updatedAt: string;
}

export function createDossier(candidate: CharacterId = 'franklyn'): Dossier {
  return {
    version: DOSSIER_VERSION,
    candidate,
    tags: [],
    affinities: {},
    entries: [],
    practicalScore: null,
    writtenScore: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export function addTags(dossier: Dossier, tags: string[]): Dossier {
  const merged = new Set([...dossier.tags, ...tags]);
  return touch({ ...dossier, tags: [...merged].sort() });
}

export function addEntry(dossier: Dossier, entry: DossierEntry): Dossier {
  const entries = dossier.entries.filter((e) => e.key !== entry.key);
  entries.push(entry);
  return touch({ ...dossier, entries });
}

export function adjustAffinity(dossier: Dossier, who: CharacterId, delta: number): Dossier {
  const current = dossier.affinities[who] ?? 0;
  const next = Math.max(-3, Math.min(3, current + delta));
  return touch({ ...dossier, affinities: { ...dossier.affinities, [who]: next } });
}

export function setPracticalScore(dossier: Dossier, score: ExerciseScore): Dossier {
  return touch(addTags({ ...dossier, practicalScore: score }, score.tags));
}

export function setWrittenScore(dossier: Dossier, score: WrittenScore): Dossier {
  return touch(addTags({ ...dossier, writtenScore: score }, writtenScoreTags(score)));
}

function touch(d: Dossier): Dossier {
  return { ...d, updatedAt: new Date().toISOString() };
}

/** Migration ascendante : garantit qu'un vieux dossier reste lisible. */
export function migrateDossier(raw: unknown): Dossier {
  const base = createDossier();
  if (!raw || typeof raw !== 'object') return base;
  const candidate = raw as Partial<Dossier>;
  return {
    ...base,
    ...candidate,
    version: DOSSIER_VERSION,
    tags: candidate.tags ?? [],
    entries: candidate.entries ?? [],
    affinities: candidate.affinities ?? {},
    practicalScore: candidate.practicalScore ?? null,
    // Absent sur tout dossier v1 (avant l'ADR 0012) : jamais un dossier illisible pour autant.
    writtenScore: candidate.writtenScore ?? null,
  };
}
