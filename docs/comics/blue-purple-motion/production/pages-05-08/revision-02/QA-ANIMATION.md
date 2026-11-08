# Contre-revue des changements animés — révision 02

6 novembre 2026. **Avis favorable pour gel et exports**, sur preuves réelles
décrites ci-dessous. Aucun nouveau rendu ou appel payant lancé par le reviewer.

Base des preuves ciblées après déplacement :
`art-masters/motion-comics/blue-purple/pages-05-08/revision-02/qa/animation-candidate-v1/`.
Les 41 fichiers de 12 dossiers ont conservé leurs octets et noms ; rapport
`qa-animation-relocation-report-v1.json` completed/allBytesUnchanged:true.

## Pointes seules page 6

Deux PNG1280 de `tips-v1` sous cette base ont été ouverts, puis
deux zooms indépendants de toute la tête Wendy. Seules les extrémités latérales
libres varient ; front, crâne, sommet, racines, yeux/visage et col restent fixes.
Pas de couture, copie rectangulaire ou déformation de la tête observée. Le
rapport mesure 954 pixels de pointe changés, zéro crâne/sommet/face/col et zéro
altération crâne/face par rapport au dessin. OFF exactement master canonique.

## Voiture fixe et particules page 8

Trois PNG1280 start/middle/final de `fixed-car-v1` sous cette base ouverts : même
position, taille, orientation, roues et ombre aux trois temps. Ancrage conservé,
pas de flottement ajouté ; fines particules directionnelles restent dans les
zones libres de rue autour du véhicule. Pas de bande lumineuse, rectangle,
glissement du fond ou collision avec carrosserie/bulle observé.

Rapport : voiture+ombre zéro pixel changé start/middle/final et en pause, zéro
altération du master ; aucun calque de mouvement véhicule. Vent 2123 pixels de
delta, absent avant son gate ; OFF exactement master. Cette preuve valide bien
la demande de voiture fixe, pas une nouvelle trajectoire de voiture.

## Vitre intacte, puis bris

PNG1280 lecteur story-thumbnail-v1 à0/16,1/16,45 s réellement ouverts depuis
art-masters : vue page et miniature intactes au début, cadre intact avant tir,
verre brisé ensuite, miniature au même état. Mains/visages/bulles restent visibles.
Les trois nouveaux PNG de `glass-state-v3` sous cette base à16,399 /16,4 /17,2 s
ont ensuite été ouverts : aucun fragment avant, commutation nette à l'impact,
éclats visibles après, sans morphing des doigts/acteurs ou masque de défaut.

Rapport final v3 lu : états0/15,9/16,399 intacts,16,4/17,2/20,39 brisés ; zéro
pixel d'artwork incorrect par rapport aux sources exactes à chacun des six temps.
Seconde frame à `16.4 - 15.9 = 0.4999999999999982` dans le plan, ce qui résout
la frontière flottante à16,4 sans modifier le temps de tir. Événement gelé en
pause, master OFF exact. Vrai lead0,70, tir16,40 et réaction16,60 selon contrat.

Convention explicite root : ces états et la non-révélation avant tir sont ON.
OFF/reducedmotion garde le master papier déjà brisé, y compris avant le tir ;
ne pas revendiquer une vitre intacte en tous modes. Voir QA-CONTRACTS.md.

Triptyque `p05-glass-event-v1` réellement ouvert : il isole les éclats ajoutés
sur le master canonique déjà brisé, même dans sa colonne avant16,39. Il démontre
zéro ajout avant/après et une chute intermédiaire, pas l'état intact du lecteur.
La preuve de l'état intact est exclusivement fournie par les PNG lecteur et
glass-state-v3. Aucun faux défaut du reader n'est déduit du triptyque isolé.

Moteurs de ces preuves : core
`0f886f1805f74d4f022454b4a922ad64c866c6849d2f8a577e6cba77e2f4a5a9`, effects
`b5817150ae4d3ea45df4ef0e5b2f31884b84b8d36f44ca988590198809f79647`, layers
`7455809ed3d513590e23eb278fa350d05081fff6b0a07deee96e1aa1d9ee4216`.
Checker glass final `eb532ab203416d0019daced0d4d985724de20e9fd13e177e707e0e956b2de067`.
Les anciens rapports restent datés ; aucun seuil abaissé ou défaut masqué.

Les preuves de calques/protections/éclats et les snapshots legacy supplémentaires
sont produits par leurs opérateurs ; leur recoupement final avec la sélection
v4 et les six MP4 encodés est clos dans QA-FINAL.md. Trois calques/14 cases PASS,
113 protections et270542 pixels opaques des lettres courantes zéro altération.
Les sources et moteurs des exports correspondent exactement au gel approuvé.
