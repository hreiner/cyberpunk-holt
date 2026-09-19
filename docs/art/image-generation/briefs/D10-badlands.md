# D10 — Les Badlands par la vitre du fourgon (Trajet)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/badlands.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D10-badlands.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch1.fourgon`, carte de titre « Les Badlands — Le trajet » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/badlands.png` | **le cadrage complet** : vue subjective à travers une vitre de fourgon aux coins arrondis et au cadre noir, le désert ocre caillouteux, le campement de pillards à mi-distance (jeeps, tente, drapeau noir à tête de mort, antenne), la silhouette brumeuse de Night City à l'horizon | le rendu photo, la brume et le grain photographiques — à traduire en trame et aplats |

## Le sujet

Le trajet en fourgon à travers les Badlands, jusqu'au centre d'examen désaffecté. D'après
[`ch1.fourgon.json`](../../../../src/data/dialogues/ch1.fourgon.json) : carcasses de véhicules,
panneaux publicitaires éventrés, et — pour qui réussit un jet de Perception — un campement de
pillards au loin. **Seule fiche de décor où le cadre fait partie du sujet** : la vitre du
fourgon est un élément diégétique de la scène, pas une bordure décorative interdite par la
bible de style.

## Composition

- Format 21:9, mais l'image reprend la **vitre de fourgon aux coins arrondis et au cadre noir
  épais** de la référence, occupant la quasi-totalité du cadre — c'est elle qui structure toute
  l'illustration.
- À travers la vitre : désert ocre caillouteux à perte de vue, un **campement de pillards** à
  mi-distance (deux ou trois véhicules tout-terrain en silhouette, une tente, un drapeau sombre
  sur un mât, une antenne) — assez loin pour rester une silhouette, jamais un personnage
  identifiable.
- **Silhouette de Night City** brumeuse à l'horizon, tours en aplat sombre contre le ciel.
- Ligne d'horizon vers 60-65 % de la hauteur de la vitre.

## Lumière et couleur

- Ciel poussiéreux, désaturé, blanc-os à bleu-gris pâle vers le zénith.
- Désert en ocre désaturé de moitié (couleur locale du lieu, comme prévu par la bible pour les
  décors).
- Un seul accent rouge : le drapeau ou un point lumineux sur un véhicule du campement.
- Le cadre de la vitre reste en aplat d'encre noire, avec un léger reflet tramé dessus (jamais
  de reflet photographique complexe).

## À éviter

Rendre le campement de pillards trop détaillé ou menaçant (silhouettes lointaines seulement) ;
ciel bleu éclatant façon carte postale ; texte sur les panneaux publicitaires éventrés
mentionnés dans le dialogue (les garder hors-champ ou abstraits) ; bloom sur l'horizon.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Point-of-view shot through a police van's rounded side window with a thick black window frame
filling most of the image, looking out over the rocky ochre desert of the Badlands. A distant
raider encampment at mid-distance: two or three off-road vehicles in silhouette, a tent, a dark
flag on a pole, an antenna -- all distant and flat, never detailed enough to read as individual
people. A hazy skyline silhouette of a distant megacity on the horizon. Dusty pale desaturated
sky, half-desaturated ochre desert ground, horizon line around 60-65% of the window's height. A
single red accent: a glint of light or a red marking on one of the distant vehicles. The window
frame itself rendered as a flat ink-black shape with a faint halftone reflection, not a
realistic photographic reflection. 21:9 aspect ratio.
```

## Critères d'acceptation

- Le cadrage de la vitre de fourgon de `badlands.png` (coins arrondis, cadre noir épais) est
  clairement reconnaissable.
- Campement de pillards et skyline lointaine lisibles comme silhouettes, jamais comme
  personnages détaillés.
- Un seul accent rouge, aucun texte, aucun panneau publicitaire lisible.
