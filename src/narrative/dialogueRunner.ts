/**
 * Parcours d'un graphe de dialogue. Fonction (quasi-)pure de
 * (graphe, RunState, Dossier, Rng) : le seul effet de bord est la
 * consommation du Rng transmis, exactement comme `check()`. Voir ADR 0011.
 *
 * Regle imposee par le format : aucune exception levee sur donnee invalide.
 * Le validateur (`validate.ts`) est charge d'attraper ca en amont ; a
 * l'execution, toute incoherence retombe sur `finished = true`.
 */

import type { Rng } from '@/core/rng';
import type { Dossier } from '@/core/dossier';
import type { CheckResult } from '@/rules/dice';
import { check } from '@/rules/dice';
import { ATTRIBUTES, DV, SKILL_ATTRIBUTE, SKILL_LABELS } from '@/rules/attributes';
import type { Attribute } from '@/rules/attributes';
import type { CharacterId, CharacterSheet } from '@/rules/character';
import { getCharacter } from '@/rules/character';
import type { CheckSpec, DialogueChoice, DialogueFile, DialogueLine, DialogueNode, SpeakerId } from './types';
import { SPEAKER_LABELS } from './types';
import type { RunState } from './runState';
import { evaluateAll } from './conditions';
import { applyEffects } from './effects';
import { successChance } from './odds';

/** Candidat par defaut d'un jet sans `who` explicite. */
const DEFAULT_ROLLER: CharacterId = 'franklyn';

export interface NarrativeContext {
  dossier: Dossier;
  run: RunState;
}

export interface PresentedCheck {
  skillLabel: string;
  dvLabel: string;
  chancePercent: number;
}

export interface PresentedRollModifier {
  label: string;
  value: number;
}

/**
 * Detail structure du dernier jet resolu -- de quoi faire tomber le tampon
 * RÉUSSI/ÉCHEC avec la chaine de des et les modificateurs nommes
 * (docs/art/UI-DESIGN-SYSTEM.md, section "Dialogue"). `lastRoll` (la version
 * texte, ci-dessous) reste inchange pour ne rien casser : ce champ s'ajoute.
 */
export interface PresentedRoll {
  skillLabel: string;
  skillValue: number;
  /** Code court de l'attribut, ex. "INT" (voir `ATTRIBUTES` dans src/rules/attributes.ts). */
  attribute: string;
  attributeValue: number;
  /** Nom du cadet qui lance le jet, ex. "Franklyn". */
  who: string;
  dv: number;
  /** DV nommee, ex. "NORMALE" -- jamais affichee seule, cf. regle 1 du format de dialogue. */
  dvLabel: string;
  dieFaces: number[];
  dieValue: number;
  exploded: boolean;
  imploded: boolean;
  modifiers: PresentedRollModifier[];
  total: number;
  success: boolean;
  margin: number;
}

/**
 * Resultat d'une tentative de choix ou d'avancee dans le dialogue. Meme forme
 * que `ActionOutcome` (src/tactical/types.ts, `TacticalCombat.perform()`) :
 * une action impossible ne leve jamais d'exception, elle renvoie
 * `{ ok: false, reason }` avec une raison en francais affichable telle quelle
 * (regle 3 d'AGENTS.md).
 */
export interface NarrativeOutcome {
  ok: boolean;
  reason?: string;
}

export interface PresentedChoice {
  /**
   * Index du choix dans le tableau D'ORIGINE `node.choices`, PAS la position
   * dans cette liste PRESENTEE : un choix cache par une condition fausse
   * "saute" son numero. L'appelant DOIT repasser cette valeur telle quelle a
   * `choose()` -- jamais recalculer une position 0..n-1 a partir de la liste
   * affichee. Piege reel, constate en jouant ch1.fourgon / noeud "reactions" :
   * sur trois choix dont deux conditionnes par une affinite, une affinite
   * basse ne presente qu'un seul choix dont l'`index` vaut 2. Appeler
   * `choose(0)` dans ce cas ne correspond a AUCUN choix reellement affiche.
   */
  index: number;
  text: string;
  check?: PresentedCheck;
  /**
   * Vrai UNIQUEMENT si ce choix est `best` dans les donnees ET que le jet de
   * reflexion du noeud (`insight`) vient de reussir (ADR 0012). Jamais
   * presente en attente ni apres un echec -- voir `presentChoices`.
   */
  best?: true;
}

