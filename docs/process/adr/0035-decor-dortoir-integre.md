# ADR 0035 — Réemploi du décor du dortoir dans l'exploration

- Date : 2026-09-30
- Statut : accepté, intégration autorisée par le propriétaire

La restriction aux reflets PMREM et à la seule passe principale est remplacée le
1er octobre par [l'ADR 0036](0036-rendu-dortoir-fidele-au-pilote.md), à la demande du
propriétaire après revue visuelle de cette première intégration.

## Contexte

L'étude autonome `dormitory-aaa.html` a atteint un décor jugé suffisant par le
propriétaire. Il demande son intégration dans le vrai dortoir HOLT, avec une cible
de 30 ips et sans les personnages qu'il développe séparément. Le pilote possède
une caméra perspective, cinq lits et des contrôles locaux ; HOLT possède une caméra
orthographique, huit emprises de lit et sa propre progression.

## Décision

Extraire le kit de mobilier et les matières du pilote dans le rendu d'exploration.
Les modèles dédiés `dormitory-bunk` et `dormitory-locker-bank` gardent les emprises
du catalogue existant et sont posés uniquement dans `dortoirs` sur HOLT. La variante
nocturne les hérite ; les modèles partagés avec les conduits ne changent pas.
La carte, ses ancres, entités et collisions, ainsi que la caméra restent les mêmes.

Le sol, les finitions murales et l'éclairage enrichi sont limités au profil du
dortoir HOLT/HOLT-nuit. Les détails de mur suivent la coupe existante. Les effets
et le mobilier suivent la découverte de leur pièce ; les groupes liés à une entité
restent séparés pour le picking. La découverte est indépendante pour les deux cartes.
Le casier nocturne est du décor inerte, sans réintroduire l'entité du chapitre 1.

Le kit possède ses géométries, sa bibliothèque de matières possède matériaux et
textures. La factory et la vue libèrent chacune leurs ressources une seule fois.
Le chargement d'atlas conserve un repli immédiat et ignore les callbacks après
destruction. Aucun nouveau RNG de gameplay n'est consommé.

Un environnement PMREM préfiltré donne des reflets doux au sol et aux métaux du
dortoir uniquement. La session possède sa cible et la réutilise entre les cartes ;
les matières empruntent sa texture. `scene.environment` n'est pas modifié. Les
réglettes utilisent deux spots sans carte d'ombre supplémentaire. Le rendu conserve
une seule passe principale ; bloom, poussière et reflet planaire restent dans l'étude.

La revue des transitions corrige aussi les ressources d'exploration préexistantes
sans propriétaire : géométries locales des props et marqueurs, cibles d'ombre et
textures GPU des squelettes privés aux rigs d'une vue. La vue libère ces dernières
à sa destruction sans changer modèles, poses ni animations, et sans libérer les
géométries des modèles partagés.

Mesurer le rendu direct avant d'introduire des passes d'image supplémentaires.
Si une passe est retenue, elle possède un cycle de vie explicite dans la session,
et les compteurs publics couvrent toutes les passes d'une image. Le DPR global du
renderer partagé et le contrat de `window.__game` restent inchangés.

## Conséquences

Huit superposés reprennent les positions des lits simples ; le cadrage exact du
pilote n'est pas transféré. La revue vérifie les quatre orientations et le parcours
réel, puis 1080p/DPR 1 et le DPR effectif sur la GTX 1070. Les personnages présents
comptent dans ces mesures, sans modification de leur code ni de leurs assets.

La scène autonome reste une référence séparée sous l'ADR 0034. La généralisation
aux autres pièces est hors de ce jalon. Le suivi et les critères de sortie vivent
dans [le plan d'intégration](../DORMITORY-AAA-INTEGRATION-PLAN.md).
