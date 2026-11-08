# Outils de livraison — motion01

L'intégrateur lance les exports après revue et gel. Ces outils ne modifient ni les
sources retenues, ni les anciens films, ni le moteur. Deux rendus simultanés maximum.

## Films

Le lot9–21 se rend avec `anime/motion-comics/render.cjs`, dans un nouveau dossier.
Le film complet réemploie le raster des huit premières pages et rend toute la suite
sur sa propre chronologie globale :

```powershell
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01/export/export-complete.cjs MANIFEST_COMPLET art-masters/motion-comics/blue-purple/pages-05-08/revision-03/exports/pages-01-08/render-v1 DOSSIER_NEUF
```

Ajouter `--proof-only` dans un autre dossier neuf pour contrôler le cache sans créer
de MP4. L'outil exige les huit pages initiales inchangées, leur chronologie et les
médias historiques aux hashes attendus. Le moteur visuel doit rester identique ;
renderer/version peuvent différer pour la correction audio. La branche additive de
composition dessin/lettrage du lecteur1.1.2 et sa validation additive dans core sont
admises uniquement avec les témoins exacts du préfixe ; les autres modules visuels
restent identiques. Les14 fichiers
moteur incluent le helper audio mono/stéréo partagé avec le renderer standard.

Les PNG contiennent « PAGE n / 8 ». Un patch limité à `[18,14,190,30]`, région vide
du cadre, remplace cette pagination par le cartouche exact du runtime courant.
Les témoins de chaque page et de chaque pose sont comparés en RGBA : zéro différence
hors patch et égalité complète après patch. Chaque PNG source est vérifié par SHA
contre son journal historique avant copie du raster et réencodage PNG sans perte.
Le rapport distingue conservation du raster et identité des octets PNG.

Le préfixe dure226,60s : son dernier frame à24i/s est5438, puis le premier frame
neuf5439 se situe à226,625s, soit0,025s dans le lot. Les particules ambiantes suivent
aussi le temps global ; copier les PNG du lot autonome donnerait une phase différente.
Le lot autonome a donc son propre rendu et sa pagination1–13. Aucun MP4 compressé
n'est concaténé et aucun arrondi n'est imposé aux dialogues.

La réfection du cartouche traite les huit pages **en huit batches**, chacun avec
un seul PNG de cartouche bouclé et une plage source/sortie `-start_number` explicite.
Le filtre à huit images bouclées simultanées a épuisé la mémoire dans le premier
essai complet : il est abandonné. Les pics WorkingSet FFmpeg de chaque batch sont
relevés dans `prefix-copy-report.json`, avec les mêmes témoins RGBA qu'au préflight.

## Audit et sauvegarde

```powershell
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01/export/audit-delivery.cjs DOSSIER_EXPORT --samples TEMPS_JSON
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01/export/prepare-backup.cjs MANIFEST_COMPLET MANIFEST_LOT EXPORT_COMPLET EXPORT_LOT NOUVEAU_PLAN.json
```

Les temps optionnels sont une liste de `{ "id": "nom", "time": 1.25 }`, relative à
chaque film audité. L'audit vérifie source/médias/moteur, sémantique des snapshots
après rebasing, H2641280×720/24, AAC stéréo, décodage intégral et crêtes du mix AAC.
Il extrait en une passe les PNG du H264 et les lie au SHA du film et aux frames.
Il ne revendique pas leur inspection visuelle ni une écoute.

Le plan de sauvegarde inclut chaque fichier explicitement, les deux films/snapshots,
la sélection et ses dépendances, les sources/prises/journaux/lettres de motion01,
la référence statique validée, les outils et documents. `--extra LISTE_JSON` ajoute
des références/natifs particuliers sous forme de chemins relatifs au dépôt.
Contrôler cet inventaire et geler les documents avant de lancer :

```powershell
& 'C:/Users/hadri/AppData/Local/Programs/Python/Python312/python.exe' docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01/export/backup.py PLAN.json
```

Les hashes gelés sont recontrôlés. L'outil existant crée ensuite l'archive neuve et
relit chaque membre pour vérifier CRC et SHA ; le SHA du ZIP est écrit à côté.
Les frames, dépendances npm et ZIP précédents sont exclus par l'inventaire réel.
La présence des outils ne vaut pas exécution de ces contrôles : les rapports du
lot courant portent les résultats effectivement obtenus.
