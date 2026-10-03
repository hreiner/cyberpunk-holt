---
name: holt-exploration-zone
description: Create or extend an exploration room or map in cyberpunk-holt using the shipped AAA decor kits, architecture, material and lighting profiles. Use for new zones and decor integration; character modeling and tactical rendering have separate pipelines.
---

# Construire un décor d'exploration HOLT

Ce skill s'applique au dépôt `cyberpunk-holt`. Il aide à conserver le niveau du
dortoir validé dans une scène jouable, avec une cible acceptée de 30 ips sur GTX 1070.
Le périmètre dépend de la demande : une pièce, une carte ou une reprise de décor.

## Trouver les sources

Depuis ce dossier installé, la racine du dépôt est `../../..`. Lire `AGENTS.md` et
[`docs/INDEX.md`](../../../docs/INDEX.md), puis le design d'exploration concerné.
Le manuel technique est
[`EXPLORATION-GRAPHICS-GUIDE.md`](../../../docs/art/EXPLORATION-GRAPHICS-GUIDE.md) :
consulter « Les couches et les fichiers à modifier » et le précédent correspondant
au lieu demandé. Lire les sections détaillées seulement lorsque ce travail les touche.
Les références durables sont dans `docs/`, pas dans un ancien chat.

## Réaliser la zone

- Définir l'usage du lieu, l'ancre visuelle/narrative, l'apparition, le chemin vers
  l'interaction principale et le prochain seuil. Réemployer le kit du lieu le plus
  proche ; régler volumes, lumière et matières avant les accessoires.
- Séparer la carte de gameplay (`MapDef`) et le décor (`ExploreVisualMapDef`). Les
  emprises et `replaces` correspondent aux cases réelles ; `entityId` lie
  l'apparence à l'interaction existante. Les données équilibrables restent en données.
- Pour une pièce, ajouter enveloppe et finitions aux collections actives. Pour une
  carte nouvelle, suivre toutes les inscriptions du tableau du guide, notamment
  `art.visuals` : le registre de cartes ne charge pas le mobilier.
  Ne pas activer `dormitoryArchitecture` hors de la géométrie réelle de HOLT.
- Construire toutes les faces par le layout commun. Murs extérieurs/sur cour à
  4,9 m et cloisons à 2,45 m, avec les exceptions de lieu documentées. Les murs restent
  fixes et visibles ; aucune coupe/disparition selon caméra ou découverte.
  Vérifier les limitations des doubles rangées et des nouvelles cours dans le guide.
- Faire de vraies fenêtres sur des murs possédés et des portes liées à l'état de
  jeu. Garder les passages libres de plafonds/accessoires suspendus. Une pièce inconnue
  conserve sa coque, mais cache mobilier, finitions et entités jusqu'à l'entrée.
- Réemployer matériaux, environnement, composer, réflecteur partagé et lumières
  stables. Construire les sources avant la préparation de la carte ; conserver
  précompilation et propriété/destruction des ressources. Quarts de tour et picking
  suivent la même `renderCamera`, sans suivi permanent du personnage.

L'exemple d'atelier du guide est un bloc de données à adapter et enregistrer, pas
un générateur complet. Un nouveau mécanisme moteur demande le design/test/ADR
approprié ; un simple profil n'exige pas une refonte. Générer une image ou un asset
seulement si la zone en bénéficie. Le pipeline des personnages reste distinct sauf
demande explicite portant aussi sur eux.

## Livrer avec une preuve utile

Vérifier d'abord plan, emprises et logique sans captures. Revoir ensuite les vues
décisives : raccords, façades sur cour, portes, fenêtres et repères d'interaction,
avant/après découverte et sous les quatre orientations. Une manche ciblée suffit
si elle répond aux incertitudes visuelles du lot.

Pour les budgets/freezes, suivre « Caméra, visibilité et coût de rendu » et
« Vérifier une livraison » du guide ; `exploreRenderStats()` n'est pas un chronomètre.
Préserver les travaux indépendants présents dans le dépôt. Consigner résultats
et limites dans `docs/`, lier le document depuis l'index et appliquer les checks
du dépôt avant commit. Ce skill n'ajoute aucune autorisation de publication.
