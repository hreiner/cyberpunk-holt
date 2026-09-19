# D03 — Salles d'entraînement changées en salle d'examen (Examen écrit, Tirage)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/salle-examen.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D03-salle-examen.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau des dialogues `ch1.exam` et `ch1.tirage`, carte de titre « Salles d'entraînement — Examen écrit » et « — Le tirage » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/holtacademy.png` | l'existence et la position des « Salles d'entraînement 13-17 ans » (grand plateau : agrès au sud-ouest, cercle de combat au centre, bancs au sud-est), reconverties pour l'examen | le rendu de plan d'architecte lui-même |

## Le sujet

Le grand plateau d'entraînement de l'académie, provisoirement rangé en salle d'examen : rangées
de pupitres sur le sol du dojo, agrès de sport repoussés sur le côté, un **cercle de combat**
peint au sol toujours visible au centre — la salle sert aussi au tirage des équipes juste
après. D'après [`ch1.exam.json`](../../../../src/data/dialogues/ch1.exam.json) : « la salle
d'examen sent le papier neuf ».

## Composition

- Format 21:9. Deux tiers supérieurs : rangées de pupitres en perspective, structure métallique
  du plateau (poutres, rampes de lumière), agrès de sport (barres, cadre d'escalade) repoussés
  contre le mur du fond.
- Tiers inférieur calme et sombre : les premiers pupitres vides, dans l'ombre.
- Le **cercle de combat** peint au sol reste visible comme un motif circulaire simple sous les
  pupitres, sans inscription.
- Aucun personnage identifiable ; au loin, une silhouette de surveillant debout au fond de la
  salle, non détaillée.
- Point de vue à hauteur d'homme, entre les rangées de pupitres.

## Lumière et couleur

- Lumière dure, blanc-os, tombant de rampes zénithales industrielles.
- Touches d'éclairage bleu-violet institutionnel sur les structures métalliques, avec
  parcimonie.
- Un seul accent rouge : une ligne de signalétique au sol ou un extincteur mural.
- Palette désaturée : béton et acier, aucune couleur vive hors accent.

## À éviter

Visage reconnaissable ; texte sur les pupitres ou les copies ; ambiance de salle de classe
scolaire ordinaire (garder le caractère industriel du plateau d'entraînement) ; bloom.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a large industrial police-academy training hall temporarily
converted into an exam room: rows of plain desks arranged on the floor, gymnastic training
equipment (climbing frame, parallel bars) pushed against the back wall, a simple circular
combat-ring outline painted on the floor visible beneath the desks, exposed steel roof trusses
and overhead light rigs. A single distant unreadable silhouette of a proctor standing at the
back of the room. Hard white-bone light from industrial overhead fixtures, sparse blue-violet
institutional utility lighting on the steel structure. A single red accent: a wall-mounted fire
extinguisher or a floor safety line. 21:9 aspect ratio, visual interest in the upper
two-thirds, a calm dark lower third, floor line around 60-65% of the height, eye-level
viewpoint between the desk rows.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- Le cercle de combat au sol et les agrès repoussés se lisent clairement comme un plateau
  d'entraînement reconverti, pas une salle de classe ordinaire.
- Aucun visage reconnaissable, un seul accent rouge, aucun texte.
