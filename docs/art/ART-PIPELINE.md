# Pipeline art

La partie la plus risquée d'un projet 3D solo n'est pas la modélisation, c'est le **rigging
et l'animation**. Ce document décrit comment on l'évite aujourd'hui et comment on le
traitera demain, **sans jamais toucher au gameplay**.

## Le principe : tout passe par `CharacterRig`

Le jeu ne connaît que cette interface
([`src/render/characterRig.ts`](../../src/render/characterRig.ts)) :

```ts
interface CharacterRig {
  readonly id: string;
  readonly object: THREE.Object3D;
  setWorldPosition(x: number, z: number): void;
  faceTowards(x: number, z: number): void;
  play(animation: 'idle' | 'walk' | 'run' | 'shoot' | 'down' | 'revive'): void;
  setHighlighted(on: boolean): void;
  dispose(): void;
}
```

**Six animations, pas une de plus.** C'est le contrat minimal pour jouer le chapitre 1.
Aujourd'hui l'implémentation est `PlaceholderRig` : une capsule colorée, un anneau d'équipe,
un repère d'orientation. Demain ce sera `GltfRig`, et **aucune ligne de `src/tactical/` ni
de `src/app.ts` ne changera**. Voir l'[ADR 0004](../process/adr/0004-abstraction-rig.md).

## Étape suivante : base mesh + Mixamo

L'approche retenue, parce qu'elle est la plus rapide à un résultat correct :

1. **Une seule base mesh** de cadet, low-poly, en uniforme NCPD, faite dans Blender ou
   récupérée dans une bibliothèque libre. Un seul maillage pour les six.
2. **Rigging automatique Mixamo** : on téléverse la mesh, Mixamo pose le squelette.
3. **Animations Mixamo** : *idle*, *walk*, *run*, *shoot pistol*, *death/fall*, *getting up*.
   Elles couvrent exactement les six états du contrat.
4. **Export GLB** avec les clips, compression via `gltf-transform`.
5. **Différenciation des six cadets** par matériau : couleur d'accent
   (`placeholderColor` dans `characters.json`) plus un accessoire simple — casquette,
   veste, coiffure. Pas six modèles distincts.
6. Implémenter `GltfRig` : `GLTFLoader` + `AnimationMixer`, `play()` faisant une transition
   en fondu entre les clips.

### Points de vigilance

- **Échelle** : une case fait 1,5 m, un cadet doit mesurer environ 1,75 m. Mixamo exporte en
  centimètres ; recaler à l'import.
- **Orientation** : `faceTowards()` suppose que le modèle regarde vers `+Z`. Corriger dans
  le rig, pas dans le gameplay.
- **Budget** : viser moins de 8 000 triangles par cadet, moins de 2 Mo par GLB.
- **Ne pas committer de GLB lourd** sans réfléchir. Au-delà de quelques mégaoctets,
  passer par Git LFS ou un dossier d'assets hors dépôt.

## Ce qu'on ne fait pas

- **Pas de rigging génératif automatique** via un agent : c'est le maillon le plus fragile
  de la chaîne, et un échec bloque tout le reste.
- **Pas d'animation faciale** : la caméra isométrique la rend invisible.
- **Pas de capture de mouvement**.

Un pack d'assets low-poly déjà riggé et animé (type Synty) reste une option parfaitement
raisonnable si Mixamo déçoit : le contrat `CharacterRig` absorbe ce choix aussi.

## Portraits 2D

Les visages vivent **uniquement** dans les dialogues, sous forme de portraits 2D générés.
Un portrait par cadet, cadrage buste, fond neutre, à partir des descriptions de
[`REFERENCES.md`](REFERENCES.md) pour rester cohérent avec les références existantes.

Destination : `public/assets/ui/portraits/<id>.png`.

## Décors

Le container yard est aujourd'hui un **blockout procédural** construit à partir de la carte
ASCII : cubes pour les containers, cubes plus petits pour les caisses. C'est volontaire.

Pour l'améliorer sans rien casser : remplacer les `BoxGeometry` par des GLB de containers
usés dans `YardView.buildObstacles()`. **La carte ASCII reste la source de vérité** du
gameplay — le décor l'habille, il ne la définit pas.

## Ordre de travail conseillé

1. Portraits 2D des six cadets — fort impact, faible risque.
2. `GltfRig` avec une base mesh et les animations Mixamo.
3. Containers et caisses en GLB.
4. Bruitages et ambiance.
5. Effets de tir : trait de tir, impact, réaction.
