# Animation — pages 05 à 08

5 novembre 2026. Capacités, placements sur les quatre pages et contrôles locaux produits.
Les exports finaux et contrôles de séquence relèvent du montage. Les pages 1–4 et leurs manifestes
ne sont pas modifiés. L'animation ne remplace pas le contrôle des mains et du dessin.

## Capacités ajoutées au socle

Trois types additifs dans `anime/motion-comics/core.js` et `effects.js` :

| Type | Mouvement | Préparation réelle du dessin |
| --- | --- | --- |
| `smoke` | Panaches doux, ascension ou déplacement latéral, élargissement ; fondu aux extrémités du cycle | Source au centre bas pour `up`, au centre du bord droit pour `left` ou gauche pour `right` : évent/échappement visible |
| `debris` | Éclats triangulaires, rotation, accélération vers le bas et fondu | Vitre brisée ou poussière de décor clairement identifiée ; exclure les corps et les mains |
| `ripple` | Ondes elliptiques concentriques en expansion, atténuation progressive | Surface liquide dessinée dans la perspective de la région : flaque ou verre, sans en inventer |

Paramètres : `rect` normalisé, `count` entier 1–80, `speed` 0–2, `strength` 0–0,7,
`color` en `#RRGGBB`, `startSeconds`, `panelId` et `protect`. `smoke.direction` accepte
`up`, `left`, `right` ; les ondes sont centrées dans leur rectangle. Les trois types
dessinent une superposition, sans copie ni
déformation du personnage. Les masques sont géométriques, jamais obtenus par suppression
du blanc. Un obstacle exige une protection adaptée ou une région mieux choisie.

Le récit local déclenche `startSeconds`. Avant cet instant, les nouveaux effets restent
absents, même si la phase ambiante avance. Après, leur mouvement peut continuer lorsque
le récit est en pause par défaut. `clock: "story"` utilise le temps depuis le début
narratif de l'effet : en pause, l'événement physique reste figé. `endSeconds` est une fin
exclusive, après `startSeconds` et dans la durée de la page. Avec ces deux champs,
`debris` suit une chute unique qui ne recommence pas. Le bouton d'arrêt et la réduction
des mouvements suivent le
contrat existant du lecteur : `enabled=false` restitue uniquement le master. L'export
utilise le même dessin aux temps imposés. Les boucles ne simulent pas une nouvelle action
canonique ; ce sont des éléments d'ambiance ou des accents du moment dessiné.

## Direction de mouvement

Contrats `CONTRACTS.json` version 1 : 14 cases. Les besoins transmis avant génération :
vitre et éclats isolables, évent de ruelle, flaque au parking, mèche de Wendy dégagée des
yeux et de la bouche si cadrée, voyant de tableau de bord et échappement de voiture.
Le plan varie pulsation fixe, pluie, chute d'éclats, vapeur, ondes, mèche et reflet local.
Aucun balayage lumineux mobile n'est nécessaire à ce découpage. La serrure ne produit pas
d'étincelles non établies par le récit. Le démarrage ne déforme pas le raster du conducteur.

| Case | Intention et mouvement prévu | Besoins et protections |
| --- | --- | --- |
| p05-c01 | Tube du comptoir : pulsation fixe douce | Tube réel, hors barman/Wendy/Franklyn ; mains et papier intacts |
| p05-c02 | Pluie sur vitre encore intacte | Région de vitre hors homme armé, Wendy et bulle |
| p05-c03 | Poussière : chute narrative unique bornée ; ambiance lente distincte | Sol près de batte ; batte immobile, corps et mains exclus |
| p05-c04 | Verre : chute narrative courte ; pluie de fond indépendante | Région droite dégagée ; enfant, soutien d'Abigail et bulle protégés |
| p06-c01 | Vapeur verticale de rue, poursuivant figé dans sa pose de fuite | Évent réel et panache hors silhouette/arme |
| p06-c02 | Mèche Wendy, micro-oscillation locale à bords fixes | Rectangle précis de cheveux ; yeux, bouche, mains, bulle restaurés |
| p06-c03 | Souffle d'aération près de sortie arrière | Évent visible, région sans silhouettes ; six personnes inchangées |
| p07-c01 | Ondes concentriques lentes | Flaque dessinée, sans masque sur les jambes |
| p07-c02 | Pulsation fixe du petit néon du poste | Source réelle ; aucun balayage ni clignotement irrégulier promis |
| p07-c03 | Pluie contre clôture et fond | Hors deux personnages, hors reflets métal principaux |
| p08-c01 | Reflet étroit local de serrure, borné ; pluie hors main si visible | Seule surface métallique ; tous doigts et outil intacts |
| p08-c02 | Modulation fixe du voyant de tableau de bord | Voyant réel, volant et deux mains protégés ; pas de vibration raster |
| p08-c03 | Échappement latéral lent | Pot réel ; visages, mains, portières et deux bulles protégés |
| p08-c04 | Onde de flaque narrative décroissante ; pluie ambiante indépendante | Eau au sol derrière roues ; voiture, feux fixes et silhouettes intacts |

Les régions ont été mesurées sur chaque image assemblée. Restaurer après les effets les
yeux, bouches, mains, écussons et bulles ; vérifier que les protections ne découpent pas
artificiellement la vapeur ou les mèches. Ne pas sauver une région mal cadrée en couvrant
une grande partie de la case de lumière ou de particules.

## Contrôles effectivement exécutés

- `npm --prefix anime/motion-comics test` : 19 tests réussis après ajout des types, bornes et halo doux.
- ESLint ciblé sur `core.js`, `effects.js`, `tests/effects.test.cjs` et
  `tests/project.test.cjs` : réussi.
