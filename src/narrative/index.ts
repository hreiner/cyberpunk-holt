/** Point d'entree public du moteur narratif. */

export type {
  SpeakerId,
  TeamAlias,
  DialogueFile,
  DialogueNode,
  DialogueLine,
  DialogueChoice,
  CheckSpec,
  InsightSpec,
  Condition,
  Effect,
  TeamEffect,
} from './types';
export { SPEAKER_LABELS } from './types';

export type { RunState, TeamRoster } from './runState';
export {
  createRunState,
  migrateRunState,
  setFlag,
  getFlag,
  bumpCounter,
  addTempo,
  applyTeamEffect,
  INITIAL_LUCK,
} from './runState';

export { evaluateCondition, evaluateAll } from './conditions';
export { applyEffect, applyEffects, NARRATIVE_CHAPTER } from './effects';
export { successChance } from './odds';
export { isTeamAlias, resolveTeamAlias, resolveSpeakerAlias, resolveWhoAlias, applyTemplates } from './aliases';

export type {
  NarrativeContext,
  NarrativeOutcome,
  PresentedCheck,
  PresentedChoice,
  PresentedInsight,
  PresentedLine,
  PresentedNode,
  PresentedRoll,
  PresentedRollModifier,
  DialogueRunnerOptions,
} from './dialogueRunner';
export { DialogueRunner } from './dialogueRunner';

export type { RadioCue } from './radio';
export { pendingRadio, markHeard } from './radio';

export { validateDialogue } from './validate';

export type { SceneKind, SceneDef } from './sceneRouter';
export { SceneRouter, CHAPTER_1_SCENES } from './sceneRouter';

export type { OffscreenOutcome } from './offscreen';
export {
  resolveOffscreenRun,
  offscreenFlags,
  OFFSCREEN_CABINET_TEMPO_COST,
  OFFSCREEN_ROOM3_TEMPO_COST,
  FLAG_ADVERSE_TASER,
  FLAG_ADVERSE_GASSED,
} from './offscreen';
