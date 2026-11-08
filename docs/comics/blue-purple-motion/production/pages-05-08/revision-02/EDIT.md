# Montage — reprise ciblée 02

Base conservée : sélection `blue-purple-pages01-08-v3.json` et sauvegarde de
revision-01. Aucun fichier de cette livraison n'est remplacé. L'intégrateur publie
seul les sélections v4 après contre-revue ; le montage produit les candidats isolés.

Le lecteur accepte `storyThumbnail:true` uniquement sur la nouvelle page5 : sa
miniature reprend le composite narratif déjà lettré. Les autres pages gardent le
chemin de miniature historique. Cela évite de révéler la vitre brisée avant le tir
pendant la lecture animée. Les quatre masters PNG restent ceux de la sélectionv3 ;
le mode sans effets conserve le dessin canonique brisé, suivant arbitrage explicite
de l'intégrateur. En animation, la pose initiale intacte couvre la case dès la vue
page ; les deux états dessinés commutent à16,40s, sans fondu.

La chronologie conserve82s de lot et226,60s de film. Le nouveau
`panel.leadInSeconds=.70` précède la première voix de p05-c04 dans sa tenue existante :
arrivée stable15,90 ; tir16,40 ; Franklyn27 à16,60 ; Abigail17 à18,38. Aucune voix
n'est étirée ni préfixée de silence. Les trois autres pages gardent leurs temps.

Outils nouveaux sous `anime/motion-comics/production/pages-05-08/revision-02/` :

- `prepare-timing.cjs` reconstruit les temps avec le même moteur lecteur/export.
- `prepare-candidates.cjs REVISION [PAGES]` clone la sélectionv3, raccorde les plans
  d'effets/gestes revus et vérifie le hash de la chronologie du prémix. Chaque sortie
  utilise un dossier nouveau ; les manifestes sélectionnés restent intacts.

Les nouveaux exports sont prévus sous
`art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/`,
six dossiers `render-v1`, complet et lot en premier, deux tâches simultanées maximum.
Ils attendent le gel des images, effets, chronologie et prémix ainsi que le feu vert
de l'intégrateur. Les quatre PNG témoins historiques seront comparés byte à byte
après le dernier changement moteur. Les audits finals porteront sur les sources,
neuf fichiers moteur, copies médias, décodage H264/AAC et niveaux des six MP4.

Le candidat commun `revision-02/candidates-v2/` contient les dix manifestes : quatre
pages, quatre wrappers musicaux, lot et film. Son prémix `soundtrack-v1` est raccordé
par hash à `timing-r2-v1.json` ; aucun texte ni fichier de voix ne change.

Contrôles réellement exécutés avant exports :

- Syntaxe et lint ciblé des nouveaux outils réussis.
- `check-story-thumbnail.cjs` sur le lecteur réel : états intact0/16,10s et brisé16,40/16,45s,
  miniature comparée au composite lettré avec0diff dans la fenêtre. Deux images1280
  ouvertes : mains/visages et bulles stables, vitre intacte puis bris net.
  Preuve finale : `revision-02/qa/story-thumbnail-v2/report.json`. Le candidatv1 et sa
  preuve restent conservés ; seule la valeur du seuil flottant du deuxième frame
  de vitre a été corrigée (`16.4−15.9`, au lieu de `.5`), sans changer les temps,
  voix, backing ou moteur. Les pages6–8 ne changent que de métadonnée de version.
- `revision-01/check-legacy-render.cjs` sur le candidat huit pages : les PNG témoins
  frames0/1125/2350/3400 restent byte-identiques aux images originales des pages1–4.
  Preuve : `revision-02/legacy-render-qa-v1/report.json`.

La sélectionv4 a été publiée depuis `candidates-v2` par l'intégrateur après revue
favorable des trois deltas et du son. Sur feu vert explicite, six exports neufs ont
terminé dans `revision-02/exports/*/render-v1`, complet et lot en premier, deux
exports simultanés maximum. Aucun redémarrage ni export échoué pour cette reprise.

| Export | Durée en-tête MP4 | Octets | Crête AAC |
| --- | ---: | ---: | ---: |
| Film pages1–8 |226,60s|29123446|−0,8dBFS|
| Lot pages5–8 |82,00s|9824659|−0,8dBFS|
| Page5 |20,92s|2629809|−0,8dBFS|
| Page6 |18,60s|2408987|−2,9dBFS|
| Page7 |20,10s|2189133|−2,1dBFS|
| Page8 |22,42s|2278861|−2,6dBFS|

Les six `independent-audit.json` sont favorables : sources, neuf fichiers moteur et
médias actuels rehashés sans différence ; H264/AAC1280×720/24fps ; décodage complet
exit0 ; snapshots locaux présents et valides. La copie exacte de leurs données et
assets est contre-vérifiée séparément par l'intégrateur. `export-check-v1.json`
conserve SHA, tailles, durées, comptes et résultats. `mix-check-v1.json` mesure le
décodage AAC entier des six fichiers, aucune crête à0dBFS. Les arrondis des pages5/8
restent inférieurs à une image24fps. Les six stills réellement extraits du H264 ont
été ouverts et reçus favorables par l'intégrateur et qualité, sans nouvelle capture
redondante. Aucune écoute humaine ni visionnage humain intégral n'est revendiqué.

Le plan autonome `revision-02/backup-plan-v1.json` prépare les seules six sorties
finales et toutes sources requises, sans frames/anciens ZIP/anciens exports. Sa
version finale reste à regénérer après gel documentaire ; l'intégrateur lancera
`backup.py`, qui contrôle CRC et SHA de chaque membre archivé. Le montage ne
revendique pas encore la création de cette archive.
