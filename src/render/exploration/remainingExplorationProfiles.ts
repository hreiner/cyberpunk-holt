import type { HoltArchitectureProfile, HoltWallSide } from './holtArchitectureLayout';
import type { HoltRenderProfile } from './holtRenderProfiles';

export interface ExplorationSceneProfile {
  architecture: readonly HoltArchitectureProfile[];
  rooms: readonly HoltRenderProfile[];
  wallHeights?: { exterior: number; interior: number };
  wallTint?: number;
  wallPaintTint?: number;
  /** Narrow passages need a steeper view when their walls stay whole. */
  cameraElevationDeg?: number;
}

const FOUR_SIDES: readonly HoltWallSide[] = ['north', 'south', 'east', 'west'];

function architectureForRooms(prefix: string, roomIds: readonly string[]): HoltArchitectureProfile[] {
  return roomIds.map((roomId) => ({
    id: `${prefix}-${roomId}`,
    roomIds: [roomId],
    sides: FOUR_SIDES,
  }));
}

type FloorProfile = HoltRenderProfile['floor'];
type LightingProfile = HoltRenderProfile['lighting'];
type Sign = NonNullable<HoltRenderProfile['finish']['signText']>[number];

function room(
  mapId: string,
  roomId: string,
  visibility: HoltRenderProfile['visibility'],
  family: HoltRenderProfile['finish']['family'],
  floor: FloorProfile,
  lighting: LightingProfile,
  signText?: readonly Sign[],
  reflectionSurface?: HoltRenderProfile['reflectionSurface'],
): HoltRenderProfile {
  return {
    id: `${mapId}-${roomId}`,
    zoneId: roomId,
    roomId,
    visibility,
    floor,
    lighting,
    ...(reflectionSurface ? { reflectionSurface } : {}),
    finish: {
      family,
      baseboardMaterial: 'dormitory:darkSteel',
      wallDeviceMaterial: 'dormitory:edgeSteel',
      ...(signText ? { signText } : {}),
    },
  };
}

const COOL_FILL = 0x9ab8ca;

const CENTRE_ROOMS: readonly HoltRenderProfile[] = [
  room(
    'centre-examen',
    'parking',
    'discovered',
    'garage',
    {
      material: 'dormitory:floor',
      repeatMeters: 5,
      roughness: 0.94,
      environmentGain: 0.08,
      reflectionGain: 0,
      tint: 0x777a79,
    },
    {
      keyColor: 0xd9c19f,
      dayIntensity: 4.2,
      nightIntensity: 3.1,
      fillColor: COOL_FILL,
      dayFillIntensity: 0.32,
      nightFillIntensity: 0.24,
    },
    [{ at: { x: 14, y: 61 }, side: 'north', text: 'CENTRE D’EXAMEN' }],
  ),
  room(
    'centre-examen',
    'hall',
    'discovered',
    'administration',
    {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.88,
      environmentGain: 0.12,
      reflectionGain: 0,
      tint: 0x727473,
    },
    {
      keyColor: 0xd4c4a7,
      dayIntensity: 4.8,
      nightIntensity: 3.4,
      fillColor: COOL_FILL,
      dayFillIntensity: 0.34,
      nightFillIntensity: 0.26,
    },
    [{ at: { x: 16, y: 51 }, side: 'north', text: 'BRIEFING' }],
  ),
  room(
    'centre-examen',
    'salle1',
    'discovered',
    'maintenance',
    {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.93,
      environmentGain: 0.08,
      reflectionGain: 0,
      tint: 0x707573,
    },
    {
      keyColor: 0xb8c3c5,
      dayIntensity: 4.5,
      nightIntensity: 3.2,
      fillColor: COOL_FILL,
      dayFillIntensity: 0.3,
      nightFillIntensity: 0.23,
    },
    [{ at: { x: 23, y: 41 }, side: 'north', text: 'PARCOURS K9' }],
  ),
  room(
    'centre-examen',
    'salle2',
    'discovered',
    'armory',
    {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.9,
      environmentGain: 0.1,
      reflectionGain: 0,
      tint: 0x747775,
    },
    {
      keyColor: 0xc2c8c9,
      dayIntensity: 4.6,
      nightIntensity: 3.2,
      fillColor: COOL_FILL,
      dayFillIntensity: 0.3,
      nightFillIntensity: 0.23,
    },
    [{ at: { x: 18, y: 31 }, side: 'north', text: 'RÉSERVE' }],
  ),
  room(
    'centre-examen',
    'salle3',
    'discovered',
    'interface',
    {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.82,
      environmentGain: 0.12,
      reflectionGain: 0,
      tint: 0x666d70,
    },
    {
      keyColor: 0x9bbac4,
      dayIntensity: 5.2,
      nightIntensity: 3.8,
      fillColor: 0x91beca,
      dayFillIntensity: 0.36,
      nightFillIntensity: 0.28,
    },
    [{ at: { x: 16, y: 21 }, side: 'north', text: 'SALLE DE CONTRÔLE' }],
  ),
  // Tactical ground is kept matte and has no extra fixture, sign, or reflection surface.
  room(
    'centre-examen',
    'cour',
    'always',
    'armory',
    {
      material: 'dormitory:floor',
      repeatMeters: 5,
      roughness: 0.97,
      environmentGain: 0.04,
      reflectionGain: 0,
      tint: 0x666b6d,
    },
    {
      keyColor: 0x9db8cf,
      dayIntensity: 0,
      nightIntensity: 0.6,
      fillColor: COOL_FILL,
      dayFillIntensity: 0,
      nightFillIntensity: 0.08,
    },
  ),
];

