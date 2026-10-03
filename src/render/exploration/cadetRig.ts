/** Quaternius humanoid rig for exploration. Gameplay owns world position. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import {
  CADET_VISUAL_PROFILES,
  type CadetHair,
  type CadetVisualProfile,
} from '@/data/exploreVisuals/characterProfiles';
import { ITEM_COLORS } from '@/data/items';
import type { CharacterSheet } from '@/rules/character';
import type { ItemId } from '@/tactical/types';
import type { ExplorationCharacterRig, ExplorationPose, RigAnimation } from '../characterRig';
import { acquireCadetAssets, getMaleHeadAsset, releaseCadetAssets, type HumanModel } from './characterAssets';
import { RigOverlay } from './rigOverlay';
import { MpfbCadetRig } from '../characters/mpfbCadetRig';
import { hasMpfbLook, mpfbCastEnabled } from '../characters/mpfbAssets';

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
  /** Isolated dormitory study: a new tailored silhouette over the shared animated skeleton. */
  readonly pilotFranklyn?: boolean;
  /** Ring/badge color; `DEFAULT_RING_COLOR` when omitted (see `createHumanExplorationRig`). */
  readonly teamColor?: number;
  /**
   * Personnage MPFB à employer pour cet acteur (`cadetLooks.ts`), quand son id n'en est pas un :
   * l'enfant des conduits (`petits.enfant`) et le suiveur `enfant` portent le modèle `enfant`.
   */
  readonly mpfbLook?: string;
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
  return createMpfbRig(sheet, teamColor, options) ?? new CadetRig(sheet, teamColor, options);
}

/** The same skinned factory also makes adult staff and background cadets. */
export function createHumanExplorationRig(actor: VisualActor, options: HumanRigOptions): CadetExplorationRig {
  const teamColor = options.teamColor ?? DEFAULT_RING_COLOR;
  return createMpfbRig(actor, teamColor, options) ?? new CadetRig(actor, teamColor, options);
}

/**
 * Les cadets, et l'enfant, ont un modèle MPFB dédié (ADR 0041) ; les adultes, les gangers et les
 * figurants anonymes gardent l'humanoïde Quaternius. Repli Quaternius si la distribution MPFB n'a
 * pas pu être chargée, ou avec `?rig=quaternius`.
 */
