# Les lieux du chapitre 2

Même format que le chapitre 1 : [`09-MAPS-CHAPTER-1.md`](09-MAPS-CHAPTER-1.md) (`MapDef`,
légende ASCII, `validateMap()`). Ce document ne redit pas le format, seulement ce qui est
propre aux cartes du chapitre 2.

## `holt-nuit` (lot 5.8) : le bal et la fuite

**Invariant du lot (rappelé par le propriétaire)** : `holt` garde EXACTEMENT son rendu ;
`holt-nuit` est une **variante**, jamais une modification du fichier `holt.ts`. En pratique :
[`src/data/maps/holt-nuit.ts`](../../src/data/maps/holt-nuit.ts) réutilise l'ASCII et les
`RoomDef` de `HOLT_MAP` tels quels (`ascii: HOLT_MAP.ascii`, `rooms: HOLT_MAP.rooms`) et pose
sa **propre** liste d'entités — aucune entité de `holt.ts` n'existe sur `holt-nuit`, et
réciproquement. Même règle côté habillage :
[`src/data/exploreVisuals/holtNuit.ts`](../../src/data/exploreVisuals/holtNuit.ts) réexporte
les placements de `HOLT_VISUALS` sous la clé `mapId: 'holt-nuit'`, sans dupliquer le mobilier.

Géographie (TECH-DESIGN §1, réponse 3) : le bal (scène 2, `ch2.bal`) se joue dans les **salles
d'entraînement** — la même salle que l'examen du chapitre 1, redécorée pour une nuit (les
pupitres de `holt.ts` font des tables, sans entité dédiée : la bascule "tables renversées" à
la fin de `ch2.slow.json` reste purement narrative, variante 🟢 de GAME-DESIGN §5.5). La fuite
(scène 4, `ch2.fuite`) emprunte le **couloir de ceinture** jusqu'au **dortoir**, où une grille
verrouillée (`dortoir.grille`) déclenche `ch2.grille`.

Deux étapes, deux jeux d'entités, gardés par le drapeau `ch2.etape` (`Ch2Etape`, exporté par
`src/data/chapters/ch2.ts` — même principe que `Ch1Etape`) :

- `etape('bal')` : `bal.letitia` (déclencheur de l'objectif — joue `ch2.bal.json` en entier,
  l'invitation, avant d'avancer le routeur), `bal.zachary`/`bal.abigail`/`bal.john`/
  `bal.grover` (conversations facultatives, chacune pose `<dialogueId>.fait` — TECH-DESIGN
  §4.6 "Échos du bal").
- `etape('fuite')` : trois zones à effets (`fuite.zone-1/2/3`, `{ tempo: 1 }` chacune — un
  seuil par zone, TECH-DESIGN §4.6 "La fuite qui s'entend" ; la réplique et le tir lointain
  eux-mêmes vivent en radio, `src/data/chapters/ch2Radio.ts`, `channel: 'pression'`), deux
  portes fermées par le feu hors du chemin obligatoire (`fuite.porte-cour-ouest/est`, B11),
  deux silhouettes statiques de gangers (`ganger.1/2`, B12 — figurants immobiles, aucun
  combat réel), une conversation facultative de flavor (`fuite.souffle`, `ch2.fuite.json`),
  et `dortoir.grille` (déclencheur de l'objectif — porte, verrouillée, dialogueId de la scène
  suivante `ch2.grille`, contrat du lot 3.6b : elle ne joue rien elle-même).