const CONDUIT_IDS = [
  'conduit-bouche',
  'bifurcation',
  'annexe',
  'annexe-nord',
  'conduit-petits',
  'conduit-ventilateur',
  'conduit-pales',
  'labo',
  'petits',
  'cantine',
] as const;

const CONDUIT_ROOMS: readonly HoltRenderProfile[] = [
  ...CONDUIT_IDS.slice(0, 7).map((roomId) =>
    room(
      'conduits',
      roomId,
      'always',
      'armory',
      {
        material: 'dormitory:floor',
        repeatMeters: 3,
        roughness: 0.98,
        environmentGain: 0.035,
        reflectionGain: 0,
        tint: 0x626c70,
      },
      {
        keyColor: 0x91aebe,
        dayIntensity: 2.0,
        nightIntensity: 1.8,
        fillColor: 0x718797,
        dayFillIntensity: 0.18,
        nightFillIntensity: 0.16,
      },
    ),
  ),
  room(
    'conduits',
    'labo',
    'discovered',
    'interface',
    {
      material: 'dormitory:floor',
      repeatMeters: 3,
      roughness: 0.8,
      environmentGain: 0.11,
      reflectionGain: 0.1,
      tint: 0x56646a,
    },
    {
      keyColor: 0x56d8ee,
      dayIntensity: 3.8,
      nightIntensity: 4.2,
      fillColor: 0x7ac8db,
      dayFillIntensity: 0.24,
      nightFillIntensity: 0.28,
    },
    undefined,
    {
      center: { x: 6, y: 5 },
      width: 1.7,
      height: 1.2,
      elevation: 0.03,
      gain: 0.1,
    },
  ),
  room(
    'conduits',
    'petits',
    'discovered',
    'clinic',
    {
      material: 'dormitory:floor',
      repeatMeters: 3,
      roughness: 0.91,
      environmentGain: 0.07,
      reflectionGain: 0.12,
      tint: 0x485158,
    },
    {
      keyColor: 0xa6c8d8,
      dayIntensity: 2.8,
      nightIntensity: 3.1,
      fillColor: 0x8faebd,
      dayFillIntensity: 0.18,
      nightFillIntensity: 0.21,
    },
    undefined,
    {
      center: { x: 25, y: 6 },
      width: 1.8,
      height: 1.1,
      elevation: 0.03,
      gain: 0.12,
    },
  ),
  room(
    'conduits',
    'cantine',
    'discovered',
    'canteen',
    {
      material: 'dormitory:floor',
      repeatMeters: 3,
      roughness: 0.88,
      environmentGain: 0.08,
      reflectionGain: 0.2,
      tint: 0x573b35,
    },
    {
      keyColor: 0xff6540,
      dayIntensity: 4.0,
      nightIntensity: 4.4,
      fillColor: 0xe98c54,
      dayFillIntensity: 0.26,
      nightFillIntensity: 0.3,
    },
    undefined,
    {
      center: { x: 29, y: 18 },
      width: 1.5,
      height: 1.1,
      elevation: 0.03,
      gain: 0.2,
    },
  ),
];

const CAMPEMENT_ROOMS: readonly HoltRenderProfile[] = [
  room(
    'campement',
    'campement',
    'always',
    'armory',
    {
      material: 'dormitory:floor',
      repeatMeters: 4,
      roughness: 0.97,
      environmentGain: 0.05,
      reflectionGain: 0,
      tint: 0x77776f,
    },
    {
      keyColor: 0x8eadd4,
      dayIntensity: 1.2,
      nightIntensity: 1.1,
      fillColor: 0x778ea9,
      dayFillIntensity: 0.12,
      nightFillIntensity: 0.1,
    },
  ),
];

const CENTRE_EXAMEN: ExplorationSceneProfile = {
  architecture: architectureForRooms('remaining-centre-examen', [
    'parking',
    'hall',
    'salle1',
    'salle2',
    'salle3',
    'cour',
  ]),
  rooms: CENTRE_ROOMS,
  wallHeights: { exterior: 4.9, interior: 2.45 },
  wallTint: 0x818482,
  wallPaintTint: 0x61777a,
};

const CONDUITS: ExplorationSceneProfile = {
  architecture: architectureForRooms('remaining-conduits', CONDUIT_IDS),
  rooms: CONDUIT_ROOMS,
  cameraElevationDeg: 70,
  wallHeights: { exterior: 2.45, interior: 2.45 },
  wallTint: 0x78858a,
  wallPaintTint: 0x58747a,
};

const CAMPEMENT: ExplorationSceneProfile = {
  architecture: architectureForRooms('remaining-campement', ['campement']),
  rooms: CAMPEMENT_ROOMS,
  wallHeights: { exterior: 2.45, interior: 2.45 },
  wallTint: 0x77756d,
  wallPaintTint: 0x5f6966,
};

const PROFILES: Readonly<Record<string, ExplorationSceneProfile>> = {
  'centre-examen': CENTRE_EXAMEN,
  conduits: CONDUITS,
  campement: CAMPEMENT,
};

/** Returns the room, wall, and finish data for a non-HOLT exploration map. */
export function remainingExplorationProfile(mapId: string): ExplorationSceneProfile | null {
  return PROFILES[mapId] ?? null;
}
