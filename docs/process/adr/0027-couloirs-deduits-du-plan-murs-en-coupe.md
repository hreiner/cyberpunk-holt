# ADR 0027 — Les couloirs, déduits du plan, coupent leurs murs quand Franklyn y est

**Statut : accepté · Date : 2026-09-26**

## Contexte

Les murs en coupe (ADR 0013 §6, `08-EXPLORATION.md` « Murs en coupe ») se calculaient sur le
pourtour des seules `RoomDef` : un mur entre la caméra et l'intérieur d'une pièce est rendu à
0,4 m. Les couloirs ne sont pas des `RoomDef` (ils n'ont ni titre, ni découverte, ni sol teinté) :
leurs murs restaient pleins. La revue 5.11 l'a relevé (`ENGINE-COUPLING.md` §6) : dans le
couloir de ceinture de `holt-nuit`, où se joue toute la fuite, le mur est (x = 25) cachait
Franklyn et ses deux suiveurs ; seules l'étiquette et la balise restaient lisibles. Le même
défaut existait au chapitre 1 (`holt`, étape « temps libre », qui démarre dans ce couloir).

Options écartées :

1. **Déclarer chaque couloir en `RoomDef`** : il faudrait un titre et une découverte qui n'ont
   pas de sens pour un couloir, et chaque carte future devrait y penser (les conduits l'ont
   fait à la main au lot 5.9).
2. **Un statut « couloir » annoté dans les cartes** : une donnée de plus à tenir, pour une
   information que le plan donne déjà.
3. **Couper les murs de couloir en permanence** : le mur du couloir est souvent le mur du fond
   d'une pièce voisine (les dortoirs, la cour, les salles d'entraînement) ; le couper toujours
   aurait aplati ces pièces vues de l'intérieur, au chapitre 1 comme au chapitre 2.

## Décision

- **Un couloir est déduit du plan** (`computeCorridors`, `src/explore/corridors.ts`, sans
  `three` ni DOM) : une composante connexe (quatre voisins) de cases d'espace — sol, mobilier,
  végétation — hors de tout rectangle de `RoomDef`. Ses murs sont les cases `wall`/`door` qui
  le bordent, avec le côté qu'elles occupent (`north`/`south`/`east`/`west`) ; un coin qui ne
  le touche qu'en diagonale reçoit ses deux côtés, comme le coin d'un anneau de pièce.
- **La coupe d'un couloir ne vaut que quand le meneur y est** (`ExploreView.syncActiveCorridor`).
  Sur une case de porte, rien ne change (pas de bascule au passage du seuil) ; dans une pièce,
  le couloir est quitté et les murs reprennent leur hauteur. La règle de coupe est celle des
  pièces (`isCut`, selon l'orientation de la caméra), réévaluée au changement de couloir, jamais
  par image.
- Aucun champ nouveau dans `MapDef`. Les cartes existantes : trois couloirs sur `holt` et
  `holt-nuit` (x = 1-3, 18-20, 22-24), la trouée de sortie du `campement` ; aucun sur
  `centre-examen` ni `conduits` (tout y est déjà en `RoomDef`).

## Conséquences

- La fuite se lit : Franklyn et sa file sont visibles dans le couloir de ceinture. Au chapitre
  1, les mêmes couloirs de `holt` gagnent la même lisibilité ; les vues depuis une pièce
  (dortoirs, hall du centre d'examen) sont inchangées.
- Les ornements et commandes de porte d'un mur de couloir coupé disparaissent avec lui (règle
  existante des murs coupés) : quelques appels de dessin en moins quand on est dans un couloir.
- Une carte future n'a rien à déclarer : un espace hors pièce est un couloir. Si un jour un
  extérieur ouvert (hors `RoomDef`) touche des murs, il sera traité en couloir ; le déclarer en
  `RoomDef` `alwaysDiscovered` (comme la cour du centre d'examen) reste la façon de le soustraire
  à cette règle.
- Gardé par `tests/unit/exploreMap.test.ts` (« les couloirs, déduits du plan »).
