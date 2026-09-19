# P03 — Portrait de Letitia

| | |
|---|---|
| **Fichier livré** | `public/assets/portraits/letitia.webp` — 600 × 800 WebP, q85 |
| **Master** | 1200 × 1600 PNG, `art-masters/P03-letitia.png` |
| **Lot** | B — les portraits |
| **Utilisé dans le jeu** | grand portrait du dialogue (260 × 347), fiche du HUD tactique, vignette de réplique (52 × 52), écran du tirage |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/letitia.png` | le visage (traits métissés chauds, grand sourire ouvert), les cheveux châtain clair bouclés relevés en chignon lâche avec des boucles qui s'échappent, la veste de cérémonie à revers avec cravate et **galons d'épaule** | le rendu photo, la lettre géante coupée en haut à gauche, l'infobulle « Enregistré dans ce PC » sur le front (artefacts de capture), **tout le texte** des écussons et bandes |
| `../../Reference_pictures/cadets.png` (case « Letitia ») | la cohérence de la coiffure et du sourire avec le reste de la promotion | le rendu photo, le cadre et les noms |

## Le sujet

Letitia, dix-sept ans, cadette de l'académie HOLT, la meilleure observatrice de la promotion.
**Grand sourire ouvert, chaleureuse** : la plus solaire du groupe, mais son uniforme porte des
galons que personne d'autre ne porte — un détail que le joueur doit remarquer sans qu'on
l'explique.

## Composition

- Tête et épaules, visage de trois quarts léger, **grand sourire franc**, regard direct et
  vif vers l'objectif.
- Yeux à 38 % de la hauteur ; sommet du crâne à ~8 % ; épaules coupées par le bas du cadre.
- Chignon lâche avec boucles échappées : la silhouette de la coiffure doit rester distincte
  (volume bouclé irrégulier, différent des cheveux raides des autres cadets).
- Veste de cérémonie à revers, cravate noire, et sur l'épaule un **galon supplémentaire** (une
  ou deux barrettes cousues) — dessiné comme une forme géométrique simple, sans lettre.
- Fond : aplat d'encre, **halo tramé vert `#81c784`** en haut à droite, qui s'éteint vers le
  noir.

## Lumière et couleur

- Lumière principale dure en haut à gauche (blanc os) : la moitié droite du visage dans l'aplat
  noir, modelé en trame — mais le sourire doit rester lisible même dans l'ombre.
- Contre-jour **vert** du personnage sur l'arête droite des boucles et de l'épaule.
- L'unique accent rouge : un filet fin sur le bord du revers de veste ou de la cravate,
  légèrement décalé du trait (repérage).

## À éviter

Texte sur les bandes, écussons ou galons — formes sans lettres ; expression neutre ou fermée
(le sourire est son trait définitoire) ; cheveux lissés ou raides ; artefacts de capture de la
référence (lettre coupée, infobulle) ; tout rendu photo.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Head-and-shoulders portrait of Letitia, a 17-year-old police academy cadet with the sharpest
eyes of her class. Light brown curly hair pulled into a loose bun with loose curls escaping
around the face, warm mixed-heritage skin, wide genuinely open smile, bright direct eyes,
looking straight at the viewer, face turned slightly. Black ceremonial cadet jacket with
lapels, black tie, plain grey name tape and shield-shaped shoulder patch with NO lettering,
plus one extra plain rank bar on the shoulder (a simple geometric shape, no text). Solid
ink-black background with a halftone glow in green (#81c784) in the upper right, fading to
black. Hard key light from upper left, green rim light on the right edge of hair and shoulder,
thin printing-red accent along the lapel edge. Portrait 3:4, eyes at 38% of the height, top of
the head near the top edge, shoulders cropped by the bottom edge.
```

## Critères d'acceptation

- Reconnaissable à côté de `letitia.png` : boucles échappées du chignon, sourire ouvert, veste
  à revers.
- Lisible réduit à 52 × 52 : la silhouette bouclée irrégulière et le sourire restent nets.
- Style conforme à l'ancre P01.
- Aucune lettre nulle part, y compris sur le galon.
