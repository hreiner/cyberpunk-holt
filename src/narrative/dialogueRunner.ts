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
import { addEntry } from '@/core/dossier';
import type { CheckResult } from '@/rules/dice';
import { check } from '@/rules/dice';
import { ATTRIBUTES, DV, SKILL_ATTRIBUTE, SKILL_LABELS } from '@/rules/attributes';
import type { Attribute, DifficultyName } from '@/rules/attributes';
import type { CharacterId, CharacterSheet } from '@/rules/character';
import { getCharacter } from '@/rules/character';
import type { CheckSpec, DialogueChoice, DialogueFile, DialogueNode, InsightSpec, SpeakerId } from './types';
import { SPEAKER_LABELS } from './types';
import type { RunState } from './runState';
import { bumpCounter } from './runState';
import { evaluateAll } from './conditions';
import { applyEffects, NARRATIVE_CHAPTER } from './effects';
import { applyTemplates, resolveSpeakerAlias, resolveWhoAlias } from './aliases';
import { successChance } from './odds';

/** Candidat par defaut d'un jet sans `who` explicite. */
const DEFAULT_ROLLER: CharacterId = 'franklyn';

/** Cle de dossier de la Chance depensee (ADR 0015 §2) -- une seule entree, valeur = total cumule. */
const LUCK_ENTRY_KEY = 'ch1.chance';
/** Compteur de RunState qui porte ce total cumule -- volatil, la trace persistante est l'entree ci-dessus. */
const LUCK_SPENT_COUNTER = 'ch1.chance.total';

