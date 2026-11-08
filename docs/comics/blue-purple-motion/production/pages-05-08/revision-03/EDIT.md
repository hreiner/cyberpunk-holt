# Montage — correction du bras de John

La sélection v5 remplace uniquement l'image de la pose de recul de John. Les37voix,
backings, bulles, cadrages et temps restent ceux de v4 : page5 à20,90s, lot5–8 à82s,
film1–8 à226,60s. Les vidéos des pages6–8 de revision-02 restent réemployées telles
quelles. L'intégrateur possède l'image, les manifestes sélectionnés et le prototype.

Le montage produit trois MP4 neufs sous
`art-masters/motion-comics/blue-purple/pages-05-08/revision-03/exports/` :
`page-05/render-v1`, `pages-05-08/render-v1`, `pages-01-08/render-v1`.

## Réemploi vérifié des images

Le lecteur plein écran1.1.1 conserve le mode export1280×720. Avant réemploi, les
trois caches de PNG v4 ont été comparés au lecteur actuel avec son chemin normal
`seek(t)` puis `toDataURL` :64témoins du film,44du lot et25de la page5 sont
byte-identiques. Les témoins couvrent les cases, vues page et frontières des poses.
Les5439/1968/502PNG ont ensuite été inventoriés par SHA256. Preuves finales :
`qa/cache-full-v2`, `qa/cache-lot-v1`, `qa/cache-page05-v1` dans les masters r03.
La preuve full-v1 antérieure aux seuls ajouts alias/version est conservée.

L'outil `reuse-export.cjs` refuse tout changement autre qu'un unique
`motionLayers[].frames[].image` après résolution des chemins ; chronologie,
répliques et backing sont comparés profondément. Il utilise `layers.sample` pour
trouver tous les instants où cette pose peut apparaître, y compris en miniature
ou vue page. Une image supplémentaire est recalculée de chaque côté des bornes.

| Sortie | Images totales | Pose corrigée | Avec gardes | Copies vérifiées |
| --- | ---: | ---: | ---: | ---: |
| Film |5439|7|9|5430|
| Lot |1968|8|10|1958|
| Page5 |502|8|10|492|

Le décalage du préfixe144,60s explique les grilles distinctes. Les images intactes
sont copiées avec vérification SHA de la source et de la copie ; aucun lien dur.
Les gardes doivent reproduire exactement leur PNG v4. Chaque frame a son origine
et son SHA dans `frame-origins.json`. Les images corrigées doivent réellement
différer du cache, sinon l'export échoue.

Le serveur demeure celui de `render.cjs --serve`, lancé comme enfant temporaire.
Les snapshots et arguments FFmpeg reprennent le comportement standard : mêmes
sources séparées, délais et mix, encodage neuf H264/AAC, puis décodage intégral.
Le moteur partagé n'a pas été modifié par le montage. Les rapports gardent les
13dépendances moteur1.1.1, la source, les médias, les outils de production et leurs
hashes, la preuve de cache, les arguments d'encodage et le journal des frames.

## Exécution

Les outils de ce montage sont dans
`anime/motion-comics/production/pages-05-08/revision-03/` :
`reuse-common.cjs`, `check-frame-cache.cjs`, `reuse-export.cjs`, `export-batch.cjs`.
Ils sont distincts des deux outils possédés par l'intégrateur. Syntaxe et ESLint
ciblés passent. Le mode `reuse-export.cjs ... --plan-only` permet d'auditer le
périmètre avant création de sortie.

Sur feu vert après contre-revue de l'image et gel v5/1.1.1, le plan combiné
`revision-03/export-plan-v1.json` lance le film et le lot, puis page5, deux tâches
maximum. Le prototype de l'intégrateur était terminé avant ce lancement. Les
premiers plans de phase sont conservés ; la phase1 avait été refusée avant toute
création de sortie à cause d'un tableau singleton sérialisé en objet. La résolution
est consignée dans `plan-attempts-v1.json`, sans média ni rendu interrompu.

## Résultats livrés

Les trois exports ont terminé sans rendu échoué, batch final exit0. Les23images de
pose corrigée diffèrent effectivement de v4 ; les6gardes sont byte-identiques et
les7880autres images ont leur origine/copie SHA identique. Le fichier
`export-check-v1.json` récapitule ces comptes, les13dépendances moteur, tailles,
durées, hashes et audits. Les anciens fichiers v4 restent conservés.

| Sortie | Durée en-tête | Octets | SHA256 |
| --- | ---: | ---: | --- |
| Film |226,60s|29124098|`60e524e37d874e84b0ea5f99962d4d0f4151e55f45fa91472402df446baad727`|
| Lot |82,00s|9825513|`6a998533b34bf3ef658a745e860c55a1feb0cae765a3572b1d1bac55944887d3`|
| Page5 |20,92s|2629932|`8d453337006b004261ff5f432fed8e7e895cba65d7191183d7254b291d4f7573`|

Les trois `independent-audit.json` passent : source,13fichiers moteur et chaque
média rehashés sans différence ; H264/AAC1280×720 à24fps ; décodage complet exit0.
Le contrôle sémantique distinct `snapshot-audit-v1.json` compare profondément les
données des13pages copiées après rebasing des chemins par SHA, y compris SVG par
pose, recoil et backing :3exports/13pages favorables. Le simple chargement d'un
snapshot n'a pas été présenté comme preuve de copie exacte.

`mix-check-v1.json` mesure chaque AAC intégralement en float32 mono44100Hz :
pic−0,759481dBFS pour le film,−0,836369pour lot/page5, zéro échantillon écrêté.
Les paquets AAC sont bit-identiques aux trois vidéos v4 correspondantes. Aucun
changement de voix, SFX ou musique n'est introduit par le nouvel encodage.

L'intégrateur a extrait quatre instants contact/recul/résultat de chacun des trois
H264 sous `qa/encoded-*`, avec SHA et numéros de frames. Leur contre-revue finale
appartient à qualité ; le montage n'ajoute pas de captures redondantes. Aucune
écoute humaine ni visionnage humain intégral n'est revendiqué.

## Sauvegarde et rejeu

`prepare-backup-plan.cjs` prépare un plan autonome : sources/journaux/références
hérités exacts, nouveau natif et composite SVG du bras, sélectionv5,13fichiers
moteur actuels, tous outils/tests/polices/prototypes, preuves et prototype corrigé,
trois nouveaux exports et trois pages6–8 réemployées. Les documents et preuves
finales restent dynamiques jusqu'au gel. L'intégrateur inspecte le plan final puis
lance `backup.py` pour contrôler CRC et SHA de chaque membre ; ce fichier ne
revendique pas encore la création du ZIP.

Les caches bruts sont exclus du ZIP. Le rejeu autonome utilise le renderer standard,
sans optimisation de copie ni dépendance à ces caches :

```powershell
node anime/motion-comics/render.cjs anime/motion-comics/projects/blue-purple-pages01-08-v5.json art-masters/replay-full-v5 --fps 24
```

Choisir un nouveau dossier de sortie. Le manifeste snapshot de chaque export est
également rejouable avec ses médias locaux. Node/npm, Edge ou `HOLT_BROWSER` et le
FFmpeg archivé sont les prérequis ; les MP4 se regardent directement sans serveur.
Le lint ciblé des six outils possédés par le montage passe. Moteur, sources et cet
état de livraison sont prêts pour gel documentaire.
