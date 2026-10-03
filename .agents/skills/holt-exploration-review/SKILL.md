---
name: holt-exploration-review
description: Review and fix cyberpunk-holt exploration decor quality or room-entry performance using current wall, discovery, camera, lighting and resource invariants. Use for a requested visual pass, graphical regression, freeze or GPU resource issue.
---

# Revoir le rendu d'exploration HOLT

Ce skill examine les pièces effectivement jouables de `cyberpunk-holt`. Adapter
le périmètre au problème demandé ; une correction locale ne nécessite pas une
revue de toutes les cartes ni une nouvelle génération d'images.

## Cadrer la revue

La racine du dépôt est `../../..` depuis ce dossier installé. Lire `AGENTS.md`,
[`docs/INDEX.md`](../../../docs/INDEX.md), le design concerné, puis les sections
« Défauts fréquents », « Vérifier une livraison » et la couche pertinente de
[`EXPLORATION-GRAPHICS-GUIDE.md`](../../../docs/art/EXPLORATION-GRAPHICS-GUIDE.md).
Les captures du guide montrent les familles de lieux livrées. Les anciens murs
en coupe sont remplacés par les ADR 0039/0040.

Identifier carte, scène/étape, graine, pièce et découverte. Pour une mesure,
relever aussi navigateur, GPU réel, viewport et DPR. Lire la
[revue de performance](../../../docs/art/EXPLORATION-ROOM-PERFORMANCE-REVIEW.md)
seulement si les durées ou ressources sont en cause.

## Examiner ce que le défaut met en jeu

| Revue            | Vérifications utiles                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture     | Raccords sans jour, une séparation physique, cour/façade haute, cloison plus basse, quatre côtés et portes cohérentes                           |
| Découverte       | Coque visible dès le début ; contenus, finitions et entités cachés avant entrée ; aucune fuite par fenêtres, labels, hover, clic ou clavier     |
| Composition      | Allée/objectif lisibles, cadrage plongeant, fenêtres proportionnées, aucun plafond qui couvre le passage                                        |
| Interaction      | Anneau au-dessus du sol fini, clic sur sa cible, même caméra pour rendu/projection/raycast ; label HTML au survol/clic                          |
| Matières/lumière | Béton/tissu/acier distincts, reflets limités à la surface active, éclairage jour/nuit crédible et comparable au précédent du lieu               |
| Entrée en salle  | Premières visites distinctes des retours, nombre de sources/ombres stable, variantes de matériaux préparées sur le target du rendu              |
| Cycle de vie     | Ressources GPU stabilisées après échauffement, destruction des instances/targets/textures possédés, adaptateur de lumières détruit avant la vue |

La découverte ne coupe, n'abaisse et ne masque aucun mur. Corriger une occultation
par le plan/cadrage/ouverture, sans réintroduire les coupes. Ne pas masquer
un défaut de découverte en affichant toute la pièce dès le début.

## Produire une preuve puis corriger

Lire les données et l'état par `window.__game` pour portes, objectifs et entités ;
ne pas capturer pour vérifier une logique. Faire une série de vues décisives pour
ce que l'œil seul juge, avec cadrage comparable avant/après. Tester rotations et
resize lorsque caméra/picking sont concernés. Préserver personnages et changements
indépendants, sauf s'ils sont explicitement dans le périmètre.

Pour un freeze, utiliser les intervalles `requestAnimationFrame` et une trace
Performance/CPU, sans captures simultanées. `exploreRenderStats()` expose des compteurs,
pas le temps d'entrée ni le nombre de programmes. Distinguer compilation de shaders,
chargement d'assets, rendu et logique avant d'optimiser. La cible continue de 30 ips
et un pic de première visite sont deux critères différents ; le cache GPU du pilote
peut survivre au redémarrage du navigateur.

Corriger la couche responsable, puis refaire les vérifications pertinentes. Pour
de nouvelles ressources, revisiter les cartes avec le même renderer et rechercher
une croissance après échauffement, sans imposer les comptes historiques comme budget.
Conserver une courte revue dans `docs/` avec reproduction, constat, modification,
preuve, mesures et limites ; mettre à jour l'index et suivre les checks du dépôt.
Une capture ou un compteur seul ne démontre pas l'absence de freeze.
