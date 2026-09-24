# Exploration — design de la refonte visuelle

Statut : **design finalisé, implémentation autorisée et en cours**, 22 septembre 2026. Direction choisie par le
propriétaire : **3D picturale, surfaces illustrées et atmosphère**. Le propriétaire autorise
également la recomposition des plans et le déplacement des objets, et demande des
personnages aboutis et animés. Ce document prépare le
travail ; les règles artistiques existantes seront mises à jour au début de l'implémentation.
Plan de réalisation :
[`../process/EXPLORATION-VISUAL-IMPLEMENTATION.md`](../process/EXPLORATION-VISUAL-IMPLEMENTATION.md).
Orchestration :
[`../process/EXPLORATION-VISUAL-ORCHESTRATION.md`](../process/EXPLORATION-VISUAL-ORCHESTRATION.md).

## 1. Le résultat recherché

**Une académie de béton clair, dessinée par la lumière du désert, que l'on explore comme
un décor peint en volume.** Des ombres colorées, des surfaces brossées, des objets aux
silhouettes nettes, une institution ordonnée où les traces personnelles des cadets
apparaissent à petite échelle. Puis un centre d'examen plus froid, usé et inquiétant.

La transformation doit être visible sans lire le HUD : reconnaître un dortoir, une
cantine, une infirmerie ; reconnaître Franklyn comme un cadet ; comprendre où marcher.
Le gain vient d'abord du cadrage, des volumes et des valeurs, puis des matières et des
petits détails. Une texture de bruit ajoutée aux cubes actuels ne suffit pas.

Conserver la caméra orthographique, ses quatre orientations, le déplacement sur grille,
les scènes et le HUD « Encre rouge ». La 3D partage ses couleurs et sa discipline visuelle
avec les portraits illustrés, sans leur appliquer partout la trame d'imprimerie.

## 2. Ce que montre le projet actuel

Revue du code et **trois captures du jeu lancé**, 1600 × 900, DPR 1, graine `visual-review`.
Captures locales de travail dans `tmp/exploration-visual-review/` (ignoré par Git) :

| Vue                | Reproduction                                  | Constat visuel                                                                                                                 |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `01-dormitory.png` | `/?seed=visual-review&scene=ch1.vers-cantine` | Franklyn petit, dortoir très vide, lits représentés par des cubes ; murs et pièces cachées occupent une grande partie du cadre |
| `02-canteen.png`   | Même URL, `__game.walkTo(41,15)`, touche `C`  | Tables et sièges difficiles à identifier ; la couleur du sol distingue davantage la pièce que son mobilier                     |
| `03-exam.png`      | `/?seed=visual-review&scene=ch1.salle1`       | Salle lisible comme rectangle, mais presque sans identité matérielle ; grand sol extérieur uniforme                            |

Aucune erreur JavaScript de page dans ces captures. Ce constat ne remplace ni une revue
complète du chapitre ni une mesure de performances ; aucune promesse de 60 fps n'en découle.

Points d'appui du code :

- `src/render/exploreView.ts` : sols par pièce, blocs de mobilier, murs coupés à 0,4 m,
  trois lumières globales, découverte et sélection. C'est déjà un rendu d'exploration
  fonctionnel, pas seulement une scène de démonstration.
- `src/exploreSession.ts` : renderer, entrées, boucle d'images, synchronisation du jeu et
  graine visuelle indépendante. Point d'intégration plus pertinent que `chapter.ts`.
- `src/render/characterRig.ts` : contrat de six animations et capsules de remplacement.
- `src/data/maps/holt.ts` et `centre-examen.ts` : cartes réelles, personnages et interactions.
- `tests/unit/explore*.test.ts`, `tests/e2e/explore.spec.ts` : protections à conserver.

Les résumés anciens ne décrivent pas tous l'état actuel : l'exploration est déjà livrée
jusqu'au lot 3.7 dans la feuille de route. Le document des cartes contient encore des
passages qui les disent à écrire. Consulter le code et les tests pour les détails déjà
implémentés, puis corriger seulement les passages concernés pendant l'exécution.

