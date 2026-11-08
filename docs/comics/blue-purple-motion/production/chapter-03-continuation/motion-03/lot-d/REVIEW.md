# Revue de production — lot D

8 novembre2026. Les quatre candidates motion06/pages18–21 et les calques `assets-v5/`
sont prêts pour intégration par root. La [contre-revue croisée](../qa-cross/LOT-D.md)
est favorable, sans défaut bloquant observé. Les réserves d'amplitude concernent les
petits reflets et crêtes d'eau, volontairement discrets autour des actions majeures.

Les treize paires du [contrat](CONTRACT.md) ont été ouvertes, avec les dessins bruts,
quatre planches finales, natifs reçus et vues intermédiaires des mouvements sensibles.
La porte dévoile une pièce industrielle vide ; les bras/jambes/mains d'Abigail et du
groupe restent cohérents. Le SDF descend, est partiellement caché par l'eau puis
disparaît ; aucun corps n'est fondu, étiré ou laissé en oscillation. Le pêne se ferme
sans entraîner les doigts. Les bulles conservent le style et les placements approuvés.

## Contrôles obtenus

Sous `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-d/proofs/` :

- `run-v3/report.json` : terminé,13 sous-cases/48 états, zéro échec/erreur navigateur.
  Les245 fichiers de son gel (sources v9, nouvelles candidates/médias et moteur du
  lecteur) ont les mêmes SHA avant/après. Les durées des prises ne changent pas.
- Deux sondes de mains18 :1800+1848 pixels, zéro différence. Abigail devant les
  battants :29067 pixels opaques, zéro différence. La revue indépendante ajoute
 141600 pixels John/Grover/enfant exacts entre deux phases de chute.
- Tous les pixels opaques des lettres finales sont exacts dans les48 échantillons,
  hors cases volontairement masquées avant leur révélation. Les sources SVG restent
  éditables ; les PNG de lettres reprennent le RGB opaque du master approuvé.
- Pause avec horloge ambiante avancée de50s : zéro octet de calque changé. Seeks en
  ordre différent : zéro différence sur1572864 pixels pour chute et porte.
- `reader-v1/report.json` : OFF exact au master pour chacune des quatre pages,
 1572864 pixels par page. Mobile390×844 et844×390 : aucun défilement ni commande
  sur le dessin ; porte en portrait et les deux actions en paysage réellement ouvertes.
- `run-v3/PAIR-PLAYBACK.json` :13 paires, cinq clips lus entièrement dans le
  navigateur, `ended=true` et260 images vidéo décodées au total. Clips muets, pas un mix.
- `run-v3/ENCODED-SENSITIVITY.json` : vrais frames H2643/15/16/17/26 de la chute ;
  libération, avant impact, premier frame après l'ancre, suite et immersion. Les
  temps demandés et réellement encodés sont distingués à24i/s.

## Clips courts ouverts

Dans `run-v3/clips/<nom>/interval.mp4` ; les images décodées à côté ont été ouvertes.

| Nom | Durée | Images | Objet |
| --- | ---: | ---: | --- |
|contact|1,666667s|40|Contact tenu puis changement de dessin vers la conséquence.|
|bolt|1,083333s|26|Pêne avant/fermé, mains conservées.|
|water|2,25s|54|Chute accélérée, impact, immersion, récupération.|
|door|3s|72|Deux battants et Abigail en premier plan.|
|waves|2,833333s|68|Crêtes et reflets fins au bord du quai.|

## Corrections et limites

L'essai de masque manuel transportait de l'ancienne écume ; le premier dessin
vectoriel d'impact était trop géométrique. Deux corrections ImageGen ciblées ont
fourni alpha et eau organique. Seul l'alpha du corps est employé avec les pixels RGB
originaux. Aucun autre appel après ces4 initiaux+2 corrections ; coût fournisseur inconnu.
Les essais `assets-v1` à `assets-v4` ne sont pas la sélection de production.

`run-v1` garde l'échec de connexion du premier serveur isolé ; `run-v2` garde le
diagnostic SVG GPU/CPU et deux pixels d'interpolation au bord d'une main. Ces défauts
de vérification/assemblage ont été résolus par lettres figées depuis le master et
restauration des mains sans interpolation. Les cinq clips de référence sont ceux de
`run-v3`, liés aux SHA des candidates actuelles. Les anciens diagnostics de contour
jaune hérités dans les assets décrivent le masque manuel abandonné, pas l'alpha retenu.

18.1 est volontairement tenue, conformément au montage demandé : son mouvement de
récit est la révélation d'`18-after`, aucune nouvelle poussée ou chute n'est annoncée.
20.3 emploie un corps rigide séparé ;21.1 de vraies projections de deux objets rigides.
Les petits effets de fente/eau restent discrets ; les images et la réserve d'amplitude
sont documentées dans la contre-revue. Les plans panoramiques sont plus petits en
portrait ; le paysage garde les actions et les bulles plus lisibles.

Aucune écoute humaine, nouvelle voix, bande sonore ou vidéo longue produite par ce
lot. L'ancre son est partagée via [ANCHORS.json](ANCHORS.json), sans modifier TIMING2.
La lecture isolée affiche quatre pages techniques ; l'intégrateur conserve leurs IDs
18–21 dans le complet. Serveur d'aperçu final :65180, instance appartenant à ce lot.
