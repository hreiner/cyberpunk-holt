# Prompt d'orchestration — exploration 3D picturale

Statut : finalisé, **implémentation autorisée et en cours**. Depuis la reprise après
limite d'usage, le propriétaire demande **un seul agent actif à la fois** ; exécuter
les rôles ci-dessous séquentiellement, sans sous-délégation. Aucun travail de
rendu n'avait été implémenté pendant la rédaction. Direction et critères détaillés :
[`../art/EXPLORATION-VISUAL-DESIGN.md`](../art/EXPLORATION-VISUAL-DESIGN.md).
Lots et suivi d'exécution :
[`EXPLORATION-VISUAL-IMPLEMENTATION.md`](EXPLORATION-VISUAL-IMPLEMENTATION.md).

Le prompt ci-dessous constitue une seule mission : tranche pilote puis généralisation
aux deux cartes et aux personnages. Les jalons intermédiaires ne sont pas la fin du travail.
Il adapte le principe de dream-loop au dépôt ; il ne dépend ni d'un abonnement supposé,
ni d'une boucle indéfinie, ni d'une reproduction pixel pour pixel d'une image générée.
Les workflows Plus/Pro du skill n'ont pas été exécutés pendant cette étude.

Copier le texte de la section suivante dans une nouvelle demande, ou demander simplement
d'implémenter ce document et le design associé.

---

## Prompt à exécuter

Implémente la refonte visuelle de l'exploration de HOLT conformément à
`docs/art/EXPLORATION-VISUAL-DESIGN.md` et à l'orchestration ci-dessous.

Tu es l'orchestrateur principal. **Délègue l'implémentation, les assets, l'intégration et
les vérifications aux agents `gpt-5.6-terra`.** Garde pour toi la direction artistique,
les contrats, la répartition du travail, les décisions difficiles et la revue des images.
Ne consomme pas ton contexte à écrire leurs géométries, leurs shaders ou leurs tests.

Le propriétaire a choisi une **3D picturale cyberpunk**, et autorisé le changement des
plans et des positions de props pour améliorer l'atmosphère. Il demande également des
personnages aboutis, distinctifs et animés. Ce sont trois livrables de même importance :
environnements, mise en scène spatiale, personnages. Ne te limite pas à recolorer le blockout.

### A. Résultat et périmètre

- Recomposer les lieux jouables, puis produire une académie cyberpunk diurne et contrôlée,
  un centre d'examen industriel usé, des matières peintes, une lumière lisible et des
  détails de technologie crédibles : accès, surveillance, netrun, câblage, consoles.
- Livrer les deux cartes, les six cadets, les instructeurs/figurants visibles et leurs
  animations. Le premier dortoir fini et Franklyn animé sont le jalon qualité initial.
- Préserver les rôles narratifs, les effets des choix, les objectifs, les interactions,
  les sauvegardes par étape, le RNG, la découverte, la rotation en quarts de tour et
  l'écran tactique séparé. Changer une implantation exige de déplacer aussi les
  interactions et collisions correspondantes et d'en vérifier l'accessibilité.
- La cour de combat conserve la géométrie issue de `yard-map` et son test de correspondance.
  Garder le HUD « Encre rouge », les portraits existants et les textes français.
- Aucun achat, compte externe, upload vers un service tiers ou publication implicite.
  Des sources publiques redistribuables peuvent être recherchées, vérifiées et utilisées
  avec leur licence ; ne pas bloquer artificiellement sur l'absence d'assets préinstallés.
- Aucun commit automatique. Si un commit devient demandé, `npm run verify` doit passer avant.

### B. Démarrage court et registre de travail

1. Lis `AGENTS.md`, `docs/INDEX.md`, le design lié et les sections pertinentes de
   `08-EXPLORATION.md`, `09-MAPS-CHAPTER-1.md`, `ART-DIRECTION.md`, `ART-PIPELINE.md`,
   `REFERENCES.md`, `UI-DESIGN-SYSTEM.md`, ADR 0004/0013/0016. Ne charge pas tous les
   dialogues ni tous les fichiers du dépôt dans le contexte de l'orchestrateur.
2. Relève `git status`. À la rédaction, `src/chapter.ts`, le manifeste des illustrations
   et `public/assets/portraits/` comportaient des changements utilisateur. L'état réel
   au lancement prime : préserver tous les changements préexistants, aucun reset/stash global.
