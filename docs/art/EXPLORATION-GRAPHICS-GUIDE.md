# Créer une zone d'exploration avec le rendu actuel

Guide de production du décor, mis à jour le **3 octobre 2026**. Il décrit le moteur
livré et ses points d'extension. Les anciens plans de refonte restent des historiques ;
les [ADR 0039](../process/adr/0039-murs-exploration-entiers.md) et
[0040](../process/adr/0040-stabiliser-cout-entree-salle.md) fixent les murs et le coût
des entrées en salle. Le pipeline des personnages est documenté séparément dans
[CHARACTER-PIPELINE-FINDINGS.md](CHARACTER-PIPELINE-FINDINGS.md).

Deux skills du dépôt utilisent ce guide :

- [`holt-exploration-zone`](../../.agents/skills/holt-exploration-zone/SKILL.md) : créer ou habiller une pièce/carte.
- [`holt-exploration-review`](../../.agents/skills/holt-exploration-review/SKILL.md) : repérer et corriger les défauts visuels ou les ralentissements.

## Choisir un précédent

La qualité vient des volumes continus, des ouvertures crédibles, de la lumière et des
matières avant les petits accessoires. Garder une allée lisible entre l'apparition,
l'interaction principale et le prochain seuil. Le décor reste cyberpunk institutionnel :
béton coffré, acier peint, cadres renforcés, lecteurs d'accès et équipements ayant un usage.
Éviter le plafond et les objets suspendus au-dessus des passages.

| Besoin                                                     | Précédent à réemployer              | Preuve visuelle                                                                                  |
| ---------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| Salle habitée, béton poli, soleil chaud et fenêtres hautes | Dortoir et cantine HOLT             | [Dortoir](reviews/room-performance/dortoir.jpg), [cantine](reviews/room-performance/cantine.jpg) |
| Cour ouverte, végétation et eau localement réfléchissante  | Cour intérieure                     | [Cour](reviews/room-performance/cour.jpg)                                                        |
| Grand volume technique et accès de véhicule                | Garage/hangar, `hangarDetails.ts`   | [Hangar](reviews/room-performance/hangar.jpg)                                                    |
| Salle froide et usée, sol mat, progression par portes      | Centre d'examen, notamment `salle1` | [Centre](reviews/room-performance/centre.jpg)                                                    |
| Passage étroit, métal, cadrage très plongeant              | Conduits                            | [Conduits](reviews/room-performance/conduits.jpg)                                                |
| Extérieur nocturne et foyer chaud                          | Campement                           | [Campement](reviews/room-performance/campement.jpg)                                              |
| Variante du même lieu selon l'étape                        | HOLT-nuit et `etape` des placements | [Bal](reviews/room-performance/bal.jpg)                                                          |

Le [pilote autonome](../design/10-DORMITORY-AAA-STUDY.md) est une référence esthétique.
La production réemploie ses kits ; elle ne copie pas sa scène entière dans chaque carte.

## Les couches et les fichiers à modifier

Une case vaut **un mètre**. Les coordonnées de données sont `{ x, y }` ; le rendu les
convertit en X/Z centrés sur la carte. Utiliser `cellToWorld` pour les builders, plutôt
que de mélanger coordonnées ASCII et coordonnées monde.

| Couche                  | Source                                                                                                                         | Responsabilité                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Plan et interactions    | [`src/data/maps/`](../../src/data/maps/), [`MapDef`](../../src/explore/types.ts)                                               | ASCII, collisions, pièces, portes, entités, apparitions ; seule vérité du gameplay                |
| Mobilier et marquages   | [`src/data/exploreVisuals/`](../../src/data/exploreVisuals/), [`ExploreVisualPlacement`](../../src/data/exploreVisualTypes.ts) | Apparence, emprise, visibilité et lien vers une entité existante                                  |
| Catalogue des modèles   | [`exploreVisualModels.ts`](../../src/data/exploreVisualModels.ts), [`props.ts`](../../src/render/exploration/props.ts)         | Dimensions/occupation en données ; construction et ressources côté rendu                          |
| Enveloppe HOLT          | [`holtRoomProfiles.ts`](../../src/render/exploration/holtRoomProfiles.ts)                                                      | Côtés, fenêtres et régions de circulation                                                         |
| Sols/finitions HOLT     | [`holtRenderProfiles.ts`](../../src/render/exploration/holtRenderProfiles.ts)                                                  | Matière, répétition, lumière jour/nuit, famille de finition et panneaux                           |
| Autres cartes           | [`remainingExplorationProfiles.ts`](../../src/render/exploration/remainingExplorationProfiles.ts)                              | Même kit d'enveloppe/finitions, hauteurs, teintes et angle adaptés au lieu                        |
| Choix du profil         | [`explorationSceneProfiles.ts`](../../src/render/exploration/explorationSceneProfiles.ts)                                      | Active le rendu enrichi par identifiant de carte                                                  |
| Montage et cycle de vie | [`ExploreView`](../../src/render/exploreView.ts), [`ExploreSession`](../../src/exploreSession.ts)                              | Construire les kits, synchroniser la visibilité, renderer/composer, précompilation et destruction |

