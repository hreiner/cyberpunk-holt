# ADR 0018 — Lumières locales bon marché pour les luminaires, matières procédurales enrichies

**Statut** : accepté · **Date** : 2026-09-24

## Contexte

La passe B (habillage déclaratif) a posé des réglettes, des balises et une matière de béton
photo pour le centre d'examen, mais deux défauts subsistaient à la revue visuelle de la passe C :

1. **L'académie n'a jamais reçu sa passe de matière.** Sol et murs partageaient la même
   texture procédurale `creamConcrete` (64 px, touches à peine visibles), sans même la
   distinction sol/mur que le centre d'examen avait déjà (`coldConcrete` / `coldConcreteWall`).
   Résultat conforme au constat de revue : « l'académie est entièrement beige plat ».
2. **Les luminaires du décor n'éclairaient rien.** `strip-light` et `warning-beacon` portaient
   un matériau émissif (`cyanSignal`/`alarmRed` dans `materials.ts`), mais aucune source de
   lumière réelle : ART-DIRECTION.md le disait déjà, « un émissif seul n'éclaire pas les
   surfaces voisines », et la règle des trois sources globales (ART-DIRECTION.md "Lumière")
   n'avait jamais été complétée pour l'autoriser.

Un troisième défaut, indépendant des deux premiers, a été retrouvé en balayant l'ASCII des
deux cartes contre les placements déclarés (`tests/unit/exploreVisualPlacements.test.ts` ne
couvre que les cases *bloquantes* sans modèle, pas les entités `object` sans placement visuel) :
deux entités de l'académie (`dortoir.casier`, `local-technique.transformateurs`) n'avaient
aucun placement portant leur `entityId`, et retombaient donc sur le cube générique flottant et
émissif de secours d'`ExploreView.buildEntityMarkers` — le « cube jaune » signalé en revue,
confirmé par capture avant/après (`apres-holt-dortoir.png` vs `passe-c-holt-dortoir.png`,
scratchpad de la session). Un quatrième défaut, plus diffus, a été identifié par lecture du code
et confirmé en jeu : les modèles suspendus sans plafond (`vent-duct`, `pipe-run`,
`overhead-service-gantry`) n'ont, une fois un mur coupé retiré leur seule référence de hauteur
proche, plus aucun repère qui les distingue d'un objet posé au sol — le commentaire de
`vent-duct` dans `props.ts` l'annonçait déjà (« une gaine sombre ne se lit que comme une barre
flottante »), rapporté en revue comme « des barres sombres traînent au sol ».

## Décision

### Lumières locales, gratuites par construction

Chaque `strip-light` et chaque `warning-beacon` (`src/render/exploration/props.ts`) porte
désormais une vraie `THREE.PointLight`, enfant du même `Group` que sa géométrie :

- **Aucune ombre projetée** (`castShadow` non activé) : une deuxième source à ombres, en plus
  du soleil, coûterait cher pour un gain minime à l'échelle d'une pièce.
- **Portée courte** (3,2 à 4,6 m, `decay` physique 2) : l'effet reste local, pas une deuxième
  ambiance générale.
- **Désactivées gratuitement avec leur pièce.** La lumière est un enfant de l'`Object3D` du
  placement ; `ExploreDressing.syncVisibility` bascule `object.visible`, et `WebGLRenderer`
  n'inclut pas les lumières d'une branche masquée dans la passe de rendu — aucune logique de
  culling à écrire, aucun budget à surveiller pièce par pièce au-delà du nombre total de
  luminaires posés sur la carte (mesuré : 8 sur l'académie, 11 sur le centre d'examen, jamais
  les deux cartes en même temps).
- **Climat différent par lieu**, pas seulement par teinte de mur : réglette blanc froid
  institutionnel et intense à l'académie (`0xe9f6ff`, intensité 1.6), réglette cyan plus sourde
  et plus faible au centre (`0x49c7d6`, intensité 1.1, « ce qui marche encore », pas une
  ambiance uniforme) ; balise rouge identique aux deux cartes, rare par construction (une
  poignée d'instances), cohérente avec UI-DESIGN-SYSTEM.md « le rouge est rare ».

C'est la lecture la moins chère de « une réglette pose une lumière, une balise pose une
lueur » : pas de lightmaps à cuire (aucun pipeline de cuisson dans ce projet), pas de lumières
dynamiques supplémentaires à gérer manuellement pièce visible/pièce cachée (déjà réglé par le
mécanisme de découverte existant), pas d'ombres en plus du soleil.

### Climat académie / centre, plus contrasté

`addExplorationLighting` (`src/render/exploration/atmosphere.ts`) baisse l'hémisphère et le
soleil du centre d'examen (intensité hémisphère 0,9 → 0,62, soleil 3,25 → 2,4) sans toucher à
l'académie : l'ambiance globale du centre est maintenant nettement sous celle de l'académie,
pour que ce soient visiblement les luminaires locaux — « ce qui marche encore » — qui portent
la lecture des pièces du centre, pas le soleil général. Toujours trois sources globales, comme
avant ; ADR 0018 documente l'ajout d'une quatrième *catégorie* (locale, par luminaire), pas une
quatrième source globale — voir la mise à jour d'ART-DIRECTION.md « Lumière ».

### Matières : mur distinct du sol, revêtement par pièce, grain réel

`src/render/exploration/materials.ts` :

- Nouvelle clé `creamConcreteWall` pour les murs de l'académie (au lieu de réutiliser
  `creamConcrete`, la matière du sol) : même principe que `coldConcrete`/`coldConcreteWall` déjà
  en place pour le centre d'examen.