/**
 * Jet de "reflexion" du noeud courant (examen ecrit, ADR 0012) : tant que
 * `status` vaut `'pending'`, `choose()` refuse tout choix -- il faut d'abord
 * appeler `rollInsight()`. `roll` reprend la meme forme que `PresentedRoll`
 * (choix a jet ordinaire) : c'est elle que l'interface rejoue de a a z avec
 * le de 3D.
 */
export interface PresentedInsight extends PresentedCheck {
  status: 'pending' | 'success' | 'failure';
  roll?: PresentedRoll;
  successText?: string;
  failureText?: string;
}

export interface PresentedNode {
  nodeId: string;
  speaker?: SpeakerId;
  speakerLabel?: string;
  text?: string;
  lines: DialogueLine[];
  choices: PresentedChoice[];
  /** Resume lisible du dernier jet, ex. "Perception 14 vs DV 13 — reussite". */
  lastRoll: string | null;
  /** Meme jet que `lastRoll`, sous forme structuree -- voir `PresentedRoll`. */
  lastCheck: PresentedRoll | null;
  /** Jet de reflexion du noeud courant, absent si `node.insight` n'est pas defini. */
  insight?: PresentedInsight;
  finished: boolean;
}

interface ResolvedCheck {
  sheet: CharacterSheet;
  attribute: Attribute;
  attributeValue: number;
  skillValue: number;
  dv: number;
  skillLabel: string;
}

/** Resout un CheckSpec contre les fiches et les tables de regles. `null` si la donnee est invalide. */
function resolveCheckSpec(spec: CheckSpec): ResolvedCheck | null {
  const skillLabel = SKILL_LABELS[spec.skill];
  if (!skillLabel) return null;

  const attribute = spec.attribute ?? SKILL_ATTRIBUTE[spec.skill];
  if (!ATTRIBUTES.includes(attribute)) return null;

  const dv = (DV as Record<string, number | undefined>)[spec.dv];
  if (dv === undefined) return null;

  const sheet = safeCharacter(spec.who ?? DEFAULT_ROLLER);
  if (!sheet) return null;

  return {
    sheet,
    attribute: attribute as Attribute,
    attributeValue: sheet.attributes[attribute as Attribute],
    skillValue: sheet.skills[spec.skill],
    dv,
    skillLabel,
  };
}

/** `getCharacter` leve sur un identifiant inconnu : on l'attrape, jamais de crash sur donnee JSON invalide. */
function safeCharacter(id: CharacterId): CharacterSheet | undefined {
  try {
    return getCharacter(id);
  } catch {
    return undefined;
  }
}

function formatRollSummary(skillLabel: string, result: CheckResult): string {
  const verdict = result.success ? 'reussite' : 'echec';
  return `${skillLabel} ${result.total} vs DV ${result.dv} — ${verdict}`;
}

/**
 * Detail structure d'un jet resolu, partage entre un choix a jet ordinaire
 * (`resolveCheck`) et un jet de reflexion (`rollInsight`) -- meme forme
 * `PresentedRoll`, voir sa doc : l'interface doit pouvoir rejouer les deux de
 * la meme facon avec le de 3D.
 */
function buildPresentedRoll(resolved: ResolvedCheck, dvLabel: string, result: CheckResult): PresentedRoll {
  return {
    skillLabel: resolved.skillLabel,
    skillValue: resolved.skillValue,
    attribute: resolved.attribute,
    attributeValue: resolved.attributeValue,
    who: resolved.sheet.name,
    dv: resolved.dv,
    dvLabel,
    dieFaces: result.die.faces,
    dieValue: result.die.value,
    exploded: result.die.exploded,
    imploded: result.die.imploded,
    modifiers: result.modifiers.map((m) => ({ label: m.label, value: m.value })),
    total: result.total,
    success: result.success,
    margin: result.margin,
  };
}