## 3. Direction artistique concrète

### Composition et échelle

Le cadrage initial doit montrer **la pièce vécue et son prochain seuil**, avec Franklyn
dans la zone centrale dégagée du HUD. Point de départ à tester : environ 45–70 pixels de
haut pour un cadet à 1080p au zoom usuel, plutôt qu'une minuscule capsule. Cette plage
est un objectif de composition, pas une raison de modifier la taille physique du cadet.

Conserver le dézoom pour lire l'académie entière. Aucun suivi permanent ni zoom automatique
à chaque pas. Revoir le cadrage d'entrée et les limites de panoramique uniquement côté
exploration ; ne pas changer le comportement tactique de `IsoCamera` par accident.
Tester aussi 1280 × 720, où le HUD prend proportionnellement plus de place.

### Valeurs, lumière et matières

- Académie **diurne et nette** : béton crème grisé, acier bleu pétrole, ombres ardoise,
  soleil ocre pâle. Usure aux seuils et poignées, poussière dans les joints ; pas de ruine.
- Centre d'examen : béton froid, peinture écaillée, rouille sourde, lumière de secours
  rouge rare, petits écrans cyan. Les sorties restent lisibles dans la pénombre.
- Surfaces picturales : grandes plages de teinte, coups de brosse peu contrastés,
  variations aux arêtes et aux assemblages. Détails fixés au monde ou aux UV, stables
  pendant le panoramique ; aucun filtre de bruit qui glisse devant la caméra.
- Relief par plinthes, cadres, épaisseur des plateaux, chanfreins et quelques tuyaux.
  Les grandes faces restent calmes ; tous les murs ne deviennent pas des filaires.
- Matériaux mats ; métal peint distingué du tissu et du béton. Pas de reflets miroir.
  Ombres de contact sobres sous les meubles et les pieds, sans taches noires cumulatives.
- Éclairage initial : conserver les trois sources existantes, mais régler leur équilibre,
  l'exposition et les ombres. Écrans et luminaires émissifs pour leur aspect, avec des
  taches de lumière peintes contrôlées si nécessaire : **un émissif seul n'éclaire pas
  les surfaces voisines**. Ajouter des lumières locales réelles seulement si la tranche
  pilote le justifie, après mise à jour explicite de la règle des trois sources.

Proposition de palette 3D : béton `#a49a84`, ombre `#394650`, uniforme `#263745`, soleil
`#d8b37c`, végétation `#65715a`, rouge institutionnel `#a1433e`, électronique `#73a7ac`.
Ce sont des directions d'albédo à régler sous l'éclairage réel, pas des couleurs promises
pixel pour pixel. Les jetons du HUD restent ceux de `theme.css`.

Pas de profondeur de champ, aberration chromatique, pluie systématique, bloom envahissant,
contour noir sur chaque triangle ou SSAO requis pour rendre la scène compréhensible.

### Identité des lieux

**Le cyberpunk doit se lire dans les objets et les usages.** HOLT combine architecture
institutionnelle, portes à contrôle d'accès, lecteurs de neuroports, postes de netrun,
caméras de surveillance, câblage ajouté après construction et écrans de consignes. Les
cadets vivent au milieu de cette infrastructure qui les forme et les surveille. Le centre
réemploie ces mêmes équipements, réparés, ouverts, dépareillés et parfois hors service.
Ni simple caserne contemporaine, ni néons multicolores ajoutés à un décor générique.

Trois échelles de lecture : architecture et lumière à distance ; machines, mobilier et
silhouettes au zoom de jeu ; matières peintes et signes personnels au zoom rapproché.
Les accès importants reçoivent une silhouette technique claire : cadre renforcé,
lecteur latéral, voyant local, conduites. Réserver les halos et le rouge aux foyers utiles.

