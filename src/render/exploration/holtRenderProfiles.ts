import type { Cell, MapDef, Rect } from '@/explore';
import type { DormitorySurfaceKey } from './dormitoryMaterials';

export type HoltFinishFamily = 'belt-corridor' | 'canteen' | 'courtyard' | 'training' | 'garage' | 'administration' | 'interface' | 'clinic' | 'armory' | 'archives' | 'maintenance';
export type HoltFloorMaterial = `dormitory:${DormitorySurfaceKey}`;

export interface HoltRenderProfile {
  id: string;
  zoneId: string;
  /** Present for corridors and future non-RoomDef zones. */
  rect?: Rect;
  /** Present for room profiles; the room rectangle is read from MapDef. */
  roomId?: string;
  visibility: 'always' | 'discovered';
  floor: {
    material: HoltFloorMaterial;
    /** Approximate metres represented by one texture repeat. */
    repeatMeters: number;
    roughness: number;
    environmentGain: number;
    /** Zero while the shared planar reflector is not assigned to this surface. */
    reflectionGain: number;
    tint?: number;
  };
  /** Optional water surface passed to the shared reflector by the scene owner. */
  reflectionSurface?: { center: Cell; width: number; height: number; elevation: number; gain: number };
  lighting: {
    keyColor: number;
    dayIntensity: number;
    nightIntensity: number;
    fillColor: number;
    dayFillIntensity: number;
    nightFillIntensity: number;
  };
  finish: {
    family: HoltFinishFamily;
    baseboardMaterial: 'dormitory:darkSteel' | 'dormitory:edgeSteel';
    wallDeviceMaterial: 'dormitory:steel' | 'dormitory:edgeSteel';
    signText?: readonly { at: Cell; text: string; side?: 'north' | 'south' | 'east' | 'west' }[];
  };
}

