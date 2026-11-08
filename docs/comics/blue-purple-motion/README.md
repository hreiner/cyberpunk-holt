# Blue Purple — pilote de motion comics

Quatre premières pages reprises et livrées le 5 novembre 2026 :
[livraison, lecteur et MP4](production/pages-01-04/revision-03/DELIVERY.md),
[première livraison conservée](production/pages-01-04/DELIVERY.md),
[suivi et fichiers du lot](production/pages-01-04/PROGRESS.md),
[storyboard](production/pages-01-04/STORYBOARD.md),
[revue](production/pages-01-04/REVIEW.md).
Les sections ci-dessous conservent les preuves datées du pilote.

Première page du deuxième scénario : quatre cases, bulles VF, voix EN existantes.
Direction anime cyberpunk : contours anguleux, aplats graphiques, cyan/magenta/jaune.

- [Brief narratif et texte exact](PAGE-01-BRIEF.md)
- [Prompt original](PAGE-01-PROMPT.txt) et [correction de continuité](PAGE-01-EDIT.txt)
- [Workflow de production repris et adapté de Cthulhu](../../anime/MOTION-COMICS-WORKFLOW.md)
- [Socle technique pour les prochaines scènes](../../anime/MOTION-COMICS-TECHNICAL.md)
- [Audit des agents et méthodes Cthulhu](../../anime/CTHULHU-METHOD-AUDIT.md)

Le manifeste versionné est `anime/motion-comics/projects/blue-purple-page01.json` :
rectangles de cases, textes, fichiers vocaux et durées. Les médias lourds restent sous
`art-masters/motion-comics/blue-purple/page-01/` et peuvent manquer sur un nouveau checkout.
Master retenu : `page-v2.png` ; quatre MP3 copiés des prises existantes, sans nouvelle
production ElevenLabs. Chaque export est conservé dans un nouveau dossier.

La page v1 a été relue : distribution correcte, texte français exact et queues correctement
attribuées. Une édition v2 corrige l'enfant en tenue civile et retire le document avant sa
révélation ; image inspectée, texte et quatre cases préservés. Ce pilote est une page raster
avec lettrage généré ; la production ultérieure reprend la méthode Cthulhu bandes séparées
sans texte, puis calque de bulles éditable. Aucun ancien comics n'est remplacé.

Le lecteur et l'export partagent le calcul temporel ; miniature de page persistante, vue de
la case sans couper les bulles, entrée/sortie en page complète, navigation manuelle possible.
Les contrôles techniques ne remplacent pas l'écoute de l'interprétation ni une revue finale
de rythme avec le propriétaire. L'album entier et la suite du Blue Purple restent à produire.

## Preuve du pilote

Le 4 novembre 2026 : sortie retenue `render-v3/motion-comic.mp4`, page-v2 et manifest-v2
locaux ; 27,50 s de conteneur pour une chronologie de 27,48 s, H.264 1280 × 720 à
24 i/s et audio AAC mono. 660 images rendues avec la même fonction de caméra que le
lecteur. Quatre prises existantes ; aucun appel audio payant supplémentaire. Le lecteur
a été contrôlé en vue page et en case 3, avec navigation, pause/reprise et pages voisines
masquées pendant le zoom. Les bulles sont restées entières dans la vue testée. Pas d'écoute
humaine revendiquée. Le serveur local accepte uniquement le lecteur, le manifeste et ses
médias autorisés ; `.env` et `.git/config` renvoient 403. `npm run workflow:check` passe.

Lecteur servi pendant la session sur le port 8879 ; pour le relancer utiliser le manifeste
versionné et la commande `--serve` du workflow. L'export est autonome, contrairement au
lecteur qui demande le serveur local. Les limites de ce premier essai sont le lettrage
raster et les dessins fixes ; la dimension vidéo tient au parcours de page synchronisé.

## Référence du socle avec ambiance animée

La revue suivante a retenu le principe des néons, pluie et mèches mobiles au repos.
Le rendu `render-v5-effects/motion-comic.mp4` et le comparatif
`effects-v4-demo/avant-apres.mp4` conservent cet essai, avec `manifest-v4.json` local.
L'exemple versionnable `anime/motion-comics/projects/blue-purple-page01.json` est désormais
en révision 5, format 1 : mêmes quatre cases et prises, régions sensibles déclarées et
paramètres de QA transportables. Les anciens manifestes ne sont pas écrasés.

Le lecteur de référence se relance depuis ce manifeste source ; ne pas figer un port de
session comme point d'entrée permanent. Les futures pages utilisent le gabarit et la
commande `init` du guide technique, avec leurs propres cadrages et zones d'effets.

Export de référence du socle : `render-v7-socle/motion-comic.mp4`, 27,50 s, H.264
1280 × 720 à 24 i/s et AAC mono. Manifeste avec copies des médias et rapport d'empreintes
dans ce dossier ; contrôles et limites détaillés dans le guide technique.

## Essai vocal expressif — 5 novembre 2026

Quatre nouvelles prises v3 avec émotions, soupirs et souffle :
[direction, textes annotés et preuves](../../anime/MOTION-COMICS-VOICE-DIRECTION.md).
Manifeste candidat `anime/motion-comics/projects/blue-purple-page01-emotion-v1.json`,
chronologie de 42,20 s et export `render-v8-emotion/motion-comic.mp4`. Comparatif dans
`voices-emotion-v1/avant-apres.mp3`, ancienne puis nouvelle prise pour chaque réplique.
Voix et textes français conservés ; anciennes prises intactes. Le 5 novembre 2026,
le propriétaire juge cette version significativement meilleure et retient sa direction
expressive comme référence pour les futures prises de motion comics.

Un [comparatif v3/v4](../../anime/MOTION-COMICS-VOICE-DIRECTION.md#comparatif-eleven-v3--v4--5-novembre-2026)
est ensuite produit à texte, voix et réglages identiques. Fichiers audio et vidéo dans
`comparison-v3-v4-v3/`, quatre paires v3 puis v4. Après écoute, le propriétaire juge v4
bien meilleur et le retient comme modèle pour la suite.

## Version courante : voix v4

Manifeste retenu : `anime/motion-comics/projects/blue-purple-page01-v4-v1.json`, révision 7.
Les quatre prises v4 existantes sont réutilisées ; chronologie recalée à 38,60 s. Le lecteur
se relance depuis ce manifeste. Les nouvelles générations du studio utilisent Eleven v4
standard par défaut, avec la même direction de jeu expressive ; la décision et les
réglages sont dans le guide vocal. Aucun nouvel appel payant pour cette adoption.
Export courant : `render-v9-v4/motion-comic.mp4`, avec quatre voix recalées ; lecture Edge
et décodage complet FFmpeg vérifiés. Les anciens exports restent conservés.
