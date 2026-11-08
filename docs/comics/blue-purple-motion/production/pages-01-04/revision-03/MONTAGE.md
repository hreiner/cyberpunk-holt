# Montage — révision 03

Reprise du 5 novembre 2026 après lecture de la version v2. Le montage conserve les
exports précédents et prépare la nouvelle sélection : mouvements perceptibles dans les
seize cases, vision fragmentée et minimap dans la vision, jeu plus tendu de Franklyn,
respirations resserrées. Les textes, prises, dessins et manifestes sont sélectionnés par
l'intégrateur ; ce document décrit le raccord du lecteur et les preuves du montage.

## Horloges du lecteur et de l'export

`reader.html` transmet à `motionEffects.render` deux temps distincts :

- troisième argument : phase ambiante, qui continue pendant une pause réelle ;
- sixième argument : temps narratif **local à la page** (`t - page.start`), figé en pause.

L'apparition des fragments/minimap dépend du temps narratif. Leur mouvement peut utiliser
la phase ambiante après leur déclenchement. Une pause ne fait donc pas apparaître une
minimap qui n'a pas encore été révélée. Le rendu MP4 appelle exactement le même lecteur
avec un temps imposé ; il n'a pas de seconde implémentation du rendu.

La miniature du lecteur reste statique. La minimap demandée appartient au dessin de la
case `p03-c03` ; ce sont deux éléments différents. Les yeux, bulles et autres régions
protégées restent sous la responsabilité des manifestes et du moteur d'effets.

L'API du lecteur expose `frameState` : page, case, temps local, rectangle réellement
visible en pixels et avancement de la transition. Ce relevé sert à vérifier le rendu
zoomé sans inclure les variations d'une autre case ou de la miniature.

## Contrôle de visibilité dans chaque case

Commande, après démarrage du lecteur sur le manifeste sélectionné :

```powershell
node anime/motion-comics/check-panel-animation.cjs 'URL_DU_LECTEUR' art-masters/motion-comics/blue-purple/pages-01-04/revision-03/panel-qa-v1 --stills
```

Le contrôle parcourt toutes les pages et toutes les cases. Pour chacune, il conserve
caméra et temps narratif identiques et compare deux phases ambiantes séparées par
0,65 seconde. Il compte les pixels dont au moins une composante change de plus de
15 niveaux, uniquement dans la case agrandie. Il vérifie aussi que le rendu est
déterministe et qu'arrêter les effets donne une image stable.

Les réglages peuvent venir de `review.perPanelReview` dans chaque manifeste :

```json
{
  "panelId": "p03-c03",
  "sampleTime": 8.5,
  "deltaSeconds": 0.65,
  "minimumChangedPixels": 250
}
```

`sampleTime` est local à la page et doit être après la transition vers la case, avant
la case suivante. L'exemple est un format, pas un temps sélectionné : le plan d'effets
détermine le vrai temps après révélation de la minimap. Sans réglage, le contrôle prend
45 % de la tenue et exige 250 pixels. Le rapport conserve le seuil, la surface visible,
la proportion modifiée et l'écart moyen ; un compteur ne remplace pas une revue visuelle.
Le résultat attendu pour ce lot est **16 cases vérifiées et 16 réussies**.

