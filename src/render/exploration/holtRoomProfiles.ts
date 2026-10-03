import type { HoltArchitectureProfile } from './holtArchitectureLayout';

/** Profiles are data: the same envelope builder can serve rooms and corridors. */
export const HOLT_DORMITORY_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-dormitory-h1',
  roomIds: ['dortoirs'],
  // North and east remain owned by the validated dormitory pilot architecture.
  sides: ['west', 'south'],
};

/** Belt corridor conversion, staged after the validated dormitory envelope. */
export const HOLT_BELT_CORRIDOR_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-belt-corridor-h2',
  roomIds: [],
  sides: [],
  regions: [
    {
      id: 'couloir-ceinture',
      rect: { origin: { x: 22, y: 1 }, width: 3, height: 48 },
      sides: ['north', 'south', 'east', 'west'],
      alwaysVisible: true,
    },
  ],
};

/** Eastern service spine: room thresholds face west, belt-corridor links face east. */
export const HOLT_EAST_CORRIDOR_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-east-corridor-h7',
  roomIds: [],
  sides: [],
  regions: [
    {
      id: 'couloir-est',
      rect: { origin: { x: 18, y: 1 }, width: 3, height: 46 },
      sides: ['north', 'south', 'east', 'west'],
      alwaysVisible: true,
    },
  ],
};

/** West circulation spine: always visible, with only its three real exterior bays opened. */
export const HOLT_WEST_CORRIDOR_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-west-corridor-h14',
  roomIds: [],
  sides: [],
  regions: [{
    id: 'couloir-ouest',
    rect: { origin: { x: 1, y: 1 }, width: 3, height: 46 },
    sides: ['north', 'south', 'east', 'west'],
    alwaysVisible: true,
  }],
  windows: [9, 17, 35].map((y, index) => ({
    id: `west-corridor-window-${index + 1}`,
    cell: { x: 0, y },
    side: 'west' as const,
    width: 0.8,
    height: 1.52,
    sillHeight: 2.72,
    exterior: 'badlands' as const,
  })),
};

/** Administration keeps its locked north door distinct from two genuine exterior bays. */
export const HOLT_ADMINISTRATION_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-administration-h8',
  roomIds: ['administration'],
  sides: ['north', 'south', 'east', 'west'],
  windows: [8, 14].map((x, index) => ({
    id: `administration-north-window-${index + 1}`,
    cell: { x, y: 0 },
    side: 'north' as const,
    width: 0.8,
    height: 1.52,
    sillHeight: 2.72,
    exterior: 'badlands' as const,
  })),
};

/** Netrun room: enclosed service room with the existing east threshold and no exterior bays. */
export const HOLT_INTERFACE_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-interface-h9',
  roomIds: ['interface'],
  sides: ['north', 'south', 'east', 'west'],
};

/** Clinical room: internal partitions on every side and no outside-facing apertures. */
export const HOLT_INFIRMARY_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-infirmary-h10',
  roomIds: ['infirmerie'],
  sides: ['north', 'south', 'east', 'west'],
};

/** Armory is an internal room: full partitions and the existing eastern armored door. */
export const HOLT_ARMORY_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-armory-h11',
  roomIds: ['armurerie'],
  sides: ['north', 'south', 'east', 'west'],
};

/** Archives room: four internal partitions with its existing east maintenance threshold. */
export const HOLT_ARCHIVES_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-archives-h12',
  roomIds: ['archives'],
  sides: ['north', 'south', 'east', 'west'],
};

/** Maintenance shop: internal partitions plus the actual south-facing Badlands bay. */
export const HOLT_MAINTENANCE_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-maintenance-h13',
  roomIds: ['local-technique'],
  sides: ['north', 'south', 'east', 'west'],
  windows: [{
    id: 'maintenance-south-window',
    cell: { x: 8, y: 47 },
    side: 'south',
    width: 0.8,
    height: 1.52,
    sillHeight: 2.72,
    exterior: 'badlands',
  }],
};

/** Cantine: four owned façades, two continuous training thresholds and three real east bays. */
export const HOLT_CANTEEN_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-canteen-h3',
  roomIds: ['cantine'],
  sides: ['north', 'south', 'east', 'west'],
  windows: [20, 24, 28].map((y, index) => ({
    id: `cantine-east-window-${index + 1}`,
    cell: { x: 51, y },
    side: 'east' as const,
    width: 0.8,
    height: 1.52,
    sillHeight: 2.72,
    exterior: 'badlands' as const,
  })),
};

/** Courtyard bays look into the actual adjacent rooms; their contents stay undiscovered until each room is entered. */
export const HOLT_COURTYARD_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-courtyard-h4',
  roomIds: ['cour-interieure'],
  sides: ['north', 'south', 'east', 'west'],
  windows: [
    ...[20, 27].map((y, index) => ({
      id: `courtyard-canteen-window-${index + 1}`,
      cell: { x: 38, y },
      side: 'east' as const,
      width: 0.8,
      height: 1.52,
      sillHeight: 2.72,
      exterior: 'courtyard' as const,
      viewRoomId: 'cantine',
    })),
    ...[29, 34].map((x, index) => ({
      id: `courtyard-dormitory-window-${index + 1}`,
      cell: { x, y: 16 },
      side: 'north' as const,
      width: 0.8,
      height: 1.52,
      sillHeight: 2.72,
      exterior: 'courtyard' as const,
      viewRoomId: 'dortoirs',
    })),
  ],
};

