/**
 * Raccord minimal entre les placements declaratifs et `ExploreView`.
 *
 * La fabrique possede les ressources partagees (geometries, materiaux,
 * textures) ; cette classe ne dispose que les objets de placement qu'elle a
 * montes. Cela rend les changements de carte deterministes et sans double
 * liberation des ressources.
 *
 * Passe G (performance) : le mobilier decoratif d'une piece repete beaucoup la meme
 * geometrie/matiere (huit lits identiques, vingt-huit pupitres...) et chacun etait un objet
 * three.js distinct -- un appel de dessin par boite, par pied de table, par lame de casier.
 * `mergeStaticInstances` regroupe, PIECE PAR PIECE (jamais au-dela, `docs/design/08-EXPLORATION.md`
 * "La decouverte des lieux"), les maillages qui partagent exactement geometrie + matiere + drapeaux
 * d'ombre en un seul `THREE.InstancedMesh`. Deux exclusions delibrees, dictees par ADR 0017 et le
 * picking de `ExploreView` :
 * - un placement lie a une entite (`entityId`) reste TOUJOURS un objet separe : il doit rester
 *   individuellement cliquable (`userData.entityId`) et sa visibilite suit `setVisibleEntities`,
 *   pas seulement la decouverte de la piece ;
 * - un lot de moins de deux maillages ne vaut pas la complexite d'un `InstancedMesh` : le maillage
 *   d'origine reste en place, inchange.
 * La geometrie et la matiere restent des references PARTAGEES (jamais clonees) : leur liberation
 * reste entierement a la charge de la fabrique (ADR 0017, "la fabrique... les libere une seule
 * fois") -- seul `InstancedMesh.dispose()` (le tampon d'instances, propre a CET objet) est a notre
 * charge, voir `dispose()` plus bas.
 */

import * as THREE from 'three';
import type { ExploreVisualMapDef, ExploreVisualPlacement } from '@/data/exploreVisualTypes';

/** Cle de regroupement partagee avec `syncVisibility` : une piece, ou l'exterieur (toujours visible). */
const EXTERIOR_KEY = '@exterior';
/**
 * Separateur entre la cle de base (piece/exterieur) et l'etape requise (ADR 0026) : un
 * caractere de controle, jamais produit par un `roomId`/`etape` ecrits a la main, donc jamais
 * ambigu a re-decouper (`parseVisibilityKey`).
 */
const ETAPE_KEY_SEP = '\u0001';
function visibilityKeyOf(placement: ExploreVisualPlacement): string {
  const base = 'roomId' in placement ? `room:${placement.roomId}` : EXTERIOR_KEY;
  // Deux placements de la MEME piece mais d'etapes differentes (le bal, puis la fuite, sur la
  // meme case) ne doivent jamais fusionner dans le meme `InstancedMesh` : ils basculent a des
  // moments differents, une cle distincte par etape le garantit sans toucher `mergeStaticInstances`.
  return placement.etape ? `${base}${ETAPE_KEY_SEP}${placement.etape}` : base;
}
function parseVisibilityKey(key: string): { base: string; etape?: string } {
  const sep = key.indexOf(ETAPE_KEY_SEP);
  return sep === -1
    ? { base: key }
    : { base: key.slice(0, sep), etape: key.slice(sep + ETAPE_KEY_SEP.length) };
}

interface InstanceCandidate {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrix: THREE.Matrix4;
}

/** Etat deja calcule par l'exploration, passe au decor sans logique dupliquee. */
export interface ExploreDressingVisibility {
  discoveredRoomIds: ReadonlySet<string>;
  visibleEntityIds: ReadonlySet<string>;
  /** Etape narrative courante (ADR 0026) : filtre les placements portant `etape`. */
  etape?: string;
}

/** Fabrique de meshes : un modele inconnu est une erreur de programmation explicite. */
export interface ExploreDressingFactory {
  create(placement: ExploreVisualPlacement): THREE.Object3D;
  dispose(): void;
  /** Environnement emprunté à la scène, sans transfert de propriété. */
  setEnvironment?(texture: THREE.Texture | null): void;
}

interface MountedPlacement {
  placement: ExploreVisualPlacement;
  object: THREE.Object3D;
}

interface InstancedVisibilityGroup {
  instances: THREE.InstancedMesh[];
  exterior: boolean;
  roomId?: string;
  etape?: string;
}

