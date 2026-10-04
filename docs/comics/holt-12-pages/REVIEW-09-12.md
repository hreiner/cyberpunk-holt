# Revue des images — pages 9 à 12

Dix images indépendantes ont été générées avec l'outil intégré `image_gen`, inspectées
individuellement après copie et enregistrées dans
`art-masters/comics/holt-12-pages/panels/`. Le storyboard et les autres pages n'ont pas été
modifiés. Les images restent sans bulles ni lettrage ; le texte vient de `storyboard.json`
pendant l'assemblage.

| Case | Revue narrative et visuelle |
|---|---|
| P09-C01 | Murano tend la trousse à Grover ; le scorpion sur la manche est visible, le fusil reste bas. Letitia garde ses boucles, son teint et ses galons ; Franklyn remarque Murano. |
| P09-C02 | Murano s'effondre sans détail sanglant, fusil inutilisé au sol. Franklyn se recule ; l'enfant le voit depuis la cabine et la clé reste au contact. |
| P10-C01 | Camion et occupants dans les décharges face à Night City ; Letitia consciente sous la couverture, Grover et l'enfant à ses côtés. |
| P10-C02 | John a les cheveux argentés courts et aucun implant ; l'enfant réveille Grover, Abigail se tient à l'écart, deux guetteurs observent le fusil inutilisé. |
| P11-C01 | Le guide reçoit le fusil, pointe la clinique ; Letitia est soutenue à l'arrière, avec veste à revers, cravate et galons. |
| P11-C02 | Letitia consciente dans la clinique, Franklyn et John au comptoir, charcudoc chauve avec port temporal. Une retouche a remplacé les taches rougeâtres du tablier par de la graisse et de la suie grises. |
| P11-C03 | Séparation claire au seuil : Letitia reste couchée, Franklyn lâche sa main ; John, Grover, Abigail et l'enfant partent. Une retouche a remplacé un visage erroné de charcudoc par Grover. |
| P12-C01 | Franklyn, John, Grover, Abigail et l'enfant sont au Blue Purple ; deux chaises vides matérialisent les absences. Smith, Letitia et Zachary ne sont pas représentés. |
| P12-C02 | L'inconnue entre dans l'espace de la table, avec cheveux bleu nuit asymétriques, veste violette et boucle rouge ; les quatre cadets réagissent. |
| P12-C03 | Franklyn tend la main sans toucher le verre de l'inconnue ; l'enfant regarde. L'identité et la réponse restent ouvertes. |

## Raccords tenus

- Style encré 2D, silhouettes anguleuses et contrastes cyan/violet conformes à l'ancre de
  personnages ; les références photo n'ont servi qu'aux identités et aux lieux.
- Letitia conserve la veste de cérémonie à revers, la cravate noire et les galons jusqu'à
  P11-C03. Elle demeure vivante à la clinique et ne revient pas sur la page 12.
- Zachary est absent des dix cases. L'enfant porte un sweat gris et des locks courtes.
- Murano porte le bonnet rouge, la veste camouflage et le scorpion. Son fusil n'est jamais
  tiré ; Franklyn le cède au guide. Les clés restent au contact du camion.
- Les deux retouches ciblées ont conservé le cadrage, les autres personnages et le style.

## Pour l'assemblage

Les sources des pages 9 à 11 sont à 1536×1024 (cases paysage) et 1024×1536 (portraits).
La page 12 est à 1774×887, proche de ses trois bandeaux 2:1. Le recadrage couvrant prévu dans
`assemble.py` doit préserver les mains de P12-C03 et les deux chaises vides de P12-C01 ; leurs
focales centrales dans le storyboard conviennent à première vue. Vérifier visuellement après
pose des bulles, en particulier P11-C02 et P11-C03 où plusieurs visages occupent le haut.

## Revue des pages assemblées

Inspection visuelle des PNG 1600×2400 `pages/page-09.png` à `page-12.png` et `pages/back.png`.
La pagination, les marges, la typographie française et les contrastes sont nets. Aucun texte
ne déborde ; les cartouches et les bulles sont lisibles à l'échelle de la page.

- **Page 9 :** la trousse, le scorpion, le refus du camion et la mort de Murano se suivent sans
  ambiguïté. Le cartouche explicite « Franklyn tua Murano pour prendre le camion. Ses mains
  tremblaient. » clarifie la case silencieuse sans couvrir les personnages.
- **Page 10 :** l'arrivée à Night City puis la veille dans les décharges se lisent bien.
  **À corriger :** dans la case 2, la pointe de « Ils reviennent. » s'arrête au-dessus du centre
  du camion alors que l'enfant qui parle se trouve à droite. Dans la case 1, John est hors
  champ ; la pointe de « On est arrivés. Pas encore sauvés. » semble désigner la ville.
- **Page 11 :** le guide reçoit le fusil, le charcudoc exige « Deux mille crédits. Demain soir.
  Après, je me paie. » et Letitia reste à la clinique. **À corriger :** dans la case 3, les
  deux grandes bulles supérieures empiètent sur la tête de Franklyn ; celle de droite réduit
  particulièrement l'espace de son front et de ses yeux. Replacer/réduire les bulles pour
  laisser son visage entier lisible et garder leurs pointes attribuables à Letitia et John.
- **Page 12 :** quatre cadets et l'enfant, deux chaises vides, absence de Letitia et Zachary,
  entrée distincte de l'inconnue, main de Franklyn arrêtée avant le verre : le suspense final
  fonctionne. Les deux répliques finales tiennent dans leurs bulles et les visages principaux
  restent lisibles.
- **Quatrième :** image, résumé, titre et crédits sont nets, sans débordement. Les crédits
  demandés sont présents et lisibles.

Ces points de bulles ont été signalés à l'agent principal ; aucune modification de
`storyboard.json`, de l'assembleur ou du PDF n'a été faite pendant cette revue.

### Contrôle après correction — pages 10 et 11

Les deux PNG finaux ont été réinspectés à 1600×2400. **Feu vert pour ces pages.** En P10-C01,
la réplique de John hors champ apparaît sans pointe ; elle ne désigne plus la ville. En
P10-C02, « Ils reviennent. » est placé à droite au-dessus de l'enfant : la pointe courte
indique sa zone et aucun autre personnage sous la bulle ne peut raisonnablement être pris
pour le locuteur. En P11-C03, les bulles de Letitia et de John sont au bas de la case ; leurs
pointes remontent respectivement vers Letitia sur le lit et John derrière Franklyn. Le visage
entier de Franklyn et ceux des autres personnages sont dégagés, les mains jointes restent
visibles, et le texte ne déborde pas.
