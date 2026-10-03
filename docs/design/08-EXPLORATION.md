# L'exploration — se déplacer dans les lieux

Spécification du mode **exploration** introduit à l'epic 3. Décision d'architecture :
[ADR 0013](../process/adr/0013-exploration-temps-reel-sur-grille.md). Plans des lieux du
chapitre 1 : [`09-MAPS-CHAPTER-1.md`](09-MAPS-CHAPTER-1.md).

## L'intention

Le chapitre 1 cesse d'être une suite d'écrans de dialogue. Comme dans un CRPG à la
_Baldur's Gate_, **on se déplace dans les lieux**, et c'est en arrivant quelque part — en
s'asseyant à son pupitre, en poussant une porte, en abordant un cadet — que la scène se
déclenche. Le joueur **vit la journée de Franklyn** au lieu de la lire.

Trois modes, un seul monde :

| Mode            | Temps         | Contrôle                                   | Quand                                                 |
| --------------- | ------------- | ------------------------------------------ | ----------------------------------------------------- |
| **Exploration** | temps réel    | clic pour se déplacer, clic pour interagir | par défaut                                            |
| **Dialogue**    | figé          | le panneau de dialogue (inchangé)          | déclenché par une interaction ou une zone             |
| **Tactique**    | tour par tour | le combat existant                         | déclenché par l'entrée dans la zone de l'affrontement |

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

| Action                 | Souris                                    | Tactile                  | Clavier                                       |
| ---------------------- | ----------------------------------------- | ------------------------ | --------------------------------------------- |
| Se déplacer            | clic gauche sur le sol                    | **appui** sur le sol     | —                                             |
| Interagir              | clic gauche sur un objet ou un personnage | **appui** dessus         | `Espace` sur l'objet survolé le plus proche   |
| Déplacer la caméra     | glisser                                   | **glisser**              | les quatre **flèches**                        |
| Recentrer sur Franklyn | —                                         | —                        | `C`                                           |
| Tourner la caméra      | —                                         | —                        | `A` / `E` (quarts de tour, comme en tactique) |
| Zoom                   | **molette**, en continu                   | **pincer** à deux doigts | `+` / `−`                                     |
| Montrer l'objectif     | —                                         | —                        | `Tab` maintenu                                |
| Journal                | —                                         | —                        | `J`                                           |

**Le jeu se conduit entièrement au doigt.** Une tablette n'a ni flèches ni molette : si un
geste n'existe qu'au clavier, la fonction n'existe pas là-bas. D'où la règle qui gouverne la
colonne tactile : **appui court = un ordre, glissé = la caméra.** Le verdict tombe au
relâchement, jamais à la pose — sans quoi le moindre début de panoramique enverrait Franklyn
marcher. **Le même partage vaut sur le terrain tactique** : appui = ordre, glissé = la vue se
déplace, pincement = zoom. Le glissé y a d'abord fait _pivoter_ la caméra ; c'était une erreur,
et elle s'est vue tout de suite sur tablette — c'est le même doigt sur le même genre de carte,
il doit faire la même chose des deux côtés. La rotation garde les boutons « Caméra » du HUD,
qui la nomment.

Et le **journal de combat est replié par défaut**, ouvert d'un bouton du HUD ou de `J`. C'est
un panneau qu'on consulte après coup, pas un organe de jeu : il tenait une colonne entière
pendant que le terrain, lui, se jouait dans la fente qui restait. Le repliement lui rend sa
place pour de bon — la caméra se recadre sur la zone libre à chaque bascule, elle ne se
contente pas de décaler l'image.

Ce qui reste au clavier seul (recentrage, rotation en exploration, objectif, journal) est du
CONFORT : on joue sans. Ce qui ne l'est pas — se déplacer, interagir, cadrer — a toujours un
geste.

