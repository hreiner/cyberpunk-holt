# Sélection et livraison vérifiées — révision 02

6 novembre 2026. **Avis final favorable** sur la sélection v4 et ses six MP4
effectivement produits, décodés et vérifiés. Les limites ON/OFF et d'écoute sont
explicitement conservées ci-dessous.

## Contrat et sources exactes

Contrat final SHA `da290bacb031c7133d66abda9792b506dbb6ce8dadafa2e69fb710ac17c34822`.
Complet `anime/motion-comics/projects/blue-purple-pages01-08-v4.json`, SHA
`9c9dff623f051af239f203815de92ff38c39c2246e692971d1e0eef917ecdf7e`.
Lot `blue-purple-pages05-08-v4.json`, SHA
`49b9f781aa08b46df0431853e51cf18f93d947dfc2bbd6f29841346b0ce1dbdf`.

Comparaison indépendante des quatre projets page05..08-v4 avec candidates-v2,
après résolution des chemins média et journaux : images, panneaux/cues/voix,
lettres, temps/gaps/lead, calques, effets, protections, storyThumbnail, overview,
transitions/outro strictement identiques. Hashes des quatre projets :

- p5 `17e99ba7214a659b049b4ca34e35d70eeb65955869cb226f5f6849fd7d5b6642` ;
- p6 `2b8db74403fffba982717480ecebb83fcd10ee21c0cfe59ff150192b213ba772` ;
- p7 `afe3a5b612ed2cde084c604a19012cdc10a3aebaab8b1ffc258bcefe8a690a7e` ;
- p8 `8013f3c5d95fdcea0650ce9091af899f2c314db60f64141581329275385e2f24`.

Les six séquences pointent les six backings soundtrack-v1/révision02 corrects.
Durées 20,9 /18,6 /20,1 /22,4 s, lot82 s, complet226,6 s inchangés. Quatre PNG
canoniques p5d0e5c6…/p68e0719…/p7f7177a…/p857b864… rehashés identiques àr1.
96 fichiers historiques (71 basev3 +25 antérieurs) rehashés depuis delivery-audit-v1 :
tous conformes. 37 voix existantes, zéro chevauchement ; seuls 027/017 sont retardés
de0,70 s à16,60/18,38 dans la page5, mêmes fichiers/textes et durées.

## Changements réellement contre-revus

Une image générée sur plafond3 : native d8deac05… puis composite1da76f06… qui
préserve exactement les922480 pixels des acteurs. Deux mains/trois visages et
vitre/mur/sol/chaise revus en détail, aucun défaut restant observé. Historique
image28, réserve2 non consommée ; zéro nouvelle génération TTS/SFX/musique.

Pointes seules, crâne/front/sommet fixes ; voiture/roues/ombre fixes et vent autour ;
vitre intacte lisible0,50 s puis bris net16,40 avant réaction16,60. Ces preuves
Canvas ont été ouvertes, puis les six PNG extraits du H.264 final du lot sont
favorables (QA-DELIVERY.md). Garanties zéro pixel concernent Canvas, pas compression
H.264. Les preuves ciblées ont été déplacées sans changement d'octets vers
`qa/animation-candidate-v1/` sous art-masters ; références QA-ANIMATION.md corrigées.

Convention root explicitement conservée : non-révélation du verre avant tir
uniquement ON (grand cadrage/vue page/miniature). OFF ou réduction mouvements
affichent le master papier canonique déjà brisé, même avant16,40. Pas de promesse
d'état intact dans tous modes, ni de nouveau master papier.

Final selected-v4 : trois calques (punch, verre, sortie) PASS, car motionLayers0 ;
14 cases PASS,113 régions protégées et270542 pixels opaques des lettres courantes
zéro altération. Les contrôles de phase p7 héritent de l'alias périodique connu :
échec41 pixels conservé et supplément explicite2447 pixels au seuil180 inchangé,
pas un seuil abaissé. Les rapports exacts sont conservés dans qa/selected-v4-*.

## Audio contrôlé dans le segment joué

Le défaut réel du vieux punch quasi muet est consigné QA-AUDIO.md. Nouveau trim
sur vrai transitoire, +6 dB, premier fort contact+9,98 ms ; tir16,40 et démarreur
réhaussés avec duck musical local, voix inchangées. Dix WAV/35 entrées rehashés,
trois contributions réellement mesurées après duck dans fenêtres220 ms : gains
RMS +16,21 /+6,06 /+10,10 dB par rapport aux anciens accents. Préfixe historique
144,6 s PCM exact. Préécoute par chaîne renderer AAC redécodée indépendamment en
f32 : crête−0,836369 dBFS, zéro échantillon saturé. Pas d'écoute humaine revendiquée.

## Exports terminés et recoupés

Les six `exports/*/render-v1/report.json` et `independent-audit.json` sont
completed. Rehash indépendant de chaque MP4, de son manifeste source, des neuf
fichiers moteur et de tous médias de chacun des six exports : exact. Tous audits
codecs, décodages intégraux exit0 et présence des snapshots sont conformes.
H.264 High/yuv420p 1280×720 à24fps, AAC LC mono44100Hz.

| Export | Durée conteneur | Images rendues | Octets | Crête AAC mesurée opérateur |
| --- | --- | --- | --- | --- |
| complet1–8 |226,60s|5439|29123446|−0,8dBFS|
| lot5–8 |82,00s|1968|9824659|−0,8dBFS|
| page5 |20,92s|502|2629809|−0,8dBFS|
| page6 |18,60s|447|2408987|−2,9dBFS|
| page7 |20,10s|483|2189133|−2,1dBFS|
| page8 |22,42s|538|2278861|−2,6dBFS|

Arrondis de durée inférieurs à une image. Hash complet
`764bfca3cfcb5e6abbf15c55ffecf092c20319e9ddb661b2f64a3178b3e59837` ; lot
`c125fb2de740815526eb8f153ed088139bd01629b66ab5f7ecc93b4973f49d7c`.
Les six empreintes complètes sont conservées dans export-check-v1.json.

Décodage AAC réel supplémentaire indépendant, f32 natif sans filtre ni mixdown :
complet crête−0,759481dBFS/RMS−24,381283, lot−0,836369/RMS−22,131632 ; zéro
échantillon |v|≥1 dans les deux, exit0. Ces mesures portent bien sur les films
finals, pas seulement sur la préécoute ou le fichier SFX entier. mix-check-v1.json
conserve les six contrôles opérateur à exit0 ; hashes tous recoupés.

snapshot-audit-v1.json : six exports/seize pages copiées, contenu et hashes de
tous médias identiques, y compris SVG par pose et backings. Rapport legacy :
quatre PNG du chemin d'export avant page5 byte-identiques aux frames historiques
(0 /46,875 /97,916667 /141,666667s). Les fichiers sources historiques ont aussi
été rehashés (96/96 conformes). Les41 preuves ciblées déplacées et les six PNG
H.264 ont été rehashés indépendamment : tous conformes aux inventaires/rapports.

Six images encodées réellement ouvertes : avant/après bris, deux phases mèches,
deux temps voiture fixe/vent ; favorables, voir QA-DELIVERY.md. Aucun nouveau
défaut visuel identifié. Pages1–4, livraisons précédentes et exports conservés.
Aucune écoute humaine revendiquée ni génération payante supplémentaire.