3. Crée `.dream-loop/` et ajoute ce seul chemin au gitignore. Sous-dossiers : `baseline/`,
   `targets/`, `reviews/`, `metrics/`, `handoffs/`. Masters lourds dans `art-masters/`.
4. Garde une mémoire courte dans `.dream-loop/status.md` : jalon actif, contrats décidés,
   propriétaires de fichiers, travaux terminés, trois risques, prochaine action.
   Les décisions durables et la provenance des assets vivent dans `docs/`, pas uniquement
   dans ce dossier ignoré ni dans la conversation.
5. L'audit initial existe dans le design. Vérifie ses points utiles, ne le recommence pas
   entièrement. Ne présente pas une capture de développement headless comme une mesure GTX 1070.

### C. Délégation et propriété des fichiers

Utilise `collaboration.spawn_agent` avec **`model: "gpt-5.6-terra"` et `fork_turns: "none"`**,
ou l'équivalent de l'environnement. Fournis un brief autonome court, les chemins nécessaires,
les contrats et les exclusions. `reasoning_effort: "high"` pour architecture/rig/intégration ;
`"medium"` pour données et vérification cadrées. Si le modèle n'est pas disponible, annonce
ce blocage avant de substituer silencieusement un modèle plus cher.

Maximum **trois agents Terra actifs plus l'orchestrateur**. Réutilise les agents par suivi
de tâche pour conserver leur contexte utile. Pas de sous-délégation en cascade. Ne crée pas
de tâches Codex dans la barre latérale : ce sont des sous-agents de la mission courante.

| Rôle          | Propriété exclusive proposée                                                                                    | Livrable                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Intégrateur   | `exploreView.ts`, `exploreSession.ts`, `render/exploration/dressing.ts`, contrats partagés, docs d'architecture | Interfaces, montage, caméra, coupe/découverte/picking, lifecycle, intégration et vérification finale |
| Environnement | `render/exploration/materials.ts`, `architecture.ts`, `props.ts`, `atmosphere.ts`, assets d'environnement       | Kit modulaire, matières peintes, éclairage/effets locaux, performance des répétitions                |
| Personnages   | `render/exploration/cadetRig.ts`, chargeur/cache/acteurs associés, profils visuels et assets de personnages     | Base humanoïde, variantes, clips, PNJ et poses, validation en mouvement                              |
| Implantation  | `data/maps/holt.ts`, `centre-examen.ts`, `data/exploreVisuals/*`, doc des cartes                                | Plans, emprises, portes, apparitions, ancrages et habillage ; tests de contenu concernés             |
| Vérification  | scripts de captures/mesures, tests pertinents, rapport de revue                                                 | Parcours, contrôles DOM/état, mesures, captures regroupées                                           |

Ces cinq rôles ne tournent pas simultanément. Exemple de vagues :

1. Intégrateur : contrat/ADR ; implantation : nouveaux plans ; personnages : outils/assets.
2. Contrats et plans figés : environnement + personnages + implantation construisent leurs
   modules sans écrire les fichiers de l'intégrateur. Celui-ci est inactif à ce moment.
3. Intégrateur assemble ; environnement et personnages corrigent leurs modules en parallèle
   sur des demandes précises, sans toucher les branchements partagés.
4. Intégrateur gère les raccords ; implantation étend les cartes ; personnages termine les
   variantes/PNJ. L'environnement reprend un créneau quand l'un de ces rôles se libère.
5. Vérification indépendante + corrections ciblées ; intégrateur seul responsable du check
   final après synchronisation de toutes les écritures.

Tous partagent le workspace. Ne pas appliquer des commits ou cherry-picks à des changements
déjà présents. Ne jamais avoir deux propriétaires simultanés de `exploreView.ts`,
`exploreSession.ts`, des contrats ou d'un même fichier de carte. Un agent propose une
modification hors de sa zone par message au propriétaire ; il ne la réalise pas lui-même.

Gabarit du brief de chaque agent :

