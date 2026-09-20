/**
 * Regression du lot 3.4 (ADR 0014 §7) : dans le fourgon et les trois salles,
 * une replique de coequipier ne doit plus jamais nommer un cadet en dur si sa
 * presence n'est pas GARANTIE par la composition de l'equipe -- sinon un
 * joueur qui n'a pas pris ce cadet l'entend parler alors qu'il est reste a
 * l'academie ou est passe chez Abigail (le defaut original que ce lot repare).
 *
 * "Garanti" veut dire : tout chemin depuis `start` qui mene a ce noeud passe
 * par au moins une condition `{ "teammate": X }` (top-level ou dans un `all`)
 * sur ce cadet precis. On calcule ca par une petite analyse de flot sur le
 * graphe (intersection des garanties de tous les chemins entrants -- une
 * garantie qui ne vaut que sur UN chemin sur deux n'en est pas une), plutot
 * que de chercher `"who": "john"` a l'aveugle : le format autorise a dessein
 * des noeuds ou `who` nomme un cadet precis (les variantes voulues par ce lot),
 * tant qu'ils ne sont atteignables QUE quand ce cadet est dans l'equipe.
 */

import { describe, it, expect } from 'vitest';
import type { CharacterId } from '@/rules/character';
import type { Condition, DialogueFile } from '@/narrative';
import { DIALOGUES } from '@/data/dialogues/registry';

/** Les quatre cadets dont la presence varie selon le tirage (ADR 0014) -- jamais Franklyn (toujours present) ni Abigail (jamais dans l'equipe bleue). */
const DRAFTABLE_TEAMMATES: readonly CharacterId[] = ['zachary', 'letitia', 'john', 'grover'];

/** Fichiers concernes par ce lot : le fourgon et les trois salles du parcours interieur. */
const FILE_IDS = ['ch1.fourgon', 'ch1.salle1', 'ch1.salle2', 'ch1.salle3'];
const FILES: DialogueFile[] = FILE_IDS.map((id) => {
  const file = DIALOGUES[id];
  if (!file) throw new Error(`Fichier de dialogue introuvable dans le registre : ${id}`);
  return file;
});

/** Cadets dont la presence est garantie par une condition (top-level ou `all` imbrique -- jamais `not`/`any`, qui ne garantissent rien). */
function conditionTeammates(cond: Condition): CharacterId[] {
  if ('teammate' in cond) return [cond.teammate];
  if ('all' in cond) return cond.all.flatMap(conditionTeammates);
  return [];
}

function edgeGuarantees(conditions: Condition[] | undefined): Set<CharacterId> {
  const out = new Set<CharacterId>();
  for (const cond of conditions ?? []) {
    for (const teammate of conditionTeammates(cond)) out.add(teammate);
  }
  return out;
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((x) => b.has(x)));
}

interface Edge {
  from: string;
  to: string;
  conditions?: Condition[];
}

function collectEdges(file: DialogueFile): Edge[] {
  const edges: Edge[] = [];
  for (const [nodeId, node] of Object.entries(file.nodes)) {
    if (node.to) edges.push({ from: nodeId, to: node.to });
    for (const choice of node.choices ?? []) {
      if (choice.to) edges.push({ from: nodeId, to: choice.to, conditions: choice.conditions });
      if (choice.onSuccess) edges.push({ from: nodeId, to: choice.onSuccess, conditions: choice.conditions });
      if (choice.onFailure) edges.push({ from: nodeId, to: choice.onFailure, conditions: choice.conditions });
    }
  }
  return edges;
}

/**
 * Garanties de composition d'equipe par noeud : l'intersection, sur tous les
 * chemins entrants depuis `start`/`entries`, des cadets confirmes par une
 * condition `teammate`. Point fixe iteratif (les ensembles ne peuvent que
 * retrecir), suffisant pour ces petits graphes sans cycle.
 */
function computeGuaranteed(file: DialogueFile): Map<string, Set<CharacterId>> {
  const guaranteed = new Map<string, Set<CharacterId>>();
  const starts = [file.start, ...(file.entries ?? [])].filter((id) => file.nodes[id]);
  for (const start of starts) guaranteed.set(start, new Set());

  const edges = collectEdges(file);
  const nodeCount = Object.keys(file.nodes).length;
  let changed = true;
  let iterations = 0;
  while (changed && iterations < nodeCount + edges.length + 5) {
    changed = false;
    iterations++;
    for (const edge of edges) {
      const fromSet = guaranteed.get(edge.from);
      if (!fromSet) continue;
      const via = new Set([...fromSet, ...edgeGuarantees(edge.conditions)]);
      const existing = guaranteed.get(edge.to);
      if (!existing) {
        guaranteed.set(edge.to, via);
        changed = true;
      } else {
        const merged = intersect(existing, via);
        if (merged.size !== existing.size) {
          guaranteed.set(edge.to, merged);
          changed = true;
        }
      }
    }
  }
  return guaranteed;
}

describe('aucune replique de coequipier ne nomme un cadet en dur sans garantie (ADR 0014 §7, lot 3.4)', () => {
  for (const file of FILES) {
    it(`${file.id} : chaque "who" de coequipier est couvert par une condition "teammate"`, () => {
      const guaranteed = computeGuaranteed(file);
      const violations: string[] = [];

      for (const [nodeId, node] of Object.entries(file.nodes)) {
        for (const line of node.lines ?? []) {
          if (!DRAFTABLE_TEAMMATES.includes(line.who as CharacterId)) continue;
          const set = guaranteed.get(nodeId);
          if (!set || !set.has(line.who as CharacterId)) {
            violations.push(`${file.id}#${nodeId} : "who": "${line.who}" sans garantie de presence dans l'equipe.`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  }
});
