# Production des cases P09 à P12

Mode : outil intégré `image_gen`, une génération par case ; `P11-C02` et `P11-C03` ont reçu
une retouche ciblée. Le prompt de production de chaque case reprend le `style_prompt` global
et le `prompt` de sa case dans `storyboard.json`, puis précise les raccords ci-dessous.
La première référence de **chaque** appel est
`art-masters/comics/holt-12-pages/references/CAST-ANCHOR.png` : rangée haute
Franklyn/Letitia/John, rangée basse Abigail/Zachary/Grover. Elle fixe le dessin 2D et les
identités, jamais la présence de Zachary dans ces scènes. Les références photo indiquées
servent aux traits ou aux lieux, jamais au rendu final. Chaque sortie acceptée est le PNG
`art-masters/comics/holt-12-pages/panels/{ID}.png`.

Les ajouts communs aux prompts sont : images autonomes, aucun texte, lettre, bulle, logo,
cadre de page, sang ou gore ; haut calme pour le lettrage ; personnages centraux ; costumes
de cadets bleu nuit ; Zachary mort et absent ; aucun rendu photographique ou 3D. John a les
cheveux argentés très courts et aucun implant. Letitia garde sa veste de cérémonie à revers,
sa cravate noire et ses galons argentés ; elle est blessée, consciente, sans plaie visible.
L'enfant a environ dix ans, peau foncée, locks courtes et sweat gris.

## P09-C01

**Prompt de scène :** Murano, environ 60 ans, barbe grise, bonnet rouge et veste camouflage,
tend une trousse à Grover qui soigne Letitia près du vieux camion. Franklyn découvre le
scorpion cousu sur la manche ; fusil bas, clés dans la cabine, feu de camp contre nuit bleu
profond. Plan 3:2.

**Références réelles :** ancre ; `docs/art/Reference_pictures/Chapter2/MuranoBadlandsCamps.png`
(visage de Murano) ; `docs/art/Reference_pictures/Chapter2/CampsBadlands.png` (camp).

## P09-C02

**Prompt de scène :** contrechamp immédiatement après le coup fatal de Franklyn, sans blessure
visible. Murano s'affaisse ; son fusil tombe sans avoir tiré. L'enfant observe depuis la cabine ;
les clés restent au contact et ne tombent pas. Nuit et personnages raccord à P09-C01. Plan 3:2.

**Références réelles :** ancre ; `panels/P09-C01.png` ; portrait de Murano ci-dessus ;
`public/assets/portraits/enfant.webp`.

## P10-C01

**Prompt de scène :** vieux camion quittant les Badlands pour les décharges sous Night City
bleu-violet. À l'arrière, Letitia respire difficilement sous une couverture, Grover et l'enfant
restent auprès d'elle. Horizon monumental et ciel sombre libre. Plan 3:2.

**Références réelles :** ancre ; `panels/P09-C01.png` (camion et tenues) ;
`docs/art/Reference_pictures/Chapter2/NightCityDecharge.png` (géographie) ; portrait de l'enfant.

## P10-C02

**Prompt de scène :** halte nocturne parmi les carcasses. Franklyn et John veillent ; Abigail
est isolée dans son deuil ; l'enfant réveille Grover à l'arrière du camion. Deux jeunes des
décharges guettent le vieux fusil encore inutilisé, sans éclair de tir. Plan 3:2.

**Références réelles :** ancre ; `panels/P10-C01.png` ; portrait de l'enfant.

## P11-C01

**Prompt de scène :** à l'aube, Franklyn remet le fusil au jeune guide, qui pointe la clinique
au fond de la rue. Letitia, consciente et fragile, est soutenue derrière eux ; John, Abigail,
Grover et l'enfant attendent. Aucun coup de feu. Plan 3:2.

**Références réelles :** ancre ; `panels/P10-C02.png` (fusil et groupe) ;
`docs/art/Reference_pictures/Chapter2/NightCityRueCharcudoc.png` (architecture).

## P11-C02

**Prompt de scène :** clinique sous lampe blanche ; charcudoc chauve en tablier sale, petit
port métallique à la tempe, jauge froidement Letitia consciente sur le lit. Franklyn et John
attendent au comptoir. Deux zones libres en haut pour ses répliques. Portrait 2:3.

**Références réelles :** ancre ; `docs/art/Reference_pictures/Chapter2/Charcudoc.png`
(charcudoc et clinique) ; `panels/P11-C01.png` (cadets et tenue de Letitia).

**Retouche :** sur la première image, remplacer uniquement les taches rougeâtres du tablier
et de la chemise par de la suie et de la graisse grises. Références de retouche : première image
générée et ancre. La version retouchée est celle enregistrée dans `panels/`.

## P11-C03

**Prompt de scène :** au seuil de la clinique, Franklyn lâche doucement la main de Letitia,
qui demeure couchée à l'intérieur. John, Grover, Abigail et l'enfant attendent dehors ; lumière
froide de clinique contre matin bleu, profondeur de la porte entr'ouverte. Portrait 2:3.

**Références réelles :** ancre ; `panels/P11-C02.png` ; portrait de l'enfant.

**Retouche :** un personnage erroné derrière John ressemblait au charcudoc. Remplacer ce seul
personnage par Grover adolescent, cheveux noirs en bataille et chemise bleu nuit avec cravate
noire, en conservant le cadrage et tous les autres personnages. Références de retouche :
première image générée et ancre. La version retouchée est celle enregistrée dans `panels/`.

## P12-C01

**Prompt de scène :** au Blue Purple, Franklyn, John, Grover, Abigail et l'enfant entourent une
table ronde ; deux chaises vides expriment l'absence de Letitia et Zachary. Bar étroit à plafond
bas, néons pratiques cyan-violet, bouteilles anonymes, aucune enseigne lisible. Smith et
l'inconnue ne sont pas encore présentes. Bandeau 2:1.

**Références réelles :** ancre ; `docs/art/Reference_pictures/Chapter2/BluePurpleInterieur.png`
(lieu uniquement) ; `panels/P11-C03.png` (groupe survivant).

## P12-C02

**Prompt de scène :** une inconnue à cheveux bleu nuit asymétriques, veste de cuir violette et
boucle rouge s'approche de la table sans invitation. Les quatre cadets la regardent, tendus ;
elle reste distincte de Smith, à demi dans l'ombre. Même bar que P12-C01. Bandeau 2:1.

**Références réelles :** ancre ; `panels/P12-C01.png` ;
`docs/art/Reference_pictures/Chapter2/BluePurpleRencontre.png` (identité de l'inconnue).

## P12-C03

**Prompt de scène :** Franklyn tend une main ouverte à travers la table, sans toucher le verre
de l'inconnue. Elle soutient son regard depuis l'ombre ; l'enfant observe au bord du cadre.
Aucune révélation de son identité. Deux zones sombres en haut pour le dernier échange.
Bandeau 2:1.

**Références réelles :** ancre ; `panels/P12-C02.png` (inconnue et lieu).
