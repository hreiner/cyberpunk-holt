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
import { EnvironmentMaterials } from '@/render/exploration/materials';
import { CELL_SIZE_METERS, type TacticalMap } from '@/tactical/grid';
import type { GroundItem, ItemId, Vec2 } from '@/tactical/types';

export const TEAM_COLORS = { blue: 0x3fa9ff, red: 0xff5a52 } as const;

/**
 * Conteneurs : tôle nervurée usée plutôt que cinq aplats saturés (passe E, constat "la cour
 * remplit tout le cadre de boîtes criardes" -- docs/art/UI-DESIGN-SYSTEM.md "le rouge est
 * rare"). Chaque teinte réemploie la matière procédurale `containerSteel` (nervures + grain +
 * vignette, `src/render/exploration/materials.ts`), seulement recolorée -- exactement ce que
 * `ExploreView.buildCells` fait déjà pour les faux containers du parking du centre d'examen.
 * Huit teintes désaturées, un écart de VALEUR (clair/sombre) plutôt que de teinte pour la
 * variété entre conteneurs -- "dépareillé" par l'usure, jamais criard.
 */
const CONTAINER_TINTS = [
  0xa89a72, // tan délavé
  0x8f8362, // tan délavé, plus sombre
  0x5c6b5a, // vert d'eau éteint
  0x475244, // vert d'eau éteint, plus sombre
  0x3a5568, // bleu pétrole éteint
  0x2c4252, // bleu pétrole éteint, plus sombre
  0x8f8d84, // gris blanchi
  0x6e6d64, // gris blanchi, plus sombre
] as const;

/**
 * Un seul conteneur rouge dans toute la cour (UI-DESIGN-SYSTEM.md "le rouge est rare" : "s'il
 * apparaît, que ce soit sur un conteneur, pas sur dix"). Choisi par un tirage seedé parmi les
 * cases container (voir `buildObstacles`), jamais par une probabilité uniforme qui en poserait
 * plusieurs sur une carte de cette taille (~140 cases container).
 */
const RARE_CONTAINER_TINT = 0x7a4a3e;

/** Repris de l'asphalte du parking (ADR 0019) : une plage large évite un damier sur un aussi grand sol. */
const GROUND_TEXTURE_SPAN = 22;

