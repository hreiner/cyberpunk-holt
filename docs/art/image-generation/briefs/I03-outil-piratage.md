# I03 — Outil de piratage

| | |
|---|---|
| **Fichier livré** | `public/assets/icons/outil-piratage.png` — 256 × 256 PNG, fond transparent |
| **Master** | 1024 × 1024 PNG, `art-masters/I03-outil-piratage.png` |
| **Lot** | D — écran titre, emblème, icônes |
| **Utilisé dans le jeu** | icône d'objet du combat tactique (l'un des trois objets partagés de l'examen pratique — ouvre les portes et les systèmes) |

## Références

Aucune référence photo. Cohérent avec les usages du piratage dans
[`ch1.salle1.json`](../../../../src/data/dialogues/ch1.salle1.json) et
[`ch1.salle2.json`](../../../../src/data/dialogues/ch1.salle2.json) (portes à panneau
électronique).

## Le sujet

Le cyberdeck portatif partagé par les deux équipes, utilisé pour ouvrir les portes et systèmes
verrouillés du parcours intérieur.

## Composition

- Objet seul, vu de trois quarts, occupant l'essentiel du cadre carré.
- Petit boîtier de la taille d'une paume, coque nervurée avec une prise ferme, un **petit écran**
  sur le dessus, quelques boutons simples, et un **câble avec une prise jack** qui s'enroule et
  sort du boîtier, prêt à se brancher sur un panneau.
- Silhouette technique et robuste, pas un smartphone lisse.

## Lumière et couleur

- Trait d'encre épais, modelé en trame légère sur la coque.
- **Un seul accent de couleur** : le petit écran en cyan radio `#45d4e6`, seule source de
  lumière/couleur de l'objet (usage typique de cette teinte pour les écrans, par la bible de
  style) — pas de rouge sur cette fiche.
- Fond entièrement transparent.

## À éviter

Écran affichant du texte ou du code lisible (juste une lueur cyan unie ou un motif abstrait) ;
silhouette de smartphone ou de tablette grand public ; câble emmêlé de façon chaotique — le
garder lisible ; couleurs hors de l'accent cyan choisi.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

A single handheld hacking tool (a compact cyberdeck), viewed from a three-quarter angle,
isolated on a transparent background. A palm-sized ridged casing with a firm grip, a small
screen on top, a few simple buttons, and a coiled cable ending in a jack connector trailing
from one side, ready to plug into a panel. A rugged technical device silhouette, not a smooth
consumer smartphone or tablet. Bold black ink outline with light halftone dot shading on the
casing. A single color accent: the small screen glowing radio-cyan (#45d4e6) with a plain
glow, no readable text or code on it. No other color anywhere, no text, no logo. Square
canvas, transparent background, object filling most of the frame.
```

## Critères d'acceptation

- Lisible comme un outil de piratage portatif robuste, pas un smartphone grand public.
- Lisible à 32 px : silhouette du boîtier, écran et câble reconnaissables.
- Fond transparent, aucun texte lisible même sur l'écran, un seul accent cyan.
