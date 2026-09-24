# Composition des pièces — à quoi sert chaque salle, et comment on la lit

Ce document est l'**audit de composition** des deux cartes explorables. Il ne remplace
pas [`EXPLORATION-VISUAL-DESIGN.md`](EXPLORATION-VISUAL-DESIGN.md) : il **l'applique**.
Le tableau « Identité des lieux » de ce document-là dit quelle silhouette et quelle
matière chaque lieu doit avoir ; celui-ci dit **où poser les objets et pourquoi**.

Il sert à deux choses : décider une implantation sans la réinventer à chaque lot, et
vérifier qu'on n'a pas dérivé. Trois lignes par pièce, pas un traité.

## Les six règles de composition

Elles valent pour les deux cartes, et le décor de chaque pièce ci-dessous s'y réfère.

1. **Le mobilier vit contre les murs et dans les coins.** Une pièce dont tout le contenu
   est au milieu est une pièce fausse. Le centre n'est occupé que lorsque la **fonction**
   l'exige : un bassin de cour, un cercle de combat, une table de réfectoire, un îlot de
   supervision, un pupitre d'examen.
2. **Grouper.** Ce qui sert ensemble est ensemble : les casiers alignés, les postes de
   netrun en rangée face au même mur, l'établi près de la gaine qu'il dessert.
3. **Orienter.** Une chaise regarde sa table, un poste regarde son écran, un banc regarde
   ce qu'on attend. Les rotations sont des quarts de tour : **0 = l'avant du modèle regarde
   le sud (+y), 90 l'est, 180 le nord, 270 l'ouest.**
4. **Laisser respirer.** Une circulation lisible du seuil vers l'ancre narrative. Le joueur
   traverse sans slalom.
5. **L'ancre narrative se détache.** Autour d'elle : du vide, une lumière, ou un marquage
   au sol — jamais trois meubles.
6. **L'ASCII est la vérité de collision** ([ADR 0017](../process/adr/0017-habillage-exploration-declaratif.md)).
   Un accessoire visible sur une case franchissable ment au joueur ; une case `o`/`T` sans
   modèle est un cube anonyme. Les deux sont interdits, et
   [`tests/unit/exploreVisualPlacements.test.ts`](../../tests/unit/exploreVisualPlacements.test.ts)
   le vérifie case par case.

**Cohérence d'état.** L'académie est **entretenue** : le mobilier y est rangé, aligné,
symétrique, et le vide est un vide d'usage (on s'y met en rang, on s'y croise). Le centre
d'examen est **désaffecté** : le mobilier y a été poussé contre les murs et laissé là, le
vide est un vide d'abandon, et les seules lumières et marquages encore lisibles sont ceux
qui désignent une décision. Le même modèle peut jouer les deux rôles tant que son
implantation change (une banque technique alignée à l'académie / de guingois au centre) ;
le catalogue [`src/data/exploreVisualModels.ts`](../../src/data/exploreVisualModels.ts)
note pour chaque modèle ce que le joueur doit y reconnaître.

---

## Académie HOLT

### Administration — `administration`

- **Usage** : le guichet de l'académie ; on la traverse pour passer d'un couloir à l'autre.
- **Coup d'œil** : la porte fermée du directeur, au nord, et le guichet qui la garde.
- **Espace** : guichet adossé au mur nord à l'est de la porte (l'agent se tient derrière,
  côté mur) ; bancs d'attente au mur sud, tournés vers le guichet ; armoire à dossiers au
  mur ouest. La bande `y=3..5` reste libre : c'est le passage entre les deux portes.

### Interface — `interface`

- **Usage** : la salle de netrun des 13-17 ans ; les cadets s'y branchent sur des postes.
- **Coup d'œil** : le terminal resté allumé — celui que Franklyn n'a pas le droit d'ouvrir.
- **Espace** : trois postes **en rangée contre le mur nord**, tous face à la salle ; le
  terminal isolé contre le mur ouest, seul, pour qu'il se détache des trois autres ;
  allée libre de la porte est jusqu'à lui.

### Infirmerie & labo — `infirmerie`

- **Usage** : on y soigne et on y bricole du biomédical ; Abigail y passe son temps libre.
- **Coup d'œil** : Abigail, au milieu de l'allée ; sinon les deux lits médicaux alignés.
- **Espace** : lits **tête au mur ouest**, alignés ; paillasse et armoire à pharmacie au
  mur nord ; le centre reste dégagé, c'est là qu'on se tient pour parler.

### Armurerie — `armurerie`

- **Usage** : on y signe les tasers d'exercice ; John les vérifie au temps libre.
- **Coup d'œil** : John, debout sur le marquage de rassemblement au centre.
- **Espace** : trois râteliers **en rangée contre le mur nord**, deux caisses contre le mur
  sud, l'armoire blindée dans l'angle sud-est. Le centre porte un marquage au sol : c'est
  là qu'on forme les rangs, et c'est ce vide marqué qui fait ressortir John.

