# Animations ciblées 16–17 — production et contrôle final

8 novembre 2026. Les deux candidates `blue-purple-page16-motion05.json` et
`blue-purple-page17-motion05.json` sont intégrées dans la sélection complète v9,
avec couverture12s. Le paysage évoqué comme «page18» par le propriétaire appartient
à la page16 dans le découpage courant.

Sélection contrôlée : `anime/motion-comics/projects/blue-purple-pages01-21-v9.json`,
SHA256 `0b8684a4a97f82bf73fc0c0f2446c4f4868c4e4cec4b0fec6f515cc119269e93`.
Moteur1.2.0,38 tests du socle réussis. Contrat et ancres dans
[CONTRACTS.json](CONTRACTS.json) et [ANCHORS.json](ANCHORS.json).
Format documenté par [ADR0053](../../../../../../process/adr/0053-motion-comics-digital-reveal-and-cover.md).

## Page16 : paysage puis véritable carte

Le dessin elfique initial reste exact avant le déclenchement. À1,38s locales, il se
désagrège en12×6 tuiles dont les décalages et les opacités sont calculés continûment
depuis le temps narratif. La carte de NightCity fournie par root est recomposée puis
exactement tenue à2,43s. La transition dure1,05s ; ce ne sont pas quelques images
successives d'une carte elfique qui pulse.

Le nouveau mode `digitalReveal` de `core.js`/`layers.js` utilise deux vrais PNG et
conserve les chemins de médias/snapshots du format existant. L'effet historique
`digitalVision` de la page3 conserve son comportement ; ses LAT/LON codés ne sont pas
réemployés. Les lettres françaises sont composées après l'art, sans mouvement.

La carte finale est le schéma subjectif éditable préparé par root depuis le récit et
l'esprit de l'écran9.2 : HOLT dans les Badlands au nord, position du groupe, autre
signal orange inconnu et point vert. Géographie non calibrée, aucun itinéraire ni
coordonnée inventée. La nouvelle page statique OFF montre cette carte finale ; le
master elfique historique reste intact. La miniature ON montre l'état initial avant
la révélation. Durée16,25s, voix et temps des trois prises inchangés.

## Page17 : trois bandes, un seul tir

Le clean plate final de l'artiste est `motion-02/art/p17-clean-v2.png`,1774×887,
SHA256 `86b8c06d8557cfdf111f811266887d0a291a1ca345ab3313593638447d2088d6`.
Le draft `p17-clean.png` est écarté. Les acteurs, le garde-corps et la marque finale
du poteau sont restaurés depuis l'art v8 à la définition de sortie :334457 pixels
protégés. Les gouttières diagonales réelles sont mesurées et suivies par les masques.
Aucun corps ni bras ne se déforme, aucune coupe rectangulaire ne révèle la bande voisine.

| État | Page17 locale | Chapitre avec couverture |
| --- | ---: | ---: |
| Haut clean révélé | 4,07s | 384,96s |
| Départ unique, flash et trajectoire | 4,67s | 385,56s |
| Milieu révélé et impact | 4,75s | 385,64s |
| Milieu clean après impact | 4,95s | 385,84s |
| Bas et bulle de Wendy révélés | 5,10s | 385,99s |
| Entrée de la prise Wendy | 5,13s | 386,02s |

La révélation est cumulative : les bandes déjà montrées restent visibles. Le flash
initial dure80ms, puis le haut revient clean ; le milieu révèle l'impact pendant200ms
puis revient clean. Le bas et sa bulle restent absents avant leur ancre. Une petite
vapeur locale suit l'impact. Le master OFF conserve le comics statique complet approuvé.
Seule l'entrée de Wendy est retardée de700ms ; sa prise ne change pas et la durée de
page reste10,902222s. Les ancres sont partagées avec le mix de l'agent son.

## Frontières numériques et vérifications