| Lieu                                          | Silhouette / élément principal                        | Matière et détail narratif                                                          |
| --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Dortoirs, première tranche                    | Lits lisibles, rangées de casiers, passage central    | Couvertures pliées, vêtements rangés, affaires de Franklyn ; soleil sur le sol      |
| Couloirs                                      | Encadrements répétés, bande peinte, niches techniques | Béton entretenu, seuils patinés, panneaux institutionnels sans microtexte           |
| Cantine                                       | Tables avec plateaux et pieds, comptoir de service    | Stratifié chaud, métal peint, plateaux repas ; organisation collective              |
| Cour intérieure                               | Arbre et bassin carré, bancs                          | Minéral clair, végétation poussiéreuse ; respiration entre les bâtiments            |
| Entraînement / examen                         | Pupitres, agrès, cercle au sol                        | Sol résistant, matériel rangé ; configuration narrative existante conservée         |
| Infirmerie / Interface / archives / armurerie | Lit médical / consoles / rayonnages / racks           | Quatre familles de silhouettes, palette institutionnelle commune                    |
| Administration / technique                    | Bureau et rangement / machines et conduites           | Ordre administratif / équipements entretenus ; détails sobres                       |
| Garage                                        | Deux véhicules cohérents sur plusieurs cases          | Tôle mate, pneus, établi, marquages ; arrêter de lire chaque case comme une voiture |
| Centre, salles 1–3                            | Porte et panneau / armoire / terminal                 | Dégradation progressive, repères de sortie, effets compatibles avec l'état narratif |
| Parking et approche de la cour                | Fourgon, barrières, containers nervurés               | Poussière et acier usé ; géométrie tactique exactement conservée                    |

Les écrits lisibles restent en français et en HTML/CSS selon la règle actuelle. Les
atlas portent des pictogrammes et des marques abstraites. Une vraie signalétique textuelle
dans la 3D demanderait une décision distincte ; ce projet n'en dépend pas.

### Recomposer les plans, pas seulement les habiller

Les dimensions et coordonnées actuelles sont un point de départ, **pas une contrainte
de conservation**. Réorganiser pièces, seuils, allées, mobilier et points d'apparition
pour créer des cadrages et un parcours plus intéressants. Mettre à jour ensemble les
cartes de gameplay, l'habillage, les points d'interaction, les objectifs qui référencent
des positions et `09-MAPS-CHAPTER-1.md`. Garder les identifiants sémantiques quand leur rôle
ne change pas. Vérifier la compatibilité des sauvegardes par étape et découverte ; si un
identifiant change réellement, traiter explicitement la migration.

| Secteur           | Recomposition proposée                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dortoir           | Petites travées de couchage avec vraies emprises de lits, casiers regroupés, coin de Franklyn identifiable, allée vers un sas de contrôle ; casser le rectangle vide sans créer de labyrinthe |
| Dortoir → cantine | Un seuil cadré, une vue partielle vers la cour, une bifurcation simple ; caméras et console de présence matérialisent le contrôle institutionnel                                              |
| Cantine           | Deux ou trois ensembles de tables avec allées franches, comptoir et estrade lisibles ; mettre en scène le groupe et le directeur, pas une grille de cubes équidistants                        |
| Cour              | Bassin et arbre comme point d'orientation, bancs sur les bords, infrastructure visible derrière le calme ; distinguer espace collectif et alcôves de conversation                             |
| Aile technique    | Netrun, clinique, armurerie et serveurs lisibles dès leur seuil ; densité sur les bords, espace utile devant consoles, lits et racks                                                          |
| Garage            | Véhicules d'une seule pièce, zones de maintenance, vrai chemin d'embarquement ; porte extérieure comme grande source de lumière                                                               |
| Centre d'examen   | Sas successifs et vues obliques, masses de mobilier qui cadrent les décisions, terminaux de sécurité bricolés ; tension croissante sans cacher les sorties utiles                             |