- Les tests des trois types vérifient déclenchement par récit, variation à récit figé,
  déterminisme, arrêt, coordonnées finies, protections locales et restauration finale.
- Les tests de manifeste refusent compteur, vitesse et force excessifs, et déclenchement
  situé hors de la chronologie.
- Les événements physiques bornés sont testés avant début, pendant, exactement à la fin
  et après ; le dessin ne change pas à récit constant malgré une phase ambiante différente.

## Placements et contrôles des pages 5–8

Plans versionnés dans `effects-plans/page-05.json` à `page-08.json` ;
chaque plan porte l'empreinte SHA-256 du PNG lettré effectivement inspecté, les régions,
les protections et les offsets relatifs au début de tenue de la case. Montage convertit
ces offsets en temps narratifs absolus du manifeste candidat. Copies historiques sous
chaque master `page-XX/effects-plan-vN.json`.

La contre-revue a repéré deux défauts de placement page 5 : halo du tube rectangulaire
coupé par la tête restaurée, et large reflet rectangulaire sous la batte. Le tube a été
resserré sur sa source et utilise `softEdge: true`, option additive de halo elliptique
nulle aux bords, sans changement du calcul historique. Le reflet de sol a été retiré
entièrement, remplacé par de minuscules poussières neutres sur un sol libre. Le test
réel des événements a ensuite révélé que la chute de poussière était presque totalement
masquée (20 pixels) ; elle a été déplacée hors batte et chaussures, sans retirer de
protection. Le plan page 5 version 4 conserve ces corrections. Page 7, le néon fixe
utilise aussi le halo doux.

| Preuve sous `art-masters/motion-comics/blue-purple/pages-01-08/` | Résultat exécuté |
| --- | --- |
| `qa-animation-p05-v4/` | Plan p05 v3, 4/4 cases ; 549, 1 157, 600, 606 pixels >15 ; déterminisme et arrêt |
| `qa-animation-p05-c03-v5/` | Delta seul du plan p05 v4 : 578 pixels >15 ; autres cases inchangées |
| `qa-events-p05-v1/` | Verre c4 : 1 107 pixels altérés pendant, 0 avant/après ; pause et protections exactes |
| `qa-events-p05-c03-v2/` | Poussière c3 corrigée : 462 pixels altérés pendant, 0 avant/après ; pause et protections exactes |
| `qa-animation-p06-v1/` | Plan p06 v1, 3/3 cases ; 968, 7 311, 249 pixels >15 ; déterminisme et arrêt |
| `qa-animation-p07-v1/` | Plan p07 v2, 3/3 cases ; 344, 2 157, 724 pixels >15 ; déterminisme et arrêt |
| `qa-animation-p08-v1/` | Plan p08 v2 sur dessin lettré v2, 4/4 cases ; 1 313, 948, 275, 682 pixels >15 ; déterminisme et arrêt |
| `qa-events-p08-v1/` | Serrure 194, voyant 1 065, onde 1 719 pixels altérés pendant ; 0 avant/après, pause et protections exactes |
| `qa-protections-p05-v1/` à `qa-protections-p08-v1/` | Toutes les protections déclarées stables et identiques à la source, soit 23/11/24/30 zones |
| `qa-live-p05-v1/` à `qa-live-p08-v1/` | Récit figé, ambiance avance en pause, arrêt stable et reprise réelle ; respectivement 1 210, 1 395, 1 617, 1 185 pixels >15 |

Les paires 5–7 et le triptyque verre ont été inspectés par l'animation, l'intégrateur et
la qualité. La qualité a levé les deux défauts de halo/bande après correction et jugé
les trois cases des pages 6 et 7 favorables ; la vapeur horizontale p06-c03 reste la
plus discrète. La qualité a également vu et accepté la dernière chute de poussière c3
(462 pixels, petits fragments gris dans le sol libre), sans collision de masque.
L'animation a inspecté la planche page 8 et ses trois triptyques, sans nouveau défaut
visible. La qualité a ensuite ouvert la planche, les huit phases pleine taille et les
trois triptyques et rendu une contre-revue favorable : sources physiques cohérentes,
pas de rectangle lumineux, pas de collision des visages, mains ou bulles. Les paramètres
des quatre pages sont gelables pour les exports. Les premiers essais `qa-animation-p05-v1/` et `v2/` ont
échoué respectivement au lancement Edge sandbox et à l'accès au serveur resté dans
l'autre contexte ; `v3/` puis les corrections sont exécutés hors sandbox avec serveur
et Edge dans le même contexte Windows. Aucun de ces essais n'a changé de média.

Les configurations retenues sont p05 plan v4, p06 v1, p07 v2 et p08 v2. Page 8 référence
le PNG lettré `page-v2.png`, empreinte `b937283924f1cb4b2360435bbc9b550be33262a98a833bdb2046e2eff9235f9b`.
La première version lettrée, dont les queues se croisaient, n'est pas sélectionnée.
Le voyant est une légère modulation unique autour de son master déjà allumé ; il ne
simule pas un démarrage répétitif. Le reflet de serrure se limite à la couronne supérieure
et reste très fin. Le panache d'échappement c3 et la vapeur de ruelle p6c3 sont volontairement
discrets, ancrés sur leurs sources réelles. Le lot n'emploie aucun `lightSweep`.

Les tests unitaires utilisent un enregistreur Canvas ; les contrôles de navigateur
ci-dessus portent sur les vrais pixels. Les comptes ne certifient pas seuls la qualité
artistique. Restent les contrôles communs des séquences et les exports finaux, réalisés
par l'intégrateur et le montage sur les mêmes paramètres.
Les tables de capacités du guide technique et du répertoire d'effets sont actualisées.
