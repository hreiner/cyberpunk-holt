# Contre-revue visuelle des animations

5 novembre 2026. Revue des phases réellement capturées, pas un verdict fondé sur
un seul nombre de pixels. Les captures ne certifient pas une écoute ou un visionnage
humain intégral. Les résultats ci-dessous portent sur les versions exactes nommées.

## Page 5, QA v3 — deux corrections visuelles requises

Dossier `art-masters/motion-comics/blue-purple/pages-01-08/qa-animation-p05-v3/`.
Planche et huit captures pleine résolution (quatre paires A/B) inspectées. Source
lettrée ce8026… ; mêmes temps narratifs, phases ambiantes séparées de 0,65 s.

- P05-c01 : halo violet du tube forme un rectangle aux bords nets et une encoche en
  L au-dessus de la tête du barman, créée par l'intersection de sa protection.
  Défaut confirmé par crop agrandi du tube. Le mouvement existe, mais le masque
  devient visible ; corriger avant export.
- P05-c02 : pluie fine réellement différente sur vitre, hors Wendy/poursuivant et
  bulle ; favorable visuellement, sans artefact rectangulaire observé.
- P05-c03 : reflet sous batte forme une bande violette horizontale à bords nets
  en bas du cadrage (région page y986–1011). Effet trop rectangulaire pour lire
  comme reflet du sol ; adoucir/masquer, ne pas ajouter une bande mobile.
- P05-c04 : pluie localisée différente, visages/mains/bulle stables, favorable.

Poussière et verre sont des événements `clock: story` : ils restent volontairement
identiques dans ces paires au même récit. Leur avant/pendant/après reste à examiner.
Les deux réserves sont transmises à animation et intégrateur. Animation annonce une
révision locale `softEdge` additive à défaut inchangé pour pages 1–4 ; cette annonce
ne lève pas les réserves sans nouvelles captures des deux cases.

## Page 6, QA v1 — favorable sur les trois paires

Dossier `qa-animation-p06-v1/`, planche et six captures pleine résolution ouvertes.
P06-c01 : variations de vapeur ascendante visibles et ancrées à l'évent, sans
déformer poursuivant/arme. P06-c02 : micro-oscillation de mèche nette, visage,
bouche, mains et bulle restent fixes. P06-c03 : vapeur horizontale plus discrète,
variations repérables sur le mur près du panache existant, direction différente
de la vapeur verticale. Aucun bord de rectangle ni masque coupé observé. La case
3 reste la plus discrète de cette page, sans anomalie bloquante sur ces phases.

Le rapport technique de cette capture indique 3/3 variations, déterminisme et arrêt
réussis. Les protections pixel, pause réelle et réduction des mouvements restent à
recouper dans leurs rapports spécifiques avant livraison.

## Page 5, QA v4 et événements v1 — réserves levées

Candidat `candidates-stage1-p05-v3/page-05-with-music.json`. Dans
`qa-animation-p05-v4/`, les deux nouvelles paires c01/c03 ont été ouvertes à pleine
taille. Tube désormais étroit à halo doux, aucune encoche en L ou bord rectangulaire.
Reflet horizontal retiré ; mouvement de poussière/particules discret au sol sans
bande mobile. Visages, mains et personnages stables. Les deux réserves visuelles
de v3 sont levées sur cette nouvelle version ; c02/c04 conservent leur mécanisme.

