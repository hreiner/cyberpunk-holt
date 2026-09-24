# ADR 0019 — Matières photo pour les sols d'exploration, réemployées par teinte

**Statut** : accepté · **Date** : 2026-09-24

## Contexte

ADR 0018 (passe C) avait amélioré les matières procédurales de l'académie (mur distinct du
sol, revêtement par pièce, grain et joints de panneau) mais s'était arrêté avant tout nouvel
asset photo, faute de pouvoir recueillir l'accord explicite du propriétaire dans le tour de
cette session déléguée : « si une vraie texture photo de béton clair est souhaitée pour
l'académie, c'est un choix à faire avec confirmation explicite, pas une suite automatique de
cette passe. »

Le propriétaire a explicitement autorisé l'usage de bibliothèques d'assets 3D externes pour la
passe D (« utilise des bibliothèques d'asset 3d externe est autorisé »), avec le même mode
opératoire que `concrete-diff-1k.jpg` (Poly Haven) et le kit Kenney du centre déjà en place :
CC0 uniquement, crédité dans `public/assets/exploration/ATTRIBUTION.md`.

Constat de départ (repris du mandat) : seul le centre d'examen avait une vraie surface photo
(le sol, `concrete-diff-1k.jpg`) ; le reste — sol de l'académie, revêtements de cantine et
d'infirmerie, murs du garage, sol du parking — restait peint en canvas 256 px. Le mandat
demandait des matières « qui tiennent au zoom de jeu et au zoom rapproché », en **peu de
matières, bien réemployées**, une par usage identifié dans `docs/art/ROOM-COMPOSITION.md` :
béton, linoléum/stratifié, carrelage d'infirmerie, tôle de garage, bitume de parking.

## Décision

### Cinq matières photo CC0, quatre nouvelles

`src/render/exploration/materials.ts` gagne une table `PHOTO_URL` qui associe une clé de
matière à un fichier sous `public/assets/exploration/`, chargé une fois par `EnvironmentMaterials`
(comme `coldConcrete` déjà) :

| Clé | Fichier | Source | Usage |
|---|---|---|---|
| `coldConcrete` | `concrete-diff-1k.jpg` | Poly Haven, *Concrete* (déjà en place, passe B) | sol par défaut du centre d'examen |
| `creamConcrete` | `concrete-diff-1k.jpg` (même fichier) | — | sol par défaut de l'académie |
| `warmLaminate` | `wood-laminate-cantine-1k.jpg` | ambientCG, *Wood Floor 051* | sol de la cantine |
| `clinicTile` | `tile-infirmerie-1k.jpg` | ambientCG, *Tiles 133 A* | sol de l'infirmerie |
| `asphalt` | `asphalt-parking-1k.jpg` | ambientCG, *Asphalt 033* | sol du parking (centre) |
| `corrugatedSteel` | `corrugated-steel-garage-1k.jpg` | ambientCG, *Corrugated Steel 009* | murs du garage (académie) |

Toutes CC0 1.0, sans attribution obligatoire ; `ATTRIBUTION.md` la donne quand même par
transparence, avec la licence, l'URL et l'usage exact, comme le fait déjà le kit Kenney.

**Une seule image de béton, réemployée par teinte plutôt que dupliquée.** `creamConcrete` et
`coldConcrete` chargent le même fichier `concrete-diff-1k.jpg` (deux `THREE.Texture`
indépendantes, donc deux décodages/upload GPU, mais une seule requête réseau — le navigateur
sert la deuxième depuis son cache HTTP). `ExploreView.floorMaterial` applique une teinte de
base différente par clé (`BASE_FLOOR_TINT`, un multiplicateur de couleur sur le matériau clonée) :
crème pour l'académie diurne, légèrement froide pour le centre désaffecté — cohérent avec
ART-DIRECTION.md « climat différent par lieu » (déjà décidé pour l'éclairage global en ADR
0018) sans ajouter un second fichier. La nuance de pièce déjà en place (`roomFloorTint`,
`Rng.fork` par `roomId`) se multiplie par-dessus cette teinte de base, inchangée dans son
principe.

Chaque matière ne garde que la carte couleur du set PBR téléchargé — pas de normale, rugosité
ni déplacement, qui ne servent à rien ici (`MeshStandardMaterial` reçoit une `roughness`/
`metalness` réglée à la main, comme pour les matières procédurales existantes) et auraient
multiplié le poids par cinq. Redimensionnées à 1024 px et recompressées en JPEG qualité 78
(mozjpeg) : les quatre nouveaux fichiers pèsent ensemble 286 472 octets (≈ 280 Kio), contre
9 à 12 Mio par archive ambientCG d'origine — grand écart uniquement dû aux cartes PBR non
gardées et à la recompression, pas à une perte de résolution (1024 px conservé).

### Échelle et répétition : deux familles de matières, deux traitements

Une texture répétée à l'identique sur une grande pièce se voit — le mandat le nomme
explicitement. Les matières se répartissent en deux familles avec un traitement opposé,
géré par un `textureSpan` par clé dans `ExploreView.floorMaterial` :

- **Béton et asphalte : répétition quasi nulle.** Ce sont des photos avec des blessures et
  coulures reconnaissables (les rainures de coffrage de `concrete-diff-1k.jpg` sont visibles à
  l'écran) ; les répéter les ferait lire comme un motif qui revient, le défaut exact que le
  mandat interdit. `textureSpan` large (18 pour l'académie, 29 pour le centre — repris de la
  passe B —, 22 pour l'asphalte) : la plupart des pièces (rarement plus large que 15-20 m)
  reçoivent l'image entière étirée une seule fois sur leur sol, jamais un damier.
- **Carrelage et stratifié : répétition fine, volontaire.** Un carrelage ou un parquet a un motif
  RÉGULIER par construction (joint de dalle, lame de plancher) ; le répéter est correct, c'est
  ce qui fait un vrai sol. `textureSpan` court (3 m pour le carrelage, 5 m pour le stratifié) :
  la cantine (12×14) et l'infirmerie (12×7) montrent plusieurs répétitions du motif, à une
  échelle de dalle/lame plausible plutôt qu'une plaque unique étirée et floue.

La tôle du garage suit la même logique que le carrelage : les nervures de `corrugatedSteel`
sont un motif horizontal régulier, et chaque case de mur (un `BoxGeometry` de 1 m avec UV 0–1
par face) l'affiche à l'identique — continu et correct, pas un damier, parce que la tôle
ondulée réelle EST continue et régulière par construction.

### Le garage : des murs de tôle, pas de béton peint

`ROOM-COMPOSITION.md` demande une matière distincte pour le garage (« tôle mate »).
`ExploreView` calcule désormais `garageWallCells` (l'anneau de cases `wall` entourant le
rectangle du garage, filtré par `kindAt`) en plus de `garageCells` (déjà utilisé pour les
véhicules), et `buildCells` choisit `corrugatedSteel` plutôt que `creamConcreteWall` pour ces
cases. C'est la seule matière de MUR touchée par cette passe : les autres murs restent la
peinture procédurale d'ADR 0018 (joints de panneau calés sur le module de 1 m), qui résout déjà
bien le risque de répétition pour une surface sans motif naturel régulier — remplacer aussi ces
murs par une photo aurait réintroduit le risque qu'ADR 0018 venait de fermer, pour un gain
incertain, hors du temps disponible pour cette passe.

### Repli procédural réel, pas seulement « attendre »

Le mécanisme existant (`ExploreView.applyFloorVisibility` : ne poser `material.map` qu'une fois
`texture.image` prêt, sinon garder une masse plate) protège déjà tout sol dont la clé pointe
vers `PHOTO_URL`, sans changement — il ne dépendait jamais de la clé, seulement de la présence
de `texture.image`. Nouveau dans cette passe : `materials.ts` ajoute `loadPhotoTexture`, qui
pose un `onError` sur `TextureLoader.load` — si le fichier réseau échoue vraiment (pas
« pas encore chargé », mais 404/hors-ligne), l'image de la texture est remplacée par la
peinture procédurale de la même clé (`paintedTexture`) plutôt que de laisser `texture.image`
indéfiniment absent. Les cinq matières photo ont donc chacune une entrée `PALETTE` (couleur
et grain approximatifs) qui ne sert JAMAIS en fonctionnement normal, seulement si le réseau
échoue — exactement le « la surface doit rester correcte » du mandat, plutôt qu'un sol qui
resterait noir/blanc pour toute la partie.

## Conséquences

- `EnvironmentMaterials` compte 19 clés (5 photo, 14 peintes), contre 16 avant cette passe ;
  `warmLinoleum` disparaît, remplacée par `warmLaminate`/`clinicTile` (une seule matière pour
  deux revêtements très différents — bois verni, faïence — ne rendait justice à aucun des deux).
- Poids ajouté au build : 286 472 octets de nouvelles textures (quatre fichiers), zéro nouveau
  GLB. `concrete-diff-1k.jpg` n'est pas dupliqué : l'académie réutilise le fichier déjà servi
  pour le centre.
- Toute nouvelle pièce qui veut un revêtement dédié suit le même chemin : une clé dans
  `PHOTO_URL`/`PALETTE` (`materials.ts`), une entrée dans `ACADEMY_FLOOR_BY_ROOM` ou
  `CENTRE_FLOOR_BY_ROOM` (`ExploreView`), un `textureSpan` choisi selon que la matière est une
  photo à blessures reconnaissables (grand) ou un motif régulier (court) — pas un troisième
  mécanisme à inventer.
- `docs/art/ART-PIPELINE.md` (table des assets embarqués) et
  `public/assets/exploration/ATTRIBUTION.md` sont mis à jour avec les quatre fichiers, leur
  SHA-256 et leur licence.
