# Contre-revue des films retenus — renderv2

7 novembre 2026. Les filmsv1 restent des essais historiques. La sélection courante
utilise le lotmotion02 et la séquence complètev7 ; images, voix, son et temps sont
conservés, libellés français de scène repris dans les données.

## Lot9–21

Film : `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/exports/pages-09-21/render-v2/motion-comic.mp4`.
SHA256 : `1d595ea37c682ac6a359aef5d77de38f4c8d0028a2679d7b0ced2b140313748c`.

L'audit indépendant termine : H2641280×720/24i/s, AAC stéréo, décodage intégral,
219,402222s narratives,5266PNG et5266frames H264, soit219,416667s de vidéo CFR.
Snapshots identiques après rebasing par hashes
de médias ; aucune différence de source/moteur. Crête AAC décodée :−1,335042dBFS.
Les paquets AAC complets sont identiques à ceux du lotv1, SHA256
`040784263c194b3373d6c3d8e31e29e72d6d42c9cdf2e5ee85a178cf493f1281` : la reprise des
libellés n'a pas modifié l'audio. Preuve dans `encoded-evidence/audio-v1-v2-preserved.json`.

Les45vues H264, liées au SHA du film, sont regroupées dans `encoded-evidence/contact.png`.
Cette planche a été ouverte, ainsi que les frames019,023,028,031,039et043 en pleine
résolution1280×720 : capsule, vision numérique, tir, appartement après le geste,
quai et refuge. Les bulles restent lisibles et sans déformation visible dans ces
vues. Les nouveaux libellés sont français et le résidu « case after » est corrigé
en « Après le geste ». Aucun nouveau défaut visuel observé dans ces échantillons.

Les temps demandés et les temps des frames encodées sont distincts dans le rapport.
À24i/s une ancre peut tomber entre deux images ; la sélection du frame le plus proche
est explicitement conservée, sans inventer une image à l'ancre exacte. Cette revue
ne certifie ni tous les frames, ni l'anatomie ancienne dans son ensemble.

## Film complet1–21

Film : `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/exports/pages-01-21/render-v2/motion-comic.mp4`.
SHA256 : `eee85dac2ece0123dc4062bcd9bcd023bc0dd1e7ab1541e84169617ebd5db7f9`.
Taille :67855339octets.

L'audit indépendant termine : H2641280×720/24i/s, AAC stéréo, décodage intégral,
snapshots identiques après rebasing par SHA des médias ; aucune différence de source,
de média ou de moteur. Crête AAC décodée : **−1,340312dBFS**.

Le nombre de PNG calculés et celui des images réellement encodées sont distingués :
10705PNG, **10704frames H264**,446,000000s de vidéo pour446,002222s narratives.
Le découpage CFR avec `-t` laisse donc2,222ms de récit au-delà de la vidéo, pendant
la vue finale fixe. Le dernier frame réel est **10703**, horodaté445,958333s.
Il a été extrait et ouvert :
`encoded-evidence/last-frame-10703.png`. La page21 complète et la pagination21/21
restent affichées, sans image noire. Un frame10704 n'existe pas dans ce H264.

Les57vues demandées ont été extraites du H264 et la planche contact a été ouverte.
Dix vues ont aussi été ouvertes individuellement à1280×720 : frames005–008 pour
les quatre poses de John,035vision numérique,040tir,044résultat dans l'appartement,
051eau du quai,055refuge, puis dernier frame10703. Le bras réparé de la pose de recul
est conservé ; aucune nouvelle branche ou déformation du membre n'apparaît dans ces
vues. Les lettres et les libellés français restent lisibles. La pagination du lecteur
exporté utilise bien21pages.

Le préfixe réemploie5439rasters historiques avec seul patch de pagination. Sa copie
passe les48témoins exacts et les huit batches de compressionPNG1. Pic WorkingSet
FFmpeg maximal331988992octets, soit316,61MiB ; temps cumulé des huit batches256,546s.
La suite est rendue directement à son temps global, sans recycler les frames du lot
autonome, dont la phase ambiante est différente par construction.

Les rapports `independent-audit.json`, `encoded-evidence/report.json` et
`cache-proof/prefix-copy-report.json` relient ces preuves au film et aux sources.
Aucun média, manifeste ou moteur gelé n'a été modifié pour la contre-revue.

## Écoute

Aucune écoute humaine revendiquée. Les niveaux et le décodage attestent la chaîne
technique, pas l'expressivité ou l'équilibre perçu. Les limites des gestes animés
restent celles du contrat : dessins retenus et mouvement local, sans morphing corporel.