```text
Mission : [résultat mesurable d'un lot borné]. Modèle Terra ; pas de sous-agent.
Lis : AGENTS.md, docs/INDEX.md, [2–4 documents/sections], [contrat figé].
Tu possèdes : [liste exacte des fichiers/dossiers].
Ne modifie pas : [fichiers partagés et fichiers utilisateur].
Entrées : [types, cibles, dépendances, graine].
Sorties : [modules/assets/rapport] ; terminé lorsque [critères].
Préserve : découverte, emprises, RNG, picking, animations/états selon ton périmètre.
Vérifie : [contrôle ciblé utile]. Pas de suite complète ni capture hors mandat.
Rapport ≤ 12 lignes : fichiers, comportement livré, contrôles réellement exécutés,
résultats, limites, dépendance/blocage, prochaine action pour l'intégrateur.
Dépose le détail nécessaire dans .dream-loop/handoffs/[lot].md.
```

### D. Jalon 0 — décisions et faisabilité avant la production coûteuse

L'intégrateur formalise un ADR au prochain numéro libre et met à jour les documents
artistiques : atlas peints légers, habillage séparé, modèles/animations, éclairages locaux
bornés si retenus. Ne pas laisser l'interdiction ancienne des textures contredire le code.
Le contrat d'habillage inclut emprise, suppression des blocs remplacés, propriétaire de
visibilité, lien d'entité, ancrages de sièges/interactions et propriété des ressources.

L'agent implantation propose les plans complets, en commençant par le dortoir/couloir/cantine.
Exige routes principales évidentes, passages pour le groupe, espaces pour de vrais lits et
tables, points de conversation et cadrages depuis les quatre orientations. Valide le plan
avant que les agents ne produisent tous les assets à ses dimensions.

L'agent personnages vérifie les outils **réellement disponibles**, les assets et licences.
Lors de l'audit : aucun GLB/GLTF/FBX de personnage dans le dépôt, aucun Blender ou
gltf-transform trouvé sur le PATH. Cela n'établit pas leur absence de toute la machine.
Résoudre tôt le pipeline : base riggée redistribuable vérifiée, ou création locale avec
outillage approprié. Documenter source, licence, modifications, triangles, clips et taille.
Ne pas supposer qu'un outil image crée automatiquement un GLB animé. Ne pas considérer
l'installation d'un outil comme une preuve de qualité ou comme le livrable.

L'orchestrateur choisit entre les propositions concrètes en s'appuyant sur une silhouette
et une marche de Franklyn démontrées. Si une dépendance exige un achat, un compte ou une
action utilisateur indispensable, terminer les préparatifs utiles et expliquer précisément
ce besoin. Le reste du travail indépendant peut continuer, sans annoncer les personnages finis.

### E. Jalon 1 — références et cibles dream-loop

Le processus ci-dessous est l'adaptation spécifique à HOLT. Ne lance pas en parallèle un
second workflow autonome Plus/Pro qui réorganiserait les agents ou changerait le périmètre.
Si tu invoques littéralement le skill dream-loop, choisir un seul workflow selon ses règles,
en respectant les présentes instructions explicites et la limite de trois agents.

1. Un agent de capture prend une petite série de référence sur le vrai jeu : dortoir,
   cantine, salle 1 ; même graine et viewport. Utilise l'API de debug existante pour l'état,
   les contrôles réels pour le cadrage. Enregistre URL, état, caméra/rotation/zoom,
   viewport/DPR, temps visuel, version des assets et paramètres du renderer.
2. Après reconstruction du nouveau plan en blockout, capture le **nouveau cadrage jouable**.
   Les changements de plan sont autorisés ; la cible est fondée sur ce cadrage et sur
   l'identité des références d'origine. Ne pas générer une pièce impossible à raccorder.
3. L'orchestrateur, ou un agent artistique désigné, lit le skill imagegen et génère la
   cible à partir de cette capture et des références locales pertinentes. Ne pas détourner
   l'outil image vers de la modélisation 3D. Si l'outil est indisponible, conserver les
   captures et le brief et signaler que le jalon cible attend une source visuelle.
4. Verrouille `.dream-loop/target.png` (dortoir + seuil), une référence personnage dans
   `.dream-loop/targets/franklyn.png`, puis une cible secondaire du centre lorsque son
   blockout est prêt. Pas de série de dix variantes de goût sans décision.

Brief de cible principale, à adapter aux images fournies :

