# Contre-revue indépendante — couverture et accents narratifs

8 novembre 2026. **Contre-revue favorable, aucun défaut bloquant constaté.**
Source : `anime/motion-comics/projects/blue-purple-pages01-21-v9.json`, SHA
`0b8684a4a97f82bf73fc0c0f2446c4f4868c4e4cec4b0fec6f515cc119269e93`.
Périmètre : couverture, transition 16, trois sous-bandes 17 et intégration au lecteur.
La vision appelée « page 18 » dans la demande se situe en 16.1. Les propositions
de `ANIMATION-PROPOSALS.md`, illustrées dans `ANIMATION-REVIEW-v2.html`, couvrent
46 sous-cases pour les mêmes 42 cadres : 10.2 et 10.3 détaillent leurs parties
gauche/droite. Elles restent des propositions, pas 46 effets produits.

## Preuves et conservation

Scripts : [review.cjs](qa-independent/review.cjs) et
[capture-export-canvases.cjs](qa-independent/capture-export-canvases.cjs).
Ils écrivent seulement dans leurs nouveaux dossiers de preuves. Racine locale :
`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/qa-independent/`.

- `BASELINE-V8.json` : les 182 dépendances historiques ont les mêmes SHA avant et
  après la revue ; SHA v8 conservé :
  `79f50aefd78a24cfcf2fb93a7b2cc059ad8b02e0f5696f596fc4d6a74daa3aa7` ;
- `COVER-REVIEW.json` : couverture native ouverte directement, puis même image
  identifiée dans la sélection v9 ;
- `run-v1/report.json` : terminé, zéro échec/erreur JavaScript, 48 captures et
  27 échantillons ; 196 fichiers source/médias, dont la séquence, et 14 fichiers
  moteur rehashés après contrôle ;
- `export-canvases-v1/report.json` : cinq vrais bitmaps Canvas 1280 × 720, sans
  chrome du navigateur, ouverts pour couverture, pages 1/21 et miniatures 16/17.

Les 19 pages 1–15 et 18–21 conservent exactement leurs manifestes et médias v8.
Les 99 prises, leurs locuteurs et leurs durées sont conservés. Leurs entrées
reçoivent les 12 s de couverture ; seule Wendy 17.2 reçoit en plus les 0,70 s prévus.
Les durées des 21 pages narratives restent identiques. Total : 458,002222 s et
22 entrées techniques. Collecte et rebasing logique contrôlés sur les 8 assets de 16
et les 13 de 17, avec variantes de lettres et sources existantes. Ce contrôle ne
prétend pas avoir produit ou rejoué un nouvel export autonome.

## Images réellement ouvertes

**Couverture.** Native composée puis poster desktop/mobile ouverts. SHA
`1596bbe28401369693f28131f5812aeda6ea810d9a3c3ea5a3f8618a31ca4c46`.
Six personnages distincts : cinq jeunes adultes (quatre cadets et Wendy) et
l'enfant. Grover le protège, Wendy et Abigail sont bien visibles, Franklyn reste
en retrait. Contact de la main sur
l'épaule, proportions et appuis plausibles ; titre contrasté, sans cadre blanc.

**16.** Vues ouvertes : `p16-elf-held-reader.png`, `p16-reveal-50-reader.png`,
`p16-map-held-reader.png`, puis carte sur mobile paysage. Le paysage se désagrège
par tuiles, la carte se recompose puis reste tenue. La bulle reste fixe et lisible.
Les repères HOLT, position actuelle, signal inconnu et point vert se distinguent.
C'est une représentation neurale subjective, sans validation géographique.
Les 496 000 pixels du paysage initial sont exacts au fond v8 ; la carte tenue ne
change aucun de ses 496 000 pixels. Les autres cases conservent leurs 1 052 672 pixels.

**17.** Vues ouvertes : `p17-before-shot-reader.png`, `p17-shot-after-reader.png`,
`p17-impact-after-reader.png`, `p17-bottom-after-reader.png` et mobile paysage.
La bande haute apparaît seule, le départ du tir est visible, puis l'impact arrive
dans la bande médiane. Le flash disparaît avant la dernière pose. Les séparations
diagonales restent propres, sans couture manifeste dans les personnages. Corps et
mains gardent les dessins approuvés. La bulle « À couvert ! » apparaît avec le bas ;
sa queue reste courte, près de Wendy, hors des visages.

Les 334 457 pixels protégés des acteurs, du garde-corps et du trou sont identiques
au fond v8 dans l'état complet. Les régions intérieures des futures bandes sont
noires avant apparition : 496 000, 276 000 puis 156 000 pixels contrôlés.
Tous les pixels opaques du lettrage sont exacts dans les 27 échantillons : 64 177
en 16 et 37 832/47 969 selon la présence de Wendy en 17. Ces mesures complètent les
vues ouvertes ; elles ne remplacent pas la revue d'art.

## Temps, miniature et commandes

Les ancres globales exactes avec couverture passent : tir 385,56 s, impact 385,64 s,
bas 385,99 s ; Wendy commence à 386,02 s. Les échantillons précédant les ancres
conservent l'état antérieur. Tir et impact sont séparés de 80 ms au contrat.
Faire varier de 50 s l'horloge ambiante à récit figé ne change aucun octet des
calques. Le seek en ordre différent reproduit exactement les deux cases testées.
OFF est exact aux deux masters, chacun sur 1 572 864 pixels : carte finale en 16,
planche statique approuvée en 17.

Miniatures du tiroir ouvertes : paysage initial en 16, sous-bandes masquées en 17.
Cinq bitmaps du cadre historique 1280 × 720 ensuite ouverts : miniature et grande
case affichent la même phase. Les captures `export-*-reader.png` de `run-v1/`
montrent le contexte navigateur en mode manuel ; les bitmaps du seul Canvas
utiles au format export sont ceux de `export-canvases-v1/`.

Poster initial « Couverture », en pause sans musique lancée ; tiroir à 22 entrées,
puis repères « Page 1 / 21 » à « Page 21 / 21 ». Navigation pages/cases et clavier,
vue page, fermeture du tiroir avec retour du focus, mouvements réduits et plein
écran réel passent. Vues ouvertes à 1600 × 900, 390 × 844 et 844 × 390 : aucun
défilement ni commande sur le dessin ; pages 1, 16, 17 et 21 accessibles sur mobile.
Les bandes panoramiques restent petites en portrait ; le paysage rend leurs détails
et la carte plus lisibles sans rogner les bulles.

Musique après Lire sur la couverture, sans voix ; pause du backing et des prises,
commutation du mute, première voix avec backing et raccord automatique vers page 1
contrôlés. Après seek vers 430 s, écart observé backing/récit : 49,5 ms.
Ce sont des contrôles d'état et de synchronisation, pas une écoute humaine.
Mesures PCM/AAC : [sound/REVIEW.md](sound/REVIEW.md).

## Rejouer et limites

Serveur v9 actif, depuis la racine, choisir des dossiers de sortie neufs :

```powershell
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-02/qa-independent/review.cjs 'http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v9.json' art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/qa-independent/run-v2
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-02/qa-independent/capture-export-canvases.cjs 'http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v9.json' art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/qa-independent/export-canvases-v2 art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/qa-independent/run-v2/report.json
```

Aucun média, manifeste ou moteur choisi modifié par cette mission ; aucun long MP4
ni nouvel H264 produit. Pas d'écoute humaine ni d'acceptation du propriétaire
revendiquées. L'intégrateur conserve le gel documentaire, la sélection finale et
la sauvegarde.
