# Index de la documentation

Ce dépôt est **autosuffisant** : tout le contexte du projet est ici. Aucun document externe,
aucune conversation à retrouver.

## Par où commencer

| Vous voulez… | Lisez |
|---|---|
| comprendre les règles de travail | [`../AGENTS.md`](../AGENTS.md) |
| comprendre le jeu | [`design/00-VISION.md`](design/00-VISION.md) puis [`design/01-SETTING.md`](design/01-SETTING.md) |
| coder sur le combat | [`design/05-TACTICAL-COMBAT.md`](design/05-TACTICAL-COMBAT.md) |
| coder sur le narratif (epic 2) | [`design/03-CHAPTER-1.md`](design/03-CHAPTER-1.md) puis [`design/07-DIALOGUE-FORMAT.md`](design/07-DIALOGUE-FORMAT.md) |
| comprendre la structure du code | [`process/ARCHITECTURE.md`](process/ARCHITECTURE.md) |
| savoir ce qui reste à faire | [`process/ROADMAP.md`](process/ROADMAP.md) |
| brancher des modèles 3D | [`art/ART-PIPELINE.md`](art/ART-PIPELINE.md) |

## Design — le jeu

| Document | Contenu |
|---|---|
| [`design/00-VISION.md`](design/00-VISION.md) | intention, références, périmètre, ce que le jeu n'est pas |
| [`design/01-SETTING.md`](design/01-SETTING.md) | univers, académie HOLT, ton, thèmes |
| [`design/02-RULES-CPRED-LITE.md`](design/02-RULES-CPRED-LITE.md) | le système de jeu complet : attributs, compétences, jets, difficultés |
| [`design/03-CHAPTER-1.md`](design/03-CHAPTER-1.md) | déroulé complet du chapitre 1, scène par scène |
| [`design/04-CHARACTERS.md`](design/04-CHARACTERS.md) | les six cadets : fiches, traits, secrets, relations |
| [`design/05-TACTICAL-COMBAT.md`](design/05-TACTICAL-COMBAT.md) | spécification du combat tour par tour et de l'IA |
| [`design/06-SCORING-DOSSIER.md`](design/06-SCORING-DOSSIER.md) | barème de l'examen et dossier du candidat |
| [`design/07-DIALOGUE-FORMAT.md`](design/07-DIALOGUE-FORMAT.md) | format des dialogues, à implémenter en epic 2 |

## Art

| Document | Contenu |
|---|---|
| [`art/ART-DIRECTION.md`](art/ART-DIRECTION.md) | direction artistique, palette, contraintes de lisibilité |
| [`art/ART-PIPELINE.md`](art/ART-PIPELINE.md) | de la référence au GLB dans le jeu, et comment remplacer les capsules |
| [`art/REFERENCES.md`](art/REFERENCES.md) | description écrite de toutes les références visuelles existantes |

## Process

| Document | Contenu |
|---|---|
| [`process/ARCHITECTURE.md`](process/ARCHITECTURE.md) | couches, dépendances, invariants |
| [`process/ROADMAP.md`](process/ROADMAP.md) | les deux epics, découpés en lots livrables |
| [`process/CONVENTIONS.md`](process/CONVENTIONS.md) | style de code, nommage, commits, langue |
| [`process/TESTING.md`](process/TESTING.md) | stratégie de test et quoi tester où |
| [`process/DEBUG_API.md`](process/DEBUG_API.md) | contrat de `window.__game` |
| [`process/adr/`](process/adr/) | décisions structurantes, numérotées |

## Décisions prises (ADR)

| N° | Décision |
|---|---|
| [0001](process/adr/0001-camera-isometrique.md) | Caméra isométrique 3/4 fixe |
| [0002](process/adr/0002-rng-deterministe.md) | RNG seedé injecté partout |
| [0003](process/adr/0003-taser-sans-points-de-vie.md) | Le taser neutralise, il n'y a pas de points de vie en exercice |
| [0004](process/adr/0004-abstraction-rig.md) | Les personnages passent par une abstraction `CharacterRig` |
| [0005](process/adr/0005-dialogues-json-maison.md) | Dialogues en JSON typé maison plutôt qu'Ink |
| [0006](process/adr/0006-francais-en-dur.md) | Français écrit en dur, pas d'i18n |
| [0007](process/adr/0007-pas-de-physique-en-epic-1.md) | Pas de moteur physique tant que l'exploration n'existe pas |
| [0008](process/adr/0008-joueur-controle-trois-cadets.md) | Le joueur contrôle les trois cadets de son équipe |
| [0009](process/adr/0009-animation-des-deplacements-et-equipement-visible.md) | Déplacements animés côté rendu, matériel visible (équipe du joueur seulement) |
| [0010](process/adr/0010-evenements-de-combat-et-bruitages-synthetises.md) | Événements de combat pour le rendu (tirs, chutes), bruitages synthétisés |
