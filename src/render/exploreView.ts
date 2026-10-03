/**
 * Rendu three.js d'une `MapDef` d'exploration (epic 3, lot 3.5) : sol, murs
 * de 3 m avec la règle de coupe (docs/design/08-EXPLORATION.md "La caméra et
 * les murs"), portes, mobilier bas/haut, figurants gris, survol/clic. Même
 * esprit que `src/render/yardView.ts` (scène + surcouche), légende propre à
 * l'exploration (voir `src/explore/exploreMap.ts`).
 *
 * Cette classe possède sa propre `IsoCamera` (à la différence de `YardView`,
 * dont la caméra vit dans `app.ts`). `ExploreSession` l'emploie dans le chapitre ;
 * `explore-lab.ts` et le pilote du dortoir l'emploient en développement.
 *
 * Décoratif seedé (jamais `Math.random()`, AGENTS.md règle 1) : la légère
 * variation des touffes de végétation vient du `Rng` transmis, comme dans
 * `YardView.buildObstacles`.
 */

import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import type { Rng } from '@/core/rng';
import { CHARACTER_IDS, getCharacter, type CharacterId, type CharacterSheet } from '@/rules/character';
import { computeCorridors, ExploreMap, LEADER_SPEED, posKey, roomAt, YARD_SIZE } from '@/explore';
import type { Cell, CorridorLayout, DoorEntity, EntityDef, MapDef, RoomDef, WallSide } from '@/explore';
import { isExplorationCharacterRig, type CharacterRig } from './characterRig';
import { createCadetExplorationRig, createHumanExplorationRig } from './exploration/cadetRig';
import { createExploreNpcRig, type ExploreNpcRig } from './exploration/npcRig';
import { CHILD_VISUAL_PROFILE } from '@/data/exploreVisuals/characterProfiles';
import { exploreVisualsFor, type ExploreVisuals } from '@/data/exploreVisuals';
import { ExploreDressing, type ExploreDressingFactory } from './exploration/dressing';
import {
  createDoorControl,
  createSurveillanceCamera,
  createTechnicalConduit,
  createWallBand,
} from './exploration/architecture';
import {
  addExplorationLighting,
  applyNightMood,
  type ExplorationLights,
  type NightMood,
} from './exploration/atmosphere';
import { EnvironmentMaterials } from './exploration/materials';
import { EnvironmentPropFactory } from './exploration/props';
import { DormitoryMaterials } from './exploration/dormitoryMaterials';
import { createHoltArchitecture, type HoltArchitecture } from './exploration/holtArchitecture';
import { explorationSceneProfile, explorationRenderZoneAt } from './exploration/explorationSceneProfiles';
import type { ExplorationSceneProfile } from './exploration/remainingExplorationProfiles';
import { createHoltRoomRendering, type HoltRoomRendering } from './exploration/holtRoomRendering';
import { createHangarDetails } from './exploration/hangarDetails';
import { createIndustrialCoverDetails, type IndustrialCoverCell } from './exploration/industrialCoverDetails';
import { supportOrthographicReflection } from './exploration/orthographicReflection';
import { DormitoryPerspectiveCamera } from './exploration/dormitoryPerspectiveCamera';
import {
  createDormitoryPilotLighting,
  type DormitoryPilotLighting,
} from './exploration/dormitoryPilotLighting';
import {
  createDormitoryPilotArchitecture,
  type DormitoryPilotArchitecture,
} from './exploration/dormitoryPilotArchitecture';
import { HOLT_VISUALS } from '@/data/exploreVisuals/holt';
import { CENTRE_EXAMEN_VISUALS } from '@/data/exploreVisuals/centreExamen';
import type { ExploreVisualMapDef } from '@/data/exploreVisualTypes';
import { CAMERA_DISTANCE, ISO_ELEVATION_DEG, IsoCamera } from './isoCamera';

export const EXPLORE_CELL_SIZE_METERS = 1;
/** Rotation nulle réutilisée pour composer les matrices d'instance des murs (passe G, performance). */
const IDENTITY_QUATERNION = new THREE.Quaternion();
const WALL_HEIGHT = 3;
const WALL_CUT_HEIGHT = 0.24;
const FURNITURE_LOW_HEIGHT = 1.0;
const FURNITURE_HIGH_HEIGHT = 2.6;
const GLASS_HEIGHT = 3;
const VEGETATION_HEIGHT = 0.5;
const DORMITORY_FLOOR_TILE_WIDTH = 3.75;
const DORMITORY_FLOOR_TILE_DEPTH = 3;

/**
 * Palette : sol nettement plus clair que les murs (règle de lisibilité n° 1,
 * ART-DIRECTION.md), mobilier bas/haut dans deux teintes distinctes entre
 * elles ET du mur. Repris/adapté de `YardView` (containers/caisses) plutôt
 * qu'inventé : mêmes trois lumières, même logique de contraste.
 */
const DOOR_FRAME_COLOR = 0x8a8d99;
const DOOR_PANEL_COLOR = 0x35343a;
const FURNITURE_LOW_COLOR = 0xb98a4f; // mobilier bas : bois clair (table, pupitre...)
const FURNITURE_HIGH_COLOR = 0x6f7680; // mobilier haut : acier bleuté (armoire, serveur...)
const GLASS_COLOR = 0x4cc9f0;
const VEGETATION_COLOR = 0x4f8f5a;
/**
 * Arête supérieure d'un mur coupé (08-EXPLORATION.md "La caméra et les murs") : un ivoire
 * sale et discret, pas le cyan. Le cyan est réservé au verre et à l'anneau d'équipe
 * (UI-DESIGN-SYSTEM.md "Couleurs" : « le cyan `--comm` signifie radio », et en 3D il ne sert
 * qu'au verre/contre-jour) — sur l'académie (52x64), colorer chaque arête de mur coupé en
 * cyan vif transformait tout le bâtiment en filaire lumineux qui écrasait le reste du rendu.
 */
const CUT_EDGE_COLOR = 0xb0a184;
const EXTRA_COLOR = 0xaab0bd; // figurants gris, plus clairs que --bone-faint pour rester lisibles
const HOVER_COLOR = 0xf2c230; // --tape
const EXIT_COLOR = 0x7fd08a;
const OBJECT_COLOR = 0xd9a441; // repris de la palette containers (YardView) : un objet se remarque
const SEAT_COLOR = 0xb4463c;
const INTERACTION_MARKER_HEIGHT = 0.05;
/** Couleur d'un véhicule du garage : distincte du mobilier haut (agrès), pour rester lisible côte à côte. */
const VEHICLE_COLOR = 0xc9863a;
const VEHICLE_GLASS_COLOR = 0x8ea6b8;
/** Anneau au sol du groupe du joueur : `--comm` est réservé à la radio (ART-DIRECTION.md "Couleurs"), on reprend l'accent d'interface. */
const PARTY_RING_COLOR = 0x4cc9f0;
/**
 * Balise de l'objectif : le rouge RED, « titre de scène, tampon, action principale »
 * (UI-DESIGN-SYSTEM.md "Couleurs"). Il n'y en a jamais qu'UNE sur la carte -- l'entité qui fait
 * avancer l'histoire --, donc le rouge reste rare comme le veut la direction artistique, et le
 * joueur n'a plus à deviner lequel des quinze anneaux au sol est celui qui compte.
 */
const OBJECTIVE_COLOR = 0xe2262f;
/** Hauteur du chevron au-dessus de la case, en mètres : au-dessus d'un cadet debout (1,75 m). */
const OBJECTIVE_CHEVRON_HEIGHT = 2.25;
/** Amplitude et période du balancement du chevron -- une respiration, pas un clignotement. */
const OBJECTIVE_BOB_METERS = 0.14;
const OBJECTIVE_BOB_SPEED = 2.2;
/**
 * Rayon de SAISIE d'un interactable, en mètres, quand le rayon a manqué son maillage et que la
 * case visée ne porte rien. La case seule (1 m) donne, au zoom de jeu, un losange d'environ
 * 55 x 42 px : sous la cible tactile confortable de 44 x 44 px, et pointu aux quatre coins --
 * mesuré en jeu sur la chaise de la cantine, la toute première interaction du chapitre, celle
 * dont on a dit qu'elle n'était "pas simple à cliquer". Un disque de 0,7 m fait la moitié de
 * surface en plus, sans les coins, et laisse malgré tout 0,3 m autour du centre d'une case
 * voisine : on peut toujours demander à marcher juste à côté d'un cadet.
 */
const INTERACT_GRAB_RADIUS_M = 0.7;

/**
 * Sol d'une pièce NON découverte (08-EXPLORATION.md "La découverte des lieux") : une masse
 * sombre UNIFORME, jamais teintée par pièce ("une pièce vide et une pièce pleine doivent se
 * ressembler tant qu'on n'y est pas entré, sinon la découverte ne cache rien") -- nettement
 * plus sombre que le sol éclairé d'une pièce connue, mais pas un noir pur : on doit lire "masse
 * sombre", pas "trou".
 *
 * Valeur choisie nettement AU-DESSUS de la couleur de fond/brouillard de la scène
 * (`0x14151a`, voir le constructeur) : l'ancienne valeur (`0x121218`) en était si proche (à
 * quelques crans de 255 près sur chaque canal) qu'une pièce cachée se fondait purement et
 * simplement dans le vide derrière elle -- un vrai trou, exactement ce que la règle interdit,
 * mesuré en jeu par lecture de pixel sur le rendu (`toDataURL`/`getImageData`), pas seulement à
 * l'œil. `0x121218` restait pourtant correct tant que le sol de base était encore un simple
 * `THREE.MeshStandardMaterial` sans texture ni brouillard à l'échelle de l'académie (comparaison
 * historique plus haute que celle-ci, avant le lot d'habillage déclaratif) : le défaut n'était
 * pas visible à l'époque du correctif du lot 3.7c cité plus haut, il l'est devenu avec le fond/
 * brouillard actuels.
 */
const HIDDEN_ROOM_COLOR = 0x34363c;

/**
 * Zoom continu (08-EXPLORATION.md "Contrôles") : bornes propres à l'exploration, distinctes
 * de celles du combat tactique (`MIN_ZOOM`/`MAX_ZOOM` d'`isoCamera.ts`, calibrées sur la cour
 * 30x20). Au plus large (`ZOOM_MAX`), on embrasse une aile entière de l'académie (52x64) ;
 * au plus près (`ZOOM_MIN`), on distingue les visages des cadets.
 */
const ZOOM_MIN = 10;
const ZOOM_MAX = 96;
/** Cadrage d'entrée exploration : cadet d'environ 50 px à 900p, sans toucher à la tactique. */
const EXPLORE_INITIAL_ZOOM = 16;
const HOLT_REFLECTION_FADE_START_ZOOM = 26;
const HOLT_REFLECTION_STOP_ZOOM = 34;
/** Molette : sensibilité (unités de zoom par cran `deltaY`, valeur navigateur typique ~100). */
const WHEEL_ZOOM_SENSITIVITY = 0.045;
/** `+`/`-` maintenus : vitesse de zoom continue. */
export const KEY_ZOOM_SPEED = 30;
/** Flèches maintenues : vitesse du panoramique libre, en mètres/seconde. */
const PAN_SPEED_M_S = 18;
/** Marge de panoramique au-delà du bord de la carte, "une pièce" (08-EXPLORATION.md "La caméra et les murs"). */
const PAN_MARGIN_METERS = 12;

export type Side = WallSide;

export type HoverTarget =
  | { type: 'floor'; cell: Cell }
  | { type: 'entity'; id: string }
  | { type: 'character'; id: string; name: string };

export interface ExploreViewCallbacks {
  onHover?(target: HoverTarget | null): void;
  onMoveTo?(cell: Cell): void;
  onInteract?(entityId: string): void;
}

/** Optional art seam used by isolated visual pilots; gameplay still comes from MapDef. */
export interface ExploreViewArtOptions {
  visuals?: ExploreVisualMapDef;
  propFactory?: (world: (cell: Cell) => { x: number; z: number }, rng: Rng) => ExploreDressingFactory;
  leaderRig?: (sheet: CharacterSheet, teamColor: number) => CharacterRig;
  dormitoryArchitecture?: { camera: Cell; control: Cell; conduit: Cell };
  pilotBranding?: boolean;
  /** Texture supplied by a visual pilot; the view owns only its per-room clone. */
  floorTexture?: THREE.Texture;
}

/** Convertit une case (éventuellement fractionnaire) en coordonnées monde (centre de la carte à l'origine). */
export function cellToWorld(map: ExploreMap, cell: { x: number; y: number }): { x: number; z: number } {
  return {
    x: (cell.x - (map.width - 1) / 2) * EXPLORE_CELL_SIZE_METERS,
    z: (cell.y - (map.height - 1) / 2) * EXPLORE_CELL_SIZE_METERS,
  };
}

/** Convertit une position monde en case entière, ou `null` hors carte. */
export function worldToCell(map: ExploreMap, x: number, z: number): Cell | null {
  const cx = Math.round(x / EXPLORE_CELL_SIZE_METERS + (map.width - 1) / 2);
  const cy = Math.round(z / EXPLORE_CELL_SIZE_METERS + (map.height - 1) / 2);
  if (cx < 0 || cy < 0 || cx >= map.width || cy >= map.height) return null;
  return { x: cx, y: cy };
}

/**
 * Boîte englobante (coordonnées monde) de toutes les `MapDef.rooms` -- repli sur le rectangle
 * ASCII entier si la carte n'en déclare aucune (défensif, ne devrait pas arriver sur une carte
 * validée par `validateMap`). Voir `ExploreView.contentBounds`.
 */
function computeContentBounds(
  map: ExploreMap,
  def: MapDef,
): { minX: number; maxX: number; minZ: number; maxZ: number } {
  if (def.rooms.length === 0) {
    const nw = cellToWorld(map, { x: 0, y: 0 });
    const se = cellToWorld(map, { x: map.width - 1, y: map.height - 1 });
    return { minX: nw.x, maxX: se.x, minZ: nw.z, maxZ: se.z };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const room of def.rooms) {
    const { origin, width, height } = room.rect;
    const nw = cellToWorld(map, { x: origin.x, y: origin.y });
    const se = cellToWorld(map, { x: origin.x + width - 1, y: origin.y + height - 1 });
    minX = Math.min(minX, nw.x, se.x);
    maxX = Math.max(maxX, nw.x, se.x);
    minZ = Math.min(minZ, nw.z, se.z);
    maxZ = Math.max(maxZ, nw.z, se.z);
  }
  return { minX, maxX, minZ, maxZ };
}

/**
 * Ramene `value` (coordonnee sur un axe ecran) vers l'interieur de `[mapMin, mapMax]`, de sorte
 * que le cadre visible (demi-etendue `halfExtent` de part et d'autre) deborde le moins possible
 * -- voir `ExploreView.frameClampedTarget`. Si la carte est plus etroite que le cadre le long de
 * cet axe (`mapMax - mapMin <= halfExtent * 2`), renvoie le centre de la carte : mieux vaut la
 * montrer en entier qu'exiger un centrage exact sur `value` qui laisserait du vide.
 */
function clampAxisToFrame(value: number, mapMin: number, mapMax: number, halfExtent: number): number {
  if (mapMax - mapMin <= halfExtent * 2) return (mapMin + mapMax) / 2;
  return THREE.MathUtils.clamp(value, mapMin + halfExtent, mapMax - halfExtent);
}

/**
 * Emplacement d'une cellule (mur ou porte) dans un `THREE.InstancedMesh` partagé -- voir
 * `WallInstanceBatch` et la note au-dessus de `recomputeCutaway`. Une seule matrice à réécrire
 * par case et par rotation, au lieu de muter un `Object3D` séparé par case.
 */
interface WallInstanceSlot {
  instancedMesh: THREE.InstancedMesh;
  index: number;
}

interface WallCellInfo {
  wx: number;
  wz: number;
  /** Uniquement les portes : cadre individuel, cible de clic dédiée (`userData.entityId`). */
  doorMesh?: THREE.Mesh;
  /** Corps du mur, hors porte : position dans le lot fusionné par (géométrie, matière). */
  bodyBatch?: WallInstanceSlot;
  /** Socle partagé d'une baie ouverte : visible uniquement lorsque le mur est coupé. */
  cutawayBase?: WallInstanceSlot;
  dormitoryFacade?: boolean;
  holtOwned?: boolean;
  cutaway?: boolean;
  isContainer: boolean;
  control?: THREE.Group;
  /** Ornements fixés à cette face : disparaissent avec le mur coupé, jamais au travers. */
  ornaments?: THREE.Object3D[];
  /** Détails du dortoir visibles seulement après découverte et hors cutaway. */
  discoveredOrnaments?: THREE.Object3D[];
  sides: Side[];
  /** Une case `+` est une ouverture structurelle même sans entité `door` interactive. */
  isDoorCell: boolean;
  door?: DoorEntity;
  panel?: THREE.Mesh;
}

interface DormitoryWindowInstances {
  upper: number;
  frameStart: number;
  glass: number;
  backdrop: number;
}

export class ExploreView {
  readonly scene = new THREE.Scene();
  readonly camera: IsoCamera;
  private dormitoryPerspectiveCamera: DormitoryPerspectiveCamera | null = null;
  private dormitoryPerspectiveActive = false;
  private dormitoryPilotLighting: DormitoryPilotLighting | null = null;
  private dormitoryPilotArchitecture: DormitoryPilotArchitecture | null = null;
  private holtArchitecture: HoltArchitecture | null = null;
  private holtRoomRendering: HoltRoomRendering | null = null;
  private holtCutCellKeys = new Set<string>();
  private holtArchitectureStateKey = '';
  private activeRoomId: string | null = null;
  private dormitoryNightMood: NightMood = null;
  private readonly root = new THREE.Group();
  private readonly map: ExploreMap;
  private readonly def: MapDef;

  private readonly wallCells = new Map<string, WallCellInfo>();
  private readonly roomSidesByCell = new Map<string, Side[]>();
  /**
   * Couloirs déduits du plan (ADR 0027, `computeCorridors`) : leurs murs se coupent comme ceux
   * d'une pièce, mais seulement quand le meneur est dans le couloir (`activeCorridorId`).
   */
  private readonly corridors: CorridorLayout;
  private activeCorridorId: string | null = null;
  /** Visual corridor regions can be distinct inside the same connected gameplay corridor. */
  private activeHoltZoneId: string | null = null;
  private holtReflectionZoom = -1;
  /** Cases de mobilier haut ('T') situées dans la pièce 'garage' : rendues comme des véhicules (voir `buildCells`). */
  private readonly garageCells = new Set<string>();
  /** Cases de mur ('wall') formant l'anneau du garage : tôle plutôt que béton peint (voir `buildCells`). */
  private readonly garageWallCells = new Set<string>();
  private readonly pickables: THREE.Object3D[] = [];
  private readonly floorPlane: THREE.Mesh;
  private readonly hoverOutline: THREE.Mesh;
  private hovered: HoverTarget | null = null;

