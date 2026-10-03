/**
 * Rig de jeu des personnages MPFB (ADR 0041) : le modèle habillé de `tools/characters`, animé par
 * les clips Mixamo via `mixamoRetarget.ts`. Il remplit le même contrat que le rig Quaternius
 * (`CharacterRig`, `ExplorationCharacterRig`) : le gameplay ne voit pas la différence.
 */
import * as THREE from 'three';
import { ITEM_COLORS } from '@/data/items';
import type { ItemId } from '@/tactical/types';
import type { ExplorationCharacterRig, ExplorationPose, RigAnimation } from '../characterRig';
import { RigOverlay } from '../exploration/rigOverlay';
import { clipGroundSpeed, cloneMpfbCadet, type MpfbBody, type MpfbClip } from './mpfbAssets';
import { createMixamoRetarget } from './mixamoRetarget';

/** Mêmes réglages de lisibilité tactique que le rig Quaternius (`cadetRig.ts`). */
const TACTICAL_HEIGHT_BOOST = 1.18;
const TACTICAL_FILL_EMISSIVE = 0.34;
const HIGHLIGHT_COLOR = new THREE.Color(0x2a2200);
const TRANSITION_SECONDS = 0.18;
/** Clips joués une fois, figés sur leur dernière image (comme `Gun_Shoot` et `Death`). */
const ONE_SHOT: readonly MpfbClip[] = ['shoot', 'down', 'revive'];
const POSE_CLIP: Record<Exclude<ExplorationPose, 'dance'>, MpfbClip> = {
  talk: 'talk',
  inspect: 'inspect',
  lean: 'lean',
};
/** Trois danses : deux cadets côte à côte ne bougent pas à l'unisson. */
const DANCES: readonly MpfbClip[] = ['dance1', 'dance2', 'dance3'];

export interface MpfbRigOptions {
  readonly name: string;
  readonly teamColor: number;
  readonly tactical?: boolean;
  readonly showLabel?: boolean;
  readonly showRing?: boolean;
}

export class MpfbCadetRig implements ExplorationCharacterRig {
  readonly object = new THREE.Group();

  private readonly body: MpfbBody;
  private readonly overlay: RigOverlay;
  private readonly mixer: THREE.AnimationMixer;
  private readonly retarget: ReturnType<typeof createMixamoRetarget>;
  private readonly actions = new Map<MpfbClip, THREE.AnimationAction>();
  private readonly equipment = new Map<ItemId, THREE.Object3D>();
  private readonly owned: { dispose(): void }[] = [];
  private readonly tactical: boolean;
  /** Emissif de base par matériau (remplissage tactique) : la mise en évidence s'y ajoute. */
  private readonly baseEmissive = new Map<THREE.MeshToonMaterial | THREE.MeshStandardMaterial, THREE.Color>();
  private readonly sourceToCharacter: number;
  private current: MpfbClip = 'idle';
  private currentAnimation: RigAnimation = 'idle';
  private currentPose: ExplorationPose | null = null;
  private motionSpeed = 0;
  private reducedMotion = false;
  private highlighted = false;
  private disposed = false;