Conserver les fonctions narratives, les grandes identités des ailes et l'ordre des
épreuves ; les couloirs et proportions peuvent changer. La cour tactique reste une
empreinte issue de `yard-map`, même si son point d'insertion dans la carte évolue : toute
translation déplace aussi portail, zones et accès et conserve le test de correspondance.
Ne pas profiter de ce chantier pour redessiner les règles ou le combat.

La composition est validée **avant** de produire une cible image détaillée : établir un
plan simple à partir des volumes utiles et des routes, mesurer les passages, puis cadrer
le vrai blockout reconstruit. Le propriétaire autorise cette recomposition ; aucune
demande de permission supplémentaire n'est nécessaire pour déplacer une table ou une porte.

### Personnages et mouvement : un livrable principal

État des moyens au 22 septembre : aucun GLB/GLTF/FBX de personnage trouvé dans le dépôt,
aucun exécutable Blender ou gltf-transform trouvé sur le PATH. Vérifier les installations
hors PATH et résoudre la création ou l'acquisition d'une base autorisée dès le premier
lot. Cette préparation fait partie de l'implémentation, pas d'une obligation pour le
propriétaire de fournir lui-même tous les modèles.

Les six cadets doivent être reconnaissables par **silhouette, coiffure, uniforme et
attitude**, même sans anneau coloré. Proportions humaines stylisées, tête légèrement
favorisée pour la lecture isométrique, épaules et mains lisibles, vêtements ayant un
volume réel. Les textures peintes portent des plis larges et des ombres de matière.
Ne pas livrer six capsules améliorées ou six mannequins identiques recolorés.

| Cadet    | Identité à conserver                                                     | Attitude proposée, sans changer la personnalité écrite                           |
| -------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Franklyn | Cheveux châtains courts en bataille, blouson montant, neuroport discret  | Réserve, épaules un peu fermées, regard vers le terminal lorsqu'il l'utilise     |
| Abigail  | Cheveux noirs tressés, blouson, outils cohérents avec son rôle           | Appuis stables, petits gestes précis ; aucun objet porté absent de l'état du jeu |
| Letitia  | Chignon bouclé, peau métissée, galons et tenue correspondante à la scène | Posture ouverte, gestes mesurés, tête attentive à l'interlocuteur                |
| John     | Cheveux platine rasés, peau claire, absence de neuroport                 | Silhouette ferme, économie de mouvement, vigilance                               |
| Grover   | Cheveux noirs mi-longs, chemise et cravate                               | Posture détendue, se tourne franchement vers le groupe                           |
| Zachary  | Coupe au bol, peau brune, vareuse                                        | Énergie dans les appuis et gestes d'attente, sans agitation permanente           |

Pipeline recommandé : **un véritable humanoïde stylisé partagé, squelette commun et
variantes de meshes**, exporté en GLB avec animations, ou construit avec un outillage
équivalent disponible. Produire d'abord Franklyn fini, avec marche et idle ; valider sa
qualité dans la scène, puis décliner les cinq autres. Vérifier au départ les outils locaux,
les modèles disponibles, les droits et les clips. Une image générée ne remplit aucun de
ces besoins 3D. Aucun achat ni service payant implicite, aucun compte externe supposé.

S'il manque une base riggée, l'agent personnages évalue une création locale par script de
modélisation avec squelette et poses explicites. Le rigging génératif automatique reste
exclu. Un rig articulé construit en code peut servir au prototype technique, mais il n'est
accepté en livraison que s'il atteint le même niveau de silhouette, déformation et animation.
Une dépendance d'asset non résolue est signalée comme telle, jamais masquée par « terminé ».

Conserver `CharacterRig`, orientation `+Z`, matériel visible et les six animations du
contrat. Ajouter une capacité d'exploration optionnelle, séparée du combat, pour les poses
contextuelles. La proposition d'extension doit être écrite dans l'ADR et ART-PIPELINE.