/** Training hall windows face the Badlands; all four sides preserve its paired school thresholds. */
export const HOLT_TRAINING_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-training-h5',
  roomIds: ['salles-entrainement'],
  sides: ['north', 'south', 'east', 'west'],
  windows: [36, 40, 44, 48].map((y, index) => ({
    id: `training-east-window-${index + 1}`,
    cell: { x: 51, y },
    side: 'east' as const,
    width: 0.8,
    height: 1.52,
    sillHeight: 2.72,
    exterior: 'badlands' as const,
  })),
};

/** Vehicle garage: three narrow exterior bays illuminate the service aisle. */
export const HOLT_GARAGE_ARCHITECTURE: HoltArchitectureProfile = {
  id: 'holt-garage-h6',
  roomIds: ['garage'],
  sides: ['north', 'south', 'east', 'west'],
  windows: [
    { id: 'garage-west-window', cell: { x: 29, y: 55 }, side: 'west', width: 0.8, height: 1.52, sillHeight: 2.72, exterior: 'badlands' },
    { id: 'garage-east-window', cell: { x: 47, y: 55 }, side: 'east', width: 0.8, height: 1.52, sillHeight: 2.72, exterior: 'badlands' },
    { id: 'garage-south-window', cell: { x: 38, y: 62 }, side: 'south', width: 0.8, height: 1.52, sillHeight: 2.72, exterior: 'badlands' },
  ],
};

export const HOLT_ARCHITECTURE_PROFILES: Readonly<Record<string, HoltArchitectureProfile>> = {
  [HOLT_DORMITORY_ARCHITECTURE.id]: HOLT_DORMITORY_ARCHITECTURE,
  [HOLT_BELT_CORRIDOR_ARCHITECTURE.id]: HOLT_BELT_CORRIDOR_ARCHITECTURE,
  [HOLT_EAST_CORRIDOR_ARCHITECTURE.id]: HOLT_EAST_CORRIDOR_ARCHITECTURE,
  [HOLT_WEST_CORRIDOR_ARCHITECTURE.id]: HOLT_WEST_CORRIDOR_ARCHITECTURE,
  [HOLT_ADMINISTRATION_ARCHITECTURE.id]: HOLT_ADMINISTRATION_ARCHITECTURE,
  [HOLT_INTERFACE_ARCHITECTURE.id]: HOLT_INTERFACE_ARCHITECTURE,
  [HOLT_INFIRMARY_ARCHITECTURE.id]: HOLT_INFIRMARY_ARCHITECTURE,
  [HOLT_ARMORY_ARCHITECTURE.id]: HOLT_ARMORY_ARCHITECTURE,
  [HOLT_ARCHIVES_ARCHITECTURE.id]: HOLT_ARCHIVES_ARCHITECTURE,
  [HOLT_MAINTENANCE_ARCHITECTURE.id]: HOLT_MAINTENANCE_ARCHITECTURE,
  [HOLT_CANTEEN_ARCHITECTURE.id]: HOLT_CANTEEN_ARCHITECTURE,
  [HOLT_COURTYARD_ARCHITECTURE.id]: HOLT_COURTYARD_ARCHITECTURE,
  [HOLT_TRAINING_ARCHITECTURE.id]: HOLT_TRAINING_ARCHITECTURE,
  [HOLT_GARAGE_ARCHITECTURE.id]: HOLT_GARAGE_ARCHITECTURE,
};

/** Default staged envelope set: H1 keeps ownership of its validated sides, H2 adds the belt. */
export const HOLT_STAGED_ARCHITECTURE_PROFILES: readonly HoltArchitectureProfile[] = [
  HOLT_DORMITORY_ARCHITECTURE,
  HOLT_BELT_CORRIDOR_ARCHITECTURE,
  HOLT_EAST_CORRIDOR_ARCHITECTURE,
  HOLT_WEST_CORRIDOR_ARCHITECTURE,
  HOLT_ADMINISTRATION_ARCHITECTURE,
  HOLT_INTERFACE_ARCHITECTURE,
  HOLT_INFIRMARY_ARCHITECTURE,
  HOLT_ARMORY_ARCHITECTURE,
  HOLT_ARCHIVES_ARCHITECTURE,
  HOLT_MAINTENANCE_ARCHITECTURE,
  HOLT_CANTEEN_ARCHITECTURE,
  HOLT_COURTYARD_ARCHITECTURE,
  HOLT_TRAINING_ARCHITECTURE,
  HOLT_GARAGE_ARCHITECTURE,
];
