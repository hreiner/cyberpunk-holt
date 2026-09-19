/**
 * Resolution hors champ du parcours de l'equipe adverse (scene 7, section
 * "L'equipe adverse, hors champ" de docs/design/03-CHAPTER-1.md).
 *
 * L'equipe adverse fait le meme parcours que le joueur, en parallele, mais on
 * ne le joue pas : quelques jets reels suffisent, sur les vraies fiches des
 * cadets concernes (`getCharacter`), avec des DV nommees (`DV`). Chaque jet
 * est confie au cadet le plus competent de l'equipe pour la tache -- c'est ce
 * que ferait une equipe sensee, exactement le principe deja retenu par
 * `assignLoadout` dans src/tactical/combat.ts.
 *
 * Le resultat fixe l'etat complet de l'equipe adverse a l'affrontement final
 * (`TeamState`), deja branche sur le moteur de combat. La video de la salle 3
 * (cf. ch1.salle3.json, noeud "video-recuperee") est la recompense du dilemme
 * du joueur : elle revele ce que `resolveOffscreenRun` a reellement produit.
 */

import type { Rng } from '@/core/rng';
import type { Skill } from '@/rules/attributes';
import { DV, SKILL_ATTRIBUTE } from '@/rules/attributes';
import type { CharacterId } from '@/rules/character';
import { getCharacter } from '@/rules/character';
import { check } from '@/rules/dice';
import { defaultTeamState } from '@/tactical/combat';
import type { TeamState } from '@/tactical/types';

/**
 * Tempo consomme quand l'equipe adverse force l'armoire securisee de la
 * salle 2 -- miroir de l'effet `{ "tempo": 2 }` du choix correspondant dans
 * ch1.salle2.json.
 */
export const OFFSCREEN_CABINET_TEMPO_COST = 2;

/**
 * Tempo consomme quand l'equipe adverse s'attarde dans le gaz de la salle 3
 * pour fouiller le terminal -- miroir de l'effet `{ "tempo": 2 }` du choix
 * correspondant dans ch1.salle3.json.
 */
export const OFFSCREEN_ROOM3_TEMPO_COST = 2;

/** Drapeau pose quand la video de la salle 3 a ete exploitee (ch1.salle3.json, noeud "video-recuperee"). */
export const FLAG_ADVERSE_TASER = 'ch1.adverse.taser-supplementaire';
/** Idem, pour le membre gaze. */
export const FLAG_ADVERSE_GASSED = 'ch1.adverse.membre-gaze';

export interface OffscreenOutcome {
  /** Etat de l'equipe rouge a l'affrontement final. */
  teamState: TeamState;
  /** Ce que la video de la salle 3 revele, dans l'ordre chronologique. */
  log: string[];
  /** Tempo consomme par l'equipe adverse : sert a comparer les deux equipes. */
  tempo: number;
}

/** Le cadet le plus competent de l'equipe pour une competence donnee (memes regles que `assignLoadout`). */
function bestAt(ids: CharacterId[], skill: Skill): CharacterId {
  const attribute = SKILL_ATTRIBUTE[skill];
  const sorted = [...ids].sort((a, b) => {
    const sa = getCharacter(a);
    const sb = getCharacter(b);
    const totalA = sa.attributes[attribute] + sa.skills[skill];
    const totalB = sb.attributes[attribute] + sb.skills[skill];
    return totalB - totalA || a.localeCompare(b);
  });
  const first = sorted[0];
  if (!first) throw new Error('resolveOffscreenRun : equipe vide');
  return first;
}

/** Jet reel sur la fiche du cadet designe, DV nommee. */
function rollSkill(rng: Rng, id: CharacterId, skill: Skill, dv: number, label: string) {
  const sheet = getCharacter(id);
  const attribute = SKILL_ATTRIBUTE[skill];
  return check(rng, {
    label,
    attribute: sheet.attributes[attribute],
    skill: sheet.skills[skill],
    dv,
  });
}

