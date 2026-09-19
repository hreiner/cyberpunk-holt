# D16 — Cour de containers (L'affrontement)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/cour-containers.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D16-cour-containers.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau de la scène d'entrée dans la cour tactique (avant le combat, franchissement du portail), carte de titre « Cour de containers — L'affrontement » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/vueexercicetactique.png` | **la composition et la palette de référence obligatoires** : allée de béton mouillé entre des containers rouillés jaune, vert, jaune moutarde, rouge, bleu, flaques, détritus, cartons, fûts, palettes, raffinerie et portique de grue au fond, lumière rasante de fin d'après-midi | le rendu photo, **tout le texte** (« AXTU 473088 », « KAZU », « HONEST STAN'S SELF-STORAGE ») |
| `../../Reference_pictures/mapexercicetactique.png` | la **disposition et l'échelle** des containers (vue de dessus, pour vérifier les proportions et l'alternance des couleurs) — sert de contrôle, pas de source visuelle directe | le rendu de carte quadrillée elle-même, le texte |

## Le sujet

La cour de containers où se joue l'affrontement final du chapitre — la seule scène du chapitre
1 déjà implémentée en combat tactique. Ce décor est le **bandeau d'ambiance** avant que le
combat ne bascule en vue tactique ; il doit annoncer visuellement la carte de combat sans la
reproduire au pixel près.

## Composition

- Format 21:9. Deux tiers supérieurs : une allée entre des containers rouillés de couleurs
  distinctes (jaune, vert, bleu, rouge — **désaturées de moitié**, comme le veut la palette de
  décor), empilements de fûts et de palettes, une raffinerie avec cheminées fumantes et un
  portique de grue au loin.
- Tiers inférieur calme et sombre : l'allée de béton mouillé au premier plan, avec des reflets
  de flaques rendus en aplats simples, dans l'ombre.
- Aucun personnage identifiable — les deux équipes n'apparaissent pas ici, ce décor précède
  leur entrée en scène.
- Point de vue à hauteur d'homme, dans l'allée, cadrage proche de celui de
  `vueexercicetactique.png`.

## Lumière et couleur

- Lumière rasante de fin d'après-midi, blanc-os, ombres longues portées par les containers.
- Couleurs locales des containers désaturées de moitié, fidèles à l'alternance de
  `vueexercicetactique.png` et à la disposition de `mapexercicetactique.png`.
- Un seul accent rouge : un des containers peut porter la teinte rouge de la bible (le container
  rouge de la référence sert de prétexte naturel à l'accent), à condition de rester le seul
  rouge net de l'image.
- Reflets de flaques en aplats tramés, jamais un rendu d'eau photoréaliste.

## À éviter

**Tout texte** sur les containers (numéros de série, marques) ; personnages ou combattants
visibles ; rouille et détritus excessivement détaillés façon photo ; bloom sur la lumière
rasante.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a rusted shipping-container yard used as a tactical training ground:
a wet concrete alley between weathered containers in half-desaturated yellow, green, blue and
red, stacked barrels and pallets, scattered crates and debris, a distant refinery with smoking
stacks and a gantry crane on the horizon. No people visible -- the yard is empty, waiting.
Raking late-afternoon white-bone light casting long hard shadows from the containers, puddle
reflections rendered as simple flat halftone shapes, never photorealistic water. NO readable
text, numbers or markings anywhere on the containers. A single red accent: one of the
containers carries the single printing-red tone of the palette. 21:9 aspect ratio, visual
interest in the upper two-thirds, a calm dark lower third, floor line around 60-65% of the
height, eye-level viewpoint down the alley, matching the framing of the ground-level reference.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- L'alternance de couleurs et la disposition des containers rappellent clairement
  `vueexercicetactique.png` et `mapexercicetactique.png`.
- Aucun texte sur les containers, aucun personnage, un seul accent rouge net.
