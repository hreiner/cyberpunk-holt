# D01 — Dortoirs 13-17 ans, à l'aube (Réveil)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/dortoirs.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D01-dortoirs.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch1.intro` (Réveil), carte de titre « Dortoirs — Réveil » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/holtacademy.png` | l'existence et la position du bâtiment « Dortoirs 13-17 ans » dans l'aile est de l'académie (zone première génération), le vocabulaire architectural général du complexe (béton, enceinte) | le rendu de plan d'architecte lui-même — il n'y a pas de photo d'intérieur de référence, la pièce est **inventée** à partir du texte du dialogue et de la bible de style |

## Le sujet

Le dortoir 3, où dort Franklyn parmi dix-neuf autres cadets. D'après
[`ch1.intro.json`](../../../../src/data/dialogues/ch1.intro.json) : lits superposés en rangées,
plafond en béton brut, aube naissante, quelques silhouettes déjà debout qui commencent à
s'habiller. Une pièce spartiate, collective, disciplinée — la première image du jeu.

## Composition

- Format 21:9. L'intérêt dans les **deux tiers supérieurs** : rangées de lits superposés en
  perspective fuyante vers le fond, casiers métalliques au mur du fond.
- **Tiers inférieur calme et sombre** : l'allée centrale entre les lits, dans l'ombre.
- Ligne de sol vers 60-65 % de la hauteur.
- Aucun personnage identifiable au premier plan : au loin, deux ou trois **silhouettes en aplat**
  qui s'habillent près de leur lit, jamais de visage net ni de portrait reconnaissable.
- Point de vue à hauteur d'homme, dans l'allée centrale, en regardant vers le fond du dortoir.

## Lumière et couleur

- Aube naissante : une lumière froide, blanc-os, entre par des ouvertures hautes et étroites en
  haut du mur du fond, en faisceaux nets (pas de bloom).
- Léger éclairage utilitaire NCPD bleu-violet (zone première génération), sur les montants
  métalliques des lits, utilisé avec parcimonie.
- Un seul accent rouge : une petite diode ou un panneau de sortie de secours au fond du couloir.
- Palette désaturée : gris béton, bleu-gris de la literie, aucune couleur vive.

## À éviter

Visages ou portraits reconnaissables au premier plan ; dortoir désordonné ou sale — l'académie
est stricte et propre ; lumière chaude et douillette (garder froid et dur) ; texte sur les
casiers ; bloom ou flou photographique.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a spartan police-academy dormitory at dawn: long rows of steel
bunk beds receding toward the back wall, bare raw concrete ceiling and walls, metal lockers
along the far wall, a central aisle in shadow in the foreground. Two or three distant flat
silhouettes of cadets getting dressed near their beds, no readable faces. Cold pale dawn light
entering through narrow high windows in hard shafts, sparse blue-violet institutional utility
lighting on the bed frames. A single small red accent: an exit sign glow at the far end of the
room. 21:9 aspect ratio, the visual interest in the upper two-thirds, a calm dark lower third,
floor line around 60-65% of the height, eye-level viewpoint looking down the central aisle.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- Aucun visage ni silhouette reconnaissable au premier plan.
- Lisible comme un dortoir d'académie de police spartiate, pas un dortoir scolaire ordinaire.
- Un seul accent rouge, aucun texte.
