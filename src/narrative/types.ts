/**
 * Contrat de types des dialogues. Recopie exacte de la section "Types (contrat
 * exact)" de docs/design/07-DIALOGUE-FORMAT.md : ne pas devier sans mettre a
 * jour le document en meme temps (voir AGENTS.md, regle 7 sur les ADR pour
 * tout changement structurant).
 */

import type { Attribute, DifficultyName, Skill } from '@/rules/attributes';
import type { CharacterId } from '@/rules/character';
import { CHARACTER_IDS, getCharacter } from '@/rules/character';

export type SpeakerId = CharacterId | 'narrateur' | 'directeur' | 'instructeur' | 'otage' | 'radio';

export interface DialogueFile {
  /** Ex. "ch1.hub.john". */
  id: string;
  /** Interlocuteur principal, pour le portrait. */
  speaker?: SpeakerId;
  /** Cle d'un noeud. */
  start: string;
  nodes: Record<string, DialogueNode>;
}

export interface DialogueNode {
  /** Narration, a la troisieme personne. */
  text?: string;
  lines?: DialogueLine[];
  /** Appliques a l'entree du noeud, une seule fois. */
  effects?: Effect[];
  /**
   * Jet de "reflexion" prealable aux choix de ce noeud (examen ecrit,
   * ADR 0012) : tant qu'il n'est pas resolu, le noeud est en attente et
   * `choose()` refuse tout choix. Sa reussite revele le choix `best` du
   * noeud (`PresentedChoice.best`), son echec ne revele rien.
   */
  insight?: InsightSpec;
  /** Si absent : enchainement automatique via `to`. */
  choices?: DialogueChoice[];
  /** Noeud suivant ; absent et sans choix = fin. */
  to?: string;
}

export interface DialogueLine {
  who: SpeakerId;
  text: string;
}

export interface DialogueChoice {
  /** Prefixe [Competence] quand il y a un jet. */
  text: string;
  /** Sans `check`. */
  to?: string;
  /** Avec `check` : `onSuccess` ET `onFailure` obligatoires. */
  check?: CheckSpec;
  onSuccess?: string;
  onFailure?: string;
  /** Toutes doivent etre vraies pour que le choix existe. */
  conditions?: Condition[];
  /** Appliques dans tous les cas. */
  effects?: Effect[];
  successEffects?: Effect[];
  failureEffects?: Effect[];
  /**
   * Marque LA meilleure reponse du noeud (jugement institutionnel, pas la
   * doctrine du joueur -- voir ADR 0012). Un seul `best` par noeud, et
   * uniquement dans un noeud portant `insight` (verifie par le validateur).
   * N'est jamais expose au joueur (`PresentedChoice.best`) tant que le jet de
   * reflexion du noeud n'a pas reussi.
   */
  best?: true;
}

export interface CheckSpec {
  /** Cle de SKILLS. */
  skill: Skill;
  /** Par defaut SKILL_ATTRIBUTE[skill]. */
  attribute?: Attribute;
  /** "FACILE" | "NORMALE" | ... — jamais un nombre. */
  dv: DifficultyName;
  /** Cadet qui lance le jet. Par defaut le candidat (Franklyn). */
  who?: CharacterId;
}

/**
 * Jet de "reflexion" d'un noeud (ADR 0012) : un `CheckSpec` ordinaire, plus
 * la narration facultative jouee apres resolution et les effets facultatifs
 * qui en decoulent (etiquettes de personnalite, par ex. -- voir
 * ch1.exam.json). Resolu par `DialogueRunner.rollInsight()`, jamais par
 * `choose()`.
 */
export interface InsightSpec extends CheckSpec {
  /** Narration jouee si le jet reussit (facultatif). */
  successText?: string;
  /** Narration jouee si le jet echoue (facultatif). */
  failureText?: string;
  successEffects?: Effect[];
  failureEffects?: Effect[];
}

export type Condition =
  | { flag: string; equals?: string | number | boolean; atLeast?: number }
  | { tag: string }
  | { affinity: CharacterId; atLeast?: number; atMost?: number }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] };

export type Effect =
  | { affinity: { who: CharacterId; delta: number } } // borne a [-3, +3]
  | { tag: string } // etiquette de dossier
  | { entry: { key: string; label: string; value: string } }
  | { flag: string; value: string | number | boolean } // drapeau de partie (volatil)
  | { counter: string; delta: number } // drapeau numerique incremente
  | { tempo: number } // avance le minuteur invisible
  | { team: TeamEffect } // materiel de l'equipe du joueur
  | { writtenScore: { counterKey: string; total: number } }; // finalise la note ecrite (ADR 0012)

export type TeamEffect =
  | { healkits: number } // delta
  | { extraTaser: true }
  | { gassed: CharacterId };

/**
 * Libelles francais affichables pour chaque locuteur. Les cadets prennent
 * leur prenom depuis la fiche (`getCharacter`) : une seule source de verite
 * pour l'orthographe des noms.
 */
const STATIC_SPEAKER_LABELS: Record<Exclude<SpeakerId, CharacterId>, string> = {
  narrateur: '',
  directeur: 'Le directeur',
  instructeur: "L'instructeur",
  otage: "L'otage",
  radio: 'Radio',
};

function buildSpeakerLabels(): Record<SpeakerId, string> {
  const labels = { ...STATIC_SPEAKER_LABELS } as Record<SpeakerId, string>;
  for (const id of CHARACTER_IDS) {
    labels[id] = getCharacter(id).name;
  }
  return labels;
}

export const SPEAKER_LABELS: Record<SpeakerId, string> = buildSpeakerLabels();
