# I02 — Kit de soin

| | |
|---|---|
| **Fichier livré** | `public/assets/icons/kit-soin.png` — 256 × 256 PNG, fond transparent |
| **Master** | 1024 × 1024 PNG, `art-masters/I02-kit-soin.png` |
| **Lot** | D — écran titre, emblème, icônes |
| **Utilisé dans le jeu** | icône d'objet du combat tactique (l'un des trois objets partagés de l'examen pratique — un usage, ranime un coéquipier) |

## Références

Aucune référence photo. Cohérent avec le kit qu'Abigail retape dans
[`ch1.hub.abigail.json`](../../../../src/data/dialogues/ch1.hub.abigail.json) : du matériel
rafistolé, pas un objet neuf et lisse.

## Le sujet

Le kit de soin partagé par les deux équipes : une pochette médicale compacte, à l'usage unique,
qui ranime un coéquipier tasé.

## Composition

- Objet seul, vu de trois quarts, occupant l'essentiel du cadre carré.
- Pochette souple en toile, refermée par une languette ou un zip, sangle courte repliée dessus ;
  le rabat légèrement entrouvert laisse deviner un rouleau de bande et une petite fiole, sans
  s'y attarder.
- Une **croix simple** en relief cousu sur le rabat, dessinée comme une forme géométrique nette
  — le seul motif du sac.

## Lumière et couleur

- Trait d'encre épais, modelé en trame légère, texture de toile suggérée par quelques plis
  tramés plutôt que par un rendu de tissu détaillé.
- **Un seul accent rouge** d'imprimerie `#e2262f` : la croix sur le rabat, légèrement décalée du
  trait noir (repérage).
- Fond entièrement transparent.

## À éviter

Croix rouge trop grande ou dominante façon logo pharmaceutique ; objet trop propre et neuf —
garder un aspect utilitaire, un peu usé ; texte sur la pochette ; sang.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

A single compact medic pouch, viewed from a three-quarter angle, isolated on a transparent
background. A soft canvas field-medic pouch closed with a flap and a short folded strap, the
flap slightly open revealing a hint of a bandage roll and a small vial without over-detailing
them. A single simple stitched cross shape on the flap as the only motif. Bold black ink
outline with light halftone dot shading suggesting worn canvas texture. A single printing-red
(#e2262f) accent: the cross on the flap, slightly misregistered from the black line. No text,
no logo. Square canvas, transparent background, object filling most of the frame.
```

## Critères d'acceptation

- Lisible comme une pochette médicale d'exercice compacte, pas un logo pharmaceutique.
- Lisible à 32 px : silhouette de pochette et croix reconnaissables.
- Fond transparent, aucun texte, un seul accent rouge (la croix).
