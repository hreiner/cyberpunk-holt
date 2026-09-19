# D14 — Salle 2, l'armoire sécurisée (Le choix coûteux)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/salle2.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D14-salle2.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch1.salle2`, carte de titre « Salle 2 — Le choix coûteux » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/zoneexercicetactique.png` | uniquement la **matière et la palette** du bâtiment (béton taché, tôle, acier industriel) : il n'y a pas de photo d'intérieur, la salle est **inventée** dans la continuité de cette matière | le rendu photo, le texte, la vue extérieure elle-même |

## Le sujet

La deuxième salle d'examen : le dilemme du chapitre. Une armoire blindée à triple combinaison
d'un côté, une porte close droit en face de l'autre. D'après
[`ch1.salle2.json`](../../../../src/data/dialogues/ch1.salle2.json) : « L'armoire ou la porte,
il faut choisir. »

## Composition

- Format 21:9. Deux tiers supérieurs : l'**armoire sécurisée**, blindée, à triple cadran de
  combinaison, posée comme le **point focal net** de l'image sur un côté du cadre ; en face,
  dans l'axe, une porte close à boîtier électronique standard.
- Tiers inférieur calme et sombre : le sol industriel entre les deux, dans l'ombre.
- Aucun personnage.
- Point de vue à hauteur d'homme, légèrement de côté pour que l'armoire et la porte soient
  toutes deux lisibles sans se chevaucher.

## Lumière et couleur

- Lumière industrielle dure, blanc-os, concentrée sur l'armoire comme point d'intérêt principal
  (légère mise en valeur, sans bloom).
- Un voyant de statut sur l'armoire en cyan radio `#45d4e6`.
- Un seul accent rouge : un scellé ou une étiquette de sécurité sur l'armoire, en aplat.
- Palette désaturée : acier gris-vert de l'armoire, béton brut du reste de la pièce.

## À éviter

Texte sur l'armoire ou la porte ; contenu de l'armoire visible (elle reste fermée dans ce
décor) ; personnages ; bloom sur le voyant de statut.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a bare industrial exam room inside a derelict training facility: a
heavy armored security locker with a triple combination dial as the clear focal point on one
side of the frame, and directly opposite it a closed door fitted with a standard electronic
lock panel. Bare concrete floor and walls between them. Hard industrial white-bone light
subtly emphasizing the locker as the main point of interest, no bloom. A small radio-cyan
(#45d4e6) status light on the locker. A single red accent: a flat security seal or tag on the
locker door, no text anywhere. 21:9 aspect ratio, visual interest in the upper two-thirds, a
calm dark lower third, floor line around 60-65% of the height, eye-level viewpoint angled so
both the locker and the door read clearly without overlapping.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- L'armoire sécurisée se lit immédiatement comme le point focal de l'image, la porte reste
  lisible en second plan.
- Aucun personnage, aucun texte, un seul accent rouge.
