# Assets du déploiement HOLT

## Feuillage de la cour — 1er octobre 2026

Généré avec l'outil intégré **imagegen**, autorisé par le propriétaire pour
soutenir le décor. Texture consommée :
`public/assets/exploration/courtyard-canopy-leaves.webp`, alpha préservé,
1024 × 1024 ; réemployée sur les branches de l'arbre et les jardinières.
Le master reste dans le dossier local des images générées, hors dépôt.

Prompt final :

> Use case: photorealistic-natural. Asset type: one reusable RGBA foliage texture card for a realtime 3D courtyard tree and planter shrubs. Make a single irregular, airy small branch spray with about 40 realistic narrow olive-green drought-tolerant leaves on fine woody twigs, occupying the central 85 percent of the square, with meaningful transparent gaps between leaf clusters and a natural asymmetric contour. Completely transparent background with genuine alpha, no soil, no pot, no tree trunk, no sky, no text, no sheet or grid. Front orthographic botanical cutout, crisp leaf edges and fine veins, soft diffuse neutral daylight baked as little as possible, muted varied sage and olive greens, some lighter leaf undersides. AAA game foliage albedo card, realistic leaves not illustration, not a ball, no heavy cast shadows. One cohesive branch spray, not several disconnected isolated plants.

La version servie est une conversion WebP du résultat, sans retouche du sujet.
Les cartes alpha testées écrivent la profondeur et réemploient la même texture ;
elles ajoutent quelques triangles, sans source lumineuse ou reflet supplémentaire.