const AWAITING_LUCK_REASON = 'Un jet de Chance est en attente : dépensez-la ou acceptez le résultat.';

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
  /** Points de Chance depenses pour transformer cet echec en reussite (ADR 0015 §2). Absent hors Chance. */
  luckSpent?: number;
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
 * Jet de "reflexion" du noeud courant (examen ecrit, ADR 0012 ; facultatif
 * avec cout, ADR 0015 §1) : tant que `status` vaut `'pending'`, `choose()`
 * refuse tout choix -- il faut d'abord appeler `rollInsight()`. Avec
 * `optional: true`, le statut initial est `'available'` : `choose()`
 * fonctionne directement, `rollInsight()` reste possible en plus (et consomme
 * `cost` s'il est defini). `roll` reprend la meme forme que `PresentedRoll`
 * (choix a jet ordinaire) : c'est elle que l'interface rejoue de a a z avec
 * le de 3D.
 */
export interface PresentedInsight extends PresentedCheck {
  status: 'pending' | 'available' | 'success' | 'failure';
  /** Vrai si ce jet est facultatif (ADR 0015 §1). Absent = mandatory, comportement ADR 0012 inchange. */
  optional?: true;
  /** Cout en compteur de `RunState.flags`, consomme par `rollInsight()`. Absent si `insight.cost` n'est pas defini. */
  cost?: { counter: string; amount: number };
  /** Vrai si le compteur de `cost` suffit actuellement. Absent si `cost` n'est pas defini. */
  affordable?: boolean;
  roll?: PresentedRoll;
  successText?: string;
  failureText?: string;
}

/**
 * Replique presentee : `who` est TOUJOURS un `SpeakerId` deja resolu (jamais
 * un alias d'equipe, voir `DialogueRunner.presentLines`) -- distinct de
 * `DialogueLine` (donnee brute, qui autorise l'alias) pour que le typage
 * garantisse cette invariant aux consommateurs (`src/ui/narrativeView.ts`, API
 * de debug).
 */
export interface PresentedLine {
  who: SpeakerId;
  text: string;
}

export interface PresentedNode {
  nodeId: string;
  speaker?: SpeakerId;
  speakerLabel?: string;
  text?: string;
  lines: PresentedLine[];
  choices: PresentedChoice[];
  /** Resume lisible du dernier jet, ex. "Perception 14 vs DV 13 — reussite". */
  lastRoll: string | null;
  /** Meme jet que `lastRoll`, sous forme structuree -- voir `PresentedRoll`. */
  lastCheck: PresentedRoll | null;
  /** Jet de reflexion du noeud courant, absent si `node.insight` n'est pas defini. */
  insight?: PresentedInsight;
  /**
   * Jet de Franklyn rate de peu et rattrapable a la Chance (ADR 0015 §2) :
   * tant que ce champ est present, la navigation vers `onSuccess`/`onFailure`
   * (ou le statut de l'insight) reste EN ATTENTE -- voir `spendLuck`/`acceptRoll`.
   * `roll` contient la chaine de des complete pour que le de 3D puisse la
   * rejouer avant d'afficher l'invite de Chance.
   */
  pendingRoll?: { roll: PresentedRoll; missingBy: number; luckAvailable: number };
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

/** `who` deja resolu (alias d'equipe converti en CharacterId, voir `DialogueRunner.resolveCheckSpecAliased`). */
interface ResolvableCheckSpec {
  skill: CheckSpec['skill'];
  attribute?: Attribute;
  dv: CheckSpec['dv'];
  who?: CharacterId;
}

/** Resout un CheckSpec (who deja resolu) contre les fiches et les tables de regles. `null` si la donnee est invalide. */
function resolveCheckSpec(spec: ResolvableCheckSpec): ResolvedCheck | null {
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

/**
 * DV effective d'un jet (ADR 0015 §3) : `spec.dvByCounter` l'emporte sur
 * `spec.dv` des que son compteur existe dans `RunState.flags` --
 * `levels[min(valeur, levels.length - 1)]`, jamais un index negatif (valeur
 * absente ou negative traitee comme 0). Repli sur `spec.dv` si `dvByCounter`
 * est absent, si `levels` est vide, ou sur toute donnee invalide (jamais de
 * crash, meme esprit que le reste du moteur). Fonction pure : ni Rng ni effet
 * de bord, appelable a la fois pour RESOUDRE un jet et pour l'AFFICHER
 * (`presentCheck`/`presentInsight`) sans jamais diverger entre les deux.
 */
function effectiveDvName(spec: CheckSpec, run: RunState): DifficultyName {
  if (!spec.dvByCounter || spec.dvByCounter.levels.length === 0) return spec.dv;
  const raw = run.flags[spec.dvByCounter.counter];
  const value = typeof raw === 'number' ? Math.max(0, raw) : 0;
  const idx = Math.min(value, spec.dvByCounter.levels.length - 1);
  return spec.dvByCounter.levels[idx] ?? spec.dv;
}

/** `getCharacter` leve sur un identifiant inconnu : on l'attrape, jamais de crash sur donnee JSON invalide. */
function safeCharacter(id: CharacterId): CharacterSheet | undefined {
  try {
    return getCharacter(id);
  } catch {
    return undefined;
  }
}

function formatRollSummary(skillLabel: string, total: number, dv: number, success: boolean): string {
  const verdict = success ? 'reussite' : 'echec';
  return `${skillLabel} ${total} vs DV ${dv} — ${verdict}`;
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

/**
 * Un noeud d'AIGUILLAGE : rien a lire (ni narration, ni replique, ni jet de reflexion), il
 * n'existe que pour envoyer le joueur vers la bonne branche selon ses conditions. Affiche tel
 * quel, il donne un panneau vide surmonte d'un "Continuer" -- defaut constate en jeu dans le
 * fourgon (noeud `avant-dispute`) : "un ecran vide a un moment ou il faut cliquer Continuer
 * sans rien du tout". Le runner les traverse donc sans jamais s'arreter (`followRouting`), et
 * le validateur verifie qu'un noeud muet ne sert bien qu'a ca (voir validate.ts).
 */
function isRoutingNode(node: DialogueNode): boolean {
  if (isTerminalNode(node)) return false;
  return node.text === undefined && (node.lines?.length ?? 0) === 0 && node.insight === undefined;
}

/**
 * Garde-fou : un cycle d'aiguillages (donnee invalide) ne doit pas boucler a l'infini. Au-dela,
 * on rend la main au noeud courant -- l'ecran sera vide, mais le jeu repond encore.
 */
const MAX_ROUTING_HOPS = 16;

/**
 * Ce qu'il faut pour resoudre l'issue DIFFEREE d'un jet en attente de Chance
 * (ADR 0015 §2) : soit un choix a jet ordinaire (navigation `onSuccess`/
 * `onFailure`), soit le jet de reflexion du noeud courant (statut de
 * l'insight). Voir `maybeEnterAwaitingLuck`/`finishCheck`.
 */
type PendingLuckTarget = { kind: 'choice'; choice: DialogueChoice } | { kind: 'insight'; spec: InsightSpec };

export interface DialogueRunnerOptions {
  /**
   * Noeud de depart different de `file.start` (entites d'exploration, lot
   * 3.5+ : `dialogueId` + `startNode`). Doit exister dans `file.nodes` --
   * sinon repli silencieux sur `file.start`, jamais un crash sur une
   * configuration invalide (meme esprit que le reste du moteur).
   */
  startNode?: string;
}

export class DialogueRunner {
  private readonly file: DialogueFile;
  private readonly rng: Rng;
  private ctx: NarrativeContext;
  private nodeId: string;
  private lastRoll: string | null = null;
  private lastCheck: PresentedRoll | null = null;
  /** Etat du jet de reflexion du noeud COURANT, `null` si `node.insight` est absent. Reinitialise a chaque `enterNode`. */
  private insightStatus: 'pending' | 'available' | 'success' | 'failure' | null = null;
  private insightRoll: PresentedRoll | null = null;
  private done = false;
  private readonly enteredNodes = new Set<string>();

  /** Etat de l'attente de Chance (ADR 0015 §2) -- voir `PresentedNode.pendingRoll`. */
  private awaitingLuck = false;
  private awaitingRoll: PresentedRoll | null = null;
  private awaitingMissingBy = 0;
  private awaitingTarget: PendingLuckTarget | null = null;

  constructor(file: DialogueFile, ctx: NarrativeContext, rng: Rng, options: DialogueRunnerOptions = {}) {
    this.file = file;
    this.ctx = ctx;
    this.rng = rng;
    const requestedStart = options.startNode;
    this.nodeId = requestedStart && file.nodes[requestedStart] ? requestedStart : file.start;
    this.enterNode(this.nodeId);
    this.followRouting();
  }

  get context(): NarrativeContext {
    return this.ctx;
  }

  get finished(): boolean {
    return this.done;
  }

  current(): PresentedNode {
    const node = this.node();
    const out: PresentedNode = {
      nodeId: this.nodeId,
      speaker: this.file.speaker,
      speakerLabel: this.file.speaker ? SPEAKER_LABELS[this.file.speaker] : undefined,
      text: node?.text !== undefined ? applyTemplates(node.text, this.ctx.run) : undefined,
      lines: node ? this.presentLines(node) : [],
      choices: node ? this.presentChoices(node) : [],
      lastRoll: this.lastRoll,
      lastCheck: this.lastCheck,
      insight: node ? this.presentInsight(node) : undefined,
      finished: this.done || !node,
    };
    if (this.awaitingLuck && this.awaitingRoll) {
      out.pendingRoll = {
        roll: this.awaitingRoll,
        missingBy: this.awaitingMissingBy,
        luckAvailable: this.ctx.run.luck,
      };
    }
    return out;
  }

  /**
   * Noeud sans choix : avance via `to`. Sans `to`, termine. Ne fait rien si
   * des choix attendent une reponse, ni si un jet de Chance est en attente
   * (ADR 0015 §2) -- reste volontairement en `void` (voir `choose()` pour le
   * contrat `NarrativeOutcome` la ou un vrai appelant peut se tromper) :
   * l'invite de Chance est un CHOIX explicite (`spendLuck`/`acceptRoll`),
   * jamais quelque chose qu'`advance()` doit debloquer.
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
    if (this.awaitingLuck) return;
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
    if (this.awaitingLuck) return { ok: false, reason: AWAITING_LUCK_REASON };
    const node = this.node();
    if (!node) {
      this.done = true;
      return { ok: false, reason: 'Ce dialogue est terminé.' };
    }

    // Jet de reflexion MANDATORY en attente (ADR 0012) : aucun choix n'est
    // selectionnable avant `rollInsight()`. Un jet FACULTATIF (ADR 0015 §1,
    // statut 'available') n'est PAS bloquant : on peut repondre directement.
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

    const resolved = this.resolveCheckSpecAliased(spec);
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
    const presented = buildPresentedRoll(resolved, effectiveDvName(spec, this.ctx.run), result);
    this.lastRoll = formatRollSummary(resolved.skillLabel, result.total, result.dv, result.success);
    this.lastCheck = presented;

    // "Applique dans tous les cas" (regle du format) : ne depend jamais de
    // l'issue, donc jamais differe par une eventuelle attente de Chance.
    if (choice.effects) this.ctx = applyEffects(choice.effects, this.ctx);

    if (this.maybeEnterAwaitingLuck(resolved, presented, result, { kind: 'choice', choice })) return;

    this.finishCheck(result.success, { kind: 'choice', choice });
  }

  /**
   * Resout le jet de reflexion du noeud courant (ADR 0012 ; facultatif avec
   * cout, ADR 0015 §1) : SEUL moment ou le Rng est consomme pour ce jet,
   * exactement comme `resolveCheck` pour un choix ordinaire -- deterministe a
   * graine fixe, aucune animation cote moteur (le de 3D ne fait que rejouer
   * `roll.dieFaces` deja tires). Refuse explicitement si le noeud n'a pas
   * d'`insight`, si le jet a deja ete resolu, ou (facultatif) si le compteur
   * de `cost` est insuffisant -- jamais un second tirage silencieux, jamais
   * une consommation sans effet.
   */
  rollInsight(): NarrativeOutcome {
    if (this.done) return { ok: false, reason: 'Ce dialogue est terminé.' };
    if (this.awaitingLuck) return { ok: false, reason: AWAITING_LUCK_REASON };
    const node = this.node();
    if (!node?.insight) return { ok: false, reason: "Ce noeud n'a pas de jet de réflexion." };
    if (this.insightStatus !== 'pending' && this.insightStatus !== 'available') {
      return { ok: false, reason: 'Le jet de réflexion a déjà été fait.' };
    }

    const spec = node.insight;
    if (spec.optional && spec.cost) {
      const current = this.ctx.run.flags[spec.cost.counter];
      const currentAmount = typeof current === 'number' ? current : 0;
      if (currentAmount < spec.cost.amount) {
        return { ok: false, reason: 'Plus de concentration.' };
      }
      this.ctx = { ...this.ctx, run: bumpCounter(this.ctx.run, spec.cost.counter, -spec.cost.amount) };
    }

    const resolved = this.resolveCheckSpecAliased(spec);
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
    const presented = buildPresentedRoll(resolved, effectiveDvName(spec, this.ctx.run), result);
    this.insightRoll = presented;

    if (this.maybeEnterAwaitingLuck(resolved, presented, result, { kind: 'insight', spec })) {
      return { ok: true };
    }

    this.finishCheck(result.success, { kind: 'insight', spec });
    return { ok: true };
  }

  /**
   * Transforme un jet de Chance en attente en reussite (ADR 0015 §2) : `n`
   * doit couvrir au moins `missingBy` (marge manquante) et ne pas depasser la
   * Chance restante -- on autorise `n > missingBy` (depenser plus que
   * necessaire), jamais moins. Le total du jet augmente de `n`, la Chance
   * depensee est deduite de `RunState.luck` et tracee au dossier (une entree
   * cumulative `ch1.chance`, PAS une etiquette -- ADR 0015 §2), puis l'issue
   * (differee jusqu'ici) est enfin resolue en reussite.
   */
  spendLuck(n: number): NarrativeOutcome {
    if (!this.awaitingLuck || !this.awaitingRoll || !this.awaitingTarget) {
      return { ok: false, reason: 'Aucun jet de Chance en attente.' };
    }
    if (!Number.isInteger(n) || n < this.awaitingMissingBy || n > this.ctx.run.luck) {
      return { ok: false, reason: 'Dépense de Chance invalide.' };
    }

    const roll = this.awaitingRoll;
    const target = this.awaitingTarget;
    const newTotal = roll.total + n;
    const updatedRoll: PresentedRoll = {
      ...roll,
      total: newTotal,
      margin: newTotal - roll.dv,
      success: true,
      luckSpent: n,
    };

    let run = { ...this.ctx.run, luck: this.ctx.run.luck - n };
    run = bumpCounter(run, LUCK_SPENT_COUNTER, n);
    const spentTotal = typeof run.flags[LUCK_SPENT_COUNTER] === 'number' ? (run.flags[LUCK_SPENT_COUNTER] as number) : n;
    this.ctx = {
      ...this.ctx,
      run,
      dossier: addEntry(this.ctx.dossier, {
        key: LUCK_ENTRY_KEY,
        label: 'Chance dépensée',
        value: String(spentTotal),
        chapter: NARRATIVE_CHAPTER,
      }),
    };

    this.applyRollUpdate(target, updatedRoll);
    this.clearAwaitingLuck();
    this.finishCheck(true, target);
    return { ok: true };
  }

  /** Accepte l'echec d'un jet en attente de Chance (ADR 0015 §2) : resout l'issue differee en echec, sans depenser de Chance. */
  acceptRoll(): NarrativeOutcome {
    if (!this.awaitingLuck || !this.awaitingRoll || !this.awaitingTarget) {
      return { ok: false, reason: 'Aucun jet de Chance en attente.' };
    }
    const target = this.awaitingTarget;
    this.clearAwaitingLuck();
    this.finishCheck(false, target);
    return { ok: true };
  }

  /**
   * Bascule le runner en attente de Chance (ADR 0015 §2) si -- et seulement
   * si -- le jet vient d'ECHOUER, qu'il a ete lance par FRANKLYN (jamais un
   * coequipier : `who` resolu, alias compris), et que la marge manquante
   * (`-margin`) tient dans la Chance restante. Sinon ne fait rien : l'appelant
   * doit alors resoudre l'issue immediatement via `finishCheck`.
   */
  private maybeEnterAwaitingLuck(
    resolved: ResolvedCheck,
    presented: PresentedRoll,
    result: CheckResult,
    target: PendingLuckTarget,
  ): boolean {
    if (result.success) return false;
    if (resolved.sheet.id !== 'franklyn') return false;
    const missingBy = -result.margin;
    if (missingBy <= 0 || missingBy > this.ctx.run.luck) return false;

    this.awaitingLuck = true;
    this.awaitingRoll = presented;
    this.awaitingMissingBy = missingBy;
    this.awaitingTarget = target;
    return true;
  }

  /** Resout l'issue d'un jet (choix ou insight) : effets de succes/echec puis navigation, ou statut d'insight. */
  private finishCheck(success: boolean, target: PendingLuckTarget): void {
    if (target.kind === 'choice') {
      const { choice } = target;
      const outcomeEffects = success ? choice.successEffects : choice.failureEffects;
      if (outcomeEffects) this.ctx = applyEffects(outcomeEffects, this.ctx);
      this.goTo(success ? (choice.onSuccess as string) : (choice.onFailure as string));
      return;
    }

    const { spec } = target;
    this.insightStatus = success ? 'success' : 'failure';
    const outcomeEffects = success ? spec.successEffects : spec.failureEffects;
    if (outcomeEffects) this.ctx = applyEffects(outcomeEffects, this.ctx);
  }

  /** Met a jour la reference de jet (`lastCheck`/`insightRoll`) apres une depense de Chance, pour que `current()` reflete le total boost. */
  private applyRollUpdate(target: PendingLuckTarget, roll: PresentedRoll): void {
    if (target.kind === 'choice') {
      this.lastRoll = formatRollSummary(roll.skillLabel, roll.total, roll.dv, roll.success);
      this.lastCheck = roll;
    } else {
      this.insightRoll = roll;
    }
  }

  private clearAwaitingLuck(): void {
    this.awaitingLuck = false;
    this.awaitingRoll = null;
    this.awaitingMissingBy = 0;
    this.awaitingTarget = null;
  }

  private goTo(nodeId: string): void {
    if (!this.file.nodes[nodeId]) {
      this.done = true;
      return;
    }
    this.nodeId = nodeId;
    this.enterNode(nodeId);
    this.followRouting();
  }

  /**
   * Traverse les noeuds d'aiguillage (voir `isRoutingNode`) jusqu'au premier noeud qui a
   * quelque chose a montrer. Les effets sont appliques exactement comme si le joueur avait
   * clique : ceux du noeud traverse (par `enterNode`) et ceux de la branche retenue.
   *
   * Prudent par construction : on ne traverse QUE si les conditions ne laissent qu'une seule
   * option, sans jet. Deux options disponibles, c'est un vrai choix -- meme sur un noeud sans
   * texte, comme `ch1.salle3#choix-rester` (sortir, ou rester dans les vapeurs) : choisir a la
   * place du joueur serait un defaut bien pire que celui qu'on corrige. Ces noeuds-la relevent
   * du contenu : il leur manque une narration, pas un aiguillage.
   */
  private followRouting(): void {
    for (let hop = 0; hop < MAX_ROUTING_HOPS; hop++) {
      if (this.done) return;
      const node = this.node();
      if (!node || !isRoutingNode(node)) return;

      const next = this.routeOf(node);
      if (!next || !this.file.nodes[next]) return;
      this.nodeId = next;
      this.enterNode(next);
    }
  }

  /** Destination d'un noeud d'aiguillage, effets de la branche retenue appliques au passage. */
  private routeOf(node: DialogueNode): string | null {
    if (node.to) return node.to;
    const available = this.presentChoices(node);
    // Plus d'une option : le joueur a une vraie decision a prendre, on la lui laisse.
    if (available.length !== 1) return null;
    const raw = (node.choices ?? [])[(available[0] as PresentedChoice).index];
    // Un jet demande le joueur : on ne le lance jamais a sa place.
    if (!raw || raw.check || !raw.to) return null;
    if (raw.effects) this.ctx = applyEffects(raw.effects, this.ctx);
    return raw.to;
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
    // moteur reste correct si un futur graphe le faisait). Facultatif (ADR
    // 0015 §1) : statut initial 'available' au lieu de 'pending', jamais
    // bloquant.
    this.insightStatus = node.insight ? (node.insight.optional ? 'available' : 'pending') : null;
    this.insightRoll = null;

    // Filet de securite : aucune attente de Chance ne doit survivre a un
    // changement de noeud (elle est deja resolue avant tout `goTo`, voir
    // `spendLuck`/`acceptRoll`, mais un futur appelant qui naviguerait
    // autrement ne doit jamais laisser un etat incoherent).
    this.clearAwaitingLuck();

    // Noeud terminal (ni `to` ni `choices`) : il rend la main immediatement,
    // sans attendre un `advance()` explicite (regle 7 du format de dialogue).
    if (isTerminalNode(node)) this.done = true;
  }

  private node(): DialogueNode | undefined {
    return this.file.nodes[this.nodeId];
  }

  /** Resout les alias d'equipe (ADR 0014 §7) avant de construire les lignes presentees : jamais un alias dans `PresentedNode.lines`. */
  private presentLines(node: DialogueNode): PresentedLine[] {
    return (node.lines ?? []).map((line) => ({
      who: resolveSpeakerAlias(line.who, this.ctx.run),
      text: applyTemplates(line.text, this.ctx.run),
    }));
  }

  private presentChoices(node: DialogueNode): PresentedChoice[] {
    // Le choix `best` n'est revele QUE si le jet de reflexion du noeud vient
    // de reussir (ADR 0012) : jamais en attente, jamais apres un echec.
    const revealBest = Boolean(node.insight) && this.insightStatus === 'success';
    const out: PresentedChoice[] = [];
    (node.choices ?? []).forEach((choice, index) => {
      if (choice.conditions && !evaluateAll(choice.conditions, this.ctx)) return;
      const presented: PresentedChoice = {
        index,
        text: applyTemplates(choice.text, this.ctx.run),
        check: this.presentCheck(choice),
      };
      if (revealBest && choice.best) presented.best = true;
      out.push(presented);
    });
    return out;
  }

  private presentInsight(node: DialogueNode): PresentedInsight | undefined {
    if (!node.insight) return undefined;
    const resolved = this.resolveCheckSpecAliased(node.insight);
    if (!resolved) return undefined;

    const status = this.insightStatus ?? (node.insight.optional ? 'available' : 'pending');
    const presented: PresentedInsight = {
      skillLabel: resolved.skillLabel,
      dvLabel: effectiveDvName(node.insight, this.ctx.run),
      chancePercent: successChance({
        label: resolved.skillLabel,
        attribute: resolved.attributeValue,
        skill: resolved.skillValue,
        dv: resolved.dv,
      }),
      status,
    };
    if (node.insight.optional) presented.optional = true;
    if (node.insight.cost) {
      presented.cost = node.insight.cost;
      const current = this.ctx.run.flags[node.insight.cost.counter];
      const currentAmount = typeof current === 'number' ? current : 0;
      presented.affordable = currentAmount >= node.insight.cost.amount;
    }
    if (this.insightRoll) presented.roll = this.insightRoll;
    if (status === 'success' && node.insight.successText) {
      presented.successText = applyTemplates(node.insight.successText, this.ctx.run);
    }
    if (status === 'failure' && node.insight.failureText) {
      presented.failureText = applyTemplates(node.insight.failureText, this.ctx.run);
    }
    return presented;
  }

  private presentCheck(choice: DialogueChoice): PresentedCheck | undefined {
    if (!choice.check) return undefined;
    const resolved = this.resolveCheckSpecAliased(choice.check);
    if (!resolved) return undefined;
    return {
      skillLabel: resolved.skillLabel,
      dvLabel: effectiveDvName(choice.check, this.ctx.run),
      chancePercent: successChance({
        label: resolved.skillLabel,
        attribute: resolved.attributeValue,
        skill: resolved.skillValue,
        dv: resolved.dv,
      }),
    };
  }

  /**
   * Resout l'alias eventuel de `spec.who` (ADR 0014 §7) ET la DV effective
   * (`dvByCounter`, ADR 0015 §3) avant de deleguer a `resolveCheckSpec` --
   * seul point d'entree du moteur vers cette resolution, partage par la
   * resolution d'un jet ET son affichage (`presentCheck`/`presentInsight`).
   */
  private resolveCheckSpecAliased(spec: CheckSpec): ResolvedCheck | null {
    const who = resolveWhoAlias(spec.who, this.ctx.run);
    const dv = effectiveDvName(spec, this.ctx.run);
    return resolveCheckSpec({ skill: spec.skill, attribute: spec.attribute, dv, who });
  }
}