### Ajouter une pièce à une carte existante

1. Poser son rectangle intérieur, ses murs ASCII et ses véritables accès dans `MapDef`.
   Les rectangles de pièces excluent les murs. Relier apparition, portes et interactions
   par des cases accessibles ; deux interactions doivent garder au moins deux cases de distance.
2. Ajouter les placements du mobilier, leurs emprises et leur `roomId`. Ajouter le profil
   d'enveloppe aux quatre côtés et le profil de sol/finitions à la collection de cette carte.
   Pour HOLT, la collection utilisée est `HOLT_STAGED_ARCHITECTURE_PROFILES` ; modifier
   seulement le dictionnaire `HOLT_ARCHITECTURE_PROFILES` ne l'active pas.
3. Si la pièce porte un nouveau moment narratif, brancher ses entités et son objectif
   dans les données de chapitre. Le rendu ne crée aucun déclencheur.

### Ajouter une carte complète

Il n'existe pas encore un registre unique couvrant toutes les couches. Vérifier chacune :

| Inscription                        | Action                                                                                                                                                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/maps/index.ts`           | Importer la nouvelle `MapDef` et l'ajouter à `MAPS`                                                                                                                                                                               |
| `src/data/exploreVisuals/index.ts` | Définir `coldPalette` et éventuellement `exteriorGround` dans `EXPLORE_VISUALS`                                                                                                                                                   |
| Sélection du mobilier              | Passer la nouvelle `ExploreVisualMapDef` par `art.visuals` dans `ExploreSession.buildWorld` ; le dictionnaire actuel s'appelle `CHAPTER_2_VISUALS`. `ExploreView.visualDefinition()` ne connaît directement que HOLT et le centre |
| Sélection du rendu enrichi         | Ajouter l'`ExplorationSceneProfile` à `PROFILES` dans `remainingExplorationProfiles.ts`, ou un module dédié branché dans `explorationSceneProfile()`                                                                              |
| Accès narratif                     | Déclarer la scène `explore`, son `mapId`/`spawn`, l'objectif et les dialogues dans les données du chapitre ; voir [conception des chapitres](../chapters/README.md)                                                               |

Le repli d'une carte absente affiche un décor générique : il ne prouve pas que la
nouvelle carte bénéficie du rendu enrichi. `dormitoryArchitecture: true` est réservé à
la géométrie réelle de HOLT ; ce booléen ne transforme pas une nouvelle carte en dortoir.

**Carte nouvelle et chapitre nouveau sont deux travaux différents.** Le moteur courant
ne connaît que `ChapterId = 1 | 2`. Pour le chapitre 3, traiter d'abord les couplages
documentés dans [ENGINE-COUPLING.md](../chapters/ENGINE-COUPLING.md), dont le registre
`src/data/chapters/index.ts`, le démarrage URL dans `src/main.ts` et la reprise de
`RunState`. L'ajout de profils graphiques n'étend pas ces contrats narratifs/sauvegarde.

## Exemple minimal : un atelier autonome

Ce bloc est une base de **données à intégrer**, pas une scène enregistrée. Il montre une
pièce de 8 × 8 m, un banc de 3 × 1 m, une armoire interactive de 2 × 2 m et une porte.
Les trois exports doivent être branchés dans les registres ci-dessus. L'armoire porte
ici une réplique brève ; un moment à choix/effets demande un dialogue de chapitre enregistré.

```ts
import type { MapDef } from '@/explore';
import type { ExploreVisualMapDef } from '@/data/exploreVisualTypes';
import type { ExplorationSceneProfile } from '@/render/exploration/remainingExplorationProfiles';

