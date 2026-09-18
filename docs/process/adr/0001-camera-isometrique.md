# ADR 0001 — Caméra isométrique 3/4 fixe

**Statut** : accepté · **Date** : 2026-09-18

## Contexte

Il fallait choisir une perspective avant d'écrire la moindre ligne de rendu : elle
conditionne les assets, les contrôles, la lisibilité du combat et la charge de travail
artistique. Quatre options étaient sur la table : isométrique 3/4, troisième personne,
mixte (exploration en 3e personne, combat en iso), et 2.5D vue de dessus.

## Décision

**Caméra orthographique isométrique 3/4, fixe, orientable par pas de 90 degrés, zoom borné.**
Élévation de 35,264° (arctan 1/√2), la vraie isométrie.

## Conséquences

**Favorables**

- Le combat au tour par tour est lisible d'un coup d'œil : couverts, distances, lignes de vue.
- Personne ne voit les visages, donc **aucune animation faciale** — c'est ce qui rend le
  pipeline art tenable pour une personne seule.
- Charge GPU faible, ce qui sert la cible des 60 fps sur GTX 1070.
- Pas de caméra à débuguer : ni collisions, ni occlusions, ni ressenti à régler.

**Défavorables**

- Moins immersif dans les scènes d'intérieur.
- Si les containers finissaient par masquer un cadet, il faudrait un rendu en transparence.
  Problème non résolu, et volontairement remis à plus tard.

## Alternatives écartées

- **Troisième personne** : exige des personnages détaillés, des animations de locomotion
  propres, une caméra soignée, et rend le tour par tour moins lisible.
- **Mixte** : le plus riche, mais double le travail — deux caméras, deux schémas de contrôle,
  des transitions.
- **2.5D vue de dessus** : le moins cher, mais l'ambiance cyberpunk y perd trop.
