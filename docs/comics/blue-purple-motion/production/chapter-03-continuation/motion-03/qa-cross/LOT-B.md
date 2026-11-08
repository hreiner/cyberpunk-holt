# Contre-revue croisée du lot B — pages14–15

8 novembre2026. **Avis final favorable sur la sélection à trois états : ouverte →
pose35 → fermée.** La pose75 et sa correction ont été rejetées par le pilote.
Le dernier recontrôle confirme les six frontières, les bras, la poignée et le raccord
franc vers la capsule fermée. La réserve mécanique de la première passe est close
pour cette nouvelle sélection, sans revendiquer une simulation continue de charnière.

Mission en lecture seule : aucun dessin, candidat, temps, son ou fichier moteur
du lot B n'a été modifié. Seuls ce rapport, le script de contre-revue et ses preuves
dans `motion-03/qa-cross/lot-b/` ont été produits. Aucun appel fournisseur ni MP4 long.

## Sélection courante — trois états retenus

Candidate15 finale `blue-purple-page15-motion06.json`, SHA-256 :
`1a47b367f0b77cd70eb94520ce77ff6bfd2cf9074575d7a21abe584d516037fc`.
Son calque de fermeture ne référence que les images ouverte,35 et fermée ; aucun
chemin de pose75. La page14 demeure celle de la première contre-revue ci-dessous.

La preuve ciblée indépendante est dans
`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/qa-cross/lot-b/final-three-v1/`.
Son rapport porte SHA
`c0093aeffff67f7c12dae801b9c8dce9db59fb016f9b607de49e108480fad54d` ;
le script `review-lot-b-final.cjs`, SHA
`269cfcc7fd77eae44815f725d7e4df5160727e43b8b67e73ee49a11f7140f7ca`.
Le moteur1.3.0 reste stable pendant cette passe.

Les trois dessins ont été rouverts en pleine case, avec leurs lettres, puis dans
la planche des six échantillons réellement capturés dans le lecteur :

| Échantillon | Temps local | Index observé |
| --- | ---: | ---: |
| Avant fermeture | 21,366667 s | 0 — ouverte |
| Entrée pose35 | 21,616667 s | 1 |
| Ancien instant75, désormais tenue35 | 22,046667 s | 1 |
| Juste avant fermé | 22,495667 s | 1 |
| Fermé exact | 22,496667 s | 2 |
| Fermé tenu | 22,776667 s | 2 |

Le temps global427,23 s reste donc en35 ; le fermé427,68 s n'a pas été déplacé.
La poignée descend entre ouverte et35 ; la chaîne épaule→coude→poignet→main reste
raccordée et la prise de poignée est lisible. À l'état fermé, main et avant-bras
sont occultés à l'intérieur, sans doublage visible. Abigail conserve sa main au
rebord ; Grover et l'enfant, Wendy et John restent stables. Les bulles restent fixes.

Le passage35→fermé est désormais une **ellipse franche entre deux dessins**, tenue
puis accent final. Il ne présente plus l'état75 dont le panneau inférieur semblait
grandir, ni le rebond de poignée de son remplacement rejeté. L'absence d'interpolation
continue est un choix de mise en scène explicite du pilote et figure dans la livraison.

Le clip final du propriétaire B, `lot-b/proof-final-v2/closure.mp4`, a aussi été
redécodé indépendamment : **2,5 s,24 i/s,60 images, muet**, zéro erreur. SHA :
`65a0e13cff3a10c22fa9f9a445fde00448cc088082a9af6c0a6d0e4d20bfe899`.
Les images H2646/13/23/33/34/44 ont été extraites ; les états encodés ouverte,
35 tenue et fermée ont été ouverts en plein. Le témoin de verrou de la dernière
candidate est replacé sur le petit groupe de LED existant, sans changer la physique.

Les cinq métadonnées de prises de page15 ont été rapprochées de la preuve initiale :
fichiers par SHA déclaré, durées et locuteurs inchangés. Aucun nouveau décodage des
dix prises déjà vérifiées, aucune modification de candidat ou média. La première
contre-revue des autres cases conserve sa portée aux médias inchangés ci-dessous.

