# D29 — Les égouts : Abigail penchée sur Zachary (Scène 7, la mort de Zachary)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/egouts-zachary.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D29-egouts-zachary.png` |
| **Lot** | F — chapitre 2, ajouts du propriétaire |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.egouts`, clé `egouts-zachary` : ouverture de la scène, Zachary mourant et conscient ; nœuds posés par le lot 5.13 (D22 `egouts` reste le décor de la suite) |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/Egouts.png` | le **tunnel d'égout circulaire** en perspective, voûte côtelée, eau stagnante noire avec débris (bouteille, canette), la **lampe rouge** lointaine au fond et le **néon froid** latéral en haut à gauche ; les silhouettes de la bande accroupies dans l'eau, plus loin | le rendu photo, la marque lisible sur la canette, la silhouette du premier plan à quatre pattes (ici remplacée par le couple) |
| `../../Reference_pictures/Chapter2/SlowAbigailZach.png` | l'identité du couple : coupe au bol noire de Zachary, longues tresses d'Abigail, leurs tenues de gala sombres — les mêmes, trempées, quelques heures plus tard | le rendu photo, la salle, les lettres des écussons |
| Portraits livrés `public/assets/portraits/zachary.webp` (P06) et `abigail.webp` (P02) | la coupe au bol à frange droite, la peau brune de Zachary ; la raie au milieu, les tresses serrées, les taches de rousseur d'Abigail | les expressions par défaut (ici : le dernier sourire de Zachary, l'effort désespéré d'Abigail) |

## Le sujet

GAME-DESIGN §4, scène 7, ajout du 2026-09-26 : la scène s'ouvre sur Zachary, **mourant et
conscient** ; Abigail tente de le soigner. Le texte dit dès le début qu'il est déjà perdu. C'est
l'image la plus intime du chapitre : pas d'action, deux adolescents dans l'eau noire, un geste de
soin qui ne suffira pas. La plaie ne se voit pas — elle est sous les mains d'Abigail et sous une
veste pliée.

## Composition

- Format 21:9, contre-plongée légère comme `Egouts.png`, le tunnel en perspective sur la moitié
  droite.
- Au **tiers gauche**, dans l'eau jusqu'aux hanches : Abigail à genoux, penchée, qui soutient la
  tête et les épaules de Zachary sur ses cuisses ; ses deux mains **pressent une veste pliée**
  contre son flanc. Tresses trempées qui tombent vers lui.
- Zachary, à demi allongé, trois quarts, les yeux mi-clos, **un faible sourire** — son sourire,
  presque éteint ; une main levée qui cherche le poignet d'Abigail.
- Plus loin dans le tunnel, deux ou trois silhouettes accroupies en aplat (le reste de la bande,
  Letitia soutenue), anonymes.
- Tiers inférieur : l'eau noire, une bouteille et une canette en silhouette, reflets tramés.

## Lumière et couleur

- Lumière principale froide et dure : le néon latéral en haut à gauche (cyan radio `#45d4e6` très
  retenu), qui accroche le visage de Zachary et les mains d'Abigail.
- **Un seul accent rouge** : la lampe de secours lointaine au fond du tunnel et son reflet dans
  l'eau, comme en D22 — **loin du couple**, pour que rien ne se lise comme du sang.
- Palette très désaturée, gris-brun-vert d'égout, eau presque noire.

## À éviter

Sang, plaie visible, tache ou reflet rouge près de Zachary, eau teintée ; visages grotesques ou
larmoyants à l'excès ; texte, marque sur la canette ; bloom sur les lampes.

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

Wide slightly low-angle shot inside a circular ribbed sewer tunnel receding in perspective on
the right half of the frame, stagnant black water with scattered debris. On the left third, waist
deep in the water: Abigail, a 17-year-old cadet with long tight black cornrow braids soaked and
hanging down, a center part and freckles, in a drenched dark zip-up gala jacket, kneels and
leans over Zachary, holding his head and shoulders on her lap, both her hands pressing a folded
jacket hard against his side. Zachary, a 17-year-old cadet with warm brown skin and a glossy
black bowl cut with a straight fringe, in a soaked dark high-collar mandarin tunic, lies half
reclined in three-quarter view, eyes half closed, a faint fading smile, one hand reaching up for
her wrist. The wound is never visible: only her hands and the folded jacket. Further down the
tunnel, two or three anonymous crouching flat silhouettes of the rest of the group. A hard cold
key light from a caged side lamp at upper left (very restrained cyan #45d4e6) catches his face
and her hands. The only red in the whole image: a small distant warning light at the far end of
the tunnel and its halftone reflection in the water, far away from the couple. Very desaturated
brown-green-grey palette. 21:9 aspect ratio, visual interest in the upper two-thirds, a calm dark
lower third: black water, a bottle and a can in silhouette, sparse halftone reflections.

Negative prompt: blood, gore, visible wound, bullet hole, red stain, red water, red near the
couple, corpse, exaggerated crying, grotesque faces, text, letters, brand on the can, logos,
bloom, lens flare, glow haze, rain, photo realism, 3D render, anime, smooth gradients, border,
watermark, signature.
```

## Critères d'acceptation

- Le tunnel se reconnaît face à `Egouts.png` et face à D22 (même lieu).
- Zachary et Abigail se reconnaissent à côté de P06, P02 et `SlowAbigailZach.png` (coupe au bol ;
  tresses).
- La plaie reste invisible ; aucun sang ; un seul accent rouge, au fond, loin d'eux ; aucun texte.