const ARMED_MINE_COLOR = 0xff3b30;
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
  /** Matières partagées (containers, sol) : une instance par YardView, libérée par `dispose()`. */
  private readonly materials: EnvironmentMaterials;
  /** Géométries et matériaux propres au décor (containers, caisses, sol), à libérer avec la vue. */
  private readonly obstacleGeometries: THREE.BufferGeometry[] = [];
  private readonly obstacleMaterials: THREE.Material[] = [];
  private readonly spawnGeometry: THREE.RingGeometry;
  private readonly spawnMaterials: THREE.Material[] = [];
  private readonly grid: THREE.GridHelper;

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
    // Intensites relevees (0,85/1,1 -> 1,05/2,2) : a la meme energie que l'exploration
    // (ADR 0018, atmosphere.ts, academie), les memes modeles de cadets se decoupaient en
    // ombre chinoise en tactique -- revue du 24/09. Toujours trois sources, aucune ajoutee.
    this.scene.add(new THREE.HemisphereLight(0x8899bb, 0x20202a, 1.05));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
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

    this.materials = new EnvironmentMaterials(rng.fork('materials'));

    /* --- sol --- */
    // Bitume use plutot qu'un aplat gris (docs/art/EXPLORATION-VISUAL-DESIGN.md, sol du
    // parking/de la cour) : meme matiere photo CC0 que le parking du centre d'examen (ADR 0019),
    // seule consommatrice de cette cle dans cette vue -- pas de clone necessaire, la matiere est
    // directement utilisee (comportement par defaut de three.js pour le chargement reseau, voir
    // le commentaire de `EnvironmentMaterials.get`). Plage de repetition large (meme valeur que
    // l'asphalte du parking) pour eviter un damier sur un sol de 45 x 30 m.
    const w = map.width * CELL_SIZE_METERS;
    const h = map.height * CELL_SIZE_METERS;
    const groundMaterial = this.materials.get('asphalt');
    if (groundMaterial.map) {
      groundMaterial.map.repeat.set(Math.max(1, w / GROUND_TEXTURE_SPAN), Math.max(1, h / GROUND_TEXTURE_SPAN));
    }
    this.groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.root.add(this.groundPlane);

    this.grid = new THREE.GridHelper(
      Math.max(w, h),
      Math.max(map.width, map.height),
      LINE_COLOR,
      LINE_COLOR,
    );
    (this.grid.material as THREE.Material).opacity = 0.25;
    (this.grid.material as THREE.Material).transparent = true;
    this.grid.position.y = 0.01;
    this.root.add(this.grid);

    /* --- containers et caisses --- */
    this.buildObstacles(rng);

    /* --- zones de deploiement --- */
    this.spawnGeometry = new THREE.RingGeometry(0.5, 0.62, 20);
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
    // Toit legerement plus sombre (poussiere, moins de soleil direct qu'une face laterale) :
    // memes indices de sommets que `ExploreView.buildCells` (`containerBox`) -- BoxGeometry
    // range ses sommets par face, +Y (le toit) occupe les sommets 8-11.
    const containerGeo = new THREE.BoxGeometry(CELL_SIZE_METERS, 2.6, CELL_SIZE_METERS);
    const containerColors = new Float32Array(containerGeo.getAttribute('position').count * 3).fill(1);
    for (let i = 8; i < 12; i++) {
      containerColors[i * 3] = 0.62;
      containerColors[i * 3 + 1] = 0.64;
      containerColors[i * 3 + 2] = 0.66;
    }
    containerGeo.setAttribute('color', new THREE.BufferAttribute(containerColors, 3));
    this.obstacleGeometries.push(containerGeo);

    const crateGeo = new THREE.BoxGeometry(CELL_SIZE_METERS * 0.8, 1.0, CELL_SIZE_METERS * 0.8);
    this.obstacleGeometries.push(crateGeo);

    // Caisses en bois ET barils rouilles (reference vueexercicetactique.png) : deux matieres
    // procedurales existantes plutot qu'un brun uni, et un contraste de matiere (bois chaud vs
    // acier froid des containers) qui aide a distinguer couvert bas / couvert haut d'un coup d'oeil.
    const crateMaterials = [this.materials.get('wood'), this.materials.get('rust')];

    // Matiere de base des containers : `containerSteel` (nervures + grain, voir le commentaire
    // du module plus haut), clonee et recoloree par teinte -- un seul canevas partage entre tous
    // les clones (`Material.clone()` ne duplique pas la texture), donc aucune texture de plus.
    const containerTemplate = this.materials.get('containerSteel');
    const tintMaterials = new Map<number, THREE.MeshStandardMaterial>();
    const materialForTint = (tint: number): THREE.MeshStandardMaterial => {
      let material = tintMaterials.get(tint);
      if (!material) {
        material = containerTemplate.clone();
        material.color.setHex(tint);
        material.vertexColors = true;
        tintMaterials.set(tint, material);
        this.obstacleMaterials.push(material);
      }
      return material;
    };

    // Un seul container rouge sur toute la carte (voir `RARE_CONTAINER_TINT`) : tire une fois,
    // seede, parmi les cases container reellement presentes sur cette carte, plutot qu'une
    // probabilite uniforme qui en poserait plusieurs sur ~140 cases.
    let containerCount = 0;
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        if (this.map.kindAt({ x, y }) === 'container') containerCount++;
      }
    }
    const rareContainerIndex = containerCount > 0 ? rng.int(0, containerCount - 1) : -1;

    let containerIndex = 0;
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const kind = this.map.kindAt({ x, y });
        if (kind !== 'container' && kind !== 'crate') continue;
        const { x: wx, z: wz } = cellToWorld(this.map, { x, y });
        if (kind === 'container') {
          const tint = containerIndex === rareContainerIndex ? RARE_CONTAINER_TINT : rng.pick(CONTAINER_TINTS);
          containerIndex++;
          const mesh = new THREE.Mesh(containerGeo, materialForTint(tint));
          mesh.position.set(wx, 1.3, wz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.root.add(mesh);
        } else {
          const mesh = new THREE.Mesh(crateGeo, rng.pick(crateMaterials));
          mesh.position.set(wx, 0.5, wz);
          mesh.castShadow = true;
          this.root.add(mesh);
        }
      }
    }
  }

  private buildSpawnMarkers(cells: Vec2[], color: number): void {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false });
    this.spawnMaterials.push(mat);
    for (const cell of cells) {
      const { x, z } = cellToWorld(this.map, cell);
      const mesh = new THREE.Mesh(this.spawnGeometry, mat);
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

  /**
   * Libere les geometries et materiaux propres a cette vue -- indispensable depuis que le sol et
   * les containers portent de vraies textures (photo et canevas procedural, `this.materials`) au
   * lieu d'aplats sans cout GPU. `ChapterApp.enterTacticalScene` reutilise le meme `GameApp` d'une
   * partie a l'autre (`startWith` -> `buildScene` -> `new YardView`) : sans ce nettoyage, chaque
   * nouvelle partie empilerait les ressources de la precedente.
   */
  dispose(): void {
    this.materials.dispose();
    for (const geometry of this.obstacleGeometries) geometry.dispose();
    for (const material of this.obstacleMaterials) material.dispose();
    this.spawnGeometry.dispose();
    for (const material of this.spawnMaterials) material.dispose();
    this.tileGeometry.dispose();
    this.reachMaterial.dispose();
    this.hoverMaterial.dispose();
    this.threatMaterial.dispose();
    this.groundItemGeometry.taser.dispose();
    this.groundItemGeometry.mine.dispose();
    this.groundItemGeometry.marker.dispose();
    for (const material of this.groundItemMaterials.values()) material.dispose();
    this.groundItemMaterials.clear();
    // Le materiau du sol appartient a `this.materials` (dispose ci-dessus) ; seule sa geometrie
    // (PlaneGeometry propre a cette vue) reste a liberer ici.
    this.groundPlane.geometry.dispose();
    this.grid.geometry.dispose();
    (this.grid.material as THREE.Material).dispose();
  }
}
