# D40 — La grille du dortoir, la nuit de l'attaque (Scène 4, la grille)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/grille-dortoir.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D40-grille-dortoir.png` |
| **Lot** | H — chapitre 2, deux décors de nuit (lot de dev 5.C) |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.grille` (décor du fichier, clé `grille-dortoir`) : la grille verrouillée, le panneau électronique à forcer sous le tir |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| Décor livré `public/assets/backdrops/dortoirs.webp` (D01) | **le dortoir lui-même**, vu ici à travers la grille : les rangées de lits superposés en acier, les casiers du mur du fond, le béton, la petite diode rouge ; le trait et la trame de la série | la lumière de l'aube par les baies hautes, les silhouettes de cadets, l'allée éclairée |
| Décor livré `public/assets/backdrops/cantine.webp` (D02) | l'architecture de l'académie : béton brut, piliers, portes et huisseries d'acier | la lumière de jour, l'estrade |
| `../../Reference_pictures/Chapter2/BadlandsHoltenFeuPatrouilles.png` | la **nuit de l'attaque** : la lueur chaude du feu contre le froid de la nuit, la fumée | le paysage, les patrouilles, l'orange saturé, le rendu photo |

## Le sujet

Scène 4, fin de la fuite (GAME-DESIGN §4). Le nœud `arrivee` de
[`ch2.grille.json`](../../../../src/data/dialogues/ch2.grille.json) le dit : la grille du dortoir,
enfin en vue, verrouillée ; les tirs se rapprochent, deux couloirs derrière. Puis `panneau` : le
panneau électronique de la grille, sous le tir. Il faut le forcer, avec l'outil d'Abigail ou en
arrachant deux fils. Le décor doit dire « une porte qu'il faut forcer vite ».

## Composition

- Format 21:9, à hauteur d'homme, depuis le couloir, face à la grille, un peu de biais (la grille
  file légèrement vers la droite).
- La **porte-grille métallique** occupe le centre et la droite des deux tiers supérieurs :
  barreaux verticaux épais, traverses, une serrure motorisée massive. À travers les barreaux, le
  **dortoir dans le noir** : les rangées de lits superposés et les casiers de D01, seulement des
  contours et des reflets, en aplats d'encre.
- **À gauche de la grille**, fixé au béton à hauteur de poitrine, un peu au-dessus du centre de
  l'image : le **panneau électronique** de commande, capot entrouvert, câbles gainés, clavier sans
  chiffres ni lettres, et **un seul voyant rouge** allumé.
- Tout au plus, en amorce en bas à gauche du panneau : **les mains d'un cadet** (manches d'uniforme
  sombres, sans écusson lisible) qui ouvrent le capot. Aucun visage, aucun corps entier. Si les
  mains gênent la lecture, les omettre.
- Au plafond du couloir, une traîne de **fumée** tramée ; une **lampe de secours** murale au-dessus
  de la grille, en cage.
- Tiers inférieur : le sol du couloir devant la grille, sombre et calme, l'ombre des barreaux
  couchée dessus.
- Aucun personnage identifiable.

## Lumière et couleur

- **Lumière de fuite** : la **lampe de secours** au-dessus de la grille, blanc-os dur, découpe les
  barreaux et projette leur ombre au sol, en haut à gauche comme l'exige la bible.
- Contre-jour : la **lueur du feu** réfléchie, venue du couloir derrière le spectateur, en reflets
  rouges sur l'acier des barreaux et sur le béton, rouge profond `#8c1219` tramé.
- **Accent rouge** : le **voyant** du panneau, rouge d'imprimerie `#e2262f`, net ; la lueur du feu
  reste dans la même famille de rouge, plus sombre. Jamais d'orange.
- Palette très désaturée : acier gris-bleu, béton, noir d'encre dans le dortoir.

## À éviter

Visage, personnage entier, silhouette de cadet dans le dortoir ; sang ; lumière d'aube ou de jour ;
flammes visibles ; orange saturé ; bloom sur le voyant ou la lampe ; plusieurs voyants de
couleurs ; chiffres, lettres, pictogrammes sur le clavier ou le panneau ; écusson lisible sur les
manches ; texte, numéro de dortoir.

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

Eye-level view from a bare-concrete corridor of a spartan police academy at night, during an
armed attack, facing a heavy locked steel security gate that closes off a dormitory, seen slightly
at an angle, the gate receding a little to the right. Thick vertical steel bars and cross rails,
a massive motorized lock. Through the bars, the dormitory lies in darkness: rows of steel bunk
beds and a wall of lockers at the back, only ink contours and a few sparse halftone reflections.
Left of the gate, bolted to the concrete at chest height, slightly above the center of the frame:
an electronic control panel with its cover pried half open, sheathed cables, a keypad with blank
keys, and a single glowing red status light. At most, entering from the lower left of the panel,
the two hands of a cadet in dark uniform sleeves prying at the cover, no face, no body, no
readable patch. A caged emergency lamp on the wall above the gate throws a hard bone-white light
that cuts the bars and lays their long shadows across the floor. A reflected red fire glow, coming
from the corridor behind the viewer, catches the steel bars and the concrete in deep red (#8c1219)
halftone. A trail of black smoke in ink masses and grey halftone along the corridor ceiling. The
only strong red: the single status light on the panel, printing red (#e2262f); the fire
reflections stay in the same red family, darker, never orange. Very desaturated blue-grey steel
and concrete, deep ink black inside the dormitory. 21:9 aspect ratio, visual interest in the upper
two-thirds, a calm dark lower third: the corridor floor with the long shadows of the bars.

Negative prompt: faces, full figures, bodies, silhouettes behind the bars, blood, gore, visible
flames, saturated orange, daylight, dawn light, fire glow haze, bloom, lens flare, several colored
lights, numbers on the keypad, letters, pictograms, readable patches, dormitory number, signage,
text, logos, emblems, photo realism, 3D render, anime, smooth gradients, border, watermark,
signature.
```

## Critères d'acceptation

- La **grille** fermée et son **panneau à un seul voyant rouge** se lisent au premier coup d'œil ;
  derrière, le dortoir de D01 se reconnaît, **dans le noir**.
- La lumière est celle de la fuite : lampe de secours, reflets rouges du feu ; aucune lumière
  d'aube.
- Aucun personnage identifiable (des mains en amorce, au plus) ; aucun sang, aucun texte ni
  chiffre ; un seul accent rouge franc, jamais d'orange.