/** Un noeud terminal n'a ni `to` ni `choices` (regle 7 du format de dialogue). */
function isTerminalNode(node: DialogueNode): boolean {
  return !node.to && (!node.choices || node.choices.length === 0);
}

export class DialogueRunner {
  private readonly file: DialogueFile;
  private readonly rng: Rng;
  private ctx: NarrativeContext;
  private nodeId: string;
  private lastRoll: string | null = null;
  private lastCheck: PresentedRoll | null = null;
  /** Etat du jet de reflexion du noeud COURANT, `null` si `node.insight` est absent. Reinitialise a chaque `enterNode`. */
  private insightStatus: 'pending' | 'success' | 'failure' | null = null;
  private insightRoll: PresentedRoll | null = null;
  private done = false;
  private readonly enteredNodes = new Set<string>();

  constructor(file: DialogueFile, ctx: NarrativeContext, rng: Rng) {
    this.file = file;
    this.ctx = ctx;
    this.rng = rng;
    this.nodeId = file.start;
    this.enterNode(this.nodeId);
  }

  get context(): NarrativeContext {
    return this.ctx;
  }

  get finished(): boolean {
    return this.done;
  }

  current(): PresentedNode {
    const node = this.node();
    return {
      nodeId: this.nodeId,
      speaker: this.file.speaker,
      speakerLabel: this.file.speaker ? SPEAKER_LABELS[this.file.speaker] : undefined,
      text: node?.text,
      lines: node?.lines ?? [],
      choices: node ? this.presentChoices(node) : [],
      lastRoll: this.lastRoll,
      lastCheck: this.lastCheck,
      insight: node ? this.presentInsight(node) : undefined,
      finished: this.done || !node,
    };
  }

  /**
   * Noeud sans choix : avance via `to`. Sans `to`, termine. Ne fait rien si
   * des choix attendent une reponse.
   *
   * Reste en `void` (pas de `NarrativeOutcome`), volontairement, contrairement
   * a `choose()` : le cas "hors contexte" (noeud a choix en attente, dialogue
   * deja termine) n'est atteignable par AUCUN appelant reel aujourd'hui.
   * `NarrativeView` masque le bouton "Continuer" des que `choices.length > 0`
   * (voir narrativeView.ts, `render`/`renderChoices`), et `ChapterApp.advance()`
   * ne delegue ici qu'apres avoir verifie `current().finished`. Le seul autre
   * appelant, l'API de debug, suit le meme garde-fou dans son propre exemple
   * (docs/process/DEBUG_API.md : `choices.length > 0 ? choose(...) : advance()`).
   * `choose(index)`, lui, avait un piege reel et demontre (defaut 1, voir la
   * doc de `PresentedChoice.index`) qui justifiait le changement de contrat :
   * ici il n'y en a pas. Si un appelant hors-UI se met a ignorer ce garde-fou,
   * aligner `advance()` sur `choose()` a ce moment-la.
   */
  advance(): void {
    if (this.done) return;
    const node = this.node();
    if (!node) {
      this.done = true;
      return;
    }
    if (node.choices && node.choices.length > 0) return;
    if (node.to) {
      this.goTo(node.to);
    } else {
      this.done = true;
    }
  }

