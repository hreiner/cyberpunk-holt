/**
 * Abstraction de "rig" de personnage.
 *
 * Le reste du jeu ne connait QUE cette interface. Aujourd'hui elle est
 * implementee par des capsules colorees (`PlaceholderRig`) ; demain par des
 * GLB riggees et animees sous Mixamo (`GltfRig`, a ecrire dans l'epic 2 art)
 * sans qu'une seule ligne de gameplay ne change.
 *
 * C'est la condition posee au depart : pouvoir remplacer le pipeline art
 * sans refondre le jeu. Voir docs/art/ART-PIPELINE.md et ADR 0004 / 0009.
 */

import * as THREE from 'three';
import { CARRIED_ITEMS, ITEM_COLORS, ITEM_ICONS } from '@/data/items';
import type { CharacterSheet } from '@/rules/character';
import type { ItemId } from '@/tactical/types';

/** Etats d'animation demandes par le gameplay, volontairement peu nombreux. */
export type RigAnimation = 'idle' | 'walk' | 'run' | 'shoot' | 'down' | 'revive';

/** Poses de presentation propres a l'exploration, sans effet sur le gameplay. */
export type ExplorationPose = 'sit' | 'lean' | 'talk' | 'inspect';

export interface CharacterRig {
  readonly id: string;
  readonly object: THREE.Object3D;
  /** Position monde (le rig gere lui-meme son offset au sol). */
  setWorldPosition(x: number, z: number): void;
  /** Oriente le personnage vers un point. */
  faceTowards(x: number, z: number): void;
  play(animation: RigAnimation): void;
  setHighlighted(on: boolean): void;
  /**
   * Materiel porte : le rig le rend visible sur le personnage.
   * `null` = materiel inconnu du joueur (equipe adverse) : rien n'est montre.
   */
  setEquipment(items: readonly ItemId[] | null): void;
  /**
   * Affiche ou masque la LIGNE de materiel de la plaque flottante (le nom
   * reste toujours visible) -- `true` par defaut. En exploration (ADR 0013) :
   * pas d'arme ni d'equipe adverse a deviner, "materiel inconnu"/"sans
   * materiel" n'a rien a faire sous le nom d'un cadet qui se promene ; en
   * tactique, la ligne reste utile (inchange).
   */
  setEquipmentLineVisible(visible: boolean): void;
  /** Avance les animations internes (balancement de marche, pulsation) de `dt` secondes. */
  update(dt: number): void;
  dispose(): void;
}

/**
 * Capacite optionnelle des rigs employes en exploration : le combat conserve
 * le contrat `CharacterRig` historique et n'a pas a connaitre ces poses.
 */
export interface ExplorationCharacterRig extends CharacterRig {
  playExplorationPose(pose: ExplorationPose | null): void;
  /** Cadence d'un clip sur place, sans jamais déplacer le rig hors du gameplay. */
  setExplorationMotionSpeed(metresPerSecond: number): void;
  /** Réduit les animations de présentation sans modifier le déplacement de jeu. */
  setReducedMotion(reduced: boolean): void;
  getEquipmentAnchor(item: ItemId): THREE.Object3D | null;
}

/** Evite de faire dependre les appelants du rig concret choisi par le pipeline art. */
export function isExplorationCharacterRig(rig: CharacterRig): rig is ExplorationCharacterRig {
  return 'playExplorationPose' in rig && 'getEquipmentAnchor' in rig;
}

const BODY_HEIGHT = 1.1;
const BODY_RADIUS = 0.34;

/** Le pictogramme est dessine sur un canvas : il faut une police qui sait faire des emojis. */
const TAG_FONT = '"Segoe UI", "Inter", system-ui, sans-serif';
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
const TAG_CANVAS = { width: 256, height: 96 } as const;
const TAG_WORLD_WIDTH = 3.6;
const TAG_HEIGHT_ABOVE_GROUND = 2.1;

