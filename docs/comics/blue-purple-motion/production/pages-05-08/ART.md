# Direction graphique — Blue Purple, pages 05 à 08

5 novembre 2026. Contrats narratifs : [CONTRACTS.json](CONTRACTS.json) v1, storyboard correspondant. Cette bible décrit la préparation et ne vaut pas sélection des médias encore à produire.

## Références inspectées et livrées

Le directeur artistique a réellement ouvert les quatre masters sélectionnés `page-01/page-v2.png` à `page-04/page-v2.png`, l'ancre HOLT du comics v2 et les diapositives 2 à 12 du deck du propriétaire. Les masters restent intacts. Le paquet local se trouve sous `art-masters/motion-comics/blue-purple/pages-01-08/references/`.

- `cast-six-v1.png` : ancre filtrée aux six membres, composée par recadrage explicite. Franklyn, John, Abigail et Grover viennent de `art-masters/comics/holt-12-pages/v2/references/CAST-ANCHOR.png`. Wendy et l'enfant viennent du master page1. `cast-six-provenance.json` conserve sources et rectangles. La feuille complète HOLT contient Letitia et Zachary : elle n'est pas jointe aux nouveaux appels pour éviter leur importation.
- `deck-slide-02.png` : façade ; 03 : architecture du bar ; 04 : proximité du groupe, aucune autorité d'identité ; 05 : Wendy, ancienne référence réaliste ; 06 : barman gauche, silhouette trapue/tablier/barbe seulement, second homme exclu ; 07 : vision ancienne, non utilisée dans ce lot ; 08 : ville humide/foule à éviter ; 09 : ambiance urbaine, aucun personnage transféré ; 10 : parking avec Maelstrom écrit, **écarté des générations** ; 11 : portail et profondeur parking ; 12 : parking et voitures.
- `extract-deck.py` et `deck-extraction.json` relient exactement slides et images internes ODP. Une image pleine par slide a été extraite. `build-cast.mjs` conserve le montage des références ; Edge local a été exécuté hors sandbox après échec technique sous sandbox. Aucune génération d'image pour fabriquer ces ancres.

Chaque prompt possède un fichier `.references.json` avec les chemins absolus à joindre vraiment. Les références de prédécesseur encore à produire doivent être ouvertes avant l'appel suivant ; leur mention dans le prompt ne prouve pas qu'elles existent ou ont été jointes. Le journal d'appel de l'intégrateur/artiste fait foi.

## Identités, matières et continuité

Style original anime des pages1–4 : contours noirs nets, silhouettes anguleuses, aplats et ombres graphiques, bleu/cyan/magenta saturés, lampes jaunes ponctuelles. Pas de rendu photographique repris du deck. Navy des quatre cadets, bars cyan de Franklyn, tresses d'Abigail, buzzcut argent de John, longue mèche noire de Grover. Wendy adulte : mèche asymétrique bleu électrique, tempe opposée rasée, veste violette, haut noir, boucle rouge et pendentif argent. Enfant plus petit, coupe au bol et haut civil sombre sans écusson. Aucun septième membre.

Franklyn reste pâle, fatigué, tendu ; il agit avec effort après le choc et garde son inquiétude pour Letitia. Le document plié est rangé dans la poche intérieure de Wendy p05c01 puis invisible. Aucun GPS, borne, conversion de coordonnées ou nouvelle révélation. Fenêtre intacte jusqu'à p05c04, une seule vitre brisée par un seul tir extérieur. Barman maîtrisé avant le tir, sans auteur de prise assigné. Wendy ne tire pas et ne tient pas d'arme. Aucun sang ni blessure ajoutée.

Véhicule d'adaptation : vieux MPV/utilitaire familial sombre bleu-gris, empattement long, cinq portes, trois rangées de deux places, cabine haute rectangulaire, barres de toit noires, rétros carrés, phares rectangulaires et bande rouge arrière. Introduit p07c01, conservé par référence aux bandes retenues jusqu'à p08c04. Six vraies places. Volant à gauche physique ; Franklyn conducteur, Wendy avant droite. Dans un cadrage frontal regardant depuis le capot, Franklyn est donc à droite pour le spectateur. John, Abigail, Grover et l'enfant occupent quatre places arrière.

## Dessin, lettres et animations

Douze bandes générées séparément sans lettres, trois par page. Rapport2:1, cible1536×768 ou résolution native équivalente ; montage dans1000×496 avec ajustement proportionné par l'éditeur. p05b02 et p08b01 contiennent deux cases égales séparées d'une gouttière noire de1,2% de largeur. Les autres sont une image continue. Pages finales1024×1536, marges/gouttières12px, trois bandes aux y12/520/1028. Les réserves de texte sont du dessin complet sombre, sans bulles raster ni trous blancs ; SVG éditable ensuite.

Matrice14cases dans [ANIMATION.md](ANIMATION.md). Les prompts réservent un tube réel isolé, pluie derrière vitre/clôture, poussière près batte, région droite de verre hors corps, vapeur d'évent, petites mèches détachées du visage, flaque, métal serrure, voyant moteur, échappement et onde sous roues. Les animations figuratives de corps ne sont pas simulées par déformation globale. Pas de bandes lumineuses traversant les cases. Les mécanismes smoke/debris/ripple sont des capacités à produire/vérifier par animation, pas des preuves de rendu déjà obtenu.

