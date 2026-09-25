/** Quaternius humanoid rig for exploration. Gameplay owns world position. */
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import {
  CADET_VISUAL_PROFILES,
  type CadetHair,
  type CadetVisualProfile,
} from '@/data/exploreVisuals/characterProfiles';
import { CARRIED_ITEMS, ITEM_COLORS, ITEM_ICONS } from '@/data/items';
import type { CharacterSheet } from '@/rules/character';
import type { ItemId } from '@/tactical/types';
import type { ExplorationCharacterRig, ExplorationPose, RigAnimation } from '../characterRig';
import { acquireCadetAssets, getMaleHeadAsset, releaseCadetAssets, type HumanModel } from './characterAssets';

export type CadetExplorationRig = ExplorationCharacterRig;
interface VisualActor {
  readonly id: string;
  readonly name: string;
}

export interface HumanRigOptions {
  readonly profile?: CadetVisualProfile;
  readonly model?: HumanModel;
  readonly adult?: boolean;
  readonly showLabel?: boolean;
  readonly showRing?: boolean;
  /**
   * Lisibilite propre a la vue tactique (docs/design/05-TACTICAL-COMBAT.md,
   * docs/art/ART-DIRECTION.md "Regles de lisibilite") : ligne de materiel sur
   * l'etiquette flottante (pictogrammes, "materiel inconnu"/"sans materiel"),
   * epaulettes a la couleur d'equipe (l'anneau au sol seul ne suffit pas a
   * distance de jeu) et silhouette visible a travers un conteneur qui masque
   * le cadet. Toujours `false` en exploration : pas d'arme ni d'equipe
   * adverse a deviner, et les couloirs coupent deja les murs bas.
   */
  readonly tactical?: boolean;
}

const CADET_HEIGHT = 1.75;
const ADULT_HEIGHT = 1.85;
/**
 * Un cadet tactique lit plus petit qu'en exploration : camera plus reculee (vue d'ensemble du
 * terrain), pas de zoom rapproche permanent. Revue du 24/09 : a peine ~20px de haut par defaut,
 * illisible. Combine a `TACTICAL_INITIAL_ZOOM` (`app.ts`), pas une resolution a lui seul.
 */
const TACTICAL_HEIGHT_BOOST = 1.18;
const TRANSITION_SECONDS = 0.18;
const WALK_METRES_PER_CYCLE = 1.5;
const RUN_METRES_PER_CYCLE = 2.35;
const LABEL_CANVAS = { width: 224, height: 56 } as const;
/** Etiquette agrandie en tactique : deux lignes (nom + materiel), cf. `drawLabel`. */
const TACTICAL_LABEL_CANVAS = { width: 256, height: 96 } as const;
const LABEL_WORLD_WIDTH = 2.35;
/**
 * Repris a 1,5 m (etait 2,9, environ trois fois la largeur d'un cadet -- signale en revue sur
 * `07-john-tete-hires.png`) : la plaque doit accompagner le personnage, pas le recouvrir.
 */
const TACTICAL_LABEL_WORLD_WIDTH = 1.5;
/** Silhouette "rayon X" : capsule generique dessinee uniquement la ou un conteneur masque le cadet. */
const XRAY_RADIUS = 0.3;
const DEFAULT_RING_COLOR = 0xa1433e;
/** Emissif leger de l'unite active (tactique) -- ART-DIRECTION.md, regle de lisibilite 2 :
 *  "L'unite active est mise en evidence -- emissif leger ET anneau opaque", pas l'un ou l'autre. */
const HIGHLIGHT_EMISSIVE = 0x2a2200;
const HIGHLIGHT_COLOR = new THREE.Color(HIGHLIGHT_EMISSIVE);
/**
 * Lumiere de remplissage propre au cadet (tactique seulement) : les trois sources globales de
 * la cour (`yardView.ts`, ADR/ART-DIRECTION "trois sources, pas une de plus" -- hors perimetre
 * de cette passe) laissent les uniformes sombres decoupes en ombre chinoise a la revue du 24/09
 * (`07-john-tete-hires.png`). Plutot qu'une quatrieme source globale ou un mesh emissif qui
 * n'eclairerait pas les surfaces voisines (ADR 0018, meme constat pour les luminaires
 * d'exploration), chaque materiau du cadet recoit un emissif proportionnel a SA PROPRE couleur :
 * ca le rend lisible sans laver son identite (l'uniforme sombre reste sombre, juste plus lu).
 */
