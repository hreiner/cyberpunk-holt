# Lot A — animation des pages 9 à 13

8 novembre 2026. **Cinq candidats concrets `motion06`, 19 sous-cases implémentées et
contrôlées.** L'intégrateur conserve la sélection et la livraison globale. La
[contre-revue indépendante](../qa-cross/LOT-A.md) conclut également sur les 19 cas.

Le lot emploie les cinq masters finaux désignés dans FORMAT, ouverts en entier :
page09 `page.png`, page10 `page-final.png`, pages11–13 `page-fitted.png`. Des vues
agrandies de la vitre, des caméras, de l'implant et du plan ont guidé les masques.
Ces images, leurs dessins de base, leurs lettres SVG et leurs anciens manifestes
restent inchangés, avec empreintes dans [SOURCE-LOCK.json](SOURCE-LOCK.json).

## Production et synchronisation

Le format reste 1024 × 1536, marge et gouttières de 12 px. Les lettres retenues sont
composées après les matières. Corps, mains, appuis, coiffures, voitures et caméras
ne reçoivent aucune déformation ou translation. Les nouveaux éléments sont de l'eau,
de la vapeur, de la lumière, un surlignage de tracé existant et du montage de cases.

Les cinq pages consomment le helper commun de [chronologie révision2](../timing/TIMING.json),
sans nouvelle voix ni modification de durée audio. Le lot représente **140,866667 s**,
avec **25 prises conservées**. La prise de Franklyn en 09-2 commence 0,20 s après
stabilisation de la carte : acquisition à 10,991667 s, information prête à 11,991667 s,
voix à 12,191667 s, en temps local de page9. Cette exception de `leadIn` vient du
contrat approuvé par l'orchestrateur ; elle n'a pas été improvisée dans le son.

[ANCHORS.json](ANCHORS.json) porte les huit événements partagés avec le responsable
du son, dont calcul/confirmation de borne, deux impulsions de l'implant et arrêt des
reflets d'ascenseur. La confirmation de réservation est à 13,475 s en page12.

**11 calques et 19 effets locaux**, avec 74 petits SVG natifs ; zéro appel fournisseur.
La pluie nouvelle utilise explicitement `rainFlow:true`. La couverture et les pages1–8
ne sont pas modifiées. `clipPolygon` contient les matières aux surfaces utiles ;
`panelReveals` masque dessin et lettres des deux réponses de page11 jusqu'à leurs ancres.
Le seul emploi de `lightSweep` concerne les deux parois métalliques de l'ascenseur.

## Statut par sous-case

Les détails de temps, régions et mécanismes sont dans [CONTRACTS.json](CONTRACTS.json).
[STATUS.json](STATUS.json) rattache chaque résultat aux PNG effectivement produits.

| Sous-case | Réalisation retenue | État |
| --- | --- | --- |
| 09-1 | Deux zones de pluie et anneaux de flaque entre les acteurs | Vérifié |
| 09-2 | Acquisition dans le quadrilatère intérieur de la vitre, point rose resserré | Vérifié avant/pic/après |
| 09-3 | Une goutte suit le montant incliné de la borne ; pluie de fond | Vérifié |
| 10-1 | Pluie à deux profondeurs et reflets de chaussée, voiture fixe | Vérifié |
| 10-2 gauche | Profondeur de rue et eau libre au pied du groupe | Vérifié |
| 10-2 droite | Une caméra passe de témoin assombri à rouge stable ; reflet sous l'entrée | Vérifié |
| 10-3 gauche | Pluie lente derrière Grover et l'enfant ; main sur l'épaule conservée | Vérifié |
| 10-3 droite | Une impulsion du témoin derrière Wendy | Vérifié |
| 11-1 | Une bouffée identifiable naît à la grille, monte puis disparaît ; pluie locale | Vérifié après renfort |
| 11-2 | Pluie et anneaux d'eau devant la barrière | Vérifié |
| 11-3a | Case et bulle de John apparaissent ensemble, puis geste dessiné tenu | Vérifié |
| 11-3b | Réponse d'Abigail révélée après John, puis silence visuel | Vérifié |
| 12-1 | Réveil d'un témoin de portillon et reflet bref du hall | Vérifié |
| 12-2 | Deux pulsations dans le petit implant visible puis apaisement | Vérifié |
| 12-3 | Reflets glissants sur les parois latérales, arrêt avant dernière tenue | Vérifié |
| 13-1 | Perturbation cyan brève dans le décor visible hors lettres et acteurs | Vérifié après correction |
| 13-2 | Progression sur la liaison cyan déjà dessinée, moitié gauche | Vérifié |
| 13-2-detail | La même liaison poursuit son accent dans la moitié droite | Vérifié |
| 13-3 | Gouttes sur le carreau de boutique et pluie contenue à la vitre | Vérifié |

