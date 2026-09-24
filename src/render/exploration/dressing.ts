/**
 * Raccord minimal entre les placements declaratifs et `ExploreView`.
 *
 * La fabrique possede les ressources partagees (geometries, materiaux,
 * textures) ; cette classe ne dispose que les objets de placement qu'elle a
 * montes. Cela rend les changements de carte deterministes et sans double
 * liberation des ressources.
 */

import * as THREE from 'three';
import type { ExploreVisualMapDef, ExploreVisualPlacement } from '@/data/exploreVisualTypes';

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
  }

  /** Modèle sémantique explicitement associé à une entité interactive, s'il existe. */
  objectForEntity(entityId: string): THREE.Object3D | undefined {
    return this.entityObjects.get(entityId);
  }

  /** Synchronise avant le premier rendu et a chaque evolution de decouverte ou d'entite. */
  syncVisibility(state: ExploreDressingVisibility): void {
    for (const { placement, object } of this.mounted) {
      const visibleByRoom =
        'roomId' in placement ? state.discoveredRoomIds.has(placement.roomId) : placement.visibility === 'exterior';
      const visibleByEntity = !placement.entityId || state.visibleEntityIds.has(placement.entityId);
      object.visible = visibleByRoom && visibleByEntity;
    }
  }

  /** Detache les instances ; la fabrique libere une seule fois les ressources partagees. */
  dispose(): void {
    this.root.clear();
    this.factory.dispose();
  }
}
