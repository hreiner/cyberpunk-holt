# Contre-revue de livraison — bras de John, révision 03

7 novembre 2026. **Avis final favorable** sur la correction sélectionnée v5,
le prototype et les trois nouveaux MP4 du comic. Périmètre : lecture seule des
sources/preuves, écriture du présent rapport uniquement. Aucun rendu long,
génération payante ou changement de média effectué par le reviewer.

## Défaut historique et réparation réellement examinés

L'ancien RECOIL `revision-01/art/p05-c03-pose-03-recoil.png` a été rouvert à côté
du corrigé. Le défaut était bien dans le raster : une manche/poing pendant
bifurquait sous la même épaule que le bras replié. Mon ancienne conclusion
favorable sur l'anatomie de RECOIL avait laissé passer cette insertion incohérente.
Compter les deux mains ou vérifier leurs doigts séparément ne suffisait pas.

Source finale ouverte entière1254×1254 :
`art-masters/motion-comics/blue-purple/pages-05-08/revision-03/art/p05-c03-recoil-corrected-v1.png`,
SHA-256 **`c263491e07a1dbb4e4791f0f50aa494a73a5e26593ab1aef7ff355b119e921ad`**.
La chaîne épaule→coude→poignet repliée est maintenant continue, sans branche,
manche vide ou poing pendant résiduel. L'autre bras est occulté par le buste de
façon plausible ; aucune obligation de lui inventer une main visible. Le poing
replié, les mains du barman, appuis, visage, costumes et décor restent cohérents.

Contre-calcul indépendant des PNG décodés en RGBA :102608 pixels changés,
zéro hors masque `[170,388,300,367]`, zéro dans le poing protégé
`[362,559,90,74]`. Le SHA de la source sélectionnée a été recalculé conforme.
La revue plus détaillée des quatre dessins et du papier est conservée dans
QA-IMAGES.md ; CONTACT et DOWN ne présentent pas la duplication retirée ici.

## Prototype et images des films réellement encodés

Le H.264 du prototype `prototype-review-v1/motion-study.mp4` est completed,
16,5s/396 images à24fps, silencieux, SHA
`7268b3b69fda691fab1f84365867bccc41934595759eaf5cc066981de4f82d55`.
Les images encodées `encoded/frame_02.png`, `frame_03.png`, `frame_04.png` ont
été ouvertes : CONTACT→RECOIL corrigé→DOWN lisible, sans bifurcation ou couture.

Les **douze PNG1280×720 réellement extraits des trois films du comic** ont
ensuite tous été ouverts : quatre images par export dans
`revision-03/qa/encoded-page-05`, `encoded-pages-05-08`, `encoded-pages-01-08`.

| Export | CONTACT | RECOIL premier | RECOIL dernier | DOWN |
| --- | --- | --- | --- | --- |
| page5 / lot5–8 | frame268,11,166667s |269,11,208333s|276,11,500000s|277,11,541667s|
| complet1–8 |3739,155,791667s|3740,155,833333s|3746,156,083333s|3747,156,125000s|

Verdict visuel favorable dans chacun des trois films : la branche fautive est
absente au premier **et** au dernier recul ; bras replié relié à l'épaule,
occultation de l'autre bras admissible, appuis conservés. CONTACT reste un coup
unique, puis recul et barman affaissé vivant ; aucune nouvelle frappe, main
surnuméraire, fusion ou masque de visage observé. Les bulles laissent le geste
lisible. La correction est aussi visible dans la miniature courante.

Ces conclusions portent sur les images H.264 réellement ouvertes, pas seulement
sur Canvas ou le prototype. Le zéro pixel hors masque concerne le composite
source ; il n'est pas revendiqué sur un codec vidéo avec quantification.

## Sélection et chronologie

Comparaison indépendante des documents résolus par `readDocument` : timelines
v4/v5 strictement égales pour page5, lot et complet ; même fichier de backing.
Durées20,9 /82 /226,6s, voix et SFX conservés, aucun nouvel onset ou texte.
Le seul changement visuel autorisé est l'image de frame RECOIL ; les métadonnées
de version et la référence de page5 des séquences changent en conséquence.

Hashes des séquences source des exports :

