# Pipeline personnages MPFB → Mixamo : constats et recettes

Retour d'expérience de l'étude visuelle du dortoir (Franklyn, Abigail, Zachary, Letitia, John,
Grover, l'enfant). Objectif : créer un nouveau personnage en quelques minutes sans refaire les
mêmes erreurs. Outils : `tools/characters/` ; rendu : `src/render/characters/` (jeu) et `src/dev/cadet.ts` (étude) ; attributions :
`public/assets/mixamo/ATTRIBUTION.md`.

## 1. Chaîne de production

1. **Spec JSON** (`tools/characters/specs/<id>.json`) : morphologie (`macro`), cibles de visage
   (`face`), peau, coiffure, vêtements, retouches optionnelles.
2. **Blender headless + MPFB2** (`build_character.py`) : crée l'humain, applique le rig `mixamo`
   (os réels `mixamorig:*`), habille, exporte un **GLB** dans `public/assets/mixamo/<id>/`.
3. **Three.js** : `cadetLooks.ts` (palette/rim/patchs), `mpfbAssets.ts` (patrons préchargés),
   `mpfbCadetRig.ts` (rig du jeu), `mixamoRetarget.ts` et `cadetStyle.ts` (style).
   `src/dev/cadet.ts` réemploie ce pipeline pour l'étude et ses poses supplémentaires.
4. **Revue** : `dormitory-aaa.html`, sélecteur en haut (touches 1–7), `?lead=<id>`, `?cast=1`.

Variables d'environnement : `BLENDER_EXE`, `BLENDER_USER_RESOURCES` (dossier où MPFB et les packs
sont installés ; **ne pas** utiliser `--factory-startup`, il empêche d'enregistrer les préférences).

Point d'entrée : `$holt-character` ; téléchargements : [MIXAMO-WORKFLOW](MIXAMO-WORKFLOW.md).
Le [diagnostic local](../process/TOOLS.md) distingue PATH et chemins déjà installés.
`run.sh` exige une spec connue, transmet `--python-exit-code 1` et arrête la chaîne sur
un échec Blender ou un GLB absent/vide, avant optimisation. Un ancien GLB ne doit pas
faire passer une construction ratée pour une nouvelle livraison.

## 2. Ajouter un personnage

1. Copier une spec proche, changer `id`, `macro`, `skin`, `hair`, `clothes`, `face`.
2. `tools/characters/run.sh <id>` (~15 s).
3. Ajouter l'entrée dans `cadetLooks.ts` (`tint`, `cloth`, `decals`, `rim`, `height`) et dans
   `CAST_ORDER` + `CAST_LABELS` (`dormitoryAAA.ts`).
4. Regarder de face, de profil et de dos en vue portrait avant d'itérer.

Pour corriger un personnage existant, reproduire d'abord le défaut et lire sa spec actuelle.
Les réglages de manches ci-dessous sont déjà présents pour Abigail et Letitia : ne pas
les appliquer une deuxième fois. `BLOUSE` est partagé ; changer sa palette touche les deux.
Une correction de tenue ne demande pas de changer `CAST_ORDER` ni les autres specs.

## 3. Assets MakeHuman (https://static.makehumancommunity.org/assets/assetpacks.html)

Packs installés (zip → `data/clothes` ou `data/hair` du dossier utilisateur MPFB) :
`suits03` (CC-BY), `shoes01`, `pants01`, `shirts01`, `hair01` (CC0). Liens directs :
`https://files2.makehumancommunity.org/asset_packs/<pack>/<pack>_cc0.zip` (`_cc-by` pour suits03).
Les CC-BY exigent l'attribution (déjà dans `ATTRIBUTION.md`).

- **Coiffure : préférer les cheveux natifs MPFB** (`short01–04`, `bob01/02`, `braid01`, `long01`,
  `ponytail01`, `afro01`). Ils s'ajustent au crâne sans retouche. Les cheveux des packs
  communautaires ont demandé des déformations (voir §5) et ont produit la plupart des défauts.
- **Uniforme masculin retenu** : `mindfront_m_suit_01` (veste ajustée + pantalon en un seul
  maillage), repeint marine. La parka `elvs_emt_uniform_*` est trop volumineuse.
- Les vêtements « male » s'ajustent aussi sur un corps féminin (mhclo suit la base), mais la
  silhouette reste masculine : préférer un haut féminin pour les filles.
- **Tenue féminine retenue** : chemisier `female_elegantsuit01` (jupe coupée) + `toigo_wool_pants`
  - `toigo_ankle_boots_female`.
- Enfant : `age` ≈ 0,15 dans `macro` ; hoodie `elvs_sporty_tracksuit_hoodie_dress1`.

## 4. Visage et peau

- Les cibles de visage se multiplient par `faceGain` (2,0 par défaut). Effet **faible à 1, lourd
  à 3** ; une cible à 0,5 × 2 est déjà forte. Les cibles asiatiques (épicanthus, compression du
  nez, pommettes) à 0,7 aplatissent le visage : rester à 0,15–0,35.
- Les noms de cibles réels : `targets/<zone>/<nom>.target.gz` (ex. `eyes/l-eye-scale-incr`,
  `mouth/mouth-angles-up`, `eyebrows/eyebrows-angle-down`). Une cible absente est signalée
  (`[character] target manquante`) sans faire échouer la construction.
- **On ne peut pas régler l'expression** (sourire franc, colère). Les cibles `mouth-angles-*`
  donnent au mieux un léger sourire.
- **Ne pas peindre la bouche** : un décalque de lèvres/dents sur le visage est laid (essayé, retiré).
- La teinte de peau se règle dans `cadetLooks.ts` (`tint.skin`, multiplicateur sur la texture). Les
  textures asiatiques sont jaunes : une teinte brun-orangé donne des visages orange ; rester
  sur des multiplicateurs peu saturés. Peaux foncées : teinte proche du blanc (sinon quasi noir).
- Sourcils/cheveux : `tint` pour une simple teinte, `hairPaint` pour recolorer entièrement (blond
  platine, châtain) en gardant l'alpha.

## 5. Pièges techniques (et solutions)

| Piège                                                                                                   | Solution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ombre noire / « nœuds » au cou et aux poignets                                                          | pas de coque d'encre sur la peau ni sur les cheveux (`inked` dans `styleCadet`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Mains pâles et raides                                                                                   | boucle de doigts détendue dans le retargeter (`curl`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| FBX : squelettes dupliqués, corps trop grand                                                            | exporter en **GLB** (un seul skin)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| GLB lourds (27 Mo/perso, puis ~11 Mo)                                                                   | `maxTexture` 1024 (spec) ; export avec `export_apply=True` + `export_morph=False` (les cibles de visage en shape keys pesaient ~8 Mo et ne servent pas à l'exécution) ; `run.sh` enchaîne `gltf-transform prune` (données orphelines) puis `webp` (textures). Résultat : **~2,1–2,5 Mo/perso** (7 perso = 16 Mo au lieu de 78). Vérifier le rendu après coup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Décalques (bandes, écussons) qui flottent ou se détachent des manches                                   | ne pas les attacher à un os : **les skinner comme le vêtement** (poids du sommet le plus proche + inverse du skinning, `makeCloth`/`stick`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Décalque mal placé sur la peau                                                                          | la géométrie brute du maillage peau n'est pas dans le repère skinné ; utiliser `inverseSkin` (matrice de skinning inverse), jamais un simple décalage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Décalque invisible (sous le tissu)                                                                      | soulever de ~5 mm le long de la normale, `polygonOffset`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Texte d'écusson inversé                                                                                 | `flip` de la texture (U miroir) ; à vérifier des deux côtés                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Pose de repos MPFB = A-pose                                                                             | orienter les patchs selon l'axe bras→coude, pas selon les axes monde                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Espace entre haut et pantalon                                                                           | rallonger l'ourlet (`stretchDown`) + gonfler légèrement (`slim` négatif) pour éviter le z-fighting                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Manches désalignées des mains : la peau de l'avant-bras dépasse à côté du poignet, manche « en cloche » | Le chemisier `female_elegantsuit01` n'est pas calé sur l'axe de l'avant-bras du rig Mixamo : l'anneau de poignet est **décalé de ~10 cm** (ce qui ressemble à une évasion). La manche **dépasse aussi le poignet** (fin à 1,24 de la longueur d'épaule à poignet, ~5 cm sur la main) : `squashFrom`/`endAt` écrasent la fin de la manche le long de l'avant-bras pour qu'elle s'arrête au poignet. `slimSleeves` `{"from":0.25,"centre":0.6,"factor":0.9,"squashFrom":0.75,"endAt":0.98}` recentre chaque anneau sur l'axe épaule-coude-poignet (centre interpolé entre tranches, sinon la manche fait des vagues) puis resserre légèrement. Mesure : décalage d'anneau 3-5 cm → 1-3 mm. Le log affiche le décalage et le rayon du poignet. **Ne pas** réduire par un simple facteur radial : ça ne corrige pas le décalage et amincit la manche sous le poignet |
| Mesurer un vêtement en jeu                                                                              | Dans la console de la page : pour chaque sommet du vêtement pondéré à ≥ 0,9 sur les os d'avant-bras/main, comparer sa position au repos (`geometry.position`) à l'axe coude→poignet (`boneInverses` inversées)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Jupe non voulue                                                                                         | `cutBelow` (supprime les sommets sous une hauteur)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Veste trop volumineuse                                                                                  | `slim` (rentre le vêtement le long des normales) : **max ≈ 6 mm**, au-delà les bras traversent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Tresses des packs derrière la tête, invisibles de face                                                  | les retourner devant le buste déforme les mèches en « écharpe » : à éviter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Tresses fabriquées en code                                                                              | 3 brins hélicoïdaux (`TubeGeometry`), skinnés (tête + haut du vêtement) ; **placées dans le dos** à la demande du propriétaire                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Retouches de coiffure disponibles dans la spec (à utiliser avec parcimonie) : `hairCutBelow`,
`hairShorten`, `hairBack`, `hairFlip` (déconseillé).