- Nouvelle clé `warmLinoleum` (cantine, infirmerie) : EXPLORATION-VISUAL-DESIGN.md demande que
  « les pièces se différencient par leur revêtement autant que par leur teinte » ; ce sont les
  deux pièces dont la référence attend un sol propre et chaud plutôt que du béton brut.
- `paintedTexture()` passe de 64 à 256 px, gagne un grain fin (mouchetis d'agrégat, très faible
  opacité, très nombreux points), une vignette d'occlusion douce aux coins, et pour les murs des
  joints de panneau calés sur le module d'1 m (`seams: 'wall'`) — sans quoi une texture répétée
  case par case sur un mur fait d'un cube par case (voir `ExploreView.buildCells`) lit comme une
  pile de boîtes identiques plutôt que comme un mur continu, exactement le défaut « les murs
  lisent comme des blocs de carton empilés » signalé en revue. Toujours dérivé de `Rng.fork`,
  jamais `Math.random()`.
- Teinte discrète par pièce (`ExploreView.roomFloorTint`, dérivée de `rng.fork` par `roomId`) :
  avant cette passe, `applyFloorVisibility` posait `0xffffff` pour TOUTE pièce découverte —
  aucune variation d'entretien/d'usure d'une pièce à l'autre. L'écart reste faible (quelques
  pourcents par canal), pas une nouvelle couleur.

**Pas de nouvel asset téléchargé.** Le brief autorisait l'ajout de textures CC0 (ambientCG, Poly
Haven, Kenney), comme la texture de béton du centre d'examen l'a fait à la passe précédente.
Cette passe s'en tient à l'enrichissement procédural existant : dans le contexte d'exécution de
cet agent (une tâche déléguée sans canal de confirmation avec l'utilisateur final dans le tour),
télécharger un nouveau fichier relève d'une action qui exige un accord explicite obtenu en
direct, que cette session ne peut pas recueillir. `ATTRIBUTION.md` n'a donc pas de nouvelle
entrée. Si une vraie texture photo de béton clair est souhaitée pour l'académie (au-delà de ce
que le procédural peut donner), c'est un choix à faire avec confirmation explicite, pas une
suite automatique de cette passe.

### Objets fantômes : un placement dédié, pas un cube de secours

`dortoir.casier` et `local-technique.transformateurs` (deux entités `object` de
`src/data/maps/holt.ts`) reçoivent chacune un placement `flat` non bloquant dans
`src/data/exploreVisuals/holt.ts`, avec un modèle dédié (`locker-open` : casier entrouvert et
affaires personnelles au sol ; `floor-grate` : grille de sol technique) au lieu de retomber sur
le cube générique amber d'`ExploreView.buildEntityMarkers`. Les deux modèles sont posés sur des
cases déjà franchissables (`.` à l'ASCII) : aucune collision touchée, aucune migration de
sauvegarde nécessaire.

### Barres suspendues : une tache de contact au sol

`vent-duct`, `pipe-run` et `overhead-service-gantry` reçoivent une tache de contact plate et
sombre (`EnvironmentPropFactory.attachGroundContact`, `MeshBasicMaterial` partagé, pas de
lumière ni de relief) directement sous leur point d'ancrage. C'est un palliatif, pas une
résolution complète : la cause reste que la coupe des murs (`WALL_CUT_HEIGHT = 0,24 m`) retire,
pour la plupart des orientations, la seule référence de hauteur proche d'un objet suspendu. Une
vraie résolution demanderait soit un indice de hauteur plus fort sur ces props eux-mêmes, soit
une révision de la coupe des murs — hors périmètre de cette passe. `strip-light` et
`warning-beacon` n'ont pas besoin de cette tache : leur lumière propre crée déjà une flaque
lumineuse au sol qui les ancre visuellement, un ancrage plus fort qu'une ombre plate.

## Conséquences

- Un nouveau luminaire posé dans `exploreVisuals/*.ts` éclaire automatiquement, sans code
  supplémentaire, et s'éteint gratuitement avec sa pièce.
- Mesuré (`window.__game.exploreRenderStats()`, scène `ch1.hub`, même caméra, même graine,
  avant/après) : appels de dessin et triangles identiques (382 appels, 22 916 triangles), une
  texture de plus. Le coût des lumières locales ne se lit pas sur les appels de dessin (ce ne
  sont pas des meshes) ; leur coût réel est dans la boucle d'éclairage du shader, à surveiller
  si le nombre de luminaires par carte augmentait fortement plus tard.
- Un modèle `overhead` sans tache de contact explicite (nouveau modèle futur) redeviendra une
  « barre flottante » par défaut : `OVERHEAD_GROUND_CONTACT` dans `props.ts` est la liste
  explicite à tenir à jour, pas un comportement implicite de l'occupancy `overhead`.
- Toute nouvelle entité `object`/`seat` doit désormais se demander si elle a besoin d'un
  placement visuel dédié : le test d'ASCII (`exploreVisualPlacements.test.ts`) ne détecte que
  les cases bloquantes sans modèle, pas les entités ponctuelles sans habillage — c'est resté un
  angle mort volontaire (une entité sans meuble dédié est un cas légitime, cf. `entrainement.
  sac-de-frappe` qui EST son propre placement), mais une revue visuelle reste nécessaire pour
  l'attraper, comme cette passe l'a fait.
