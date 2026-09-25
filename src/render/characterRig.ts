/**
 * Abstraction de "rig" de personnage.
 *
 * Le reste du jeu ne connait QUE cette interface. Elle est implementee par
 * l'humanoide Quaternius skinne partage avec l'exploration (`CadetRig`,
 * `src/render/exploration/cadetRig.ts`, cree via `createCadetExplorationRig`)
 * sans qu'une seule ligne de gameplay ne connaisse le pipeline art choisi.
 *
 * C'est la condition posee au depart : pouvoir remplacer le pipeline art
 * sans refondre le jeu. Voir docs/art/ART-PIPELINE.md et ADR 0004 / 0009.
 *
 * Un rig de remplacement (capsules colorees, `PlaceholderRig`) a existe le
 * temps que l'humanoide anime n'etait disponible qu'en exploration ; il a ete
 * retire une fois la vue tactique migree sur le meme rig (voir le rapport de
 * la passe "vrais personnages en tactique"). Aucun appelant n'en depend plus :
 * `main.ts` bloque deja la construction du jeu tant que les GLB partages
 * (`preloadCadetAssets`) ne sont pas charges, donc `GameApp` n'a plus besoin
 * d'un repli synchrone.
 */

import type * as THREE from 'three';
import type { ItemId } from '@/tactical/types';

/** Etats d'animation demandes par le gameplay, volontairement peu nombreux. */
export type RigAnimation = 'idle' | 'walk' | 'run' | 'shoot' | 'down' | 'revive';

/** Poses de presentation propres a l'exploration, sans effet sur le gameplay. */
/**
 * `sit` a existé puis a été retirée : le rig Quaternius, dont la racine est aux pieds, ne donne
 * pas une assise crédible en pliant simplement les hanches et les genoux -- jambes écartées,
 * bassin de travers, et un corps qui ne repose visiblement sur rien. Poser correctement un
 * personnage sur un siège demande une vraie animation d'assise, pas une pose calculée ; tant
 * qu'elle n'existe pas, les figurants se tiennent DEBOUT (décision du propriétaire du projet).
 */
export type ExplorationPose = 'lean' | 'talk' | 'inspect';

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