## 6. Style visuel (cel + Edgerunners)

- Toon 4 paliers (`ramp`), peau à paliers plus doux (paliers durs = taches sur le visage).
- Contour d'encre par coque inversée, **épaisseur 0,0042 m** (en mètres, pas en centimètres).
- **Rim néon** par Fresnel (`rimLight`) : couleur du personnage = halo de son portrait
  (`docs/art/image-generation/briefs/P*.md`), complément rose ; force 0,5 vêtements, 0,16 peau,
  0,12 cheveux.
- Repeinture des vêtements par luminance (`cloth.gain/lo/range`), le blanc du col de chemise est
  assombri (`dropAbove`) pour ne lire que la veste.

## 7. Retarget des animations

Les clips Mixamo (`exo/idle.fbx`, `exo/walk.fbx`) sont lus sur un squelette invisible cloné par
personnage, puis recopiés sur les os MPFB (rotations monde pour colonne/tête, visée pour les
membres **et les mains** — poignet vers la base du majeur —, doigts pliés dans le repère de la main). La vitesse de marche se déduit de la course du pied
(`stats.stride`). Le rig MPFB « mixamo » a le repos en A-pose : c'est le retargeter, pas le rig,
qui gère la différence avec la T-pose Mixamo.

### Poses supplémentaires

