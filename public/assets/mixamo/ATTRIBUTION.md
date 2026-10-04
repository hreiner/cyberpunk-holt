# Personnage et animations Mixamo (étude du dortoir)

Source : mixamo.com (Adobe), téléchargés le 30 septembre 2026 via le MCP `mixamo`.
Personnage : « Exo Gray » (bibliothèque Mixamo). Format FBX 2019, 30 ips, textures intégrées.
Usage initial : étude visuelle `dormitory-aaa.html`. Les clips Exo sont désormais partagés
par le pilote (`src/dev/cadet.ts`) et le jeu (`src/render/characters/mpfbAssets.ts`, ADR 0041).

| Fichier          | Contenu                                        | ID animation |
| ---------------- | ---------------------------------------------- | ------------ |
| `exo/idle.fbx`   | Exo Gray avec peau + Neutral Idle (~33 Mo)     | 115170901    |
| `exo/walk.fbx`   | Walking, sur place, sans peau                  | 118080901    |

Licence Mixamo : usage libre, y compris commercial, à condition d'être intégré dans un
projet (pas de redistribution des personnages ou animations seuls). À revalider avant tout
usage hors étude ; `exo/idle.fbx` est lourd et devra être converti en glTF compressé si le
personnage est retenu pour le jeu.

## Franklyn sur mesure (MPFB2)

`franklyn/franklyn.glb` : personnage généré par script (`D:\AgenticCoding\tools\blender\scripts\build_franklyn.py`,
hors dépôt) avec MPFB2 2.0.17 dans Blender 4.2 LTS et le pack « makehuman_system_assets » (CC0).
Squelette Mixamo (`mixamorig:*`) ; les animations Mixamo (`exo/idle.fbx`, `exo/walk.fbx`) sont
retargetées à l'exécution par `src/render/characters/mixamoRetarget.ts`.
Ce script externe est le précédent du pilote. La reconstruction actuelle emploie
`tools/characters/specs/franklyn.json` et `tools/characters/run.sh franklyn` ; voir
[`CHARACTER-PIPELINE-FINDINGS`](../../../docs/art/CHARACTER-PIPELINE-FINDINGS.md).
Les assets de base MakeHuman sont CC0 ; les vêtements communautaires conservent leur licence ci-dessous.

## MakeHuman community asset packs (Franklyn, MPFB build)

- `mindfront_m_suit_01` — Mindfront, CC-BY (pack `suits03`), repainted navy.
- `culturalibre_hair_05` — culturalibre, CC0 (pack `hair01`), recoloured near-black.
- `toigo_ankle_boots_male` — Margaret Toigo, CC0 (pack `shoes01`).
- MPFB system assets (base mesh, skin `young_asian_male`, hair `culturalibre_hair_05`, eyes, eyebrows) — CC0.
Source: https://static.makehumancommunity.org/assets/assetpacks.html

## Rest of the cast (built with tools/characters)

- Franklyn, Zachary, John et Grover : `mindfront_m_suit_01` (CC-BY, Mindfront), repeint marine.
- Abigail et Letitia : `female_elegantsuit01` (MakeHuman system assets, CC0, jupe coupée)
  et `toigo_wool_pants` (MRT, CC0, métadonnées du fichier `.mhclo`).
- Enfant : `elvs_sporty_tracksuit_hoodie_dress1` (Elvaerwyn, CC-BY, pack `suits03`).
- Cheveux actuels : Franklyn `culturalibre_hair_05`, Abigail `elvs_double_mh_braid`,
  Grover `cortu_shaggy_green_hair`, Letitia `cortu_strawberry_cloud_hair`,
  Zachary `toigo_blunt_bob_with_bangs`, enfant `cortu_short_messy_hair` (pack `hair01`, CC0),
  John `short01` (MPFB system, CC0). Repeinture dans `src/render/characters/cadetLooks.ts`.
- Boots and shoes: `toigo_ankle_boots_male`, `toigo_ankle_boots_female` (CC0, pack `shoes01`), MPFB `shoes02`.
- Skins: MPFB system skins (`young_*`), CC0.

Inventaire réconcilié avec les sept specs le 4 octobre 2026. Licences des packs :
[catalogue MakeHuman](https://static.makehumancommunity.org/assets/assetpacks.html) ;
les coiffures exactes sont listées CC0 dans [Hair 01](https://static.makehumancommunity.org/assets/assetpacks/hair01.html).
Le fichier local `elvs_double_mh_braid.mhclo` conserve un ancien en-tête AGPL3 ; la fiche
du pack distribué nomme Elvaerwyn et CC0 pour cet asset. Conserver la source du pack
avec les masters lors d'une nouvelle production, plutôt que déduire sa licence du seul en-tête.
