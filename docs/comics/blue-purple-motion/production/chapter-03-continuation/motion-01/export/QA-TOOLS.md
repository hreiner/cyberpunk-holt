# Contrôle des outils — 7 novembre 2026

Les scripts `common.cjs`, `export-complete.cjs`, `audit-delivery.cjs` et
`prepare-backup.cjs` ont passé `node --check`. Les deux scripts Python ont été
parsés par l'interpréteur local. Aucun paquet supplémentaire installé.

Le contrôle réel du préfixe utilise le manifeste complet21pages préparé par
l'intégrateur et le cache livré pages1–8/v5 :

- `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/export-tools/cache-proof-v2/report.json`
- `.../cache-proof-v2/cache-proof/prefix-copy-report.json`

48témoins ont été capturés avec le chemin Canvas d'export, sur les huit pages et
les frontières des poses dessinées. Chaque témoin reste exactement identique en
RGBA hors rectangle de pagination `[18,14,190,30]`. Après remplacement de ce
cartouche par celui du runtime courant, le raster entier est exact. Les anciennes
sources/temps et médias sont également comparés à la sélection et aux hashes livrés.
La première tentativev1 a échoué au lancement Edge sous sandbox, avant capture ;
elle reste marquée failed. La tentativev2 hors sandbox s'est terminée.

Le chemin de copie effectif a aussi été exécuté sur un vrai PNG source :
`.../export-tools/rgba-patch-test-v1/cache-proof/prefix-copy-report.json`.
FFmpeg décode, superpose le petit cartouche et réencode le PNG en RGBA, sans passer
par YUV. Le PNG produit est exactement égal au témoin runtime en pixels. Cela vérifie
le codec/filtre de copie, au-delà du calcul d'un patch théorique.

Ces preuves concernent le préfixe et l'outillage. Aucun MP4 final, audit AAC/H264
du nouveau lot ou archive finale n'a été exécuté par cette mission de préparation.
L'intégrateur lance les exports après sa revue et son gel ; les rapports finaux
attestent les contrôles effectivement obtenus, sans déduire une écoute humaine.

## Correction de mémoire après essai completv1

Le premier export complet a épuisé la mémoire avec les huit PNG de cartouche bouclés
simultanément. Ce filtre a été remplacé par huit batches séquentiels, un par page :
un seul cartouche en boucle, `-start_number` explicite sur la source et la sortie,
et `-frames:v` égal à la plage de la page. Le format reste RGB/RGBA, sans YUV.

Le test de la première page entière a réellement écrit826PNG en73,485s :
`.../export-tools/prefix-batch-test-v1/cache-proof/prefix-copy-report.json`.
Les trois témoins de cette page sont identiques au runtime après patch. Le pic
WorkingSet du processus FFmpeg est333643776octets, soit318,19MiB. Il est mesuré
par `GetProcessMemoryInfo` pendant l'exécution, pas déduit de la taille des fichiers.

Un second test contrôle un décalage non nul, frames826–828 :
`.../export-tools/prefix-offset-test-v1/cache-proof/prefix-copy-report.json`.
Les trois PNG portent les bons numéros et le témoin reste exact ; pic228376576octets.
La même logique de comparaison des48témoins du préflight est conservée pour la copie
complète. L'intégrateur lance une nouvelle version du film, jamais une reprise
silencieuse du dossierv1 échoué.

La compression PNG1 est ensuite comparée à6 sur les mêmes20frames826–845 et le même
cartouche. La somme SHA256 des20images RGBA décodées est identique :
`4086de9cebb09ef15a7a47827c6cd876eb83444dc4065773bbfd4d18e2ee2c2a`.
Le batch passe de1,187s à0,828s, soit30,24% de temps en moins sur ce petit essai ;
pics mémoire279977984 et285585408octets. Cette mesure courte ne garantit pas un
gain identique pour tous les dessins. La valeur1 devient le défaut, en gardant
`-threads1`. Rapport : `.../export-tools/prefix-compression-comparison-v1.json`.
