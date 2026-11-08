# Blue Purple — direction graphique de la minute animée

Cadrage de production du 4 novembre 2026. Source dramatique : [scénario audiovisuel S01](SCREENPLAY.md) ;
identités : [bible provisoire](ART-DIRECTION.md), `art-masters/comics/holt-12-pages/v2/references/CAST-ANCHOR.png`.
L'usage demandé est personnel et local. Ce document fournit des choix visuels, pas une validation finale.

## Intentions

Un anime cyberpunk original en aplats vifs, contours affirmés, ombres tranchées et éclairages
saturés : cyan électrique `#41e9ee`, violet `#8268ee`, magenta `#ee4eaa`, ambre `#ffc47c`,
bleu nuit `#101326`. Préserver les peaux et la couleur propre des uniformes ; réserver les
couleurs acides aux reflets, interfaces et flashes. Le cadrage et le jeu doivent rester au
service de la conversation : énergie par la lumière, les coupes et les changements d'échelle,
puis bascule graphique au moment de la vision. Éviter toute reproduction d'un plan précis,
d'un personnage ou d'un signe graphique reconnaissable d'une autre œuvre.

Les médias du jeu sont des références : `blue-purple-rencontre.webp` contient déjà Wendy
au centre et des silhouettes au premier plan. Un second portrait de Wendy superposé à cette
image crée un doublon visible ; préférer un plan large seul, puis de vrais champs/contrechamps.
Le portrait du jeu de Franklyn est hachuré et réaliste ; la planche comics v2 présente un
Franklyn stylisé en aplats et des identités cohérentes. Utiliser cette planche comme référence
pour une nouvelle série d'images anime, sans reproduire les sourires ou poses inadéquats à
la scène. Wendy : cheveux foncés courts et asymétriques, veste sombre à grand col ; Franklyn :
cheveux noirs courts, sourcils appuyés, taches de rousseur, uniforme sombre. John cheveux
argentés très courts, sans neuroport ; Abigail tresses sombres ; Grover cheveux sombres et
silhouette fine. L'enfant conserve son identification par le portrait de jeu.

## Échelle de plans suggérée

| Moment | Composition et animation locale possible |
| --- | --- |
| Wendy se présente | Large de la table, néon au fond, léger travelling avant ; ménager la zone basse aux sous-titres. |
| John répond | Contrechamp à hauteur d'œil, profondeur de champ obtenue en couches ; légère respiration de caméra. |
| Wendy explique la traque | Plan rapproché, reflet lumineux qui traverse lentement le décor, puis coupe sèche sur Abigail. |
| Letitia et la dette | Alternance Franklyn/Grover/John ; Franklyn plus serré au moment du refus. Laisser les pauses jouer, sans secousse systématique. |
| Document et vision | Insert du document abstrait, flash bref, lignes cyan fragmentées, recadrage sur les yeux de Franklyn ; ne pas afficher de vraies coordonnées inventées. |
| Franklyn identifie les coordonnées | Retour au regard et au groupe, énergie visuelle qui décroît ; Wendy conclut. |

Opérations réalisables à partir d'images fixes : déplacement lent des couches, découpe de
premier plan, clignements ou variations de visage seulement si des dessins correspondants
existent, balayages lumineux, insert et montage. Elles créent une animation limitée ; elles
ne prouvent pas une animation dessinée image par image ou une synchronisation labiale.
Éviter le clignotement rapide répétitif, les zooms permanents et les portraits en vignette.

## Éléments graphiques locaux

- `anime/projects/blue-purple/art/vision-grid.svg` : repères géométriques cyan et violet sur
  transparence, à doser par opacité pendant la vision ; aucun chiffre narratif ajouté.
- `anime/projects/blue-purple/art/coordinate-document.svg` : silhouette de feuille et traits
  abstraits, composition de travail ; ne remplace pas un véritable document chiffré animé.

Ces deux SVG sont des créations vectorielles de ce lot. Le document a été converti avec
Edge hors sandbox puis intégré et contrôlé en image fixe ; la grille SVG reste non intégrée.
La vision du montage utilise une grille produite par FFmpeg.

## Vérification effectuée

Inspection visuelle du fond `blue-purple-rencontre.webp`, du portrait Franklyn du jeu et de
`CAST-ANCHOR.png` : la différence entre rendu hachuré et anime en aplats est visible, ainsi que
le risque de double représentation de Wendy. Aucun rendu de séquence animé, aucune revue
indépendante de continuité entre de nouvelles images et les voix n'ont été réalisés dans
ce périmètre. Contrôler les visages, la lisibilité des sous-titres et les raccords sur les
images effectivement retenues pour le montage.
