/**
 * Notation de l'examen pratique et alimentation du dossier du candidat.
 *
 * Le bareme total fait 20 points. L'epic 1 ne renseigne que la partie
 * tactique ; les champs "parcours" (salles 1 a 3) sont optionnels et seront
 * remplis par l'epic 2. Un champ absent vaut 0 point, jamais un malus :
 * on peut donc noter une partie qui ne contient que le combat final.
 *
 * Reference de design : docs/design/06-SCORING-DOSSIER.md
 */

import type { CharacterId } from '@/rules/character';
import type { TeamId, Winner } from '@/tactical/types';

/**
 * Noms exacts des drapeaux poses par les dialogues du parcours interieur
 * (src/data/dialogues/ch1.salle1.json, ch1.salle2.json, ch1.salle3.json).
 * `courseResultFromFlags` les relit tels quels : ne pas les redecliner
 * ailleurs, la source de verite est le fichier de dialogue lui-meme.
 */
export const FLAG_HOSTAGE_SAVED = 'ch1.salle1.otage-sauve';
export const FLAG_CABINET_FORCED = 'ch1.salle2.armoire-forcee';
export const FLAG_VIDEO_WATCHED = 'ch1.salle3.video-vue';

/**
 * Points du parcours interieur (scene 7), voir docs/design/06-SCORING-DOSSIER.md.
 * Regle 4 d'AGENTS.md : jamais de litteral dans une condition.
 */
export const COURSE_HOSTAGE_POINTS = 1;
export const COURSE_CABINET_POINTS = 0.5;
export const COURSE_VIDEO_POINTS = 0.5;
export const COURSE_MAX_POINTS = 2;

/**
 * Traduction du parcours interieur joue par le joueur, prete a etre versee
 * dans un `ScoreInput`. Ne porte que ce que le joueur a reellement declenche :
 * un champ absent en amont (partie qui ne contient que le combat final) donne
 * `false`/`0` partout, jamais un malus (cf. `scoreExercise`).
 */
export interface CourseResult {
  hostageSaved: boolean;
  cabinetForced: boolean;
  videoWatched: boolean;
  gassedCount: number;
}

/**
 * Lit `CourseResult` depuis les drapeaux du `RunState` du joueur. Les trois
 * premiers champs viennent des drapeaux effectivement poses par les
 * dialogues de salle 1 a 3 (voir les constantes `FLAG_*` ci-dessus). Le
 * gazage ne passe pas par un drapeau : les dialogues le portent via l'effet
 * `{ "team": { "gassed": ... } }`, qui vit dans `RunState.teams`, pas dans
 * `RunState.flags` (voir ADR 0011 et `src/narrative/runState.ts`). L'appelant
 * transmet donc `gassedMembers` a part, lu sur l'equipe du JOUEUR uniquement
 * (defaut 2 du rapport de cloture epic 2 : un cadet adverse gaze n'a rien a
 * voir avec l'imprudence de Franklyn).
 */
export function courseResultFromFlags(
  flags: Record<string, string | number | boolean>,
  gassedMembers: CharacterId[],
): CourseResult {
  return {
    hostageSaved: flags[FLAG_HOSTAGE_SAVED] === true,
    cabinetForced: flags[FLAG_CABINET_FORCED] === true,
    videoWatched: flags[FLAG_VIDEO_WATCHED] === true,
    gassedCount: gassedMembers.length,
  };
}

/** Projette un `CourseResult` sur les champs "parcours" d'un `ScoreInput`. */
export function courseResultToScoreInput(
  course: CourseResult,
): Pick<ScoreInput, 'hostageSaved' | 'cabinetOpened' | 'room3VideoWatched' | 'gassedCount'> {
  return {
    hostageSaved: course.hostageSaved,
    cabinetOpened: course.cabinetForced,
    room3VideoWatched: course.videoWatched,
    gassedCount: course.gassedCount,
  };
}

export interface ScoreInput {
  winner: Winner;
  playerTeam: TeamId;
  /** Rounds effectivement joues lors de l'affrontement final. */
  rounds: number;
  roundLimit: number;
  /** Coequipiers du joueur encore actifs a la fin (joueur inclus). */
  alliesStanding: number;
  alliesTotal: number;
  /** Adversaires neutralises. */
  enemiesDown: number;
  enemiesTotal: number;

  /* --- Parcours interieur, renseigne par l'epic 2 --- */
  /** L'otage de la salle 1 a-t-il ete sauve. */
  hostageSaved?: boolean;
  /** L'armoire securisee de la salle 2 a-t-elle ete forcee (2e taser). */
  cabinetOpened?: boolean;
  /** Le groupe s'est-il attarde dans le gaz de la salle 3 pour la video. */
  room3VideoWatched?: boolean;
  /** Nombre de cadets gazes en salle 3. */
  gassedCount?: number;
}

export interface ScoreBreakdown {
  label: string;
  points: number;
  max: number;
  /** Commentaire de l'instructeur, reutilise tel quel au bal de promo. */
  comment: string;
}

export interface ExerciseScore {
  total: number;
  max: number;
  /** Mention affichee : "Excellent", "Satisfaisant", ... */
  mention: string;
  breakdown: ScoreBreakdown[];
  /** Etiquettes versees au dossier du candidat. */
  tags: string[];
}

export const SCORE_MAX = 20;

