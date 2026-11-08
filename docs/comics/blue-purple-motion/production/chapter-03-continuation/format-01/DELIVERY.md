# Format du lecteur — pages 9 à 21

8 novembre 2026. Les treize pages reprennent le format de la page 8 : canvas
1024×1536, marge et gouttière de 12px, fond `#050509`, bandes de 1000×496 ou
demi-cases de 494×496. Les contours blancs, titres et pieds de page papier sont retirés.
Les illustrations sont remises en place avec une échelle uniforme, sans étirer les corps.
Les effets et protections suivent la même transformation. Les bulles acceptées restent
vectorielles ; celles que le nouveau cadrage coupait sont replacées, et les deux queues
de 10.2 sont raccourcies dans le décor.

## Lecteur livré

[Ouvrir les 21 pages](http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v8.json).
Le serveur sur 50589 redirige aussi les anciennes URL v7/v6 vers cette sélection.

Sélection : [v8](../../../../../../anime/motion-comics/projects/blue-purple-pages01-21-v8.json),
SHA256 `79f50aefd78a24cfcf2fb93a7b2cc059ad8b02e0f5696f596fc4d6a74daa3aa7`.
Lot 9–21 : `blue-purple-pages09-21-motion04.json` ; pages individuelles `motion04`.
Les sources finales sont dans
`art-masters/motion-comics/blue-purple/chapter-03-continuation/format-01/selected/`.
[FORMAT.json](FORMAT.json) désigne les PNG/SVG finaux ; [SELECTION.json](SELECTION.json)
gèle les 182 dépendances. Les premiers candidats non sélectionnés sont conservés à part.

## Contrôles obtenus

L'orchestrateur et la [contre-revue indépendante](QA.md) ont ouvert les treize pages
finales. Au même viewport 1600×900, les pages 8 et 9 occupent exactement le rectangle
`[573,96,454,681]`. Pas de contour clair dans les marges/gouttières contrôlées ; les
62 bulles sont complètes, leurs textes et locuteurs égaux à la révision 05 approuvée.
Les sources des huit premières pages, les 99 voix, le backing et la chronologie de
446,002222s sont inchangés par hash et par données. Navigation, lecture, pause, mute,
seek tardif, vues desktop/mobile et mouvements réduits contrôlés sans erreur JavaScript.

Le contrôle d'animation conserve les régions rigides et les lettres opaques exactes,
le mode OFF exact sur les treize pages et les six événements narratifs bornés. Sur
42 paires, 41 passent immédiatement ; 16.1 signale une différence au premier retour
de seek dans le composite Canvas. Le diagnostic conserve ce premier écart, puis onze
retours strictement identiques : les calques art/effets restent exacts sur tous les
passages. Ce résultat est compatible avec le cache/readback graphique déjà observé ;
aucun changement moteur ni assouplissement du contrôle n'a été effectué. Preuves :
`format-01/qa-motion-v1/`, `format-01/seek16-diagnostic.json` et
`format-01/qa-independent/run-v1/` sous les masters. Aucune écoute humaine revendiquée.

Cette correction livre le lecteur. Les PDF et MP4 précédents conservent le format v7
historique ; aucun nouvel export long n'est revendiqué. La nouvelle sélection peut
servir à un futur export demandé. Aucun nouvel appel de génération payante.

## Relance et sauvegarde

Depuis la racine du dépôt :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-21-v8.json --port 50589 --alias blue-purple-pages01-21-v7.json --alias blue-purple-pages01-21-v6.json
```

La [sauvegarde du lecteur v8](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/format-01/reader-format-v8.zip)
contient la sélection, ses médias, le moteur, les sources de recomposition et les
preuves de cette passe, sans frames ni anciens films. Son
[rapport CRC/SHA](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/format-01/reader-format-v8.json)
donne le hash et le résultat de relecture de chaque membre. Le plan explicite
`BACKUP-PLAN.json` est produit par `prepare-backup.py`, puis exécuté par le vérificateur
`../motion-01/export/backup.py`. L'archive complète de la livraison précédente reste
conservée ; celle-ci est une sauvegarde autonome du lecteur corrigé, sans les exports.

Prochaine action : revue du lecteur par le propriétaire, puis corrections ciblées
selon son retour. Aucun rendu long en cours ni validation statique à redemander.