- Le personnage suit le chemin A* le plus court, **en mouvement continu** (interpolé entre
  les cases, comme les déplacements animés de l'ADR 0009), à **4 cases/s**. Un nouveau clic
  remplace la destination à tout moment.
- Un clic sur une case inaccessible déplace vers la case accessible la plus proche.
- **Survol** : un objet interactif s'entoure d'un liseré `--bone`, le curseur change, et une
  étiquette affiche le verbe et la cible, en casse normale : « Parler à John »,
  « Examiner l'armoire », « S'asseoir ».
- **Noms des personnages** : aucune étiquette permanente en 3D. Le nom de Franklyn
  et des suiveurs apparaît dans l'infobulle HTML au survol ou à l'appui tactile,
  sans reflet dans le sol. Viser un membre du groupe affiche son nom sans envoyer
  d'ordre de déplacement ; viser le sol ou sortir du canvas à la souris ferme l'infobulle,
  comme un glissé ou un pincement. Les PNJ gardent leur verbe d'interaction.
- **Interaction** : clic → le personnage marche jusqu'à la case d'interaction (adjacente),
  se tourne, puis l'action se déclenche. Si le chemin est impossible, l'étiquette l'indique
  (« Hors d'atteinte ») au lieu de ne rien faire.
- **Viser une entité est généreux, jamais pointu.** Toute la case d'une entité interactive
  est cliquable, pas seulement les quelques pixels de son modèle : cliquer « à peu près
  dessus » interagit. Sans cette règle, un clic manqué d'un cheveu devient un ordre de
  déplacement **vers la case de l'objet**, et le personnage finit planté dedans — exactement
  ce qu'on ne veut pas voir.
  La case seule ne suffisait pas : au zoom de jeu, un mètre projette un **losange d'environ
  55 × 42 px**, sous la cible tactile confortable de 44 × 44 px et pointu aux quatre coins.
  Mesuré sur la chaise de la cantine — la toute première interaction du chapitre, celle dont
  on a dit qu'elle n'était « pas simple à cliquer ». La saisie est donc un **disque de 0,7 m
  autour du centre de la case** (`INTERACT_GRAB_RADIUS_M`) : moitié de surface en plus, pas de
  coins, et la plus proche l'emporte quand deux entités se touchent. Le rayon reste sous la
  distance entre deux centres de case (1 m) : on peut toujours demander à marcher juste à
  côté de quelqu'un.
  **L'anneau au sol dessine exactement ce disque.** Il était plus petit que la case qu'il
  annonçait : l'œil visait l'anneau, le clic tombait à côté du meuble. Ce qu'on montre et ce
  qu'on accepte doivent être la même chose.
- **Deux entités interactives ne sont jamais à moins de deux cases.** Sous cette distance,
  leurs disques de saisie se partagent le terrain et la plus proche emporte le clic : au
  doigt, on en attrape une pour l'autre. C'est arrivé à la cantine, où une figurante se tenait
  en diagonale de la place de Franklyn — la place qui lance le discours du directeur, donc
  celle qu'il ne faut surtout pas manquer. Règle de placement, pas de rendu : elle se vérifie
  sur les données, carte par carte
  ([`tests/unit/exploreMap.test.ts`](../../tests/unit/exploreMap.test.ts)).
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
- **Les murs d'exploration restent entiers et visibles**, quelle que soit la caméra, la salle
  occupée, la position du groupe ou la découverte. Aucun mur — façade, mur sur cour, cloison,
  mur de couloir ou d'extérieur — ne se coupe, ne s'abaisse et ne disparaît pour révéler le
  joueur ou le contenu d'une autre pièce. Les ouvertures sont de vraies ouvertures du décor ;
  les portes suivent leur état de jeu. La lisibilité vient du plan, des ouvertures et du cadrage.
- **Hauteurs fixes par type de lieu** : façades et murs donnant sur une cour à 4,9 m ; cloisons
  intérieures à 2,45 m. Au centre d'examen, les façades autour de la cour de containers font
  4,9 m. Dans les conduits et le campement, les murs font 2,45 m. Les murs partagés gardent
  une seule hauteur et une seule géométrie continue, quel que soit le côté depuis lequel on les
  regarde.
- Pas de plafond ni d'élément suspendu au-dessus d'un passage. Cette politique remplace les
  règles historiques de murs en coupe des ADR 0013 et 0027 et les coupes automatiques décrites
  par les ADR 0036 à 0038 ; voir [ADR 0039](../process/adr/0039-murs-exploration-entiers.md).
- La caméra plonge à environ **70° dans les conduits** d'une case de large, via
  `cameraElevationDeg` du profil visuel, afin de lire le passage entre ses parois fixes ;
  HOLT, le centre d'examen et le campement gardent environ 55°.
  Le dortoir HOLT/HOLT-nuit dispose d'une exception visuelle autorisée par le propriétaire
  le 1er octobre 2026 ([ADR 0036](../process/adr/0036-rendu-dortoir-fidele-au-pilote.md)) :
  reprendre les volumes, les fenêtres, les matières et le rendu du pilote autonome, et
  adapter la caméra si nécessaire, y compris en perspective. Les quatre
  orientations et les contrôles restent utilisables ; clics et repères écran suivent
  la caméra rendue. Aucun élément suspendu ne doit masquer les occupants.
  Le rayon commun au survol et au clic utilise cette même caméra : l'anneau du sol
  désigne la case visée dans l'image, quel que soit le zoom ou le quart de tour.

Cette direction s'étend à toute l'académie HOLT/HOLT-nuit suivant le
[plan pièce par pièce](../process/HOLT-AAA-ROLLOUT-PLAN.md) et l'
[ADR 0037](../process/adr/0037-enveloppe-et-profils-visuels-holt.md). La caméra
perspective vise avec un décalage vertical de 22 m (environ 55° vers le bas), au
lieu des 8,5 m (environ 29°) du pilote initial. Les façades extérieures et celles
qui donnent sur la cour font 4,9 m ; les cloisons partagées entre pièces ou
couloirs font 2,45 m dès la construction. Structure commune, finitions distinctes
par face ; centres de murs et accessoires sont canoniques le long de chaque run
contigu, pour garder les raccords aux seuils. Les façades du pilote du dortoir
sont prolongées à leurs extrémités pour rejoindre les murs voisins. Les fenêtres
sont des ouvertures du décor, sans changer les collisions ASCII.

Pour HOLT, l'enveloppe reste entière, visible et finie avant la découverte des contenus.
Les pièces non découvertes ne montrent que leur structure ; leur mobilier et leurs entités
restent cachés jusqu'à l'entrée de Franklyn. Cette règle vaut pour toutes les cartes, y compris
les couloirs, les cours et l'extérieur. Elle remplace les coupes automatiques historiquement
décrites par les ADR 0036 et 0037.

Les profils convertis partagent une pool d'éclairage locale et un seul miroir
planaire actif : son gain décroît entre les zooms 26 et 34 et il est coupé à partir
de 34. Les sols mats de l'armurerie et des archives conservent seulement matières
et environnement. Les personnages et leurs animations ne font pas partie de ce lot.
En perspective, le recentrage vise la case ou la pièce demandée, même au bord
du bâtiment ; la navigation manuelle reste bornée à la carte.

Depuis le 2 octobre, le [plan des autres lieux](../process/EXPLORATION-AAA-ROLLOUT-PLAN.md)
et l'[ADR 0038](../process/adr/0038-profils-decor-toutes-explorations.md) appliquent ce socle
au centre d'examen, aux conduits et au campement. Le centre garde des façades de 4,9 m
et des cloisons de 2,45 m ; les souterrains et le campement utilisent 2,45 m. L'enveloppe
est complète dès le départ, alors que les finitions des pièces et leurs contenus suivent
la découverte. Aucun plafond ni élément suspendu ne doit cacher le parcours. Les appliques des nouveaux lieux
se fixent aux murs réels ; les lumières de remplissage des conduits restent dans leur zone
avec une portée limitée. Le hangar HOLT reçoit des détails de paroi et de véhicules.

Les fermetures spécialisées déclarées par doorStateId suivent l'état de la porte réelle.
Dans les conduits, le cadre du ventilateur demeure et ses pales dégagent le passage après
l'ouverture. Le boîtier garde son interaction ; aucun déclencheur supplémentaire n'est créé.
Cour et campement restent mats ; les trois petites zones de reflet dans les souterrains
sont limitées au labo, au dortoir des petits et à la cantine. Le terrain de la cour conserve
exactement ses cellules tactiques et ses couverts hauts/bas.

## Coût de la première entrée en salle

Une salle nouvellement découverte ne doit pas provoquer une pause de plusieurs secondes pour
compiler ses variantes d'éclairage. Les profils d'exploration gardent un nombre stable de
sources de lumière GPU entre les salles ; leur priorité et intensité changent sans modifier la
structure des variantes de shader. Les matériaux du décor, y compris ceux des pièces encore
cachées, sont préchauffés une fois avant d'être révélés. Le préchauffage ne rend jamais visibles
les contenus inconnus et ne modifie pas le rythme des animations locales, dont le feu.

La mise en œuvre et les chiffres avant/après sont consignés dans [ADR 0040](../process/adr/0040-stabiliser-cout-entree-salle.md)
et la [revue de performance](../art/EXPLORATION-ROOM-PERFORMANCE-REVIEW.md), avec les visites de
salles, la revue visuelle et la stabilité des ressources après plusieurs cycles de cartes.

## Les objets du monde

Tout ce qui réagit dans une carte est une **entité** déclarée dans les données de la carte
(format dans [`09-MAPS-CHAPTER-1.md`](09-MAPS-CHAPTER-1.md)) :

| Type     | Déclenche                                          | Exemples                                                                                              |
| -------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `npc`    | un dialogue (ou une réplique brève, voir plus bas) | les cinq cadets, le directeur, un instructeur                                                         |
| `object` | un dialogue court, souvent un jet                  | l'armoire sécurisée, l'ordinateur de la salle 3, un panneau de porte                                  |
| `seat`   | une scène, en s'asseyant                           | le pupitre de Franklyn, sa place au réfectoire                                                        |
| `door`   | ouverture, ou un dialogue si verrouillée           | portes des salles, portail de la cour                                                                 |
| `exit`   | changement de lieu                                 | (voir la note ci-dessous — aucune carte du chapitre 1 ne s'en sert)                                   |
| `zone`   | invisible, se déclenche **une fois** en y entrant  | l'entrée de la salle 3 (le gaz), l'arrivée dans la cour de containers, un seuil de fuite (chapitre 2) |

Chaque entité peut porter une **condition** (format `Condition` des dialogues) : un cadet
n'est au réfectoire qu'avant le discours, la porte du garage ne s'ouvre qu'une fois
l'objectif atteint. Même vocabulaire que les dialogues, aucun langage de plus.

**Une zone peut porter des effets (ADR 0024 §1, chapitre 2).** `ZoneEntity.effects?: Effect[]`
— appliqués **une seule fois**, au déclenchement, par `ChapterApp` (`applyZoneEffects`).
Vocabulaire volontairement restreint, vérifié par `validateMap` : seuls `tempo`, `flag` et
`counter` sont permis sur une zone — le reste de l'état continue de changer par des choix de
dialogue (ADR 0011), jamais en marchant dedans. C'est ce qui fait avancer le tempo de la fuite
sans exiger un dialogue à chaque couloir. Après un effet de zone, `ChapterApp` vérifie aussi
les répliques radio échues (voir « Fuite qui s'entend » ci-dessous) : une réplique de pression
apparaît donc en exploration, pas seulement en dialogue.

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

| Porteur  | Forme                                   | À l'écran                                     |
| -------- | --------------------------------------- | --------------------------------------------- |
| `npc`    | ce que le personnage **dit**            | bulle au-dessus de la tête, entre guillemets  |
| `object` | ce que Franklyn **voit**                | ligne de narration discrète en bas de l'écran |
| `zone`   | ce que la pièce **impose** en y entrant | même ligne de narration que l'`object`        |

Écrire une description dans la `line` d'un `npc` (« Un cadet enfile ses bottes ») la fait
sortir de sa bouche entre guillemets : une entité `npc` parle, toujours.

**Fuite qui s'entend (ADR 0024 §2, chapitre 2).** Une réplique radio à seuil de tempo
(`RadioCue`, jusqu'ici affichée seulement pendant un dialogue) est désormais vérifiée aussi
en exploration, après chaque effet de zone. Une réplique au canal `channel: 'pression'` n'a
pas de locuteur — pas l'encart « Instructeur » d'une réplique radio ordinaire — elle se rend
en **ligne de brief**, comme un `object`/`zone` sans entité associée (« Des pas, deux couloirs
plus loin. »), avec son bruitage éventuel (`RadioCue.sfx`, ex. un tir lointain synthétisé).

### Une salle se joue beat par beat

Une salle du parcours d'examen n'est **jamais** un seul bloc de texte qu'un premier clic
déroule en entier. Chaque moment de la salle appartient à **l'entité qui le porte** : le
panneau de la porte joue le piratage, le chien joue l'approche, l'ordinateur joue la vidéo —
et chacun **rend la main à l'exploration** quand il a fini. Le joueur décide dans quel ordre
il aborde la pièce, et ce qu'il laisse de côté.

Deux conséquences que le contenu doit respecter :

- **Ce qui termine l'étape, c'est la sortie**, jamais le premier objet touché. La porte nord
  d'une salle porte le `completionTrigger` ; tout le reste est facultatif et nourrit le
  barème sans être un péage. Un joueur pressé traverse la salle, un joueur curieux la fouille,
  les deux avancent.
- **Un beat ne s'enchaîne pas sur le suivant.** Dans le fichier de dialogue, le nœud terminal
  d'un beat ne pointe pas (`to`) vers le beat d'une autre entité : il finit. Deux entités
  peuvent partager un même fichier, chacune avec son `startNode` — le drapeau « déjà joué »
  est alors indexé sur le couple (fichier, nœud de départ), pas sur le fichier seul.

Et le briefing qui distribue le matériel d'équipe (le hall du centre d'examen) est
**bloquant** : la porte qui suit reste verrouillée tant qu'il n'a pas été écouté. Un briefing
qu'on peut contourner fausse tout ce qui vient après.

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
  une flèche au bord de l'écran si elle est hors champ. C'est la réponse **à la demande**, y
  compris quand la salle visée n'est pas encore découverte.
- **Ce qui fait avancer l'histoire se voit.** L'entité qui termine l'étape porte une **balise**
  permanente — un anneau rouge qui respire au sol et un chevron flottant au-dessus, rendu
  par-dessus le décor pour rester lisible près des murs. Le rouge est réservé à
  ça sur la carte : il n'y en a **jamais qu'une à l'écran**, et le joueur n'a plus à essayer
  les quinze anneaux d'une pièce pour trouver lequel compte. Les interactions facultatives
  gardent leur anneau discret — la différence entre les deux est le message. Toute entité
  interactive actuellement visible (cadet, figurant, objet ou siège) garde cet anneau ; il
  reste facultatif et ne remplace jamais l'indice rouge de l'objectif. Sa surface doit dépasser
  le sol et ses finitions locales, afin qu'un profil de pièce ne puisse pas l'enterrer.
- **Un déclencheur peut attendre qu'on s'engage** (`ObjectiveDef.completesWhen`, lot 5.11). Par
  défaut, le dialogue de l'entité qui termine l'étape la clôt à sa fin. Avec `completesWhen`, il ne
  la clôt que si la condition est vraie à ce moment-là ; sinon il rend la main à l'exploration,
  sans être marqué « déjà joué » : le joueur y revient et le rejoue en entier. C'est le bal du
  chapitre 2 : parler à Letitia n'ouvre le slow que si Franklyn l'invite ou reste en retrait —
  « Pas tout de suite » laisse faire le tour de la bande. L'encart ne se coche pas au clic.
- La balise **ne se montre que lorsque son entité se montre** : une pièce non découverte ne
  laisse rien fuiter (voir « La découverte des lieux »). Tant qu'on n'y est pas entré, c'est
  `Tab` qui répond.
- Un objectif atteint se raye avec un petit tampon « FAIT », puis le suivant apparaît.

## Le groupe

- Avant le tirage, Franklyn est **seul**.
- Après, ses **coéquipiers le suivent** en file, à 1,5 case derrière lui, en évitant de
  lui barrer la route. On ne les dirige pas en exploration ; on les dirige en tactique
  (ADR 0008 inchangé).
- Cliquer sur un coéquipier ouvre une **réplique brève** contextuelle (commentaire sur le
  lieu), ou un dialogue s'il en a un en attente.
- **Qui suit** (ADR 0024 §3, chapitre 2) : par défaut, les deux coéquipiers du tirage
  (`exploreFollowerIds`, règle inchangée du chapitre 1). Une étape déclare sa propre liste
  via `SceneDef.followers` (`FollowerId = CharacterId | 'enfant'`) quand elle en a besoin —
  le chapitre 2 y ajoute l'enfant recueilli, à un moment précis de l'histoire, pas au tirage.
  L'enfant n'a pas de fiche de personnage : silhouette dédiée, échelle réduite (0,7). Le
  chapitre 2 peut déclarer jusqu'à **cinq** suiveurs ; le nombre effectivement RENDU reste
  borné par `VISIBLE_FOLLOWERS_LIMIT` (`src/narrative/sceneRouter.ts`), réglable en données —
  voir la mesure de performance et la décision B9 dans
  [`TECH-DESIGN.md`](../chapters/ch2/TECH-DESIGN.md) §6 (lot 5.7).

## Passer au combat

Le centre d'examen contient la **cour de containers** du combat existant. Franchir le
portail met fin à l'étape d'exploration et donne la main au combat :

1. Tampon « CONTACT » et coupure brève (400 ms) — le seul moment orchestré de la transition.
2. Les trois cadets du joueur sont placés sur leurs cases de déploiement, l'équipe adverse
   apparaît sur les siennes.
3. L'écran tactique prend la place de l'exploration ; la grille s'allume ; l'initiative est lancée.
4. En fin de combat : procès-verbal, puis suite du chapitre.

**La vue tactique reste un écran à part, et c'est voulu** (décision du lot 3.7b, confirmée
par le propriétaire du projet). Fusionner les deux rendus dans le même canvas — deux scènes
3D, deux modèles de caméra, deux HUD à faire cohabiter — coûtait très cher pour un gain
d'illusion, et le combat n'y gagnait rien. La vue tactique est au contraire l'**interface de
tous les combats à venir** : elle doit pouvoir accueillir des affrontements qui n'auront
aucune carte d'exploration derrière eux. Le tampon « CONTACT » habille ce changement d'écran
au lieu de le laisser brut.

Ce que la carte d'exploration garantit, en revanche, c'est que **le terrain est le même des
deux côtés de la coupure** : le rectangle `tacticalArea` (30 × 20) est engendré depuis
`yard-map` et un test vérifie la correspondance case par case. Le joueur voit la cour en
s'en approchant, puis se bat dedans ; il ne découvre pas un autre décor. Le moteur de combat,
lui, ne connaît que ce rectangle et ne change pas d'une ligne.

## Sauvegarde

- Sauvegarde automatique **à chaque début d'étape** (ADR 0011 inchangé), jamais pendant un
  dialogue ni pendant un combat.
- Recharger remet Franklyn au **point d'apparition de l'étape** avec l'état du dossier et de
  la partie tels qu'ils étaient à ce moment. On ne sauvegarde pas une position libre.

## L'API de debug

L'exploration doit rester pilotable sans souris, pour les tests de bout en bout :

| Appel                       | Effet                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `__game.explore()`          | état : lieu, position, objectif, entités proches et interactives |
| `__game.walkTo(x, y)`       | téléporte **ou** déplace instantanément (pas d'animation)        |
| `__game.interact(entityId)` | déclenche l'entité comme si on avait cliqué dessus, sans marcher |
| `__game.completeStep()`     | réservé au développement : passe l'objectif courant              |

Toutes synchrones, dans l'esprit de `choose()` et de `rollInsight()`. Contrat à reporter
dans [`../process/DEBUG_API.md`](../process/DEBUG_API.md).

## Accessibilité et lisibilité

- Tout objet interactif est atteignable **au clavier** : `Tab`/`Maj+Tab` parcourt les
  entités visibles à l'écran, `Espace` interagit.
- `prefers-reduced-motion` : recentrages instantanés plutôt qu'amortis, pas de pulsation du
  repère d'objectif.
- Les figurants sont gris et plus petits d'un cran : on reconnaît les six cadets d'un coup
  d'œil (couleur de personnage sur l'uniforme, comme en tactique).
