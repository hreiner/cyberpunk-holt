/**
 * Validation statique d'un graphe de dialogue. Renvoie une liste de messages
 * en francais, vide si tout va bien. Attrape a la "compilation" ce que le
 * DialogueRunner refuse de faire planter a l'execution (voir dialogueRunner.ts
 * et docs/design/07-DIALOGUE-FORMAT.md, section Validation).
 *
 * Prend volontairement `unknown` : un fichier de dialogue est de la donnee
 * JSON, jamais garantie conforme au type avant d'etre passee ici.
 */

import { ATTRIBUTES, DV, SKILLS } from '@/rules/attributes';
import { CHARACTER_IDS } from '@/rules/character';
import type { CharacterId } from '@/rules/character';
import type { SpeakerId } from './types';

const KNOWN_SPEAKERS: string[] = [
  ...CHARACTER_IDS,
  'narrateur',
  'directeur',
  'instructeur',
  'otage',
  'radio',
];
const KNOWN_SKILLS: string[] = [...SKILLS];
const KNOWN_ATTRIBUTES: string[] = [...ATTRIBUTES];
const KNOWN_DV: string[] = Object.keys(DV);

export function validateDialogue(file: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(file)) {
    return ["Le fichier de dialogue n'est pas un objet valide."];
  }

  const id = typeof file.id === 'string' ? file.id : '(sans identifiant)';
  const start = file.start;

  if (typeof start !== 'string') {
    errors.push(`${id} : le champ "start" est manquant ou invalide.`);
  }

  if (!isRecord(file.nodes)) {
    errors.push(`${id} : le champ "nodes" est manquant ou invalide.`);
    return errors;
  }
  const nodes = file.nodes;
  const nodeIds = Object.keys(nodes);

  if (typeof start === 'string' && !nodeIds.includes(start)) {
    errors.push(`${id} : le noeud de depart "${start}" n'existe pas.`);
  }

  if (file.speaker !== undefined && !isKnownSpeaker(file.speaker)) {
    errors.push(`${id} : le locuteur principal "${String(file.speaker)}" est inconnu.`);
  }

  for (const nodeId of nodeIds) {
    const node = nodes[nodeId];
    if (!isRecord(node)) {
      errors.push(`${id}#${nodeId} : le noeud n'est pas un objet valide.`);
      continue;
    }
    validateNode(id, nodeId, node, nodeIds, errors);
  }

  if (typeof start === 'string' && nodeIds.includes(start)) {
    const reachable = reachableFrom(start, nodes);
    for (const nodeId of nodeIds) {
      if (!reachable.has(nodeId)) {
        errors.push(`${id}#${nodeId} : noeud inatteignable depuis "start".`);
      }
    }
  }

  return errors;
}

function validateNode(
  fileId: string,
  nodeId: string,
  node: Record<string, unknown>,
  nodeIds: string[],
  errors: string[],
): void {
  const prefix = `${fileId}#${nodeId}`;

  if (typeof node.to === 'string' && !nodeIds.includes(node.to)) {
    errors.push(`${prefix} : "to" pointe vers un noeud inexistant ("${node.to}").`);
  }

  for (const line of asArray(node.lines)) {
    if (!isRecord(line)) continue;
    if (!isKnownSpeaker(line.who)) {
      errors.push(`${prefix} : locuteur inconnu "${String(line.who)}" dans une replique.`);
    }
  }

  for (const effect of asArray(node.effects)) validateEffect(prefix, effect, errors);

  if (node.insight !== undefined) validateInsight(prefix, node.insight, errors);

  const choices = asArray(node.choices);
  const bestCount = choices.filter((c) => isRecord(c) && c.best === true).length;
  if (bestCount > 1) {
    errors.push(`${prefix} : plus d'un choix "best" (un seul autorise par noeud).`);
  }
  if (bestCount > 0 && node.insight === undefined) {
    errors.push(`${prefix} : "best" n'est autorise que dans un noeud avec "insight".`);
  }

  choices.forEach((choice, index) => {
    validateChoice(prefix, index, choice, nodeIds, errors);
  });
}

/** Le jet de "reflexion" d'un noeud (ADR 0012) : un CheckSpec, plus narration et effets facultatifs. */
function validateInsight(prefix: string, insight: unknown, errors: string[]): void {
  if (!isRecord(insight)) {
    errors.push(`${prefix} : "insight" n'est pas un objet valide.`);
    return;
  }
  validateCheckSpec(`${prefix} (insight)`, insight, errors);
  if (insight.successText !== undefined && typeof insight.successText !== 'string') {
    errors.push(`${prefix} : "insight.successText" doit etre une chaine.`);
  }
  if (insight.failureText !== undefined && typeof insight.failureText !== 'string') {
    errors.push(`${prefix} : "insight.failureText" doit etre une chaine.`);
  }
  for (const effect of asArray(insight.successEffects)) validateEffect(`${prefix} (insight)`, effect, errors);
  for (const effect of asArray(insight.failureEffects)) validateEffect(`${prefix} (insight)`, effect, errors);
}