Baseline v2 réellement mesurée :
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03/panel-baseline-v2b/report.json`.
Quinze cases dépassent le seuil, avec 1 061 à 17 718 pixels modifiés ; `p01-c02`
reste à zéro. Cela identifie un manque réel et ne signifie pas que les quinze autres
animations satisfont artistiquement la nouvelle demande. Le premier relevé de
préparation (`panel-baseline-v2/`) avait aussi une différence de déterminisme sur le
premier relevé Canvas. Trois lectures de préchauffage avant mesure stabilisent le
chemin de lecture des pixels ; la seconde baseline est déterministe dans les seize
cases. Les deux rapports restent conservés.

`--stills` conserve les deux phases de chaque case dans des PNG appariés, à la résolution
du cadre visible. Les deux images gardent exactement le même instant narratif et le même
cadrage ; seul le temps d'ambiance diffère. Le rapport relie chaque paire à sa case et
ses temps. Quatre planches `page-01-animation-pairs.png` à
`page-04-animation-pairs.png` présentent ces preuves en quatre lignes et deux colonnes
par page. Le relecteur peut ainsi juger formes, intensités et déplacements dans les seize
cases, puis ouvrir une paire en pleine résolution si la réduction masque le mouvement.

Le même passage ajoute quatre vues décisives : colère de Franklyn, choc de Franklyn,
vision fragmentée avant minimap et vision avec minimap. Cette série visuelle est réservée
à la version finale stabilisée ; elle n'est pas répétée à chaque itération. Une revue
des cadres retenus reste nécessaire pour juger l'expression et la composition de la vision.

## Pause, navigation et synchronisation

```powershell
node anime/motion-comics/check-sequence.cjs 'URL_DU_LECTEUR' art-masters/motion-comics/blue-purple/pages-01-04/revision-03/navigation-qa-v1
```

Le contrôle existant couvre pages/cases, changements de page automatiques, arrêt des voix
et de la musique en pause, mouvement ambiant au repos, bouton d'arrêt et réduction des
mouvements. Il observe désormais le sixième argument du moteur pendant une pause dans
la deuxième page : ce temps doit être local et immobile alors que la phase ambiante
avance. Cela attrape une confusion entre temps global, temps local et temps d'ambiance.

Précontrôle réellement exécuté sur le manifeste v2 et le lecteur modifié :
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03/clock-preflight-v1/report.json`.
Résultat : quatre pages, quinze prises, navigation et trois raccords automatiques réussis,
pause audio correcte, temps narratif local figé, ambiance mobile, arrêt et réduction des
mouvements respectés, aucune erreur de page. Ce précontrôle ne valide pas les nouveaux
dessins, voix, effets ni la chronologie v3.

## État de reprise

Prévisualisation v3 réellement contrôlée :
`anime/motion-comics/projects/blue-purple-pages01-04-v3.json`, quatre pages, 144,60 s,
quinze prises, 31 effets et 118 protections. Serveur de prévisualisation au port 50793,
session 34585 ; URL :
`http://127.0.0.1:50793/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-04-v3.json`.

Les preuves sont dans
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03/` :

- `navigation-qa-v1/report.json` : navigation, trois changements de page automatiques,
  pause des voix/musique, temps narratif local figé, phase ambiante mobile, arrêt et
  réduction des mouvements réussis ; aucune erreur de page.
- `panel-qa-v1/report.json` : **16/16 cases réussies**, de 654 à 201 044 pixels modifiés
  au-delà de 15 niveaux ; seuil sélectionné de 400 pixels. Déterminisme et arrêt réussis
  dans les seize cadres.
- `panel-qa-v1/pair-sheets-v2/` : quatre planches sélectionnées, quatre paires par page.
  Les 32 PNG originaux en pleine résolution restent dans `panel-qa-v1/`. Les premiers
  assemblages avec libellés accentués mal rendus sont conservés ; seuls les libellés des
  planches ont été corrigés et réassemblés depuis les PNG existants, sans nouvelle capture.
- `panel-qa-v1/franklyn-colere.png`, `franklyn-choc.png`, `vision-fragments.png` et
  `vision-minimap.png` : quatre vues décisives inspectées au montage. La colère et le
  choc sont visibles, les éclairs restent autour du visage, la vision présente les
  fragments puis une grille et des coordonnées incomplètes. Bulles et cadres restent
  entiers. `p02-c01` possède le mouvement le plus discret mesuré et doit être jugé
  visuellement sur la paire ; le compteur seul ne lui donne pas une approbation artistique.

La revue des protections contre le master appartient à l'animation ; le contrôle écran
ci-dessus ne prétend pas la remplacer. Aucun export long v3 n'est lancé avant le feu vert
de l'intégrateur après contre-revue des quatre planches et vues décisives. Les exports v2
restent conservés ; le serveur v2 au port 50587 est toujours actif à ce stade.

Après validation, la commande existante peut réutiliser le port 50587 et rediriger
l'ancienne URL du manifeste v2 vers le manifeste corrigé v4 :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-04-v4.json --port 50587 --alias blue-purple-pages01-04-v2.json
```

Arrêter auparavant uniquement le serveur v2 ciblé. Le redirigé est chargé avec son URL
finale, ce qui conserve la résolution correcte de ses chemins médias.

## Correction ciblée après contre-revue

Le relecteur a identifié une bande cyan verticale au bord dur dans `p04-c02`, issue
d'un `lightSweep` sans support graphique. La correction retire cet effet seulement ;
les quinze particules du néon restent présentes. Le moteur d'effets est gelé.
L'intégrateur sélectionne `blue-purple-page04-v4.json` et l'ensemble
`blue-purple-pages01-04-v4.json` : 144,60 s, trente effets, 118 protections, quinze voix.
Les trois autres pages sont strictement celles contrôlées en v3.

