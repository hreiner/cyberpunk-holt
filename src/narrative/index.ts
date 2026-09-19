/** Point d'entree public du moteur narratif. */

export type {
  SpeakerId,
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

export type { RunState } from './runState';
export {
  createRunState,
  migrateRunState,
  setFlag,
  getFlag,
  bumpCounter,
  addTempo,
  applyTeamEffect,
} from './runState';

export { evaluateCondition, evaluateAll } from './conditions';
export { applyEffect, applyEffects } from './effects';
export { successChance } from './odds';

export type {
  NarrativeContext,
  NarrativeOutcome,
  PresentedCheck,
  PresentedChoice,
  PresentedInsight,
  PresentedNode,
  PresentedRoll,
  PresentedRollModifier,
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
