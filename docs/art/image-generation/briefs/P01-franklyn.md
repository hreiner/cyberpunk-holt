# P01 — Portrait de Franklyn (ancre de style)

| | |
|---|---|
| **Fichier livré** | `public/assets/portraits/franklyn.webp` — 600 × 800 WebP, q85 |
| **Master** | 1200 × 1600 PNG, `art-masters/P01-franklyn.png` |
| **Lot** | A — l'ancre de style : **validation humaine obligatoire avant toute autre image** |
| **Utilisé dans le jeu** | grand portrait du dialogue (260 × 347), fiche du HUD tactique, vignette de réplique (52 × 52), écran du tirage |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Frankly.png` | le visage (forme, taches de rousseur, sourcils froncés, bouche serrée), les cheveux châtain foncé courts en bataille, le blouson zippé à col montant et épaulettes en plaques, la place des bandes et écussons | le rendu photo, l'éclairage de studio neutre, **tout le texte** des bandes et écussons |
| `../../Reference_pictures/cadets.png` (case « Franklyn ») | la cohérence de l'uniforme avec le reste de la promotion | le rendu photo, le cadre et les noms |

## Le sujet

Franklyn, dix-sept ans, cadet de l'académie de police HOLT, apprenti netrunner. Le
personnage du joueur. **Sérieux, sur la défensive, intelligent** : il en sait plus qu'il ne
le montre. Pas un héros : un adolescent sous pression le jour de son examen.

## Composition

- Tête et épaules, visage de trois quarts léger vers la gauche (≈ 15°), **regard dans
  l'objectif**.
- Yeux à 38 % de la hauteur ; sommet du crâne à ~8 % ; épaules coupées par le bas du cadre.
- Fond : aplat d'encre ; **halo tramé bleu `#4fc3f7`** en haut à droite, qui s'éteint vers le
  noir.
- Un **port neural** discret derrière l'oreille gauche (petit rectangle métallique cerclé),
  visible mais pas central.

## Lumière et couleur

- Lumière principale dure en haut à gauche (blanc os) : la moitié droite du visage dans
  l'aplat noir, modelé en trame.
- Contre-jour **bleu** du personnage sur l'arête droite des cheveux et de l'épaule.
- L'unique accent rouge : un filet sur le bord des épaulettes, légèrement décalé du trait
  (repérage).

## À éviter

Texte sur les bandes (« FRANKLYN », « HOLT ACADEMY ») — les bandes restent des rectangles
gris sans lettres ; sourire ; expression de colère exagérée ; cheveux trop longs ; implants
visibles ailleurs que derrière l'oreille ; tout rendu photo.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Head-and-shoulders portrait of Franklyn, a 17-year-old police academy cadet and apprentice
netrunner. Short dark brown messy hair with a short fringe, light skin with freckles,
grey-hazel eyes, furrowed brows, tight-lipped serious and defensive expression, looking
straight at the viewer, face turned slightly left. Black-blue zip-up cadet jacket with a
high collar and segmented armored shoulder plates, plain grey name tapes and shield-shaped
shoulder patches with NO lettering. A small discreet metal neural port behind his left ear.
Solid ink-black background with a halftone glow in sky blue (#4fc3f7) in the upper right,
fading to black. Hard key light from upper left, sky-blue rim light on the right edge of
hair and shoulder, thin printing-red accent along the shoulder plates. Portrait 3:4, eyes at
38% of the height, top of the head near the top edge, shoulders cropped by the bottom edge.
```

## Critères d'acceptation

- Reconnaissable à côté de `Frankly.png` : coiffure, taches de rousseur, sourcils froncés.
- Lisible réduit à 52 × 52 : la silhouette de la coiffure et le froncement restent nets.
- Style conforme au bloc de style ; **c'est cette image qui définit le style de toutes les
  autres** : trait, densité de noir, trame, repérage rouge doivent être assumés et nets.
- Aucune lettre nulle part.