Contrôle exécuté seulement sur la case affectée :

```powershell
node anime/motion-comics/check-panel-animation.cjs 'URL_V4' art-masters/motion-comics/blue-purple/pages-01-04/revision-03/panel-fix-qa-v1 --panel p04-c02 --stills
```

`panel-fix-qa-v1/report.json` confirme 1 073 pixels modifiés au-delà de quinze niveaux
pour un seuil de 400, avec déterminisme et arrêt réussis. La paire et sa planche
`page-04-animation-pairs.png` montrent la disparition de la bande et le maintien des
particules. La qualité a inspecté les deux phases en pleine résolution et levé sa réserve.
Les preuves des quinze autres cases restent applicables ; elles ne sont pas recapturées.

Le prévisualiseur v3 (session 34585) est arrêté. Le prévisualiseur v4 est actif au port
64954, session 88559. Le serveur v2 au port 50587 est conservé jusqu'au feu vert de
l'intégrateur. Les cinq dossiers d'export `render-r3-v1/` sont vérifiés absents ; aucun
export long de cette révision n'est encore lancé à ce stade.

## Exports autorisés et serveur de livraison

Après levée de la réserve par la qualité et feu vert explicite de l'intégrateur, les
cinq exports sont lancés dans `render-r3-v1/` des pages 01–04 et de `pages-01-04/`.
Deux navigateurs au maximum : séquence complète en parallèle avec les quatre pages
rendues successivement. Les sources sont figées ; aucune génération fournisseur.

Le serveur v2 (session 70652) est arrêté et remplacé par le serveur final v4 au port
**50587**, session **71463**. Le prévisualiseur v4 au port 64954 est ensuite arrêté.
L'ancienne URL du manifeste v2 répond bien **HTTP 307** avec destination
`/anime/motion-comics/projects/blue-purple-pages01-04-v4.json` ; les fichiers v2 sur
disque restent inchangés.

Le contrôle complet de navigation est exécuté par cette ancienne URL, comme un
rechargement du propriétaire. Rapport :
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03/navigation-final-v1/report.json`.
Quatre pages, 144,60 s et quinze voix ; navigation, changements de page, pauses audio
et récit local, ambiance indépendante, arrêt et réduction des mouvements réussis,
aucune erreur de page. Les exports et leurs snapshots restent à vérifier après rendu.

## Résultat des cinq exports

Tous les exports autorisés sont terminés et décodés intégralement par FFmpeg. Chaque
dossier `render-r3-v1/` contient le MP4, les frames, l'overview, le snapshot des manifestes
et médias, les métadonnées et le rapport. Aucun ancien export n'est remplacé.

| Sortie sous `art-masters/motion-comics/blue-purple/` | Durée nominale | Frames à 24 i/s | Prises |
| --- | --- | --- | --- |
| `page-01/render-r3-v1/` | 34,40 s | 826 | 4 |
| `page-02/render-r3-v1/` | 43,40 s | 1 042 | 5 |
| `page-03/render-r3-v1/` | 31,40 s | 754 | 2 |
| `page-04/render-r3-v1/` | 35,40 s | 850 | 4 |
| `pages-01-04/render-r3-v1/` | **144,60 s** | **3 471** | **15** |

Le complet fait **19 507 198 octets**, H.264/YUV420p 1280 × 720 à 24 i/s avec AAC.
Il comprend le fond continu HOLT et les quinze prises sélectionnées ; les sorties de
page conservent leurs prises sans fond ajouté. Trente effets et 118 protections sont
présents dans la sélection d'ensemble.

Synthèse vérifiée :
`art-masters/motion-comics/blue-purple/pages-01-04/export-check-r3-v1.json`.
Les cinq rapports sont `completed` et `decoded: true`. Les cinq snapshots sont relus
par le validateur et retrouvent leur durée nominale ; toutes les empreintes des sources,
des médias et du moteur correspondent encore aux fichiers sélectionnés. La synthèse
conserve aussi le SHA-256 de chaque MP4. Empreinte du complet :
`0c715a861eead0829b53ceb54aa0da3742926af65589a6201f62285e776c5293`.

Le lecteur final au port 50587, session 71463, reste actif. L'ancienne URL v2 redirige
vers la sélection finale v4. Les deux processus d'export sont terminés. Le montage ne
revendique aucune écoute humaine ; l'évaluation expressive des voix reste distincte
du décodage et des contrôles de synchronisation. Résultat et preuves transmis à
l'intégrateur et à la qualité pour la livraison.
