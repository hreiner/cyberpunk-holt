# D37 — Le dortoir des petits, l'enfant (Scène 5, l'enfant)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/conduit-petits.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D37-conduit-petits.png` |
| **Lot** | G — chapitre 2, retours de QA (lot de dev 5.17) |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.enfant` (décor du fichier, clé `conduit-petits`) : le dortoir des petits, où débouche le conduit, et l'enfant sous le dernier lit |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/ConduitsEnfant.png` | l'identité de l'enfant : **dreadlocks courtes**, traits très jeunes, **sweat trop grand**, regard grave ; la lumière froide des conduits | le rendu photo, le texte du sweat (« HOLT ACADEMY »), le cadrage en portrait (ici, une petite silhouette dans un décor) |
| Portrait livré `public/assets/portraits/enfant.webp` (P14) | la même coiffure, le même sweat, la même gravité | le fond jaune du portrait |
| Décor livré `public/assets/backdrops/dortoirs.webp` (D01) | l'architecture des dortoirs de l'académie : lits superposés en métal, casiers, poutres de béton, la **veilleuse rouge** au-dessus de la porte | la lumière de l'aube (ici, la nuit), les silhouettes de cadets |

## Le sujet

Scène 5 (GAME-DESIGN §4). Le nœud `rencontre` de
[`ch2.enfant.json`](../../../../src/data/dialogues/ch2.enfant.json) le dit : un enfant de sept ou
huit ans, en pyjama, est caché sous le dernier lit du dortoir des petits, les genoux contre la
poitrine. Il pleure fort, beaucoup trop fort. Au-dessus, les bottes des gangers passent sur la
tôle du plafond. On voit la pièce depuis la grille du conduit, en hauteur : c'est l'instant où la
bande le découvre.

## Composition

- Format 21:9. La vue plonge **légèrement** depuis une grille de ventilation murale, en hauteur.
  Les barreaux de la grille sont en amorce, en masses d'encre, sur le bord gauche.
- Une rangée de **petits lits superposés** en métal, plus bas que ceux des cadets, fuit vers la
  droite, avec des couvertures défaites et des casiers bas.
- Au **tiers droit**, sous le dernier lit du bas, l'enfant est **recroquevillé** : genoux contre la
  poitrine, bras autour des jambes, **visage caché** contre les genoux. Seules ses dreadlocks
  courtes se lisent. C'est une petite silhouette, pas un portrait.
- Au plafond, des panneaux de tôle. Une fente de lumière passe entre deux panneaux, coupée par
  l'ombre de deux bottes.
- Tiers inférieur : le sol du dortoir, sombre et calme.

## Lumière et couleur

- Lumière principale dure, blanc-os et froide : elle tombe en haut à gauche par la grille et la
  fente du plafond.
- Contre-jour cyan radio `#45d4e6`, très retenu, le long des montants des lits.
- **Un seul accent rouge** : la veilleuse au-dessus de la porte du dortoir, au fond, comme en D01.
- Palette très désaturée, gris-bleu de nuit ; couvertures et pyjama en valeurs d'os éteint.

## Écart assumé à la bible

Comme D19, D20 ou D29, l'image montre un personnage identifiable, l'enfant : c'est une image de
récit voulue. Il reste petit dans le cadre, le visage caché, et c'est son portrait (P14) qui parle.

## À éviter

Visage de l'enfant visible ou larmes dessinées ; gangers visibles (seulement l'ombre des bottes) ;
texte sur le pyjama ou les casiers ; sang ; lumière de l'aube ; bloom sur la veilleuse.

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

Slightly high-angle view into a small children's dormitory at night, seen from a wall ventilation
grille: a few dark grille bars along the extreme left edge of the frame as a foreground framing
element. A row of small, low metal bunk beds with rumpled blankets and low lockers recedes to the
right, concrete beams and sheet-metal ceiling panels above. On the right third of the frame, under
the last lower bunk: a small child of seven or eight with short dreadlocks, in oversized pajamas
and a too-big sweatshirt, curled up with knees pressed to the chest and arms wrapped around the
legs, face hidden against the knees, a small silhouette, not a portrait. In the ceiling, a thin
slit of light between two metal panels is cut by the shadow of two boots walking overhead. Hard
cold bone-white key light falling from the upper left through the grille and the ceiling slit,
restrained cold cyan (#45d4e6) rim light along the bed frames. The only red in the whole image: a
small red night-light above the dormitory door in the background. Very desaturated blue-grey night
palette. 21:9 aspect ratio, visual interest in the upper two-thirds, a calm dark lower third: the
dormitory floor.

Negative prompt: visible face of the child, tears, open mouth screaming, adults, gang members,
weapons, blood, text on clothes or lockers, letters, logos, dawn light, bloom, lens flare, glow
haze, photo realism, 3D render, anime, smooth gradients, border, watermark, signature.
```

## Critères d'acceptation

- L'enfant se reconnaît à côté de P14 et de `ConduitsEnfant.png` (dreadlocks, sweat trop grand) ;
  il reste petit dans le cadre, le visage caché.
- Le dortoir appartient à la même académie que D01 : de nuit, à l'échelle des petits.
- Un seul accent rouge, la veilleuse ; aucun texte ; aucun ganger visible.
