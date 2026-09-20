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

export type { SceneKind, SceneDef, Ch1Etape } from './sceneRouter';
export { SceneRouter, CHAPTER_1_SCENES, CH1_ETAPE_FLAG, TIRAGE_SCENE_ID, withEtape, exploreFollowerIds } from './sceneRouter';

export type { ObjectiveDef, ObjectiveTask } from './objective';

export type { OffscreenOutcome } from './offscreen';
export {
  resolveOffscreenRun,
  offscreenFlags,
  OFFSCREEN_CABINET_TEMPO_COST,
  OFFSCREEN_ROOM3_TEMPO_COST,
  FLAG_ADVERSE_TASER,
  FLAG_ADVERSE_GASSED,
} from './offscreen';

export type { DraftTurn, DraftPick, DraftState, DraftStepResult, DraftOutcome, DraftConsequences } from './draft';
export {
  DRAFT_POOL,
  ABIGAIL_PREFERENCE_ORDER,
  ABIGAIL_PICK_LINES,
  DRAFT_EXPECTATION_AFFINITY,
  DRAFT_FIRST_PICK_BONUS,
  DRAFT_LEFT_BEHIND_PENALTY,
  TAG_EQUIPE_BANDE,
  TAG_EQUIPE_TACTIQUE,
  DRAFT_DOSSIER_ENTRY_KEY,
  createDraftState,
  pick,
  rosterFromDraft,
  draftSummary,
  draftConsequences,
  applyDraftResult,
} from './draft';
