# E01 — Emblème de l'académie, sans lettres

| | |
|---|---|
| **Fichier livré** | `public/assets/ui/emblem.png` — 1024 × 1024 PNG, fond transparent |
| **Master** | 2048 × 2048 PNG, `art-masters/E01-embleme.png` (pas de downscale supplémentaire au-delà du livré : la bible ne fixe pas de résolution de livraison distincte pour l'emblème, à la différence des icônes — voir remarque ci-dessous) |
| **Lot** | D — écran titre, emblème, icônes |
| **Utilisé dans le jeu** | écusson de l'interface (écran titre, en-têtes, HUD tactique), partout où l'identité visuelle de l'académie doit apparaître sans texte |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Frankly.png` | la forme générale de l'écusson d'épaule (bouclier arrondi en bas) et son motif interne, visible mais illisible en petit | tout le texte (« NCPD », « HOLT ACADEMY ») |
| `../../Reference_pictures/john.png` | le motif à **étoile orange** sur l'écusson de poitrine | tout le texte |
| `../../Reference_pictures/cadets.png` | la cohérence générale du motif à travers les écussons de la promotion (trois flèches/colonnes verticales) | le rendu photo, le texte, le cadre |

## Le sujet

Le blason de l'académie HOLT, tel qu'il apparaît en miniature sur tous les écussons des cadets,
mais ici **isolé, agrandi et nettoyé de tout texte** pour servir d'élément d'interface. Motif de
base : trois flèches ou colonnes verticales ascendantes, avec une petite étoile orange.

## Composition

- Bouclier de police classique (haut rectangulaire, base arrondie en pointe), format carré,
  sujet seul, fond **transparent**.
- Motif central : **trois flèches ou colonnes verticales** parallèles pointant vers le haut,
  légèrement convergentes, façon écussons de la référence — traitées comme un dessin au trait
  encré, jamais comme un pictogramme plat.
- Une **petite étoile à cinq branches orange**, en haut au centre ou au sommet du bouclier,
  seule touche de couleur du motif avec le rouge d'accent.
- Contour du bouclier en trait noir épais, motif intérieur en trait plus fin avec un peu de
  trame légère pour le modelé (pas un aplat plat façon logo vectoriel).

## Lumière et couleur

- Pas de fond, donc pas de contre-jour : le modelé vient uniquement du trait et d'une légère
  trame en dégradé simulé (halftone), comme si le blason était gravé et légèrement éclairé de
  la gauche.
- Palette : encre noire pour le trait, os `#efe4d4` pour les surfaces claires du blason, petite
  étoile en orange (teinte proche de celle de Grover, `#ffb74d`, cohérente avec la référence),
  **un seul accent rouge** d'imprimerie sur un détail du contour, légèrement décalé.

## À éviter

**Aucune lettre, aucun chiffre, aucun sigle** — c'est un blason muet ; pas de fond, pas de
cadre carré visible autour du bouclier ; pas de rendu 3D ou métallique brillant ; pas de couleur
hors de la palette (pas de bleu, pas de violet).

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

A single police-academy shield-shaped emblem, isolated on a transparent background: a classic
badge silhouette (flat top, pointed rounded base), bold black ink outline with a lighter
inner-line halftone-shaded pattern of three tall converging upward-pointing arrows or columns,
and one small five-pointed orange (#ffb74d) star near the top of the shield. NO letters, NO
numbers, NO wordmark anywhere on the badge. Inked graphic-novel line art with visible halftone
dot shading for the modeling, warm bone white (#efe4d4) for the lit shield surfaces, ink black
(#140d0e) linework, a single thin printing-red (#e2262f) accent line on part of the outline,
slightly misregistered from the black line. No 3D render, no glossy metal look, no drop shadow,
no background, no border around the shield shape itself. Square canvas, transparent
background.
```

## Critères d'acceptation

- Aucune lettre, chiffre ou sigle nulle part sur le blason.
- Reconnaissable comme dérivé des écussons de `Frankly.png`, `john.png` et `cadets.png` (forme
  du bouclier, trois flèches/colonnes, étoile orange).
- Fond réellement transparent, pas de cadre carré ni d'ombre portée autour du bouclier.
- Lisible à 32 px comme à 1024 px.