Une vraie revue de l'essai initial a trouvé l'impact retardé à l'instant nominal :
la soustraction du temps global produisait4,75 alors que la borne stockée était
4,750000000000001. La sélection de dessin et de lettrage utilise désormais une
tolérance nommée de100 picosecondes. Aucun événement ni fichier audio n'est décalé.
Le test couvre avant−1µs/exact/après et les offsets0/16,25/380,89/10000,25.

Les seeks effectués sur le vrai lecteur v9 complet donnent :

- 385,639999s → haut avec flash, milieu absent ;385,64s exact → milieu avec impact.
- 385,989999s → bas absent ;385,99s exact → bas et bulle présents.
- Les deux états restent corrects à l'instant+1µs, après seek inversé et en pause.

Les preuves finales sont sous
`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/animation/` :

| Preuve | Résultat et SHA256 du rapport |
| --- | --- |
| `global-layers-v1/` | Cinq vrais calques de la sélection complète contrôlés, sources intactes, hors-case0px, pause et tenue finales exactes, OFF exact ; `f5ba484df006581b5f018d887c0e014a7c053d612c83c124ca71b4fd5d4cbda4` |
| `global-boundaries-v1/` | Six captures de seeks globaux avant/exact/après ; `5d5026bfa1f8c9bc72cae1149d7eee35e87127fa6c2347b653accd13bec1df4f` |
| `global-interval16-v1/` | Dix états, lettrage opaque0px altéré, pause/seek et runtime figé ; `93e82bf83208cb5bc211e9c59badfcfa2165b1b432169de574d75b5f60b9a0e8` |
| `global-interval17-v1/` | Onze états, indices exacts attendus à chaque ancre, lettrage opaque0px altéré, pause/seek et runtime figé ; `b2b79da76a97dc54e898ee7ad80a17d16917a98d90ad85c0105b0940a28ffbf7` |

Chaque intervalle possède son clip muet de64 images,24fps,1280×720,2,666667s,
intégralement décodé. Les planches d'intervalle ont été ouvertes. Trois images du H264
de chaque clip ont aussi été extraites et ouvertes : initial/fragmentation/carte pour16 ;
flash/impact/réaction pour17. Le mouvement numérique est présent entre les extrémités,
la carte se stabilise, les gouttières et silhouettes restent propres après encodage.

Clips SHA256 :16 `bcce214ab19444d70bef07ee4509254779cbecfb965a09b4d3f9f2f2737da60d` ;
17 `97ef50350647c78a4fc1085e300f29db4029e25ed5bdfd363fb1534116fe0b94`.
Les fichiers `encoded-01.png` à `encoded-03.png` sont liés à ces clips : images0/24/48
pour16 et16/18/27 pour17.

La contre-revue indépendante de l'intégrateur vérifie en complément les334457 pixels
des acteurs/rail/trou et496000 pixels du paysage initial, les miniatures, les ancres
globales et le master OFF. Le pilote root ouvre personnellement les résultats.

## Essais conservés et limites

`proof16-v1` est un échec d'accès au serveur sandboxé, corrigé en lançant l'aperçu
local autorisé. `interval16-v1` conserve une différence de raster SVG entre contextes
GPU/CPU ; les polices prêtes, le readback comparable et le warmup éliminent cet artefact
dans les preuves suivantes, sans changement de lettres ni du moteur pour ce motif.
`interval17-v1` est antérieur à la correction des frontières exactes : ses états ne
certifient pas ces instants. Les preuves `global-*` ci-dessus font foi pour la v9.

Aucune nouvelle voix ni génération d'image payante effectuée par ce sous-lot animation.
Les images clean sont produites et journalisées par l'agent art ; la carte est fournie
par root. Les clips de preuve sont muets : ils ne certifient ni l'écoute du mix complet
ni un MP4 long. La sélection globale, le mix et la sauvegarde finale restent pilotés
par root. Tous les serveurs temporaires de ce sous-lot sont arrêtés ;50589 appartient
au lecteur final de l'intégrateur.