  /* -- Découverte des lieux (08-EXPLORATION.md "La découverte des lieux") -- */

  /** `RoomDef.id` -> sa définition, pour retrouver `alwaysDiscovered`/le titre sans re-scanner `def.rooms`. */
  private readonly roomsById = new Map<string, RoomDef>();
  /** `RoomDef.id` -> son plan de sol teinté (`buildRoomFloors`), dont la couleur bascule clair/sombre. */
  private readonly roomFloors = new Map<string, THREE.Mesh>();
  /** `RoomDef.id` -> mobilier/décor (o/T/~) DE CETTE PIÈCE (jamais alwaysDiscovered) : visibilité togglée avec la pièce. */
  private readonly roomDecor = new Map<string, THREE.Object3D[]>();
  /**
   * posKey(case) -> id d'une entité npc/object/seat -- le "repli généreux" du clic/survol
   * (08-EXPLORATION.md "Contrôles" : "toute la case d'une entité interactive est cliquable").
   * Porte/sortie n'y figurent pas : déjà bien visées par leur volume de clic direct (voir `pick`).
   */
  private readonly entityCellIndex = new Map<string, string>();
  /** id d'entité npc/object/seat -> centre de sa case en monde : base de la saisie par distance (`pick`). */
  private readonly entityAnchors = new Map<string, { x: number; z: number }>();
  /** id d'entité npc/object/seat -> ses parties visuelles (marqueur + repère au sol), togglées ensemble. */
  private readonly entityVisualParts = new Map<string, THREE.Object3D[]>();
  /** Entités npc/object/seat actuellement actives ET découvertes (nourri par `setVisibleEntities`). */
  private visibleEntityIds = new Set<string>();
  /** Etape narrative courante (ADR 0026, `SceneDef.etape`) : filtre l'habillage propre a une etape (`setEtape`). */
  private currentEtape: string | undefined;
  /** References des trois sources globales (`addExplorationLighting`) : ajustees par `setNightMood`. */
  private readonly explorationLights: ExplorationLights;
  private readonly dormitoryFacadeInfos: WallCellInfo[] = [];
  private readonly dormitoryWindowInfos: WallCellInfo[] = [];
  private readonly dormitoryWindowSlots = new Map<WallCellInfo, DormitoryWindowInstances>();
  private dormitoryWindowMasonry: THREE.InstancedMesh | null = null;
  private dormitoryWindowFrames: THREE.InstancedMesh | null = null;
  private dormitoryWindowGlass: THREE.InstancedMesh | null = null;
  private dormitoryWindowBackdrop: THREE.InstancedMesh | null = null;
  private dormitoryFacadeBand: THREE.InstancedMesh | null = null;
  private dormitoryFloorReflection: Reflector | null = null;
  private readonly dormitoryRoomArchitecture: THREE.Object3D[] = [];
  /** Architectural detailing is grouped by facade so the existing wall cutaway can hide it. */
  private readonly dormitoryCutawayDetails: { sides: Side[]; objects: THREE.Object3D[] }[] = [];
  private readonly dormitoryRoomReflections: Reflector[] = [];
  /** Les portes font partie de l'architecture et restent des cibles directes, hors découverte de pièce. */
  private readonly doorEntityIds = new Set<string>();
  /**
   * Portes ACTIVES (condition d'étape vraie), nourries par `setActiveDoors` ; `null` tant que
   * personne ne l'a appelé (banc d'essai) = toutes. Lot 5.11 : une porte d'une autre étape (les
   * portes de la fuite pendant le bal) se survolait avec son identifiant brut pour libellé
   * (« fuite.porte-cour-ouest ») et ne faisait rien au clic.
   */
  private activeDoorIds: Set<string> | null = null;
  /** Habillage uniquement : `MapDef` reste la vérité pour collision et interactions. */
  private readonly dressing: ExploreDressing;
  private readonly replacedFurnitureCells = new Set<string>();
  private readonly discoveredRoomIds = new Set<string>();
  private readonly architectureMaterials: EnvironmentMaterials;
  /** Matériaux AAA partagés entre le mobilier et les sols HOLT, possédés par cette vue. */
  private readonly dormitoryMaterials: DormitoryMaterials | null;
  private readonly dormitoryFloorMaterials = new Set<THREE.MeshStandardMaterial>();
  /** Ressources propres aux cellules, portes et sols ; les props et rigs ont leur propriétaire. */
  private readonly cellGeometries = new Set<THREE.BufferGeometry>();
  private readonly cellMaterials = new Set<THREE.Material>();
  private readonly cellTextures = new Set<THREE.Texture>();
  /**
   * Passe G (performance) : les arêtes de coupe et les bandes décoratives de TOUS les murs/portes
   * de la carte (des centaines de cases, `docs/art/EXPLORATION-VISUAL-DESIGN.md` §5) partagent
   * chacune une géométrie et une matière uniques -- un candidat idéal pour deux `InstancedMesh`
   * uniques, recalculés à chaque rotation plutôt qu'à chaque image (`recomputeCutaway` reste
   * appelé seulement sur `rotate()`/à la construction, jamais par image). `count` varie d'une
   * rotation à l'autre (seules les cases actuellement coupées/non coupées y figurent) : capacité
   * fixée au nombre total de cases mur+porte, jamais dépassée.
   */
  private topEdgeInstances!: THREE.InstancedMesh;
  private bandInstances!: THREE.InstancedMesh;
  /** Hauteur (fixe, une seule par carte) de la bande décorative -- voir `createWallBand`. */
  private bandHeightY = 0;
  /** À libérer explicitement (`dispose()`) : ni leur géométrie ni leur matière ne leur appartient. */
  private readonly wallInstancedMeshes: THREE.InstancedMesh[] = [];

  private readonly rigs = new Map<string, CharacterRig>();
  /** PNJ décoratifs : leur visibilité reste pilotée par registerVisualEntity. */
  private readonly npcRigs = new Map<string, ExploreNpcRig>();
  private readonly lastRigPos = new Map<string, { x: number; z: number }>();
  /** Dernière case connue du meneur (alimentée par `updateRigPosition`) : sert à `centerOnLeader()`. */
  private leaderCell: Cell | null = null;

  /** Visual door state, initialized from data then kept in sync by `setDoorOpen`. */
  private readonly doorsOpenDefault = new Map<string, boolean>();

  /** Repère au sol de l'objectif, "Tab maintenu" (08-EXPLORATION.md "Les objectifs"). */
  private readonly pingMarker: THREE.Mesh;
  private pingActive = false;
  /**
   * Balise permanente de l'entité qui termine l'étape (voir `setObjectiveTarget`). Distincte du
   * repère "Tab maintenu" (`pingMarker`), qui reste un coup d'œil à la demande : celle-ci est
   * toujours là, pour qu'on sache d'un regard par où l'histoire continue.
   */
  private readonly objectiveBeacon = new THREE.Group();
  private readonly objectiveRing: THREE.Mesh;
  private readonly objectiveChevron: THREE.Mesh;
  private objectiveClock = 0;
  private pingClock = 0;
  /** Horloge du vacillement de feu (`ExploreDressing.tick`) : avance meme reducedMotion, un
   * scintillement de feu n'est pas une animation de confort a couper (contrairement aux deux
   * horloges ci-dessus), mais reste bon marche (une lumiere deja posee, jamais un nouveau mesh). */
  private fireClock = 0;
  private reducedMotion = false;

  /** Quart de tour courant (0..3), suit `IsoCamera` : voir `rotate()`. */
  private quarter = 0;

  /** Bornes du panoramique libre (mètres monde), carte + marge d'une pièce — voir `PAN_MARGIN_METERS`. */
  private readonly panBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /**
   * Boîte englobante (mètres monde) des PIÈCES (`MapDef.rooms`) plutôt que du rectangle ASCII
   * entier : voir `centerOn`/`frameClampedTarget`. Un plan de bâtiment n'est presque jamais un
   * rectangle plein -- le rectangle ASCII contient beaucoup de vide structurel (au-delà des
   * couloirs, entre deux ailes...) que "garder le bâtiment dans le cadre" ne doit pas essayer de
   * remplir, sous peine de re-produire le même défaut (du vide à l'écran) à l'envers.
   */
  private readonly contentBounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  private readonly raycaster = new THREE.Raycaster();

  /** Réglages de rendu propres à `def.id` (ADR 0024 §4) : palette froide, architecture du dortoir. */
  private readonly visuals: ExploreVisuals;
  private readonly enhancedSceneProfile: ExplorationSceneProfile | null;
  private hangarDetails: ReturnType<typeof createHangarDetails> | null = null;
  private industrialCoverDetails: ReturnType<typeof createIndustrialCoverDetails> | null = null;
  private holtAccessoryCutCellKeys = new Set<string>();

