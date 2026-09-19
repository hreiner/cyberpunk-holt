# T01 — Écran titre : l'académie HOLT de nuit

| | |
|---|---|
| **Fichier livré** | `public/assets/ui/title.webp` — 2560 × 1440 WebP, q85 |
| **Master** | 3840 × 2160 PNG, `art-masters/T01-titre.png` |
| **Lot** | D — écran titre, emblème, icônes |
| **Utilisé dans le jeu** | fond plein cadre de l'écran titre (derrière le logo « HOLT » et les actions « Nouvelle partie ») |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/holtacademy.png` | la **disposition générale** du complexe pour une vue aérienne : portail nord au centre, Administration derrière, colonne centrale de services, **aile première génération en violet** à l'est (dortoirs, cour, cantine, salles d'entraînement, garage au sud-est), enceinte fortifiée | le rendu de plan d'architecte lui-même — cette fiche demande une vue en perspective de nuit, pas un plan |
| `../../Reference_pictures/badlands.png` | la **silhouette brumeuse de Night City** à l'horizon, pour la placer au loin derrière l'académie | le cadre de vitre de fourgon (propre à D10), le désert au premier plan tel quel |

## Le sujet

L'académie HOLT vue du ciel, de nuit, isolée dans les Badlands — la toute première image que
voit le joueur. Doit se lire immédiatement comme une forteresse disciplinaire coupée du monde,
avec la promesse de Night City à l'horizon.

## Composition

- Format 16:9. Vue aérienne en légère plongée, prise au nord-ouest du complexe, cadrant
  l'ensemble de l'enceinte : le **portail nord** au centre-haut, l'**Administration** juste
  derrière, la colonne centrale de services, et à l'est l'**aile première génération** — ses
  toits de dortoirs, sa cour, sa cantine, ses salles d'entraînement, son garage au sud-est —
  identifiable à sa **teinte violette** de projecteurs.
- Une **zone calme et sombre au centre-gauche** de l'image, réservée à la superposition du
  titre et des boutons par l'interface — pas de détail architectural saillant à cet endroit.
- La **silhouette brumeuse de Night City** occupe l'horizon, loin derrière l'enceinte.
- Le désert des Badlands occupe le premier plan et les bords, sombre et texturé, sans détail
  excessif.

## Lumière et couleur

- Nuit franche : ciel encre, quelques étoiles discrètes, pas de lune spectaculaire.
- Projecteurs de sécurité blanc-os le long de l'enceinte et au portail nord, en faisceaux nets.
- Éclairage institutionnel **violet, désaturé**, sur l'aile première génération — la signature
  chromatique du lieu, ici montrée à grande échelle mais toujours retenue, jamais un violet
  synthwave saturé.
- Halo bas et terne de Night City à l'horizon (lueur urbaine lointaine, pas un ciel coloré).
- Un seul accent rouge : une balise ou un feu de sécurité sur une tour d'angle de l'enceinte.

## À éviter

**Aucun texte** nulle part, y compris pas de logo « HOLT » (l'interface l'ajoute par-dessus) ;
pluie permanente façon Blade Runner ; néon rose-violet synthwave saturé ; bloom lumineux
diffus autour des projecteurs ; zone centre-gauche trop chargée en détails (elle doit rester
lisible sous un titre).

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide aerial night view of a walled police-academy compound isolated in a desert, seen from a
high angle from the northwest. A main north gate at the top center leading to an
administration building just behind it, a central spine of service buildings, and to the east
a distinct wing of dormitory roofs, a courtyard, a mess hall and training halls with a vehicle
garage at its southeast corner, all bathed in a desaturated violet utility-light signature
distinct from the rest of the compound. A calm, visually quiet dark area at the center-left of
the frame, free of prominent architectural detail, reserved for a title overlay. A hazy distant
megacity skyline glowing faintly on the horizon far beyond the compound walls. Dark textured
desert ground filling the foreground and edges. Night sky in ink black with a few faint stars,
hard white-bone security floodlights in clean beams along the perimeter and north gate, a
single red accent: a warning beacon on one corner watchtower. No text, no logo anywhere. 16:9
aspect ratio.
```

## Critères d'acceptation

- Format 16:9, 2560×1440 à la livraison ; aucun texte ni logo dans l'image.
- L'aile première génération se distingue clairement par sa teinte violette, cohérente avec
  `holtacademy.png`.
- Une zone sombre et calme au centre-gauche reste disponible pour la superposition du titre.
- Un seul accent rouge, pas de synthwave saturé, pas de pluie.