function createMpfbRig(
  actor: VisualActor,
  teamColor: number,
  options: HumanRigOptions,
): CadetExplorationRig | null {
  const look = options.mpfbLook ?? actor.id;
  // A custom Quaternius profile (ganger, staff) means "not this cast", unless a look is named.
  if (options.pilotFranklyn || (options.profile && !options.mpfbLook)) return null;
  if (!mpfbCastEnabled() || !hasMpfbLook(look)) return null;
  return new MpfbCadetRig(actor.id, look, {
    name: actor.name,
    teamColor,
    tactical: options.tactical,
    showLabel: options.showLabel,
    showRing: options.showRing,
  });
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
  private readonly overlay: RigOverlay;
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
  /** Emissif "de base" (remplissage tactique) par materiau, pour que `setHighlighted` l'AJOUTE
   *  au lieu de l'ecraser -- voir `applyTacticalFill`. Vide en exploration. */
  private readonly baseEmissive = new Map<THREE.MeshStandardMaterial, THREE.Color>();

  constructor(actor: VisualActor, teamColor: number, options: HumanRigOptions = {}) {
    this.id = actor.id;
    this.tactical = options.tactical ?? false;
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
    this.visual.scale.setScalar((height / (modelType === 'female' ? 1.803 : 1.824)) * (profile.scale ?? 1));
    this.visual.scale.x *= profile.build === 'athletic' ? 1.07 : profile.build === 'slim' ? 0.94 : 1;
    if (options.pilotFranklyn) {
      this.visual.scale.x *= 0.95;
      this.visual.scale.y *= 0.97;
    }

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
    if (!options.pilotFranklyn) this.addHair(profile.hairStyle, profile.hair);
    this.addUniformDetails(profile, modelType, this.tactical ? teamColor : undefined);
    this.addEquipment();
    if (options.pilotFranklyn) this.addPilotFranklyn();

    this.overlay = new RigOverlay(this.object, {
      name: actor.name,
      teamColor,
      tactical: this.tactical,
      height,
      showLabel: options.showLabel !== false,
      showRing: options.showRing !== false,
    });

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
      this.current = 'idle';
      this.crossFadeTo('idle');
      this.overlay.setDown(false);
      return;
    }
    if (animation === this.current && this.currentPose === null) return;
    if (this.currentPose !== null) {
      this.visual.position.y = 0;
      this.resetPose();
    }
    this.currentPose = null;
    this.current = animation;
    this.crossFadeTo(animation);
    this.overlay.setDown(animation === 'down');
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
    this.overlay.setHighlighted(on);
    // Emissif leger sur tout le modele (tactique seulement -- l'exploration n'a pas d'unite
    // "active" a signaler de cette facon). S'AJOUTE au remplissage de base (`applyTacticalFill`),
    // ne l'ecrase pas -- sinon l'unite active redeviendrait plus sombre que ses coequipiers des
    // qu'elle rend la main. ART-DIRECTION.md, regle de lisibilite 2 : emissif ET anneau opaque.
    if (this.tactical) {
      for (const [material, base] of this.baseEmissive) {
        material.emissive.copy(base);
        if (on) material.emissive.add(HIGHLIGHT_COLOR);
      }
    }
  }
  setEquipment(items: readonly ItemId[] | null): void {
    for (const [item, node] of this.equipment) node.visible = items?.includes(item) ?? false;
    this.overlay.setItems(items);
  }
  setEquipmentLineVisible(visible: boolean): void {
    this.overlay.setEquipmentLineVisible(visible);
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
    } else if (pose === 'talk' || pose === 'dance') {
      // No dance clip on the Quaternius rig: a dancer simply stands chatting.
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
    if (
      this.currentPose === null &&
      (!this.reducedMotion || this.current === 'walk' || this.current === 'run')
    ) {
      this.mixer.update(Math.min(dt, 0.1));
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    this.overlay.dispose();
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
    for (const node of this.equipment.values()) node.visible = false;
  }

  /** Tailored jacket, raised collar and carried kit. All parts follow the Quaternius bones. */
  private addPilotFranklyn(): void {
    const navy = this.material(0x2b4959, 0.86);
    const deep = this.material(0x0f1d28, 0.92);
    const edge = this.material(0x83a1a8, 0.66);
    const red = this.material(0x9b443d, 0.88);
    const metal = this.material(0x9aa9a5, 0.39);
    const fabric = this.material(0x3d4e57, 0.94);
    const jacket = this.part(this.chest, new THREE.CylinderGeometry(0.235, 0.17, 0.52, 8), navy, 0, -0.15, 0);
    jacket.scale.z = 0.65;
    const hem = this.part(this.chest, new THREE.CylinderGeometry(0.172, 0.172, 0.038, 8), deep, 0, -0.42, 0);
    hem.scale.z = 0.67;
    // Asymmetric placket, zipper and shoulder tabs break the original SWAT outline.
    this.part(this.chest, new THREE.BoxGeometry(0.075, 0.48, 0.018), deep, 0.055, -0.14, 0.157);
    this.part(this.chest, new THREE.BoxGeometry(0.014, 0.43, 0.01), metal, 0.09, -0.15, 0.168);
    this.part(this.chest, new THREE.BoxGeometry(0.19, 0.1, 0.035), fabric, -0.13, 0.035, 0.16);
    for (const side of [-1, 1]) {
      const collar = this.part(
        this.chest,
        new RoundedBoxGeometry(0.09, 0.15, 0.085, 2, 0.022),
        deep,
        side * 0.115,
        0.165,
        0.055,
      );
      collar.rotation.z = side * 0.2;
      this.part(this.chest, new THREE.BoxGeometry(0.11, 0.025, 0.15), navy, side * 0.19, 0.105, 0.01);
      this.part(this.chest, new THREE.BoxGeometry(0.09, 0.014, 0.018), red, side * 0.19, 0.126, 0.09);
      this.part(this.chest, new THREE.BoxGeometry(0.02, 0.23, 0.017), edge, side * 0.185, -0.16, 0.07);
    }
    this.part(this.chest, new THREE.BoxGeometry(0.14, 0.038, 0.02), metal, -0.115, -0.025, 0.169);
    this.part(this.chest, new THREE.BoxGeometry(0.1, 0.02, 0.02), red, -0.13, -0.062, 0.17);
    this.part(this.hips, new RoundedBoxGeometry(0.17, 0.14, 0.08, 2, 0.02), fabric, 0.24, -0.04, 0.05);
    this.part(this.hips, new THREE.BoxGeometry(0.09, 0.02, 0.09), metal, 0.24, 0.04, 0.05);
    // A close cropped, uneven hair mass follows the reference more closely than spikes.
    const hair = this.material(0x241d1c, 0.97);
    const cap = this.part(this.head, new THREE.SphereGeometry(0.14, 14, 10), hair, 0, 0.19, -0.005);
    cap.scale.set(1, 0.52, 1.08);
    for (const [x, y, z] of [
      [-0.085, 0.2, 0.11],
      [-0.02, 0.225, 0.12],
      [0.065, 0.215, 0.1],
    ] as const) {
      const lock = this.part(this.head, new THREE.SphereGeometry(0.055, 8, 6), hair, x, y, z);
      lock.scale.set(1, 0.65, 0.8);
    }
    const port = this.part(
      this.head,
      new THREE.CylinderGeometry(0.039, 0.039, 0.017, 12),
      metal,
      0.195,
      0.11,
      -0.035,
    );
    port.rotation.z = Math.PI / 2;
    this.part(this.head, new THREE.SphereGeometry(0.016, 8, 6), red, 0.207, 0.11, -0.035);
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
