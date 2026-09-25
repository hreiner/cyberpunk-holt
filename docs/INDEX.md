# Index de la documentation

Ce dépôt est **autosuffisant** : tout le contexte du projet est ici. Aucun document externe,
aucune conversation à retrouver.

## Par où commencer

| Vous voulez…                     | Lisez                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| comprendre les règles de travail | [`../AGENTS.md`](../AGENTS.md)                                                                                           |
| comprendre le jeu                | [`design/00-VISION.md`](design/00-VISION.md) puis [`design/01-SETTING.md`](design/01-SETTING.md)                         |
| coder sur le combat              | [`design/05-TACTICAL-COMBAT.md`](design/05-TACTICAL-COMBAT.md)                                                           |
| coder sur le narratif (epic 2)   | [`design/03-CHAPTER-1.md`](design/03-CHAPTER-1.md) puis [`design/07-DIALOGUE-FORMAT.md`](design/07-DIALOGUE-FORMAT.md)   |
| coder sur l'exploration (epic 3) | [`design/08-EXPLORATION.md`](design/08-EXPLORATION.md) puis [`design/09-MAPS-CHAPTER-1.md`](design/09-MAPS-CHAPTER-1.md) |
| comprendre la structure du code  | [`process/ARCHITECTURE.md`](process/ARCHITECTURE.md)                                                                     |
| savoir ce qui reste à faire      | [`process/ROADMAP.md`](process/ROADMAP.md)                                                                               |
| brancher des modèles 3D          | [`art/ART-PIPELINE.md`](art/ART-PIPELINE.md)                                                                             |
| concevoir le chapitre suivant    | [`chapters/README.md`](chapters/README.md) — trois phases, et quoi lire (ou pas) à chacune                               |

## Design — le jeu

| Document                                                         | Contenu                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`design/00-VISION.md`](design/00-VISION.md)                     | intention, références, périmètre, ce que le jeu n'est pas                      |
| [`design/01-SETTING.md`](design/01-SETTING.md)                   | univers, académie HOLT, ton, thèmes                                            |
| [`design/02-RULES-CPRED-LITE.md`](design/02-RULES-CPRED-LITE.md) | le système de jeu complet : attributs, compétences, jets, difficultés          |
| [`design/03-CHAPTER-1.md`](design/03-CHAPTER-1.md)               | déroulé complet du chapitre 1, scène par scène                                 |
| [`design/04-CHARACTERS.md`](design/04-CHARACTERS.md)             | les six cadets : fiches, traits, secrets, relations                            |
| [`design/05-TACTICAL-COMBAT.md`](design/05-TACTICAL-COMBAT.md)   | spécification du combat tour par tour et de l'IA                               |
| [`design/06-SCORING-DOSSIER.md`](design/06-SCORING-DOSSIER.md)   | barème de l'examen et dossier du candidat                                      |
| [`design/07-DIALOGUE-FORMAT.md`](design/07-DIALOGUE-FORMAT.md)   | format des dialogues : graphe, conditions, effets, radio, validation           |
| [`design/08-EXPLORATION.md`](design/08-EXPLORATION.md)           | le mode exploration : contrôles, caméra, entités, objectifs, passage au combat |
| [`design/09-MAPS-CHAPTER-1.md`](design/09-MAPS-CHAPTER-1.md)     | format des cartes, l'académie HOLT (plan du MJ), le centre d'examen            |

## Chapitres — concevoir la suite

| Document                                                     | Contenu                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| [`chapters/README.md`](chapters/README.md)                   | **point d'entrée** : scénario → game design → design technique → lots ; lectures par phase |
| [`chapters/CAPABILITIES.md`](chapters/CAPABILITIES.md)       | la palette : ce que le jeu sait faire, vu du concepteur, avec le coût d'un réemploi        |
| [`chapters/CH1-LEGACY.md`](chapters/CH1-LEGACY.md)           | ce que le chapitre 1 transmet : état de l'histoire, dossier, mystères                      |
| [`chapters/ENGINE-COUPLING.md`](chapters/ENGINE-COUPLING.md) | (phase 2) les endroits où le moteur suppose encore le chapitre 1                           |
| [`chapters/_templates/`](chapters/_templates/)               | gabarits `GAME-DESIGN.md` et `TECH-DESIGN.md`                                              |
| [`chapters/ch2/SCENARIO.md`](chapters/ch2/SCENARIO.md)       | le scénario du chapitre 2, à écrire par le propriétaire                                    |

