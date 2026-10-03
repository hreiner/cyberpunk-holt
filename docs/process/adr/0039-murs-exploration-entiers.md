# ADR 0039 — Murs d'exploration entiers, découverte limitée aux contenus

**Statut : accepté · Date : 2026-10-02**

## Contexte

La coupe automatique des murs vise à garder le groupe visible, mais elle produit des façades
et cloisons qui s'abaissent ou disparaissent selon la salle, la caméra ou la position des
personnages. Ces changements de hauteur et les seuils où des pans de mur s'éteignent nuisent
à la continuité du bâtiment. La découverte a aussi été mêlée au rendu de l'enveloppe, alors
qu'elle ne doit contrôler que ce qui se trouve dans la pièce.

## Décision

- Tous les murs d'exploration restent entiers, à hauteur fixe, visibles et continus pendant
  toute la partie. Aucun calcul d'occultation ne les coupe, ne les abaisse ou ne les masque,
  y compris pour les façades, les murs donnant sur une cour, les couloirs et l'extérieur.
- Les façades et murs donnant sur une cour font **4,9 m** ; les cloisons intérieures font
  **2,45 m**. Les murs du centre d'examen autour de la cour de containers suivent ces hauteurs.
  Les murs des conduits et du campement font **2,45 m**.
- La découverte se déclenche à l'entrée de Franklyn et révèle les finitions de pièce, le
  mobilier et les entités de son contenu. Elle ne modifie jamais la visibilité, la géométrie
  ou la hauteur de l'enveloppe. Les couloirs, cours et extérieurs restent visibles selon les
  règles de leur carte.
- Les ouvertures architecturales restent des ouvertures ; les vantaux et fermetures
  spécialisées suivent l'état réel de leur porte. Pas de plafond ni d'accessoire suspendu
  au-dessus d'un passage.
- La caméra perspective de l'exploration est plus plongeante : son décalage vertical est
  réglé à **22 m**, soit environ **55° vers le bas**, pour mieux lire les pièces derrière
  leurs murs entiers. Le pilote historique à 8,5 m reste une référence de comparaison,
  pas la hauteur actuelle. Les conduits d’une case de large emploient **70°** pour lire
  le passage entre leurs parois fixes ; les autres cartes gardent environ 55°.

Cette décision remplace les règles de murs en coupe des ADR **0013** et **0027**, ainsi que
les coupes liées à l'occultation du joueur décrites par les ADR **0036**, **0037** et **0038**.
Leurs autres décisions (profils, matières, éclairage, caméra, accessoires et portes) restent
en vigueur.

## Conséquences

- La cohérence de hauteur et la visibilité du groupe se traitent par le plan, les ouvertures
  et le cadrage ; un mur ne s'efface plus en réponse au joueur. La caméra plongeante améliore
  la lecture au-dessus des façades sans masquer sélectivement les murs.
- Les pièces inconnues gardent une enveloppe lisible, tandis que leurs contenus restent
  cachés jusqu'à leur découverte.
- Chaque raccord de mur partagé doit conserver sa continuité géométrique et sa hauteur des
  deux côtés. Les vues rapprochées doivent examiner les salles où des parois se font face.