const FALL_SECONDS = 0.35;
const FLASH_SECONDS = 0.45;
const RECOIL_SECONDS = 0.25;
const RECOIL_DISTANCE = 0.16;
const TASER_FLASH_COLOR = 0xffe14a;
const HIGHLIGHT_EMISSIVE = 0x3a3a00;

const WALK_BOB = { amplitude: 0.07, frequency: 13, lean: 0.08 };
const RUN_BOB = { amplitude: 0.11, frequency: 18, lean: 0.3 };

/**
 * Rig de remplacement : une capsule a la couleur du cadet, un anneau de couleur d'equipe
 * au sol, le materiel porte (taser, ordinateur, mine) en petits volumes lumineux, une
 * etiquette flottante nom + pictogrammes, et une silhouette visible a travers les
 * decors (containers) pour ne jamais perdre un cadet de vue.
 */
export class PlaceholderRig implements CharacterRig {
  readonly id: string;
  readonly object: THREE.Group;
  private readonly visual = new THREE.Group();
  private readonly body: THREE.Mesh;
  private readonly ring: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly ringMaterial: THREE.MeshBasicMaterial;
  private readonly xrayMaterial: THREE.MeshBasicMaterial;
  private readonly props = new Map<ItemId, THREE.Object3D>();
  private readonly tag: THREE.Sprite;
  private readonly tagCanvas: HTMLCanvasElement;
  private readonly tagTexture: THREE.CanvasTexture;
  private readonly disposables: Array<{ dispose(): void }> = [];
  private readonly name: string;
  private readonly teamColor: number;
  private current: RigAnimation = 'idle';
  private items: readonly ItemId[] | null = [];
  private highlighted = false;
  private equipmentLineVisible = true;
  private clock = 0;
  /** 0 = debout, 1 = a terre ; rattrape `fallTarget` en douceur. */
  private fall = 0;
  private fallTarget = 0;
  private flash = 0;
  private recoil = 0;