## Art

| Document                                                                       | Contenu                                                                                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [`art/ART-DIRECTION.md`](art/ART-DIRECTION.md)                                 | direction artistique, palette, contraintes de lisibilité                                                        |
| [`art/UI-DESIGN-SYSTEM.md`](art/UI-DESIGN-SYSTEM.md)                           | design system de l'interface HTML/CSS (« Encre rouge ») : jetons, typographie, formes, portraits, écrans        |
| [`art/ART-PIPELINE.md`](art/ART-PIPELINE.md)                                   | de la référence au GLB dans le jeu, et comment remplacer les capsules                                           |
| [`art/EXPLORATION-VISUAL-DESIGN.md`](art/EXPLORATION-VISUAL-DESIGN.md)         | design finalisé : exploration 3D picturale cyberpunk, nouveaux plans, personnages animés et critères de qualité |
| [`art/ROOM-COMPOSITION.md`](art/ROOM-COMPOSITION.md)                           | audit de composition pièce par pièce : usage, ancre narrative, implantation du mobilier et circulation         |
| [`art/DORMITORY-AA-PILOT-REVIEW.md`](art/DORMITORY-AA-PILOT-REVIEW.md)           | pilote autonome jouable du dortoir : comparaison visuelle, mesures, limites et réemploi proposé                 |
| [`art/MIXAMO-PILOT.md`](art/MIXAMO-PILOT.md)                                     | essai d'un personnage Mixamo et d'une marche sur place, conversion Blender et critères visuels                  |
| [`art/REFERENCES.md`](art/REFERENCES.md)                                       | index et description des images de référence (`art/Reference_pictures/`)                                        |
| [`art/image-generation/ORCHESTRATOR.md`](art/image-generation/ORCHESTRATOR.md) | production des illustrations : orchestrateur, bible de style, manifeste, fiches par image                       |

## Process

| Document                                                                                       | Contenu                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`process/ARCHITECTURE.md`](process/ARCHITECTURE.md)                                           | couches, dépendances, invariants                                                                                        |
| [`process/ROADMAP.md`](process/ROADMAP.md)                                                     | les trois epics, découpés en lots livrables                                                                             |
| [`process/CONVENTIONS.md`](process/CONVENTIONS.md)                                             | style de code, nommage, commits, langue                                                                                 |
| [`process/EXPLORATION-VISUAL-ORCHESTRATION.md`](process/EXPLORATION-VISUAL-ORCHESTRATION.md)   | prompt prêt pour l'implémentation déléguée à des agents Terra, avec jalons et revue visuelle                            |
| [`process/EXPLORATION-VISUAL-IMPLEMENTATION.md`](process/EXPLORATION-VISUAL-IMPLEMENTATION.md) | plan d'implémentation L0–L7, statut courant, critères de sortie et handoff pour le prochain agent |
| [`process/DORMITORY-AA-PILOT-ORCHESTRATION.md`](process/DORMITORY-AA-PILOT-ORCHESTRATION.md)   | pilote visuel autonome des dortoirs : Franklyn jouable, hausse de qualité des personnages et décors, preuves et mesures |
| [`process/TESTING.md`](process/TESTING.md)                                                     | stratégie de test et quoi tester où                                                                                     |
| [`process/DEBUG_API.md`](process/DEBUG_API.md)                                                 | contrat de `window.__game`                                                                                              |
| [`process/adr/`](process/adr/)                                                                 | décisions structurantes, numérotées                                                                                     |

## Décisions prises (ADR)

