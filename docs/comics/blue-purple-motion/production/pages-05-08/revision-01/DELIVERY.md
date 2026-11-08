# Livraison révisée — Blue Purple, pages 5–8

Reprise du 5 novembre 2026 après retour du propriétaire : John assomme le barman,
plus de dialogue, bruitages, musique et mouvement. Sélection finale **v3**, huit
pages et trente cases sur **226,60 s**. Les pages 1–4 et leurs sources sélectionnées
restent identiques ; les versions précédentes restent présentes.

## Lecteur et fichiers

[Ouvrir les huit pages](http://127.0.0.1:50588/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-08-v3.json).
Le serveur local est laissé actif. Recharger l'onglet existant : son ancienne requête
v1 est réorientée vers le manifeste v3 par le serveur, sans écraser le fichier v1.

[MP4 complet](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/exports/pages-01-08/render-v2/motion-comic.mp4)
— 3 min 46,60 s, **29 414 273 octets**.
[MP4 nouvelles pages](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/exports/pages-05-08/render-v2/motion-comic.mp4)
— 82,00 s, **10 126 353 octets**. Les MP4 sont autonomes sans serveur ; l'arrondi à 24 images/s peut ajouter
une fraction d'image dans le conteneur.

| Page | Master français | MP4 individuel | Durée narrative |
| --- | --- | --- | --- |
| 5 — Le piège | [PNG](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-05/page-v2.png) | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/exports/page-05/render-v2/motion-comic.mp4) |20,90 s |
| 6 — Par l'arrière | [PNG](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-06/page-v1.png) | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/exports/page-06/render-v2/motion-comic.mp4) |18,60 s |
| 7 — Notre voiture | [PNG](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-07/page-v1.png) | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/exports/page-07/render-v2/motion-comic.mp4) |20,10 s |
| 8 — Tous ensemble | [PNG](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-08/page-v3.png) | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/exports/page-08/render-v2/motion-comic.mp4) |22,40 s |

Les mêmes dossiers de page contiennent dessin brut, source SVG et lettrage SVG/JSON.
Les nouvelles prises et journaux sont dans `revision-01/audio-v1/takes/`, les sons
dans `sfx-takes/` ; la sélection mesurée est `audio-v1/prepared-measurements.json`.
Les six accompagnements musique/SFX sélectionnés sont exclusivement `soundtrack-v3/`.
Chaque dossier d'export contient son manifeste rebasé et ses médias copiés.

## Changements visibles et audibles

- Coup de John en quatre dessins : préparation, contact, retrait, barman assommé
  vivant. Impact/bois synchronisés ; pas de fondu qui dédouble les mains.
- Sortie en deux poses réelles, avec queues de bulles adaptées aux acteurs.
- Voiture RGBA qui s'éloigne sur rue reconstruite, ombre de contact liée au mouvement.
- 22 voix anglaises v4 dans les nouvelles pages, 42,64 s de parole ; quatorze nouvelles
  répliques et huit réemplois. Toutes les bulles restent françaises.
- Six bruitages ElevenLabs, trois compléments locaux et trois couleurs musicales HOLT,
  avec baisse sous dialogue. Rythme resserré de 103,90 à 82 s.

## Rejouer et réexporter

Depuis la racine du dépôt, avec Node, les dépendances npm/Playwright, Edge et FFmpeg
du poste. `HOLT_BROWSER` et `HOLT_FFMPEG` permettent de préciser leurs exécutables.

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-08-v3.json --port 50588 --alias blue-purple-pages01-08-v1.json
node anime/motion-comics/render.cjs anime/motion-comics/projects/blue-purple-pages01-08-v3.json art-masters/motion-comics/blue-purple/pages-05-08/revision-01/exports/pages-01-08/render-v3 --fps 24
```

Arrêter le serveur déjà actif avant de réutiliser son port. Choisir un nouveau dossier
pour tout export. Pour comparer la première livraison, servir son manifeste v1 sur
un autre port, sans alias. Ne pas ajouter les masters lourds à Git.

## Vérification et limites

[Revue et preuves](REVIEW.md), [dessins/mains](QA-IMAGES.md),
[bulles](QA-LETTERING.md), [gestes](QA-ANIMATION.md), [audio](QA-AUDIO.md).
Les 25 sources historiques sont rehashées intactes ; 38 fichiers audio finaux sont
entièrement décodés. Les 37 voix ne se chevauchent pas. Le lecteur huit pages a passé
navigation, raccords automatiques, pause audio, récit figé en pause, arrêt des effets,
mouvements réduits et zéro erreur JavaScript. Typage/lint/788 tests/build passent,
ainsi que les 28 tests du moteur motion comics.

Les six MP4 H.264/AAC mono, 1280×720 à 24 images/s, sont produits et entièrement
décodés. Leurs audits trouvent zéro différence de source et des neuf fichiers moteur.
Les six snapshots ont les mêmes données et les mêmes SHA de médias que les sélections
originales, y compris les SVG par pose. Les crêtes AAC mesurées sont négatives :
−1,5 dBFS au complet, −1,3 dBFS au lot. Six images du H264 réel ont été ouvertes ;
la contre-revue confirme contact, franchissement et départ après encodage.
Les trois actions et les quatorze cases ont leurs preuves finales ; 110 régions
protégées restent intactes. Le supplément de mesure du néon p7c2 conserve le premier
échantillon insuffisant et le seuil initial ; voir la revue pour les phases exactes.

[Audits des exports](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/export-check-v1.json),
[mesures des mixages](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/mix-check-v1.json),
[copies autonomes](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/snapshot-audit-v1.json),
[avis indépendant final](QA-FINAL.md).

La voiture reste un sprite 2D, sans rotation indépendante des roues. Les gestes sont
des poses dessinées, pas une animation corporelle continue. L'audio est techniquement
mesuré et décodé ; aucune écoute humaine n'est prétendue.

## Plafonds réels

Onze appels ImageGen sur douze autorisés : huit initiaux et trois corrections ciblées.
Historique pages 5–8 précédent 16, total connu 27. Voix cumulées 3 394 caractères annotés
sur plafond opérationnel 3 838 et absolu 4 800. SFX 6/8 requêtes, 20/24 s demandées.
Aucune nouvelle génération musicale payante ni appel pour l'ombre Canvas.
Les coûts et identifiants fournisseur non exposés restent inconnus.
[Budget structuré](BUDGET.json) ; journaux et références conservés.

## Sauvegarde locale

[Archive de livraison](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/delivery-backup-v1.zip)
et [rapport d'intégrité adjacent](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-01/delivery-backup-v1.json).
Le plan explicite inclut les médias sélectionnés, sources, prises/journaux, références
des onze appels, musiques/SFX, preuves, documents finaux, moteur, dépendances déclarées
et les six exports avec snapshots. Frames, anciens exports et ZIP précédents sont exclus.
Le script relit le CRC puis chaque membre selon son SHA-256 dans `BACKUP-MANIFEST.json`.
Le rapport adjacent porte la taille et l'empreinte du ZIP lui-même ; il reste hors de
l'archive afin d'éviter une référence circulaire. Les MP4 se lisent directement ;
relire/réexporter le projet demande Node/npm, Playwright et Edge. FFmpeg est sauvegardé.