  constructor(
    def: MapDef,
    private readonly rng: Rng,
    aspect: number,
    private readonly callbacks: ExploreViewCallbacks = {},
    private readonly art: ExploreViewArtOptions = {},
  ) {
    this.def = def;
    this.map = new ExploreMap(def);
    for (const entity of def.entities) if (entity.type === 'door') this.doorEntityIds.add(entity.id);
    this.camera = new IsoCamera(aspect, { min: ZOOM_MIN, max: ZOOM_MAX });
    this.camera.zoomBy(EXPLORE_INITIAL_ZOOM - this.camera.getZoom(), aspect);

    const halfW = (this.map.width * EXPLORE_CELL_SIZE_METERS) / 2;
    const halfH = (this.map.height * EXPLORE_CELL_SIZE_METERS) / 2;
    this.panBounds = {
      minX: -halfW - PAN_MARGIN_METERS,
      maxX: halfW + PAN_MARGIN_METERS,
      minZ: -halfH - PAN_MARGIN_METERS,
      maxZ: halfH + PAN_MARGIN_METERS,
    };
    this.contentBounds = computeContentBounds(this.map, def);

    this.scene.background = new THREE.Color(0x14151a);
    this.scene.fog = new THREE.Fog(0x14151a, 60, 160);
    this.scene.add(this.root);

    this.visuals = exploreVisualsFor(def.id);
    this.enhancedSceneProfile = explorationSceneProfile(def.id);
    if (this.isRealHoltDormitory()) {
      // Start from the open south-west corner: both pilot-owned north/east facades stay intact,
      // so entry framing presents the windows and full-height room shell before any user turn.
      // The normal four quarter-turns remain relative to this deliberate dormitory composition.
      this.quarter = 1;
      this.camera.rotate(1);
      this.camera.tick(1);
    }
    if (this.enhancedSceneProfile)
      this.dormitoryPerspectiveCamera = new DormitoryPerspectiveCamera(
        this.camera,
        aspect,
        this.enhancedSceneProfile.cameraElevationDeg,
      );
    const isCentre = this.visuals.coldPalette;
    this.dormitoryMaterials = this.enhancedSceneProfile
      ? new DormitoryMaterials(rng.fork(`explore:${def.id}:dormitory-materials`))
      : null;
    if (this.isRealHoltDormitory() && this.dormitoryMaterials) {
      this.dormitoryPilotArchitecture = createDormitoryPilotArchitecture({
        map: this.map,
        materials: this.dormitoryMaterials,
        rng: rng.fork(`explore:${def.id}:dormitory-pilot-architecture`),
      });
      this.root.add(this.dormitoryPilotArchitecture.group);
    }
    this.explorationLights = addExplorationLighting(
      this.scene,
      Math.max(this.map.width, this.map.height),
      isCentre,
    );
    this.architectureMaterials = new EnvironmentMaterials(rng.fork(`explore:${def.id}:architecture`));
    if (this.enhancedSceneProfile && this.dormitoryMaterials) {
      this.holtArchitecture = createHoltArchitecture({
        map: this.map,
        dormitoryMaterials: this.dormitoryMaterials,
        environmentMaterials: this.architectureMaterials,
        profiles: this.enhancedSceneProfile.architecture,
        wallHeights: this.enhancedSceneProfile.wallHeights,
        wallTint: this.enhancedSceneProfile.wallTint,
        wallPaintTint: this.enhancedSceneProfile.wallPaintTint,
        entityDoorLeaves: new Set(def.id === 'conduits' ? ['conduits.ventilateur-pales'] : []),
      });
      this.root.add(this.holtArchitecture.group);
      this.pickables.push(...this.holtArchitecture.pickables);
      this.holtRoomRendering = createHoltRoomRendering({
        map: this.map,
        dormitoryMaterials: this.dormitoryMaterials,
        architectureLayout: this.holtArchitecture.layout,
        profiles: this.enhancedSceneProfile.rooms,
        wallGeometry: this.holtArchitecture.geometry,
      });
      this.root.add(this.holtRoomRendering.group);
      if (this.isRealHoltDormitory()) {
        this.hangarDetails = createHangarDetails({
          map: this.map,
          materials: this.dormitoryMaterials,
          architectureLayout: this.holtArchitecture.layout,
          wallGeometry: this.holtArchitecture.geometry,
        });
        this.root.add(this.hangarDetails.group);
      }
    }
    const visualDef = this.visualDefinition(def.id);
    for (const placement of visualDef.placements) {
      for (const cell of placement.replaces ?? []) this.replacedFurnitureCells.add(posKey(cell));
    }
    const world = (cell: Cell) => cellToWorld(this.map, cell);
    const propRng = rng.fork(`explore:${def.id}`);
    this.dressing = new ExploreDressing(
      visualDef,
      this.art.propFactory?.(world, propRng) ??
        new EnvironmentPropFactory(world, propRng, isCentre, this.dormitoryMaterials ?? undefined),
    );
    this.root.add(this.dressing.root);

    const w = this.map.width * EXPLORE_CELL_SIZE_METERS;
    const h = this.map.height * EXPLORE_CELL_SIZE_METERS;
    const groundGeometry = new THREE.PlaneGeometry(w, h);
    const groundMaterial = this.floorMaterial(true, w, h);
    this.cellGeometries.add(groundGeometry);
    this.floorPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.floorPlane.rotation.x = -Math.PI / 2;
    this.floorPlane.receiveShadow = true;
    // Invisible (jamais retiré : il reste la cible des clics de déplacement) sur une carte sans sol
    // entre ses pièces (`ExploreVisuals.exteriorGround`, les conduits du lot 5.9).
    this.floorPlane.visible = this.visuals.exteriorGround !== false;
    this.root.add(this.floorPlane);
    this.buildRoomFloors();

    const hoverOutlineGeometry = new THREE.RingGeometry(0.42, 0.5, 24);
    const hoverOutlineMaterial = new THREE.MeshBasicMaterial({
      color: HOVER_COLOR,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.cellGeometries.add(hoverOutlineGeometry);
    this.cellMaterials.add(hoverOutlineMaterial);
    this.hoverOutline = new THREE.Mesh(hoverOutlineGeometry, hoverOutlineMaterial);
    this.hoverOutline.rotation.x = -Math.PI / 2;
    this.hoverOutline.position.y = 0.03;
    this.hoverOutline.visible = false;
    this.root.add(this.hoverOutline);

    const pingGeometry = new THREE.RingGeometry(0.3, 0.58, 28);
    const pingMaterial = new THREE.MeshBasicMaterial({
      color: HOVER_COLOR,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.cellGeometries.add(pingGeometry);
    this.cellMaterials.add(pingMaterial);
    this.pingMarker = new THREE.Mesh(pingGeometry, pingMaterial);
    this.pingMarker.rotation.x = -Math.PI / 2;
    this.pingMarker.position.y = 0.05;
    this.pingMarker.visible = false;
    this.root.add(this.pingMarker);

    // Deux pièces : un anneau au sol, qui dit QUELLE CASE, et un chevron flottant rendu
    // par-dessus tout (`depthTest: false`) qui dit OÙ REGARDER -- sans lui, la balise disparaît
    // derrière un mur coupé ou une armoire dès qu'on tourne la caméra, c'est-à-dire exactement
    // quand on la cherche.
    const objectiveRingGeometry = new THREE.RingGeometry(0.42, 0.6, 32);
    const objectiveRingMaterial = new THREE.MeshBasicMaterial({
      color: OBJECTIVE_COLOR,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.objectiveRing = new THREE.Mesh(objectiveRingGeometry, objectiveRingMaterial);
    this.objectiveRing.rotation.x = -Math.PI / 2;
    this.objectiveRing.position.y = 0.04;
    const chevronGeometry = new THREE.ConeGeometry(0.17, 0.34, 4);
    const chevronMaterial = new THREE.MeshBasicMaterial({
      color: OBJECTIVE_COLOR,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      depthTest: false,
    });
    this.objectiveChevron = new THREE.Mesh(chevronGeometry, chevronMaterial);
    this.objectiveChevron.rotation.x = Math.PI; // pointe vers le bas, vers la case
    this.objectiveChevron.renderOrder = 10;
    this.objectiveChevron.position.y = OBJECTIVE_CHEVRON_HEIGHT;
    // Une hampe très fine relie le chevron à sa case : en isométrie, un marqueur flottant seul
    // se lit à deux cases de l'objet qu'il désigne. Elle traverse le décor comme le chevron,
    // sinon elle ne relierait plus rien dès qu'une table passe devant.
    const stemGeometry = new THREE.CylinderGeometry(0.022, 0.022, OBJECTIVE_CHEVRON_HEIGHT - 0.24, 6);
    const stemMaterial = new THREE.MeshBasicMaterial({
      color: OBJECTIVE_COLOR,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      depthTest: false,
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = (OBJECTIVE_CHEVRON_HEIGHT - 0.24) / 2;
    stem.renderOrder = 9;
    this.cellGeometries.add(stemGeometry);
    this.cellMaterials.add(stemMaterial);
    this.objectiveBeacon.add(this.objectiveRing, this.objectiveChevron, stem);
    this.objectiveBeacon.visible = false;
    this.root.add(this.objectiveBeacon);
    this.cellGeometries.add(objectiveRingGeometry);
    this.cellGeometries.add(chevronGeometry);
    this.cellMaterials.add(objectiveRingMaterial);
    this.cellMaterials.add(chevronMaterial);

    for (const e of def.entities) {
      if (e.type === 'door') this.doorsOpenDefault.set(e.id, !e.locked);
    }

    this.computeRoomSides();
    this.corridors = computeCorridors(this.map, def);
    this.computeGarageCells();
    this.buildCells();
    if (def.id === 'centre-examen') {
      const cells: IndustrialCoverCell[] = [];
      const yard = def.rooms.find((room) => room.id === 'cour')?.rect;
      if (yard)
        for (let y = yard.origin.y; y < yard.origin.y + yard.height; y++) {
          for (let x = yard.origin.x; x < yard.origin.x + yard.width; x++) {
            const kind = this.map.kindAt({ x, y });
            if (kind === 'wall' || kind === 'furnitureLow')
              cells.push({ x, y, kind: kind === 'wall' ? 'container' : 'crate' });
          }
        }
      this.industrialCoverDetails = createIndustrialCoverDetails({
        cells,
        world: (cell) => cellToWorld(this.map, cell),
        materials: this.architectureMaterials,
      });
      this.root.add(this.industrialCoverDetails.group);
    }
    this.buildDormitoryRoomFinish();
    if (this.enhancedSceneProfile && !this.isRealHoltDormitory()) this.buildFloorReflection(1, 1, 0, 0);
    this.buildDormitoryArchitecture();
    this.buildEntityMarkers();
    this.syncDressingVisibility();
    this.updateFog();
  }

  private visualDefinition(mapId: string): ExploreVisualMapDef {
    if (this.art.visuals) return this.art.visuals;
    if (mapId === HOLT_VISUALS.mapId) return HOLT_VISUALS;
    if (mapId === CENTRE_EXAMEN_VISUALS.mapId) return CENTRE_EXAMEN_VISUALS;
    return { mapId, placements: [] };
  }

  /** Camera actually displayed, shared by the converted HOLT zones. */
  get renderCamera(): THREE.Camera {
    if (this.dormitoryPerspectiveActive && this.dormitoryPerspectiveCamera) {
      this.dormitoryPerspectiveCamera.sync();
      return this.dormitoryPerspectiveCamera.camera;
    }
    return this.camera.camera;
  }

  get isEnhancedExplorationRenderingActive(): boolean {
    return this.dormitoryPerspectiveActive;
  }

  get isEnhancedHoltRenderingActive(): boolean {
    return this.isEnhancedExplorationRenderingActive;
  }

  private shouldUseHoltPerspective(): boolean {
    // One camera across HOLT also covers doorway cells and prevents threshold flashes.
    return this.dormitoryPerspectiveCamera !== null;
  }

  /** Build the pilot lighting rig after its window positions and map renderer are ready. */
  initializeDormitoryPilotLighting(widthPx: number, heightPx: number): void {
    if (this.dormitoryPilotLighting || !this.dormitoryPerspectiveCamera || !this.dormitoryMaterials) return;
    const room = this.roomsById.get('dortoirs');
    const architecture = this.dormitoryPilotArchitecture;
    if (!room || !architecture || architecture.windows.length === 0) return;
    this.dormitoryPilotLighting = createDormitoryPilotLighting({
      scene: this.scene,
      camera: this.dormitoryPerspectiveCamera.camera,
      windowCenters: architecture.windows.map((window) => window.center),
      windowSizes: architecture.windows.map(({ width, height }) => ({ width, height })),
      roomBounds: architecture.roomBounds,
    });
    this.dormitoryPilotLighting.resize(widthPx, heightPx);
    this.syncDormitoryPilotLighting();
  }

  private syncDormitoryPilotLighting(): void {
    const cutSides = new Set<Side>();
    for (const side of ['north', 'south', 'east', 'west'] as const) {
      if (this.isCut([side])) cutSides.add(side);
    }
    this.dormitoryPilotArchitecture?.setState({
      active: this.isRealHoltDormitory(),
      discovered: this.discoveredRoomIds.has('dortoirs'),
      cutSides,
      night: this.dormitoryNightMood,
    });
    this.dormitoryPilotLighting?.update({
      active: this.isRealHoltDormitory() && this.activeRoomId === 'dortoirs',
      discovered: this.discoveredRoomIds.has('dortoirs'),
      night: this.dormitoryNightMood,
      wallCut: cutSides.has('east'),
    });
    this.syncHoltArchitecture();
    this.syncHoltRoomRendering();
  }

  private syncHoltRoomRendering(): void {
    this.holtRoomRendering?.update({
      activeZoneId: this.activeHoltZoneId,
      leaderCell: this.leaderCell ?? undefined,
      discoveredRoomIds: this.discoveredRoomIds,
      cutCellKeys: this.holtAccessoryCutCellKeys,
      night: this.dormitoryNightMood,
    });
    this.syncHoltFloorReflection();
  }

  private syncHoltFloorReflection(): void {
    const reflector = this.dormitoryFloorReflection;
    if (!reflector) return;
    const dormitory = this.isRealHoltDormitory() && this.activeRoomId === 'dortoirs';
    const profile = this.enhancedSceneProfile?.rooms.find(
      (candidate) => candidate.zoneId === this.activeRoomId,
    );
    const room = this.activeRoomId ? this.roomsById.get(this.activeRoomId) : undefined;
    const rect = dormitory ? room?.rect : (profile?.rect ?? room?.rect);
    const surface = profile?.reflectionSurface;
    const zoom = this.camera.getZoom();
    this.holtReflectionZoom = zoom;
    const zoomGain = THREE.MathUtils.clamp(
      (HOLT_REFLECTION_STOP_ZOOM - zoom) / (HOLT_REFLECTION_STOP_ZOOM - HOLT_REFLECTION_FADE_START_ZOOM),
      0,
      1,
    );
    const gain = (dormitory ? 1 : (surface?.gain ?? profile?.floor.reflectionGain ?? 0)) * zoomGain;
    reflector.visible = Boolean(
      rect && gain > 0 && this.activeRoomId && this.discoveredRoomIds.has(this.activeRoomId),
    );
    if (!rect || !reflector.visible) return;
    const geometry = reflector.geometry as THREE.PlaneGeometry;
    reflector.scale.set(
      (surface?.width ?? rect.width) / geometry.parameters.width,
      (surface?.height ?? rect.height) / geometry.parameters.height,
      1,
    );
    reflector.position.set(
      (surface?.center.x ?? rect.origin.x + (rect.width - 1) / 2) - (this.map.width - 1) / 2,
      surface ? surface.elevation + 0.012 : dormitory ? 0.016 : 0.041,
      (surface?.center.y ?? rect.origin.y + (rect.height - 1) / 2) - (this.map.height - 1) / 2,
    );
    const shader = reflector.material as THREE.ShaderMaterial;
    const floor = this.holtRoomRendering?.floorMaterials.get(this.activeRoomId!);
    shader.uniforms.reflectionGain!.value = gain;
    shader.uniforms.surface!.value = dormitory ? this.dormitoryMaterials?.getTexture('floor') : floor?.map;
    (shader.uniforms.surfaceRepeat!.value as THREE.Vector2).copy(
      dormitory ? new THREE.Vector2(4, 4) : (floor?.map?.repeat ?? new THREE.Vector2(4, 4)),
    );
  }

  private syncHoltArchitecture(): void {
    const architecture = this.holtArchitecture;
    if (!architecture) return;
    this.hangarDetails?.update(this.discoveredRoomIds.has('garage'), this.holtAccessoryCutCellKeys);
    const key = [
      [...this.discoveredRoomIds].sort().join(','),
      [...this.holtCutCellKeys].sort().join(','),
      this.activeDoorIds ? [...this.activeDoorIds].sort().join(',') : '*',
      [...this.doorsOpenDefault].map(([id, open]) => `${id}:${open}`).join(','),
      this.dormitoryNightMood ?? '',
    ].join('|');
    if (this.holtArchitectureStateKey === key) return;
    this.holtArchitectureStateKey = key;
    architecture.setState({
      active: true,
      night: this.dormitoryNightMood !== null,
      discoveredRoomIds: new Set(this.discoveredRoomIds),
      cutCellKeys: this.holtCutCellKeys,
      activeDoorIds: this.activeDoorIds ?? undefined,
      isDoorOpen: (id) => this.doorsOpenDefault.get(id) ?? true,
    });
  }

  /** Walls retain their constructed height through movement, discovery and camera turns. */
  private updateHoltCutaway(): void {
    if (!this.holtArchitecture) return;
    this.holtCutCellKeys.clear();
    this.holtAccessoryCutCellKeys.clear();
    this.syncHoltArchitecture();
    this.syncHoltRoomRendering();
  }
  private screenBasisXZ(): { right: { x: number; z: number }; up: { x: number; z: number } } {
    if (!(this.dormitoryPerspectiveActive && this.dormitoryPerspectiveCamera)) {
      return { right: this.camera.screenRightXZ(), up: this.camera.screenUpXZ() };
    }
    const camera = this.dormitoryPerspectiveCamera.camera;
    camera.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    right.y = 0;
    up.y = 0;
    right.normalize();
    up.normalize();
    return { right: { x: right.x, z: right.z }, up: { x: up.x, z: up.z } };
  }

  /**
   * Case du mur habillée en conteneur empilé (cour de combat embarquée, ADR 0024 §4) : dérivé
   * directement de `MapDef.tacticalArea` -- toute carte qui embarque la cour tactique (30×20,
   * `YARD_SIZE`) hérite du même habillage, sans registre séparé à tenir synchronisé.
   */
  private isContainerYardCell(x: number, y: number): boolean {
    const area = this.def.tacticalArea;
    if (!area) return false;
    return (
      x >= area.origin.x &&
      x < area.origin.x + YARD_SIZE.width &&
      y >= area.origin.y &&
      y < area.origin.y + YARD_SIZE.height
    );
  }

  /* ------------------------------------------------------------------ */
  /* Construction du décor                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Sol légèrement teinté par pièce (`MapDef.rooms`), au-dessus du sol de base : on reconnaît
   * une pièce d'un coup d'œil sans casser l'harmonie de palette (portée du lot, voir en-tête
   * de fichier). Écart déterministe dérivé de l'identifiant de la pièce — aucun aléa
   * (AGENTS.md règle 1), les couloirs (hors `MapDef.rooms`) gardent le sol de base.
   */
  private buildRoomFloors(): void {
    for (const room of this.def.rooms as RoomDef[]) {
      this.roomsById.set(room.id, room);
      const { origin, width, height } = room.rect;
      const center = { x: origin.x + (width - 1) / 2, y: origin.y + (height - 1) / 2 };
      const { x: wx, z: wz } = cellToWorld(this.map, center);
      // Pessimiste par défaut (pièce non découverte, sauf `alwaysDiscovered`) : `setDiscoveredRooms`
      // corrige AVANT le premier rendu (appelée synchroniquement par l'appelant juste après la
      // construction), donc jamais de flash "tout éclairé" à l'écran.
      const initialColor = room.alwaysDiscovered === true;
      const geometry = new THREE.PlaneGeometry(
        width * EXPLORE_CELL_SIZE_METERS,
        height * EXPLORE_CELL_SIZE_METERS,
      );
      this.cellGeometries.add(geometry);
      const plane = new THREE.Mesh(geometry, this.floorMaterial(initialColor, width, height, room.id));
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(wx, 0.006, wz);
      plane.receiveShadow = true;
      this.root.add(plane);
      this.roomFloors.set(room.id, plane);
    }
  }

  private computeGarageCells(): void {
    for (const room of this.def.rooms as RoomDef[]) {
      if (room.id !== 'garage') continue;
      const { origin, width, height } = room.rect;
      for (let y = origin.y; y < origin.y + height; y++) {
        for (let x = origin.x; x < origin.x + width; x++) this.garageCells.add(`${x},${y}`);
      }
      // L'anneau de mur qui entoure le rectangle intérieur : `room.rect` ne couvre que le sol
      // (voir `computeRoomSides`, qui pose les murs à `origin - 1`/`origin + dimension`). Filtré
      // par `kindAt === 'wall'` pour ne pas confondre une porte du garage (qui garde son cadre).
      for (let y = origin.y - 1; y <= origin.y + height; y++) {
        for (let x = origin.x - 1; x <= origin.x + width; x++) {
          if (this.map.kindAt({ x, y }) === 'wall') this.garageWallCells.add(`${x},${y}`);
        }
      }
    }
  }

  private computeRoomSides(): void {
    const add = (x: number, y: number, side: Side) => {
      const key = `${x},${y}`;
      const arr = this.roomSidesByCell.get(key) ?? [];
      arr.push(side);
      this.roomSidesByCell.set(key, arr);
    };
    for (const room of this.def.rooms as RoomDef[]) {
      const { origin, width, height } = room.rect;
      for (let x = origin.x - 1; x <= origin.x + width; x++) {
        add(x, origin.y - 1, 'north');
        add(x, origin.y + height, 'south');
      }
      for (let y = origin.y - 1; y <= origin.y + height; y++) {
        add(origin.x - 1, y, 'west');
        add(origin.x + width, y, 'east');
      }
    }
  }

  private doorAt(cell: Cell): DoorEntity | undefined {
    return this.def.entities.find(
      (e): e is DoorEntity => e.type === 'door' && e.cell.x === cell.x && e.cell.y === cell.y,
    );
  }

  /**
   * Enregistre `parts` (mobilier bas/haut, végétation) comme "contenu" de la pièce contenant
   * `(x, y)`, s'il y en a une qui se découvre (08-EXPLORATION.md "La découverte des lieux" :
   * "son contenu est caché -- mobilier, objets, figurants, cadets"). Pessimiste par défaut
   * (masqué) : `setDiscoveredRooms` corrige avant le premier rendu. Hors pièce (couloir,
   * extérieur) ou pièce `alwaysDiscovered` (la cour de containers) : rien à faire, `parts`
   * garde sa visibilité par défaut (affiché).
   */
  private trackRoomDecor(x: number, y: number, parts: THREE.Object3D[]): void {
    const room = roomAt(this.def, { x, y });
    if (!room || room.alwaysDiscovered) return;
    for (const part of parts) part.visible = false;
    const arr = this.roomDecor.get(room.id) ?? [];
    arr.push(...parts);
    this.roomDecor.set(room.id, arr);
  }

  /** Prend ownership des géométries créées par un constructeur d'architecture; ses matériaux restent empruntés. */
  private ownGeneratedGeometry(root: THREE.Object3D): void {
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) this.cellGeometries.add(object.geometry);
    });
  }

  private buildCells(): void {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    this.cellGeometries.add(unitBox);
    const containerBox = unitBox.clone();
    const containerColors = new Float32Array(containerBox.getAttribute('position').count * 3).fill(1);
    // BoxGeometry : +Y occupe les sommets 8–11. Assombrir le toit sans six matériaux
    // évite plusieurs appels de dessin par case de container dans la grande cour.
    for (let i = 8; i < 12; i++) {
      containerColors[i * 3] = 0.54;
      containerColors[i * 3 + 1] = 0.58;
      containerColors[i * 3 + 2] = 0.59;
    }
    containerBox.setAttribute('color', new THREE.BufferAttribute(containerColors, 3));
    this.cellGeometries.add(containerBox);
    const wallMat = this.architectureMaterials.get(
      this.visuals.coldPalette ? 'coldConcreteWall' : 'creamConcreteWall',
    );
    const dormitoryWallMat = this.dormitoryMaterials?.get('wall');
    // Le garage est un hangar, pas une salle de béton peint : ses murs portent une tôle ondulée
    // photo CC0 (`corrugatedSteel`) plutôt que la même peinture que le reste de l'académie --
    // ROOM-COMPOSITION.md "Garage" demande une matière distincte ("tôle mate"), et c'est une
    // grande surface (les murs occupent l'écran), priorité du mandat passe D.
    const garageWallMat = this.architectureMaterials.get('corrugatedSteel');
    const containerSteel = this.architectureMaterials.get('containerSteel');
    const containerSides = [0x536f7e, 0x8a5549, 0x93805c].map((color) => {
      const material = containerSteel.clone();
      material.color.setHex(color);
      material.vertexColors = true;
      this.cellMaterials.add(material);
      return material;
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: DOOR_FRAME_COLOR,
      roughness: 0.7,
      metalness: 0.2,
    });
    this.cellMaterials.add(frameMat);
    const furnitureLowMat = new THREE.MeshStandardMaterial({ color: FURNITURE_LOW_COLOR, roughness: 0.9 });
    const furnitureHighMat = new THREE.MeshStandardMaterial({
      color: FURNITURE_HIGH_COLOR,
      roughness: 0.8,
      metalness: 0.15,
    });
    this.cellMaterials.add(furnitureLowMat);
    this.cellMaterials.add(furnitureHighMat);
    const glassMat = new THREE.MeshStandardMaterial({
      color: GLASS_COLOR,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.6,
    });
    this.cellMaterials.add(glassMat);
    const vegetationMat = new THREE.MeshStandardMaterial({ color: VEGETATION_COLOR, roughness: 1 });
    this.cellMaterials.add(vegetationMat);
    // Matériau lit (pas `MeshBasicMaterial`) et semi-transparent : sur une grande carte, une arête
    // pleinement lumineuse et uniforme sur CHAQUE mur coupé lit comme un filaire qui écrase tout
    // le reste (voir le commentaire de `CUT_EDGE_COLOR`). Ici l'éclairage de la scène la nuance.
    const edgeMat = new THREE.MeshStandardMaterial({
      color: CUT_EDGE_COLOR,
      roughness: 0.7,
      transparent: true,
      opacity: 0.55,
    });
    this.cellMaterials.add(edgeMat);
    const vehicleMat = new THREE.MeshStandardMaterial({
      color: VEHICLE_COLOR,
      roughness: 0.45,
      metalness: 0.35,
      emissive: VEHICLE_COLOR,
      emissiveIntensity: 0.1,
    });
    this.cellMaterials.add(vehicleMat);
    const vehicleGlassMat = new THREE.MeshStandardMaterial({
      color: VEHICLE_GLASS_COLOR,
      roughness: 0.2,
      metalness: 0.6,
    });
    this.cellMaterials.add(vehicleGlassMat);

    // Passe G (performance) : le corps de CHAQUE mur/porte était un `THREE.Mesh` séparé --
    // des centaines d'appels de dessin rien que pour la coque du bâtiment, avant même le
    // mobilier (voir la note sur `topEdgeInstances`/`bandInstances`). Les cases non-porte sont
    // regroupées par (géométrie, matière) et fusionnées après la boucle ; les portes restent
    // individuelles (cible de clic dédiée, `userData.entityId`).
    const wallBodyCandidates: {
      key: string;
      wx: number;
      wz: number;
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
    }[] = [];

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const kind = this.map.kindAt({ x, y });
        if (kind === 'floor' || kind === 'void') continue;
        const { x: wx, z: wz } = cellToWorld(this.map, { x, y });
        const key = `${x},${y}`;
        const sides = this.roomSidesByCell.get(key) ?? [];

        if (kind === 'wall' || kind === 'door') {
          const isDoorCell = kind === 'door';
          const isContainer = kind === 'wall' && this.isContainerYardCell(x, y);
          const side = containerSides[
            (Math.floor(x / 7) + Math.floor(y / 5)) % containerSides.length
          ] as THREE.Material;
          const plainWallMat = this.garageWallCells.has(key)
            ? garageWallMat
            : this.isDormitoryFacadeCell(x, y) && dormitoryWallMat
              ? dormitoryWallMat
              : wallMat;
          const geometry = isContainer ? containerBox : unitBox;
          const material = isContainer ? side : isDoorCell ? frameMat : plainWallMat;

          const isDormitoryFacade = this.isDormitoryFacadeCell(x, y);
          const info: WallCellInfo = {
            wx,
            wz,
            sides,
            isContainer,
            isDoorCell,
            dormitoryFacade: isDormitoryFacade,
          };
          if (isDormitoryFacade) this.dormitoryFacadeInfos.push(info);

          if (this.holtArchitecture?.layout.replacedCellKeys.has(key)) {
            info.holtOwned = true;
            this.wallCells.set(key, info);
            continue;
          }

          if (isDoorCell) {
            // Le cadre reste un maillage individuel : cible de clic dédiée (`userData.entityId`)
            // et linteau qui se réduit indépendamment quand la porte est coupée.
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.x = wx;
            mesh.position.z = wz;
            this.root.add(mesh);
            info.doorMesh = mesh;
          } else {
            if (!isDormitoryFacade && this.isDormitoryWindowCell(x, y)) {
              this.dormitoryWindowInfos.push(info);
            } else if (!isDormitoryFacade) {
              wallBodyCandidates.push({ key, wx, wz, geometry, material });
            }
          }

          if (isDoorCell) {
            const door = this.doorAt({ x, y });
            if (door) {
              const panel = new THREE.Mesh(
                unitBox,
                new THREE.MeshStandardMaterial({ color: DOOR_PANEL_COLOR, roughness: 0.85 }),
              );
              this.cellMaterials.add(panel.material);
              panel.scale.set(0.86, 1, 0.16);
              panel.position.x = wx;
              panel.position.z = wz;
              panel.userData.entityId = door.id;
              panel.visible = !(this.doorsOpenDefault.get(door.id) ?? true);
              this.root.add(panel);
              this.pickables.push(panel);
              info.door = door;
              info.panel = panel;
              const control = createDoorControl(this.architectureMaterials);
              this.ownGeneratedGeometry(control);
              control.position.set(wx, 0, wz);
              this.root.add(control);
              info.control = control;
              // Le cadre (fixe, toujours visible) sert aussi de cible de clic.
              info.doorMesh!.userData.entityId = door.id;
              this.pickables.push(info.doorMesh!);
            }
          }

          this.wallCells.set(key, info);
          continue;
        }

        if (kind === 'furnitureLow') {
          if (this.replacedFurnitureCells.has(key)) continue;
          const inYard = this.def.id === 'centre-examen' && roomAt(this.def, { x, y })?.id === 'cour';
          const mesh = new THREE.Mesh(
            unitBox,
            inYard ? this.architectureMaterials.get('wood') : furnitureLowMat,
          );
          mesh.scale.set(0.8, FURNITURE_LOW_HEIGHT, 0.8);
          mesh.position.set(wx, FURNITURE_LOW_HEIGHT / 2, wz);
          mesh.castShadow = true;
          this.root.add(mesh);
          this.trackRoomDecor(x, y, [mesh]);
        } else if (kind === 'furnitureHigh') {
          if (this.replacedFurnitureCells.has(key)) continue;
          if (this.garageCells.has(key)) {
            // Véhicule du garage : même case ('T') que l'agrès/l'arbre ailleurs sur la carte,
            // mais rendu distinct (carrosserie + pavillon vitré) pour que les deux véhicules du
            // garage se distinguent l'un de l'autre et du reste du mobilier haut.
            const vehicleHeight = 1.3;
            const body = new THREE.Mesh(unitBox, vehicleMat);
            body.scale.set(0.92, vehicleHeight, 0.92);
            body.position.set(wx, vehicleHeight / 2, wz);
            body.castShadow = true;
            body.receiveShadow = true;
            this.root.add(body);
            const roof = new THREE.Mesh(unitBox, vehicleGlassMat);
            roof.scale.set(0.68, 0.4, 0.68);
            roof.position.set(wx, vehicleHeight + 0.2, wz);
            roof.castShadow = true;
            this.root.add(roof);
            this.trackRoomDecor(x, y, [body, roof]);
          } else {
            const mesh = new THREE.Mesh(unitBox, furnitureHighMat);
            mesh.scale.set(0.9, FURNITURE_HIGH_HEIGHT, 0.9);
            mesh.position.set(wx, FURNITURE_HIGH_HEIGHT / 2, wz);
            mesh.castShadow = true;
            this.root.add(mesh);
            this.trackRoomDecor(x, y, [mesh]);
          }
        } else if (kind === 'glass') {
          // Vitre/grille : structurelle, part du "plan" du lieu (08-EXPLORATION.md "garde sa
          // forme -- murs, porte, dimensions") -- jamais cachée par la découverte, comme les murs.
          const mesh = new THREE.Mesh(unitBox, glassMat);
          mesh.scale.set(0.94, GLASS_HEIGHT, 0.12);
          mesh.position.set(wx, GLASS_HEIGHT / 2, wz);
          this.root.add(mesh);
        } else if (kind === 'vegetation') {
          if (this.replacedFurnitureCells.has(key)) continue;
          const jitterX = (this.rng.next() - 0.5) * 0.3;
          const jitterZ = (this.rng.next() - 0.5) * 0.3;
          const geometry = new THREE.SphereGeometry(0.42, 8, 6);
          this.cellGeometries.add(geometry);
          const mesh = new THREE.Mesh(geometry, vegetationMat);
          mesh.position.set(wx + jitterX, VEGETATION_HEIGHT / 2, wz + jitterZ);
          mesh.castShadow = true;
          this.root.add(mesh);
          this.trackRoomDecor(x, y, [mesh]);
        }
      }
    }

    if (!this.dormitoryPilotArchitecture) {
      this.buildDormitoryWindowBatches(unitBox, dormitoryWallMat ?? wallMat, frameMat, glassMat);
      this.buildDormitoryFacadeDetails(unitBox);
      this.buildDormitoryFacadeBand(unitBox);
    }

    // Corps des murs (hors porte) : un `InstancedMesh` par (géométrie, matière) -- quelques lots
    // (béton peint, tôle du garage, jusqu'à trois teintes de container) au lieu d'un maillage par
    // case. Transform recalculée à chaque rotation (`recomputeCutaway`), jamais par image.
    const bodyBuckets = new Map<
      string,
      { geometry: THREE.BufferGeometry; material: THREE.Material; keys: string[] }
    >();
    for (const candidate of wallBodyCandidates) {
      const bucketKey = `${candidate.geometry.uuid}\u0000${candidate.material.uuid}`;
      const bucket = bodyBuckets.get(bucketKey);
      if (bucket) bucket.keys.push(candidate.key);
      else
        bodyBuckets.set(bucketKey, {
          geometry: candidate.geometry,
          material: candidate.material,
          keys: [candidate.key],
        });
    }
    for (const { geometry, material, keys } of bodyBuckets.values()) {
      const instancedMesh = new THREE.InstancedMesh(geometry, material, keys.length);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      this.root.add(instancedMesh);
      this.wallInstancedMeshes.push(instancedMesh);
      keys.forEach((key, index) => {
        const info = this.wallCells.get(key);
        if (info) info.bodyBatch = { instancedMesh, index };
      });
    }

    // Arêtes de coupe et bandes décoratives : partagées par TOUTES les cases mur/porte de la
    // carte (voir `topEdgeInstances`/`bandInstances`) -- capacité au nombre total de cases,
    // `count` réduit à chaque rotation par `recomputeCutaway` à celles réellement affichées.
    const bandTemplate = createWallBand(this.architectureMaterials, this.visuals.coldPalette);
    this.bandHeightY = bandTemplate.position.y;
    this.topEdgeInstances = new THREE.InstancedMesh(unitBox, edgeMat, this.wallCells.size);
    this.topEdgeInstances.count = 0;
    this.root.add(this.topEdgeInstances);
    this.wallInstancedMeshes.push(this.topEdgeInstances);
    this.bandInstances = new THREE.InstancedMesh(
      bandTemplate.geometry,
      bandTemplate.material as THREE.Material,
      this.wallCells.size,
    );
    this.bandInstances.receiveShadow = true;
    this.bandInstances.count = 0;
    this.root.add(this.bandInstances);
    this.wallInstancedMeshes.push(this.bandInstances);

    this.recomputeCutaway();
  }

  /** Première tranche HOLT : surveillance et câblage concentrés sur le sas du dortoir. */
  private buildDormitoryArchitecture(): void {
    if (!this.visuals.dormitoryArchitecture && !this.art.dormitoryArchitecture) return;
    const add = (cell: Cell, detail: THREE.Group) => {
      const wall = this.wallCells.get(posKey(cell));
      if (!wall) return;
      const { x, z } = cellToWorld(this.map, cell);
      // Les props peuvent déjà porter un décalage local vers la face intérieure du mur.
      detail.position.set(x + detail.position.x, detail.position.y, z + detail.position.z);
      this.root.add(detail);
      const ornaments = wall.ornaments ?? [];
      ornaments.push(detail);
      wall.ornaments = ornaments;
    };
    const addDiscovered = (cell: Cell, detail: THREE.Group) => {
      const wall = this.wallCells.get(posKey(cell));
      if (!wall) return;
      const { x, z } = cellToWorld(this.map, cell);
      detail.position.set(x + detail.position.x, detail.position.y, z + detail.position.z);
      this.root.add(detail);
      detail.visible = false;
      const ornaments = wall.discoveredOrnaments ?? [];
      ornaments.push(detail);
      wall.discoveredOrnaments = ornaments;
    };
    // Mur ouest du dortoir : le triplet encadre la porte 25,7 et avance vers la salle,
    // donc il reste lisible depuis l'iso au lieu de se perdre derrière le mur nord ou le HUD.
    const camera = createSurveillanceCamera(this.architectureMaterials);
    this.ownGeneratedGeometry(camera);
    camera.rotation.y = Math.PI / 2;
    camera.position.x = 0.42;
    add(this.art.dormitoryArchitecture?.camera ?? { x: 25, y: 6 }, camera);
    const control = createDoorControl(this.architectureMaterials);
    this.ownGeneratedGeometry(control);
    control.rotation.y = Math.PI / 2;
    control.position.x = 0.42;
    add(this.art.dormitoryArchitecture?.control ?? { x: 25, y: 7 }, control);
    const conduit = createTechnicalConduit(this.architectureMaterials, 1.7);
    this.ownGeneratedGeometry(conduit);
    conduit.rotation.y = Math.PI / 2;
    conduit.position.x = 0.42;
    add(this.art.dormitoryArchitecture?.conduit ?? { x: 25, y: 8 }, conduit);
    if (this.isRealHoltDormitory() && !this.dormitoryPilotArchitecture) {
      this.buildDormitoryHoltSign(addDiscovered);
    }
    if (this.art.pilotBranding) this.buildPilotDormitoryBranding(add);
  }

  private isRealHoltDormitory(): boolean {
    return this.visuals.dormitoryArchitecture && (this.def.id === 'holt' || this.def.id === 'holt-nuit');
  }

  /** Ouvertures sur la façade est, côté soleil ; le mur ouest du couloir reste plein. */
  private isDormitoryWindowCell(x: number, y: number): boolean {
    return this.isRealHoltDormitory() && x === 51 && ((y >= 6 && y <= 8) || (y >= 12 && y <= 14));
  }

  /** Les façades extérieures reçoivent le béton texturé du dortoir ; les murs partagés restent HOLT. */
  private isDormitoryFacadeCell(x: number, y: number): boolean {
    return this.isRealHoltDormitory() && ((x === 51 && y >= 0 && y <= 15) || (y === 0 && x >= 26 && x <= 50));
  }

  private buildDormitoryHoltSign(add: (cell: Cell, detail: THREE.Group) => void): void {
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.cellGeometries.add(geometry);
    const plate = new THREE.Mesh(geometry, this.dormitoryMaterials!.get('darkSteel'));
    plate.position.set(0, 2.03, 0.44);
    plate.scale.set(0.9, 0.68, 0.09);
    const brass = this.dormitoryMaterials!.get('brass');
    const left = new THREE.Mesh(geometry, brass);
    left.position.set(-0.22, 2.03, 0.5);
    left.scale.set(0.11, 0.48, 0.035);
    const right = left.clone();
    right.position.x = 0.22;
    const cross = new THREE.Mesh(geometry, brass);
    cross.position.set(0, 2.03, 0.5);
    cross.scale.set(0.44, 0.09, 0.035);
    for (const mesh of [plate, left, right, cross]) {
      mesh.castShadow = false;
      group.add(mesh);
    }
    add({ x: 38, y: 0 }, group);
  }

  /** Local architectural finish: polished floor, slab joints, wall panels and reflection. */
  private buildDormitoryRoomFinish(): void {
    if (!this.isRealHoltDormitory() || !this.dormitoryMaterials) return;
    const room = this.roomsById.get('dortoirs');
    if (!room) return;
    const { origin, width, height } = room.rect;
    const nw = cellToWorld(this.map, origin);
    const centerX = nw.x + (width - 1) / 2;
    const centerZ = nw.z + (height - 1) / 2;
    const group = new THREE.Group();
    group.name = 'dormitory-architectural-finish';
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.cellGeometries.add(boxGeometry);
    const slabMaterial = new THREE.MeshStandardMaterial({
      color: 0x777a73,
      roughness: 0.38,
      metalness: 0.08,
    });
    this.cellMaterials.add(slabMaterial);
    const addBox = (
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      material: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(boxGeometry, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = sy > 0.08;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    // The playable dormitory is deliberately open above the walls. Suspended beams and
    // ceiling strips hid the bunk layout in the chapter camera without helping navigation.

    // Dark service floor inset frames the lighter polished concrete without affecting pathing.
    addBox(centerX, -0.045, centerZ, width - 0.12, 0.035, height - 0.12, slabMaterial).castShadow = false;
    // These finishes sit almost flush with the floor. The pilot's perspective and the
    // wider chapter framing otherwise quantize their depth to the same value as the slab.
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x393e3c,
      roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -4,
    });
    this.cellMaterials.add(jointMaterial);
    for (let x = -width / 2; x <= width / 2; x += 1.5) {
      const joint = addBox(centerX + x, 0.004, centerZ, 0.014, 0.007, height, jointMaterial);
      joint.castShadow = false;
    }
    for (let z = -height / 2; z <= height / 2; z += 1.5) {
      const joint = addBox(centerX, 0.004, centerZ + z, width, 0.007, 0.014, jointMaterial);
      joint.castShadow = false;
    }
    // The new north/east envelope owns its trims. South thresholds remain in the shared
    // map renderer: the former continuous belt crossed door openings and floated when
    // corridor visibility cut the wall, so it must not survive this replacement.
    this.root.add(group);
    this.dormitoryRoomArchitecture.push(group);

    this.buildFloorReflection(width, height, centerX, centerZ);
  }

  private buildFloorReflection(width: number, height: number, centerX: number, centerZ: number): void {
    if (!this.dormitoryMaterials) return;
    // A filtered planar pass gives the central aisle the waxed-concrete glint from the pilot.
    // Keep it on the discovered room only, so reflections cannot expose hidden occupants.
    const reflectionGeometry = new THREE.PlaneGeometry(width, height);
    const reflector = new Reflector(reflectionGeometry, {
      textureWidth: 768,
      textureHeight: 768,
      clipBias: 0.003,
      multisample: 0,
      shader: {
        uniforms: {
          color: { value: new THREE.Color(0x777777) },
          tDiffuse: { value: null },
          textureMatrix: { value: new THREE.Matrix4() },
          surface: { value: null },
          surfaceRepeat: { value: new THREE.Vector2(4, 4) },
          reflectionGain: { value: 1 },
        },
        vertexShader: `uniform mat4 textureMatrix; uniform vec2 surfaceRepeat; varying vec4 vUv; varying vec2 surfaceUv; void main(){vUv=textureMatrix*vec4(position,1.);surfaceUv=uv*surfaceRepeat;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D surface; uniform float reflectionGain; varying vec4 vUv; varying vec2 surfaceUv;
          void main(){vec3 grain=texture2D(surface,surfaceUv).rgb;vec2 uv=vUv.xy/vUv.w;vec2 d=(grain.rg-.5)*.004;vec3 reflection=vec3(0.);float r=.0035;for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){reflection+=texture2D(tDiffuse,uv+d+vec2(float(x),float(y))*r).rgb/9.;}}gl_FragColor=vec4(reflection,reflectionGain*clamp(.13+grain.r*.20,.13,.30));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          }`,
      },
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set(centerX, 0.016, centerZ);
    const reflectionMaterial = reflector.material as THREE.ShaderMaterial;
    reflectionMaterial.uniforms.surface!.value = this.dormitoryMaterials.getTexture('floor');
    supportOrthographicReflection(reflector);
    reflectionMaterial.transparent = true;
    reflectionMaterial.depthWrite = false;
    reflector.visible = false;
    reflector.renderOrder = 1;
    this.root.add(reflector);
    this.dormitoryFloorReflection = reflector;
    this.dormitoryRoomReflections.push(reflector);
    this.cellGeometries.add(reflectionGeometry);
    this.cellMaterials.add(reflectionMaterial);
  }

  private buildDormitoryWindowBatches(
    unitBox: THREE.BufferGeometry,
    masonryMaterial: THREE.Material,
    fallbackFrameMaterial: THREE.Material,
    glassMaterial: THREE.Material,
  ): void {
    if (this.dormitoryWindowInfos.length === 0) return;
    const windowCount = this.dormitoryWindowInfos.length;
    const frameMaterial = this.dormitoryMaterials?.get('edgeSteel') ?? fallbackFrameMaterial;
    this.dormitoryWindowMasonry = new THREE.InstancedMesh(unitBox, masonryMaterial, windowCount * 2);
    this.dormitoryWindowMasonry.castShadow = true;
    this.dormitoryWindowMasonry.receiveShadow = true;
    this.dormitoryWindowFrames = new THREE.InstancedMesh(unitBox, frameMaterial, windowCount * 4);
    this.dormitoryWindowFrames.castShadow = false;
    this.dormitoryWindowGlass = new THREE.InstancedMesh(unitBox, glassMaterial, windowCount);
    this.dormitoryWindowGlass.castShadow = false;
    this.dormitoryWindowGlass.receiveShadow = false;
    if (this.isRealHoltDormitory()) {
      const view = this.createDormitoryBadlandsTexture();
      const backdropMaterial = new THREE.MeshBasicMaterial({
        map: view,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      this.cellMaterials.add(backdropMaterial);
      const pane = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2);
      this.cellGeometries.add(pane);
      this.dormitoryWindowBackdrop = new THREE.InstancedMesh(pane, backdropMaterial, windowCount);
      this.dormitoryWindowBackdrop.castShadow = false;
      this.dormitoryWindowBackdrop.receiveShadow = false;
      const revealGeometry = new THREE.BoxGeometry(1, 1, 1);
      this.cellGeometries.add(revealGeometry);
      for (const info of this.dormitoryWindowInfos) {
        const revealGroup = new THREE.Group();
        revealGroup.name = 'dormitory-window-reveals';
        const pieces: readonly [number, number, number, number, number, number, THREE.Material][] = [
          [0.08, 2.17, -0.44, 0.24, 0.9, 0.08, this.dormitoryMaterials!.get('edgeSteel')],
          [0.08, 2.17, 0.44, 0.24, 0.9, 0.08, this.dormitoryMaterials!.get('edgeSteel')],
          [0.08, 1.72, 0, 0.3, 0.12, 0.96, this.dormitoryMaterials!.get('wall')],
          [0.08, 2.64, 0, 0.3, 0.12, 0.96, this.dormitoryMaterials!.get('wall')],
          [0.1, 1.62, 0, 0.52, 0.1, 0.96, this.dormitoryMaterials!.get('edgeSteel')],
        ];
        for (const [dx, y, dz, sx, sy, sz, material] of pieces) {
          const reveal = new THREE.Mesh(revealGeometry, material);
          reveal.position.set(info.wx + dx, y, info.wz + dz);
          reveal.scale.set(sx, sy, sz);
          reveal.castShadow = true;
          reveal.receiveShadow = true;
          revealGroup.add(reveal);
        }
        this.root.add(revealGroup);
        (info.discoveredOrnaments ??= []).push(revealGroup);
      }
    }

    this.dormitoryWindowInfos.forEach((info, index) => {
      const upper = index * 2 + 1;
      const frameStart = index * 4;
      this.dormitoryWindowSlots.set(info, { upper, frameStart, glass: index, backdrop: index });
      info.cutawayBase = { instancedMesh: this.dormitoryWindowMasonry!, index: index * 2 };
      // Bande haute étirée en continu par sections : les six ouvertures ne coûtent que trois lots.
      this.setDormitoryInstanceBox(
        this.dormitoryWindowMasonry!,
        index * 2,
        info.wx,
        0.84,
        info.wz,
        0.96,
        1.68,
        0.96,
      );
      this.setDormitoryInstanceBox(
        this.dormitoryWindowMasonry!,
        upper,
        info.wx,
        2.81,
        info.wz,
        0.96,
        0.38,
        0.96,
      );
      this.setDormitoryInstanceBox(
        this.dormitoryWindowFrames!,
        frameStart,
        info.wx,
        1.72,
        info.wz,
        0.94,
        0.07,
        0.7,
      );
      this.setDormitoryInstanceBox(
        this.dormitoryWindowFrames!,
        frameStart + 1,
        info.wx,
        2.62,
        info.wz,
        0.94,
        0.07,
        0.7,
      );
      this.setDormitoryInstanceBox(
        this.dormitoryWindowFrames!,
        frameStart + 2,
        info.wx,
        2.17,
        info.wz - 0.35,
        0.94,
        0.88,
        0.07,
      );
      this.setDormitoryInstanceBox(
        this.dormitoryWindowFrames!,
        frameStart + 3,
        info.wx,
        2.17,
        info.wz + 0.35,
        0.94,
        0.88,
        0.07,
      );
      this.setDormitoryInstanceBox(
        this.dormitoryWindowGlass!,
        index,
        info.wx - 0.18,
        2.17,
        info.wz,
        0.025,
        0.82,
        0.62,
      );
      if (this.dormitoryWindowBackdrop) {
        this.cutawayMatrix.compose(
          this.cutawayPosition.set(info.wx + 0.18, 2.17, info.wz),
          this.cutawayQuaternion.identity(),
          this.cutawayScale.set(0.62, 0.82, 1),
        );
        this.dormitoryWindowBackdrop.setMatrixAt(index, this.cutawayMatrix);
      }
    });

    for (const batch of [
      this.dormitoryWindowMasonry,
      this.dormitoryWindowFrames,
      this.dormitoryWindowGlass,
      ...(this.dormitoryWindowBackdrop ? [this.dormitoryWindowBackdrop] : []),
    ]) {
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      this.root.add(batch);
      this.wallInstancedMeshes.push(batch);
    }
  }

  /** Horizon chaud des Badlands, visible au travers des baies est du dortoir. */
  private createDormitoryBadlandsTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, 512);
      sky.addColorStop(0, '#a8bdc2');
      sky.addColorStop(0.48, '#edc99a');
      sky.addColorStop(0.7, '#efad72');
      sky.addColorStop(1, '#8f6c55');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = 'rgba(255,239,195,.58)';
      ctx.beginPath();
      ctx.arc(365, 250, 43, 0, Math.PI * 2);
      ctx.fill();
      const ridge = (color: string, points: readonly [number, number][]) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 512);
        for (const [x, y] of points) ctx.lineTo(x, y);
        ctx.lineTo(512, 512);
        ctx.closePath();
        ctx.fill();
      };
      ridge('#b58363', [
        [0, 328],
        [68, 278],
        [132, 312],
        [213, 252],
        [284, 304],
        [367, 263],
        [435, 301],
        [512, 271],
      ]);
      ridge('#776653', [
        [0, 378],
        [84, 348],
        [158, 366],
        [235, 320],
        [320, 365],
        [397, 331],
        [512, 361],
      ]);
      ridge('#4d514b', [
        [0, 430],
        [95, 403],
        [174, 421],
        [264, 387],
        [356, 422],
        [442, 390],
        [512, 414],
      ]);
      // Poussière et silhouettes basses gardent la vue lisible sans paraître une image plate.
      ctx.fillStyle = 'rgba(238,190,137,.35)';
      ctx.fillRect(0, 440, 512, 72);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    this.cellTextures.add(texture);
    return texture;
  }

  private buildDormitoryFacadeBand(unitBox: THREE.BufferGeometry): void {
    if (!this.dormitoryMaterials || this.dormitoryFacadeInfos.length === 0) return;
    this.dormitoryFacadeBand = new THREE.InstancedMesh(
      unitBox,
      this.dormitoryMaterials.get('darkSteel'),
      this.dormitoryFacadeInfos.length,
    );
    this.dormitoryFacadeBand.castShadow = false;
    this.dormitoryFacadeBand.receiveShadow = true;
    this.root.add(this.dormitoryFacadeBand);
    this.wallInstancedMeshes.push(this.dormitoryFacadeBand);
  }

  /** Fine concrete panel joints, tie holes and reinforced corners on the dormitory envelope. */
  private buildDormitoryFacadeDetails(unitBox: THREE.BufferGeometry): void {
    if (!this.isRealHoltDormitory() || !this.dormitoryMaterials) return;
    const room = this.roomsById.get('dortoirs');
    if (!room) return;
    const { origin, width, height } = room.rect;
    const seamGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.cellGeometries.add(seamGeometry);
    const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x454b49, roughness: 0.92 });
    const stainMaterial = new THREE.MeshStandardMaterial({
      color: 0x777a72,
      roughness: 0.98,
      transparent: true,
      opacity: 0.32,
    });
    this.cellMaterials.add(seamMaterial);
    this.cellMaterials.add(stainMaterial);
    const pieces: THREE.Mesh[] = [];
    const facadeGroups = new Map<string, THREE.Object3D[]>();
    const facadeSides = new Map<string, Side[]>();
    const rememberFacade = (x: number, y: number, object: THREE.Object3D): void => {
      const info = this.wallCells.get(posKey({ x, y }));
      if (!info) return;
      const key = info.sides.join('|');
      facadeSides.set(key, info.sides);
      let objects = facadeGroups.get(key);
      if (!objects) {
        objects = [];
        facadeGroups.set(key, objects);
      }
      objects.push(object);
    };
    const add = (
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      mat: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(seamGeometry, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      pieces.push(mesh);
    };
    // North/rear and east/exterior faces use slightly proud seams over the shared wall batch.
    for (let x = origin.x - 1; x <= origin.x + width - 1; x += 2) {
      const cell = cellToWorld(this.map, { x, y: origin.y - 1 });
      add(cell.x, 1.48, cell.z - 0.505, 0.018, 2.84, 0.025, seamMaterial);
      rememberFacade(x, origin.y - 1, pieces[pieces.length - 1]!);
      for (const y of [0.18, 1.42, 2.72]) {
        add(cell.x, y, cell.z - 0.51, 0.055, 0.035, 0.025, stainMaterial);
        rememberFacade(x, origin.y - 1, pieces[pieces.length - 1]!);
      }
    }
    for (let y = origin.y + 1; y < origin.y + height; y += 2) {
      const cell = cellToWorld(this.map, { x: origin.x + width, y });
      add(cell.x + 0.505, 1.48, cell.z, 0.025, 2.84, 0.018, seamMaterial);
      rememberFacade(origin.x + width, y, pieces[pieces.length - 1]!);
      for (const yy of [0.18, 1.42, 2.72]) {
        add(cell.x + 0.51, yy, cell.z, 0.025, 0.035, 0.055, stainMaterial);
        rememberFacade(origin.x + width, y, pieces[pieces.length - 1]!);
      }
    }
    const setForFacade = (objects: THREE.Object3D[], x: number, y: number): void => {
      const info = this.wallCells.get(posKey({ x, y }));
      if (info) this.dormitoryCutawayDetails.push({ sides: info.sides, objects });
      else this.dormitoryRoomArchitecture.push(...objects);
    };
    // Recessed vertical pilasters and a deep service belt on the exposed facades.
    for (let x = origin.x; x <= origin.x + width; x += 4) {
      const cell = cellToWorld(this.map, { x, y: origin.y - 1 });
      const meshes: THREE.Object3D[] = [];
      for (const [yy, sy, depth, material] of [
        [1.48, 2.96, 0.16, this.dormitoryMaterials.get('darkSteel')],
        [0.52, 0.13, 0.22, this.dormitoryMaterials.get('edgeSteel')],
        [2.43, 0.1, 0.2, this.dormitoryMaterials.get('steel')],
      ] as const) {
        const mesh = new THREE.Mesh(seamGeometry, material);
        mesh.position.set(cell.x, yy, cell.z - 0.55);
        mesh.scale.set(0.16, sy, depth);
        mesh.castShadow = true;
        meshes.push(mesh);
      }
      for (const mesh of meshes) this.root.add(mesh);
      setForFacade(meshes, x, origin.y - 1);
    }
    for (let y = origin.y + 1; y <= origin.y + height; y += 4) {
      const cell = cellToWorld(this.map, { x: origin.x + width, y });
      const meshes: THREE.Object3D[] = [];
      for (const [xx, sx, material] of [
        [0.55, 0.16, this.dormitoryMaterials.get('darkSteel')],
        [1.47, 0.12, this.dormitoryMaterials.get('edgeSteel')],
        [2.42, 0.08, this.dormitoryMaterials.get('steel')],
      ] as const) {
        const mesh = new THREE.Mesh(seamGeometry, material);
        mesh.position.set(cell.x + 0.55, xx, cell.z);
        mesh.scale.set(0.18, sx, 0.15);
        mesh.castShadow = true;
        meshes.push(mesh);
      }
      for (const mesh of meshes) this.root.add(mesh);
      setForFacade(meshes, origin.x + width, y);
    }
    // Heavy corner pilasters and a continuous dark belt establish a strong room silhouette.
    for (const x of [origin.x - 1, origin.x + width - 1]) {
      const cell = cellToWorld(this.map, { x, y: origin.y - 1 });
      const pillar = new THREE.Mesh(unitBox, this.dormitoryMaterials.get('darkSteel'));
      pillar.position.set(cell.x, 1.52, cell.z - 0.56);
      pillar.scale.set(0.14, 3.04, 0.18);
      pillar.castShadow = true;
      pieces.push(pillar);
      rememberFacade(x, origin.y - 1, pillar);
    }
    for (const mesh of pieces) this.root.add(mesh);
    // Only corner posts are not already associated with a facade group.
    for (const mesh of pieces) {
      if (![...facadeGroups.values()].some((objects) => objects.includes(mesh)))
        this.dormitoryRoomArchitecture.push(mesh);
    }
    for (const [key, objects] of facadeGroups) {
      this.dormitoryCutawayDetails.push({ sides: facadeSides.get(key) ?? [], objects });
    }
  }

  private setDormitoryInstanceBox(
    mesh: THREE.InstancedMesh,
    index: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ): void {
    this.cutawayMatrix.compose(
      this.cutawayPosition.set(x, y, z),
      this.cutawayQuaternion.identity(),
      this.cutawayScale.set(sx, sy, sz),
    );
    mesh.setMatrixAt(index, this.cutawayMatrix);
  }

  /** Wall-mounted signs follow the existing cutaway through the ornament list. */
  private buildPilotDormitoryBranding(add: (cell: Cell, detail: THREE.Group) => void): void {
    const ink = new THREE.MeshStandardMaterial({ color: 0x1e303a, roughness: 0.7 });
    const cream = new THREE.MeshStandardMaterial({ color: 0xc9c6b5, roughness: 0.9 });
    const red = new THREE.MeshStandardMaterial({ color: 0xa44940, roughness: 0.88 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x65838a, metalness: 0.38, roughness: 0.36 });
    for (const material of [ink, cream, red, glass]) this.cellMaterials.add(material);
    const block = (
      group: THREE.Group,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) => {
      const geometry = new THREE.BoxGeometry(w, h, d);
      this.cellGeometries.add(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = false;
      group.add(mesh);
    };
    const crest = (): THREE.Group => {
      const g = new THREE.Group();
      block(g, ink, 0, 2.1, 0.47, 0.87, 0.66, 0.07);
      block(g, cream, 0, 2.1, 0.52, 0.72, 0.51, 0.015);
      block(g, red, -0.17, 2.1, 0.542, 0.085, 0.36, 0.016);
      block(g, red, 0.17, 2.1, 0.542, 0.085, 0.36, 0.016);
      block(g, red, 0, 2.1, 0.542, 0.39, 0.075, 0.016);
      block(g, ink, 0, 1.73, 0.49, 0.87, 0.04, 0.09);
      return g;
    };
    const north = crest();
    add({ x: 17, y: 0 }, north);
    const south = crest();
    south.rotation.y = Math.PI;
    add({ x: 17, y: 16 }, south);
    for (const y of [3, 11]) {
      const window = new THREE.Group();
      window.rotation.y = -Math.PI / 2;
      block(window, ink, 0, 1.95, 0.47, 0.91, 0.85, 0.07);
      block(window, glass, 0, 1.95, 0.515, 0.71, 0.65, 0.014);
      block(window, cream, 0, 1.95, 0.53, 0.025, 0.65, 0.016);
      block(window, cream, 0, 1.95, 0.53, 0.71, 0.025, 0.016);
      add({ x: 30, y }, window);
    }
  }

  /**
   * Anneau au sol sous un interactable : le repère même quand le prop lui-même est petit -- et
   * surtout, il DIT où viser. Il était plus petit que la case qu'il annonçait (0,44 m de rayon
   * pour une case d'un mètre) : l'œil visait l'anneau, le clic tombait à côté du meuble. Il
   * dessine maintenant le rayon de saisie réel (`INTERACT_GRAB_RADIUS_M`, voir `pick`).
   */
  private addGroundMarker(wx: number, wz: number, color: number): THREE.Mesh {
    const geometry = new THREE.RingGeometry(INTERACT_GRAB_RADIUS_M - 0.1, INTERACT_GRAB_RADIUS_M, 24);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.cellGeometries.add(geometry);
    this.cellMaterials.add(material);
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    // Les sols de profils AAA et leurs joints montent à 0,035 m ; à 0,015 m, les anneaux
    // restaient dessous et disparaissaient pour les interactables du bal et du campement.
    ring.position.set(wx, INTERACTION_MARKER_HEIGHT, wz);
    this.root.add(ring);
    return ring;
  }

  /**
   * Enregistre une entité npc/object/seat comme "contenu" togglable (08-EXPLORATION.md "La
   * découverte des lieux") : indexée par case pour le repli généreux du clic/survol (`pick`),
   * et par id pour `setVisibleEntities`. Masquée par défaut (pessimiste, voir `buildRoomFloors`).
   */
  private registerVisualEntity(e: EntityDef, parts: THREE.Object3D[]): void {
    for (const part of parts) part.visible = false;
    this.entityCellIndex.set(posKey(e.cell), e.id);
    this.entityAnchors.set(e.id, cellToWorld(this.map, e.cell));
    this.entityVisualParts.set(e.id, parts);
  }

  private buildEntityMarkers(): void {
    for (const e of this.def.entities as EntityDef[]) {
      if (e.type === 'door' || e.type === 'zone') continue; // portes : déjà construites ; zones : invisibles
      const { x: wx, z: wz } = cellToWorld(this.map, e.cell);

      if (e.type === 'npc') {
        const rig = this.createNpcRig(e.id, wx, wz);
        rig.object.userData.entityId = e.id;
        this.root.add(rig.object);
        this.pickables.push(rig.object);
        this.npcRigs.set(e.id, rig);
        const marker = this.addGroundMarker(wx, wz, EXTRA_COLOR);
        this.registerVisualEntity(e, [rig.object, marker]);
        continue;
      }

      // Objet/siège : plus gros et légèrement lumineux qu'un simple bloc de mobilier --
      // ce sont des interactables, ils doivent se remarquer (comme le matériel au sol en
      // combat, `YardView.setGroundItems`), pas se confondre avec le décor.
      const semanticObject = this.dressing.objectForEntity(e.id);
      if (semanticObject) {
        this.pickables.push(semanticObject);
        const marker = this.addGroundMarker(wx, wz, e.type === 'seat' ? SEAT_COLOR : OBJECT_COLOR);
        this.registerVisualEntity(e, [semanticObject, marker]);
        continue;
      }

      if (e.type === 'object') {
        const geometry = new THREE.BoxGeometry(0.62, 0.62, 0.62);
        const material = new THREE.MeshStandardMaterial({
          color: OBJECT_COLOR,
          roughness: 0.6,
          emissive: OBJECT_COLOR,
          emissiveIntensity: 0.25,
        });
        this.cellGeometries.add(geometry);
        this.cellMaterials.add(material);
        const box = new THREE.Mesh(geometry, material);
        box.position.set(wx, 0.31, wz);
        box.castShadow = true;
        box.userData.entityId = e.id;
        this.root.add(box);
        this.pickables.push(box);
        const marker = this.addGroundMarker(wx, wz, OBJECT_COLOR);
        this.registerVisualEntity(e, [box, marker]);
        continue;
      }

      if (e.type === 'seat') {
        const geometry = new THREE.BoxGeometry(0.72, 0.5, 0.72);
        const material = new THREE.MeshStandardMaterial({
          color: SEAT_COLOR,
          roughness: 0.6,
          emissive: SEAT_COLOR,
          emissiveIntensity: 0.2,
        });
        this.cellGeometries.add(geometry);
        this.cellMaterials.add(material);
        const seat = new THREE.Mesh(geometry, material);
        seat.position.set(wx, 0.25, wz);
        seat.castShadow = true;
        seat.userData.entityId = e.id;
        this.root.add(seat);
        this.pickables.push(seat);
        const marker = this.addGroundMarker(wx, wz, SEAT_COLOR);
        this.registerVisualEntity(e, [seat, marker]);
        continue;
      }

      if (e.type === 'exit') {
        const geometry = new THREE.RingGeometry(0.55, 0.72, 24);
        const material = new THREE.MeshBasicMaterial({
          color: EXIT_COLOR,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        });
        this.cellGeometries.add(geometry);
        this.cellMaterials.add(material);
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(wx, 0.02, wz);
        ring.userData.entityId = e.id;
        this.root.add(ring);
        this.pickables.push(ring);
      }
    }
  }

  /** Les cinq cadets nommés réemploient leur vrai rig; le chien garde une silhouette quadrupède. */
  private createNpcRig(entityId: string, x: number, z: number): ExploreNpcRig {
    const candidate = entityId.split('.').at(-1);
    if (candidate && (CHARACTER_IDS as readonly string[]).includes(candidate)) {
      const sheet = getCharacter(candidate as CharacterId);
      const rig = createCadetExplorationRig(sheet, EXTRA_COLOR, { showLabel: false });
      rig.setEquipment([]);
      rig.setEquipmentLineVisible(false);
      rig.setWorldPosition(x, z);
      rig.playExplorationPose('talk');
      return rig;
    }
    const rig = createExploreNpcRig(entityId);
    rig.object.position.set(x, 0, z);
    return rig;
  }

  /* ------------------------------------------------------------------ */
  /* Murs en coupe (ADR 0013 §6, 08-EXPLORATION.md "La caméra et les murs") */
  /* ------------------------------------------------------------------ */

  /** Static architecture: rotating or entering a room never removes wall geometry. */
  private isCut(_sides: Side[]): boolean {
    return false;
  }

  /** Matrice temporaire réutilisée par `recomputeCutaway` -- pas d'allocation par case ni par rotation. */
  private readonly cutawayMatrix = new THREE.Matrix4();
  private readonly cutawayPosition = new THREE.Vector3();
  private readonly cutawayScale = new THREE.Vector3();
  private readonly cutawayQuaternion = new THREE.Quaternion();

  /**
   * Recalcule quels murs sont coupés : ceux des pièces (`info.sides`), plus ceux du couloir où se
   * tient le meneur (ADR 0027). Appelé à la construction, à chaque quart de tour (`rotate()`) et
   * quand le meneur entre dans un couloir ou en sort (`syncActiveCorridor`), JAMAIS par image -- le coût d'une reconstruction complète des lots (quelques
   * centaines de matrices 4x4) est négligeable à cette fréquence, et bien moindre que de garder
   * un `Object3D` par case (passe G, performance).
   *
   * Le corps de porte (`info.doorMesh`) reste un `THREE.Mesh` individuel, muté directement comme
   * avant. Le corps de mur (`info.bodyBatch`), l'arête de coupe et la bande décorative vivent
   * dans des `THREE.InstancedMesh` partagés (voir leurs champs) : on y réécrit une matrice par
   * case plutôt que de repositionner un objet.
   */
  recomputeCutaway(): void {
    const bandMatrices: THREE.Matrix4[] = [];
    const dormitoryBandMatrices: THREE.Matrix4[] = [];
    const edgeMatrices: THREE.Matrix4[] = [];
    const touchedBodies = new Set<THREE.InstancedMesh>();
    const corridorSides = this.activeCorridorId
      ? this.corridors.regions.find((region) => region.id === this.activeCorridorId)?.wallSides
      : undefined;
    this.updateHoltCutaway();
    for (const [key, info] of this.wallCells) {
      // Les façades nord et est du dortoir appartiennent au constructeur pilote; leurs masses,
      // parapets de coupe et détails sont recalculés en un seul bloc via son état dédié.
      if (info.holtOwned || (info.dormitoryFacade && this.dormitoryPilotArchitecture)) continue;
      const extra = corridorSides?.get(key);
      const cut = this.isCut(info.sides) || (extra !== undefined && this.isCut(extra));
      const height = info.isContainer ? 2.6 : cut ? WALL_CUT_HEIGHT : WALL_HEIGHT;
      if (info.isDoorCell) {
        // Porte : un simple linteau en haut de l'ouverture, jamais un bloc plein -- sinon
        // une porte OUVERTE lirait comme un mur (08-EXPLORATION.md "Pas de plafond. Les
        // portes ouvertes sont des trouées"). Le panneau (`info.panel`) porte l'état fermé.
        info.doorMesh!.scale.set(0.92, Math.min(0.14, height), 0.92);
        info.doorMesh!.position.y = height - Math.min(0.07, height / 2);
      } else if (info.bodyBatch) {
        const { instancedMesh, index } = info.bodyBatch;
        this.cutawayMatrix.compose(
          this.cutawayPosition.set(info.wx, height / 2, info.wz),
          this.cutawayQuaternion.identity(),
          this.cutawayScale.set(0.98, height, 0.98),
        );
        instancedMesh.setMatrixAt(index, this.cutawayMatrix);
        touchedBodies.add(instancedMesh);
      }
      if (cut) {
        edgeMatrices.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(info.wx, height, info.wz),
            IDENTITY_QUATERNION,
            new THREE.Vector3(0.96, 0.05, 0.96),
          ),
        );
      } else if (info.dormitoryFacade && this.dormitoryFacadeBand) {
        dormitoryBandMatrices.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(info.wx, 1.32, info.wz),
            IDENTITY_QUATERNION,
            new THREE.Vector3(0.987, 0.13, 0.987),
          ),
        );
      } else if (!info.isContainer) {
        bandMatrices.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(info.wx, this.bandHeightY, info.wz),
            IDENTITY_QUATERNION,
            new THREE.Vector3(0.987, 0.28, 0.987),
          ),
        );
      }
      if (info.control) info.control.visible = !cut;
      info.cutaway = cut;
      if (info.cutawayBase) {
        const lowerHeight = cut ? WALL_CUT_HEIGHT : 1.68;
        this.setDormitoryInstanceBox(
          info.cutawayBase.instancedMesh,
          info.cutawayBase.index,
          info.wx,
          lowerHeight / 2,
          info.wz,
          0.98,
          lowerHeight,
          0.98,
        );
        const slots = this.dormitoryWindowSlots.get(info);
        if (slots && this.dormitoryWindowMasonry && this.dormitoryWindowFrames && this.dormitoryWindowGlass) {
          this.setDormitoryInstanceBox(
            this.dormitoryWindowMasonry,
            slots.upper,
            info.wx,
            cut ? 0 : 2.81,
            info.wz,
            cut ? 0 : 0.96,
            cut ? 0 : 0.38,
            cut ? 0 : 0.96,
          );
          for (let frame = 0; frame < 4; frame++) {
            const frameY = frame < 2 ? (frame === 0 ? 1.72 : 2.62) : 2.17;
            const frameZ = frame === 2 ? info.wz - 0.35 : frame === 3 ? info.wz + 0.35 : info.wz;
            const frameScale = frame < 2 ? [0.94, 0.07, 0.7] : [0.94, 0.88, 0.07];
            this.setDormitoryInstanceBox(
              this.dormitoryWindowFrames,
              slots.frameStart + frame,
              info.wx,
              cut ? 0 : frameY,
              cut ? 0 : frameZ,
              cut ? 0 : frameScale[0]!,
              cut ? 0 : frameScale[1]!,
              cut ? 0 : frameScale[2]!,
            );
          }
          this.setDormitoryInstanceBox(
            this.dormitoryWindowGlass,
            slots.glass,
            info.wx - 0.18,
            cut ? 0 : 2.17,
            info.wz,
            cut ? 0 : 0.025,
            cut ? 0 : 0.82,
            cut ? 0 : 0.62,
          );
          if (this.dormitoryWindowBackdrop) {
            this.cutawayMatrix.compose(
              this.cutawayPosition.set(info.wx + 0.18, cut ? 0 : 2.17, info.wz),
              this.cutawayQuaternion.identity(),
              this.cutawayScale.set(cut ? 0 : 0.62, cut ? 0 : 0.82, cut ? 0 : 1),
            );
            this.dormitoryWindowBackdrop.setMatrixAt(slots.backdrop, this.cutawayMatrix);
          }
        }
      }
      if (info.ornaments) {
        for (const ornament of info.ornaments) ornament.visible = !cut;
      }
      if (info.discoveredOrnaments) {
        const discovered = this.discoveredRoomIds.has('dortoirs');
        for (const ornament of info.discoveredOrnaments) ornament.visible = discovered && !cut;
      }
      if (info.panel) {
        info.panel.scale.set(0.86, height, 0.16);
        info.panel.position.y = height / 2;
      }
    }
    for (const instancedMesh of touchedBodies) {
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.computeBoundingSphere();
    }
    this.syncDormitoryCutawayDetails();
    this.syncDormitoryPilotLighting();
    this.applyInstanceMatrices(this.topEdgeInstances, edgeMatrices);
    this.applyInstanceMatrices(this.bandInstances, bandMatrices);
    if (this.dormitoryFacadeBand) this.applyInstanceMatrices(this.dormitoryFacadeBand, dormitoryBandMatrices);
    for (const batch of [
      this.dormitoryWindowMasonry,
      this.dormitoryWindowFrames,
      this.dormitoryWindowGlass,
      this.dormitoryWindowBackdrop,
    ]) {
      if (batch) {
        batch.instanceMatrix.needsUpdate = true;
        batch.computeBoundingSphere();
      }
    }
    this.syncDormitoryPilotLighting();
  }

  /** Réécrit entièrement un lot fusionné (arête ou bande) : sa composition change à chaque rotation. */
  private applyInstanceMatrices(instancedMesh: THREE.InstancedMesh, matrices: THREE.Matrix4[]): void {
    instancedMesh.count = matrices.length;
    matrices.forEach((matrix, index) => instancedMesh.setMatrixAt(index, matrix));
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (matrices.length > 0) instancedMesh.computeBoundingSphere();
  }

  /** Tourne la caméra d'un quart de tour et recalcule immédiatement les murs coupés (ADR 0013 §6). */
  rotate(step: number): void {
    this.quarter = (((this.quarter + step) % 4) + 4) % 4;
    this.camera.rotate(step);
    this.recomputeCutaway();
  }

  /* ------------------------------------------------------------------ */
  /* Caméra libre (08-EXPLORATION.md "La caméra et les murs") : panoramique   */
  /* continu relatif à l'écran, zoom continu, recentrage amorti sur le meneur. */
  /* ------------------------------------------------------------------ */

  private clampToPanBounds(x: number, z: number): { x: number; z: number } {
    return {
      x: THREE.MathUtils.clamp(x, this.panBounds.minX, this.panBounds.maxX),
      z: THREE.MathUtils.clamp(z, this.panBounds.minZ, this.panBounds.maxZ),
    };
  }

  private setTargetClamped(x: number, z: number): void {
    const c = this.clampToPanBounds(x, z);
    this.camera.setTarget(c.x, c.z);
  }

  /**
   * Flèches maintenues : panoramique libre, EN CONTINU tant que la touche est tenue, et
   * RELATIF À L'ÉCRAN (↑ déplace la vue vers le haut de l'écran quelle que soit la rotation
   * courante — voir `IsoCamera.screenUpXZ`). Borné à la carte, marge d'une pièce comprise.
   */
  panScreenRelative(input: { up: boolean; down: boolean; left: boolean; right: boolean }, dt: number): void {
    const basis = this.screenBasisXZ();
    const up = basis.up;
    const right = basis.right;
    let dx = 0;
    let dz = 0;
    if (input.up) {
      dx += up.x;
      dz += up.z;
    }
    if (input.down) {
      dx -= up.x;
      dz -= up.z;
    }
    if (input.right) {
      dx += right.x;
      dz += right.z;
    }
    if (input.left) {
      dx -= right.x;
      dz -= right.z;
    }
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) return;
    const dist = PAN_SPEED_M_S * dt;
    const t = this.camera.getTarget();
    this.setTargetClamped(t.x + (dx / len) * dist, t.z + (dz / len) * dist);
  }

  /** Point du sol (monde) sous des coordonnées écran normalisées [-1, 1], ou `null` hors sol. */
  private groundPointAt(ndcX: number, ndcY: number): { x: number; z: number } | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.renderCamera);
    const hits = this.raycaster.intersectObject(this.floorPlane, false);
    if (hits.length === 0) return null;
    const p = (hits[0] as THREE.Intersection).point;
    return { x: p.x, z: p.z };
  }

  /**
   * Molette, en continu : zoom vers le curseur (le point du sol sous la souris reste sous la
   * souris). `wheelDeltaY` : `WheelEvent.deltaY` brut, l'appelant ne convertit rien.
   */
  zoomAtCursor(ndcX: number, ndcY: number, wheelDeltaY: number, aspect: number): void {
    const before = this.groundPointAt(ndcX, ndcY);
    this.camera.zoomBy(wheelDeltaY * WHEEL_ZOOM_SENSITIVITY, aspect);
    const after = before ? this.groundPointAt(ndcX, ndcY) : null;
    if (before && after) {
      const t = this.camera.getTarget();
      this.setTargetClamped(t.x + (before.x - after.x), t.z + (before.z - after.z));
    }
  }

  /**
   * Glissé du doigt (ou de la souris) : le point du sol saisi reste SOUS le doigt. On ne convertit
   * pas des pixels en mètres -- on prend le point du sol sous la position de départ et sous la
   * position d'arrivée, avec la MÊME caméra, et on décale la cible de leur différence. C'est exact
   * à n'importe quel zoom et n'importe quelle rotation, là où un facteur pixels/mètres serait à
   * recalculer à chaque fois. Borné à la carte comme le panoramique au clavier.
   */
  dragGround(fromNdcX: number, fromNdcY: number, toNdcX: number, toNdcY: number): void {
    const from = this.groundPointAt(fromNdcX, fromNdcY);
    const to = this.groundPointAt(toNdcX, toNdcY);
    if (!from || !to) return;
    const t = this.camera.getTarget();
    this.setTargetClamped(t.x + (from.x - to.x), t.z + (from.z - to.z));
  }

  /**
   * Pincement à deux doigts : `scale` > 1 = doigts écartés = on se rapproche (frustum plus petit).
   * Le milieu du pincement reste ancré au même point du sol, exactement comme la molette ancre le
   * curseur (`zoomAtCursor`) -- sans quoi zoomer au doigt fait glisser la carte sous la main.
   */
  pinchZoom(scale: number, ndcX: number, ndcY: number, aspect: number): void {
    if (!(scale > 0)) return;
    const before = this.groundPointAt(ndcX, ndcY);
    this.camera.setZoom(this.camera.getZoom() / scale, aspect);
    const after = before ? this.groundPointAt(ndcX, ndcY) : null;
    if (before && after) {
      const t = this.camera.getTarget();
      this.setTargetClamped(t.x + (before.x - after.x), t.z + (before.z - after.z));
    }
  }

  /** `+`/`-` maintenus : zoom continu vers le centre de l'écran (pas de curseur à suivre au clavier). */
  zoomBy(delta: number, aspect: number): void {
    this.camera.zoomBy(delta, aspect);
  }

  /**
   * Recentre la caméra sur `cell` — amorti, sauf `prefers-reduced-motion` (instantané). C'est
   * l'API que `chapter.ts` utilise pour recentrer au début d'une étape et après un dialogue
   * (08-EXPLORATION.md "La caméra et les murs").
   *
   * Ne vise PAS aveuglément la case du meneur : `frameClampedTarget` glisse la cible vers
   * l'intérieur de la carte pour garder le bâtiment à l'écran plutôt que de gaspiller la moitié
   * du cadre sur du vide -- défaut réel constaté en vérification visuelle du lot 3.6b (recentrer
   * près d'un bord, ex. le garage, laissait la moitié droite de l'écran noire). Arbitrage
   * assumé : le meneur reste visible, mais pas forcément exactement au centre, si la carte est
   * plus étroite que le cadre courant le long d'un axe -- la lisibilité du lieu prime.
   */
  centerOn(cell: Cell): void {
    const world = cellToWorld(this.map, cell);
    // With the lower perspective angle, clamping the whole frustum inside the building
    // displaces small edge rooms by several metres. Keep the requested room/person in
    // the centre while preserving the normal bounded manual navigation.
    const { x, z } = this.dormitoryPerspectiveActive
      ? this.clampToPanBounds(world.x, world.z)
      : this.frameClampedTarget(world.x, world.z);
    this.camera.animateTargetTo(x, z, this.reducedMotion);
  }

  /**
   * Glisse `(x, z)` vers l'intérieur de la carte, dans le repère écran courant (`screenRight`/
   * `screenUp`, même repère que le panoramique clavier) : si la demi-étendue visible actuelle
   * (frustum projeté au sol, même facteur `cos(élévation)` que `updateFog`) déborde de la carte
   * le long d'un axe écran, la cible est ramenée juste assez pour que ce bord du cadre coïncide
   * avec le bord de la carte -- jamais plus loin que nécessaire. Si la carte est plus étroite que
   * le cadre le long de cet axe, centre sur la carte plutôt que sur `(x, z)`.
   */
  private frameClampedTarget(x: number, z: number): { x: number; z: number } {
    const basis = this.screenBasisXZ();
    const right = basis.right;
    const up = basis.up;
    const { halfRight: halfR, halfUp: halfU } = this.groundFrameHalfExtents();

    const { minX, maxX, minZ, maxZ } = this.contentBounds;
    const corners = [
      { x: minX, z: minZ },
      { x: maxX, z: minZ },
      { x: minX, z: maxZ },
      { x: maxX, z: maxZ },
    ];
    const rCorners = corners.map((c) => c.x * right.x + c.z * right.z);
    const uCorners = corners.map((c) => c.x * up.x + c.z * up.z);
    const r = clampAxisToFrame(
      x * right.x + z * right.z,
      Math.min(...rCorners),
      Math.max(...rCorners),
      halfR,
    );
    const u = clampAxisToFrame(x * up.x + z * up.z, Math.min(...uCorners), Math.max(...uCorners), halfU);

    return { x: r * right.x + u * up.x, z: r * right.z + u * up.z };
  }

  /** Screen-frame half extents projected onto y=0 from the camera that is currently rendered. */
  private groundFrameHalfExtents(): { halfRight: number; halfUp: number } {
    if (!(this.dormitoryPerspectiveActive && this.dormitoryPerspectiveCamera)) {
      const groundFactor = Math.cos(THREE.MathUtils.degToRad(ISO_ELEVATION_DEG));
      const camera = this.camera.camera as THREE.OrthographicCamera;
      return { halfRight: camera.right * groundFactor, halfUp: camera.top * groundFactor };
    }
    // A teleport, pan or zoom can update IsoCamera before the next rendered frame.
    // Measuring the previous perspective pose against its new target exaggerates the
    // frustum and pulls a requested room toward the middle of the whole building.
    this.dormitoryPerspectiveCamera.sync();
    const camera = this.dormitoryPerspectiveCamera.camera;
    const target = this.camera.getTarget();
    const focalPoint = new THREE.Vector3(target.x, 1.15, target.z);
    const offset = new THREE.Vector3().subVectors(camera.position, focalPoint);
    const horizontal = Math.hypot(offset.x, offset.z);
    const elevation = Math.atan2(offset.y, horizontal);
    const halfHeightAtTarget = offset.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // The vertical perspective rays fan out with distance. Use their scale at the camera
    // target plane to clamp navigation predictably; ray/ground intersections near the horizon
    // would otherwise produce enormous extents and pull the leader out of frame.
    return {
      halfRight: halfHeightAtTarget * camera.aspect,
      halfUp: halfHeightAtTarget / Math.max(0.25, Math.sin(elevation)),
    };
  }

  /** Recentre sur le meneur (dernière case vue par `updateRigPosition('leader', …)`). Touche `C`. */
  centerOnLeader(): void {
    if (this.leaderCell) this.centerOn(this.leaderCell);
  }

  /**
   * Projette une case en coordonnées écran (pixels, origine haut-gauche), `heightMeters`
   * au-dessus du sol — pour ancrer une bulle de réplique brève au-dessus d'une tête
   * (08-EXPLORATION.md "Répliques brèves"). `null` si la case sort du champ de la caméra.
   */
  projectToScreen(
    cell: Cell,
    viewportWidth: number,
    viewportHeight: number,
    heightMeters = 1.9,
  ): { x: number; y: number } | null {
    const { x: wx, z: wz } = cellToWorld(this.map, cell);
    const v = new THREE.Vector3(wx, heightMeters, wz);
    v.project(this.renderCamera);
    if (v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * viewportWidth,
      y: (-v.y * 0.5 + 0.5) * viewportHeight,
    };
  }

  /**
   * Brouillard en fonction du zoom courant (au lieu de bornes fixes) : la caméra reste à
   * distance fixe de sa cible (`CAMERA_DISTANCE`, seul le frustum change de taille), donc des
   * bornes fixes noient les pièces éloignées dès qu'on dézoome sur une grande carte comme
   * l'académie. Recalculé à chaque frame (`tick`), coût négligeable.
   */
  private updateFog(): void {
    const fog = this.scene.fog as THREE.Fog;
    const zoom = this.camera.getZoom();
    const half = (zoom / 2) * Math.cos(THREE.MathUtils.degToRad(ISO_ELEVATION_DEG));
    const margin = 26;
    fog.near = Math.max(20, CAMERA_DISTANCE - half - margin);
    fog.far = CAMERA_DISTANCE + half + margin * 2.5;
  }

  /* ------------------------------------------------------------------ */
  /* Portes (état piloté par l'appelant, voir `ExploreState.isDoorOpen`) */
  /* ------------------------------------------------------------------ */

  setDoorOpen(entityId: string, open: boolean): void {
    this.doorsOpenDefault.set(entityId, open);
    this.dressing.setDoorOpen(entityId, open);
    this.syncHoltArchitecture();
    for (const info of this.wallCells.values()) {
      if (info.door?.id === entityId && info.panel) info.panel.visible = !open;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Personnages                                                         */
  /* ------------------------------------------------------------------ */

  setLeader(sheet: CharacterSheet): void {
    this.addRig(
      'leader',
      sheet.name,
      () =>
        this.art.leaderRig
          ? this.art.leaderRig(sheet, PARTY_RING_COLOR)
          : createCadetExplorationRig(sheet, PARTY_RING_COLOR),
      true,
    );
  }

  setFollower(id: string, sheet: CharacterSheet): void {
    this.addRig(id, sheet.name, () => createCadetExplorationRig(sheet, PARTY_RING_COLOR), false);
  }

  /**
   * Le suiveur `enfant` (ADR 0024 §3, `FollowerId = CharacterId | 'enfant'`) n'a pas de
   * `CharacterSheet` : silhouette dédiée (`CHILD_VISUAL_PROFILE`, échelle 0,7), même montage
   * (anneau d'équipe, animation) que les coéquipiers.
   */
  setChildFollower(id: 'enfant'): void {
    this.addRig(
      id,
      "L'enfant",
      () =>
        createHumanExplorationRig(
          { id, name: "L'enfant" },
          { profile: CHILD_VISUAL_PROFILE, teamColor: PARTY_RING_COLOR },
        ),
      false,
    );
  }

  /** Cadets exploration : squelette/mixer local, clips sans root motion et anneau d'équipe. */
  private addRig(id: string, name: string, makeRig: () => CharacterRig, isLeader: boolean): void {
    const existing = this.rigs.get(id);
    if (existing) {
      existing.dispose();
      this.root.remove(existing.object);
    }
    const rig = makeRig();
    rig.setEquipment([]);
    rig.setEquipmentLineVisible(false);
    rig.setHighlighted(isLeader);
    if (isExplorationCharacterRig(rig)) rig.setReducedMotion(this.reducedMotion);
    // Names belong to the HTML hover label, outside the scene and its reflections.
    const label = rig.object.getObjectByName('cadet-label');
    if (label) label.visible = false;
    rig.object.userData.exploreCharacter = { type: 'character', id, name };
    this.root.add(rig.object);
    this.rigs.set(id, rig);
  }

  /**
   * Couloir où se tient le meneur (ADR 0027) : ses murs se coupent tant qu'il y est. Sur une case
   * de porte, rien ne change (pas de bascule au passage du seuil) ; dans une pièce ou dehors, le
   * couloir est quitté. Recalcule la coupe seulement au changement -- jamais par image.
   */
  private syncActiveCorridor(cell: { x: number; y: number }): void {
    if (this.corridors.regions.length === 0) return;
    const rounded = { x: Math.round(cell.x), y: Math.round(cell.y) };
    const region = this.corridors.regionByCell.get(posKey(rounded));
    let next = this.activeCorridorId;
    if (region) next = region;
    else if (this.map.kindAt(rounded) !== 'door') next = null;
    if (next === this.activeCorridorId) return;
    this.activeCorridorId = next;
    this.recomputeCutaway();
  }

  /** Place un rig (case, éventuellement fractionnaire) et joue l'animation adaptée. */
  updateRigPosition(id: string, cell: { x: number; y: number }, moving: boolean, dt: number): void {
    if (id === 'leader') {
      this.leaderCell = { x: cell.x, y: cell.y };
      const rounded = { x: Math.round(cell.x), y: Math.round(cell.y) };
      const nextRoom = roomAt(this.def, rounded)?.id ?? null;
      const nextZone = this.holtArchitecture
        ? this.map.kindAt(rounded) === 'door'
          ? this.activeHoltZoneId
          : explorationRenderZoneAt(this.def, rounded)
        : null;
      if (nextRoom !== this.activeRoomId || nextZone !== this.activeHoltZoneId) {
        this.activeRoomId = nextRoom;
        this.activeHoltZoneId = nextZone;
        this.recomputeCutaway();
      }
      this.syncActiveCorridor(cell);
      const perspectiveActive = this.shouldUseHoltPerspective();
      if (perspectiveActive !== this.dormitoryPerspectiveActive) {
        this.dormitoryPerspectiveActive = perspectiveActive;
        this.syncDormitoryPilotLighting();
      }
      this.syncHoltRoomRendering();
    }
    const rig = this.rigs.get(id);
    if (!rig) return;
    const { x, z } = cellToWorld(this.map, cell);
    const last = this.lastRigPos.get(id);
    if (last && (Math.abs(last.x - x) > 1e-5 || Math.abs(last.z - z) > 1e-5)) {
      rig.faceTowards(x, z);
    }
    rig.setWorldPosition(x, z);
    rig.play(moving ? 'run' : 'idle');
    if (isExplorationCharacterRig(rig)) rig.setExplorationMotionSpeed(LEADER_SPEED);
    rig.update(dt);
    this.lastRigPos.set(id, { x, z });
  }

  /**
   * Tourne le meneur vers `cell`, sans le déplacer -- appelé une fois arrivé
   * sur la case d'interaction (08-EXPLORATION.md "Interaction" : "le
   * personnage marche jusqu'à la case d'interaction (adjacente), se tourne,
   * puis l'action se déclenche"). `updateRigPosition` ne tourne le rig QUE
   * quand sa position change (voir plus haut) : à l'arrêt, sans cet appel
   * explicite, Franklyn resterait tourné dans sa dernière direction de
   * marche plutôt que de faire face à l'entité.
   */
  faceLeaderTowards(cell: Cell): void {
    const rig = this.rigs.get('leader');
    if (!rig) return;
    const { x, z } = cellToWorld(this.map, cell);
    rig.faceTowards(x, z);
  }

  removeRig(id: string): void {
    const rig = this.rigs.get(id);
    if (!rig) return;
    rig.dispose();
    this.root.remove(rig.object);
    this.rigs.delete(id);
    this.lastRigPos.delete(id);
  }

  /* ------------------------------------------------------------------ */
  /* Découverte des lieux (08-EXPLORATION.md "La découverte des lieux") : ce que le rendu     */
  /* affiche OBÉIT à ce que la règle de jeu (`ExploreState`, pure) décide -- rien n'est décidé */
  /* ici. L'appelant (`chapter.ts`/`exploreLab.ts`) pousse le résultat à chaque frame utile.    */
  /* ------------------------------------------------------------------ */

  /**
   * Entités npc/object/seat actuellement actives ET découvertes (typiquement
   * `ExploreState.listInteractables()` filtré à ces trois types) : pilote à la fois
   * l'apparence (marqueur + repère au sol) et le repli généreux de `pick()`. Une entité qui
   * n'y figure plus (pièce refermée -- ne se produit pas au chapitre 1, mais reste possible)
   * redevient invisible.
   */
  /** Portes actives à l'étape courante (voir `activeDoorIds`). */
  setActiveDoors(ids: Iterable<string>): void {
    this.activeDoorIds = new Set(ids);
    this.syncHoltArchitecture();
  }

  private isDoorPickable(entityId: string): boolean {
    return (
      this.doorEntityIds.has(entityId) && (this.activeDoorIds === null || this.activeDoorIds.has(entityId))
    );
  }

  setVisibleEntities(ids: Iterable<string>): void {
    const next = new Set(ids);
    for (const [id, parts] of this.entityVisualParts) {
      const visible = next.has(id);
      for (const part of parts) part.visible = visible;
    }
    this.visibleEntityIds = next;
    this.syncDressingVisibility();
  }

  /**
   * Pièces découvertes (`ExploreState.discoveredRoomIds()`) : éclaire leur sol et montre leur
   * mobilier/décor, assombrit/masque tout le reste -- jamais les murs/portes ("garde sa
   * forme"). Les pièces `alwaysDiscovered` (la cour de containers) n'ont jamais été enregistrées
   * dans `roomDecor`/assombries : elles ignorent silencieusement cet appel.
   */
  setDiscoveredRooms(ids: Iterable<string>): void {
    const discovered = new Set(ids);
    this.discoveredRoomIds.clear();
    for (const id of discovered) this.discoveredRoomIds.add(id);
    // Le sol de base (couloirs/extérieurs, toujours éclairé) n'est reconstruit qu'une fois
    // (`buildRoomFloors`/`floorMaterial` à la construction) : sans repasser ici à chaque image,
    // sa texture réseau (`coldConcrete`) resterait indéfiniment absente une fois chargée après
    // coup -- voir `applyFloorVisibility`.
    this.applyFloorVisibility(this.floorPlane.material as THREE.MeshStandardMaterial, true);
    for (const [roomId, floor] of this.roomFloors) {
      const room = this.roomsById.get(roomId);
      const shown = room?.alwaysDiscovered === true || discovered.has(roomId);
      this.applyFloorVisibility(floor.material as THREE.MeshStandardMaterial, shown);
    }
    for (const [roomId, parts] of this.roomDecor) {
      const shown = discovered.has(roomId);
      for (const part of parts) part.visible = shown;
    }
    const dormitoryDiscovered = discovered.has('dortoirs');
    if (this.dormitoryWindowBackdrop) this.dormitoryWindowBackdrop.visible = dormitoryDiscovered;
    for (const part of this.dormitoryRoomArchitecture) part.visible = dormitoryDiscovered;
    for (const part of this.dormitoryRoomReflections) part.visible = dormitoryDiscovered;
    for (const info of this.wallCells.values()) {
      if (!info.discoveredOrnaments) continue;
      const shown = discovered.has('dortoirs') && !info.cutaway;
      for (const ornament of info.discoveredOrnaments) ornament.visible = shown;
    }
    this.syncDormitoryCutawayDetails();
    this.syncDressingVisibility();
    this.syncDormitoryPilotLighting();
  }

  private syncDormitoryCutawayDetails(): void {
    const discovered = this.discoveredRoomIds.has('dortoirs');
    for (const detail of this.dormitoryCutawayDetails) {
      const visible = discovered && !this.isCut(detail.sides);
      for (const object of detail.objects) object.visible = visible;
    }
  }

  /**
   * Etape narrative courante de la scene `explore` (ADR 0026, lot 5.8b) : bascule les
   * placements d'habillage qui portent `etape` (`ExploreVisualPlacement.etape`) -- p. ex.
   * `holt-nuit` pose le buffet du bal ET les pupitres renverses de la fuite sur les MEMES
   * cases, un jeu par etape, et seul celui qui correspond au drapeau `ch2.etape` courant se
   * montre. Sans effet sur `holt`/`centre-examen`, dont aucun placement ne porte `etape`.
   */
  setEtape(etape: string | undefined): void {
    if (this.currentEtape === etape) return;
    this.currentEtape = etape;
    this.syncDressingVisibility();
  }

  /**
   * Climat des trois sources globales (ADR 0026, lot 5.8b) : `holt-nuit` est la seule carte a
   * l'appeler (`ExploreSession.enterStep`, jamais `holt`/`centre-examen`) -- voir
   * `applyNightMood` pour les valeurs. Idempotent comme `setEtape`.
   */
  setNightMood(mood: NightMood): void {
    this.dormitoryNightMood = mood;
    applyNightMood(this.explorationLights, mood, this.visuals.coldPalette);
    const backdropMaterial = this.dormitoryWindowBackdrop?.material as THREE.MeshBasicMaterial | undefined;
    backdropMaterial?.color.set(mood === null ? 0xffffff : mood === 'bal' ? 0x243d59 : 0x142034);
    if (this.dormitoryFloorReflection)
      this.dormitoryFloorReflection.visible = this.discoveredRoomIds.has('dortoirs');
    this.syncDormitoryPilotLighting();
  }

  /** Environnement de réflexion local aux matériaux du dortoir, jamais publié sur `scene.environment`. */
  setDormitoryEnvironment(texture: THREE.Texture | null): void {
    this.dormitoryMaterials?.setEnvironment(texture);
    this.dressing.setEnvironment(texture);
    this.dormitoryPilotArchitecture?.setEnvironment(texture);
    this.holtArchitecture?.setEnvironment(texture);
    for (const material of this.holtRoomRendering?.floorMaterials.values() ?? []) {
      material.envMap = texture;
      material.needsUpdate = true;
    }
    for (const material of this.dormitoryFloorMaterials) {
      material.envMap = texture;
      material.envMapIntensity = 0.65;
      material.needsUpdate = true;
    }
  }

  /** Point d'entree unique de `ExploreDressing.syncVisibility` (voir `setEtape`, `setVisibleEntities`, `setDiscoveredRooms`). */
  private syncDressingVisibility(): void {
    this.dressing.syncVisibility({
      discoveredRoomIds: this.discoveredRoomIds,
      visibleEntityIds: this.visibleEntityIds,
      etape: this.currentEtape,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Survol / clic — coordonnées normalisées [-1, 1] (comme `THREE.Raycaster`) */
  /* ------------------------------------------------------------------ */

  /** Remonte la chaîne des parents jusqu'à trouver un `userData.entityId` (modèle à plusieurs maillages). */
  private entityIdOfObject(object: THREE.Object3D): string | undefined {
    let cur: THREE.Object3D | null = object;
    while (cur) {
      const id = (cur.userData as { entityId?: string }).entityId;
      if (id) return id;
      cur = cur.parent;
    }
    return undefined;
  }

  private characterTargetOfObject(object: THREE.Object3D): HoverTarget | undefined {
    // Raycaster also visits hidden children, including the former name sprite.
    if (!(object instanceof THREE.Mesh)) return undefined;
    let target: HoverTarget | undefined;
    let current: THREE.Object3D | null = object;
    while (current) {
      if (!current.visible) return undefined;
      target ??= current.userData.exploreCharacter as HoverTarget | undefined;
      current = current.parent;
    }
    return target;
  }

  private isObjectVisible(object: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }
    return true;
  }

  /**
   * Une entité npc/object/seat actuellement visible dont la case coïncide avec `cell`, ou
   * `undefined`. C'est le "repli généreux" (08-EXPLORATION.md "Contrôles" : "toute la case
   * d'une entité interactive est cliquable, pas seulement les quelques pixels de son modèle").
   */
  private visibleEntityAt(cell: Cell): string | undefined {
    const entityId = this.entityCellIndex.get(posKey(cell));
    if (!entityId || !this.visibleEntityIds.has(entityId)) return undefined;
    return entityId;
  }

  /**
   * Deux temps, jamais un rayon sur les seuls maillages (ancien défaut diagnostiqué en jeu :
   * "le clic sur des personnages... fonctionne de temps en temps" -- un clic à côté d'un
   * cheveu traversait la capsule/le cube et touchait le SOL, interprété comme un ordre de
   * déplacement vers la case de l'entité) :
   *  1. un rayon qui touche VRAIMENT un maillage d'entité (récursif : un modèle à plusieurs
   *     maillages enfants doit être touché sur n'importe lequel d'entre eux, jamais seulement
   *     sur le maillage racine) ;
   *  2. à défaut, le point du SOL sous le curseur -- si sa case porte une entité npc/object/seat
   *     actuellement visible, c'est elle qui répond ("toute la case... est cliquable"), pas le
   *     sol. Porte/sortie n'ont pas besoin de ce repli : leur volume de clic direct (temps 1)
   *     est déjà fiable (grands panneaux), et il n'y a jamais eu de plainte les concernant.
   */
  private pick(ndcX: number, ndcY: number): HoverTarget | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.renderCamera);

    const directHits = this.raycaster.intersectObjects(
      [...this.pickables, ...Array.from(this.rigs.values(), (rig) => rig.object)],
      true,
    );
    for (const hit of directHits) {
      if (!this.isObjectVisible(hit.object)) continue;
      const entityId = this.entityIdOfObject(hit.object);
      // Les meshes des pièces non découvertes restent dans le graphe Three afin de pouvoir
      // suivre leur découverte. Ils ne doivent toutefois jamais absorber le clic d'un objet
      // actif placé derrière eux. Les portes sont l'exception structurelle : elles sont
      // visibles hors découverte et ne passent donc pas par `visibleEntityIds`.
      if (entityId && (this.visibleEntityIds.has(entityId) || this.isDoorPickable(entityId))) {
        return { type: 'entity', id: entityId };
      }
      const character = this.characterTargetOfObject(hit.object);
      if (character) return character;
    }

    const floorHits = this.raycaster.intersectObject(this.floorPlane, false);
    if (floorHits.length === 0) return null;
    const point = (floorHits[0] as THREE.Intersection).point;
    const cell = worldToCell(this.map, point.x, point.z);
    if (!cell) return null;
    if (this.map.kindAt(cell) === 'door') {
      const door = this.doorAt(cell);
      if (door && this.isDoorPickable(door.id)) return { type: 'entity', id: door.id };
    }
    const entityId = this.visibleEntityAt(cell);
    if (entityId) return { type: 'entity', id: entityId };
    const near = this.nearestInteractable(point.x, point.z);
    if (near) return { type: 'entity', id: near };
    return { type: 'floor', cell };
  }

  /**
   * Interactable visible le plus proche du point du sol visé, dans `INTERACT_GRAB_RADIUS_M`.
   * Troisième et dernier temps de `pick` : la case exacte l'emporte toujours (temps 2), ceci
   * n'ajoute qu'une marge autour d'elle, pour que viser une chaise ne demande pas de viser un
   * losange de 50 px. La PLUS PROCHE gagne : deux figurants voisins ne se volent pas le clic.
   */
  private nearestInteractable(wx: number, wz: number): string | null {
    let best: string | null = null;
    let bestDistance = INTERACT_GRAB_RADIUS_M;
    for (const [id, anchor] of this.entityAnchors) {
      if (!this.visibleEntityIds.has(id)) continue;
      const distance = Math.hypot(anchor.x - wx, anchor.z - wz);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = id;
      }
    }
    return best;
  }

  handlePointerMove(ndcX: number, ndcY: number): void {
    const target = this.pick(ndcX, ndcY);
    const same =
      target && this.hovered && target.type === this.hovered.type
        ? target.type !== 'floor'
          ? target.id === (this.hovered as { id: string }).id
          : target.cell.x === (this.hovered as { cell: Cell }).cell.x &&
            target.cell.y === (this.hovered as { cell: Cell }).cell.y
        : target === this.hovered;
    if (same) return;
    this.hovered = target;

    if (target && target.type !== 'floor') {
      this.hoverOutline.visible = false;
    } else if (target?.type === 'floor') {
      const { x, z } = cellToWorld(this.map, target.cell);
      this.hoverOutline.position.x = x;
      this.hoverOutline.position.z = z;
      this.hoverOutline.visible = true;
    } else {
      this.hoverOutline.visible = false;
    }
    this.callbacks.onHover?.(target);
  }

  clearHover(): void {
    this.hovered = null;
    this.hoverOutline.visible = false;
    this.callbacks.onHover?.(null);
  }

  handleClick(ndcX: number, ndcY: number): void {
    const target = this.pick(ndcX, ndcY);
    if (!target) return;
    if (target.type === 'entity') this.callbacks.onInteract?.(target.id);
    else if (target.type === 'floor') this.callbacks.onMoveTo?.(target.cell);
  }

  /* ------------------------------------------------------------------ */
  /* Repère "Tab maintenu" (08-EXPLORATION.md "Les objectifs")           */
  /* ------------------------------------------------------------------ */

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    for (const rig of this.rigs.values()) {
      if (isExplorationCharacterRig(rig)) rig.setReducedMotion(reduced);
    }
    for (const rig of this.npcRigs.values()) rig.setReducedMotion?.(reduced);
  }

  /** Case de destination de l'objectif principal ; `null` = pas d'objectif (marqueur masqué). */
  setPingTarget(cell: Cell | null): void {
    if (!cell) {
      this.pingMarker.visible = false;
      return;
    }
    const { x, z } = cellToWorld(this.map, cell);
    this.pingMarker.position.x = x;
    this.pingMarker.position.z = z;
    this.pingMarker.visible = this.pingActive;
    this.pingMarker.scale.setScalar(1);
  }

  /**
   * Case de l'entité qui fait avancer l'histoire (le `completionTrigger` de l'étape), ou `null`
   * quand l'étape n'en a pas. Toujours visible, contrairement au repère "Tab maintenu" : c'est la
   * réponse permanente à « et maintenant, je clique où ? ».
   */
  setObjectiveTarget(cell: Cell | null): void {
    if (!cell) {
      this.objectiveBeacon.visible = false;
      return;
    }
    const { x, z } = cellToWorld(this.map, cell);
    this.objectiveBeacon.position.set(x, 0, z);
    this.objectiveBeacon.visible = true;
  }

  /** Tab maintenu ou relâché : montre/masque le repère (sans jamais rester affiché en continu). */
  setPingActive(active: boolean): void {
    this.pingActive = active;
    this.pingMarker.visible = active;
    if (!active) this.pingMarker.scale.setScalar(1);
  }

  tick(dt: number): void {
    this.camera.tick(dt);
    if (this.dormitoryPerspectiveActive) this.dormitoryPerspectiveCamera?.sync();
    if (this.dormitoryFloorReflection && this.holtReflectionZoom !== this.camera.getZoom())
      this.syncHoltFloorReflection();
    this.updateFog();
    this.fireClock += dt;
    this.dressing.tick(this.fireClock);
    // Pendant un dialogue, ExploreSession arrête cette boucle : les poses restent alors
    // figées. Un PNJ masqué ne consomme pas d'animation avant sa synchronisation narrative.
    for (const rig of this.npcRigs.values()) {
      if (rig.object.visible) rig.update(dt);
    }
    if (this.objectiveBeacon.visible && !this.reducedMotion) {
      this.objectiveClock += dt;
      // Une respiration lente : l'œil la retrouve sans qu'elle tire l'attention en continu.
      const breath = (Math.sin(this.objectiveClock * 1.6) + 1) / 2;
      this.objectiveRing.scale.setScalar(1 + breath * 0.12);
      (this.objectiveRing.material as THREE.MeshBasicMaterial).opacity = 0.42 + breath * 0.26;
      this.objectiveChevron.position.y =
        OBJECTIVE_CHEVRON_HEIGHT + Math.sin(this.objectiveClock * OBJECTIVE_BOB_SPEED) * OBJECTIVE_BOB_METERS;
      this.objectiveChevron.rotation.y = this.objectiveClock * 0.9;
    }
    if (this.pingActive && !this.reducedMotion) {
      this.pingClock += dt;
      const s = 1 + Math.sin(this.pingClock * 5) * 0.18;
      this.pingMarker.scale.setScalar(s);
    }
  }

  resize(aspect: number, widthPx?: number, heightPx?: number): void {
    this.camera.resize(aspect);
    this.dormitoryPerspectiveCamera?.resize(aspect);
    if (widthPx !== undefined && heightPx !== undefined)
      this.dormitoryPilotLighting?.resize(widthPx, heightPx);
  }

  dispose(): void {
    this.industrialCoverDetails?.dispose();
    this.industrialCoverDetails = null;
    this.hangarDetails?.dispose();
    this.hangarDetails = null;
    this.holtArchitecture?.dispose();
    this.holtArchitecture = null;
    this.holtRoomRendering?.dispose();
    this.holtRoomRendering = null;
    this.dormitoryPilotLighting?.dispose();
    this.dormitoryPilotLighting = null;
    this.dormitoryPilotArchitecture?.dispose();
    this.dormitoryPilotArchitecture = null;
    // Les clones de rig possèdent leurs squelettes et empruntent les géométries des
    // templates. Capturer les squelettes avant
    // le dispose des rigs, puis les libérer une seule fois par identité.
    const ownedSkeletons = new Set<THREE.Skeleton>();
    const collectSkeletons = (root: THREE.Object3D): void => {
      root.traverse((object) => {
        if (object instanceof THREE.SkinnedMesh) ownedSkeletons.add(object.skeleton);
      });
    };
    for (const rig of this.rigs.values()) collectSkeletons(rig.object);
    for (const rig of this.npcRigs.values()) collectSkeletons(rig.object);

    for (const rig of this.rigs.values()) rig.dispose();
    this.rigs.clear();
    for (const rig of this.npcRigs.values()) rig.dispose();
    this.npcRigs.clear();
    for (const skeleton of ownedSkeletons) skeleton.dispose();
    this.dressing.dispose();
    // Tampon d'instances propre à chaque `InstancedMesh` (voir `topEdgeInstances`/`bandInstances`
    // et les lots du corps des murs) : ni leur géométrie ni leur matière ne leur appartient,
    // toutes deux libérées juste après via `cellGeometries`/`cellMaterials`/`architectureMaterials`.
    for (const instancedMesh of this.wallInstancedMeshes) instancedMesh.dispose();
    this.wallInstancedMeshes.length = 0;
    for (const reflector of this.dormitoryRoomReflections) {
      this.cellMaterials.delete(reflector.material as THREE.Material);
      reflector.dispose();
    }
    this.dormitoryRoomReflections.length = 0;
    this.dormitoryFloorReflection = null;
    for (const material of this.cellMaterials) material.dispose();
    for (const texture of this.cellTextures) texture.dispose();
    for (const geometry of this.cellGeometries) geometry.dispose();
    // La shadow map appartient au soleil propre à cette vue et ne suit pas le cycle des matières.
    this.explorationLights.sun.shadow.dispose();
    this.architectureMaterials.dispose();
    this.dormitoryMaterials?.dispose();
  }

  /**
   * Revêtement par pièce (EXPLORATION-VISUAL-DESIGN.md "Valeurs, lumière et matières" :
   * "les pièces doivent se différencier par leur revêtement autant que par leur teinte") --
   * la cantine attend un sol "stratifié chaud", l'infirmerie un carrelage propre ; le reste de
   * l'académie garde le béton. Passe D : les deux sont désormais des photos CC0 dédiées
   * (`materials.ts` PHOTO_URL) plutôt qu'une même peinture procédurale `warmLinoleum` --
   * « peu de matières, bien réemployées », mais pas une seule pour deux usages très différents
   * (bois verni vs faïence).
   */
  private static readonly ACADEMY_FLOOR_BY_ROOM: Partial<
    Record<string, 'creamConcrete' | 'warmLaminate' | 'clinicTile'>
  > = {
    cantine: 'warmLaminate',
    infirmerie: 'clinicTile',
  };

  /** Le parking du centre est une aire extérieure : bitume plutôt que le béton intérieur des salles. */
  private static readonly CENTRE_FLOOR_BY_ROOM: Partial<Record<string, 'coldConcrete' | 'asphalt'>> = {
    parking: 'asphalt',
  };

  /**
   * Teinte de base par matière : le béton photo (`coldConcrete` dans `materials.ts`) est réemployé
   * TEL QUEL pour le sol par défaut des deux lieux -- même fichier, même décodage -- mais coloré
   * différemment ici plutôt que dupliqué en un second fichier (mandat passe D, « variations de
   * teinte et d'échelle plutôt qu'un fichier par pièce ») : crème et net pour l'académie diurne,
   * neutre et froid pour le centre désaffecté (ART-DIRECTION.md "Lumière"). Les matières déjà
   * colorées par leur propre photo (carrelage, stratifié, bitume) restent proches du blanc : leur
   * teinte vient de l'image, pas d'un recolorage supplémentaire.
   */
  private static readonly BASE_FLOOR_TINT: Partial<Record<string, THREE.Color>> = {
    // 1,16/1,05/0,88 chauffait le béton d'un cran de trop : multiplié par le soleil de
    // l'académie, lui-même chaud (0xffeed1), le sol virait au sable tassé -- on lisait une cour
    // en terre battue au milieu du dortoir. La teinte revient près du neutre : c'est la LUMIÈRE
    // qui réchauffe la pièce, pas l'albédo, et le béton redevient du béton.
    creamConcrete: new THREE.Color(1.06, 1.01, 0.95),
    coldConcrete: new THREE.Color(0.93, 0.97, 1.04),
  };

  /**
   * Teinte discrète par pièce, dérivée du RNG visuel (jamais `Math.random()`, AGENTS.md règle 1)
   * et propre à chaque `roomId` (`fork` stable, comme le reste du décor -- EXPLORATION-VISUAL-
   * DESIGN.md §4.7 "RNG visuel... fork par placement stable"). Sans elle, toutes les pièces d'une
   * même matière étaient rigoureusement identiques (blanc pur une fois découvertes) : aucune
   * variation d'entretien/d'usure d'une pièce à l'autre, ce qui est une bonne part du "beige plat"
   * constaté. L'écart reste faible (quelques % par canal) : une nuance, jamais une nouvelle couleur.
   * `base` porte la teinte de la matière elle-même (voir `BASE_FLOOR_TINT`) ; la nuance de pièce se
   * multiplie par-dessus.
   */
  private roomFloorTint(roomId: string | undefined, base: THREE.Color): THREE.Color {
    if (!roomId) return base.clone();
    const local = this.rng.fork(`explore:${this.def.id}:room-tint:${roomId}`);
    const d = () => (local.next() - 0.5) * 0.09;
    return new THREE.Color(base.r * (1 + d()), base.g * (1 + d()), base.b * (1 + d()));
  }

  /** Clone la matière architecturale pour que l'état de découverte teinte chaque sol indépendamment. */
  private floorMaterial(
    discovered: boolean,
    width: number,
    height: number,
    roomId?: string,
  ): THREE.MeshStandardMaterial {
    if (roomId === 'dortoirs' && this.dormitoryMaterials) {
      const material = this.dormitoryMaterials.get('floor').clone();
      material.envMapIntensity = 0.65;
      this.dormitoryFloorMaterials.add(material);
      const texture = this.dormitoryMaterials.cloneTexture('floor');
      const bumpTexture = this.dormitoryMaterials.cloneTexture('floor');
      texture.repeat.set(
        Math.max(1, width / DORMITORY_FLOOR_TILE_WIDTH),
        Math.max(1, height / DORMITORY_FLOOR_TILE_DEPTH),
      );
      bumpTexture.repeat.copy(texture.repeat);
      material.userData.floorTexture = texture;
      material.userData.dormitoryBumpTexture = bumpTexture;
      material.userData.dormitoryBumpScale = 0.038;
      material.userData.discoveredColor = material.color.clone();
      material.map = texture.image ? texture : null;
      material.bumpMap = bumpTexture.image ? bumpTexture : null;
      material.bumpScale = bumpTexture.image ? 0.038 : 0;
      this.cellTextures.add(texture);
      this.cellTextures.add(bumpTexture);
      this.cellMaterials.add(material);
      this.applyFloorVisibility(material, discovered);
      return material;
    }
    const isCentre = this.visuals.coldPalette;
    const key = isCentre
      ? (roomId && ExploreView.CENTRE_FLOOR_BY_ROOM[roomId]) || 'coldConcrete'
      : (roomId && ExploreView.ACADEMY_FLOOR_BY_ROOM[roomId]) || 'creamConcrete';
    const material = this.architectureMaterials.get(key).clone();
    const pilotFloor = this.art.floorTexture && roomId === 'dortoirs';
    const source = pilotFloor ? this.art.floorTexture : material.map;
    const texture = source?.clone();
    if (texture) {
      // Une répétition par grande plage suffit : les précédentes répétitions tous les 3 m
      // faisaient lire le sol comme une grille de rectangles indépendante du lieu. Le béton (photo,
      // marqué par des blessures et coulures reconnaissables) reste à répétition quasi nulle --
      // une seule image étirée sur la pièce -- pour ne jamais faire lire une tache deux fois.
      // (Essayé puis abandonné : 7 m / 9 m redonnent du grain, mais la coulure diagonale de la
      // photo se met alors à rayer tout le sol en bandes régulières -- pire que le flou.)
      // Carrelage, stratifié et bitume ont des motifs réguliers (joint, lame, grain) que la
      // répétition ne trahit pas : ils gardent une échelle proche de leur module réel.
      const textureSpan =
        key === 'clinicTile' ? 3 : key === 'warmLaminate' ? 5 : key === 'asphalt' ? 22 : isCentre ? 29 : 18;
      texture.repeat.set(
        pilotFloor ? 1 : Math.max(1, width / textureSpan),
        pilotFloor ? 1 : Math.max(1, height / textureSpan),
      );
      this.cellTextures.add(texture);
    }
    material.userData.floorTexture = texture ?? null;
    const baseTint = pilotFloor
      ? new THREE.Color(0xffffff)
      : (ExploreView.BASE_FLOOR_TINT[key] ?? new THREE.Color(0xffffff));
    material.userData.discoveredColor = this.roomFloorTint(roomId, baseTint);
    material.map = null; // `applyFloorVisibility` (appelée juste en dessous) pose l'état réel.
    if (key === 'creamConcrete' || key === 'coldConcrete') material.roughness = 0.9;
    this.cellMaterials.add(material);
    this.applyFloorVisibility(material, discovered);
    return material;
  }

  /**
   * Pose la couleur ET la texture d'un sol de pièce selon sa découverte -- construction
   * (`floorMaterial`) et bascule en cours de partie (`setDiscoveredRooms`) partagent cette
   * même règle. Deux raisons de ne PAS attribuer la texture telle quelle :
   * - Sol d'une pièce NON découverte : une masse sombre UNIFORME, sans la texture de matière
   *   (08-EXPLORATION.md "une pièce vide et une pièce pleine doivent se ressembler" -- même la
   *   matière ne doit pas se deviner). Sans ça, `HIDDEN_ROOM_COLOR` se MULTIPLIE à l'albédo de
   *   la texture (elle-même loin du blanc) et le résultat lit comme un trou noir, pas une masse
   *   sombre lisible -- défaut réel constaté en jeu.
   * - La matière du centre d'examen (`coldConcrete`) charge son image en réseau
   *   (`EnvironmentMaterials.get`) : à la construction, son clone n'a PAS encore d'image.
   *   Attribuer quand même la texture (et forcer `needsUpdate`) déclenche "Texture marked for
   *   update but no image data found" -- le rendu tente d'envoyer une image qui n'existe pas
   *   encore. Ne l'attribuer qu'une fois `texture.image` prêt règle les deux à la fois : la
   *   pièce garde sa teinte plate le temps très bref du chargement (aucun `Math.random()`
   *   concerné, juste une latence réseau), puis reçoit sa matière dès que `setDiscoveredRooms`
   *   la revoit prête -- appelée à chaque image de la boucle de rendu (`ExploreSession.syncVisibility`),
   *   donc au plus une image de retard, jamais un état figé sans texture.
   */
  private applyFloorVisibility(material: THREE.MeshStandardMaterial, discovered: boolean): void {
    const texture = (material.userData.floorTexture as THREE.Texture | null | undefined) ?? null;
    const nextMap = discovered && texture?.image ? texture : null;
    if (material.map !== nextMap) {
      material.map = nextMap;
      material.needsUpdate = true;
    }
    const dormitoryBump = (material.userData.dormitoryBumpTexture as THREE.Texture | undefined) ?? null;
    const nextBump = discovered && dormitoryBump?.image ? dormitoryBump : null;
    if (material.bumpMap !== nextBump) {
      material.bumpMap = nextBump;
      material.bumpScale = nextBump ? ((material.userData.dormitoryBumpScale as number | undefined) ?? 0) : 0;
      material.needsUpdate = true;
    }
    if (this.roomFloors.get('dortoirs')?.material === material && this.dormitoryFloorReflection) {
      this.dormitoryFloorReflection.visible = discovered;
    }
    const discoveredColor = (material.userData.discoveredColor as THREE.Color | undefined) ?? null;
    if (discovered && discoveredColor) material.color.copy(discoveredColor);
    else material.color.setHex(discovered ? 0xffffff : HIDDEN_ROOM_COLOR);
  }
}
