# D18 — La photo de classe (Scène 1, la photo souvenir)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/photo-souvenir.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D18-photo-souvenir.png` |
| **Lot** | E — chapitre 2, décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.photo` (nœud `photo`), réemployée au bilan de fin de chapitre avec Zachary estompé (B23, lots 5.4/5.6) |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/photosouvenir.png` | le **cadrage de groupe** dans un couloir de l'académie, les six cadets serrés les uns contre les autres, sourires, néon bleu institutionnel en arrière-plan | le rendu photo, les bandes nominatives lisibles (« Abigail », « Franklyn »…), les écussons détaillés |
| `../../Reference_pictures/cadets.png` | les silhouettes et coiffures des six cadets, pour rester cohérent avec les portraits déjà livrés (P01-P06) | le cadre, le texte |

## Le sujet

Le tout dernier geste avant que la nuit ne bascule : la photo de classe, prise dans un couloir de
l'académie HOLT, juste avant que la promotion ne se disperse vers la salle des fêtes. D'après
[`ch2.photo.json`](../../../../src/data/dialogues/ch2.photo.json) : « Une dernière image du
dernier jour, avant que la nuit ne commence vraiment. » Cette image est réemployée, assombrie et
avec Zachary estompé, en tête du bilan de fin de chapitre (B23) : elle doit donc rester lisible
même en vignette réduite.

## Composition

- Format 21:9. Les six cadets, groupés et souriants, occupent le centre et les deux tiers
  supérieurs — en silhouettes lointaines, aucun visage net au premier plan (les portraits parlent
  déjà ailleurs), mais des postures et coiffures reconnaissables en aplat.
- Couloir institutionnel de l'académie à l'arrière-plan : néons au plafond, portes métalliques,
  écussons flous.
- Tiers inférieur calme et sombre : le sol du couloir dans l'ombre.
- Point de vue frontal, à hauteur d'homme, léger recul façon photo de groupe.

## Lumière et couleur

- Lumière principale dure, blanc-os, du plafond du couloir.
- Contre-jour rouge RED discret sur un bord du groupe (lumière de sortie de secours).
- Un seul accent rouge : ce contre-jour ou un voyant au mur.
- Palette désaturée : gris-bleu institutionnel du couloir, noir des uniformes.

## À éviter

Visages reconnaissables au premier plan ; bandes nominatives ou écussons lisibles ; ambiance
festive prématurée (on n'est pas encore au bal) ; bloom sur les néons.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide group shot of six police-academy cadets huddled together for a class photo in an
institutional corridor, all smiling, ceiling neon strip lighting overhead, metal doors and blurred
shoulder patches in the background -- rendered as flat, distant silhouettes with recognizable
hairstyles and postures but no sharp individual faces. Hard white-bone key light from the
corridor ceiling, a single red rim-light accent on one edge of the group from an exit sign. 21:9
aspect ratio, visual interest in the upper two-thirds, calm dark lower third (the corridor floor
in shadow), frontal eye-level viewpoint, slight group-photo setback.
```

## Critères d'acceptation

- Reconnaissable comme une photo de groupe des six cadets, cohérente avec les portraits déjà
  livrés (silhouettes, coiffures).
- Reste lisible réutilisée en vignette assombrie au bilan (composition simple, contraste net).
- Aucune bande nominative ni écusson lisible, un seul accent rouge.
