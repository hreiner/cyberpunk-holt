# Les lieux du chapitre 1

Deux cartes explorables : **l'académie HOLT** et **le centre d'examen désaffecté**. Mode
d'emploi du déplacement et des entités : [`08-EXPLORATION.md`](08-EXPLORATION.md).

## Format des cartes

Même légende que la cour de containers (`src/data/yard-map.ts`) : un **plan ASCII** et une
**liste d'entités** typée. Les deux cartes du chapitre construisent leurs rangées ASCII
par des fonctions `carveRoom`, `punchDoor` et `fillBlock`, afin de garder lisibles leurs
rectangles et leurs accès. Une carte = un fichier `src/data/maps/<id>.ts`.

```ts
interface MapDef {
  id: string;                    // "holt", "centre-examen"
  title: string;                 // « Académie HOLT »
  ascii: string[];               // une ligne par rangée, 1 caractère = 1 case de 1 m
  rooms: RoomDef[];              // rectangles nommés : titre affiché à l'entrée, calcul des murs en coupe
  entities: EntityDef[];         // npc, object, seat, door, exit, zone (voir 08)
  spawns: Record<string, Cell>;  // points d'apparition nommés : "lit-franklyn", "fourgon"…
  tacticalArea?: { origin: Cell; mapId: 'yard' }; // la cour de combat embarquée (centre d'examen)
}
```

Légende ASCII commune :

| Car. | Sens | Bloque le passage | Bloque la vue |
|---|---|---|---|
| `.` | sol | non | non |
| `#` | mur (3 m, coupé côté caméra) | oui | oui |
| `+` | porte (entité `door` à la même case) | selon état | selon état |
| `=` | vitre, grille | oui | non |
| `o` | mobilier bas : table, lit, caisse, pupitre | oui | non |
| `T` | mobilier haut : armoire, rayonnage, serveur, véhicule | oui | oui |
| `~` | végétation, massif (cour intérieure) | oui | non |
| ` ` | hors carte | oui | oui |

Les conteneurs de la cour tactique gardent leur légende propre (`#`, `o`, `m`, `B`, `R`),
lue par le moteur de combat sur le seul rectangle `tacticalArea`.

Un test unitaire valide chaque carte : rectangularité, portes sur un mur, toutes les
entités sur une case accessible ou adjacente à une case accessible, **toute case
d'interaction atteignable depuis chaque point d'apparition**, identifiants uniques et
références `opensDoorAfterDialogue` vers une porte existante.

**Où va quel meuble, et pourquoi** : [`../art/ROOM-COMPOSITION.md`](../art/ROOM-COMPOSITION.md)
tient l'audit de composition pièce par pièce (usage, ancre narrative, implantation,
circulation). Les blocs `o`/`T` de ces deux fichiers en découlent : le mobilier est adossé
aux murs sauf quand sa fonction exige le centre, et son emprise correspond à la taille
réelle du modèle qui l'habille
([`../../src/data/exploreVisualModels.ts`](../../src/data/exploreVisualModels.ts)).

**Implémentation actuelle** : `MapDef`, `EntityDef` et `Cell` sont définis dans
[`src/explore/types.ts`](../../src/explore/types.ts). `validateMap()`
([`src/explore/validateMap.ts`](../../src/explore/validateMap.ts)) vérifie la structure et
l'accessibilité ; les tests de cartes couvrent les parcours du chapitre. Les deux cartes
jouables sont [`holt.ts`](../../src/data/maps/holt.ts) et
[`centre-examen.ts`](../../src/data/maps/centre-examen.ts). Leur habillage 3D est décrit
séparément par [`src/data/exploreVisuals/`](../../src/data/exploreVisuals/) : les cellules
ASCII restent la source de collision et les placements visuels ne créent aucune règle.
L'[ADR 0013](../process/adr/0013-exploration-temps-reel-sur-grille.md) décrit le socle
d'exploration et l'[ADR 0017](../process/adr/0017-habillage-exploration-declaratif.md)
fixe ce partage entre carte et rendu.

---

## L'académie HOLT

