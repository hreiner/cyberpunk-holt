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
  setEquipment(items: ItemId[] | null): void; // null = matériel inconnu (équipe adverse)
  update(dt: number): void; // animations internes, appelé à chaque image
  dispose(): void;
}
```

**Six animations, pas une de plus.** C'est le contrat minimal pour jouer le chapitre 1.
Aujourd'hui l'implémentation est `CadetRig` : les GLB Quaternius fournissent le squelette et les
clips, puis le code adapte tenue, cheveux, matériel, anneau et étiquette. La vue tactique ajoute
une silhouette visible à travers les décors. Un rig ultérieur pourra remplacer cette base sans
changer `src/tactical/` ni `src/app.ts`. Voir l'[ADR 0004](../process/adr/0004-abstraction-rig.md).

Le [pilote autonome du dortoir](DORMITORY-AA-PILOT-REVIEW.md) garde ce squelette animé pour un
Franklyn d'étude, mais refait la silhouette de son blouson et sa coiffure avec des maillages
géométriques attachés aux os. Ce travail reste isolé du chapitre et du rig partagé des autres
cadets. Il n'introduit ni fichier GLB, ni auto-rigging, ni licence supplémentaire ; ses limites
visuelles sont évaluées dans le rapport du pilote.

## Exploration picturale : base commune et clips explicites

Le pipeline d'exploration emploie une base humanoïde riggée à squelette commun, des variantes
de silhouette et des clips explicites. Elle peut venir d'une création locale ou d'un asset
autorisé dont la provenance et les droits sont documentés ; aucun rigging automatique par un
service tiers ne fait partie du plan. Une implémentation Three.js peut utiliser un
`SkinnedMesh` et `AnimationMixer`, des clones à squelettes indépendants et un cache de
ressources.

Les six animations de `CharacterRig` restent obligatoires : _idle_, _walk_, _run_, _shoot_,
_down_, _revive_. L'exploration peut proposer séparément les poses visuelles _sit_, _lean_,
_talk_ et _inspect_ via `ExplorationCharacterRig` ; le combat continue de ne connaître que
`CharacterRig`. La position appartient au gameplay : les clips sont sur place, sans root
motion, avec une cadence cohérente avec les 4 m/s du rendu actuel.

La base commune est différenciée par coiffure, coupe d'uniforme, accessoires, matériau et
attitude — pas seulement par une recoloration. Les PNJ de carte utilisent la même fabrique,
avec des profils non humains adaptés lorsque le scénario l'exige.

### Assets actuellement embarqués (23 septembre 2026)

Les acteurs d'exploration utilisent les trois GLB suivants, chargés une seule fois puis clonés
avec leur squelette et leur `AnimationMixer` propres (`SkeletonUtils.clone`). Les masters et
le texte de licence restent dans `art-masters/characters/`, hors dépôt. Les fichiers servis
sont les copies nécessaires au jeu sous `public/assets/exploration/` ; les deux emplacements
ont été comparés par SHA-256.

| Fichier servi            | Base Quaternius / usage                                          |      Taille | Triangles du GLB | SHA-256                                                            |
| ------------------------ | ---------------------------------------------------------------- | ----------: | ---------------: | ------------------------------------------------------------------ |
| `cadet-male.glb`         | Ultimate Modular Men, tête casual masculine greffée à l'uniforme | 1 430 660 o |            5 776 | `fea7e71271203e7073f1a073fa1208de7402df276f87f80e149bf7589b5d46b4` |
| `cadet-male-uniform.glb` | Ultimate Modular Men, tenue SWAT recolorée bleu-noir             | 1 560 900 o |            7 752 | `a835107bac833eb916c494e10997ae1709e85957ea6f6c59ace3c9a66f6d1fec` |
| `cadet-female.glb`       | Ultimate Modular Women, tenue Suit                               | 1 537 776 o |            6 482 | `12aece21fecd08fb079d2fa390faa40c705e26ea8f779b5005b8bf6cbe501837` |
| `concrete-diff-1k.jpg`   | Poly Haven, Concrete, texture de béton (académie ET centre d'examen, teintée par lieu) |   543 902 o |                — | `046c0e2aebe31e6043a6bc074e779f6a345f1d823d0ca1c69446c5cabadefa8a` |
| `wood-laminate-cantine-1k.jpg` | ambientCG, Wood Floor 051, sol de la cantine            |    89 872 o |                — | `2c9b0edd014f1e5e6e6bf819da331ffca27fbad7188a5ab55d86ad9aef1edb6f` |
| `tile-infirmerie-1k.jpg` | ambientCG, Tiles 133 A, sol de l'infirmerie                      |    58 969 o |                — | `d4784dede788c21f2142e196912be591659507caced0360948e50a09642bc783` |
| `asphalt-parking-1k.jpg` | ambientCG, Asphalt 033, sol du parking (centre d'examen)         |    64 247 o |                — | `adcdb2e813805def5aae39540ae8431dd3483ce0e0b423f6f2b924b53288a846` |
| `corrugated-steel-garage-1k.jpg` | ambientCG, Corrugated Steel 009, murs du garage (académie) |    73 384 o |                — | `d9944465f617c942545c1892187d23a876246a63f806b10c68a8c30dc2dbcdf6` |

Les quatre fichiers ambientCG (passe D, 24 septembre 2026) ne gardent que la carte couleur du
set PBR téléchargé (`_Color.jpg`), redimensionnée à 1024 px et recompressée en JPEG qualité 78
(mozjpeg) : les cartes de normale/rugosité/déplacement d'ambientCG ne sont pas utilisées. Detail
complet, choix d'échelle et de répétition : [ADR 0019](../process/adr/0019-matieres-photo-pour-les-sols-dexploration.md).

Les modèles et animations sont de **Quaternius**. Les packs officiels sont annoncés sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Les pages officielles confirment le format glTF,
les 24 animations et la licence des packs [Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html)
et [Ultimate Modular Women](https://quaternius.com/packs/ultimatemodularwomen.html).
Le miroir public [Fatal Funnel](https://github.com/euuuuuuan/fatal-funnel-public/blob/main/CREDITS.md)
reproduit les fichiers masculins `casual-character.glb` et `swat.glb` avec exactement les deux
premiers hashes ci-dessus : c'est la provenance vérifiable de leurs GLB.
Le GLB féminin est exactement le modèle [Suit de Quaternius sur Poly Pizza](https://poly.pizza/m/sOUciDsoVV),
[fichier distribué](https://static.poly.pizza/1bd7759c-ab76-4178-8fe6-7706dffa7d5f.glb) :
une nouvelle copie téléchargée le 23 septembre 2026 a le même SHA-256 que l'asset servi.
Cette fiche indique [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), contrairement
à la page du pack. L'attribution de cette distribution est donc conservée explicitement
dans `public/assets/exploration/ATTRIBUTION.md`, avec auteur, source, licence et adaptations.

La texture **Concrete** de [Poly Haven](https://polyhaven.com/a/concrete) est distribuée sous
[CC0 1.0](https://polyhaven.com/license). La copie 1K est limitée à 544 Ko et sert uniquement
au béton du centre d'examen ; elle évite les aplats de sol sans changer les collisions ou le plan.

Chaque GLB expose 24 clips nommés : `Death`, `Gun_Shoot`, `HitRecieve`, `HitRecieve_2`,
`Idle`, `Idle_Gun`, `Idle_Gun_Pointing`, `Idle_Gun_Shoot`, `Idle_Neutral`, `Idle_Sword`,
`Interact`, `Kick_Left`, `Kick_Right`, `Punch_Left`, `Punch_Right`, `Roll`, `Run`,
`Run_Back`, `Run_Left`, `Run_Right`, `Run_Shoot`, `Sword_Slash`, `Walk`, `Wave`.
Le contrat HOLT mappe `idle` vers `Idle_Neutral`, `walk` vers `Walk`, `run` vers `Run`,
`shoot` vers `Gun_Shoot` et `down` vers `Death`; `revive` revient explicitement à `idle`.
Les clips ne portent pas la position de jeu. À 4 m/s, le rig règle la cadence de `Walk`
(cycle 1,333 s, 1,5 m) à 3,56× et celle de `Run` (0,792 s, 2,35 m) à 1,35×. L'exploration
utilise effectivement `Run` pendant le déplacement, avec `LEADER_SPEED` exportée ;
elle n'accélère pas la marche pour simuler la course. Le déplacement
reste piloté par `ExploreState`, sans déplacement ajouté par le mesh. Ces cadences sont
un réglage de présentation ; elles ne prouvent pas à elles seules que les pieds restent
ancrés pendant toute la foulée, ce qui demande encore une observation en mouvement.

Le pack ne fournit pas de clip assis. Les PNJ de la cantine utilisent donc une pose statique
abaissée, ancrée aux trois chaises déclaratives (Abraham `41,21`, Betty `46,23`, Calvin
`46,27`) ; elle évite de déformer les jambes via des rotations de squelette fragiles. Une vraie
animation assise reste une amélioration d'asset, sans effet sur le gameplay.

### Points de vigilance

- **Échelle** : une case d'exploration fait 1 m et un cadet mesure environ 1,75 m ; le terrain
  tactique conserve ses propres dimensions et n'est pas modifié par ce pipeline.
- **Orientation** : `faceTowards()` suppose que le modèle regarde vers `+Z`. Corriger dans
  le rig, pas dans le gameplay.
- **Budget** : viser moins de 8 000 triangles par cadet, moins de 2 Mo par GLB.
- **Ne pas committer de GLB lourd** sans réfléchir. Les masters restent hors dépôt ; les assets
  légers réellement utilisés vivent sous `public/assets/exploration/`, avec leur provenance.

## Ce qu'on ne fait pas

- **Pas de rigging génératif automatique** via un agent ou un service tiers : c'est le maillon
  le plus fragile de la chaîne, et un échec bloque tout le reste.
- **Pas d'animation faciale** : la caméra isométrique la rend invisible.
- **Pas de capture de mouvement**.

Un pack d'assets déjà riggé et animé, avec des droits compatibles et une provenance consignée,
reste une option raisonnable : le contrat `CharacterRig` absorbe ce choix.

**Essai isolé après la revue du dortoir (25 septembre 2026).** La silhouette pilote
Quaternius et ses ajouts géométriques n'atteignent pas la cible visuelle. Un personnage
déjà riggé de la bibliothèque Mixamo et un clip de marche sont donc évalués dans le
pilote autonome, avec adaptation du mesh dans Blender. Ce n'est pas une adoption de
l'auto-rigging Mixamo pour les personnages du chapitre. Le fichier source, la conversion,
les contrôles de mouvement et les droits à vérifier sont décrits dans
[MIXAMO-PILOT.md](MIXAMO-PILOT.md). Aucun personnage Mixamo n'est encore distribué.

## Portraits 2D

Les visages vivent **uniquement** dans les dialogues, sous forme de portraits 2D. Le
registre et les placeholders SVG déterministes sont décrits dans
[`UI-DESIGN-SYSTEM.md`](UI-DESIGN-SYSTEM.md) (section « Portraits »),
implémentés dans [`src/ui/portraits.ts`](../../src/ui/portraits.ts).

**Remplacer un placeholder** : déposer `public/assets/portraits/<id>.webp` (3:4, 600 × 800,
fond non transparent, cadrage buste, à partir des descriptions de
[`REFERENCES.md`](REFERENCES.md) pour rester cohérent avec les références existantes), puis
renseigner `src` dans l'entrée correspondante de `portraits.ts`. Aucun autre code ne change :
`portraitElement()` bascule automatiquement du placeholder généré vers l'`<img>`.

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
