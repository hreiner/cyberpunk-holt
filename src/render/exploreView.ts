/**
 * Rendu three.js d'une `MapDef` d'exploration (epic 3, lot 3.5) : sol, murs
 * de 3 m avec la règle de coupe (docs/design/08-EXPLORATION.md "La caméra et
 * les murs"), portes, mobilier bas/haut, figurants gris, survol/clic. Même
 * esprit que `src/render/yardView.ts` (scène + surcouche), légende propre à
 * l'exploration (voir `src/explore/exploreMap.ts`).
 *
 * Cette classe possède sa propre `IsoCamera` (à la différence de `YardView`,
 * dont la caméra vit dans `app.ts`) : le lot 3.5 n'intègre rien au chapitre,
 * `explore-lab.ts` est le seul appelant et n'a besoin que d'un renderer et
 * d'une boucle d'images — voir la note de portée dans le prompt du lot.
 *
 * Décoratif seedé (jamais `Math.random()`, AGENTS.md règle 1) : la légère
 * variation des touffes de végétation vient du `Rng` transmis, comme dans
 * `YardView.buildObstacles`.
 */

import * as THREE from 'three';
import type { Rng } from '@/core/rng';
import { CHARACTER_IDS, getCharacter, type CharacterId, type CharacterSheet } from '@/rules/character';
import { ExploreMap, LEADER_SPEED, posKey, roomAt } from '@/explore';
import type { Cell, DoorEntity, EntityDef, MapDef, RoomDef } from '@/explore';
import { isExplorationCharacterRig, type CharacterRig } from './characterRig';
import { createCadetExplorationRig } from './exploration/cadetRig';
import { createExploreNpcRig, type ExploreNpcRig } from './exploration/npcRig';
import { ExploreDressing } from './exploration/dressing';
import { createDoorControl, createSurveillanceCamera, createTechnicalConduit, createWallBand } from './exploration/architecture';
import { addExplorationLighting } from './exploration/atmosphere';
import { EnvironmentMaterials } from './exploration/materials';
import { EnvironmentPropFactory } from './exploration/props';
import { HOLT_VISUALS } from '@/data/exploreVisuals/holt';
import { CENTRE_EXAMEN_VISUALS } from '@/data/exploreVisuals/centreExamen';
import type { ExploreVisualMapDef } from '@/data/exploreVisualTypes';
import { CAMERA_DISTANCE, ISO_ELEVATION_DEG, IsoCamera } from './isoCamera';

export const EXPLORE_CELL_SIZE_METERS = 1;
const WALL_HEIGHT = 3;
const WALL_CUT_HEIGHT = 0.24;
const FURNITURE_LOW_HEIGHT = 1.0;
const FURNITURE_HIGH_HEIGHT = 2.6;
const GLASS_HEIGHT = 3;
const VEGETATION_HEIGHT = 0.5;

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
/** Couleur d'un véhicule du garage : distincte du mobilier haut (agrès), pour rester lisible côte à côte. */
const VEHICLE_COLOR = 0xc9863a;
const VEHICLE_GLASS_COLOR = 0x8ea6b8;
/** Anneau au sol du groupe du joueur : `--comm` est réservé à la radio (ART-DIRECTION.md "Couleurs"), on reprend l'accent d'interface. */
const PARTY_RING_COLOR = 0x4cc9f0;

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
/** Molette : sensibilité (unités de zoom par cran `deltaY`, valeur navigateur typique ~100). */
const WHEEL_ZOOM_SENSITIVITY = 0.045;
/** `+`/`-` maintenus : vitesse de zoom continue. */
export const KEY_ZOOM_SPEED = 30;
/** Flèches maintenues : vitesse du panoramique libre, en mètres/seconde. */
const PAN_SPEED_M_S = 18;
/** Marge de panoramique au-delà du bord de la carte, "une pièce" (08-EXPLORATION.md "La caméra et les murs"). */
const PAN_MARGIN_METERS = 12;

export type Side = 'north' | 'south' | 'east' | 'west';

const SIDE_NORMAL: Record<Side, [number, number]> = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};

export type HoverTarget = { type: 'floor'; cell: Cell } | { type: 'entity'; id: string };

