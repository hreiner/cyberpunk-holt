# Lot B — production et remise

Candidats : `anime/motion-comics/projects/blue-purple-page14-motion06.json` et `blue-purple-page15-motion06.json`. Sourcesv9/motion02 préservées. Timing figérevision2 appliqué par le helper partagé ; dix prises vocales et leurs durées conservées.

Les dessins retenus pour15.3 sont trois états réels : sourceouverte → pose35 créée → capsulefermée de la référence16.2. Aucun fondu anatomique ni étirement d'un bras. La main de Franklyn tient le même type de poignée avant de disparaître à l'intérieur de la capsule fermée ; son autre main repose près du clavier. La chaîne épaule/coude/poignet/main et les contacts ont été ouverts et examinés dans l'image originale, la nouvelle pose entière et la fermeture finale. Les autres personnages restent aux pixels source par masque SVG :836473 pixels protégés,0diff dans les deux composites retenus. Les images à75% et leur correction native sont REJETÉES, car leur mécanique faisait apparaître le panneau inférieur ou rebondir la poignée. Aucun manifeste ne les référence. La fermeture finale est un accent franc après une tenue, pas une simulation continue de charnière.

Le contact et le couvercle ont les mêmes ancres que le son : contact421,173333s ; débutfermeture426,58 ; pose35426,80 ;427,23 est une preuve de tenue35 ; fermé427,68 ; verrou427,76. Les durées de cases sont inchangées. Le dessin fermé reprend la même machine que16.2 ; Abigail reste à droite, Grover avec l'enfant à gauche.

Les effets14.1/14.2/14.3 et15.1/15.2 sont dans des polygones propres aux appareils : hologramme arrière lent ; écran ancien faible avec deux écarts brefs ; petit témoin du matériel de négociation ; compartiment instable ; témoin de connexion presque éteint avant l'ancre puis allumé. Le témoin de verrou15.3 est aligné sur les LED réellement dessinées du front de capsule. Les anciennes protections rectangulaires qui avalaient tout14.3 ont été resserrées autour des acteurs, en laissant libre le seul écran. Aucune animation gestuelle n'est revendiquée pour les conversations. Les sources de lettres approuvées sont composées après les effets ; masterOFF conservé.

## Preuves

- `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-b/proof-final-v2/contact.png` : six instants réellement capturés dans le lecteur, avant/exact/après les états. Image ouverte. Les trois états et les mains ont été ouverts en entier séparément pendant fabrication.
- Même dossier `closure.mp4` : extrait muet2,5s,24fps,60images, encodé H264 et décodé sans erreur. `report.json` relie la preuve au SHA final de la candidate15 et donne les six indices attendus0/1/1/1/2/2.
- Contre-revue indépendante `../qa-cross/LOT-B.md`, preuves techniques/FX et voix dans `motion-03/qa-cross/lot-b/`. La première revue concernait quatre poses ; la sélection à trois états a été envoyée au relecteur pour recontrôle final.
- `ART-SELECTION.json` relie source, SVGs et PNGs sélectionnés avec empreintes ; `ART-JOBS.json`, `ART-REFERENCES.json`, `ART-RESULTS.json`, `ART-CORRECTION-75.json` conservent les essais et prompts exacts.3appels ImageGenB (2initiaux+1correctionrejetée), coût/ID inconnus. Deux appels délégués supplémentaires ont produit les cartes sous `motion-03/map/` sur réallocation explicite root ; leurs journaux sont distincts.

La preuve muette ne vaut pas écoute du mix final ni validation du film complet. Root effectue l'intégration, la revue commune et le gel final. Aucun nouveau texte, aucune voix, aucune musique ni long MP4 n'est produit par ce lot.
