# P06b — Portrait de Zachary, blessé (variante de P06)

| | |
|---|---|
| **Fichier livré** | `public/assets/portraits/zachary-blesse.webp` — 600 × 800 WebP, q85 |
| **Master** | 1200 × 1600 PNG, `art-masters/P06b-zachary-blesse.png` |
| **Lot** | F — chapitre 2, ajouts du propriétaire (décision du 2026-09-27, lot de dev 5.16) |
| **Utilisé dans le jeu** | variante `blesse` du locuteur `zachary` (ADR 0028) : grand portrait du dialogue (260 × 347) et vignette de réplique (52 × 52) de ses répliques d'agonie dans `ch2.egouts` (nœuds `a-abigail` et `franklyn-*`) |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| Portrait livré `public/assets/portraits/zachary.webp` (P06) — **référence d'identité principale** | **tout le cadrage** (tête et épaules, yeux à 38 %, sommet du crâne à ~8 %, trois quarts léger), la coupe au bol noire et brillante à frange droite, la peau brune, la vareuse à col mao et ses barrettes, le halo tramé rouge `#ef5350` en haut à droite | le **sourire immense et les yeux plissés de rire** : c'est précisément ce que cette variante remplace |
| `../../Reference_pictures/zacharie.png` | le visage, pour garder la ressemblance | le rendu photo, le sourire, tout le texte (jamais « ZACHARIE ») |
| Brief `D35-rafale-zachary.md` | la **blessure sans sang** : le coup se lit par le corps et le visage, jamais par une plaie ; aucun rouge sur Zachary | l'instant de l'impact (cri muet, cambrure) : ici, c'est après, quand la force s'en va |
| Brief `D29-egouts-zachary.md` | la **lumière des égouts** : néon latéral froid (cyan radio `#45d4e6` très retenu) qui accroche le visage ; « les yeux mi-clos, un faible sourire, son sourire presque éteint » ; palette très désaturée | le tunnel, l'eau, Abigail : un portrait n'a pas de décor |

## Le sujet

Relevé du lot 5.13 : le portrait livré de Zachary **rit aux éclats** pendant son agonie aux
égouts. Cette variante est le même garçon, au même cadrage, quelques heures après la rafale du bal
(D35) : touché au flanc en protégeant Abigail, il sait qu'il n'en sortira pas. Il est conscient,
il respire court, il parle encore à Abigail et à Franklyn. **Son sourire s'efface** — il en reste
l'amorce, pas la joie. Pas de sang, pas de plaie : la blessure se lit sur le visage.

## Composition

- **Même cadrage que P06**, pour que le passage d'un portrait à l'autre ne fasse pas sauter l'image :
  tête et épaules, visage de trois quarts léger, yeux à 38 % de la hauteur, sommet du crâne à ~8 %,
  épaules coupées par le bas du cadre. La tête peut s'incliner très légèrement, sans quitter ces repères.
- **Yeux mi-clos**, paupières lourdes, regard qui cherche encore l'objectif sans tout à fait l'atteindre.
- **Un sourire qui s'efface** : un coin de la bouche encore relevé, lèvres entrouvertes, sans dents
  découvertes — surtout pas le grand sourire de P06, ni une grimace.
- **Teint cireux** : la peau brune chaude de P06, ternie, grisée, les pommettes et les lèvres pâlies.
- **Sueur** : quelques gouttes et un reflet luisant au front et à la tempe, cheveux collés par
  mèches sur la frange (la coupe au bol reste nette et géométrique : c'est elle qui identifie
  Zachary en vignette).
- Vareuse à col mao, **col entrouvert**, trempée et froissée, barrettes sans lettre.
- Fond : aplat d'encre, **halo tramé rouge `#ef5350`** en haut à droite comme P06, mais **plus
  petit et plus éteint** — la couleur du personnage qui s'en va.

## Lumière et couleur

- Plus de lumière chaude : lumière principale **froide et dure** en haut à gauche, blanc os teinté
  du néon des égouts (cyan `#45d4e6` très retenu, comme D29) ; la moitié droite du visage dans
  l'aplat noir, modelée en trame.
- Contre-jour rouge du personnage (`#ef5350`), affaibli, sur l'arête droite de la coupe au bol et
  de l'épaule.
- L'unique accent d'imprimerie (`#e2262f`/`#8c1219`) : un filet fin sur une barrette du col,
  légèrement décalé du trait — **comme P06**. Rien de rouge sur la peau, les lèvres ou le tissu :
  rien ne doit se lire comme du sang.

## À éviter

Sang, plaie, bandage taché, rouge sur le visage ou le corps ; grand sourire, rire, dents ; yeux
grands ouverts ou révulsés ; visage déformé, grotesque ou cadavérique ; larmes ; un autre cadrage
que P06 ; texte sur le badge ou le col ; rendu photo.

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

Head-and-shoulders portrait of Zachary, the same 17-year-old police academy cadet as the
reference portrait, with exactly the same framing, pose and design, but now badly wounded and
fading, a few hours after being shot while shielding a friend. Glossy black bowl-cut hair with a
sharp straight fringe, a few strands stuck to his forehead with sweat, the bowl-cut silhouette
still crisp and geometric. His warm brown skin has turned waxy, greyish and drained, lips pale;
beads of sweat and a damp sheen on his forehead and temple. Heavy half-closed eyelids, eyes half
shut, still trying to look at the viewer. A fading smile: one corner of the mouth still slightly
raised, lips parted, no teeth showing, the ghost of his usual huge grin, calm rather than in
agony. Head tilted very slightly, face turned slightly. Black high-collar mandarin-style cadet
tunic, collar undone and open, soaked and creased, small plain rectangular collar bars, plain grey
shield-shaped shoulder patches with NO lettering anywhere. No visible wound and no blood: the
injury reads only in his face. Solid ink-black background with a smaller, dimmer halftone glow in
red (#ef5350) in the upper right, fading to black. Cold hard key light from upper left, bone white
tinged with a very restrained sewer-neon cyan (#45d4e6); the right half of the face in flat black
shadow modeled with halftone; a weakened red rim light on the right edge of hair and shoulder. One
single darker deep-red printing accent line on a collar bar, slightly misregistered from the black
line. No other red anywhere else in the image, nothing red on his skin, lips or clothes. Portrait
3:4, eyes at 38% of the height, top of the head near the top edge, shoulders cropped by the bottom
edge.

Negative prompt: blood, gore, wound, bullet hole, bandage, red stain, red on skin or lips, red
liquid, big smile, laughing, teeth, crinkled laughing eyes, wide open eyes, rolled back eyes,
tears, screaming, grimace, distorted or grotesque face, corpse, dead eyes, different framing,
background scenery, text, letters, logos, name tapes with writing, bloom, lens flare, glow haze,
photo realism, 3D render, anime, smooth gradients, border, watermark, signature.
```

## Critères d'acceptation

- Posé à côté de P06, c'est **le même garçon au même cadrage** : coupe au bol, frange droite,
  col mao, yeux à la même hauteur ; le passage de l'un à l'autre ne fait pas sauter l'image.
- Lisible réduit à 52 × 52 : la silhouette de la coupe au bol l'identifie ; les yeux mi-clos et le
  teint terni se lisent encore.
- Le sourire s'efface sans disparaître ; aucune trace de rire.
- Aucun sang, aucune plaie ; un seul accent d'imprimerie, sur le col ; aucune lettre.