| Animation            | Attendu                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idle                 | Respiration subtile, transfert d'appui lent, variantes déterministes ; pas de phase synchronisée sur tous les cadets                                       |
| Marche / course      | Pas cohérents avec la distance réellement parcourue, pieds qui ne glissent pas, balancement opposé bras/jambes, transitions départ/arrêt et virages courts |
| Interaction          | Se tourner vers la cible, petit geste de main vers lecteur/terminal, retour au repos ; ne jamais retarder ou rejouer un effet narratif                     |
| Assis / conversation | Poses alignées sur les sièges et sur l'interlocuteur, gestes sobres ; utiles aux figurants de la cantine et aux pupitres                                   |
| Six états du contrat | `idle`, `walk`, `run`, `shoot`, `down`, `revive` couverts, sans obliger le tactique à adopter le nouveau rig dans ce lot                                   |

La position appartient toujours au gameplay : animations sur place, sans root motion qui
déplace le cadet hors de sa case. Prévoir des points d'ancrage pour mains/équipement et
sièges, et une vitesse d'animation liée au déplacement rendu. Tous les PNJ visibles passent
par la même fabrique de personnages ; ne pas améliorer seulement Franklyn et laisser
des capsules à la cantine. Les figurants réutilisent le squelette avec quelques variantes
et des animations moins fréquentes au dézoom. Les instructeurs ont une silhouette adulte.

Donner de la vie sans changer les règles : figurants qui discutent ou utilisent leur poste,
postures contextuelles définies dans les données, sans errance qui bloque les allées.
Les mouvements fonctionnels restent visibles sous `prefers-reduced-motion`, les gestes
et effets décoratifs peuvent se calmer ou s'arrêter.

Ambiance : poussière localisée dans les rais de soleil, feuillage léger, écrans et petits
mécanismes. Aucun effet ne fait avancer le tempo ni ne tire dans le RNG du jeu. La scène
respecte la pause des dialogues et la découverte ; une animation ne révèle pas une salle cachée.

## 4. Architecture proposée, à consigner dans un ADR avant de coder

Garder `MapDef` comme vérité du gameplay. Ajouter un **habillage visuel déclaratif**, par
carte, qui référence les pièces, cases et identifiants existants. Les types restent sans
Three.js ; les constructeurs de géométrie vivent dans `src/render/`.

