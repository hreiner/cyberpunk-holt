# ADR 0013 — Exploration en temps réel sur la grille, sans moteur physique

**Statut** : accepté (epic 3). **Remplace** l'[ADR 0007](0007-pas-de-physique-en-epic-1.md).

## Contexte

Le chapitre 1 était une suite de scènes de dialogue et un combat. Le joueur veut un
déroulé de CRPG à la *Baldur's Gate* : se déplacer dans l'académie et dans le centre
d'examen, et déclencher les scènes en arrivant quelque part. L'ADR 0007 repoussait Rapier
« jusqu'à la première scène d'exploration réelle ».

## Décision

1. **Pas de moteur physique.** L'exploration se fait sur la **même grille de 1 m** que le
   combat, avec le **pathfinding A\* existant** (`src/tactical/`, extrait dans un module
   neutre s'il le faut). Le déplacement est **continu à l'écran** (interpolation, comme
   l'ADR 0009) mais **discret dans l'état** : la position logique est une case.
2. **Trois modes, un monde** : exploration (temps réel), dialogue (figé), tactique (tour par
   tour). Le passage au combat se fait **sur la même carte** : le moteur tactique reçoit le
   rectangle `tacticalArea`, le rendu dessine le lieu entier.
3. **Le temps réel ne touche pas l'état de jeu.** Le tempo (minuteur invisible) n'avance que
   sur des actions ; aucun système ne dépend de l'horloge. Une partie reste reproductible à
   la graine près (ADR 0002), et l'API de debug reste synchrone.
4. **Le routeur de scènes reste linéaire** (ADR 0011). Une étape de type `explore` porte : la
   carte, le point d'apparition, l'objectif, et la condition qui le termine (une entité
   déclenchée, une zone franchie). Les dialogues sont déclenchés par les entités.
5. **Nouvelle couche `src/explore/`**, pure (ni `three` ni DOM), testable dans Node : état
   d'exploration, cartes, entités, déclencheurs, objectifs. Le rendu vit dans `src/render/`,
   l'encart d'objectif dans `src/ui/`.
6. **Murs en coupe** plutôt que transparence dynamique : les murs côté caméra sont rendus à
   0,4 m, recalculés à chaque quart de tour. Simple, déterministe, lisible.

## Conséquences

- Aucune dépendance nouvelle ; la cible GTX 1070 n'est pas menacée.
- Pas de glissade le long des murs, pas de foule qui se pousse : les figurants sont
  statiques ou suivent des chemins scriptés simples. Assumé.
- La sauvegarde reste par étape ; on ne sauvegarde pas une position libre.
- Un vrai besoin de physique (objets lancés, portes battantes) demanderait un nouvel ADR.
