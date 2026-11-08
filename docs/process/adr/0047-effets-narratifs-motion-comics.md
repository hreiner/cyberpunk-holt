# 0047 — Effets narratifs et mouvement par case

## Contexte

Après lecture des quatre pages Blue Purple, le propriétaire demande des animations
plus perceptibles dans chaque case : éclairs avant la vision, fragmentation numérique
et coordonnées de minimap pendant la vision, choc dessiné ensuite. Le contrôle global
des pixels de page ne garantissait pas un mouvement dans chacune des seize cases.
L'horloge d'ambiance avance en pause ; elle ne doit pas révéler la suite du récit.

## Décision

Ajouter `particles`, `lightSweep`, `sparks` et `digitalVision` aux effets locaux existants.
Ils restent déterministes, limités à des régions explicites, avec masques locaux et
restauration des zones protégées. Aucun service vidéo extérieur ni déformation globale.
Les tuiles de la vision proviennent du dessin lui-même. La minimap est un HUD subjectif
de simulation, à coordonnées partielles, sans nouvelle destination canonique.

Étendre `motionEffects.render` par un sixième argument `storyTime`, temps narratif
local de la page. Son défaut est le temps ambiant pour les anciens appels. Le lecteur
et l'export transmettent le temps local explicite : `startSeconds` et `revealSeconds`
pilotent les effets narratifs ; la phase ambiante continue en pause, la révélation
reste figée. Le bouton d'arrêt et la réduction des mouvements restent applicables.

Contrôler le mouvement dans le rectangle zoomé de chaque case, ainsi que déterminisme,
arrêt et stabilité des détails protégés. Une revue visuelle des plans décisifs reste
nécessaire : une variation numérique ne certifie pas un effet artistiquement visible.

## Conséquences

Le format de page reste compatible avec les anciens manifestes ; seuls les nouveaux
types et champs sont validés en plus. Le rendu au temps explicite reste commun au
lecteur et au MP4. La durée des cases et les déclenchements sont recalés sur les nouvelles
voix mesurées. Les dessins modifiés, prises et exports antérieurs restent conservés.
