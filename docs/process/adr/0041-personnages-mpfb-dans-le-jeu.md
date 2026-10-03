# ADR 0041 — Les cadets MPFB remplacent les humanoïdes Quaternius dans le jeu

**Statut : accepté · Date : 2026-10-03**

## Contexte

L'étude du dortoir (ADR 0034) a produit une distribution complète : les six cadets et l'enfant,
construits avec MPFB2 dans Blender (`tools/characters`), habillés d'un uniforme HOLT, rendus en
cel-shading avec contour d'encre et liseré néon, animés par des clips Mixamo reciblés sur leur
squelette (`docs/art/CHARACTER-PIPELINE-FINDINGS.md`). Le jeu, lui, montrait encore les
humanoïdes Quaternius recolorés, avec cheveux et uniforme en primitives. Le contrat
`CharacterRig` (ADR 0004 / 0009) a été écrit pour permettre ce remplacement sans toucher au
gameplay.

## Décision

- Le pipeline quitte `src/dev` pour `src/render/characters/` : `cadetLooks.ts` (palette et
  décalques par personnage), `cadetStyle.ts` (style), `mixamoRetarget.ts` (reciblage),
  `mpfbAssets.ts` (chargement) et `mpfbCadetRig.ts` (le rig de jeu). L'étude du dortoir les
  réemploie depuis cet emplacement.
- `MpfbCadetRig` implémente `ExplorationCharacterRig`. L'anneau, l'étiquette et la silhouette
  « rayon X » sortent de `CadetRig` dans `RigOverlay`, partagé par les deux rigs : les règles de
  lisibilité tactique restent les mêmes (hauteur majorée, remplissage émissif, épaulettes à la
  couleur d'équipe, mise en évidence de l'unité active).
- `createCadetExplorationRig` et `createHumanExplorationRig` choisissent le rig MPFB quand le
  personnage en a un (les six cadets, l'enfant des conduits et le suiveur `enfant` via
  `mpfbLook`). Adultes, gangers et figurants anonymes gardent Quaternius. `?rig=quaternius`
  rétablit les anciens humanoïdes pour comparer.
- L'habillage (repeinture des atlas, décalques projetés, coques d'encre) est fait **une fois par
  personnage** au préchargement, sur un patron ; chaque rig clone ce patron. Les rigs restent
  synchrones, comme le veut `ExploreView`.
- `preloadCadetAssets` charge aussi la distribution MPFB. Un échec n'empêche pas de jouer : le
  jeu retombe sur Quaternius et l'écrit dans la console.
- Correspondance des animations : `idle`, `walk`, `run` (requis), `shoot`, `down`, `revive`
  (« Getting Up »), et les poses d'exploration `talk`, `inspect` (« Looking Around »), `lean`.
  Un clip absent retombe sur le repos ; `revive` revient au repos tout seul en fin de clip.
  La chute (« Falling Back Death ») et le relevé (« Getting Up », réduit à 3,3 s) ont les hanches
  figées à l'aplomb du repos : le gameplay place le corps, le clip ne le déplace pas.
- Pose d'exploration `dance` (trois danses Mixamo, choisie par personnage) : une entité PNJ de
  carte peut porter `pose: 'dance'` (`NpcEntity.pose`). Au bal, Abigail danse (« Elle retourne
  vers la piste »). Le rig Quaternius de repli reste debout.
- L'exploration **marche** au lieu de courir : `LEADER_SPEED` passe de 4 à 2,2 cases/s (une
  case = 1 m). Le clip de marche Mixamo est animé pour ~1,3 m/s ; à 4 m/s, les jambes tournaient
  trois fois trop vite. Choix du propriétaire : marche soutenue, déplacements ~45 % plus lents.
- Coût de rendu : les décalques d'un personnage sont fusionnés en un seul maillage (atlas), et
  seuls les volumes pleins (peau, vêtements, chaussures, cheveux) projettent une ombre — un cadet
  passe d'environ 25 maillages à 11, et chaque maillage en moins l'est aussi dans chaque passe
  d'ombre.

## Conséquences

- Le poids au chargement augmente : environ 16 Mo de GLB pour les sept personnages (au lieu de
  quelques Mo), plus environ 10 Mo de clips sans peau. L'ancien `exo/idle.fbx` (33 Mo, avec la
  peau de l'Exo) est remplacé par « Standing Idle » sans peau (1,1 Mo) ; le mode de comparaison
  `?body=exo` de l'étude du dortoir, qui en lisait le maillage, est retiré.
- Chaque cadet pèse environ 20 000 sommets, plus la coque d'encre sur les vêtements : la scène
  tactique dépasse 300 000 triangles. Les dents, invisibles à la distance de jeu, sont retirées
  des patrons. Si la cible de 30 IPS n'est pas tenue sur le matériel de référence, réduire
  d'abord les coques d'encre en tactique.
- Le reciblage ne transmet pas la torsion de l'avant-bras ; les mains suivent la direction du
  poignet et les doigts se plient dans le repère de la main.
- Les silhouettes Quaternius des cadets (`addHair`, `addUniformDetails`, `addPilotFranklyn`)
  restent en place pour le repli et pour le pilote du dortoir (`?rig=quaternius`).