const TACTICAL_FILL_EMISSIVE = 0.34;
const CLIP_NAME: Record<RigAnimation, string> = {
  idle: 'Idle_Neutral',
  walk: 'Walk',
  run: 'Run',
  shoot: 'Gun_Shoot',
  down: 'Death',
  revive: 'Death',
};

export function createCadetExplorationRig(
  sheet: CharacterSheet,
  teamColor = DEFAULT_RING_COLOR,
  options: HumanRigOptions = {},
): CadetExplorationRig {
  return new CadetRig(sheet, teamColor, options);
}

/** The same skinned factory also makes adult staff and background cadets. */
export function createHumanExplorationRig(actor: VisualActor, options: HumanRigOptions): CadetRig {
  return new CadetRig(actor, DEFAULT_RING_COLOR, options);
}

export class CadetRig implements CadetExplorationRig {
  readonly id: string;
  readonly object = new THREE.Group();

  private readonly visual = new THREE.Group();
  private readonly model: THREE.Object3D;
  private readonly mixer: THREE.AnimationMixer;
  private readonly clips = new Map<RigAnimation, THREE.AnimationClip>();
  private readonly actions = new Map<RigAnimation, THREE.AnimationAction>();
  private readonly equipment = new Map<ItemId, THREE.Object3D>();
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly ownedGeometries: THREE.BufferGeometry[] = [];
  /** Quaternius armatures import at 100x scale; attachments use metre-sized coordinates. */
  private readonly attachments = new Map<THREE.Object3D, THREE.Group>();
  private readonly ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private readonly label: THREE.Sprite;
  private readonly labelCanvas: HTMLCanvasElement;
  private readonly labelTexture: THREE.CanvasTexture;
  private readonly labelWorldWidth: number;
  private readonly name: string;
  private readonly teamColor: number;
  private readonly tactical: boolean;
  private readonly head: THREE.Object3D;
  private readonly chest: THREE.Object3D;
  private readonly hips: THREE.Object3D;
  private readonly leftArm: THREE.Object3D;
  private readonly rightArm: THREE.Object3D;
  private readonly leftUpperLeg: THREE.Object3D;
  private readonly rightUpperLeg: THREE.Object3D;
  private readonly leftLowerLeg: THREE.Object3D;
  private readonly rightLowerLeg: THREE.Object3D;
  private readonly neutralPose = new Map<THREE.Object3D, THREE.Quaternion>();
  private current: RigAnimation = 'idle';
  private currentPose: ExplorationPose | null = null;
  private motionSpeed = 0;
  private reducedMotion = false;
  private disposed = false;
  private highlighted = false;
  private items: readonly ItemId[] | null = [];
  private equipmentLineVisible: boolean;
  /** Emissif "de base" (remplissage tactique) par materiau, pour que `setHighlighted` l'AJOUTE
   *  au lieu de l'ecraser -- voir `applyTacticalFill`. Vide en exploration. */
  private readonly baseEmissive = new Map<THREE.MeshStandardMaterial, THREE.Color>();

