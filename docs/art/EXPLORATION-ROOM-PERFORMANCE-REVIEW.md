# Revue de performance — premier accès aux salles d'exploration

**État : mesures, revue visuelle et vérification des ressources terminées · 2026-10-03**

Cette revue compare le premier accès aux salles avant et après stabilisation des lumières et
précompilation. Les [mesures compactes](reviews/room-performance/metrics.json) conservent les
résultats par salle et les six cycles de vérification des ressources.

## Protocole et diagnostic

Le relevé porte sur 15 pièces atteintes, sans capture d'écran pendant les déplacements, dans
Chromium 1600 × 900 en mode développement, sur GTX 1070 avec ANGLE/D3D11. Il mesure le premier
accès à chaque salle, les tâches longues, les programmes avant/après et les groupes de temps
des appels de rendu et de logique. Chaque relevé utilise un navigateur neuf ; le cache de
shaders du pilote GPU n'est pas contrôlé. Ce sont des temps d'image et d'appels JavaScript,
pas des mesures GPU par requête de chronométrage.

La trace attribue les blocages froids à la compilation de variantes de shaders au cours de
`renderer.render`; `getProgramInfoLog` domine les traces des images de **2 350 à 3 567 ms**. Les variantes
changent avec `NUM_POINT_LIGHTS`, `NUM_SPOT_LIGHTS` et les combinaisons d'ombres selon les sources
visibles dans la pièce. En parallèle, les appels de logique de jeu — déplacement, interactables
et tick — restent sous **4 ms** (maximum observé : 3,1 ms avant, 2,7 ms après).

## Résultats

| Cartes | Pièces atteintes | Tâches longues, avant → après | Frame maximale, avant → après | `renderer.render` maximal, avant → après | Maximum de programmes compilés, avant → après |
|---|---:|---:|---:|---:|---:|
| HOLT | 10 / 10 | 3 → 1 | 2 849,9 → 66,7 ms | 2 853,3 → 68,2 ms | 92 → 48 |
| Centre d'examen | 5 / 5 | 4 → 0 | 3 566,5 → 16,8 ms | 3 571,2 → 16,2 ms | 102 → 33 |
| **Total / maximum** | **15 / 15** | **7 → 1** | **3 566,5 → 66,7 ms** | **3 571,2 → 68,2 ms** | **102 → 48** |

Le relevé après correction contient encore une tâche longue d'environ **70 ms** à la cour intérieure
HOLT. Deux pièces ont également créé un programme supplémentaire dans leur intervalle de
mesure, sans retrouver les blocages de plusieurs secondes. La première entrée de
l'administration HOLT a atteint 50 ms. Le résiduel est donc visible dans les données ; ces
chiffres ne constituent pas une validation de performance parfaite.
Les pièces ayant ajouté au moins un programme pendant leur intervalle de mesure sont passées de
**7 sur 15 à 2 sur 15**.

## Changement appliqué

`StableSceneLights` réserve au plus huit emplacements ponctuels par carte selon l'intensité
et la distance horizontale au centre de la caméra, avec un emplacement stable par projecteur,
y compris ceux à ombre. La visibilité des sources est
représentée par leur intensité GPU au sein d'une hiérarchie stable. Le feu conserve son
animation. `compile(scene, camera)` prépare une fois les variantes des meshes, y compris ceux
qui restent masqués, avec la scène, la caméra et le target de rendu employés par le composer ;
leur contenu ne devient visible qu'à la découverte. `compileAsync` a été écarté car son polling
Three.js n'est pas annulable quand la vue est détruite.

Le même lot retire les chemins morts issus des anciennes coupes de murs et
du suivi des corridors. Les transformations des murs sont maintenant statiques, et les clés de
visibilité sont préparées avant les transitions, sans changer la règle de découverte.

## Vérification

- `npm run verify` passe : typage, lint, **781 tests unitaires** et build.
- Les **9 parcours Playwright** passent : chapitre 1 jusqu'au fourgon, chapitre 2 jusqu'au
  bilan, clics réels sur objets et portes, reprise de l'armoire et résultat automatique du combat.
- Les **18 visites** de l'audit multi-cartes passent, avec ouvertures et découverte conservées.
  Après échauffement, les six cycles centre → conduits → campement → HOLT se stabilisent à
  **318 géométries / 137 textures**, sans géométrie GPU sans propriétaire. La fermeture du
  ventilateur disparaît après ouverture de sa porte réelle.
- Huit vues ont été relues : [dortoir](reviews/room-performance/dortoir.jpg),
  [cour](reviews/room-performance/cour.jpg), [cantine](reviews/room-performance/cantine.jpg),
  [hangar](reviews/room-performance/hangar.jpg), [centre](reviews/room-performance/centre.jpg),
  [bal](reviews/room-performance/bal.jpg), [campement](reviews/room-performance/campement.jpg),
  [conduits](reviews/room-performance/conduits.jpg). Murs, portes, éclairage, reflets et repères
  d'interaction restent lisibles ; les contenus inconnus restent masqués.

Les premières entrées mesurées restent entre **17 et 67 ms** sur cette configuration. La
préparation des shaders se fait à la construction de la carte ; de nouveaux matériaux chargés
plus tard peuvent encore ajouter une variante. Les temps observés ne garantissent pas une
cadence identique sur d'autres appareils.

Décision associée : [ADR 0040 — Stabiliser le coût du premier accès aux salles](../process/adr/0040-stabiliser-cout-entree-salle.md).