  constructor(
    readonly id: string,
    lookId: string,
    options: MpfbRigOptions,
  ) {
    this.tactical = options.tactical ?? false;
    this.body = cloneMpfbCadet(lookId);
    this.body.root.name = `personnage-modele:${id}`;
    this.object.name = `cadet:${id}`;
    const visual = new THREE.Group();
    visual.add(this.body.root);
    this.object.add(visual);
    if (this.tactical) {
      visual.scale.setScalar(TACTICAL_HEIGHT_BOOST);
      this.applyTacticalFill(options.teamColor);
    }
    const height = this.body.look.height * visual.scale.y;

    this.retarget = createMixamoRetarget(this.body.character, this.body.source);
    this.sourceToCharacter = this.retarget.scale * this.body.root.scale.y;
    this.addEquipment();

    this.overlay = new RigOverlay(this.object, {
      name: options.name,
      teamColor: options.teamColor,
      tactical: this.tactical,
      height,
      showLabel: options.showLabel !== false,
      showRing: options.showRing !== false,
    });

    this.mixer = new THREE.AnimationMixer(this.body.source);
    this.mixer.addEventListener('finished', (event) => {
      // Relevé terminé : retour au repos, sans que le gameplay ait à le demander.
      if ((event as unknown as { action: THREE.AnimationAction }).action === this.actions.get('revive'))
        this.crossFadeTo('idle');
    });
    for (const [clip, animation] of this.body.clips) this.actions.set(clip, this.mixer.clipAction(animation));
    const idle = this.actions.get('idle')!;
    idle.play();
    idle.time = ((hashName(id) % 1000) / 1000) * idle.getClip().duration;
    this.mixer.update(0);
    this.retarget.apply();
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
    if (animation === this.currentAnimation && this.currentPose === null) return;
    const wasDown = this.currentAnimation === 'down';
    this.currentPose = null;
    this.currentAnimation = animation === 'revive' ? 'idle' : animation;
    // Se relever n'a de sens qu'à terre ; sinon le repos suffit.
    this.crossFadeTo(animation === 'revive' ? (wasDown ? 'revive' : 'idle') : animation);
    this.overlay.setDown(animation === 'down');
  }

  playExplorationPose(pose: ExplorationPose | null): void {
    if (this.disposed || pose === this.currentPose) return;
    this.currentPose = pose;
    if (pose === null) this.crossFadeTo(this.currentAnimation);
    else if (pose === 'dance') this.crossFadeTo(DANCES[hashName(this.id) % DANCES.length]!);
    else this.crossFadeTo(POSE_CLIP[pose]);
  }

  setExplorationMotionSpeed(metresPerSecond: number): void {
    this.motionSpeed = metresPerSecond;
    if (this.current !== 'walk' && this.current !== 'run') return;
    const authored = clipGroundSpeed(this.body, this.current, this.sourceToCharacter);
    this.actions.get(this.current)?.setEffectiveTimeScale(Math.max(0.35, metresPerSecond / authored));
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setHighlighted(on: boolean): void {
    if (on === this.highlighted) return;
    this.highlighted = on;
    this.overlay.setHighlighted(on);
    for (const [material, base] of this.baseEmissive) {
      material.emissive.copy(base);
      if (on) material.emissive.add(HIGHLIGHT_COLOR);
    }
  }

  setEquipment(items: readonly ItemId[] | null): void {
    for (const [item, node] of this.equipment) node.visible = items?.includes(item) ?? false;
    this.overlay.setItems(items);
  }

  setEquipmentLineVisible(visible: boolean): void {
    this.overlay.setEquipmentLineVisible(visible);
  }

  getEquipmentAnchor(item: ItemId): THREE.Object3D | null {
    return this.equipment.get(item) ?? null;
  }

  update(dt: number): void {
    if (this.disposed) return;
    const moving = this.current === 'walk' || this.current === 'run';
    if (this.reducedMotion && !moving) return;
    this.mixer.update(Math.min(dt, 0.1));
    this.retarget.apply();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.body.source);
    this.overlay.dispose();
    for (const item of this.owned) item.dispose();
  }

  /** Clip demandé, ou le repos si ce clip n'a pas été livré (`mpfbAssets.ts`). */
  private crossFadeTo(clip: MpfbClip): void {
    const target = this.actions.has(clip) ? clip : 'idle';
    const next = this.actions.get(target)!;
    this.current = target;
    for (const action of this.actions.values())
      if (action !== next && action.isRunning()) action.fadeOut(TRANSITION_SECONDS);
    const once = ONE_SHOT.includes(target);
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(TRANSITION_SECONDS).play();
    if (target === 'walk' || target === 'run') this.setExplorationMotionSpeed(this.motionSpeed || 4);
  }