  constructor(actor: VisualActor, teamColor: number, options: HumanRigOptions = {}) {
    this.id = actor.id;
    this.name = actor.name;
    this.teamColor = teamColor;
    this.tactical = options.tactical ?? false;
    this.equipmentLineVisible = this.tactical;
    const profile = options.profile ?? CADET_VISUAL_PROFILES[actor.id as keyof typeof CADET_VISUAL_PROFILES];
    if (!profile) throw new Error(`Profil visuel manquant pour ${actor.id}`);
    const modelType = options.model ?? (actor.id === 'abigail' || actor.id === 'letitia' ? 'female' : 'male');
    const shared = acquireCadetAssets(modelType);
    this.model = cloneSkeleton(shared.scene);
    this.model.name = `personnage-modele:${actor.id}`;
    if (modelType === 'male') this.graftMaleHead();
    this.recolorModel(profile, modelType);
    this.model.traverse((node) => {
      if (node instanceof THREE.Mesh) node.castShadow = true;
    });
    this.object.name = `cadet:${actor.id}`;
    this.object.add(this.visual);
    this.visual.add(this.model);
    const baseHeight = options.adult ? ADULT_HEIGHT : CADET_HEIGHT;
    const height = this.tactical ? baseHeight * TACTICAL_HEIGHT_BOOST : baseHeight;
    this.visual.scale.setScalar(height / (modelType === 'female' ? 1.803 : 1.824));
    this.visual.scale.x *= profile.build === 'athletic' ? 1.07 : profile.build === 'slim' ? 0.94 : 1;

    this.head = this.requireBone('Head');
    this.chest = this.requireBone('Chest');
    this.hips = this.requireBone('Hips');
    this.leftArm = this.requireBone('UpperArmL');
    this.rightArm = this.requireBone('UpperArmR');
    this.leftUpperLeg = this.requireBone('UpperLegL');
    this.rightUpperLeg = this.requireBone('UpperLegR');
    this.leftLowerLeg = this.requireBone('LowerLegL');
    this.rightLowerLeg = this.requireBone('LowerLegR');
    for (const bone of [
      this.head,
      this.chest,
      this.hips,
      this.leftArm,
      this.rightArm,
      this.leftUpperLeg,
      this.rightUpperLeg,
      this.leftLowerLeg,
      this.rightLowerLeg,
    ]) {
      this.neutralPose.set(bone, bone.quaternion.clone());
    }
    this.addHair(profile.hairStyle, profile.hair);
    this.addUniformDetails(profile, modelType, this.tactical ? teamColor : undefined);
    this.addEquipment();

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: teamColor,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.ownedMaterials.push(ringMaterial);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.43, 0.51, 20), ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.012;
    this.ring.visible = options.showRing !== false;
    this.object.add(this.ring);

    // Silhouette "rayon X" (tactique seulement) : dessinee uniquement la ou un conteneur
    // masque le cadet -- ART-DIRECTION.md, regle de lisibilite 5, "rien ne masque un personnage".
    if (this.tactical) {
      const xrayMaterial = new THREE.MeshBasicMaterial({
        color: teamColor,
        transparent: true,
        opacity: 0.5,
        depthFunc: THREE.GreaterDepth,
        depthWrite: false,
      });
      this.ownedMaterials.push(xrayMaterial);
      const xrayGeometry = new THREE.CapsuleGeometry(XRAY_RADIUS, Math.max(0.1, height - 2 * XRAY_RADIUS), 4, 8);
      this.ownedGeometries.push(xrayGeometry);
      const xray = new THREE.Mesh(xrayGeometry, xrayMaterial);
      xray.position.y = height / 2;
      xray.renderOrder = 10;
      this.object.add(xray);
    }

    const labelCanvasSize = this.tactical ? TACTICAL_LABEL_CANVAS : LABEL_CANVAS;
    this.labelWorldWidth = this.tactical ? TACTICAL_LABEL_WORLD_WIDTH : LABEL_WORLD_WIDTH;
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.width = labelCanvasSize.width;
    this.labelCanvas.height = labelCanvasSize.height;
    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
    this.labelTexture.colorSpace = THREE.SRGBColorSpace;
    this.label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.labelTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.label.name = 'cadet-label';
    this.label.scale.set(this.labelWorldWidth, (this.labelWorldWidth * labelCanvasSize.height) / labelCanvasSize.width, 1);
    this.label.position.y = height + (this.tactical ? 0.52 : 0.42);
    this.label.visible = options.showLabel !== false;
    this.label.renderOrder = 20;
    this.object.add(this.label);
    this.drawLabel();

