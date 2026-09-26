# ADR 0026 — Habillage d'exploration conditionné par l'étape narrative

**Statut : accepté · Date : 2026-09-26**

## Contexte

Le lot 5.8 a livré `holt-nuit` (le bal, puis la fuite, ADR 0024) en réexportant tel quel
l'habillage de jour de `holt.ts` (`HOLT_NUIT_VISUALS = { mapId: 'holt-nuit', placements:
HOLT_VISUALS.placements }`), faute de mécanisme pour poser un mobilier différent selon
l'étape. Le constat du lot 5.8b : la salle d'entraînement se joue en plein jour, avec ses
pupitres en rangées, alors que le game design attend « la salle de l'examen redécorée
(ballons, gâteaux, piste libre au centre, figurants) » au bal, et une académie en feu à la
fuite — deux étapes, deux ambiances, sur la MÊME carte, la MÊME pièce.

ADR 0017 tranchait déjà « l'habillage déclaratif est indépendant des étapes narratives » —
une décision qui tenait tant que l'habillage ne variait qu'avec la carte (`mapId`). Elle ne
tient plus : deux étapes qui rejouent la même pièce avec un mobilier différent ont besoin
d'un axe de variation que `ExploreVisualPlacement` n'a pas.

Deux options :

1. Un `ExploreVisualMapDef` par étape (`holtNuitBal.ts`/`holtNuitFuite.ts`), choisi comme la
   carte elle-même l'est aujourd'hui par `def.id`.
2. Un champ optionnel `etape` sur `ExploreVisualPlacement`, filtré au même endroit que la
   découverte de pièce et l'entité active (`ExploreDressing.syncVisibility`).

La première option duplique tout le mobilier qui NE change PAS entre les deux étapes (près
de 90 % d'une carte comme `holt-nuit` : dortoirs, administration, cour...) ou oblige à un
mécanisme de fusion entre deux définitions — la complexité qu'ADR 0017 voulait justement
éviter en gardant l'habillage petit et déclaratif.

## Décision

`ExploreVisualPlacement` gagne un champ optionnel `etape?: string` (même vocabulaire que
`SceneDef.etape`/`EntityDef.condition`, comparé par égalité simple, jamais une `Condition`
complète — il n'y a rien à évaluer d'autre qu'une valeur de drapeau d'étape ici). Absent, un
placement suit la règle d'avant (découverte de pièce + entité active) : c'est le cas de
TOUS les placements de `holt.ts`/`centre-examen.ts`, jamais concernés.

`ExploreDressing.syncVisibility` reçoit l'étape courante en plus des deux critères
existants et l'ajoute en ET logique à la visibilité de chaque placement. Les groupes
fusionnés (`mergeStaticInstances`, passe de performance de l'epic 4) sont désormais aussi
indexés par étape : deux placements de la même pièce mais d'étapes différentes ne peuvent
jamais se retrouver dans le même `InstancedMesh`, sans quoi les basculer indépendamment
serait impossible. `ExploreView.setEtape(etape)` porte l'étape courante et resynchronise le
décor ; `ExploreSession.enterStep` l'appelle avec `SceneDef.etape` à chaque entrée d'étape.

`holt-nuit` (`src/data/exploreVisuals/holtNuit.ts`) illustre le mécanisme : les 28 cases de
l'ancienne grille de pupitres portent DEUX jeux de placements sur les MÊMES cases — des
tables de buffet (`etape: 'bal'`) et des pupitres renversés (`etape: 'fuite'`) — au lieu de
deux cartes ou d'un mobilier qui se transforme en place.

**Climat lumineux par étape** : `addExplorationLighting` (ADR 0018) renvoie désormais les
références de ses trois sources globales (`ExplorationLights`) au lieu de les poser et de
les oublier ; `applyNightMood`/`ExploreView.setNightMood(mood)` les recalibre pour `'bal'`
(chaud, coloré, bas) et `'fuite'` (sombre, orange, plus bas encore que le climat "centre
d'examen abandonné"). Toujours **trois sources globales**, jamais une quatrième : ADR 0018
n'est pas remis en cause, seul leur calibrage devient modifiable après coup. Seule
`holt-nuit` appelle `setNightMood` ; `holt`/`centre-examen` gardent leur climat fixe par
carte (`EXPLORE_VISUALS`, inchangé).

**Vacillement de feu** : `ExploreDressing` repère les `PointLight` portées par les
placements `fire-glow` à la construction et fait varier leur intensité à chaque image
(`ExploreDressing.tick(elapsedSeconds)`, appelé depuis `ExploreView.tick`) selon une somme
de deux sinus déphasés par le RANG du placement — jamais `Math.random()` (règle n°1
d'AGENTS.md), et jamais un nouveau tirage de jeu.

## Conséquences

- Une carte à étapes peut désormais poser un habillage différent par étape sans dupliquer
  sa définition ni son mobilier commun — le coût marginal d'une étape supplémentaire est
  la liste de ses seuls placements propres.
- `ExploreVisualPlacement.etape` est une chaîne libre, pas une union fermée par carte : rien
  ne empêche une faute de frappe silencieuse (une étape qui ne correspond à aucune valeur
  réelle de `SceneDef.etape` rendrait le placement invisible en permanence, sans erreur).
  Accepté pour rester simple ; à revoir si une deuxième carte à étapes en pâtit.
- `tests/unit/exploreVisualPlacements.test.ts` couvre `holt-nuit` dans sa boucle de
  cohérence case par case, au même titre que `holt`/`centre-examen` : la règle de
  chevauchement (deux placements sur la même case/couche) est désormais **par étape**
  (`layerConflicts`) — deux placements ne se gênent que s'ils peuvent être visibles
  EN MÊME TEMPS (aucun des deux n'a d'`etape`, ou tous deux la MÊME). Deux placements
  d'étapes différentes et déclarées ne sont jamais en conflit, même sur la même case.
  Sans changement pour `holt`/`centre-examen`/le pilote de dortoir (aucun de leurs
  placements ne porte `etape`, la règle se comporte exactement comme avant).

### Plan dérivé plutôt que collision invisible (revue du 2026-09-26)

Un premier jet de `holt-nuit` réutilisait l'ASCII de `holt` À L'IDENTIQUE : la grille de
pupitres restait bloquante (`o`) même quand l'habillage de nuit ne dessinait plus aucun
pupitre dessus (la "piste dégagée" du bal). Défaut réel constaté en revue : une case qui ne
montre rien mais bloque quand même est une collision invisible, exactement ce qu'ADR 0017
existe pour éviter côté habillage — et que l'ASCII, lui, peut parfaitement produire s'il
n'est jamais mis à jour en conséquence.

Correction : `holt-nuit` **dérive** son propre ASCII de celui de `holt`
(`deriveNightAscii`, `src/data/maps/holt-nuit.ts`) plutôt que de le réutiliser tel quel —
`holt.ts` lui-même n'est toujours pas touché (invariant du lot 5.8). La règle est la plus
simple qui tienne compte des deux étapes à la fois (le plan ne change PAS selon l'étape,
lui — seul l'habillage dessiné dessus change) :

- Les 28 cases de l'ancienne grille de pupitres deviennent du sol (`.`), **sauf** les 8
  qui portent un buffet au bal (`BUFFET_CELLS`, les colonnes murales) : celles-là restent
  bloquantes, aux DEUX étapes — un buffet (bal) ou un pupitre renversé (fuite) y reste un
  vrai obstacle.
- Sur les 20 autres cases (redevenues du sol), un pupitre renversé à la fuite ne bloque
  plus (`desk-overturned-loose`, occupancy `flat` — même géométrie que `desk-overturned`,
  `props.ts`, seule l'occupancy déclarée change) : on marche autour, ou dessus.

Aucune case ne bloque donc à une étape sans qu'un placement de CETTE étape (ou de l'autre,
si la case reste bloquante aux deux) n'y réponde — la propriété que la boucle de cohérence
vérifie maintenant pour `holt-nuit` comme pour les autres cartes.

**Effet de bord utile** : dériver l'ASCII a aussi mis au jour six placements de
`HOLT_VISUALS` dont l'`entityId` ne correspond à AUCUNE entité de `holt-nuit` (latent
depuis le lot 5.8, invisible jusqu'ici — un placement lié à une entité absente ne s'affiche
JAMAIS, `ExploreDressing.syncVisibility`). Cinq perdent seulement leur `entityId` orphelin
(`withoutOrphanEntity`, `holtNuit.ts`) et restent posés, toujours visibles ; les deux
restants (`entrainement.pupitre-38-39`, `cantine.chaise-franklyn`) sont des meubles pleins
sur une case franchissable, valides seulement parce qu'un personnage l'occupe dans
`holt.ts` — sans équivalent ici, ils sont retirés entièrement plutôt que dépouillés de leur
`entityId` (ce qui recréerait un obstacle plein sans personne pour l'occuper).