Les deux moitiés de 10-2 et 10-3 ont des preuves distinctes. Les corps de la foule
restent fixes. Les LED gardent leur petite géométrie et l'implant son emplacement ;
la contre-revue les juge réels, avec une discrétion artistique signalée et non bloquante.
Le plan de page13 est celui déjà dessiné : aucun étage, trajet ou texte supplémentaire.

## Preuves finales réellement obtenues

Dossier : `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-a/qa-v4-final/`.
Son `report.json` porte SHA-256
`c696400a5e7ba6f6fd48c2ccc980d7e1091c2ea2c7f759fe875c5eb84a6a5b04`.

- **19/19 sous-cases passent**, avec deux à quatre phases par sous-case. Les cinq
  planches de comparaison finales ont été ouvertes par le producteur de ce lot.
- Aucune différence de pixels dans les régions rigides entre les deux phases ambiantes
  à récit tenu. Déterminisme et retour par seek exacts pour chaque sous-case.
- Mode OFF identique au master, zéro pixel différent sur chacune des cinq pages.
- Source v9 et ses médias vérifiés après production ; les quatre fichiers moteur
  ont les mêmes empreintes au début et à la fin du contrôle.
- Clip muet `motion-preview.mp4`, **189 images / 7,875 s à 24 i/s**, H264 1280 × 720,
  décodage intégral réussi. Il montre acquisition, révélation de réponse, implant,
  trouble neural et liaison du plan. Il ne prétend pas démontrer un mix sonore.

SHA du clip : `850465de94f19b1dcff9ab4dcfa187a91923e756c43e0d03a0c19d848f415029`.
Les PNG de la planche de comparaison et les images Canvas ayant produit le clip sont
conservés. Le contrôle générique qui exige « premier dessin différent du dernier »
n'a pas été employé pour certifier une impulsion revenant à son état initial : les
pics et les intervalles réels sont explicitement échantillonnés.

| Candidat | SHA-256 final |
| --- | --- |
| `blue-purple-page09-motion06.json` | `a6c5fde2662d534b9a4b1f33cdf996ab2e7d5224f9a6f365fa3219fc83a2ce0b` |
| `blue-purple-page10-motion06.json` | `3c1135e827046fef2ee30883ba476647ff566fcf5c5a6390069c7cfcb9ad02cf` |
| `blue-purple-page11-motion06.json` | `9d61e799913df055cac86920b206a2cd926bfd3b3bf7715b5aae279a10cedc0d` |
| `blue-purple-page12-motion06.json` | `995e1166fc6532b7cc677092514f533cd07d842fb0bb7d414c7e904a799d0072` |
| `blue-purple-page13-motion06.json` | `84365c6a85051e10ece7ba31193bb531f017a3f13e5017ad034ebeb0be1e400f` |

Les candidats résident dans `anime/motion-comics/projects/`. L'agrégat de revue
[CANDIDATES.json](CANDIDATES.json) est un assemblage de contrôle du lot, sans choix
de sélection finale du chapitre.

## Corrections et limites

`qa-v1` conserve un échec de connexion entre serveur sandbox et navigateur externe.
Le serveur de revue a ensuite été relancé dans le même contexte que Chromium.
`qa-v2` a réellement détecté une absence de mouvement en13-1 : le masque de décor
était caché par la bulle de Wendy. Le déplacement hors de cette bulle a été contrôlé
dans `qa-v3-page13`, avec 148 pixels significatifs au pic puis retour à zéro.

La bouffée11 initiale était trop discrète. L'arbitrage du pilote a conduit à une
vapeur native unique, plus contrastée, à la place du champ de fumée. Elle conserve
son origine sur la grille et reste hors gestes. Les comparaisons finales mesurent
8223 puis6684 pixels de différence supérieure à15 ; les vues ont aussi été ouvertes.
La réouverture du moteur pour isoler la pluie nouvelle du préfixe a ensuite justifié
le contrôle final complet `qa-v4-final`, sans abaisser les critères.

Ces effets ne fabriquent aucune marche, geste articulé, rotation de caméra physique
ou déplacement de véhicule. La réserve artistique sur la petite échelle des témoins
est documentée. Aucune écoute humaine n'a été réalisée et aucun long MP4 de chapitre
n'a été rendu par ce lot. La sélection, le mix et l'export global restent au pilote.

Relance du contrôle (choisir un dossier QA neuf) :

```powershell
node anime/motion-comics/render.cjs --serve docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/lot-a/CANDIDATES.json --port 50937
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/lot-a/review.cjs "http://127.0.0.1:50937/anime/motion-comics/reader.html?manifest=/docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/lot-a/CANDIDATES.json" art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-a/qa-v5
```
