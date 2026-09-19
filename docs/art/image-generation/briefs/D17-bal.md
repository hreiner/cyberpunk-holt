# D17 — Salle des fêtes, uniformes de gala (Le bal)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/bal.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D17-bal.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch1.bal`, carte de titre « Salle des fêtes — Le bal » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/mcherson.png` | uniquement la **qualité de la lumière néon NCPD bleue**, pour l'éclairage institutionnel de la salle | le visage de Mac Pherson (il n'apparaît pas dans ce décor), le texte de l'enseigne |
| `../../Reference_pictures/cadets.png` | les **silhouettes et l'uniforme de cérémonie** (veste à revers, cravate, galons — cf. Letitia) comme base des figurants lointains en gala | le rendu photo, le cadre et les noms |

## Le sujet

La salle des fêtes où se clôt le chapitre : le directeur annonce les notes d'examen pratique
un par un, les instructeurs commentent, les amis réagissent. D'après
[`ch1.bal.json`](../../../../src/data/dialogues/ch1.bal.json) : « Les lumières de la salle des
fêtes se reflètent sur les uniformes de gala » ; une estrade, une tablette à la main du
directeur. Festif mais toujours institutionnel — jamais un bal débridé.

## Composition

- Format 21:9. Deux tiers supérieurs : une salle réaffectée pour l'occasion (un hangar ou un
  gymnase habillé), une **estrade** au fond, une **guirlande de lumières** tendue en travers du
  plafond, quelques silhouettes lointaines en uniforme de gala (veste à revers, cravate) qui
  dansent ou discutent, en aplat, jamais de visage net.
- Tiers inférieur calme et sombre : le bord de la piste, dans l'ombre.
- Point de vue à hauteur d'homme, en léger retrait de la piste, l'estrade dans l'axe au fond.

## Lumière et couleur

- Guirlande de lumières tendue au plafond : petits points blanc-os réguliers, jamais un bloom
  diffus.
- Éclairage NCPD bleu-violet institutionnel sur les murs du fond, avec parcimonie — la salle
  reste une salle d'académie, pas une boîte de nuit.
- Un seul accent rouge : un projecteur de scène ou un drapé sur l'estrade.
- Palette désaturée : gris-bleu de la salle, noir des uniformes de gala, guirlande en points
  blanc-os.

## À éviter

Ambiance de boîte de nuit ou néon synthwave saturé ; visages reconnaissables au premier plan ;
confettis ou décor trop festif — l'institution garde la main sur la soirée ; texte sur
l'estrade ou les banderoles ; bloom sur la guirlande.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a repurposed hall serving as a police-academy graduation dance: a
raised stage at the far end, a string of small warm-white lights strung across the ceiling
(rendered as distinct points, no diffuse bloom), a few distant flat silhouettes of cadets in
formal ceremonial uniforms (lapelled jackets, ties) dancing or talking near the edges, no
readable faces. Sparse blue-violet institutional utility lighting on the back walls -- festive
but still clearly an institution, not a nightclub. A single red accent: a stage spotlight gel
or a draped banner on the stage, no text on it. 21:9 aspect ratio, visual interest in the upper
two-thirds, a calm dark lower third, floor line around 60-65% of the height, eye-level
viewpoint set back from the dance floor with the stage in line at the far end.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- Ambiance festive mais institutionnelle, jamais synthwave ou boîte de nuit.
- Aucun visage reconnaissable, un seul accent rouge, aucun texte.
