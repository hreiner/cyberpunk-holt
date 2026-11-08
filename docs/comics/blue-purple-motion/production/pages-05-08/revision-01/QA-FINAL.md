# Contre-revue de sélection et livraison — révision 01

5 novembre 2026. **Avis final favorable** sur la sélectionv3 et ses six exports
render-v2 effectivement produits et vérifiés. Toutes réserves visuelles ouvertes
ont reçu une correction et une contre-revue ; limites du mouvement2D ci-dessous.

## Sélection exacte

Contrat finalv5 SHA `4f94e18d93cdfd6fe7b89865f81076d0b0cb5eca773be5b4da19a740826d81ac`.
Projet complet `anime/motion-comics/projects/blue-purple-pages01-08-v3.json`, SHA
`daa407eef187a9aec910b4e54719244c5d751b358ac812231e90a9869b5da2fc`.
Lot `blue-purple-pages05-08-v3.json`, SHA
`3eabc669ae78f981f3ec960eb02f26302ad95693ddfd04e0ad5a3c2580b3a6db`.

Comparaison indépendante des quatre projets page05..08-v3 avec leurs candidats
`candidates-stage2-v1`, après résolution des chemins relatifs, y compris journaux
de prises : **identité des panneaux/cues, textes, prises, temps/gaps, images,
calques, effets, protections, lettrages, overview/raccord/outro**. Les quatre
empreintes de projet sont respectivement :

- p5 `ee944052e99c7a7666d9ee3f712bdb83d6dae1b345412cd9b32a307ade944285` ;
- p6 `34e33218634065b66c8965e9ada03f6e6d6f2b45627b81239df6eb77e2b474a5` ;
- p7 `eaae3a8f0e57f3f492242946fb4a992ae1f43623ed8a262a3a5ad8c3307032c9` ;
- p8 `c087021478cde89042f45b1712c8dbdebf7af5c4e54826b6685c23a0cb451de2`.

Les six séquences (complet, lot, quatre pages) pointent les backings soundtrack-v3
correspondants. Durées page20,9 /18,6 /20,1 /22,4 s, lot82 s, complet226,6 s.
Les pages1–4 visent exactement les manifestes historiques approuvés. Vingt-cinq
fichiers historiques rehashés depuis `delivery-audit-v2.json` : tous inchangés.
Le rapport conserve également les anciens temps de voix exacts, 38 décodages,
37 voix globales dont22 nouvelles pages, zéro chevauchement. Préfixe sonore
historique144,6 s PCM exact, voir QA-AUDIO.md.

## Sources et contrôles visuels

Les huit copies sélectionnées dans ART-SELECTION.json correspondent aux natifs
approuvés. Onze journaux réels, onze prompts/références/sorties rehashés conformes ;
11/12 appels image, réserve1 intacte. Mains/poignets, contacts, appuis, six membres,
costumes et voiture contrôlés en entier puis agrandissements. Compteurs audio
distincts : TTS3394/4800, SFX6requêtes/20s sur8/24.

Quatre poses punch, deux poses sortie avec queuesSVG adaptées, départRGBA et
ombre de contact sont réellement présents. La réserve de voiture suspendue a
été constatée au PNG1280, acceptée par root, puis levée après trois PNG1280
corrigés ; v2 et premier export interrompu conservés. Aucun appel payant pour
cette correction procédurale. P5 conserve025 fixe favorable sur les quatre poses.
P8 master final57b864… et037 sans queue, trois premières cases brutes inchangées.
Voir QA-IMAGES.md, QA-LETTERING.md et QA-ANIMATION.md pour versions et preuves.

Moteurs du gelv3 recoupés : core
`b34a78c54055a9e047d368f88e09d1997e8e0ce6e66240fa1b973187a9b6278b`, layers
`7455809ed3d513590e23eb278fa350d05081fff6b0a07deee96e1aa1d9ee4216`, reader
`166aebe8f6051ac45902e39268d60be2d08f388e2a7a54dfebe3a4c794856e65`.
Root rapporte verify788 tests +28 tests motion et parcours huit pages, pause,
arrêt et réduction des mouvements sans erreur. Ces commandes sont exécutées par
l'intégrateur, pas revendiquées comme relancées par la contre-revue.

Rapports selected-v3 finaux lus : trois actions completed/PASS sur mêmes moteurs
et sources sélectionnées ;110 régions protégées zéro altération et401652 pixels
opaques des SVG sur les trois pages à calques zéro altération. Quatorze cases
PASS dans `qa/selected-v3-panels-final/report.json`. La première paire p7c2 ne
modifiait que41 pixels (48/48,65 s), sous seuil180 : échec initial conservé.
Diagnostic d'alias périodique puis supplément explicitement autorisé : récit
48 s figé, phases ambiantes48,25/48,9 s,2447 pixels au même seuil180. Les deux
rapports restent conservés ; aucun seuil abaissé ni moteur/config modifié.
CheckerSHA `9d0915345db1366d16a1902a180ab87bcede7df18c6badbdc6b0960f35731c0f`.
Cette résolution technique a été lue ; aucune nouvelle paire imagée non produite
n'est revendiquée ouverte par la contre-revue.

## Frontières de la validation

Poses franches et voiture rigide2D : roues non tournantes, aucun morphing de
corps ; l'ombre suit désormais réellement le véhicule. Fuyard, grille, volant
et portière restent des images fixes accompagnées de raccords/SFX, pas des gestes
supplémentaires simulés. Aucune écoute humaine revendiquée ; sources, décodages,
niveaux et synchronisme sont contrôlés techniquement.

## Exports et images encodées — terminés

Les six `exports/*/render-v2/report.json` et `independent-audit.json` sont lus
completed. Rehash indépendant de chaque MP4, manifeste source, des neuf fichiers
moteur et de tous médias de chacun des six exports : exact. Aucun fichier changé
après rendu. Tous rapports décodage intégral exit0, H.264 High/yuv420p1280×720,
24fps et AAC LC44100Hz mono vérifiés. Le contrôle intégral AAC supplémentaire
de `mix-check-v1.json` est également exit0 pour les six.

| Export | Durée conteneur signalée | Images rendues | Octets | Crête AAC |
| --- | --- | --- | --- | --- |
| pages01–08 |226,60s|5439|29414273|−1,5dBFS|
| pages05–08 |82,00s|1968|10126353|−1,3dBFS|
| page05 |20,92s|502|2580287|−1,3dBFS|
| page06 |18,60s|447|2445980|−2,9dBFS|
| page07 |20,10s|483|2189133|−2,1dBFS|
| page08 |22,42s|538|2596651|−3,2dBFS|

Arrondis à24fps inférieurs à une image, aucun pic0dBFS. Hash complet
`ae5d96b505eae6160e3f9fb616ef347e2482acb8816a31a66b433d88f9fc0457` ; lot
`a238ce309ff2ac76a98b0151dc537c4c1f5a26412740ceaaa4b7c6441823804e`.
`export-check-v1.json` conserve les six empreintes complètes et métadonnées.
`snapshot-audit-v1.json` : six exports/seize pages copiées, contenu et empreintes
de tous médias identiques, y compris SVG par pose et backings. Le rapport et
les neuf fichiers moteur ont été recoupés, sans lancer un second rendu.

Trois images H.264 décisives réellement ouvertes depuis encoded-stills-v2 :
contact, CROSSING et départ final. Favorables : contact/mains et queues lisibles,
six membres et appuis cohérents, ombre de contact présente sans trou/halo. Root a
vu les six images ; contre-revue détaillée dans QA-DELIVERY.md. Aucune écoute
humaine revendiquée, ni nouvel export lancé par le reviewer.
