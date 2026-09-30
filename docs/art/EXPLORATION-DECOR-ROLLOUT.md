# Généraliser le décor du pilote dortoir

Évaluation du 30 septembre 2026, demandée par le propriétaire. Ce document estime
le travail ; il n'autorise pas à lui seul une migration. Les personnages et leurs
animations sont développés séparément et sont exclus du périmètre.

## Périmètre constaté

Le registre `src/data/maps/index.ts` contient cinq cartes : `holt`, `centre-examen`,
`holt-nuit`, `conduits`, `campement`. Ce sont quatre lieux distincts : `holt-nuit`
réutilise les pièces de HOLT, avec des habillages par étape narrative.

HOLT déclare 11 pièces/zones, le centre d'examen 6, les conduits 10 et le campement
1, soit 28 zones uniques déclarées, auxquelles s'ajoutent les circulations. Une
zone de conduit ne demande pas autant de travail qu'une cantine ou une cour.

Le décor actuel passe déjà par des placements déclaratifs, `EnvironmentMaterials`,
`EnvironmentPropFactory` et `ExploreDressing`. La navigation, les interactions et
la découverte restent sous le contrôle du jeu. Ce socle réduit le coût du portage.

## Travail nécessaire

- Extraire les textures, matériaux, constructions de mobilier et réglages de
  lumière du pilote `src/dev/dormitoryAAA.ts` vers les composants communs de rendu.
- Intégrer le traitement de l'image à `ExploreSession`, avec redimensionnement,
  changement de carte et libération des ressources.
- Adapter le mobilier aux emprises des cartes réelles et préserver les cibles
  interactives, les passages et les habillages du bal et de la fuite.
- Composer les lumières, détails et matériaux selon chaque lieu : désert clair,
  centre d'examen froid, conduits, campement et variantes nocturnes.
- Conserver les regroupements par pièce et étape narrative. Les lots globaux du
  pilote ne peuvent pas masquer indépendamment les pièces encore inconnues.
- Cadrer les ombres et limiter les reflets aux surfaces pertinentes et visibles.
  Dupliquer un réflecteur par pièce multiplie les rendus de la carte.

L'intégration technique est de complexité moyenne. La production et la revue de
chaque décor représentent la majorité de l'effort.

## Estimation de planification

Ordres de grandeur en journées de développement concentré, à recalibrer après
l'intégration d'une première pièce réelle ; ce ne sont pas des durées garanties
d'exécution agentique.

| Lot | Effort estimé |
| --- | --- |
| Socle partagé et dortoir dans le jeu réel | 2–3 jours |
| Autres pièces de HOLT et variantes nocturnes | 4–6 jours |
| Centre d'examen, conduits et campement | 3–5 jours |
| Performance et revue des parcours | 1–2 jours |

Total : environ 10–16 journées pour une attention visuelle comparable au pilote,
sans personnages. Une première passe globale limitée aux matériaux, à la lumière
et au traitement de l'image pourrait prendre 2–4 jours, mais ne remplace pas la
recomposition et le détail du mobilier pièce par pièce.

Ces fourchettes supposent de garder les plans et la caméra orthographique du jeu.
Le pilote utilise une caméra perspective : retrouver exactement ses cadrages dans
le jeu serait un chantier supplémentaire de caméra, visibilité et saisie des clics,
à décider explicitement et à documenter dans un ADR.

## Critère de performance et prochain jalon proposé

La cible demandée est 30 ips, soit environ 33 ms par image. Les mesures du pilote
sur GTX 1070 ne garantissent pas les performances des cartes complètes ; il faut
mesurer la pièce la plus chargée et les vues larges sur le matériel cible.

Premier jalon proposé : migrer seulement le dortoir dans HOLT, vérifier la
découverte, les clics et la variante nocturne, puis mesurer à 1080p. Ce jalon valide
le socle et permet de préciser le coût du reste avant la généralisation.