**Le dortoir ne s'atteint que par la grille** (correctif du lot 5.9) : les deux portes nord de la
cour intérieure et de la cantine, en (31,16) et (44,16), n'avaient pas d'entité -- ouvertes, elles
menaient au dortoir sans passer la grille. Ce sont désormais deux portes fermées par le feu, sur le
modèle des deux premières (`fuite.porte-dortoir-cour`, « Bloquée. De la fumée passe sous la
porte. » ; `fuite.porte-dortoir-cantine`, « Condamnée par les flammes. »), avec une lueur de feu et
un filet de fumée côté sud à l'étape `fuite`. Comme les deux premières, elles sont fermées dès le
bal (l'état d'une porte ne dépend pas de l'étape, et le panneau fermé se voit) : le bal n'a rien au
dortoir, ni entité ni objectif. Vérifié par `tests/unit/ch2ExploreScenes.test.ts` (portes
verrouillées infranchissables : aucune case du dortoir atteinte sans la grille ; la grille ouverte,
si).

**Zones de tempo incontournables** (décision du propriétaire, 2026-09-26) : le tempo de la fuite
pèse par les choix (porteur, `solitaire`/`loyal-bande`, la grille), jamais par le chemin. Les
zones d'origine ne couvraient que le couloir de ceinture (x = 22-24) : on évitait la troisième par
le couloir parallèle (x = 18-20, portes (21,20) et (21,6)), ou par la salle au sud du dortoir
(porte (25,21), puis (31,16)) jusqu'à l'intérieur de la grille. Désormais :

| Zone | Aire | Ce qu'elle barre |
|---|---|---|
| `fuite.zone-1` | x 22-24, y 38-42 | le couloir devant la seule sortie des salles d'entraînement (porte (25,40)) |
| `fuite.zone-2` | x 18-24, y 20-25 | les deux couloirs parallèles, à la hauteur de la porte (21,20) |
| `fuite.zone-3` | x 18-28, y 5-9 | les abords de la grille, des deux côtés (couloirs et dortoir) |

Vérifié sur le plan par `tests/unit/ch2ExploreScenes.test.ts` : pour chaque zone de tempo d'une
scène `explore`, l'aire bouchée, le déclencheur devient inatteignable depuis l'apparition (portes
verrouillées qu'aucune entité n'ouvre exclues des raccourcis). Toute fuite franchit donc trois
seuils ; la balle perdue de la grille (`ch2.grille.json`) demande désormais un tempo de 4, un cran
de plus que les zones seules.

Deux points d'apparition, `bal` et `fuite`, tous deux dans le cercle de combat des salles
d'entraînement (entrées à froid : `ch2.slow`, entre les deux, est un dialogue sans position à
reprendre).

