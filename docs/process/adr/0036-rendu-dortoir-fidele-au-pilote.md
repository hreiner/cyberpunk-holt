# ADR 0036 — Rendu du dortoir fidèle au pilote autonome

- Date : 2026-10-01
- Statut : accepté, reprise visuelle demandée par le propriétaire

## Contexte

Le propriétaire juge la première intégration (ADR 0035) nettement en retrait du
pilote : les murs, la lumière et les reflets qui donnent sa qualité à l'étude ne
se retrouvent pas dans le chapitre. Il demande de pousser le rendu vers le pilote,
avec la marge disponible au-dessus d'une cible de 30 ips sur GTX 1070.

## Décision

Reprendre le rendu du dortoir réel avec le pilote comme référence directe. Autoriser
son architecture détaillée, sa lumière locale et ses effets de matière et d'image
dans HOLT/HOLT-nuit, au-delà du simple réemploi de mobilier. La suppression préalable
du reflet planaire et du traitement d'image n'est plus un objectif d'intégration.

Les volumes décoratifs et le cadrage peuvent être adaptés à la référence. Le
propriétaire autorise explicitement le 1er octobre une adaptation de caméra pour
retrouver le rendu du pilote, y compris la perspective. Les quatre orientations,
la coupe permettant de jouer, les emprises de collision, les entités, les contrôles
et le HUD restent fonctionnels. Projection écran et picking utilisent la caméra
qui rend effectivement l'image. Les personnages et leurs animations restent
développés séparément par le propriétaire.

Retirer les éléments suspendus au-dessus des occupants : le propriétaire les juge
gênants et sans gain utile. Reprendre les murs et grandes fenêtres du pilote,
au-delà des bandes de baies hautes de la première intégration.

La découverte et la coupe pilotent aussi les lumières, le paysage, les émissions et
les reflets. Une pièce inconnue ne révèle aucun de ses occupants dans une réflexion.
L'ambiance de nuit reste distincte du jour. Les autres pièces et cartes gardent leurs
matières et modèles de décor partagés. La perspective et le traitement de l'image
sont actifs quand le meneur est dans le dortoir : ils affectent aussi les salles
adjacentes présentes dans ce cadrage. En dehors de ce profil, le rendu direct et
l'exposition précédents sont rétablis.

Tout effet retenu possède explicitement sa cible, ses shaders et son cycle de vie :
construction, resize, changement de carte, pause et destruction. Le compteur public
inclut toutes les passes de l'image. La conversion de couleur et le tone mapping ne
s'appliquent qu'une fois. Les ressources partagées de la session restent empruntées
par les vues, et les ressources propres à une vue sont détruites avec elle.

Le reflet planaire conserve une cible locale bornée. La projection oblique du
`Reflector` Three est adaptée à la caméra orthographique : le calcul générique
remplace sa formule perspective, afin de conserver les objets au-dessus du sol
dans les quatre orientations. La passe emprunte la texture du sol et l'environnement
de session ; la vue possède sa cible et son shader, libérés par `Reflector.dispose()`.

## Conséquences

Trois passes Dream Loop comparent des captures réelles au pilote, suivies du portage
de sa coque et de sa perspective après les nouvelles demandes du propriétaire.
La reprise et ses différences avec l'étude sont consignées dans la
[revue du 1er octobre](../../art/DORMITORY-AAA-FIDELITY-REVIEW.md). La revue finale
juge d'abord le gain visuel, puis mesure p95 ≤ 33,3 ms à 1080p sur le GPU cible,
avec les personnages présents. Les parcours, les quatre orientations, la découverte,
le rendu nocturne et la stabilité des ressources sont vérifiés avant livraison.
Les résultats précédents restent une référence historique de la première intégration.
