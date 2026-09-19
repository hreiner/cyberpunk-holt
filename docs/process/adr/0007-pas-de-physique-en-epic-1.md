# ADR 0007 — Pas de moteur physique tant que l'exploration n'existe pas

**Statut** : remplacé par l'[ADR 0013](0013-exploration-temps-reel-sur-grille.md) · **Date** : 2026-09-18

## Contexte

La pile envisagée au départ comprenait **Rapier** et son contrôleur de personnage, pour
l'exploration. L'epic 1 ne contient que du combat tactique sur grille.

## Décision

**Ne pas installer Rapier maintenant.** La phase tactique n'utilise aucune physique : les
déplacements se font sur une grille, la ligne de vue est un tracé de Bresenham sur les
cases, les collisions sont une propriété de case.

Rapier arrivera avec la première scène d'exploration réelle, en epic 2 ou plus tard.

## Conséquences

**Favorables**

- Une dépendance lourde en moins, et un `npm install` plus rapide.
- Surtout : **la logique tactique reste purement déterministe**. Un moteur physique
  introduit des résultats dépendants du pas de temps et de la plateforme, ce qui aurait
  ruiné le déterminisme (ADR 0002) et les tests.
- La ligne de vue sur grille est plus lisible et plus juste pour un jeu tactique qu'un
  raycast physique : le joueur raisonne en cases, pas en centimètres.

**Défavorables**

- L'exploration devra intégrer Rapier plus tard, avec la question de la cohabitation entre
  monde physique et monde en cases.

## Règle qui en découle

**La physique, si elle arrive, ne décidera jamais d'une règle de jeu.** Elle animera et
fera se déplacer ; la grille restera la source de vérité du gameplay.
