# Contre-revue du lettrage — révision 01

5 novembre 2026. Images ouvertes en entier et données de bulles lues.

Page 5 `page-05/page-v2.png`, SHA-256
`d0e5c6ac1377ac399578fcaa08abc99fa939515e8f8ca55196a3d78e097875b9` :
six textes exacts 024/016/025/026/027/017. John024 pointe hors champ, Grover026
vers bord droit ; attribution Wendy/Franklyn/Abigail correcte. Pas de visage,
main ou contact masqué. CONTACT fixe conforme au contrat off. La queue025 près
de l'épaule John doit encore être observée sur les quatre poses animées avant
validation de l'ensemble ; aucune modification préventive demandée.

Réserve025 levée après ouverture de la planche réelle
`qa/p05-motion-v1/p05-c03-john-punch-four-poses-key-poses.png` : queue identifiable
près de John sur les quatre poses, aucun visage ou poing masqué. Grover reste
clairement au bord droit. Les bulles ne suivent pas les corps mais conservent une
attribution lisible sur cette succession.

Évolution autorisée ensuite par root : SVG de queues propres à chaque pose,
via `frame.letteringImage`, sans changement de corps/texte ni temps. La revue
ci-dessus conserve son caractère daté de variante fixe ; la sélection finale
doit recevoir une nouvelle revue des queues mobiles et du chemin off/overview.

Arbitrage final root transmis ensuite par montage/animation : abandon des quatre
SVG punch, maintien de025 fixe déjà favorable ; seuls les SVG de sortie page6
sont retenus. La preuve p05-motion-v2 est byte-identique àv1 avec moteur actualisé.
Aucune future variante025 n'est donc incluse dans le gel à contrôler.

Page 7 `page-07/page-v1.png`, SHA-256
`f7177afaa2e1210e768c4a975b0febf6ad3c4c4f36afb0b33ca20698c4dbfa19` :
six textes exacts 032/033/019/020/034/035. John033 pointe hors cadre supérieur
gauche de la bulle, cohérent avec son absence dans le dessin. Wendy et Franklyn
restent correctement désignés ; longue queue035 passe dans le fond libre,
sans croiser visage/main ni une autre queue. Glyphes lisibles et contenus,
dessins/contacts visibles. Verdict favorable sur cette version.

Page 8 `page-08/page-v2.png`, SHA-256
`01be0cf9c700380e5693ffb06c455eeedfbd94461e1b42ef17119807e4bc2f18` :
page entière ouverte. Cinq textes 036/021/022/023/037 comparés exactement aux
textes FR des voix préparées. Les deux bulles de conduite désignent Franklyn
à droite spectateur et Wendy à gauche ; mains au volant et visages préservés.
Question enfant et « Monte. » ont des queues séparées, sans visage/main masqué.
037 reste sans queue, cohérent avec la voix intérieure durant le départ.
Fond reconstruit + voitureRGBA au transform0 : roues, contours et perspective
cohérents, pas de trou ou halo visible. Favorable sur page/composite initial ;
déplacement réel encore attendu pour sa validation.

Page 6 `page-06/page-v1.png`, SHA-256
`8e07196ae9408febc1764363b148be13d7805b3465d24ad4c71d30e4c02f0040` :
page entière ouverte, cinq textes 028/029/018/030/031 comparés exactement aux
voix FR préparées. John028 hors cadre gauche. Les deux bulles Wendy029→018
se lisent comme continuation reliée :029 rejoint le corps018 qui pointe Wendy.
Pas de visage/main couvert. Dans CROSSING fixe,030 pointe Abigail et031 Grover,
les deux réserves hautes ne masquent aucune tête. Favorable sur page statique ;
SVG seuil/franchissement attendus dans preuve animée pour lever le dernier doute
de raccord des queues aux nouvelles positions.

Réserve page6 levée après ouverture réelle de
`qa/p06-motion-v1/p06-c03-rear-exit-two-poses-key-poses.png` : deux SVG réellement
sélectionnés aux temps12,6 et13,6 s, queues030/031 suivent Abigail/Grover et ne
masquent aucune tête ou main. Les SVG diffèrent uniquement par polygones de
queues (comparaison directe du reste des fichiers identique) : seuilSHA
`67982e588b95f191d4299ccbc4eff511585ad97bbab4b78a85be15cea2ea2d13`,
franchissementSHA `9f3680b18aeeac257063d45cd160f7be73bceb58acfd565d7c88c586a5291697`.
Les quatre pages lettrées et leurs chemins de pose retenus sont favorables.

Page8 finale après ombre procédurale : `page-08/page-v3.png`, SHA-256
`57b864b24c709ef11981835371417c82066824f6f5e96e112feabf902551199a`.
Relecture technique indépendante : SVGv3 byte-identique àv2 ; premiers1028 rangs
des PNG bruts exactement identiques (trois premières cases). Le PNG lettré
rééchantillonne différemment les glyphes via le nouveau compositeur Canvas :
5037 pixels changent dans cette zone, donc aucune identité pixel du lettrage
raster n'est revendiquée. Pagev3 entière ouverte : mêmes textes/géométries,
lisibilité et dégagement des visages/mains conservés. L'intégration
du départ c4 a changé ; ses trois PNG1280 avec ombre ont reçu avis favorable.
Aucune bulle/attribution nouvelle introduite par cette correction.
