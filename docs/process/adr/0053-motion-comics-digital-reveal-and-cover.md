# 0053 — Révélation de deux images et couverture du lecteur

Date : 2026-11-08. Statut : accepté.

## Contexte

Le propriétaire demande une couverture musicale et une transition du paysage elfique
vers une vraie carte de Night City, avec la direction numérique de la page3. L'ancien
effet `digitalVision` conserve sa grille de coordonnées propre à cette première vision.
Une suite de douze rasters sur une seconde donnerait une désagrégation saccadée.

## Décision

Ajouter le mode de calque `digitalReveal` à `core.js`/`layers.js`. Il reçoit exactement
deux images via les chemins `frames` existants. `reveal.durationSeconds` borne une
transition continue terminée à l'instant de la seconde image ; `columns`/`rows`
définissent les fragments, `amplitudePx` leur déplacement local et `color` leur accent.
Avant la transition et après sa fin, les images initiale et finale sont dessinées
exactement. Les fragments et leur ordre sont calculables directement au temps narratif,
sans état accumulé ni aléatoire. Lettres composées en dernier, aucune transformation
corporelle, fond mobile ou secousse dans ce mode. Le mode OFF conserve le master statique.

Réemployer l'inventaire et le rebasing des images `frames` pour le lecteur, l'export
et les snapshots. Aucun changement des anciens effets ni du format des voix. La
révélation de la page16 utilise une carte subjective vectorielle distincte, sans
LAT/LON ni itinéraire, avec les quatre repères établis dans le scénario.

Une entrée de séquence d'ID `cover` désigne la couverture. Sa durée, son image et son
son suivent la même chronologie que les pages. Le lecteur affiche «Couverture» puis
numérote les seules pages du récit ; les index techniques continuent d'inclure toutes
les entrées. Aucun démarrage audio sans geste utilisateur.

## Conséquences

Extension rétrocompatible du moteur en1.2.0. Les anciennes sélections restent lisibles.
Les sources et exports historiques restent conservés avec leurs moteurs sauvegardés.
Tests des bornes, des contraintes, du seek et du rebasing ; revue des états intermédiaires
et de la vitesse réelle. L'ajout de12s d'ouverture décale les temps globaux, sans
modifier les durées des pages. La page17 recale séparément sa voix d'alerte et son
tir unique sur les nouvelles révélations de sous-bandes.