  constructor(sheet: CharacterSheet, teamColor: number) {
    this.id = sheet.id;
    this.name = sheet.name;
    this.teamColor = teamColor;
    this.object = new THREE.Group();
    this.object.add(this.visual);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sheet.placeholderColor),
      roughness: 0.65,
      metalness: 0.1,
    });
    const geometry = new THREE.CapsuleGeometry(BODY_RADIUS, BODY_HEIGHT - 2 * BODY_RADIUS, 4, 10);
    this.disposables.push(geometry);
    this.body = new THREE.Mesh(geometry, this.material);
    this.body.position.y = BODY_HEIGHT / 2;
    this.body.castShadow = true;
    this.visual.add(this.body);

    // Silhouette "rayon X" : dessinee uniquement la ou le cadet est cache par un decor.
    this.xrayMaterial = new THREE.MeshBasicMaterial({
      color: teamColor,
      transparent: true,
      opacity: 0.55,
      depthFunc: THREE.GreaterDepth,
      depthWrite: false,
    });
    const xray = new THREE.Mesh(geometry, this.xrayMaterial);
    xray.renderOrder = 10;
    this.body.add(xray);

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: teamColor,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 24), this.ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.object.add(this.ring);

    // Petit repere d'orientation : le "nez" du cadet.
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1f }),
    );
    nose.position.set(0, BODY_HEIGHT * 0.78, 0.3);
    this.visual.add(nose);
    this.disposables.push(nose.geometry, nose.material as THREE.Material);

    this.buildProps();

    this.tagCanvas = document.createElement('canvas');
    this.tagCanvas.width = TAG_CANVAS.width;
    this.tagCanvas.height = TAG_CANVAS.height;
    this.tagTexture = new THREE.CanvasTexture(this.tagCanvas);
    this.tagTexture.colorSpace = THREE.SRGBColorSpace;
    this.tag = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.tagTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.tag.scale.set(TAG_WORLD_WIDTH, (TAG_WORLD_WIDTH * TAG_CANVAS.height) / TAG_CANVAS.width, 1);
    this.tag.position.y = TAG_HEIGHT_ABOVE_GROUND;
    this.tag.renderOrder = 20;
    this.object.add(this.tag);
    this.disposables.push(this.tagTexture, this.tag.material);

    this.drawTag();
  }

  /* --------------------------------- materiel -------------------------------- */

  private buildProps(): void {
    const glow = (color: number) =>
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.4 });
    const add = (item: ItemId, object: THREE.Object3D) => {
      object.visible = false;
      this.props.set(item, object);
      this.visual.add(object);
    };

    // Taser : un pistolet trapu tenu a la main droite, pointe vers l'avant.
    const taser = new THREE.Group();
    const taserMat = glow(ITEM_COLORS.taser);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.46), taserMat);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x222226 }),
    );
    grip.position.set(0, -0.16, -0.12);
    taser.add(slide, grip);
    taser.position.set(0.36, 0.68, 0.3);
    this.disposables.push(slide.geometry, grip.geometry, taserMat, grip.material as THREE.Material);
    add('taser', taser);

    // Outil de piratage : une console plate portee dans le dos.
    const deckMat = glow(ITEM_COLORS.hackingTool);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.1), deckMat);
    deck.position.set(0, 0.72, -0.4);
    this.disposables.push(deck.geometry, deckMat);
    add('hackingTool', deck);

    // Mine : un disque orange accroche a la hanche.
    const mineMat = glow(ITEM_COLORS.mine);
    const mine = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16), mineMat);
    mine.position.set(-0.4, 0.4, 0.12);
    this.disposables.push(mine.geometry, mineMat);
    add('mine', mine);
  }

  setEquipment(items: readonly ItemId[] | null): void {
    const same =
      items === null || this.items === null
        ? items === this.items
        : items.length === this.items.length && items.every((item, i) => item === this.items?.[i]);
    if (same) return;
    this.items = items === null ? null : [...items];
    this.applyPropVisibility();
    this.drawTag();
  }

  setEquipmentLineVisible(visible: boolean): void {
    if (this.equipmentLineVisible === visible) return;
    this.equipmentLineVisible = visible;
    this.drawTag();
  }

  private applyPropVisibility(): void {
    const down = this.current === 'down';
    for (const [item, object] of this.props) object.visible = !down && (this.items?.includes(item) ?? false);
  }

  /**
   * Etiquette flottante : nom du cadet (bord a la couleur d'equipe) et, en
   * tactique seulement (`equipmentLineVisible`), pictogrammes du materiel.
   * En exploration, la plaque ne porte QUE le nom -- pas d'arme ni d'equipe
   * adverse a deviner -- et se dessine donc plus courte (voir `boxHeight`).
   */
  private drawTag(): void {
    const ctx = this.tagCanvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = TAG_CANVAS;
    const down = this.current === 'down';
    ctx.clearRect(0, 0, width, height);

    const boxHeight = this.equipmentLineVisible ? height - 8 : 52;
    ctx.globalAlpha = down ? 0.6 : 1;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
    ctx.strokeStyle = `#${this.teamColor.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = this.highlighted ? 8 : 5;
    roundRect(ctx, 4, 4, width - 8, boxHeight, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 34px ${TAG_FONT}`;
    ctx.fillText(down ? `${this.name} (à terre)` : this.name, width / 2, 30, width - 24);

    if (!this.equipmentLineVisible) {
      ctx.globalAlpha = 1;
      this.tagTexture.needsUpdate = true;
      return;
    }

    const items = this.items;
    const carried = items ? CARRIED_ITEMS.filter((item) => items.includes(item)) : [];
    if (items === null || carried.length === 0) {
      ctx.fillStyle = '#8c93a5';
      ctx.font = `400 22px ${TAG_FONT}`;
      ctx.fillText(items === null ? 'matériel inconnu' : 'sans matériel', width / 2, 68);
    } else {
      ctx.font = `400 36px ${EMOJI_FONT}`;
      const step = 56;
      const start = width / 2 - ((carried.length - 1) * step) / 2;
      carried.forEach((item, i) => {
        ctx.fillStyle = `#${ITEM_COLORS[item].toString(16).padStart(6, '0')}`;
        ctx.fillText(ITEM_ICONS[item], start + i * step, 68);
      });
    }
    ctx.globalAlpha = 1;
    this.tagTexture.needsUpdate = true;
  }

  /* ------------------------------ position, pose ----------------------------- */

  setWorldPosition(x: number, z: number): void {
    this.object.position.set(x, 0, z);
  }

  faceTowards(x: number, z: number): void {
    const dx = x - this.object.position.x;
    const dz = z - this.object.position.z;
    if (dx === 0 && dz === 0) return;
    this.object.rotation.y = Math.atan2(dx, dz);
  }

  play(animation: RigAnimation): void {
    // Tir : geste ponctuel, la pose de fond (debout, a terre, en marche) ne change pas.
    if (animation === 'shoot') {
      this.recoil = RECOIL_SECONDS;
      return;
    }
    // Relever un cadet a terre revient a le remettre debout, mais en douceur.
    const next: RigAnimation = animation === 'revive' ? 'idle' : animation;
    if (next === this.current) return;
    const wasDown = this.current === 'down';
    this.current = next;

    if (next === 'down') {
      this.fallTarget = 1;
      this.flash = FLASH_SECONDS;
    } else {
      this.fallTarget = 0;
    }
    if (next !== 'walk' && next !== 'run') {
      this.visual.position.y = 0;
      this.visual.rotation.x = 0;
    }
    this.applyPropVisibility();
    if (next === 'down' || wasDown) this.drawTag();
  }

  setHighlighted(on: boolean): void {
    if (on === this.highlighted) return;
    this.highlighted = on;
    this.ringMaterial.opacity = on ? 1 : 0.85;
    if (!on) this.ring.scale.setScalar(1);
    this.applyEmissive();
    this.drawTag();
  }

  update(dt: number): void {
    this.clock += dt;

    if (this.current === 'walk' || this.current === 'run') {
      const gait = this.current === 'run' ? RUN_BOB : WALK_BOB;
      this.visual.position.y = Math.abs(Math.sin(this.clock * gait.frequency)) * gait.amplitude;
      this.visual.rotation.x = gait.lean;
    }

    this.updateFall(dt);
    this.updateRecoil(dt);
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt);
      this.applyEmissive();
    }

    // L'anneau du cadet dont c'est le tour pulse doucement.
    if (this.highlighted) this.ring.scale.setScalar(1 + Math.sin(this.clock * 5) * 0.08);
  }

  /** Chute ou relevage progressif de la capsule (elle pivote de 90 degres). */
  private updateFall(dt: number): void {
    if (this.fall === this.fallTarget) return;
    const step = dt / FALL_SECONDS;
    this.fall =
      this.fallTarget > this.fall
        ? Math.min(this.fallTarget, this.fall + step)
        : Math.max(this.fallTarget, this.fall - step);
    const eased = this.fall * this.fall * (3 - 2 * this.fall);
    this.body.rotation.z = eased * (Math.PI / 2);
    this.body.position.y = BODY_HEIGHT / 2 + (BODY_RADIUS - BODY_HEIGHT / 2) * eased;
    this.material.transparent = this.fall > 0;
    this.material.opacity = 1 - 0.3 * eased;
  }

  /** Recul du tireur : un petit pas en arriere qui se resorbe. */
  private updateRecoil(dt: number): void {
    if (this.recoil <= 0) return;
    this.recoil = Math.max(0, this.recoil - dt);
    this.visual.position.z = -RECOIL_DISTANCE * (this.recoil / RECOIL_SECONDS);
  }

  /** Couleur d'emission : surbrillance du cadet actif, ou eclair de l'impact electrique. */
  private applyEmissive(): void {
    if (this.flash > 0) {
      this.material.emissive.setHex(TASER_FLASH_COLOR).multiplyScalar(this.flash / FLASH_SECONDS);
    } else {
      this.material.emissive.setHex(this.highlighted ? HIGHLIGHT_EMISSIVE : 0x000000);
    }
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.ring.geometry.dispose();
    this.material.dispose();
    this.ringMaterial.dispose();
    this.xrayMaterial.dispose();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
