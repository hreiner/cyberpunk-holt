# Animation perceptible dans les seize cases

Révision 03, 5 novembre 2026. La demande du propriétaire porte sur une petite animation
visible dans chaque case et sur trois états successifs de la vision : éclairs autour de
Franklyn, fragmentation numérique avec coordonnées, puis choc dessiné. Les anciens
néons seuls ne suffisaient pas à cette intention.

## Contrat exécuté

Le moteur `anime/motion-comics/effects.js` conserve les effets précédents et ajoute quatre
opérations locales, déterministes et sans appel fournisseur :

| Type | Rendu et paramètres |
| --- | --- |
| `particles` | Motes lumineuses et petites traînées mobiles dans une région de décor ; `count`, `speed`, `strength`, `color`, `phase` |
| `lightSweep` | Reflet étroit se déplaçant sur une surface définie ; largeur en pixels source par `amplitude`, vitesse par `speed` |
| `sparks` | Arcs anguleux animés, à enveloppes douces et branches mobiles sur les côtés de la région ; `count`, `speed`, `startSeconds` |
| `digitalVision` | Tuiles de l'image source localement décalées et ajourées ; grille, réticule incomplet, chevrons et coordonnées partielles dans `mapRect` ; `count`, `amplitude`, `speed`, `startSeconds`, `revealSeconds` |

`rect` et `mapRect` sont normalisés sur la page entière. `mapRect` est contenu dans
`rect`. `protect` découpe des zones immobiles propres à un effet ; `protectedRegions`
restaure les pixels originaux après tous les effets. Les bulles, queues, visages,
inscriptions et écussons sont protégés sur le dessin retenu. Aucune déformation globale
de page, aucun détourage par couleur, aucune copie de personnage déplacée sans fond.

La fonction est `render(image, effects, ambientTime, enabled, protectedRegions, storyTime)`.
`storyTime` est le temps narratif **local de la page**, avec repli sur `ambientTime` pour
compatibilité. `startSeconds` ouvre un effet narratif. Pour `digitalVision`,
`revealSeconds` est le délai après cette ouverture avant l'apparition de la grille,
avec fondu de 0,5 s. Après 0,8 s supplémentaires, les caractères brouillés se stabilisent
partiellement en `LAT 3?.7??` et `LON -1??.4??`. Le temps narratif pilote cette progression ;
l'horloge ambiante anime les tuiles et le balayage. Une pause maintient donc la phase du
récit tout en laissant l'image vivre. Le bouton d'arrêt restaure le dessin, et la réduction
des mouvements reste contrôlée par le lecteur. La miniature de page demeure statique.

## Mise en scène par case

| Case | Petite animation et rôle |
| --- | --- |
| p01-c01 | Reflet magenta mobile sur la table, lumière de fenêtre, mèche Wendy conservée |
| p01-c02 | Glint cyan mobile dans la fenêtre à gauche de John et petites lueurs de fond |
| p01-c03 | Glint cyan parcourant les cheveux de Wendy et mèche locale ; visage immobile |
| p01-c04 | Reflet mobile du comptoir derrière Abigail et lueurs basses du décor |
| p02-c01 | Reflet magenta de table et enseigne cyan |
| p02-c02 | Lumière latérale magenta du décor, sans animer artificiellement les gestes de colère |
| p02-c03 | Balayage de l'enseigne cyan et glints près des bouteilles |
| p02-c04 | Reflet mobile de la table sous la décision difficile et petites lueurs sous la lampe |
| p03-c01 | Reflet cyan sur la table ; document et chiffres immobiles |
| p03-c02 | Éclairs cyan/blanc autour de la tête, après l'entrée de case et avant la vision |
| p03-c03 | Paysage fragmenté en tuiles numériques ; grille et coordonnées apparaissent au milieu de cette vision subjective |
| p03-c04 | Lumières du bar derrière Franklyn sous le choc ; aucune lueur ne masque sa réaction |
| p04-c01 | Reflet magenta de table et enseigne latérale, pendant qu'il récupère |
| p04-c02 | Motes lumineuses mobiles autour de l'enseigne cyan pendant l'explication ; reflet artificiel retiré après revue |
| p04-c03 | Reflet mobile dans l'embrasure et lueurs des bouteilles, sans déplacer Wendy |
| p04-c04 | Reflet mobile du sol vide et particules éclairées sous les lampes |