Fichiers proposés (n'existent pas encore) :

| Zone                                                 | Responsabilité                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/data/exploreVisualTypes.ts`                     | Contrats : palette, placement, emprise, pièce propriétaire, lien d'entité |
| `src/data/exploreVisuals/holt.ts`, `centreExamen.ts` | Habillage explicite des cartes, sans conditions de gameplay dupliquées    |
| `src/render/exploration/materials.ts`                | Petit catalogue de matières et atlas communs                              |
| `src/render/exploration/architecture.ts`, `props.ts` | Murs, cadres, meubles, végétation, véhicules                              |
| `src/render/exploration/dressing.ts`                 | Assemblage, découverte, coupe, ressources, raccord à `ExploreView`        |
| `src/render/exploration/cadetRig.ts`                 | Nouveau rig derrière le contrat existant                                  |
| `public/assets/exploration/`                         | Atlas légers réellement utilisés, provenance documentée                   |

Contrats à fixer avant la délégation :

1. Un placement a un `id` stable, un modèle, une position en cases, une orientation,
   une emprise et un `roomId` ou une visibilité extérieure explicite. `entityId` optionnel
   lie l'apparence à une entité existante ; aucun nouveau déclencheur dans l'habillage.
2. Un objet remplaçant du mobilier déclare les cases dont il remplace les blocs. Elles
   sont supprimées du rendu générique pour éviter les doublons, pas du modèle de collision.
3. Un meuble solide reste dans les cases déjà bloquées. Une décoration sur une case
   marchable doit être plate ou surélevée sans donner l'impression qu'on la traverse.
   **Un vrai lit de deux mètres ne rentre pas honnêtement dans une case d'un mètre.**
   Redessiner son emprise dans la carte en même temps que le modèle, documenter la nouvelle
   implantation et valider les chemins. Ne pas agrandir silencieusement le modèle à
   travers une allée. L'habillage ne décide jamais seul de la collision ; la carte
   redessinée en reste la source. Conserver la correspondance du rectangle tactique.
4. Visibilité = découverte de la pièce ET activation de l'entité, quand elle existe.
   Géométrie, ombres, contacts peints, émissions, particules et étiquettes suivent la même
   décision. Des meubles invisibles ne doivent pas projeter leurs ombres dans la pièce.
   Un modèle de PNJ chargé asynchronement est initialement masqué ; sa visibilité et ses
   animations sont synchronisées avec ces conditions avant toute première image.
5. Les ornements de murs suivent la coupe sur les quatre rotations. Les morceaux partagés
   entre deux pièces sont divisés ou possèdent une politique structurelle explicite.
   Ne pas grouper toute une carte en un mesh impossible à masquer par pièce.
6. Picking fondé sur les entités existantes et leurs cases généreuses. Le détail décoratif
   ne vole pas les clics au sol ; un siège garde sa case d'interaction fonctionnelle.
7. RNG visuel dérivé de la graine d'exploration, puis `fork` par placement stable. Ajouter
   une chaise ne redistribue pas toutes les taches de la carte et ne change aucun jet.
8. Ressources partagées libérées par leur propriétaire, une seule fois. Géométries,
   matériaux, textures et meshes instanciés suivent les transitions entre cartes.

Préférer des matériaux standard et des atlas peints légers au départ. Les couleurs par
sommet et ombres locales peuvent renforcer le volume sans shader général compliqué.
Un shader spécifique n'entre que si une lacune visuelle observée le justifie, avec un repli
simple. L'instanciation se fait par famille **et groupe de visibilité**, pas uniquement
par matériau à l'échelle de la carte.

## 5. Assets, limites et performances

Créer un petit kit réutilisable avant de multiplier les objets : béton peint, métal peint,
tissu, sol ; lit/casier/table/siège/console/rayonnage ; cadres/plinthes/grilles ; cadet.
La génération d'image fournit une cible et éventuellement des textures plates, **pas**
un mesh 3D, un squelette ou des clips d'animation. Les textures d'assets demandent leurs
propres briefs : sans perspective, sans lumière directionnelle cuite, raccordables si utile.

Budgets de départ **à mesurer et ajuster**, pas résultats acquis :

| Ressource  | Proposition                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Frame      | 60 fps à 1920 × 1080, GTX 1070 ; budget total 16,7 ms, relever médiane et p95                                                              |
| Résolution | DPR plafonné ; mesurer à DPR 1 avant les modes haute densité                                                                               |
| Textures   | 512–1024 px, quelques atlas partagés ; viser ≤ 32 Mio de textures GPU, mipmaps incluses                                                    |
| Livraison  | Viser ≤ 5 Mo de nouveaux assets légers au total, sans gros binaire individuel                                                              |
| Rendu      | Seuil d'alerte initial : 250 appels de dessin au total par image, ombres incluses ; 300 000 triangles visibles hors passes supplémentaires |
| Ombres     | Une source avec ombres, carte initiale 2048 ; mesurer avant d'augmenter                                                                    |
| Rig        | Moins de 8 000 triangles par cadet ; figurants simplifiés au dézoom si nécessaire                                                          |

Mesurer avant/après avec la même caméra, le même état et le même matériel. Les seuils
d'appels de dessin sont un garde-fou, pas une preuve de fluidité. Une exécution Chromium
headless peut utiliser un GPU différent ou un rendu logiciel : ne pas annoncer la cible
GTX 1070 comme atteinte sans mesure correspondante. Vérifier l'absence de croissance
persistante des ressources après plusieurs changements de carte.

## 6. Une boucle visuelle bornée

1. **Référence jouable** : conserver les captures d'audit, établir le cadrage rapproché
   avec les contrôles actuels, puis enregistrer état, caméra, viewport et graine.
2. **Composition et cible** : établir le nouveau plan, le reconstruire en blockout
   jouable, cadrer et capturer. Éditer cette capture par génération d'image, en gardant
   l'ancien jeu comme référence d'identité. Une cible principale, dortoir + seuil du
   couloir, et une planche de Franklyn en volume/poses. Préserver le HUD et la découverte ;
   toute géométrie imaginée doit avoir un chemin de réalisation identifié. Une cible
   secondaire du centre fixe ensuite le contraste d'atmosphère.
3. **Tranche pilote** : nouveau cadrage et plan, murs, sol peint, mobilier du dortoir,
   Franklyn abouti et animé, ombres.
   C'est un morceau du vrai chapitre, pas une scène de démonstration indépendante.
4. **Revue** : une manche de quelques captures décisives après intégration, comprenant
   orientation opposée et pièce cachée. Contrôler le mouvement par une courte session,
   pas par des dizaines d'images. Corriger les trois écarts les plus importants.
5. **Extension** : cantine/cour/autres salles, puis centre d'examen avec la même bibliothèque.
   Vérifier toutes les pièces et états, y compris les coins absents de l'image cible.
6. **Clôture** : parcours complet, vérifications automatisées et performances rapportées.

Ne pas viser une égalité pixel par pixel avec une image inventée : elle peut contenir
des ombres, proportions ou détails incompatibles avec le jeu. Viser sa composition,
ses masses de valeurs, ses matières et sa qualité perçue, puis vérifier la scène en mouvement.
Ne jamais modifier la cible après coup pour faire passer un résultat insuffisant.

Critères visuels, notés de 0 à 2 : cadrage ; identification des lieux ; matières peintes
stables ; lumière et profondeur ; personnages et marche ; cohérence avec HOLT. Viser
10/12 minimum, aucune catégorie à zéro. Cette note reste un jugement argumenté, accompagné
des captures ; elle ne remplace pas le jugement du propriétaire.

Conditions impératives indépendantes de cette note : toutes rotations lisibles, pas de
fuite des pièces cachées, clics et parcours conservés, aucun effet sur le RNG du gameplay,
aucun mobilier traversé, interface lisible à 720p, aucun crash ni ressource oubliée.

## 7. Décisions à formaliser pendant l'implémentation

- Nouvel ADR, prochain numéro libre : habillage séparé du gameplay et remplacement des
  blocs ; frontières de responsabilités et gestion de la visibilité. **Fait** : ADR 0017.
- Complément d'ART-DIRECTION : exploration picturale, atlas basse résolution autorisés,
  maintien des contraintes de lisibilité ; le texte actuel interdit toutes les textures.
- Lumières locales pour les luminaires du décor (réglette, balise), au-delà des trois sources
  globales, avec mise à jour explicite de la règle des trois sources : **fait**, ADR 0018 et
  ART-DIRECTION.md « Lumière ». Portée courte, sans ombre projetée, désactivées gratuitement
  avec la pièce (enfant du groupe du placement, suit `ExploreDressing.syncVisibility`).
- Complément d'ART-PIPELINE : humanoïdes, variantes et poses contextuelles, échelle d'exploration de 1 m contre
  l'échelle tactique existante, propriété et provenance des assets. Ne pas modifier
  globalement l'échelle sous prétexte d'unifier les commentaires anciens.
- Mise à jour de `09-MAPS-CHAPTER-1.md` pour les plans redessinés, et de `08-EXPLORATION.md`
  si une règle de caméra ou de présentation des interactions évolue. Les choix narratifs
  et la progression restent les mêmes.
- Clarifier que la bible des **illustrations 2D** reste en vigueur pour portraits/décors
  narratifs ; une cible de rendu 3D et ses textures de production ont un autre rôle.
- Reporter toute évolution publique de debug dans `DEBUG_API.md` et
  `tests/e2e/debug-api.d.ts`. Préférer un outil de capture de développement à une API
  publique ajoutée seulement pour prendre une image.

Hors périmètre : nouveau moteur, combat fusionné avec l'exploration, refonte des règles,
nouveau système de quêtes, réécriture du chapitre, refonte générale du HUD, production audio.
