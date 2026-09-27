# D38 — La cantine en feu, le vide-ordures (Scène 6, la cantine)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/cantine-feu.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D38-cantine-feu.png` |
| **Lot** | G — chapitre 2, retours de QA (lot de dev 5.17) |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.cantine` (décor du fichier, clé `cantine-feu`) : la traversée de la fumée jusqu'au vide-ordures, puis la chute |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/CantineFeuVideOrdure.png` | la **trappe d'acier du vide-ordures**, massive, au centre, avec son hublot et son **voyant rouge** au-dessus ; les flammes de part et d'autre ; le sol jonché de débris, mouillé, qui renvoie le feu | le rendu photo, l'orange saturé partout |
| `../../Reference_pictures/Chapter2/CantineFeu.png` | la **cantine** : longues tables et bancs, comptoir de service, le plafond qui brûle, la fumée basse | le rendu photo, **tout le texte** (enseigne « HOLT ACADEMY », « SERVICE LINE 02 », menus), les écussons |
| Décor livré `public/assets/backdrops/cantine.webp` (D02) | l'architecture de la cantine de l'académie : le même lieu, quelques heures plus tard | l'estrade du discours, l'ambiance de jour |

## Le sujet

Scène 6 (GAME-DESIGN §4). Le nœud `vide-ordures` de
[`ch2.cantine.json`](../../../../src/data/dialogues/ch2.cantine.json) le dit : au fond de la
cantine, le vide-ordures est une trappe d'acier assez large pour un adulte. Entre elle et la bande,
la fumée descend jusqu'au sol, noire et brûlante, entre les brasiers. C'est la dernière porte
encore ouverte : le décor doit dire « il faut traverser ça ».

## Composition

- Format 21:9, à hauteur d'homme, un peu accroupi : on avance tête baissée.
- Au centre, un peu au-dessus de la mi-hauteur, au fond de la salle : la **trappe d'acier** du
  vide-ordures, avec son hublot noir et le voyant rouge au-dessus.
- Entre la trappe et nous : les **longues tables**, renversées ou en feu, des bancs, des plateaux.
  Les brasiers brûlent de part et d'autre et laissent un **passage étroit** au centre.
- La **fumée** : une nappe noire et tramée descend du plafond jusqu'au sol et mange le haut des
  flammes.
- À droite, en amorce : le comptoir de service et ses vitres éclatées, **sans aucun texte**.
- Tiers inférieur : le sol mouillé, sombre et calme, avec quelques débris et des reflets tramés
  du feu.
- Aucun personnage, aucun corps.

## Lumière et couleur

- La lumière est celle du feu. Les flammes sont dessinées au trait vif : cœur **blanc-os**, bords
  en **rouge d'imprimerie** `#e2262f` et **rouge profond** `#8c1219`, modelé en trame. Pas d'orange
  saturé, pas de lueur diffuse.
- En haut à gauche, un pan de plafond effondré laisse passer une lumière dure blanc-os : c'est la
  lumière principale de la bible.
- La fumée est rendue en aplats d'encre et en trame grise.
- **Accent rouge** : le feu et le voyant de la trappe, une seule famille de rouge. Tout le reste
  est désaturé : tables, murs, sol.

## Écart assumé à la bible

Ici, le rouge couvre plus qu'un détail : c'est le feu. Il reste la seule couleur de l'image, en
rouge d'imprimerie et rouge profond, jamais en orange. Rien ne doit se lire comme du sang.

## À éviter

Personnages, corps, silhouettes au sol ; sang ; orange saturé comme sur une photo d'incendie ;
bloom ou halo sur les flammes ; texte, enseigne, logo, écusson ; flammes qui bouchent toute la
trappe (le passage doit se lire).

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

Eye-level view, slightly crouched, across a burning school cafeteria at night toward its far wall.
In the center of the far wall, slightly above mid-height: a massive steel garbage-chute hatch, big
enough for an adult, with a dark round porthole and a small red warning light above it. Between
the viewer and the hatch: long cafeteria tables and benches, some overturned, some burning,
scattered trays, fires on both sides leaving a narrow passage open down the middle. A thick layer
of black smoke, rendered as flat ink masses and grey halftone, rolls down from the ceiling almost
to the floor and swallows the tops of the flames. On the right edge, a service counter with
shattered glass, no signage. Flames drawn with crisp ink lines, bone-white cores and printing-red
(#e2262f) and deep red (#8c1219) edges, halftone shading, never saturated orange, never glowing
haze. A hard bone-white key light falls from a collapsed ceiling panel in the upper left. Tables,
walls and floor strongly desaturated; the only color in the image is the red family of the fire
and the hatch warning light. No people, no bodies. 21:9 aspect ratio, visual interest in the upper
two-thirds, a calm dark lower third: the wet floor with a few debris and sparse halftone
reflections of the fire.

Negative prompt: people, bodies, silhouettes on the floor, blood, gore, saturated orange, fire
glow haze, bloom, lens flare, sparks everywhere, text, letters, signage, menus, logos, emblems,
crests, photo realism, 3D render, anime, smooth gradients, border, watermark, signature.
```

## Critères d'acceptation

- La trappe du vide-ordures se reconnaît face à `CantineFeuVideOrdure.png`, au fond d'une cantine
  reconnaissable (tables, comptoir) comme dans `CantineFeu.png`.
- Un passage étroit se lit entre les brasiers, sous la fumée.
- Aucun texte, aucun personnage, aucun sang ; le feu est en rouge d'imprimerie, pas en orange.