```text
Édite cette capture du jeu HOLT en une véritable cible de capture de gameplay 3D
orthographique, isométrique, dans un CRPG cyberpunk pictural. Garde exactement le
cadrage, les voies de circulation, les portes et le mobilier du nouveau blockout.
Conserve l'interface française « Encre rouge » et ses zones libres. Académie NCPD
isolée dans les Badlands : béton clair peint, ombres bleu pétrole, soleil désertique
chaud, contrôle d'accès, surveillance, conduites techniques, appareils de neuroport.
Dortoir habité et ordonné, lits et casiers reconnaissables, traces personnelles
discrètes. Matières peintes en grandes touches stables, géométrie stylisée crédible,
profondeur et ombres de contact. Franklyn est un vrai cadet humain stylisé en uniforme
bleu-noir, cheveux châtains courts, petite interface neurale, silhouette lisible.
Pas de cubes ou capsules de placeholder. Pas de photo, de cadrage cinématographique,
de peinture 2D remplaçant le monde, de profondeur de champ ni de néon rose généralisé.
Les pièces non découvertes restent vides visuellement et sombres. Aucun nouvel
élément interactif ou texte inventé. Toutes les formes doivent pouvoir être reconstruites
en meshes et matières légers, visibles sous quatre orientations.
```

Avant de verrouiller, vérifier que l'image respecte le plan, la découverte et l'échelle.
Si elle hallucine une porte ou un personnage supplémentaire, corriger la cible, pas le
gameplay pour lui obéir. Une cible centre et une planche de personnage utilisent leurs
propres briefs, pas un recyclage aveugle de celui du dortoir.

### F. Jalon 2 — tranche pilote réellement jouable

Assembler dans le vrai chapitre : dortoir et seuil du couloir recomposés, cadrage initial,
kit architectural, matériaux peints, mobilier, éclairage et Franklyn animé.

**Personnages** : `GLTFLoader`/`AnimationMixer` ou pipeline équivalent vérifié ; clones
skinnés indépendants, base commune, profils par personnage, racine contrôlée par le gameplay,
fondus entre animations et vitesse calée sur la distance parcourue. Le déplacement actuel
fait 4 cases de 1 m par seconde : choisir une locomotion adaptée, pas une marche lente qui
glisse. Aucun changement silencieux à cette vitesse de gameplay pour cacher un mauvais clip.
Un éventuel changement de vitesse est une décision de design séparée et testée.

Garder les six états de `CharacterRig` ; poses `sit`, `lean` et gestes `talk`, `inspect`
dans une capacité privée d'exploration. Relier les PNJ de carte à la fabrique de rigs :
aujourd'hui, ils sont des marqueurs statiques distincts du leader et des équipiers.
Prévoir chargement et repli temporaires propres, jamais une scène vide en attendant le GLB.
L'activation initiale du jeu attend les assets nécessaires ou affiche un état de chargement
français explicite ; le repli n'est pas la qualité finale promise.

La pose assise des figurants peut être visuelle. Pour Franklyn, `seat` ouvre actuellement
le dialogue immédiatement : ne pas introduire de délai ou d'effet de jeu via une animation.
Une éventuelle transition visible avant dialogue nécessite un événement de présentation
explicitement conçu, annulation sûre et sauvegardes inchangées ; elle n'est pas requise
pour livrer les figurants assis et une locomotion convaincante.

**Environnement** : surfaces et props déterministes, modules partagés, objets de plusieurs
cases cohérents, aucune décoration solide sur une allée libre. Les cartes redessinées
doivent passer leur validation d'accès avant les captures coûteuses.

**Rendu** : objets, émissions, ombres et étiquettes obéissent à la même visibilité.
Les décors de murs suivent la coupe sous chaque angle. Le pick du sol et les cases
interactives généreuses restent utilisables. Les corps, cheveux et accessoires des cadets
conservent une silhouette lisible derrière les décors selon les règles existantes.

L'intégrateur produit une livraison assemblée ; l'orchestrateur compare une seule manche
de captures à la cible et observe une courte marche réelle. Liste au maximum les trois
écarts visuels dominants, attribue-les à leurs propriétaires, puis corrige en lot.

### G. Jalon 3 — généraliser sans perdre la qualité

Étendre à toutes les salles de l'académie puis au centre, aux six cadets, aux figurants et
instructeurs. Les objets interactifs ont de vrais modèles sémantiques ; les deux véhicules
ne sont plus des piles de cubes par case. Ajouter poses de conversation et d'occupation
des postes, phases d'idle variées, feuilles/poussière/écrans discrets.

