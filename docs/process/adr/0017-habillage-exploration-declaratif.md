# ADR 0017 — Habillage d'exploration déclaratif et séparé du gameplay

**Statut** : accepté · **Date** : 2026-09-22

## Contexte

La refonte picturale de l'académie HOLT et du centre d'examen doit déplacer et remplacer
beaucoup de props sans créer une seconde carte. `MapDef` porte déjà la collision, les
interactions, la découverte et la correspondance de la cour tactique ; faire porter ces
informations au renderer casserait les validateurs, les sauvegardes et les parcours existants.

## Décision

Chaque carte reçoit un habillage déclaratif dans `src/data/exploreVisuals/`, décrit par les
contrats de `src/data/exploreVisualTypes.ts`. Un placement a un identifiant stable, un modèle,
un ancrage, une emprise, une visibilité par pièce ou extérieure et, si nécessaire, un lien vers
une entité existante. Son ancrage est le centre au sol de sa `cell`, son pivot local est au sol
et son avant est `+Z`; les rotations sont des quarts de tour autour de Y. `replaces` retire
seulement un placeholder du rendu : l'ASCII de `MapDef` reste la vérité de collision.

`ExploreDressing` applique ensemble découverte de pièce et activation d'entité aux meshes,
ombres, émissions, particules et étiquettes. Sa factory possède les ressources partagées et
les libère une seule fois à la sortie de carte. Toute variation décorative provient d'une
sous-graine stable par placement et ne consomme aucun tirage de jeu.

`ExploreView` conserve la coupe des murs, le picking et les interactions. Un accessoire
d'habillage ne devient donc jamais interactif de lui-même et il suit le même groupe de visibilité
que son placement, y compris lorsqu'un mur est coupé.

`CharacterRig` reste le contrat du combat. `ExplorationCharacterRig` ajoute facultativement
des poses de présentation et des ancrages d'équipement, sans root motion ni changement des six
animations exigées par le gameplay.

## Conséquences

- Les agents de plan, environnement et personnages peuvent produire leurs modules sans écrire
  les points d'entrée `ExploreView` et `ExploreSession`.
- Le renderer garde la responsabilité du picking et de la coupe des murs ; un détail décoratif
  ne crée pas une interaction.
- Les données de visibilité et les assets doivent être validés avant intégration ; une erreur de
  modèle ou de pièce est une incohérence de programmation explicite.
- La mise à jour d'un placement ne modifie ni les sauvegardes ni le rectangle tactique.