**Suiveurs, B9 et le porteur** : `ch2.bal` n'en déclare aucun (la bande est placée par ses
propres entités, personne ne "suit" au bal). `ch2.fuite` est deux `SceneDef` **jumelles**
(TECH-DESIGN §4.4), même id, même carte, mêmes étape/objectif, gardées par `when: { flag:
'ch2.porteur', equals: 'john' | 'abigail' }` — seule change la liste de suiveurs
(`FUITE_FOLLOWERS_JOHN`/`FUITE_FOLLOWERS_ABIGAIL`, `src/data/chapters/ch2.ts`). Le choix du
porteur se fait au **dernier nœud de `ch2.slow.json`** (« John et Grover renversent les
tables. Qui soutient Letitia ? »), juste après l'entrée des gangers — avant toute scène
`explore` de la fuite, donc avant que `SceneRouter` n'ait à choisir entre les deux jumelles.
Avec Abigail, le tempo part un cran plus haut (`{ tempo: 1 }`, dit dans le texte du choix —
« plus lentement, mais elle ne la lâchera pas », jamais un chiffre). Seuls les deux premiers
suiveurs sont rendus (`VISIBLE_FOLLOWERS_LIMIT = 2`) : Letitia (blessée) et son porteur. Le
reste du groupe (dont l'autre des deux) n'est dit que par la narration.

Le même nœud de `ch2.slow.json` porte aussi `solitaire`/`loyal-bande` (GAME-DESIGN scène 4) :
« Continuer en groupe », ouvert à tous, et en plus, selon le dossier, « Passer devant, seul »
(solitaire : un cran de tempo en moins, −1 avec John) ou « Attendre John et Grover à la porte »
(loyal-bande, +1 avec Grover, un cran de tempo en plus) -- correctif du lot 5.9 : ces deux options
s'ajoutaient à l'option commune dans le design, elles la remplaçaient dans les données. Le tempo
ne descend jamais sous 0 : au moment du choix (avant les zones), « Passer devant » n'efface donc
que le cran d'Abigail porteuse. Plus aucun des deux dans `ch2.grille.json`,
qui ne garde que le panneau électronique (DV, écho du bal) et le seuil de tempo final (balle
perdue).

**Échos du bal lus ailleurs** (TECH-DESIGN §4.6) : `ch2.bal.zachary.fait` en scène 7
(`ch2.egouts.json`, DV −1 cran pour calmer Abigail), `ch2.bal.abigail.fait` en scène 4
(`ch2.grille.json`, DV Normale au lieu de Difficile), `ch2.bal.john.fait` en scène 10
(`ch2.decharges.json`, John parle du rendez-vous avant la question), `ch2.bal.grover.fait` en
scène 5 (`ch2.enfant.json`, Grover à Facile au lieu de Normale pour calmer l'enfant, lot 5.9).

## `holt-nuit` (lot 5.8b) : l'habillage de la nuit

Le lot 5.8 avait livré `holt-nuit` avec l'habillage de `holt` réexporté tel quel (voir la
docstring d'origine de `holtNuit.ts`) : « l'habillage enrichi » de TECH-DESIGN §3 (ballons,
guirlandes, gâteaux, tables renversées) restait un écart signalé, pas un blocage. Le lot 5.8b
le pose, avec le mécanisme qui manquait pour le faire proprement : l'habillage **par étape**
(ADR 0026) — un placement de `ExploreVisualPlacement` peut désormais porter `etape: 'bal' |
'fuite'`, filtré comme la découverte de pièce ou l'entité active.

Seule la salle d'entraînement change de mobilier (les 28 cases de l'ancienne grille de
pupitres, `src/data/exploreVisuals/holtNuit.ts`) :

- **`etape('bal')`** : les colonnes `x = 30` et `x = 42` (8 cases, `BUFFET_CELLS`) portent
  une table de buffet (`buffet-table`, gâteaux et boissons) au lieu du pupitre de jour ; les
  cinq colonnes centrales restent nues (la lecture "piste dégagée") ; une bande claire
  (`dance-floor-tile`, 13 × 1 m) marque la piste sur la rangée du milieu (`y = 38`,
  entièrement franchissable) ; quatre guirlandes de lampions (`party-string-lights`) pendent
  au-dessus — deux de part et d'autre (rangées `y = 36`/`40`), deux directement sur la piste
  (`y = 38`), plus lumineuses et plus colorées depuis la revue du 26/09 (voir plus bas).
  Climat lumineux chaud et coloré, relevé d'un cran (`ExploreView.setNightMood('bal')`).
- **`etape('fuite')`** : les cases de l'ancienne grille portent un pupitre renversé (rotation
  alternée par position — jamais `Math.random()`) ; deux lueurs de feu (`fire-glow`, avec une
  vraie `PointLight` qui vacille, `ExploreDressing.tick`) et deux filets de fumée
  (`smoke-wisp`) marquent le pied des portes bloquées (`fuite.porte-cour-ouest/est`). Climat
  lumineux sombre et orange, plus bas que le climat "centre d'examen abandonné"
  (`ExploreView.setNightMood('fuite')`).

