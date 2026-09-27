# D39 — Le couloir de l'académie, la nuit de l'attaque (Scène 4, la fuite)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/couloir-nuit.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D39-couloir-nuit.png` |
| **Lot** | H — chapitre 2, deux décors de nuit (lot de dev 5.C) |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.fuite` (décor du fichier, clé `couloir-nuit`) : l'aparté « souffler un instant », la bande adossée au mur du couloir pendant la fuite |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| Décors livrés `public/assets/backdrops/dortoirs.webp` (D01) et `cantine.webp` (D02) | l'**architecture de l'académie HOLT** : béton brut, piliers et poutres apparents, réglettes néon au plafond, portes et casiers en acier, le trait et la trame de la série ; la petite diode rouge au fond de D01 comme modèle d'accent | la lumière de jour ou d'aube, les silhouettes de cadets, l'estrade et la bannière |
| `../../Reference_pictures/Chapter2/BadlandsHoltenFeuPatrouilles.png` | la **nuit de l'attaque** vue du dehors : l'académie noire, le feu qui monte d'une partie des bâtiments, la fumée noire épaisse, la lumière froide de la lune contre la lueur chaude du feu | le paysage des Badlands, les phares des patrouilles, l'orange saturé, le rendu photo |
| `../../Reference_pictures/Chapter2/AttaqueBoom.png` | la **tension de l'attaque** : l'éclair d'un tir, des gerbes d'étincelles, la pénombre trouée de lumière dure | la boule à facettes, le cyan et le rose saturés, les corps au sol, l'arme au premier plan, le rendu photo |

## Le sujet

Scène 4, « jusqu'au dortoir » (GAME-DESIGN §4) : la fuite stressante, du hall au dortoir, par le
**couloir de ceinture** de l'académie (`docs/design/10-MAPS-CHAPTER-2.md`, `holt-nuit`). Les autres
portes sont fermées par le feu ; les tirs s'entendent, jamais loin. Le nœud `depart` de
[`ch2.fuite.json`](../../../../src/data/dialogues/ch2.fuite.json) le dit : une seconde pour
respirer, épaule contre le mur, Letitia appuyée contre Franklyn, puis il faut repartir. Le décor
est ce couloir-là, vide : on doit y lire « un abri d'une seconde, dans un bâtiment qui brûle ».

## Composition

- Format 21:9, à hauteur d'homme, un peu bas : on est adossé au mur. Le couloir file en
  **perspective centrale** légèrement décalée vers la droite ; le point de fuite est un peu
  au-dessus du centre.
- **Au bout du couloir**, dans le tiers central : une **porte coupe-feu fermée** en acier. Par les
  interstices (le bas, le petit hublot), la **lueur du feu** perce, en traits rouges et trame.
- **Au plafond** : une nappe de **fumée** noire tramée qui rampe et s'épaissit vers le fond, et
  mange les réglettes. Les réglettes de sécurité sont **mortes**, une seule, à mi-distance,
  **clignote** : dessinée à moitié allumée, un trait vif et des éclats de trame.
- **À gauche, au premier plan** : un **renfoncement** dans le mur de béton (une niche entre deux
  piliers, un banc ou une rangée de casiers), dans l'ombre, là où la bande pourrait reprendre son
  souffle. Vide.
- Sur le mur de droite, des portes de salles fermées ; loin, derrière une vitre armée, un **éclair
  de tir** lointain en quelques traits blancs et deux ou trois étincelles.
- Tiers inférieur : le sol du couloir, sombre et calme, quelques débris et papiers au sol, des
  reflets tramés de la lueur du fond.
- Aucun personnage, aucun corps.

## Lumière et couleur

- Pénombre : le couloir est surtout noir d'encre et gris béton désaturé.
- Lumière principale dure, blanc-os, en haut à gauche : la **lune** qui tombe par une fenêtre haute
  étroite, en faisceau net sur le renfoncement.
- Contre-jour : la **lueur du feu** au bout du couloir, par la porte fermée. C'est l'**accent rouge
  unique** : rouge d'imprimerie `#e2262f` et rouge profond `#8c1219`, jamais orange.
- La réglette qui clignote est blanc-os froid, un soupçon de cyan radio `#45d4e6` au plus, jamais
  de halo.

## À éviter

Personnage, main, corps ou silhouette ; sang ; flammes dans le couloir lui-même (le feu reste
derrière la porte) ; orange saturé ; bloom ou halo sur la lueur et la réglette ; texte, panneau
« sortie », pictogramme, plaque de porte lisible ; le hall du centre d'examen (table, tasers) ;
boule à facettes, cyan et rose de discothèque.

## Prompt (anglais, prêt à copier)

```
Inked graphic-novel illustration, semi-realistic, bold confident black ink linework with
variable line weight, hard flat black shadows, visible halftone dot shading instead of
smooth gradients, limited desaturated palette: ink black (#140d0e), warm bone white
(#efe4d4), a single printing-red accent (#e2262f) slightly misregistered offset from the
black line, faint cream paper grain. Tabletop RPG sourcebook art from a gritty cyberpunk
police setting. Hard key light from upper left, colored rim light from the opposite side.
No text, no letters, no logos, no watermark, no border, no photo realism, no 3D render,
no anime, no airbrushed gradients, no bloom.

Eye-level view, slightly low as if leaning back against the wall, down a long bare-concrete
corridor of a spartan police academy at night, during an armed attack. Strong one-point
perspective slightly offset to the right, vanishing point a little above center. Raw concrete
walls with exposed pillars and ceiling beams, closed steel doors of classrooms along the right
wall. At the far end of the corridor, in the central third: a closed steel fire door; a red fire
glow leaks through the gap under it and through its small wired-glass porthole, drawn with crisp
red ink lines and halftone, the fire itself stays behind the door. A layer of black smoke,
rendered as flat ink masses and grey halftone, crawls along the ceiling and thickens toward the
far end, swallowing the ceiling strip lights. The emergency strip lights are dead, except one at
mid-distance that flickers, drawn half-lit with a sharp line and broken halftone flecks, no glow.
In the left foreground: an empty shadowed recess in the concrete wall between two pillars, with a
low bench and a row of steel lockers, a place to catch one's breath. Far away on the right,
through a wired-glass window, a distant muzzle flash in a few white ink strokes and a couple of
sparks. A hard bone-white moonlight falls from a narrow high window in the upper left onto the
recess. The only red in the image: the fire glow at the far door, printing red (#e2262f) and deep
red (#8c1219), never orange. Everything else is desaturated grey concrete and ink black. No
people, no bodies. 21:9 aspect ratio, visual interest in the upper two-thirds, a calm dark lower
third: the corridor floor with a few scattered papers and debris and sparse halftone reflections
of the far glow.

Negative prompt: people, hands, bodies, silhouettes, blood, gore, flames in the corridor,
saturated orange, fire glow haze, bloom, lens flare, disco ball, cyan and pink neon, exit sign,
signage, pictograms, door plates, text, letters, numbers, logos, emblems, table with weapons,
photo realism, 3D render, anime, smooth gradients, border, watermark, signature.
```

## Critères d'acceptation

- On lit tout de suite un **couloir de l'académie** (béton, piliers, portes d'acier, comme D01 et
  D02), la nuit, pendant l'attaque : pas un hall ni un entrepôt.
- La lueur du feu passe **derrière une porte fermée** au bout ; la fumée au plafond ; une réglette
  qui clignote, les autres mortes ; un tir lointain.
- Le **renfoncement** vide, à gauche, se lit comme un abri d'une seconde.
- Aucun personnage, aucun sang, aucun texte ; un seul accent rouge, jamais orange.
