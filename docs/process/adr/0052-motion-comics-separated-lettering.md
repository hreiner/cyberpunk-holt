# ADR 0052 — lettrage séparé pour les effets de matière

7 novembre 2026 — accepté.

## Contexte

La révision statique05 fournit des dessins et bulles validés. Le lecteur ne composait
le lettrage après les effets que pour les pages comportant des poses corporelles.
Une page avec seulement pluie, reflet ou ondes animait donc directement son master
lettré, même si ses champs de dessin et de lettres séparées étaient renseignés.

## Décision et conséquences

La présence de `motionBaseImage` active la composition dessin → éventuelles poses →
effets → lettrage. Aucun calque de pose factice n'est requis. Le schéma exige une
base pour les lettres séparées, et les lettres pour une base avec dialogues.
OFF et mouvements réduits restituent toujours le master validé. Les pages sans
base séparée conservent leur rendu historique ; les anciennes poses ne changent pas.
Le contrôle intégré compare lettres et régions rigides sur les pages réelles.
