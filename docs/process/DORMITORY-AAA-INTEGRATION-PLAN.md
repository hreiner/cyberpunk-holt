# Intégration du décor du dortoir AAA — plan d'exécution

30 septembre 2026. Plan préparé à la demande du propriétaire avec deux agents
**GPT-6 Luna (`gpt-6-luna`)** : analyse du rendu et analyse du raccord au gameplay.
Statut : **D0–D5 réalisés le 30 septembre 2026 ; intégration livrée et vérifiée**.

Clôture : `npm run verify` passe (748 tests), les huit tests navigateur ciblés
passent, p95 ≤ 16,8 ms à 1080p sur GTX 1070 en DPR 1 et 1,5, trois cycles de carte
sans croissance mémoire. [Rapport, captures et limites](../art/DORMITORY-AAA-INTEGRATION-REVIEW.md).

Références : [étude et commandes du pilote](../design/10-DORMITORY-AAA-STUDY.md),
[cible et revue](../art/DORMITORY-AAA-REVIEW.md),
[séparation du banc d'étude, ADR 0034](adr/0034-dortoir-etude-visuelle-autonome.md).

## 1. Résultat attendu et périmètre

Le vrai dortoir de HOLT reprend la qualité du décor de `dormitory-aaa.html` : lits
superposés détaillés, literie, casiers, bancs, affaires personnelles, béton et métal
texturés, lumière et ombres qui donnent de la profondeur. Il reste jouable dans le
chapitre, avec la découverte, les interactions, le HUD et les sauvegardes existants.
Sa variante `holt-nuit` reprend le même mobilier avec son ambiance nocturne.

La cible est **30 ips à 1920 × 1080 sur GTX 1070**, d'abord à DPR 1. Les personnages,
rigs et animations sont développés séparément par le propriétaire. Ils apparaissent
dans les mesures du jeu réel, mais leurs assets et leur code sont hors mission.
La généralisation aux autres salles et cartes suivra une mission distincte, estimée
dans [EXPLORATION-DECOR-ROLLOUT.md](../art/EXPLORATION-DECOR-ROLLOUT.md).

Le plan conserve la caméra orthographique, ses quatre orientations et les cartes
actuelles. Les contrôles, observations locales, caméra portrait, pathfinding et
renderer du pilote autonome ne deviennent pas ceux du chapitre.

## 2. Adaptation retenue

| Élément          | Pilote AAA                                       | Intégration dans le jeu                                              |
| ---------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| Pièce            | 15 × 12 m, coordonnées monde locales             | `dortoirs`, 25 × 15 cases, x=26–50 / y=1–15                          |
| Lits             | 5 superposés                                     | 8 emplacements actuels, modèle superposé adapté à chaque emprise     |
| Emprise d'un lit | Environ 1,8 × 2,9 m                              | Catalogue 2 × 3 cases, soit 3 × 2 après rotation 90°/270°            |
| Casiers          | Rangées propres au pilote                        | Deux rangées existantes ; case interactive conservée                 |
| Fenêtres         | Mur ouest ouvert sur les Badlands                | Ouvertures et habillage compatibles avec les murs extérieurs réels   |
| Rendu            | Perspective, bloom, reflet planaire, ombre 4096² | Rendu du chapitre enrichi progressivement, effets mesurés séparément |

Les huit ancres de lit restent en place. Leur hauteur et leurs détails reprennent
les superposés du pilote ; la revue doit vérifier que cette densité reste lisible.
Les affaires au sol restent dans les emprises bloquées ou sous les meubles.
Un détail réellement posé dans une allée ne peut pas devenir un obstacle uniquement
visuel. L'ASCII de `MapDef` reste la vérité de collision.

Points fixes à conserver : apparition de Franklyn `(29,5)`, casier `dortoir.casier`
`(35,2)`, figurants `(39,8)` et `(41,11)`, porte ouest `(25,7)`, seuils sud `(31,16)`
et `(44,16)`. Le mur ouest borde le couloir : y copier les fenêtres du pilote
fabriquerait une façade incohérente. Les ouvertures visuelles n'altèrent pas l'ASCII.

Les modèles `bed-cadet` et `locker-bank` servent aussi dans les conduits. Ajouter
`dormitory-bunk` et `dormitory-locker-bank`, avec les mêmes emprises, puis les employer
seulement dans les placements du dortoir HOLT. `holt-nuit` les hérite déjà depuis
`HOLT_VISUALS`. Ajouter un autre modèle dédié seulement si un meuble le nécessite ;
ne pas modifier un modèle partagé pour améliorer cette seule pièce.

Dans `holt-nuit`, l'entité `dortoir.casier` est absente : `withoutOrphanEntity()`
retire son lien au placement hérité, qui reste du décor inerte. Le casier interactif
reste propre à HOLT au réveil. La découverte est également distincte par carte :
avoir découvert `holt:dortoirs` ne révèle pas `holt-nuit:dortoirs`. Vérifier le
dortoir nocturne avant puis après une entrée effective dans cette pièce.

## 3. Architecture et contrats de travail

Chaîne conservée : `MapDef` → placements `ExploreVisualMapDef` → `ExploreDressing`
→ `EnvironmentPropFactory` → `ExploreView` → boucle de `ExploreSession`.

- Extraire le kit dans `src/render/exploration/dormitoryKit.ts` et les ressources
  de matière dans `dormitoryMaterials.ts` — noms proposés. La factory existante
  distribue les nouveaux modèles ; aucune seconde scène de production.
- Réemployer `public/assets/dormitory-aaa/material-atlas.jpg` et son attribution.
  Les quatre textures ont un repli immédiat pendant le chargement. Le constructeur
  synchrone du monde reste utilisable ; une image arrivant après `dispose()` ne
  réactive pas une ancienne vue. Nommer le propriétaire de chaque ressource.
  Ce repli et la protection des chargements tardifs sont à implémenter : le pilote
  autonome attend son atlas avec `await` et ne fournit pas déjà ces garanties.
- Le kit reçoit le `Rng` visuel et les matériaux ; il construit des objets locaux
  à l'ancre. La factory applique translation et rotation comme pour les autres
  modèles. Aucun accès au `RunState`, au DOM ou aux règles dans les données visuelles.
- Garder les regroupements statiques par **pièce, étape et conditions de visibilité**.
  Les placements liés à une entité restent séparés pour le picking. Ne pas reprendre
  la fusion globale du pilote, qui empêcherait de masquer indépendamment les pièces.
- Sol, finitions murales et effets du dortoir ont un profil explicitement limité
  aux cartes `holt`/`holt-nuit` et à `roomId: 'dortoirs'`. Les autres cartes gardent
  leur profil. Les ornements muraux suivent la coupe des murs dans les quatre vues.
- La découverte masque aussi contacts, émissions, poussière, éclairage et reflets.
  L'ambiance de nuit reste pilotée par `setNightMood`, sans deuxième soleil de jour.
- Si le compositeur est nécessaire, un module de rendu possède ses passes et ses
  cibles. `ExploreSession` possède son cycle de vie : changement de carte, resize,
  pause/reprise, reset et destruction. La conversion de couleur et le tone mapping
  ne sont appliqués qu'une fois. Les profils sans effets gardent le rendu direct.
- `exploreRenderStats()` garde son contrat. Avec plusieurs passes, ses compteurs
  couvrent l'image complète : reset unique avant le rendu, sans reset entre passes.
  Le calcul des temps d'image reste dans l'outil de mesure de développement.

Au lot D0, écrire un ADR au **prochain numéro libre**, sans modifier la portée de
l'ADR 0034 qui décrit le pilote isolé. Consigner le profil limité à une pièce, le
réemploi du kit et la propriété des ressources ; compléter l'ADR si le compositeur
entre effectivement dans la production. Aucun numéro n'est réservé ici.

Décision écrite à l'exécution : [ADR 0035](adr/0035-decor-dortoir-integre.md).

## 4. Lots et responsables

L'orchestrateur pilote deux rôles Luna. Les modifications des fichiers d'intégration
sont séquencées ; les relectures peuvent avancer pendant un lot de production.
Les agents ne committent pas et n'élargissent pas la mission aux autres niveaux.

| Lot                                          | Responsable                                  | Livrable et fichiers principaux                                                                               | Condition de sortie                                                                                                                      |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **D0 — Référence et contrats**               | Orchestrateur                                | État Git, références réelles, contrat des modules, ADR, mise à jour du dortoir dans `ROOM-COMPOSITION.md`     | Ancres et ressources fixées ; changements utilisateur identifiés ; référence avant intégration reproductible                             |
| **D1 — Kit et matières**                     | Luna A, environnement                        | `dormitoryKit.ts`, `dormitoryMaterials.ts`, raccord contrôlé à `materials.ts`                                 | Lit superposé et casier construisibles dans leur emprise ; textures et repli fonctionnels ; propriété/libération explicites              |
| **D2 — Mobilier dans HOLT**                  | Luna B, intégration                          | `exploreVisualModels.ts`, `exploreVisuals/holt.ts`, `props.ts`, raccord minimal à `dressing.ts` si nécessaire | Huit lits, casiers et détails visibles dans le chapitre ; allées, cibles et cases conservées ; modèles partagés ailleurs inchangés       |
| **D3 — Architecture et lumière**             | Luna B, avec kit fourni par A                | `exploreView.ts`, profil de pièce, ajustements limités d'`atmosphere.ts`                                      | Sol/murs/fenêtres cohérents avec le vrai plan ; coupe correcte ; profondeur et contacts lisibles ; aucun effet révélant une pièce cachée |
| **D4 — Nuit, traitement de l'image et coût** | Luna B ; mesures par A                       | Raccord `setNightMood`, `exploreSession.ts` et module de passes si nécessaire ; rapport de mesures            | Jour/nuit cohérents ; chaque effet retenu tient le budget ; resize et changements de carte libèrent les ressources                       |
| **D5 — Revue et livraison**                  | Luna A, vérification ; clôture orchestrateur | Tests existants, corrections par le propriétaire du fichier, captures réelles, rapport et docs                | Parcours et clics conservés ; vérifications finales passent ; performances mesurées et limites documentées                               |

Ordre : **D0 → D1 → D2 → D3 → D4 → D5**. D2 peut préparer ses données en lecture
seule pendant D1, mais ne raccorde pas un contrat encore instable. Luna B est seul
à écrire `exploreView.ts` et les données d'intégration ; le propriétaire de `props.ts`
est explicitement transféré à Luna A pour le correctif de libération des géométries.
L'orchestrateur prend en charge `ExploreSession` et le PMREM ; Luna A est seul à écrire
ses modules de kit/matières. Toute correction traversant
cette frontière revient au propriétaire du fichier.

### Conduite du rendu en D3–D4

1. Établir la qualité du mobilier, des matières, du sol et des contacts avec le
   rendu direct actuel. Ne pas masquer une mauvaise composition par des effets.
2. Ajuster la couverture des ombres à la zone visible si nécessaire. Ne pas passer
   automatiquement toute la carte 52 × 64 à une ombre 4096². Tester aussi le dézoom
   et les rotations ; une fenêtre d'ombre mobile ne doit pas produire de sauts.
3. Réemployer un environnement de matière partagé si les métaux manquent de reflets,
   puis mesurer bloom contenu et poussière localisée, un effet à la fois.
4. Évaluer le reflet planaire seulement si le sol reste sensiblement en retrait.
   Au maximum une surface du dortoir, active uniquement lorsqu'elle est visible,
   avec résolution plafonnée. Sa passe respecte découverte et coupe des murs.
   S'il dépasse le budget, conserver une approximation de matière et consigner l'écart.

Le reflet planaire n'est pas une obligation technique : la qualité du décor, sa
lisibilité en jeu et la cadence décident. La scène autonome reste disponible comme
référence ; elle n'est pas réécrite pour faciliter la migration.

## 5. Validation utile

### Données et parcours

Réemployer `exploreVisualPlacements.test.ts` pour les emprises, chevauchements,
remplacements et modèles réellement utilisés. Ajouter un contrôle global ciblé
sur le périmètre des nouveaux modèles : seulement HOLT/HOLT-nuit, pièce `dortoirs`.
Réemployer `holtMap.test.ts`, `exploreState.test.ts`, `runStateDiscovery.test.ts`
et `ch2ExploreScenes.test.ts` ; aucun nouveau test de règle n'est nécessaire si les
règles ne changent pas. Pas de tests qui recopient les détails des géométries.

Le parcours `explore.spec.ts` valide le raccord du chapitre 1 ; `chapter2.spec.ts`
protège le bal et la fuite sur la variante nocturne. Ajouter la vérification du
vrai clic sur le casier et de la sortie du dortoir au parcours existant si elle
n'est pas déjà couverte, sans créer une spécification par meuble. L'état se lit
par `window.__game` ; quelques vrais clics restent nécessaires pour le raycast.
`dormitory-aaa.spec.ts` vérifie seulement la scène autonome.

Recette de revue du jeu : `npm run dev`, puis
`http://localhost:5173/cyberpunk-holt/?scene=ch1.vers-cantine&seed=dormitory-integration`.
Depuis le spawn, examiner le casier, quitter la pièce et rejoindre la cantine.
Contrôler un retour de dialogue, une reprise de sauvegarde et le parcours nocturne.
Les touches du chapitre restent celles de `08-EXPLORATION.md`, pas celles du pilote.

### Revue visuelle et performance

Conserver l'état, la graine, la caméra, le zoom, le viewport et le DPR de chaque vue.
Une manche courte à D0 établit l'avant ; une à D5 juge le résultat. Vues décisives :
dortoir de jour, orientation opposée, nuit, seuil vers une pièce inconnue, vue large
avec plusieurs pièces découvertes. Vérifier les quatre orientations en mouvement
et le HUD à 720p, sans multiplier les captures pour des assertions de logique.

Mesurer sur un build de production et un Chromium utilisant réellement la GTX 1070.
Consigner navigateur, GPU rapporté, pilote, build et DPR. SwiftShader ne certifie pas
la cible matérielle. Après chargement et échauffement, relever au moins 600 images
par situation : dortoir jour, nuit et vue large chargée. Noter médiane/p95/p99 des
intervalles d'image, appels de dessin et triangles de toutes les passes, géométries,
textures et poids ajouté des assets. Les intervalles RAF mesurent la cadence livrée,
pas le temps GPU isolé ; le temps CPU de `render()` n'est pas un temps GPU.

Critère : **p95 ≤ 33,3 ms à 1080p/DPR 1** sur les situations retenues. Documenter
les pointes p99 et les éventuels chargements. Mesurer également au DPR effectif du
jeu, plafonné aujourd'hui à 1,5 : s'il dépasse la cible, D4 peut fixer un DPR adapté
pour le profil HOLT/HOLT-nuit dans `ExploreSession`, puis remesurer et documenter
ce choix. Le profil doit être réinitialisé aux changements de carte. Modifier le
DPR global de `createGameRenderer`, partagé avec les autres rendus, est hors mission.
Le budget comprend les personnages actuellement présents, sans les modifier.

Après échauffement des caches, répéter les transitions HOLT → centre → HOLT-nuit
au moins trois fois et comparer les compteurs après les mêmes retours de carte.
Une croissance continue exige une correction ; une allocation ponctuelle de cache
doit être identifiée. Vérifier resize, pause de dialogue, reprise et reset du monde.

Après les dernières corrections :

```text
npm run verify
npm run test:e2e -- tests/e2e/explore.spec.ts tests/e2e/chapter2.spec.ts --workers=1
```

Le rapport final sépare critères atteints, mesures et limites. Les anciennes mesures
du pilote, dont la revue finale est encore incomplète, ne valident pas l'intégration.

## 6. Protection du travail parallèle et clôture

Avant chaque lot, relire `git status` et les différences des fichiers à écrire.
Préserver les travaux du propriétaire dans `public/assets/mixamo/`,
`tools/characters/`, les rigs et modules de personnage, notamment
`src/dev/dormitoryFranklyn.ts`, `cadet*`, `franklynExo*` et `mixamoRetarget.ts`.
Ne pas copier les personnages du pilote dans les factories du chapitre.

Le repli technique consiste à désactiver le profil enrichi et restaurer les anciens
IDs de modèles par un correctif limité aux fichiers du lot. Les données de jeu et
sauvegardes n'ayant pas changé, aucune migration n'est prévue. Pas de reset Git,
de nettoyage global ni de remplacement des changements utilisateur.

Livraison : décor intégré, instructions pour le tester, captures avant/après,
résultats des vérifications, chiffres de performance, provenance et note de reprise
pour l'extension aux autres pièces. Mettre à jour l'index, la composition du dortoir,
le design visuel et l'estimation de généralisation avec les coûts observés.

Le résultat et les chiffres de livraison sont conservés dans
[la revue d'intégration](../art/DORMITORY-AAA-INTEGRATION-REVIEW.md). Les corrections
de mémoire concernent également les ressources de décor et marqueurs antérieures,
ainsi que la libération des textures GPU des squelettes privés aux vues ; aucun
modèle ou animation de personnage n'est modifié.

L'enveloppe initiale reste **2–3 journées de développement concentré**, à recalibrer
après D2 et les premières mesures ; ce n'est pas une durée garantie d'agents Luna.
Un changement de caméra ou de plan demanderait un autre lot, hors de cette estimation.

## 7. Brief commun prêt à transmettre aux agents Luna

> Lis AGENTS.md et docs/INDEX.md, puis ce plan et les documents de design concernés.
> Intègre uniquement le décor du dortoir HOLT et son héritage nocturne. Utilise
> `gpt-6-luna`, respecte les fichiers attribués à ton rôle et les contrats fixés à D0.
> Préserve caméra, MapDef, interactions, découverte, progression et sauvegardes.
> Ne touche ni aux personnages ni aux animations ou à leurs outils/assets.
> Réemploie le kit du pilote AAA, adapté aux huit emprises existantes ; ne copie
> ni sa navigation ni ses contrôles ou son renderer autonome. Aléatoire seedé.
> Termine le lot avec un rapport court : fichiers changés, vérifications réellement
> exécutées, écarts et dépendance suivante. Signale un conflit de fichier avant
> d'écraser le travail d'un autre intervenant. Aucun commit ni publication automatique.
