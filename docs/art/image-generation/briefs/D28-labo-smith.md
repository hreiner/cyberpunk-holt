# D28 — Le labo de Smith (Scène 5, le détour facultatif)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/labo-smith.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D28-labo-smith.png` |
| **Lot** | E — chapitre 2, décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.smith` (détour facultatif de la scène `ch2.conduits`, B14) |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/LaboSmith.png` | **uniquement l'atelier** : établis encombrés, écrans de diagnostic muraux, machine de simulation articulée au fond, câblage dense, éclairage vert-cyan technique | le personnage présent sur la photo (ce n'est pas Smith : elle est rousse et porte des lunettes, cf. `instructeurs.png` et le portrait déjà livré `public/assets/portraits/smith.webp`) — cette référence ne sert qu'à l'architecture du lieu |

## Le sujet

« Smith, blessée, dans son labo, fixe le rendez-vous au Blue Purple, puis des tirs forcent le
demi-tour. » (GAME-DESIGN §4, scène 5). Le labo souterrain de Smith, accessible par un détour
facultatif dans les conduits (B14, TECH-DESIGN §4.4, `ch2.smith.json`). Smith elle-même est un
portrait déjà livré (P13) — ce décor ne montre que le lieu, vide de personnage.

## Composition

- Format 21:9. Établis encombrés d'outils et de pièces mécaniques, écrans de diagnostic corporel
  muraux (silhouettes humaines stylisées, aucun texte médical lisible).
- Une machine articulée au fond — la « machine de la simulation » du jeu — bras et rails
  industriels, éclairée depuis l'intérieur.
- Câblage dense au plafond et sur les murs, quelques néons de secours.
- Tiers inférieur calme et sombre : le sol de l'atelier, outils au sol en silhouette.
- Aucun personnage dans le décor.

## Lumière et couleur

- Lumière principale technique : vert-cyan radio `#45d4e6`, venant des écrans, dure et localisée.
- Un seul accent rouge : un voyant d'alerte sur la machine ou un établi.
- Palette désaturée gris-métal et cyan technique, aucune couleur chaude dominante.

## À éviter

Tout texte lisible sur les écrans ou les caisses ; personnage dans le décor (c'est un lieu, pas
une scène jouée) ; sang (Smith est blessée hors champ, cela se joue dans le texte) ; bloom sur les
écrans.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide interior shot of an underground technical workshop: cluttered workbenches with tools and
mechanical parts, wall-mounted diagnostic screens showing stylized human body silhouettes with NO
readable text, a large articulated machine at the far end on industrial rails, lit from within.
Dense cabling on the ceiling and walls, a few emergency strip lights. No characters present in
the shot. Cold cyan-green technical key light from the screens, a single red accent from a warning
light on the machine or a workbench. Desaturated grey-metal and cyan palette, no dominant warm
color. 21:9 aspect ratio, visual interest in the upper two-thirds, a calm dark lower third of
workshop floor and tools.
```

## Critères d'acceptation

- L'atelier et sa machine articulée sont reconnaissables comme lieu face à `LaboSmith.png`
  (architecture et éclairage seulement, pas le personnage qui y figure).
- Aucun personnage, aucun sang, aucun texte lisible.
- Un seul accent rouge, aucun bloom.