    this.mixer = new THREE.AnimationMixer(this.model);
    for (const name of Object.keys(CLIP_NAME) as RigAnimation[]) {
      const source = shared.animations.find((clip) => clip.name.endsWith(`|${CLIP_NAME[name]}`));
      if (!source) throw new Error(`Animation ${name} manquante pour ${actor.id}`);
      this.clips.set(name, source);
      if (name !== 'revive') this.actions.set(name, this.mixer.clipAction(source));
    }
    const idle = this.actions.get('idle')!;
    idle.play();
    idle.time = ((hashName(actor.id) % 1000) / 1000) * this.clips.get('idle')!.duration;
  }

  setWorldPosition(x: number, z: number): void {
    this.object.position.set(x, 0, z);
  }

  faceTowards(x: number, z: number): void {
    const dx = x - this.object.position.x;
    const dz = z - this.object.position.z;
    if (dx !== 0 || dz !== 0) this.object.rotation.y = Math.atan2(dx, dz);
  }

  play(animation: RigAnimation): void {
    if (this.disposed) return;
    if (animation === 'revive') {
      const wasDown = this.current === 'down';
      this.current = 'idle';
      this.crossFadeTo('idle');
      if (this.tactical && wasDown) this.drawLabel();
      return;
    }
    if (animation === this.current && this.currentPose === null) return;
    if (this.currentPose !== null) {
      this.visual.position.y = 0;
      this.resetPose();
    }
    const wasDown = this.current === 'down';
    this.currentPose = null;
    this.current = animation;
    this.crossFadeTo(animation);
    if (this.tactical && (animation === 'down' || wasDown)) this.drawLabel();
  }

  setExplorationMotionSpeed(metresPerSecond: number): void {
    this.motionSpeed = metresPerSecond;
    const action = this.actions.get(this.current);
    const duration = this.clips.get(this.current)?.duration;
    if (!action || !duration) return;
    const metresPerCycle = this.current === 'run' ? RUN_METRES_PER_CYCLE : WALK_METRES_PER_CYCLE;
    if (this.current === 'run' || this.current === 'walk') {
      action.setEffectiveTimeScale(Math.max(0.35, (metresPerSecond * duration) / metresPerCycle));
    }
  }

  /** Coupe seulement les boucles décoratives ; marche/course restent synchronisées au gameplay. */
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setHighlighted(on: boolean): void {
    if (on === this.highlighted) return;
    this.highlighted = on;
    this.ring.material.opacity = on ? 1 : 0.55;
    // Anneau opaque ET emissif leger sur tout le modele (tactique seulement -- l'exploration
    // n'a pas d'unite "active" a signaler de cette facon). S'AJOUTE au remplissage de base
    // (`applyTacticalFill`), ne l'ecrase pas -- sinon l'unite active redeviendrait plus sombre
    // que ses coequipiers des qu'elle rend la main.
    if (this.tactical) {
      for (const [material, base] of this.baseEmissive) {
        material.emissive.copy(base);
        if (on) material.emissive.add(HIGHLIGHT_COLOR);
      }
      this.drawLabel();
    }
  }
  setEquipment(items: readonly ItemId[] | null): void {
    for (const [item, node] of this.equipment) node.visible = items?.includes(item) ?? false;
    const same =
      items === null || this.items === null
        ? items === this.items
        : items.length === this.items.length && items.every((item, i) => item === this.items?.[i]);
    this.items = items === null ? null : [...items];
    if (!same && this.tactical) this.drawLabel();
  }
  setEquipmentLineVisible(visible: boolean): void {
    if (this.equipmentLineVisible === visible) return;
    this.equipmentLineVisible = visible;
    this.drawLabel();
  }

  /**
   * Etiquette flottante : nom du cadet (bord a la couleur d'equipe), "(à terre)" quand
   * neutralise, et, en tactique (`equipmentLineVisible`), une ligne de pictogrammes du
   * materiel -- meme convention que l'ancien `PlaceholderRig`. En exploration, la plaque
   * ne porte que le nom, jamais redessinee en cours de jeu (voir `tactical`).
   */
  private drawLabel(): void {
    const ctx = this.labelCanvas.getContext('2d');
    if (!ctx) return;
    const width = this.labelCanvas.width;
    const height = this.labelCanvas.height;
    const down = this.current === 'down';
    ctx.clearRect(0, 0, width, height);

    const boxHeight = this.equipmentLineVisible ? height - 8 : Math.min(56, height - 8);
    ctx.globalAlpha = down ? 0.65 : 1;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
    ctx.strokeStyle = `#${this.teamColor.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = this.highlighted ? 6 : 4;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, boxHeight, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f4f2ea';
    ctx.font = '700 27px "Barlow Semi Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameY = this.equipmentLineVisible ? 26 : boxHeight / 2 + 1;
    ctx.fillText(down ? `${this.name} (à terre)` : this.name, width / 2, nameY, width - 20);

    if (this.equipmentLineVisible) {
      const items = this.items;
      const carried = items ? CARRIED_ITEMS.filter((item) => items.includes(item)) : [];
      if (items === null || carried.length === 0) {
        ctx.fillStyle = '#9aa0ad';
        ctx.font = '400 19px "Barlow Semi Condensed", sans-serif';
        ctx.fillText(items === null ? 'matériel inconnu' : 'sans matériel', width / 2, 68);
      } else {
        ctx.font = '400 30px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
        const step = 46;
        const start = width / 2 - ((carried.length - 1) * step) / 2;
        carried.forEach((item, i) => {
          ctx.fillStyle = `#${ITEM_COLORS[item].toString(16).padStart(6, '0')}`;
          ctx.fillText(ITEM_ICONS[item], start + i * step, 68);
        });
      }
    }
    ctx.globalAlpha = 1;
    this.labelTexture.needsUpdate = true;
  }

  playExplorationPose(pose: ExplorationPose | null): void {
    if (this.disposed || pose === this.currentPose) return;
    this.currentPose = pose;
    if (pose === null) {
      this.visual.position.y = 0;
      this.resetPose();
      this.current = 'idle';
      this.crossFadeTo('idle');
      return;
    }
    this.mixer.stopAllAction();
    this.resetPose();
    const rotate = (bone: THREE.Object3D, x: number, y = 0, z = 0) => {
      bone.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)));
    };
    if (pose === 'lean') {
      rotate(this.chest, 0, 0, -0.18);
      rotate(this.leftArm, -0.35);
    } else if (pose === 'talk') {
      rotate(this.rightArm, -0.35);
      rotate(this.head, 0, 0.12);
    } else {
      rotate(this.chest, 0.16);
      rotate(this.head, 0.14);
      rotate(this.rightArm, -0.5);
    }
  }

  getEquipmentAnchor(item: ItemId): THREE.Object3D | null {
    return this.equipment.get(item) ?? null;
  }

  update(dt: number): void {
    if (this.disposed) return;
    if (this.currentPose === null && (!this.reducedMotion || this.current === 'walk' || this.current === 'run')) {
      this.mixer.update(Math.min(dt, 0.1));
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    this.ring.geometry.dispose();
    this.labelTexture.dispose();
    (this.label.material as THREE.Material).dispose();
    for (const geometry of this.ownedGeometries) geometry.dispose();
    for (const material of this.ownedMaterials) material.dispose();
    releaseCadetAssets();
  }

  private requireBone(name: string): THREE.Object3D {
    const bone = this.model.getObjectByName(name);
    if (!bone) throw new Error(`Os ${name} manquant dans le personnage ${this.id}`);
    return bone;
  }

  private graftMaleHead(): void {
    const armoredHead = this.model.getObjectByName('Swat_Head');
    const armoredBody = this.model.getObjectByName('Swat_Body');
    if (!armoredHead || !armoredBody || !armoredHead.parent)
      throw new Error('Tenue masculine Quaternius incomplète.');
    let skeleton: THREE.Skeleton | undefined;
    armoredBody.traverse((node) => {
      if (node instanceof THREE.SkinnedMesh) skeleton ??= node.skeleton;
    });
    const uniformSkeleton = skeleton;
    if (!uniformSkeleton) throw new Error('Squelette de la tenue masculine introuvable.');
    const casual = cloneSkeleton(getMaleHeadAsset().scene);
    const head = casual.getObjectByName('Casual2_Head');
    if (!head) throw new Error('Tête masculine Quaternius introuvable.');
    head.traverse((node) => {
      if (node instanceof THREE.SkinnedMesh) node.bind(uniformSkeleton, node.bindMatrix);
    });
    armoredHead.parent.add(head);
    armoredHead.parent.remove(armoredHead);
  }

  private crossFadeTo(name: RigAnimation): void {
    const next = this.actions.get(name);
    if (!next) return;
    for (const action of this.actions.values())
      if (action !== next && action.isRunning()) action.fadeOut(TRANSITION_SECONDS);
    next.reset().setEffectiveWeight(1).fadeIn(TRANSITION_SECONDS).play();
    if (name === 'down' || name === 'shoot') {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    if (name === 'run' || name === 'walk') this.setExplorationMotionSpeed(this.motionSpeed || 4);
  }

  private resetPose(): void {
    for (const [bone, quaternion] of this.neutralPose) bone.quaternion.copy(quaternion);
  }

  private recolorModel(profile: CadetVisualProfile, modelType: HumanModel): void {
    const copies = new Map<THREE.Material, THREE.Material>();
    this.model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const recolor = (source: THREE.Material): THREE.Material => {
        let material = copies.get(source);
        if (material) return material;
        material = source.clone();
        copies.set(source, material);
        this.ownedMaterials.push(material);
        if (material instanceof THREE.MeshStandardMaterial) {
          const colors: Record<string, number> =
            modelType === 'male'
              ? {
                  Swat: profile.uniform,
                  Swat_Black: darken(profile.uniform, 0.68),
                  Visor: 0x16212b,
                  LightBrown: profile.uniform,
                  LightBlue: darken(profile.uniform, 0.78),
                  White: 0x1a1d22,
                  Red_Dark: profile.trim,
                  Skin: profile.skin,
                  Skin_Darker: darken(profile.skin, 0.78),
                  Eyebrows: profile.hair,
                  Hair: profile.hair,
                }
              : {
                  Black: profile.uniform,
                  White: darken(profile.trim, 0.78),
                  Skin: profile.skin,
                  Hair_Blond: profile.hair,
                  Hair_Brown: profile.hair,
                  Brown: profile.hair,
                };
          const color = colors[source.name];
          if (color !== undefined) material.color.setHex(color);
          material.roughness = source.name.includes('Skin') ? 0.82 : 0.76;
          material.metalness = 0;
          material.flatShading = true;
          this.applyTacticalFill(material);
        }
        return material;
      };
      node.material = Array.isArray(node.material) ? node.material.map(recolor) : recolor(node.material);
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      if (materials.every((material) => /^(Hair|Hair_Blond|Hair_Brown)$/.test(material.name)))
        node.visible = false;
    });
  }

  private addHair(style: CadetHair, color: number): void {
    const material = this.material(color, 0.93);
    const cap = this.part(this.head, new THREE.SphereGeometry(0.135, 14, 9), material, 0, 0.205, -0.005);
    cap.scale.set(1.04, style === 'buzz' ? 0.23 : 0.56, 1.08);
    if (style === 'buzz') return;
    if (style === 'braids') {
      for (const side of [-1, 1]) {
        this.part(
          this.head,
          new THREE.SphereGeometry(0.045, 9, 7),
          material,
          side * 0.105,
          0.17,
          0.095,
        ).scale.set(0.75, 1.45, 0.8);
        const braid = this.part(
          this.head,
          new THREE.CapsuleGeometry(0.025, 0.31, 3, 6),
          material,
          side * 0.14,
          -0.09,
          -0.015,
        );
        braid.rotation.z = side * 0.08;
      }
    } else if (style === 'curly-bun') {
      this.part(this.head, new THREE.SphereGeometry(0.095, 12, 9), material, 0, 0.255, -0.125);
      for (const [x, y, z] of [
        [-0.1, 0.23, 0.055],
        [0.09, 0.24, 0.06],
        [0, 0.285, 0.02],
        [-0.06, 0.28, -0.075],
      ] as const) {
        this.part(this.head, new THREE.SphereGeometry(0.047, 8, 6), material, x, y, z);
      }
    } else if (style === 'bowl') {
      this.part(this.head, new THREE.SphereGeometry(0.135, 14, 8), material, 0, 0.19, 0.02).scale.set(
        1.04,
        0.52,
        1.1,
      );
      this.part(this.head, new THREE.BoxGeometry(0.2, 0.042, 0.03), material, 0, 0.175, 0.145);
    } else if (style === 'long-fringe') {
      for (const side of [-1, 1])
        this.part(
          this.head,
          new THREE.SphereGeometry(0.056, 9, 7),
          material,
          side * 0.105,
          0.085,
          -0.035,
        ).scale.set(0.85, 1.55, 1);
      this.part(this.head, new THREE.SphereGeometry(0.08, 9, 7), material, 0.025, 0.17, 0.105).scale.set(
        1.1,
        0.5,
        0.7,
      );
    } else {
      // Franklyn: broad, uneven locks keep the hair readable in the isometric view.
      for (const [x, y, z, angle] of [
        [-0.09, 0.245, 0.055, -0.32],
        [-0.025, 0.275, 0.075, 0.2],
        [0.055, 0.26, 0.085, -0.17],
        [0.105, 0.23, 0.025, 0.28],
      ] as const) {
        const lock = this.part(this.head, new THREE.ConeGeometry(0.04, 0.09, 5), material, x, y, z);
        lock.rotation.z = angle;
      }
    }
  }

  /**
   * `teamBadge` (tactique seulement) : les epaulettes, normalement noires, passent a la
   * couleur d'equipe -- l'anneau au sol seul ne suffit pas a distinguer bleu/rouge a la
   * distance de jeu une fois l'uniforme peint (ART-DIRECTION.md, regle de lisibilite 1).
   */
  private addUniformDetails(profile: CadetVisualProfile, modelType: HumanModel, teamBadge?: number): void {
    const trim = this.material(profile.trim, 0.6);
    const black = this.material(0x111a23, 0.72);
    const metal = this.material(0x85918f, 0.35);
    const shoulder = teamBadge !== undefined ? this.material(teamBadge, 0.5) : black;
    for (const side of [-1, 1]) {
      this.part(this.chest, new THREE.BoxGeometry(0.14, 0.035, 0.105), shoulder, side * 0.18, 0.07, 0.02);
    }
    this.part(this.chest, new THREE.BoxGeometry(0.15, 0.038, 0.014), trim, -0.13, -0.08, 0.24);
    this.part(this.chest, new THREE.BoxGeometry(0.12, 0.038, 0.014), trim, 0.13, -0.08, 0.24);
    this.part(this.hips, new THREE.BoxGeometry(0.12, 0.075, 0.045), metal, 0, -0.01, 0.23);
    if (modelType === 'female' || this.id === 'grover') {
      const tie = this.part(this.chest, new THREE.ConeGeometry(0.035, 0.21, 4), black, 0, -0.12, 0.24);
      tie.rotation.x = Math.PI;
    }
    for (let i = 0; i < profile.rankStripes; i++) {
      this.part(this.chest, new THREE.BoxGeometry(0.1, 0.017, 0.018), trim, -0.17, 0.06 - i * 0.025, 0.17);
    }
    if (profile.hasNeuroport) {
      const port = this.part(
        this.head,
        new THREE.CylinderGeometry(0.034, 0.034, 0.013, 10),
        metal,
        0.2,
        0.11,
        -0.035,
      );
      port.rotation.z = Math.PI / 2;
    }
  }

  private addEquipment(): void {
    const taserMaterial = this.material(ITEM_COLORS.taser, 0.4);
    const deckMaterial = this.material(ITEM_COLORS.hackingTool, 0.42);
    const mineMaterial = this.material(ITEM_COLORS.mine, 0.45);
    const wrist = this.requireBone('WristR');
    const taser = this.part(wrist, new THREE.BoxGeometry(0.11, 0.14, 0.26), taserMaterial, 0, -0.06, 0.13);
    this.equipment.set('taser', taser);
    const deck = this.part(
      this.chest,
      new THREE.BoxGeometry(0.32, 0.22, 0.06),
      deckMaterial,
      0,
      -0.03,
      -0.24,
    );
    this.equipment.set('hackingTool', deck);
    const mine = this.part(
      this.hips,
      new THREE.CylinderGeometry(0.1, 0.1, 0.045, 10),
      mineMaterial,
      -0.3,
      -0.1,
      0.03,
    );
    mine.rotation.x = Math.PI / 2;
    this.equipment.set('mine', mine);
    this.setEquipment([]);
  }

  private material(color: number, roughness: number): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04, flatShading: true });
    this.ownedMaterials.push(material);
    this.applyTacticalFill(material);
    return material;
  }

  /** Voir `TACTICAL_FILL_EMISSIVE`. No-op en exploration. */
  private applyTacticalFill(material: THREE.MeshStandardMaterial): void {
    if (!this.tactical) return;
    const fill = material.color.clone().multiplyScalar(TACTICAL_FILL_EMISSIVE);
    material.emissive.copy(fill);
    this.baseEmissive.set(material, fill);
  }

  private part(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ): THREE.Mesh {
    let anchor = this.attachments.get(parent);
    if (!anchor) {
      anchor = new THREE.Group();
      anchor.scale.setScalar(0.01);
      parent.add(anchor);
      this.attachments.set(parent, anchor);
    }
    const node = new THREE.Mesh(geometry, material);
    node.position.set(x, y, z);
    node.castShadow = true;
    anchor.add(node);
    this.ownedGeometries.push(geometry);
    return node;
  }
}

function darken(color: number, factor: number): number {
  return new THREE.Color(color).multiplyScalar(factor).getHex();
}

function hashName(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

export const CADET_RIG_HEIGHT_METRES = CADET_HEIGHT;