Contrôles renforcés sur chaque sortie brute avant lettres : compter les silhouettes ; zoomer toutes mains ; anatomie plausible selon occultation, pouces du bon côté, poignets reliés à leur propre bras, prises cohérentes sur batte/arme/outillage/volant ; pas de doigts fusionnés, main détachée, membre supplémentaire ni collision de silhouettes. Contrôler véhicule/sièges/portes/vitres et orientation du volant. Ne pas couvrir un défaut par bulle/effet. Correction ciblée seulement sur défaut constaté.

## Plafond et journal

Le plafond global est défini par [IMAGE-BUDGET.json](IMAGE-BUDGET.json) :12premières bandes +4corrections ciblées,16appels maximum. Répartition intégrateur pages5–6 :6+2réserve ; direction artistique pages7–8 :6+2réserve. Aucun remplacement des pages1–4. Le coût monétaire et l'identifiant fournisseur restent inconnus si l'outil ne les fournit pas. Chaque appel garde prompt exact, références réellement envoyées, sortie native, copie dans masters, dimensions, diagnostic et décision. Une ancienne tentative `running` est inspectée avant une éventuelle reprise.

Prompts prêts dans `prompts/page-05-band-01-v1.txt` à `page-08-band-03-v1.txt`, manifestes de références voisins. `prepare-prompts.mjs` conserve l'écriture reproductible des onze suivants, le premier étant explicitement préparé et contre-revu en priorité. La contre-revue exacte et le feu vert de production sont journalisés par l'intégrateur avant chaque lot. La présence de ces documents ne prétend pas que toutes les images ont déjà passé la revue.

## Production artistique pages 7–8 exécutée

Huit appels ImageGen intégrés réellement exécutés : six premières bandes et deux corrections ciblées, allocation8/8consommée. Aucun appel perdu/interrompu ; les sorties natives sont copiées dans les tentatives et les six sélections standard. Toutes ont été ouvertes par l'artiste puis contre-revues indépendamment, avec agrandissements de toutes les mains critiques par qualité. Les empreintes et détails du verdict figurent dans [QA-IMAGES.md](QA-IMAGES.md). Aucune génération supplémentaire autorisée dans cette allocation.

| Sélection standard | Tentative retenue | Prompt exact | Résultat brut contrôlé |
| --- | --- | --- | --- |
| `page-07/band-01-v1.png` | `page-07/attempts/band-01-v1/generated.png` | `page-07-band-01-v1.txt` | Approche Wendy/Franklyn, deux gardiens, voiture trois rangées, quatre mains contrôlées |
| `page-07/band-02-v1.png` | `page-07/band-02-attempt-02/band-v1.png` | `page-07-band-02-v2.txt` | Écusson de gardien retiré, cinq zones de mains/contacts préservées |
| `page-07/band-03-v1.png` | `page-07/band-03-attempt-01/band-v1.png` | `page-07-band-03-v2.txt` | Approche voiture raccord, quatre mains et quatre pieds séparés |
| `page-08/band-01-v1.png` | `page-08/band-01-attempt-01/band-v1.png` | `page-08-band-01-v2.txt` | Main outil et deux prises volant contrôlées ; Franklyn conducteur gauche physique |
| `page-08/band-02-v1.png` | `page-08/band-02-attempt-02/band-v1.png` | `page-08-band-02-v3.txt` | Six membres, conducteur/passagère corrigés, bulles raster et main isolée supprimées |
| `page-08/band-03-v1.png` | `page-08/band-03-attempt-01/band-v1.png` | `page-08-band-03-v2.txt` | Même voiture en départ, portes fermées, silhouettes discrètes, aucune main exposée |

La première tentative p07b02 avait copié un écusson d'académie sur le gardien anonyme ; elle est conservée et exclue de la sélection. Après ce diagnostic, les prompts7b03 et8b01–03 ont des versions2 contre-revues ajoutant l'invariant explicite : seules les quatre tenues cadets portent les écussons ; Wendy, enfant et gardiens sont civils. Cette modification ne constitue pas une nouvelle dépense.

La première tentative p08b02 avait ajouté deux bulles raster vides, mis Wendy au volant et dessiné une main isolée au montant sans avant-bras lisible. La dernière réserve a corrigé exactement ces trois points : décor complet restauré, identités des deux sièges avant échangées en conservant géométrie/volant, main isolée retirée en préservant les deux vraies mains d'Abigail. Qualité a ouvert le plein dessin et les détails conducteur/Abigail/montant/enfant : favorable. Les deux premières tentatives exclues restent intactes.

Toutes les bandes pages7–8 sont natives1774×887. La première p08b01 contient une fine bordure noire et une gouttière un peu oblique ; l'éditeur choisit les rectangles de recadrage pour les deux cases. Les fichiers standard sont des copies sans retouche des natifs retenus ; aucun défaut n'a été couvert par lettrage ou effet. Les régions d'animation sont choisies ensuite sur les pages assemblées.

Journaux p07b02/b03 et p08b01/b02/b03 : `image-attempt.cjs prepare/finish`, prompts exacts et SHA256 des références avant appel, source native et copie à la clôture. Première p07b01 : `operation-running.json`, `prompt.txt`, `references.json` ont été enregistrés avant appel puis `operation.json` enrichi à la clôture avec empreintes et sortie ; ce format manuel est conservé honnêtement, sans inventer un `prepare` antérieur. Coûts monétaires et identifiants fournisseur inconnus. Les références listées ont effectivement été jointes à chaque appel intégré.