function validateChoice(
  prefix: string,
  index: number,
  choice: unknown,
  nodeIds: string[],
  errors: string[],
): void {
  const label = `${prefix} choix ${index + 1}`;

  if (!isRecord(choice)) {
    errors.push(`${label} : le choix n'est pas un objet valide.`);
    return;
  }

  if (typeof choice.text !== 'string' || choice.text.trim() === '') {
    errors.push(`${label} : le choix n'a pas de texte.`);
  }

  if (typeof choice.to === 'string' && !nodeIds.includes(choice.to)) {
    errors.push(`${label} : "to" pointe vers un noeud inexistant ("${choice.to}").`);
  }

  if (choice.check !== undefined) {
    if (!isRecord(choice.check)) {
      errors.push(`${label} : "check" n'est pas un objet valide.`);
    } else {
      validateCheckSpec(label, choice.check, errors);
    }

    if (typeof choice.onSuccess !== 'string') {
      errors.push(`${label} : un choix a jet doit avoir "onSuccess".`);
    } else if (!nodeIds.includes(choice.onSuccess)) {
      errors.push(`${label} : "onSuccess" pointe vers un noeud inexistant ("${choice.onSuccess}").`);
    }

    if (typeof choice.onFailure !== 'string') {
      errors.push(`${label} : un choix a jet doit avoir "onFailure".`);
    } else if (!nodeIds.includes(choice.onFailure)) {
      errors.push(`${label} : "onFailure" pointe vers un noeud inexistant ("${choice.onFailure}").`);
    }
  }

  if (choice.best !== undefined && choice.best !== true) {
    errors.push(`${label} : "best" doit valoir true.`);
  }

  for (const effect of asArray(choice.effects)) validateEffect(label, effect, errors);
  for (const effect of asArray(choice.successEffects)) validateEffect(label, effect, errors);
  for (const effect of asArray(choice.failureEffects)) validateEffect(label, effect, errors);
}

function validateCheckSpec(label: string, spec: Record<string, unknown>, errors: string[]): void {
  if (typeof spec.skill !== 'string' || !KNOWN_SKILLS.includes(spec.skill)) {
    errors.push(`${label} : competence inconnue "${String(spec.skill)}".`);
  }

  if (spec.attribute !== undefined) {
    if (typeof spec.attribute !== 'string' || !KNOWN_ATTRIBUTES.includes(spec.attribute)) {
      errors.push(`${label} : attribut inconnu "${String(spec.attribute)}".`);
    }
  }

  if (typeof spec.dv === 'number') {
    errors.push(`${label} : la DV est ecrite en nombre, elle doit etre nommee (ex. "NORMALE").`);
  } else if (typeof spec.dv !== 'string' || !KNOWN_DV.includes(spec.dv)) {
    errors.push(`${label} : DV inconnue "${String(spec.dv)}".`);
  }

  if (spec.who !== undefined && !isCharacterId(spec.who)) {
    errors.push(`${label} : personnage inconnu "${String(spec.who)}" pour le jet.`);
  }
}

function validateEffect(prefix: string, effect: unknown, errors: string[]): void {
  if (!isRecord(effect)) return;

  if ('affinity' in effect && isRecord(effect.affinity) && !isCharacterId(effect.affinity.who)) {
    errors.push(`${prefix} : personnage inconnu "${String(effect.affinity.who)}" dans un effet d'affinite.`);
  }

  if (
    'team' in effect &&
    isRecord(effect.team) &&
    'gassed' in effect.team &&
    !isCharacterId(effect.team.gassed)
  ) {
    errors.push(`${prefix} : personnage inconnu "${String(effect.team.gassed)}" dans un effet d'equipe.`);
  }

  if ('writtenScore' in effect) {
    const spec = effect.writtenScore;
    if (!isRecord(spec) || typeof spec.counterKey !== 'string' || typeof spec.total !== 'number') {
      errors.push(`${prefix} : effet "writtenScore" invalide (attend { counterKey: string, total: number }).`);
    }
  }
}

function reachableFrom(start: string, nodes: Record<string, unknown>): Set<string> {
  const seen = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || seen.has(current)) continue;
    seen.add(current);

    const node = nodes[current];
    if (!isRecord(node)) continue;

    if (typeof node.to === 'string') stack.push(node.to);
    for (const choice of asArray(node.choices)) {
      if (!isRecord(choice)) continue;
      if (typeof choice.to === 'string') stack.push(choice.to);
      if (typeof choice.onSuccess === 'string') stack.push(choice.onSuccess);
      if (typeof choice.onFailure === 'string') stack.push(choice.onFailure);
    }
  }

  return seen;
}

function isKnownSpeaker(value: unknown): value is SpeakerId {
  return typeof value === 'string' && KNOWN_SPEAKERS.includes(value);
}

function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && (CHARACTER_IDS as string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