**Plan dérivé (revue du 26/09, corrige une collision invisible)** : `holt-nuit` ne réutilise
plus l'ASCII de `holt` tel quel, il en DÉRIVE le sien (`deriveNightAscii`,
`src/data/maps/holt-nuit.ts`) — `holt.ts` lui-même n'est toujours pas touché (invariant du
lot 5.8). Les 28 cases de l'ancienne grille de pupitres deviennent du sol (`.`), sauf les 8
`BUFFET_CELLS` qui restent bloquantes aux DEUX étapes (un buffet au bal, un pupitre renversé
à la fuite — jamais une case qui bloque sans qu'un placement d'une étape y réponde). Sur les
20 autres cases, le pupitre renversé de la fuite ne bloque plus (`desk-overturned-loose`,
`flat` — même géométrie que `desk-overturned`, seule l'occupancy change). Résultat : la piste
dégagée du bal est réellement praticable, pas seulement dessinée comme telle. Voir ADR 0026
pour le détail et le raisonnement.

En dérivant ce plan, six placements hérités de `HOLT_VISUALS` se sont révélés viser des
entités absentes de `holt-nuit` (`interface.terminal`, `local-technique.transformateurs`,
`dortoir.casier`, `cantine.place-franklyn`, `entrainement.sac-de-frappe`, `garage.fourgon` —
latent depuis le lot 5.8, invisible jusqu'ici puisqu'un placement lié à une entité absente ne
s'affiche jamais). Cinq perdent seulement leur `entityId` orphelin et restent posés,
toujours visibles ; les deux qui occupaient une case franchissable UNIQUEMENT grâce à un
personnage assis dessus (le pupitre et la chaise de Franklyn) sont retirés entièrement —
gardés tels quels, ils redeviendraient un obstacle plein sans personne pour l'occuper.

**Deux suiveurs de la fuite, corrigé** : le premier passage sur `ch2.fuite` (fraîche entrée,
ou reprise) ne montrait qu'une silhouette pour deux suiveurs déclarés — les deux occupaient
exactement la même position (`window.__game.explore().followers` renvoyait deux entrées
identiques). Cause : `ExploreSession.buildWorld` amorçait le segment synthétique "avant le
spawn" de `ExploreState` (`seedTrail`) avec `exploreFollowerIds(ctx.run)` — une règle propre
au **chapitre 1** (l'équipe bleue après le tirage), qui renvoie `[]` hors de son tirage — au
lieu du nombre RÉEL de suiveurs de la scène (`SceneDef.followers`, borné à
`VISIBLE_FOLLOWERS_LIMIT`). Le segment amorcé pour zéro suiveur était trop court pour deux :
au premier calcul de position, les deux suiveurs retombaient sur l'unique point du segment,
superposés. Corrigé en passant `followerIds` (déjà calculé par l'appelant) à `buildWorld` au
lieu de le recalculer. Vérifié par l'état : `window.__game.explore().followers` renvoie deux
cases distinctes dès l'entrée sur `ch2.fuite`, en jeu réel comme via `?scene=ch2.fuite`.

**Mesure des appels de dessin** (2026-09-26, `window.__game.exploreRenderStats()`, Playwright/
Chromium logiciel — voir la mise en garde du lot 5.7 sur la fiabilité des images par seconde
dans un navigateur automatisé ; les appels de dessin, eux, sont lus sur une image réellement
rendue et restent fiables) :

| Scène | Appels de dessin | Triangles |
|---|---|---|
| `ch2.bal` (5 figurants, sans suiveur) | 166–186 | ~91 000–97 000 |
| `ch2.fuite` (2 suiveurs, pupitres renversés, feu) | 98 | ~110 000 |

Les deux restent largement sous le seuil de 250 (marge d'au moins 25 % sur `ch2.bal`, la
scène la plus chargée du lot).

## `campement` (lot 5.10) : le campement des Scorpions

Scène 9 (`ch2.campement`, GAME-DESIGN §4) : une halte de gangers dans les Badlands, adossée
aux murs d'une station-service en ruine. [`src/data/maps/campement.ts`](../../src/data/maps/campement.ts),
une seule étape (`ch2.etape = 'campement'`), une seule pièce (`campement`, `alwaysDiscovered` :
un extérieur, rien à découvrir pièce par pièce).

```
########################
#......................#
#......TT.......TTT....#     TT (x7-8)  : tente nord        TTT (x16-18, y2-5) : le camion
#..TT..TT.......TTT....#     TT (x3-4)  : tente ouest       M (17,6) : Murano, face au feu
#..TT...........TTT....#
#...............TTT....#
#....i...........M.....#     i (5,6)  : le brassard au scorpion (plat, franchissable)
#..........o...........#     o (11,7) : le feu (bas, il ne cache rien)
#......................#
#...................TT.#     TT (x20-21, y9-10) : caisses ; zone d'entrée y = 9-10, x = 4-19
#...................TT.#
#.TT...................#     TT (x2-3, y11-12) : fûts
#.TT.......S...........#     S (11,12) : point d'apparition
#......................#
#......................#
##########...###########     brèche sud (x = 10-12)
```

**Petite à dessein** (24 × 16) : la première version (30 × 22) laissait le camion et les tentes
hors champ à l'arrivée ; à cette taille, le cadrage de départ embrasse tout le camp. Le point
d'apparition est à trois cases de la brèche pour que la file des suiveurs, amorcée vers le sud,
reste dans la cour.

Entités (toutes gardées par `etape('campement')`) :

- `campement.entree` (zone, y = 9-10) : une ligne au franchissement — le feu, **des traces
  sombres qui mènent aux tentes** (le sang de GAME-DESIGN est dit, jamais montré : chapitre sans
  sang à l'écran), la silhouette près du camion.
- `campement.insignes` (object, facultatif, tâche « fouiller près des tentes ») : joue
  `ch2.campement.json` (Perception DV Difficile → entrée `ch2.campement.insignes` et une
  réplique de John). Son apparence est le modèle `gang-emblem`.
- `campement.murano` (npc, déclencheur) : son `dialogueId` est celui de la scène suivante
  (`ch2.murano`, contrat du lot 3.6b). Rendu en silhouette de ganger adulte (`npcRig.ts`).

Suiveurs : `john`, `grover`, `abigail`, `enfant` (TECH-DESIGN §4.4) ; John et Grover sont
les deux visibles (B9), Letitia est portée hors champ.

**Habillage** ([`src/data/exploreVisuals/campement.ts`](../../src/data/exploreVisuals/campement.ts)) :
quatre modèles procéduraux propres au lot (`campfire` avec sa `PointLight` qui vacille,
`canvas-tent` en A, `wreck-vehicle`, `gang-emblem`), plus `crate-stack` et `barrel-stack`
du centre d'examen. Chaque placement réutilise les blocs exportés par la carte
(`CAMPEMENT_BLOCKS`) : une seule source de géométrie, aucune case bloquante sans modèle. Tous
les placements sont `exterior`. Murs en béton froid (`coldPalette`), climat
`setNightMood('campement')` : lune bleutée et basse, le feu de camp est la seule source chaude.

**Mesure** (2026-09-26, Playwright/Chromium logiciel SwiftShader, deux suiveurs) :
`exploreRenderStats()` = **103-104 appels de dessin**, ~51 000 triangles — loin du seuil de 250.

## `conduits` (lot 5.9) : les conduits et la cantine des petits

Scènes 5 (`ch2.conduits`) et 6 (`ch2.cantine`), GAME-DESIGN §4.
[`src/data/maps/conduits.ts`](../../src/data/maps/conduits.ts), **deux étapes sur la même instance
de carte** (`ch2.etape = 'conduits'` puis `'cantine'`) : entre les deux, la scène dialogue
`ch2.enfant` ne reconstruit rien, Franklyn repart du dortoir des petits où l'enfant l'a laissé.

```
  1   ############    ###############
  2   #.......TT.#    #.TT.TT.TT.TT.#   labo de Smith (x3-12, y2-7) ; dortoir des petits (x19-31, y2-8)
  3   #..TT......#    #.TT.TT.TT.TT.#   machine de la simulation (x5-6, y3-4) ; Smith en (7,4)
  4   #..TT......#    #.TT.TT.TT.TT.#   lits au nord ; l'enfant en (27,5)
  5   #.......TTT#    #............T#   établi (x10-12, y5-6) ; casiers (x31, y5-8)
  8   ######.#####    #............T#   l'annexe remonte au labo (x8, y8-12)
  9        #.#        ######.####+####  (29,9) : porte de la cantine, brûlante
 11        #.#    #####    #+#......T#  (24,11) : le ventilateur ; boîtier au mur en (23,12)
 12        #.######...######.#.TT.TTT#  la bifurcation (x15-17, y12-14)
 13        #.................#.TT.TTT#  à l'ouest l'annexe, à l'est le conduit des petits
 14        ########...########......T#  la cantine (x26-32, y10-21) : tables, comptoir (x32)
 19                #.#       #TT...TT#  deux brasiers (y19-20), un passage au milieu
 20                #.#       #TT...TT#  la bouche du conduit (x16, y15-24), apparition en (16,20)
 21                #.#       #.......#  (25,21) : le vide-ordures, au pied du mur ouest
```

**Des conduits d'une case de large** (on avance à la file) et **rien entre eux** : seules les cases
de mur qui bordent un sol restent `#`, le reste de la grille est du vide (`carveVoid`). Avec des
murs pleins entre deux conduits, la masse de 3 m cachait la file à la caméra (première manche de
captures). Pour la même raison, le sol « extérieur » continu n'est pas dessiné sur cette carte
(`ExploreVisuals.exteriorGround: false`, `src/data/exploreVisuals/index.ts`) : entre deux conduits,
il n'y a que du noir. Chaque tronçon de conduit est une `RoomDef` `alwaysDiscovered` (c'est sur les
bords des `RoomDef` que se calculent les murs coupés côté caméra) ; le labo, le dortoir des petits et
la cantine se découvrent en y entrant.

La caméra isométrique regarde depuis le sud-est : tout ce qui est monté au mur (le boîtier du
ventilateur, la trappe du vide-ordures) l'est sur un mur **ouest**, face à l'est ; l'écran de la
machine regarde le sud ; les deux portes sont sur des murs horizontaux (le panneau de porte du
rendu n'a qu'une orientation).

Entités de l'étape `conduits` :

- zones de narration seules (aucun effet) : `conduits.bouche` (la rafale dans la bouche du conduit),
  `conduits.bifurcation` (à gauche la lueur bleue, à droite les pleurs), `conduits.annexe` (la
  promesse faite à Abigail, la poussière bleue), `conduits.grille-vue` (les gangers vus d'en haut,
  à travers une grille), `petits.pleurs` ;
- `labo.smith` (npc, facultatif, tâche « suivre la lueur bleue ») : `ch2.smith.json` -- pose
  `vu-simulation`, donne le rendez-vous au Blue Purple, coûte un cran de tempo ;
- `conduits.ventilateur-pales` (porte verrouillée, sans dialogue) et `conduits.ventilateur` (le
  boîtier, `ch2.conduits.json`, `opensDoorAfterDialogue`) : Piratage, puis Électronique d'Abigail,
  puis les pales bloquées à la main -- **toute issue ouvre la porte** ;
- `petits.porte-cantine` (porte verrouillée, « brûlante ») et `petits.enfant` (npc, déclencheur,
  dialogueId de la scène suivante `ch2.enfant`) : la porte est ouverte par l'enfant à l'entrée de
  l'étape `cantine` (`opensDoorAfterDialogue` : `ChapterApp.enterExploreScene` rouvre toute porte
  dont l'ouvreur a son drapeau `<dialogueId>.fait` ; `ch2.enfant.json`, une scène dialogue et non
  une conversation annexe, le pose elle-même sur son dernier nœud).

Entités de l'étape `cantine` : `cantine.fumee` (zone de narration, toute la largeur libre) et
`cantine.vide-ordures` (objet, déclencheur, joue son propre dialogue `ch2.cantine` -- la
traversée de la fumée -- avant d'avancer vers `ch2.egouts`, règle du lot 3.7b).

Points d'apparition : `conduits` (la bouche, cinq cases de conduit droit au sud pour la file) et
`cantine` (entrée à froid seulement : `?scene=ch2.cantine`, reprise).

**Suiveurs** : `ch2.conduits` reprend la file de la fuite (Letitia et son porteur visibles, deux
`SceneDef` jumelles gardées par `ch2.porteur`) ; `ch2.cantine` montre l'enfant, qui vient de
rejoindre le groupe, et Grover.

**Habillage** ([`src/data/exploreVisuals/conduits.ts`](../../src/data/exploreVisuals/conduits.ts)),
d'abord de la lumière :

- conduits : climat `setNightMood('conduits')`, le plus sombre du chapitre ; des ampoules
  grillagées rares et faibles qui grésillent (`duct-lamp`), des conduites au plafond (`pipe-run`),
  de la poussière bleue au-delà de l'annexe (`blue-dust`), une grille au sol (`floor-grate`), le
  ventilateur sur la case de sa porte (`duct-fan`) et son boîtier (`fan-control`) ;
- labo : la machine de la simulation (`sim-machine`), écran et lumière cyan, seule source du labo ;
  une baie de serveurs, un établi ;
- dortoir des petits : quatre lits (`bed-cadet`), des casiers, des affaires au sol, une veilleuse ;
- cantine : climat `setNightMood('cantine')`, chaud et rouge ; deux brasiers (`blaze`, flammes ambre
  et lumière forte qui vacille), des lueurs au sol (`fire-glow`) et de la fumée (`smoke-wisp`),
  quatre tables, le comptoir ; la trappe du vide-ordures (`garbage-chute`).

Aucun placement n'est propre à une étape : la cantine brûle déjà à la scène 5, elle n'est
simplement pas atteignable (et une pièce non découverte ne montre rien).

**Mesure** (2026-09-26, Playwright/Chromium logiciel SwiftShader, deux suiveurs visibles,
`exploreRenderStats()`) : 106 appels de dessin à la bouche du conduit, 108 à la bifurcation, 135 au
labo, 99 devant le ventilateur, **166 au dortoir des petits** (le plus chargé : lits, enfant),
125-134 dans la cantine. Sous le seuil de 250 partout.
