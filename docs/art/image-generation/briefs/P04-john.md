# P04 — Portrait de John

| | |
|---|---|
| **Fichier livré** | `public/assets/portraits/john.webp` — 600 × 800 WebP, q85 |
| **Master** | 1200 × 1600 PNG, `art-masters/P04-john.png` |
| **Lot** | B — les portraits |
| **Utilisé dans le jeu** | grand portrait du dialogue (260 × 347), fiche du HUD tactique, vignette de réplique (52 × 52), écran du tirage |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/john.png` | le visage (mâchoire carrée, yeux bleu pâle, regard intense et buté), les cheveux blond platine rasés courts, la peau très claire, le blouson zippé à col chemise | le rendu photo, la lettre « N » coupée en haut à gauche (artefact de capture), **tout le texte** des bandes et écussons |
| `../../Reference_pictures/cadets.png` (case « John ») | la cohérence de l'uniforme avec le reste de la promotion | le rendu photo, le cadre et les noms |

## Le sujet

John, dix-sept ans, cadet de l'académie HOLT, le combattant, le plus proche de Franklyn.
**Intense, buté, mâchoire serrée** : solitaire, dur avec lui-même. **Le seul cadet sans
neuroport** — un détail qui ne se voit pas au portrait (pas d'implant à dessiner), mais qui
compte : ne rien ajouter derrière son oreille.

## Composition

- Tête et épaules, visage de trois quarts léger, **mâchoire serrée**, regard fixe et buté droit
  dans l'objectif — jamais de sourire.
- Yeux à 38 % de la hauteur ; sommet du crâne à ~8 % ; épaules coupées par le bas du cadre.
- Cheveux blond platine très courts, presque rasés : la silhouette doit rester nette même très
  réduite (contraste fort peau claire / cheveu clair contre le fond noir — jouer surtout sur le
  modelé du crâne et les sourcils).
- Fond : aplat d'encre, **halo tramé gris clair `#e0e0e0`** en haut à droite, qui s'éteint vers
  le noir.

## Lumière et couleur

- Lumière principale dure en haut à gauche (blanc os) : la moitié droite du visage dans l'aplat
  noir, modelé en trame.
- Contre-jour **gris clair, presque blanc froid** du personnage sur l'arête droite du crâne et
  de l'épaule — le rim light le plus neutre de la promotion, pour un personnage sans couleur
  d'implant ni de chaleur.
- L'unique accent rouge : un filet fin sur le bord de l'épaulette ou du col, légèrement décalé
  du trait (repérage).

## À éviter

**Aucun port neural derrière l'oreille** — c'est le seul cadet qui n'en a pas ; texte sur les
bandes et écussons ; sourire ou expression adoucie ; cheveux plus longs que le ras référencé ;
tout rendu photo.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Head-and-shoulders portrait of John, a 17-year-old police academy cadet, the class's best
fighter. Very short platinum-blond buzzcut hair, very light skin, pale blue eyes, square jaw,
clenched jaw muscles, intense stubborn hardened expression, looking straight at the viewer,
face turned slightly. Black-blue zip-up cadet jacket with a shirt-style collar, plain grey
name tape and shield-shaped shoulder patches with NO lettering. No implant or port of any kind
visible behind the ears. Solid ink-black background with a halftone glow in pale cool grey
(#e0e0e0) in the upper right, fading to black. Hard key light from upper left, cool pale-grey
rim light on the right edge of head and shoulder, thin printing-red accent along the shoulder
plate edge. Portrait 3:4, eyes at 38% of the height, top of the head near the top edge,
shoulders cropped by the bottom edge.
```

## Critères d'acceptation

- Reconnaissable à côté de `john.png` : buzzcut platine, mâchoire carrée, regard buté.
- Lisible réduit à 52 × 52 : le contraste crâne clair / fond noir et le froncement restent
  nets.
- Style conforme à l'ancre P01.
- Aucune lettre nulle part, aucun implant derrière l'oreille.