/**
 * Modeles dont la `PointLight` vacille (`tick`) : les feux (`fire-glow`, lot 5.8b ; `campfire`,
 * lot 5.10 ; les brasiers de la cantine, `blaze`, lot 5.9) et les ampoules qui gresillent dans
 * les conduits (`duct-lamp`, lot 5.9).
 */
const FLICKERING_MODELS: ReadonlySet<string> = new Set(['fire-glow', 'campfire', 'blaze', 'duct-lamp']);

/**
 * Regroupe les placements par leur decision de visibilite pour que geometrie,
 * ombres, emissions et particules suivent le meme interrupteur.
 */
export class ExploreDressing {
  readonly root = new THREE.Group();
  private readonly mounted: MountedPlacement[];
  private readonly entityObjects = new Map<string, THREE.Object3D>();
  /** Lots fusionnes (voir en-tete), indexes par la meme cle de visibilite qu'un placement decoratif. */
  private readonly instancedByVisibilityKey = new Map<string, InstancedVisibilityGroup>();
  /** A liberer explicitement (voir `dispose`) : ni la geometrie ni la matiere ne leur appartiennent. */
  private readonly instancedMeshes: THREE.InstancedMesh[] = [];
  /**
   * Lueurs de feu a faire vaciller (`fire-glow`, lot 5.8b) : trouvees une fois a la
   * construction (la fabrique porte une `THREE.PointLight` enfant, meme principe que
   * `strip-light`/`warning-beacon`, ADR 0018), animees par `tick()`. Le dephasage
   * (`phase`) vient du RANG du placement dans `definition.placements`, jamais de
   * `Math.random()` (regle n°1 d'AGENTS.md) : deux lueurs de la meme scene ne
   * clignotent donc jamais en phase, sans tirage.
   */
  private readonly animatedMaterials = new Set<THREE.ShaderMaterial>();
  private readonly flickeringLights: { light: THREE.PointLight; base: number; phase: number }[] = [];

