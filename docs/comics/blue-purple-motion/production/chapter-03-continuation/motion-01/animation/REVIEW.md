# Préparation animation — pages 9 à 21

## État

Plan et contrôle intégré final terminés le 7 novembre 2026 depuis les treize PNG de la sélection statique
révision05 validée. Les treize pages ont été ouvertes individuellement à leur pleine
définition de lecture, après la planche contact. Leurs empreintes sont enregistrées
dans `ANIMATION-PLAN.json`. Aucune image source modifiée, aucune génération soumise.

42 images : 34 mouvements locaux de matière/lumière et huit tenues
volontaires. Les temps finaux suivent la voix mesurée et `motion-01/TIMING.json`.
Les annotations par case sont dans `panels[].review`, avec les régions protégées.
Le contrôle final ci-dessous concerne le lecteur Canvas réellement assemblé ; il ne
certifie pas le film encodé ni une écoute humaine de son mix.

## Méthode reprise et adaptations

Les manifestes réels `blue-purple-page05-v5.json` et `blue-purple-page08-v4.json`,
le moteur `effects.js`/`layers.js` et le prototype corrigé `motion-design-v2` ont été
inspectés. Les enseignements repris sont : anatomie rigide, matière en zone libre,
révélation au temps narratif, lettre composée après les effets, aucun morphing de
doigts ni déplacement de véhicule par défaut. Les durées muettes du prototype ne
sont pas transférées aux voix.

- Pages9–12 : pluie extérieure et reflets du bâtiment ; borne intégrée et halo de
  l'implant sur leurs seuls emplacements déjà dessinés. Les gestes Grover/enfant
  restent fixes. La conversation10-3 et l'objection11-3a ont une tenue délibérée.
- Pages13–16 : plan déjà dessiné, lumière des appareils réellement présents,
  compartiment de réparation sans étincelle de panne inventée. La vision16-1 pulse
  sur sa carte interne et ses fragments de bord. Le type `digitalVision` courant
  ajouterait ses anciennes coordonnées LAT/LON : il est donc écarté ici.
- Page17 : vapeur existante en fond, un seul accent métallique. L'image17-2
  contient trois petites bandes dessinées : avant/tir, impact, réaction. L'essai
  intégré de trois cadrages rectangulaires a été écarté après revue : les gouttières
  sont diagonales et la bande suivante apparaissait en bas de l'impact. L'intégrateur
  conserve donc l'image composée complète, comme au comics approuvé, avec un accent
  sonore/visuel unique au début de sa tenue. La fumée est limitée à la bande centrale.
- Pages18–20 : le résultat18-after est un dessin distinct déjà présent. La tenue
  avant, puis le raccord franc vers le résultat assument une ellipse du comics,
  avec un seul impact. La poussée20-2 et le splash20-3 suivent deux cases différentes ;
  aucune nouvelle violence ni trajectoire corporelle n'est fabriquée. Bras, jambes,
  visage et mains de John restent ceux corrigés et validés.
- Page21 : la porte est fermée dans21-1, puis le groupe est dedans21-2. Son ouverture
  appartient au raccord. Poussière discrète dans l'espace vide, aucun mobilier ajouté.
  Fin tenue sur le groupe ; Grover conserve la protection de l'enfant.

## Passage à l'intégration

`ANCHORS.json` est partagé avec l'agent son et l'intégrateur. L'intégrateur résout
chaque ancre depuis sa chronologie vocale mesurée, puis transpose les rectangles
locaux avec la géométrie réelle de la page. Les bulles et queues révision05 sont
composées en dernier. Les champs de préparation (`startAnchor`, `durationSeconds`,
`offsetSeconds`) ne sont pas des propriétés du moteur et doivent être résolus avant
validation du manifeste livré.

La revue vérifie les vrais rendus : parties rigides, pause/seek/OFF,
événements juste avant/à/après, qualité des matières, lisibilité des lettres et
comparaison des deux phases à récit figé pour les effets ambiants. Des images du H264
restent à ouvrir par la livraison après encodage du film.

