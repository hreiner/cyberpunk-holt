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
import type { CharacterSheet } from '@/rules/character';
import { ExploreMap } from '@/explore';
import type { Cell, DoorEntity, EntityDef, MapDef, RoomDef } from '@/explore';
import { PlaceholderRig, type CharacterRig } from './characterRig';
import { IsoCamera } from './isoCamera';

export const EXPLORE_CELL_SIZE_METERS = 1;
const WALL_HEIGHT = 3;
const WALL_CUT_HEIGHT = 0.4;
const FURNITURE_LOW_HEIGHT = 1.0;
const FURNITURE_HIGH_HEIGHT = 2.6;
const GLASS_HEIGHT = 3;
const VEGETATION_HEIGHT = 0.5;

const GROUND_COLOR = 0x2a2b30;
const WALL_COLOR = 0x3a3b42;
const DOOR_FRAME_COLOR = 0x53555e;
const FURNITURE_LOW_COLOR = 0x6b5a3e;
const FURNITURE_HIGH_COLOR = 0xb0b3b8;
const GLASS_COLOR = 0x4cc9f0;
const VEGETATION_COLOR = 0x4f8f5a;
const CUT_EDGE_COLOR = 0x4cc9f0;
const EXTRA_COLOR = 0x8c93a5; // --bone-faint : figurants gris, plus petits (ART-DIRECTION)
const HOVER_COLOR = 0xf2c230; // --tape
const EXIT_COLOR = 0x7fd08a;

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

interface WallCellInfo {
  mesh: THREE.Mesh;
  topEdge: THREE.Mesh;
  sides: Side[];
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
  private readonly pickables: THREE.Object3D[] = [];
  private readonly floorPlane: THREE.Mesh;
  private readonly hoverOutline: THREE.Mesh;
  private hovered: HoverTarget | null = null;

  private readonly rigs = new Map<string, CharacterRig>();
  private readonly lastRigPos = new Map<string, { x: number; z: number }>();

  /** État initial des portes (avant que `ExploreState` ne prenne le relais via `setDoorOpen`). */
  private readonly doorsOpenDefault = new Map<string, boolean>();

  /** Repère au sol de l'objectif, "Tab maintenu" (08-EXPLORATION.md "Les objectifs"). */
  private readonly pingMarker: THREE.Mesh;
  private pingActive = false;
  private pingClock = 0;
  private reducedMotion = false;

  /** Quart de tour courant (0..3), suit `IsoCamera` : voir `rotate()`. */
  private quarter = 0;

  private readonly raycaster = new THREE.Raycaster();

