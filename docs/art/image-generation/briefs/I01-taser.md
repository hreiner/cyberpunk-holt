# I01 — Pistolet taser d'exercice

| | |
|---|---|
| **Fichier livré** | `public/assets/icons/taser.png` — 256 × 256 PNG, fond transparent |
| **Master** | 1024 × 1024 PNG, `art-masters/I01-taser.png` |
| **Lot** | D — écran titre, emblème, icônes |
| **Utilisé dans le jeu** | icône d'objet du combat tactique (l'un des trois objets partagés de l'examen pratique — touché = immobilisé jusqu'à un soin) |

## Références

Aucune référence photo : objet inventé selon les règles d'icônes de
[`STYLE-BIBLE.md`](../STYLE-BIBLE.md#les-icônes-dobjets), en cohérence avec ADR 0003 (pas
d'arme létale braquée dans le chapitre 1).

## Le sujet

Le pistolet taser d'exercice partagé par les deux équipes lors du parcours intérieur : une arme
non létale d'entraînement, clairement marquée comme telle, jamais une arme à feu réaliste.

## Composition

- Objet seul, vu de trois quarts, occupant l'essentiel du cadre carré.
- Silhouette compacte de pistolet à impulsion : corps trapu, deux électrodes courtes et
  émoussées à l'avant (pas un long canon fin façon arme à feu), poignée large.
- **Marquages d'exercice jaune et noir** (bandes obliques ou pastille) sur le corps de l'arme —
  le signe visuel immédiat qu'il s'agit de matériel d'entraînement, pas létal.

## Lumière et couleur

- Trait d'encre épais, modelé en trame légère.
- **Un seul accent de couleur** : le jaune/ruban `#f2c230` des marquages d'exercice — pas de
  rouge ici, pour ne pas le confondre avec un objet d'alerte.
- Fond entièrement transparent.

## À éviter

Silhouette d'arme à feu létale réaliste (canon long, chargeur visible) ; sang ou menace ;
texte ou logo sur le corps de l'arme ; couleurs hors de l'accent jaune choisi.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

A single non-lethal training taser pistol, viewed from a three-quarter angle, isolated on a
transparent background. Compact stun-gun silhouette: a stocky body, two short blunt training
electrodes at the front (not a long realistic firearm barrel), a wide grip. Yellow-and-black
(#f2c230) diagonal training-markings stripes on the body as the single color accent, clearly
signaling exercise equipment rather than a lethal weapon. Bold black ink outline with light
halftone dot shading for the form, no other color anywhere. No text, no logo. Square canvas,
transparent background, object filling most of the frame.
```

## Critères d'acceptation

- Lisible comme une arme d'exercice non létale, pas une arme à feu réaliste.
- Lisible à 32 px : silhouette compacte et marquages jaune/noir reconnaissables.
- Fond transparent, aucun texte, un seul accent de couleur (jaune).
