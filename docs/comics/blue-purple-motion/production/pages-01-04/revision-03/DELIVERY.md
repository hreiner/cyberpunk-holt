# Livraison — reprise 03 des quatre pages Blue Purple

5 novembre 2026. Reprise livrée ; cinq exports terminés et intégralement décodés.
Cette reprise applique le retour du propriétaire sur les respirations, la colère de
Franklyn et les animations. Elle conserve les versions précédentes.

## Résultat sélectionné

- Quinze prises anglaises Eleven v4 reprises sans tags automatiques d'inspiration,
  expiration, soupir ou déglutition. L'émotion et les changements d'intention restent dirigés.
- Franklyn explose face au départ sans Letitia, puis craque et accepte d'aider le groupe
  sans retrouver la paix. Dessins et trois répliques révisés ensemble.
- Une petite animation locale dans chacune des seize cases, contrôlée au zoom.
- Éclairs animés autour de Franklyn avant la vision, paysage fragmenté en tuiles,
  puis grille/réticule et coordonnées partielles après 2,5 s dans la case de vision.
- Franklyn franchement sous le choc juste après, encore secoué lorsqu'il reconnaît les chiffres.

La minimap est un souvenir subjectif de simulation, pas un GPS actuel de Night City.
Les chiffres restent incomplets, sans nouvelle destination canonique.
Les mouvements sont surtout ambiants ; les gestes émotionnels sont redessinés.

## Lecture et médias

[Ouvrir le lecteur final](http://127.0.0.1:50587/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-04-v4.json).
L'ancienne URL v2 redirige aussi vers cette sélection après rechargement.
Le serveur local est conservé actif ; pour le relancer :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-04-v4.json --port 50587 --alias blue-purple-pages01-04-v2.json
```

| Page | Manifeste dans `anime/motion-comics/projects/` | Image sous `art-masters/motion-comics/blue-purple/` | Durée |
| --- | --- | --- | --- |
| 1 | `blue-purple-page01-v4-r3.json`, révision 8 | `page-01/page-v2.png` conservée | 34,40 s |
| 2 | `blue-purple-page02-v3.json`, révision 3 | `page-02/page-v2.png` | 43,40 s |
| 3 | `blue-purple-page03-v3.json`, révision 3 | `page-03/page-v2.png` | 31,40 s |
| 4 | `blue-purple-page04-v4.json`, révision 4 | `page-04/page-v2.png` | 35,40 s |

Ensemble `blue-purple-pages01-04-v4.json`, révision 4 : **144,60 s**, 16 cases,
15 prises, 30 effets et 118 protections. Le temps de lecture des bulles et les tenues
émotionnelles sont conservés malgré les voix plus courtes. Fond HOLT continu et baissé
sous les dialogues, pause/reprise et réduction des mouvements disponibles.

MP4 complet : [motion-comic.mp4](../../../../../../art-masters/motion-comics/blue-purple/pages-01-04/render-r3-v1/motion-comic.mp4),
144,60 s, 3 471 images rendues, 19 507 198 octets, H.264 High/YUV420p 1280 × 720
à 24 i/s et AAC mono 44,1 kHz. Les cinq exports ont passé le décodage complet.

Exports de reprise : `render-r3-v1/motion-comic.mp4` dans chaque dossier `page-01/`
à `page-04/` et dans `pages-01-04/`. Chaque export dispose de son snapshot de manifestes
et médias, empreintes et rapport. Le MP4 complet se lit sans serveur.
Les cinq snapshots sont revalidés et les empreintes des sources, médias et moteur
correspondent aux fichiers actuels : `pages-01-04/export-check-r3-v1.json`.
Mix AAC mesuré sur tout le fichier : moyenne −26,5 dB, crête −1,7 dB, sans erreur
de décodage ; preuve `pages-01-04/revision-03/mix-check-r3-v1.json`.

## Page 1 et voix

Oui, la page 1 de la livraison précédente était déjà en v4 :
[audit fichier par fichier](PAGE01-V4-AUDIT.json), recoupé indépendamment, quatre
journaux `eleven_v4` et quatre copies exportées identiques aux sources. Ses nouvelles
prises servent à réduire les respirations, pas à corriger un mauvais modèle.

Nouvelles prises et mapping :
`art-masters/motion-comics/blue-purple/pages-01-04/audio-v3/measurements.json`,
préécoute `audio-v3/audition.mp3`, journaux dans `audio-v3/takes/`.
Quinze requêtes, une tentative chacune, zéro échec/reprise ; 1 372 caractères nouveaux,
**2 416/3 000** au compteur global avec les 1 044 historiques. Quatre éditions ImageGen,
sans reprise. Prix et identifiants fournisseur non exposés : inconnus.

## Sources, contrôles et limites

Contrats, prompts, conduite, outils et [revue détaillée](REVIEW.md) sont dans ce dossier.
Chaque nouvelle page conserve dessin brut, bandes, `page-source-v2.svg`,
`lettering-v2.svg` et JSON éditable, ainsi que son PNG final et journal d'opérations.
Grover p02-c03 est conservé pixel pour pixel par compositing.

Quatorze tests du socle, validations des manifestes, tests du jeu/typecheck/lint/build
et contrôle documentaire réussis. Navigation finale via l'ancienne URL testée :
voix, musique et récit figés en pause, ambiance indépendante, arrêt des effets,
réduction des mouvements et absence d'erreur navigateur.
Seize cases visuellement contre-revues avec phases A/B ; 472 comparaisons de protections
exactes au master. Un reflet cyan rectangulaire a été signalé puis retiré en p04-c02,
sans retouche des quinze autres cases ni nouvel appel fournisseur.
Trois images ont aussi été extraites du MP4 encodé final (colère 47,3 s, vision 96,65 s,
choc 101,4 s) et inspectées, sous `revision-03/mp4-final-stills-v1/` dans les masters.

Aucune écoute humaine des nouvelles prises ou du nouveau mix n'est revendiquée.
Les sources prononcées prévues, modèles, fichiers et décodages sont vérifiés ;
prononciation, dosage émotionnel et quantité de souffle restent à apprécier à l'écoute.
La revue favorable de fabrication ne remplace pas l'approbation humaine du propriétaire.

Sauvegarder aussi `art-masters/`, ignoré par Git. Aucun commit/push effectué.
Toute correction conserve les anciens fichiers, crée une révision et rouvre seulement
les contrôles affectés ; le compteur vocal reste cumulé et ne repart pas de zéro.