  /**
   * Selectionne le choix `index` du noeud courant. `index` est l'index
   * D'ORIGINE dans `node.choices` -- toujours passer `choice.index` tel que
   * renvoye par `current().choices` (voir la doc de `PresentedChoice.index`),
   * jamais une position recalculee dans la liste affichee.
   *
   * Un choix indisponible (index inconnu, filtre par ses conditions, ou
   * dialogue deja termine) ne fait jamais rien en silence : il renvoie
   * `{ ok: false, reason }` avec une raison affichable telle quelle,
   * exactement dans l'esprit de `TacticalCombat.perform()` (regle 3
   * d'AGENTS.md). Avant ce correctif, un index filtre etait ignore sans un
   * mot -- voir le defaut 1 du rapport de cloture epic 2.
   */
  choose(index: number): NarrativeOutcome {
    if (this.done) return { ok: false, reason: 'Ce dialogue est terminé.' };
    const node = this.node();
    if (!node) {
      this.done = true;
      return { ok: false, reason: 'Ce dialogue est terminé.' };
    }

    // Jet de reflexion en attente (ADR 0012) : aucun choix n'est selectionnable
    // avant `rollInsight()`, meme celui qui deviendra `best` s'il reussit.
    if (node.insight && this.insightStatus === 'pending') {
      return { ok: false, reason: "Lancez d'abord le dé." };
    }

    // On revalide contre les choix REELLEMENT presentes : un choix cache par
    // une condition fausse ne doit jamais pouvoir etre selectionne.
    const presented = this.presentChoices(node);
    if (!presented.some((c) => c.index === index)) {
      return { ok: false, reason: "Ce choix n'est pas disponible." };
    }

    const raw = (node.choices ?? [])[index];
    if (!raw) {
      // Incoherence de donnees (presente mais absent du tableau source) : ne
      // devrait jamais arriver, presentChoices() derive index de node.choices.
      // Filet de securite -- on termine, comme le reste du moteur face a une
      // donnee invalide (voir l'entete du fichier).
      this.done = true;
      return { ok: false, reason: "Ce choix n'est pas disponible." };
    }

    if (raw.check) {
      this.resolveCheck(raw);
    } else {
      if (raw.effects) this.ctx = applyEffects(raw.effects, this.ctx);
      if (raw.to) this.goTo(raw.to);
      else this.done = true;
    }
    return { ok: true };
  }

  private resolveCheck(choice: DialogueChoice): void {
    const spec = choice.check;
    if (!spec || !choice.onSuccess || !choice.onFailure) {
      this.done = true;
      return;
    }

    const resolved = resolveCheckSpec(spec);
    if (!resolved) {
      this.done = true;
      return;
    }

    const result = check(this.rng, {
      label: `${resolved.skillLabel} (${resolved.sheet.name})`,
      attribute: resolved.attributeValue,
      skill: resolved.skillValue,
      dv: resolved.dv,
    });
    this.lastRoll = formatRollSummary(resolved.skillLabel, result);
    this.lastCheck = buildPresentedRoll(resolved, spec.dv, result);

    if (choice.effects) this.ctx = applyEffects(choice.effects, this.ctx);
    const outcomeEffects = result.success ? choice.successEffects : choice.failureEffects;
    if (outcomeEffects) this.ctx = applyEffects(outcomeEffects, this.ctx);

    this.goTo(result.success ? choice.onSuccess : choice.onFailure);
  }

  /**
   * Resout le jet de reflexion du noeud courant (ADR 0012) : SEUL moment ou
   * le Rng est consomme pour ce jet, exactement comme `resolveCheck` pour un
   * choix a jet ordinaire -- deterministe a graine fixe, aucune animation
   * cote moteur (le de 3D ne fait que rejouer `roll.dieFaces` deja tires).
   * Refuse explicitement si le noeud n'a pas d'`insight`, ou si le jet a deja
   * ete resolu : jamais un second tirage silencieux sur le meme noeud.
   */
  rollInsight(): NarrativeOutcome {
    if (this.done) return { ok: false, reason: 'Ce dialogue est terminé.' };
    const node = this.node();
    if (!node?.insight) return { ok: false, reason: "Ce noeud n'a pas de jet de réflexion." };
    if (this.insightStatus !== 'pending') {
      return { ok: false, reason: 'Le jet de réflexion a déjà été fait.' };
    }

    const spec = node.insight;
    const resolved = resolveCheckSpec(spec);
    if (!resolved) {
      // Donnee invalide : jamais de crash (entete du fichier) -- on traite
      // comme un echec silencieux, aucun choix ne sera revele `best`.
      this.insightStatus = 'failure';
      return { ok: false, reason: 'Jet de réflexion invalide.' };
    }

    const result = check(this.rng, {
      label: `${resolved.skillLabel} (${resolved.sheet.name})`,
      attribute: resolved.attributeValue,
      skill: resolved.skillValue,
      dv: resolved.dv,
    });
    this.insightRoll = buildPresentedRoll(resolved, spec.dv, result);
    this.insightStatus = result.success ? 'success' : 'failure';

    const outcomeEffects = result.success ? spec.successEffects : spec.failureEffects;
    if (outcomeEffects) this.ctx = applyEffects(outcomeEffects, this.ctx);

    return { ok: true };
  }

