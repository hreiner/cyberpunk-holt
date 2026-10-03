import type { Cell, MapDef } from '@/explore';
import { HOLT_STAGED_ARCHITECTURE_PROFILES } from './holtRoomProfiles';
import { HOLT_RENDER_PROFILES } from './holtRenderProfiles';
import { remainingExplorationProfile, type ExplorationSceneProfile } from './remainingExplorationProfiles';

const HOLT: ExplorationSceneProfile = {
  architecture: HOLT_STAGED_ARCHITECTURE_PROFILES,
  rooms: HOLT_RENDER_PROFILES,
};

/** Visual-only registry: map topology and interaction rules remain in MapDef. */
export function explorationSceneProfile(mapId: string): ExplorationSceneProfile | null {
  return mapId === 'holt' || mapId === 'holt-nuit' ? HOLT : remainingExplorationProfile(mapId);
}

export function explorationRenderZoneAt(def: MapDef, cell: Cell): string | null {
  for (const profile of explorationSceneProfile(def.id)?.rooms ?? []) {
    const rect = profile.roomId ? def.rooms.find((room) => room.id === profile.roomId)?.rect : profile.rect;
    if (
      rect &&
      cell.x >= rect.origin.x &&
      cell.y >= rect.origin.y &&
      cell.x < rect.origin.x + rect.width &&
      cell.y < rect.origin.y + rect.height
    )
      return profile.zoneId;
  }
  return null;
}
