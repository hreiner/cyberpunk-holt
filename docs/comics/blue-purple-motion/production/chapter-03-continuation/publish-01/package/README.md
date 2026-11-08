# Paquet web v10 — contrôles de préparation

Le script `anime/motion-comics/publish.cjs` transforme les seuls médias de la sélection native v10, sans modifier les masters. La sortie locale est `public/comics/blue-purple/v10/` ; elle sera archivée séparément des sources Git.

```powershell
node anime/motion-comics/publish.cjs --prepare
node anime/motion-comics/publish.cjs --prepare-thumbnails
# Après le GO explicite du propriétaire du moteur :
node anime/motion-comics/publish.cjs --runtime-ready
node anime/motion-comics/publish.cjs --check public/comics/blue-purple/v10
```

Le mode `--check DIRECTORY` fonctionne hors ligne, sans masters, sans FFmpeg et sans navigateur. Il charge les validateurs du moteur effectivement livré, vérifie les empreintes de tous les fichiers, la fermeture exacte du graphe, les chemins locaux, les 22 pages, les 99 voix, les 584,3 secondes et les signatures de contenu narratif et de chronologie. `PUBLICATION.json` est l’inventaire public ; il ne contient aucun chemin privé. Les sorties différentes existantes sont refusées et les mêmes octets peuvent être rejoués sans remplacement.

`MEDIA-MAPPING.json` relie les empreintes natives aux empreintes publiques. Les 107 images PNG deviennent des WebP sans perte : le SHA-256 du décodage RGBA est identique pour chaque paire, sans redimensionnement. Les 88 SVG et les 40 MP3 sont copiés à l’identique. Les 60 WAV deviennent des AAC stéréo à 192 kbit/s, avec l’atome `moov` avant les données. Les sources mono sont dupliquées à gain unitaire dans les deux canaux. La durée de chaque décodage et les niveaux crête/RMS sont comparés, sans coupe ni accélération. Écarts maximaux mesurés : 0,022857 s et 0,095271 dB de niveau moyen.

Les 295 médias passent de 324 084 056 à 151 989 324 octets, soit une réduction de 53,1 %. Les licences et polices du lecteur sont conservées.

`THUMBNAILS.json` consigne les 22 miniatures prises par l’API Canvas du vrai lecteur natif : début de page + 0,001 s, effets activés, temps d’ambiance fixé à zéro, puis réduction à 240 × 360. Les miniatures narratives de la page 18 et de la porte de la page 21 représentent ainsi leur état initial. Elles proviennent du rendu composé, pas du master imprimé final.

Preuves locales ouvertes visuellement dans `art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/package/` :

- `proof-native-webp.png` : fermeture de capsule 15.3, natif à gauche, WebP à droite, composition identique.
- `proof-thumbnails.png` : couverture, carte 16, état initial 18 et porte 21.

La contre-revue audio indépendante est conservée dans le lot QA audio de `publish-01`. Elle confirme notamment les 40 MP3 identiques, les 60 AAC stéréo faststart, l’absence de prise tronquée, six transitoires sans décalage d’échantillon et huit fenêtres mixées sans saturation. Son raccord final est passé sur 106 contrôles : 99 textes/temps inchangés, les 100 SHA audio retrouvés, et l’empreinte publique confirmée.

Le script de contre-épreuve `check-publication.cjs` crée exclusivement des copies par liens physiques dans les masters privés et remplace seulement les entrées corrompues des copies. Les cinq cas sont rejetés : payload modifié, fichier manquant, chemin sortant du paquet, chronologie modifiée avec empreinte actualisée, fichier orphelin. Le paquet publié reste inchangé. `CHECK-TESTS.json` conserve les erreurs observées. Les liens physiques nécessitent une exécution hors sandbox sur ce poste Windows.

## Composition finale

Le GO moteur 1.4.0 est consigné par son propriétaire dans `../runtime/SELECTION-1.4.0.json`. Le packaging complet a ensuite passé le contrôle hors ligne, puis un deuxième passage complet idempotent, y compris une nouvelle capture des 22 miniatures : aucun octet différent n’a été remplacé.

- 345 fichiers, 155 193 382 octets, 309 médias distincts après déduplication et ajout des miniatures.
- 22 entrées, 99 voix, durée inchangée de 584,3 s ; le raccord des chemins des 99 voix est comparé explicitement à la sélection native.
- Les signatures publiques couvrent séparément le contenu narratif et la chronologie avec les références des prises audio.
- SHA-256 de `PUBLICATION.json` : `d842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a`.
- `PACKAGE-REPORT.json` : résultat du checker autonome.

Le preview Vite de la vraie sortie `dist` est servi pour la contre-revue à `http://127.0.0.1:50612/cyberpunk-holt/comics/blue-purple/v10/`. Le serveur natif 50589 est conservé. La contre-revue navigateur relève du lot `publish-01/qa/` et ne doit pas être déduite des seules mesures de ce dossier.