  constructor(
    readonly definition: ExploreVisualMapDef,
    private readonly factory: ExploreDressingFactory,
  ) {
    this.mounted = definition.placements.map((placement, index) => {
      const object = factory.create(placement);
      object.userData.exploreVisualPlacementId = placement.id;
      if (placement.entityId) {
        object.userData.entityId = placement.entityId;
        this.entityObjects.set(placement.entityId, object);
      }
      if (FLICKERING_MODELS.has(placement.model)) {
        object.traverse((child) => {
          if (child instanceof THREE.PointLight) {
            this.flickeringLights.push({ light: child, base: child.intensity, phase: index * 1.7 });
          }
        });
      }
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          if (material instanceof THREE.ShaderMaterial && material.userData.exploreTimeUniform)
            this.animatedMaterials.add(material);
        }
      });
      this.root.add(object);
      return { placement, object };
    });
    this.mergeStaticInstances();
  }

  /**
   * Vacillement des lumieres de `FLICKERING_MODELS`, pilote par le temps ecoule -- jamais par
   * `Math.random()` (regle n°1 d'AGENTS.md). Sans effet si la carte n'en pose aucune, donc
   * gratuit a appeler systematiquement.
   */
  tick(elapsedSeconds: number): void {
    for (const material of this.animatedMaterials) {
      const uniform = material.uniforms[material.userData.exploreTimeUniform as string];
      if (uniform) uniform.value = elapsedSeconds;
    }
    for (const { light, base, phase } of this.flickeringLights) {
      const wobble =
        Math.sin(elapsedSeconds * 6.2 + phase) * 0.5 + Math.sin(elapsedSeconds * 13.1 + phase * 2) * 0.5;
      light.intensity = base * (0.72 + wobble * 0.28);
    }
  }

  /** Transmet le PMREM aux matières possédées par la fabrique. */
  setEnvironment(texture: THREE.Texture | null): void {
    this.factory.setEnvironment?.(texture);
  }

  /** Modèle sémantique explicitement associé à une entité interactive, s'il existe. */
  objectForEntity(entityId: string): THREE.Object3D | undefined {
    return this.entityObjects.get(entityId);
  }

  /** Keep a specialized closure synchronized with the sole gameplay door state. */
  setDoorOpen(doorId: string, open: boolean): void {
    for (const { placement, object } of this.mounted) {
      if (placement.doorStateId !== doorId) continue;
      const closure = object.getObjectByName('door-closure');
      if (closure) closure.visible = !open;
    }
  }

  /**
   * Regroupe, piece par piece, les maillages decoratifs qui partagent geometrie + matiere +
   * drapeaux d'ombre en `THREE.InstancedMesh` -- voir la note d'en-tete de fichier. N'agit
   * qu'une fois, a la construction : les placements sont statiques une fois la carte chargee.
   */
  private mergeStaticInstances(): void {
    this.root.updateMatrixWorld(true);
    const rootWorldInverse = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    const buckets = new Map<string, InstanceCandidate[]>();

    for (const { placement, object } of this.mounted) {
      // Un placement lie a une entite reste un objet individuel : picking direct et
      // visibilite propre (`ExploreView.setVisibleEntities`), voir ADR 0017.
      if (placement.entityId || placement.doorStateId) continue;
      const visibilityKey = visibilityKeyOf(placement);
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh) return;
        if (Array.isArray(child.material)) return; // jamais produit par ce kit ; prudence si ça change un jour
        const geometry = child.geometry;
        const material = child.material;
        const bucketKey = `${visibilityKey}\u0000${geometry.uuid}\u0000${material.uuid}\u0000${child.castShadow ? 1 : 0}\u0000${child.receiveShadow ? 1 : 0}`;
        const matrix = rootWorldInverse.clone().multiply(child.matrixWorld);
        const list = buckets.get(bucketKey);
        const candidate: InstanceCandidate = { mesh: child, geometry, material, matrix };
        if (list) list.push(candidate);
        else buckets.set(bucketKey, [candidate]);
      });
    }

    for (const [bucketKey, candidates] of buckets) {
      // Un seul maillage : la fusion ne rapporte rien, on le laisse tel quel.
      if (candidates.length < 2) continue;
      const visibilityKey = bucketKey.split('\u0000')[0]!;
      const first = candidates[0]!;
      const instanced = new THREE.InstancedMesh(first.geometry, first.material, candidates.length);
      candidates.forEach((candidate, index) => instanced.setMatrixAt(index, candidate.matrix));
      instanced.instanceMatrix.needsUpdate = true;
      instanced.castShadow = first.mesh.castShadow;
      instanced.receiveShadow = first.mesh.receiveShadow;
      instanced.computeBoundingSphere();
      this.root.add(instanced);
      this.instancedMeshes.push(instanced);
      const group = this.instancedByVisibilityKey.get(visibilityKey);
      if (group) group.instances.push(instanced);
      else {
        const parsed = parseVisibilityKey(visibilityKey);
        const exterior = parsed.base === EXTERIOR_KEY;
        this.instancedByVisibilityKey.set(visibilityKey, {
          instances: [instanced],
          exterior,
          roomId: exterior ? undefined : parsed.base.slice('room:'.length),
          etape: parsed.etape,
        });
      }
      // Les maillages d'origine sont remplacés par leur instance : on les détache (jamais
      // disposés, leur géométrie/matière reste possédée par la fabrique, voir en-tête).
      for (const candidate of candidates) candidate.mesh.parent?.remove(candidate.mesh);
    }
  }

  /** Synchronise avant le premier rendu et a chaque evolution de decouverte ou d'entite. */
  syncVisibility(state: ExploreDressingVisibility): void {
    for (const { placement, object } of this.mounted) {
      const visibleByRoom =
        'roomId' in placement
          ? state.discoveredRoomIds.has(placement.roomId)
          : placement.visibility === 'exterior';
      const visibleByEntity = !placement.entityId || state.visibleEntityIds.has(placement.entityId);
      const visibleByEtape = !placement.etape || placement.etape === state.etape;
      object.visible = visibleByRoom && visibleByEntity && visibleByEtape;
    }
    for (const { exterior, roomId, etape, instances } of this.instancedByVisibilityKey.values()) {
      const visibleByRoom = exterior || (roomId !== undefined && state.discoveredRoomIds.has(roomId));
      const visibleByEtape = !etape || etape === state.etape;
      const visible = visibleByRoom && visibleByEtape;
      for (const instanced of instances) instanced.visible = visible;
    }
  }

  /** Detache les instances ; la fabrique libere une seule fois les ressources partagees. */
  dispose(): void {
    // Le tampon d'instances (`instanceMatrix`) est propre à CHAQUE `InstancedMesh` : ni sa
    // géométrie ni sa matière (partagées, voir en-tête) -- seul ce tampon est à notre charge.
    for (const instanced of this.instancedMeshes) instanced.dispose();
    this.instancedMeshes.length = 0;
    this.instancedByVisibilityKey.clear();
    this.root.clear();
    this.animatedMaterials.clear();
    this.factory.dispose();
  }
}
