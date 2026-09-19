# D15 — Salle 3, gaz et ordinateur (Le gaz et la vidéo)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/salle3.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D15-salle3.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch1.salle3`, carte de titre « Salle 3 — Le gaz et la vidéo » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/zoneexercicetactique.png` | uniquement la **matière et la palette** du bâtiment (béton taché, tôle, acier industriel) : il n'y a pas de photo d'intérieur, la salle est **inventée** dans la continuité de cette matière | le rendu photo, le texte, la vue extérieure elle-même |

## Le sujet

La troisième salle, verrouillée derrière l'équipe : un gaz irritant envahit la pièce, un
terminal encore allumé trône au centre, la sortie fait face. D'après
[`ch1.salle3.json`](../../../../src/data/dialogues/ch1.salle3.json) : rester permet de voir le
parcours de l'équipe adverse sur l'écran, au prix de la forme physique.

## Composition

- Format 21:9. Deux tiers supérieurs : un **terminal informatique** au centre de la pièce, son
  écran allumé comme point focal net, une **brume de gaz verdâtre** qui envahit la pièce depuis
  des bouches d'aération au plafond, la porte de sortie verrouillée visible au fond en face.
- Tiers inférieur calme et sombre : le sol, noyé dans le bas de la brume de gaz.
- Aucun personnage.
- Point de vue à hauteur d'homme, face au terminal, la sortie dans l'axe au loin.

## Lumière et couleur

- La brume de gaz, verdâtre et désaturée (couleur locale exceptionnelle de cette salle, en
  aplats et trame, jamais un brouillard photographique lisse), envahit progressivement le bas
  du cadre.
- **L'écran du terminal en cyan radio `#45d4e6`**, seule source de lumière franche de la pièce
  avec la lumière principale — c'est le point le plus lumineux et le plus net de l'image.
- Un seul accent rouge : un voyant d'alarme de verrouillage sur la porte du fond.
- Le reste de la palette reste sombre et désaturé pour que le vert du gaz et le cyan de l'écran
  ressortent sans se confondre avec un accent rouge supplémentaire.

## À éviter

Gaz représenté comme un brouillard photographique lisse — il reste en aplats et trame ; texte
ou image lisible sur l'écran du terminal (juste une lueur cyan, pas un contenu détaillé) ;
personnages ; deuxième source rouge en plus du voyant d'alarme.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a sealed industrial exam room: a computer terminal at the center of
the room with its screen glowing as the clear focal point, a sickly desaturated green gas haze
drifting down from ceiling vents and pooling near the floor, a locked exit door visible at the
far end. Bare concrete floor and walls. The gas haze rendered as flat shapes and halftone
texture, never a smooth photographic fog. The terminal screen glows radio-cyan (#45d4e6), the
brightest and sharpest element in the room alongside the key light. A single red accent: a
locked-door alarm light at the far end. Rest of the palette kept dark and desaturated so the
green gas and cyan screen read clearly without a second red competing with the alarm light.
21:9 aspect ratio, visual interest in the upper two-thirds, a calm dark lower third, floor line
around 60-65% of the height, eye-level viewpoint facing the terminal with the exit in line
behind it.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- Le gaz verdâtre et l'écran cyan du terminal se lisent immédiatement comme les deux éléments
  clés de la pièce.
- Un seul accent rouge (le voyant d'alarme), aucun texte, aucun personnage.