  /**
   * Tactique : matériaux propres au rig (la mise en évidence ne doit pas éclairer les autres
   * clones), remplissage émissif proportionnel à leur propre couleur ou texture, et épaulettes
   * à la couleur d'équipe (ART-DIRECTION.md, règles de lisibilité 1 et 2).
   */
  private applyTacticalFill(teamColor: number): void {
    const copies = new Map<THREE.Material, THREE.Material>();
    this.body.root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const source = node.material as THREE.Material;
      if (!(source instanceof THREE.MeshToonMaterial || source instanceof THREE.MeshStandardMaterial)) return;
      let copy = copies.get(source) as THREE.MeshToonMaterial | THREE.MeshStandardMaterial | undefined;
      if (!copy) {
        copy = source.clone();
        // `clone()` drops the rim-light shader hook (cadetStyle.ts).
        copy.onBeforeCompile = source.onBeforeCompile;
        copy.customProgramCacheKey = source.customProgramCacheKey;
        if (copy.map) {
          copy.emissiveMap = copy.map;
          copy.emissive.setScalar(TACTICAL_FILL_EMISSIVE);
        } else {
          copy.emissive.copy(copy.color).multiplyScalar(TACTICAL_FILL_EMISSIVE);
        }
        copies.set(source, copy);
        this.owned.push(copy);
        this.baseEmissive.set(copy, copy.emissive.clone());
      }
      node.material = copy;
    });
    const badge = this.material(teamColor);
    for (const side of ['Left', 'Right'] as const) {
      const arm = this.bone(`${side}Arm`);
      if (!arm) continue;
      const tab = new THREE.Mesh(this.geometry(new THREE.BoxGeometry(0.1, 0.025, 0.11)), badge);
      this.attachAt(arm, tab, this.restPosition(arm).add(new THREE.Vector3(0, 0.04, 0)));
    }
  }

  /** Taser à la main droite, deck dans le dos, mine à la hanche : visibles selon `setEquipment`. */
  private addEquipment(): void {
    const hand = this.bone('RightHand');
    const chest = this.bone('Spine2');
    const hips = this.bone('Hips');
    if (hand) {
      const taser = new THREE.Mesh(
        this.geometry(new THREE.BoxGeometry(0.05, 0.07, 0.13)),
        this.material(ITEM_COLORS.taser),
      );
      this.attachAt(hand, taser, this.restPosition(hand).add(new THREE.Vector3(0, -0.05, 0.05)));
      this.equipment.set('taser', taser);
    }
    if (chest) {
      const deck = new THREE.Mesh(
        this.geometry(new THREE.BoxGeometry(0.22, 0.16, 0.05)),
        this.material(ITEM_COLORS.hackingTool),
      );
      this.attachAt(chest, deck, this.restPosition(chest).add(new THREE.Vector3(0, -0.02, -0.15)));
      this.equipment.set('hackingTool', deck);
    }
    if (hips) {
      const mine = new THREE.Mesh(
        this.geometry(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 10)),
        this.material(ITEM_COLORS.mine),
      );
      mine.rotation.x = Math.PI / 2;
      this.attachAt(hips, mine, this.restPosition(hips).add(new THREE.Vector3(-0.2, -0.08, 0.02)));
      this.equipment.set('mine', mine);
    }
    for (const node of this.equipment.values()) node.visible = false;
  }

  private bone(name: string): THREE.Object3D | undefined {
    return this.body.character.getObjectByName(`mixamorig${name}`);
  }

  /** Position de repos d'un os, dans le repère du rig (pieds à l'origine, face vers +z). */
  private restPosition(bone: THREE.Object3D): THREE.Vector3 {
    this.object.updateMatrixWorld(true);
    return this.object.worldToLocal(bone.getWorldPosition(new THREE.Vector3()));
  }

  /** Pose `part` à `at` (repère du rig, au repos) puis le rattache à l'os, qui l'emporte ensuite. */
  private attachAt(bone: THREE.Object3D, part: THREE.Mesh, at: THREE.Vector3): void {
    part.castShadow = true;
    part.position.copy(at);
    this.object.add(part);
    this.object.updateMatrixWorld(true);
    bone.attach(part);
  }

  private material(color: number): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
    if (this.tactical) material.emissive.copy(material.color).multiplyScalar(TACTICAL_FILL_EMISSIVE);
    this.owned.push(material);
    return material;
  }

  private geometry<G extends THREE.BufferGeometry>(geometry: G): G {
    this.owned.push(geometry);
    return geometry;
  }
}

function hashName(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}
