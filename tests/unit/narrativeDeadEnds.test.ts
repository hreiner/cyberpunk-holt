/**
 * Filet contre le cul-de-sac silencieux.
 *
 * Le format autorise un noeud dont TOUS les choix sont conditionnes (idiome
 * "Continuer." du bal, cf. 07-DIALOGUE-FORMAT.md). Si aucune condition ne passe,
 * le joueur se retrouve devant zero bouton : le chapitre est bloque, et ni le
 * typecheck ni `validateDialogue` ne peuvent le voir, parce que le defaut ne
 * depend pas du graphe mais de l'etat du joueur.
 *
 * On balaie donc chaque noeud avec un echantillon d'etats plausibles et on exige
 * qu'au moins un choix reste offert. Les etats sont tires d'un Rng seede : un
 * echec est reproductible.
 *
 * Depuis le lot 3.4 (ADR 0014 §7), l'etat plausible inclut aussi la composition
 * de l'equipe bleue de Franklyn : une condition `teammate` peut, par
 * construction, laisser un noeud muet pour UNE composition precise sans que
 * rien ne le revele pour les autres -- c'est justement le risque que ce test
 * doit couvrir. On rejoue donc chaque noeud conditionne pour les CINQ
 * compositions reellement atteignables (pas les six mathematiquement
 * possibles, voir le "Correctif lot 3.2" de l'ADR et tests/unit/draft.test.ts).
 */

import { describe, it, expect } from 'vitest';
import { createRng } from '@/core/rng';
import { createDossier, addTags, adjustAffinity } from '@/core/dossier';
import type { Dossier } from '@/core/dossier';
import { CHARACTER_IDS } from '@/rules/character';
import type { CharacterId } from '@/rules/character';
import { DIALOGUES } from '@/data/dialogues/registry';
import { createRunState } from '@/narrative/runState';
import type { TeamRoster } from '@/narrative/runState';
import { evaluateAll } from '@/narrative/conditions';
import type { Condition, DialogueFile, NarrativeContext } from '@/narrative';

/** Nombre d'etats tires par noeud et par composition. Assez pour couvrir les bornes d'affinite. */
const SAMPLES = 20;
const AFFINITY_MIN = -3;
const AFFINITY_MAX = 3;

/**
 * Les CINQ compositions reellement atteignables pour l'equipe de Franklyn
 * (ADR 0014, "Correctif lot 3.2") : "Zachary et Letitia" est structurellement
 * impossible, le tour d'Abigail s'intercalant entre les deux choix de
 * Franklyn et son ordre de preference commencant justement par eux deux.
 * Meme liste que `REACHABLE_PAIRS` dans tests/unit/draft.test.ts -- dupliquee
 * ici (pas importee) pour que ce test reste lisible seul, comme le fichier
 * qu'il remplace.
 */
const REACHABLE_TEAMMATES: Array<[CharacterId, CharacterId]> = [
  ['zachary', 'john'],
  ['zachary', 'grover'],
  ['letitia', 'john'],
  ['letitia', 'grover'],
  ['john', 'grover'],
];

/** Construit le roster complet (bleu + rouge) pour une paire de coequipiers de Franklyn. */
function rosterForTeammates(teammates: [CharacterId, CharacterId]): TeamRoster {
  const pool: CharacterId[] = ['zachary', 'letitia', 'john', 'grover'];
  const red = pool.filter((id) => !teammates.includes(id));
  return { blue: ['franklyn', ...teammates], red: ['abigail', ...red], redCaptain: 'abigail' };
}

/** Toutes les etiquettes et tous les drapeaux qu'un dialogue teste quelque part (hors `teammate`, pilote separement). */
function vocabulary(files: DialogueFile[]): { tags: string[]; flags: string[] } {
  const tags = new Set<string>();
  const flags = new Set<string>();
  const walk = (cond: Condition): void => {
    if ('tag' in cond) tags.add(cond.tag);
    else if ('flag' in cond) flags.add(cond.flag);
    else if ('not' in cond) walk(cond.not);
    else if ('all' in cond) cond.all.forEach(walk);
    else if ('any' in cond) cond.any.forEach(walk);
  };
  for (const file of files) {
    for (const node of Object.values(file.nodes)) {
      for (const choice of node.choices ?? []) (choice.conditions ?? []).forEach(walk);
    }
  }
  return { tags: [...tags], flags: [...flags] };
}

function sampleContext(
  seed: string,
  tags: string[],
  flags: string[],
  teammates: [CharacterId, CharacterId],
): NarrativeContext {
  const rng = createRng(seed);
  let dossier: Dossier = createDossier();
  // Un sous-ensemble aleatoire d'etiquettes, y compris l'ensemble vide.
  const picked = tags.filter(() => rng.next() < 0.5);
  if (picked.length > 0) dossier = addTags(dossier, picked);
  for (const who of CHARACTER_IDS) {
    dossier = adjustAffinity(dossier, who, rng.int(AFFINITY_MIN, AFFINITY_MAX));
  }
  const run = createRunState(seed);
  for (const flag of flags) run.flags[flag] = rng.next() < 0.5;
  run.roster = rosterForTeammates(teammates);
  return { dossier, run };
}

describe('aucun noeud ne laisse le joueur sans option', () => {
  const files = Object.values(DIALOGUES);
  const { tags, flags } = vocabulary(files);

  for (const file of files) {
    const conditioned = Object.entries(file.nodes).filter(([, node]) =>
      (node.choices ?? []).some((c) => (c.conditions ?? []).length > 0),
    );
    if (conditioned.length === 0) continue;

    it(`${file.id} offre toujours au moins un choix, pour les cinq compositions atteignables`, () => {
      for (const teammates of REACHABLE_TEAMMATES) {
        for (const [nodeId, node] of conditioned) {
          const choices = node.choices ?? [];
          for (let i = 0; i < SAMPLES; i++) {
            const ctx = sampleContext(`${file.id}::${nodeId}::${teammates.join('+')}::${i}`, tags, flags, teammates);
            const offered = choices.filter((c) => evaluateAll(c.conditions ?? [], ctx));
            expect(
              offered.length,
              `${file.id} / ${nodeId} : aucun choix offert (equipe ${teammates.join('+')}, tirage ${i})`,
            ).toBeGreaterThan(0);
          }
        }
      }
    });
  }
});