`public/assets/mixamo/exo/` contient aussi `talk`, `argue`, `disappointed`, `salute`, `look`,
`nervous`, `sad`, `wave`, `run` (FBX 2019, sans peau, 30 fps ; même squelette Exo, donc le même
retargeter). `cadet.ts` les charge à la demande (`POSES`, `cadet.play(nom | null)`, fondu enchaîné
avec l'idle ; la marche reprend toujours la main). Sélecteur de pose dans la scène, `?pose=<nom>`,
et `?cast=1` attribue une pose différente à chaque figurant. Pour en ajouter : télécharger le clip
dans `exo/`, l'ajouter à `POSES` et à `POSE_LABELS`.

Téléchargement via le MCP Mixamo : **il faut le mode headless** (`MIXAMO_HEADLESS=1` dans
`.mcp.json`). En mode fenêtre, `save_as` échoue avec « browser has been closed ».

## 8. Dans le jeu (ADR 0041)

`MpfbCadetRig` (`src/render/characters/mpfbCadetRig.ts`) remplace l'humanoïde Quaternius pour
les six cadets et l'enfant, en exploration comme en tactique ; `?rig=quaternius` rétablit
l'ancien rendu. `mpfbAssets.ts` précharge les GLB et les clips, habille chaque personnage une
fois (patron), puis chaque rig clone le patron. Clips du jeu : `MPFB_CLIP_FILES` (un clip absent
retombe sur le repos). Ajouter un personnage au jeu = l'ajouter à `LOOKS` ; un acteur dont l'id
diffère passe `mpfbLook` à `createHumanExplorationRig`.

## 9. Ce qui reste à améliorer

- Visages : têtes MPFB génériques, expressions impossibles → envisager une texture de visage peinte
  à la main ou un autre générateur.
- Coiffures : passer aux cheveux natifs pour Abigail, Zachary, Grover, Letitia (décision en attente).
- Uniformes des références (chemise+cravate de Grover, veste de
  cérémonie de Letitia, tunique à col mao de Zachary) seulement approchés.
- La note de fin de pilote du 30 septembre (« marche non revérifiée, verify non lancé »)
  décrivait cette étape isolée. L'intégration du 3 octobre est livrée (ADR 0041).
  Toute modification ultérieure de tenue/retarget demande sa propre revue de mouvement ;
  les tests de code ne remplacent pas cette revue.
