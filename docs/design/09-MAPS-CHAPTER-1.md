# Les lieux du chapitre 1

Deux cartes explorables : **l'académie HOLT** et **le centre d'examen désaffecté**. Mode
d'emploi du déplacement et des entités : [`08-EXPLORATION.md`](08-EXPLORATION.md).

## Format des cartes

Même principe que la cour de containers (`src/data/yard-map.ts`) : un **plan ASCII éditable
à la main**, plus une **liste d'entités** typée. Une carte = un fichier
`src/data/maps/<id>.ts`.

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
d'interaction atteignable depuis chaque point d'apparition**, identifiants uniques.

---

## L'académie HOLT

**Référence : le plan du MJ** (plan d'architecte néon, bleu nuit et violet, « Zone première
génération — 13-17 ans »). La promotion de Franklyn est la **première génération** de
l'académie ; son aile occupe tout le plan. Le secteur de la seconde génération est hors carte,
à l'ouest, derrière une porte condamnée (`door` verrouillée, réplique brève : « Secteur de la
seconde génération. Accès réservé. »).

Schéma de principe (1 caractère ≈ 4 m ; nord en haut). L'agent qui dessine la carte à 1 m
**respecte la topologie et les proportions**, pas ce tracé caractère par caractère.

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
- Taille cible à 1 m par case : **environ 52 × 64**. Les pièces doivent rester lisibles à
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

Lieux sans étape, pour la vie et le lore (répliques brèves, un objet chacun) :
l'**Administration** (porte du bureau du directeur, fermée), l'**Interface** (la salle de
netrun : Franklyn s'y attarde — un `object` qui prépare son secret du chapitre 2),
le **Local technique** (bruit des transformateurs).

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

Taille cible : environ **40 × 70** (la cour fait 30 × 20 ; le bâtiment et le parking
s'étendent au sud). L'équipe adverse entre par un autre accès, hors carte : on ne la voit
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
| Cour | `zone` portail | « CONTACT » → combat |

Le format de dialogue gagne pour cela un **nœud d'entrée** choisi par l'entité
(`dialogueId` + `startNode`), voir [`07-DIALOGUE-FORMAT.md`](07-DIALOGUE-FORMAT.md).
