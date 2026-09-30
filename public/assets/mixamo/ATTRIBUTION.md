# Personnage et animations Mixamo (étude du dortoir)

Source : mixamo.com (Adobe), téléchargés le 30 septembre 2026 via le MCP `mixamo`.
Personnage : « Exo Gray » (bibliothèque Mixamo). Format FBX 2019, 30 ips, textures intégrées.
Usage : étude visuelle `dormitory-aaa.html` uniquement (`src/dev/franklynExo.ts`).

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
retargetées à l'exécution par `src/dev/mixamoRetarget.ts`. Sortie MPFB/MakeHuman : CC0.
Reconstruction : `blender --background --python build_franklyn.py -- <dossier>` (voir variables
`FRANKLYN_FACE_GAIN` et `FRANKLYN_SUIT`).

## MakeHuman community asset packs (Franklyn, MPFB build)

- `mindfront_m_suit_01` — Mindfront, CC-BY (pack `suits03`), repainted navy.
- `culturalibre_hair_05` — culturalibre, CC0 (pack `hair01`), recoloured near-black.
- `toigo_ankle_boots_male` — Margaret Toigo, CC0 (pack `shoes01`).
- MPFB system assets (base mesh, skin `young_asian_male`, hair `culturalibre_hair_05`, eyes, eyebrows) — CC0.
Source: https://static.makehumancommunity.org/assets/assetpacks.html

## Rest of the cast (built with tools/characters)

- Every cadet wears `mindfront_m_suit_01` (CC-BY, Mindfront) repainted navy; the child wears `elvs_sporty_tracksuit_hoodie_dress1` (Elvaerwyn, CC-BY, pack `suits03`).
- Hair: `elvs_double_mh_braid`, `rehmanpolanski_hair_bun_brown`, `cortu_shaggy_green_hair`, `cortu_short_messy_hair`, `toigo_blunt_bob_with_bangs` (pack `hair01`, CC0), `short01` (MPFB system, CC0); all recoloured in `src/dev/cadetLooks.ts`.
- Boots and shoes: `toigo_ankle_boots_male`, `toigo_ankle_boots_female` (CC0, pack `shoes01`), MPFB `shoes02`.
- Skins: MPFB system skins (`young_*`), CC0.