## Première passe historique — quatre poses

**La suite décrit la sélection antérieure, ses preuves et la réserve qui a conduit
au retrait de75. Ces anciennes empreintes ne sont pas la sélection finale.**

Les deux masters finaux FORMAT ont été ouverts en entier : page14 `page-fitted.png`,
page15 `page.png`. La page16 et sa deuxième case de capsule fermée ont aussi été
ouvertes, ainsi que `capsule-open-closed-reference.jpg`, puis les composites bruts
`closure-35-raw.png`, `closure-75-raw.png` et `closure-closed-raw.png`.

Après GO du propriétaire `letters_b`, les candidats courants ont été chargés dans
le vrai lecteur. Le dossier de preuve indépendant est :
`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/qa-cross/lot-b/proof-v1/`.

Son `report.json` porte SHA-256
`dd8d4a9ca4c6e0c4c9ba7a3bcac44dafb4391fd1b23b3d7eeaea0299409dc010`.
Le script `review-lot-b.cjs` porte SHA
`d71aca5245d355a0a257e63fc6a90e1665a0dbd221d3a5b5617b268a493bc1b6`.
Le statut technique « awaiting-eye » du JSON distingue volontairement ces résultats
de la présente lecture graphique.

Les PNG de page14/15, les paires des douze effets et les onze instants de fermeture
sont disponibles. La planche `closure-intervals.png` et les pages complètes ont été
effectivement ouvertes après capture. Les onze images sont des instants du lecteur,
avec ses vrais dessins et lettres, pas une fixture de géométrie.

