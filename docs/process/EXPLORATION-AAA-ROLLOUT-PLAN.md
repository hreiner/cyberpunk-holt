# Extension AAA des zones d'exploration — plan d'exécution

Autorisation du 2 octobre 2026 : poursuivre la méthode validée dans HOLT sur toutes les zones d'exploration, puis reprendre aussi le hangar après l'examen écrit. Personnages et animations restent hors périmètre. Cible de performance : environ 30 ips à 1080p sur GTX 1070.

La carte ne change pas : mêmes emprises, collisions, entités, verrouillages et progression. Les pièces se traitent successivement avec GPT-6 Luna ; l'orchestrateur intègre le socle, juge les captures et vérifie les parcours. Les références et matières existantes servent de cible ; une nouvelle génération d'image ne se justifie que si elle résout une identité visuelle manquante.

| Lot | Lieu                             | Direction                                                                                             | État  |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------- | ----- |
| E0  | Socle des trois cartes restantes | Registre de profils, coque complète, perspective plongeante, lumières locales et miroir unique limité | Livré |
| E1  | Parking du centre                | Fourgon usé, béton et marquages mats, arrivée lisible                                                 | Livré |
| E2  | Hall du centre                   | Bancs métalliques, cages et matériel, axe de briefing dégagé                                          | Livré |
| E3  | Salle 1                          | Parcours K9 et secours, barrières basses, éclairage périphérique                                      | Livré |
| E4  | Salle 2                          | Réserve blindée, détour facultatif clair, seuil au nord visible                                       | Livré |
| E5  | Salle 3                          | Console cyan, filtration et circuit de gaz, sortie évidente                                           | Livré |
| E6  | Cour de containers               | Matières, lumière et seuil ; carte tactique inchangée                                                 | Livré |
| E7  | Sept tronçons des conduits       | Murs techniques sombres, conduites sur les côtés, ventilateur lisible ouvert/fermé                    | Livré |
| E8  | Labo de Smith                    | Machine cyan comme ancre, réflexion limitée                                                           | Livré |
| E9  | Dortoir des petits               | Métal et literie usés, parcours libre                                                                 | Livré |
| E10 | Cantine des petits               | Feu, fumée et reflets localisés, trappe visible                                                       | Livré |
| E11 | Campement                        | Béton poussiéreux, tentes et camion, lune froide et feu chaud                                         | Livré |
| E12 | Hangar HOLT                      | Reprise de la tôle, des baies et des véhicules sans plafond masquant                                  | Livré |
| E13 | Revue finale                     | Captures décisives, raccords et saisie, transitions, ressources, mesure puis verify/e2e               | Livré |

Centre : murs extérieurs 4,9 m, cloisons 2,45 m ; souterrains et campement : 2,45 m. Aucun plafond. Les éléments suspendus qui cachaient les vues deviennent des détails de façade. L'enveloppe apparaît finie au départ ; le contenu suit la découverte réelle. Cour et campement gardent leurs sols mats. Les miroirs des souterrains sont petits et ne dévoilent pas les pièces cachées.

Le « hangar après l'examen » est le garage des fourgons de HOLT, avant le départ vers le centre. Il avait reçu H6 ; E12 ajoute une reprise ciblée demandée par le propriétaire. La cour située après les salles pratiques est également incluse, sans déplacer ses couverts ni créer de nouvelle collision.

Décision de réemploi : [ADR 0038](adr/0038-profils-decor-toutes-explorations.md). Les lots E0–E13 sont livrés et revus : 770 tests unitaires, neuf parcours e2e, audit des 18 zones et mesures à 1080p. [Captures et mesures](../art/EXPLORATION-AAA-ROLLOUT-REVIEW.md).

## Reprise critique après la livraison

La relecture des images demandée par le propriétaire révèle chaperons dominants, silhouettes
masquées, intérieurs trop sombres et détails flottants. Le lot F0 corrige ces défauts avec
trois agents GPT-6 Luna : murs et occultation, éclairage, véhicules et tentes.
L’orchestrateur relit les quatre angles des conduits et les vues décisives, puis contrôle
les parcours et la libération des ressources. [Corrections et preuves](../art/EXPLORATION-AAA-VISUAL-FIXES.md).

F0 est livré : captures relues après correction, `npm run verify` passé (773 tests), neuf
parcours e2e réussis et audit des 18 zones réussi. Les six cycles de transitions, avec
cadrage normalisé et quatre orientations préchauffées, stabilisent les ressources à
319 géométries et 135 textures après le premier cycle. Le hangar reste la vue la plus
coûteuse à 1080p : p95 de 33,4 ms et quelques pointes à 50 ms sur GTX 1070.

## Reprise F1 — murs fixes et revue complète

Les murs ne changent plus de hauteur ou de visibilité pendant l’exploration. Les façades
de cour et du hangar font 4,9 m ; les véritables cloisons font 2,45 m. Les deux rangées
cantine–examen partagent une seule géométrie. La caméra monte à environ 55°, et à 70°
dans les conduits d’une case. La découverte masque toujours les contenus inconnus.

Deux passes complètes couvrent les 39 pièces des cinq cartes, dans leur propre étape
narrative, puis une dernière passe en quatre orientations reprend les défauts constatés.
[Revue actuelle et validation](../art/EXPLORATION-STATIC-WALLS-REVIEW.md),
[ADR 0039](adr/0039-murs-exploration-entiers.md).

F1 est livré : 771 tests unitaires, neuf parcours e2e, deux revues complètes des 39 pièces
et une dernière revue de 24 zones dans les quatre orientations. Les ressources se stabilisent
à 319 géométries et 137 textures sur cinq cycles après échauffement. Les cinq vues mesurées
à 1080p ont un p95 de 33,4 ms ou moins sur GTX 1070.