export function scoreExercise(input: ScoreInput): ExerciseScore {
  const breakdown: ScoreBreakdown[] = [];
  const tags: string[] = [];

  /* --- Resultat de l'affrontement : 8 points --- */
  const won = input.winner === input.playerTeam;
  const draw = input.winner === 'draw';
  const resultPoints = won ? 8 : draw ? 4 : 1;
  breakdown.push({
    label: "Résultat de l'affrontement",
    points: resultPoints,
    max: 8,
    comment: won
      ? 'Objectif rempli : équipe adverse neutralisée.'
      : draw
        ? "Aucune équipe n'a pris l'ascendant."
        : 'Équipe mise hors de combat.',
  });
  if (won) tags.push('vainqueur-exercice');
  if (!won && !draw) tags.push('defaite-exercice');

  /* --- Cohesion : 4 points --- */
  const cohesionPoints = Math.min(4, input.alliesStanding * 2);
  breakdown.push({
    label: 'Coéquipiers encore opérationnels',
    points: cohesionPoints,
    max: 4,
    comment:
      input.alliesStanding === input.alliesTotal
        ? 'Aucune perte : cohésion exemplaire.'
        : input.alliesStanding === 0
          ? 'Équipe entièrement neutralisée.'
          : 'Pertes limitées mais réelles.',
  });
  if (input.alliesStanding === input.alliesTotal) tags.push('protecteur');
  if (input.alliesStanding === 0) tags.push('equipe-decimee');

  /* --- Efficacite offensive : 3 points --- */
  const offensePoints = Math.min(3, input.enemiesDown);
  breakdown.push({
    label: 'Adversaires neutralisés',
    points: offensePoints,
    max: 3,
    comment: `${input.enemiesDown}/${input.enemiesTotal} adversaires mis hors jeu.`,
  });
  if (input.enemiesDown === input.enemiesTotal) tags.push('offensif');

  /* --- Rapidite : 3 points --- */
  const fast = Math.ceil(input.roundLimit / 2);
  const medium = Math.ceil((input.roundLimit * 3) / 4);
  const speedPoints =
    input.rounds <= fast ? 3 : input.rounds <= medium ? 2 : input.rounds < input.roundLimit ? 1 : 0;
  breakdown.push({
    label: "Rapidité d'exécution",
    points: speedPoints,
    max: 3,
    comment:
      speedPoints === 3
        ? 'Tempo remarquable.'
        : speedPoints === 0
          ? "Exercice étiré jusqu'à la limite de temps."
          : 'Tempo correct.',
  });
  if (speedPoints === 3) tags.push('rapide');
  if (speedPoints === 0) tags.push('lent');

  /* --- Parcours interieur : 2 points (epic 2) --- */
  let coursePoints = 0;
  const courseNotes: string[] = [];
  if (input.hostageSaved) {
    coursePoints += COURSE_HOSTAGE_POINTS;
    courseNotes.push('otage sauve');
    tags.push('sauveteur');
  }
  if (input.cabinetOpened) {
    coursePoints += COURSE_CABINET_POINTS;
    courseNotes.push('armoire forcee');
    tags.push('curieux');
  }
  if (input.room3VideoWatched) {
    coursePoints += COURSE_VIDEO_POINTS;
    courseNotes.push('video de la salle 3 exploitee');
    tags.push('renseignement');
  }
  if ((input.gassedCount ?? 0) > 0) tags.push('imprudent-salle-3');
  breakdown.push({
    label: 'Parcours intérieur',
    points: Math.min(COURSE_MAX_POINTS, coursePoints),
    max: COURSE_MAX_POINTS,
    comment: courseNotes.length > 0 ? courseNotes.join(', ') + '.' : 'Parcours intérieur non évalué.',
  });

  const total = Math.round(breakdown.reduce((sum, b) => sum + b.points, 0) * 2) / 2;

  return {
    total,
    max: SCORE_MAX,
    mention: mentionFor(total),
    breakdown,
    tags,
  };
}

export function mentionFor(total: number): string {
  if (total >= 17) return 'Excellent';
  if (total >= 14) return 'Très satisfaisant';
  if (total >= 11) return 'Satisfaisant';
  if (total >= 8) return 'Passable';
  return 'Insuffisant';
}

/**
 * Note de l'examen ecrit (scene 3, ADR 0012) : nombre de "meilleures reponses"
 * choisies sur les six questions. Separee de `ExerciseScore` (l'affrontement
 * final) -- deux postes distincts du dossier, voir docs/design/06-SCORING-DOSSIER.md.
 */
export interface WrittenScore {
  correct: number;
  total: number;
}

/** Seuils de mention de la copie ecrite (regle 4 d'AGENTS.md : constantes nommees, jamais un litteral dans une condition). */
export const WRITTEN_SCORE_BRILLIANT_MIN = 5;
export const WRITTEN_SCORE_WEAK_MAX = 2;

/** Etiquettes posees par la note ecrite -- voir le tableau de vocabulaire de 06-SCORING-DOSSIER.md. */
export function writtenScoreTags(score: WrittenScore): string[] {
  const tags: string[] = [];
  if (score.correct >= WRITTEN_SCORE_BRILLIANT_MIN) tags.push('copie-brillante');
  if (score.correct <= WRITTEN_SCORE_WEAK_MAX) tags.push('copie-faible');
  return tags;
}