## Premier contrôle intégré conservé

`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/animation/integrated-v1/`
contient le contrôle des treize pages et des 44 segments de l'essai avec trois cadrages17.
Les masters OFF sont exacts, les régions rigides inchangées, les lettres opaques stables,
les seeks indépendants de l'ordre. Six effets narratifs finis sont contrôlés avant,
pendant et après, avec pause exacte.

Deux comparaisons de reflets prises à des phases ordinaires similaires n'ont produit
aucun pixel de différence supérieure à10 (09-2 et19-2). L'échec est conservé. Le dossier
`integrated-v1-supplement/` compare leurs maxima et minima mathématiques à récit figé,
avec le même seuil : respectivement6375 et5478 pixels changés, différences maximales116
et61. Les deux paires ont été ouvertes : reflet intégré à l'écran, lueur faible sur le
montant de l'ascenseur, sans altération de la main ni des personnages. Le contrôle final
échantillonnera directement les extrêmes explicites pour les pulsations.

Les paires des34 cases comportant des effets ont été ouvertes individuellement, ainsi
que les deux suppléments de reflets. Les matériaux restent discrets et locaux ; aucune
déformation de corps, dérive de silhouette, queue ou lettre observée. Le seul défaut
de cadrage identifié à ce stade concerne l'essai17 ci-dessus, corrigé par arbitrage de
l'intégrateur.

## Contrôle final après reconstruction — intégré v3

Lecteur testé :
`http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v6.json`.
Le contrôle porte sur ses treize nouvelles pages9–21,42 segments, et six effets
narratifs finis. La séquence complète inclut les pages1–8 ; elles ne sont pas
recertifiées par ce contrôle ciblé. Le lot neuf dure219,402222s, le complet446,002222s.

Preuves finales :
`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/animation/integrated-v3/`.
`report.json` SHA256 :
`5dfccfaffa4ca39ecf5e9ddc3515aca6aea0068ef8f3fcbb5d797c15c13030de`.

- 13 masters OFF strictement identiques aux PNG validés ; sources conservées par hash.
- 42 comparaisons de phases réussies : tous les mouvements locaux ont des pixels
  effectivement changés ; les huit tenues volontaires n'exigent pas d'effet artificiel.
- Régions rigides : aucun pixel modifié par les effets ni entre les deux phases.
- Lettrage opaque : aucun pixel instable. La chaîne réelle emploie les plaques exactes
  tirées des masters approuvés, composées après les effets ; les SVG restent éditables.
- Déterminisme et seeks en ordre inversé réussis ; six événements finis présents pendant
  leur intervalle, absents avant/après et figés lorsque seul le temps ambiant change.
- Aucun défaut JavaScript navigateur relevé.

Les treize contacts `contacts/page-NN-animation.png` ont été ouverts personnellement
après ce dernier contrôle, avec les42 paires. La page17 conserve correctement ses trois
bandes intégrées, sans cadrage rectangulaire qui montre la bande voisine. Les effets
restent localisés, l'anatomie et les contacts restent fixes, les lettres lisibles.
`contacts/INDEX.json` relie chaque contact aux hashes des preuves sources et du rapport.
L'orchestrateur reçoit ces treize contacts pour sa propre revue globale.

L'essai `integrated-v2` est conservé comme échec d'accès au lecteur avant sa readiness :
le backing nouvellement ajouté n'était pas encore dans l'allowlist du serveur. Aucun
contrôle d'image n'y a débuté. Le serveur relancé avec le mix autorisé a permis v3.

Aucun contrôle H264, aucune écoute humaine et aucune validation artistique de nouveau
propriétaire ne sont revendiqués ici. Les actions corporelles18 et20 gardent leurs
ellipses dessinées approuvées ; ce lot ajoute du mouvement local et du montage comics,
sans fabriquer de pose physique intermédiaire.
