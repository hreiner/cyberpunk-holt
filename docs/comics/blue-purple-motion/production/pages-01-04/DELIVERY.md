# Livraison — HOLT, Blue Purple, pages 1 à 4

Livraison initiale conservée. La [reprise 03 livrée](revision-03/DELIVERY.md) intègre
les retours du propriétaire : respiration, colère de Franklyn, animation par case et vision.

5 novembre 2026. État : quatre pages, lecteur et exports v2 livrés et contrôlés.
Le lot adapte le début du deuxième scénario de campagne, jusqu'au premier regard sur
le bar vidé. La confrontation suivante reste hors de ces quatre pages.

## Sélection

| Page | Image locale | Manifeste sous `anime/motion-comics/projects/` | Durée |
| --- | --- | --- | --- |
| 1 | `page-01/page-v2.png` conservée | `blue-purple-page01-v4-v1.json`, révision 7 | 38,60 s |
| 2 | `page-02/page-v1.png` | `blue-purple-page02-v2.json`, révision 2 | 38,72 s |
| 3 | `page-03/page-v1.png` | `blue-purple-page03-v2.json`, révision 2 | 26,40 s |
| 4 | `page-04/page-v1.png` | `blue-purple-page04-v2.json`, révision 2 | 33,40 s |

Les images ci-dessus sont relatives à `art-masters/motion-comics/blue-purple/`.
Manifeste d'ensemble : `anime/motion-comics/projects/blue-purple-pages01-04-v2.json`.
Chronologie complète : **137,12 s**, 16 cases, 15 prises EN, 27 effets locaux et 90
zones protégées. Les bulles sont françaises ; le fond HOLT `music-pressure.mp3` reste
continu entre pages, baissé sous les voix avec fondus début/fin.

Lecteur actif pendant cette session :
[ouvrir les quatre pages](http://127.0.0.1:50587/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-04-v2.json).
Cette URL dépend du serveur local. Pour le redémarrer depuis la racine du dépôt :

```powershell
node anime/motion-comics/cli.cjs check anime/motion-comics/projects/blue-purple-pages01-04-v2.json
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-04-v2.json
```

Utiliser alors l'URL imprimée. Vue page, navigation pages/cases, progression globale,
lecture continue, pause/reprise, ambiance animée en pause et bouton d'arrêt sont disponibles.
La réduction des mouvements désactive les effets à l'ouverture.

## Sources et sauvegarde

Chaque nouveau dossier `page-02/` à `page-04/` conserve :

- `band-01-v1.png` à `band-03-v1.png`, neuf bandes originales sans lettres au total ;
- `page-raw-v1.png`, dessin complet sous les bulles ;
- `lettering-v1.svg` et `lettering-v1.json`, bulles et textes français éditables ;
- `page-source-v1.svg`, source de page assemblée autonome, et `page-v1.png` final ;
- `operations-v1.json`, prompt, références effectives, sortie et sélection de chaque appel.

Les neuf prompts, [bible](BIBLE.md), [storyboard](STORYBOARD.md), contrats,
[direction audio](AUDIO.md) et [plans d'effets](EFFECTS.md) restent dans ce lot documentaire.
`prompts/assemble.mjs` assemble/lettre une page en refusant d'écraser une sortie.
`prepare-manifests.cjs` conserve la recette des manifestes initiaux ; `select-v2.cjs`
produit la révision finale à titres narratifs sans écraser les v1.

Les quatre prises de page 1 sont réutilisées. Les onze nouvelles prises v4, leurs
journaux et la conduite annotée sont conservés dans le dossier commun
`art-masters/motion-comics/blue-purple/pages-01-04/voices-v4-v1/`.
Mapping et mesures : `voices-v4-v1-measurements.json` dans le parent, avec préécoute
`voices-v4-v1-audition.mp3`. Plafond global : 1 800 caractères ; soumis : **1 044**,
tags compris, une tentative par ligne, zéro échec/reprise. Neuf appels ImageGen,
aucune reprise. Coûts monétaires et identifiants fournisseur non exposés : inconnus.

Le dossier `art-masters/` est ignoré par Git et doit accompagner les sauvegardes.
Les anciens essais, manifestes et médias sont conservés ; aucun commit/push de ce lot.

## Exports et preuves

MP4 complet :
[motion-comic.mp4](../../../../../art-masters/motion-comics/blue-purple/pages-01-04/render-v2/motion-comic.mp4),
17 887 634 octets, H.264 High/YUV420p 1280 × 720, 24 i/s, AAC mono 44,1 kHz.
Chronologie 137,12 s ; conteneur 137,13 s ; 3 291 frames. Décodage intégral réussi.

Exports de livraison terminés sous `render-v2/` dans les dossiers `page-02/`, `page-03/`,
`page-04/` et `pages-01-04/`. La page 1 conserve également son export approuvé
`page-01/render-v9-v4/motion-comic.mp4`. Le MP4 complet est autonome sans serveur.
Les snapshots emportent les manifestes et médias sélectionnés pour relecture locale.
Les quatre snapshots sont revalidés et les empreintes des sources et du moteur
correspondent aux fichiers actuels ; synthèse `pages-01-04/export-check-v2.json`.
Les trois exports de nouvelles pages ont respectivement 930, 634 et 802 frames.
Mesure du mix AAC final : moyenne −25,8 dB, crête −1,0 dB, décodage complet sans erreur,
preuve `pages-01-04/mix-check-v2.json`. Cette mesure ne vaut pas écoute.

Pour reproduire le montage dans un **nouveau** dossier :

```powershell
node anime/motion-comics/render.cjs anime/motion-comics/projects/blue-purple-pages01-04-v2.json art-masters/motion-comics/blue-purple/pages-01-04/render-v3 --fps 24
```

Contrôles déjà réussis : `npm run verify` (typecheck, lint, 788 tests, build), onze tests
du socle motion comics, cinq tests simulés du générateur de prises, validation des
manifestes, décodage PCM de toutes les nouvelles voix, contrôles déterministes et en
pause réelle des trois pages nouvelles. Les protections restent identiques au master.
Le lecteur sélectionné a passé navigation et trois raccords automatiques, pause
voix/fond, arrêt d'effets et réduction des mouvements sans erreur navigateur.
Les contrôles documentaires `npm run workflow:check` sont également verts.

## Revue et reprise

La [revue détaillée](REVIEW.md) distingue sélection technique, contre-revue d'agent
et approbation humaine. Réserves visuelles mineures conservées : ordre apparent de
Wendy/John page 2 et chiffres suggérés par traits abstraits page 3. Elles ne bloquent
ni compréhension ni utilisation. Les titres de case de fabrication des premiers
manifestes ont été remplacés par des titres narratifs dans les révisions 2 ; leurs
exports historiques ou interrompus restent identifiés séparément.

Aucune écoute humaine des onze nouvelles voix ni du nouveau mix n'est revendiquée.
Leur interprétation et leur prononciation restent à juger à l'écoute, malgré un
décodage et des niveaux corrects. L'approbation du propriétaire sur page 1/v4 ne vaut
pas approbation humaine des nouvelles pages.

Prochaine action : lecture/écoute du propriétaire, puis poursuite éventuelle après
le bar vidé. Une éventuelle correction crée une
nouvelle révision et ne rouvre que les contrôles affectés ; une révision vocale garde
le dossier commun et le plafond cumulé, sans remise à zéro des tentatives.
