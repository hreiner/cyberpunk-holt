# D05 — Infirmerie & labo biomédical (Temps libre, Abigail)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/infirmerie.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D05-infirmerie.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau du hub de temps libre à l'infirmerie (`ch1.hub.abigail`), carte de titre « Infirmerie & labo biomédical » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/holtacademy.png` | l'existence et la position de l'« Infirmerie & labo biomédical » dans la colonne centrale des services | le rendu de plan d'architecte lui-même |

## Le sujet

L'infirmerie et son petit labo biomédical, où Abigail passe son temps libre à vérifier du
matériel médical — d'après [`ch1.hub.abigail.json`](../../../../src/data/dialogues/ch1.hub.abigail.json),
elle retape de vieux kits de soin avec des pièces détournées. Une pièce technique et propre, pas
un hôpital.

## Composition

- Format 21:9. Deux tiers supérieurs : une paillasse de labo le long d'un mur, étagères de
  matériel médical, un lit d'examen replié contre le mur du fond, écrans de contrôle biomédical.
- Tiers inférieur calme et sombre : le sol carrelé, dans l'ombre.
- Aucun personnage identifiable ; au loin, une silhouette penchée sur la paillasse, non
  détaillée.
- Point de vue à hauteur d'homme, depuis l'entrée de la pièce.

## Lumière et couleur

- Lumière blanche froide et stérile, blanc-os, uniforme au plafond.
- **Écrans de contrôle biomédical en cyan radio `#45d4e6`** sur la paillasse — l'usage typique
  de cette couleur rare, réservée aux écrans et appareils.
- Un seul accent rouge : une croix simple ou un voyant d'alerte sur une armoire à pharmacie,
  en aplat, sans texte.
- Palette désaturée : blanc cassé des murs, gris-bleu du mobilier médical.

## À éviter

Ambiance d'hôpital moderne aseptisé et lumineux façon photo médicale ; texte sur les étagères ou
les écrans ; visages reconnaissables ; sang ou matériel chirurgical menaçant.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of a small academy infirmary and biomedical lab: a workbench along one
wall cluttered with medical supplies, shelving with first-aid kits and spare parts, a folded
examination table against the back wall, small biomedical monitor screens glowing on the
bench. A single distant unreadable silhouette leaning over the workbench. Cold sterile
white-bone overhead light, radio-cyan (#45d4e6) glow from the monitor screens as the main
color note. A single red accent: a plain flat first-aid cross or warning light on a supply
cabinet, no text. 21:9 aspect ratio, visual interest in the upper two-thirds, a calm dark lower
third, floor line around 60-65% of the height, eye-level viewpoint from the doorway.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- Les écrans cyan se lisent comme la touche de couleur dominante de la pièce.
- Aucun visage reconnaissable, un seul accent rouge, aucun texte.