export interface ExploreViewCallbacks {
  onHover?(target: HoverTarget | null): void;
  onMoveTo?(cell: Cell): void;
  onInteract?(entityId: string): void;
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

interface WallCellInfo {
  mesh: THREE.Mesh;
  topEdge: THREE.Mesh;
  band: THREE.Mesh;
  isContainer: boolean;
  control?: THREE.Group;
  /** Ornements fixés à cette face : disparaissent avec le mur coupé, jamais au travers. */
  ornaments?: THREE.Object3D[];
  sides: Side[];
  /** Une case `+` est une ouverture structurelle même sans entité `door` interactive. */
  isDoorCell: boolean;
  door?: DoorEntity;
  panel?: THREE.Mesh;
}

export class ExploreView {
  readonly scene = new THREE.Scene();
  readonly camera: IsoCamera;
  private readonly root = new THREE.Group();
  private readonly map: ExploreMap;
  private readonly def: MapDef;

  private readonly wallCells = new Map<string, WallCellInfo>();
  private readonly roomSidesByCell = new Map<string, Side[]>();
  /** Cases de mobilier haut ('T') situées dans la pièce 'garage' : rendues comme des véhicules (voir `buildCells`). */
  private readonly garageCells = new Set<string>();
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
  /** id d'entité npc/object/seat -> ses parties visuelles (marqueur + repère au sol), togglées ensemble. */
  private readonly entityVisualParts = new Map<string, THREE.Object3D[]>();
  /** Entités npc/object/seat actuellement actives ET découvertes (nourri par `setVisibleEntities`). */
  private visibleEntityIds = new Set<string>();
  /** Les portes font partie de l'architecture et restent des cibles directes, hors découverte de pièce. */
  private readonly doorEntityIds = new Set<string>();
  /** Habillage uniquement : `MapDef` reste la vérité pour collision et interactions. */
  private readonly dressing: ExploreDressing;
  private readonly replacedFurnitureCells = new Set<string>();
  /** PNJ ayant une chaise déclarative : seule condition qui autorise la pose assise. */
  private readonly seatedNpcIds = new Set<string>();
  private readonly discoveredRoomIds = new Set<string>();
  private readonly architectureMaterials: EnvironmentMaterials;
  /** Ressources propres aux cellules, portes et sols ; les props et rigs ont leur propriétaire. */
  private readonly cellGeometries = new Set<THREE.BufferGeometry>();
  private readonly cellMaterials = new Set<THREE.Material>();
  private readonly cellTextures = new Set<THREE.Texture>();

  private readonly rigs = new Map<string, CharacterRig>();
  /** PNJ décoratifs : leur visibilité reste pilotée par registerVisualEntity. */
  private readonly npcRigs = new Map<string, ExploreNpcRig>();
  private readonly lastRigPos = new Map<string, { x: number; z: number }>();
  /** Dernière case connue du meneur (alimentée par `updateRigPosition`) : sert à `centerOnLeader()`. */
  private leaderCell: Cell | null = null;

  /** État initial des portes (avant que `ExploreState` ne prenne le relais via `setDoorOpen`). */
  private readonly doorsOpenDefault = new Map<string, boolean>();

  /** Repère au sol de l'objectif, "Tab maintenu" (08-EXPLORATION.md "Les objectifs"). */
  private readonly pingMarker: THREE.Mesh;
  private pingActive = false;
  private pingClock = 0;
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