  constructor(
    def: MapDef,
    private readonly rng: Rng,
    aspect: number,
    private readonly callbacks: ExploreViewCallbacks = {},
  ) {
    this.def = def;
    this.map = new ExploreMap(def);
    this.camera = new IsoCamera(aspect);

    this.scene.background = new THREE.Color(0x14151a);
    this.scene.fog = new THREE.Fog(0x14151a, 60, 160);
    this.scene.add(this.root);

    this.scene.add(new THREE.HemisphereLight(0x8899bb, 0x20202a, 0.85));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.1);
    sun.position.set(24, 40, 18);
    sun.castShadow = true;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4cc9f0, 0.35);
    rim.position.set(-20, 12, -24);
    this.scene.add(rim);

    const w = this.map.width * EXPLORE_CELL_SIZE_METERS;
    const h = this.map.height * EXPLORE_CELL_SIZE_METERS;
    this.floorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color: GROUND_COLOR, roughness: 0.95 }),
    );
    this.floorPlane.rotation.x = -Math.PI / 2;
    this.floorPlane.receiveShadow = true;
    this.root.add(this.floorPlane);

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
      new THREE.MeshBasicMaterial({ color: HOVER_COLOR, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    this.pingMarker.rotation.x = -Math.PI / 2;
    this.pingMarker.position.y = 0.05;
    this.pingMarker.visible = false;
    this.root.add(this.pingMarker);

    for (const e of def.entities) {
      if (e.type === 'door') this.doorsOpenDefault.set(e.id, !e.locked);
    }

    this.computeRoomSides();
    this.buildCells();
    this.buildEntityMarkers();
  }

  /* ------------------------------------------------------------------ */
  /* Construction du décor                                               */
  /* ------------------------------------------------------------------ */

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

  private buildCells(): void {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.9 });
    const frameMat = new THREE.MeshStandardMaterial({ color: DOOR_FRAME_COLOR, roughness: 0.7, metalness: 0.2 });
    const furnitureLowMat = new THREE.MeshStandardMaterial({ color: FURNITURE_LOW_COLOR, roughness: 0.9 });
    const furnitureHighMat = new THREE.MeshStandardMaterial({
      color: FURNITURE_HIGH_COLOR,
      roughness: 0.8,
      metalness: 0.15,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: GLASS_COLOR,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.6,
    });
    const vegetationMat = new THREE.MeshStandardMaterial({ color: VEGETATION_COLOR, roughness: 1 });
    const edgeMat = new THREE.MeshBasicMaterial({ color: CUT_EDGE_COLOR });

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const kind = this.map.kindAt({ x, y });
        if (kind === 'floor' || kind === 'void') continue;
        const { x: wx, z: wz } = cellToWorld(this.map, { x, y });
        const key = `${x},${y}`;
        const sides = this.roomSidesByCell.get(key) ?? [];

        if (kind === 'wall' || kind === 'door') {
          const mesh = new THREE.Mesh(unitBox, kind === 'door' ? frameMat : wallMat);
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

          const info: WallCellInfo = { mesh, topEdge, sides };

          if (kind === 'door') {
            const door = this.doorAt({ x, y });
            if (door) {
              const panel = new THREE.Mesh(
                unitBox,
                new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.85 }),
              );
              panel.scale.set(0.86, 1, 0.16);
              panel.position.x = wx;
              panel.position.z = wz;
              panel.userData.entityId = door.id;
              panel.visible = !(this.doorsOpenDefault.get(door.id) ?? true);
              this.root.add(panel);
              this.pickables.push(panel);
              info.door = door;
              info.panel = panel;
              // Le cadre (fixe, toujours visible) sert aussi de cible de clic.
              mesh.userData.entityId = door.id;
              this.pickables.push(mesh);
            }
          }

          this.wallCells.set(key, info);
          continue;
        }

        if (kind === 'furnitureLow') {
          const mesh = new THREE.Mesh(unitBox, furnitureLowMat);
          mesh.scale.set(0.8, FURNITURE_LOW_HEIGHT, 0.8);
          mesh.position.set(wx, FURNITURE_LOW_HEIGHT / 2, wz);
          mesh.castShadow = true;
          this.root.add(mesh);
        } else if (kind === 'furnitureHigh') {
          const mesh = new THREE.Mesh(unitBox, furnitureHighMat);
          mesh.scale.set(0.9, FURNITURE_HIGH_HEIGHT, 0.9);
          mesh.position.set(wx, FURNITURE_HIGH_HEIGHT / 2, wz);
          mesh.castShadow = true;
          this.root.add(mesh);
        } else if (kind === 'glass') {
          const mesh = new THREE.Mesh(unitBox, glassMat);
          mesh.scale.set(0.94, GLASS_HEIGHT, 0.12);
          mesh.position.set(wx, GLASS_HEIGHT / 2, wz);
          this.root.add(mesh);
        } else if (kind === 'vegetation') {
          const jitterX = (this.rng.next() - 0.5) * 0.3;
          const jitterZ = (this.rng.next() - 0.5) * 0.3;
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.42, 8, 6),
            vegetationMat,
          );
          mesh.position.set(wx + jitterX, VEGETATION_HEIGHT / 2, wz + jitterZ);
          mesh.castShadow = true;
          this.root.add(mesh);
        }
      }
    }

    this.recomputeCutaway();
  }

  private buildEntityMarkers(): void {
    for (const e of this.def.entities as EntityDef[]) {
      if (e.type === 'door' || e.type === 'zone') continue; // portes : déjà construites ; zones : invisibles
      const { x: wx, z: wz } = cellToWorld(this.map, e.cell);

      if (e.type === 'npc') {
        const capsule = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.22, 0.55, 4, 8),
          new THREE.MeshStandardMaterial({ color: EXTRA_COLOR, roughness: 0.7 }),
        );
        capsule.position.set(wx, 0.55, wz);
        capsule.castShadow = true;
        capsule.userData.entityId = e.id;
        this.root.add(capsule);
        this.pickables.push(capsule);
        continue;
      }

      if (e.type === 'object') {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.MeshStandardMaterial({ color: FURNITURE_LOW_COLOR, roughness: 0.85 }),
        );
        box.position.set(wx, 0.25, wz);
        box.castShadow = true;
        box.userData.entityId = e.id;
        this.root.add(box);
        this.pickables.push(box);
        continue;
      }

      if (e.type === 'seat') {
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.45, 0.6),
          new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.85 }),
        );
        seat.position.set(wx, 0.225, wz);
        seat.castShadow = true;
        seat.userData.entityId = e.id;
        this.root.add(seat);
        this.pickables.push(seat);
        continue;
      }

      if (e.type === 'exit') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 0.62, 24),
          new THREE.MeshBasicMaterial({ color: EXIT_COLOR, transparent: true, opacity: 0.6, depthWrite: false }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(wx, 0.02, wz);
        ring.userData.entityId = e.id;
        this.root.add(ring);
        this.pickables.push(ring);
      }
    }
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
      info.mesh.scale.set(0.98, height, 0.98);
      info.mesh.position.y = height / 2;
      info.topEdge.visible = cut;
      info.topEdge.position.y = height;
      if (info.panel) {
        info.panel.scale.set(0.86, height, 0.16);
        info.panel.position.y = height / 2;
      }
    }
  }

  /** Tourne la caméra d'un quart de tour et recalcule immédiatement les murs coupés (ADR 0013 §6). */
  rotate(step: number): void {
    this.quarter = ((this.quarter + step) % 4 + 4) % 4;
    this.camera.rotate(step);
    this.recomputeCutaway();
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
    this.addRig('leader', sheet);
  }

  setFollower(id: string, sheet: CharacterSheet): void {
    this.addRig(id, sheet);
  }

  private addRig(id: string, sheet: CharacterSheet): void {
    const existing = this.rigs.get(id);
    if (existing) {
      existing.dispose();
      this.root.remove(existing.object);
    }
    const rig = new PlaceholderRig(sheet, 0x4cc9f0);
    rig.setEquipment(null);
    this.root.add(rig.object);
    this.rigs.set(id, rig);
  }

  /** Place un rig (case, éventuellement fractionnaire) et joue l'animation adaptée. */
  updateRigPosition(id: string, cell: { x: number; y: number }, moving: boolean, dt: number): void {
    const rig = this.rigs.get(id);
    if (!rig) return;
    const { x, z } = cellToWorld(this.map, cell);
    const last = this.lastRigPos.get(id);
    if (last && (Math.abs(last.x - x) > 1e-5 || Math.abs(last.z - z) > 1e-5)) {
      rig.faceTowards(x, z);
    }
    rig.setWorldPosition(x, z);
    rig.play(moving ? 'walk' : 'idle');
    rig.update(dt);
    this.lastRigPos.set(id, { x, z });
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
  /* Survol / clic — coordonnées normalisées [-1, 1] (comme `THREE.Raycaster`) */
  /* ------------------------------------------------------------------ */

  private pick(ndcX: number, ndcY: number): HoverTarget | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera.camera);
    const hits = this.raycaster.intersectObjects([...this.pickables, this.floorPlane], false);
    if (hits.length === 0) return null;
    const first = hits[0] as THREE.Intersection;
    const entityId = (first.object.userData as { entityId?: string }).entityId;
    if (entityId) return { type: 'entity', id: entityId };
    const cell = worldToCell(this.map, first.point.x, first.point.z);
    return cell ? { type: 'floor', cell } : null;
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
  /* Boucle d'image (le renderer/canvas appartiennent à l'appelant)      */
  /* ------------------------------------------------------------------ */

  followTarget(cell: { x: number; y: number }): void {
    const { x, z } = cellToWorld(this.map, cell);
    this.camera.setTarget(x, z);
  }

  /* ------------------------------------------------------------------ */
  /* Repère "Tab maintenu" (08-EXPLORATION.md "Les objectifs")           */
  /* ------------------------------------------------------------------ */

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
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
  }
}
