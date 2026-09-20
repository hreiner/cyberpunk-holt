# L'exploration — se déplacer dans les lieux

Spécification du mode **exploration** introduit à l'epic 3. Décision d'architecture :
[ADR 0013](../process/adr/0013-exploration-temps-reel-sur-grille.md). Plans des lieux du
chapitre 1 : [`09-MAPS-CHAPTER-1.md`](09-MAPS-CHAPTER-1.md).

## L'intention

Le chapitre 1 cesse d'être une suite d'écrans de dialogue. Comme dans un CRPG à la
*Baldur's Gate*, **on se déplace dans les lieux**, et c'est en arrivant quelque part — en
s'asseyant à son pupitre, en poussant une porte, en abordant un cadet — que la scène se
déclenche. Le joueur **vit la journée de Franklyn** au lieu de la lire.

Trois modes, un seul monde :

| Mode | Temps | Contrôle | Quand |
|---|---|---|---|
| **Exploration** | temps réel | clic pour se déplacer, clic pour interagir | par défaut |
| **Dialogue** | figé | le panneau de dialogue (inchangé) | déclenché par une interaction ou une zone |
| **Tactique** | tour par tour | le combat existant | déclenché par l'entrée dans la zone de l'affrontement |

L'exploration ne remplace aucun système existant : elle les **relie**. Les dialogues, les
jets, le dé 3D, la radio, le combat restent ce qu'ils sont.

## Ce que l'exploration n'est pas

- **Pas d'action temps réel.** Aucune esquive, aucun tir hors du mode tactique. On marche,
  on regarde, on parle.
- **Pas de monde ouvert.** Deux lieux au chapitre 1 (l'académie, le centre d'examen), chacun
  une carte bornée.
