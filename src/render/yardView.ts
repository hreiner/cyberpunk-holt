/**
 * Construction de la scene du container yard a partir de la carte ASCII, et
 * surcouche de grille (cases atteignables, case survolee, cible).
 *
 * Direction artistique : low-poly stylise, palette sombre + accents neon,
 * cf. docs/art/ART-DIRECTION.md. Tout ce qui est decoratif est genere a partir
 * d'un `Rng` seede pour rester identique d'une partie a l'autre.
 */

import * as THREE from 'three';
import type { Rng } from '@/core/rng';
import { ITEM_COLORS } from '@/data/items';
import { CELL_SIZE_METERS, type TacticalMap } from '@/tactical/grid';
import type { GroundItem, ItemId, Vec2 } from '@/tactical/types';

export const TEAM_COLORS = { blue: 0x3fa9ff, red: 0xff5a52 } as const;

const CONTAINER_PALETTE = [0xd9a441, 0x4f8f5a, 0xb4463c, 0x3a6ea5, 0xb0b3b8];
const ARMED_MINE_COLOR = 0xff3b30;
const GROUND_COLOR = 0x2a2b30;
const LINE_COLOR = 0x53555e;

/** Convertit une case en coordonnees monde (centre de la case). */
export function cellToWorld(map: TacticalMap, cell: Vec2): { x: number; z: number } {
  return {
    x: (cell.x - (map.width - 1) / 2) * CELL_SIZE_METERS,
    z: (cell.y - (map.height - 1) / 2) * CELL_SIZE_METERS,
  };
}

/** Convertit une position monde en case, ou null si hors carte. */
export function worldToCell(map: TacticalMap, x: number, z: number): Vec2 | null {
  const cx = Math.round(x / CELL_SIZE_METERS + (map.width - 1) / 2);
  const cy = Math.round(z / CELL_SIZE_METERS + (map.height - 1) / 2);
  if (cx < 0 || cy < 0 || cx >= map.width || cy >= map.height) return null;
  return { x: cx, y: cy };
}

export class YardView {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group();
  readonly groundPlane: THREE.Mesh;
  private readonly overlay = new THREE.Group();
  private readonly groundItems = new THREE.Group();
  private readonly groundItemGeometry = {
    taser: new THREE.BoxGeometry(0.2, 0.12, 0.6),
    mine: new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
    marker: new THREE.RingGeometry(0.42, 0.56, 24),
  };
  private readonly groundItemMaterials = new Map<string, THREE.Material>();
  private readonly reachMaterial: THREE.MeshBasicMaterial;
  private readonly hoverMaterial: THREE.MeshBasicMaterial;
  private readonly threatMaterial: THREE.MeshBasicMaterial;
  private readonly tileGeometry: THREE.PlaneGeometry;

  constructor(
    private readonly map: TacticalMap,
    rng: Rng,
  ) {
    this.scene.background = new THREE.Color(0x14151a);
    this.scene.fog = new THREE.Fog(0x14151a, 60, 160);
    this.scene.add(this.root);
    this.root.add(this.overlay);
    this.root.add(this.groundItems);

    /* --- lumieres --- */
    this.scene.add(new THREE.HemisphereLight(0x8899bb, 0x20202a, 0.85));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.1);
    sun.position.set(24, 40, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4cc9f0, 0.35);
    rim.position.set(-20, 12, -24);
    this.scene.add(rim);

