# Livraison — corrections du 6 novembre 2026

Sélection **v4** : mèches seules page6, vitre entière puis bris page5 case4, voiture
fixe et particules de vitesse page8 case4. Les bruitages clés ont leur prélèvement
et leur mix corrigés. Durées conservées : **82 s** pour pages5–8, **226,60 s** au
complet. Les pages1–4,37 voix et quatre masters canoniques sont inchangés ; toutes
les livraisons précédentes restent présentes.

## Lire et regarder

[Lecteur huit pages](http://127.0.0.1:50588/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-08-v4.json).
Serveur laissé actif. Recharger l'onglet v3 : son ancienne URL est réorientée vers
v4, sans modifier le manifeste v3 conservé.

[MP4 complet — 3 min46,60 s](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/pages-01-08/render-v1/motion-comic.mp4)
et [MP4 nouvelles pages — 82 s](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/pages-05-08/render-v1/motion-comic.mp4).
Complet :29 123 446 octets ; lot :9 824 659 octets. Six sorties H.264/AAC mono,
1280×720 à24 images/s, autonomes sans serveur.

| Page | MP4 individuel | Durée narrative |
| --- | --- | --- |
| 5 — confrontation et tir | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/page-05/render-v1/motion-comic.mp4) |20,90 s|
| 6 — sortie arrière | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/page-06/render-v1/motion-comic.mp4) |18,60 s|
| 7 — parking | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/page-07/render-v1/motion-comic.mp4) |20,10 s|
| 8 — démarrage et fuite | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/page-08/render-v1/motion-comic.mp4) |22,40 s|

Les quatre PNG/SVG maîtres restent ceux de la [livraison précédente](../revision-01/DELIVERY.md).
La nouvelle [vitre intacte](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/art/p05-c04-intact-v1.png)
a son [masque SVG éditable](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/art/p05-c04-intact-composite-v1.svg),
ses références et son journal. Le composite conserve les acteurs et leurs mains
strictement identiques. Les voix restent les prises originales, sans génération ni
étirement. Les six backings corrigés sont dans `revision-02/soundtrack-v1/`.

## Ce qui change

- Page6 : petite zone de pointes animées, crâne/sommet/front/visage fixes.
- Page5 : vitre intacte dans le cadre stable de15,90 à16,40 s ; tir/bris à16,40,
  réaction à16,60. Miniature au même état narratif. Mains et visages préservés.
- Page8 : voiture, roues et ombre immobiles ; particules directionnelles dans les
  zones libres de décor, sans bande lumineuse.
- Coup de John : le montage prend désormais le vrai transitoire du fichier, aligné
  sur le contact à+10 ms. Tir/verre et démarreur renforcés, musique baissée brièvement.

Les animations désactivées et les mouvements réduits affichent le master papier
final déjà brisé ; la progression intact→brisé concerne le mode animé. Les cheveux
restent une déformation locale de pointes, pas une simulation de chevelure complète.

## Preuves et sources

[Revue](REVIEW.md), [dessins et mains](QA-IMAGES.md), [animation](QA-ANIMATION.md),
[audio](QA-AUDIO.md). Les contrôles du lecteur, de la chronologie et des sources
passent : huit pages,37 voix,38 fichiers audio décodés, aucun chevauchement et seules
les deux réactions au tir décalées de0,70 s. Les71 sources de v3 et les25 sources
historiques initiales restent intactes.30 tests motion comics et `npm run verify`
passent ; quatre PNG témoins des pages1–4 restent byte-identiques.

Les trois modifications sont contrôlées dans Canvas et dans six images extraites
du H264 du lot, avec contre-revue favorable. Les six audits finaux passent :
décodage intégral, neuf fichiers moteur et médias conformes, codecs vérifiés.
Les six snapshots ont les mêmes données et SHA de médias que leurs sources,
y compris les variantes SVG par pose. Les AAC complets, lot et page5 culminent
à−0,8 dBFS ; aucune des six sorties n'atteint0 dBFS.113 régions protégées restent
intactes dans les contrôles Canvas, dont crâne et voiture.14/14 cases validées.
Aucune écoute humaine n'est prétendue.

[Contre-revue finale](QA-FINAL.md), [images encodées](QA-DELIVERY.md),
[audits six MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/export-check-v1.json),
[mesures AAC](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/mix-check-v1.json),
[snapshots](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/snapshot-audit-v1.json).

## Relance

Depuis la racine, Node/npm/Playwright, Edge et FFmpeg disponibles :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-08-v4.json --port 50588 --alias blue-purple-pages01-08-v3.json
node anime/motion-comics/render.cjs anime/motion-comics/projects/blue-purple-pages01-08-v4.json art-masters/motion-comics/blue-purple/pages-05-08/revision-02/exports/pages-01-08/render-v2 --fps 24
```

Ne pas relancer le port occupé sans arrêter son serveur identifié. Choisir un dossier
neuf pour tout export ; `HOLT_BROWSER` et `HOLT_FFMPEG` configurent les exécutables.
Chaque export contient manifeste rebasé et médias copiés, rejouables sans compte.
Les MP4 se lisent directement sans ces outils.

Budget réel :1/3 appel ImageGen,28 connus cumulés ;0 nouvelle TTS/SFX/musique payante.
Cumul vocal3394 caractères inchangé. [Compteurs](BUDGET.json), coûts non exposés inconnus.

## Sauvegarde

[Archive autonome](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/delivery-backup-v1.zip)
et [rapport d'intégrité adjacent](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-02/delivery-backup-v1.json).
Le plan explicite conserve médias, voix/journaux, sources des accents, masque SVG,
références exactes, preuves et documents finaux, moteur/outils, dépendances déclarées,
FFmpeg et les six snapshots/MP4 sélectionnés. Frames, anciens exports et ZIP exclus.
`backup.py` vérifie le CRC puis chaque SHA-256 de membre selon `BACKUP-MANIFEST.json`.
La taille et le SHA du ZIP sont dans le rapport adjacent, hors de l'archive elle-même.