export const WORKSHOP_MAP = {
  id: 'atelier-demo',
  title: 'Atelier de maintenance',
  ascii: [
    '##########',
    '#........#',
    '#.ooo....#',
    '#........#',
    '+........#',
    '#........#',
    '#.....TT.#',
    '#.....TT.#',
    '#........#',
    '##########',
  ],
  rooms: [{ id: 'atelier', title: 'Atelier', rect: { origin: { x: 1, y: 1 }, width: 8, height: 8 } }],
  entities: [
    { id: 'atelier.porte', type: 'door', cell: { x: 0, y: 4 }, label: 'Ouvrir la porte de l’atelier' },
    {
      id: 'atelier.armoire',
      type: 'object',
      cell: { x: 6, y: 6 },
      label: 'Examiner l’armoire',
      line: 'L’armoire contient les outils de maintenance.',
    },
  ],
  spawns: { entree: { x: 1, y: 4 } },
} satisfies MapDef;

export const WORKSHOP_VISUALS = {
  mapId: WORKSHOP_MAP.id,
  placements: [
    {
      id: 'atelier.banc',
      model: 'waiting-bench',
      roomId: 'atelier',
      cell: { x: 3, y: 2 },
      rotation: 0,
      footprint: [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ],
      replaces: [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ],
    },
    {
      id: 'atelier.armoire',
      model: 'secure-locker',
      roomId: 'atelier',
      entityId: 'atelier.armoire',
      cell: { x: 6.5, y: 6.5 },
      rotation: 0,
      footprint: [
        { x: 6, y: 6 },
        { x: 7, y: 6 },
        { x: 6, y: 7 },
        { x: 7, y: 7 },
      ],
      replaces: [
        { x: 6, y: 6 },
        { x: 7, y: 6 },
        { x: 6, y: 7 },
        { x: 7, y: 7 },
      ],
    },
  ],
} satisfies ExploreVisualMapDef;