  private goTo(nodeId: string): void {
    if (!this.file.nodes[nodeId]) {
      this.done = true;
      return;
    }
    this.nodeId = nodeId;
    this.enterNode(nodeId);
  }

  private enterNode(nodeId: string): void {
    const node = this.file.nodes[nodeId];
    if (!node) {
      this.done = true;
      return;
    }

    if (!this.enteredNodes.has(nodeId)) {
      this.enteredNodes.add(nodeId);
      if (node.effects) this.ctx = applyEffects(node.effects, this.ctx);
    }

    // Jet de reflexion : en attente des l'entree dans un noeud qui en porte
    // un (ADR 0012), `null` sinon -- reinitialise a CHAQUE entree, y compris
    // en cas de revisite (aucun noeud du chapitre 1 n'en revisite un, mais le
    // moteur reste correct si un futur graphe le faisait).
    this.insightStatus = node.insight ? 'pending' : null;
    this.insightRoll = null;

    // Noeud terminal (ni `to` ni `choices`) : il rend la main immediatement,
    // sans attendre un `advance()` explicite (regle 7 du format de dialogue).
    if (isTerminalNode(node)) this.done = true;
  }

  private node(): DialogueNode | undefined {
    return this.file.nodes[this.nodeId];
  }

  private presentChoices(node: DialogueNode): PresentedChoice[] {
    // Le choix `best` n'est revele QUE si le jet de reflexion du noeud vient
    // de reussir (ADR 0012) : jamais en attente, jamais apres un echec.
    const revealBest = Boolean(node.insight) && this.insightStatus === 'success';
    const out: PresentedChoice[] = [];
    (node.choices ?? []).forEach((choice, index) => {
      if (choice.conditions && !evaluateAll(choice.conditions, this.ctx)) return;
      const presented: PresentedChoice = { index, text: choice.text, check: this.presentCheck(choice) };
      if (revealBest && choice.best) presented.best = true;
      out.push(presented);
    });
    return out;
  }

  private presentInsight(node: DialogueNode): PresentedInsight | undefined {
    if (!node.insight) return undefined;
    const resolved = resolveCheckSpec(node.insight);
    if (!resolved) return undefined;

    const status = this.insightStatus ?? 'pending';
    const presented: PresentedInsight = {
      skillLabel: resolved.skillLabel,
      dvLabel: node.insight.dv,
      chancePercent: successChance({
        label: resolved.skillLabel,
        attribute: resolved.attributeValue,
        skill: resolved.skillValue,
        dv: resolved.dv,
      }),
      status,
    };
    if (this.insightRoll) presented.roll = this.insightRoll;
    if (status === 'success' && node.insight.successText) presented.successText = node.insight.successText;
    if (status === 'failure' && node.insight.failureText) presented.failureText = node.insight.failureText;
    return presented;
  }

  private presentCheck(choice: DialogueChoice): PresentedCheck | undefined {
    if (!choice.check) return undefined;
    const resolved = resolveCheckSpec(choice.check);
    if (!resolved) return undefined;
    return {
      skillLabel: resolved.skillLabel,
      dvLabel: choice.check.dv,
      chancePercent: successChance({
        label: resolved.skillLabel,
        attribute: resolved.attributeValue,
        skill: resolved.skillValue,
        dv: resolved.dv,
      }),
    };
  }
}