  constructor(
    def: MapDef,
    private readonly rng: Rng,
    aspect: number,
    private readonly callbacks: ExploreViewCallbacks = {},
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

    const isCentre = def.id === 'centre-examen';
    addExplorationLighting(this.scene, Math.max(this.map.width, this.map.height), isCentre);
    this.architectureMaterials = new EnvironmentMaterials(rng.fork(`explore:${def.id}:architecture`));
    const visualDef = this.visualDefinition(def.id);
    for (const placement of visualDef.placements) {
      for (const cell of placement.replaces ?? []) this.replacedFurnitureCells.add(posKey(cell));
      if (placement.model === 'canteen-chair' && placement.entityId) this.seatedNpcIds.add(placement.entityId);
    }
    this.dressing = new ExploreDressing(
      visualDef,
      new EnvironmentPropFactory((cell) => cellToWorld(this.map, cell), rng.fork(`explore:${def.id}`), isCentre),
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
    this.root.add(this.floorPlane);
    this.buildRoomFloors();

    this.hoverOutline = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.5, 24),
      new THREE.MeshBasicMaterial({ color: HOVER_COLOR, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.hoverOutline.rotation.x = -Math.PI / 2;
    this.hoverOutline.position.y = 0.03;
    this.hoverOutline.visible = false;
    this.root.add(this.hoverOutline);

    this.pingMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.58, 28),
      new THREE.MeshBasicMaterial({
        color: HOVER_COLOR,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    this.pingMarker.rotation.x = -Math.PI / 2;
    this.pingMarker.position.y = 0.05;
    this.pingMarker.visible = false;
    this.root.add(this.pingMarker);

    for (const e of def.entities) {
      if (e.type === 'door') this.doorsOpenDefault.set(e.id, !e.locked);
    }

    this.computeRoomSides();
    this.computeGarageCells();
    this.buildCells();
    this.buildDormitoryArchitecture();
    this.buildEntityMarkers();
    this.dressing.syncVisibility({
      discoveredRoomIds: this.discoveredRoomIds,
      visibleEntityIds: this.visibleEntityIds,
    });
    this.updateFog();
  }

  private visualDefinition(mapId: string): ExploreVisualMapDef {
    if (mapId === HOLT_VISUALS.mapId) return HOLT_VISUALS;
    if (mapId === CENTRE_EXAMEN_VISUALS.mapId) return CENTRE_EXAMEN_VISUALS;
    return { mapId, placements: [] };
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
      const geometry = new THREE.PlaneGeometry(width * EXPLORE_CELL_SIZE_METERS, height * EXPLORE_CELL_SIZE_METERS);
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
    const wallMat = this.architectureMaterials.get(this.def.id === 'centre-examen' ? 'coldConcreteWall' : 'creamConcreteWall');
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

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const kind = this.map.kindAt({ x, y });
        if (kind === 'floor' || kind === 'void') continue;
        const { x: wx, z: wz } = cellToWorld(this.map, { x, y });
        const key = `${x},${y}`;
        const sides = this.roomSidesByCell.get(key) ?? [];

        if (kind === 'wall' || kind === 'door') {
          const isContainer = this.def.id === 'centre-examen' && x >= 7 && x < 37 && y >= 1 && y < 21 && kind === 'wall';
          const side = containerSides[(Math.floor(x / 7) + Math.floor(y / 5)) % containerSides.length] as THREE.Material;
          const mesh = new THREE.Mesh(isContainer ? containerBox : unitBox, isContainer ? side : kind === 'door' ? frameMat : wallMat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.position.x = wx;
          mesh.position.z = wz;
          this.root.add(mesh);

          const topEdge = new THREE.Mesh(unitBox, edgeMat);
          topEdge.scale.set(0.96, 0.05, 0.96);
          topEdge.position.set(wx, 0, wz);
          topEdge.visible = false;
          this.root.add(topEdge);

          const band = createWallBand(this.architectureMaterials, this.def.id === 'centre-examen');
          band.position.set(wx, band.position.y, wz);
          this.root.add(band);
          const info: WallCellInfo = { mesh, topEdge, band, sides, isContainer, isDoorCell: kind === 'door' };

          if (kind === 'door') {
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
              control.position.set(wx, 0, wz);
              this.root.add(control);
              info.control = control;
              // Le cadre (fixe, toujours visible) sert aussi de cible de clic.
              mesh.userData.entityId = door.id;
              this.pickables.push(mesh);
            }
          }

          this.wallCells.set(key, info);
          continue;
        }

        if (kind === 'furnitureLow') {
          if (this.replacedFurnitureCells.has(key)) continue;
          const mesh = new THREE.Mesh(unitBox, furnitureLowMat);
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

    this.recomputeCutaway();
  }

  /** Première tranche HOLT : surveillance et câblage concentrés sur le sas du dortoir. */
  private buildDormitoryArchitecture(): void {
    if (this.def.id !== 'holt') return;
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
    // Mur ouest du dortoir : le triplet encadre la porte 25,7 et avance vers la salle,
    // donc il reste lisible depuis l'iso au lieu de se perdre derrière le mur nord ou le HUD.
    const camera = createSurveillanceCamera(this.architectureMaterials);
    camera.rotation.y = Math.PI / 2;
    camera.position.x = 0.42;
    add({ x: 25, y: 6 }, camera);
    const control = createDoorControl(this.architectureMaterials);
    control.rotation.y = Math.PI / 2;
    control.position.x = 0.42;
    add({ x: 25, y: 7 }, control);
    const conduit = createTechnicalConduit(this.architectureMaterials, 1.7);
    conduit.rotation.y = Math.PI / 2;
    conduit.position.x = 0.42;
    add({ x: 25, y: 8 }, conduit);
  }

  /** Anneau discret au sol sous un interactable : le repère même quand le prop lui-même est petit. */
  private addGroundMarker(wx: number, wz: number, color: number): THREE.Mesh {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.44, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(wx, 0.015, wz);
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
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.62, 0.62),
          new THREE.MeshStandardMaterial({
            color: OBJECT_COLOR,
            roughness: 0.6,
            emissive: OBJECT_COLOR,
            emissiveIntensity: 0.25,
          }),
        );
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
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.72, 0.5, 0.72),
          new THREE.MeshStandardMaterial({
            color: SEAT_COLOR,
            roughness: 0.6,
            emissive: SEAT_COLOR,
            emissiveIntensity: 0.2,
          }),
        );
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
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.55, 0.72, 24),
          new THREE.MeshBasicMaterial({
            color: EXIT_COLOR,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          }),
        );
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
      const rig = createCadetExplorationRig(sheet, EXTRA_COLOR);
      rig.setEquipment([]);
      rig.setEquipmentLineVisible(false);
      rig.setWorldPosition(x, z);
      rig.playExplorationPose('talk');
      return rig;
    }
    const rig = createExploreNpcRig(entityId, this.seatedNpcIds.has(entityId));
    rig.object.position.set(x, 0, z);
    return rig;
  }

  /* ------------------------------------------------------------------ */
  /* Murs en coupe (ADR 0013 §6, 08-EXPLORATION.md "La caméra et les murs") */
  /* ------------------------------------------------------------------ */

  private isCut(sides: Side[]): boolean {
    if (sides.length === 0) return false;
    const azimuth = THREE.MathUtils.degToRad(45 + this.quarter * 90);
    const dir: [number, number] = [Math.cos(azimuth), Math.sin(azimuth)];
    return sides.some((s) => {
      const n = SIDE_NORMAL[s];
      return n[0] * dir[0] + n[1] * dir[1] > 0.01;
    });
  }

  /** Recalcule quels murs sont coupés. Appelé à la construction et à chaque quart de tour. */
  recomputeCutaway(): void {
    for (const info of this.wallCells.values()) {
      const cut = this.isCut(info.sides);
      const height = cut ? WALL_CUT_HEIGHT : WALL_HEIGHT;
      if (info.isDoorCell) {
        // Porte : un simple linteau en haut de l'ouverture, jamais un bloc plein -- sinon
        // une porte OUVERTE lirait comme un mur (08-EXPLORATION.md "Pas de plafond. Les
        // portes ouvertes sont des trouées"). Le panneau (`info.panel`) porte l'état fermé.
        info.mesh.scale.set(0.92, Math.min(0.14, height), 0.92);
        info.mesh.position.y = height - Math.min(0.07, height / 2);
      } else {
        info.mesh.scale.set(0.98, height, 0.98);
        info.mesh.position.y = height / 2;
      }
      info.topEdge.visible = cut;
      info.topEdge.position.y = height;
      info.band.visible = !cut && !info.isContainer;
      if (info.control) info.control.visible = !cut;
      if (info.ornaments) {
        for (const ornament of info.ornaments) ornament.visible = !cut;
      }
      if (info.panel) {
        info.panel.scale.set(0.86, height, 0.16);
        info.panel.position.y = height / 2;
      }
    }
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
    const up = this.camera.screenUpXZ();
    const right = this.camera.screenRightXZ();
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
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera.camera);
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
    const { x, z } = this.frameClampedTarget(world.x, world.z);
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
    const right = this.camera.screenRightXZ();
    const up = this.camera.screenUpXZ();
    // Meme approximation que `updateFog()` : la demi-etendue du frustum orthographique,
    // projetee sur le sol incline par l'elevation de la camera.
    const groundFactor = Math.cos(THREE.MathUtils.degToRad(ISO_ELEVATION_DEG));
    const halfR = this.camera.camera.right * groundFactor;
    const halfU = this.camera.camera.top * groundFactor;

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
    v.project(this.camera.camera);
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
    for (const info of this.wallCells.values()) {
      if (info.door?.id === entityId && info.panel) info.panel.visible = !open;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Personnages                                                         */
  /* ------------------------------------------------------------------ */

  setLeader(sheet: CharacterSheet): void {
    this.addRig('leader', sheet, true);
  }

  setFollower(id: string, sheet: CharacterSheet): void {
    this.addRig(id, sheet, false);
  }

  /** Cadets exploration : squelette/mixer local, clips sans root motion et anneau d'équipe. */
  private addRig(id: string, sheet: CharacterSheet, isLeader: boolean): void {
    const existing = this.rigs.get(id);
    if (existing) {
      existing.dispose();
      this.root.remove(existing.object);
    }
    const rig = createCadetExplorationRig(sheet, PARTY_RING_COLOR);
    rig.setEquipment([]);
    rig.setEquipmentLineVisible(false);
    rig.setHighlighted(isLeader);
    rig.setReducedMotion(this.reducedMotion);
    if (!isLeader) rig.object.getObjectByName('cadet-label')!.visible = false;
    this.root.add(rig.object);
    this.rigs.set(id, rig);
  }

  /** Place un rig (case, éventuellement fractionnaire) et joue l'animation adaptée. */
  updateRigPosition(id: string, cell: { x: number; y: number }, moving: boolean, dt: number): void {
    if (id === 'leader') this.leaderCell = { x: cell.x, y: cell.y };
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
  setVisibleEntities(ids: Iterable<string>): void {
    const next = new Set(ids);
    for (const [id, parts] of this.entityVisualParts) {
      const visible = next.has(id);
      for (const part of parts) part.visible = visible;
    }
    this.visibleEntityIds = next;
    this.dressing.syncVisibility({
      discoveredRoomIds: this.discoveredRoomIds,
      visibleEntityIds: this.visibleEntityIds,
    });
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
    this.dressing.syncVisibility({
      discoveredRoomIds: this.discoveredRoomIds,
      visibleEntityIds: this.visibleEntityIds,
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
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera.camera);

    const directHits = this.raycaster.intersectObjects(this.pickables, true);
    for (const hit of directHits) {
      const entityId = this.entityIdOfObject(hit.object);
      // Les meshes des pièces non découvertes restent dans le graphe Three afin de pouvoir
      // suivre leur découverte. Ils ne doivent toutefois jamais absorber le clic d'un objet
      // actif placé derrière eux. Les portes sont l'exception structurelle : elles sont
      // visibles hors découverte et ne passent donc pas par `visibleEntityIds`.
      if (entityId && (this.visibleEntityIds.has(entityId) || this.doorEntityIds.has(entityId))) {
        return { type: 'entity', id: entityId };
      }
    }

    const floorHits = this.raycaster.intersectObject(this.floorPlane, false);
    if (floorHits.length === 0) return null;
    const point = (floorHits[0] as THREE.Intersection).point;
    const cell = worldToCell(this.map, point.x, point.z);
    if (!cell) return null;
    const entityId = this.visibleEntityAt(cell);
    if (entityId) return { type: 'entity', id: entityId };
    return { type: 'floor', cell };
  }

  handlePointerMove(ndcX: number, ndcY: number): void {
    const target = this.pick(ndcX, ndcY);
    const same =
      target && this.hovered && target.type === this.hovered.type
        ? target.type === 'entity'
          ? target.id === (this.hovered as { id: string }).id
          : target.cell.x === (this.hovered as { cell: Cell }).cell.x &&
            target.cell.y === (this.hovered as { cell: Cell }).cell.y
        : target === this.hovered;
    if (same) return;
    this.hovered = target;

    if (target?.type === 'entity') {
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

  handleClick(ndcX: number, ndcY: number): void {
    const target = this.pick(ndcX, ndcY);
    if (!target) return;
    if (target.type === 'entity') this.callbacks.onInteract?.(target.id);
    else this.callbacks.onMoveTo?.(target.cell);
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

  /** Tab maintenu ou relâché : montre/masque le repère (sans jamais rester affiché en continu). */
  setPingActive(active: boolean): void {
    this.pingActive = active;
    this.pingMarker.visible = active;
    if (!active) this.pingMarker.scale.setScalar(1);
  }

  tick(dt: number): void {
    this.camera.tick(dt);
    this.updateFog();
    // Pendant un dialogue, ExploreSession arrête cette boucle : les poses restent alors
    // figées. Un PNJ masqué ne consomme pas d'animation avant sa synchronisation narrative.
    for (const rig of this.npcRigs.values()) {
      if (rig.object.visible) rig.update(dt);
    }
    if (this.pingActive && !this.reducedMotion) {
      this.pingClock += dt;
      const s = 1 + Math.sin(this.pingClock * 5) * 0.18;
      this.pingMarker.scale.setScalar(s);
    }
  }

  resize(aspect: number): void {
    this.camera.resize(aspect);
  }

  dispose(): void {
    for (const rig of this.rigs.values()) rig.dispose();
    this.rigs.clear();
    for (const rig of this.npcRigs.values()) rig.dispose();
    this.npcRigs.clear();
    this.dressing.dispose();
    for (const material of this.cellMaterials) material.dispose();
    for (const texture of this.cellTextures) texture.dispose();
    for (const geometry of this.cellGeometries) geometry.dispose();
    this.architectureMaterials.dispose();
  }

  /**
   * Revêtement par pièce (EXPLORATION-VISUAL-DESIGN.md "Valeurs, lumière et matières" :
   * "les pièces doivent se différencier par leur revêtement autant que par leur teinte") --
   * la cantine et l'infirmerie sont les deux pièces où la référence attend un sol "stratifié
   * chaud"/propre plutôt que du béton brut ; le reste de l'académie garde le béton crème.
   */
  private static readonly ACADEMY_FLOOR_BY_ROOM: Partial<Record<string, 'creamConcrete' | 'warmLinoleum'>> = {
    cantine: 'warmLinoleum',
    infirmerie: 'warmLinoleum',
  };

  /**
   * Teinte discrète par pièce, dérivée du RNG visuel (jamais `Math.random()`, AGENTS.md règle 1)
   * et propre à chaque `roomId` (`fork` stable, comme le reste du décor -- EXPLORATION-VISUAL-
   * DESIGN.md §4.7 "RNG visuel... fork par placement stable"). Sans elle, toutes les pièces d'une
   * même matière étaient rigoureusement identiques (blanc pur une fois découvertes) : aucune
   * variation d'entretien/d'usure d'une pièce à l'autre, ce qui est une bonne part du "beige plat"
   * constaté. L'écart reste faible (quelques % par canal) : une nuance, jamais une nouvelle couleur.
   */
  private roomFloorTint(roomId: string | undefined): THREE.Color {
    if (!roomId) return new THREE.Color(0xffffff);
    const local = this.rng.fork(`explore:${this.def.id}:room-tint:${roomId}`);
    const d = () => (local.next() - 0.5) * 0.09;
    return new THREE.Color(1 + d(), 1 + d(), 1 + d());
  }

  /** Clone la matière architecturale pour que l'état de découverte teinte chaque sol indépendamment. */
  private floorMaterial(discovered: boolean, width: number, height: number, roomId?: string): THREE.MeshStandardMaterial {
    const isCentre = this.def.id === 'centre-examen';
    const key = isCentre
      ? 'coldConcrete'
      : (roomId && ExploreView.ACADEMY_FLOOR_BY_ROOM[roomId]) || 'creamConcrete';
    const material = this.architectureMaterials.get(key).clone();
    const source = material.map;
    const texture = source?.clone();
    if (texture) {
      // Une répétition par grande plage suffit : les précédentes répétitions tous les 3 m
      // faisaient lire le sol comme une grille de rectangles indépendante du lieu. Le linoléum
      // (dalles 0,5 m dessinées dans la texture elle-même) garde une répétition plus resserrée
      // pour que ses joints restent à une échelle de dalle, pas de plaque de béton.
      const textureSpan = isCentre ? 29 : key === 'warmLinoleum' ? 6 : 12;
      texture.repeat.set(Math.max(1, width / textureSpan), Math.max(1, height / textureSpan));
      this.cellTextures.add(texture);
    }
    material.userData.floorTexture = texture ?? null;
    material.userData.discoveredColor = this.roomFloorTint(roomId);
    material.map = null; // `applyFloorVisibility` (appelée juste en dessous) pose l'état réel.
    material.roughness = key === 'warmLinoleum' ? 0.62 : 0.9;
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
    const discoveredColor = (material.userData.discoveredColor as THREE.Color | undefined) ?? null;
    if (discovered && discoveredColor) material.color.copy(discoveredColor);
    else material.color.setHex(discovered ? 0xffffff : HIDDEN_ROOM_COLOR);
  }
}