- page5-with-music-v5 : `6da887712c20ac5aa69e153e8f86da729e4ee3e926abc388f8961062718d0936` ;
- pages05-08-v5 : `0370084791300ed94aff2435d1d0f45775d34199bb11fed509a7a1720d5a07c7` ;
- pages01-08-v5 : `5511c8ea579c70f921a843917b85fc6f35e842c2a8dd9c27f21bdd1be98b32b2`.

## Réemploi vérifié des images inchangées

Méthode des outils `check-frame-cache.cjs` et `reuse-export.cjs` réellement lue.
Il ne s'agit pas d'un nouveau rendu intégral de tous les PNG : les caches v4
audités sont inventoriés par SHA, puis25/44/64 témoins du lecteur actuel en mode
export sont byte-identiques aux anciens PNG de page5/lot/complet. Les rapports
cache-page05-v1/cache-lot-v1/cache-full-v2 sont completed et liés par hash aux
rapports d'export, anciens manifestes et anciens films. Aucun témoin divergent.

L'outil refuse tout delta runtime autre qu'un seul chemin d'image de pose,
vérifie timelines/backings inchangés, puis calcule les images affectées avec le
même échantillonneur de calque. Chaque copie est vérifiée avant et après copie.
Les deux images adjacentes à chaque intervalle sont rerendues comme gardes et
doivent rester identiques aux anciens PNG.

| Export | PNG repris vérifiés | PNG corrigés rendus | Gardes rendues identiques |
| --- | --- | --- | --- |
| page5 |492|8 (269–276)|2 (268/277)|
| lot5–8 |1958|8 (269–276)|2 (268/277)|
| complet1–8 |5430|7 (3740–3746)|2 (3739/3747)|

Au total7880 copies vérifiées,23 images de pose corrigées et6 gardes :7909 PNG.
Le nombre différent dans le complet vient de l'offset144,6s qui n'est pas un
nombre entier d'images à24fps. Les vidéos sont réencodées depuis ces séquences.
Rehash indépendant des fichiers frame-origins.json, preuves cache et outils de
production : exact ; les six gardes sont déclarées inchangées dans les origines.

## Exports, snapshots et audio final

Tous trois `exports/*/render-v1/report.json` et independent-audit.json sont
completed. Rehash indépendant de chaque MP4, manifeste source,13 fichiers moteur,
tous médias et outils de production : exact. Décodages intégraux exit0 ; H.264
High/yuv420p1280×720 à24fps et AAC LC44100Hz mono vérifiés, snapshots présents.
snapshot-audit-v1.json : trois exports/treize pages copiées, données et hashes
des assets identiques après rebasing, y compris SVG par pose et backings.

| Export | Durée conteneur | Images | Octets | SHA-256 MP4 |
| --- | --- | --- | --- | --- |
| page5 |20,92s|502|2629932|`8d453337006b004261ff5f432fed8e7e895cba65d7191183d7254b291d4f7573`|
| lot5–8 |82,00s|1968|9825513|`6a998533b34bf3ef658a745e860c55a1feb0cae765a3572b1d1bac55944887d3`|
| complet1–8 |226,60s|5439|29124098|`60e524e37d874e84b0ea5f99962d4d0f4151e55f45fa91472402df446baad727`|

Audio : extraction indépendante `-map 0:a:0 -c:a copy -f adts` des anciens et
nouveaux MP4, exit0, octets strictement identiques dans chacun des trois couples.
Hashes ADTS page5/lot/complet :

- `6be7429d776260efbd61c691afff59f999c5c2db022a9a5a7608ea326f5f11eb` ;
- `c98fb9a1aa2aa7cef6d3cfcd9a29c1ded419cd56c44ee5d826671c77a53d3747` ;
- `f108af39348294e1f93a3827dc442331ca973f3161bb739c007571cf5fbe682f`.

mix-check-v1.json utilise le hash des paquets sans encapsulation ADTS : ses
empreintes diffèrent donc de celles ci-dessus mais confirment aussi l'identité
avec v4. Son décodage intégral float donne crêtes−0,836369dBFS page5/lot,
−0,759481 complet, zéro échantillon saturé. Aucun changement audio ou nouvelle
écoute humaine n'est déduit de la revue des images ; aucune écoute revendiquée.

Les films individuels des pages6–8 et les anciennes livraisons restent réemployés.
Aucune réserve ouverte sur la réparation demandée dans les fichiers examinés.
