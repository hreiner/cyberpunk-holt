# D12 — Hall d'entrée du bâtiment (Briefing)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/hall.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D12-hall.png` |
| **Lot** | C — les décors de scène |
| **Utilisé dans le jeu** | bandeau de la scène de briefing dans le hall (entité `npc` instructeur, distribution du matériel), carte de titre « Hall d'entrée — Briefing » |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/zoneexercicetactique.png` | uniquement la **matière et la palette** du bâtiment (béton taché, tôle rouillée, acier industriel, blocs de sécurité jaune-noir) : il n'y a pas de photo d'intérieur, le hall est **inventé** dans la continuité de cette matière | le rendu photo, le texte, la vue extérieure elle-même (c'est un intérieur) |

## Le sujet

Le hall d'entrée du bâtiment d'examen, où l'instructeur fait le briefing et répartit les trois
objets partagés entre les cadets : le **pistolet taser**, le **kit de soin**, l'**outil de
piratage** (d'après [`09-MAPS-CHAPTER-1.md`](../../design/09-MAPS-CHAPTER-1.md)).

## Composition

- Format 21:9. Deux tiers supérieurs : un hall industriel désaffecté, une **table de
  répartition** avec les trois objets posés dessus (taser, kit de soin, outil de piratage,
  silhouettes reconnaissables mais sans détail excessif), portes battantes métalliques menant
  aux salles suivantes au fond.
- Tiers inférieur calme et sombre : le sol en béton taché, dans l'ombre.
- Une **silhouette lointaine unique**, l'instructeur debout près de la table, non identifiable
  en détail (son portrait existe déjà en P08, ce décor ne doit pas le dupliquer).
- Point de vue à hauteur d'homme, face à la table de répartition.

## Lumière et couleur

- Lumière de travail dure, blanc-os, projetée par une suspension industrielle isolée au-dessus
  de la table.
- Reste du hall dans la pénombre, poussière visible dans le faisceau de lumière (en hachures
  fines, jamais un halo diffus).
- Un seul accent rouge : un extincteur mural ou une signalétique de sécurité simple.
- Palette désaturée : béton gris-brun, acier terni des portes.

## À éviter

Texte sur les portes ou la signalétique ; visage détaillé de l'instructeur (réservé au
portrait P08) ; ambiance trop propre — le hall reste un bâtiment industriel désaffecté, pas un
poste de police moderne ; bloom sur la lumière de travail.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide establishing shot of the entrance hall of a derelict industrial building repurposed for a
police tactical exam: a stained concrete floor, rusted steel walls, a single distribution
table in the middle ground with a training taser pistol, a medic pouch and a handheld hacking
tool laid out on it, heavy metal double doors leading further into the building at the far
end. A single distant silhouette of an instructor standing near the table, not detailed enough
to read as a specific face. A single hanging industrial work light casting a hard white-bone
beam over the table, fine dust particles visible in the beam (no diffuse bloom), the rest of
the hall in shadow. A single red accent: a wall-mounted fire extinguisher or simple safety
sign with no text. 21:9 aspect ratio, visual interest in the upper two-thirds, a calm dark
lower third, floor line around 60-65% of the height, eye-level viewpoint facing the
distribution table.
```

## Critères d'acceptation

- Composition 21:9, tiers inférieur sombre et calme, ligne de sol vers 60-65 %.
- Les trois objets (taser, kit de soin, outil de piratage) sont reconnaissables sur la table
  sans dominer le cadre.
- Aucun visage détaillé, un seul accent rouge, aucun texte.