export const WORKSHOP_SCENE_PROFILE = {
  architecture: [
    {
      id: 'atelier-shell',
      roomIds: ['atelier'],
      sides: ['north', 'south', 'east', 'west'],
    },
  ],
  rooms: [
    {
      id: 'atelier-finish',
      zoneId: 'atelier',
      roomId: 'atelier',
      visibility: 'discovered',
      floor: {
        material: 'dormitory:floor',
        repeatMeters: 4,
        roughness: 0.84,
        environmentGain: 0.16,
        reflectionGain: 0,
        tint: 0x777b7d,
      },
      lighting: {
        keyColor: 0xffd4aa,
        dayIntensity: 10,
        nightIntensity: 8,
        fillColor: 0xa8bac5,
        dayFillIntensity: 0.48,
        nightFillIntensity: 0.58,
      },
      finish: {
        family: 'maintenance',
        baseboardMaterial: 'dormitory:darkSteel',
        wallDeviceMaterial: 'dormitory:edgeSteel',
      },
    },
  ],
} satisfies ExplorationSceneProfile;
```

Les valeurs viennent du local technique HOLT : elles sont un départ à régler sous la
lumière réelle. Pour une pièce, garder `zoneId === roomId` : la sélection du réflecteur
actuel cherche le profil par identifiant de pièce. Pour un couloir sans `RoomDef`, définir
un `rect`, `visibility: 'always'` et une région architecturale `alwaysVisible: true`.

## Construire les murs, fenêtres et portes

Le trajet normal est `buildHoltArchitectureLayout` → `buildHoltWallGeometry` →
`createHoltArchitecture`. Le layout déduit les faces, voisins et portes du plan ; la
géométrie fournit un centre et une hauteur communs aux murs et à leurs finitions.

- **Hauteurs fixes** : façades et murs sur cour 4,9 m, cloisons 2,45 m ; conduits et
  campement 2,45 m partout. Employer les constantes de `holtWallGeometry.ts` ou
  `wallHeights` du profil, sans régler un mur en fonction du personnage ou de la caméra.
- **Raccords** : donner toutes les faces au builder commun ; son remplacement retire
  les cubes génériques concernés. Ne pas ajouter une seconde coque au même endroit.
  La réunion des doubles rangées ASCII est actuellement spécifique à `holt`/`holt-nuit`.
  Pour un nouveau plan, préférer une seule rangée de mur partagé. Une nouvelle topologie
  à doubles rangées demande une adaptation du calcul et une vérification dédiée.
- **Cour** : les noms `cour-interieure` et `cour` et les fenêtres `exterior: 'courtyard'`
  participent actuellement à la classification de hauteur. Une nouvelle cour nommée
  autrement exige de vérifier ce calcul ; un profil seul ne garantit pas ses façades hautes.
- **Fenêtres** : déclarer une ouverture sur une cellule de mur possédée par le profil,
  avec `cell`, `side`, `width`, `height`, `sillHeight` et `exterior`. Le précédent HOLT
  emploie 0,8 m × 1,52 m, avec une allège à 2,72 m : cela tient dans une façade de 4,9 m,
  pas dans une cloison de 2,45 m. Régler les dimensions à la hauteur réelle ; éviter
  angles et portes. Une fenêtre sur une autre pièce porte `viewRoomId` pour préserver
  la découverte de son contenu.
- **Portes** : une cellule `+` et une véritable entité `door` à cette cellule portent
  l'état. `holtArchitecture.ts` construit la géométrie et pilote le vantail ;
  `holtDoorFinishes.ts` choisit sa famille de matériaux. Ce choix dépend actuellement
  d'identifiants de pièces connus : une nouvelle pièce technique peut demander
  d'étendre cette sélection pour obtenir la bonne porte. Un décor spécialisé utilise `doorStateId` et, si nécessaire,
  `entityDoorLeaves` du builder pour remplacer le vantail commun ; suivre le précédent
  du ventilateur des conduits plutôt que superposer deux fermetures.

Les quatre orientations doivent montrer les mêmes raccords et les mêmes hauteurs,
avant comme après la découverte. Une porte ouverte conserve son encadrement.

## Poser des objets sans casser les interactions

Réemployer un modèle du catalogue avant d'en ajouter un. `solid` nécessite les cases
bloquantes correspondantes et `replaces` ; `flat` n'ajoute ni collision ni remplacement.
Les autres occupations (`vegetation`, `wall`, `threshold`, `overhead`) suivent leur
contrat dans `exploreVisualModels.ts`. Le moteur accepte des modèles suspendus historiques,
mais la direction actuelle exclut ceux qui couvrent les passages.

`footprint` décrit l'emprise du mesh, `replaces` retire seulement les placeholders
visuels `o`/`T` : aucun des deux ne modifie le chemin. Une rotation 90°/270° échange largeur
et profondeur. L'exception des meubles de `seat`/`npc` sur une case franchissable est
expliquée par le catalogue ; elle ne s'étend pas à tous les meubles interactifs.

Pour représenter un objet de scénario, lier le placement à son **`entityId` existant**.
Il reste un objet séparé pour le clic et suit la visibilité de l'entité. `roomId`
gouverne la découverte du décor ; `thresholdRoomId` gouverne une entité de contenu
posée sur un seuil. `etape` filtre un habillage temporaire sans modifier la carte.

Pour un modèle nouveau, ajouter son occupation/dimensions au catalogue et sa fabrique
dans `props.ts`, avec les ressources possédées explicitement. Réemployer les kits et
les matériaux partagés ; l'aléatoire décoratif vient d'un `rng.fork` et d'identifiants stables.

## Matières, lumière et reflets

[`DormitoryMaterials`](../../src/render/exploration/dormitoryMaterials.ts) fournit les
surfaces du pilote : béton, acier peint/chanfreiné/sombre, linge, tissu, bois et métal.
L'atlas local `public/assets/dormitory-aaa/material-atlas.jpg` remplace les textures
procédurales initiales. [`EnvironmentMaterials`](../../src/render/exploration/materials.ts)
porte les autres surfaces et sols photo. La couleur, le relief, la rugosité et la réponse
à l'environnement doivent distinguer béton, tissu et acier ; diminuer toute la rugosité
pour ajouter du brillant fait perdre cette distinction.

`HoltRenderProfile.floor` règle la répétition en mètres, la teinte, la rugosité, le gain
d'environnement et le gain de reflet. `finish.family` choisit un habillage existant
(`maintenance`, `canteen`, `training`, etc.) ; `finish.signText` porte une signalétique
murale française. Un marquage au sol est un placement de modèle `flat`, pas une nouvelle
API de decals. Toute nouvelle famille doit avoir un traitement dans `holtRoomRendering.ts`.

Les lumières de pièce combinent une source principale et un remplissage, chacun avec
des valeurs jour/nuit. Un matériau émissif donne l'apparence d'un écran ou d'un luminaire ;
il n'éclaire pas les surfaces voisines à lui seul. Construire les sources locales lors
du montage, puis laisser le système commun gérer visibilité et intensité.

Le rendu enrichi réemploie l'environnement PMREM, le tone mapping ACES et un bloom
modéré via `ExploreSession`. Un **seul réflecteur planaire de sol/eau est actif à la fois**,
sur la pièce occupée et découverte. `floor.reflectionGain` active le sol de cette pièce ;
`reflectionSurface` limite le reflet à une surface donnée, par exemple le bassin de la cour.
Ce mécanisme nécessite une carte branchée au rendu enrichi. Les reflets s'atténuent entre
les zooms 26 et 34 et s'éteignent à 34 ; les sols mats restent volontairement sans reflet.
Ne pas multiplier les passes planaire par meuble. Les noms des personnages restent dans
l'infobulle HTML au survol/clic, afin de ne pas apparaître dans les reflets 3D.

## Caméra, visibilité et coût de rendu

Les profils utilisent `DormitoryPerspectiveCamera` : FOV 39°, inclinaison usuelle
d'environ 55°, ou `cameraElevationDeg: 70` pour les conduits. `IsoCamera` conserve le
centre, le zoom et les quarts de tour. Projection écran, picking, anneaux et overlays
doivent utiliser **la même `renderCamera`**, synchronisée avant les calculs. La caméra
reste libre ; son déplacement ne déclenche aucun effacement de mur.

Une pièce inconnue conserve son enveloppe, ses portes et un sol sombre. Son mobilier,
ses entités, ses finitions et ses reflets restent cachés jusqu'à l'entrée. Ne pas
rendre une pièce `alwaysDiscovered` pour éviter de traiter ce contrat. Les anneaux
facultatifs et la balise d'objectif permanente suivent les entités visibles ; le repère
`Tab` peut indiquer la destination inconnue. `INTERACTION_MARKER_HEIGHT` vaut actuellement
0,05 m, au-dessus des finitions du sol à environ 0,035 m : garder cette séparation.

La cible acceptée est **30 ips à 1080p sur GTX 1070** (33,3 ms/image), avec une marge
utilisée pour la qualité. Ce budget continu et les pics de première entrée sont deux mesures
distinctes. Les relevés [du 3 octobre](EXPLORATION-ROOM-PERFORMANCE-REVIEW.md) à 1600 × 900
ont ramené les pics de 2,3–3,6 s à 17–67 ms sur 15 pièces ; ils ne garantissent pas ce coût
sur toute nouvelle scène ou tout appareil.

Préserver les mécanismes suivants :

- `createGameRenderer` centralise la préférence GPU, les ombres et le DPR plafonné à 1,5.
- `StableSceneLights` conserve un nombre stable de sources GPU : au plus huit emplacements
  ponctuels et un emplacement par projecteur. Les sources masquées deviennent d'intensité
  nulle ; ne pas ajouter/retirer des lumières lors d'une découverte. Le nombre de projecteurs
  reste un coût à surveiller, particulièrement avec des ombres.
- `ExploreSession.buildWorld` synchronise la visibilité, crée l'adaptateur de lumières et
  appelle `renderer.compile(scene, renderCamera)` sur le target du composer, puis restaure
  le target précédent. Les meshes cachés sont préparés sans être révélés. Les matériaux
  ou lumières ajoutés après cette préparation demandent de revoir ce point ;
  `compileAsync` n'est pas un remplacement neutre, son polling survit à une vue détruite.
- `ExploreDressing` instancie le mobilier statique par pièce/étape et combinaison de
  géométrie/matière/ombres, en conservant les entités cliquables séparées. Ne pas fusionner
  plusieurs pièces soumises à des découvertes différentes.
- Libérer l'adaptateur de lumières **avant** la vue. Le détenteur libère ses géométries,
  matériaux, textures et targets ; l'environnement partagé appartient à la session.
  Un `InstancedMesh` possède aussi un tampon d'instances à libérer par `dispose()`, même
  quand géométrie et matériau sont empruntés à une fabrique.

## Vérifier une livraison

Commencer par les données : `validateMap`, les tests globaux de cartes et d'emprises,
puis les états de découverte/portes via l'[API de debug](../process/DEBUG_API.md).
Utiliser `goToScene`, `explore`, `walkTo` et `interact` pour vérifier le parcours ; ne pas
déduire une réussite narrative d'une capture. `walkTo` est instantané et ne remplace pas
un parcours réel au clic pour le chemin ou le picking.

Faire ensuite une revue visuelle ciblée : pièce initiale, raccord le plus difficile,
porte ouverte, fenêtre sur pièce inconnue, interaction proche d'un mur. Examiner les
quatre orientations et au moins le cadrage normal/rapproché, dont 1280 × 720. Réutiliser
les mêmes vues après correction. Les captures servent à l'œil, pas aux mesures de durée.

`exploreRenderStats()` expose appels de dessin, triangles, géométries, textures, GPU et
DPR de la dernière image complète, ombres et reflet compris. Il ne mesure **ni la durée
d'entrée ni la compilation des shaders**. Pour un ralentissement : relever les intervalles
`requestAnimationFrame`, enregistrer Performance/CPU et comparer première entrée/retour
avec une graine, un GPU et un viewport documentés, sans captures pendant le relevé.
Le cache de shaders du pilote peut survivre à un navigateur neuf : signaler cette limite.

Après ajout de ressources, revisiter plusieurs cartes avec le même renderer : les compteurs
mémoire doivent se stabiliser après échauffement, pas croître à chaque cycle. Les 318
géométries/137 textures de la dernière revue sont un précédent, pas une valeur imposée
à une nouvelle zone. Finir par `npm run verify` avant commit ; réserver Playwright aux
parcours affectés. Consigner la scène/graine, les captures décisives, les mesures et leurs
limites dans une courte revue liée depuis `docs/INDEX.md`.

## Défauts fréquents et premier endroit à examiner

| Symptôme                                        | Diagnostic à commencer                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Jour entre murs / deux cloisons au même endroit | Plan ASCII, faces du layout, doubles rangées, `replacedCellKeys`, centres partagés par finitions                             |
| Cour ou hangar avec façades basses              | Classification dans `holtWallGeometry.ts`, voisins/fenêtres du layout et `wallHeights`, avant d'ajouter une hauteur spéciale |
| Mur qui change après entrée ou rotation         | Ancien mécanisme de coupe remis en service ; la découverte ne doit toucher que le contenu                                    |
| Salle entière visible trop tôt                  | `roomId`, `visibility`, `alwaysDiscovered`, `thresholdRoomId` et éventuel `viewRoomId`                                       |
| Nouvelle carte sans meubles                     | Sélection `art.visuals`, distincte de `MAPS` et des profils de rendu                                                         |
| Objet doublé par un cube / meuble traversable   | `replaces`, modèle/dimensions, ASCII et emprise après rotation                                                               |
| Anneau absent ou pointeur décalé                | Hauteur du marqueur vs sol ; conversion des coordonnées du canvas et `renderCamera` commune                                  |
| Vantail restant après ouverture                 | État réel de porte, `doorStateId`, propriété du vantail générique/spécialisé                                                 |
| Reflet absent                                   | Profil enregistré, pièce active/découverte, `zoneId`, gain et zoom, surface/target du réflecteur                             |
| Freeze à la première entrée                     | Nombre de sources/ombres, variantes de matériaux, préparation sur le bon target, trace de compilation                        |
| Mémoire croissante après changement de carte    | Propriétaires et `dispose`, surtout instances, textures clonées et targets de reflets                                        |