    /* --- sol --- */
    const w = map.width * CELL_SIZE_METERS;
    const h = map.height * CELL_SIZE_METERS;
    this.groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color: GROUND_COLOR, roughness: 0.95 }),
    );
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.root.add(this.groundPlane);

    const grid = new THREE.GridHelper(
      Math.max(w, h),
      Math.max(map.width, map.height),
      LINE_COLOR,
      LINE_COLOR,
    );
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.01;
    this.root.add(grid);

    /* --- containers et caisses --- */
    this.buildObstacles(rng);

    /* --- zones de deploiement --- */
    this.buildSpawnMarkers(map.blueSpawns, TEAM_COLORS.blue);
    this.buildSpawnMarkers(map.redSpawns, TEAM_COLORS.red);

    /* --- materiaux de surcouche --- */
    this.tileGeometry = new THREE.PlaneGeometry(CELL_SIZE_METERS * 0.92, CELL_SIZE_METERS * 0.92);
    this.reachMaterial = new THREE.MeshBasicMaterial({
      color: 0x4cc9f0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.threatMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5a52,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
  }

  private buildObstacles(rng: Rng): void {
    const containerGeo = new THREE.BoxGeometry(CELL_SIZE_METERS, 2.6, CELL_SIZE_METERS);
    const crateGeo = new THREE.BoxGeometry(CELL_SIZE_METERS * 0.8, 1.0, CELL_SIZE_METERS * 0.8);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 });
    const materials = CONTAINER_PALETTE.map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.15 }),
    );

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const kind = this.map.kindAt({ x, y });
        if (kind !== 'container' && kind !== 'crate') continue;
        const { x: wx, z: wz } = cellToWorld(this.map, { x, y });
        if (kind === 'container') {
          const mat = rng.pick(materials);
          const mesh = new THREE.Mesh(containerGeo, mat);
          mesh.position.set(wx, 1.3, wz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.root.add(mesh);
        } else {
          const mesh = new THREE.Mesh(crateGeo, crateMat);
          mesh.position.set(wx, 0.5, wz);
          mesh.castShadow = true;
          this.root.add(mesh);
        }
      }
    }
  }

  private buildSpawnMarkers(cells: Vec2[], color: number): void {
    const geo = new THREE.RingGeometry(0.5, 0.62, 20);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false });
    for (const cell of cells) {
      const { x, z } = cellToWorld(this.map, cell);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.015, z);
      this.root.add(mesh);
    }
  }

  /** Remplace entierement la surcouche de grille. */
  setOverlay(options: { reachable?: Vec2[]; hovered?: Vec2 | null; threatened?: Vec2[] }): void {
    this.overlay.clear();
    const add = (cell: Vec2, material: THREE.Material, y: number) => {
      const { x, z } = cellToWorld(this.map, cell);
      const mesh = new THREE.Mesh(this.tileGeometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, z);
      this.overlay.add(mesh);
    };
    for (const cell of options.threatened ?? []) add(cell, this.threatMaterial, 0.025);
    for (const cell of options.reachable ?? []) add(cell, this.reachMaterial, 0.03);
    if (options.hovered) add(options.hovered, this.hoverMaterial, 0.035);
  }

  /**
   * Materiel pose au sol : taser lache par un cadet neutralise, mine (armee ou non).
   * Un anneau de la couleur de l'objet le rend visible de loin ; une mine armee est rouge.
   */
  setGroundItems(items: readonly GroundItem[]): void {
    this.groundItems.clear();
    for (const g of items) {
      const { x, z } = cellToWorld(this.map, g.pos);
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      const color = g.item === 'mine' && g.armed ? ARMED_MINE_COLOR : ITEM_COLORS[g.item];
      const marker = new THREE.Mesh(this.groundItemGeometry.marker, this.groundMaterial(color, true));
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = 0.04;
      group.add(marker);

      const shape = this.groundShape(g.item);
      if (shape) {
        const mesh = new THREE.Mesh(shape, this.groundMaterial(color, false));
        mesh.position.y = g.item === 'mine' ? 0.08 : 0.1;
        mesh.rotation.y = g.item === 'taser' ? 0.6 : 0;
        group.add(mesh);
      }
      this.groundItems.add(group);
    }
  }

  private groundShape(item: ItemId): THREE.BufferGeometry | null {
    if (item === 'taser') return this.groundItemGeometry.taser;
    if (item === 'mine') return this.groundItemGeometry.mine;
    return null;
  }

  private groundMaterial(color: number, flat: boolean): THREE.Material {
    const key = `${color}:${flat}`;
    let material = this.groundItemMaterials.get(key);
    if (!material) {
      material = flat
        ? new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false })
        : new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 });
      this.groundItemMaterials.set(key, material);
    }
    return material;
  }
}