- **Pas de physique.** Déplacement sur la grille de 1 m, par le pathfinding existant
  (ADR 0013 remplace l'ADR 0007).
- **Pas de temps qui presse en temps réel.** Le minuteur invisible (tempo) n'avance **que**
  sur des actions, jamais avec l'horloge : une partie reste reproductible à la graine près,
  et marcher lentement n'est jamais puni.

## Contrôles

| Action | Souris | Clavier |
|---|---|---|
| Se déplacer | clic gauche sur le sol | — |
| Interagir | clic gauche sur un objet ou un personnage | `Espace` sur l'objet survolé le plus proche |
| Déplacer la caméra | — | les quatre **flèches** |
| Recentrer sur Franklyn | — | `C` |
| Tourner la caméra | — | `A` / `E` (quarts de tour, comme en tactique) |
| Zoom | **molette**, en continu | `+` / `−` |
| Montrer l'objectif | — | `Tab` maintenu |
| Journal | — | `J` |

- Le personnage suit le chemin A* le plus court, **en mouvement continu** (interpolé entre
  les cases, comme les déplacements animés de l'ADR 0009), à **4 cases/s**. Un nouveau clic
  remplace la destination à tout moment.
- Un clic sur une case inaccessible déplace vers la case accessible la plus proche.
- **Survol** : un objet interactif s'entoure d'un liseré `--bone`, le curseur change, et une
  étiquette affiche le verbe et la cible, en casse normale : « Parler à John »,
  « Examiner l'armoire », « S'asseoir ».
- **Interaction** : clic → le personnage marche jusqu'à la case d'interaction (adjacente),
  se tourne, puis l'action se déclenche. Si le chemin est impossible, l'étiquette l'indique
  (« Hors d'atteinte ») au lieu de ne rien faire.
- **Viser une entité est généreux, jamais pointu.** Toute la case d'une entité interactive
  est cliquable, pas seulement les quelques pixels de son modèle : cliquer « à peu près
  dessus » interagit. Sans cette règle, un clic manqué d'un cheveu devient un ordre de
  déplacement **vers la case de l'objet**, et le personnage finit planté dedans — exactement
  ce qu'on ne veut pas voir.
- **On ne marche jamais sur une entité.** Une destination qui tombe sur la case d'un
  personnage ou d'un objet est ramenée à sa case d'interaction. Seul un `seat` s'occupe :
  on s'assoit dessus, c'est le geste.

## La caméra et les murs

- Même caméra isométrique 3/4 que le combat (ADR 0001). Rotation en quarts de tour conservée.
- **La caméra ne suit pas Franklyn.** Une caméra qui recolle en permanence au personnage
  saccade à chaque pas et rend le déplacement désagréable ; on perd aussi la lecture du
  plan, qui est justement ce qu'on vient chercher dans une vue 3/4. La caméra est donc
  **libre** : les flèches la déplacent dans le plan de la carte, la molette zoome en continu,
  `C` la recentre sur Franklyn. Le panoramique est **relatif à l'écran** (↑ déplace la vue
  vers le haut de l'écran quelle que soit la rotation) et **borné à la carte**, marge d'une
  pièce comprise : on ne se perd pas dans le noir.
- La caméra **se recentre d'elle-même** aux seuls moments où le joueur perdrait le fil :
  au début d'une étape, après un changement de lieu, et à la sortie d'un dialogue. Jamais
  pendant un déplacement.
- **Murs en coupe.** Les intérieurs ont des murs de 3 m. Les murs **situés entre la caméra
  et l'intérieur de la pièce** (côtés sud et est pour l'orientation par défaut, recalculés à
  chaque rotation) sont rendus **coupés à 0,4 m**, arête supérieure soulignée. On voit
  toujours dans les pièces ; on lit toujours leur plan. C'est la règle de lisibilité n° 5
  d'ART-DIRECTION appliquée aux intérieurs.
- Pas de plafond. Les portes ouvertes sont des trouées ; les portes fermées, des panneaux
  pleins de la hauteur du mur coupé.

## Les objets du monde

Tout ce qui réagit dans une carte est une **entité** déclarée dans les données de la carte
(format dans [`09-MAPS-CHAPTER-1.md`](09-MAPS-CHAPTER-1.md)) :

| Type | Déclenche | Exemples |
|---|---|---|
| `npc` | un dialogue (ou une réplique brève, voir plus bas) | les cinq cadets, le directeur, un instructeur |
| `object` | un dialogue court, souvent un jet | l'armoire sécurisée, l'ordinateur de la salle 3, un panneau de porte |
| `seat` | une scène, en s'asseyant | le pupitre de Franklyn, sa place au réfectoire |
| `door` | ouverture, ou un dialogue si verrouillée | portes des salles, portail de la cour |
| `exit` | changement de lieu | (voir la note ci-dessous — aucune carte du chapitre 1 ne s'en sert) |
| `zone` | invisible, se déclenche **une fois** en y entrant | l'entrée de la salle 3 (le gaz), l'arrivée dans la cour de containers |

Chaque entité peut porter une **condition** (format `Condition` des dialogues) : un cadet
n'est au réfectoire qu'avant le discours, la porte du garage ne s'ouvre qu'une fois
l'objectif atteint. Même vocabulaire que les dialogues, aucun langage de plus.

**`exit` : au format, pas en usage (décision du lot 3.7a).** Le chapitre 1 n'a que deux
lieux (l'académie, le centre d'examen) et le passage de l'un à l'autre se fait **à la
frontière d'une scène** : une scène d'exploration déclare son `mapId`
(`SceneDef.mapId`) ; quand il diffère de celui de la scène précédente, `ChapterApp`
traite l'entrée comme une entrée à froid et applique le `spawn` de la scène — la règle
existe depuis le lot 3.6b (`enterExploreScene`/`buildExploreWorld` dans `src/chapter.ts`).
Une entité `exit` n'est donc jamais nécessaire pour le chapitre 1 : le type reste défini
dans `ExploreState`/`MapDef` (utilisé par le banc d'essai `src/dev/exploreLab.ts`, format
partagé), mais `chapter.ts` traite l'issue `change-map` d'une interaction comme un
no-op explicite — pas une case grisée « à venir », un cas qui ne se produit simplement
jamais sur les cartes de ce chapitre.

### Répliques brèves

Les figurants (les autres cadets de la promotion, un agent d'entretien) et les cadets qu'on
a déjà écoutés répondent par une **bulle** au-dessus de la tête — une phrase, 3 s, sans
panneau de dialogue. C'est ce qui rend les lieux habités à peu de frais. Une réplique
brève ne pose jamais d'effet : ce qui compte passe par un vrai dialogue.

Deux formes, selon le porteur — et l'écriture suit :

| Porteur | Forme | À l'écran |
|---|---|---|
| `npc` | ce que le personnage **dit** | bulle au-dessus de la tête, entre guillemets |
| `object` | ce que Franklyn **voit** | ligne de narration discrète en bas de l'écran |

Écrire une description dans la `line` d'un `npc` (« Un cadet enfile ses bottes ») la fait
sortir de sa bouche entre guillemets : une entité `npc` parle, toujours.

## La découverte des lieux

**On ne sait pas ce qu'il y a dans une pièce avant d'y entrer.** C'est ce qui donne envie de
pousser la porte suivante, et ce qui rend le centre d'examen inquiétant plutôt
qu'administratif : on avance de salle en salle sans savoir ce qui attend.

- La granularité est la **pièce** (`MapDef.rooms`). Une pièce est **découverte** quand
  Franklyn y entre, et le reste pour la partie.
- Une pièce non découverte garde sa **forme** — murs, porte, dimensions : on lit toujours le
  plan du bâtiment, on n'explore pas à l'aveugle — mais son **contenu est caché** : mobilier,
  objets, figurants, cadets. Son sol est rendu en masse sombre, nettement plus sombre que le
  sol éclairé d'une pièce connue. Une pièce vide et une pièce pleine doivent se ressembler
  tant qu'on n'y est pas entré, sinon la découverte ne cache rien.
- **Rien ne fuite par un autre canal.** Une entité d'une pièce non découverte n'est ni
  survolable, ni cliquable, ni atteignable au clavier (`Tab`), et ne compte pas dans la
  liste des entités proches. Le repère d'objectif (`Tab` maintenu) montre la **destination**,
  jamais ce qu'il y a autour.
- Les **couloirs et les extérieurs** ne sont pas des pièces : ils sont toujours visibles. La
  cour de containers non plus — le portail est un seuil, pas une porte, et l'affrontement doit
  se voir venir.
- L'ensemble découvert vit dans le `RunState` : recharger une partie ne re-cache pas des
  pièces déjà visitées.

## Les objectifs

Le chapitre reste **linéaire** (ADR 0011) : une étape à la fois. Chaque étape
d'exploration porte **un objectif principal** et, éventuellement, des **facultatifs**.

```
┌─────────────────────────────────────┐
│ Rejoindre le réfectoire              │   ← objectif principal
│ Le directeur fait son discours.      │   ← une ligne de contexte
│ ─────────────                        │
│ Facultatif · parler aux cadets  2/5  │
└─────────────────────────────────────┘
```

- Encart en haut à gauche, sur le design system (`.panel`, Big Shoulders pour le titre).
- `Tab` maintenu : un **repère au sol** pulse sur la destination de l'objectif principal, et
  une flèche au bord de l'écran si elle est hors champ. Rien n'est affiché en permanence :
  on apprend les lieux.
- Un objectif atteint se raye avec un petit tampon « FAIT », puis le suivant apparaît.

## Le groupe

- Avant le tirage, Franklyn est **seul**.
- Après, ses **deux coéquipiers le suivent** en file, à 1,5 case derrière lui, en évitant de
  lui barrer la route. On ne les dirige pas en exploration ; on les dirige en tactique
  (ADR 0008 inchangé).
- Cliquer sur un coéquipier ouvre une **réplique brève** contextuelle (commentaire sur le
  lieu), ou un dialogue s'il en a un en attente.

## Passer au combat

Le centre d'examen contient la **cour de containers** du combat existant. L'entrée dans sa
zone déclenche le **passage au mode tactique sur la même carte** :

1. Tampon « CONTACT » et coupure brève (400 ms) — le seul moment orchestré de la transition.
2. Les trois cadets du joueur sont placés sur leurs cases de déploiement, l'équipe adverse
   apparaît sur les siennes.
3. Le HUD tactique remplace l'encart d'objectif ; la grille s'allume ; l'initiative est lancée.
4. En fin de combat : procès-verbal, puis suite du chapitre.

Le moteur de combat ne connaît que le **rectangle** de la cour (30 × 20, la carte
`yard-map` actuelle). La carte d'exploration l'embarque avec un **décalage** ; le rendu
dessine tout le lieu, le moteur ne raisonne que sur la cour. Aucun changement de règle de
combat.

## Sauvegarde

- Sauvegarde automatique **à chaque début d'étape** (ADR 0011 inchangé), jamais pendant un
  dialogue ni pendant un combat.
- Recharger remet Franklyn au **point d'apparition de l'étape** avec l'état du dossier et de
  la partie tels qu'ils étaient à ce moment. On ne sauvegarde pas une position libre.

## L'API de debug

L'exploration doit rester pilotable sans souris, pour les tests de bout en bout :

| Appel | Effet |
|---|---|
| `__game.explore()` | état : lieu, position, objectif, entités proches et interactives |
| `__game.walkTo(x, y)` | téléporte **ou** déplace instantanément (pas d'animation) |
| `__game.interact(entityId)` | déclenche l'entité comme si on avait cliqué dessus, sans marcher |
| `__game.completeStep()` | réservé au développement : passe l'objectif courant |

Toutes synchrones, dans l'esprit de `choose()` et de `rollInsight()`. Contrat à reporter
dans [`../process/DEBUG_API.md`](../process/DEBUG_API.md).

## Accessibilité et lisibilité

- Tout objet interactif est atteignable **au clavier** : `Tab`/`Maj+Tab` parcourt les
  entités visibles à l'écran, `Espace` interagit.
- `prefers-reduced-motion` : recentrages instantanés plutôt qu'amortis, pas de pulsation du
  repère d'objectif.
- Les figurants sont gris et plus petits d'un cran : on reconnaît les six cadets d'un coup
  d'œil (couleur de personnage sur l'uniforme, comme en tactique).
