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

## Reste à documenter

`conduits` (lot 5.9) et `campement` (lot 5.10) rejoindront ce document à leur lot.
