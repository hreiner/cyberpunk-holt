# Livraison — Blue Purple, pages 05 à 08 et ensemble 01 à 08

5 novembre 2026. Quatre nouvelles pages livrées : piège au bar, sortie arrière,
parking et fuite en voiture. Le groupe repart réuni, avant la borne. Les pages 1–4
et leurs médias sélectionnés sont conservés à l'identique, empreintes recoupées.

## Lire et regarder

[Lecteur des huit pages](http://127.0.0.1:50588/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-08-v1.json),
testé et laissé actif. Relance depuis la racine du dépôt :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-08-v1.json --port 50588
```

[MP4 complet 1–8](../../../../../art-masters/motion-comics/blue-purple/pages-01-08/render-v1/motion-comic.mp4)
— **4 min 08,50 s**, 38 098 000 octets, autonome sans serveur.
[MP4 des nouvelles pages 5–8](../../../../../art-masters/motion-comics/blue-purple/pages-05-08/render-v1/motion-comic.mp4)
— 103,90 s au lecteur, 103,92 s dans le conteneur, 18 576 132 octets.
L'arrondi à l'image du MP4 peut ajouter une fraction de 1/24 s ; la chronologie source
reste commune au lecteur et à l'export.

| Page | Dessin final | MP4 individuel | Durée narrative |
| --- | --- | --- | --- |
| 5 — Le piège | [PNG](../../../../../art-masters/motion-comics/blue-purple/page-05/page-v1.png) | [MP4](../../../../../art-masters/motion-comics/blue-purple/page-05/render-v1/motion-comic.mp4) | 26,40 s |
| 6 — Par l'arrière | [PNG](../../../../../art-masters/motion-comics/blue-purple/page-06/page-v1.png) | [MP4](../../../../../art-masters/motion-comics/blue-purple/page-06/render-v1/motion-comic.mp4) | 23,55 s |
| 7 — Notre voiture | [PNG](../../../../../art-masters/motion-comics/blue-purple/page-07/page-v1.png) | [MP4](../../../../../art-masters/motion-comics/blue-purple/page-07/render-v1/motion-comic.mp4) | 24,55 s |
| 8 — Tous ensemble | [PNG](../../../../../art-masters/motion-comics/blue-purple/page-08/page-v2.png) | [MP4](../../../../../art-masters/motion-comics/blue-purple/page-08/render-v1/motion-comic.mp4) | 29,40 s |

Manifeste d'ensemble versionné : `anime/motion-comics/projects/blue-purple-pages01-08-v1.json`.
Lot nouveau : `blue-purple-pages05-08-v1.json`. Pages : `blue-purple-page05-v1.json`
à `blue-purple-page08-v1.json` ; wrappers musicaux individuels `blue-purple-page05-with-music-v1.json`
à `blue-purple-page08-with-music-v1.json`. Les références 1–4 du manifeste v4 précédent
sont réemployées directement, sans génération ni changement de leurs fichiers.

## Pages, voix et animations

Douze bandes sans lettres, dessin brut assemblé, PNG lettré et bulles françaises
éditables. Chaque dossier de page contient `page-source-vN.svg`, `lettering-vN.svg`,
`lettering-vN.json` et son rapport d'assemblage ; N vaut 1 pour pages 5–7, 2 pour page 8.
La version 1 du lettrage page 8 est conservée mais écartée à cause de queues croisées.

Huit nouvelles prises anglaises **Eleven v4**, casting existant, jeu expressif sans tag
automatique de souffle. [Audition préparée](../../../../../art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/audition-prepared.mp3).
Sources, journaux, mesures et mapping sous `pages-01-08/audio-v1/` ; quinze prises v4
des pages précédentes réemployées. Deux copies WAV reçoivent un gain constant +10 dB,
sources préservées. Le fond HOLT existant reste continu et baissé sous les voix.

Quatorze cases nouvelles avec mouvements revus : pluie, vapeur verticale/latérale,
mèche, poussière, verre descendant, ondes et lumières ponctuelles rattachées à des
sources réelles. Aucun `lightSweep` ajouté. Les événements physiques ne bouclent pas
et se figent en pause. Les vapeurs de ruelle/échappement et le reflet de serrure sont
volontairement discrets ; il ne s'agit pas de gestes de corps reconstruits.

## Contrôles exécutés

- Dessins et lettres contre-revus ; toutes les mains critiques examinées en agrandissement.
  Six doigts du barman, deux écussons indus, conducteur inversé, main isolée et bulles
  raster ont été corrigés par éditions ciblées puis revus. Aucune réserve visuelle bloquante ouverte.
- Quatorze cadrages comparés en phases A/B, événements avant/pendant/après, déterminisme,
  arrêt, pause réelle et 88 protections nouvelles exactes. Halos rectangulaires et bande
  de sol retirés avant export. Détails : [revue](REVIEW.md), [dessins](QA-IMAGES.md),
  [animations](QA-ANIMATION.md) et [contre-revue finale](QA-FINAL.md).
- Lecteur huit pages testé : navigation, changements automatiques, pause sonore,
  récit figé, ambiance indépendante, arrêt des effets et réduction des mouvements ; aucune erreur.
- Les **23 prises** ont passé le décodage intégral, sans chevauchement vocal ;
  **25 fichiers** de la sélection 1–4 ont leurs empreintes initiales inchangées.
- **Six exports H.264 High/YUV420p, 1280 × 720 à 24 i/s, AAC LC mono 44,1 kHz**,
  snapshots rejouables et empreintes des médias/moteur/source contrôlés. Tous ont passé
  le décodage complet du renderer et celui de l'audit indépendant.
- Mix complet : moyenne −27,0 dB, crête −1,7 dB ; aucune saturation mesurée sur les six
  sorties. Huit images extraites des MP4 ont été ouvertes pour contrôler les corrections,
  le groupe, le conducteur, les bulles, le départ et le raccord 4→5.
- `npm run verify`, les **19 tests du socle** et `npm run workflow:check` réussis.

Preuves sous `art-masters/motion-comics/blue-purple/pages-01-08/` :
`delivery-audit-v1.json`, `export-check-v1.json`, `mix-check-v1.json`,
`qa-sequence-final-v1/`, `encoded-stills-v1/` et rapports de chaque `render-v1/`.

## Dépenses, sauvegarde et limites

**ImageGen : 16/16 appels**, douze bandes et quatre corrections ciblées, aucun échec.
Journal global recoupé : [IMAGE-SPEND.json](IMAGE-SPEND.json).
**Voix : 2 856/3 200 caractères cumulés**, dont 2 416 historiques et 440 nouveaux ;
réserve 344 intacte, aucun échec ni reprise. Coûts monétaires et identifiants fournisseur
non exposés : inconnus. Aucun autre service payant ni génération vidéo extérieure.

Sauvegarde autonome : `art-masters/motion-comics/blue-purple/pages-01-08/delivery-backup-v1.zip`.
Le rapport JSON voisin consigne sa taille, son SHA256 et le contrôle CRC. L'archive
contient masters et tentatives nouveaux, références/prompts/journaux, documents,
lecteur/moteur, six exports et snapshots, les 25 sources historiques retenues et leurs
15 journaux de voix. Les frames intermédiaires sont exclues ; elles ne sont pas nécessaires
pour lire les MP4 ou rejouer les snapshots. Conserver aussi cette archive hors du seul Git.

Aucune écoute humaine des nouvelles prises ou du mix, ni visionnage humain intégral,
n'est revendiqué. Modèle, textes envoyés, médias, durées, niveaux et décodages sont
vérifiés ; prononciation et appréciation du jeu restent à écouter par le propriétaire.
La prochaine action éditoriale est cette écoute, avant de poursuivre au-delà de la borne.
Aucun commit ou push effectué.
