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

import type { TeamId, Winner } from '@/tactical/types';

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
    label: 'Resultat de l\'affrontement',
    points: resultPoints,
    max: 8,
    comment: won
      ? 'Objectif rempli : equipe adverse neutralisee.'
      : draw
        ? 'Aucune equipe n\'a pris l\'ascendant.'
        : 'Equipe mise hors de combat.',
  });
  if (won) tags.push('vainqueur-exercice');
  if (!won && !draw) tags.push('defaite-exercice');

  /* --- Cohesion : 4 points --- */
  const cohesionPoints = Math.min(4, input.alliesStanding * 2);
  breakdown.push({
    label: 'Coequipiers encore operationnels',
    points: cohesionPoints,
    max: 4,
    comment:
      input.alliesStanding === input.alliesTotal
        ? 'Aucune perte : cohesion exemplaire.'
        : input.alliesStanding === 0
          ? 'Equipe entierement neutralisee.'
          : 'Pertes limitees mais reelles.',
  });
  if (input.alliesStanding === input.alliesTotal) tags.push('protecteur');
  if (input.alliesStanding === 0) tags.push('equipe-decimee');

  /* --- Efficacite offensive : 3 points --- */
  const offensePoints = Math.min(3, input.enemiesDown);
  breakdown.push({
    label: 'Adversaires neutralises',
    points: offensePoints,
    max: 3,
    comment: `${input.enemiesDown}/${input.enemiesTotal} adversaires mis hors jeu.`,
  });
  if (input.enemiesDown === input.enemiesTotal) tags.push('offensif');

  /* --- Rapidite : 3 points --- */
  const fast = Math.ceil(input.roundLimit / 2);
  const medium = Math.ceil((input.roundLimit * 3) / 4);
  const speedPoints = input.rounds <= fast ? 3 : input.rounds <= medium ? 2 : input.rounds < input.roundLimit ? 1 : 0;
  breakdown.push({
    label: 'Rapidite d\'execution',
    points: speedPoints,
    max: 3,
    comment:
      speedPoints === 3
        ? 'Tempo remarquable.'
        : speedPoints === 0
          ? 'Exercice etire jusqu\'a la limite de temps.'
          : 'Tempo correct.',
  });
  if (speedPoints === 3) tags.push('rapide');
  if (speedPoints === 0) tags.push('lent');

  /* --- Parcours interieur : 2 points (epic 2) --- */
  let coursePoints = 0;
  const courseNotes: string[] = [];
  if (input.hostageSaved) {
    coursePoints += 1;
    courseNotes.push('otage sauve');
    tags.push('sauveteur');
  }
  if (input.cabinetOpened) {
    coursePoints += 0.5;
    courseNotes.push('armoire forcee');
    tags.push('curieux');
  }
  if (input.room3VideoWatched) {
    coursePoints += 0.5;
    courseNotes.push('video de la salle 3 exploitee');
    tags.push('renseignement');
  }
  if ((input.gassedCount ?? 0) > 0) tags.push('imprudent-salle-3');
  breakdown.push({
    label: 'Parcours interieur',
    points: Math.min(2, coursePoints),
    max: 2,
    comment: courseNotes.length > 0 ? courseNotes.join(', ') + '.' : 'Parcours interieur non evalue.',
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
  if (total >= 14) return 'Tres satisfaisant';
  if (total >= 11) return 'Satisfaisant';
  if (total >= 8) return 'Passable';
  return 'Insuffisant';
}
