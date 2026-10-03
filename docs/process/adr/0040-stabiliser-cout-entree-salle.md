# ADR 0040 — Stabiliser le coût du premier accès aux salles

**Statut : accepté · Date : 2026-10-03**

## Contexte

La première visite d'une salle HOLT ou du centre d'examen pouvait bloquer l'image pendant
plusieurs secondes, alors que les transitions suivantes restaient fluides. La trace attribue
ces pics à la compilation de variantes de shaders pendant `renderer.render` : les nombres de
`PointLight` et `SpotLight` visibles, ainsi que leurs variantes d'ombres, changeaient selon la
salle. `getProgramInfoLog` apparaît dans les longues tranches de 2,35 à 3,57 s. La logique de
jeu reste sous 4 ms dans les mesures ; elle n'explique pas ces blocages.

La livraison des murs entiers (ADR 0039, commit `a0f543f`) a supprimé l'ancien rendu conditionnel
des murs. Le nettoyage de ses chemins morts et la stabilité des ressources GPU accompagnent la
correction des accès à froid, sans modifier la découverte des pièces ni la visibilité de leur
contenu.

## Décision

- Garder un ensemble stable d'**au plus huit emplacements de lumière ponctuelle par carte**. Les sources locales
  candidates reçoivent les emplacements selon leur intensité et leur distance horizontale au centre de la caméra,
  pondérées par `intensité / (1 + distance²)`. Les changements de salle modifient les valeurs
  envoyées au GPU, pas le nombre ni la structure des lumières compilées.
- Réserver un emplacement stable à chaque projecteur, y compris ceux avec ombre. La hiérarchie de visibilité des
  sources est traduite en intensité GPU, sans ajouter ou retirer de lumière de la scène.
  L'animation du feu conserve son vacillement.
- Précompiler une fois les matériaux de la scène avec `renderer.compile(scene, camera)`, y compris
  ceux des contenus encore masqués. La compilation utilise la scène, la caméra et le target de
  rendu du composer ; les pièces inconnues restent cachées et aucun contenu ne clignote à l'écran.
- Ne pas utiliser `compileAsync` : Three.js maintient un polling interne qui n'est pas annulable
  à la destruction d'une vue. Le préchauffage synchrone a un propriétaire et un cycle de vie
  explicites.
- Conserver la découverte comme filtre de contenu. Les murs restent statiques et entiers ; la
  découverte change les finitions et le mobilier de la pièce, jamais l'enveloppe.

## Conséquences

- Les entrées dans les autres pièces ne doivent plus créer une nouvelle variante liée au nombre
  de lumières ponctuelles ou de projecteurs.
- Le chemin GPU est préparé avant l'affichage du contenu nouvellement découvert. Les personnages,
  accessoires et leurs animations restent soumis aux règles de découverte habituelles.
- La priorité des sources peut changer leur contribution à l'éclairage local, mais ne crée pas
  de nouvelle combinaison structurelle de lumières.
- La revue des mesures avant/après est consignée dans
  [EXPLORATION-ROOM-PERFORMANCE-REVIEW.md](../../art/EXPLORATION-ROOM-PERFORMANCE-REVIEW.md).
  Les premières entrées mesurées sur GTX 1070 passent de pics de plusieurs secondes à
  17–67 ms. La préparation se fait à la construction de la carte ; les nouveaux matériaux
  chargés ensuite peuvent encore ajouter une variante.