| N°                                                                           | Décision                                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [0001](process/adr/0001-camera-isometrique.md)                               | Caméra isométrique 3/4 fixe                                                                      |
| [0002](process/adr/0002-rng-deterministe.md)                                 | RNG seedé injecté partout                                                                        |
| [0003](process/adr/0003-taser-sans-points-de-vie.md)                         | Le taser neutralise, il n'y a pas de points de vie en exercice                                   |
| [0004](process/adr/0004-abstraction-rig.md)                                  | Les personnages passent par une abstraction `CharacterRig`                                       |
| [0005](process/adr/0005-dialogues-json-maison.md)                            | Dialogues en JSON typé maison plutôt qu'Ink                                                      |
| [0006](process/adr/0006-francais-en-dur.md)                                  | Français écrit en dur, pas d'i18n                                                                |
| [0007](process/adr/0007-pas-de-physique-en-epic-1.md)                        | Pas de moteur physique tant que l'exploration n'existe pas                                       |
| [0008](process/adr/0008-joueur-controle-trois-cadets.md)                     | Le joueur contrôle les trois cadets de son équipe                                                |
| [0009](process/adr/0009-animation-des-deplacements-et-equipement-visible.md) | Déplacements animés côté rendu, matériel visible (équipe du joueur seulement)                    |
| [0010](process/adr/0010-evenements-de-combat-et-bruitages-synthetises.md)    | Événements de combat pour le rendu (tirs, chutes), bruitages synthétisés                         |
| [0011](process/adr/0011-moteur-narratif-etat-de-partie-et-radio.md)          | Moteur narratif : dossier / état de partie séparés, radio en couche parallèle, routeur de scènes |
| [0012](process/adr/0012-examen-ecrit-jet-de-reflexion-et-mise-en-scene.md)   | Examen écrit : jet de réflexion, meilleure réponse et mise en scène du dé                        |
| [0013](process/adr/0013-exploration-temps-reel-sur-grille.md)                | Exploration en temps réel sur la grille, sans moteur physique (remplace 0007)                    |
| [0014](process/adr/0014-tirage-franklyn-capitaine-equipes-dynamiques.md)     | Le tirage : Franklyn capitaine, équipes composées par le joueur                                  |
| [0015](process/adr/0015-concentration-chance-et-triche.md)                   | Concentration, Chance et triche à l'examen                                                       |
| [0016](process/adr/0016-vue-tactique-ecran-separe.md)                        | Le passage au combat reste une coupure vers un écran tactique séparé                             |
| [0017](process/adr/0017-habillage-exploration-declaratif.md)                 | Habillage d'exploration déclaratif, séparé du gameplay                                           |
| [0018](process/adr/0018-lumieres-locales-luminaires-et-matieres-procedurales.md) | Lumières locales bon marché pour les luminaires, matières procédurales enrichies              |
| [0019](process/adr/0019-matieres-photo-pour-les-sols-dexploration.md)           | Matières photo pour les sols d'exploration, réemployées par teinte                            |
| [0020](process/adr/0020-pilote-dortoir-isole-et-options-art.md)                   | Pilote du dortoir isolé et options d'art de la vue                                             |
| [0021](process/adr/0021-plusieurs-chapitres-chapterdef.md) | *(proposé)* Plusieurs chapitres : `ChapterDef` et `RunState.chapter` |
| [0022](process/adr/0022-dossier-entre-chapitres-archive-et-profils.md) | *(proposé)* Le dossier entre deux chapitres : archive locale, suite directe, profils |
| [0023](process/adr/0023-format-dialogue-decor-bruitage-tempo-locuteurs.md) | *(proposé)* Format de dialogue : décor et bruitage par nœud, compteur borné, tempo, locuteurs |
| [0024](process/adr/0024-exploration-fuite-zones-pression-suiveurs.md) | *(proposé)* Exploration de fuite : zones à effets, pression, suiveurs déclarés, habillage par registre |
| [0025](process/adr/0025-jauges-et-bilan-de-chapitre-en-donnees.md) | *(proposé)* Jauges d'état et bilan de chapitre déclarés en données |