### Archives & serveurs — `archives`

- **Usage** : la mémoire de l'académie ; Letitia y relit les plans du centre d'examen.
- **Coup d'œil** : Letitia dans l'allée centrale, entre deux murs de rangement.
- **Espace** : baies de serveurs **en rangée au nord**, rayonnages d'archives **en rangée
  au sud**, allée centrale `y=35` dans l'axe exact de la porte est. Deux familles de
  silhouettes qui se répondent de part et d'autre du couloir.

### Local technique & énergie — `local-technique`

- **Usage** : l'alimentation et l'air de toute l'aile ; ça bourdonne.
- **Coup d'œil** : les deux transformateurs, côte à côte — le bruit vient d'un seul endroit.
- **Espace** : transformateurs **groupés contre le mur ouest** ; établi de maintenance au
  mur sud, **sous la gaine qu'il dessert** ; conduite et balise au plafond de l'allée.

### Couloirs (ouest, est, ceinture)

- **Usage** : relier, et montrer le contrôle institutionnel.
- **Coup d'œil** : la porte condamnée de la seconde génération `(0,25)`, la seule anomalie
  d'un couloir par ailleurs répétitif.
- **Espace** : rien au sol. Les couloirs ne sont pas des `RoomDef` : un placement qui y
  vivrait devrait être déclaré `visibility: 'exterior'` (toujours visible), ce qui est
  cohérent avec « les couloirs ne se découvrent pas » (08-EXPLORATION). Ils restent nus
  pour l'instant — c'est un manque assumé, pas un oubli.

### Dortoirs — `dortoirs`

- **Usage** : où dorment les 13-17 ans ; Franklyn s'y réveille.
- **Coup d'œil** : son lit (on y apparaît), puis son casier, puis l'allée vers le sud.
- **Espace** : « lits en rangées ouest et est, pièce commune au centre » (09-MAPS). Quatre
  lits **tête au mur ouest**, quatre **tête au mur est**, deux bancs de casiers adossés au
  mur nord au-dessus de la pièce commune, bancs et sas de contrôle au mur sud. Le centre
  (`x33-43`) est vide : on s'y habille, on s'y croise, et l'allée vers les deux sorties
  sud est franche. La porte du couloir de ceinture `(25,7)` tombe dans le trou laissé
  exprès entre les deux lits ouest.

### Cour intérieure — `cour-interieure`

- **Usage** : la respiration entre les bâtiments ; Grover y tient sa cour au temps libre.
- **Coup d'œil** : le bassin carré, point d'orientation de toute l'aile est.
- **Espace** : le bassin occupe le centre **parce que c'est sa fonction** ; l'arbre le
  flanque au nord-est ; les massifs tiennent les quatre coins ; deux bancs sur les bords
  **regardent le bassin**. Le banc ouest et le banc sud-est forment deux alcôves de
  conversation distinctes du passage nord-sud : Grover est à l'une, Theodore à l'autre.

### Cantine — `cantine`

- **Usage** : on y mange, et on y écoute le discours du directeur.
- **Coup d'œil** : l'estrade, seule sous la seule lumière franche de la salle.
- **Espace** : **deux rangées de trois tables** parallèles avec une allée franche entre
  elles (`x42-43`) ; estrade adossée au mur sud, face aux tables ; comptoir de service
  continu le long du mur est. Chaque chaise **regarde sa table** ; celles des figurants
  occupent leur case (un cadet est assis dessus), celle de Franklyn reste franchissable
  parce qu'un `seat` s'occupe — on s'assoit dessus, c'est le geste.

### Salles d'entraînement — `salles-entrainement`

- **Usage** : deux usages dans une seule salle — l'examen écrit le matin, l'entraînement
  le reste du temps.
- **Coup d'œil** : pendant l'examen, le pupitre de Franklyn dans les rangs ; sinon le
  cercle de combat, peint au sol.
- **Espace** : la salle est coupée en deux. **Au nord**, quatre rangs de sept pupitres,
  tous tournés vers le bureau de l'examinateur adossé au mur nord — un rang régulier est
  juste ici, c'est une salle d'examen. **Au sud**, le cercle de combat, dégagé, avec les
  agrès contre le mur ouest, le sac de frappe à côté d'eux (Zachary y est) et deux bancs
  contre le mur est **qui regardent le cercle**. Le centre sud est vide parce qu'il porte
  un marquage : c'est le seul vide qui se justifie tout seul.

### Garage — `garage`

- **Usage** : le garage des fourgons ; c'est par là qu'on part au centre d'examen.
- **Coup d'œil** : le fourgon prêt au départ, et les chevrons vers la porte nord.
- **Espace** : les deux fourgons garés **le long des murs ouest et est**, nez au nord,
  allée centrale libre du seuil jusqu'aux portières ; établi et fûts au fond nord.

---

## Centre d'examen désaffecté

### Parking — `parking`