| Entrée initiale contrôlée, historique | SHA-256 |
| --- | --- |
| `blue-purple-page14-motion06.json` | `a5f495e6917a064e81ce3d7db99f3d77743ea449245744bcf29c0db6b3202d25` |
| `blue-purple-page15-motion06.json` | `81ce2236da2006b0548f8d7372acfbf71267f3c3019cc24963d018d8dd59c109` |
| [Sélection d'art B](../lot-b/ART-SELECTION.json) | `8252232b4d6cd62455821bda39c05ca989b3e021552c481cdf8cc41b5cd1e1b3` |
| [Ancres B](../lot-b/ANCHORS.json) | `4a7384935d18fe3f0d4d70d35a5e89d92c415890da998dead12d275a50b2432a` |

## Anatomie et occlusions

L'épaule de Franklyn se raccorde au bras relevé dans l'état ouvert. Le coude et
l'avant-bras remontent vers la poignée, puis le poignet et les doigts forment une
prise identifiable. Dans la pose35, le coude est davantage fléchi et l'avant-bras
rejoint encore la poignée : aucun second avant-bras pendant ni embranchement de
manche n'a été observé. La main au clavier reste distincte.

Dans la pose75, la poignée est lâchée. Le bras auparavant relevé est ramené vers
l'intérieur ; une main reste lisible au clavier derrière la vitre. L'autre chaîne
est partiellement cachée par la traverse opaque du couvercle : cette occlusion ne
permet pas de compter des doigts invisibles, mais aucune main ne ressort à travers
la tôle. Dans l'état fermé, la vitre et la coque occultent davantage les bras.
L'absence de détail visible n'est pas présentée comme une certification de chaque doigt.

Abigail conserve son appui sur le rebord et sa main à la hanche. Grover garde l'enfant,
la main sur son épaule ; Wendy et John restent dans leurs attitudes retenues. Les
composites protègent ces acteurs, et leur stabilité se voit dans les quatre états.
La seconde case de page15 garde Abigail et Franklyn à la réparation. Les bulles ne
changent pas de locuteur et leurs queues restent dans la géométrie retenue.

## Réserve mécanique initiale, corrigée par la sélection finale

Les instants **7→8** de `closure-intervals.png`, soit **22,455→22,496667 s** locales,
montrent le point précis. Dans la pose75, fenêtre et poignée sont déjà proches de
leur hauteur finale, mais un grand vide laisse les jambes et l'assise à découvert.
À l'état fermé, une large partie inférieure opaque remplit ce vide alors que la
poignée se déplace peu. Le panneau paraît donc s'allonger davantage que poursuivre
la fermeture d'une coque rigide.

Ce n'est pas une interpolation qui dédouble une main, ni une erreur de temps ou
d'alpha. La réserve concerne la cohérence des **dessins successifs de la machine**.
Le métal du dernier état reprend bien la capsule fermée de référence16.2, mais cela
ne prouve pas à lui seul que la géométrie intermédiaire75 prépare ce dernier état.
Le propriétaire B et le pilote ont été prévenus avec les chemins et instants exacts.
Ne pas transformer les contrôles de pixels réussis en validation mécanique globale.

Une correction75 a ensuite été tentée puis rejetée pour un rebond de poignée. Le
pilote a retenu trois états et supprimé les deux dessins75 des références jouées.
Cette résolution et son recontrôle sont décrits en tête du présent rapport ; la
réserve historique est conservée comme preuve du défaut effectivement détecté.

## Matières et autres cases

14-1 : le battement du cylindre holographique est visible dans les paires ; les
silhouettes restent dessinées. 14-2 : l'écran et le témoin produisent des variations
locales, sans déclarer un démarrage réussi avant réparation. 14-3 : la préparation
a révélé que l'ancien grand rectangle de protection effaçait le petit témoin.
Ce point a été signalé avant capture ; le propriétaire a ouvert un passage précis
entre les deux zones d'acteurs. La paire du candidat corrigé montre47 pixels de
différence supérieure à15 sur ce témoin, sans changement des personnes.

15-1 : l'instabilité du compartiment reste locale. 15-2 : les états éteint/allumé sont
calés sur le contact15,99 s ; les comparaisons de deux instants à l'intérieur d'un
même plateau lumineux peuvent être identiques, ce qui n'est pas une preuve d'absence
d'allumage. Le rapport conserve ces zéros plutôt que les masquer. 15-3 : le témoin de
verrouillage apparaît après fermeture, à22,576667 s, séparé des mains et de la vitre.

## Contrôles techniques

Les dix prises B sont identiques à la sélection vocale : français, anglais, locuteur,
texte annoté, ID vocal et durée exacts, avec fichier et SHA du média réemployé vérifiés.
Les 99 prises globales n'ont pas été redécodées une nouvelle fois : cette passe était
centrée sur B, après les contrôles globaux et la contre-revue A déjà réussis.

Les pistes recalculées avec le helper TIMING révision2 sont exactement celles des
deux candidats. Aucun chevauchement, coupe ou accélération n'a été introduit. Les
quatre dessins basculent aux ancres contractuelles :

| État | Instant local de bascule |
| --- | ---: |
| Ouvert | Tenue initiale de15-3 |
| Pose35 | 21,616667 s |
| Pose75 | 22,046667 s |
| Fermé | 22,496667 s |

Chaque bascule est inspectée un24e de seconde avant, à l'instant exact, puis un24e
après. La séquence mesurée d'indices est `0,0,1,1,1,2,2,2,3,3,3`. Il s'agit de
changements de vrais dessins, sans fondu de membres. OFF reproduit le master exact
sur les deux pages : zéro pixel différent.

Les empreintes moteur sont stables pendant toute la capture, notamment :

- `reader.js` : `a12fb03629efee3ad837bc9adee10d82c699e36878d0b459f0b80685448e49b5` ;
- `core.js` : `c5527e55a5c9d8149100ea9dfbc1a4079701103d514cf75915ff175afbd39ed7` ;
- `effects.js` : `7f63d2082f0fbb56a8bf026155741c85e74484afb17e38d30a705b52eecb1f32` ;
- `layers.js` : `7fa6386fb9387233f308ebe7383bfaa1f3435ed5eb15d7e6a3d7bd2dc120423a`.

Aucune erreur JavaScript. Aucune écoute humaine revendiquée. Le serveur temporaire
de contre-revue a été fermé automatiquement en fin de contrôle.
