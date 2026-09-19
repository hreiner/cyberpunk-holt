# I04 — Mine incapacitante

| | |
|---|---|
| **Fichier livré** | `public/assets/icons/mine.png` — 256 × 256 PNG, fond transparent |
| **Master** | 1024 × 1024 PNG, `art-masters/I04-mine.png` |
| **Lot** | D — écran titre, emblème, icônes |
| **Utilisé dans le jeu** | icône d'objet du combat tactique (équipement d'incapacitation posable ; cf. le trait « Bricoleuse » d'Abigail, qui la manipule sans risque de déclenchement) |

## Références

Aucune référence photo : objet inventé selon les règles d'icônes de
[`STYLE-BIBLE.md`](../STYLE-BIBLE.md#les-icônes-dobjets), non létal (ADR 0003).

## Le sujet

Une mine d'exercice incapacitante (pas létale) que les cadets peuvent poser au sol pendant le
combat tactique.

## Composition

- Objet seul, vu de trois quarts légèrement plongeant (pour lire sa forme de disque posé au
  sol), occupant l'essentiel du cadre carré.
- Disque plat et large, quelques évents ou ailettes réparties sur la tranche, une face
  supérieure texturée d'anneaux concentriques, une petite **diode de statut** au centre.
- Silhouette clairement défensive/d'exercice, pas une mine antipersonnel réaliste ou menaçante.

## Lumière et couleur

- Trait d'encre épais, modelé en trame légère sur le disque et ses ailettes.
- **Un seul accent de couleur** : la diode centrale, en cyan radio `#45d4e6` (appareil,
  usage typique de cette teinte) — pas de rouge sur cette fiche, pour ne pas la lire comme une
  charge explosive létale amorcée.
- Fond entièrement transparent.

## À éviter

Aspect explosif létal ou militaire lourd (pas de croix de danger, pas de symbole
d'avertissement réaliste) ; diode rouge clignotante façon détonateur de film ; texte ou
symbole sur le disque ; couleurs hors de l'accent cyan choisi.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

A single disc-shaped non-lethal incapacitating training mine, viewed from a slightly high
three-quarter angle so its flat disc shape reads clearly, isolated on a transparent
background. A wide flat disc with a few small vents or vanes around its rim, concentric ring
texture on the top face, a small status light at the center. Reads clearly as defensive
training gear, not a realistic lethal landmine or explosive device -- no danger symbols, no
military markings. Bold black ink outline with light halftone dot shading on the disc and
vanes. A single color accent: the center status light glowing radio-cyan (#45d4e6), not red.
No text, no logo. Square canvas, transparent background, object filling most of the frame.
```

## Critères d'acceptation

- Lisible comme un dispositif d'exercice incapacitant, jamais comme une mine létale menaçante.
- Lisible à 32 px : silhouette de disque et diode reconnaissables.
- Fond transparent, aucun texte ou symbole d'avertissement, un seul accent cyan.
