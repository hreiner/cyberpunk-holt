# ADR 0004 — Les personnages passent par une abstraction `CharacterRig`

**Statut** : accepté · **Date** : 2026-09-18

## Contexte

Le rigging et l'animation de personnages sont le maillon le plus fragile d'un projet 3D
solo. Attendre d'avoir des modèles corrects pour écrire le gameplay aurait tout bloqué.
Mais coder le gameplay contre des capsules puis tout reprendre aurait été pire.

La contrainte posée était explicite : commencer avec une solution rapide (base mesh +
Mixamo), **tout en gardant la possibilité de changer d'approche ensuite**.

## Décision

Le jeu ne connaît les personnages qu'à travers l'interface `CharacterRig`
(`src/render/characterRig.ts`), qui expose six animations : `idle`, `walk`, `run`, `shoot`,
`down`, `revive`, plus la position, l'orientation et la mise en évidence.

L'implémentation actuelle, `PlaceholderRig`, est une capsule colorée. La suivante, `GltfRig`,
chargera des GLB riggés sous Mixamo. **Aucun code de gameplay ne changera.**

## Conséquences

**Favorables**

- Le gameplay a été écrit et équilibré sans attendre le moindre modèle.
- Changer de source d'assets — Mixamo, pack acheté, modèles faits main — n'affecte qu'une
  classe.
- Le contrat à six animations **cadre le travail artistique** : on sait exactement ce qu'il
  faut produire, ni plus ni moins.

**Défavorables**

- Une indirection de plus.
- Le contrat est volontairement pauvre : une animation plus fine (viser, se pencher) devra
  l'étendre — et devra donc être justifiée.

## Note d'implémentation

`faceTowards()` suppose un modèle orienté vers `+Z`. Toute correction d'orientation se fait
**dans le rig**, jamais dans le gameplay.
