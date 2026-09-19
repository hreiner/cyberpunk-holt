# D13 — Salle 1, fumée et porte à panneau (La porte et le chien)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/salle1.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D13-salle1.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch1.salle1`, carte de titre « Salle 1 — La porte et le chien » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/zoneexercicetactique.png` | uniquement la **matière et la palette** du bâtiment (béton taché, tôle, acier industriel) : il n'y a pas de photo d'intérieur, la salle est **inventée** dans la continuité de cette matière | le rendu photo, le texte, la vue extérieure elle-même |

## Le sujet

Le premier module d'examen : une porte verrouillée par un panneau électronique, de la fumée qui
s'infiltre, un bruit de course au loin — le chien et l'otage, hors champ dans ce décor (ils
appartiennent à la mise en scène du dialogue, pas au bandeau). D'après
[`ch1.salle1.json`](../../../../src/data/dialogues/ch1.salle1.json).

## Composition

- Format 21:9. Deux tiers supérieurs : un couloir industriel étroit, une **porte à panneau de
  verrouillage électronique** au centre, grilles d'aération d'où s'échappe de la fumée, poteaux
  structurels dans la pénombre du fond.
- Tiers inférieur calme et sombre : le sol, dans l'ombre et la fumée basse.
- **Aucune silhouette nette de chien ni d'otage** : au loin, tout au plus une forme basse et
  floue qui suggère un mouvement, jamais assez précise pour se lire comme un animal ou une
  personne précise — la rencontre elle-même appartient au dialogue, pas au décor.
- Point de vue à hauteur d'homme, face à la porte.

## Lumière et couleur

- Lumière industrielle dure, blanc-os, filtrée et diffusée par la fumée (rendue en trame et
  hachures, jamais en brouillard photographique).
- Un voyant du panneau de verrouillage en cyan radio `#45d4e6`, clignotant à l'arrêt.
- Un seul accent rouge : un voyant d'alarme au-dessus de la porte.
- Palette désaturée : gris-brun de la fumée, acier terni du couloir.

## À éviter

Chien ou otage rendus lisibles et détaillés dans le décor (ils appartiennent à la scène du
dialogue) ; texte sur le panneau ; sang ou violence ; brouillard photographique lisse — la
fumée reste en trame.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a narrow derelict industrial corridor inside a police training site:
a locked door with an electronic panel at its center, smoke seeping from ceiling vents, faint
structural pillars fading into shadow at the far end. Only a vague, low, blurred shape barely
suggests movement far in the background -- never sharp enough to read as a specific animal or
person. Hard industrial white-bone light filtering through the smoke, rendered as halftone
haze rather than photographic fog. A small radio-cyan (#45d4e6) indicator light blinking on the
locked door panel. A single red accent: an alarm light above the door. 21:9 aspect ratio,
visual interest in the upper two-thirds, a calm dark lower third, floor line around 60-65% of
the height, eye-level viewpoint facing the door.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- La fumée reste en trame/hachures, jamais un brouillard photographique lisse.
- Aucune silhouette de chien ou d'otage lisible, aucun texte, un seul accent rouge.
