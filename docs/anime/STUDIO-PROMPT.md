# Prompt de lancement — studio animé HOLT

Copier le bloc ci-dessous dans une nouvelle mission Codex. Il autorise la préparation et
l'implémentation du socle local, ainsi que la délégation ; il n'autorise aucune dépense.

```text
Tu es responsable de la mise en place d'une chaîne de production d'animé réutilisable
dans ce dépôt HOLT. Lis AGENTS.md, docs/INDEX.md, docs/WORKFLOWS.md et les documents
pertinents ci-dessous avant de décider de l'architecture. Respecte le jeu existant.

Objectif artistique : adapter le deuxième scénario de la campagne, conservé dans
docs/chapters/ch3/SCENARIO.md, en un animé original de 5 à 10 minutes. C'est une
adaptation linéaire : identifier les choix de la partie sur table et les points à trancher,
sans inventer de canon. Le deck docs/Cyber-S01-E02-Had.odp est une référence visuelle ;
voir son index de diapositives dans le scénario. Réutiliser aussi les références de
docs/art/Reference_pictures/, les bibles et personnages du jeu et du comics v2, ainsi que
les outils et médias HOLT réellement disponibles. Vérifier les droits et la provenance
avant toute réutilisation extérieure. Définir une direction anime originale cohérente,
sans copier directement une œuvre existante.

Mission immédiate : inspecter l'environnement Windows, le dépôt et les outils réels ;
concevoir puis construire un socle local simple, testable et documenté. Préférer les
outils existants et éviter les services ou interfaces prématurés. Les propositions du brief
(Python 3.12, FastAPI, Pydantic, SQLite, React, Redis/Dramatiq, Docker, Blender,
FFmpeg et fal.ai) sont des options à évaluer, pas des dépendances obligatoires. La GTX
1070 8 Go ne doit pas imposer de génération vidéo locale lourde. Examiner Python, Node,
Blender, FFmpeg et Docker sans installer ni modifier de configuration système sans besoin.

Constituer une équipe avec les profils holt-anime-director, holt-anime-art-director,
holt-anime-animation-director, holt-anime-audio-director, holt-anime-editor et holt-anime-quality-reviewer,
en plus des profils HOLT utiles. Déléguer seulement des périmètres indépendants et bornés,
avec propriété des fichiers, contrat de mission, vérification et intégration par un seul
responsable ; les agents héritent du modèle de la session. Les agents planifient et
coordonnent ; des services déterministes exécutent et enregistrent les opérations.

Livrables de ce premier lot :
1. État des lieux et architecture justifiée, emplacement isolé du jeu, dépendances et
   commandes de démarrage, capacités réutilisées et limites du poste.
2. Modèle versionné de projet, scène, plan, personnage, asset, audio, tâche et tentative :
   références et versions, paramètres, état, identifiants fournisseur, coûts estimés/réels,
   rendu retenu et provenance. Prévoir reprise après interruption, échec, annulation,
   revue et approbation ; aucun écrasement des tentatives précédentes.
3. Registre d'assets et pipeline local pour créer un projet, composer un plan avec des
   éléments provisoires, exporter un MP4 avec FFmpeg, inspecter ses métadonnées et
   remplacer un seul plan. Utiliser une courte portion identifiable du scénario 2 comme
   support technique, sans produire un pilote indépendant de 30 secondes. Ce test local
   ne prétend pas valider la qualité artistique du film.
4. Interfaces permettant d'ajouter des fournisseurs image, vidéo et audio ; recenser les
   workflows HOLT existants, dont ElevenLabs OAuth, sans supposer qu'un abonnement ou
   des voix personnalisées fonctionnent via un autre fournisseur. Aucune clé dans Git.
5. Suivi des estimations, coûts réels, tentatives et plafond configurable ; les opérations
   externes payantes restent bloquées sans autorisation explicite ou politique de dépense
   déjà approuvée. Aucun appel payant pour ce lot ; utiliser des simulacres pour les tests.
6. Tests ciblés des états, persistance, limites de budget et remplacement d'un plan ;
   vérifier réellement l'export local si les outils sont présents. Documenter les preuves,
   manques, prochaines étapes et décisions structurantes dans un ADR si nécessaire.

Ensuite, proposer un plan de production pour l'adaptation complète : scénario audiovisuel,
bible, découpage et durée prévisionnelle, voix, montage, revue et budget par plan. Un mix
2,5D local / vidéo générée / effets est envisageable ; les proportions sont indicatives.
Vérifier dans les documentations officielles, au moment où l'intégration est envisagée,
disponibilité, API, conditions et tarifs des fournisseurs ; ne pas présenter des modèles,
prix ou fonctions non vérifiés comme acquis. Aucune production payante ni film complet
n'est demandée dans ce premier lot. Ne pas bloquer sur une validation déjà donnée ici.
```
