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
« Passer devant, seul » (solitaire, −1 avec John) ou « Attendre John et Grover à la porte »
(loyal-bande, +1 avec Grover, un tour de tempo) — plus aucun des deux dans `ch2.grille.json`,
qui ne garde que le panneau électronique (DV, écho du bal) et le seuil de tempo final (balle
perdue).

**Échos du bal lus ailleurs** (TECH-DESIGN §4.6) : `ch2.bal.zachary.fait` en scène 7
(`ch2.egouts.json`, DV −1 cran pour calmer Abigail), `ch2.bal.abigail.fait` en scène 4
(`ch2.grille.json`, DV Normale au lieu de Difficile), `ch2.bal.john.fait` en scène 10
(`ch2.decharges.json`, John parle du rendez-vous avant la question). `ch2.bal.grover.fait`
(scène 5, l'enfant) reste posé mais pas encore lu : la scène 5 est du lot 5.9.

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

## Reste à documenter

`conduits` (lot 5.9) et `campement` (lot 5.10) rejoindront ce document à leur lot.
