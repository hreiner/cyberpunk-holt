# ADR 0038 — Profils de décor sur toutes les cartes d'exploration

Date : 2026-10-02. Statut : accepté, mis en œuvre.

## Contexte

Après validation du dortoir puis de l'école, le propriétaire demande la même méthode sur toutes les zones d'exploration, avec une reprise du hangar après l'examen écrit. Le découpage des cartes, les personnages et les règles ne doivent pas être remaniés.

## Décision

Un registre visuel `explorationSceneProfiles` sélectionne les profils de HOLT/HOLT-nuit, centre-examen, conduits et campement. Il réemploie les factories de l'ADR 0037 plutôt que de dupliquer les renderers. Les modules gardent leurs anciens noms HOLT pour préserver leurs imports et leur contrat ; leurs paramètres portent profils, teintes et hauteurs. Une seule géométrie canonique sert aux murs, à leurs accessoires et au calcul d'occultation du meneur.

Toutes ces cartes partagent la perspective plongeante, le rayon de clic correspondant, les matières du pilote, l'environnement et le bloom modéré. Chaque carte possède une coque complète et une seule pool de lumière locale ; un unique miroir planaire suit la zone active et disparaît aux grands dézooms. Le centre reste mat, les souterrains ont trois petites surfaces réfléchissantes et le campement reste poussiéreux. Les hauts murs du centre font 4,9 m, ses cloisons 2,45 m ; les souterrains et les murs du campement font 2,45 m. La découverte n'affecte pas les hauteurs et ne révèle aucun mobilier caché.

Une fermeture spécialisée peut déclarer `doorStateId` dans son placement visuel. `ExploreDressing` conserve ce placement hors fusion et affiche son enfant `door-closure` selon l'état de la porte déjà calculé par `ExploreState`. Le ventilateur utilise cette voie ; aucune seconde serrure ni nouvelle interaction n'est créée. Son cadre remplace le vantail générique, tout en conservant le seuil et la collision d'origine.

## Conséquences

Les contrastes propres au centre, aux conduits et au campement se règlent dans les profils et placements. Les appliques suivent les vraies cellules de mur, sans coordonnées HOLT transplantées. Le hangar reçoit des détails de paroi et de véhicules, sans traverses masquant la vue. Les inconnues/cartes de développement conservent leur rendu de repli.

La cour garde sa correspondance exacte avec `yard-map.ts`. Aucun solide n'est ajouté à l'aire tactique. Les ressources clonées appartiennent à leur instance ; les depots partagés ne sont pas libérés par les accessoires. La qualité et le coût doivent être vérifiés sur chaque nouvelle carte, les mesures HOLT ne suffisant pas.

## Finitions de la reprise

Les cellules terminales des murs s'arrêtent au plan du mur perpendiculaire pour enlever les croisillons
des chaperons. Ce rognage affecte corps, chaperons, peinture et accessoires, sans modifier le centre canonique
ni les cellules de navigation. Les accessoires reprennent aussi la coupe effective des groupes de murs,
sans propager celle-ci à des groupes voisins par leur sommet commun.

Le catalogue distingue maintenant `wall`, détail fixé aux cellules de mur ou à leurs voisines cardinales,
de `overhead`, objet suspendu au-dessus d'un passage. La contrainte `wall` autorise une applique au-dessus
d'un banc ou d'une machine sans ajouter d'obstacle ; le test global exige toujours un véritable mur proche
et interdit `replaces`. Les grandes lames orange des feux deviennent des quads à shader translucide dont
le temps suit le tick du décor. Les ressources spécifiques sont possédées par la factory.

La réinitialisation de l'éclairage au climat neutre respecte désormais le calibrage froid du centre,
au lieu de reprendre le soleil de l'académie. Les détails des containers et caisses gardent leur emprise
et sont réemployés dans la vue tactique, pour conserver le décor au passage du portail.

Livraison : [captures, mesures et parcours vérifiés](../../art/EXPLORATION-AAA-ROLLOUT-REVIEW.md).

La revue de finition précise cette décision existante : les chaperons de 5 à 7 cm restent
mats et utilisent un clone possédé du matériau parent ; les linteaux des portes s'ajustent à
la hauteur réelle du mur. Les sources globales et les teintes nocturnes gardent les volumes
lisibles. Le PMREM partagé est transmis via `ExploreDressing` à `EnvironmentPropFactory` pour le matériau de vitrage :
le matériau appartient au décor, tandis que sa texture d'environnement reste empruntée au
pool partagé. L’architecture ne transmet cet environnement qu’à ses vitres (gain 0,12),
car le béton, la peinture et leurs clones mats conservent le calibrage sans PMREM.
Ces corrections appliquent les profils et la propriété des ressources déjà décidés ici.