Vérifier les états narratifs qui modifient les présences : réveil, examen, temps libre,
groupe après tirage, centre. Un ancien et un nouveau modèle du même cadet ne doivent pas
apparaître ensemble. Respecter le roster variable et l'équipement visible réel.
Les chiens ou autres entités non humaines conservent leur identité : la fabrique de
personnages ne transforme pas tous les `npc` en cadets humains.

Réutiliser le kit, sans recopier des centaines de coordonnées dans le renderer. Regrouper
les répétitions par matériau ET visibilité de pièce ; vérifier les fuites lumineuses
et les marques au sol dans les pièces encore inconnues. Documenter tout déplacement
d'objectif ou de spawn, et faire migrer les anciennes données si nécessaire.

### H. Vérification proportionnée et boucle de correction

L'agent vérification pilote le jeu via `__game` et assertions DOM pour la logique. Les
captures servent à juger composition, lisibilité, matière, silhouette et occlusion.

- Un petit lot de tests de contenu vérifie globalement : références de pièces/entités,
  emprises compatibles, accès aux interactions, absence de doublons, correspondance de
  la cour. Réutiliser les validateurs existants ; ne pas ajouter un test par chaise.
- Contrôler réellement la sélection d'un PNJ, un siège, une porte, un terminal et un
  déplacement à la souris : l'API debug seule ne prouve pas que le nouveau mesh est cliquable.
- Reprendre les parcours e2e complets existants du chapitre et de l'exploration ; ajouter
  seulement les assertions qui attrapent une nouvelle régression réelle.
- Une manche de captures par lot intégré : cible au cadrage verrouillé, angle opposé,
  pièce cachée ; pour la validation finale, couvrir les quatre orientations, la cantine
  habitée, le centre, la transition tactique et 1280 × 720 avec le HUD. Répartir ces vues
  en une petite matrice, sans produit cartésien de tous les états et toutes les tailles.
- Observer marche, virage, arrêt, idle et pose assise en mouvement. Une belle capture
  immobile ne valide pas l'animation. Réduire les mouvements décoratifs avec l'option système.
- Relever performances avant/après : même parcours, même GPU, même viewport/DPR, après
  chargement et chauffe ; temps d'image médian/p95, appels de dessin, triangles, ressources
  et taille des assets. Vérifier plusieurs entrées/sorties de cartes pour la mémoire.
- L'intégrateur exécute `npm run verify`, puis les e2e pertinents, **après les dernières
  écritures**. Les agents exécutent seulement leurs vérifications ciblées pendant les lots.
  Distinguer une panne préexistante, un défaut nouveau et un problème d'environnement.

Maximum trois écarts visuels actifs et deux passes correctives prévues par lot. Si le
résultat stagne, changer la solution technique sur la base d'un diagnostic concret ; ne
pas lancer automatiquement une nouvelle génération d'image ou demander plus de variations.
Ce budget de revue n'autorise pas à appeler « terminé » un résultat insuffisant. Continuer
les travaux nécessaires dans le périmètre, ou rapporter précisément une dépendance externe
qui rend la suite impossible. Si l'utilisateur donne une limite de temps/jetons, la suivre
et sauvegarder l'état au jalon atteint sans abaisser artificiellement les critères.

### I. Critères de fin et livraison

Terminé signifie : deux cartes habillées et recomposées, ensemble des personnages visibles
traité, animations convaincantes, identité cyberpunk/picturale évidente, parcours conservé,
aucune fuite des pièces cachées, pas de mesh solide traversé, quatre rotations utilisables,
vérifications rapportées et ressources gérées. Appliquer aussi la grille visuelle du design.

Mettre à jour les documents impactés, la provenance/licence des assets et les contrats de
debug si ceux-ci ont changé. Ne pas déclarer « GTX 1070 / 60 fps validé » sans cette mesure.
Ne pas laisser la cible générée se faire passer pour la capture du jeu implémenté.

Réponse finale courte : résultat, quelques vraies captures avant/après, chemins des
principaux livrables, vérifications exécutées, mesure de performance disponible, limites
concrètes restantes. Ne pas recopier les comptes rendus de tous les agents ni leur historique.
