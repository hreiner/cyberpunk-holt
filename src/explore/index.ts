/** Point d'entrée public du socle d'exploration (epic 3, lot 3.5). */

export type {
  Cell,
  Rect,
  RoomDef,
  EntityType,
  NpcEntity,
  ObjectEntity,
  SeatEntity,
  DoorEntity,
  ExitEntity,
  ZoneEntity,
  EntityDef,
  TacticalAreaDef,
  MapDef,
  ExploreCellKind,
  ValidationResult,
  ObjectiveTask,
  ObjectiveDef,
} from './types';

export {
  ExploreMap,
  nearestWalkableCell,
  nearestAdjacentWalkableCell,
  sameCell,
  cellDistance,
  inRect,
  posKey,
} from './exploreMap';
export { computeReach, pathTo, findPath } from './pathing';
export type { ReachResult } from './pathing';
export { validateMap, YARD_SIZE } from './validateMap';

export {
  ExploreState,
  LEADER_SPEED,
  FOLLOW_GAP,
} from './exploreState';
export type {
  ExploreStateOptions,
  FloatCell,
  InteractOutcome,
  InteractableInfo,
  ObjectiveTaskStatus,
  ObjectiveStatus,
  ExploreEvent,
  ExploreDebugSnapshot,
} from './exploreState';