**Référence : le plan du MJ**, [`holtacademy.png`](../art/Reference_pictures/holtacademy.png)
(plan général complet, décrit dans [`../art/REFERENCES.md`](../art/REFERENCES.md#lacadémie--holtacademypng)).
L'académie a trois parties : l'aile seconde génération (6-12 ans) à l'ouest, la **colonne
centrale** des services, et l'aile **première génération (13-17 ans)** à l'est — celle de
Franklyn. **La carte jouable couvre la colonne centrale et l'aile est.** L'aile ouest est
hors carte, derrière une porte condamnée (`door` verrouillée, réplique brève : « Secteur de
la seconde génération. Accès réservé. »). Dans le schéma ci-dessous, « colonne ouest »
désigne donc la colonne centrale du plan général.

Schéma de principe (1 caractère ≈ 4 m ; nord en haut). La carte réelle garde cette
topologie ; consulter les rectangles de `holt.ts` pour les coordonnées exactes.

```
            ┌──────────┐     ╔═══════ zone première génération ═══════╗
            │ ADMINIS- │     ║ ┌────────────────────────────────────┐ ║
         ┌──┤ TRATION  ├──┐  ║ │  DORTOIRS 13-17 ANS                │ ║
         │  └────┬─────┘  │  ║ │  lits en rangées ouest et est,     │ ║
         │       │        │  ║ │  pièce commune au centre           │ ║
         │  ┌────┴─────┐  │  ║ └─────────────────┬──────────────────┘ ║
         │  │INTERFACE │  │  ║ ┌───────────────┐ │ ┌──────────────┐   ║
      c  │  │ (salle   │  │c ║ │ COUR          │ │ │ CANTINE      │   ║
      o  │  │  netrun) │  │o ║ │ INTÉRIEURE    │─┼─│ 13-17 ANS    │   ║
      u  │  ├──────────┤  │u ║ │ jardin, arbre │ │ │ tables,      │   ║
      l  │  │INFIRMERIE│  │l ║ │ bassin carré  │ │ │ comptoir est │   ║
      o  │  │& LABO    │  │o ║ └───────────────┘ │ └──────────────┘   ║
      i  │  ├──────────┤  │i ║ ┌────────────────────────────────────┐ ║
      r  │  │ARMURERIE │  │r ║ │  SALLES D'ENTRAÎNEMENT 13-17 ANS    │ ║
         │  ├──────────┤  │  ║ │  grand plateau : agrès au sud-ouest,│ ║
      o  │  │ARCHIVES &│  │i ║ │  cercle de combat au centre,        │ ║
      u  │  │SERVEURS  │  │n ║ │  bancs au sud-est                   │ ║
      e  │  ├──────────┤  │t ║ └────────────────────────────────────┘ ║
      s  │  │LOCAL TECH│  │. ║        ┌────────────────────┐          ║
      t  │  │& ÉNERGIE │  │  ║        │ GARAGE VÉHICULES   │          ║
         └──┴──────────┴──┘  ╚════════│ deux véhicules     ├══════════╝
                                      └────────────────────┘
```

Topologie à respecter :

- **Colonne ouest** : cinq salles empilées du nord au sud (Interface, Infirmerie & labo
  biomédical, Armurerie, Archives & serveurs, Local technique & énergie), bordées de **deux
  couloirs** nord-sud, un de chaque côté. L'Administration coiffe la colonne au nord.
- **Aile est** (la zone première génération) : Dortoirs au nord sur toute la largeur ; en
  dessous, la **cour intérieure** (jardin, arbre, bassin carré) à l'ouest et la **Cantine**
  à l'est ; en dessous, les **Salles d'entraînement** sur toute la largeur ; le **Garage**
  au sud, seule sortie vers l'extérieur.
- Un **couloir de ceinture** fait le tour de l'aile est, relie les deux blocs par le nord
  (près de l'Administration) et par le milieu (entre la colonne ouest et la cour).
- La cour intérieure et la Cantine ouvrent **directement** sur les Salles d'entraînement,
  au sud. Attention au tracé : ces deux jonctions ont **deux rangées de mur** (la cour et
  la cantine s'arrêtent à `y=31`, les salles d'entraînement commencent leur anneau à
  `y=32`), contrairement aux autres jonctions de la carte qui partagent un seul mur. Les
  deux rangées doivent être percées, sinon la porte donne sur du béton plein.
- Taille actuelle à 1 m par case : **52 × 64**. Les pièces doivent rester lisibles à
  l'écran : la Cantine peut accueillir la promotion (une vingtaine de figurants assis), les
  Salles d'entraînement une trentaine de pupitres d'examen.

### Ce qui se passe où

| Lieu | Étape du chapitre | Contenu |
|---|---|---|
| Dortoirs | 1 · Réveil | apparition au lit de Franklyn ; casier (`object`, réplique) ; figurants qui s'habillent |
| Couloirs | 1 → 2 | figurants qui convergent vers la Cantine : ils montrent le chemin sans marqueur |
| Cantine | 2 · Discours | `seat` à la table de la promotion → dialogue `ch1.discours` ; le directeur sur l'estrade |
| Salles d'entraînement | 3 · Examen écrit, 4 · Tirage | trente pupitres ; `seat` au pupitre de Franklyn → `ch1.exam` ; le tirage suit sur place |
| Toute l'académie | 5 · Temps libre | les cinq cadets placés selon leur caractère, voir ci-dessous |
| Garage | 6 · Départ | le fourgon : `exit` conditionné à l'objectif → `ch1.fourgon` puis changement de lieu |

**Placement des cadets au temps libre** — chacun là où il est lui-même :

| Cadet | Lieu | Pourquoi |
|---|---|---|
| Abigail | Infirmerie & labo | la bricoleuse, la soigneuse |
| John | Armurerie | l'organique, le combattant ; il vérifie les tasers d'exercice |
| Letitia | Archives & serveurs | l'observatrice ; elle relit les plans du centre d'examen |
| Grover | Cour intérieure | le rassembleur, entouré de son trio (Théodore en figurant) |
| Zachary | Salles d'entraînement | le fonceur, qui frappe un sac en attendant |

Lieux sans étape, pour la vie et le lore : l'**Administration** (porte du bureau du directeur,
fermée), l'**Interface** (la salle de netrun : le terminal ouvre le court dialogue facultatif
`ch1.interface`, qui prépare le secret de Franklyn au chapitre 2, puis garde sa réplique brève
à répétition), le **Local technique** (bruit des transformateurs).

---

## Le centre d'examen désaffecté

Un ancien centre de formation de la police, en périphérie de Night City, repris par
l'académie pour ses examens. Béton taggé, néons morts, tôle. Trois zones enchaînées du sud
au nord.

```
   ┌──────────────────────────────── nord ─────────────────────────────┐
   │   COUR DE CONTAINERS — la carte `yard` actuelle (30 × 20),         │
   │   embarquée telle quelle : `tacticalArea`.                          │
   │   Déploiement rouge au nord, bleu au sud.                           │
   └───────────────────────────────┬────────────────────────────────────┘
                                   │ portail : `zone` « contact » → mode tactique
   ┌───────────────────────────────┴───────────┐
   │ SALLE 3 — le gaz et la vidéo              │  ordinateur au centre, sortie au nord
   ├───────────────────────────────────────────┤
   │ SALLE 2 — le choix coûteux                │  armoire sécurisée à l'ouest, porte au nord
   ├───────────────────────────────────────────┤
   │ SALLE 1 — la porte et le chien            │  panneau de porte, fumée, l'otage
   ├───────────────────────────────────────────┤
   │ HALL D'ENTRÉE — l'instructeur, les objets │  briefing, distribution taser / kit / outil
   └───────────────────────────────┬───────────┘
   ┌───────────────────────────────┴───────────┐
   │ PARKING — arrivée du fourgon              │  apparition « fourgon »
   └───────────────────────────────────────────┘
```

Taille actuelle : **44 × 72** (la cour fait 30 × 20 et commence en `(7, 1)` ; le bâtiment
et le parking s'étendent au sud). L'équipe adverse entre par un autre accès, hors carte : on ne la voit
qu'à la radio, puis à la vidéo de la salle 3, puis dans la cour.

### Les salles deviennent des lieux

Les dialogues existants (`ch1.salle1`, `ch1.salle2`, `ch1.salle3`) sont **découpés en
points d'entrée** déclenchés par des entités — le texte et les jets restent, c'est la mise
en scène qui change :

| Salle | Entité | Déclenche |
|---|---|---|
| Hall | `npc` instructeur | le briefing et la répartition des trois objets |
| Salle 1 | `zone` à l'entrée | la fumée, le bruit de course (narration courte) |
| Salle 1 | `object` panneau de porte | le piratage de la porte (jet) |
| Salle 1 | `npc` l'otage, puis le chien | Perception, ami/ennemi, tirer sur le chien, l'otage et son kit |
| Salle 2 | `object` armoire sécurisée | forcer l'armoire : tempo contre second taser |
| Salle 2 | `door` nord | continuer sans l'armoire |
| Salle 3 | `zone` à l'entrée | la porte se verrouille, le gaz |
| Salle 3 | `object` ordinateur | rester : jets de Résistance, la vidéo du parcours adverse |
| Salle 3 | `door` nord | sortir vite |
| Cour | `zone` portail (déclencheur officiel) + `object` affordance visible juste au-delà | « CONTACT » → combat |

Le format de dialogue gagne pour cela un **nœud d'entrée** choisi par l'entité
(`dialogueId` + `startNode`), voir [`07-DIALOGUE-FORMAT.md`](07-DIALOGUE-FORMAT.md).
L'armoire de la salle 2 joue aussi le piratage de la porte dans son dialogue : son champ
`opensDoorAfterDialogue` désigne `salle2.porte-nord`. Le passage s'ouvre réellement à la
fin de la conversation ; un clic sur la porte fait ensuite avancer vers la salle 3 sans
refermer le battant. Après un rechargement en salle 2, la porte retrouve son état ouvert
si cette conversation est déjà terminée. La porte peut aussi être abordée directement
sans ouvrir l'armoire.

Le portail de la cour reste porté par une `zone` (`cour.portail`, déclencheur officiel de
l'objectif — inchangé, voir `tests/unit/sceneRouterExplore.test.ts`) : « le portail est un seuil,
pas une porte, et l'affrontement doit se voir venir » (08-EXPLORATION.md). Une entité `object`
supplémentaire (`cour.portail-porte`), sans dialogue ni effet propre, est posée juste au-delà du
seuil pour donner au joueur quelque chose à voir, survoler et cliquer — sa case d'interaction
retombe dans l'aire de la zone, donc y marcher pour l'atteindre la déclenche normalement. Le point
d'apparition à froid de l'étape (`SPAWNS.cour`) reste au sud du portail, côté salle 3 : un
rechargement pendant cette étape ne doit jamais replacer le joueur déjà au-delà du déclencheur.