/** Default staged visual profiles; append one profile per converted HOLT zone. */
export const HOLT_RENDER_PROFILES: readonly HoltRenderProfile[] = [
  {
    id: 'holt-maintenance-h13',
    zoneId: 'local-technique',
    roomId: 'local-technique',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.84,
      environmentGain: 0.16,
      reflectionGain: 0,
      tint: 0x777b7d,
    },
    lighting: {
      keyColor: 0xffd4aa,
      dayIntensity: 10,
      nightIntensity: 8,
      fillColor: 0xa8bac5,
      dayFillIntensity: 0.48,
      nightFillIntensity: 0.58,
    },
    finish: {
      family: 'maintenance',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-archives-h12',
    zoneId: 'archives',
    roomId: 'archives',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.78,
      environmentGain: 0.14,
      reflectionGain: 0,
      tint: 0x74787a,
    },
    lighting: {
      keyColor: 0xcbd8de,
      dayIntensity: 9,
      nightIntensity: 7.5,
      fillColor: 0x9eb7c5,
      dayFillIntensity: 0.48,
      nightFillIntensity: 0.55,
    },
    finish: {
      family: 'archives',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
      signText: [
        { at: { x: 10, y: 31 }, side: 'north', text: 'SERVEURS' },
        { at: { x: 10, y: 39 }, side: 'south', text: 'ARCHIVES' },
      ],
    },
  },
  {
    id: 'holt-armory-h11',
    zoneId: 'armurerie',
    roomId: 'armurerie',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.76,
      environmentGain: 0.14,
      reflectionGain: 0,
      tint: 0x666a6c,
    },
    lighting: {
      keyColor: 0xc3d2dc,
      dayIntensity: 9,
      nightIntensity: 7,
      fillColor: 0x8eabc0,
      dayFillIntensity: 0.5,
      nightFillIntensity: 0.58,
    },
    finish: {
      family: 'armory',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-infirmary-h10',
    zoneId: 'infirmerie',
    roomId: 'infirmerie',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 3,
      roughness: 0.4,
      environmentGain: 0.22,
      reflectionGain: 0.32,
      tint: 0xc5c8c3,
    },
    lighting: {
      keyColor: 0xd5e6ee,
      dayIntensity: 11,
      nightIntensity: 7,
      fillColor: 0xb6d4e4,
      dayFillIntensity: 0.5,
      nightFillIntensity: 0.62,
    },
    finish: {
      family: 'clinic',
      baseboardMaterial: 'dormitory:edgeSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-interface-h9',
    zoneId: 'interface',
    roomId: 'interface',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.76,
      environmentGain: 0.18,
      reflectionGain: 0,
      tint: 0x858b8e,
    },
    lighting: {
      keyColor: 0xb8d9ed,
      dayIntensity: 7,
      nightIntensity: 6,
      fillColor: 0x83b7d0,
      dayFillIntensity: 0.48,
      nightFillIntensity: 0.58,
    },
    finish: {
      family: 'interface',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-administration-h8',
    zoneId: 'administration',
    roomId: 'administration',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.48,
      environmentGain: 0.32,
      reflectionGain: 0.44,
      tint: 0xa7a49c,
    },
    lighting: {
      keyColor: 0xffd3a1,
      dayIntensity: 16,
      nightIntensity: 8,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.6,
      nightFillIntensity: 0.75,
    },
    finish: {
      family: 'administration',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
      signText: [
        { at: { x: 4, y: 4 }, side: 'west', text: 'ACCUEIL' },
        { at: { x: 11, y: 0 }, side: 'north', text: 'DIRECTION' },
      ],
    },
  },
  {
    id: 'holt-east-corridor-h7',
    zoneId: 'couloir-est',
    rect: { origin: { x: 18, y: 1 }, width: 3, height: 46 },
    visibility: 'always',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.68,
      environmentGain: 0.15,
      reflectionGain: 0,
      tint: 0xb5b0a5,
    },
    lighting: {
      keyColor: 0xffd4a4,
      dayIntensity: 12,
      nightIntensity: 17,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.85,
      nightFillIntensity: 1.3,
    },
    finish: {
      family: 'belt-corridor',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
      signText: [
        { at: { x: 17, y: 4 }, side: 'west', text: 'ADMINISTRATION' },
        { at: { x: 17, y: 11 }, side: 'west', text: 'INTERFACE · RÉSEAU' },
        { at: { x: 17, y: 19 }, side: 'west', text: 'INFIRMERIE' },
        { at: { x: 17, y: 27 }, side: 'west', text: 'ARMURERIE' },
        { at: { x: 17, y: 35 }, side: 'west', text: 'ARCHIVES' },
        { at: { x: 17, y: 43 }, side: 'west', text: 'ÉNERGIE' },
        { at: { x: 21, y: 6 }, side: 'east', text: 'CEINTURE · NORD' },
        { at: { x: 21, y: 20 }, side: 'east', text: 'CEINTURE · SUD' },
      ],
    },
  },
  {
    id: 'holt-garage-h6',
    zoneId: 'garage',
    roomId: 'garage',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.58,
      environmentGain: 0.28,
      reflectionGain: 0.24,
      tint: 0x9d9b94,
    },
    lighting: {
      keyColor: 0xffd0a0,
      dayIntensity: 17,
      nightIntensity: 6,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.6,
      nightFillIntensity: 0.7,
    },
    finish: {
      family: 'garage',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-training-h5',
    zoneId: 'salles-entrainement',
    roomId: 'salles-entrainement',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.4,
      environmentGain: 0.28,
      reflectionGain: 0.35,
      tint: 0xa49f93,
    },
    lighting: {
      keyColor: 0xffd4a8,
      dayIntensity: 20,
      nightIntensity: 5.5,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.65,
      nightFillIntensity: 0.65,
    },
    finish: {
      family: 'training',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-courtyard-h4',
    zoneId: 'cour-interieure',
    roomId: 'cour-interieure',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.82,
      environmentGain: 0.2,
      reflectionGain: 0,
      tint: 0x92958d,
    },
    reflectionSurface: { center: { x: 31, y: 23 }, width: 1.65, height: 1.65, elevation: 0.48, gain: 0.72 },
    lighting: {
      keyColor: 0xffd3a1,
      dayIntensity: 0,
      nightIntensity: 8,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.45,
      nightFillIntensity: 0.8,
    },
    finish: {
      family: 'courtyard',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-canteen-h3',
    zoneId: 'cantine',
    roomId: 'cantine',
    visibility: 'discovered',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.32,
      environmentGain: 0.55,
      reflectionGain: 0.65,
      tint: 0xaaa69c,
    },
    lighting: {
      keyColor: 0xffd0a0,
      dayIntensity: 18,
      nightIntensity: 10,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.6,
      nightFillIntensity: 0.9,
    },
    finish: {
      family: 'canteen',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
    },
  },
  {
    id: 'holt-belt-corridor-h2',
    zoneId: 'couloir-ceinture',
    rect: { origin: { x: 22, y: 1 }, width: 3, height: 48 },
    visibility: 'always',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.68,
      environmentGain: 0.15,
      reflectionGain: 0,
      tint: 0xb5b0a5,
    },
    lighting: {
      keyColor: 0xffd4a4,
      dayIntensity: 12,
      nightIntensity: 17,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.85,
      nightFillIntensity: 1.3,
    },
    finish: {
      family: 'belt-corridor',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
      signText: [
        { at: { x: 23, y: 8 }, text: 'DORTOIRS · COUR' },
        { at: { x: 23, y: 27 }, text: 'ACADÉMIE HOLT' },
        { at: { x: 23, y: 43 }, text: 'ENTRAÎNEMENT' },
      ],
    },
  },
  {
    id: 'holt-west-corridor-h14',
    zoneId: 'couloir-ouest',
    rect: { origin: { x: 1, y: 1 }, width: 3, height: 46 },
    visibility: 'always',
    floor: {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.72,
      environmentGain: 0.15,
      reflectionGain: 0,
      tint: 0xb5b0a5,
    },
    lighting: {
      keyColor: 0xffd4a4,
      dayIntensity: 12,
      nightIntensity: 17,
      fillColor: 0xb4d4ed,
      dayFillIntensity: 0.85,
      nightFillIntensity: 1.3,
    },
    finish: {
      family: 'belt-corridor',
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
      signText: [
        { at: { x: 4, y: 4 }, side: 'east', text: 'ADMINISTRATION' },
        { at: { x: 0, y: 25 }, side: 'west', text: 'ACCÈS INTERDIT' },
      ],
    },
  },
];

function contains(rect: Rect, cell: Cell): boolean {
  return (
    cell.x >= rect.origin.x &&
    cell.y >= rect.origin.y &&
    cell.x < rect.origin.x + rect.width &&
    cell.y < rect.origin.y + rect.height
  );
}

/** Resolve a cell to its converted zone without depending on renderer state. */
export function holtRenderZoneAt(def: MapDef, cell: Cell): string | null {
  for (const profile of HOLT_RENDER_PROFILES) {
    const rect = profile.roomId
      ? def.rooms.find((room) => room.id === profile.roomId)?.rect
      : profile.rect;
    if (rect && contains(rect, cell)) return profile.zoneId;
  }
  return null;
}
