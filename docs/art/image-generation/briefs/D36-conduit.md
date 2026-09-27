# D36 — Le conduit, le ventilateur (Scène 5, les conduits)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/conduit.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D36-conduit.png` |
| **Lot** | G — chapitre 2, retours de QA (lot de dev 5.17) |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.conduits` (décor du fichier, clé `conduit`) : le ventilateur de reprise d'air qui barre le conduit des petits |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/ConduitVentliation.png` | le **conduit carré** en tôle rivetée, en perspective centrale ; au bout, le **ventilateur circulaire** qui le ferme ; les petites LED froides de part et d'autre ; la tôle humide qui renvoie la lumière | le rendu photo, le bleu saturé, le cadre noir autour de l'image |
| `../../Reference_pictures/Chapter2/Conduit.png` | la **grille de ventilation** au plafond, les panneaux de tôle à croisillons, le coude qui part sur le côté, la lumière qui tombe d'une trappe | le rendu photo, les portes sas au fond (ici, le ventilateur) |

## Le sujet

Scène 5, « le territoire de Franklyn » (GAME-DESIGN §4). Le nœud `ventilateur` de
[`ch2.conduits.json`](../../../../src/data/dialogues/ch2.conduits.json) le dit : le conduit des
petits passe derrière un ventilateur de reprise d'air. Les pales tournent à pleine vitesse,
**à hauteur de visage**, et couvrent presque les pleurs. Il faut pirater le ventilateur, le
démonter ou le bloquer. Le décor est vu à hauteur d'un cadet qui rampe : le plafond est bas,
l'espace oppressant.

## Composition

- Format 21:9. Conduit carré en tôle rivetée, en **perspective centrale**. Le point de fuite est
  un peu au-dessus du centre ; le point de vue est bas, à hauteur d'un cadet à quatre pattes.
- Au bout, dans le tiers central : le **ventilateur circulaire**. Ses pales tournent : des traits
  de vitesse et une trame en éventail, jamais un flou.
- À gauche du ventilateur, fixé à la tôle : un **boîtier de commande** fermé, avec des câbles
  gainés et une petite LED rouge. C'est le boîtier que Franklyn pirate.
- Au plafond, en haut à gauche : une grille de ventilation en amorce, par où tombe la lumière.
- Tiers inférieur : le fond du conduit, en tôle sombre et calme, avec quelques reflets tramés.
- Aucun personnage.

## Lumière et couleur

- Lumière principale dure, blanc-os, qui tombe de la grille en haut à gauche.
- Contre-jour froid, cyan radio `#45d4e6` très retenu, sur les LED du conduit et le liseré des pales.
- **Un seul accent rouge** : la LED du boîtier de commande.
- Palette très désaturée, gris-bleu de tôle ; noir d'encre dans les coins.

## À éviter

Personnage ou main visible ; bleu saturé « néon » ; flou de mouvement photographique ; bloom sur
les LED ; texte ou pictogramme lisible sur le boîtier ; sang.

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

Low point of view inside a cramped square riveted sheet-metal ventilation duct, seen from the
height of someone crawling on hands and knees, strong central one-point perspective receding to a
vanishing point slightly above center. At the far end, filling the central third of the frame, a
large circular air-return fan blocks the duct, its blades spinning at full speed, rendered with
inked speed lines and a fan-shaped halftone pattern, never with photographic motion blur. Mounted
on the duct wall just left of the fan: a closed control box with sheathed cables and one tiny red
status LED. A ceiling ventilation grille in the upper left corner lets a hard bone-white light
fall into the duct. Small restrained cold cyan (#45d4e6) LEDs on both side walls near the fan, and
a thin cyan rim on the blade edges. The only red in the whole image: the tiny LED on the control
box. Very desaturated blue-grey metal, damp sheet metal with sparse halftone reflections, deep ink
black in the corners. No characters, no hands. 21:9 aspect ratio, visual interest in the upper
two-thirds, a calm dark lower third: the duct floor.

Negative prompt: people, hands, blood, text, letters, icons on the box, logos, saturated neon blue,
motion blur, bloom, lens flare, glow haze, rain, photo realism, 3D render, anime, smooth gradients,
border, watermark, signature.
```

## Critères d'acceptation

- Le conduit carré et le ventilateur circulaire du fond se reconnaissent face à
  `ConduitVentliation.png`.
- Le point de vue est bas et oppressant ; les pales tournent, en traits de vitesse, sans flou.
- Aucun personnage ; un seul accent rouge, la LED du boîtier ; aucun texte.