- **Usage** : le fourgon vous dépose ; c'est le seuil du lieu.
- **Coup d'œil** : la façade et sa porte, au nord, au bout d'un marquage au sol.
- **Espace** : le fourgon garé **sur le côté est**, pas au milieu de l'aire de manœuvre ;
  fûts et caisses dans les angles ouest ; deux barrières de chantier qui encadrent le
  chemin ; pylône de signalisation à l'angle nord-est. Le centre est vide — c'est une aire
  de manœuvre, son vide est son usage — et le marquage mène droit à la porte.

### Hall d'entrée — `hall`

- **Usage** : l'accueil du centre ; l'instructeur y fait son briefing et distribue le matériel.
- **Coup d'œil** : l'instructeur, debout sur le marquage de rassemblement.
- **Espace** : bancs d'attente **adossés aux deux murs latéraux**, tournés vers le centre ;
  banque technique et cage à matériel au mur nord, de part et d'autre de la porte de la
  salle 1 ; caisses dans l'angle sud-ouest. Le centre est vide et marqué : les deux bancs
  le regardent, l'instructeur s'y tient. Circulation directe du sas sud au centre, puis à
  la porte nord, fléchée par des chevrons.

### Salle 1 — la porte et le chien — `salle1`

- **Usage** : le premier obstacle réel — une porte verrouillée, un chien de garde, un otage.
- **Coup d'œil** : **le chien d'abord** (seul au milieu, sur le couloir peint de l'ancien
  parcours cynophile), **l'otage ensuite** (à couvert derrière le poste de sécurité du mur
  est), **les deux portes enfin** (l'entrée au sud-est, la sortie au nord-ouest).
- **Espace** : tout le mobilier est sur les bords. Le mur ouest porte l'enclos cynophile,
  grille ouverte — c'est la silhouette qui raconte le chien avant qu'on le voie — avec
  l'obstacle de parcours et les barrières rangées à côté. Le mur est porte le poste de
  sécurité. Le mur nord porte la banque technique et la cage à matériel. Le centre reste
  vide ; la traversée est **oblique**, du seuil sud-est au seuil nord-ouest, ce qui donne
  la vue en biais que le design demande sans cacher les sorties.

### Salle 2 — le choix coûteux — `salle2`

- **Usage** : une réserve de matériel sous scellés ; forcer une armoire coûte du temps.
- **Coup d'œil** : l'armoire sécurisée, **seule** contre le mur ouest et éclairée ; puis la
  porte nord, à l'opposé.
- **Espace** : l'armoire occupe le mur ouest à elle seule, avec ses caisses au sud ; tout
  le reste du matériel est aligné au mur est (deux cages) et au mur nord (banque
  technique). Le centre est traversé en diagonale du seuil sud-ouest au seuil nord-est, et
  des chevrons peints y conduisent. La composition pose le choix : l'armoire d'un côté, la
  porte de l'autre, rien entre les deux.

### Salle 3 — le gaz et la vidéo — `salle3`

- **Usage** : une ancienne salle de contrôle ; le gaz s'y répand, un ordinateur montre la
  vidéo de l'équipe adverse.
- **Coup d'œil** : l'îlot de supervision au centre, puis la sortie nord dans son axe.
- **Espace** : **seule pièce du centre où le centre est occupé**, et c'est justifié : une
  salle de contrôle a sa console au milieu (09-MAPS le dit explicitement, « ordinateur au
  centre »). Autour, du vide. La gaine éventrée est **au-dessus du chemin vers la sortie**,
  avec la zone hachurée sous elle : on comprend d'où vient le gaz et où il faut aller du
  même coup d'œil. Bouteilles sous pression au mur nord, banque de filtration au mur ouest,
  trémie et fûts dans les angles est.

### Cour de containers — `cour`

- **Usage** : l'affrontement final ; elle n'est explorée que le temps de franchir le portail.
- **Coup d'œil** : le portail, au nord.
- **Espace** : **intouchable**. La cour est l'empreinte de [`yard-map.ts`](../../src/data/yard-map.ts)
  recopiée case pour case, et le test de correspondance de
  [`centreExamenMap.test.ts`](../../tests/unit/centreExamenMap.test.ts) en dépend. Le seul
  habillage admis y est **plat ou suspendu** — des chevrons peints et un portique au-dessus
  du portail — parce que ni l'un ni l'autre ne touche une case de collision.

---

## Ce que ce document ne décide pas

- Les couleurs, matières et lumières : [`ART-DIRECTION.md`](ART-DIRECTION.md) et
  [`EXPLORATION-VISUAL-DESIGN.md`](EXPLORATION-VISUAL-DESIGN.md).
- Ce que chaque modèle occupe en cases : [`src/data/exploreVisualModels.ts`](../../src/data/exploreVisualModels.ts),
  qui est la donnée que le test confronte à l'ASCII.
- Les silhouettes des personnages et leurs animations : hors de cette passe.
