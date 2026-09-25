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
function visibilityKeyOf(placement: ExploreVisualPlacement): string {
  return 'roomId' in placement ? `room:${placement.roomId}` : EXTERIOR_KEY;
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
}

/** Fabrique de meshes : un modele inconnu est une erreur de programmation explicite. */
export interface ExploreDressingFactory {
  create(placement: ExploreVisualPlacement): THREE.Object3D;
  dispose(): void;
}

interface MountedPlacement {
  placement: ExploreVisualPlacement;
  object: THREE.Object3D;
}

/**
 * Regroupe les placements par leur decision de visibilite pour que geometrie,
 * ombres, emissions et particules suivent le meme interrupteur.
 */
export class ExploreDressing {
  readonly root = new THREE.Group();
  private readonly mounted: MountedPlacement[];
  private readonly entityObjects = new Map<string, THREE.Object3D>();
  /** Lots fusionnes (voir en-tete), indexes par la meme cle de visibilite qu'un placement decoratif. */
  private readonly instancedByVisibilityKey = new Map<string, THREE.InstancedMesh[]>();
  /** A liberer explicitement (voir `dispose`) : ni la geometrie ni la matiere ne leur appartiennent. */
  private readonly instancedMeshes: THREE.InstancedMesh[] = [];

  constructor(
    readonly definition: ExploreVisualMapDef,
    private readonly factory: ExploreDressingFactory,
  ) {
    this.mounted = definition.placements.map((placement) => {
      const object = factory.create(placement);
      object.userData.exploreVisualPlacementId = placement.id;
      if (placement.entityId) {
        object.userData.entityId = placement.entityId;
        this.entityObjects.set(placement.entityId, object);
      }
      this.root.add(object);
      return { placement, object };
    });
    this.mergeStaticInstances();
  }

  /** Modèle sémantique explicitement associé à une entité interactive, s'il existe. */
  objectForEntity(entityId: string): THREE.Object3D | undefined {
    return this.entityObjects.get(entityId);
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
      if (placement.entityId) continue;
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
      if (group) group.push(instanced);
      else this.instancedByVisibilityKey.set(visibilityKey, [instanced]);
      // Les maillages d'origine sont remplacés par leur instance : on les détache (jamais
      // disposés, leur géométrie/matière reste possédée par la fabrique, voir en-tête).
      for (const candidate of candidates) candidate.mesh.parent?.remove(candidate.mesh);
    }
  }

  /** Synchronise avant le premier rendu et a chaque evolution de decouverte ou d'entite. */
  syncVisibility(state: ExploreDressingVisibility): void {
    for (const { placement, object } of this.mounted) {
      const visibleByRoom =
        'roomId' in placement ? state.discoveredRoomIds.has(placement.roomId) : placement.visibility === 'exterior';
      const visibleByEntity = !placement.entityId || state.visibleEntityIds.has(placement.entityId);
      object.visible = visibleByRoom && visibleByEntity;
    }
    for (const [visibilityKey, instances] of this.instancedByVisibilityKey) {
      const visible = visibilityKey === EXTERIOR_KEY || state.discoveredRoomIds.has(visibilityKey.slice('room:'.length));
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
    this.factory.dispose();
  }
}
