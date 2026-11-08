# Livraison v5 — bras de John et référence d'animation corrigés

7 novembre 2026. La pose RECOIL comportait déjà un bras incohérent dans son raster
source : une manche/poing pendants rejoignaient le même côté que le bras replié.
La correction retire cette branche entière. Les quatre poses et le master papier
ont été revus : les trois autres poses et le master CONTACT ne nécessitent pas de retouche.

## Lire et regarder

[Lecteur complet corrigé v5](http://127.0.0.1:50588/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-08-v5.json).
Recharger l'ancien onglet v4 : les chemins v3 et v4 sont redirigés vers v5 sans modifier
leurs fichiers historiques. Le lecteur conserve le plein écran, son clavier et son tiroir.

| Livrable corrigé | Fichier | Durée | Taille |
| --- | --- | --- | --- |
| Film complet, pages 1–8 | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/exports/pages-01-08/render-v1/motion-comic.mp4) | 226,60 s | 29 124 098 octets |
| Lot pages 5–8 | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/exports/pages-05-08/render-v1/motion-comic.mp4) | 82 s | 9 825 513 octets |
| Page 5 | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/exports/page-05/render-v1/motion-comic.mp4) | 20,90 s | 2 629 932 octets |
| Étude de mouvement corrigée v2, muette | [MP4](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/prototype-review-v1/motion-study.mp4) | 16,50 s | 1 423 827 octets |

Les quatre sorties sont en H264 1280×720 à 24 images/s ; les trois comics comportent
l'AAC original inchangé. Les MP4 individuels des pages 6–8 restent ceux de la
[livraison v4](../revision-02/DELIVERY.md), aucune image de ces pages n'ayant changé.

[Prototype interactif corrigé](http://127.0.0.1:50920/anime/motion-comics/prototypes/motion-design-v2/index.html) ;
l'ancien chemin `motion-design-v1` redirige vers v2. Les fichiers v1 sont conservés.
La [source et ses contrôles](../../../../../../anime/motion-comics/prototypes/motion-design-v2/README.md)
restent une référence pour la suite : anticipation/contact/récupération/tenue, rupture
ancrée, flux progressif autour du sujet fixe. Les durées muettes ne retiment pas le film.

## Source et limites de la correction

ImageGen a réellement redessiné la zone fautive. Le
[PNG corrigé](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/art/p05-c03-recoil-corrected-v1.png)
et son [SVG éditable](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/art/p05-c03-recoil-composite-v2.svg)
préservent la source hors d'un rectangle de correction ; le poing replié vient de l'original.
SHA PNG : `c263491e07a1dbb4e4791f0f50aa494a73a5e26593ab1aef7ff355b119e921ad`.
102 608 pixels changés, zéro hors masque et zéro sur le poing, recoupés indépendamment.

[Contre-revue des images](QA-IMAGES.md), [montage](EDIT.md),
[contre-revue des exports](QA-DELIVERY.md). Les vues entières et agrandies vérifient
l'insertion épaule/coude/poignet, les mains du barman et les coutures. La vérification
de doigts isolés de l'ancienne revue avait laissé passer ce défaut de bras ; cette
limite est corrigée dans le skill art et les recettes de revue.

La pose reste dessinée, sans interpolation corporelle. Le bras éloigné est occulté
par le buste, pas supprimé artificiellement sous une bulle. La garantie de pixels
identiques concerne Canvas et la composition, pas les valeurs après compression H264.

## Preuves

La sélection v5 remplace un seul `frame.image`. Les 37 voix, textes FR, panneaux,
ancres d'action, sons, musiques et durées restent ceux de v4. Les sources historiques
v4, ses 68 dépendances et ses six MP4 sont [préservés par SHA](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/qa/previous-sources-preserved.json).

Le montage réemploie les PNG historiques vérifiés et ne recalcule que la pose corrigée
et ses deux gardes. Les 64/44/25 témoins des caches ont été comparés au lecteur actuel ;
la comparaison des configurations refuse toute différence visuelle hors du chemin de pose.
7 880 images sont copiées avec SHA exact et 29 rendues, dont six gardes byte-identiques.
Ces images alimentent trois encodages neufs et trois snapshots autonomes, sans couper
ni recoller les MP4 compressés. Les journaux `frame-origins.json` indiquent chaque origine.

Les trois audits `independent-audit.json` passent : source, treize fichiers moteur,
médias, codecs et décodage intégral. Les
[vues du film complet](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/qa/encoded-pages-01-08/report.json),
[du lot](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/qa/encoded-pages-05-08/report.json) et
[de la page 5](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/qa/encoded-page-05/report.json)
sont extraites des H264 réels avant/premier recul/dernier recul/après ; le SHA de chaque
MP4 et les indices exacts sont consignés. Les flux AAC extraits sont identiques aux
exports précédents, pas seulement les fichiers audio source. Aucune nouvelle écoute humaine revendiquée.
La [comparaison sémantique des snapshots](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/snapshot-audit-v1.json)
recoupe les treize pages copiées et les trois séquences : mêmes données après rebasing
par SHA, mêmes médias (dont SVG et recul corrigé) et mêmes backings.

[Séquence complète](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/qa/sequence-v1/report.json) et
[lecteur sur cinq formats](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/qa/reader-ui-v1/report.json)
passent, sans erreur JS : pause/audio, seek, clavier, tiroir, plein écran et réduction
des mouvements. Les 32 tests motion comics et `npm run verify` passent (788 tests du
jeu, typage, lint et build). Les skills et adaptateurs sont synchronisés et contrôlés.

Budget réel : **un appel ImageGen sur deux autorisés, 29 connus cumulés pages 5–8** ;
zéro nouvelle voix/SFX/musique. TTS 3 394 caractères cumulés inchangés.
[Compteurs](BUDGET.json), prompt exact dans `prompts/` et journal/références dans `art/`.
Coût et identifiant fournisseur non exposés : inconnus.

## Relance et sauvegarde

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-08-v5.json --port 50588 --alias blue-purple-pages01-08-v3.json --alias blue-purple-pages01-08-v4.json
node anime/motion-comics/prototypes/motion-design-v2/serve.cjs 50920
```

Moteur 1.1.1 : ajout de plusieurs `--alias` pour conserver les anciens liens ; rendu
Canvas et horloges inchangés. À la livraison, serveurs identifiés PID 32424 et 16196.
Ne pas arrêter un autre processus si ces ports ont changé de propriétaire.

Sauvegarde : [archive finale](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/delivery-backup-v1.zip)
et [rapport d'intégrité adjacent](../../../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/delivery-backup-v1.json).
Le plan explicite conserve la sélection, les médias/journaux/références, le masque et
son natif, les voix/sons, le moteur actuel, les outils/tests, le prototype v2, les
preuves et les trois nouveaux exports avec leurs snapshots ; les exports inchangés
des pages6–8 restent inclus comme réemplois. Les frames, dépendances npm et anciens ZIP
sont exclus par l'inventaire réel. `backup.py` vérifie CRC et SHA de chaque membre ;
taille et SHA du ZIP figurent dans le rapport adjacent, hors archive pour éviter l'autoréférence.
Les anciennes versions et archives restent conservées. Aucun commit/push.