Les plans `effects-plans/page-01.json` à `page-04.json` indiquent `panelId` pour chaque
effet et `review.perPanelReview` pour les seize échantillons. Les nouvelles pages v2 ont
été inspectées : leurs empreintes et celles de `lettering-v2.json` sont fixées, leurs
bulles, visages, écussons et gestes des mains sont protégés. La page 1 conserve son
image retenue. La sélection initiale v3 comporte 31 effets et 118 protections ; la
correction ciblée finale conserve 30 effets et les mêmes 118 protections.
Les temps initiaux viennent des manifestes antérieurs ; l'intégrateur les recale sur
les nouvelles prises. Les lignes
`sampleOffsetSeconds` servent à conserver le bon décalage dans chaque case. La vision
doit tenir au moins six secondes : `revealSeconds: 2.5` place la grille vers son milieu,
et son échantillon à `sampleOffsetSeconds: 3.3` montre les coordonnées partiellement
stabilisées. Le déplacement de la carte ne progresse pas narrativement pendant une pause.

## Vérification

Deux tests unitaires nouveaux passent : progression narrative figée malgré l'ambiance
en pause ; rendu déterministe sans mutation, arrêt complet et application des protections.
`npx eslint anime/motion-comics/effects.js anime/motion-comics/tests/effects.test.cjs`
ne rapporte aucune erreur.

Une prévisualisation Canvas dans Edge hors sandbox a été inspectée :
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03-effects-engine-qa-v1/vision-preview.png`.
Elle montre les arcs dans deux phases et la vision avant/après coordonnées. La
fragmentation et les chiffres sont visibles. Une petite protection de la tête de la
silhouette anonyme créait un rectangle immobile recollé au milieu des tuiles : elle a
été supprimée du plan final, car cette silhouette ne porte pas de visage détaillé.
Sur le nouveau dessin de choc, le reflet a été déplacé vers les étagères à gauche pour
ne pas passer sur la main à la tempe. Aucune nouvelle génération n'était nécessaire
pour ces deux corrections de composition des effets.

Le montage a comparé les seize cases dans leur grande vue, à récit fixé et ambiances
espacées de 0,65 s, avec seuil de 400 pixels écran variant de plus de 15 niveaux. Les
pixels de la miniature et des autres cases ne comptent pas. La sélection v3 passe de
654 à 201 044 pixels par case ; les quatre planches de paires ont été inspectées.
Rapport : `art-masters/motion-comics/blue-purple/pages-01-04/revision-03/panel-qa-v1/report.json`.
Ce succès technique a été complété par la contre-revue : elle a détecté une colonne
cyan artificielle dans p04-c02 malgré son score positif. Les chiffres ne remplacent pas
la revue de composition.

Le contrôle complémentaire de protections a échantillonné les seize temps narratifs,
y compris la vision après apparition de la grille. Les 472 comparaisons de régions sont
exactes au master et stables entre phases ; déterminisme et arrêt réussis. Aucune capture
supplémentaire n'a été créée pour ce contrôle logique. Rapport :
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03/protected-effects-qa-v1/protected-effects-report.json`.

## Correction ciblée p04-c02

La contre-revue a identifié le `lightSweep` sur `[270, 700, 121, 45]` pixels source :
son bord supérieur dur formait une colonne dans le décor derrière John et Abigail,
sans support lumineux dessiné correspondant. `effects-plans/page-04-fix-v1.json`
conserve le plan initial et retire uniquement cet effet. Les quinze motes autour de
l'enseigne cyan restent. Aucun changement du moteur, des protections ou des quinze
autres cases n'a été fait après ce diagnostic. L'intégrateur a sélectionné cette correction
dans la page 4 révision 4 et l'ensemble v4. Le contrôle de la seule case touchée réussit :
1 073 pixels écran > 15, au-dessus du seuil 400 ; déterminisme et arrêt réussis. La paire
a été inspectée : colonne disparue, petites lueurs mobiles conservées autour du néon.
Rapport et paire :
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03/panel-fix-qa-v1/`.
Les preuves des quinze autres cases restent celles de v3 ; leurs paramètres sont identiques.
