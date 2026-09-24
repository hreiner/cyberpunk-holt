# Plan d'implémentation — exploration cyberpunk picturale

**Statut au 24 septembre 2026 : L0–L6 intégrés, L7 en validation finale.**
Les deux cartes, les six cadets animés, les personnages secondaires et l'habillage des
pièces sont dans le jeu. Les parcours de base ont été vérifiés ; les corrections des
chaises, de la porte cantine–classe et de la porte nord de la salle 2 sont intégrées.
Le propriétaire a demandé une exécution **séquentielle : un seul agent actif à la fois**.
Cette consigne remplace les vagues parallèles proposées ci-dessous. Le suivi compact
est dans `.dream-loop/status.md` (travail local ignoré), les décisions durables dans
l'ADR 0017. Restent la revue visuelle finale du centre, la mesure de performance, les
vérifications complètes et la livraison des captures réelles.

Ce document donne à un autre agent Codex l'ordre de réalisation et les critères de passage.
Le [design finalisé](../art/EXPLORATION-VISUAL-DESIGN.md) définit le résultat ; le
[prompt d'orchestration](EXPLORATION-VISUAL-ORCHESTRATION.md) définit les instructions
complètes de délégation, les contrats, les briefs visuels et les vérifications.

## 1. Contrat de mission

Réaliser une refonte visible de **l'ensemble de l'exploration du chapitre 1** : académie
HOLT et centre d'examen, plans et placements recomposés, matières picturales, atmosphère
cyberpunk, six cadets distinctifs, personnages secondaires et animations abouties.

Le propriétaire a autorisé le déplacement des props et la modification des plans. La
géométrie actuelle ne doit donc pas limiter la direction artistique ; la carte de
gameplay reste néanmoins la vérité de collision et d'interaction du nouveau plan.
La progression narrative et les règles sont conservées. La cour tactique est toujours
engendrée par `yard-map`, avec la correspondance vérifiée entre les deux rendus.

Le futur feu vert autorise l'ensemble de ce plan. Les jalons ci-dessous sont des contrôles
techniques et artistiques par les agents, **pas des demandes de permission répétées**.
L'agent ne doit pas s'arrêter après le seul dortoir s'il peut poursuivre la mission.
Les actions externes non couvertes (achat, compte tiers, publication) restent hors mission.

## 2. État initial reçu le 22 septembre (historique)

| Élément                           | État à la rédaction                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Jeu                               | Exploration et chapitre déjà jouables ; rendu principalement en blocs et capsules                      |
| Audit                             | Trois captures live examinées, dortoir/cantine/salle 1 ; aucune erreur JS de page sur ces vues         |
| Captures                          | `tmp/exploration-visual-review/`, ignoré par Git ; les reproduire si absentes                          |
| Design / plan / prompt            | Finalisés dans `docs/`, indexés ; ce sont les livrables de la phase actuelle                           |
| Images cibles de refonte          | À produire ; aucune image générée n'est encore une cible validée                                       |
| Nouveaux modèles, textures, clips | À produire ou obtenir avec des droits vérifiés                                                         |
| Nouveaux ADR                      | À écrire au premier lot ; ne pas réserver aveuglément un numéro déjà pris                              |
| Tests de la refonte               | Non exécutés : aucune implémentation à tester à ce stade                                               |
| Changements préexistants          | `src/chapter.ts`, manifeste d'illustrations, portraits ; recontrôler `git status` avant toute écriture |

Les résumés historiques d'AGENTS et de certains documents sont en retard sur le code.
Lire le détail de la feuille de route et les contrats actuels. Ne pas reconstruire le
socle d'exploration, la découverte ou le système de sauvegarde déjà existants.

## 3. Organisation et dépendances

Orchestrateur : direction, contrat de mission, arbitrages, revue des images. Il délègue
la production et l'intégration principalement à **Terra (`gpt-5.6-terra`)**, avec briefs
courts et `fork_turns: "none"`. Depuis la consigne du propriétaire, les agents travaillent
**un par un** ; les rôles et fichiers exclusifs restent décrits dans le prompt.

Ordre des dépendances :

```text
L0 État initial et contrats
 ├─ L1 Plans et emprises
 └─ L2 Pipeline personnage, Franklyn de preuve
      ↓ (L1 et L2 doivent être suffisamment établis)
L3 Blockout jouable et cibles visuelles
      ↓
L4 Kit environnement + personnages + habillage pilote (travaux disjoints)
      ↓
L5 Intégration et validation de la tranche pilote
      ↓
L6 Généralisation HOLT + centre + distribution des personnages
      ↓
L7 Parcours, performances, corrections et livraison
```

L2 commence tôt pour éviter de découvrir un blocage d'assets après avoir fini les décors.
Une preuve provisoire de locomotion n'est pas l'acceptation du modèle final. Les factories
de L4 peuvent avancer pendant la finition des cibles si leurs dimensions et contrats
sont déjà figés ; les implantations détaillées attendent le plan retenu.

## 4. Lots à exécuter

### L0 — État initial et contrats

**Responsable : intégrateur Terra ; arbitrage : orchestrateur.**

- [ ] Lire les documents nécessaires, relever les fichiers modifiés et les préserver.
- [ ] Créer `.dream-loop/`, son gitignore et le registre compact de mission.
- [ ] Confirmer les points d'entrée : `ExploreView`, `ExploreSession`, cartes, rigs et debug.
- [ ] Définir les types d'habillage, la propriété des assets, les groupes de visibilité,
      les ancrages et les règles de remplacement des blocs.
- [ ] Écrire l'ADR au prochain numéro libre et mettre à jour les contraintes artistiques
      concernées : textures peintes, éventuels accents lumineux, personnages, échelle.
- [ ] Réserver les propriétaires des fichiers et fixer une procédure d'intégration unique.

**Sortie :** contrat écrit et utilisable par les agents, aucun désaccord non résolu sur
les interfaces partagées. Ne pas commencer par une refonte générale de l'architecture.

### L1 — Nouveau plan et parcours

**Responsable : implantation Terra. Dépend de L0.**

- [ ] Dessiner un plan simple des deux cartes, basé sur les fonctions narratives existantes.
- [ ] Recomposer dortoir, trajet vers la cantine, cantine, cour, aile technique, garage,
      parking et salles d'examen selon le design ; définir les véritables emprises des props.
- [ ] Vérifier passages du groupe, ouvertures, angles de vue, destinations d'interaction,
      apparitions, points assis et accès aux terminaux.
- [ ] Garder les identifiants sémantiques quand leur rôle reste le même ; lister les
      conséquences sur sauvegardes/découverte si un changement d'identifiant est nécessaire.
      Conserver les `mapId`, identifiants de pièces, spawns et entités, ou fournir une
      migration versionnée avec un test de reprise d'une sauvegarde antérieure.
- [ ] Reporter le plan retenu dans `09-MAPS-CHAPTER-1.md` et les données correspondantes.
- [ ] Valider les accès depuis les spawns et la correspondance de la cour tactique.

**Sortie :** plan jouable et données cohérentes. Une allée rendue libre n'est pas bloquée
par la collision ; un meuble solide n'est pas traversable. Les choix narratifs restent accessibles.

### L2 — Pipeline personnage et preuve de locomotion

**Responsable : personnages Terra. Peut avancer en parallèle de L1 après L0.**

- [ ] Inventorier outils locaux, assets réutilisables, licences et formats ; vérifier
      les exécutables hors PATH avant de conclure à leur absence.
- [ ] Choisir création locale ou base riggée autorisée, avec un squelette commun,
      variantes de meshes et clips réutilisables. Documenter la provenance.
- [ ] Produire un Franklyn de preuve à bonne échelle : silhouette, cheveux, uniforme,
      neuroport ; tester idle, déplacement, virage et arrêt dans le renderer.
- [ ] Démontrer animation adaptée aux 4 m/s actuels, sans glissement ni root motion
      qui concurrence le gameplay. Ne pas changer les règles pour adapter un mauvais clip.
- [ ] Définir six états `CharacterRig`, poses privées d'exploration et anchors d'équipement.
- [ ] Préparer chargement asynchrone, cache, clones skinnés indépendants, gestion d'erreur
      et libération unique des ressources.

**Sortie :** pipeline prouvé et chemin concret vers un personnage final de qualité.
Si une dépendance externe reste indispensable, l'identifier immédiatement et continuer
les travaux indépendants. Ni capsule recolorée ni fichier GLB simplement chargé ne suffisent.
Le passage à « personnages terminés », puis la clôture de L6/L7, exige une base humanoïde
réellement riggée, des droits documentés et les clips/poses utilisables ; un pipeline local
équivalent doit apporter les mêmes preuves. Ce contrôle est technique, sans nouveau feu vert utilisateur.

### L3 — Blockout reconstruit et cibles

**Responsables : implantation et intégrateur Terra ; images et revue : orchestrateur.**

- [ ] Capturer l'état d'origine si les captures d'audit ne sont plus disponibles.
- [ ] Reconstruire le nouveau blockout dans le vrai chapitre, puis établir le cadrage usuel.
- [ ] Enregistrer recettes reproductibles : état, graine, caméra, viewport/DPR, temps visuel.
- [ ] Générer à partir de ce blockout la cible dortoir/couloir et la planche de Franklyn,
      avec le skill imagegen ; lire le brief dans le prompt d'orchestration.
- [ ] Produire la cible secondaire du centre à partir de son propre cadrage reconstruit.
- [ ] Vérifier et verrouiller les cibles : architecture réalisable, vraie perspective
      orthographique, découverte préservée, identité cyberpunk, personnage humain crédible.

**Sortie :** `.dream-loop/target.png`, cibles secondaires et leurs recettes. Les cibles
sont des spécifications visuelles, clairement distinctes des captures du jeu livré.

### L4 — Production en parallèle sur contrats figés

**Trois agents actifs maximum : environnement, personnages, implantation.**

| Agent         | Production attendue                                                                                          | Contrôle local utile                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Environnement | Matières peintes, kit de murs/cadres, lits/casiers, tables/sièges, consoles, contacts et éclairage du pilote | Raccords, emprises, compte des ressources, comportement sous quatre angles       |
| Personnages   | Franklyn final, animation blendée, architecture des variantes, rigs pour PNJ, poses assises/conversation     | Proportions, déformations, vitesse, orientation, états d'animation et équipement |
| Implantation  | Habillage du dortoir/couloir/cantine, liens d'entités, ancrages, suppressions des anciens blocs              | Références valides, géométrie/collision alignées, accès maintenus                |

- [ ] Les agents rendent leurs modules et rapports courts, sans écrire les fichiers partagés.
- [ ] Les matériaux sont partagés ; l'instanciation respecte les pièces et états de visibilité.
- [ ] Tout aléa visuel dépend de sous-graines par placement, sans effet sur les jets du jeu.
- [ ] Les PNJ non humains ont une représentation appropriée, pas un humanoïde générique.

**Sortie :** modules et assets réels prêts à raccorder, sans faux assemblage parallèle.

### L5 — Tranche pilote intégrée

**Responsable : intégrateur Terra ; revue artistique : orchestrateur.**

- [ ] Raccorder kit, rig, caméra et habillage dans le chapitre existant.
- [ ] Vérifier coupe des murs et accessoires, visibilité des pièces, ombres/effets masqués,
      sélection généreuse, clic au sol et absence de modèles doublés.
      Un PNJ chargé après coup reste masqué et son animation suspendue jusqu'à la
      synchronisation de sa découverte et de sa condition narrative, avant le premier rendu.
- [ ] Vérifier un trajet à la souris, une interaction et un retour de dialogue ; conserver
      la pause des animations d'exploration pendant le dialogue.
- [ ] Observer Franklyn en mouvement et les figurants en pose, avec le vrai éclairage.
      Les poses assises requises concernent les PNJ ; l'action `seat` de Franklyn conserve
      son effet immédiat. Une transition visible du joueur relève du contrat de présentation
      décrit dans le prompt, pas d'un délai ajouté silencieusement au gameplay.
- [ ] Faire une manche de captures décisives et noter les trois écarts dominants à corriger.
- [ ] Corriger en lot et valider les critères du design avant de multiplier les placements.

**Sortie :** un vrai morceau du jeu atteint la qualité visée. Le résultat doit se lire
comme une scène cyberpunk picturale, avec un personnage abouti, et rester jouable hors
du cadrage de l'image cible. Ce jalon ne clôt pas la mission.

### L6 — Étendre aux deux cartes et à tous les acteurs

**Responsables : implantation, personnages, environnement, avec intégration séquencée.**

- [ ] Terminer les onze pièces nommées de HOLT et ses couloirs avec des identités distinctes.
- [ ] Terminer parking, hall, salles 1–3 et approche de la cour du centre d'examen.
- [ ] Remplacer tous les placeholders visibles concernés, y compris PNJ de carte,
      objets/sièges interactifs, véhicules et équipements.
- [ ] Décliner Abigail, Letitia, John, Grover, Zachary à partir du pipeline validé ;
      respecter apparences et attitudes documentées, sans neuroport sur John.
- [ ] Ajouter figurants et instructeurs, variations d'idle et occupations contextuelles,
      sans introduire une foule mobile qui change les règles de circulation.
- [ ] Vérifier réveil, examen, temps libre, roster après tirage, équipement et centre :
      bon acteur au bon endroit, absence de doublons, conditions narratives respectées.
- [ ] Mesurer mémoire et performance pendant l'extension ; corriger l'architecture des
      lots de rendu avant de surcharger la carte suivante.

**Sortie :** la qualité du pilote est étendue au chapitre, pas confinée à une vue promotionnelle.

### L7 — Validation et livraison

**Responsable : vérification Terra ; corrections : propriétaires ; clôture : intégrateur.**

- [ ] Valider globalement emprises, liens de données, accès, sauvegardes et cour tactique.
- [ ] Vérifier clics réels et navigation clavier sur quelques interactions représentatives.
- [ ] Exécuter les parcours e2e complets pertinents ; conserver la coupure tactique et le bilan.
- [ ] Contrôler toutes les orientations, une salle cachée, le HUD à 720p et les animations
      à vitesse réelle. Respecter `prefers-reduced-motion`.
- [ ] Relever médiane/p95 des temps d'image, draw calls, triangles, textures et poids des
      assets, sur un parcours et un matériel documentés ; inspecter plusieurs changements de carte.
- [ ] Après les dernières modifications, exécuter `npm run verify` et les e2e concernés.
- [ ] Mettre à jour docs, licences, critères atteints et limites ; retirer les seuls fichiers
      temporaires produits par le chantier qui ne sont plus utiles, sans nettoyage global.
- [ ] Livrer les vraies captures avant/après et distinguer résultats mesurés et cible matériel.

**Sortie :** chapitre jouable, refonte complète, vérifications prouvées. Une dépendance
artistique ou une régression encore ouverte est explicitement rapportée, jamais cochée.

## 5. Contrôles qui empêchent une fausse réussite

| Risque                                  | Condition à vérifier                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Très belle image, mauvais jeu           | Déplacement, interactions et quatre orientations restent convaincants              |
| Nouvelle table, ancienne collision      | Emprise et cases d'interaction modifiées ensemble, validation des chemins          |
| Franklyn fini, monde rempli de capsules | Rigs du groupe ET PNJ de carte remplacés, y compris les figurants                  |
| Cyberpunk réduit à du cyan              | Technologie visible dans l'architecture et les usages, HOLT reconnaissable         |
| Matière réduite à du bruit              | Grandes touches peintes stables en mouvement, volumes et matériaux différenciés    |
| GLB sans animation crédible             | Pieds ancrés, vitesse cohérente, virages/arrêts, poses assises et variations       |
| Pièce cachée révélée par la lumière     | Décor, ombres, émissions, particules, marqueurs et picking masqués ensemble        |
| Le pilote seul paraît fini              | Deux cartes, toutes les salles et états narratifs couverts                         |
| 60 fps supposés                         | Mesure avec matériel identifié ; GTX 1070 reste une cible sans essai correspondant |

## 6. Handoff initial (historique)

Le texte ci-dessous a servi à lancer l'implémentation ; le feu vert est déjà donné et
les travaux L0–L6 sont intégrés. Pour reprendre, partir du statut en tête de ce document
et des écarts de L7, sans redemander d'autorisation.

```text
Tu as le feu vert pour implémenter la refonte de l'exploration de HOLT.
Lis AGENTS.md et docs/INDEX.md, puis :
- docs/art/EXPLORATION-VISUAL-DESIGN.md
- docs/process/EXPLORATION-VISUAL-IMPLEMENTATION.md
- docs/process/EXPLORATION-VISUAL-ORCHESTRATION.md

Exécute L0 à L7. Le style choisi est une 3D picturale cyberpunk. Tu peux recomposer
les plans et les placements. Les personnages distinctifs et bien animés sont un
livrable principal, au même titre que les environnements des deux cartes.

Agis comme orchestrateur : délègue production, intégration et tests à gpt-5.6-terra,
avec trois agents actifs maximum et des fichiers possédés explicitement. Préserve
les changements utilisateur existants. Utilise une cible générée depuis le nouveau
blockout jouable, puis une boucle de revue bornée. Ne t'arrête pas au pilote.

Livre le résultat implémenté, les captures réelles, les vérifications et mesures
effectivement obtenues, et les éventuelles limites. Aucun achat, publication ou
commit automatique. N'annonce pas une dépendance artistique non résolue comme finie.
```
