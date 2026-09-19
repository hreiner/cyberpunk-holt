# P06 — Portrait de Zachary

| | |
|---|---|
| **Fichier livré** | `public/assets/portraits/zachary.webp` — 600 × 800 WebP, q85 |
| **Master** | 1200 × 1600 PNG, `art-masters/P06-zachary.png` |
| **Lot** | B — les portraits |
| **Utilisé dans le jeu** | grand portrait du dialogue (260 × 347), fiche du HUD tactique, vignette de réplique (52 × 52), écran du tirage |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/zacharie.png` | le visage (peau brune chaude, immense sourire sincère, yeux plissés de rire), la coupe au bol noire et brillante avec frange droite, la vareuse à col mao avec barrettes | le rendu photo, la lettre « ARIE » coupée en haut à gauche (artefact de capture), **tout le texte** — le badge de la référence porte « ZACHARIE », il ne doit y avoir **aucune lettre** dans l'image finale |
| `../../Reference_pictures/cadets.png` (case « Zachary ») | la cohérence de la coupe et du sourire avec le reste de la promotion | le rendu photo, le cadre et les noms |

## Le sujet

Zachary, dix-sept ans, cadet de l'académie HOLT, capitaine de l'équipe bleue, meneur naturel de
la bande qui comprend Franklyn et Abigail. **Immense sourire sincère**, tête brûlée, toujours le
premier à foncer.

## Composition

- Tête et épaules, visage de trois quarts léger, **grand sourire, yeux plissés de rire**, regard
  chaleureux vers l'objectif.
- Yeux à 38 % de la hauteur ; sommet du crâne à ~8 % ; épaules coupées par le bas du cadre.
- Coupe au bol noire et brillante, frange droite nette au ras des sourcils : silhouette très
  géométrique, elle doit se distinguer sans ambiguïté de toutes les autres coiffures à 52 × 52.
- Vareuse à col mao (col montant fermé, sans revers), petites barrettes au col dessinées comme
  de simples formes rectangulaires, sans lettre.
- Fond : aplat d'encre, **halo tramé rouge `#ef5350`** en haut à droite, qui s'éteint vers le
  noir — la couleur du personnage, distincte de l'unique accent d'imprimerie plus sombre et
  décalé.

## Lumière et couleur

- Lumière principale dure en haut à gauche (blanc os) : la moitié droite du visage dans l'aplat
  noir, modelé en trame — le sourire doit rester lisible même dans l'ombre.
- Contre-jour **rouge** du personnage (`#ef5350`) sur l'arête droite de la coupe au bol et de
  l'épaule : c'est la seule fiche où la couleur du personnage et l'accent d'imprimerie sont
  tous deux rouges — les garder bien distincts (rim light plus clair et diffus en trame contre
  filet net plus sombre et décalé).
- L'unique accent d'imprimerie (`#e2262f`/`#8c1219`) : un filet fin sur une barrette du col,
  légèrement décalé du trait (repérage) — pas de troisième zone rouge ailleurs dans l'image.

## À éviter

Texte sur le badge ou le col (jamais « ZACHARIE ») ; expression neutre ou sérieuse — le sourire
est non négociable ; confondre le rouge du personnage avec l'accent d'imprimerie au point de
saturer l'image de rouge ; tout rendu photo.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Head-and-shoulders portrait of Zachary, a 17-year-old police academy cadet, a natural leader
and the first to charge in. Glossy black bowl-cut hair with a sharp straight fringe, warm
brown skin, huge genuine wide smile, eyes crinkled with laughter, looking straight at the
viewer, face turned slightly. Black high-collar mandarin-style cadet tunic with small plain
rectangular collar bars, plain grey shield-shaped shoulder patches with NO lettering anywhere.
Solid ink-black background with a halftone glow in red (#ef5350) in the upper right, fading to
black. Hard key light from upper left, red rim light on the right edge of hair and shoulder,
one single darker deep-red printing accent line on a collar bar, slightly misregistered from
the black line. No other red anywhere else in the image. Portrait 3:4, eyes at 38% of the
height, top of the head near the top edge, shoulders cropped by the bottom edge.
```

## Critères d'acceptation

- Reconnaissable à côté de `zacharie.png` : coupe au bol, frange droite, sourire immense.
- Lisible réduit à 52 × 52 : la silhouette géométrique de la coupe au bol suffit à
  l'identifier.
- Un seul accent d'imprimerie net malgré le fond déjà rouge — pas de troisième rouge.
- Aucune lettre nulle part.
