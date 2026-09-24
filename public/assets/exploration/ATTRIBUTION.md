# Crédits des personnages 3D

Personnages et animations originaux : **Quaternius** — https://quaternius.com/

## Bases masculines

`cadet-male.glb` et `cadet-male-uniform.glb` proviennent du pack
[Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html),
publié sous [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
Copies GLB : [Fatal Funnel, crédits et empreintes](https://github.com/euuuuuuan/fatal-funnel-public/blob/main/CREDITS.md).

## Base féminine

**« Suit » par Quaternius**, distribué sur [Poly Pizza](https://poly.pizza/m/sOUciDsoVV)
sous [Creative Commons Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).
Cette copie est servie sous le nom `cadet-female.glb`.

## Adaptations HOLT

Les GLB sources sont conservés sans modification binaire. Le rendu du jeu adapte
les palettes, assemble les vêtements et les têtes, ajoute coiffures, neuroports et
accessoires, puis utilise les clips dans le contrat d'animation HOLT.
Les six personnages de HOLT ne sont pas présentés comme des personnages originaux
de Quaternius. Aucun soutien ou aval de l'auteur n'est impliqué.

Provenance détaillée, empreintes SHA-256 et budgets : `docs/art/ART-PIPELINE.md` du dépôt.

## Matières photo des sols d'exploration

`concrete-diff-1k.jpg` est la texture **Concrete** de [Poly Haven](https://polyhaven.com/a/concrete),
publiée sous [CC0 1.0](https://polyhaven.com/license). Passe B : sol en béton du centre
d'examen. Passe D : le même fichier habille aussi le sol par défaut de l'académie (un second
`THREE.Texture` chargé depuis la même URL, teinté crème par `ExploreView.floorMaterial` au lieu
d'un second fichier téléchargé — « peu de matières, bien réemployées »). Les murs des deux
lieux gardent une peinture procédurale HOLT (`creamConcreteWall`/`coldConcreteWall`).

Passe D ajoute quatre matières photo CC0 d'[ambientCG](https://ambientcg.com/), une par usage
identifié dans `docs/art/ROOM-COMPOSITION.md` : le stratifié de la cantine, le carrelage de
l'infirmerie, l'asphalte du parking, la tôle du garage. Chaque fichier ne conserve que la carte
couleur (`_Color.jpg`) du set PBR téléchargé ; les cartes de normale/rugosité/déplacement ne sont
pas utilisées et n'ont pas été committées. Redimensionnées et recompressées (mozjpeg, qualité 78)
depuis l'original 1K-JPG d'ambientCG pour tenir le budget de `docs/art/ART-PIPELINE.md`.

| Fichier | Source ambientCG | Licence | Usage | Octets |
|---|---|---|---|---:|
| `wood-laminate-cantine-1k.jpg` | [Wood Floor 051](https://ambientcg.com/a/WoodFloor051) | [CC0 1.0](https://ambientcg.com/view?category=&method=&sort=Popular&type=&q=&sortDir=asc) | sol de la cantine (« stratifié chaud ») | 89 872 |
| `tile-infirmerie-1k.jpg` | [Tiles 133 A](https://ambientcg.com/a/Tiles133A) | CC0 1.0 | sol de l'infirmerie (carrelage clinique) | 58 969 |
| `asphalt-parking-1k.jpg` | [Asphalt 033](https://ambientcg.com/a/Asphalt033) | CC0 1.0 | sol du parking, centre d'examen | 64 247 |
| `corrugated-steel-garage-1k.jpg` | [Corrugated Steel 009](https://ambientcg.com/a/CorrugatedSteel009) | CC0 1.0 | murs du garage de l'académie | 73 384 |

Toutes les ressources ambientCG sont publiées sous [CC0 1.0](https://ambientcg.com/list?type=Material)
(domaine public, aucune attribution requise ; elle est donnée ici par transparence). Ensemble des
quatre fichiers : 286 472 octets (≈ 280 Kio), sous le budget de 5 Mio de
`EXPLORATION-VISUAL-DESIGN.md` §5.

## Kit industriel du centre d'examen

Les sept GLB de `factory/` et leur `Textures/colormap.png` proviennent du
[Factory Kit de Kenney](https://kenney.nl/assets/factory-kit), version 3.0 du 1er mai 2026,
distribué sous [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
Leurs originaux figurent dans `art-masters/kenney-factory/source/Models/GLB format/` ;
les copies ci-dessous sont binaires identiques. Le jeu applique seulement une patine au rendu.

| Fichier | Octets | SHA-256 |
|---|---:|---|
| `box-large.glb` | 7 496 | `f5c7a7b4d7ec48c2695dc5241d62a38dbb54b487e6be0f089548582c91bacdfd` |
| `hopper-high-square.glb` | 11 308 | `ebb427e3ab2bc1fabca3a0deadca1f65164943630c073f61d1a01029edb37f01` |
| `machine-fortified.glb` | 29 828 | `0907f6616f49bbdaa20241ac4b568b780f30352f204851c53568b8e7df59b528` |
| `robot-arm-a.glb` | 50 592 | `ad3f766791adadd1cfb5ccc27d2b2ac8787848282f2a15b3c407f350dc281b68` |
| `scanner-high.glb` | 21 656 | `b71d8ab86fe1a12542eac14e4185e17babf15ac086c3343acf8600a080ed985a` |
| `screen-wide.glb` | 13 904 | `220211ee38d51a521475caec06bb27aa231f5b1d43fd74cb93393cca47edfda3` |
| `warning-traffic.glb` | 18 192 | `b231e97424839b252e80555bc97d7360d2f04006cb3919675725a297bae049cd` |
| `Textures/colormap.png` | 11 813 | `35d7bd6900dde0208429eeaec87fa17fbf024ed59f3f4eab54bc92802eba9dd7` |

Ensemble : 164 789 octets. Les modèles réutilisent l'image couleur sous la même URL ;
leur géométrie et leurs matériaux sont partagés par placement et libérés au changement de carte.
