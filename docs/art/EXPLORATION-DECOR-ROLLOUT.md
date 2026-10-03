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

Après validation du dortoir le 1er octobre, le propriétaire demande de planifier
le même niveau dans toute l'école, pièce par pièce, avec tous les murs intérieurs
et les portes. Le [plan HOLT détaillé](../process/HOLT-AAA-ROLLOUT-PLAN.md) décrit
cette prochaine étape, limitée à HOLT/HOLT-nuit. Les estimations ci-dessous
restent celles de l'évaluation initiale des quatre lieux.

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

| Lot                                          | Effort estimé |
| -------------------------------------------- | ------------- |
| Socle partagé et dortoir dans le jeu réel    | 2–3 jours     |
| Autres pièces de HOLT et variantes nocturnes | 4–6 jours     |
| Centre d'examen, conduits et campement       | 3–5 jours     |
| Performance et revue des parcours            | 1–2 jours     |

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

## Retour de l'intégration du dortoir

Le 1er octobre, le propriétaire a jugé cette première intégration trop éloignée du
pilote sur les murs, la lumière et les reflets. Une reprise complète du rendu du
dortoir est autorisée par [l'ADR 0036](../process/adr/0036-rendu-dortoir-fidele-au-pilote.md).
Le retour ci-dessous décrit le jalon initial ; sa seule marge de performance ne
valide pas la qualité visuelle demandée.
La reprise, comprenant coque, perspective et reflet planaire, est décrite dans
[la revue du 1er octobre](DORMITORY-AAA-FIDELITY-REVIEW.md). Elle n'active pas encore
ce profil dans toutes les salles.

Le jalon dortoir est réalisé le 30 septembre 2026 avec deux agents GPT-6 Luna
pilotés par l'orchestrateur : [revue et mesures](DORMITORY-AAA-INTEGRATION-REVIEW.md),
[ADR 0035](../process/adr/0035-decor-dortoir-integre.md). Les matières, mobilier et
reflets doux sont maintenant extraits du pilote. Le rendu conserve la passe
principale, ses ombres et deux spots sans ombre supplémentaire ; aucun nouveau
fichier de texture n'est ajouté à la livraison du jeu.

L'effort principal a porté sur l'adaptation à huit emprises, le choix de façade
réelle, la coupe et la découverte, puis la qualité des matières. Une vérification
des transitions a aussi demandé de fermer des fuites de ressources préexistantes.
Le kit permet de réemployer les matières et modèles compatibles ; la composition
et les ambiances des autres pièces restent à produire. Il n'existe donc pas encore
un profil de rendu universel à activer pour chaque salle.

Le lot initial est désormais livré. La fourchette
du travail restant devient **8–13 journées de développement concentré** pour les
autres salles, cartes et leur revue. La séance agentique ne fournit pas une vitesse
fiable à extrapoler sur des décors de familles différentes. Aucun déploiement
global n'est autorisé par la livraison du dortoir.

## Extension HOLT livrée le 2 octobre 2026

Après une autorisation distincte, les onze pièces et trois circulations de HOLT
et HOLT-nuit ont été reprises pièce par pièce avec des agents GPT-6 Luna.
Les estimations et limites d'autorisation précédentes décrivent le jalon dortoir
initial. Le résultat actuel, les cloisons communes à demi-hauteur, les raccords
et la caméra plus plongeante sont dans la
[revue finale de l'école](HOLT-AAA-ROLLOUT-REVIEW.md), avec le
[journal H0–H15](../process/HOLT-AAA-ROLLOUT-PLAN.md).
Le centre d'examen, les conduits et le campement gardent un déploiement séparé ;
les mesures de HOLT ne prédisent pas leur coût.

## Extension des autres lieux autorisée le 2 octobre

Le propriétaire demande maintenant tous les décors d'exploration, hangar compris.
Le [plan E0–E13](../process/EXPLORATION-AAA-ROLLOUT-PLAN.md) traite six zones du centre,
dix zones des souterrains et le campement, puis renforce le garage HOLT.
L'[ADR 0038](../process/adr/0038-profils-decor-toutes-explorations.md) décrit le socle partagé.
Le contenu des chapitres et les personnages restent inchangés. Cette autorisation
remplace la limite historique au seul dortoir et à l'école pour ce travail.

## Extension des autres lieux réalisée

Les 17 zones restantes et le hangar utilisent maintenant le socle commun. Les
[captures et mesures finales](EXPLORATION-AAA-ROLLOUT-REVIEW.md) documentent
les ambiances propres à chaque carte, les raccords, les emprises tactiques et
la vérification réelle des transitions. Les estimations précédentes sont historiques.