export function resolveOffscreenRun(rng: Rng, ids: CharacterId[]): OffscreenOutcome {
  const log: string[] = [];
  let tempo = 0;
  const base = defaultTeamState();
  let healkits = base.healkits;
  let extraTaser = base.extraTaser;
  const gassedMembers: CharacterId[] = [...base.gassedMembers];

  /* --- Salle 1 : la porte et le chien --- */
  const spotter = bestAt(ids, 'perception');
  const spotCheck = rollSkill(rng, spotter, 'perception', DV.NORMALE, 'Repérage dans la fumée (équipe adverse)');
  if (spotCheck.success) {
    const shooter = bestAt(ids, 'armesDePoing');
    const shotCheck = rollSkill(rng, shooter, 'armesDePoing', DV.DIFFICILE, 'Tir sur le chien (équipe adverse)');
    if (shotCheck.success) {
      healkits += 1;
      log.push(
        `${getCharacter(shooter).name} a abattu le chien avant qu'il n'atteigne l'otage : l'équipe rouge récupère un kit de soin.`,
      );
    } else {
      log.push(
        `${getCharacter(shooter).name} a manqué le chien : l'otage de la salle un n'a pas été secouru par l'équipe rouge.`,
      );
    }
  } else {
    log.push("L'équipe rouge n'a pas repéré le chien à temps dans la fumée de la salle un.");
  }

  /* --- Salle 2 : le choix couteux --- */
  // La decision de tenter l'armoire est elle-meme un jet (piratage du meilleur
  // technicien) plutot qu'un tirage arbitraire : une equipe sensee ne s'y
  // attarde que si elle juge le verrou a sa portee. Si elle tente sa chance,
  // le tempo est consomme qu'elle reussisse ou non -- comme pour le joueur.
  const hacker = bestAt(ids, 'piratage');
  const attemptCheck = rollSkill(rng, hacker, 'piratage', DV.NORMALE, "Évaluation de l'armoire (équipe adverse)");
  if (attemptCheck.success) {
    tempo += OFFSCREEN_CABINET_TEMPO_COST;
    const forceCheck = rollSkill(rng, hacker, 'piratage', DV.DIFFICILE, "Forçage de l'armoire (équipe adverse)");
    if (forceCheck.success) {
      extraTaser = true;
      log.push(
        `${getCharacter(hacker).name} a forcé l'armoire sécurisée : l'équipe rouge dispose d'un second taser.`,
      );
    } else {
      log.push(
        `${getCharacter(hacker).name} a tenté de forcer l'armoire sécurisée sans succès : temps perdu pour rien.`,
      );
    }
  } else {
    log.push("L'équipe rouge a laissé l'armoire sécurisée fermée et fonce droit vers la porte.");
  }

  /* --- Salle 3 : le gaz et la video --- */
  // L'equipe s'attarde pour fouiller le terminal (symetrique du dilemme du
  // joueur) : chaque cadet encaisse un jet de Resistance individuel, et TOUS
  // les cadets touches restent gazes pour l'affrontement final (defaut 3 du
  // rapport de cloture epic 2 : un seul jet gagnant ne protege pas les autres).
  tempo += OFFSCREEN_ROOM3_TEMPO_COST;
  for (const id of ids) {
    const resistCheck = rollSkill(
      rng,
      id,
      'resistance',
      DV.DIFFICILE,
      `Tenue dans le gaz, ${getCharacter(id).name} (équipe adverse)`,
    );
    if (!resistCheck.success) gassedMembers.push(id);
  }
  if (gassedMembers.length > 0) {
    const names = gassedMembers.map((gassedId) => getCharacter(gassedId).name).join(', ');
    log.push(`${names} ${gassedMembers.length > 1 ? 'ont été gazés' : 'a été gazé'} en salle trois en tenant jusqu'au terminal.`);
  } else {
    log.push("L'équipe rouge a résisté au gaz et fouillé le terminal de la salle trois sans perte.");
  }

  return {
    teamState: { healkits, extraTaser, gassedMembers },
    log,
    tempo,
  };
}

/** Drapeaux a poser dans le RunState quand la video de la salle 3 a ete exploitee. */
export function offscreenFlags(outcome: OffscreenOutcome): Record<string, string | number | boolean> {
  return {
    [FLAG_ADVERSE_TASER]: outcome.teamState.extraTaser,
    [FLAG_ADVERSE_GASSED]: outcome.teamState.gassedMembers.length > 0,
  };
}