Deux planches `qa-events-p05-v1/` avant/pendant/après ont été vues. Verre ajouté
perceptible hors du groupe. Poussière narrative très minime visuellement (rapport
20 pixels modifiés pendant l'événement) ; le mouvement ambiant de c03, vu dans
ses phases, assure surtout l'animation de cette case. Ne pas décrire une gerbe
de poussière importante. Retour après événement identique à l'avant, absence de
boucle et pause story stable corroborés par le rapport ; 23 protections à zéro
pixel altéré dans les deux événements. Aucun nouvel artefact observé.

## Page 7, QA v1 — favorable sur les trois paires

`qa-animation-p07-v1/` : planche et six phases pleine résolution inspectées.
P07-c01 ronds de flaque en expansion visibles, limités au liquide ; p07-c02
variation du tube fixe et halo doux sans rectangle, hors figures ; p07-c03 pluie
oblique sur clôture/fond distincte du mécanisme d'onde. Aucun balayage lumineux,
masque coupé, déformation de main/visage ou altération de bulle observé.
La page conserve des mécanismes distincts et des amplitudes modestes compatibles
avec le bluff et l'approche discrète. La validation technique finale du lecteur
et des exports reste à recouper.

## Dernier ajustement poussière page 5, case 3 — favorable

Plan final page 5 version 4 ; réouverture ciblée dans `qa-animation-p05-c03-v5/`
et `qa-events-p05-c03-v2/`. Les deux phases et le triptyque ont été inspectés.
Petits fragments gris désormais perceptibles au sol libre à gauche du barman,
chute puis disparition ; ni bande lumineuse, ni contact avec mains, batte ou corps.
Le rapport événement indique 462 pixels modifiés pendant, zéro avant/après et
zéro altération des protections, pause story stable. Cela remplace la remarque
de discrétion de l'ancienne poussière à 20 pixels, dont la preuve reste historique.
Les trois autres cases reprennent leurs paramètres déjà revus ; les preuves QA
v4 pour c01/c02/c04 et événement c04 v1 restent applicables. Ensemble page 5
visuellement favorable après les corrections ciblées, aucune réserve ouverte.

## Page 8, phases et événements v1 — favorable

`qa-animation-p08-v1/` : planche et huit phases pleine résolution ouvertes.
Source lettrée v2 b9372839… ; pluie locale sur voiture/vitre/ruelle discrète mais
repérable, échappement c03 ancré au pot et hors six personnages. Aucun rectangle,
bande mobile ou masque coupé observé ; mains, visages et bulles visuellement fixes.

`qa-events-p08-v1/` : trois triptyques réellement inspectés. Reflet serrure local
au métal, voyant du tableau de bord doux, onde sous roue cohérente avec flaque.
Rapports recoupés : respectivement 194/1 065/1 719 pixels modifiés pendant,
zéro avant/après, pause story stable, toutes protections inchangées. Les événements
ne rejouent pas le forçage, le démarrage ou le départ en boucle.

`qa-protections-p08-v1/effects-report.json` : 30 régions avec zéro changement et
zéro altération par rapport à la source, déterminisme et arrêt vrais.
`qa-live-p08-v1/live-report.json` : temps narratif immobile en pause, ambiance
avancée d'environ 0,817 s, variation perceptible, arrêt stable et reprise de lecture.

Les rapports analogues p05/p06/p07 ont été lus et résumés : 23/11/24 protections,
toutes à zéro altération aux temps contrôlés, déterminisme/arrêt réussis ; pause
réelle stable et ambiance active, reprise fonctionnelle. Les événements p05 sont
contrôlés à leurs temps actifs séparément, pas seulement au premier instant de page.

## Avis avant exports longs

Les 14 cases des pages 5–8 ont reçu une revue visuelle de paires et de leurs pages
entières ; les événements narratifs ont aussi leurs triptyques. Variété réelle entre
pluie, mèche, vapeur ascendante/latérale, poussière/verre, ondes, tube/voyant fixes
et reflet métallique ponctuel ; aucun balayage lumineux mobile systématique.
Toutes réserves artistiques observées sont levées sur les versions exactes ci-dessus.
Avis favorable au gel des paramètres et aux exports longs. Les manifestes sélectionnés,
navigation huit pages, réduction des mouvements, snapshots et MP4 produits devront
encore être contrôlés ; cet avis ne prétend ni les avoir vus ni les avoir écoutés.
